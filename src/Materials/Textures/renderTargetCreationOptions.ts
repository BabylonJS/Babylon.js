
/**
 * Define options used to create a render target texture
 */
export class RenderTargetCreationOptions {
    /**
     * Specifies is mipmaps must be generated
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
}