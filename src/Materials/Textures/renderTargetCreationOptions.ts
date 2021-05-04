
/**
 * Define options used to create a render target texture
 */
export class RenderTargetCreationOptions {
    /**
     * Specifies if mipmaps must be created. If undefined, the value from generateMipMaps is taken instead
     */
    createMipMaps?: boolean;
    /**
     * Specifies if mipmaps must be generated
     */
    generateMipMaps?: boolean;
    /** Specifies whether or not a depth should be allocated in the texture (true by default) */
    generateDepthBuffer?: boolean;
    /** Specifies whether or not a stencil should be allocated in the texture (false by default)*/
    generateStencilBuffer?: boolean;
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