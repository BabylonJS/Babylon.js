import { type RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { type Viewport } from "core/Maths/math.viewport";
import { Observable } from "core/Misc/observable";
import { type WebXRLayerType, WebXRLayerWrapper } from "core/XR/webXRLayerWrapper";
import { type WebXRLayerRenderTargetTextureProvider } from "core/XR/webXRRenderTargetTextureProvider";
import { WebXRWebGPURenderTargetTextureProvider } from "core/XR/webXRWebGPURenderTargetTextureProvider";
import { type WebXRSessionManager } from "core/XR/webXRSessionManager";
import { type Nullable } from "core/types";

/**
 * Wraps xr composition layers for the WebGPU (XRGPUBinding) backend.
 * Mirrors {@link WebXRCompositionLayerWrapper} for WebGPU.
 * @internal
 */
export class WebXRWebGPUCompositionLayerWrapper extends WebXRLayerWrapper {
    constructor(
        public override getWidth: () => number,
        public override getHeight: () => number,
        public override readonly layer: XRCompositionLayer,
        public override readonly layerType: WebXRLayerType,
        public readonly isMultiview: boolean,
        public createRTTProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider
    ) {
        super(getWidth, getHeight, layer, layerType, createRTTProvider);
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer
 * on the WebGPU backend. Mirrors {@link WebXRCompositionLayerRenderTargetTextureProvider}, but wraps
 * {@link XRGPUSubImage} GPUTextures instead of WebGL textures.
 * @internal
 */
export class WebXRWebGPUCompositionLayerRenderTargetTextureProvider extends WebXRWebGPURenderTargetTextureProvider {
    protected _lastSubImages = new Map<XREye, XRGPUSubImage>();
    private _compositionLayer: XRCompositionLayer;
    /**
     * Fires every time a new render target texture is created (either for eye, for view, or for the entire frame)
     */
    public onRenderTargetTextureCreatedObservable = new Observable<{ texture: RenderTargetTexture; eye?: XREye }>();

    constructor(
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrGPUBinding: XRGPUBinding,
        public override readonly layerWrapper: WebXRWebGPUCompositionLayerWrapper,
        protected readonly _depthStencilFormat?: GPUTextureFormat
    ) {
        super(_xrSessionManager.scene, layerWrapper);
        this._compositionLayer = layerWrapper.layer;
    }

    protected _getRenderTargetForSubImage(subImage: XRGPUSubImage, eye: XREye = "none") {
        const lastSubImage = this._lastSubImages.get(eye);
        const eyeIndex = eye == "right" ? 1 : 0;

        const colorTexture = subImage.colorTexture;
        const colorTextureWidth = colorTexture.width;
        const colorTextureHeight = colorTexture.height;

        const depthStencilTexture = subImage.depthStencilTexture ?? null;

        const existingRenderTarget = this._renderTargetTextures[eyeIndex];
        const sizeChanged = !existingRenderTarget || lastSubImage?.colorTexture.width !== colorTextureWidth || lastSubImage?.colorTexture.height !== colorTextureHeight;

        if (sizeChanged) {
            this._renderTargetTextures[eyeIndex] = this._createRenderTargetTextureFromGPUTextures(
                colorTextureWidth,
                colorTextureHeight,
                colorTexture,
                depthStencilTexture,
                this._depthStencilFormat,
                this.layerWrapper.isMultiview
            );

            this._framebufferDimensions = {
                framebufferWidth: colorTextureWidth,
                framebufferHeight: colorTextureHeight,
            };
            this.onRenderTargetTextureCreatedObservable.notifyObservers({ texture: this._renderTargetTextures[eyeIndex], eye });
        } else {
            // Same size: repoint the wrapped textures at this frame's GPUTextures, preserving the
            // RenderTargetTexture / InternalTexture identity held by the XR camera's outputRenderTarget.
            this._updateRenderTargetTextureFromGPUTextures(existingRenderTarget, colorTexture, depthStencilTexture);
        }

        this._lastSubImages.set(eye, subImage);
        return this._renderTargetTextures[eyeIndex];
    }

    private _getSubImageForEye(eye?: XREye): Nullable<XRGPUSubImage> {
        const currentFrame = this._xrSessionManager.currentFrame;
        if (currentFrame) {
            return this._xrGPUBinding.getSubImage(this._compositionLayer, currentFrame, eye);
        }
        return null;
    }

    public getRenderTargetTextureForEye(eye?: XREye): Nullable<RenderTargetTexture> {
        const subImage = this._getSubImageForEye(eye);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, eye);
        }
        return null;
    }

    public getRenderTargetTextureForView(view?: XRView): Nullable<RenderTargetTexture> {
        return this.getRenderTargetTextureForEye(view?.eye);
    }

    protected _setViewportForSubImage(viewport: Viewport, subImage: XRGPUSubImage) {
        const textureWidth = subImage.colorTexture.width;
        const textureHeight = subImage.colorTexture.height;
        const xrViewport = subImage.viewport;
        viewport.x = xrViewport.x / textureWidth;
        viewport.y = xrViewport.y / textureHeight;
        viewport.width = xrViewport.width / textureWidth;
        viewport.height = xrViewport.height / textureHeight;
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view.eye) || this._getSubImageForEye(view.eye);
        if (subImage) {
            this._setViewportForSubImage(viewport, subImage);
            return true;
        }
        return false;
    }
}
