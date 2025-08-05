// Copyright (c) Microsoft Corporation. All rights reserved.

// Config values to customize the behavior of the babylon lottie renderer

export const DefaultSpriteAtlasSize = 2048; // Size of the texture atlas
export const GapSize = 5; // Gap around the sprites in the atlas
export const DefaultCapacity = 64; // Maximum number of sprites the renderer can handle at once
export const White = { r: 1, g: 1, b: 1, a: 0 }; // Background color for the animation canvas
export const ScaleMultiplier = 5; // Minimum scale factor to prevent too small sprites
export const DevicePixelRatio = 1; // Scale factor
export const SamplingSteps = 100; // Number of steps to sample bezier curves for bounding box calculations
export const EasingSteps = 4; // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
export const IgnoreOpacityAnimations = true; // Whether to ignore opacity animations for performance
export const SupportDeviceLost = false; // Whether to support device lost events for WebGL contexts
