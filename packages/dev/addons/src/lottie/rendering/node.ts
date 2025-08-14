import type { IVector2Like } from "core/Maths/math.like";

import type { ScalarProperty, Vector2Property } from "../lottie/parsedTypes";

import { ThinMatrix } from "../maths/matrix";

/**
 * Represents a node in the scenegraph that contains the animation information from a lottie animation layer or group.
 */
export class Node {
    private readonly _id: string;
    private readonly _ignoreOpacityAnimations: boolean;
    private readonly _position: Vector2Property;
    private readonly _rotation: ScalarProperty;
    private readonly _scale: Vector2Property;
    private _worldMatrix: ThinMatrix;
    private _localMatrix: ThinMatrix;
    private _globalMatrix: ThinMatrix;

    private readonly _opacity: ScalarProperty;

    private readonly _parent: Node | undefined;
    private readonly _children: Node[];

    private _isVisible = false;

    private _isAnimated = false;

    private _animationsFunctions: ((frame: number) => boolean)[] = [];

    protected _isControl = false;
    protected _isShape = false;

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
     * @returns The opacity of the node, from 0 to 1.
     */
    public get opacity(): number {
        if (!this._isVisible) {
            return 0;
        }

        return this._opacity.currentValue / 100.0;
    }

    /**
     * Gets the initial scale of this node.
     * @returns The initial scale.
     */
    public get startScale(): IVector2Like {
        return this._scale.startValue;
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
     * @param ignoreOpacityAnimations If there are no animations on opacity, mark this as true to ignore and optimize CPU usage.
     * @param position Position of the node in the scene.
     * @param rotation Rotation of the node in degrees.
     * @param scale Scale of the node in the scene.
     * @param opacity Opacity of the node, from 0 to 1.
     * @param parent Parent node in the scenegraph.
     */
    public constructor(
        id: string,
        ignoreOpacityAnimations: boolean,
        position?: Vector2Property,
        rotation?: ScalarProperty,
        scale?: Vector2Property,
        opacity?: ScalarProperty,
        parent?: Node
    ) {
        this._isVisible = false;

        this._id = id;
        this._ignoreOpacityAnimations = ignoreOpacityAnimations;

        this._position = position || { startValue: { x: 0, y: 0 }, currentValue: { x: 0, y: 0 }, currentKeyframeIndex: 0 };
        this._rotation = rotation || { startValue: 0, currentValue: 0, currentKeyframeIndex: 0 };
        this._scale = scale || { startValue: { x: 1, y: 1 }, currentValue: { x: 1, y: 1 }, currentKeyframeIndex: 0 };
        this._localMatrix = new ThinMatrix();
        this._globalMatrix = new ThinMatrix();

        // Store the matrix at least once
        this._localMatrix.compose(this._scale.currentValue, this._rotation.currentValue, this._position.currentValue);

        this._opacity = opacity || { startValue: 100, currentValue: 100, currentKeyframeIndex: 0 };

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

            if (parent.isAnimated || !parent.parent || this.isAnimated || parent._isControl) {
                this._parent = parent;
                parent._children.push(this);
                this._localMatrix.multiplyToRef(parent._worldMatrix, this._globalMatrix);
            } else {
                // We can merge them
                this._localMatrix.multiplyToRef(parent._localMatrix, this._localMatrix);

                // New parent
                this._parent = parent.parent;
                this._localMatrix.multiplyToRef(this._parent._worldMatrix, this._globalMatrix);
                parent.parent._children.push(this);
            }
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
        let isUpdated = false || isReset;

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

        if (!this._ignoreOpacityAnimations) {
            this._updateOpacity(frame);
        }

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].update(frame, isUpdated || isParentUpdated);
        }

        return isUpdated || isParentUpdated;
    }

    private _updatePosition(frame: number): boolean {
        const keyframes = this._position.keyframes!;

        if (frame < keyframes[0].time) {
            return false; // Animation not started yet
        }

        if (frame > keyframes[keyframes.length - 1].time) {
            this._position.currentValue = keyframes[keyframes.length - 1].value;
            return true;
        }

        // Find the right keyframe we are currently in
        let currentFrameIndex = -1;
        for (let i = this._position.currentKeyframeIndex; i < keyframes.length - 1; i++) {
            if (frame >= keyframes[i].time && frame < keyframes[i + 1].time) {
                currentFrameIndex = i;
                this._position.currentKeyframeIndex = currentFrameIndex;
                break;
            }
        }

        if (currentFrameIndex === -1) {
            return false; // No valid keyframe found for the current animation frame
        }

        const currentVector2Keyframe = keyframes[currentFrameIndex];
        const nextVector2Keyframe = keyframes[currentFrameIndex + 1];

        // Animate the position
        const gradient = (frame - currentVector2Keyframe.time) / (nextVector2Keyframe.time - currentVector2Keyframe.time);

        const easeGradientFactor = currentVector2Keyframe.easeFunction1.interpolate(gradient);
        this._position.currentValue.x = currentVector2Keyframe.value.x + easeGradientFactor * (nextVector2Keyframe.value.x - currentVector2Keyframe.value.x);

        const easeGradientFactor2 = currentVector2Keyframe.easeFunction2.interpolate(gradient);
        this._position.currentValue.y = currentVector2Keyframe.value.y + easeGradientFactor2 * (nextVector2Keyframe.value.y - currentVector2Keyframe.value.y);

        return true;
    }

    private _updateRotation(frame: number): boolean {
        const keyframes = this._rotation.keyframes!;

        if (frame < keyframes[0].time) {
            return false; // Animation not started yet
        }

        if (frame > keyframes[keyframes.length - 1].time) {
            this._rotation.currentValue = keyframes[keyframes.length - 1].value;
            return true;
        }

        // Find the right keyframe we are currently in
        let currentFrameIndex = -1;
        for (let i = this._rotation.currentKeyframeIndex; i < keyframes.length - 1; i++) {
            if (frame >= keyframes[i].time && frame < keyframes[i + 1].time) {
                currentFrameIndex = i;
                this._rotation.currentKeyframeIndex = currentFrameIndex;
                break;
            }
        }

        if (currentFrameIndex === -1) {
            return false; // No valid keyframe found for the current animation frame
        }

        const currentScalarKeyframe = keyframes[currentFrameIndex];
        const nextScalarKeyframe = keyframes[currentFrameIndex + 1];

        // Animate the position
        const gradient = (frame - currentScalarKeyframe.time) / (nextScalarKeyframe.time - currentScalarKeyframe.time);

        const easeGradientFactor = currentScalarKeyframe.easeFunction.interpolate(gradient);
        this._rotation.currentValue = -(currentScalarKeyframe.value + easeGradientFactor * (nextScalarKeyframe.value - currentScalarKeyframe.value));

        return true;
    }

    private _updateScale(frame: number): boolean {
        const keyframes = this._scale.keyframes!;

        if (frame < keyframes[0].time) {
            return false; // Animation not started yet
        }

        if (frame > keyframes[keyframes.length - 1].time) {
            this._scale.currentValue = keyframes[keyframes.length - 1].value;
            return true;
        }

        // Find the right keyframe we are currently in
        let currentFrameIndex = -1;
        for (let i = this._scale.currentKeyframeIndex; i < keyframes.length - 1; i++) {
            if (frame >= keyframes[i].time && frame < keyframes[i + 1].time) {
                currentFrameIndex = i;
                this._scale.currentKeyframeIndex = currentFrameIndex;
                break;
            }
        }

        if (currentFrameIndex === -1) {
            return false; // No valid keyframe found for the current animation frame
        }

        const currentVector2Keyframe = keyframes[currentFrameIndex];
        const nextVector2Keyframe = keyframes[currentFrameIndex + 1];

        // Animate the scale
        const gradient = (frame - currentVector2Keyframe.time) / (nextVector2Keyframe.time - currentVector2Keyframe.time);

        const easeGradientFactor = currentVector2Keyframe.easeFunction1.interpolate(gradient);
        this._scale.currentValue.x = currentVector2Keyframe.value.x + easeGradientFactor * (nextVector2Keyframe.value.x - currentVector2Keyframe.value.x);

        const easeGradientFactor2 = currentVector2Keyframe.easeFunction2.interpolate(gradient);
        this._scale.currentValue.y = currentVector2Keyframe.value.y + easeGradientFactor2 * (nextVector2Keyframe.value.y - currentVector2Keyframe.value.y);

        return true;
    }

    private _updateOpacity(frame: number): boolean {
        if (this._opacity.keyframes === undefined || this._opacity.keyframes.length === 0) {
            return false;
        }

        if (frame < this._opacity.keyframes[0].time) {
            return false; // Animation not started yet
        }

        if (frame > this._opacity.keyframes[this._opacity.keyframes.length - 1].time) {
            this._opacity.currentValue = this._opacity.keyframes[this._opacity.keyframes.length - 1].value;
            return true;
        }

        // Find the right keyframe we are currently in
        let currentFrameIndex = -1;
        for (let i = this._opacity.currentKeyframeIndex; i < this._opacity.keyframes.length - 1; i++) {
            if (frame >= this._opacity.keyframes[i].time && frame < this._opacity.keyframes[i + 1].time) {
                currentFrameIndex = i;
                this._opacity.currentKeyframeIndex = currentFrameIndex;
                break;
            }
        }

        if (currentFrameIndex === -1) {
            return false; // No valid keyframe found for the current animation frame
        }

        const currentScalarKeyframe = this._opacity.keyframes[currentFrameIndex];
        const nextScalarKeyframe = this._opacity.keyframes[currentFrameIndex + 1];

        // Animate the opacity
        const gradient = (frame - currentScalarKeyframe.time) / (nextScalarKeyframe.time - currentScalarKeyframe.time);

        const easeGradientFactor = currentScalarKeyframe.easeFunction.interpolate(gradient);
        this._opacity.currentValue = currentScalarKeyframe.value + easeGradientFactor * (nextScalarKeyframe.value - currentScalarKeyframe.value);

        return true;
    }
}
