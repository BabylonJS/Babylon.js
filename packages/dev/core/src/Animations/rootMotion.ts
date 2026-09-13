import {
    type Animatable,
    type AnimationGroup,
    type Bone,
    type IAnimationKey,
    type IDisposable,
    type Node,
    type Nullable,
    type Observer,
    type RuntimeAnimation,
    type Scene,
} from "core/index";
import { Animation } from "./animation.pure";
import { Matrix, Quaternion, TmpVectors, Vector3 } from "../Maths/math.vector.pure";
import { Observable } from "../Misc/observable.pure";
import { Logger } from "../Misc/logger";
import { TransformNode } from "../Meshes/transformNode.pure";
import { AbstractMesh } from "../Meshes/abstractMesh.pure";

/**
 * Where the travel of a {@link RootMotion} comes from.
 */
export const enum RootMotionSource {
    /**
     * No motion was found: the clip neither moves its root nor walks its contact nodes.
     */
    None = 0,
    /**
     * The root node's own animation - the clip's ground truth. Its travel (and turning, when extracted) is removed
     * from the root's keys, so the clip plays in place, and applied to the character node instead.
     */
    Root = 1,
    /**
     * Deduced from the contact nodes (usually the feet) of an in-place clip: whatever a planted contact gives up in
     * character space, the character travels. The travel is not in the clip, so no translation is removed from it.
     */
    FootContact = 2,
}

/**
 * Options for {@link RootMotion}.
 */
export interface IRootMotionOptions {
    /**
     * The node that carries the motion, usually the hips or a dedicated root bone. A bone is resolved to its linked
     * transform node. Defaults to the position-animated node with the most animated descendants in the group.
     */
    rootNode?: TransformNode | Bone;
    /**
     * The node that receives the motion and whose local space the motion is measured in. Defaults to the topmost
     * ancestor of the root node (the "__root__" node of a glTF asset).
     */
    characterNode?: TransformNode;
    /**
     * The nodes that touch the ground, used when the root does not travel. A bone is resolved to its linked
     * transform node. Defaults to the leaf nodes under the root that come closest to the ground during the clip.
     */
    contactNodes?: Array<TransformNode | Bone>;
    /**
     * Forces the source of the travel instead of trying {@link RootMotionSource.Root} first and falling back to
     * {@link RootMotionSource.FootContact}.
     */
    source?: RootMotionSource;
    /**
     * Whether the root's turning about the up axis is extracted and applied to the character. By default it is when
     * a cycle leaves the character facing at least {@link IRootMotionOptions.minimumTurn} away from where it started,
     * so a walk's hip twist - or a dance that spins round to face the front again - stays in the pose while a turning
     * clip turns the character.
     */
    extractRotation?: boolean;
    /**
     * How densely the clip is sampled during analysis. Default is 60 samples per second of animation.
     */
    samplesPerSecond?: number;
    /**
     * Travel below this share of the character's height over a cycle is treated as the clip standing still: root
     * sway rather than root motion. Default is 0.1.
     */
    minimumTravel?: number;
    /**
     * Turning below this angle over a cycle, in radians, is treated as twist rather than a turn. Default is 10 degrees.
     */
    minimumTurn?: number;
    /**
     * A straight clip whose direction of travel is within this angle of a character space axis, in radians, travels
     * along that axis; 0 keeps the measured direction. Ignored when lateral motion is extracted.
     *
     * By default a root clip keeps its direction (0): its travel is authored or captured, and a deliberate veer is data.
     * Travel deduced from contacts snaps within 10 degrees: an in-place clip is meant to travel straight, and the
     * deduced direction is an estimate - Xbot's run deduces 3.5 degrees off straight from feet that slide 1 degree off.
     */
    directionSnapAngle?: number;
    /**
     * When false (the default) only the travel along the clip's direction of travel is extracted, leaving the
     * side-to-side sway of the root in the animation. Set to true to extract all horizontal motion, for strafing
     * clips. Turning clips always extract all horizontal motion, since their direction of travel changes.
     */
    extractLateralMotion?: boolean;
    /**
     * The up axis in character space. Default is +Y.
     */
    upAxis?: Vector3;
    /**
     * Whether the motion is applied to the character node every frame. Default is true. Set to false to consume
     * {@link RootMotion.deltaPosition} and {@link RootMotion.deltaRotation} yourself, for example to drive a
     * physics character controller.
     */
    applyToCharacter?: boolean;
}

interface INodeChannels {
    position?: Animation;
    rotationQuaternion?: Animation;
    rotation?: Animation;
    scaling?: Animation;
}

interface IKeyRecord {
    key: IAnimationKey;
    value: any;
    inTangent: any;
    outTangent: any;
}

/** Contact candidates must come this close to the lowest one during the clip, as a share of the character's height. */
const ContactHeightBand = 0.1;
/** A contact counts as on the ground within this share of the character's height above its own lowest point. */
const PlantedHeightBand = 0.05;
/** Values per sample in the motion track: translation x, y, z and the turn about the up axis. */
const TrackStride = 4;
/**
 * Deduced travel counts only if its steps mostly head the same way: net travel over the length of the path stepped.
 * Walks and runs measure 0.99 and more; a dance or an idle that shuffles about on the spot measures under 0.3.
 */
const MinimumStraightness = 0.8;
/** Default snap of a direction of travel deduced from contacts, in radians. */
const DeducedDirectionSnapAngle = Math.PI / 18;
/** Whole cycles composed in a single step at most; beyond that a step is not playback anyone can see. */
const MaxCyclesPerStep = 1000;
/** Frame step for the numeric tangents of rewritten cubic spline keys. */
const TangentDelta = 1e-3;

/**
 * Root motion for an animation group: moves and turns a character by the motion its animation covers, so the feet stay
 * planted instead of skating.
 *
 * The clip is analyzed once, when the RootMotion is created, without playing it or touching its playback state:
 * 1. The root node's own animation is tried first, as the ground truth. If the root ends a cycle a meaningful distance
 *    from where it started, that travel is removed from its keys - the clip then plays in place and loops without
 *    snapping back - and applied to the character node instead. Turning is read from the root the same way.
 * 2. Otherwise the clip is treated as an in-place cycle and the travel is deduced from its contact nodes: a planted
 *    contact stays put in the world, so in character space it moves opposite to the character, and whatever it gives
 *    up the character gains. The direction of travel falls out of the same measurement, so the forward axis of
 *    the rig does not have to be known.
 *
 * At runtime the motion follows the group's own playhead after animations are evaluated each frame, so pausing,
 * speedRatio, looping (forwards and backwards) and weighted blending between groups all carry the character
 * consistently with the pose. Call {@link RootMotion.reset} after jumping the group with goToFrame.
 *
 * Extract before starting the group: the root's keys are rewritten in place, which affects every group sharing those
 * animations. {@link RootMotion.dispose} restores them.
 */
export class RootMotion implements IDisposable {
    /**
     * Gets or sets whether the motion is applied to the character node every frame.
     */
    public applyToCharacter: boolean;

    /**
     * Notified every frame the character moves, after {@link RootMotion.deltaPosition} and
     * {@link RootMotion.deltaRotation} are updated.
     */
    public readonly onRootMotionObservable = new Observable<RootMotion>();

    private readonly _group: AnimationGroup;
    private readonly _upAxis: Vector3;
    private readonly _extractLateral: boolean;
    private readonly _directionSnapAngle: number | undefined;
    /** Sideways travel over a cycle left in the root's keys after snapping the direction, removed without being applied. */
    private readonly _lateralDrift = Vector3.Zero();
    private readonly _channels = new Map<Node, INodeChannels>();
    private _source = RootMotionSource.None;
    private _rootNode: Nullable<TransformNode> = null;
    private _characterNode: Nullable<TransformNode> = null;
    private _contactNodes: TransformNode[] = [];
    private readonly _travelDirection = new Vector3(0, 0, 1);
    private readonly _cycleOffset = Vector3.Zero();
    private _cycleRotation = 0;
    private _turns = false;
    private readonly _deltaPosition = Vector3.Zero();
    private _deltaRotation = 0;
    private _duration = 0;
    private _characterHeight = 0;
    private _fromFrame = 0;
    private _toFrame = 0;
    private _sampleCount = 1;
    private _track = new Float32Array(2 * TrackStride);
    private _restoredKeys: IKeyRecord[] = [];
    private _observer: Nullable<Observer<Scene>> = null;
    /** Whether the root's own travel is removed from its keys - not so for a clip that only turns on the spot. */
    private _removesRootTravel = false;
    /** The animation whose playback drives the motion: the root's own, so its frame rate and range are the motion's. */
    private _clockAnimation: Nullable<Animation> = null;
    private _clockRuntime: Nullable<RuntimeAnimation> = null;
    private _clockAnimatable: Nullable<Animatable> = null;
    private _clockIndex = -1;
    private _lastProgress: Nullable<number> = null;
    private _sampleBlend = 0;
    private readonly _lastOffset = Vector3.Zero();
    private readonly _currentOffset = Vector3.Zero();
    private readonly _rangeStart = Vector3.Zero();
    private readonly _rangeCycle = Vector3.Zero();
    private readonly _cyclesOffset = Vector3.Zero();
    private readonly _yawQuaternion = new Quaternion();
    private readonly _yawMatrix = new Matrix();

    /**
     * Where the travel comes from. {@link RootMotionSource.None} when no motion was found.
     */
    public get source(): RootMotionSource {
        return this._source;
    }

    /**
     * The node that carries the motion, if one was found.
     */
    public get rootNode(): Nullable<TransformNode> {
        return this._rootNode;
    }

    /**
     * The node that receives the motion.
     */
    public get characterNode(): Nullable<TransformNode> {
        return this._characterNode;
    }

    /**
     * The contact nodes used to deduce the travel. Empty unless the source is {@link RootMotionSource.FootContact}.
     */
    public get contactNodes(): ReadonlyArray<TransformNode> {
        return this._contactNodes;
    }

    /**
     * The direction the clip travels in over a cycle, in character space (unit length).
     */
    public get travelDirection(): Vector3 {
        return this._travelDirection;
    }

    /**
     * The travel covered by one cycle of the clip, in character space.
     */
    public get cycleOffset(): Vector3 {
        return this._cycleOffset;
    }

    /**
     * The distance covered by one cycle of the clip along the direction of travel, in character space units.
     */
    public get cycleDistance(): number {
        return Vector3.Dot(this._cycleOffset, this._travelDirection);
    }

    /**
     * The turn covered by one cycle of the clip about the up axis, in radians. Zero unless rotation is extracted.
     */
    public get cycleRotation(): number {
        return this._cycleRotation;
    }

    /**
     * Whether the root's turning is extracted and applied to the character.
     */
    public get extractsRotation(): boolean {
        return this._turns;
    }

    /**
     * The length of one cycle of the clip in seconds, at a speed ratio of 1.
     */
    public get duration(): number {
        return this._duration;
    }

    /**
     * The speed the clip implies at a speed ratio of 1, in character space units per second.
     */
    public get averageSpeed(): number {
        return this._duration > 0 ? this.cycleDistance / this._duration : 0;
    }

    /**
     * The vertical extent of the animated hierarchy at the first frame, in character space units. Thresholds are
     * relative to it.
     */
    public get characterHeight(): number {
        return this._characterHeight;
    }

    /**
     * The travel applied during the last frame, in world space.
     */
    public get deltaPosition(): Vector3 {
        return this._deltaPosition;
    }

    /**
     * The turn applied during the last frame about the character's up axis, in radians, in character space.
     */
    public get deltaRotation(): number {
        return this._deltaRotation;
    }

    /**
     * Analyzes an animation group and starts applying its motion to the character node.
     * @param animationGroup defines the animation group to extract the root motion of
     * @param options defines how the root motion is extracted and applied
     */
    public constructor(animationGroup: AnimationGroup, options: IRootMotionOptions = {}) {
        this._group = animationGroup;
        this._upAxis = (options.upAxis ?? Vector3.UpReadOnly).normalizeToNew();
        this._extractLateral = !!options.extractLateralMotion;
        this._directionSnapAngle = options.directionSnapAngle;
        this.applyToCharacter = options.applyToCharacter ?? true;

        const targetedAnimations = animationGroup.targetedAnimations;
        if (!targetedAnimations.length) {
            Logger.Warn(`RootMotion: animation group "${animationGroup.name}" has no animations.`);
            return;
        }

        for (const targetedAnimation of targetedAnimations) {
            const target = targetedAnimation.target;
            const property = targetedAnimation.animation.targetProperty;
            if (!(target instanceof TransformNode)) {
                continue;
            }
            if (property === "position" || property === "rotationQuaternion" || property === "rotation" || property === "scaling") {
                let channels = this._channels.get(target);
                if (!channels) {
                    channels = {};
                    this._channels.set(target, channels);
                }
                channels[property] = targetedAnimation.animation;
            }
        }

        this._rootNode = options.rootNode ? this._resolveNode(options.rootNode) : this._findRootNode();
        this._characterNode = options.characterNode ?? null;
        const anchor = this._rootNode ?? this._firstAnimatedNode();
        if (!anchor) {
            Logger.Warn(`RootMotion: animation group "${animationGroup.name}" does not animate any transform node.`);
            return;
        }
        if (!this._characterNode || this._characterNode === anchor || !anchor.isDescendantOf(this._characterNode)) {
            if (this._characterNode) {
                Logger.Warn(`RootMotion: the character node must be an ancestor of the root node; using the topmost ancestor instead.`);
            }
            this._characterNode = this._topmostAncestor(anchor);
        }
        if (this._characterNode === anchor) {
            Logger.Warn(`RootMotion: the root node "${anchor.name}" has no parent to carry its motion.`);
            this._rootNode = null;
            return;
        }

        const characterChannels = this._channels.get(this._characterNode);
        if (characterChannels?.position || characterChannels?.rotationQuaternion || characterChannels?.rotation) {
            Logger.Warn(
                `RootMotion: animation group "${animationGroup.name}" animates the character node "${this._characterNode.name}" itself, which will overwrite the motion applied to it. Give a parent of it as the characterNode.`
            );
        }

        // The motion runs on the root's own animation - its frame rate, and at runtime its playback - rather than whichever
        // track happens to be first in the group, which could be a morph target at another frame rate.
        const anchorChannels = this._channels.get(anchor)!;
        this._clockAnimation = anchorChannels.position ?? anchorChannels.rotationQuaternion ?? anchorChannels.rotation ?? anchorChannels.scaling ?? null;
        this._fromFrame = animationGroup.from;
        this._toFrame = animationGroup.to;
        const framePerSecond = this._clockAnimation?.framePerSecond ?? targetedAnimations[0].animation.framePerSecond;
        this._duration = framePerSecond > 0 ? (this._toFrame - this._fromFrame) / framePerSecond : 0;
        this._sampleCount = Math.max(2, Math.ceil(this._duration * (options.samplesPerSecond ?? 60)));

        this._characterHeight = this._measureHeight(this._rootNode ?? this._characterNode);
        const scale = this._characterHeight > 0 ? this._characterHeight : 1;
        const minimumTravel = (options.minimumTravel ?? 0.1) * scale;
        const minimumTurn = options.minimumTurn ?? Math.PI / 18;
        const source = options.source;
        const root = this._rootNode;
        const rootChannels = root ? this._channels.get(root) : undefined;
        const samples = this._sampleCount;

        // Turning is only ever in the root's own rotation.
        let yaw: Nullable<Float32Array> = null;
        if (root && options.extractRotation !== false && (rootChannels?.rotationQuaternion || rootChannels?.rotation)) {
            const measured = this._measureRootYaw();
            // By the turn a loop leaves the character facing: a dance that spins twice ends facing the way it began and
            // loops seamlessly as it is, while a 90 degree turn has to carry the character round.
            if (options.extractRotation === true || Math.abs(WrapAngle(measured[samples])) >= minimumTurn) {
                yaw = measured;
            }
        }
        this._turns = !!yaw;

        let translation: Nullable<Float32Array> = null;
        if ((source === undefined || source === RootMotionSource.Root) && root && rootChannels?.position) {
            translation = this._measureRootTravel(yaw, minimumTravel, source === RootMotionSource.Root);
            if (translation) {
                this._source = RootMotionSource.Root;
                this._removesRootTravel = true;
            }
        }
        if (!translation && (source === undefined || source === RootMotionSource.FootContact)) {
            translation = this._measureContactTravel(yaw, options.contactNodes, minimumTravel, source === RootMotionSource.FootContact);
            if (translation) {
                this._source = RootMotionSource.FootContact;
            }
        }
        if (!translation && yaw) {
            // Turning on the spot: the root keeps its travel, sway included; only the turn is taken out.
            translation = new Float32Array((samples + 1) * 3);
            this._source = RootMotionSource.Root;
        }
        if (!translation) {
            this._turns = false;
            this._travelDirection.set(0, 0, 1);
            this._lateralDrift.setAll(0);
            return;
        }

        this._track = new Float32Array((samples + 1) * TrackStride);
        for (let i = 0; i <= samples; i++) {
            this._track[i * TrackStride] = translation[i * 3];
            this._track[i * TrackStride + 1] = translation[i * 3 + 1];
            this._track[i * TrackStride + 2] = translation[i * 3 + 2];
            this._track[i * TrackStride + 3] = yaw ? yaw[i] : 0;
        }
        this._cycleOffset.fromArray(translation, samples * 3);
        this._cycleRotation = yaw ? yaw[samples] : 0;

        if (root && (this._removesRootTravel || yaw)) {
            this._stripRootKeys();
        }

        this._observer = animationGroup.getScene().onAfterAnimationsObservable.add(() => this._update());
    }

    /**
     * Gets the travel reached at a frame of the clip, relative to its first frame, in character space.
     * @param frame defines the frame to sample
     * @param result defines the vector receiving the travel
     * @returns the result vector
     */
    public getOffsetAtFrame(frame: number, result: Vector3): Vector3 {
        const a = this._sampleAt(frame) * TrackStride;
        const b = a + TrackStride;
        const blend = this._sampleBlend;
        const track = this._track;
        return result.set(track[a] + (track[b] - track[a]) * blend, track[a + 1] + (track[b + 1] - track[a + 1]) * blend, track[a + 2] + (track[b + 2] - track[a + 2]) * blend);
    }

    /**
     * Gets the turn reached at a frame of the clip about the up axis, relative to its first frame, in radians.
     * @param frame defines the frame to sample
     * @returns the turn in radians
     */
    public getRotationAtFrame(frame: number): number {
        const a = this._sampleAt(frame) * TrackStride + 3;
        return this._track[a] + (this._track[a + TrackStride] - this._track[a]) * this._sampleBlend;
    }

    /**
     * Forgets the last frame the motion was measured from. Call after jumping the group with goToFrame or resetting it,
     * so the jump is not read as motion. Starting the group again needs no reset.
     */
    public reset(): void {
        this._lastProgress = null;
        this._deltaPosition.setAll(0);
        this._deltaRotation = 0;
    }

    /**
     * Stops applying the motion and restores the root keys rewritten during extraction.
     */
    public dispose(): void {
        this._observer?.remove();
        this._observer = null;
        for (const record of this._restoredKeys) {
            record.key.value = record.value;
            record.key.inTangent = record.inTangent;
            record.key.outTangent = record.outTangent;
        }
        this._restoredKeys.length = 0;
        this.onRootMotionObservable.clear();
    }

    private _update(): void {
        const group = this._group;
        const character = this._characterNode;
        const clock = group.isStarted && character ? this._findClock() : null;
        if (!clock || !character) {
            this._clockRuntime = null;
            this.reset();
            return;
        }
        // A runtime animation belongs to one playback: a different one means the group was started again - possibly
        // stopped and started between two frames - and nothing has travelled in the new playback yet.
        if (clock !== this._clockRuntime) {
            this._clockRuntime = clock;
            this.reset();
        }

        const animatable = this._clockAnimatable!;
        const from = Math.max(this._fromFrame, Math.min(animatable.fromFrame, animatable.toFrame));
        const to = Math.min(this._toFrame, Math.max(animatable.fromFrame, animatable.toFrame));
        const range = to - from;
        // Looping playback is followed by its unwrapped progress, so whole cycles are counted rather than guessed from two
        // wrapped frames: several can pass in one step, or exactly one, leaving the frame where it was. A yoyo swings back
        // and forth within the range and a playback that does not loop stops at its end, so both follow the frame alone.
        const counted = animatable.loopAnimation && range > 0 && clock._animationState.loopMode !== Animation.ANIMATIONLOOPMODE_YOYO;
        const progress = counted ? (clock._coreRuntimeAnimation ?? clock)._absoluteFrame : clock.currentFrame;
        const lastProgress = this._lastProgress;
        this._lastProgress = progress;
        if (lastProgress === null || progress === lastProgress) {
            this._deltaPosition.setAll(0);
            this._deltaRotation = 0;
            return;
        }

        let lastFrame = lastProgress;
        let frame = progress;
        let cycles = 0;
        if (counted) {
            const lastCycle = Math.floor(lastProgress / range);
            const cycle = Math.floor(progress / range);
            lastFrame = from + lastProgress - lastCycle * range;
            frame = from + progress - cycle * range;
            cycles = cycle - lastCycle;
        }

        // The motion within the played range, relative to its start - a range played on its own loops by its own stride,
        // not the whole clip's. Each motion is a turn and then a translation, in character space.
        const startYaw = this.getRotationAtFrame(from);
        const startOffset = this.getOffsetAtFrame(from, this._rangeStart);
        const lastYaw = this._motionInRange(lastFrame, startYaw, startOffset, this._lastOffset);
        let yaw = this._motionInRange(frame, startYaw, startOffset, this._currentOffset);
        const offset = this._currentOffset;

        if (cycles !== 0) {
            // Whole cycles passed: now = cycle^cycles, then the motion within the range.
            let stepYaw = this._motionInRange(to, startYaw, startOffset, this._rangeCycle);
            if (cycles < 0) {
                this._rotateAboutUp(this._rangeCycle, -stepYaw, this._rangeCycle).scaleInPlace(-1);
                stepYaw = -stepYaw;
            }
            let cyclesYaw = 0;
            this._cyclesOffset.setAll(0);
            const count = Math.min(Math.abs(cycles), MaxCyclesPerStep);
            for (let i = 0; i < count; i++) {
                this._cyclesOffset.addInPlace(this._rotateAboutUp(this._rangeCycle, cyclesYaw, TmpVectors.Vector3[9]));
                cyclesYaw += stepYaw;
            }
            this._rotateAboutUp(offset, cyclesYaw, offset).addInPlace(this._cyclesOffset);
            yaw += cyclesYaw;
        }

        // Relative to where the character is now: undo the turn it already made.
        const delta = this._rotateAboutUp(offset.subtractInPlace(this._lastOffset), -lastYaw, offset);
        let deltaYaw = yaw - lastYaw;
        // A weighted group contributes its share, so blended groups add up to the blended pose.
        if (group.weight >= 0) {
            delta.scaleInPlace(group.weight);
            deltaYaw *= group.weight;
        }
        this._deltaRotation = deltaYaw;

        // Into the character's parent space through its own local rotation and scaling, not its world matrix: world
        // matrices are cached per render, so with fixed animation steps every step after the first in a frame would read
        // the facing from before the previous step's turn.
        const rotation = character.rotationQuaternion ?? Quaternion.FromEulerVectorToRef(character.rotation, TmpVectors.Quaternion[2]);
        Matrix.ComposeToRef(character.scaling, rotation, Vector3.ZeroReadOnly, TmpVectors.Matrix[3]);
        const parentDelta = Vector3.TransformNormalToRef(delta, TmpVectors.Matrix[3], TmpVectors.Vector3[4]);
        const parent = character.parent;
        if (parent) {
            Vector3.TransformNormalToRef(parentDelta, parent.computeWorldMatrix(), this._deltaPosition);
        } else {
            this._deltaPosition.copyFrom(parentDelta);
        }

        if (this.applyToCharacter) {
            // Assigned rather than changed in place, so the node is marked dirty and renders where it now is.
            character.position = character.position.addInPlace(parentDelta);
            if (deltaYaw !== 0) {
                // The turn happens in character space, before the character's own scaling. A mirroring scale (the
                // handedness flip on a glTF __root__) reverses the sense of a turn once it is past that scaling.
                const scaling = character.scaling;
                const up = this._upAxis;
                const mirrored = scaling.x * scaling.y * scaling.z * (up.x * up.x * scaling.x + up.y * up.y * scaling.y + up.z * up.z * scaling.z) < 0;
                if (!character.rotationQuaternion) {
                    character.rotationQuaternion = Quaternion.FromEulerVector(character.rotation);
                }
                const turned = character.rotationQuaternion;
                turned.multiplyToRef(Quaternion.RotationAxisToRef(up, mirrored ? -deltaYaw : deltaYaw, TmpVectors.Quaternion[2]), turned);
                character.rotationQuaternion = turned;
            }
        }

        if (this.onRootMotionObservable.hasObservers()) {
            this.onRootMotionObservable.notifyObservers(this);
        }
    }

    /**
     * The motion at a frame relative to the motion at the start of the played range.
     * @param frame defines the frame
     * @param startYaw defines the turn at the start of the range
     * @param startOffset defines the travel at the start of the range
     * @param result defines the vector receiving the travel
     * @returns the turn
     */
    private _motionInRange(frame: number, startYaw: number, startOffset: Vector3, result: Vector3): number {
        this._rotateAboutUp(this.getOffsetAtFrame(frame, result).subtractInPlace(startOffset), -startYaw, result);
        return this.getRotationAtFrame(frame) - startYaw;
    }

    private _findClock(): Nullable<RuntimeAnimation> {
        const animatables = this._group.animatables;
        if (this._clockRuntime && this._clockAnimatable && animatables[this._clockIndex] === this._clockAnimatable) {
            return this._clockRuntime;
        }
        for (let i = 0; i < animatables.length; i++) {
            for (const runtime of animatables[i].getAnimations()) {
                if (runtime.animation === this._clockAnimation) {
                    this._clockAnimatable = animatables[i];
                    this._clockIndex = i;
                    return runtime;
                }
            }
        }
        this._clockAnimatable = null;
        return null;
    }

    private _measureRootYaw(): Float32Array {
        const root = this._rootNode!;
        const samples = this._sampleCount;
        const reference = this._rotationInCharacter(root, this._fromFrame, new Quaternion());
        reference.conjugateInPlace();
        const rotation = new Quaternion();
        const yaw = new Float32Array(samples + 1);
        let previous = 0;
        for (let i = 0; i <= samples; i++) {
            const wrapped = this._twist(this._rotationInCharacter(root, this._frameAt(i), rotation), reference);
            // Unwrap, so a clip that turns past half a revolution keeps counting instead of jumping back.
            previous = i === 0 ? wrapped : previous + WrapAngle(wrapped - WrapAngle(previous));
            yaw[i] = previous;
        }
        return yaw;
    }

    private _measureRootTravel(yaw: Nullable<Float32Array>, minimumTravel: number, forced: boolean): Nullable<Float32Array> {
        const root = this._rootNode!;
        const samples = this._sampleCount;
        const positions: Vector3[] = [];
        for (let i = 0; i <= samples; i++) {
            positions.push(this._positionInCharacter(root, this._frameAt(i), new Vector3()));
        }

        const start = positions[0];
        // Net travel over the cycle, not how far the root strays: an in-place loop returns to where it started however
        // much its hips surge and sway (a lurching walk can surge a fifth of the character's height), while a clip that
        // really travels ends a stride or more away. A clip that travels and comes back, like a circle, reads as in place,
        // which is safe: its feet do not slide either, so nothing is applied twice.
        const net = this._horizontal(positions[samples].subtract(start), new Vector3());
        if (!forced && net.length() < minimumTravel) {
            return null;
        }
        if (net.lengthSquared() > 0) {
            this._travelDirection.copyFrom(net).normalize();
        }
        if (!yaw && !this._extractLateral) {
            this._snapTravelDirection(0);
            // Whatever the root still drifts sideways of a snapped direction over a cycle would stay in the pose and pop
            // back at every loop, so it is removed from the keys too, evenly over the cycle - but not applied.
            this._horizontal(net, this._lateralDrift).subtractInPlace(this._travelDirection.scale(Vector3.Dot(net, this._travelDirection)));
        }

        const translation = new Float32Array((samples + 1) * 3);
        const offset = new Vector3();
        for (let i = 0; i <= samples; i++) {
            this._rootTravelAt(positions[i], start, yaw ? yaw[i] : 0, !!yaw, offset).toArray(translation, i * 3);
        }
        return translation;
    }

    /**
     * The travel removed from the root at a pose, so that the in-place root keeps the start position (turning) or its
     * sway (straight).
     * @param position defines the root position in character space
     * @param start defines the root position in character space at the first frame
     * @param yaw defines the turn at this pose
     * @param turning defines whether turning is extracted
     * @param result defines the vector receiving the travel
     * @returns the result vector
     */
    private _rootTravelAt(position: Vector3, start: Vector3, yaw: number, turning: boolean, result: Vector3): Vector3 {
        if (turning) {
            // Every horizontal move, since the direction of travel is turning with the character.
            const pivot = this._rotateAboutUp(this._horizontal(start, TmpVectors.Vector3[3]), yaw, TmpVectors.Vector3[3]);
            return this._horizontal(position, result).subtractInPlace(pivot);
        }
        return this._project(position.subtractToRef(start, result), result);
    }

    private _measureContactTravel(
        yaw: Nullable<Float32Array>,
        explicitContacts: Array<TransformNode | Bone> | undefined,
        minimumTravel: number,
        forced: boolean
    ): Nullable<Float32Array> {
        const samples = this._sampleCount;
        const up = this._upAxis;
        let contacts: TransformNode[];
        if (explicitContacts) {
            contacts = explicitContacts.map((node) => this._resolveNode(node)).filter((node): node is TransformNode => !!node);
        } else {
            const base = this._rootNode ?? this._characterNode!;
            contacts = base.getDescendants(false, IsJoint).filter((node) => !node.getChildren(IsJoint, true).length) as TransformNode[];
        }
        if (!contacts.length) {
            return null;
        }

        // Every candidate across the whole clip: a run starts with a foot in the air, so one frame cannot tell which
        // nodes ever reach the ground.
        const positions = contacts.map(() => [] as Vector3[]);
        const lowest = contacts.map(() => Number.POSITIVE_INFINITY);
        for (let i = 0; i <= samples; i++) {
            const frame = this._frameAt(i);
            for (let c = 0; c < contacts.length; c++) {
                const position = this._positionInCharacter(contacts[c], frame, new Vector3());
                positions[c].push(position);
                lowest[c] = Math.min(lowest[c], Vector3.Dot(position, up));
            }
        }
        if (!explicitContacts) {
            const ground = Math.min(...lowest);
            const kept = contacts.map((_, c) => lowest[c] <= ground + ContactHeightBand * this._characterHeight);
            contacts = contacts.filter((_, c) => kept[c]);
            const keptPositions = positions.filter((_, c) => kept[c]);
            const keptLowest = lowest.filter((_, c) => kept[c]);
            positions.length = 0;
            positions.push(...keptPositions);
            lowest.length = 0;
            lowest.push(...keptLowest);
        }

        // A planted contact does not move in the world, so in character space it moves at exactly the opposite of the
        // character's own velocity - and that velocity changes smoothly. A swinging contact sweeps forwards, even while
        // touching down, when it can already be the lowest; a contact of a clip whose root carries the travel stands
        // still. So each interval takes the contact on the ground whose step is closest to the ground speed of the
        // interval before, starting from the clip's average ground speed measured with the slowest contact on the
        // ground. With no contact on the ground - the flight of a run - the ground speed carries on.
        // Steps are compared with the turn so far undone, so a turning path keeps a steady ground speed.
        const tolerance = PlantedHeightBand * this._characterHeight;
        const step = new Vector3();
        const unturned = new Vector3();
        const reference = new Vector3();
        const translation = new Float32Array((samples + 1) * 3);
        const travelled = Vector3.Zero();
        const heading = Vector3.Zero();
        let pathLength = 0;
        const walk = (tracking: boolean) => {
            const previous = reference.clone();
            const sum = Vector3.Zero();
            let grounded = 0;
            travelled.setAll(0);
            heading.setAll(0);
            pathLength = 0;
            for (let i = 1; i <= samples; i++) {
                const turn = yaw ? yaw[i] : 0;
                let best = Number.POSITIVE_INFINITY;
                const chosen = new Vector3();
                for (let c = 0; c < contacts.length; c++) {
                    const before = positions[c][i - 1];
                    const after = positions[c][i];
                    if (Vector3.Dot(before, up) > lowest[c] + tolerance || Vector3.Dot(after, up) > lowest[c] + tolerance) {
                        continue;
                    }
                    this._rotateAboutUp(this._horizontal(before.subtractToRef(after, step), step), -turn, unturned);
                    const score = tracking ? Vector3.DistanceSquared(unturned, previous) : unturned.lengthSquared();
                    if (score < best) {
                        best = score;
                        chosen.copyFrom(unturned);
                    }
                }
                if (best === Number.POSITIVE_INFINITY) {
                    chosen.copyFrom(previous);
                } else {
                    sum.addInPlace(chosen);
                    grounded++;
                }
                if (tracking) {
                    previous.copyFrom(chosen);
                }
                heading.addInPlace(chosen);
                pathLength += chosen.length();
                travelled.addInPlace(this._rotateAboutUp(chosen, turn, step)).toArray(translation, i * 3);
            }
            if (!tracking && grounded > 0) {
                reference.copyFrom(sum).scaleInPlace(1 / grounded);
            }
        };
        walk(false);
        walk(true);
        const straightness = pathLength > 0 ? heading.length() / pathLength : 0;

        if (travelled.lengthSquared() > 0) {
            this._travelDirection.copyFrom(travelled).normalize();
        }
        const distance = Vector3.Dot(travelled, this._travelDirection);
        if (!forced && (distance < minimumTravel || straightness < MinimumStraightness)) {
            return null;
        }
        if (!yaw) {
            // Straight: only the travel along the direction, like the root path.
            if (!this._extractLateral) {
                this._snapTravelDirection(DeducedDirectionSnapAngle);
            }
            for (let i = 0; i <= samples; i++) {
                step.fromArray(translation, i * 3);
                this._travelDirection.scaleToRef(Vector3.Dot(step, this._travelDirection), step).toArray(translation, i * 3);
            }
        }
        this._contactNodes = contacts;
        return translation;
    }

    /**
     * Rewrites the root keys so the clip plays in place: each key's pose, in character space, has the motion at its
     * frame undone. The motion is the root's travel for a {@link RootMotionSource.Root} clip, plus the turn when
     * rotation is extracted.
     */
    private _stripRootKeys(): void {
        const root = this._rootNode!;
        const channels = this._channels.get(root)!;
        const parent = root.parent;
        const removesTravel = this._removesRootTravel;
        const range = Math.max(this._toFrame - this._fromFrame, 1e-6);
        const start = this._positionInCharacter(root, this._fromFrame, new Vector3());
        const reference = this._rotationInCharacter(root, this._fromFrame, new Quaternion());
        reference.conjugateInPlace();

        const motionMatrix = new Matrix();
        const rootMatrix = new Matrix();
        const parentMatrix = new Matrix();
        const localMatrix = new Matrix();
        const yawQuaternion = new Quaternion();
        const scratchPosition = new Vector3();
        const scratchRotation = new Quaternion();
        const travel = new Vector3();

        // The in-place local transform of the root at any frame, from the original keys.
        const strippedAt = (frame: number, position: Vector3, rotation: Quaternion) => {
            this._matrixToCharacter(root, frame, rootMatrix);
            this._matrixToCharacter(parent, frame, parentMatrix);
            let yaw = 0;
            if (this._turns) {
                // Exact at this frame; the track only settles which whole turn the angle is on.
                const wrapped = this._twist(this._rotationInCharacter(root, frame, scratchRotation), reference);
                const tracked = this.getRotationAtFrame(frame);
                yaw = wrapped + Math.round((tracked - wrapped) / (2 * Math.PI)) * 2 * Math.PI;
            }
            if (removesTravel) {
                rootMatrix.getTranslationToRef(scratchPosition);
                this._rootTravelAt(scratchPosition, start, yaw, this._turns, travel);
                if (!this._turns) {
                    travel.addInPlace(this._lateralDrift.scale(Math.min(1, Math.max(0, (frame - this._fromFrame) / range))));
                }
            } else {
                travel.setAll(0);
            }
            // The motion maps the in-place pose onto the clip's pose: turn, then travel.
            Matrix.FromQuaternionToRef(Quaternion.RotationAxisToRef(this._upAxis, yaw, yawQuaternion), motionMatrix);
            motionMatrix.setTranslation(travel);
            motionMatrix.invertToRef(motionMatrix);
            rootMatrix.multiplyToRef(motionMatrix, localMatrix);
            parentMatrix.invertToRef(parentMatrix);
            localMatrix.multiplyToRef(parentMatrix, localMatrix);
            localMatrix.decompose(undefined, rotation, position);
        };

        // Everything is computed from the original keys before anything is written: keys padded by
        // AnimationGroup.normalize share their neighbor's value object.
        const rewrites: IKeyRecord[] = [];
        const position = new Vector3();
        const rotation = new Quaternion();
        const before = { position: new Vector3(), rotation: new Quaternion() };
        const after = { position: new Vector3(), rotation: new Quaternion() };

        const rewriteChannel = (animation: Animation | undefined, kind: "position" | "rotationQuaternion" | "rotation") => {
            if (!animation) {
                return;
            }
            const keys = animation.getKeys();
            let previousRotation: Nullable<Quaternion> = null;
            let previousEuler: Nullable<Vector3> = null;
            for (const key of keys) {
                strippedAt(key.frame, position, rotation);
                let value: any;
                if (kind === "position") {
                    value = position.clone();
                } else {
                    // Stay in the same hemisphere as the previous key, so interpolation does not take the long way round.
                    if (previousRotation && Quaternion.Dot(previousRotation, rotation) < 0) {
                        rotation.scaleInPlace(-1);
                    }
                    previousRotation = rotation.clone();
                    if (kind === "rotationQuaternion") {
                        value = previousRotation;
                    } else {
                        // Each angle continues from the previous key, so interpolation does not swing the long way round
                        // where the conversion from a quaternion jumps between +PI and -PI.
                        const euler = previousRotation.toEulerAngles();
                        if (previousEuler) {
                            euler.x += Math.round((previousEuler.x - euler.x) / (2 * Math.PI)) * 2 * Math.PI;
                            euler.y += Math.round((previousEuler.y - euler.y) / (2 * Math.PI)) * 2 * Math.PI;
                            euler.z += Math.round((previousEuler.z - euler.z) / (2 * Math.PI)) * 2 * Math.PI;
                        }
                        previousEuler = euler;
                        value = euler;
                    }
                }

                // Cubic spline tangents follow the rewritten curve. Straight travel is a linear removal, so the key's own
                // tangent is transformed exactly; a turn is not, so the tangents are measured from the curve either side.
                const tangent = (original: any, direction: number): any => {
                    if (!original) {
                        return original;
                    }
                    if (kind === "position" && !this._turns) {
                        this._matrixToCharacter(parent, key.frame, parentMatrix);
                        const inCharacter = Vector3.TransformNormal(original, parentMatrix);
                        const removed = removesTravel ? this._project(inCharacter.clone(), new Vector3()).addInPlace(this._lateralDrift.scale(1 / range)) : Vector3.Zero();
                        parentMatrix.invertToRef(parentMatrix);
                        return original.subtract(Vector3.TransformNormal(removed, parentMatrix));
                    }
                    strippedAt(key.frame - TangentDelta, before.position, before.rotation);
                    strippedAt(key.frame + TangentDelta, after.position, after.rotation);
                    const low = direction < 0 ? before : { position, rotation };
                    const high = direction < 0 ? { position, rotation } : after;
                    if (kind === "position") {
                        return high.position.subtract(low.position).scaleInPlace(1 / TangentDelta);
                    }
                    if (Quaternion.Dot(low.rotation, high.rotation) < 0) {
                        high.rotation.scaleInPlace(-1);
                    }
                    const rate = high.rotation.subtract(low.rotation).scaleInPlace(1 / TangentDelta);
                    return kind === "rotationQuaternion"
                        ? rate
                        : high.rotation
                              .toEulerAngles()
                              .subtract(low.rotation.toEulerAngles())
                              .scaleInPlace(1 / TangentDelta);
                };

                rewrites.push({ key, value, inTangent: tangent(key.inTangent, -1), outTangent: tangent(key.outTangent, 1) });
                this._restoredKeys.push({ key, value: key.value, inTangent: key.inTangent, outTangent: key.outTangent });
            }
        };

        rewriteChannel(channels.position, "position");
        if (this._turns) {
            rewriteChannel(channels.rotationQuaternion, "rotationQuaternion");
            if (!channels.rotationQuaternion) {
                rewriteChannel(channels.rotation, "rotation");
            }
        }

        for (const record of rewrites) {
            record.key.value = record.value;
            record.key.inTangent = record.inTangent;
            record.key.outTangent = record.outTangent;
        }
    }

    private _findRootNode(): Nullable<TransformNode> {
        const nodes = Array.from(this._channels.keys());
        let best: Nullable<TransformNode> = null;
        let bestCount = -1;
        for (const [node, channels] of this._channels) {
            if (!channels.position) {
                continue;
            }
            const count = nodes.filter((other) => other !== node && other.isDescendantOf(node)).length;
            if (count > bestCount || (count === bestCount && best && best.isDescendantOf(node))) {
                best = node as TransformNode;
                bestCount = count;
            }
        }
        return best;
    }

    private _measureHeight(base: TransformNode): number {
        const position = new Vector3();
        let lowest = Number.POSITIVE_INFINITY;
        let highest = Number.NEGATIVE_INFINITY;
        for (const node of [base, ...(base.getDescendants(false, IsJoint) as TransformNode[])]) {
            const height = Vector3.Dot(this._positionInCharacter(node, this._fromFrame, position), this._upAxis);
            lowest = Math.min(lowest, height);
            highest = Math.max(highest, height);
        }
        return highest - lowest;
    }

    /**
     * The track sample before a frame; the blend towards the next one is left in _sampleBlend.
     * @param frame defines the frame
     * @returns the sample index
     */
    private _sampleAt(frame: number): number {
        const range = this._toFrame - this._fromFrame;
        const samples = this._sampleCount;
        if (range <= 0 || this._source === RootMotionSource.None) {
            this._sampleBlend = 0;
            return 0;
        }
        const exact = Math.min(samples, Math.max(0, ((frame - this._fromFrame) / range) * samples));
        const index = Math.min(samples - 1, Math.floor(exact));
        this._sampleBlend = exact - index;
        return index;
    }

    private _frameAt(sample: number): number {
        return this._fromFrame + ((this._toFrame - this._fromFrame) * sample) / this._sampleCount;
    }

    private _horizontal(vector: Vector3, result: Vector3): Vector3 {
        const up = this._upAxis;
        const height = Vector3.Dot(vector, up);
        return result.set(vector.x - up.x * height, vector.y - up.y * height, vector.z - up.z * height);
    }

    private _project(vector: Vector3, result: Vector3): Vector3 {
        this._horizontal(vector, result);
        if (!this._extractLateral) {
            this._travelDirection.scaleToRef(Vector3.Dot(result, this._travelDirection), result);
        }
        return result;
    }

    /**
     * Snaps the direction of travel onto the nearest horizontal character space axis within the snap angle.
     * @param defaultAngle defines the snap angle when none was given in the options
     */
    private _snapTravelDirection(defaultAngle: number): void {
        const angle = this._directionSnapAngle ?? defaultAngle;
        if (angle <= 0) {
            return;
        }
        const up = this._upAxis;
        const axis = new Vector3();
        let best: Nullable<Vector3> = null;
        let bestDot = Math.cos(angle);
        for (const candidate of [Vector3.RightReadOnly, Vector3.UpReadOnly, Vector3.Forward(false)]) {
            if (Math.abs(Vector3.Dot(candidate, up)) > 0.5) {
                continue;
            }
            this._horizontal(candidate, axis).normalize();
            for (const sign of [1, -1]) {
                const dot = sign * Vector3.Dot(axis, this._travelDirection);
                if (dot >= bestDot) {
                    bestDot = dot;
                    best = axis.scale(sign);
                }
            }
        }
        if (best) {
            this._travelDirection.copyFrom(best);
        }
    }

    private _rotateAboutUp(vector: Vector3, angle: number, result: Vector3): Vector3 {
        if (angle === 0) {
            return result.copyFrom(vector);
        }
        Matrix.FromQuaternionToRef(Quaternion.RotationAxisToRef(this._upAxis, angle, this._yawQuaternion), this._yawMatrix);
        return Vector3.TransformNormalToRef(vector, this._yawMatrix, result);
    }

    /**
     * The turn about the up axis from a reference orientation to a rotation, both in character space: the angle of the
     * rotation about the up axis that best matches the change of orientation. Unlike the twist of a swing-twist split,
     * it stays well defined while the root pitches and rolls - a dancer's hips tilting through the vertical made the
     * twist jump by half turns.
     * @param rotation defines the rotation
     * @param referenceConjugate defines the conjugate of the reference rotation
     * @returns the angle in radians, between -PI and PI
     */
    private _twist(rotation: Quaternion, referenceConjugate: Quaternion): number {
        const delta = Matrix.FromQuaternionToRef(rotation.multiplyToRef(referenceConjugate, TmpVectors.Quaternion[1]), TmpVectors.Matrix[2]);
        const up = this._upAxis;
        // Two horizontal axes, right-handed with up the way +X, +Z are with +Y.
        const first = this._horizontal(Math.abs(up.x) < 0.9 ? Vector3.RightReadOnly : Vector3.Forward(false), TmpVectors.Vector3[5]).normalize();
        const second = Vector3.CrossToRef(first, up, TmpVectors.Vector3[6]);
        const turnedFirst = Vector3.TransformNormalToRef(first, delta, TmpVectors.Vector3[7]);
        const turnedSecond = Vector3.TransformNormalToRef(second, delta, TmpVectors.Vector3[8]);
        return WrapAngle(Math.atan2(Vector3.Dot(turnedSecond, first) - Vector3.Dot(turnedFirst, second), Vector3.Dot(turnedFirst, first) + Vector3.Dot(turnedSecond, second)));
    }

    private _positionInCharacter(node: TransformNode, frame: number, result: Vector3): Vector3 {
        const matrix = this._matrixToCharacter(node, frame, TmpVectors.Matrix[1]);
        return result.set(matrix.m[12], matrix.m[13], matrix.m[14]);
    }

    private _rotationInCharacter(node: TransformNode, frame: number, result: Quaternion): Quaternion {
        this._matrixToCharacter(node, frame, TmpVectors.Matrix[1]).decompose(undefined, result);
        return result;
    }

    /**
     * Composes a node's transform into character space at a frame of the clip, from the evaluated keys of animated
     * nodes and the current transform of the others. Nothing is played or written.
     * @param node defines the node, or null for the character space itself
     * @param frame defines the frame to evaluate
     * @param result defines the matrix receiving the transform
     * @returns the result matrix
     */
    private _matrixToCharacter(node: Nullable<Node>, frame: number, result: Matrix): Matrix {
        Matrix.IdentityToRef(result);
        const local = TmpVectors.Matrix[0];
        let current = node;
        while (current && current !== this._characterNode) {
            if (current instanceof TransformNode) {
                this._localMatrix(current, frame, local);
                result.multiplyToRef(local, result);
            }
            current = current.parent;
        }
        return result;
    }

    private _localMatrix(node: TransformNode, frame: number, result: Matrix): Matrix {
        const channels = this._channels.get(node);
        const scaling: Vector3 = channels?.scaling ? channels.scaling.evaluate(frame) : node.scaling;
        const position: Vector3 = channels?.position ? channels.position.evaluate(frame) : node.position;
        let rotation: Quaternion;
        if (channels?.rotationQuaternion) {
            rotation = channels.rotationQuaternion.evaluate(frame);
        } else if (channels?.rotation) {
            rotation = Quaternion.FromEulerVectorToRef(channels.rotation.evaluate(frame), TmpVectors.Quaternion[0]);
        } else {
            rotation = node.rotationQuaternion ?? Quaternion.FromEulerVectorToRef(node.rotation, TmpVectors.Quaternion[0]);
        }
        return Matrix.ComposeToRef(scaling, rotation, position, result);
    }

    private _resolveNode(node: TransformNode | Bone): Nullable<TransformNode> {
        if (node instanceof TransformNode) {
            return node;
        }
        const linked = node.getTransformNode();
        if (!linked) {
            Logger.Warn(`RootMotion: bone "${node.name}" has no linked transform node; only transform node animations are supported.`);
        }
        return linked;
    }

    private _firstAnimatedNode(): Nullable<TransformNode> {
        for (const node of this._channels.keys()) {
            return node as TransformNode;
        }
        return null;
    }

    private _topmostAncestor(node: TransformNode): TransformNode {
        let top = node;
        let current = node.parent;
        while (current) {
            if (current instanceof TransformNode) {
                top = current;
            }
            current = current.parent;
        }
        return top;
    }
}

function IsJoint(node: Node): node is TransformNode {
    return node instanceof TransformNode && !(node instanceof AbstractMesh);
}

function WrapAngle(angle: number): number {
    return angle - 2 * Math.PI * Math.floor((angle + Math.PI) / (2 * Math.PI));
}
