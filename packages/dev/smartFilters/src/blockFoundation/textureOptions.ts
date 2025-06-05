/**
 * The format of a texture - corresponds to the Babylon.js TextureFormat constants
 */
export enum TextureFormat {
    /** Babylon Constants.TEXTUREFORMAT_RGBA */
    RGBA = 5,
    /** Babylon Constants.TEXTUREFORMAT_R */
    R = 6,
    /** Babylon Constants.TEXTUREFORMAT_RG */
    RG = 7,
}

/**
 * The type of a texture - corresponds to the Babylon.js TextureType constants
 */
export enum TextureType {
    /** Babylon Constants.TEXTURETYPE_UNSIGNED_BYTE */
    UNSIGNED_BYTE = 0,
    /** Babylon Constants.TEXTURETYPE_FLOAT */
    FLOAT = 1,
    /** Babylon Constants.TEXTURETYPE_HALF_FLOAT */
    HALF_FLOAT = 2,
}

// IMPORTANT: Update textureOptionsMatch() if you add more fields to OutputTextureOptions
/**
 * Describes the requirements for the output texture of a shader block.
 */
export type OutputTextureOptions = {
    /**
     * The texture size ratio (output size of this block / size of the Smart Filter output)
     */
    ratio: number;

    /**
     * The format of the texture
     */
    format: TextureFormat;

    /**
     * The type of the texture
     */
    type: TextureType;
};

/**
 * Compares two OutputTextureOptions to see if they match.
 * @param a - The first OutputTextureOptions
 * @param b - The second OutputTextureOptions
 * @returns True if the two options match, false otherwise
 */
export function textureOptionsMatch(a: OutputTextureOptions | undefined, b: OutputTextureOptions | undefined): boolean {
    if (a === undefined || b === undefined) {
        return false;
    }
    return a.ratio === b.ratio && a.format === b.format && a.type === b.type;
}
