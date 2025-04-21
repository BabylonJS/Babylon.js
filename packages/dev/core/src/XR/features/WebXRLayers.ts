import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import type { WebXRLayerWrapper } from "../webXRLayerWrapper";
import { WebXRWebGLLayerWrapper } from "../webXRWebGLLayer";
import { WebXRProjectionLayerWrapper, defaultXRProjectionLayerInit } from "./Layers/WebXRProjectionLayer";
import { WebXRCompositionLayerRenderTargetTextureProvider, WebXRCompositionLayerWrapper } from "./Layers/WebXRCompositionLayer";
import type { ThinTexture } from "../../Materials/Textures/thinTexture";
import type { DynamicTexture } from "../../Materials/Textures/dynamicTexture";
import { Color4 } from "../../Maths/math.color";
import type { LensFlareSystem } from "../../LensFlares/lensFlareSystem";
import type { ThinEngine } from "../../Engines";

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
    public override attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        const engine = this._xrSessionManager.scene.getEngine();
        this._glContext = (engine as ThinEngine)._gl;
        this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, this._glContext);
        this._existingLayers.length = 0;

        const projectionLayerInit = { ...defaultXRProjectionLayerInit, ...this._options.projectionLayerInit };
        this._isMultiviewEnabled = this._options.preferMultiviewOnInit && engine.getCaps().multiview;
        this.createProjectionLayer(projectionLayerInit /*, projectionLayerMultiview*/);
        this._projectionLayerInitialized = true;

        return true;
    }

    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        for (const layer of this._existingLayers) {
            layer.dispose();
        }
        this._existingLayers.length = 0;
        this._projectionLayerInitialized = false;
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
     * @param babylonTexture the texture to display in the layer
     * @returns the quad layer
     */
    private _createQuadLayer(options: { params: Partial<XRQuadLayerInit> } = { params: {} }, babylonTexture?: ThinTexture): WebXRCompositionLayerWrapper {
        this._extendXRLayerInit(options.params, false);
        const width = (this._existingLayers[0].layer as XRProjectionLayer).textureWidth;
        const height = (this._existingLayers[0].layer as XRProjectionLayer).textureHeight;
        const populatedParams: XRQuadLayerInit = {
            space: this._xrSessionManager.referenceSpace,
            viewPixelWidth: width,
            viewPixelHeight: height,
            clearOnAccess: true,
            ...options.params,
        };
        this._validateLayerInit(populatedParams, false);
        const quadLayer = this._xrWebGLBinding.createQuadLayer(populatedParams);

        quadLayer.width = this._isMultiviewEnabled ? 1 : 2;
        quadLayer.height = 1;
        // this wrapper is not really needed, but it's here for consistency
        const wrapper: WebXRCompositionLayerWrapper = new WebXRCompositionLayerWrapper(
            () => quadLayer.width,
            () => quadLayer.height,
            quadLayer,
            "XRQuadLayer",
            false,
            (sessionManager) => new WebXRCompositionLayerRenderTargetTextureProvider(sessionManager, this._xrWebGLBinding, wrapper)
        );

        if (babylonTexture) {
            this._compositionLayerTextureMapping.set(quadLayer, babylonTexture);
        }
        const rtt = wrapper.createRenderTargetTextureProvider(this._xrSessionManager) as WebXRCompositionLayerRenderTargetTextureProvider;
        this._layerToRTTProviderMapping.set(quadLayer, rtt);
        this.addXRSessionLayer(wrapper);
        return wrapper;
    }

    /**
     * @experimental
     * This will support full screen ADT when used with WebXR Layers. This API might change in the future.
     * Note that no interaction will be available with the ADT when using this method
     * @param texture the texture to display in the layer
     * @param options optional parameters for the layer
     * @returns a composition layer containing the texture
     */
    public addFullscreenAdvancedDynamicTexture(texture: DynamicTexture, options: { distanceFromHeadset: number } = { distanceFromHeadset: 1.5 }): WebXRCompositionLayerWrapper {
        const wrapper = this._createQuadLayer(
            {
                params: {
                    space: this._xrSessionManager.viewerReferenceSpace,
                    textureType: "texture",
                    layout: "mono",
                },
            },
            texture
        );

        const layer = wrapper.layer as XRQuadLayer;
        const distance = Math.max(0.1, options.distanceFromHeadset);
        const pos = { x: 0, y: 0, z: -distance };
        const orient = { x: 0, y: 0, z: 0, w: 1 };
        layer.transform = new XRRigidTransform(pos, orient);

        const rttProvider = this._layerToRTTProviderMapping.get(layer);
        if (!rttProvider) {
            throw new Error("Could not find the RTT provider for the layer");
        }
        const babylonLayer = this._xrSessionManager.scene.layers.find((babylonLayer) => {
            return babylonLayer.texture === texture;
        });
        if (!babylonLayer) {
            throw new Error("Could not find the babylon layer for the texture");
        }
        rttProvider.onRenderTargetTextureCreatedObservable.add((data) => {
            if (data.eye && data.eye === "right") {
                return;
            }
            data.texture.clearColor = new Color4(0, 0, 0, 0);
            babylonLayer.renderTargetTextures.push(data.texture);
            babylonLayer.renderOnlyInRenderTargetTextures = true;
            // for stereo (not for gui) it should be onBeforeCameraRenderObservable
            this._xrSessionManager.scene.onBeforeRenderObservable.add(() => {
                data.texture.render();
            });
            babylonLayer.renderTargetTextures.push(data.texture);
            babylonLayer.renderOnlyInRenderTargetTextures = true;
            // add it back when the session ends
            this._xrSessionManager.onXRSessionEnded.addOnce(() => {
                babylonLayer.renderTargetTextures.splice(babylonLayer.renderTargetTextures.indexOf(data.texture), 1);
                babylonLayer.renderOnlyInRenderTargetTextures = false;
            });
        });
        return wrapper;
    }

    /**
     * @experimental
     * This functions allows you to add a lens flare system to the XR scene.
     * Note - this will remove the lens flare system from the scene and add it to the XR scene.
     * This feature is experimental and might change in the future.
     * @param flareSystem the flare system to add
     * @returns a composition layer containing the flare system
     */
    protected _addLensFlareSystem(flareSystem: LensFlareSystem): WebXRCompositionLayerWrapper {
        const wrapper = this._createQuadLayer({
            params: {
                space: this._xrSessionManager.viewerReferenceSpace,
                textureType: "texture",
                layout: "mono",
            },
        });

        const layer = wrapper.layer as XRQuadLayer;
        layer.width = 2;
        layer.height = 1;
        const distance = 10;
        const pos = { x: 0, y: 0, z: -distance };
        const orient = { x: 0, y: 0, z: 0, w: 1 };
        layer.transform = new XRRigidTransform(pos, orient);

        // get the rtt wrapper
        const rttProvider = this._layerToRTTProviderMapping.get(layer);
        if (!rttProvider) {
            throw new Error("Could not find the RTT provider for the layer");
        }
        // render the flare system to the rtt
        rttProvider.onRenderTargetTextureCreatedObservable.add((data) => {
            data.texture.clearColor = new Color4(0, 0, 0, 0);
            data.texture.customRenderFunction = () => {
                flareSystem.render();
            };

            // add to the scene's render targets
            // this._xrSessionManager.scene.onBeforeCameraRenderObservable.add(() => {
            //     data.texture.render();
            // });
        });
        // remove the lens flare system from the scene
        this._xrSessionManager.onXRSessionInit.add(() => {
            this._xrSessionManager.scene.lensFlareSystems.splice(this._xrSessionManager.scene.lensFlareSystems.indexOf(flareSystem), 1);
        });
        // add it back when the session ends
        this._xrSessionManager.onXRSessionEnded.add(() => {
            this._xrSessionManager.scene.lensFlareSystems.push(flareSystem);
        });

        return wrapper;
    }

    /**
     * Add a new layer to the already-existing list of layers
     * @param wrappedLayer the new layer to add to the existing ones
     */
    public addXRSessionLayer(wrappedLayer: WebXRLayerWrapper) {
        this._existingLayers.push(wrappedLayer);
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
            this._xrSessionManager._setBaseLayerWrapper(wrappedLayers.length > 0 ? wrappedLayers.at(0)! : null);
        }
    }

    public override isCompatible(): boolean {
        // TODO (rgerd): Add native support.
        return !this._xrSessionManager.isNative && typeof XRWebGLBinding !== "undefined" && !!XRWebGLBinding.prototype.createProjectionLayer;
    }

    /**
     * Dispose this feature and all of the resources attached.
     */
    public override dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        // Replace once the mapped internal texture of each available composition layer, apart from the last one, which is the projection layer that needs an RTT
        const layers = this._existingLayers;
        for (let i = 0; i < layers.length; ++i) {
            const layer = layers[i];
            if (layer.layerType !== "XRProjectionLayer") {
                // get the rtt provider
                const rttProvider = this._layerToRTTProviderMapping.get(layer.layer as XRCompositionLayer);
                if (!rttProvider) {
                    continue;
                }

                if (rttProvider.layerWrapper.isMultiview) {
                    // get the views, if we are in multiview
                    const pose = _xrFrame.getViewerPose(this._xrSessionManager.referenceSpace);
                    if (pose) {
                        const views = pose.views;
                        for (let j = 0; j < views.length; ++j) {
                            const view = views[j];
                            rttProvider.getRenderTargetTextureForView(view);
                        }
                    }
                } else {
                    rttProvider.getRenderTargetTextureForView();
                }
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
