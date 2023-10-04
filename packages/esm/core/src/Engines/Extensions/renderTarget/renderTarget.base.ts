import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { DepthTextureCreationOptions, RenderTargetCreationOptions, TextureSize } from "core/Materials/Textures/textureCreationOptions";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IRenderTargetEngineExtension {
    /**
     * Creates a new render target texture
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target wrapper ready to render texture
     */
    createRenderTargetTexture(engineState: IBaseEnginePublic, size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper;

    /**
     * Creates a depth stencil texture.
     * This is only available in WebGL 2 or with the depth texture extension available.
     * @param size The size of face edge in the texture.
     * @param options The options defining the texture.
     * @param rtWrapper The render target wrapper for which the depth/stencil texture must be created
     * @returns The texture
     */
    createDepthStencilTexture(engineState: IBaseEnginePublic, size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

    /**
     * Updates the sample count of a render target texture
     * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
     * @param rtWrapper defines the render target wrapper to update
     * @param samples defines the sample count to set
     * @returns the effective sample count (could be 0 if multisample render targets are not supported)
     */
    updateRenderTargetTextureSampleCount(engineState: IBaseEnginePublic, rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number;

    /** @internal */
    _createDepthStencilTexture(engineState: IBaseEnginePublic, size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

    /** @internal */
    _createHardwareRenderTargetWrapper(engineState: IBaseEnginePublic, isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper;
}
