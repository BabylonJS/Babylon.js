import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRWebGPUCompositionLayerRenderTargetTextureProvider, WebXRWebGPUCompositionLayerWrapper } from "./WebXRWebGPUCompositionLayer";
import { type Nullable } from "core/types";
import { type RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Viewport } from "core/Maths/math.viewport";

/**
 * Wraps xr projection layers for the WebGPU (XRGPUBinding) backend.
 * Mirrors {@link WebXRProjectionLayerWrapper} for WebGPU.
 * @internal
 */
export class WebXRWebGPUProjectionLayerWrapper extends WebXRWebGPUCompositionLayerWrapper {
    constructor(
        public override readonly layer: XRProjectionLayer,
        isMultiview: boolean,
        xrGPUBinding: XRGPUBinding,
        depthStencilFormat?: GPUTextureFormat
    ) {
        super(
            () => layer.textureWidth,
            () => layer.textureHeight,
            layer,
            "XRProjectionLayer",
            isMultiview,
            (sessionManager) => new WebXRWebGPUProjectionLayerRenderTargetTextureProvider(sessionManager, xrGPUBinding, this, depthStencilFormat)
        );
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRProjectionLayer
 * on the WebGPU backend.
 * @internal
 */
class WebXRWebGPUProjectionLayerRenderTargetTextureProvider extends WebXRWebGPUCompositionLayerRenderTargetTextureProvider {
    private readonly _projectionLayer: XRProjectionLayer;

    constructor(
        _xrSessionManager: WebXRSessionManager,
        _xrGPUBinding: XRGPUBinding,
        public override readonly layerWrapper: WebXRWebGPUProjectionLayerWrapper,
        depthStencilFormat?: GPUTextureFormat
    ) {
        super(_xrSessionManager, _xrGPUBinding, layerWrapper, depthStencilFormat);
        this._projectionLayer = layerWrapper.layer;
    }

    private _getSubImageForView(view: XRView): XRGPUSubImage {
        return this._xrGPUBinding.getViewSubImage(this._projectionLayer, view);
    }

    public override getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        return this._getRenderTargetForSubImage(this._getSubImageForView(view), view.eye);
    }

    public override getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const lastSubImage = this._lastSubImages.get(eye);
        if (lastSubImage) {
            return this._getRenderTargetForSubImage(lastSubImage, eye);
        }
        return null;
    }

    public override trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForView(view);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}

/**
 * The default depth/stencil format used for a WebGPU projection layer.
 * Mirrors the WebGL default (DEPTH24_STENCIL8).
 * @internal
 */
export const DefaultXRGPUProjectionLayerDepthStencilFormat: GPUTextureFormat = "depth24plus-stencil8";

/**
 * Builds the default XRGPUProjectionLayerInit for a WebGPU projection layer.
 * The color format must be the binding's preferred color format, so it is provided by the caller.
 * @param colorFormat the preferred color format reported by the XRGPUBinding
 * @param depthStencilFormat the depth/stencil format to request (defaults to depth24plus-stencil8)
 * @returns the projection layer init to pass to XRGPUBinding.createProjectionLayer
 * @internal
 */
export function CreateDefaultXRGPUProjectionLayerInit(
    colorFormat: GPUTextureFormat,
    depthStencilFormat: GPUTextureFormat = DefaultXRGPUProjectionLayerDepthStencilFormat
): XRGPUProjectionLayerInit {
    return {
        colorFormat,
        depthStencilFormat,
        // GPUTextureUsage.RENDER_ATTACHMENT (0x10) — the spec default, stated explicitly here.
        textureUsage: 0x10,
        scaleFactor: 1.0,
    };
}
