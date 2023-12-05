import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper.js";
import type { RenderTargetCreationOptions } from "core/Materials/Textures/textureCreationOptions.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IRenderTargetCubeEngineExtension {
    /**
     * Creates a new render target cube wrapper
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target cube wrapper
     */
    createRenderTargetCubeTexture(engineState: IBaseEnginePublic, size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
}
