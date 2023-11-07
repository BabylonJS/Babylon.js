import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper";
import type { RenderTargetCreationOptions } from "@babylonjs/core/Materials/Textures/textureCreationOptions";
import type { IBaseEnginePublic } from "../../engine.base";

export interface IRenderTargetCubeEngineExtension {
    /**
     * Creates a new render target cube wrapper
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target cube wrapper
     */
    createRenderTargetCubeTexture(engineState: IBaseEnginePublic, size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
}
