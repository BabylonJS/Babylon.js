import { type AnimationGroup, type Animation, type Bone, type IAnimationKey, type IDisposable, type Node, type Nullable, type Observer, type Scene } from "core/index";
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
     * No travel was found: the clip neither translates its root nor walks its contact nodes.
     */
    None = 0,
    /**
     * The root node's own animated translation - the clip's ground truth. The travel is removed from the root's
     * keys, so the clip plays in place, and applied to the character node instead.
     */
    Root = 1,
    /**
     * Derived from the contact nodes (usually the feet) of an in-place clip: whatever a planted contact gives up
     * in character space, the character travels. The clip is left untouched.
     */
    FootContact = 2,
}

/**
 * Options for {@link RootMotion}.
 */
export interface IRootMotionOptions {
    /**
     * The node that carries the travel, usually the hips or a dedicated root bone. A bone is resolved to its linked
     * transform node. Defaults to the position-animated node with the most animated descendants in the group.
     */
    rootNode?: TransformNode | Bone;
    /**
     * The node that receives the travel and whose local space the travel is measured in. Defaults to the topmost
     * ancestor of the root node (the "__root__" node of a glTF asset).
     */
    characterNode?: TransformNode;
    /**
     * The nodes that touch the ground, used when the root does not travel. A bone is resolved to its linked
     * transform node. Defaults to the lowest leaf nodes under the root node.
     */
    contactNodes?: Array<TransformNode | Bone>;
    /**
     * Forces a source instead of trying {@link RootMotionSource.Root} first and falling back to
     * {@link RootMotionSource.FootContact}.
     */
    source?: RootMotionSource;
    /**
     * How densely the clip is sampled during analysis. Default is 60 samples per second of animation.
     */
    samplesPerSecond?: number;
    /**
     * Travel below this share of the character's height is treated as the clip standing still: root sway rather
     * than root motion. Default is 0.1.
     */
    minimumTravel?: number;
    /**
     * When false (the default) only the travel along the clip's direction of travel is extracted, leaving the
     * side-to-side sway of the root in the animation. Set to true to extract all horizontal motion, for strafing
     * or curved clips.
     */
    extractLateralMotion?: boolean;
    /**
     * The up axis in character space. Default is +Y.
     */
    upAxis?: Vector3;
    /**
     * Whether the travel is added to the character node's position every frame. Default is true. Set to false to
     * consume {@link RootMotion.deltaPosition} yourself, for example to drive a physics character controller.
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

/** Contact candidates must be this close to the lowest one, as a share of the character's height. */
const ContactHeightBand = 0.1;

/**
 * Root motion for an animation group: moves a character by the distance its animation covers, so the feet stay
 * planted instead of skating.
 *
 * The clip is analyzed once, when the RootMotion is created, without playing it or touching its playback state:
 * 1. The root node's own translation is tried first, as the ground truth. If it travels further than it could by
 *    swaying, that travel is removed from the root's keys - the clip then plays in place and loops without snapping
 *    back - and is applied to the character node instead.
 * 2. Otherwise the clip is treated as an in-place cycle and the travel is deduced from its contact nodes: the lowest
 *    contact is the planted one, and whatever it gives up in character space the character gains. The direction of
 *    travel falls out of the same measurement, so the forward axis of the rig does not have to be known.
 *
 * At runtime the travel follows the group's own playhead after animations are evaluated each frame, so pausing,
 * speedRatio, looping (forwards and backwards) and weighted blending between groups all carry the character
 * consistently with the pose. Call {@link RootMotion.reset} after jumping the group with goToFrame.
 *
 * Extract before starting the group: the root's position keys are rewritten in place, which affects every group
 * sharing that Animation. {@link RootMotion.dispose} restores them.
 */
export class RootMotion implements IDisposable {
    /**
     * Gets or sets whether the travel is added to the character node's position every frame.
     */
    public applyToCharacter: boolean;

    /**
     * Notified every frame the character travels, after {@link RootMotion.deltaPosition} is updated.
     */
    public readonly onRootMotionObservable = new Observable<RootMotion>();

    private readonly _group: AnimationGroup;
    private readonly _upAxis: Vector3;
    private readonly _extractLateral: boolean;
    private readonly _channels = new Map<Node, INodeChannels>();
    private _source = RootMotionSource.None;
    private _rootNode: Nullable<TransformNode> = null;
    private _characterNode: Nullable<TransformNode> = null;
    private _contactNodes: TransformNode[] = [];
    private readonly _travelDirection = new Vector3(0, 0, 1);
    private readonly _cycleOffset = Vector3.Zero();
    private readonly _deltaPosition = Vector3.Zero();
    private _duration = 0;
    private _characterHeight = 0;
    private _fromFrame = 0;
    private _toFrame = 0;
    private _sampleCount = 1;
    private _track = new Float32Array(6);
    private _restoredKeys: IKeyRecord[] = [];
    private _observer: Nullable<Observer<Scene>> = null;
    private _lastFrame: Nullable<number> = null;
    private readonly _localDelta = Vector3.Zero();
    private readonly _localOffset = Vector3.Zero();

    /**
     * Where the travel comes from. {@link RootMotionSource.None} when no travel was found.
     */
    public get source(): RootMotionSource {
        return this._source;
    }

    /**
     * The node that carries the travel, if one was found.
     */
    public get rootNode(): Nullable<TransformNode> {
        return this._rootNode;
    }

    /**
     * The node that receives the travel.
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
     * The direction the clip travels in, in character space (unit length).
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
     * Analyzes an animation group and starts applying its travel to the character node.
     * @param animationGroup defines the animation group to extract the root motion of
     * @param options defines how the root motion is extracted and applied
     */
    public constructor(animationGroup: AnimationGroup, options: IRootMotionOptions = {}) {
        this._group = animationGroup;
        this._upAxis = (options.upAxis ?? Vector3.UpReadOnly).normalizeToNew();
        this._extractLateral = !!options.extractLateralMotion;
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

        this._fromFrame = animationGroup.from;
        this._toFrame = animationGroup.to;
        const framePerSecond = targetedAnimations[0].animation.framePerSecond;
        this._duration = framePerSecond > 0 ? (this._toFrame - this._fromFrame) / framePerSecond : 0;
        this._sampleCount = Math.max(2, Math.ceil(this._duration * (options.samplesPerSecond ?? 60)));

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
            Logger.Warn(`RootMotion: the root node "${anchor.name}" has no parent to carry its travel.`);
            this._rootNode = null;
            return;
        }

        this._characterHeight = this._measureHeight(this._rootNode ?? this._characterNode);
        const minimumTravel = (options.minimumTravel ?? 0.1) * (this._characterHeight > 0 ? this._characterHeight : 1);
        const source = options.source;

        if ((source === undefined || source === RootMotionSource.Root) && this._rootNode && this._channels.get(this._rootNode)?.position) {
            if (this._analyzeRoot(minimumTravel, source === RootMotionSource.Root)) {
                this._source = RootMotionSource.Root;
            }
        }
        if (this._source === RootMotionSource.None && (source === undefined || source === RootMotionSource.FootContact)) {
            if (this._analyzeContacts(options.contactNodes, minimumTravel, source === RootMotionSource.FootContact)) {
                this._source = RootMotionSource.FootContact;
            }
        }

        if (this._source !== RootMotionSource.None) {
            this._observer = animationGroup.getScene().onAfterAnimationsObservable.add(() => this._update());
        }
    }

    /**
     * Gets the travel reached at a frame of the clip, relative to its first frame, in character space.
     * @param frame defines the frame to sample
     * @param result defines the vector receiving the travel
     * @returns the result vector
     */
    public getOffsetAtFrame(frame: number, result: Vector3): Vector3 {
        const range = this._toFrame - this._fromFrame;
        if (range <= 0 || this._source === RootMotionSource.None) {
            return result.setAll(0);
        }
        const samples = this._sampleCount;
        const exact = Math.min(samples, Math.max(0, ((frame - this._fromFrame) / range) * samples));
        const index = Math.min(samples - 1, Math.floor(exact));
        const blend = exact - index;
        const track = this._track;
        const a = index * 3;
        const b = a + 3;
        return result.set(track[a] + (track[b] - track[a]) * blend, track[a + 1] + (track[b + 1] - track[a + 1]) * blend, track[a + 2] + (track[b + 2] - track[a + 2]) * blend);
    }

    /**
     * Forgets the last frame the travel was measured from. Call after jumping the group with goToFrame, so the
     * jump is not read as travel.
     */
    public reset(): void {
        this._lastFrame = null;
        this._deltaPosition.setAll(0);
    }

    /**
     * Stops applying the travel and restores the root keys rewritten during extraction.
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
        if (!group.isStarted || !character) {
            this.reset();
            return;
        }

        const frame = group.getCurrentFrame();
        const lastFrame = this._lastFrame;
        this._lastFrame = frame;
        if (lastFrame === null || frame === lastFrame) {
            this._deltaPosition.setAll(0);
            return;
        }

        const delta = this.getOffsetAtFrame(frame, this._localDelta);
        delta.subtractInPlace(this.getOffsetAtFrame(lastFrame, this._localOffset));
        // The playhead wrapped: finish the cycle, then carry on from its start.
        const forwards = group.speedRatio >= 0;
        if (forwards ? frame < lastFrame : frame > lastFrame) {
            if (forwards) {
                delta.addInPlace(this._cycleOffset);
            } else {
                delta.subtractInPlace(this._cycleOffset);
            }
        }
        // A weighted group contributes its share, so blended groups add up to the blended pose.
        if (group.weight >= 0) {
            delta.scaleInPlace(group.weight);
        }

        Vector3.TransformNormalToRef(delta, character.computeWorldMatrix(), this._deltaPosition);
        if (this.applyToCharacter) {
            const parent = character.parent;
            if (parent) {
                const toParent = TmpVectors.Matrix[0];
                parent.computeWorldMatrix().invertToRef(toParent);
                character.position.addInPlace(Vector3.TransformNormalToRef(this._deltaPosition, toParent, TmpVectors.Vector3[0]));
            } else {
                character.position.addInPlace(this._deltaPosition);
            }
        }

        if (this.onRootMotionObservable.hasObservers()) {
            this.onRootMotionObservable.notifyObservers(this);
        }
    }

    private _analyzeRoot(minimumTravel: number, forced: boolean): boolean {
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
            return false;
        }
        if (net.lengthSquared() > 0) {
            this._travelDirection.copyFrom(net).normalize();
        }

        const offset = new Vector3();
        this._track = new Float32Array((samples + 1) * 3);
        for (let i = 0; i <= samples; i++) {
            this._project(positions[i].subtractToRef(start, offset), offset);
            offset.toArray(this._track, i * 3);
        }
        this._cycleOffset.fromArray(this._track, samples * 3);

        this._stripRootKeys(start);
        return true;
    }

    private _stripRootKeys(start: Vector3): void {
        const root = this._rootNode!;
        const animation = this._channels.get(root)!.position!;
        const parent = root.parent;
        const toCharacter = new Matrix();
        const toParent = new Matrix();
        const offset = new Vector3();
        const keys = animation.getKeys();

        // Cubic spline tangents carry the travel's rate of change; the removal is linear, so it applies to them too.
        const stripTangent = (tangent: Vector3 | undefined): Vector3 | undefined => {
            if (!tangent) {
                return tangent;
            }
            this._project(Vector3.TransformNormal(tangent, toCharacter), offset);
            return tangent.subtract(Vector3.TransformNormal(offset, toParent));
        };

        // Everything is computed from the original keys before anything is written: keys padded by
        // AnimationGroup.normalize share their neighbor's value object.
        const rewritten: IKeyRecord[] = [];
        for (const key of keys) {
            this._matrixToCharacter(parent, key.frame, toCharacter);
            toCharacter.invertToRef(toParent);

            const position = Vector3.TransformCoordinates(key.value, toCharacter);
            this._project(position.subtractInPlace(start), offset);
            const value = key.value.subtract(Vector3.TransformNormal(offset, toParent));

            rewritten.push({ key, value, inTangent: stripTangent(key.inTangent), outTangent: stripTangent(key.outTangent) });
            this._restoredKeys.push({ key, value: key.value, inTangent: key.inTangent, outTangent: key.outTangent });
        }

        for (const record of rewritten) {
            record.key.value = record.value;
            record.key.inTangent = record.inTangent;
            record.key.outTangent = record.outTangent;
        }
    }

    private _analyzeContacts(explicitContacts: Array<TransformNode | Bone> | undefined, minimumTravel: number, forced: boolean): boolean {
        const contacts = explicitContacts ? explicitContacts.map((node) => this._resolveNode(node)).filter((node): node is TransformNode => !!node) : this._findContactNodes();
        if (!contacts.length) {
            return false;
        }

        const samples = this._sampleCount;
        const up = this._upAxis;
        let previous = contacts.map(() => new Vector3());
        let current = contacts.map(() => new Vector3());
        let previousStance = -1;
        const stride = Vector3.Zero();
        const steps: Vector3[] = [];

        for (let i = 0; i <= samples; i++) {
            const frame = this._frameAt(i);
            let stance = 0;
            for (let c = 0; c < contacts.length; c++) {
                this._positionInCharacter(contacts[c], frame, current[c]);
                if (Vector3.Dot(current[c], up) < Vector3.Dot(current[stance], up)) {
                    stance = c;
                }
            }

            // The planted contact gives up in character space what the character gains. Across a change of planted
            // contact neither contact is planted for the whole interval, so the ground speed of the interval before
            // carries over instead - reading either contact would count the swap itself as travel, and skipping the
            // interval would lose a sample of travel at every step.
            const step = Vector3.Zero();
            if (i > 0 && stance === previousStance) {
                this._horizontal(previous[stance].subtractToRef(current[stance], step), step);
            } else if (i > 1) {
                step.copyFrom(steps[i - 1]);
            }
            stride.addInPlace(step);
            steps.push(step);
            previousStance = stance;
            const swap = previous;
            previous = current;
            current = swap;
        }

        if (stride.lengthSquared() > 0) {
            this._travelDirection.copyFrom(stride).normalize();
        }
        const track = new Float32Array((samples + 1) * 3);
        let distance = 0;
        for (let i = 0; i <= samples; i++) {
            distance += Vector3.Dot(steps[i], this._travelDirection);
            this._travelDirection.scaleToRef(distance, TmpVectors.Vector3[0]).toArray(track, i * 3);
        }
        if (!forced && distance < minimumTravel) {
            return false;
        }

        this._track = track;
        this._cycleOffset.fromArray(track, samples * 3);
        this._contactNodes = contacts;
        return true;
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

    private _findContactNodes(): TransformNode[] {
        const base = this._rootNode ?? this._characterNode!;
        const leaves = base.getDescendants(false, IsJoint).filter((node) => !node.getChildren(IsJoint, true).length) as TransformNode[];
        if (!leaves.length) {
            return [];
        }
        const position = new Vector3();
        const heights = leaves.map((node) => Vector3.Dot(this._positionInCharacter(node, this._fromFrame, position), this._upAxis));
        const lowest = Math.min(...heights);
        return leaves.filter((_, i) => heights[i] <= lowest + ContactHeightBand * this._characterHeight);
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

    private _positionInCharacter(node: TransformNode, frame: number, result: Vector3): Vector3 {
        const matrix = this._matrixToCharacter(node, frame, TmpVectors.Matrix[1]);
        return result.set(matrix.m[12], matrix.m[13], matrix.m[14]);
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
