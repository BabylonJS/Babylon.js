export interface EngineFeatures {
    /** Force using Bitmap when Bitmap or HTMLImageElement can be used */
    forceBitmapOverHTMLImageElement: boolean;

    /** Indicates that the engine support rendering to as well as copying to lod float textures */
    supportRenderAndCopyToLodForFloatTextures: boolean;

    /** Indicates that framebuffers have Y going from top to bottom for increasing y values */
    framebuffersHaveYTopToBottom: boolean;

    /** Indicates that the engine support handling depth/stencil textures */
    supportDepthStencilTexture: boolean;

    /** Indicates that the engine support shadow samplers */
    supportShadowSamplers: boolean;

    /** Indicates to check the matrix bytes per bytes to know if it has changed or not. If false, only the updateFlag of the matrix is checked */
    uniformBufferHardCheckMatrix: boolean;
}
