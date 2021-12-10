import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Nullable } from "../../types";
import { WebXRLayerRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider";
import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { WebXRLayerType, WebXRLayerWrapper } from "../webXRLayerWrapper";
import { Viewport } from "../../Maths/math.viewport";
import { WebXRWebGLLayerWrapper } from "../webXRWebGLLayer";

/**
 * Wraps xr composition layers.
 * @hidden
 */
export class WebXRCompositionLayerWrapper extends WebXRLayerWrapper {
    constructor(
        public getWidth: () => number,
        public getHeight: () => number,
        public readonly layer: XRCompositionLayer,
        public readonly layerType: WebXRLayerType,
        public createRTTProvider: (xrSessionManager: WebXRSessionManager) => WebXRLayerRenderTargetTextureProvider) {
        super(
            getWidth,
            getHeight,
            layer,
            layerType,
            createRTTProvider);
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRCompositionLayer.
 * @hidden
 */
class WebXRCompositionLayerRenderTargetTextureProvider extends WebXRLayerRenderTargetTextureProvider {
    protected _lastSubImages = new Map<XREye, XRWebGLSubImage>();
    private _glContext: WebGLRenderingContext;
    private _compositionLayer: XRCompositionLayer;

    constructor(
        protected readonly _xrSessionManager: WebXRSessionManager,
        protected readonly _xrWebGLBinding: XRWebGLBinding,
        public readonly layerWrapper: WebXRCompositionLayerWrapper) {
        super(_xrSessionManager.scene, layerWrapper);
        this._glContext = this._xrSessionManager.scene.getEngine()._gl;
        this._compositionLayer = layerWrapper.layer;
    }

    protected _getRenderTargetForSubImage(subImage: XRWebGLSubImage, eye: XREye) {
        const lastSubImage = this._lastSubImages.get(eye);
        const subImageIndex = eye == 'left' ? 0 : 1;
        if (!this._renderTargetTextures[subImageIndex] ||
            lastSubImage?.textureWidth !== subImage.textureWidth ||
            lastSubImage?.textureHeight != subImage.textureHeight) {
            const colorTexture = new WebGLHardwareTexture(subImage.colorTexture, this._glContext);
            const depthStencilTexture = new WebGLHardwareTexture(subImage.depthStencilTexture, this._glContext);
            this._renderTargetTextures[subImageIndex] = this._createRenderTargetTexture(
                subImage.textureWidth,
                subImage.textureHeight,
                null,
                colorTexture,
                depthStencilTexture);

            this._framebufferDimensions = {
                framebufferWidth: subImage.textureWidth,
                framebufferHeight: subImage.textureHeight
            };
        }

        this._lastSubImages.set(eye, subImage);

        return this._renderTargetTextures[subImageIndex];
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
        const textureWidth = subImage.textureWidth;
        const textureHeight = subImage.textureHeight;
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

/**
 * Wraps xr projection layers.
 * @hidden
 */
export class WebXRProjectionLayerWrapper extends WebXRCompositionLayerWrapper {
    constructor(
        public readonly layer: XRProjectionLayer,
        xrGLBinding: XRWebGLBinding) {
        super(
            () => layer.textureWidth,
            () => layer.textureHeight,
            layer,
            'XRProjectionLayer',
            (sessionManager) => new WebXRProjectionLayerRenderTargetTextureProvider(sessionManager, xrGLBinding, this));
    }
}

/**
 * Provides render target textures and other important rendering information for a given XRProjectionLayer.
 * @hidden
 */
class WebXRProjectionLayerRenderTargetTextureProvider extends WebXRCompositionLayerRenderTargetTextureProvider {
    private readonly _projectionLayer: XRProjectionLayer;

    constructor(
        _xrSessionManager: WebXRSessionManager,
        _xrWebGLBinding: XRWebGLBinding,
        public readonly layerWrapper: WebXRProjectionLayerWrapper) {
        super(_xrSessionManager, _xrWebGLBinding, layerWrapper);
        this._projectionLayer = layerWrapper.layer;
    }

    private _getSubImageForView(view: XRView): XRWebGLSubImage {
        return this._xrWebGLBinding.getViewSubImage(this._projectionLayer, view);
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

const defaultXRWebGLLayerInit: XRWebGLLayerInit = {
};

const defaultXRProjectionLayerInit: XRProjectionLayerInit = {
    textureType: "texture",
    colorFormat: 0x1908, /* WebGLRenderingContext.RGBA */
    depthFormat: 0x1902, /* WebGLRenderingContext.DEPTH_COMPONENT */
    scaleFactor: 1.0,
};

/**
 * Exposes the WebXR Layers API.
 */
export class WebXRLayers extends WebXRAbstractFeature {
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

    private _glContext: WebGLRenderingContext | WebGL2RenderingContext;
    private _xrWebGLBinding: XRWebGLBinding;

    constructor(_xrSessionManager: WebXRSessionManager) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "layers";
    }

    /**
     * Attach this feature.
     * Will usually be called by the features manager.
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        this._glContext = this._xrSessionManager.scene.getEngine()._gl;
        this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);
        this.setXRSessionLayers([this.createProjectionLayer()]);

        return true;
    }

    /**
     * Creates a new XRWebGLLayer.
     * @param params an object providing configuration options for the new XRWebGLLayer
     * @returns the XRWebGLLayer
     */
    public createXRWebGLLayer(params = defaultXRWebGLLayerInit): WebXRWebGLLayerWrapper {
        const layer = new XRWebGLLayer(this._xrSessionManager.session, this._glContext, params);
        return new WebXRWebGLLayerWrapper(layer);
    }

    /**
     * Creates a new XRProjectionLayer.
     * @param params an object providing configuration options for the new XRProjectionLayer
     * @returns the projection layer
     */
    public createProjectionLayer(params = defaultXRProjectionLayerInit): WebXRProjectionLayerWrapper {
        const projLayer = this._xrWebGLBinding.createProjectionLayer(params);
        return new WebXRProjectionLayerWrapper(projLayer, this._xrWebGLBinding);
    }

    /**
     * Sets the layers to be used by the XR session.
     * Note that you must call this function with any layers you wish to render to
     * since it adds them to the XR session's render state
     * (replacing any layers that were added in a previous call to setXRSessionLayers or updateRenderState).
     * This method also sets up the session manager's render target texture provider
     * as the first layer in the array, which feeds the WebXR camera(s) attached to the session.
     * @param wrappedLayers An array of WebXRLayerWrapper, usually returned from the WebXRLayers createLayer functions.
     */
    public setXRSessionLayers(wrappedLayers: Array<WebXRLayerWrapper>): void {
        const renderStateInit: XRRenderStateInit = { ...this._xrSessionManager.session.renderState };
        // Clear out the layer-related fields.
        renderStateInit.baseLayer = undefined;
        renderStateInit.layers = wrappedLayers.map((wrappedLayer) => wrappedLayer.layer);
        this._xrSessionManager.updateRenderState(renderStateInit);
        this._xrSessionManager._setBaseLayerWrapper((wrappedLayers.length > 0) ? wrappedLayers[0] : null);
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