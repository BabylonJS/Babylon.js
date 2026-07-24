import { Constants } from "../Engines/constants";
import { type WebGPUEngine } from "../Engines/webgpuEngine";
import { type WebGPURenderTargetWrapper } from "../Engines/WebGPU/webgpuRenderTargetWrapper";
import { type InternalTexture } from "../Materials/Textures/internalTexture";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Nullable } from "../types";
import { WebXRLayerRenderTargetTexture } from "./webXRLayerRenderTargetTexture";
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
     * Builds the render target shell as a {@link WebXRLayerRenderTargetTexture} for the single-view path so
     * each eye can bind its own array layer of a layered projection-layer texture. Multiview is not yet
     * supported on this WebGPU path and is delegated to the base implementation.
     * @param width the width of the render target
     * @param height the height of the render target
     * @param multiview whether the render target should be a multiview render target
     * @returns the created (but not yet registered) render target texture
     */
    protected override _createRenderTargetTextureShell(width: number, height: number, multiview: boolean): RenderTargetTexture {
        if (multiview) {
            return super._createRenderTargetTextureShell(width, height, multiview);
        }
        const renderTargetTexture = new WebXRLayerRenderTargetTexture("XR renderTargetTexture", { width, height }, this._scene);
        renderTargetTexture.renderTarget!._samples = renderTargetTexture.samples;
        // The projection-layer texture is presented directly by the XR compositor (top-left origin, never
        // re-sampled by Babylon), so opt this target out of the engine's render-target Y-flip / winding
        // compensation and render it upright, matching the WebXR/WebGPU spec's plain render pass.
        (renderTargetTexture.renderTarget as WebGPURenderTargetWrapper)._disableEngineYFlip = true;
        return renderTargetTexture;
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
    ): WebXRLayerRenderTargetTexture {
        const color = this._wrapColorTexture(colorTexture);
        const depth = depthStencilTexture && depthStencilFormat ? this._wrapDepthTexture(depthStencilTexture, depthStencilFormat) : null;
        // Single-view (the only path here) always builds a WebXRLayerRenderTargetTexture via the shell override above.
        const renderTargetTexture = this._createRenderTargetTextureInternal(width, height, color, depth, multiview) as WebXRLayerRenderTargetTexture;
        this._attachPerEyeClearObserver(renderTargetTexture);
        return renderTargetTexture;
    }

    /**
     * Ensures this render target is cleared every frame, including for the right eye.
     *
     * `Scene._clearFrameBuffer` skips clearing the right rig camera's framebuffer (`!camera.isRightCamera`).
     * That is a valid optimization for WebGL2 stereo, where both eyes render into a single side-by-side
     * texture and the left eye's full clear already covers the whole texture. WebGPU projection layers give
     * each eye its OWN render target (a distinct array layer rendered in a separate render pass), so the
     * right eye's color and — critically — depth would never be cleared, leaving its depth test to reject
     * every fragment (a black right eye). The scene notifies `onClearObservable` regardless of
     * `camera.isRightCamera`, so this observer clears both eyes' targets. WebGL providers never attach it,
     * so the WebGL path is unchanged.
     *
     * The observer mirrors the clear semantics of `Scene._clearFrameBuffer` (minus the right-eye skip): it
     * only clears when the scene has `autoClear` enabled, clears color at most once per frame (guarded by
     * `RenderTargetTexture._cleared`, which the scene resets per frame in `_checkCameraRenderTarget`), always
     * clears depth+stencil, and honors `skipInitialClear`. This keeps the "clear once per RTT per frame"
     * contract instead of clearing color on every notification.
     * @param renderTargetTexture the per-eye render target to clear each frame
     */
    private _attachPerEyeClearObserver(renderTargetTexture: RenderTargetTexture): void {
        renderTargetTexture.onClearObservable.add((engine) => {
            // Honor skipInitialClear so this observer preserves the default clear semantics it replaces.
            if (renderTargetTexture.skipInitialClear) {
                return;
            }
            const scene = renderTargetTexture.getScene();
            // When autoClear is disabled the scene does not clear render targets; match that so this observer
            // does not force a clear the user opted out of.
            if (scene && !scene.autoClear) {
                return;
            }
            // Clear color only once per frame (!_cleared), always clear depth+stencil, then mark the target
            // cleared for this frame so a second notification in the same frame does not re-clear color.
            engine.clear(renderTargetTexture.clearColor ?? scene?.clearColor ?? null, !renderTargetTexture._cleared, true, true);
            renderTargetTexture._cleared = true;
        });
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
