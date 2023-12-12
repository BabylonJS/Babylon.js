import { ThinEngine } from "../thinEngine";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { RenderTargetCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import * as extension from "core/esm/Engines/WebGL/Extensions/renderTargetCube/renderTargetCube.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a new render target cube wrapper
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target cube wrapper
         */
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
    }
}

ThinEngine.prototype.createRenderTargetCubeTexture = function (size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper {
    return extension.createRenderTargetCubeTexture(this._engineState, size, options);
};

loadExtension(EngineExtensions.RENDER_TARGET_CUBE, extension);
