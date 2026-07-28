/**
 * Controls whether a Lottie feature uses the current spec-oriented behavior or Babylon.js 8.x-compatible behavior.
 * @deprecated The vector renderer implements the spec behavior only. Accepted for backward
 * compatibility but has no effect.
 */
export type LottieCompatibilityMode = "spec" | "babylon8";

/**
 * Compatibility options for known behavior differences between Babylon.js Lottie player versions.
 * @deprecated The vector renderer implements the spec behavior only. Accepted for backward
 * compatibility but has no effect.
 */
export type LottieCompatibilityOptions = {
    /**
     * Controls text layer positioning compatibility.
     * @deprecated Accepted for backward compatibility but has no effect.
     */
    textLayerPlacement?: LottieCompatibilityMode;
    /**
     * Controls solid layer rendering compatibility.
     * @deprecated Accepted for backward compatibility but has no effect.
     */
    solidLayerRendering?: LottieCompatibilityMode;
};

/**
 * Fully resolved compatibility options used internally by the Lottie animation player.
 * @deprecated Accepted for backward compatibility but has no effect.
 */
export type ResolvedLottieCompatibilityOptions = {
    /** Resolved text layer positioning compatibility. */
    textLayerPlacement: LottieCompatibilityMode;
    /** Resolved solid layer rendering compatibility. */
    solidLayerRendering: LottieCompatibilityMode;
};

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
     * @deprecated The renderer draws vectors directly and no longer builds a sprite atlas. This
     * option is accepted for backward compatibility but has no effect.
     */
    spriteAtlasWidth: number;
    /**
     * Height of the sprite atlas texture.
     * @deprecated The renderer draws vectors directly and no longer builds a sprite atlas. This
     * option is accepted for backward compatibility but has no effect.
     */
    spriteAtlasHeight: number;
    /**
     * Gap size around sprites in the atlas.
     * @deprecated The renderer draws vectors directly and no longer builds a sprite atlas. This
     * option is accepted for backward compatibility but has no effect.
     */
    gapSize: number;
    /**
     * Maximum number of sprites the renderer can handle at once.
     * @deprecated The renderer draws vectors directly and no longer batches sprites. This option is
     * accepted for backward compatibility but has no effect.
     */
    spritesCapacity: number;
    /**
     * Background color for the animation canvas.
     * Default is opaque black. Use an alpha of 0 for a transparent canvas.
     */
    backgroundColor: { r: number; g: number; b: number; a: number };
    /**
     * Minimum scale factor to prevent too small sprites.
     * @deprecated The renderer draws vectors directly and no longer rasterizes sprites. This option
     * is accepted for backward compatibility but has no effect.
     */
    scaleMultiplier: number;
    /**
     * Scale factor for the rendering.
     * Set to 0 to follow the system devicePixelRatio (default).
     */
    devicePixelRatio: number;
    /**
     * Number of steps to sample cubic bezier easing functions for animations.
     * @deprecated Keyframe easing is now solved to a fixed tolerance rather than a step count. This
     * option is accepted for backward compatibility but has no effect.
     */
    easingSteps: number;
    /**
     * Whether to support device lost events for WebGL contexts.
     * Default is true.
     */
    supportDeviceLost: boolean;
    /**
     * When set, the animation will play normally but stop at this frame number.
     * Useful for visual testing of animations at specific points in time.
     * Default is undefined (play the full animation).
     */
    stopAtFrame?: number;
    /**
     * When true, the parser logs unsupported lottie features to the console after parsing.
     * @deprecated The vector renderer has no parse diagnostics. Accepted for backward compatibility
     * but has no effect.
     */
    debug?: boolean;
    /**
     * Compatibility options for known behavior differences between Babylon.js Lottie player versions.
     * @deprecated Accepted for backward compatibility but has no effect.
     */
    compatibility?: LottieCompatibilityOptions;
};

/**
 * Fully resolved configuration used internally by the Lottie animation player.
 */
export type ResolvedAnimationConfiguration = Omit<AnimationConfiguration, "compatibility"> & {
    /** Resolved compatibility options for known behavior differences between Babylon.js Lottie player versions. */
    compatibility: ResolvedLottieCompatibilityOptions;
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
    compatibility: {
        textLayerPlacement: "spec",
        solidLayerRendering: "spec",
    },
} as const satisfies ResolvedAnimationConfiguration;

/**
 * Creates the final animation configuration by merging the provided partial configuration with the default configuration.
 * @param newConfig The configuration passed by the client.
 * @param _maxTextureSize The maximum texture size supported by the GPU. Unused; kept for signature stability.
 * @param mainThreadDevicePixelRatio The devicePixelRatio from the main thread (used in worker scenarios where window is not available).
 * @returns The final animation configuration.
 */
export function UpdateConfiguration(newConfig: Partial<AnimationConfiguration>, _maxTextureSize: number, mainThreadDevicePixelRatio?: number): ResolvedAnimationConfiguration {
    const config = {
        ...DefaultConfiguration,
        ...newConfig,
        compatibility: {
            textLayerPlacement: newConfig.compatibility?.textLayerPlacement ?? DefaultConfiguration.compatibility.textLayerPlacement,
            solidLayerRendering: newConfig.compatibility?.solidLayerRendering ?? DefaultConfiguration.compatibility.solidLayerRendering,
        },
    };

    // If devicePixelRatio is 0 (auto-detect), follow the system DPR. The vector renderer relies on
    // MSAA for edge coverage rather than supersampling, so it needs no extra scale factor.
    if (config.devicePixelRatio === 0) {
        config.devicePixelRatio = mainThreadDevicePixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1);
    }

    return config;
}
