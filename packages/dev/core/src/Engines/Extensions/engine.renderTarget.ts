import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { RenderTargetCreationOptions, DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { ThinEngine } from "../thinEngine";
import type { Nullable } from "../../types";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";

import * as extension from "core/esm/Engines/WebGL/Extensions/renderTarget/renderTarget.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

/**
 * Type used to define a texture size (either with a number or with a rect width and height)
 * @deprecated please use TextureSize instead
 */
export type RenderTargetTextureSize = TextureSize;

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target wrapper ready to render texture
         */
        createRenderTargetTexture(size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper;

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @param rtWrapper The render target wrapper for which the depth/stencil texture must be created
         * @returns The texture
         */
        createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /**
         * Updates the sample count of a render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number;

        /** @internal */
        _createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /** @internal */
        _createHardwareRenderTargetWrapper(isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper;
    }
}

ThinEngine.prototype._createHardwareRenderTargetWrapper = function (isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper {
    return extension._createHardwareRenderTargetWrapper(this._engineState, isMulti, isCube, size);
};

ThinEngine.prototype.createRenderTargetTexture = function (this: ThinEngine, size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper {
    return extension.createRenderTargetTexture(this._engineState, size, options);
};

ThinEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    return extension.createDepthStencilTexture(this._engineState, size, options, rtWrapper);
};

ThinEngine.prototype._createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    return extension._createDepthStencilTexture(this._engineState, size, options, rtWrapper);
};

ThinEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper: Nullable<WebGLRenderTargetWrapper>, samples: number): number {
    return extension.updateRenderTargetTextureSampleCount(this._engineState, rtWrapper, samples);
};

loadExtension(EngineExtensions.RENDER_TARGET, extension);
