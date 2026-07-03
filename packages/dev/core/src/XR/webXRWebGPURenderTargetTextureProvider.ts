import { Constants } from "../Engines/constants";
import { type WebGPUEngine } from "../Engines/webgpuEngine";
import { type InternalTexture } from "../Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Nullable } from "../types";
import { WebXRLayerRenderTargetTextureProvider } from "./webXRRenderTargetTextureProvider";

/**
 * Maps a WebGPU depth/stencil {@link GPUTextureFormat} to the matching Babylon `TEXTUREFORMAT_*` constant.
 *
 * The engine reads `InternalTexture.format` (a Babylon constant) when it builds the render pass depth
 * attachment for a render target, so a depth texture wrapped from an external `GPUTexture` must carry the
 * correct Babylon format or the depth attachment pipeline format will not match the sub-image's texture.
 * @param format the WebGPU depth/stencil format requested when the layer was created
 * @returns the matching Babylon texture format constant
 */
function GetBabylonDepthFormat(format: GPUTextureFormat): number {
    switch (format) {
        case "depth16unorm":
            return Constants.TEXTUREFORMAT_DEPTH16;
        case "depth24plus":
            return Constants.TEXTUREFORMAT_DEPTH24;
        case "depth24plus-stencil8":
            return Constants.TEXTUREFORMAT_DEPTH24_STENCIL8;
        case "depth32float":
            return Constants.TEXTUREFORMAT_DEPTH32_FLOAT;
        case "depth32float-stencil8":
            return Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8;
        case "stencil8":
            return Constants.TEXTUREFORMAT_STENCIL8;
        default:
            // Fall back to a combined depth/stencil format, which is the projection layer default.
            return Constants.TEXTUREFORMAT_DEPTH24_STENCIL8;
    }
}

/**
 * Provides render target textures for WebGPU-backed XR layers. Owns all WebGPU-specific texture wrapping
 * (via {@link WebGPUEngine.wrapWebGPUTexture} / {@link WebGPUEngine.updateWrappedWebGPUTexture}) so the base
 * provider can stay graphics-API-agnostic. Mirrors {@link WebXRWebGLRenderTargetTextureProvider} for the
 * WebGPU (XRGPUBinding) backend.
 * @internal
 */
export abstract class WebXRWebGPURenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    private get _webgpuEngine(): WebGPUEngine {
        return this._engine as WebGPUEngine;
    }

    private _wrapColorTexture(texture: GPUTexture): InternalTexture {
        return this._webgpuEngine.wrapWebGPUTexture(texture);
    }

    private _wrapDepthTexture(texture: GPUTexture, depthStencilFormat: GPUTextureFormat): InternalTexture {
        const internalTexture = this._webgpuEngine.wrapWebGPUTexture(texture);
        // The engine derives the color attachment format automatically from the wrapped hardware texture,
        // but the depth attachment format is read from the Babylon InternalTexture.format, which
        // wrapWebGPUTexture does not set. Assign it here from the format the layer was created with.
        internalTexture.format = GetBabylonDepthFormat(depthStencilFormat);
        return internalTexture;
    }

    /**
     * Wraps the sub-image's color (and optional depth/stencil) GPUTextures and builds a new render target
     * texture around them. Use this on first creation and whenever the sub-image texture size changes.
     * @param width the width of the render target
     * @param height the height of the render target
     * @param colorTexture the sub-image color GPUTexture
     * @param depthStencilTexture the sub-image depth/stencil GPUTexture, if any
     * @param depthStencilFormat the WebGPU depth/stencil format the layer was created with, if depth is provided
     * @param multiview whether the render target should be a multiview render target
     * @returns the created render target texture
     */
    protected _createRenderTargetTextureFromGPUTextures(
        width: number,
        height: number,
        colorTexture: GPUTexture,
        depthStencilTexture: Nullable<GPUTexture>,
        depthStencilFormat: GPUTextureFormat | undefined,
        multiview: boolean
    ): RenderTargetTexture {
        const color = this._wrapColorTexture(colorTexture);
        const depth = depthStencilTexture && depthStencilFormat ? this._wrapDepthTexture(depthStencilTexture, depthStencilFormat) : null;
        return this._createRenderTargetTextureInternal(width, height, color, depth, multiview);
    }

    /**
     * Repoints the wrapped color/depth textures of an existing render target at the current frame's
     * GPUTextures, preserving the RenderTargetTexture / InternalTexture identity held by the XR camera's
     * `outputRenderTarget`. The sub-image textures are only valid for the current frame and may rotate from
     * a compositor pool, so this must run every frame. The new GPUTextures must have the same dimensions as
     * the wrapped ones (guaranteed by the caller's size-change branch, which rebuilds instead).
     * @param renderTargetTexture the render target whose wrapped textures should be repointed
     * @param colorTexture the current frame's color GPUTexture
     * @param depthStencilTexture the current frame's depth/stencil GPUTexture, if any
     */
    protected _updateRenderTargetTextureFromGPUTextures(renderTargetTexture: RenderTargetTexture, colorTexture: GPUTexture, depthStencilTexture: Nullable<GPUTexture>): void {
        const color = renderTargetTexture._texture;
        if (color) {
            this._webgpuEngine.updateWrappedWebGPUTexture(color, colorTexture);
        }
        const depth = renderTargetTexture.renderTarget?._depthStencilTexture;
        if (depth && depthStencilTexture) {
            this._webgpuEngine.updateWrappedWebGPUTexture(depth, depthStencilTexture);
        }
    }
}
