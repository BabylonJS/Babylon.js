import { Animation } from "core/Animations/animation";
import { AnimationEvent } from "core/Animations/animationEvent";
import { AnimationGroup } from "core/Animations/animationGroup";
import { RootMotionClip, RootMotionController, RootMotionSource, type IRootMotionClipOptions } from "core/Animations/rootMotion";
import { type RuntimeAnimation } from "core/Animations/runtimeAnimation";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const Fps = 60;
const CycleFrames = 60;
const Speed = 1.2;
const HipHeight = 1;
const SwayAmplitude = 0.03;
/** Frames of animation per 16ms tick at 60 frames per second. */
const FramesPerTick = 0.96;

type Gait = "rootMotion" | "inPlace" | "idle";

interface ISkeleton {
    character: TransformNode;
    armature: TransformNode;
    hips: TransformNode;
    leftFoot: TransformNode;
    rightFoot: TransformNode;
}

interface IRig extends ISkeleton {
    group: AnimationGroup;
    hipsAnimation: Animation;
    hipsRotationAnimation: Animation | null;
}

interface IRigOptions {
    /** How far the hips lurch forwards and back twice a cycle, without travelling. */
    surge?: number;
    /** How far the hips turn over a cycle, in radians; a travelling rig walks an arc. */
    turn?: number;
    /** How far the hips twist either way during a cycle, in radians, ending where they began. */
    twist?: number;
    /** How far the whole clip veers off +Z, in radians: the path, the hips and the feet. */
    veer?: number;
    /** A constant turn of the hips, in radians, under the turn and twist. */
    baseYaw?: number;
    /** Animate the hips' rotation as Euler angles rather than a quaternion. */
    euler?: boolean;
    /** A multiplier on the speed of travel, for a second gait on the same skeleton. */
    speed?: number;
    /** How far the hips sit off the character's axis along +X; the feet stay where they are. */
    offset?: number;
    /** The name of the group. */
    name?: string;
}

/**
 * Where a foot is in character space at a time of the walk cycle, for a character travelling along +Z.
 * Each foot is planted for half the cycle and swings, raised, for the other half.
 * @param time defines the time in seconds
 * @param side defines 1 for the left foot, -1 for the right foot
 * @param speed defines the speed of travel
 * @returns the foot position in character space
 */
function FootInWalk(time: number, side: number, speed: number): Vector3 {
    const half = CycleFrames / Fps / 2;
    const phase = (side === 1 ? time : time + half) % (half * 2);
    const plantedAt = side === 1 ? 0.3 : -0.3 + speed * half;
    const cycleStart = Math.floor((side === 1 ? time : time + half) / (half * 2)) * speed * half * 2 - (side === 1 ? 0 : speed * half);
    if (phase <= half) {
        return new Vector3(0.1 * side, 0, cycleStart + plantedAt);
    }
    const swing = (phase - half) / half;
    return new Vector3(0.1 * side, 0.15 * Math.sin(Math.PI * swing), cycleStart + plantedAt + speed * half * 2 * swing);
}

/**
 * Builds a character with a scaled, rotated armature - the shape of an FBX-converted glTF - with hips, feet and a head.
 * @param scene defines the scene
 * @returns the skeleton
 */
function BuildSkeleton(scene: Scene): ISkeleton {
    const character = new TransformNode("character", scene);
    const armature = new TransformNode("armature", scene);
    armature.parent = character;
    armature.scaling.setAll(0.5);
    armature.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);
    const hips = new TransformNode("hips", scene);
    hips.parent = armature;
    const leftFoot = new TransformNode("leftFoot", scene);
    leftFoot.parent = hips;
    const rightFoot = new TransformNode("rightFoot", scene);
    rightFoot.parent = hips;
    const head = new TransformNode("head", scene);
    head.parent = hips;
    head.position.set(0, 1.4, 0);
    return { character, armature, hips, leftFoot, rightFoot };
}

/**
 * Adds a gait to a skeleton: an animation group whose hips and feet walk, slide under still hips, or stand.
 * @param skeleton defines the skeleton
 * @param gait defines whether the hips carry the travel, the feet slide under still hips, or nothing travels
 * @param options defines extra hips motion
 * @returns the rig
 */
function AddGait(skeleton: ISkeleton, gait: Gait, options: IRigOptions = {}): IRig {
    const { surge = 0, turn = 0, twist = 0, veer = 0, baseYaw = 0, euler = false, speed: speedRatio = 1, offset = 0, name = gait } = options;
    const speed = Speed * speedRatio;
    const { character, armature, hips, leftFoot, rightFoot } = skeleton;
    const scene = character.getScene();
    const veering = Matrix.RotationY(veer);

    const toArmature = armature.computeWorldMatrix(true).clone().invert();
    const hipsKeys = [];
    const hipsRotationKeys: { frame: number; value: Vector3 | Quaternion }[] = [];
    const leftKeys = [];
    const rightKeys = [];
    for (let frame = 0; frame <= CycleFrames; frame++) {
        const time = frame / Fps;
        const heading = (turn * frame) / CycleFrames;
        const cycleSeconds = CycleFrames / Fps;
        // Straight along +Z, or an arc turning with the hips.
        let pathX = 0;
        let pathZ = gait === "rootMotion" ? speed * time : 0;
        if (gait === "rootMotion" && turn !== 0) {
            const radius = (speed * cycleSeconds) / turn;
            pathX = radius * (1 - Math.cos(heading));
            pathZ = radius * Math.sin(heading);
        }
        const hipsInCharacter = new Vector3(
            pathX + offset + SwayAmplitude * Math.sin((2 * Math.PI * frame) / CycleFrames),
            HipHeight,
            pathZ + surge * Math.sin((4 * Math.PI * frame) / CycleFrames)
        );
        const hipsYaw = baseYaw + heading + twist * Math.sin((2 * Math.PI * frame) / CycleFrames);
        hipsRotationKeys.push({ frame, value: euler ? new Vector3(0, hipsYaw, 0) : Quaternion.RotationAxis(Vector3.Up(), hipsYaw) });
        let left = new Vector3(0.1, 0, 0);
        let right = new Vector3(-0.1, 0, 0);
        if (gait !== "idle") {
            const shift = gait === "rootMotion" ? 0 : speed * time;
            left = FootInWalk(time, 1, speed).subtractInPlace(new Vector3(0, 0, shift));
            right = FootInWalk(time, -1, speed).subtractInPlace(new Vector3(0, 0, shift));
        }
        Vector3.TransformCoordinatesToRef(hipsInCharacter, veering, hipsInCharacter);
        Vector3.TransformCoordinatesToRef(left, veering, left);
        Vector3.TransformCoordinatesToRef(right, veering, right);
        // Feet are children of the unrotated hips, so their local offset is the character space offset, unscaled.
        hipsKeys.push({ frame, value: Vector3.TransformCoordinates(hipsInCharacter, toArmature) });
        leftKeys.push({ frame, value: Vector3.TransformNormal(left.subtract(hipsInCharacter), toArmature) });
        rightKeys.push({ frame, value: Vector3.TransformNormal(right.subtract(hipsInCharacter), toArmature) });
    }

    const makeAnimation = (animationName: string, keys: { frame: number; value: Vector3 }[]) => {
        const animation = new Animation(animationName, "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        animation.setKeys(keys);
        return animation;
    };
    const group = new AnimationGroup(name, scene);
    const hipsAnimation = makeAnimation("hips", hipsKeys);
    group.addTargetedAnimation(hipsAnimation, hips);
    let hipsRotationAnimation: Animation | null = null;
    if (turn !== 0 || twist !== 0 || baseYaw !== 0) {
        hipsRotationAnimation = euler
            ? new Animation("hipsRotation", "rotation", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE)
            : new Animation("hipsRotation", "rotationQuaternion", Fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
        hipsRotationAnimation.setKeys(hipsRotationKeys);
        group.addTargetedAnimation(hipsRotationAnimation, hips);
    }
    group.addTargetedAnimation(makeAnimation("left", leftKeys), leftFoot);
    group.addTargetedAnimation(makeAnimation("right", rightKeys), rightFoot);
    group.normalize(0, CycleFrames);

    return { ...skeleton, group, hipsAnimation, hipsRotationAnimation };
}

/**
 * Builds a skeleton with one gait.
 * @param scene defines the scene
 * @param gait defines the gait
 * @param options defines extra hips motion
 * @returns the rig
 */
function BuildRig(scene: Scene, gait: Gait, options: IRigOptions = {}): IRig {
    return AddGait(BuildSkeleton(scene), gait, options);
}

/**
 * Extracts the root motion of a rig's group and controls the rig's character with it.
 * @param rig defines the rig
 * @param options defines the clip options
 * @returns the clip, its controller and the in-place group to play
 */
function Extract(rig: IRig, options?: IRootMotionClipOptions): { clip: RootMotionClip; controller: RootMotionController; group: AnimationGroup } {
    const clip = new RootMotionClip(rig.group, options);
    const controller = new RootMotionController(rig.character, [clip]);
    return { clip, controller, group: clip.animationGroup };
}

/**
 * The animation of a group that animates a property of a node.
 * @param group defines the group
 * @param target defines the node
 * @param property defines the property
 * @returns the animation
 */
function ChannelOf(group: AnimationGroup, target: TransformNode, property: string): Animation {
    return group.targetedAnimations.find((targetedAnimation) => targetedAnimation.target === target && targetedAnimation.animation.targetProperty === property)!.animation;
}

/**
 * The hips position in character space at a frame, straight from a position animation's keys.
 * @param rig defines the rig
 * @param frame defines the frame
 * @param animation defines the hips position animation, the source's by default
 * @returns the position in character space
 */
function HipsInCharacter(rig: IRig, frame: number, animation: Animation = rig.hipsAnimation): Vector3 {
    const toCharacter = rig.armature
        .computeWorldMatrix(true)
        .clone()
        .multiply(Matrix.Invert(rig.character.computeWorldMatrix(true)));
    return Vector3.TransformCoordinates(animation.evaluate(frame), toCharacter);
}

/**
 * The hips transform in character space at a frame of the original clip, from a rig nothing was extracted from.
 * @param rig defines the untouched rig
 * @param frame defines the frame
 * @returns the transform
 */
function OriginalHipsInCharacter(rig: IRig, frame: number): Matrix {
    const evaluated = rig.hipsRotationAnimation ? rig.hipsRotationAnimation.evaluate(frame) : Quaternion.Identity();
    const rotation = evaluated instanceof Vector3 ? Quaternion.FromEulerVector(evaluated) : evaluated;
    const local = Matrix.Compose(Vector3.One(), rotation, rig.hipsAnimation.evaluate(frame));
    return local.multiply(Matrix.Compose(rig.armature.scaling, rig.armature.rotationQuaternion!, rig.armature.position));
}

/**
 * Where a node of the original clip would be in the world after playing through whole cycles and then to a frame:
 * each cycle carries on from where the previous one ended.
 * @param localAt defines the node's transform in character space at a frame of the original clip
 * @param frame defines the frame within the current cycle
 * @param cycles defines how many whole cycles came before
 * @param character defines the character's starting world transform
 * @returns the transform
 */
function ExpectedWorld(localAt: (frame: number) => Matrix, frame: number, cycles: number, character: Matrix): Matrix {
    const cycle = Matrix.Invert(localAt(0)).multiply(localAt(CycleFrames));
    let result = localAt(frame);
    for (let i = 0; i < cycles; i++) {
        result = result.multiply(cycle);
    }
    return result.multiply(character);
}

/**
 * Where the hips of the original clip would be in the world after whole cycles and then a frame.
 * @param rig defines the untouched rig
 * @param frame defines the frame within the current cycle
 * @param cycles defines how many whole cycles came before
 * @param character defines the character's starting world transform
 * @returns the transform
 */
function ExpectedHipsWorld(rig: IRig, frame: number, cycles: number, character: Matrix): Matrix {
    return ExpectedWorld((at) => OriginalHipsInCharacter(rig, at), frame, cycles, character);
}

/**
 * A node's world matrix with every ancestor recomputed first: between renders, a parent's cached world matrix is not
 * refreshed when only the child is asked to compute.
 * @param node defines the node
 * @returns the world matrix
 */
function FreshWorldMatrix(node: TransformNode): Matrix {
    const chain: TransformNode[] = [];
    for (let current: TransformNode | null = node; current; current = current.parent as TransformNode | null) {
        chain.unshift(current);
    }
    chain.forEach((link) => link.computeWorldMatrix(true));
    return node.getWorldMatrix();
}

/**
 * Asserts two transforms place a node at the same position facing the same way.
 * @param actual defines the actual transform
 * @param expected defines the expected transform
 * @param tolerance defines the allowed distance, in world units
 */
function ExpectSamePose(actual: Matrix, expected: Matrix, tolerance: number): void {
    expect(Vector3.Distance(actual.getTranslation(), expected.getTranslation())).toBeLessThan(tolerance);
    const forward = (matrix: Matrix) => Vector3.TransformNormal(Vector3.Forward(), matrix).normalize();
    const right = (matrix: Matrix) => Vector3.TransformNormal(Vector3.Right(), matrix).normalize();
    expect(Vector3.Distance(forward(actual), forward(expected))).toBeLessThan(tolerance);
    expect(Vector3.Distance(right(actual), right(expected))).toBeLessThan(tolerance);
}

/**
 * Advances the scene's animations by a number of 16ms ticks.
 * @param scene defines the scene
 * @param ticks defines how many ticks to run
 */
function Run(scene: Scene, ticks: number): void {
    for (let i = 0; i < ticks; i++) {
        scene.animate();
    }
}

/**
 * How far a walk travels in a number of ticks; the first tick after starting only establishes where playback began.
 * @param ticks defines the ticks run since the group started
 * @param speedRatio defines the speed ratio
 * @returns the distance
 */
function Walked(ticks: number, speedRatio = 1): number {
    return Speed * speedRatio * (ticks - 1) * 0.016;
}

/**
 * Sets a loop mode on every animation of a group.
 * @param group defines the group
 * @param loopMode defines the loop mode
 */
function SetLoopMode(group: AnimationGroup, loopMode: number): void {
    for (const targetedAnimation of group.targetedAnimations) {
        targetedAnimation.animation.loopMode = loopMode;
    }
}

describe("RootMotion", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
        scene.useConstantAnimationDeltaTime = true;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("root translation", () => {
        it("uses the root's own travel as the ground truth", () => {
            const rig = BuildRig(scene, "rootMotion");
            const clip = new RootMotionClip(rig.group);

            expect(clip.source).toBe(RootMotionSource.Root);
            expect(clip.rootNode).toBe(rig.hips);
            expect(clip.characterNode).toBe(rig.character);
            expect(clip.cycleDistance).toBeCloseTo(Speed, 3);
            expect(clip.averageSpeed).toBeCloseTo(Speed, 3);
            expect(clip.travelDirection.z).toBeCloseTo(1, 3);
            expect(clip.fromFrame).toBe(0);
            expect(clip.toFrame).toBe(CycleFrames);
        });

        it("leaves the travel out of the in-place group's root keys but keeps the sway, and the source's keys as they were", () => {
            const rig = BuildRig(scene, "rootMotion");
            const start = HipsInCharacter(rig, 0);
            const clip = new RootMotionClip(rig.group);

            const inPlace = ChannelOf(clip.animationGroup, rig.hips, "position");
            expect(inPlace).not.toBe(rig.hipsAnimation);
            const end = HipsInCharacter(rig, CycleFrames, inPlace);
            expect(end.z).toBeCloseTo(start.z, 4);
            expect(end.y).toBeCloseTo(start.y, 4);
            const quarter = HipsInCharacter(rig, CycleFrames / 4, inPlace);
            expect(quarter.x).toBeCloseTo(SwayAmplitude, 4);
            expect(quarter.z).toBeCloseTo(start.z, 4);
            expect(HipsInCharacter(rig, CycleFrames).z).toBeCloseTo(start.z + Speed, 4);
        });

        it("removes lateral motion too when asked", () => {
            const rig = BuildRig(scene, "rootMotion");
            const start = HipsInCharacter(rig, 0);
            const clip = new RootMotionClip(rig.group, { extractLateralMotion: true });

            expect(HipsInCharacter(rig, CycleFrames / 4, ChannelOf(clip.animationGroup, rig.hips, "position")).x).toBeCloseTo(start.x, 4);
        });

        it("strips cubic spline tangents", () => {
            const rig = BuildRig(scene, "rootMotion");
            const keys = rig.hipsAnimation.getKeys();
            const toArmature = rig.armature.computeWorldMatrix(true).clone().invert();
            const velocity = Vector3.TransformNormal(new Vector3(0, 0, Speed / Fps), toArmature);
            for (const key of keys) {
                key.inTangent = velocity.clone();
                key.outTangent = velocity.clone();
            }
            const clip = new RootMotionClip(rig.group);

            const toCharacter = rig.armature.computeWorldMatrix(true);
            for (const key of ChannelOf(clip.animationGroup, rig.hips, "position").getKeys()) {
                expect(Vector3.TransformNormal(key.outTangent, toCharacter).length()).toBeCloseTo(0, 6);
            }
            for (const key of keys) {
                expect(key.outTangent).toEqual(velocity);
            }
        });

        it("keeps the source group playable, with its travel", () => {
            const rig = BuildRig(scene, "rootMotion");
            new RootMotionClip(rig.group);
            rig.group.start(true);
            Run(scene, 40);

            expect(rig.character.position.z).toBe(0);
            expect(FreshWorldMatrix(rig.hips).getTranslation().z).toBeGreaterThan(0.5);
        });
    });

    describe("ownership", () => {
        it("gives each clip of a source its own in-place group", () => {
            const rig = BuildRig(scene, "rootMotion");
            const start = HipsInCharacter(rig, 0);
            const first = new RootMotionClip(rig.group);
            const second = new RootMotionClip(rig.group);
            first.dispose();

            expect(second.animationGroup).not.toBe(first.animationGroup);
            expect(HipsInCharacter(rig, CycleFrames, ChannelOf(second.animationGroup, rig.hips, "position")).z).toBeCloseTo(start.z, 4);
            expect(HipsInCharacter(rig, CycleFrames).z).toBeCloseTo(start.z + Speed, 4);
        });

        it("adds the in-place group to the scene and removes it on dispose", () => {
            const rig = BuildRig(scene, "rootMotion");
            const clip = new RootMotionClip(rig.group);

            expect(scene.animationGroups).toContain(clip.animationGroup);
            expect(clip.animationGroup.name).toBe("rootMotion (in place)");
            clip.dispose();
            expect(scene.animationGroups).not.toContain(clip.animationGroup);
            expect(scene.animationGroups).toContain(rig.group);
        });

        it("shares the animations it does not rewrite unless asked to clone them", () => {
            const rig = BuildRig(scene, "rootMotion");
            const shared = new RootMotionClip(rig.group);
            const cloned = new RootMotionClip(rig.group, { cloneAnimations: true });

            expect(ChannelOf(shared.animationGroup, rig.leftFoot, "position")).toBe(ChannelOf(rig.group, rig.leftFoot, "position"));
            expect(ChannelOf(cloned.animationGroup, rig.leftFoot, "position")).not.toBe(ChannelOf(rig.group, rig.leftFoot, "position"));
        });

        it("keeps the events of a rewritten root channel", () => {
            const rig = BuildRig(scene, "rootMotion");
            let fired = 0;
            rig.hipsAnimation.addEvent(new AnimationEvent(30, () => fired++));
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 40);

            expect(fired).toBe(1);
        });

        it("rewrites the root's own entry when its animation also drives another node", () => {
            const rig = BuildRig(scene, "rootMotion");
            const prop = new TransformNode("prop", scene);
            prop.parent = rig.armature;
            // The hips' animation drives the prop too, and the prop is listed first.
            const group = new AnimationGroup("shared", scene);
            group.addTargetedAnimation(rig.hipsAnimation, prop);
            for (const targetedAnimation of rig.group.targetedAnimations) {
                group.addTargetedAnimation(targetedAnimation.animation, targetedAnimation.target);
            }
            group.normalize(0, CycleFrames);
            const clip = new RootMotionClip(group);
            new RootMotionController(rig.character, [clip]);

            expect(clip.rootNode).toBe(rig.hips);
            const inPlaceHips = ChannelOf(clip.animationGroup, rig.hips, "position");
            expect(inPlaceHips).not.toBe(rig.hipsAnimation);
            expect(ChannelOf(clip.animationGroup, prop, "position")).toBe(rig.hipsAnimation);
            expect(HipsInCharacter(rig, CycleFrames, inPlaceHips).z).toBeCloseTo(HipsInCharacter(rig, 0, inPlaceHips).z, 4);

            clip.animationGroup.start(true);
            Run(scene, 63);
            expect(rig.character.position.z).toBeCloseTo(Walked(63), 6);
        });

        it("disposes cleanly after the source and its nodes are gone", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { clip, controller, group } = Extract(rig);
            group.start(true);
            Run(scene, 10);
            rig.group.dispose();
            rig.character.dispose();

            expect(() => clip.dispose()).not.toThrow();
            expect(() => controller.dispose()).not.toThrow();
            expect(scene.animationGroups).not.toContain(group);
        });

        it("rejects an additive source", () => {
            const rig = BuildRig(scene, "rootMotion");
            AnimationGroup.MakeAnimationAdditive(rig.group, { referenceFrame: 0 });

            expect(() => new RootMotionClip(rig.group)).toThrow(/additive/);
        });
    });

    describe("foot contact fallback", () => {
        it("deduces the travel of an in-place clip from its feet", () => {
            const rig = BuildRig(scene, "inPlace");
            const clip = new RootMotionClip(rig.group);

            expect(clip.source).toBe(RootMotionSource.FootContact);
            expect(clip.contactNodes).toContain(rig.leftFoot);
            expect(clip.contactNodes).toContain(rig.rightFoot);
            expect(clip.cycleDistance).toBeCloseTo(Speed, 2);
            expect(clip.travelDirection.z).toBeCloseTo(1, 3);
        });

        it("does not mistake a large root surge for travel", () => {
            // A lurching walk: the hips surge further than the travel threshold but end the cycle where they began.
            const rig = BuildRig(scene, "inPlace", { surge: 0.3 });
            const clip = new RootMotionClip(rig.group);

            expect(clip.source).toBe(RootMotionSource.FootContact);
        });

        it("shares an in-place clip's animations as they are", () => {
            const rig = BuildRig(scene, "inPlace");
            const clip = new RootMotionClip(rig.group);

            expect(ChannelOf(clip.animationGroup, rig.hips, "position")).toBe(rig.hipsAnimation);
        });

        it("can be forced", () => {
            const rig = BuildRig(scene, "inPlace");
            const clip = new RootMotionClip(rig.group, { source: RootMotionSource.FootContact, contactNodes: [rig.leftFoot, rig.rightFoot] });

            expect(clip.source).toBe(RootMotionSource.FootContact);
        });

        it("takes a node the group does not animate, passed as the root, as the base of the contacts", () => {
            const rig = BuildRig(scene, "inPlace");
            for (const source of [undefined, RootMotionSource.FootContact]) {
                const clip = new RootMotionClip(rig.group, { rootNode: rig.armature, source });

                expect(clip.source).toBe(RootMotionSource.FootContact);
                expect(clip.rootNode).toBe(rig.armature);
                expect(clip.characterNode).toBe(rig.character);
                expect(clip.contactNodes).toContain(rig.leftFoot);
                expect(clip.contactNodes).toContain(rig.rightFoot);
                expect(clip.cycleDistance).toBeCloseTo(Speed, 2);
                clip.dispose();
            }

            const { group } = Extract(rig, { rootNode: rig.armature });
            group.start(true);
            Run(scene, 63);
            expect(rig.character.position.z).toBeCloseTo(Walked(63), 1);
            expect(rig.character.position.x).toBeCloseTo(0, 3);
        });

        it("runs a root the group does not animate on a descendant channel that spans the clip, not on a single key", () => {
            const rig = BuildRig(scene, "inPlace", { twist: 0.1 });
            const head = rig.hips.getChildren().find((node) => node.name === "head") as TransformNode;
            const headAnimation = new Animation("head", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            headAnimation.setKeys([{ frame: 0, value: head.position.clone() }]);
            // The hips' rotation over the clip, a head position of a single key, then the feet - not normalized, so the
            // head's channel keeps its single key.
            const group = new AnimationGroup("sparse", scene);
            group.addTargetedAnimation(rig.hipsRotationAnimation!, rig.hips);
            group.addTargetedAnimation(headAnimation, head);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.leftFoot, "position"), rig.leftFoot);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.rightFoot, "position"), rig.rightFoot);
            const clip = new RootMotionClip(group, { rootNode: rig.armature });

            expect(clip.source).toBe(RootMotionSource.FootContact);
            expect(clip.toFrame - clip.fromFrame).toBe(CycleFrames);
            expect(clip.duration).toBeCloseTo(1, 6);
            expect(clip.cycleDistance).toBeCloseTo(Speed, 2);

            new RootMotionController(rig.character, [clip]);
            clip.animationGroup.start(true);
            Run(scene, 63);
            expect(rig.character.position.z).toBeCloseTo(Walked(63), 1);
        });

        it("runs a root whose channels are all single keys on a descendant that spans the clip", () => {
            const rig = BuildRig(scene, "inPlace");
            const still = new Animation("hipsStill", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            still.setKeys([{ frame: 0, value: (rig.hipsAnimation.getKeys()[0].value as Vector3).clone() }]);
            const group = new AnimationGroup("sparse", scene);
            group.addTargetedAnimation(still, rig.hips);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.leftFoot, "position"), rig.leftFoot);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.rightFoot, "position"), rig.rightFoot);
            const clip = new RootMotionClip(group);

            // The hips are still the root; a clip cannot run on their single key, so it runs on a foot.
            expect(clip.rootNode).toBe(rig.hips);
            expect(clip.duration).toBeCloseTo(1, 6);
            expect(clip.source).toBe(RootMotionSource.FootContact);
            expect(clip.cycleDistance).toBeCloseTo(Speed, 2);

            new RootMotionController(rig.character, [clip]);
            clip.animationGroup.start(true);
            Run(scene, 63);
            expect(rig.character.position.z).toBeCloseTo(Walked(63), 1);
        });

        it("follows the very channel it was analyzed on when the root has two of that property", () => {
            const rig = BuildRig(scene, "rootMotion");
            const bob = new Animation("hipsBob", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            const rest = rig.hipsAnimation.getKeys()[0].value as Vector3;
            bob.setKeys([
                { frame: 0, value: rest.clone() },
                { frame: CycleFrames / 2, value: rest.clone() },
            ]);
            // The travelling channel is added second, so it is the one the mixer's pose ends on and the analysis takes.
            const group = new AnimationGroup("duplicate", scene);
            group.addTargetedAnimation(bob, rig.hips);
            group.addTargetedAnimation(rig.hipsAnimation, rig.hips);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.leftFoot, "position"), rig.leftFoot);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.rightFoot, "position"), rig.rightFoot);
            const clip = new RootMotionClip(group);
            new RootMotionController(rig.character, [clip]);

            expect(clip.source).toBe(RootMotionSource.Root);
            clip.animationGroup.start(true);
            Run(scene, 63);
            expect(rig.character.position.z).toBeCloseTo(Walked(63), 3);
        });

        it("runs a root whose position channel has a single key on its rotation channel", () => {
            const rig = BuildRig(scene, "inPlace", { twist: 0.1 });
            const still = new Animation("hipsStill", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            still.setKeys([{ frame: 0, value: (rig.hipsAnimation.getKeys()[0].value as Vector3).clone() }]);
            const group = new AnimationGroup("sparse", scene);
            group.addTargetedAnimation(still, rig.hips);
            group.addTargetedAnimation(rig.hipsRotationAnimation!, rig.hips);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.leftFoot, "position"), rig.leftFoot);
            group.addTargetedAnimation(ChannelOf(rig.group, rig.rightFoot, "position"), rig.rightFoot);
            const clip = new RootMotionClip(group);

            expect(clip.rootNode).toBe(rig.hips);
            expect(clip.source).toBe(RootMotionSource.FootContact);
            expect(clip.duration).toBeCloseTo(1, 6);
            expect(clip.cycleDistance).toBeCloseTo(Speed, 2);
        });
    });

    it("finds no travel in a clip that stands still", () => {
        const rig = BuildRig(scene, "idle");
        const { clip, group } = Extract(rig);
        group.start(true);
        Run(scene, 100);

        expect(clip.source).toBe(RootMotionSource.None);
        expect(clip.travelDirection.asArray()).toEqual([0, 0, 1]);
        expect(rig.character.position.length()).toBe(0);
    });

    describe("direction of travel", () => {
        it("walks an in-place clip that veers slightly straight", () => {
            const rig = BuildRig(scene, "inPlace", { veer: 0.05 });
            const { clip, group } = Extract(rig);
            group.start(true);
            Run(scene, 126);

            expect(clip.travelDirection.x).toBeCloseTo(0, 6);
            expect(rig.character.position.x).toBeCloseTo(0, 6);
            expect(rig.character.position.z).toBeCloseTo(Speed * 2, 1);
        });

        it("keeps a root clip's authored veer by default", () => {
            const rig = BuildRig(scene, "rootMotion", { veer: 0.05 });
            const clip = new RootMotionClip(rig.group);

            expect(clip.travelDirection.x).toBeCloseTo(Math.sin(0.05), 4);
        });

        it("walks a root clip that veers slightly straight when asked, without a pop at the loop", () => {
            const rig = BuildRig(scene, "rootMotion", { veer: 0.05 });
            const start = HipsInCharacter(rig, 0);
            const { clip, group } = Extract(rig, { directionSnapAngle: Math.PI / 18 });

            expect(clip.travelDirection.x).toBeCloseTo(0, 6);
            const end = HipsInCharacter(rig, CycleFrames, ChannelOf(group, rig.hips, "position"));
            expect(end.x).toBeCloseTo(start.x, 4);
            expect(end.z).toBeCloseTo(start.z, 4);

            group.start(true);
            Run(scene, 126);
            expect(rig.character.position.x).toBeCloseTo(0, 6);
        });

        it("keeps a deliberate diagonal", () => {
            const rig = BuildRig(scene, "inPlace", { veer: 0.5 });
            const clip = new RootMotionClip(rig.group);

            expect(clip.travelDirection.x).toBeCloseTo(Math.sin(0.5), 2);
        });

        it("keeps the measured direction when snapping is off", () => {
            const rig = BuildRig(scene, "inPlace", { veer: 0.05 });
            const clip = new RootMotionClip(rig.group, { directionSnapAngle: 0 });

            expect(clip.travelDirection.x).toBeCloseTo(Math.sin(0.05), 2);
        });
    });

    describe("turning", () => {
        it("extracts the turn of a turning clip", () => {
            const rig = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
            const clip = new RootMotionClip(rig.group);

            expect(clip.source).toBe(RootMotionSource.Root);
            expect(clip.extractsRotation).toBe(true);
            expect(clip.cycleRotation).toBeCloseTo(Math.PI / 2, 3);
        });

        it("leaves a walk's hip twist in the pose", () => {
            const rig = BuildRig(scene, "rootMotion", { twist: 0.15 });
            const clip = new RootMotionClip(rig.group);

            expect(clip.extractsRotation).toBe(false);
            expect(clip.cycleRotation).toBe(0);
        });

        it("turns on the spot", () => {
            const rig = BuildRig(scene, "idle", { turn: Math.PI / 2 });
            const { clip, group } = Extract(rig);
            group.start(true);
            Run(scene, 63);

            expect(clip.source).toBe(RootMotionSource.Root);
            expect(clip.cycleDistance).toBeCloseTo(0, 3);
            const facing = Vector3.TransformNormal(Vector3.Forward(), rig.character.computeWorldMatrix(true));
            expect(facing.x).toBeCloseTo(1, 1);
        });

        for (const mirrored of [false, true]) {
            it(`keeps the clip's world pose along a turning path, across loops${mirrored ? " (mirrored character)" : ""}`, () => {
                const original = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
                const rig = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
                if (mirrored) {
                    // The glTF loader's handedness flip on __root__.
                    rig.character.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI);
                    rig.character.scaling.set(1, 1, -1);
                }
                const start = rig.character.computeWorldMatrix(true).clone();
                const { clip, group } = Extract(rig);
                group.start(true);
                expect(clip.extractsRotation).toBe(true);

                // Within the first cycle, then after one and two loops.
                for (const [ticks, cycles] of [
                    [40, 0],
                    [50, 1],
                    [65, 2],
                ]) {
                    Run(scene, ticks);
                    const hips = FreshWorldMatrix(rig.hips);
                    const expected = ExpectedHipsWorld(original, group.getCurrentFrame(), cycles, start);
                    ExpectSamePose(hips, expected, 0.03);
                }
            });
        }

        it("keeps the hip sway of a clip that turns on the spot", () => {
            const original = BuildRig(scene, "idle", { turn: Math.PI / 2 });
            const rig = BuildRig(scene, "idle", { turn: Math.PI / 2 });
            const start = rig.character.computeWorldMatrix(true).clone();
            const { clip, group } = Extract(rig);
            group.start(true);
            expect(clip.extractsRotation).toBe(true);

            let rendered = 0;
            for (const ticks of [16, 30, 45]) {
                Run(scene, ticks);
                rendered += ticks;
                const cycles = Math.floor(((rendered - 1) * FramesPerTick) / CycleFrames);
                ExpectSamePose(FreshWorldMatrix(rig.hips), ExpectedHipsWorld(original, group.getCurrentFrame(), cycles, start), 0.01);
            }
        });

        it("keeps a turning root that has no position channel where it is, from a position channel of its own", () => {
            // Hips a way off the character's origin that only turn: once the turn is taken out and the character turns
            // instead, the hips have to swing round the character's origin to stay where the clip has them.
            const offset = new Vector3(0.3, HipHeight, 0);
            const build = () => {
                const character = new TransformNode("character", scene);
                const hips = new TransformNode("hips", scene);
                hips.parent = character;
                hips.position.copyFrom(offset);
                const foot = new TransformNode("foot", scene);
                foot.parent = hips;
                foot.position.set(0, -HipHeight, 0);
                const rotation = new Animation("rotation", "rotationQuaternion", Fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
                // Sparse keys: between them the arc is what the position channel has to follow.
                rotation.setKeys([0, 30, 60].map((frame) => ({ frame, value: Quaternion.RotationAxis(Vector3.Up(), ((Math.PI / 2) * frame) / CycleFrames) })));
                const group = new AnimationGroup("turn", scene);
                group.addTargetedAnimation(rotation, hips);
                return { character, hips, group, rotation };
            };
            const original = build();
            const rig = build();
            const localAt = (frame: number) => Matrix.Compose(Vector3.One(), original.rotation.evaluate(frame), offset);
            const start = rig.character.computeWorldMatrix(true).clone();
            const clip = new RootMotionClip(rig.group, { rootNode: rig.hips });
            new RootMotionController(rig.character, [clip]);

            expect(clip.extractsRotation).toBe(true);
            expect(clip.cycleRotation).toBeCloseTo(Math.PI / 2, 3);
            expect(rig.group.targetedAnimations.length).toBe(1);
            expect(clip.animationGroup.targetedAnimations.length).toBe(2);

            clip.animationGroup.start(true);
            let rendered = 0;
            // Between the rotation keys, then into the second cycle.
            for (const ticks of [16, 14, 15, 20]) {
                Run(scene, ticks);
                rendered += ticks;
                const cycles = Math.floor(((rendered - 1) * FramesPerTick) / CycleFrames);
                ExpectSamePose(FreshWorldMatrix(rig.hips), ExpectedWorld(localAt, clip.animationGroup.getCurrentFrame(), cycles, start), 0.01);
            }

            // The character turns about the root's starting point, so the position channel holds the root there.
            expect(clip.cycleOffset.x).toBeCloseTo(offset.x, 3);
            expect(clip.cycleOffset.z).toBeCloseTo(offset.x, 3);
            clip.animationGroup.stop();
            expect(rig.hips.position.equalsWithEpsilon(offset, 1e-4)).toBe(true);
            clip.dispose();
            expect(rig.hips.position.equalsWithEpsilon(offset)).toBe(true);
        });

        it("composes the whole revolutions of a spinning clip as straight travel", () => {
            const rig = BuildRig(scene, "idle", { turn: 2 * Math.PI });
            const { clip, group } = Extract(rig, { extractRotation: true });
            group.start(true, 3);
            Run(scene, 130);

            expect(clip.cycleRotation).toBeCloseTo(2 * Math.PI, 3);
            expect(Number.isFinite(rig.character.position.x)).toBe(true);
            expect(rig.character.position.length()).toBeLessThan(1e-6);
        });

        it("keeps rewritten Euler rotation keys on the short path around PI", () => {
            // Hips facing backwards that pitch and roll while turning: once the turn is taken out, the heading left in the
            // keys wanders across PI, where converting back from a quaternion jumps between +PI and -PI.
            const character = new TransformNode("character", scene);
            const hips = new TransformNode("hips", scene);
            hips.parent = character;
            new TransformNode("foot", scene).parent = hips;
            const rotation = new Animation("rotation", "rotation", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            const position = new Animation("position", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            const rotationKeys = [];
            const positionKeys = [];
            for (let frame = 0; frame <= CycleFrames; frame++) {
                const phase = (2 * Math.PI * frame) / CycleFrames;
                rotationKeys.push({ frame, value: new Vector3(0.6 * Math.sin(phase), Math.PI + (Math.PI / 2) * (frame / CycleFrames), 0.6 * Math.sin(2 * phase)) });
                positionKeys.push({ frame, value: new Vector3(0, HipHeight, 0) });
            }
            rotation.setKeys(rotationKeys);
            position.setKeys(positionKeys);
            const group = new AnimationGroup("euler", scene);
            group.addTargetedAnimation(position, hips);
            group.addTargetedAnimation(rotation, hips);
            const clip = new RootMotionClip(group);

            expect(clip.extractsRotation).toBe(true);
            const keys = ChannelOf(clip.animationGroup, hips, "rotation").getKeys();
            for (let i = 1; i < keys.length; i++) {
                const step = (keys[i].value as Vector3).subtract(keys[i - 1].value as Vector3);
                expect(Math.max(Math.abs(step.x), Math.abs(step.y), Math.abs(step.z))).toBeLessThan(Math.PI);
            }
        });

        it("does not turn when rotation extraction is off", () => {
            const rig = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
            const clip = new RootMotionClip(rig.group, { extractRotation: false });

            expect(clip.extractsRotation).toBe(false);
            expect(clip.cycleRotation).toBe(0);
        });
    });

    describe("runtime", () => {
        for (const gait of ["rootMotion", "inPlace"] as const) {
            it(`moves the character across loops (${gait})`, () => {
                const rig = BuildRig(scene, gait);
                const { group } = Extract(rig);
                group.start(true);
                // 16ms ticks: 125 of them are exactly two cycles.
                Run(scene, 126);

                expect(rig.character.position.z).toBeCloseTo(Speed * 2, 1);
                expect(rig.character.position.x).toBeCloseTo(0, 3);
            });
        }

        it("keeps the feet planted in world space", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            // Frame 5-25 of the cycle: the left foot is planted.
            Run(scene, 6);
            const planted = FreshWorldMatrix(rig.leftFoot).getTranslation();
            Run(scene, 18);
            const later = FreshWorldMatrix(rig.leftFoot).getTranslation();

            expect(Vector3.Distance(planted, later)).toBeLessThan(0.01);
        });

        it("travels in the character's world orientation and scale", () => {
            const rig = BuildRig(scene, "rootMotion");
            rig.character.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);
            rig.character.scaling.setAll(2);
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 126);

            expect(rig.character.position.x).toBeCloseTo(Speed * 4, 1);
            expect(rig.character.position.z).toBeCloseTo(0, 3);
        });

        it("follows speedRatio and weight", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, 2);
            group.weight = 0.5;
            Run(scene, 63);

            // One second at double speed is two cycles, at half weight one cycle.
            expect(rig.character.position.z).toBeCloseTo(Speed, 1);
        });

        it("reports the travel without moving the character when not applied", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { controller, group } = Extract(rig);
            controller.applyToCharacter = false;
            let travelled = 0;
            controller.onRootMotionObservable.add(() => (travelled += controller.deltaPosition.z));
            group.start(true);
            Run(scene, 63);

            expect(rig.character.position.z).toBe(0);
            expect(travelled).toBeCloseTo(Speed, 1);
        });

        it("plays backwards", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, -1);
            Run(scene, 130);

            expect(rig.character.position.z).toBeCloseTo(-Walked(130), 3);
        });

        it("counts several cycles passing in one step", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, 70);
            Run(scene, 10);

            expect(rig.character.position.z).toBeCloseTo(Walked(10, 70), 2);
        });

        it("counts a step of exactly one cycle, which leaves the frame where it was", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, 1000 / 16);
            Run(scene, 10);

            expect(rig.character.position.z).toBeCloseTo(Speed * 9, 2);
        });

        it("composes thousands of cycles in one step exactly", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, 1e6);
            Run(scene, 10);

            expect(rig.character.position.z / Walked(10, 1e6)).toBeCloseTo(1, 6);
        });

        it("does not read a restart between frames as a loop", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 40);
            const before = rig.character.position.z;
            group.stop();
            group.start(true);
            Run(scene, 2);

            expect(rig.character.position.z - before).toBeCloseTo(Walked(2), 3);
        });

        it("swings forwards and back with a yoyo loop", () => {
            const rig = BuildRig(scene, "rootMotion");
            SetLoopMode(rig.group, Animation.ANIMATIONLOOPMODE_YOYO);
            const { group } = Extract(rig);
            group.start(true);
            let farthest = 0;
            for (let i = 0; i < 130; i++) {
                Run(scene, 1);
                farthest = Math.max(farthest, rig.character.position.z);
            }

            expect(farthest).toBeCloseTo(Speed, 1);
            expect(Math.abs(rig.character.position.z)).toBeLessThan(Speed);
        });

        it("loops a played range by its own stride", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true, 1, 20, 40);
            Run(scene, 130);

            expect(rig.character.position.z).toBeCloseTo(Walked(130), 3);
        });

        it("runs on the root's animation rather than the group's first", () => {
            const rig = BuildRig(scene, "rootMotion");
            // A 30 frames per second track listed ahead of the skeleton, on a node of its own.
            const prop = new TransformNode("prop", scene);
            const propAnimation = new Animation("prop", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            propAnimation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: 30, value: Vector3.One() },
            ]);
            const mixed = new AnimationGroup("mixed", scene);
            mixed.addTargetedAnimation(propAnimation, prop);
            for (const targetedAnimation of rig.group.targetedAnimations) {
                mixed.addTargetedAnimation(targetedAnimation.animation, targetedAnimation.target);
            }
            const clip = new RootMotionClip(mixed);
            new RootMotionController(rig.character, [clip]);
            clip.animationGroup.start(true);
            Run(scene, 130);

            expect(clip.averageSpeed).toBeCloseTo(Speed, 3);
            expect(rig.character.position.z).toBeCloseTo(Walked(130), 3);
        });

        it("stops moving the character after the clip is disposed", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { clip, group } = Extract(rig);
            group.start(true);
            Run(scene, 30);
            clip.dispose();
            const stopped = rig.character.position.z;
            Run(scene, 30);

            expect(rig.character.position.z).toBe(stopped);
        });

        it("stops moving the character after the controller is disposed", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { clip, controller, group } = Extract(rig);
            group.start(true);
            Run(scene, 30);
            controller.dispose();
            const stopped = rig.character.position.z;
            Run(scene, 30);

            expect(rig.character.position.z).toBe(stopped);
            expect(clip.controller).toBeNull();
            expect(group.isPlaying).toBe(true);
        });
    });

    describe("playback that does not loop", () => {
        it("lands exactly at the end of the clip", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(false);
            Run(scene, 70);

            expect(group.isStarted).toBe(false);
            expect(rig.character.position.z).toBeCloseTo(Speed, 6);
        });

        it("lands exactly at the start of the clip played backwards", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(false, -1);
            Run(scene, 70);

            expect(group.isStarted).toBe(false);
            expect(rig.character.position.z).toBeCloseTo(-Speed, 6);
        });

        it("applies the whole clip when it completes in its first advancing tick", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(false, 1000);
            Run(scene, 2);

            expect(rig.character.position.z).toBeCloseTo(Speed, 6);
        });

        it("mixes the terminal motions of weighted clips completing together by their normalized weights", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(false, 1000);
            runClip.animationGroup.start(false, 1000);
            walkClip.animationGroup.weight = 0.8;
            runClip.animationGroup.weight = 0.8;
            // Both complete in their first advancing tick, each weighed among all the writers of that tick.
            Run(scene, 2);

            expect(walkClip.animationGroup.isStarted).toBe(false);
            expect(runClip.animationGroup.isStarted).toBe(false);
            expect(skeleton.character.position.z).toBeCloseTo(0.5 * Speed + 0.5 * (2 * Speed), 6);
        });

        it("gives the last of two unweighted clips completing together the whole terminal motion", () => {
            for (const runLast of [true, false]) {
                const skeleton = BuildSkeleton(scene);
                const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
                const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
                const walkClip = new RootMotionClip(walk.group);
                const runClip = new RootMotionClip(run.group);
                new RootMotionController(skeleton.character, [walkClip, runClip]);
                // Started second, animated second: the last direct writer of the root, whose pose is the one seen.
                (runLast ? walkClip : runClip).animationGroup.start(false, 1000);
                (runLast ? runClip : walkClip).animationGroup.start(false, 1000);
                Run(scene, 2);

                expect(skeleton.character.position.z).toBeCloseTo(runLast ? 2 * Speed : Speed, 6);
            }
        });

        it("weighs a clip completing against a weighted clip that plays on", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(false, 1000);
            runClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0.8;
            runClip.animationGroup.weight = 0.8;
            Run(scene, 2);

            // The walk's whole clip and the run's one tick, half each.
            expect(skeleton.character.position.z).toBeCloseTo(0.5 * Speed + 0.5 * Walked(2, 2), 6);
        });

        it("applies nothing beyond the last frame of a playback stopped explicitly", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 40);
            group.stop();
            const stopped = rig.character.position.z;
            Run(scene, 5);

            expect(stopped).toBeCloseTo(Walked(40), 6);
            expect(rig.character.position.z).toBe(stopped);
        });

        it("keeps the end of each playback of a clip started again whenever it ends", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            // Started again on the tick after it ends: an AnimationGroup started from inside its own end observable is
            // left without its animatables.
            const chain = (ticks: number) => {
                for (let i = 0; i < ticks; i++) {
                    if (!group.isStarted) {
                        group.start(false);
                    }
                    scene.animate();
                }
            };
            // A playback ends on its 64th tick.
            chain(128);
            expect(rig.character.position.z).toBeCloseTo(2 * Speed, 6);

            chain(10);
            expect(rig.character.position.z).toBeCloseTo(2 * Speed + Walked(10), 6);
        });
    });

    describe("loop modes", () => {
        it("holds a constant loop at the end of its first cycle", () => {
            const rig = BuildRig(scene, "rootMotion");
            SetLoopMode(rig.group, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 130);

            expect(rig.character.position.z).toBeCloseTo(Speed, 6);
        });

        it("holds a constant loop played backwards at the end of its first cycle", () => {
            const rig = BuildRig(scene, "rootMotion");
            SetLoopMode(rig.group, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const { group } = Extract(rig);
            group.start(true, -1);
            Run(scene, 130);

            expect(rig.character.position.z).toBeCloseTo(-Speed, 6);
        });

        it("keeps cycling a constant loop whose speed ratio turns negative after it started", () => {
            const rig = BuildRig(scene, "rootMotion");
            SetLoopMode(rig.group, Animation.ANIMATIONLOOPMODE_CONSTANT);
            const { group } = Extract(rig);
            group.start(true);
            Run(scene, 10);
            group.speedRatio = -1;
            Run(scene, 130);

            expect(rig.character.position.z).toBeCloseTo(Walked(10) - Speed * ((130 * FramesPerTick) / CycleFrames), 3);
        });

        for (const [name, loopMode] of [
            ["relative", Animation.ANIMATIONLOOPMODE_RELATIVE],
            ["relative from current", Animation.ANIMATIONLOOPMODE_RELATIVE_FROM_CURRENT],
        ] as const) {
            it(`cycles a ${name} loop`, () => {
                const rig = BuildRig(scene, "rootMotion");
                SetLoopMode(rig.group, loopMode);
                const start = HipsInCharacter(rig, 0);
                const { group } = Extract(rig);
                group.start(true);
                Run(scene, 126);

                expect(rig.character.position.z).toBeCloseTo(Speed * 2, 1);
                // The in-place root ends its cycle where it began, so the pose has nothing to accumulate.
                expect(HipsInCharacter(rig, CycleFrames, ChannelOf(group, rig.hips, "position")).z).toBeCloseTo(start.z, 4);
            });
        }
    });

    describe("track ranges", () => {
        it("loops by the root's own range when another track runs longer", () => {
            const rig = BuildRig(scene, "rootMotion");
            const prop = new TransformNode("prop", scene);
            const propAnimation = new Animation("prop", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            propAnimation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: 2 * CycleFrames, value: Vector3.One() },
            ]);
            rig.group.addTargetedAnimation(propAnimation, prop);
            expect(rig.group.to).toBe(2 * CycleFrames);
            const { clip, group } = Extract(rig);

            expect(clip.fromFrame).toBe(0);
            expect(clip.toFrame).toBe(CycleFrames);
            expect(clip.duration).toBeCloseTo(1, 6);
            expect(clip.averageSpeed).toBeCloseTo(Speed, 3);

            group.start(true);
            Run(scene, 126);
            expect(rig.character.position.z).toBeCloseTo(Speed * 2, 1);
        });

        it("follows a root track keyed inside the group's range, played twice", () => {
            const rig = BuildRig(scene, "rootMotion");
            rig.hipsAnimation.setKeys(rig.hipsAnimation.getKeys().filter((key) => key.frame >= 10 && key.frame <= 40));
            const { clip, group } = Extract(rig);

            expect(clip.fromFrame).toBe(10);
            expect(clip.toFrame).toBe(40);
            // Half a cycle's travel in half a second; the hips' sway leaves the range a little off +Z, which is kept.
            expect(clip.duration).toBeCloseTo(0.5, 6);
            expect(clip.averageSpeed).toBeCloseTo(Speed, 2);

            group.start(true);
            Run(scene, 130);
            const first = rig.character.position.z;
            expect(first).toBeCloseTo(Walked(130), 2);

            // Playing again, the root's keys now start at frame 0 (playback pads them) and its pose holds until frame 10:
            // 129 ticks are three 40-frame cycles of 0.6 and a few frames of holding.
            group.stop();
            group.start(true);
            Run(scene, 130);
            expect(rig.character.position.z - first).toBeCloseTo(3 * 0.6, 2);
        });
    });

    describe("blending", () => {
        it("blends two weighted clips by their normalized weights", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(true);
            runClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0.8;
            runClip.animationGroup.weight = 0.8;
            Run(scene, 63);

            expect(skeleton.character.position.z).toBeCloseTo(0.5 * Walked(63) + 0.5 * Walked(63, 2), 6);
        });

        it("cross-fades to the blended pose", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(true);
            runClip.animationGroup.start(true);

            const ticks = 62;
            let expected = 0;
            for (let tick = 1; tick <= ticks; tick++) {
                const fade = (tick - 1) / (ticks - 1);
                walkClip.animationGroup.weight = 1 - fade;
                runClip.animationGroup.weight = fade;
                Run(scene, 1);
                if (tick > 1) {
                    expected += ((1 - fade) * Speed + fade * Speed * 2) * 0.016;
                }
            }

            expect(skeleton.character.position.z).toBeCloseTo(expected, 6);
        });

        it("contributes as much as a group blending in is blended in", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.enableBlending = true;
            group.blendingSpeed = 0.1;
            group.start(true);
            const ticks = 30;
            Run(scene, ticks);

            // The blending factor grows by 0.1 an evaluation and blends until it passes 1.
            let expected = 0;
            for (let tick = 2; tick <= ticks; tick++) {
                const factor = 0.1 * (tick - 1);
                expected += (factor <= 1 ? factor : 1) * Speed * 0.016;
            }
            expect(rig.character.position.z).toBeCloseTo(expected, 6);
        });

        it("fades a clip in from a weight of zero without a jump", () => {
            const skeleton = BuildSkeleton(scene);
            const idle = AddGait(skeleton, "idle");
            const walk = AddGait(skeleton, "rootMotion");
            const walkClip = new RootMotionClip(walk.group);
            new RootMotionController(skeleton.character, [walkClip]);
            idle.group.start(true);
            idle.group.weight = 1;
            walkClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0;
            Run(scene, 200);
            expect(skeleton.character.position.z).toBe(0);

            walkClip.animationGroup.weight = 0.1;
            Run(scene, 2);
            expect(skeleton.character.position.z).toBeCloseTo((0.1 / 1.1) * Speed * 0.016, 6);
        });

        it("adds an additive clip by its weight", () => {
            const skeleton = BuildSkeleton(scene);
            const idle = AddGait(skeleton, "idle");
            const walk = AddGait(skeleton, "rootMotion");
            const start = HipsInCharacter(walk, 0);
            const walkClip = new RootMotionClip(walk.group, { cloneAnimations: true });
            const additive = AnimationGroup.MakeAnimationAdditive(walkClip.animationGroup, { referenceFrame: 0 });
            new RootMotionController(skeleton.character, [walkClip]);
            idle.group.start(true);
            idle.group.weight = 1;
            additive.start(true);
            additive.weight = 0.5;
            Run(scene, 63);

            expect(additive).toBe(walkClip.animationGroup);
            expect(skeleton.character.position.z).toBeCloseTo(0.5 * Walked(63), 6);
            expect(HipsInCharacter(walk, CycleFrames).z).toBeCloseTo(start.z + Speed, 4);
        });

        it("lets the last unweighted group take over", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(true);
            runClip.animationGroup.start(true);
            Run(scene, 63);
            expect(skeleton.character.position.z).toBeCloseTo(Walked(63, 2), 6);

            runClip.animationGroup.stop();
            runClip.animationGroup.start(true);
            walkClip.animationGroup.stop();
            walkClip.animationGroup.start(true);
            Run(scene, 63);
            expect(skeleton.character.position.z).toBeCloseTo(Walked(63, 2) + Walked(63), 6);
        });

        it("normalizes against a weighted group the controller does not know", () => {
            const skeleton = BuildSkeleton(scene);
            const idle = AddGait(skeleton, "idle");
            const walk = AddGait(skeleton, "rootMotion");
            const walkClip = new RootMotionClip(walk.group);
            new RootMotionController(skeleton.character, [walkClip]);
            idle.group.start(true);
            idle.group.weight = 0.8;
            walkClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0.8;
            Run(scene, 63);

            expect(skeleton.character.position.z).toBeCloseTo(0.5 * Walked(63), 6);
        });
    });

    /**
     * A position animation to clock a synchronization driver, keyed over one cycle.
     * @returns the animation
     */
    function DriverAnimation(): Animation {
        const animation = new Animation("driver", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        animation.setKeys([
            { frame: 0, value: Vector3.Zero() },
            { frame: CycleFrames, value: Vector3.Zero() },
        ]);
        return animation;
    }

    describe("synchronization", () => {
        const Synced = (speedRatio = 1, masterLoopMode?: number, followerLoopMode?: number, loop = true) => {
            const skeleton = BuildSkeleton(scene);
            const idle = AddGait(skeleton, "idle");
            const walk = AddGait(skeleton, "rootMotion");
            if (masterLoopMode !== undefined) {
                SetLoopMode(idle.group, masterLoopMode);
            }
            if (followerLoopMode !== undefined) {
                SetLoopMode(walk.group, followerLoopMode);
            }
            const clip = new RootMotionClip(walk.group);
            new RootMotionController(skeleton.character, [clip]);
            idle.group.start(true, speedRatio);
            clip.animationGroup.start(loop);
            clip.animationGroup.syncAllAnimationsWith(idle.group.animatables[0]);
            return { skeleton, idle, walk, clip };
        };

        it("stands still with a stationary driver", () => {
            const { skeleton } = Synced(0);
            Run(scene, 63);

            expect(skeleton.character.position.z).toBe(0);
        });

        it("follows a slower driver", () => {
            const { skeleton } = Synced(0.5);
            Run(scene, 130);

            expect(skeleton.character.position.z).toBeCloseTo(Walked(130, 0.5), 6);
        });

        it("follows a driver of twice the range across its loops", () => {
            const rig = BuildRig(scene, "rootMotion");
            const prop = new TransformNode("prop", scene);
            const propAnimation = new Animation("prop", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            propAnimation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: 2 * CycleFrames, value: Vector3.One() },
            ]);
            const master = new AnimationGroup("master", scene);
            master.addTargetedAnimation(propAnimation, prop);
            const { group } = Extract(rig);
            master.start(true);
            group.start(true);
            group.syncAllAnimationsWith(master.animatables[0]);
            Run(scene, 260);

            expect(rig.character.position.z).toBeCloseTo(Walked(260, 0.5), 6);
        });

        it("holds when the driver stops", () => {
            const { skeleton, idle } = Synced();
            Run(scene, 63);
            const before = skeleton.character.position.z;
            idle.group.stop();
            Run(scene, 10);

            expect(before).toBeCloseTo(Walked(63), 6);
            expect(skeleton.character.position.z).toBe(before);
        });

        it("keeps following a driver whose constant loop holds its pose", () => {
            const { skeleton } = Synced(1, Animation.ANIMATIONLOOPMODE_CONSTANT);
            Run(scene, 130);

            expect(skeleton.character.position.z).toBeCloseTo(Walked(130), 6);
        });

        it("holds a follower whose own constant loop holds its pose", () => {
            const { skeleton } = Synced(1, undefined, Animation.ANIMATIONLOOPMODE_CONSTANT);
            Run(scene, 130);

            expect(skeleton.character.position.z).toBeCloseTo(Speed, 6);
        });

        it("does not read the return to its own clock as motion when it is no longer synchronized", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            const prop = new TransformNode("prop", scene);
            const driver = scene.beginDirectAnimation(prop, [DriverAnimation()], 0, CycleFrames, true);
            group.start(true);
            group.syncAllAnimationsWith(driver);
            Run(scene, 20);
            driver.stop();
            Run(scene, 1);
            const before = rig.character.position.z;

            // Back on its own clock, the pose lands wherever its own elapsed time puts it: a jump, not travel.
            group.syncAllAnimationsWith(null);
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(0, 6);
        });

        it("follows a driver whose group runs longer than the track it is clocked by", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            const prop = new TransformNode("prop", scene);
            // Played over twice the range of its keys: Babylon maps the follower's frame over the range asked for, so
            // the follower only ever reaches the middle of its own range and is snapped back at every wrap of the driver.
            const driver = scene.beginDirectAnimation(prop, [DriverAnimation()], 0, 2 * CycleFrames, true);
            group.start(true);
            group.syncAllAnimationsWith(driver);
            Run(scene, 40);
            const before = rig.character.position.z;
            // Spans the driver's wrap, which carries the pose no further than any other step.
            Run(scene, 40);

            expect(rig.character.position.z - before).toBeCloseTo(40 * 0.5 * Speed * 0.016, 4);
        });

        it("ends a follower that does not loop at the driver's frame", () => {
            const { skeleton, clip } = Synced(0.5, undefined, undefined, false);
            Run(scene, 70);

            // The follower's own clock runs out on its 64th tick, where the driver, at half speed, has reached frame 30.24.
            expect(clip.animationGroup.isStarted).toBe(false);
            expect(skeleton.character.position.z).toBeCloseTo(Speed * ((63 * FramesPerTick * 0.5) / CycleFrames), 6);
        });
    });

    describe("writers recorded as they write", () => {
        /**
         * A position animation holding its target still, playing once.
         * @returns the animation
         */
        const stillAnimation = () => {
            const animation = new Animation("still", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: CycleFrames, value: Vector3.Zero() },
            ]);
            return animation;
        };

        /**
         * A group the controller knows nothing about, holding the hips still and playing once.
         * @param hips defines the node
         * @param event defines a frame at which an event of the animation acts on the group itself
         * @returns the group
         */
        const stillGroup = (hips: TransformNode, event?: { frame: number; action: (group: AnimationGroup) => void }) => {
            const animation = stillAnimation();
            const group = new AnimationGroup("still", scene);
            group.addTargetedAnimation(animation, hips);
            if (event) {
                animation.addEvent(new AnimationEvent(event.frame, () => event.action(group), true));
            }
            return group;
        };

        it("applies the terminal step of a playback whose event disables the scene's animations after it wrote", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            ChannelOf(group, rig.hips, "position").addEvent(
                new AnimationEvent(
                    CycleFrames,
                    () => {
                        scene.animationsEnabled = false;
                    },
                    true
                )
            );
            group.start(false);
            // The step that reaches the end writes it, then the event disables the animations; the step still completes.
            Run(scene, 64);

            expect(group.isStarted).toBe(false);
            expect(scene.animationsEnabled).toBe(false);
            expect(rig.character.position.z).toBeCloseTo(Speed, 6);
        });

        for (const [first, second] of [
            [0.8, 0.8],
            [0.8, 0.2],
            [0.2, 0.8],
        ]) {
            it(`follows the bindings of a clock re-evaluated by an animation event within a step (${first} then ${second})`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                let hipsRuntime: RuntimeAnimation | null = null;
                // Registered before the playback starts: a runtime animation takes its events when it is created.
                ChannelOf(group, rig.hips, "position").addEvent(
                    new AnimationEvent(
                        30,
                        () => {
                            const hipsAnimatable = group.animatables.find((animatable) => animatable.target === rig.hips)!;
                            hipsRuntime = hipsAnimatable.getAnimations()[0];
                            group.weight = second;
                            hipsAnimatable.goToFrame(hipsRuntime.currentFrame, true);
                        },
                        true
                    )
                );
                group.start(true);
                group.weight = first;
                Run(scene, 32);
                const before = rig.character.position.z;
                Run(scene, 1);

                // The bindings hold two entries, added up as written, and read both with the weight of the last write: the
                // pose is the runtime animation's value scaled by that, and the motion follows the same share.
                const coefficient = (2 * second) / Math.max(1, first + second);
                const value: Vector3 = hipsRuntime!.currentValue;
                expect(Vector3.Distance(rig.hips.position, value.scale(coefficient))).toBeLessThan(1e-6);
                expect(rig.character.position.z - before).toBeCloseTo(coefficient * Speed * 0.016, 6);
            });
        }

        it("follows the bindings of a clock that turns additive and is re-evaluated twice within a step", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            let hipsRuntime: RuntimeAnimation | null = null;
            ChannelOf(group, rig.hips, "position").addEvent(
                new AnimationEvent(
                    30,
                    () => {
                        const hipsAnimatable = group.animatables.find((animatable) => animatable.target === rig.hips)!;
                        hipsRuntime = hipsAnimatable.getAnimations()[0];
                        group.isAdditive = true;
                        hipsAnimatable.goToFrame(hipsRuntime.currentFrame, true);
                        hipsAnimatable.goToFrame(hipsRuntime.currentFrame, true);
                    },
                    true
                )
            );
            group.start(true);
            group.weight = 1;
            Run(scene, 32);
            const before = rig.character.position.z;
            Run(scene, 1);

            // One override entry at 1 over a total of 1, then two additive entries at 1: three times the value. The
            // bindings copy the value they start from, so an entry does not add the value into itself.
            const value: Vector3 = hipsRuntime!.currentValue;
            expect(Vector3.Distance(rig.hips.position, value.scale(3))).toBeLessThan(1e-6);
            expect(rig.character.position.z - before).toBeCloseTo(3 * Speed * 0.016, 6);
        });

        it("keeps no reference to a stopped animation or its target in the journal past its step", () => {
            const prop = new TransformNode("prop", scene);
            const animatable = scene.beginDirectAnimation(prop, [stillAnimation()], 0, CycleFrames, true);
            const runtime = animatable.getAnimations()[0];
            Run(scene, 3);
            expect(scene._animationWrites.some((write) => write.runtimeAnimation === runtime && write.target === prop)).toBe(true);

            animatable.stop();
            // An idle step empties the journal of the step before, unused entries included.
            Run(scene, 2);
            expect(scene._animationWriteCount).toBe(0);
            expect(scene._animationWrites.some((write) => write.runtimeAnimation === runtime || write.target === prop)).toBe(false);
            expect(scene._animationWrites.every((write) => write.runtimeAnimation === null && write.target === null)).toBe(true);

            const other = new Scene(engine);
            const otherProp = new TransformNode("prop", other);
            other.beginDirectAnimation(otherProp, [stillAnimation()], 0, CycleFrames, true);
            other.animate();
            expect(other._animationWrites.length).toBeGreaterThan(0);
            other.dispose();
            expect(other._animationWrites.length).toBe(0);
        });

        it("carries on where it was when the scene's animations are enabled again", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group, controller } = Extract(rig);
            group.start(true);
            Run(scene, 20);
            const before = rig.character.position.z;
            const frame = group.getCurrentFrame();

            // Nothing animates, nothing moves, and the playback is not taken for one parked at a weight of zero.
            scene.animationsEnabled = false;
            Run(scene, 5);
            expect(rig.character.position.z).toBe(before);
            expect(controller.deltaPosition.length()).toBe(0);
            expect(group.getCurrentFrame()).toBe(frame);

            scene.animationsEnabled = true;
            Run(scene, 1);
            expect(group.getCurrentFrame()).toBeCloseTo(frame + FramesPerTick, 4);
            expect(rig.character.position.z - before).toBeCloseTo(Speed * 0.016, 6);
        });

        for (const weighted of [true, false]) {
            const kind = weighted ? "weighted" : "unweighted";
            // Weighted: normalized against the walk, half a tick. Unweighted: it wrote the root last and owns the pose.
            const expected = weighted ? 0.5 * Speed * 0.016 : 0;

            it(`counts a group completing on its first evaluation, after a jump to its end (${kind})`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                group.start(true);
                if (weighted) {
                    group.weight = 0.8;
                }
                Run(scene, 20);
                const before = rig.character.position.z;

                const still = stillGroup(rig.hips);
                still.start(false);
                if (weighted) {
                    still.weight = 0.8;
                }
                // Jumped to its last frame before its first tick: that first evaluation writes the end and completes.
                for (const animatable of still.animatables) {
                    animatable.goToFrame(CycleFrames);
                }
                Run(scene, 1);

                expect(still.isStarted).toBe(false);
                expect(rig.character.position.z - before).toBeCloseTo(expected, 6);
            });

            it(`counts a group reactivated from a weight of zero at its elapsed end (${kind})`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                group.start(true);
                if (weighted) {
                    group.weight = 0.8;
                }
                const still = stillGroup(rig.hips);
                still.start(false);
                still.weight = 0;
                // Parked at zero for longer than it lasts, while its clock runs on.
                Run(scene, 80);
                const before = rig.character.position.z;

                still.weight = weighted ? 0.8 : -1;
                Run(scene, 1);

                expect(still.isStarted).toBe(false);
                expect(rig.character.position.z - before).toBeCloseTo(expected, 6);
            });

            it(`counts a group that stops itself from an animation event after writing (${kind})`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                group.start(true);
                if (weighted) {
                    group.weight = 0.8;
                }
                Run(scene, 20);
                // Started after the walk, it writes the root after it; on the tick it reaches frame 30 it writes, then
                // its event stops the group and clears its runtime animations before the step ends.
                const still = stillGroup(rig.hips, { frame: 30, action: (target) => target.stop() });
                still.start(false);
                if (weighted) {
                    still.weight = 0.8;
                }
                Run(scene, 32);
                expect(still.isStarted).toBe(true);
                const before = rig.character.position.z;
                Run(scene, 1);

                expect(still.isStarted).toBe(false);
                expect(rig.character.position.z - before).toBeCloseTo(expected, 6);
            });

            it(`counts a write to the root by an animation of several targets (${kind})`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                group.start(true);
                if (weighted) {
                    group.weight = 0.8;
                }
                Run(scene, 20);
                const before = rig.character.position.z;

                // One animatable writing the hips and a prop in turn; the hips are not the target it ends on.
                const prop = new TransformNode("prop", scene);
                const animatable = scene.beginDirectAnimation([rig.hips, prop], [stillAnimation()], 0, CycleFrames, false);
                if (weighted) {
                    animatable.weight = 0.8;
                }
                Run(scene, 1);

                expect(rig.character.position.z - before).toBeCloseTo(expected, 6);
            });
        }

        it("weighs a group turned additive by an animation event after writing as the override it wrote", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            group.weight = 0.8;
            Run(scene, 20);
            const still = stillGroup(rig.hips, {
                frame: 30,
                action: (target) => {
                    target.isAdditive = true;
                },
            });
            still.start(false);
            still.weight = 0.8;
            Run(scene, 32);
            const before = rig.character.position.z;
            Run(scene, 1);

            // Bound as an override of 0.8 when it wrote, whatever it became after: two overrides, half each.
            expect(still.isAdditive).toBe(true);
            expect(rig.character.position.z - before).toBeCloseTo(0.5 * Speed * 0.016, 6);
        });
    });

    describe("mutations within an animation step", () => {
        /** The travel of one 16ms tick of the walking fixture at a speed ratio of 1. */
        const Tick = Speed * 0.016;

        /**
         * A position animation holding its target still over a cycle.
         * @returns the animation
         */
        const stillAnimation = () => {
            const animation = new Animation("still", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
            animation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: CycleFrames, value: Vector3.Zero() },
            ]);
            return animation;
        };

        /**
         * A group the controller knows nothing about, holding the hips still and playing once.
         * @param hips defines the node
         * @param event defines a frame at which an event of the animation acts
         * @returns the group
         */
        const stillGroup = (hips: TransformNode, event?: { frame: number; action: (group: AnimationGroup) => void }) => {
            const animation = stillAnimation();
            const group = new AnimationGroup("still", scene);
            group.addTargetedAnimation(animation, hips);
            if (event) {
                animation.addEvent(new AnimationEvent(event.frame, () => event.action(group), true));
            }
            return group;
        };

        /**
         * The animatable of a playing group that carries a node.
         * @param group defines the group
         * @param target defines the node
         * @returns the animatable
         */
        const animatableOf = (group: AnimationGroup, target: TransformNode) => group.animatables.find((animatable) => animatable.target === target)!;

        /**
         * Plays a walk until the tick before an event at frame 30 of its clock: the next tick writes frame 30.72 and
         * then fires it.
         * @param rig defines the rig
         * @param group defines the in-place group
         * @param action defines the event
         * @returns the character's position before that tick
         */
        const walkToEvent = (rig: IRig, group: AnimationGroup, action: () => void) => {
            ChannelOf(group, rig.hips, "position").addEvent(new AnimationEvent(30, action, true));
            group.start(true);
            Run(scene, 32);
            return rig.character.position.z;
        };

        for (const [name, stop] of [
            ["stops it", (group: AnimationGroup, hips: TransformNode) => group.stop()],
            [
                "stops and starts it again",
                (group: AnimationGroup, hips: TransformNode) => {
                    group.stop();
                    group.start(true);
                },
            ],
            ["stops its clock's animatable", (group: AnimationGroup, hips: TransformNode) => animatableOf(group, hips).stop()],
        ] as const) {
            it(`applies the step of a playback whose event ${name} after its clock wrote`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const { group } = Extract(rig);
                const before = walkToEvent(rig, group, () => stop(group, rig.hips));
                Run(scene, 1);

                // The clock wrote frame 30.72 before the event: that is the pose, and the character goes with it.
                expect(rig.character.position.z - before).toBeCloseTo(Tick, 6);
            });
        }

        it("applies the step of another clip that a clock's event stops after it wrote", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            ChannelOf(walkClip.animationGroup, skeleton.hips, "position").addEvent(new AnimationEvent(30, () => runClip.animationGroup.stop(), true));
            runClip.animationGroup.start(true);
            runClip.animationGroup.weight = 0.5;
            walkClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0.5;
            Run(scene, 32);
            const before = skeleton.character.position.z;
            Run(scene, 1);

            // The run wrote before the walk's event stopped it: half of each, as the bindings mixed them.
            expect(skeleton.character.position.z - before).toBeCloseTo(0.5 * 2 * Tick + 0.5 * Tick, 6);
        });

        it("applies the step of a playback paused by its event after its clock wrote, and carries on when it resumes", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            const before = walkToEvent(rig, group, () => group.pause());
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(Tick, 6);

            Run(scene, 3);
            expect(rig.character.position.z - before).toBeCloseTo(Tick, 6);

            group.restart();
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(2 * Tick, 6);
        });

        it("does not read a jump made and reset from an event as motion", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group, controller } = Extract(rig);
            const before = walkToEvent(rig, group, () => {
                group.goToFrame(10);
                controller.reset();
            });
            // The clock wrote 30.72 before the jump; the reset forgets that evaluation rather than measuring from it.
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(0, 6);
            // The first evaluation after the reset says where the playback carries on from.
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(0, 6);
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(Tick, 6);
        });

        it("follows a weighted jump made between steps as the bindings do", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            group.weight = 0.8;
            Run(scene, 32);
            // Between steps: the binding this registers is still held when the next step's bindings are processed.
            const hips = animatableOf(group, rig.hips);
            hips.goToFrame(hips.getAnimations()[0].currentFrame, true);
            const before = rig.character.position.z;
            Run(scene, 1);

            // Two entries of 0.8 over 1.6: the whole binding, where the step's own write alone would be 0.8 of it.
            expect(rig.character.position.z - before).toBeCloseTo(Tick, 6);
        });

        it("catches up a clock the scene passed over after a callback removed the animatable before it", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            // Started first, this stops itself from its event, which compacts the scene's active animatables and makes
            // its loop pass over the animatable that followed: the clip's clock, for that one step.
            const still = stillGroup(rig.hips, { frame: 30, action: (target) => target.stop() });
            still.start(false);
            group.start(true);
            Run(scene, 32);
            const before = rig.character.position.z;
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(0, 6);

            // Its next evaluation catches the pose up, and the character with it.
            Run(scene, 1);
            expect(rig.character.position.z - before).toBeCloseTo(2 * Tick, 6);
        });

        it("finishes the cycle a looping playback was in when it stops looping", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            // Frame 90.24: 30.24 into the second cycle.
            Run(scene, 95);
            const before = rig.character.position.z;
            for (const animatable of group.animatables) {
                animatable.loopAnimation = false;
            }
            Run(scene, 1);

            // A playback that no longer loops is taken to the end of its range, cycles already passed and all.
            expect(rig.character.position.z - before).toBeCloseTo(((CycleFrames - 30.24) / CycleFrames) * Speed, 5);
        });

        it("applies nothing for a playback that ended while it was parked at a weight of zero", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(false);
            Run(scene, 20);
            const before = rig.character.position.z;
            group.weight = 0;
            // Parked for longer than the playback lasts: it ends unseen, and none of it is the character's.
            Run(scene, 80);
            group.weight = 1;
            Run(scene, 1);

            expect(group.isStarted).toBe(false);
            expect(rig.character.position.z - before).toBeCloseTo(0, 6);
        });
    });

    describe("errors", () => {
        it("refuses a group that animates the character node", () => {
            const rig = BuildRig(scene, "rootMotion");
            const characterAnimation = new Animation("character", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            characterAnimation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: CycleFrames, value: Vector3.Zero() },
            ]);
            rig.group.addTargetedAnimation(characterAnimation, rig.character);

            expect(() => new RootMotionClip(rig.group, { rootNode: rig.hips })).toThrow(/character node/);
        });

        it("accepts a group that scales the character node", () => {
            const rig = BuildRig(scene, "rootMotion");
            const scaling = new Animation("scaling", "scaling", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            scaling.setKeys([
                { frame: 0, value: Vector3.One() },
                { frame: CycleFrames, value: Vector3.One() },
            ]);
            rig.group.addTargetedAnimation(scaling, rig.character);

            expect(() => new RootMotionClip(rig.group, { rootNode: rig.hips })).not.toThrow();
        });

        it("refuses a group that animates no transform node", () => {
            const target = { value: 0 };
            const animation = new Animation("value", "value", Fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: CycleFrames, value: 1 },
            ]);
            const group = new AnimationGroup("values", scene);
            group.addTargetedAnimation(animation, target);

            expect(() => new RootMotionClip(group)).toThrow(/transform node/);
        });

        it("refuses a root with no parent to carry its motion", () => {
            const hips = new TransformNode("hips", scene);
            const animation = new Animation("hips", "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            animation.setKeys([
                { frame: 0, value: Vector3.Zero() },
                { frame: CycleFrames, value: new Vector3(0, 0, Speed) },
            ]);
            const group = new AnimationGroup("loose", scene);
            group.addTargetedAnimation(animation, hips);

            expect(() => new RootMotionClip(group)).toThrow(/no parent/);
        });

        it("refuses to take the travel from a root the group does not animate", () => {
            const rig = BuildRig(scene, "inPlace");
            expect(() => new RootMotionClip(rig.group, { rootNode: rig.armature, source: RootMotionSource.Root })).toThrow(/no position animation/);
        });

        it("refuses a root with nothing animated under it", () => {
            const rig = BuildRig(scene, "inPlace");
            const loose = new TransformNode("loose", scene);
            loose.parent = rig.character;
            expect(() => new RootMotionClip(rig.group, { rootNode: loose })).toThrow(/nor any node under it/);
        });

        it("keeps a controller to the clips of its own character", () => {
            const first = BuildRig(scene, "rootMotion");
            const second = BuildRig(scene, "rootMotion");
            const clip = new RootMotionClip(first.group);
            const controller = new RootMotionController(first.character, [clip]);

            expect(() => new RootMotionController(second.character, [clip])).toThrow(/belongs to another controller/);
            controller.removeClip(clip);
            expect(() => new RootMotionController(second.character, [clip])).toThrow(/moves "character", not "character"/);
        });

        for (const property of ["rotationQuaternion", "rotation", "position.z"]) {
            it(`refuses a group that animates the character node's ${property}`, () => {
                const rig = BuildRig(scene, "rootMotion");
                const isQuaternion = property === "rotationQuaternion";
                const animation = new Animation(
                    property,
                    property,
                    Fps,
                    isQuaternion ? Animation.ANIMATIONTYPE_QUATERNION : property === "rotation" ? Animation.ANIMATIONTYPE_VECTOR3 : Animation.ANIMATIONTYPE_FLOAT,
                    Animation.ANIMATIONLOOPMODE_CYCLE
                );
                const rest = isQuaternion ? Quaternion.Identity() : property === "rotation" ? Vector3.Zero() : 0;
                animation.setKeys([
                    { frame: 0, value: rest },
                    { frame: CycleFrames, value: rest },
                ]);
                rig.group.addTargetedAnimation(animation, rig.character);

                expect(() => new RootMotionClip(rig.group, { rootNode: rig.hips })).toThrow(/character node/);
            });
        }

        it("refuses an animated node passed as the character node, even one detection would take for the root", () => {
            const rig = BuildRig(scene, "rootMotion");
            // The hips: position-animated with the most descendants, so detection would elect them as the root.
            expect(() => new RootMotionClip(rig.group, { characterNode: rig.hips })).toThrow(/character node/);
        });

        it("measures and moves in the space of a character node passed explicitly", () => {
            const rig = BuildRig(scene, "rootMotion");
            const clip = new RootMotionClip(rig.group, { characterNode: rig.armature });
            new RootMotionController(rig.armature, [clip]);
            clip.animationGroup.start(true);
            Run(scene, 63);

            // The armature is scaled by a half, so the travel is twice as long in its own units - and applied to its
            // position, in its parent's space, through that scaling, so the world travel is the same.
            expect(clip.characterNode).toBe(rig.armature);
            expect(clip.cycleDistance).toBeCloseTo(2 * Speed, 3);
            expect(rig.character.position.length()).toBe(0);
            expect(rig.armature.position.length()).toBeCloseTo(Walked(63), 3);
        });
    });

    describe("verified corners", () => {
        it("reads the far end of a yoyo swing as the whole range", () => {
            for (const speedRatio of [1.25, -1.25]) {
                const rig = BuildRig(scene, "rootMotion");
                SetLoopMode(rig.group, Animation.ANIMATIONLOOPMODE_YOYO);
                const { group } = Extract(rig);
                group.start(true, speedRatio);
                // On the 26th tick the swing is exactly at its far end, which the frame folds onto the start.
                Run(scene, 26);

                expect(rig.character.position.z).toBeCloseTo(Math.sign(speedRatio) * Speed, 6);
            }
        });

        it("gives a weighted group dropped to zero its last evaluation, replacing an unweighted one for that step", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(true);
            runClip.animationGroup.start(true);
            runClip.animationGroup.weight = 0.5;
            Run(scene, 20);
            const before = skeleton.character.position.z;
            expect(before).toBeCloseTo(0.5 * Walked(20, 2), 6);

            // Babylon still evaluates the group once at weight zero, and its binding replaces the unweighted walk's pose.
            runClip.animationGroup.weight = 0;
            Run(scene, 1);
            expect(skeleton.character.position.z).toBeCloseTo(before, 6);
            // Parked from then on, the walk writes alone.
            Run(scene, 10);
            expect(skeleton.character.position.z).toBeCloseTo(before + 10 * Speed * 0.016, 6);
        });

        it("keeps a clip continuous through a single step at weight zero", () => {
            const rig = BuildRig(scene, "rootMotion");
            const { group } = Extract(rig);
            group.start(true);
            group.weight = 0.8;
            Run(scene, 20);
            group.weight = 0;
            Run(scene, 1);
            group.weight = 0.8;
            Run(scene, 10);

            expect(rig.character.position.z).toBeCloseTo(0.8 * (29 * Speed * 0.016), 6);
        });

        it("blends two weighted clips adding up to less than one without normalizing", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion", { name: "walk" });
            const run = AddGait(skeleton, "rootMotion", { name: "run", speed: 2 });
            const walkClip = new RootMotionClip(walk.group);
            const runClip = new RootMotionClip(run.group);
            new RootMotionController(skeleton.character, [walkClip, runClip]);
            walkClip.animationGroup.start(true);
            runClip.animationGroup.start(true);
            walkClip.animationGroup.weight = 0.3;
            runClip.animationGroup.weight = 0.3;
            Run(scene, 63);

            expect(skeleton.character.position.z).toBeCloseTo(0.3 * Walked(63) + 0.3 * Walked(63, 2), 6);
        });

        it("blends the turns of two turning clips as a weighted sum", () => {
            const skeleton = BuildSkeleton(scene);
            const quarter = AddGait(skeleton, "idle", { name: "quarter", turn: Math.PI / 2 });
            const eighth = AddGait(skeleton, "idle", { name: "eighth", turn: Math.PI / 4 });
            const quarterClip = new RootMotionClip(quarter.group);
            const eighthClip = new RootMotionClip(eighth.group);
            const controller = new RootMotionController(skeleton.character, [quarterClip, eighthClip]);
            let turned = 0;
            controller.onRootMotionObservable.add(() => (turned += controller.deltaRotation));
            quarterClip.animationGroup.start(true);
            eighthClip.animationGroup.start(true);
            quarterClip.animationGroup.weight = 0.8;
            eighthClip.animationGroup.weight = 0.8;
            Run(scene, 63);

            const expected = 0.5 * (Math.PI / 2 + Math.PI / 4) * ((62 * FramesPerTick) / CycleFrames);
            expect(turned).toBeCloseTo(expected, 6);
            expect(skeleton.character.rotationQuaternion!.toEulerAngles().y).toBeCloseTo(expected, 6);
        });

        it("gives an unweighted group started on the step a playback ends the last word", () => {
            const skeleton = BuildSkeleton(scene);
            const walk = AddGait(skeleton, "rootMotion");
            const idle = AddGait(skeleton, "idle");
            const { group } = Extract(walk);
            group.start(false);
            Run(scene, 63);
            // Started between the last advancing step and the end: appended after the walk, it writes the root last.
            idle.group.start(true);
            Run(scene, 1);

            expect(group.isStarted).toBe(false);
            expect(skeleton.character.position.z).toBeCloseTo(Walked(63), 6);
        });

        it("lands a turning clip that does not loop on its final facing", () => {
            const rig = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
            const { group } = Extract(rig);
            group.start(false);
            Run(scene, 70);

            expect(group.isStarted).toBe(false);
            expect(rig.character.rotationQuaternion!.toEulerAngles().y).toBeCloseTo(Math.PI / 2, 6);
        });

        it("plays the in-place group over the source's range when that was trimmed inside its keys", () => {
            const rig = BuildRig(scene, "rootMotion");
            rig.group.to = 50;
            const { clip, group } = Extract(rig);

            expect(clip.toFrame).toBe(50);
            expect(group.to).toBe(50);
            group.start(true);
            Run(scene, 130);
            // 129 ticks of 0.96 frames over a 50 frame stride of 1.0 units; the hips' sway leaves the range a little off +Z.
            expect(rig.character.position.z).toBeCloseTo((129 * FramesPerTick * Speed) / CycleFrames, 2);
        });

        it("keeps the events of a channel it clones without rewriting", () => {
            const rig = BuildRig(scene, "inPlace");
            let fired = 0;
            rig.hipsAnimation.addEvent(new AnimationEvent(30, () => fired++));
            const clip = new RootMotionClip(rig.group, { cloneAnimations: true });
            expect(ChannelOf(clip.animationGroup, rig.hips, "position")).not.toBe(rig.hipsAnimation);
            new RootMotionController(rig.character, [clip]);
            clip.animationGroup.start(true);
            Run(scene, 40);

            expect(fired).toBe(1);
        });

        it("composes cycles in closed form exactly as one by one", () => {
            const rig = BuildRig(scene, "rootMotion", { turn: Math.PI / 2 });
            const clip = new RootMotionClip(rig.group);
            for (const cycles of [7, 1000, -3]) {
                const closed = new Vector3();
                const yaw = clip._motionBetween(0, CycleFrames, 0, cycles * CycleFrames, closed);
                const step = clip.cycleOffset;
                const summed = Vector3.Zero();
                let turned = 0;
                for (let i = 0; i < Math.abs(cycles); i++) {
                    if (cycles > 0) {
                        summed.addInPlace(step.applyRotationQuaternion(Quaternion.RotationAxis(Vector3.Up(), turned)));
                        turned += clip.cycleRotation;
                    } else {
                        turned -= clip.cycleRotation;
                        summed.subtractInPlace(step.applyRotationQuaternion(Quaternion.RotationAxis(Vector3.Up(), turned)));
                    }
                }

                expect(yaw).toBeCloseTo(turned, 9);
                expect(Vector3.Distance(closed, summed)).toBeLessThan(1e-5);
            }
        });

        it("keeps a root off the character's axis in place while feet and a turn carry it round", () => {
            const rig = BuildRig(scene, "inPlace", { turn: Math.PI / 2, offset: 0.3 });
            const { clip, group } = Extract(rig);
            expect(clip.source).toBe(RootMotionSource.FootContact);
            expect(clip.extractsRotation).toBe(true);
            group.start(true);

            // Across the loop the hips must not pop: their world position moves by a tick's travel at most.
            Run(scene, 62);
            const before = FreshWorldMatrix(rig.hips).getTranslation();
            Run(scene, 2);
            const after = FreshWorldMatrix(rig.hips).getTranslation();
            expect(Vector3.Distance(before, after)).toBeLessThan(2.5 * Speed * 0.016 + 0.01);
            expect(HipsInCharacter(rig, 0, ChannelOf(group, rig.hips, "position")).x).toBeCloseTo(0.3, 3);
            expect(HipsInCharacter(rig, CycleFrames, ChannelOf(group, rig.hips, "position")).x).toBeCloseTo(0.3, 3);
        });
    });
});
