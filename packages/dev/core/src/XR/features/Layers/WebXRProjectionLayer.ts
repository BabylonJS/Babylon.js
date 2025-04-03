import type { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRCompositionLayerRenderTargetTextureProvider, WebXRCompositionLayerWrapper } from "./WebXRCompositionLayer";
import type { Nullable } from "core/types";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { Viewport } from "core/Maths/math.viewport";

/**
 * Wraps xr projection layers.
 * @internal
 */
export class WebXRProjectionLayerWrapper extends WebXRCompositionLayerWrapper {
    constructor(
        public override readonly layer: XRProjectionLayer,
        isMultiview: boolean,
        xrGLBinding: XRWebGLBinding
    ) {
        super(
            () => layer.textureWidth,
            () => layer.textureHeight,
            layer,
            "XRProjectionLayer",
            isMultiview,
            (sessionManager) => new WebXRProjectionLayerRenderTargetTextureProvider(sessionManager, xrGLBinding, this)
        );
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRProjectionLayer.
 * @internal
 */
class WebXRProjectionLayerRenderTargetTextureProvider extends WebXRCompositionLayerRenderTargetTextureProvider {
    private readonly _projectionLayer: XRProjectionLayer;

    constructor(
        _xrSessionManager: WebXRSessionManager,
        _xrWebGLBinding: XRWebGLBinding,
        public override readonly layerWrapper: WebXRProjectionLayerWrapper
    ) {
        super(_xrSessionManager, _xrWebGLBinding, layerWrapper);
        this._projectionLayer = layerWrapper.layer;
    }

    private _getSubImageForView(view: XRView): XRWebGLSubImage {
        return this._xrWebGLBinding.getViewSubImage(this._projectionLayer, view);
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
 * @internal
 */
export const DefaultXRProjectionLayerInit: XRProjectionLayerInit = {
    textureType: "texture",
    colorFormat: 0x1908 /* WebGLRenderingContext.RGBA */,
    depthFormat: 0x88f0 /* WebGLRenderingContext.DEPTH24_STENCIL8 */,
    scaleFactor: 1.0,
    clearOnAccess: false,
};
