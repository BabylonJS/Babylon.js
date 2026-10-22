import { Constants } from "../Engines/constants";
import { type Nullable } from "../types";

/**
 * Maps a compressed sRGB format to its linear counterpart, or returns null for other formats.
 * @internal
 */
export function MapSRGBToLinear(format: number): Nullable<number> {
    switch (format) {
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_S3TC_DXT1_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ETC2:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_5x4;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_5x5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_6x5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_6x6;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_8x5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_8x6;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_8x8;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_10x5;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_10x6;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_10x8;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_10x10;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_12x10;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_12x12;
        case Constants.TEXTUREFORMAT_COMPRESSED_SRGB_ALPHA_BPTC_UNORM:
            return Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM;
        default:
            return null;
    }
}
