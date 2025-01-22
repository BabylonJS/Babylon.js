import { Constants } from "core/Engines/constants";

/**
 * Checks if a given format is a depth texture format
 * @param format Format to check
 * @returns True if the format is a depth texture format
 */
export function IsDepthTexture(format: number): boolean {
    return (
        format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_DEPTH32_FLOAT ||
        format === Constants.TEXTUREFORMAT_DEPTH16 ||
        format === Constants.TEXTUREFORMAT_DEPTH24 ||
        format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_STENCIL8
    );
}

/**
 * Gets the type of a depth texture for a given format
 * @param format Format of the texture
 * @returns The type of the depth texture
 */
export function GetTypeForDepthTexture(format: number): number {
    switch (format) {
        case Constants.TEXTUREFORMAT_DEPTH24_STENCIL8:
        case Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8:
        case Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8:
        case Constants.TEXTUREFORMAT_DEPTH32_FLOAT:
        case Constants.TEXTUREFORMAT_DEPTH24:
            return Constants.TEXTURETYPE_FLOAT;
        case Constants.TEXTUREFORMAT_DEPTH16:
            return Constants.TEXTURETYPE_UNSIGNED_SHORT;
        case Constants.TEXTUREFORMAT_STENCIL8:
            return Constants.TEXTURETYPE_UNSIGNED_BYTE;
    }

    return Constants.TEXTURETYPE_UNSIGNED_BYTE;
}

/**
 * Checks if a given format has a stencil aspect
 * @param format Format to check
 * @returns True if the format has a stencil aspect
 */
export function HasStencilAspect(format: number): boolean {
    return (
        format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 ||
        format === Constants.TEXTUREFORMAT_STENCIL8
    );
}

/**
 * Gets the texture block information.
 * @param type Type of the texture.
 * @param format Format of the texture.
 * @returns The texture block information. You can calculate the byte size of the texture by doing: Math.ceil(width / blockInfo.width) * Math.ceil(height / blockInfo.height) * blockInfo.length
 */
export function GetTextureBlockInformation(type: number, format: number): { width: number; height: number; length: number } {
    switch (format) {
        case Constants.TEXTUREFORMAT_DEPTH16:
            return { width: 1, height: 1, length: 2 };
        case Constants.TEXTUREFORMAT_DEPTH24:
            return { width: 1, height: 1, length: 3 };
        case Constants.TEXTUREFORMAT_DEPTH24_STENCIL8:
            return { width: 1, height: 1, length: 4 };
        case Constants.TEXTUREFORMAT_DEPTH32_FLOAT:
            return { width: 1, height: 1, length: 4 };
        case Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8:
            return { width: 1, height: 1, length: 5 };
        case Constants.TEXTUREFORMAT_STENCIL8:
            return { width: 1, height: 1, length: 1 };

        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
            return { width: 4, height: 4, length: 8 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
            return { width: 4, height: 4, length: 16 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
        case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
            return { width: 4, height: 4, length: 8 };
        case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
            return { width: 4, height: 4, length: 16 };
    }

    switch (type) {
        case Constants.TEXTURETYPE_BYTE:
        case Constants.TEXTURETYPE_UNSIGNED_BYTE:
            switch (format) {
                case Constants.TEXTUREFORMAT_R:
                case Constants.TEXTUREFORMAT_R_INTEGER:
                case Constants.TEXTUREFORMAT_ALPHA:
                case Constants.TEXTUREFORMAT_LUMINANCE:
                case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                    return { width: 1, height: 1, length: 1 };
                case Constants.TEXTUREFORMAT_RG:
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return { width: 1, height: 1, length: 2 };
                case Constants.TEXTUREFORMAT_RGB:
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return { width: 1, height: 1, length: 3 };
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                default:
                    return { width: 1, height: 1, length: 4 };
            }
        case Constants.TEXTURETYPE_SHORT:
        case Constants.TEXTURETYPE_UNSIGNED_SHORT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return { width: 1, height: 1, length: 2 };
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return { width: 1, height: 1, length: 6 };
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 8 };
                default:
                    return { width: 1, height: 1, length: 8 };
            }
        case Constants.TEXTURETYPE_INT:
        case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return { width: 1, height: 1, length: 8 };
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return { width: 1, height: 1, length: 12 };
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 16 };
                default:
                    return { width: 1, height: 1, length: 16 };
            }
        case Constants.TEXTURETYPE_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return { width: 1, height: 1, length: 4 };
                case Constants.TEXTUREFORMAT_RG:
                    return { width: 1, height: 1, length: 8 };
                case Constants.TEXTUREFORMAT_RGB:
                    return { width: 1, height: 1, length: 12 };
                case Constants.TEXTUREFORMAT_RGBA:
                    return { width: 1, height: 1, length: 16 };
                default:
                    return { width: 1, height: 1, length: 16 };
            }
        case Constants.TEXTURETYPE_HALF_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return { width: 1, height: 1, length: 2 };
                case Constants.TEXTUREFORMAT_RG:
                    return { width: 1, height: 1, length: 4 };
                case Constants.TEXTUREFORMAT_RGB:
                    return { width: 1, height: 1, length: 6 };
                case Constants.TEXTUREFORMAT_RGBA:
                    return { width: 1, height: 1, length: 8 };
                default:
                    return { width: 1, height: 1, length: 8 };
            }
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
            return { width: 1, height: 1, length: 2 };
        case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
            switch (format) {
                case Constants.TEXTUREFORMAT_RGBA:
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                default:
                    return { width: 1, height: 1, length: 4 };
            }
        case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
            switch (format) {
                case Constants.TEXTUREFORMAT_RGBA:
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                default:
                    return { width: 1, height: 1, length: 4 };
            }
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
            return { width: 1, height: 1, length: 2 };
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
            return { width: 1, height: 1, length: 2 };
        case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
            switch (format) {
                case Constants.TEXTUREFORMAT_RGBA:
                    return { width: 1, height: 1, length: 4 };
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return { width: 1, height: 1, length: 4 };
                default:
                    return { width: 1, height: 1, length: 4 };
            }
    }

    return { width: 1, height: 1, length: 4 };
}
