/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Usage determines the format and color metadata of an encoded texture.
 * @experimental
 */
export type KTX2EncoderUsage = "color" | "data" | "normal";

/**
 * Options for encoding RGBA8 pixels into a KHR_texture_basisu-compatible KTX2 file.
 * @experimental
 */
export interface IKTX2EncoderOptions {
    /**
     * Color uses ETC1S and sRGB; data and normal use linear UASTC.
     * @experimental
     */
    usage: KTX2EncoderUsage;
    /**
     * Generate a full mip pyramid. Defaults to true.
     * @experimental
     */
    generateMipmaps?: boolean;
    /**
     * Reverse the input row order in Basis. Defaults to false.
     * @experimental
     */
    flipY?: boolean;
    /**
     * Integer ETC1S quality for color usage only, from 1 to 255. Defaults to 128.
     * @experimental
     */
    etc1sQualityLevel?: number;
    /**
     * Integer ETC1S compression effort for color usage only, from 0 to 6. Defaults to 2.
     * @experimental
     */
    etc1sCompressionLevel?: number;
    /**
     * Integer UASTC quality for data and normal usage only, from 0 to 4. Defaults to 2.
     * @experimental
     */
    uastcQualityLevel?: number;
    /**
     * Use Zstandard with UASTC. Defaults to true for data and normal. Ignored for color.
     * @experimental
     */
    zstandard?: boolean;
}

/**
 * Encoder-wide option overrides. Each field applies only to the usages that accept it.
 * @internal
 */
export type _IKTX2EncoderDefaultOptions = Pick<IKTX2EncoderOptions, "etc1sQualityLevel" | "etc1sCompressionLevel" | "uastcQualityLevel" | "zstandard">;
