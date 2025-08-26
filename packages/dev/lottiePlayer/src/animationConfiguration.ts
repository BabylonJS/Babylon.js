/**
 * Configuration options for the Lottie animation player.
 */
export type AnimationConfiguration = {
    /**
     * Whether the animation should play on a loop or not
     */
    loopAnimation: boolean;
    /**
     * Width of the sprite atlas texture.
     * Default is 4096.
     */
    spriteAtlasWidth: number;
    /**
     * Height of the sprite atlas texture.
     * Default is 4096.
     */
    spriteAtlasHeight: number;
    /**
     * Gap size around sprites in the atlas.
     * Default is 5.
     */
    gapSize: number;
    /**
     * Maximum number of sprites the renderer can handle at once.
     * Default is 64.
     */
    spritesCapacity: number;
    /**
     * Background color for the animation canvas.
     * Default is white with full opacity.
     */
    backgroundColor: { r: number; g: number; b: number; a: number };
    /**
     * Minimum scale factor to prevent too small sprites.
     * Default is 5.
     */
    scaleMultiplier: number;
    /**
     * Scale factor for the rendering.
     * Default is 1.
     */
    devicePixelRatio: number;
    /**
     * Number of steps to sample cubic bezier easing functions for animations.
     * Default is 4.
     */
    easingSteps: number;
    /**
     * Whether to support device lost events for WebGL contexts.
     * Default is false.
     */
    supportDeviceLost: boolean;
};

/**
 * Default configuration for lottie animations playback.
 */
export const DefaultConfiguration = {
    loopAnimation: false, // By default do not loop animations
    spriteAtlasWidth: 4096, // Size of the texture atlas
    spriteAtlasHeight: 4096, // Size of the texture atlas
    gapSize: 5, // Gap around the sprites in the atlas
    spritesCapacity: 64, // Maximum number of sprites the renderer can handle at once
    backgroundColor: { r: 1, g: 1, b: 1, a: 1 }, // Background color for the animation canvas
    scaleMultiplier: 5, // Minimum scale factor to prevent too small sprites,
    devicePixelRatio: 1, // Scale factor,
    easingSteps: 4, // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
    supportDeviceLost: false, // Whether to support device lost events for WebGL contexts,
} as const satisfies AnimationConfiguration;
