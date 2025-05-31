import type { BezierCurveEase } from "core/Animations";
import type { Vector2 } from "core/Maths";
import type { TransformNode } from "core/Meshes";

/* Error constants for lottie features we do not support */
export const LayerUnsuportedType = "Layer type not supported. Only 'shape' and 'null' layers are supported.";
export const LayerTooDeep = "Layer nesting too deep. Only 2 levels of nesting (parent-child) are supported.";
export const ShapeUnsupportedTopLevelType = "Shape type not supported for top level shape. Only supported top-level shape type is 'group'.";
export const ShapeUnsupportedChildType =
    "Shape type not supported for child shape. Only supported child shape types are 'group', 'transform', 'path', 'rectangle', 'fill', and 'gradientfill'.";
export const ShapeAnimatedPathProperty = "Animated path properties are not supported.";
export const PropertyInvalidVector2Length = "Vector2 property must have exactly 2 values.";

/* eslint-disable jsdoc/require-jsdoc */
export type LottieAnimation = {
    startFrame: number; // Frame number where the animation starts
    endFrame: number; // Frame number where the animation ends
    frameRate: number; // Frame rate of the animation
    layers: Map<number, LottieLayer>; // Array of layers in the animation, in top-down z order
};

export type LottieLayer = {
    name: string;
    index: number; // Index of the layer, used for parenting layers
    parentIndex?: number; // Index of the parent layer, if any
    inFrame: number; // Frame number where the layer becomes visible
    outFrame: number; // Frame number where the layer becomes invisible
    startTime: number; // Time when the layer starts
    timeStretch: number; // Time stretch factor
    autoOrient: boolean; // Whether the layer auto-orients to its path
    isVisible: boolean; // Whether this layer is visible
    transform: Transform; // Initial transform properties and animations of the layer
    node: TransformNode; // Sprite to render, it will contain the current transformed values
};

export type LottieSprite = {
    isVisible: boolean; // Whether the shape is visible
    transform?: Transform; // Initial transform properties and animations of the shape
    child?: LottieSprite; // Children, if any
};

export type Transform = {
    anchorPoint?: Vector2Property;
    position?: Vector2Property;
    rotation?: ScalarProperty;
    scale?: Vector2Property;
    opacity?: ScalarProperty;
};

export type ScalarProperty = {
    startValue: number;
    keyframes?: ScalarKeyframe[];
};

export type ScalarKeyframe = {
    value: number;
    time: number;
    easeFunction?: BezierCurveEase;
};

export type Vector2Property = {
    startValue: Vector2;
    keyframes?: Vector2Keyframe[];
};

export type Vector2Keyframe = {
    value: Vector2;
    time: number;
    easeFunction1?: BezierCurveEase;
    easeFunction2?: BezierCurveEase;
};
