import type { IVector2Like } from "core/Maths/math.like";

import type { BezierCurve } from "../maths/bezier";

import type { Node } from "../rendering/node";

/**
 * Represents a Babylon.js thin version of a Lottie animation.
 */
export type AnimationInfo = {
    /**
     * Frame number where the animation starts.
     */
    startFrame: number;
    /**
     * Frame number where the animation ends.
     */
    endFrame: number;
    /**
     * Frame rate of the animation.
     */
    frameRate: number;
    /**
     * Width of the animation in pixels
     */
    widthPx: number;
    /**
     * Height of the animation in pixels
     */
    heightPx: number;
    /**
     * Nodes representing the animation
     */
    nodes: Node[];
};

/**
 * Transform properties for a Lottie animation.
 * Any of these properties may be animated.
 */
export type Transform = {
    /**
     * The anchor point of the layer, which is the point around which transformations are applied.
     */
    anchorPoint: Vector2Property;
    /**
     * The position of the layer in the animation.
     */
    position: Vector2Property;
    /**
     * The rotation of the layer in degrees.
     */
    rotation: ScalarProperty;
    /**
     * The scale of the layer in the X and Y axis.
     */
    scale: Vector2Property;
    /**
     * The opacity of the layer, represented as a scalar value.
     */
    opacity: ScalarProperty;
};

/**
 * Represents a scalar that can be animated.
 */
export type ScalarProperty = {
    /**
     * The initial value of the property at the start of the animation.
     */
    startValue: number;
    /**
     * The current value of the property during the animation.
     */
    currentValue: number;
    /**
     * An array of keyframes for the property.
     */
    keyframes?: ScalarKeyframe[];
    /**
     * The index of the current keyframe being processed in the animation.
     */
    currentKeyframeIndex: number;
};

/**
 * Represents a keyframe for a scalar property.
 */
export type ScalarKeyframe = {
    /**
     * The value at this keyframe.
     */
    value: number;
    /**
     * The time at which this keyframe occurs in the animation, in frames.
     */
    time: number;
    /**
     * The easing function applied to the transition from this keyframe to the next one.
     */
    easeFunction: BezierCurve;
};

/**
 * Represents a 2D vector that can be animated.
 */
export type Vector2Property = {
    /**
     * The initial value at the start of the animation.
     */
    startValue: IVector2Like;
    /**
     * The current value during the animation.
     */
    currentValue: IVector2Like;
    /**
     * An array of keyframes for the property.
     */
    keyframes?: Vector2Keyframe[];
    /**
     * The index of the current keyframe being processed in the animation.
     */
    currentKeyframeIndex: number;
};

/**
 * Represents a keyframe for a 2D vector property.
 */
export type Vector2Keyframe = {
    /**
     * The value at this keyframe.
     */
    value: IVector2Like;
    /**
     * The time at which this keyframe occurs in the animation, in frames.
     */
    time: number;
    /**
     * The easing function applied to the transition from this keyframe to the next one.
     * This is used for the first dimension of the vector.
     */
    easeFunction1: BezierCurve;
    /**
     * The easing function applied to the transition from this keyframe to the next one.
     * This is used for the second dimension of the vector.
     */
    easeFunction2: BezierCurve;
};
