import { type DepthTextureCreationOptions, type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { type RenderTargetWrapper } from "../renderTargetWrapper";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @param rtWrapper The render target wrapper for which the depth/stencil texture must be created
         * @returns The texture
         */
        createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;
    }
}
