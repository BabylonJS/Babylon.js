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
     * Use Zstandard with UASTC. Defaults to true for data and normal. Omit for color, including when false.
     * @experimental
     */
    zstandard?: boolean;
}

const DimensionMultiple = 4;
const MaxDimension = 16_384;
const MaxPixels = 12_582_912;

/**
 * Validates the dimensions supported by the pinned Basis encoder.
 * @param width Source width in pixels.
 * @param height Source height in pixels.
 * @internal
 */
export function _ValidateKTX2EncoderDimensions(width: number, height: number): void {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width % DimensionMultiple !== 0 || height % DimensionMultiple !== 0) {
        throw new Error("KTX2 encoder width and height must be positive multiples of 4.");
    }
    if (width > MaxDimension || height > MaxDimension) {
        throw new Error(`KTX2 encoder width and height cannot exceed ${MaxDimension.toLocaleString("en-US")} pixels.`);
    }
    if (width * height > MaxPixels) {
        throw new Error(`KTX2 encoder images cannot exceed ${MaxPixels.toLocaleString("en-US")} pixels.`);
    }
}
