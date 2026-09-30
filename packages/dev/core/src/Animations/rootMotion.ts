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
 * Where the travel of a {@link RootMotionClip} comes from.
 */
export const enum RootMotionSource {
    /**
     * No motion was found: the clip neither moves its root nor walks its contact nodes.
     */
    None = 0,
    /**
     * The root node's own animation - the clip's ground truth. Its travel (and turning, when extracted) is left out of
     * the in-place animation group and applied to the character node instead.
     */
    Root = 1,
    /**
     * Deduced from the contact nodes (usually the feet) of an in-place clip: whatever a planted contact gives up in
     * character space, the character travels. The travel is not in the clip, so nothing is left out of it.
     */
    FootContact = 2,
}

/**
 * Options for {@link RootMotionClip}.
 */
export interface IRootMotionClipOptions {
    /**
     * The root node, usually the hips or a dedicated root bone, whose own travel is tried first. A bone is resolved to
     * its linked transform node. Defaults to the position-animated node with the most animated descendants in the group.
     * A node the group does not animate is accepted as the base of the animated hierarchy: the travel then comes from
     * the contact nodes under it, and {@link RootMotionSource.Root} cannot be forced.
     */
    rootNode?: TransformNode | Bone;
    /**
     * The node that receives the motion and whose local space the motion is measured in. Defaults to the topmost
     * ancestor of the root node (the "__root__" node of a glTF asset). The group must not animate its position or
     * rotation, since the motion applied to it would be overwritten.
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
     * a cycle leaves the character facing at least {@link IRootMotionClipOptions.minimumTurn} away from where it
     * started, so a walk's hip twist - or a dance that spins round to face the front again - stays in the pose while a
     * turning clip turns the character.
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
     * The name of the in-place animation group. Defaults to the source group's name followed by " (in place)".
     */
    name?: string;
    /**
     * Whether every animation is cloned into the in-place animation group. By default (false) only the root channels
     * the extraction rewrites are cloned, and the animations it leaves untouched are shared with the source group, as
     * {@link AnimationGroup.clone} shares them. Set it to true before changing the in-place group's animations in place
     * - with {@link AnimationGroup.MakeAnimationAdditive} or {@link AnimationGroup.normalize} for example - so the
     * source group's animations are not changed with them.
     */
    cloneAnimations?: boolean;
}

interface INodeChannels {
    position?: Animation;
    rotationQuaternion?: Animation;
    rotation?: Animation;
    scaling?: Animation;
}

/**
 * What the animation mixer wrote to a root channel in the last animation step - the writes its late bindings read,
 * those made after them belonging to the step that follows - gathered for every clip that follows that channel.
 */
interface IChannelWriters {
    /** The property of the channel. */
    property: string;
    /** The weights of the weighted animatables writing the channel, additive ones aside. */
    total: number;
    /** Whether any weighted animatable writes the channel. */
    weighted: boolean;
    /** The last runtime animation writing the channel unweighted, whose value is the pose unless a weighted one replaces it. */
    lastDirect: Nullable<RuntimeAnimation>;
    /** The writes to the channel this step, in order: the runtime animation of each, which may write more than once. */
    current: RuntimeAnimation[];
    /** The weight of each write, -1 for a direct one. */
    currentWeights: number[];
    /** Whether each write was additive. */
    currentAdditive: boolean[];
    /** The factor each write blended in with, one once the animation writing it has blended in. */
    currentBlending: number[];
}

/**
 * The channel of a node to run a clip's motion on: the one of its position, rotation and scaling channels preferred by
 * {@link ClockBeats}.
 * @param channels defines the node's channels
 * @param fromFrame defines the first frame of the range played
 * @param toFrame defines the last frame of the range played
 * @returns the channel and the frames its keys span
 */
function ClockChannel(channels: INodeChannels, fromFrame: number, toFrame: number): IClockCandidate {
    let best: Nullable<IClockCandidate> = null;
    for (const animation of [channels.position, channels.rotationQuaternion, channels.rotation, channels.scaling]) {
        if (!animation) {
            continue;
        }
        const keys = animation.getKeys();
        const first = keys.length ? keys[0].frame : 0;
        const last = keys.length ? keys[keys.length - 1].frame : 0;
        const candidate = { animation, span: last - first, covers: last > first && first <= fromFrame && last >= toFrame };
        if (!best || ClockBeats(candidate, best)) {
            best = candidate;
        }
    }
    return best!;
}

/** A channel a clip's motion could run on. */
interface IClockCandidate {
    /** The channel. */
    animation: Animation;
    /** The frames its keys span. */
    span: number;
    /** Whether its keys cover the range played. */
    covers: boolean;
}

/**
 * Whether one channel is to run a clip's motion rather than another: one whose keys cover the range played before one
 * whose keys do not; among channels that cover it a position channel first, the channel the mixer weighs linearly, then
 * the widest; among channels that do not, the widest, since a channel keyed shorter clamps the analysis to its keys,
 * then a position channel.
 * @param candidate defines the channel considered
 * @param other defines the channel preferred so far
 * @returns whether the channel considered is preferred
 */
function ClockBeats(candidate: IClockCandidate, other: IClockCandidate): boolean {
    if (candidate.covers !== other.covers) {
        return candidate.covers;
    }
    const position = candidate.animation.targetProperty === "position";
    const otherPosition = other.animation.targetProperty === "position";
    if (candidate.covers && position !== otherPosition) {
        return position;
    }
    if (candidate.span !== other.span) {
        return candidate.span > other.span;
    }
    return position && !otherPosition;
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
/** Frame step for the numeric tangents of rewritten cubic spline keys. */
const TangentDelta = 1e-3;
/** The root motion of each scene, updating the scene's controllers in one pass after animations. */
const SceneRootMotions = new WeakMap<Scene, SceneRootMotion>();

/**
 * The root motion of an animation group: how far the clip carries the character over a cycle, and how far it turns it,
 * so that the character can be moved by it and its feet stay planted instead of skating.
 *
 * The clip is analyzed once, when the RootMotionClip is created, without playing the group or changing it:
 * 1. The root node's own animation is tried first, as the ground truth. If the root ends a cycle a meaningful distance
 *    from where it started, that travel is the root motion. Turning is read from the root the same way.
 * 2. Otherwise the clip is treated as an in-place cycle and the travel is deduced from its contact nodes: a planted
 *    contact stays put in the world, so in character space it moves opposite to the character, and whatever it gives
 *    up the character gains. The direction of travel falls out of the same measurement, so the forward axis of
 *    the rig does not have to be known.
 *
 * The source group is never changed. The clip owns {@link RootMotionClip.animationGroup}, a clone of the source in
 * which the root's travel and turning are left out, so it plays and loops in place: play that group, and give the clip
 * to the {@link RootMotionController} of the character so the motion is applied to the character node instead.
 *
 * ```ts
 * const walk = new RootMotionClip(walkGroup);
 * const controller = new RootMotionController(walk.characterNode, [walk]);
 * walk.animationGroup.start(true);
 * ```
 *
 * The in-place group is a group of the scene, not of the source's asset container, so dispose the clip when it is done
 * with; disposing the container does not. To play a clip additively, build it from the source as it is and make the
 * in-place group additive: `AnimationGroup.MakeAnimationAdditive(clip.animationGroup, { referenceFrame: 0 })`, with
 * {@link IRootMotionClipOptions.cloneAnimations} set so the source keeps its keys.
 */
export class RootMotionClip implements IDisposable {
    /**
     * @internal
     * The node of the clip's clock: the channel whose runtime animation the controller reads the evaluated progress
     * from and turns into motion. It is the root node, or the first animated transform node when the group animates
     * no position.
     */
    public _clockNode: Nullable<TransformNode> = null;
    /** @internal The property of the clock's channel. */
    public _clockProperty = "position";
    /** @internal The very channel of the in-place group the analysis ran on, which another of the same property must not be taken for. */
    public _clockAnimation: Nullable<Animation> = null;
    /** @internal The runtime animation of the clock the controller followed last. */
    public _clockRuntime: Nullable<RuntimeAnimation> = null;
    /** @internal The animatable of the clock the controller followed last. */
    public _clockAnimatable: Nullable<Animatable> = null;
    /** @internal The animatable the last search for the clock found. */
    public _foundAnimatable: Nullable<Animatable> = null;
    /** @internal The animatable the clock's playback was synchronized with last, and the runtime animation of that root. */
    public _syncRoot: Nullable<Animatable> = null;
    /** @internal The runtime animation the clock was synchronized with last. */
    public _syncRuntime: Nullable<RuntimeAnimation> = null;
    /** @internal The progress of the clock the controller consumed last. */
    public _lastProgress: Nullable<number> = null;
    /** @internal Whether the clock has been left unevaluated at a weight of zero since the progress consumed last. */
    public _parked = false;
    /** @internal The clock's runtime animation at the last reset, whose evaluation of then is not where the playback carries on from. */
    public _staleRuntime: Nullable<RuntimeAnimation> = null;
    /** @internal Its progress then. */
    public _staleProgress: Nullable<number> = null;
    /** @internal What the mixer wrote to the clock's channel this frame. */
    public _writers: Nullable<IChannelWriters> = null;
    /** @internal The controller the clip belongs to. */
    public _controller: Nullable<RootMotionController> = null;

    private readonly _sourceGroup: AnimationGroup;
    private readonly _group: AnimationGroup;
    private readonly _characterNode: TransformNode;
    private readonly _upAxis: Vector3;
    private readonly _extractLateral: boolean;
    private readonly _directionSnapAngle: number | undefined;
    /** Sideways travel over a cycle left in the root's keys after snapping the direction, removed without being applied. */
    private readonly _lateralDrift = Vector3.Zero();
    private readonly _channels = new Map<Node, INodeChannels>();
    private _source = RootMotionSource.None;
    private _rootNode: Nullable<TransformNode> = null;
    private _contactNodes: TransformNode[] = [];
    private readonly _travelDirection = new Vector3(0, 0, 1);
    private readonly _cycleOffset = Vector3.Zero();
    private _cycleRotation = 0;
    private _turns = false;
    private _duration = 0;
    private _characterHeight = 0;
    private _fromFrame = 0;
    private _toFrame = 0;
    private _sampleCount = 1;
    private _track = new Float32Array(2 * TrackStride);
    /** Whether the root's own travel is left out of the in-place group - not so for a clip that only turns on the spot. */
    private _removesRootTravel = false;
    /** Whether the motion is a turn about the root's starting point: a clip that only turns on the spot. */
    private _pivots = false;
    /** The root's position before the clip, when the in-place group animates a position the source leaves alone. */
    private _restoredPosition: Nullable<Vector3> = null;
    private _clockIndex = -1;
    private _sampleBlend = 0;
    private readonly _lastOffset = Vector3.Zero();
    private readonly _rangeStart = Vector3.Zero();
    private readonly _rangeCycle = Vector3.Zero();
    private readonly _cyclesOffset = Vector3.Zero();
    private readonly _planarStep = Vector3.Zero();
    private readonly _yawQuaternion = new Quaternion();
    private readonly _yawMatrix = new Matrix();

    /**
     * The animation group the clip was analyzed from. It is never changed.
     */
    public get sourceAnimationGroup(): AnimationGroup {
        return this._sourceGroup;
    }

    /**
     * The in-place animation group to play: a clone of the source with the root motion left out of the root's keys.
     * Animations the extraction does not rewrite are shared with the source unless the clip was created with
     * {@link IRootMotionClipOptions.cloneAnimations}. It belongs to the scene, and is disposed with the clip.
     */
    public get animationGroup(): AnimationGroup {
        return this._group;
    }

    /**
     * The controller the clip was added to, if any.
     */
    public get controller(): Nullable<RootMotionController> {
        return this._controller;
    }

    /**
     * Where the travel comes from. {@link RootMotionSource.None} when no motion was found.
     */
    public get source(): RootMotionSource {
        return this._source;
    }

    /**
     * The root node the clip was analyzed with, or null when the group animates no position. It carries the motion
     * only when {@link RootMotionClip.source} is {@link RootMotionSource.Root}.
     */
    public get rootNode(): Nullable<TransformNode> {
        return this._rootNode;
    }

    /**
     * The node the motion is measured in the local space of, and that a controller moves.
     */
    public get characterNode(): TransformNode {
        return this._characterNode;
    }

    /**
     * The contact nodes used to deduce the travel. Empty unless the source is {@link RootMotionSource.FootContact}.
     */
    public get contactNodes(): ReadonlyArray<TransformNode> {
        return this._contactNodes;
    }

    /**
     * The up axis in character space (unit length).
     */
    public get upAxis(): Vector3 {
        return this._upAxis;
    }

    /**
     * The first frame of the range the clip is analyzed over: the group's range, with a bound outside the clock
     * channel's keys replaced by that channel's first or last key, as playback does.
     */
    public get fromFrame(): number {
        return this._fromFrame;
    }

    /**
     * The last frame of the range the clip is analyzed over.
     */
    public get toFrame(): number {
        return this._toFrame;
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
     * Analyzes an animation group and builds the in-place animation group to play instead of it.
     * @param animationGroup defines the animation group to extract the root motion of; it is not changed
     * @param options defines how the root motion is extracted
     * @throws when the group has nothing to analyze, is additive, or animates the character node itself
     */
    public constructor(animationGroup: AnimationGroup, options: IRootMotionClipOptions = {}) {
        this._sourceGroup = animationGroup;
        this._upAxis = (options.upAxis ?? Vector3.UpReadOnly).normalizeToNew();
        this._extractLateral = !!options.extractLateralMotion;
        this._directionSnapAngle = options.directionSnapAngle;
        const name = options.name ?? `${animationGroup.name} (in place)`;

        if (animationGroup.isAdditive) {
            throw new Error(
                `RootMotionClip: animation group "${animationGroup.name}" is additive. Build the clip from the group it was made additive from, then make the clip's in-place group additive.`
            );
        }
        const targetedAnimations = animationGroup.targetedAnimations;
        if (!targetedAnimations.length) {
            throw new Error(`RootMotionClip: animation group "${animationGroup.name}" has no animations.`);
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

        // The character node is where the motion goes; an animation of its position or rotation, or of a part of them,
        // would overwrite it every frame.
        const refuseAnimatedReceiver = (node: TransformNode) => {
            if (
                targetedAnimations.some(
                    (targetedAnimation) => targetedAnimation.target === node && /^(position|rotationQuaternion|rotation)(\.|$)/.test(targetedAnimation.animation.targetProperty)
                )
            ) {
                throw new Error(
                    `RootMotionClip: animation group "${animationGroup.name}" animates the character node "${node.name}", which is to receive the motion. Parent the character under a node the group does not animate, or pass such an ancestor as characterNode.`
                );
            }
        };
        if (options.characterNode) {
            refuseAnimatedReceiver(options.characterNode);
        }
        this._rootNode = options.rootNode ? this._resolveNode(options.rootNode) : this._findRootNode();
        const anchor = this._rootNode ?? this._firstAnimatedNode();
        if (!anchor) {
            throw new Error(`RootMotionClip: animation group "${animationGroup.name}" does not animate any transform node.`);
        }
        let character = options.characterNode ?? null;
        if (!character || character === anchor || !anchor.isDescendantOf(character)) {
            if (character) {
                Logger.Warn(`RootMotionClip: the character node "${character.name}" is not an ancestor of the root node "${anchor.name}"; using the topmost ancestor instead.`);
            }
            character = this._topmostAncestor(anchor);
        }
        if (character === anchor) {
            throw new Error(`RootMotionClip: the root node "${anchor.name}" has no parent to carry its motion. Parent the character under a node of its own.`);
        }
        refuseAnimatedReceiver(character);
        this._characterNode = character;

        // The motion runs on the root's own animation - its frame rate, its range and at runtime its playback - rather than
        // whichever track happens to be first in the group, which could be a morph target at another frame rate: the
        // channel of the root that covers the range played, since one keyed shorter would clamp the analysis to its own
        // keys. A root the group does not animate, passed as the base of the hierarchy, runs on such a channel of an
        // animated descendant: a position channel before any other, the channel the mixer weighs linearly, and the
        // widest among those.
        const playedFrom = animationGroup.from;
        const playedTo = animationGroup.to;
        let clockNode: Nullable<TransformNode> = null;
        let clock: Nullable<Animation> = null;
        const anchorChannels = this._channels.get(anchor);
        const anchorClock = anchorChannels ? ClockChannel(anchorChannels, playedFrom, playedTo) : null;
        if (anchorClock && anchorClock.span > 0) {
            clockNode = anchor;
            clock = anchorClock.animation;
        } else {
            // The root has nothing to run on - it is not animated at all, or only by channels of a single key - so the
            // clip runs on a channel of the hierarchy under it, itself as the last resort, chosen across those nodes by
            // the same preference as among the channels of one.
            let best: Nullable<IClockCandidate> = null;
            for (const [node, channels] of this._channels) {
                if (node !== anchor && !node.isDescendantOf(anchor)) {
                    continue;
                }
                const candidate = ClockChannel(channels, playedFrom, playedTo);
                if (!best || ClockBeats(candidate, best)) {
                    best = candidate;
                    clockNode = node as TransformNode;
                    clock = candidate.animation;
                }
            }
        }
        if (!clockNode || !clock) {
            throw new Error(`RootMotionClip: animation group "${animationGroup.name}" animates neither the root node "${anchor.name}" nor any node under it.`);
        }
        this._clockNode = clockNode;
        this._clockProperty = clock.targetProperty;
        // The group's range clamped to the clock's keys, the way playback clamps it: another track may run longer.
        const keys = clock.getKeys();
        const firstKey = keys[0].frame;
        const lastKey = keys[keys.length - 1].frame;
        this._fromFrame = animationGroup.from < firstKey || animationGroup.from > lastKey ? firstKey : animationGroup.from;
        this._toFrame = animationGroup.to < firstKey || animationGroup.to > lastKey ? lastKey : animationGroup.to;
        const framePerSecond = clock.framePerSecond;
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

        if (source === RootMotionSource.Root && !rootChannels?.position) {
            throw new Error(
                `RootMotionClip: the root node "${root!.name}" has no position animation to take the travel from. Omit the source to deduce it from the contact nodes, or pass another rootNode.`
            );
        }
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
        if (translation && yaw && !this._removesRootTravel) {
            // A turn that is not in the root's travel turns the character about the root's starting point, so a root off
            // the character's axis stays where the clip has it, in place from one cycle to the next.
            const start = this._positionInCharacter(root!, this._fromFrame, new Vector3());
            const pivot = new Vector3();
            for (let i = 0; i <= samples; i++) {
                this._rootTravelAt(start, start, yaw[i], true, pivot);
                translation[i * 3] += pivot.x;
                translation[i * 3 + 1] += pivot.y;
                translation[i * 3 + 2] += pivot.z;
            }
            this._pivots = true;
        }
        if (translation) {
            this._track = new Float32Array((samples + 1) * TrackStride);
            for (let i = 0; i <= samples; i++) {
                this._track[i * TrackStride] = translation[i * 3];
                this._track[i * TrackStride + 1] = translation[i * 3 + 1];
                this._track[i * TrackStride + 2] = translation[i * 3 + 2];
                this._track[i * TrackStride + 3] = yaw ? yaw[i] : 0;
            }
            this._cycleOffset.fromArray(translation, samples * 3);
            this._cycleRotation = yaw ? yaw[samples] : 0;
        } else {
            this._turns = false;
            this._travelDirection.set(0, 0, 1);
            this._lateralDrift.setAll(0);
        }

        this._group = this._buildInPlaceGroup(name, !!options.cloneAnimations);
        // The very channel of the in-place group the motion runs on - the last of that node and property, as the
        // analysis took it - so that another channel of the same property is not followed in its place.
        for (const targetedAnimation of this._group.targetedAnimations) {
            if (targetedAnimation.target === this._clockNode && targetedAnimation.animation.targetProperty === this._clockProperty) {
                this._clockAnimation = targetedAnimation.animation;
            }
        }
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
     * Removes the clip from its controller and disposes the in-place animation group. The source group is untouched.
     * When the in-place group animates the root's position although the source does not (a root that only turns), the
     * root's position is put back to what it was when the clip was created.
     */
    public dispose(): void {
        this._controller?.removeClip(this);
        this._group.dispose();
        if (this._restoredPosition && this._rootNode) {
            this._rootNode.position = this._restoredPosition.clone();
        }
    }

    /**
     * @internal
     * Finds the runtime animation of the clock in the in-place group's current playback, leaving its animatable in
     * _foundAnimatable.
     * @returns the runtime animation once it has been evaluated, or null when the group is not playing the clock
     */
    public _findClock(): Nullable<RuntimeAnimation> {
        const animatables = this._group.animatables;
        const cached = this._clockAnimatable;
        if (cached && this._clockRuntime && animatables[this._clockIndex] === cached) {
            this._foundAnimatable = cached;
            return this._clockRuntime;
        }
        for (let i = 0; i < animatables.length; i++) {
            const animatable = animatables[i];
            if (animatable.target !== this._clockNode) {
                continue;
            }
            const runtimes = animatable.getAnimations();
            for (let j = 0; j < runtimes.length; j++) {
                const runtime = runtimes[j];
                if (runtime.target && (this._clockAnimation ? runtime.animation === this._clockAnimation : runtime.animation.targetProperty === this._clockProperty)) {
                    this._foundAnimatable = animatable;
                    this._clockIndex = i;
                    return runtime;
                }
            }
        }
        this._foundAnimatable = null;
        return null;
    }

    /**
     * @internal
     * Forgets the playback the controller was following.
     */
    public _forgetPlayback(): void {
        this._clockRuntime = null;
        this._clockAnimatable = null;
        this._syncRoot = null;
        this._syncRuntime = null;
        this._lastProgress = null;
        this._parked = false;
        this._staleRuntime = null;
        this._staleProgress = null;
    }

    /**
     * @internal
     * The motion between two progresses of a playback over a range, as a turn and then a translation in the character
     * space of the earlier progress. Progress is unwrapped: whole cycles are in it, however many passed.
     * @param from defines the first frame of the played range
     * @param to defines the last frame of the played range
     * @param lastProgress defines the earlier progress, in frames from the first frame
     * @param progress defines the later progress, in frames from the first frame
     * @param result defines the vector receiving the translation
     * @returns the turn in radians
     */
    public _motionBetween(from: number, to: number, lastProgress: number, progress: number, result: Vector3): number {
        const range = to - from;
        if (range === 0 || (this._source === RootMotionSource.None && !this._turns)) {
            result.setAll(0);
            return 0;
        }
        const lastCycle = Math.floor(lastProgress / range);
        const cycle = Math.floor(progress / range);
        const lastFrame = from + lastProgress - lastCycle * range;
        const frame = from + progress - cycle * range;
        const cycles = cycle - lastCycle;

        // The motion within the played range, relative to its start - a range played on its own loops by its own stride,
        // not the whole clip's.
        const startYaw = this.getRotationAtFrame(from);
        const startOffset = this.getOffsetAtFrame(from, this._rangeStart);
        const lastYaw = this._motionInRange(lastFrame, startYaw, startOffset, this._lastOffset);
        let yaw = this._motionInRange(frame, startYaw, startOffset, result);

        if (cycles !== 0) {
            // Whole cycles passed: now = cycle^cycles, then the motion within the range.
            const stepYaw = this._motionInRange(to, startYaw, startOffset, this._rangeCycle);
            const cyclesYaw = this._cyclePower(cycles, this._rangeCycle, stepYaw, this._cyclesOffset);
            this._rotateAboutUp(result, cyclesYaw, result).addInPlace(this._cyclesOffset);
            yaw += cyclesYaw;
        }

        // Relative to where the character was: undo the turn it had already made.
        this._rotateAboutUp(result.subtractInPlace(this._lastOffset), -lastYaw, result);
        return yaw - lastYaw;
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

    /**
     * A whole number of cycles of a planar motion - a turn about the up axis and then a translation - in closed form,
     * for any number of cycles, forwards or back: the sum of the horizontal translation turned 0, 1, ... n-1 times is
     * the translation turned (n - 1) / 2 times, sin(n * turn / 2) / sin(turn / 2) times as long, and n times the
     * translation when there is no turn. The vertical part adds up. Nothing here is a matter of precision: no series
     * is summed and no small angle is divided by.
     * @param cycles defines the number of cycles, negative to go back
     * @param step defines the translation of one cycle
     * @param stepYaw defines the turn of one cycle
     * @param result defines the vector receiving the translation of all the cycles
     * @returns the turn of all the cycles
     */
    private _cyclePower(cycles: number, step: Vector3, stepYaw: number, result: Vector3): number {
        // The turn only matters modulo a revolution; wrapped, whole revolutions read as no turn at all.
        const turn = WrapAngle(stepYaw);
        const halfSine = Math.sin(turn / 2);
        const length = halfSine === 0 ? cycles : Math.sin((cycles * turn) / 2) / halfSine;
        const up = this._upAxis;
        const rise = Vector3.Dot(step, up) * cycles;
        this._rotateAboutUp(this._horizontal(step, this._planarStep), ((cycles - 1) * turn) / 2, result).scaleInPlace(length);
        result.addInPlace(up.scale(rise));
        return cycles * stepYaw;
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
            const base = this._rootNode ?? this._characterNode;
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
     * Clones the source group into the in-place group. When the root motion is in the root's keys, the root's channels
     * are cloned with the motion left out: each key's pose, in character space, has the motion at its frame undone. The
     * motion is the root's travel for a {@link RootMotionSource.Root} clip, plus the turn when rotation is extracted.
     * Everything is computed from the source keys, which are not touched.
     * @param name defines the name of the in-place group
     * @param cloneAnimations defines whether every animation is cloned rather than only the rewritten root channels
     * @returns the in-place group
     */
    private _buildInPlaceGroup(name: string, cloneAnimations: boolean): AnimationGroup {
        const group = this._sourceGroup.clone(name);
        // Cloning widens the range to the keys again; the in-place group plays what the source plays.
        group.from = this._sourceGroup.from;
        group.to = this._sourceGroup.to;
        if (cloneAnimations) {
            for (const targetedAnimation of group.targetedAnimations) {
                targetedAnimation.animation = CloneAnimation(targetedAnimation.animation, true);
            }
        }
        const root = this._rootNode;
        if (!root || (!this._removesRootTravel && !this._turns)) {
            return group;
        }

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

        // The in-place local transform of the root at any frame, from the source keys.
        const inPlaceAt = (frame: number, position: Vector3, rotation: Quaternion) => {
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
            } else if (this._pivots) {
                this._rootTravelAt(start, start, yaw, true, travel);
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

        const position = new Vector3();
        const rotation = new Quaternion();
        const before = { position: new Vector3(), rotation: new Quaternion() };
        const after = { position: new Vector3(), rotation: new Quaternion() };

        // The keys of a channel with the motion left out, at the frames of the source keys.
        const inPlaceKeys = (sourceKeys: IAnimationKey[], kind: "position" | "rotationQuaternion" | "rotation"): IAnimationKey[] => {
            const keys: IAnimationKey[] = [];
            let previousRotation: Nullable<Quaternion> = null;
            let previousEuler: Nullable<Vector3> = null;
            for (const key of sourceKeys) {
                inPlaceAt(key.frame, position, rotation);
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
                    inPlaceAt(key.frame - TangentDelta, before.position, before.rotation);
                    inPlaceAt(key.frame + TangentDelta, after.position, after.rotation);
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

                keys.push({
                    frame: key.frame,
                    value,
                    inTangent: tangent(key.inTangent, -1),
                    outTangent: tangent(key.outTangent, 1),
                    interpolation: key.interpolation,
                    lockedTangent: key.lockedTangent,
                    easingFunction: key.easingFunction,
                });
            }
            return keys;
        };

        // A rewritten channel replaces the source's in the in-place group; the source animation is not touched.
        const replace = (source: Animation, kind: "position" | "rotationQuaternion" | "rotation"): void => {
            const animation = CloneAnimation(source);
            animation.setKeys(inPlaceKeys(source.getKeys(), kind), true);
            // By animation and target both: the same animation may drive other nodes earlier in the group.
            const index = this._sourceGroup.targetedAnimations.findIndex((targetedAnimation) => targetedAnimation.animation === source && targetedAnimation.target === root);
            group.targetedAnimations[index].animation = animation;
        };

        if (channels.position) {
            replace(channels.position, "position");
        } else {
            // A root that only turns gets a position channel of its own, holding it at its starting point while the
            // character turns about that point. It is the clip's clock, the channel the mixer weighs every clip of the
            // character on, and it keeps the root in place when another clip animates the position. Its keys are as
            // dense as the analysis: an animated ancestor between the root and the character makes the position vary.
            const rotationChannel = (channels.rotationQuaternion ?? channels.rotation)!;
            const staticKeys: IAnimationKey[] = [];
            for (let i = 0; i <= this._sampleCount; i++) {
                staticKeys.push({ frame: this._frameAt(i), value: root.position });
            }
            const animation = new Animation(`${root.name} position`, "position", rotationChannel.framePerSecond, Animation.ANIMATIONTYPE_VECTOR3, rotationChannel.loopMode);
            animation.enableBlending = rotationChannel.enableBlending;
            animation.blendingSpeed = rotationChannel.blendingSpeed;
            animation.setKeys(inPlaceKeys(staticKeys, "position"), true);
            group.addTargetedAnimation(animation, root);
            this._restoredPosition = root.position.clone();
            this._clockProperty = "position";
        }
        if (this._turns) {
            if (channels.rotationQuaternion) {
                replace(channels.rotationQuaternion, "rotationQuaternion");
            } else if (channels.rotation) {
                replace(channels.rotation, "rotation");
            }
        }
        return group;
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
        if (range <= 0 || (this._source === RootMotionSource.None && !this._turns)) {
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
            throw new Error(`RootMotionClip: bone "${node.name}" has no linked transform node; pass the transform node the bone drives instead.`);
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

/**
 * Moves and turns a character node by the root motion of the clips playing on it, once per animation step - from the
 * scene's onAfterAnimationsObservable, so after animations are evaluated and before the world matrices are computed.
 *
 * The motion of each clip follows the playback of its in-place group's root animation: the progress of the pose it
 * evaluated, so pausing, speed ratio changes, looping in every loop mode, forwards and backwards, playing a range,
 * synchronizing with another animatable and running to the end all move the character exactly as far as the pose went.
 * Clips playing together are blended the way the animation mixer blends their root pose: weighted animation groups
 * contribute their share, normalized once their weights add up to more than one, additive groups add theirs on top,
 * an unweighted group contributes its whole pose only while no weighted group animates the root (among unweighted
 * groups the last to write wins), and a group blending in contributes as much as it is blended in, so the character
 * moves with the blended pose whatever the clips do. The turn is blended as a weighted sum of the clips' turns.
 *
 * ```ts
 * const controller = new RootMotionController(character, [walk, run]);
 * walk.animationGroup.start(true);
 * run.animationGroup.start(true);
 * walk.animationGroup.weight = 0.3;
 * run.animationGroup.weight = 0.7;
 * ```
 */
export class RootMotionController implements IDisposable {
    /**
     * Gets or sets whether the motion is applied to the character node every frame. Set it to false to consume
     * {@link RootMotionController.deltaPosition} and {@link RootMotionController.deltaRotation} yourself, for example
     * to drive a physics character controller.
     */
    public applyToCharacter = true;

    /**
     * Notified every animation step the clips produce motion, after {@link RootMotionController.deltaPosition} and
     * {@link RootMotionController.deltaRotation} are updated.
     */
    public readonly onRootMotionObservable = new Observable<RootMotionController>();

    private readonly _characterNode: TransformNode;
    private readonly _clips: RootMotionClip[] = [];
    private readonly _sceneRootMotion: SceneRootMotion;
    private _upAxis: Nullable<Vector3> = null;
    private readonly _deltaPosition = Vector3.Zero();
    private _deltaRotation = 0;
    private readonly _frameDelta = Vector3.Zero();
    private _frameYaw = 0;
    private readonly _clipDelta = Vector3.Zero();

    /**
     * The node the motion is applied to.
     */
    public get characterNode(): TransformNode {
        return this._characterNode;
    }

    /**
     * The clips whose motion moves the character.
     */
    public get clips(): ReadonlyArray<RootMotionClip> {
        return this._clips;
    }

    /**
     * The travel of the last animation step, in world space; applied to the character unless
     * {@link RootMotionController.applyToCharacter} is false.
     */
    public get deltaPosition(): Vector3 {
        return this._deltaPosition;
    }

    /**
     * The turn of the last animation step about the up axis, in radians; applied to the character unless
     * {@link RootMotionController.applyToCharacter} is false.
     */
    public get deltaRotation(): number {
        return this._deltaRotation;
    }

    /**
     * Creates a controller for a character node.
     * @param characterNode defines the node to move: the character node of the clips
     * @param clips defines the clips to add
     */
    public constructor(characterNode: TransformNode, clips: RootMotionClip[] = []) {
        this._characterNode = characterNode;
        this._sceneRootMotion = SceneRootMotion.Get(characterNode.getScene());
        this._sceneRootMotion.add(this);
        for (const clip of clips) {
            this.addClip(clip);
        }
    }

    /**
     * Adds a clip, so the character moves while its in-place group plays.
     * @param clip defines the clip; its character node must be the controller's
     * @throws when the clip belongs to another controller, moves another node, or has another up axis than the clips
     * already added
     */
    public addClip(clip: RootMotionClip): void {
        if (clip._controller === this) {
            return;
        }
        if (clip._controller) {
            throw new Error(`RootMotionController: clip "${clip.animationGroup.name}" already belongs to another controller.`);
        }
        if (clip.characterNode !== this._characterNode) {
            throw new Error(
                `RootMotionController: clip "${clip.animationGroup.name}" moves "${clip.characterNode.name}", not "${this._characterNode.name}". Pass the controller's node as the clip's characterNode.`
            );
        }
        if (this._upAxis && !this._upAxis.equalsWithEpsilon(clip.upAxis)) {
            throw new Error(`RootMotionController: clip "${clip.animationGroup.name}" has another up axis than the clips already added.`);
        }
        this._upAxis = this._upAxis ?? clip.upAxis.clone();
        clip._controller = this;
        clip._forgetPlayback();
        this._clips.push(clip);
        this._sceneRootMotion.refresh();
    }

    /**
     * Removes a clip. Its in-place group keeps playing, in place.
     * @param clip defines the clip
     */
    public removeClip(clip: RootMotionClip): void {
        const index = this._clips.indexOf(clip);
        if (index < 0) {
            return;
        }
        this._clips.splice(index, 1);
        clip._controller = null;
        clip._writers = null;
        clip._forgetPlayback();
        if (!this._clips.length) {
            this._upAxis = null;
        }
        this._sceneRootMotion.refresh();
    }

    /**
     * Forgets where the playbacks were last measured. Call after jumping a group with goToFrame or resetting it, so the
     * jump is not read as motion. Starting a group again needs no reset.
     */
    public reset(): void {
        for (const clip of this._clips) {
            // Reset from an animation event, after the clock wrote the step: that evaluation predates the jump, and the
            // next one is the first to say where the playback carries on from.
            const runtime = clip._clockRuntime;
            clip._forgetPlayback();
            clip._staleRuntime = runtime;
            clip._staleProgress = runtime ? runtime._evaluatedProgress : null;
        }
        this._deltaPosition.setAll(0);
        this._deltaRotation = 0;
    }

    /**
     * Stops applying the motion and lets the clips go. The clips and their groups are not disposed.
     */
    public dispose(): void {
        for (const clip of this._clips) {
            clip._controller = null;
            clip._writers = null;
            clip._forgetPlayback();
        }
        this._clips.length = 0;
        this._upAxis = null;
        this._sceneRootMotion.remove(this);
        this.onRootMotionObservable.clear();
    }

    /**
     * @internal
     * Applies the motion of this frame, once the mixer's writers of the clips' channels are gathered.
     * @param animated defines whether the scene animated this step at all; when it did not, nothing moved and nothing
     * is read into the clips' playbacks
     */
    public _update(animated: boolean): void {
        const delta = this._frameDelta.setAll(0);
        this._frameYaw = 0;
        let moved = false;

        for (const clip of animated ? this._clips : []) {
            const writers = clip._writers;
            const previous = clip._clockRuntime;
            const found = clip._findClock();
            if (found !== previous) {
                // A runtime animation belongs to one playback. The previous playback's last evaluation is still to be
                // consumed if it wrote this step - it ran to its end, or a callback stopped it after it wrote - weighed
                // among the writers of this step like any other. One that did not write this step is forgotten: its
                // last evaluation was consumed in the step it wrote.
                if (previous && writers && clip._lastProgress !== null && !clip._parked && writers.current.indexOf(previous) >= 0) {
                    moved = this._accumulate(clip, previous, clip._lastProgress, previous._evaluatedProgress) || moved;
                }
                clip._clockRuntime = found;
                clip._clockAnimatable = found ? clip._foundAnimatable : null;
                clip._syncRuntime = null;
                clip._lastProgress = null;
                clip._parked = false;
            }
            if (!found || !writers) {
                continue;
            }
            const animatable = clip._clockAnimatable!;
            if (writers.current.indexOf(found) < 0) {
                // Did not write this step. Paused, its clock stands still too, and carries on from here when it resumes.
                // Parked at a weight of zero, the scene skips it while its clock runs on: it starts again from wherever
                // it resumes. Passed over for any other reason - by the scene's loop after a callback removed the
                // animatable before it, or restarted after being passed over as paused - its next evaluation catches up,
                // and the character with it.
                if (!animatable.paused && animatable.weight === 0) {
                    clip._parked = true;
                }
                continue;
            }
            if (clip._parked) {
                clip._parked = false;
                clip._lastProgress = null;
            }
            // The root the evaluation was actually clocked by, as it was made: a callback of this very step may have
            // synchronized the group afterwards, and this step's pose is still the one the old clock gave.
            const syncRoot = found._evaluatedSyncRoot;
            const syncRuntime = syncRoot ? (syncRoot.getAnimations()[0] ?? null) : null;
            if (syncRoot !== clip._syncRoot || syncRuntime !== clip._syncRuntime || found._evaluatedJump) {
                // Synchronized with another root, no longer synchronized at all and back on its own clock, or snapped
                // back by a root that cannot carry it to its end: the pose jumps, which is not travel.
                clip._syncRoot = syncRoot;
                clip._syncRuntime = syncRuntime;
                clip._lastProgress = null;
            }
            // The first evaluation of a playback only establishes where it began - unless the playback was reset since
            // that evaluation, by a callback in this step, in which case the next one does.
            const progress = found._evaluatedProgress;
            const lastProgress = clip._lastProgress;
            if (lastProgress === null && found === clip._staleRuntime && progress === clip._staleProgress) {
                continue;
            }
            clip._staleRuntime = null;
            clip._staleProgress = null;
            clip._lastProgress = progress;
            if (lastProgress !== null && progress !== lastProgress) {
                moved = this._accumulate(clip, found, lastProgress, progress) || moved;
            }
        }

        if (!moved) {
            this._deltaPosition.setAll(0);
            this._deltaRotation = 0;
            return;
        }
        const deltaYaw = this._frameYaw;
        this._deltaRotation = deltaYaw;

        const character = this._characterNode;
        const up = this._upAxis!;
        // Into the character's parent space through its own local rotation and scaling, not its world matrix: world
        // matrices are cached per render, so with fixed animation steps every step after the first in a frame would read
        // the facing from before the previous step's turn.
        const rotation = character.rotationQuaternion ?? Quaternion.FromEulerVectorToRef(character.rotation, TmpVectors.Quaternion[2]);
        Matrix.ComposeToRef(character.scaling, rotation, Vector3.ZeroReadOnly, TmpVectors.Matrix[3]);
        const parentDelta = Vector3.TransformNormalToRef(delta, TmpVectors.Matrix[3], TmpVectors.Vector3[4]);
        const parent = character.parent;
        if (parent) {
            // Computed now, not read from the cache: with several animation steps in a render the parent may have moved.
            Vector3.TransformNormalToRef(parentDelta, parent.computeWorldMatrix(true), this._deltaPosition);
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
     * Adds a clip's motion between two progresses of a playback into this frame's motion, weighted the way the mixer
     * weighs the pose of the playback.
     * @param clip defines the clip
     * @param runtime defines the runtime animation of the clip's clock
     * @param lastProgress defines the progress consumed before
     * @param progress defines the progress to consume
     * @returns whether anything was added
     */
    private _accumulate(clip: RootMotionClip, runtime: RuntimeAnimation, lastProgress: number, progress: number): boolean {
        if ((clip.source === RootMotionSource.None && !clip.extractsRotation) || !clip._writers) {
            return false;
        }
        const weight = this._effectiveWeight(clip._writers, runtime);
        if (weight === 0) {
            return false;
        }
        const yaw = clip._motionBetween(runtime._evaluatedFrom, runtime._evaluatedTo, lastProgress, progress, this._clipDelta);
        this._frameDelta.addInPlace(this._clipDelta.scaleInPlace(weight));
        this._frameYaw += yaw * weight;
        return true;
    }

    /**
     * The share of a playback in the pose the mixer wrote to its channel this step, following the late animation
     * bindings of the scene: an unweighted animatable writes directly and the last one wins, unless a weighted animatable
     * also animates the channel, in which case the weighted ones replace it - normalized once their weights add up to
     * more than one - and additive ones add their weight on top. A playback that ran to its end this step is among the
     * writers like any other, from its place in the order they wrote; one that did not write this step has no share;
     * one that wrote more than once - re-evaluated by an animation event, say - has the share of all its writes, as the
     * bindings add them up. A playback still blending in wrote that much of its pose, so the share follows the factor
     * its last write blended in with, taken from the record of that write rather than from the animation, whose own
     * factor a write made since the step may have moved on.
     * @param writers defines what the mixer wrote to the clip's channel this step
     * @param runtime defines the runtime animation of the clip's clock
     * @returns the share, between 0 and 1
     */
    private _effectiveWeight(writers: IChannelWriters, runtime: RuntimeAnimation): number {
        const runtimes = writers.current;
        let overrides = 0;
        let additives = 0;
        let direct = false;
        let weight = 0;
        let blending = 1;
        for (let i = 0; i < runtimes.length; i++) {
            if (runtimes[i] !== runtime) {
                continue;
            }
            // The bindings hold one entry per write, added up from the weights as written, but each entry is read with
            // the weight the runtime animation carries when the bindings are processed: that of its last write.
            weight = writers.currentWeights[i];
            blending = writers.currentBlending[i];
            if (weight < 0) {
                direct = true;
            } else if (writers.currentAdditive[i]) {
                additives++;
            } else {
                overrides++;
            }
        }
        let share = (overrides / Math.max(1, writers.total) + additives) * weight;
        if (direct && !writers.weighted && writers.lastDirect === runtime) {
            share += 1;
        }
        return share * blending;
    }
}

/**
 * The root motion controllers of a scene. After the scene's animations, one pass over the writes of the step - the
 * runtime animations that wrote, in that order, with the weights they wrote with, recorded as they did - gathers what
 * the mixer wrote to every channel a clip follows, then each controller applies its frame.
 */
class SceneRootMotion {
    private readonly _scene: Scene;
    private readonly _controllers: RootMotionController[] = [];
    private readonly _writers: IChannelWriters[] = [];
    private readonly _writersByNode = new Map<TransformNode, IChannelWriters[]>();
    private _observer: Nullable<Observer<Scene>>;

    /**
     * Gets the root motion of a scene, creating it if needed.
     * @param scene defines the scene
     * @returns the root motion of the scene
     */
    public static Get(scene: Scene): SceneRootMotion {
        let sceneRootMotion = SceneRootMotions.get(scene);
        if (!sceneRootMotion) {
            sceneRootMotion = new SceneRootMotion(scene);
            SceneRootMotions.set(scene, sceneRootMotion);
        }
        return sceneRootMotion;
    }

    private constructor(scene: Scene) {
        this._scene = scene;
        this._observer = scene.onAfterAnimationsObservable.add(() => this._update());
    }

    /**
     * Adds a controller, updated after those added before.
     * @param controller defines the controller
     */
    public add(controller: RootMotionController): void {
        this._controllers.push(controller);
        this.refresh();
    }

    /**
     * Removes a controller. The scene's root motion goes with its last controller.
     * @param controller defines the controller
     */
    public remove(controller: RootMotionController): void {
        const index = this._controllers.indexOf(controller);
        if (index >= 0) {
            this._controllers.splice(index, 1);
        }
        this.refresh();
        if (!this._controllers.length) {
            this._observer?.remove();
            this._observer = null;
            SceneRootMotions.delete(this._scene);
        }
    }

    /**
     * Gathers the channels the controllers' clips follow, once the clips of a controller change.
     */
    public refresh(): void {
        this._writers.length = 0;
        this._writersByNode.clear();
        for (const controller of this._controllers) {
            for (const clip of controller.clips) {
                const node = clip._clockNode;
                if (!node) {
                    clip._writers = null;
                    continue;
                }
                let entries = this._writersByNode.get(node);
                if (!entries) {
                    entries = [];
                    this._writersByNode.set(node, entries);
                }
                let entry = entries.find((candidate) => candidate.property === clip._clockProperty);
                if (!entry) {
                    entry = {
                        property: clip._clockProperty,
                        total: 0,
                        weighted: false,
                        lastDirect: null,
                        current: [],
                        currentWeights: [],
                        currentAdditive: [],
                        currentBlending: [],
                    };
                    entries.push(entry);
                    this._writers.push(entry);
                }
                clip._writers = entry;
            }
        }
    }

    private _update(): void {
        // A step the scene did not evaluate - its animations disabled when it began - wrote nothing and moved nothing,
        // and the clips' playbacks stand where they are: unlike a playback parked at a weight of zero, which an
        // evaluated step skips while its clock runs on. Whether the step evaluated is recorded by the step itself: a
        // callback may disable the animations after the step's writes, and the step still completes.
        const scene = this._scene;
        const animated = scene._animationStepEvaluated;
        const writers = this._writers;
        for (let i = 0; i < writers.length; i++) {
            const entry = writers[i];
            entry.total = 0;
            entry.weighted = false;
            entry.lastDirect = null;
            entry.current.length = 0;
            entry.currentWeights.length = 0;
            entry.currentAdditive.length = 0;
            entry.currentBlending.length = 0;
        }
        // What the mixer wrote this step: every write of a runtime animation to a target, in order, with the weight and
        // the mode it was made with, recorded as it was made rather than read back afterwards - one whose playback ran
        // to its end has left the active animatables, one stopped by a callback in the same step has lost its runtime
        // animations, one turned additive since was bound as it wrote, and an animation of several targets wrote each
        // of them. A paused animatable, one not started yet and one parked at a weight of zero wrote nothing.
        //
        // Only the writes the step's late bindings read: those of the step itself, up to the point the bindings were
        // processed. A write made after them - by an observer of this very notification, such as the one an animation
        // group started on a virtual timeline samples from, or by a callback between steps - reached no binding of this
        // step, so it says nothing about the pose the step blended. The scene holds such a write over to the front of
        // the next step's records, where it is read in its place: before that step's writes, which is where it stands
        // in the order the bindings resolve. Reading it here instead would make the frame's motion depend on whether
        // the controller was constructed before or after the observer that made it.
        const writes = scene._animationWrites;
        const count = animated ? scene._animationStepWriteCount : 0;
        for (let i = 0; i < count; i++) {
            const write = writes[i];
            const entries = this._writersByNode.get(write.target);
            if (!entries) {
                continue;
            }
            const runtime = write.runtimeAnimation!;
            const weight = write.weight;
            for (let k = 0; k < entries.length; k++) {
                const entry = entries[k];
                if (entry.property !== runtime.targetPath) {
                    continue;
                }
                entry.current.push(runtime);
                entry.currentWeights.push(weight);
                entry.currentAdditive.push(write.additive);
                entry.currentBlending.push(write.blendingFactor);
                if (weight < 0) {
                    // Direct writers overwrite one another in order, so the last one is the pose.
                    entry.lastDirect = runtime;
                } else {
                    entry.weighted = true;
                    if (!write.additive) {
                        entry.total += weight;
                    }
                }
            }
        }
        for (let i = 0; i < this._controllers.length; i++) {
            this._controllers[i]._update(animated);
        }
    }
}

/**
 * Clones an animation as {@link Animation.clone} does, keeping the easing function and events with it.
 * @param source defines the animation to clone
 * @param cloneKeys defines whether the keys and their values are cloned too, rather than shared until replaced
 * @returns the clone
 */
function CloneAnimation(source: Animation, cloneKeys = false): Animation {
    const animation = source.clone(cloneKeys);
    const easingFunction = source.getEasingFunction();
    if (easingFunction) {
        animation.setEasingFunction(easingFunction);
    }
    for (const event of source.getEvents()) {
        animation.addEvent(event);
    }
    return animation;
}

function IsJoint(node: Node): node is TransformNode {
    return node instanceof TransformNode && !(node instanceof AbstractMesh);
}

function WrapAngle(angle: number): number {
    return angle - 2 * Math.PI * Math.floor((angle + Math.PI) / (2 * Math.PI));
}
