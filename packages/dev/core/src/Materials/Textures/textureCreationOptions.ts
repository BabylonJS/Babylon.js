import type { InternalTexture } from "./internalTexture";

/**
 * Define options used to create an internal texture
 */
export interface InternalTextureCreationOptions {
    /** Specifies if mipmaps must be created. If undefined, the value from generateMipMaps is taken instead */
    createMipMaps?: boolean;
    /** Specifies if mipmaps must be generated */
    generateMipMaps?: boolean;
    /** Defines texture type (unsigned byte by default) */
    type?: number;
    /** Defines sampling mode (trilinear by default) */
    samplingMode?: number;
    /** Defines format (RGBA by default) */
    format?: number;
    /** Defines sample count (1 by default) */
    samples?: number;
    /** Texture creation flags */
    creationFlags?: number;
    /** Creates the RTT in sRGB space */
    useSRGBBuffer?: boolean;
    /** Label of the texture (used for debugging only) */
    label?: string;
    /** If the MSAA texture must be created right away (default: false) */
    createMSAATexture?: boolean;
    /** Comparison function. Used only for depth textures (default: 0) */
    comparisonFunction?: number;
}

/**
 * Define options used to create a render target texture
 */
export interface RenderTargetCreationOptions extends InternalTextureCreationOptions {
    /** Specifies whether or not a depth should be allocated in the texture (true by default) */
    generateDepthBuffer?: boolean;
    /** Specifies whether or not a stencil should be allocated in the texture (false by default)*/
    generateStencilBuffer?: boolean;
    /** Specifies that no color target should be bound to the render target (useful if you only want to write to the depth buffer, for eg) */
    noColorAttachment?: boolean;
    /** Specifies the internal texture to use directly instead of creating one (ignores `noColorAttachment` flag when set) **/
    colorAttachment?: InternalTexture;
}

/**
 * Define options used to create a depth texture
 */
export interface DepthTextureCreationOptions {
    /** Specifies whether or not a stencil should be allocated in the texture. Not used if depthTextureFormat is supplied, in which case stencil creation will depend on this value. */
    generateStencil?: boolean;
    /** Specifies whether or not bilinear filtering is enable on the texture */
    bilinearFiltering?: boolean;
    /** Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode */
    comparisonFunction?: number;
    /** Specifies if the created texture is a cube texture */
    isCube?: boolean;
    /** Specifies the sample count of the depth/stencil texture texture */
    samples?: number;
    /** Specifies the depth texture format to use */
    depthTextureFormat?: number;
    /** Label of the texture (used for debugging only) */
    label?: string;
}

/**
 * Type used to define a texture size (either with a number or with a rect width and height)
 */
export type TextureSize = number | { width: number; height: number; depth?: number; layers?: number };

/**
 * Check if a TextureSize is an object
 * @param size The TextureSize to check
 * @returns True if the TextureSize is an object
 */
export function textureSizeIsObject(size: TextureSize): size is { width: number; height: number } {
    // eslint-disable-next-line jsdoc/require-jsdoc
    return (size as { width: number }).width !== undefined;
}

/**
 * Get the width/height dimensions from a TextureSize
 * @param size The TextureSize to get the dimensions from
 * @returns The width and height as an object
 */
export function getDimensionsFromTextureSize(size: TextureSize): { width: number; height: number } {
    if (textureSizeIsObject(size)) {
        return { width: size.width, height: size.height };
    }
    return { width: size, height: size };
}
