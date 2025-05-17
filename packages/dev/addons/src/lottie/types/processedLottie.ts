import type { BezierCurveEase } from "core/Animations";
import type { Vector2 } from "core/Maths";

/* eslint-disable jsdoc/require-jsdoc */
export type LottieAnimation = {
    startFrame: number; // Frame number where the animation starts
    endFrame: number; // Frame number where the animation ends
    frameRate: number; // Frame rate of the animation
    layers: LottieLayer[]; // Array of layers in the animation, in top-down z order
};

export type LottieLayer = {
    parent?: number; // Index of the parent layer
    hidden: boolean; // Whether the layer is hidden
    inFrame: number; // Frame number where the layer becomes visible
    outFrame: number; // Frame number where the layer becomes invisible
    startTime: number; // Time when the layer starts
    timeStretch: number; // Time stretch factor
    transform: Transform; // Transform properties of the layer
    autoOrient: boolean; // Whether the layer auto-orients to its path
    shapes?: LottieSprite[]; // Array of shapes in the layer
};

export type LottieSprite = {
    hidden: boolean; // Whether the shape is hidden
    uvStart?: Vector2; // UV coordinates for the start of the shape
    uvEnd?: Vector2; // UV coordinates for the end of the shape
    transform?: Transform; // Transform properties of the shape
    child?: LottieSprite; // Array of child shapes
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
