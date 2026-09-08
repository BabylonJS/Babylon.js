/** This file must only contain pure code and pure imports */

import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { type WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { type WebXRLayerWrapper, type WebXRSupportedLayerType } from "../webXRLayerWrapper";
import { type WebXRLayerRenderTargetTextureProvider } from "../webXRRenderTargetTextureProvider";
import { WebXRWebGLLayerWrapper } from "../webXRWebGLLayer";
import { WebXRProjectionLayerWrapper, DefaultXRProjectionLayerInit } from "./Layers/WebXRProjectionLayer";
import {
    WebXRCompositionLayerRenderTargetTextureProvider,
    WebXRCompositionLayerWrapper,
    WebXRCubeLayerWrapper,
    WebXRMediaLayerWrapper,
    WebXRSpatialLayerWrapper,
    type WebXRSpatialLayer,
    type WebXRSpatialLayerType,
} from "./Layers/WebXRCompositionLayer";
import { WebXRWebGPUProjectionLayerWrapper, CreateDefaultXRGPUProjectionLayerInit } from "./Layers/WebXRWebGPUProjectionLayer";
import { WebXRWebGPUCompositionLayerRenderTargetTextureProvider } from "./Layers/WebXRWebGPUCompositionLayer";
import { IsWebGPUXRSupported, WebXRGraphicsBindingType } from "../webXRGraphicsBinding";
import { type ThinTexture } from "../../Materials/Textures/thinTexture";
import { type RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.pure";
import { type DynamicTexture } from "../../Materials/Textures/dynamicTexture.pure";
import { Color4 } from "../../Maths/math.color.pure";
import { type LensFlareSystem } from "../../LensFlares/lensFlareSystem";
import { Logger } from "../../Misc/logger";
import { type Nullable } from "../../types";
import { type Observer } from "../../Misc/observable.pure";
import { type Scene } from "../../scene.pure";
import { TransformNode } from "../../Meshes/transformNode.pure";
import { Quaternion } from "../../Maths/math.vector.pure";
import { type BaseTexture } from "../../Materials/Textures/baseTexture";
import { type WebXRFallbackLayerWrapper, type IWebXRFallbackLayerDimensions } from "./Layers/WebXRFallbackLayer";

export { WebXRCompositionLayerWrapper, WebXRCubeLayerWrapper, WebXRMediaLayerWrapper, WebXRSpatialLayerWrapper } from "./Layers/WebXRCompositionLayer";
export type { WebXRSpatialLayer, WebXRSpatialLayerType } from "./Layers/WebXRCompositionLayer";
export type { IWebXRFallbackLayerDimensions, WebXRFallbackLayerWrapper } from "./Layers/WebXRFallbackLayer";

const DefaultXRWebGLLayerInit: XRWebGLLayerInit = {};
const WebGPUQuadLayerCreateWarning =
    "WebGPU XR quad layers are unavailable because XRGPUBinding.createQuadLayer is not supported; the requested quad layer was skipped and projection rendering remains active.";
const WebGPUQuadLayerSubImageWarning =
    "WebGPU XR quad layers are unavailable because XRGPUBinding.getSubImage is not supported; the requested quad layer was skipped and projection rendering remains active.";

type WebXRGraphicsLayerInit = XRLayerInit & { textureType?: XRTextureType };
type WebXRGPUGraphicsLayerInit = XRGPULayerInit;

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
 * Common options for creating a graphics-backed WebXR composition layer.
 * @typeParam TWebGLInit the WebGL layer initialization dictionary
 * @typeParam TWebGPUInit the WebGPU layer initialization dictionary
 */
export interface IWebXRCompositionLayerCreationOptions<TWebGLInit, TWebGPUInit> {
    /**
     * Initialization values shared with the WebGL Layers API.
     * Babylon supplies the current reference space and projection-layer pixel dimensions when omitted.
     */
    layerInit?: Partial<TWebGLInit>;
    /**
     * WebGPU-specific initialization overrides.
     * Shared spatial and layout values are copied from `layerInit` before these overrides are applied.
     */
    gpuLayerInit?: Partial<TWebGPUInit>;
    /**
     * A Babylon node whose world position and rotation will be synchronized with the layer.
     * Babylon creates and owns a node when this is omitted.
     */
    transformNode?: TransformNode;
    /**
     * Uses a Babylon mesh when the requested native layer factory is unavailable.
     * Import `@babylonjs/core/XR/features/WebXRLayersFallback` to enable this optional fallback.
     * Fallback is disabled by default.
     */
    fallbackMode?: "none" | "mesh";
    /**
     * A texture to display on the fallback mesh.
     * Required when `fallbackMode` is `"mesh"`.
     */
    fallbackTexture?: BaseTexture;
}

/**
 * Common options for creating an XRMediaBinding layer.
 * @typeParam InitT the media layer initialization dictionary
 */
export interface IWebXRMediaLayerCreationOptions<InitT> {
    /**
     * Initialization values for the media layer.
     * Babylon supplies the current reference space when omitted.
     */
    layerInit?: Partial<InitT>;
    /**
     * A Babylon node whose world position and rotation will be synchronized with the layer.
     * Babylon creates and owns a node when this is omitted.
     */
    transformNode?: TransformNode;
    /**
     * Uses a Babylon mesh and VideoTexture when XRMediaBinding is unavailable.
     * Import `@babylonjs/core/XR/features/WebXRLayersFallback` to enable this optional fallback.
     * Fallback is disabled by default.
     */
    fallbackMode?: "none" | "mesh";
}

/**
 * Selects whether a layer is created from a graphics binding or directly from a media element.
 */
export type WebXRLayerSource = "graphics" | "media";

/**
 * The result of creating a spatial WebXR layer.
 * Native wrappers expose an XR composition layer, while fallback wrappers expose a Babylon mesh.
 * @typeParam LayerT the native layer type
 */
export type WebXRLayerCreationResult<LayerT extends WebXRSpatialLayer, LayerTypeT extends WebXRSpatialLayerType = WebXRSpatialLayerType> =
    WebXRSpatialLayerWrapper<LayerT, LayerTypeT> | WebXRFallbackLayerWrapper;

/**
 * Data supplied to an optional WebXR mesh-fallback implementation.
 * @internal
 */
export interface IWebXRFallbackLayerCreationContext {
    scene: WebXRSessionManager["scene"];
    isWebGPU: boolean;
    layerType: WebXRSpatialLayerType;
    transformNode: TransformNode;
    ownsTransformNode: boolean;
    dimensions: IWebXRFallbackLayerDimensions;
    worldScalingFactor: number;
    texture?: BaseTexture;
    video?: HTMLVideoElement;
}

let _FallbackLayerFactory: Nullable<(context: IWebXRFallbackLayerCreationContext) => Nullable<WebXRFallbackLayerWrapper>> = null;

/**
 * Registers the optional mesh-fallback implementation without making its rendering dependencies part of projection-only bundles.
 * @param factory creates a fallback wrapper
 * @internal
 */
export function _RegisterWebXRFallbackLayerFactory(factory: (context: IWebXRFallbackLayerCreationContext) => Nullable<WebXRFallbackLayerWrapper>): void {
    _FallbackLayerFactory = factory;
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
    private _existingLayers: WebXRLayerWrapper<WebXRSupportedLayerType>[] = [];
    private _fallbackLayers: WebXRFallbackLayerWrapper[] = [];

    private _glContext: WebGLRenderingContext | WebGL2RenderingContext;
    private _xrWebGLBinding: XRWebGLBinding;
    private _isWebGPU = false;
    private _xrGPUBinding?: XRGPUBinding;
    private _xrMediaBinding?: XRMediaBinding;
    private _isMultiviewEnabled = false;
    private _projectionLayerInitialized = false;

    private _compositionLayerTextureMapping: WeakMap<XRCompositionLayer, ThinTexture> = new WeakMap();
    private _layerToRTTProviderMapping: WeakMap<XRCompositionLayer, WebXRLayerRenderTargetTextureProvider<WebXRSupportedLayerType>> = new WeakMap();
    private _layerCleanupFunctions = new WeakMap<WebXRLayerWrapper<WebXRSupportedLayerType>, () => void>();

    constructor(
        _xrSessionManager: WebXRSessionManager,
        private readonly _options: IWebXRLayersOptions = {}
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "layers";
    }

    /**
     * Whether the active XR session exposes its compositor layer limit.
     */
    public get isMaxRenderLayersSupported(): boolean {
        return this.maxRenderLayers !== null;
    }

    /**
     * Gets the maximum number of native layers accepted in the active session's render-state `layers` array.
     * The projection layer counts toward this limit. Fallback mesh layers do not.
     * @returns The native layer limit, or `null` when the runtime does not expose it.
     * @see https://playground.babylonjs.com/#TODARD#0
     */
    public get maxRenderLayers(): Nullable<number> {
        const maxRenderLayers = this._xrSessionManager.session?.maxRenderLayers;
        return typeof maxRenderLayers === "number" ? maxRenderLayers : null;
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
        this._existingLayers.length = 0;
        this._isWebGPU = engine.isWebGPU;

        if (this._isWebGPU) {
            const binding = this._xrSessionManager._getGraphicsBinding();
            if (binding.bindingType !== WebXRGraphicsBindingType.WebGPU) {
                throw new Error("Expected a WebGPU graphics binding for a WebGPU engine.");
            }
            this._xrGPUBinding = binding.binding;
            // Multiview is not yet supported on the WebGPU XR path; force single-view (two sub-images).
            this._isMultiviewEnabled = false;
            this._createWebGPUProjectionLayer();
        } else {
            const binding = this._xrSessionManager._getGraphicsBinding();
            if (binding.bindingType !== WebXRGraphicsBindingType.WebGL) {
                throw new Error("Expected a WebGL graphics binding for a WebGL engine.");
            }
            this._glContext = binding.context;
            this._xrWebGLBinding = binding.binding;

            const projectionLayerInit = { ...DefaultXRProjectionLayerInit, ...this._options.projectionLayerInit };
            this._isMultiviewEnabled = this._options.preferMultiviewOnInit && engine.getCaps().multiview;
            this.createProjectionLayer(projectionLayerInit /*, projectionLayerMultiview*/);
        }
        this._projectionLayerInitialized = true;
        this._addNewAttachObserver(this._xrSessionManager.onXRReferenceSpaceChanged, (referenceSpace) => {
            for (const layer of this._existingLayers) {
                if (layer instanceof WebXRSpatialLayerWrapper && layer.usesSessionReferenceSpace) {
                    layer.layer.space = referenceSpace;
                }
            }
        });

        return true;
    }

    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }
        for (const layer of this._existingLayers) {
            this._layerCleanupFunctions.get(layer)?.();
            layer.dispose();
        }
        this._existingLayers.length = 0;
        for (const layer of this._fallbackLayers) {
            layer.dispose();
        }
        this._fallbackLayers.length = 0;
        this._xrMediaBinding = undefined;
        this._projectionLayerInitialized = false;
        return true;
    }

    /**
     * Creates a new XRWebGLLayer.
     * @param params an object providing configuration options for the new XRWebGLLayer
     * @returns the XRWebGLLayer
     */
    public createXRWebGLLayer(params = DefaultXRWebGLLayerInit): WebXRWebGLLayerWrapper {
        const layer = new XRWebGLLayer(this._xrSessionManager.session, this._glContext, params);
        return new WebXRWebGLLayerWrapper(layer);
    }

    private _validateLayerInit(params: XRProjectionLayerInit | WebXRGraphicsLayerInit, multiview = this._isMultiviewEnabled, allowTextureArrayWithoutMultiview = false): void {
        // check if we are in session
        if (!this._xrSessionManager.inXRSession) {
            throw new Error("Cannot create a layer outside of a WebXR session. Make sure the session has started before creating layers.");
        }
        if (multiview && params.textureType !== "texture-array") {
            throw new Error("Projection layers can only be made multiview if they use texture arrays. Set the textureType parameter to 'texture-array'.");
        }

        // TODO (rgerd): Support RTT's that are bound to sub-images in the texture array.
        if (!multiview && params.textureType === "texture-array" && !allowTextureArrayWithoutMultiview) {
            throw new Error("We currently only support multiview rendering when the textureType parameter is set to 'texture-array'.");
        }
    }

    private _extendXRLayerInit<T extends XRProjectionLayerInit | WebXRGraphicsLayerInit>(params: T, multiview = this._isMultiviewEnabled): T {
        if (multiview) {
            params.textureType = "texture-array";
        }
        return params;
    }

    private _getProjectionLayerDimensions(): { width: number; height: number } {
        const projectionLayer = this._existingLayers.find((layer) => layer.layerType === "XRProjectionLayer");
        if (!projectionLayer) {
            throw new Error("A projection layer must be created before adding WebXR composition layers.");
        }
        return {
            width: projectionLayer.getWidth(),
            height: projectionLayer.getHeight(),
        };
    }

    private _createTransformNode(
        layerType: WebXRSpatialLayerType,
        transformNode: TransformNode | undefined,
        transform?: XRRigidTransform,
        orientation?: DOMPointReadOnly
    ): { node: TransformNode; ownsNode: boolean } {
        if (transformNode) {
            return { node: transformNode, ownsNode: false };
        }

        const node = new TransformNode(`WebXR ${layerType}`, this._xrSessionManager.scene);
        node.rotationQuaternion = new Quaternion();
        const sourcePosition = transform?.position;
        const sourceOrientation = transform?.orientation ?? orientation;
        if (sourcePosition) {
            const worldScalingFactor = this._xrSessionManager.worldScalingFactor;
            node.position.set(sourcePosition.x * worldScalingFactor, sourcePosition.y * worldScalingFactor, sourcePosition.z * worldScalingFactor);
        }
        if (sourceOrientation) {
            node.rotationQuaternion.set(sourceOrientation.x, sourceOrientation.y, sourceOrientation.z, sourceOrientation.w);
        }
        if (!this._xrSessionManager.scene.useRightHandedSystem) {
            node.position.z *= -1;
            node.rotationQuaternion.z *= -1;
            node.rotationQuaternion.w *= -1;
        }
        return { node, ownsNode: true };
    }

    private _createFallbackLayer(
        layerType: WebXRSpatialLayerType,
        transformNode: TransformNode | undefined,
        transform: XRRigidTransform | undefined,
        orientation: DOMPointReadOnly | undefined,
        dimensions: IWebXRFallbackLayerDimensions,
        texture?: BaseTexture,
        video?: HTMLVideoElement
    ): Nullable<WebXRFallbackLayerWrapper> {
        if (!_FallbackLayerFactory) {
            Logger.Warn("WebXR mesh fallbacks require importing `@babylonjs/core/XR/features/WebXRLayersFallback`.");
            return null;
        }

        const transformInfo = this._createTransformNode(layerType, transformNode, transform, orientation);
        const wrapper = _FallbackLayerFactory({
            scene: this._xrSessionManager.scene,
            isWebGPU: this._isWebGPU,
            layerType,
            transformNode: transformInfo.node,
            ownsTransformNode: transformInfo.ownsNode,
            dimensions,
            worldScalingFactor: this._xrSessionManager.worldScalingFactor,
            texture,
            video,
        });
        if (wrapper) {
            this._fallbackLayers.push(wrapper);
        } else if (transformInfo.ownsNode) {
            transformInfo.node.dispose();
        }
        return wrapper;
    }

    private _createGraphicsLayer<
        LayerT extends WebXRSpatialLayer,
        LayerTypeT extends WebXRSpatialLayerType,
        TWebGLInit extends WebXRGraphicsLayerInit,
        TWebGPUInit extends WebXRGPUGraphicsLayerInit,
    >(
        layerType: LayerTypeT,
        factoryName: string,
        factorySupported: boolean,
        options: IWebXRCompositionLayerCreationOptions<TWebGLInit, TWebGPUInit>,
        createWebGLLayer: (binding: XRWebGLBinding, init: TWebGLInit) => LayerT,
        createWebGPULayer: (binding: XRGPUBinding, init: TWebGPUInit) => LayerT,
        copyWebGPUSpecificInit: (webGLInit: TWebGLInit, webGPUInit: TWebGPUInit) => void
    ): Nullable<WebXRSpatialLayerWrapper<LayerT, LayerTypeT>> {
        if (!this._xrSessionManager.inXRSession) {
            throw new Error("Cannot create a layer outside of a WebXR session. Make sure the session has started before creating layers.");
        }
        if (!factorySupported) {
            if (options.fallbackMode !== "mesh") {
                Logger.Warn(`${layerType} is unavailable because ${factoryName} is not supported; the requested layer was skipped and projection rendering remains active.`);
            }
            return null;
        }
        if (this._isWebGPU && typeof this._xrGPUBinding?.getSubImage !== "function") {
            if (options.fallbackMode !== "mesh") {
                Logger.Warn(
                    `${layerType} is unavailable because XRGPUBinding.getSubImage is not supported; the requested layer was skipped and projection rendering remains active.`
                );
            }
            return null;
        }

        this._validateLayerCount(this._existingLayers.length + 1);
        const dimensions = this._getProjectionLayerDimensions();
        const defaultViewPixelWidth = layerType === "XRCubeLayer" ? Math.min(dimensions.width, dimensions.height) : dimensions.width;
        const defaultViewPixelHeight = layerType === "XRCubeLayer" ? defaultViewPixelWidth : dimensions.height;
        const populatedParams = {
            space: this._xrSessionManager.referenceSpace,
            viewPixelWidth: defaultViewPixelWidth,
            viewPixelHeight: defaultViewPixelHeight,
            clearOnAccess: true,
            textureType: "texture",
            layout: "mono",
            ...options.layerInit,
        } as TWebGLInit;
        if (layerType === "XRCubeLayer" && populatedParams.viewPixelWidth !== populatedParams.viewPixelHeight) {
            throw new Error("WebXR cube layer faces must have equal pixel width and height.");
        }
        this._validateLayerInit(populatedParams, false, layerType === "XRCubeLayer");

        let layer: LayerT;
        let effectiveParams: TWebGLInit | TWebGPUInit = populatedParams;
        let depthStencilFormat: GPUTextureFormat | undefined;
        if (this._isWebGPU) {
            const binding = this._xrGPUBinding!;
            const gpuParams = {
                colorFormat: binding.getPreferredColorFormat(),
                textureUsage: 0x10,
                space: populatedParams.space,
                viewPixelWidth: populatedParams.viewPixelWidth,
                viewPixelHeight: populatedParams.viewPixelHeight,
                layout: populatedParams.layout,
                mipLevels: populatedParams.mipLevels,
                isStatic: populatedParams.isStatic,
            } as TWebGPUInit;
            copyWebGPUSpecificInit(populatedParams, gpuParams);
            Object.assign(gpuParams, options.gpuLayerInit);
            if (layerType === "XRCubeLayer" && gpuParams.viewPixelWidth !== gpuParams.viewPixelHeight) {
                throw new Error("WebXR cube layer faces must have equal pixel width and height.");
            }
            effectiveParams = gpuParams;
            depthStencilFormat = gpuParams.depthStencilFormat;
            layer = createWebGPULayer(binding, gpuParams);
        } else {
            layer = createWebGLLayer(this._xrWebGLBinding, populatedParams);
        }

        const transform = "transform" in effectiveParams ? (effectiveParams.transform as XRRigidTransform | undefined) : undefined;
        const orientation = "orientation" in effectiveParams ? (effectiveParams.orientation as DOMPointReadOnly | undefined) : undefined;
        const usesSessionReferenceSpace = options.layerInit?.space === undefined && (!this._isWebGPU || options.gpuLayerInit?.space === undefined);
        const transformInfo = this._createTransformNode(layerType, options.transformNode, transform, orientation);
        let wrapper: WebXRSpatialLayerWrapper<LayerT, LayerTypeT>;
        if (layerType === "XRCubeLayer") {
            wrapper = new WebXRCubeLayerWrapper(
                () => effectiveParams.viewPixelWidth,
                () => effectiveParams.viewPixelHeight,
                layer as XRCubeLayer,
                !!effectiveParams.isStatic,
                usesSessionReferenceSpace,
                this._isWebGPU ? this._xrGPUBinding! : this._xrWebGLBinding,
                transformInfo.node,
                transformInfo.ownsNode
            ) as unknown as WebXRSpatialLayerWrapper<LayerT, LayerTypeT>;
        } else if (this._isWebGPU) {
            const binding = this._xrGPUBinding!;
            wrapper = new WebXRSpatialLayerWrapper(
                () => effectiveParams.viewPixelWidth,
                () => effectiveParams.viewPixelHeight,
                layer,
                layerType,
                false,
                !!effectiveParams.isStatic,
                usesSessionReferenceSpace,
                (sessionManager) => new WebXRWebGPUCompositionLayerRenderTargetTextureProvider(sessionManager, binding, wrapper, depthStencilFormat),
                transformInfo.node,
                transformInfo.ownsNode
            );
        } else {
            wrapper = new WebXRSpatialLayerWrapper(
                () => effectiveParams.viewPixelWidth,
                () => effectiveParams.viewPixelHeight,
                layer,
                layerType,
                false,
                !!effectiveParams.isStatic,
                usesSessionReferenceSpace,
                (sessionManager) => new WebXRCompositionLayerRenderTargetTextureProvider(sessionManager, this._xrWebGLBinding, wrapper),
                transformInfo.node,
                transformInfo.ownsNode
            );
        }

        if (wrapper.usesRenderTargetProvider) {
            const rttProvider = wrapper.createRenderTargetTextureProvider(this._xrSessionManager);
            this._layerToRTTProviderMapping.set(layer, rttProvider);
        }
        this.addXRSessionLayer(wrapper);
        return wrapper;
    }

    private _createMediaLayer<
        LayerT extends XRQuadLayer | XRCylinderLayer | XREquirectLayer,
        LayerTypeT extends Exclude<WebXRSpatialLayerType, "XRCubeLayer">,
        InitT extends XRMediaLayerInit & { transform?: XRRigidTransform },
    >(
        layerType: LayerTypeT,
        factoryName: string,
        video: HTMLVideoElement,
        options: IWebXRMediaLayerCreationOptions<InitT>,
        createLayer: (binding: XRMediaBinding, video: HTMLVideoElement, init: InitT) => LayerT
    ): Nullable<WebXRMediaLayerWrapper<LayerT, LayerTypeT>> {
        if (!this._xrSessionManager.inXRSession) {
            throw new Error("Cannot create a layer outside of a WebXR session. Make sure the session has started before creating layers.");
        }
        if (typeof XRMediaBinding === "undefined") {
            if (options.fallbackMode !== "mesh") {
                Logger.Warn(`${layerType} media layers are unavailable because XRMediaBinding is not supported; the requested layer was skipped.`);
            }
            return null;
        }

        this._xrMediaBinding ??= new XRMediaBinding(this._xrSessionManager.session);
        const mediaBinding = this._xrMediaBinding;
        const factory = mediaBinding[factoryName as "createQuadLayer" | "createCylinderLayer" | "createEquirectLayer"];
        if (typeof factory !== "function") {
            if (options.fallbackMode !== "mesh") {
                Logger.Warn(`${layerType} media layers are unavailable because XRMediaBinding.${factoryName} is not supported; the requested layer was skipped.`);
            }
            return null;
        }

        this._validateLayerCount(this._existingLayers.length + 1);
        const populatedParams = {
            space: this._xrSessionManager.referenceSpace,
            layout: "mono",
            ...options.layerInit,
        } as InitT;
        const layer = createLayer(mediaBinding, video, populatedParams);
        const transform = "transform" in populatedParams ? populatedParams.transform : undefined;
        const transformInfo = this._createTransformNode(layerType, options.transformNode, transform);
        const wrapper = new WebXRMediaLayerWrapper(
            () => video.videoWidth,
            () => video.videoHeight,
            layer,
            layerType,
            transformInfo.node,
            transformInfo.ownsNode,
            options.layerInit?.space === undefined
        );
        this.addXRSessionLayer(wrapper);
        return wrapper;
    }

    /**
     * Creates a new XRProjectionLayer.
     * @param params an object providing configuration options for the new XRProjectionLayer.
     * @param multiview whether the projection layer should render with multiview. Will be tru automatically if the extension initialized with multiview.
     * @returns the projection layer
     */
    public createProjectionLayer(params = DefaultXRProjectionLayerInit, multiview = this._isMultiviewEnabled): WebXRProjectionLayerWrapper {
        const extendedParams = this._extendXRLayerInit(params, multiview);
        this._validateLayerInit(extendedParams, multiview);
        this._validateLayerCount(this._existingLayers.length + 1);

        const projLayer = this._xrWebGLBinding.createProjectionLayer(extendedParams);
        const layer = new WebXRProjectionLayerWrapper(projLayer, multiview, this._xrWebGLBinding);
        this.addXRSessionLayer(layer);
        return layer;
    }

    /**
     * Creates the base projection layer for the WebGPU (XRGPUBinding) backend.
     * Single-view only for now (multiview is deferred); the color format is the binding's preferred format.
     * @returns the WebGPU projection layer wrapper
     */
    private _createWebGPUProjectionLayer(): WebXRWebGPUProjectionLayerWrapper {
        if (!this._xrSessionManager.inXRSession) {
            throw new Error("Cannot create a layer outside of a WebXR session. Make sure the session has started before creating layers.");
        }
        this._validateLayerCount(this._existingLayers.length + 1);
        const binding = this._xrGPUBinding!;
        const init = CreateDefaultXRGPUProjectionLayerInit(binding.getPreferredColorFormat());
        const projLayer = binding.createProjectionLayer(init);
        const layer = new WebXRWebGPUProjectionLayerWrapper(projLayer, false, binding, init.depthStencilFormat);
        this.addXRSessionLayer(layer);
        return layer;
    }

    /**
     * Creates a graphics-backed quad layer and adds it to the current XR session.
     * @param options initialization and transform-node options for the layer
     * @returns the created layer wrapper, or `null` when the active graphics binding does not support quad layers
     */
    public createQuadLayer(
        options: IWebXRCompositionLayerCreationOptions<XRQuadLayerInit, XRGPUQuadLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XRQuadLayer, "XRQuadLayer">> {
        const factorySupported = this._isWebGPU ? typeof this._xrGPUBinding?.createQuadLayer === "function" : typeof this._xrWebGLBinding.createQuadLayer === "function";
        const factoryName = this._isWebGPU ? "XRGPUBinding.createQuadLayer" : "XRWebGLBinding.createQuadLayer";
        const nativeLayer = this._createGraphicsLayer(
            "XRQuadLayer",
            factoryName,
            factorySupported,
            options,
            (binding, init) => binding.createQuadLayer(init),
            (binding, init) => binding.createQuadLayer(init),
            (webGLInit, webGPUInit) => {
                webGPUInit.transform = webGLInit.transform;
                webGPUInit.width = webGLInit.width;
                webGPUInit.height = webGLInit.height;
            }
        );
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XRQuadLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            { width: options.layerInit?.width, height: options.layerInit?.height },
            options.fallbackTexture
        );
    }

    /**
     * Creates a graphics-backed cylinder layer and adds it to the current XR session.
     * @param options initialization and transform-node options for the layer
     * @returns the created layer wrapper, or `null` when the active graphics binding does not support cylinder layers
     */
    public createCylinderLayer(
        options: IWebXRCompositionLayerCreationOptions<XRCylinderLayerInit, XRGPUCylinderLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XRCylinderLayer, "XRCylinderLayer">> {
        const factorySupported = this._isWebGPU ? typeof this._xrGPUBinding?.createCylinderLayer === "function" : typeof this._xrWebGLBinding.createCylinderLayer === "function";
        const factoryName = this._isWebGPU ? "XRGPUBinding.createCylinderLayer" : "XRWebGLBinding.createCylinderLayer";
        const nativeLayer = this._createGraphicsLayer(
            "XRCylinderLayer",
            factoryName,
            factorySupported,
            options,
            (binding, init) => binding.createCylinderLayer(init),
            (binding, init) => binding.createCylinderLayer(init),
            (webGLInit, webGPUInit) => {
                webGPUInit.transform = webGLInit.transform;
                webGPUInit.radius = webGLInit.radius;
                webGPUInit.centralAngle = webGLInit.centralAngle;
                webGPUInit.aspectRatio = webGLInit.aspectRatio;
            }
        );
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XRCylinderLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            {
                radius: options.layerInit?.radius,
                centralAngle: options.layerInit?.centralAngle,
                aspectRatio: options.layerInit?.aspectRatio,
            },
            options.fallbackTexture
        );
    }

    /**
     * Creates a graphics-backed equirectangular layer and adds it to the current XR session.
     * @param options initialization and transform-node options for the layer
     * @returns the created layer wrapper, or `null` when the active graphics binding does not support equirectangular layers
     */
    public createEquirectLayer(
        options: IWebXRCompositionLayerCreationOptions<XREquirectLayerInit, XRGPUEquirectLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XREquirectLayer, "XREquirectLayer">> {
        const factorySupported = this._isWebGPU ? typeof this._xrGPUBinding?.createEquirectLayer === "function" : typeof this._xrWebGLBinding.createEquirectLayer === "function";
        const factoryName = this._isWebGPU ? "XRGPUBinding.createEquirectLayer" : "XRWebGLBinding.createEquirectLayer";
        const nativeLayer = this._createGraphicsLayer(
            "XREquirectLayer",
            factoryName,
            factorySupported,
            options,
            (binding, init) => binding.createEquirectLayer(init),
            (binding, init) => binding.createEquirectLayer(init),
            (webGLInit, webGPUInit) => {
                webGPUInit.transform = webGLInit.transform;
                webGPUInit.radius = webGLInit.radius;
                webGPUInit.centralHorizontalAngle = webGLInit.centralHorizontalAngle;
                webGPUInit.upperVerticalAngle = webGLInit.upperVerticalAngle;
                webGPUInit.lowerVerticalAngle = webGLInit.lowerVerticalAngle;
            }
        );
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XREquirectLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            {
                radius: options.layerInit?.radius,
                centralHorizontalAngle: options.layerInit?.centralHorizontalAngle,
                upperVerticalAngle: options.layerInit?.upperVerticalAngle,
                lowerVerticalAngle: options.layerInit?.lowerVerticalAngle,
            },
            options.fallbackTexture
        );
    }

    /**
     * Creates a graphics-backed cube layer and adds it to the current XR session.
     * Cube layers synchronize only the rotation of their transform node because the WebXR API does not support cube-layer translation.
     * @param options initialization and transform-node options for the layer
     * @returns the created layer wrapper, or `null` when the active graphics binding does not support cube layers
     */
    public createCubeLayer(options: IWebXRCompositionLayerCreationOptions<XRCubeLayerInit, XRGPUCubeLayerInit> = {}): Nullable<WebXRCubeLayerWrapper | WebXRFallbackLayerWrapper> {
        const factorySupported = this._isWebGPU ? typeof this._xrGPUBinding?.createCubeLayer === "function" : typeof this._xrWebGLBinding.createCubeLayer === "function";
        const factoryName = this._isWebGPU ? "XRGPUBinding.createCubeLayer" : "XRWebGLBinding.createCubeLayer";
        const nativeLayer = this._createGraphicsLayer(
            "XRCubeLayer",
            factoryName,
            factorySupported,
            options,
            (binding, init) => binding.createCubeLayer(init),
            (binding, init) => binding.createCubeLayer(init),
            (webGLInit, webGPUInit) => {
                webGPUInit.orientation = webGLInit.orientation;
            }
        ) as Nullable<WebXRCubeLayerWrapper>;
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer("XRCubeLayer", options.transformNode, undefined, options.layerInit?.orientation, {}, options.fallbackTexture);
    }

    /**
     * Creates a video-backed quad layer and adds it to the current XR session.
     * @see https://playground.babylonjs.com/#D35HOL#0
     * @param video the video element presented by the XR compositor
     * @param options initialization and transform-node options for the layer
     * @returns the created media layer wrapper, or `null` when XRMediaBinding is unavailable
     */
    public createMediaQuadLayer(
        video: HTMLVideoElement,
        options: IWebXRMediaLayerCreationOptions<XRMediaQuadLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XRQuadLayer, "XRQuadLayer">> {
        const nativeLayer = this._createMediaLayer("XRQuadLayer", "createQuadLayer", video, options, (binding, media, init) => binding.createQuadLayer(media, init));
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XRQuadLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            { width: options.layerInit?.width, height: options.layerInit?.height },
            undefined,
            video
        );
    }

    /**
     * Creates a video-backed cylinder layer and adds it to the current XR session.
     * @param video the video element presented by the XR compositor
     * @param options initialization and transform-node options for the layer
     * @returns the created media layer wrapper, or `null` when XRMediaBinding is unavailable
     */
    public createMediaCylinderLayer(
        video: HTMLVideoElement,
        options: IWebXRMediaLayerCreationOptions<XRMediaCylinderLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XRCylinderLayer, "XRCylinderLayer">> {
        const nativeLayer = this._createMediaLayer("XRCylinderLayer", "createCylinderLayer", video, options, (binding, media, init) => binding.createCylinderLayer(media, init));
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XRCylinderLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            {
                radius: options.layerInit?.radius,
                centralAngle: options.layerInit?.centralAngle,
                aspectRatio: options.layerInit?.aspectRatio,
            },
            undefined,
            video
        );
    }

    /**
     * Creates a video-backed equirectangular layer and adds it to the current XR session.
     * @param video the video element presented by the XR compositor
     * @param options initialization and transform-node options for the layer
     * @returns the created media layer wrapper, or `null` when XRMediaBinding is unavailable
     */
    public createMediaEquirectLayer(
        video: HTMLVideoElement,
        options: IWebXRMediaLayerCreationOptions<XRMediaEquirectLayerInit> = {}
    ): Nullable<WebXRLayerCreationResult<XREquirectLayer, "XREquirectLayer">> {
        const nativeLayer = this._createMediaLayer("XREquirectLayer", "createEquirectLayer", video, options, (binding, media, init) => binding.createEquirectLayer(media, init));
        if (nativeLayer || options.fallbackMode !== "mesh") {
            return nativeLayer;
        }
        return this._createFallbackLayer(
            "XREquirectLayer",
            options.transformNode,
            options.layerInit?.transform,
            undefined,
            {
                radius: options.layerInit?.radius,
                centralHorizontalAngle: options.layerInit?.centralHorizontalAngle,
                upperVerticalAngle: options.layerInit?.upperVerticalAngle,
                lowerVerticalAngle: options.layerInit?.lowerVerticalAngle,
            },
            undefined,
            video
        );
    }

    private _createQuadLayer(
        options: { params: Partial<XRQuadLayerInit> } = { params: {} },
        babylonTexture?: ThinTexture
    ): Nullable<WebXRSpatialLayerWrapper<XRQuadLayer, "XRQuadLayer">> {
        if (this._isWebGPU) {
            const binding = this._xrGPUBinding!;
            if (typeof binding.createQuadLayer !== "function") {
                Logger.Warn(WebGPUQuadLayerCreateWarning);
                return null;
            }
            if (typeof binding.getSubImage !== "function") {
                Logger.Warn(WebGPUQuadLayerSubImageWarning);
                return null;
            }
        }

        const wrapper = this.createQuadLayer({ layerInit: options.params });
        if (!wrapper || wrapper.layer === null) {
            return null;
        }
        const quadLayer = wrapper.layer;
        quadLayer.width = this._isMultiviewEnabled ? 1 : 2;
        quadLayer.height = 1;

        if (babylonTexture) {
            this._compositionLayerTextureMapping.set(quadLayer, babylonTexture);
        }
        return wrapper;
    }

    /**
     * @experimental
     * This will support full screen ADT when used with WebXR Layers. This API might change in the future.
     * Note that no interaction will be available with the ADT when using this method
     * @param texture the texture to display in the layer
     * @param options optional parameters for the layer
     * @returns a composition layer containing the texture, or null when WebGPU quad layers are unavailable
     */
    public addFullscreenAdvancedDynamicTexture(
        texture: DynamicTexture,
        options: { distanceFromHeadset: number } = { distanceFromHeadset: 1.5 }
    ): Nullable<WebXRCompositionLayerWrapper> {
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
        if (!wrapper) {
            return null;
        }

        const distance = Math.max(0.1, options.distanceFromHeadset);
        const z = this._xrSessionManager.scene.useRightHandedSystem ? -distance : distance;
        wrapper.transformNode.position.set(0, 0, z * this._xrSessionManager.worldScalingFactor);

        const rttProvider = this._layerToRTTProviderMapping.get(wrapper.layer);
        if (
            !rttProvider ||
            (!(rttProvider instanceof WebXRCompositionLayerRenderTargetTextureProvider) && !(rttProvider instanceof WebXRWebGPUCompositionLayerRenderTargetTextureProvider))
        ) {
            throw new Error("Could not find the RTT provider for the layer");
        }
        const babylonLayer = this._xrSessionManager.scene.layers.find((babylonLayer) => {
            return babylonLayer.texture === texture;
        });
        if (!babylonLayer) {
            throw new Error("Could not find the babylon layer for the texture");
        }
        const renderTargetTextures = new Set<RenderTargetTexture>();
        const beforeRenderObservers: Observer<Scene>[] = [];
        const previousRenderOnlyInRenderTargetTextures = babylonLayer.renderOnlyInRenderTargetTextures;
        let cleanedUp = false;
        const renderTargetCreatedObserver = rttProvider.onRenderTargetTextureCreatedObservable.add((data) => {
            if (data.eye && data.eye === "right") {
                return;
            }
            data.texture.clearColor = new Color4(0, 0, 0, 0);
            babylonLayer.renderTargetTextures.push(data.texture);
            renderTargetTextures.add(data.texture);
            babylonLayer.renderOnlyInRenderTargetTextures = true;
            // for stereo (not for gui) it should be onBeforeCameraRenderObservable
            beforeRenderObservers.push(
                this._xrSessionManager.scene.onBeforeRenderObservable.add(() => {
                    data.texture.render();
                })
            );
        });
        const cleanup = () => {
            if (cleanedUp) {
                return;
            }
            cleanedUp = true;
            rttProvider.onRenderTargetTextureCreatedObservable.remove(renderTargetCreatedObserver);
            for (const observer of beforeRenderObservers) {
                this._xrSessionManager.scene.onBeforeRenderObservable.remove(observer);
            }
            for (const renderTargetTexture of renderTargetTextures) {
                const index = babylonLayer.renderTargetTextures.indexOf(renderTargetTexture);
                if (index !== -1) {
                    babylonLayer.renderTargetTextures.splice(index, 1);
                }
            }
            babylonLayer.renderOnlyInRenderTargetTextures = previousRenderOnlyInRenderTargetTextures;
            this._layerCleanupFunctions.delete(wrapper);
        };
        this._layerCleanupFunctions.set(wrapper, cleanup);
        this._xrSessionManager.onXRSessionEnded.addOnce(cleanup);
        return wrapper;
    }

    /**
     * @experimental
     * This functions allows you to add a lens flare system to the XR scene.
     * Note - this will remove the lens flare system from the scene and add it to the XR scene.
     * This feature is experimental and might change in the future.
     * @param flareSystem the flare system to add
     * @returns a composition layer containing the flare system, or null when WebGPU quad layers are unavailable
     */
    protected _addLensFlareSystem(flareSystem: LensFlareSystem): Nullable<WebXRCompositionLayerWrapper> {
        const wrapper = this._createQuadLayer({
            params: {
                space: this._xrSessionManager.viewerReferenceSpace,
                textureType: "texture",
                layout: "mono",
            },
        });
        if (!wrapper) {
            return null;
        }

        const layer = wrapper.layer;
        layer.width = 2;
        layer.height = 1;
        const distance = 10;
        const z = this._xrSessionManager.scene.useRightHandedSystem ? -distance : distance;
        wrapper.transformNode.position.set(0, 0, z * this._xrSessionManager.worldScalingFactor);

        // get the rtt wrapper
        const rttProvider = this._layerToRTTProviderMapping.get(layer);
        if (
            !rttProvider ||
            (!(rttProvider instanceof WebXRCompositionLayerRenderTargetTextureProvider) && !(rttProvider instanceof WebXRWebGPUCompositionLayerRenderTargetTextureProvider))
        ) {
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
    public addXRSessionLayer(wrappedLayer: WebXRLayerWrapper<WebXRSupportedLayerType>) {
        this._validateLayerCount(this._existingLayers.length + 1);
        this._existingLayers.push(wrappedLayer);
        this.setXRSessionLayers(this._existingLayers);
    }

    /**
     * Removes a non-projection layer from the current XR session.
     * @param wrappedLayer the layer wrapper to remove
     * @param dispose whether to dispose the wrapper and destroy its native composition layer
     * @returns whether the layer was present and removed
     */
    public removeXRSessionLayer(wrappedLayer: WebXRLayerWrapper<WebXRSupportedLayerType>, dispose = true): boolean {
        const index = this._existingLayers.indexOf(wrappedLayer);
        if (index === -1) {
            return false;
        }
        if (wrappedLayer.layerType === "XRProjectionLayer") {
            Logger.Warn("The active projection layer cannot be removed from WebXRLayers.");
            return false;
        }

        this._existingLayers.splice(index, 1);
        this._layerCleanupFunctions.get(wrappedLayer)?.();
        if (wrappedLayer instanceof WebXRCompositionLayerWrapper) {
            this._layerToRTTProviderMapping.delete(wrappedLayer.layer);
            this._compositionLayerTextureMapping.delete(wrappedLayer.layer);
        }
        this.setXRSessionLayers(this._existingLayers);
        if (dispose) {
            wrappedLayer.dispose();
        }
        return true;
    }

    /**
     * Removes either a native spatial layer or a fallback layer created by this feature.
     * @param wrappedLayer the native or fallback layer wrapper to remove
     * @param dispose whether to dispose resources owned by the wrapper
     * @returns whether the wrapper was present and removed
     */
    public removeLayer(wrappedLayer: WebXRLayerCreationResult<WebXRSpatialLayer>, dispose = true): boolean {
        if (wrappedLayer.layer === null) {
            const index = this._fallbackLayers.indexOf(wrappedLayer);
            if (index === -1) {
                return false;
            }
            this._fallbackLayers.splice(index, 1);
            if (dispose) {
                wrappedLayer.dispose();
            }
            return true;
        }
        return this.removeXRSessionLayer(wrappedLayer, dispose);
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
    public setXRSessionLayers(wrappedLayers: Array<WebXRLayerWrapper<WebXRSupportedLayerType>> = this._existingLayers): void {
        this._validateLayerCount(wrappedLayers.length);
        // this._existingLayers = wrappedLayers;
        const renderStateInit: XRRenderStateInit = { ...this._xrSessionManager.session.renderState };
        // Clear out the layer-related fields.
        renderStateInit.baseLayer = undefined;
        renderStateInit.layers = wrappedLayers.map((wrappedLayer) => wrappedLayer.layer);
        this._xrSessionManager.updateRenderState(renderStateInit);
        if (!this._projectionLayerInitialized) {
            this._xrSessionManager._setBaseLayerWrapper(wrappedLayers.length > 0 ? (wrappedLayers.at(0)! as WebXRLayerWrapper) : null);
        }
    }

    private _validateLayerCount(layerCount: number): void {
        const maxRenderLayers = this.maxRenderLayers;
        if (maxRenderLayers !== null && layerCount > maxRenderLayers) {
            const layerLabel = maxRenderLayers === 1 ? "layer" : "layers";
            throw new Error(`The XR session supports at most ${maxRenderLayers} render ${layerLabel}, but ${layerCount} were provided.`);
        }
    }

    /**
     * Checks whether the active runtime exposes the factory needed for a layer type.
     * This is a capability check only; creation can still fail when an initialization dictionary is invalid.
     * @param layerType the concrete WebXR layer type
     * @param source whether to check a graphics-backed or media-backed layer
     * @returns whether the requested factory is available
     */
    public isLayerTypeSupported(layerType: WebXRSpatialLayerType | "XRProjectionLayer", source: WebXRLayerSource = "graphics"): boolean {
        if (source === "media") {
            if (layerType === "XRProjectionLayer" || layerType === "XRCubeLayer" || typeof XRMediaBinding === "undefined") {
                return false;
            }
            switch (layerType) {
                case "XRQuadLayer":
                    return typeof XRMediaBinding.prototype.createQuadLayer === "function";
                case "XRCylinderLayer":
                    return typeof XRMediaBinding.prototype.createCylinderLayer === "function";
                case "XREquirectLayer":
                    return typeof XRMediaBinding.prototype.createEquirectLayer === "function";
            }
        }

        if (this._xrSessionManager.scene.getEngine().isWebGPU) {
            if (typeof XRGPUBinding === "undefined") {
                return false;
            }
            switch (layerType) {
                case "XRProjectionLayer":
                    return typeof XRGPUBinding.prototype.createProjectionLayer === "function";
                case "XRQuadLayer":
                    return typeof XRGPUBinding.prototype.createQuadLayer === "function";
                case "XRCylinderLayer":
                    return typeof XRGPUBinding.prototype.createCylinderLayer === "function";
                case "XREquirectLayer":
                    return typeof XRGPUBinding.prototype.createEquirectLayer === "function";
                case "XRCubeLayer":
                    return typeof XRGPUBinding.prototype.createCubeLayer === "function";
            }
        }

        if (typeof XRWebGLBinding === "undefined") {
            return false;
        }
        switch (layerType) {
            case "XRProjectionLayer":
                return typeof XRWebGLBinding.prototype.createProjectionLayer === "function";
            case "XRQuadLayer":
                return typeof XRWebGLBinding.prototype.createQuadLayer === "function";
            case "XRCylinderLayer":
                return typeof XRWebGLBinding.prototype.createCylinderLayer === "function";
            case "XREquirectLayer":
                return typeof XRWebGLBinding.prototype.createEquirectLayer === "function";
            case "XRCubeLayer":
                return typeof XRWebGLBinding.prototype.createCubeLayer === "function";
        }
    }

    public override isCompatible(): boolean {
        if (this._xrSessionManager.scene.getEngine().isWebGPU) {
            return IsWebGPUXRSupported();
        }
        // Native WebGL continues to use NativeXRRenderTarget instead of WebXR Layers.
        if (this._xrSessionManager.isNative) {
            return false;
        }
        return typeof XRWebGLBinding !== "undefined" && !!XRWebGLBinding.prototype.createProjectionLayer;
    }

    /**
     * Dispose this feature and all of the resources attached.
     */
    public override dispose(): void {
        super.dispose();
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        for (let i = 0; i < this._fallbackLayers.length; ++i) {
            this._fallbackLayers[i].updateFromTransformNode(this._xrSessionManager.worldScalingFactor);
        }

        const layers = this._existingLayers;
        for (let i = 0; i < layers.length; ++i) {
            const layer = layers[i];
            if (layer instanceof WebXRSpatialLayerWrapper) {
                layer.updateFromTransformNode(this._xrSessionManager.scene.useRightHandedSystem, this._xrSessionManager.worldScalingFactor);
            }
            if (layer.layerType === "XRProjectionLayer" || !(layer instanceof WebXRCompositionLayerWrapper) || !layer.usesRenderTargetProvider) {
                continue;
            }
            if (layer.isStatic && !layer.layer.needsRedraw) {
                continue;
            }

            const rttProvider = this._layerToRTTProviderMapping.get(layer.layer);
            if (!rttProvider) {
                continue;
            }
            if (layer.layer.layout === "mono") {
                rttProvider.getRenderTargetTextureForEye("none");
            } else {
                const pose = _xrFrame.getViewerPose(this._xrSessionManager.referenceSpace);
                if (pose) {
                    const views = pose.views;
                    for (let j = 0; j < views.length; ++j) {
                        rttProvider.getRenderTargetTextureForView(views[j]);
                    }
                }
            }
        }
    }
}

let _Registered = false;
/**
 * Register side effects for webXRLayers.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterWebXRLayers(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    //register the plugin
    WebXRFeaturesManager.AddWebXRFeature(
        WebXRLayers.Name,
        (xrSessionManager, options) => {
            return () => new WebXRLayers(xrSessionManager, options);
        },
        WebXRLayers.Version,
        false
    );
}
