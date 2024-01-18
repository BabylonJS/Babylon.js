

// const defaultXRQuadLayerInit: XRQuadLayerInit = {
//     textureType: "texture",
//     colorFormat: 0x1908 /* WebGLRenderingContext.RGBA */,
//     depthFormat: 0x88f0 /* WebGLRenderingContext.DEPTH24_STENCIL8 */,
//     scaleFactor: 1.0,
// };

import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRCompositionLayerWrapper, WebXRCompositionLayerRenderTargetTextureProvider } from "../WebXRLayers";
import { Nullable } from "core/types";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";

/**
 * Wraps xr Quad layers.
 * @internal
 */
export class WebXRQuadLayerWrapper extends WebXRCompositionLayerWrapper {
    constructor(
        public readonly layer: XRQuadLayer,
        isMultiview: boolean,
        xrGLBinding: XRWebGLBinding
    ) {
        super(
            () => layer.width,
            () => layer.height,
            layer,
            "XRQuadLayer",
            isMultiview,
            (sessionManager) => new WebXRQuadLayerRenderTargetTextureProvider(sessionManager, xrGLBinding, this)
        );
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRQuadLayer.
 * @internal
 */
class WebXRQuadLayerRenderTargetTextureProvider extends WebXRCompositionLayerRenderTargetTextureProvider {
    private readonly _quadLayer: XRQuadLayer;

    constructor(
        _xrSessionManager: WebXRSessionManager,
        _xrWebGLBinding: XRWebGLBinding,
        public readonly layerWrapper: WebXRQuadLayerWrapper
    ) {
        super(_xrSessionManager, _xrWebGLBinding, layerWrapper);
        this._quadLayer = layerWrapper.layer;
    }

    private _getSubImageForView(frame: XRFrame): XRWebGLSubImage {
        return this._xrWebGLBinding.getSubImage(this._quadLayer, frame);
    }

    public getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        return this._getRenderTargetForSubImage(this._getSubImageForView(view), view.eye);
    }

    public getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const lastSubImage = this._lastSubImages.get(eye);
        if (lastSubImage) {
            return this._getRenderTargetForSubImage(lastSubImage, eye);
        }
        return null;
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForView(view);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}