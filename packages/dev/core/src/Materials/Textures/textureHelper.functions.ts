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
