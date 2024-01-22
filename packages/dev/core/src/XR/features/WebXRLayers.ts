import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { WebXRLayerWrapper } from "../webXRLayerWrapper";
import { WebXRWebGLLayerWrapper } from "../webXRWebGLLayer";
import { WebXRProjectionLayerWrapper, defaultXRProjectionLayerInit } from "./Layers/WebXRProjectionLayer";
import { WebXRCompositionLayerRenderTargetTextureProvider, WebXRCompositionLayerWrapper } from "./Layers/WebXRCompositionLayer";

const defaultXRWebGLLayerInit: XRWebGLLayerInit = {};

/**
 * Configuration options of the layers feature
 */
export interface IWebXRLayersOptions {
    /**
     * Whether to try initializing the base projection layer as a multiview render target, if multiview is supported.
     * Defaults to false.
     */
    preferMultiviewOnInit?: boolean;

    /**
     * Optional configuration for the base projection layer.
     */
    projectionLayerInit?: Partial<XRProjectionLayerInit>;
}

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
    /**
     * Already-created layers
     */
    private _existingLayers: WebXRLayerWrapper[] = [];

    private _glContext: WebGLRenderingContext | WebGL2RenderingContext;
    private _xrWebGLBinding: XRWebGLBinding;
    private _isMultiviewEnabled = false;
    private _projectionLayerInitialized = false;

    constructor(
        _xrSessionManager: WebXRSessionManager,
        private readonly _options: IWebXRLayersOptions = {}
    ) {
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

        const engine = this._xrSessionManager.scene.getEngine();
        this._glContext = engine._gl;
        this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);
        this._existingLayers.length = 0;

        const projectionLayerInit = { ...defaultXRProjectionLayerInit, ...this._options.projectionLayerInit };
        this._isMultiviewEnabled = this._options.preferMultiviewOnInit && engine.getCaps().multiview;
        this.createProjectionLayer(projectionLayerInit /*, projectionLayerMultiview*/);
        this._projectionLayerInitialized = true;

        return true;
    }

    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        this._existingLayers.length = 0;
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

    private _validateLayerInit(params: XRProjectionLayerInit | XRQuadLayerInit, multiview = this._isMultiviewEnabled): void {
        // check if we are in session
        if (!this._xrSessionManager.inXRSession) {
            throw new Error("Cannot create a layer outside of a WebXR session. Make sure the session has started before creating layers.");
        }
        if (multiview && params.textureType !== "texture-array") {
            throw new Error("Projection layers can only be made multiview if they use texture arrays. Set the textureType parameter to 'texture-array'.");
        }

        // TODO (rgerd): Support RTT's that are bound to sub-images in the texture array.
        if (!multiview && params.textureType === "texture-array") {
            throw new Error("We currently only support multiview rendering when the textureType parameter is set to 'texture-array'.");
        }
    }

    private _extendXRLayerInit(params: XRProjectionLayerInit | XRQuadLayerInit, multiview = this._isMultiviewEnabled): XRProjectionLayerInit | XRQuadLayerInit {
        if (multiview) {
            params.textureType = "texture-array";
        }
        return params;
    }

    /**
     * Creates a new XRProjectionLayer.
     * @param params an object providing configuration options for the new XRProjectionLayer.
     * @param multiview whether the projection layer should render with multiview. Will be tru automatically if the extension initialized with multiview.
     * @returns the projection layer
     */
    public createProjectionLayer(params = defaultXRProjectionLayerInit, multiview = this._isMultiviewEnabled): WebXRProjectionLayerWrapper {
        this._extendXRLayerInit(params, multiview);
        this._validateLayerInit(params, multiview);

        const projLayer = this._xrWebGLBinding.createProjectionLayer(params);
        const layer = new WebXRProjectionLayerWrapper(projLayer, multiview, this._xrWebGLBinding);
        this.addXRSessionLayer(layer);
        return layer;
    }

    /**
     * Creates a new XRQuadLayer.
     * @param params an object providing configuration options for the new XRQuadLayer.
     * @param multiview whether the quad layer should render with multiview. Will be tru automatically if the extension initialized with multiview.
     * @returns the quad layer
     */
    public createQuadLayer(params: Partial<XRQuadLayerInit> = {}, multiview = this._isMultiviewEnabled): WebXRCompositionLayerWrapper {
        this._extendXRLayerInit(params, multiview);
        const engine = this._xrSessionManager.scene.getEngine();
        const populatedParams: XRQuadLayerInit = {
            space: this._xrSessionManager.referenceSpace,
            viewPixelWidth: engine.framebufferDimensionsObject?.framebufferWidth ?? engine.getRenderWidth(),
            viewPixelHeight: engine.framebufferDimensionsObject?.framebufferHeight ?? engine.getRenderHeight(),
            ...params,
        };
        this._validateLayerInit(populatedParams, multiview);
        const quadLayer = this._xrWebGLBinding.createQuadLayer(populatedParams);
        const wrapper: WebXRCompositionLayerWrapper = new WebXRCompositionLayerWrapper(
            () => quadLayer.width,
            () => quadLayer.height,
            quadLayer,
            "XRQuadLayer",
            multiview,
            (sessionManager) => new WebXRCompositionLayerRenderTargetTextureProvider(sessionManager, this._xrWebGLBinding, wrapper)
        );
        this.addXRSessionLayer(wrapper);
        return wrapper;
    }

    /**
     * Add a new layer to the already-existing list of layers
     * @param wrappedLayer the new layer to add to the existing ones
     */
    public addXRSessionLayer(wrappedLayer: WebXRLayerWrapper) {
        this.setXRSessionLayers([...this._existingLayers, wrappedLayer]);
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
        this._existingLayers = wrappedLayers;
        const renderStateInit: XRRenderStateInit = { ...this._xrSessionManager.session.renderState };
        // Clear out the layer-related fields.
        renderStateInit.baseLayer = undefined;
        renderStateInit.layers = wrappedLayers.map((wrappedLayer) => wrappedLayer.layer);
        this._xrSessionManager.updateRenderState(renderStateInit);
        if (!this._projectionLayerInitialized) {
            this._xrSessionManager._setBaseLayerWrapper(wrappedLayers.length > 0 ? wrappedLayers[0] : null);
        }
    }

    public isCompatible(): boolean {
        // TODO (rgerd): Add native support.
        return !this._xrSessionManager.isNative && typeof XRWebGLBinding !== "undefined" && !!XRWebGLBinding.prototype.createProjectionLayer;
    }

    /**
     * Dispose this feature and all of the resources attached.
     */
    public dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        /* empty */
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLayers.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLayers(xrSessionManager, options);
    },
    WebXRLayers.Version,
    false
);
