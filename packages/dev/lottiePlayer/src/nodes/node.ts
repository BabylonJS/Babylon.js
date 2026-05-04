import { type IVector2Like } from "core/Maths/math.like";

import { type ScalarProperty, type Vector2Property } from "../parsing/parsedTypes";

import { ThinMatrix } from "../maths/matrix";

/**
 * Represents a node in the scenegraph that contains the animation information from a lottie animation layer or group.
 */
export class Node {
    private readonly _id: string;
    private readonly _position: Vector2Property;
    private readonly _rotation: ScalarProperty;
    private readonly _scale: Vector2Property;
    private _worldMatrix: ThinMatrix;
    private _localMatrix: ThinMatrix;
    private _globalMatrix: ThinMatrix;

    private readonly _opacity: ScalarProperty;

    private _parent: Node | undefined;
    private readonly _children: Node[];

    private _isVisible = false;

    private _isAnimated = false;

    private _animationsFunctions: ((frame: number) => boolean)[] = [];

    protected _isControl = false;
    protected _isShape = false;
    protected _isNullLayer = false;

    /**
     * Gets the id of this node.
     * @returns The unique identifier of this node.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Gets the childer of this node.
     * @returns An array of child nodes.
     */
    public get children(): Node[] {
        return this._children;
    }

    /**
     * Gets whether this node is a shape.
     * @returns True if this node is a shape, false otherwise.
     */
    public get isShape(): boolean {
        return this._isShape;
    }

    /**
     * Gets the world matrix of this node.
     * @returns The world matrix.
     */
    public get worldMatrix(): ThinMatrix {
        return this._worldMatrix;
    }

    /**
     * Gets whether this node is animated.
     * @returns True if this node has animations, false otherwise.
     */
    public get isAnimated(): boolean {
        return this._isAnimated;
    }

    /**
     * Gets the opacity of this node.
     * If the node is not visible, the opacity will be 0.
     * The opacity is multiplied by the parent opacity, except if the parent is a layer, in that case it is ignored
     * @returns The opacity of the node, from 0 to 1.
     */
    public get opacity(): number {
        if (!this._isVisible) {
            return 0;
        }

        if (this._opacity.currentValue === 0) {
            return 0;
        }

        // Skip parent opacity if parent is a null layer control node - null layers may have opacity 0
        // but their children should still be visible. Still multiply by the null layer's parent opacity
        // so that ancestors above the null layer are respected.
        if (this._parent && this._parent._isNullLayer) {
            return this._opacity.currentValue * (this._parent._parent?.opacity ?? 1);
        }

        return this._opacity.currentValue * (this._parent?.opacity ?? 1);
    }

    /**
     * Gets the initial scale of this node.
     * @returns The initial scale.
     */
    public get startScale(): IVector2Like {
        return this._scale.startValue;
    }

    /**
     * Gets the local position start value.
     */
    public get positionStart(): IVector2Like {
        return this._position.startValue;
    }

    /**
     * Gets the local position current value.
     */
    public get positionCurrent(): IVector2Like {
        return this._position.currentValue;
    }

    /**
     * Gets the local rotation start value (in degrees).
     */
    public get rotationStart(): number {
        return this._rotation.startValue;
    }

    /**
     * Gets the local rotation current value (in degrees).
     */
    public get rotationCurrent(): number {
        return this._rotation.currentValue;
    }

    /**
     * Gets the local scale start value.
     */
    public get scaleStart(): IVector2Like {
        return this._scale.startValue;
    }

    /**
     * Gets the local scale current value.
     */
    public get scaleCurrent(): IVector2Like {
        return this._scale.currentValue;
    }

    /**
     * Gets the parent node of this node.
     * @returns The parent node, or undefined if this is a root node.
     */
    public get parent(): Node | undefined {
        return this._parent;
    }

    /**
     * Sets the node visibility.
     * @param value The new visibility value.
     */
    public set isVisible(value: boolean) {
        if (this._isVisible === value) {
            return; // No change in visibility
        }
        this._isVisible = value;
        // Propage to children
        for (let i = 0; i < this._children.length; i++) {
            this._children[i].isVisible = value;
        }
    }

    /**
     * Constructs a new node.
     * @param id Unique identifier for the node.
     * @param position Position of the node in the scene.
     * @param rotation Rotation of the node in degrees.
     * @param scale Scale of the node in the scene.
     * @param opacity Opacity of the node, from 0 to 1.
     * @param parent Parent node in the scenegraph.
     */
    public constructor(id: string, position?: Vector2Property, rotation?: ScalarProperty, scale?: Vector2Property, opacity?: ScalarProperty, parent?: Node) {
        this._isVisible = false;

        this._id = id;

        this._position = position || { startValue: { x: 0, y: 0 }, currentValue: { x: 0, y: 0 }, currentKeyframeIndex: 0 };
        this._rotation = rotation || { startValue: 0, currentValue: 0, currentKeyframeIndex: 0 };
        this._scale = scale || { startValue: { x: 1, y: 1 }, currentValue: { x: 1, y: 1 }, currentKeyframeIndex: 0 };
        this._localMatrix = new ThinMatrix();
        this._globalMatrix = new ThinMatrix();

        // Store the matrix at least once
        this._localMatrix.compose(this._scale.currentValue, this._rotation.currentValue, this._position.currentValue);

        this._opacity = opacity || { startValue: 1, currentValue: 1, currentKeyframeIndex: 0 };

        // Animated ?
        if (this._position.keyframes !== undefined && this._position.keyframes.length > 0) {
            this._isAnimated = true;
            this._animationsFunctions.push((frame) => {
                return this._updatePosition(frame);
            });
        }

        if (this._rotation.keyframes !== undefined && this._rotation.keyframes.length > 0) {
            this._isAnimated = true;
            this._animationsFunctions.push((frame) => {
                return this._updateRotation(frame);
            });
        }

        if (this._scale.keyframes !== undefined && this._scale.keyframes.length > 0) {
            this._isAnimated = true;
            this._animationsFunctions.push((frame) => {
                return this._updateScale(frame);
            });
        }

        // Parenting
        this._children = [];
        if (parent) {
            this._worldMatrix = this._globalMatrix;

            this._parent = parent;
            parent._children.push(this);
            this._localMatrix.multiplyToRef(parent._worldMatrix, this._globalMatrix);
        } else {
            this._worldMatrix = this._localMatrix;
        }
    }
    /**
     * Resets the node's properties to their initial values.
     */
    public reset(): void {
        // Vectors need to be copied to avoid modifying the original start values
        this._position.currentValue = { x: this._position.startValue.x, y: this._position.startValue.y };
        if (this._position.keyframes) {
            this._position.currentKeyframeIndex = 0;
        }

        this._rotation.currentValue = this._rotation.startValue;
        if (this._rotation.keyframes) {
            this._rotation.currentKeyframeIndex = 0;
        }

        this._scale.currentValue = { x: this._scale.startValue.x, y: this._scale.startValue.y };
        if (this._scale.keyframes) {
            this._scale.currentKeyframeIndex = 0;
        }

        this._opacity.currentValue = this._opacity.startValue;
        if (this._opacity.keyframes) {
            this._opacity.currentKeyframeIndex = 0;
        }

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].reset();
        }

        // On reset update the scenegraph so all matrices are reset to their initial values
        if (this._parent === undefined) {
            this.update(0, false, true);
        }

        this._isVisible = false;
    }

    /**
     * Updates the node's properties based on the current frame of the animation.
     * @param frame Frame number we are playing in the animation.
     * @param isParentUpdated Whether the parent node has been updated.
     * @param isReset Whether the node is being reset.
     * @returns True if the node was updated, false otherwise.
     */
    public update(frame: number, isParentUpdated = false, isReset = false): boolean {
        let isUpdated = isReset;

        if (this.isAnimated) {
            for (let i = 0; i < this._animationsFunctions.length; i++) {
                isUpdated = this._animationsFunctions[i](frame) || isUpdated;
            }

            if (isUpdated) {
                this._localMatrix.compose(this._scale.currentValue, this._rotation.currentValue, this._position.currentValue);
            }
        }

        if (this._parent) {
            if (isParentUpdated || isUpdated) {
                this._localMatrix.multiplyToRef(this._parent._worldMatrix, this._globalMatrix);
            }
        }

        this._updateOpacity(frame);

        for (let i = 0; i < this._children.length; i++) {
            // Propagate `isReset` so animated descendants whose first keyframe is after `frame` still
            // recompose their localMatrix from the just-reset `currentValue`. Without this, after a
            // loop wrap the child would keep the END-of-previous-loop interpolated localMatrix even
            // though `reset()` already restored its `currentValue` to `startValue`.
            this._children[i].update(frame, isUpdated || isParentUpdated, isReset);
        }

        return isUpdated || isParentUpdated;
    }

    /**
     * Evaluates the world matrix at a specific frame without mutating any node state.
     * @param frame The frame number to evaluate at.
     * @param scale Output vector to receive the decomposed scale.
     * @param translation Output vector to receive the decomposed translation.
     * @returns The rotation in radians.
     */
    public decomposeWorldMatrixAtFrame(frame: number, scale: IVector2Like, translation: IVector2Like): number {
        // Collect the chain from this node up to the root.
        const chain: Node[] = [this];
        let parent = this._parent;
        while (parent) {
            chain.push(parent);
            parent = parent._parent;
        }

        // Iterative compose: two matrices + two vector scratches, independent of chain depth.
        const acc = Node._ComposeScratchA;
        const tmp = Node._ComposeScratchB;
        const scratchScale = Node._ComposeScratchScale;
        const scratchPos = Node._ComposeScratchPos;

        chain[0]._composeLocalAtFrame(frame, acc, scratchScale, scratchPos);
        for (let i = 1; i < chain.length; i++) {
            chain[i]._composeLocalAtFrame(frame, tmp, scratchScale, scratchPos);
            // world(node) = node_local * parent_world, so accumulate: acc = acc * ancestor_local.
            // multiplyToRef captures all inputs before writing, so acc can be the output.
            acc.multiplyToRef(tmp, acc);
        }

        return acc.decompose(scale, translation);
    }

    private _composeLocalAtFrame(frame: number, output: ThinMatrix, scratchScale: IVector2Like, scratchPos: IVector2Like): void {
        const scaleIdx = Node._InterpolateVector2AtFrame(this._scale, frame, 0, scratchScale);
        const scale = scaleIdx >= 0 ? scratchScale : this._scale.startValue;

        const rotationIdx = Node._InterpolateScalarAtFrame(this._rotation, frame, 0, Node._ScalarScratch);
        // Keyframe values are stored without negation (negation is applied at runtime),
        // but startValue is already negated by the parser, so only negate interpolated results.
        const rotation = rotationIdx >= 0 ? -Node._ScalarScratch.value : this._rotation.startValue;

        const positionIdx = Node._InterpolateVector2AtFrame(this._position, frame, 0, scratchPos);
        const position = positionIdx >= 0 ? scratchPos : this._position.startValue;

        output.compose(scale, rotation, position);
    }

    // Scratch storage shared across interpolation helpers. Safe because all uses are synchronous
    // and the results are consumed immediately after each call.
    private static readonly _ScalarScratch: { value: number } = { value: 0 };
    private static readonly _ComposeScratchA: ThinMatrix = new ThinMatrix();
    private static readonly _ComposeScratchB: ThinMatrix = new ThinMatrix();
    private static readonly _ComposeScratchScale: IVector2Like = { x: 0, y: 0 };
    private static readonly _ComposeScratchPos: IVector2Like = { x: 0, y: 0 };

    /**
     * Interpolates a Vector2 property at a given frame and writes the result into `output`.
     * @param property The Vector2 property to interpolate.
     * @param frame The frame number to evaluate at.
     * @param startIndex The keyframe index to start scanning from (for sequential playback optimization).
     * @param output The vector that receives the interpolated value (only written when the return value is not -1).
     * @returns The resolved segment index (0..len-2), or `len-1` if the frame is at/after the last keyframe,
     * or `-1` if the frame is before the first keyframe or the property has no keyframes (in which case
     * `output` is left unchanged).
     */
    private static _InterpolateVector2AtFrame(property: Vector2Property, frame: number, startIndex: number, output: IVector2Like): number {
        const keyframes = property.keyframes;
        if (!keyframes || keyframes.length === 0) {
            return -1;
        }

        if (frame < keyframes[0].time) {
            return -1;
        }

        const lastIdx = keyframes.length - 1;
        if (frame >= keyframes[lastIdx].time) {
            const last = keyframes[lastIdx].value;
            output.x = last.x;
            output.y = last.y;
            return lastIdx;
        }

        let segmentIndex = -1;
        for (let i = startIndex; i < lastIdx; i++) {
            if (frame >= keyframes[i].time && frame < keyframes[i + 1].time) {
                segmentIndex = i;
                break;
            }
        }

        if (segmentIndex === -1) {
            return -1;
        }

        const currentKeyframe = keyframes[segmentIndex];
        const nextKeyframe = keyframes[segmentIndex + 1];
        const gradient = (frame - currentKeyframe.time) / (nextKeyframe.time - currentKeyframe.time);

        const easeFactor1 = currentKeyframe.easeFunction1.interpolate(gradient);
        const easeFactor2 = currentKeyframe.easeFunction2.interpolate(gradient);

        output.x = currentKeyframe.value.x + easeFactor1 * (nextKeyframe.value.x - currentKeyframe.value.x);
        output.y = currentKeyframe.value.y + easeFactor2 * (nextKeyframe.value.y - currentKeyframe.value.y);
        return segmentIndex;
    }

    /**
     * Interpolates a scalar property at a given frame and writes the result into `output.value`.
     * @param property The scalar property to interpolate.
     * @param frame The frame number to evaluate at.
     * @param startIndex The keyframe index to start scanning from (for sequential playback optimization).
     * @param output Holder that receives the interpolated value (only written when the return value is not -1).
     * @returns The resolved segment index (0..len-2), or `len-1` if the frame is at/after the last keyframe,
     * or `-1` if the frame is before the first keyframe or the property has no keyframes (in which case
     * `output.value` is left unchanged).
     */
    private static _InterpolateScalarAtFrame(property: ScalarProperty, frame: number, startIndex: number, output: { value: number }): number {
        const keyframes = property.keyframes;
        if (!keyframes || keyframes.length === 0) {
            return -1;
        }

        if (frame < keyframes[0].time) {
            return -1;
        }

        const lastIdx = keyframes.length - 1;
        if (frame >= keyframes[lastIdx].time) {
            output.value = keyframes[lastIdx].value;
            return lastIdx;
        }

        let segmentIndex = -1;
        for (let i = startIndex; i < lastIdx; i++) {
            if (frame >= keyframes[i].time && frame < keyframes[i + 1].time) {
                segmentIndex = i;
                break;
            }
        }

        if (segmentIndex === -1) {
            return -1;
        }

        const currentKeyframe = keyframes[segmentIndex];
        const nextKeyframe = keyframes[segmentIndex + 1];
        const gradient = (frame - currentKeyframe.time) / (nextKeyframe.time - currentKeyframe.time);

        const easeFactor = currentKeyframe.easeFunction?.interpolate(gradient) ?? 0;
        output.value = currentKeyframe.value + easeFactor * (nextKeyframe.value - currentKeyframe.value);
        return segmentIndex;
    }

    private _updatePosition(frame: number): boolean {
        const idx = Node._InterpolateVector2AtFrame(this._position, frame, this._position.currentKeyframeIndex, this._position.currentValue);
        if (idx < 0) {
            return false;
        }
        // Only advance when we resolved a real segment; leave the index alone when clamped to the last keyframe
        // to match prior behavior (the original update loop only ran up to keyframes.length - 1, exclusive).
        if (idx < this._position.keyframes!.length - 1) {
            this._position.currentKeyframeIndex = idx;
        }
        return true;
    }

    private _updateRotation(frame: number): boolean {
        const idx = Node._InterpolateScalarAtFrame(this._rotation, frame, this._rotation.currentKeyframeIndex, Node._ScalarScratch);
        if (idx < 0) {
            return false;
        }
        if (idx < this._rotation.keyframes!.length - 1) {
            this._rotation.currentKeyframeIndex = idx;
        }
        this._rotation.currentValue = -Node._ScalarScratch.value;
        return true;
    }

    private _updateScale(frame: number): boolean {
        const idx = Node._InterpolateVector2AtFrame(this._scale, frame, this._scale.currentKeyframeIndex, this._scale.currentValue);
        if (idx < 0) {
            return false;
        }
        if (idx < this._scale.keyframes!.length - 1) {
            this._scale.currentKeyframeIndex = idx;
        }
        return true;
    }

    private _updateOpacity(frame: number): boolean {
        if (this._opacity.keyframes === undefined || this._opacity.keyframes.length === 0) {
            return false;
        }

        const idx = Node._InterpolateScalarAtFrame(this._opacity, frame, this._opacity.currentKeyframeIndex, Node._ScalarScratch);
        if (idx < 0) {
            return false;
        }
        if (idx < this._opacity.keyframes.length - 1) {
            this._opacity.currentKeyframeIndex = idx;
        }
        this._opacity.currentValue = Node._ScalarScratch.value;
        return true;
    }
}
