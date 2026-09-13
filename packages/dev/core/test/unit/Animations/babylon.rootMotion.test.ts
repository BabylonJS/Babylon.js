import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { RootMotion, RootMotionSource } from "core/Animations/rootMotion";
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

type Gait = "rootMotion" | "inPlace" | "idle";

interface IRig {
    character: TransformNode;
    armature: TransformNode;
    hips: TransformNode;
    leftFoot: TransformNode;
    rightFoot: TransformNode;
    group: AnimationGroup;
    hipsAnimation: Animation;
}

/**
 * Where a foot is in character space at a time of the walk cycle, for a character travelling along +Z at Speed.
 * Each foot is planted for half the cycle and swings, raised, for the other half.
 * @param time defines the time in seconds
 * @param side defines 1 for the left foot, -1 for the right foot
 * @returns the foot position in character space
 */
function FootInWalk(time: number, side: number): Vector3 {
    const half = CycleFrames / Fps / 2;
    const phase = (side === 1 ? time : time + half) % (half * 2);
    const plantedAt = side === 1 ? 0.3 : -0.3 + Speed * half;
    const cycleStart = Math.floor((side === 1 ? time : time + half) / (half * 2)) * Speed * half * 2 - (side === 1 ? 0 : Speed * half);
    if (phase <= half) {
        return new Vector3(0.1 * side, 0, cycleStart + plantedAt);
    }
    const swing = (phase - half) / half;
    return new Vector3(0.1 * side, 0.15 * Math.sin(Math.PI * swing), cycleStart + plantedAt + Speed * half * 2 * swing);
}

/**
 * Builds a character with a scaled, rotated armature - the shape of an FBX-converted glTF - whose hips and feet walk.
 * @param scene defines the scene
 * @param gait defines whether the hips carry the travel, the feet slide under still hips, or nothing travels
 * @param surge defines how far the hips lurch forwards and back twice a cycle, without travelling
 * @returns the rig
 */
function BuildRig(scene: Scene, gait: Gait, surge = 0): IRig {
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

    const toArmature = armature.computeWorldMatrix(true).clone().invert();
    const hipsKeys = [];
    const leftKeys = [];
    const rightKeys = [];
    for (let frame = 0; frame <= CycleFrames; frame++) {
        const time = frame / Fps;
        const travel = gait === "rootMotion" ? Speed * time : 0;
        const hipsInCharacter = new Vector3(
            SwayAmplitude * Math.sin((2 * Math.PI * frame) / CycleFrames),
            HipHeight,
            travel + surge * Math.sin((4 * Math.PI * frame) / CycleFrames)
        );
        let left = new Vector3(0.1, 0, 0);
        let right = new Vector3(-0.1, 0, 0);
        if (gait !== "idle") {
            const shift = gait === "rootMotion" ? 0 : Speed * time;
            left = FootInWalk(time, 1).subtractInPlace(new Vector3(0, 0, shift));
            right = FootInWalk(time, -1).subtractInPlace(new Vector3(0, 0, shift));
        }
        // Feet are children of the unrotated hips, so their local offset is the character space offset, unscaled.
        hipsKeys.push({ frame, value: Vector3.TransformCoordinates(hipsInCharacter, toArmature) });
        leftKeys.push({ frame, value: Vector3.TransformNormal(left.subtract(hipsInCharacter), toArmature) });
        rightKeys.push({ frame, value: Vector3.TransformNormal(right.subtract(hipsInCharacter), toArmature) });
    }

    const makeAnimation = (name: string, keys: { frame: number; value: Vector3 }[]) => {
        const animation = new Animation(name, "position", Fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        animation.setKeys(keys);
        return animation;
    };
    const group = new AnimationGroup(gait, scene);
    const hipsAnimation = makeAnimation("hips", hipsKeys);
    group.addTargetedAnimation(hipsAnimation, hips);
    group.addTargetedAnimation(makeAnimation("left", leftKeys), leftFoot);
    group.addTargetedAnimation(makeAnimation("right", rightKeys), rightFoot);
    group.normalize(0, CycleFrames);

    return { character, armature, hips, leftFoot, rightFoot, group, hipsAnimation };
}

/**
 * The hips position in character space at a frame, straight from the keys.
 * @param rig defines the rig
 * @param frame defines the frame
 * @returns the position in character space
 */
function HipsInCharacter(rig: IRig, frame: number): Vector3 {
    const toCharacter = rig.armature
        .computeWorldMatrix(true)
        .clone()
        .multiply(Matrix.Invert(rig.character.computeWorldMatrix(true)));
    return Vector3.TransformCoordinates(rig.hipsAnimation.evaluate(frame), toCharacter);
}

/**
 * Advances the scene's animations by a number of 16ms frames.
 * @param scene defines the scene
 * @param frames defines how many frames to run
 */
function Run(scene: Scene, frames: number): void {
    for (let i = 0; i < frames; i++) {
        scene.animate();
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
            const rootMotion = new RootMotion(rig.group);

            expect(rootMotion.source).toBe(RootMotionSource.Root);
            expect(rootMotion.rootNode).toBe(rig.hips);
            expect(rootMotion.characterNode).toBe(rig.character);
            expect(rootMotion.cycleDistance).toBeCloseTo(Speed, 3);
            expect(rootMotion.averageSpeed).toBeCloseTo(Speed, 3);
            expect(rootMotion.travelDirection.z).toBeCloseTo(1, 3);
        });

        it("removes the travel from the root keys but keeps the sway", () => {
            const rig = BuildRig(scene, "rootMotion");
            const start = HipsInCharacter(rig, 0);
            new RootMotion(rig.group);

            const end = HipsInCharacter(rig, CycleFrames);
            expect(end.z).toBeCloseTo(start.z, 4);
            expect(end.y).toBeCloseTo(start.y, 4);
            const quarter = HipsInCharacter(rig, CycleFrames / 4);
            expect(quarter.x).toBeCloseTo(SwayAmplitude, 4);
            expect(quarter.z).toBeCloseTo(start.z, 4);
        });

        it("removes lateral motion too when asked", () => {
            const rig = BuildRig(scene, "rootMotion");
            const start = HipsInCharacter(rig, 0);
            new RootMotion(rig.group, { extractLateralMotion: true });

            expect(HipsInCharacter(rig, CycleFrames / 4).x).toBeCloseTo(start.x, 4);
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
            new RootMotion(rig.group);

            const toCharacter = rig.armature.computeWorldMatrix(true);
            for (const key of keys) {
                expect(Vector3.TransformNormal(key.outTangent, toCharacter).length()).toBeCloseTo(0, 6);
            }
        });

        it("restores the keys on dispose", () => {
            const rig = BuildRig(scene, "rootMotion");
            const original = HipsInCharacter(rig, CycleFrames);
            const rootMotion = new RootMotion(rig.group);
            rootMotion.dispose();

            expect(HipsInCharacter(rig, CycleFrames).z).toBeCloseTo(original.z, 6);
        });
    });

    describe("foot contact fallback", () => {
        it("deduces the travel of an in-place clip from its feet", () => {
            const rig = BuildRig(scene, "inPlace");
            const rootMotion = new RootMotion(rig.group);

            expect(rootMotion.source).toBe(RootMotionSource.FootContact);
            expect(rootMotion.contactNodes).toContain(rig.leftFoot);
            expect(rootMotion.contactNodes).toContain(rig.rightFoot);
            expect(rootMotion.cycleDistance).toBeCloseTo(Speed, 2);
            expect(rootMotion.travelDirection.z).toBeCloseTo(1, 3);
        });

        it("does not mistake a large root surge for travel", () => {
            // A lurching walk: the hips surge further than the travel threshold but end the cycle where they began.
            const rig = BuildRig(scene, "inPlace", 0.3);
            const rootMotion = new RootMotion(rig.group);

            expect(rootMotion.source).toBe(RootMotionSource.FootContact);
        });

        it("leaves an in-place clip's keys untouched", () => {
            const rig = BuildRig(scene, "inPlace");
            const before = HipsInCharacter(rig, CycleFrames / 4);
            new RootMotion(rig.group);

            expect(HipsInCharacter(rig, CycleFrames / 4).asArray()).toEqual(before.asArray());
        });

        it("can be forced even when the root travels", () => {
            const rig = BuildRig(scene, "inPlace");
            const rootMotion = new RootMotion(rig.group, { source: RootMotionSource.FootContact, contactNodes: [rig.leftFoot, rig.rightFoot] });

            expect(rootMotion.source).toBe(RootMotionSource.FootContact);
        });
    });

    it("finds no travel in a clip that stands still", () => {
        const rig = BuildRig(scene, "idle");
        const rootMotion = new RootMotion(rig.group);
        rig.group.start(true);
        Run(scene, 100);

        expect(rootMotion.source).toBe(RootMotionSource.None);
        expect(rig.character.position.length()).toBe(0);
    });

    describe("runtime", () => {
        for (const gait of ["rootMotion", "inPlace"] as const) {
            it(`moves the character across loops (${gait})`, () => {
                const rig = BuildRig(scene, gait);
                new RootMotion(rig.group);
                rig.group.start(true);
                // 16ms frames: 125 of them are exactly two cycles.
                Run(scene, 126);

                expect(rig.character.position.z).toBeCloseTo(Speed * 2, 1);
                expect(rig.character.position.x).toBeCloseTo(0, 3);
            });
        }

        it("keeps the feet planted in world space", () => {
            const rig = BuildRig(scene, "rootMotion");
            new RootMotion(rig.group);
            rig.group.start(true);
            // Frame 5-25 of the cycle: the left foot is planted.
            Run(scene, 6);
            const planted = rig.leftFoot.computeWorldMatrix(true).getTranslation();
            Run(scene, 18);
            const later = rig.leftFoot.computeWorldMatrix(true).getTranslation();

            expect(Vector3.Distance(planted, later)).toBeLessThan(0.01);
        });

        it("travels in the character's world orientation and scale", () => {
            const rig = BuildRig(scene, "rootMotion");
            rig.character.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), Math.PI / 2);
            rig.character.scaling.setAll(2);
            new RootMotion(rig.group);
            rig.group.start(true);
            Run(scene, 126);

            expect(rig.character.position.x).toBeCloseTo(Speed * 4, 1);
            expect(rig.character.position.z).toBeCloseTo(0, 3);
        });

        it("follows speedRatio and weight", () => {
            const rig = BuildRig(scene, "rootMotion");
            new RootMotion(rig.group);
            rig.group.start(true, 2);
            rig.group.weight = 0.5;
            Run(scene, 63);

            // One second at double speed is two cycles, at half weight one cycle.
            expect(rig.character.position.z).toBeCloseTo(Speed, 1);
        });

        it("reports the travel without moving the character when not applied", () => {
            const rig = BuildRig(scene, "rootMotion");
            const rootMotion = new RootMotion(rig.group, { applyToCharacter: false });
            let travelled = 0;
            rootMotion.onRootMotionObservable.add(() => (travelled += rootMotion.deltaPosition.z));
            rig.group.start(true);
            Run(scene, 63);

            expect(rig.character.position.z).toBe(0);
            expect(travelled).toBeCloseTo(Speed, 1);
        });

        it("stops moving the character after dispose", () => {
            const rig = BuildRig(scene, "rootMotion");
            const rootMotion = new RootMotion(rig.group);
            rig.group.start(true);
            Run(scene, 30);
            rootMotion.dispose();
            const stopped = rig.character.position.z;
            Run(scene, 30);

            expect(rig.character.position.z).toBe(stopped);
        });
    });
});
