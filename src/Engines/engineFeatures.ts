export interface EngineFeatures {
    /** Force using Bitmap when Bitmap or HTMLImageElement can be used */
    forceBitmapOverHTMLImageElement: boolean;

    /** Indicates that the engine support rendering to as well as copying to lod float textures */
    supportRenderAndCopyToLodForFloatTextures: boolean;

    /** Indicates that framebuffers have Y going from top to bottom for increasing y values */
    framebuffersHaveYTopToBottom: boolean;
}
