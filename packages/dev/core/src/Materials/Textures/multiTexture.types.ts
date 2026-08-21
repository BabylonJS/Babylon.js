/**
 * Blend modes controlling how the layers of a MultiTexture are combined per pixel.
 */
export enum MultiBlendMode {
    /**
     * Default. Folds the layers with a running mix: each layer i is blended over the accumulated
     * result using its own alpha, `result = mix(result, layer, layer.a)`. Later layers are drawn
     * over earlier ones; a fully opaque layer (a = 1) completely covers everything below it.
     * Zero active layers output transparent black.
     */
    ALPHA_BLEND = 0,
    /** Keeps the sample with the highest alpha among the layers (ties: lowest index wins). Zero active layers output transparent black. */
    ALPHA_MAX = 1,
    /** Adds all layers per channel, clamped to 1. */
    ADD = 2,
    /** Multiplies all layers per channel (empty product is 1). */
    MULTIPLY = 3,
    /** Starts from layer 0 and subtracts every following layer, clamped to 0. */
    SUBTRACT = 4,
    /** Screens all layers per channel. */
    SCREEN = 5,
}

/**
 * Options for creating a MultiTexture.
 */
export interface IMultiTextureOptions {
    /** Fixed layer resolution. REQUIRED. Positive integer. */
    width: number;
    /** Fixed layer resolution. REQUIRED. Positive integer. */
    height: number;
    /** Array depth to allocate. Default: urls.length. Must be \>= urls.length (else throw). */
    maxLayers?: number;
    /** Default MultiBlendMode.ALPHA_BLEND. */
    blendMode?: MultiBlendMode;
    /** Default false — the composite RTT itself never needs mips (consumed at 1:1 by materials). */
    generateMipMaps?: boolean;
    /** Default Texture.TRILINEAR_SAMPLINGMODE. Passed to RawTexture2DArray. */
    samplingMode?: number;
    /** Default false. Passed through to UploadImageToTexture2DArrayLayer. */
    premultiplyAlpha?: boolean;
    /** "resize" (default): decode-time rescale to width×height. "strict": reject mismatched dims. */
    fit?: "resize" | "strict";
    /** Default true (requirement: CPU pixel array). */
    keepPixels?: boolean;
    /** Composite RTT resolution = width*rttScale × height*rttScale. Default 1. */
    rttScale?: number;
    /** Default false. HEAD-polling change detection. */
    watch?: boolean;
    /** Default 2000 ms. Only used when watch is true. */
    pollInterval?: number;
    /** Fired once after all initial layers have settled (success or failure). */
    onLoad?: () => void;
    /** Fired on any async failure (init, updateLayer, poll). Not thrown. */
    onError?: (message?: string, exception?: any) => void;
}
