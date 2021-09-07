/**
 * Define options used to create an internal texture
 */
export class InternalTextureCreationOptions {
    /**
     * Specifies if mipmaps must be created. If undefined, the value from generateMipMaps is taken instead
     */
    createMipMaps?: boolean;
    /**
     * Specifies if mipmaps must be generated
     */
    generateMipMaps?: boolean;
    /** Defines texture type (int by default) */
    type?: number;
    /** Defines sampling mode (trilinear by default) */
    samplingMode?: number;
    /** Defines format (RGBA by default) */
    format?: number;
    /** Defines sample count (1 by default) */
    samples?: number;
    /** Texture creation flags */
    creationFlags?: number;
}

/**
 * Define options used to create a render target texture
 */
export class RenderTargetCreationOptions extends InternalTextureCreationOptions {
    /** Specifies whether or not a depth should be allocated in the texture (true by default) */
    generateDepthBuffer?: boolean;
    /** Specifies whether or not a stencil should be allocated in the texture (false by default)*/
    generateStencilBuffer?: boolean;
}

/**
 * Define options used to create a depth texture
 */
 export class DepthTextureCreationOptions {
    /** Specifies whether or not a stencil should be allocated in the texture */
    generateStencil?: boolean;
    /** Specifies whether or not bilinear filtering is enable on the texture */
    bilinearFiltering?: boolean;
    /** Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode */
    comparisonFunction?: number;
    /** Specifies if the created texture is a cube texture */
    isCube?: boolean;
    /** Specifies the sample count of the depth/stencil texture texture */
    samples?: number;
}

/**
 * Type used to define a texture size (either with a number or with a rect width and height)
 */
export type TextureSize = number | { width: number; height: number; layers?: number };
