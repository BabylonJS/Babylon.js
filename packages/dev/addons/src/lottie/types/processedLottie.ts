import type { BezierCurveEase } from "core/Animations";
import type { Vector2 } from "core/Maths";
import type { Mesh } from "core/Meshes";

/* eslint-disable jsdoc/require-jsdoc */
export type LottieAnimation = {
    startFrame: number; // Frame number where the animation starts
    endFrame: number; // Frame number where the animation ends
    frameRate: number; // Frame rate of the animation
    layers: LottieLayer[]; // Array of layers in the animation, in top-down z order
};

export type LottieLayer = {
    name: string;
    index?: number; // Index of the layer, used for parenting layers
    parent?: LottieLayer; // Parent layer, if any
    children?: LottieLayer[]; // Children layers, if any
    sprites?: LottieSprite[]; // Array of shapes in the layer
    inFrame: number; // Frame number where the layer becomes visible
    outFrame: number; // Frame number where the layer becomes invisible
    startTime: number; // Time when the layer starts
    timeStretch: number; // Time stretch factor
    autoOrient: boolean; // Whether the layer auto-orients to its path
    isVisible: boolean; // Whether this layer is visible
    transform: Transform; // Initial transform properties and animations of the layer
    localAnchorPoint: Vector2; // Current values
    localPosition: Vector2;
    localRotation: number;
    localScale: Vector2;
    localOpacity: number;
    mesh: Mesh; // Sprite to render, it will contain the current transformed values
};

export type LottieSprite = {
    parent: LottieLayer | LottieSprite;
    isVisible: boolean; // Whether the shape is visible
    transform?: Transform; // Initial transform properties and animations of the shape
    localAnchorPoint?: Vector2; // Current values
    localPosition: Vector2;
    localRotation: number;
    localScale: Vector2;
    localOpacity?: number;
    mesh: Mesh; // Sprite to render, it will contain the current transformed values
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
