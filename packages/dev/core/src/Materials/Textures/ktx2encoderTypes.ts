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

/**
 * Encoder-wide option overrides. Each field applies only to the usages that accept it.
 * @internal
 */
export type _IKTX2EncoderDefaultOptions = Pick<IKTX2EncoderOptions, "etc1sQualityLevel" | "etc1sCompressionLevel" | "uastcQualityLevel" | "zstandard">;

const ColorDefaultKeys = ["etc1sQualityLevel", "etc1sCompressionLevel"] as const;
const UASTCDefaultKeys = ["uastcQualityLevel", "zstandard"] as const;

const ValidateIntegerRange = (name: string, value: number | undefined, minimum: number, maximum: number): void => {
    if (value !== undefined && (!Number.isInteger(value) || value < minimum || value > maximum)) {
        throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
};

/**
 * Validates encoding options, including options that do not apply to the selected usage.
 * @param options Options to validate.
 * @internal
 */
export function _ValidateKTX2EncoderOptions(options: IKTX2EncoderOptions): void {
    if (options.usage !== "color" && options.usage !== "data" && options.usage !== "normal") {
        throw new Error("usage must be 'color', 'data', or 'normal'.");
    }
    ValidateIntegerRange("etc1sQualityLevel", options.etc1sQualityLevel, 1, 255);
    ValidateIntegerRange("etc1sCompressionLevel", options.etc1sCompressionLevel, 0, 6);
    ValidateIntegerRange("uastcQualityLevel", options.uastcQualityLevel, 0, 4);
    if (options.usage === "color") {
        if (options.uastcQualityLevel !== undefined || options.zstandard !== undefined) {
            throw new Error("UASTC options cannot be used when usage is 'color'.");
        }
    } else if (options.etc1sQualityLevel !== undefined || options.etc1sCompressionLevel !== undefined) {
        throw new Error("ETC1S options can only be used when usage is 'color'.");
    }
}

/**
 * Overrides options with the defined defaults that apply to their usage.
 * @param options Per-call options.
 * @param defaults Encoder-wide defaults, which take priority.
 * @returns The effective options.
 * @internal
 */
export function _ApplyKTX2EncoderDefaultOptions(options: IKTX2EncoderOptions, defaults: _IKTX2EncoderDefaultOptions | undefined): IKTX2EncoderOptions {
    const effective: IKTX2EncoderOptions = { ...options };
    for (const key of options.usage === "color" ? ColorDefaultKeys : UASTCDefaultKeys) {
        const value = defaults?.[key];
        if (value !== undefined) {
            (effective as Record<string, unknown>)[key] = value;
        }
    }
    return effective;
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
