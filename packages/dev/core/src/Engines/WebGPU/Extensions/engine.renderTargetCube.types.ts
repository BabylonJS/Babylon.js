import { type RenderTargetCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import { type RenderTargetWrapper } from "../../renderTargetWrapper";
declare module "../../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Creates a new render target cube wrapper
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target cube wrapper
         */
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
    }
}
