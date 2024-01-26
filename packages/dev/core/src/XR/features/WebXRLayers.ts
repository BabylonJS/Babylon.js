import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { WebXRLayerWrapper } from "../webXRLayerWrapper";
import { WebXRWebGLLayerWrapper } from "../webXRWebGLLayer";
import { WebXRProjectionLayerWrapper, defaultXRProjectionLayerInit } from "./Layers/WebXRProjectionLayer";
import { WebXRCompositionLayerRenderTargetTextureProvider, WebXRCompositionLayerWrapper } from "./Layers/WebXRCompositionLayer";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { WebGLHardwareTexture } from "core/Engines/WebGL/webGLHardwareTexture";

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

    private _compositionLayerTextureMapping: WeakMap<XRCompositionLayer, ThinTexture> = new WeakMap();
    private _layerToRTTProviderMapping: WeakMap<XRCompositionLayer, WebXRCompositionLayerRenderTargetTextureProvider> = new WeakMap();

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
     * Note about making it private - this function will be exposed once I decide on a proper API to support all of the XR layers' options
     * @param options an object providing configuration options for the new XRQuadLayer.
     * @param babylonTexture whether the quad layer should render with multiview. Will be tru automatically if the extension initialized with multiview.
     * @returns the quad layer
     */
    private _createQuadLayer(options: { params: Partial<XRQuadLayerInit> } = { params: {} }, babylonTexture: ThinTexture): WebXRCompositionLayerWrapper {
        this._extendXRLayerInit(options.params, this._isMultiviewEnabled);
        const engine = this._xrSessionManager.scene.getEngine();
        const populatedParams: XRQuadLayerInit = {
            space: this._xrSessionManager.referenceSpace,
            viewPixelWidth: engine.framebufferDimensionsObject?.framebufferWidth ?? engine.getRenderWidth(),
            viewPixelHeight: engine.framebufferDimensionsObject?.framebufferHeight ?? engine.getRenderHeight(),
            ...options.params,
        };
        this._validateLayerInit(populatedParams, this._isMultiviewEnabled);
        const quadLayer = this._xrWebGLBinding.createQuadLayer(populatedParams);
        // this wrapper is not really needed, but it's here for consistency
        const wrapper: WebXRCompositionLayerWrapper = new WebXRCompositionLayerWrapper(
            () => quadLayer.width,
            () => quadLayer.height,
            quadLayer,
            "XRQuadLayer",
            this._isMultiviewEnabled,
            (sessionManager) => new WebXRCompositionLayerRenderTargetTextureProvider(sessionManager, this._xrWebGLBinding, wrapper)
        );

        this._compositionLayerTextureMapping.set(quadLayer, babylonTexture);
        const rtt = wrapper.createRenderTargetTextureProvider(this._xrSessionManager) as WebXRCompositionLayerRenderTargetTextureProvider;
        this._layerToRTTProviderMapping.set(quadLayer, rtt);
        this.addXRSessionLayer(wrapper);
        return wrapper;
    }

    /**
     * @experimental
     * This will support full screen ADT when used with WebXR Layers. This API might change in the future.
     * @param texture the texture to display in the layer
     */
    public addFullscreenAdvancedDynamicTexture(texture: DynamicTexture) {
        this._createQuadLayer({ params: { space: this._xrSessionManager.viewerReferenceSpace, textureType: "texture" } }, texture);
    }

    /**
     * Add a new layer to the already-existing list of layers
     * @param wrappedLayer the new layer to add to the existing ones
     */
    public addXRSessionLayer(wrappedLayer: WebXRLayerWrapper) {
        this._existingLayers.unshift(wrappedLayer);
        this.setXRSessionLayers(this._existingLayers);
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
    public setXRSessionLayers(wrappedLayers: Array<WebXRLayerWrapper> = this._existingLayers): void {
        // this._existingLayers = wrappedLayers;
        const renderStateInit: XRRenderStateInit = { ...this._xrSessionManager.session.renderState };
        // Clear out the layer-related fields.
        renderStateInit.baseLayer = undefined;
        renderStateInit.layers = wrappedLayers.map((wrappedLayer) => wrappedLayer.layer);
        this._xrSessionManager.updateRenderState(renderStateInit);
        if (!this._projectionLayerInitialized) {
            this._xrSessionManager._setBaseLayerWrapper(wrappedLayers.length > 0 ? wrappedLayers.at(-1)! : null);
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
        // Replace once the mapped internal texture of each available composition layer, apart from the last one, which is the projection layer that needs an RTT
        const layers = this._existingLayers;
        for (let i = 0; i < layers.length - 1; ++i) {
            const layer = layers[i];
            if (layer.layerType === "XRQuadLayer") {
                const texture = this._compositionLayerTextureMapping.get(layer.layer as XRCompositionLayer);
                // get the layer that hosts this texture
                const babylonLayer = this._xrSessionManager.scene.layers.find((babylonLayer) => {
                    return babylonLayer.texture === texture;
                });

                if (!babylonLayer) {
                    continue;
                }

                // get the rtt provider
                const rttProvider = this._layerToRTTProviderMapping.get(layer.layer as XRCompositionLayer);
                if (!rttProvider) {
                    continue;
                }
                // for each pose, render the layer
                const pose = this._xrSessionManager.currentFrame?.getViewerPose(this._xrSessionManager.referenceSpace);
                for (const view of pose?.views ?? []) {
                    if (!view) {
                        continue;
                    }
                    const rtt = rttProvider.getRenderTargetTextureForView(view);
                    if (!rtt) {
                        continue;
                    }
                    // check if the babylon layer has the rtt in the rtt array
                    if (babylonLayer.renderTargetTextures.indexOf(rtt) === -1) {
                        babylonLayer.renderTargetTextures.push(rtt);
                        // this._xrSessionManager.scene.customRenderTargets.push(rtt);
                        babylonLayer.renderOnlyInRenderTargetTextures = true;
                        this._xrSessionManager.onXRSessionEnded.addOnce(() => {
                            babylonLayer.renderTargetTextures.splice(babylonLayer.renderTargetTextures.indexOf(rtt), 1);
                            // this._xrSessionManager.scene.customRenderTargets.splice(this._xrSessionManager.scene.customRenderTargets.indexOf(rtt), 1);
                            babylonLayer.renderOnlyInRenderTargetTextures = false;
                        });
                    } else {
                        babylonLayer.render();
                    }
                }

                // if (!texture) {
                //     continue;
                // }
                // if (!(layer as WebXRCompositionLayerWrapper)._originalInternalTexture) {
                //     (layer as WebXRCompositionLayerWrapper)._originalInternalTexture = texture._texture;
                //     texture._texture = null;
                // }

                // if (texture._texture === null) {
                //     const engine = this._xrSessionManager.scene.getEngine();
                //     const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown, true);
                //     internalTexture.width = subImage.colorTextureWidth || subImage.textureWidth;
                //     internalTexture.height = subImage.colorTextureHeight || subImage.textureHeight;
                //     internalTexture._hardwareTexture = new WebGLHardwareTexture(subImage.colorTexture, engine._gl);
                //     internalTexture.isReady = true;
                //     texture._texture = internalTexture; // engine.wrapWebGLTexture(subImage.colorTexture, false, undefined, subImage.colorTextureWidth, subImage.colorTextureHeight);
                //     console.log(texture._texture);
                //     console.log((layer as WebXRCompositionLayerWrapper)._originalInternalTexture);
                // } else {
                //     const subImage = this._xrWebGLBinding.getSubImage(layer.layer as XRCompositionLayer, _xrFrame);
                //     if (texture._texture._hardwareTexture?.underlyingResource !== subImage.colorTexture) {
                //         texture._texture._hardwareTexture?.set(subImage.colorTexture);
                //     }
                // }
            }
        }
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
