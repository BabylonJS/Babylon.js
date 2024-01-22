import type { RenderTargetTexture } from "core/Materials";
import type { Viewport } from "core/Maths/math.viewport";
import type { WebXRLayerType } from "core/XR/webXRLayerWrapper";
import { WebXRLayerWrapper } from "core/XR/webXRLayerWrapper";
import { WebXRLayerRenderTargetTextureProvider } from "core/XR/webXRRenderTargetTextureProvider";
import type { WebXRSessionManager } from "core/XR/webXRSessionManager";
import type { Nullable } from "core/types";

/**
 * Wraps xr composition layers.
 * @internal
 */
export class WebXRCompositionLayerWrapper extends WebXRLayerWrapper {
    constructor(
        public getWidth: () => number,
        public getHeight: () => number,
        public readonly layer: XRCompositionLayer,
        public readonly layerType: WebXRLayerType,
        public readonly isMultiview: boolean,
        public createRTTProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider
    ) {
        super(getWidth, getHeight, layer, layerType, createRTTProvider);
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer.
 * @internal
 */
export class WebXRCompositionLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    protected _lastSubImages = new Map<XREye, XRWebGLSubImage>();
    private _compositionLayer: XRCompositionLayer;

    constructor(
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding,
        public readonly layerWrapper: WebXRCompositionLayerWrapper
    ) {
        super(_xrSessionManager.scene, layerWrapper);
        this._compositionLayer = layerWrapper.layer;
    }

    protected _getRenderTargetForSubImage(subImage: XRWebGLSubImage, eye: XREye) {
        const lastSubImage = this._lastSubImages.get(eye);
        const eyeIndex = eye == "left" ? 0 : 1;

        const colorTextureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const colorTextureHeight = subImage.colorTextureHeight ?? subImage.textureHeight;

        if (!this._renderTargetTextures[eyeIndex] || lastSubImage?.textureWidth !== colorTextureWidth || lastSubImage?.textureHeight !== colorTextureHeight) {
            let depthStencilTexture;
            const depthStencilTextureWidth = subImage.depthStencilTextureWidth ?? colorTextureWidth;
            const depthStencilTextureHeight = subImage.depthStencilTextureHeight ?? colorTextureHeight;
            if (colorTextureWidth === depthStencilTextureWidth || colorTextureHeight === depthStencilTextureHeight) {
                depthStencilTexture = subImage.depthStencilTexture;
            }

            this._renderTargetTextures[eyeIndex] = this._createRenderTargetTexture(
                colorTextureWidth,
                colorTextureHeight,
                null,
                subImage.colorTexture,
                depthStencilTexture,
                this.layerWrapper.isMultiview
            );

            this._framebufferDimensions = {
                framebufferWidth: colorTextureWidth,
                framebufferHeight: colorTextureHeight,
            };
        }

        this._lastSubImages.set(eye, subImage);
        return this._renderTargetTextures[eyeIndex];
    }
    private _getSubImageForEye(eye: XREye): Nullable<XRWebGLSubImage> {
        const currentFrame = this._xrSessionManager.currentFrame;
        if (currentFrame) {
            return this._xrWebGLBinding.getSubImage(this._compositionLayer, currentFrame, eye);
        }
        return null;
    }
    public getRenderTargetTextureForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const subImage = this._getSubImageForEye(eye);
        if (subImage) {
            return this._getRenderTargetForSubImage(subImage, eye);
        }
        return null;
    }
    public getRenderTargetTextureForView(view: XRView): Nullable<RenderTargetTexture> {
        return this.getRenderTargetTextureForEye(view.eye);
    }

    protected _setViewportForSubImage(viewport: Viewport, subImage: XRWebGLSubImage) {
        const textureWidth = subImage.colorTextureWidth ?? subImage.textureWidth;
        const textureHeight = subImage.colorTextureWidth ?? subImage.textureHeight;
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
