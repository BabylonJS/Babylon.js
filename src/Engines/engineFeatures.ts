/** @hidden */
export interface EngineFeatures {
    /** Force using Bitmap when Bitmap or HTMLImageElement can be used */
    forceBitmapOverHTMLImageElement: boolean;

    /** Indicates that the engine support rendering to as well as copying to lod float textures */
    supportRenderAndCopyToLodForFloatTextures: boolean;

    /** Indicates that the engine support handling depth/stencil textures */
    supportDepthStencilTexture: boolean;

    /** Indicates that the engine support shadow samplers */
    supportShadowSamplers: boolean;

    /** Indicates to check the matrix bytes per bytes to know if it has changed or not. If false, only the updateFlag of the matrix is checked */
    uniformBufferHardCheckMatrix: boolean;

    /** Indicates that prefiltered mipmaps can be generated in some processes (for eg when loading an HDR cube texture) */
    allowTexturePrefiltering: boolean;

    /** Indicates to track the usage of ubos and to create new ones as necessary during a frame duration */
    trackUbosInFrame: boolean;

    /** Indicates that the current content of a ubo should be compared to the content of the corresponding GPU buffer and the GPU buffer updated only if different. Requires trackUbosInFrame to be true */
    checkUbosContentBeforeUpload: boolean;

    /** Indicates that the Cascaded Shadow Map technic is supported */
    supportCSM: boolean;

    /** Indicates that the textures transcoded by the basis transcoder must have power of 2 width and height */
    basisNeedsPOT: boolean;

    /** Indicates that the engine supports 3D textures */
    support3DTextures: boolean;

    /** Indicates that constants need a type suffix in shaders (used by realtime filtering...) */
    needTypeSuffixInShaderConstants: boolean;

    /** Indicates that MSAA is supported */
    supportMSAA: boolean;

    /** Indicates that SSAO2 is supported */
    supportSSAO2: boolean;

    /** Indicates that some additional texture formats are supported (like TEXTUREFORMAT_R for eg) */
    supportExtendedTextureFormats: boolean;

    /** Indicates that the switch/case construct is supported in shaders */
    supportSwitchCaseInShader: boolean;

    /** Indicates that synchronous texture reading is supported */
    supportSyncTextureRead: boolean;

    /** Indicates that y should be inverted when dealing with bitmaps (notably in environment tools) */
    needsInvertingBitmap: boolean;

    /** Indicates that the engine should cache the bound UBO */
    useUBOBindingCache: boolean;

    /** Indicates that the inliner should be run over every shader code */
    needShaderCodeInlining: boolean;

    /** @hidden */
    _collectUbosUpdatedInFrame: boolean;
}
