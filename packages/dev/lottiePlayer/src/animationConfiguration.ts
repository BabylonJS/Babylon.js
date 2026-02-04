const MAX_SPRITE_ATLAS_SIZE = 8192;

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
     * Set to 0 for auto-detection based on GPU capabilities (default).
     * Will use the minimum between GPU max texture size and 8192.
     */
    spriteAtlasWidth: number;
    /**
     * Height of the sprite atlas texture.
     * Set to 0 for auto-detection based on GPU capabilities (default).
     * Will use the minimum between GPU max texture size and 8192.
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
     * Set to 0 for auto-detection based on atlas size (default).
     * Uses 4x supersampling for 8K atlas, 2x for smaller atlases.
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
    spriteAtlasWidth: 0, // 0 = auto-detect based on GPU capabilities
    spriteAtlasHeight: 0, // 0 = auto-detect based on GPU capabilities
    gapSize: 25, // Gap around the sprites in the atlas
    spritesCapacity: 64, // Maximum number of sprites the renderer can handle at once
    backgroundColor: { r: 0, g: 0, b: 0, a: 1 }, // Background color for the animation canvas
    scaleMultiplier: 5, // Minimum scale factor to prevent too small sprites,
    devicePixelRatio: 0, // 0 = auto-detect based on atlas size
    easingSteps: 4, // Number of steps to sample easing functions for animations - Less than 4 causes issues with some interpolations
    supportDeviceLost: true, // Whether to support device lost events for WebGL contexts,
} as const satisfies AnimationConfiguration;

/**
 * Creates the final animation configuration by merging the provided partial configuration with the default configuration.
 * Computes optimal atlas size and devicePixelRatio based on GPU capabilities when not explicitly provided.
 * @param newConfig The configuration passed by the client.
 * @param maxTextureSize The maximum texture size supported by the GPU.
 * @param mainThreadDevicePixelRatio The devicePixelRatio from the main thread (used in worker scenarios where window is not available).
 * @returns The final animation configuration.
 */
export function UpdateConfiguration(newConfig: Partial<AnimationConfiguration>, maxTextureSize: number, mainThreadDevicePixelRatio?: number): AnimationConfiguration {
    const config = {
        ...DefaultConfiguration,
        ...newConfig,
    };

    // If atlas dimensions are 0 (auto-detect), calculate optimal values based on GPU capabilities
    const optimalAtlasSize = Math.min(maxTextureSize, MAX_SPRITE_ATLAS_SIZE);
    if (config.spriteAtlasHeight === 0 || config.spriteAtlasWidth === 0) {
        config.spriteAtlasWidth = optimalAtlasSize;
        config.spriteAtlasHeight = optimalAtlasSize;
    }

    // If devicePixelRatio is 0 (auto-detect), set it based on atlas size and system DPR
    if (config.devicePixelRatio === 0) {
        // Get the system devicePixelRatio - prefer passed value (for workers), fallback to window
        const systemDpr = mainThreadDevicePixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1);
        // 8K atlas can afford higher supersampling (4x), smaller atlas uses 2x
        config.devicePixelRatio = optimalAtlasSize >= MAX_SPRITE_ATLAS_SIZE ? Math.max(systemDpr, 4) : Math.max(systemDpr, 2);
    }

    return config;
}
