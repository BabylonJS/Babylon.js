import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Nullable } from "../../types";
import { WebXRRenderTargetProvider } from "../webXRRenderTargetProvider";
import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { WebXRCompositionLayerType, WebXRLayerWrapper, WebXRLayerWrapperProvider } from "../webXRLayerWrapper";
import { Viewport } from "../../Maths/math.viewport";

/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer.
 * @hidden
 */
class XRCompositionLayerRenderTargetProvider extends WebXRRenderTargetProvider {
    protected _lastSubImages = new Map<XREye, XRWebGLSubImage>();
    private _glContext: WebGLRenderingContext;

    constructor(
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding,
        private readonly _layer: XRCompositionLayer) {
        super(_xrSessionManager.scene, _layer);
        this._glContext = this._xrSessionManager.scene.getEngine()._gl;
    }

    protected _getRenderTargetForSubImage(subImage: XRWebGLSubImage, eye: XREye) {
        const lastSubImage = this._lastSubImages.get(eye);
        const subImageIndex = eye == 'left' ? 0 : 1;
        if (!this._renderTargetTextures[subImageIndex] ||
            lastSubImage?.textureWidth !== subImage.textureWidth ||
            lastSubImage?.textureHeight != subImage.textureHeight) {
            if (this._renderTargetTextures[subImageIndex]) {
                this._destroyRenderTargetTexture(this._renderTargetTextures[subImageIndex]);
            }
            const colorTexture = new WebGLHardwareTexture(subImage.colorTexture, this._glContext);
            const depthStencilTexture = new WebGLHardwareTexture(subImage.depthStencilTexture, this._glContext);
            this._renderTargetTextures[subImageIndex] = this._createRenderTargetTexture(
                subImage.textureWidth,
                subImage.textureHeight,
                null,
                colorTexture,
                depthStencilTexture);
        }

        this._lastSubImages.set(eye, subImage);

        return this._renderTargetTextures[subImageIndex];
    }

    public getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const subImage = this._xrWebGLBinding.getSubImage(this._layer, this._xrSessionManager.currentFrame!, eye);
        return this._getRenderTargetForSubImage(subImage, eye);
    }

    public getRenderTargetForView(view: XRView): Nullable<RenderTargetTexture> {
        return this.getRenderTargetForEye(view.eye);
    }

    public trySetViewportForView(viewport: Viewport, view: XRView): boolean {
        const subImage = this._lastSubImages.get(view.eye) || null;
        if (subImage) {
            const xrViewport = subImage.viewport;
            viewport.x = xrViewport.x / subImage.textureWidth;
            viewport.y = xrViewport.y / subImage.textureHeight;
            viewport.width = xrViewport.width / subImage.textureWidth;
            viewport.height = xrViewport.height / subImage.textureHeight;
            return true;
        }
        return false;
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number; }> {
        const lastLeftSubImage = this._lastSubImages.get('left');
        if (!!lastLeftSubImage) {
            return {
                framebufferWidth: lastLeftSubImage.textureWidth,
                framebufferHeight: lastLeftSubImage.textureHeight
            };
        }
        return null;
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRProjectionLayer.
 * @hidden
 */
class XRProjectionLayerRenderTargetProvider extends XRCompositionLayerRenderTargetProvider {
    constructor(
        _xrSessionManager: WebXRSessionManager,
        _xrWebGLBinding: XRWebGLBinding,
        private readonly _projectionLayer: XRProjectionLayer) {
        super(_xrSessionManager, _xrWebGLBinding, _projectionLayer);
    }

    public getRenderTargetForView(view: XRView): Nullable<RenderTargetTexture> {
        const subImage = this._xrWebGLBinding.getViewSubImage(this._projectionLayer, view);
        return this._getRenderTargetForSubImage(subImage, view.eye);
    }

    public getRenderTargetForEye(eye: XREye): Nullable<RenderTargetTexture> {
        const lastSubImage = this._lastSubImages.get(eye);
        if (lastSubImage) {
            return this._getRenderTargetForSubImage(lastSubImage, eye);
        }
        return null;
    }

    public getFramebufferDimensions(): Nullable<{ framebufferWidth: number; framebufferHeight: number; }> {
        return {
            framebufferWidth: this._projectionLayer.textureWidth,
            framebufferHeight: this._projectionLayer.textureHeight
        };
    }
}

/**
 * Wraps the webxr composition layers interface.
 */
export class WebXRLayers extends WebXRAbstractFeature implements WebXRLayerWrapperProvider {
    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.LAYERS;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    private _xrWebGLBinding: XRWebGLBinding;
    private _layerTypes = new Map<any, WebXRCompositionLayerType>();

    constructor(_xrSessionManager: WebXRSessionManager) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "layers";

        _xrSessionManager.onXRSessionInit.add(() => {
            const glContext = _xrSessionManager.scene.getEngine()._gl;
            this._xrWebGLBinding = new XRWebGLBinding(_xrSessionManager.session, glContext);
        });

        // Inject this instance for the session manager to use for wrapping layers.
        _xrSessionManager._addLayerWrapperProvider(this);
    }

    /**
     * Creates a new XRProjectionLayer.
     * @returns the projection layer
     */
    public createProjectionLayer(): XRProjectionLayer {
        const newLayer = this._xrWebGLBinding.createProjectionLayer({
            textureType: "texture",
            colorFormat: WebGLRenderingContext.RGBA,
            depthFormat: WebGLRenderingContext.DEPTH_COMPONENT,
            scaleFactor: 1.0,
        });
        this._layerTypes.set(newLayer, 'XRProjectionLayer');
        return newLayer;
    }

    /**
     * Creates a new render target provider for a given XRProjectionLayer
     * @param projectionLayer the projection layer
     * @returns the new render target provider
     * @hidden
     */
    public createProjectionLayerRenderTargetProvider(projectionLayer: XRProjectionLayer): XRProjectionLayerRenderTargetProvider {
        return new XRProjectionLayerRenderTargetProvider(this._xrSessionManager, this._xrWebGLBinding, projectionLayer);
    }

    /**
     * Creates a wrapper around a given XRLayer that was created by this feature.
     * @param layer the xr layer
     * @returns the wrapper if the layer was created by this feature, otherwise null
     * @hidden
     */
    public createLayerWrapper(layer: XRLayer): Nullable<WebXRLayerWrapper> {
        const layerType = this._layerTypes.get(layer);
        switch (layerType) {
            case 'XRProjectionLayer':
                const projLayer = layer as XRProjectionLayer;
                return new WebXRLayerWrapper(
                    () => projLayer.textureWidth,
                    () => projLayer.textureHeight,
                    layer,
                    'XRProjectionLayer',
                    () => this.createProjectionLayerRenderTargetProvider(projLayer));
        }
        return null;
    }

    public isCompatible(): boolean {
        // TODO (rgerd): Add native support.
        return !this._xrSessionManager.isNative
            && typeof XRWebGLBinding !== 'undefined'
            && !!XRWebGLBinding.prototype.createProjectionLayer;
    }

    /**
     * Dispose this feature and all of the resources attached.
     */
    public dispose(): void {
        super.dispose();

        this._xrSessionManager._removeLayerWrapperProvider(this);
    }

    protected _onXRFrame(_xrFrame: XRFrame): void { /* empty */ }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLayers.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLayers(xrSessionManager);
    },
    WebXRLayers.Version,
    false
);