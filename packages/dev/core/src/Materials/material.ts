import { serialize, SerializationHelper } from "../Misc/decorators";
import { Tools } from "../Misc/tools";
import type { IAnimatable } from "../Animations/animatable.interface";
import type { SmartArray } from "../Misc/smartArray";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Matrix } from "../Maths/math.vector";
import { EngineStore } from "../Engines/engineStore";
import { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { UniformBuffer } from "./uniformBuffer";
import type { Effect } from "./effect";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { MaterialDefines } from "./materialDefines";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import type { IInspectable } from "../Misc/iInspectable";
import { Plane } from "../Maths/math.plane";
import type { ShadowDepthWrapper } from "./shadowDepthWrapper";
import { MaterialHelper } from "./materialHelper";
import type { IMaterialContext } from "../Engines/IMaterialContext";
import { DrawWrapper } from "./drawWrapper";
import { MaterialStencilState } from "./materialStencilState";
import { ScenePerformancePriority } from "../scene";
import type { Scene } from "../scene";
import type { AbstractScene } from "../abstractScene";
import type {
    MaterialPluginDisposed,
    MaterialPluginIsReadyForSubMesh,
    MaterialPluginGetDefineNames,
    MaterialPluginBindForSubMesh,
    MaterialPluginGetActiveTextures,
    MaterialPluginHasTexture,
    MaterialPluginGetAnimatables,
    MaterialPluginPrepareDefines,
    MaterialPluginPrepareEffect,
    MaterialPluginPrepareUniformBuffer,
    MaterialPluginCreated,
    MaterialPluginFillRenderTargetTextures,
    MaterialPluginHasRenderTargetTextures,
    MaterialPluginHardBindForSubMesh,
} from "./materialPluginEvent";
import { MaterialPluginEvent } from "./materialPluginEvent";
import type { ShaderCustomProcessingFunction } from "../Engines/Processors/shaderProcessingOptions";
import type { IClipPlanesHolder } from "../Misc/interfaces/iClipPlanesHolder";

import type { PrePassRenderer } from "../Rendering/prePassRenderer";
import type { Mesh } from "../Meshes/mesh";
import type { Animation } from "../Animations/animation";
import type { InstancedMesh } from "../Meshes/instancedMesh";

declare let BABYLON: any;

/**
 * Options for compiling materials.
 */
export interface IMaterialCompilationOptions {
    /**
     * Defines whether clip planes are enabled.
     */
    clipPlane: boolean;

    /**
     * Defines whether instances are enabled.
     */
    useInstances: boolean;
}

/**
 * Options passed when calling customShaderNameResolve
 */
export interface ICustomShaderNameResolveOptions {
    /**
     * If provided, will be called two times with the vertex and fragment code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: Nullable<ShaderCustomProcessingFunction>;
}

/**
 * Base class for the main features of a material in Babylon.js
 */
export class Material implements IAnimatable, IClipPlanesHolder {
    /**
     * Returns the triangle fill mode
     */
    public static readonly TriangleFillMode = Constants.MATERIAL_TriangleFillMode;
    /**
     * Returns the wireframe mode
     */
    public static readonly WireFrameFillMode = Constants.MATERIAL_WireFrameFillMode;
    /**
     * Returns the point fill mode
     */
    public static readonly PointFillMode = Constants.MATERIAL_PointFillMode;
    /**
     * Returns the point list draw mode
     */
    public static readonly PointListDrawMode = Constants.MATERIAL_PointListDrawMode;
    /**
     * Returns the line list draw mode
     */
    public static readonly LineListDrawMode = Constants.MATERIAL_LineListDrawMode;
    /**
     * Returns the line loop draw mode
     */
    public static readonly LineLoopDrawMode = Constants.MATERIAL_LineLoopDrawMode;
    /**
     * Returns the line strip draw mode
     */
    public static readonly LineStripDrawMode = Constants.MATERIAL_LineStripDrawMode;
    /**
     * Returns the triangle strip draw mode
     */
    public static readonly TriangleStripDrawMode = Constants.MATERIAL_TriangleStripDrawMode;
    /**
     * Returns the triangle fan draw mode
     */
    public static readonly TriangleFanDrawMode = Constants.MATERIAL_TriangleFanDrawMode;

    /**
     * Stores the clock-wise side orientation
     */
    public static readonly ClockWiseSideOrientation = Constants.MATERIAL_ClockWiseSideOrientation;

    /**
     * Stores the counter clock-wise side orientation
     */
    public static readonly CounterClockWiseSideOrientation = Constants.MATERIAL_CounterClockWiseSideOrientation;

    /**
     * The dirty texture flag value
     */
    public static readonly TextureDirtyFlag = Constants.MATERIAL_TextureDirtyFlag;

    /**
     * The dirty light flag value
     */
    public static readonly LightDirtyFlag = Constants.MATERIAL_LightDirtyFlag;

    /**
     * The dirty fresnel flag value
     */
    public static readonly FresnelDirtyFlag = Constants.MATERIAL_FresnelDirtyFlag;

    /**
     * The dirty attribute flag value
     */
    public static readonly AttributesDirtyFlag = Constants.MATERIAL_AttributesDirtyFlag;

    /**
     * The dirty misc flag value
     */
    public static readonly MiscDirtyFlag = Constants.MATERIAL_MiscDirtyFlag;

    /**
     * The dirty prepass flag value
     */
    public static readonly PrePassDirtyFlag = Constants.MATERIAL_PrePassDirtyFlag;

    /**
     * The all dirty flag value
     */
    public static readonly AllDirtyFlag = Constants.MATERIAL_AllDirtyFlag;

    /**
     * MaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    public static readonly MATERIAL_OPAQUE = 0;

    /**
     * MaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    public static readonly MATERIAL_ALPHATEST = 1;

    /**
     * MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    public static readonly MATERIAL_ALPHABLEND = 2;

    /**
     * MaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    public static readonly MATERIAL_ALPHATESTANDBLEND = 3;

    /**
     * The Whiteout method is used to blend normals.
     * Details of the algorithm can be found here: https://blog.selfshadow.com/publications/blending-in-detail/
     */
    public static readonly MATERIAL_NORMALBLENDMETHOD_WHITEOUT = 0;

    /**
     * The Reoriented Normal Mapping method is used to blend normals.
     * Details of the algorithm can be found here: https://blog.selfshadow.com/publications/blending-in-detail/
     */
    public static readonly MATERIAL_NORMALBLENDMETHOD_RNM = 1;

    /**
     * Event observable which raises global events common to all materials (like MaterialPluginEvent.Created)
     */
    public static OnEventObservable = new Observable<Material>();

    /**
     * Custom callback helping to override the default shader used in the material.
     */
    public customShaderNameResolve: (
        shaderName: string,
        uniforms: string[],
        uniformBuffers: string[],
        samplers: string[],
        defines: MaterialDefines | string[],
        attributes?: string[],
        options?: ICustomShaderNameResolveOptions
    ) => string;

    /**
     * Custom shadow depth material to use for shadow rendering instead of the in-built one
     */
    public shadowDepthWrapper: Nullable<ShadowDepthWrapper> = null;

    /**
     * Gets or sets a boolean indicating that the material is allowed (if supported) to do shader hot swapping.
     * This means that the material can keep using a previous shader while a new one is being compiled.
     * This is mostly used when shader parallel compilation is supported (true by default)
     */
    public allowShaderHotSwapping = true;

    /**
     * The ID of the material
     */
    @serialize()
    public id: string;

    /**
     * Gets or sets the unique id of the material
     */
    @serialize()
    public uniqueId: number;

    /** @internal */
    public _loadedUniqueId: string;

    /**
     * The name of the material
     */
    @serialize()
    public name: string;

    /**
     * Gets or sets user defined metadata
     */
    @serialize()
    public metadata: any = null;

    /** @internal */
    public _internalMetadata: any;

    /**
     * For internal use only. Please do not use.
     */
    public reservedDataStore: any = null;

    /**
     * Specifies if the ready state should be checked on each call
     */
    @serialize()
    public checkReadyOnEveryCall = false;

    /**
     * Specifies if the ready state should be checked once
     */
    @serialize()
    public checkReadyOnlyOnce = false;

    /**
     * The state of the material
     */
    @serialize()
    public state = "";

    /**
     * If the material can be rendered to several textures with MRT extension
     */
    public get canRenderToMRT(): boolean {
        // By default, shaders are not compatible with MRTs
        // Base classes should override that if their shader supports MRT
        return false;
    }

    /**
     * The alpha value of the material
     */
    @serialize("alpha")
    protected _alpha = 1.0;

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/toolsAndResources/inspector#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    /**
     * Sets the alpha value of the material
     */
    public set alpha(value: number) {
        if (this._alpha === value) {
            return;
        }

        const oldValue = this._alpha;
        this._alpha = value;

        // Only call dirty when there is a state change (no alpha / alpha)
        if (oldValue === 1 || value === 1) {
            this.markAsDirty(Material.MiscDirtyFlag + Material.PrePassDirtyFlag);
        }
    }

    /**
     * Gets the alpha value of the material
     */
    public get alpha(): number {
        return this._alpha;
    }

    /**
     * Specifies if back face culling is enabled
     */
    @serialize("backFaceCulling")
    protected _backFaceCulling = true;

    /**
     * Sets the culling state (true to enable culling, false to disable)
     */
    public set backFaceCulling(value: boolean) {
        if (this._backFaceCulling === value) {
            return;
        }
        this._backFaceCulling = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }

    /**
     * Gets the culling state
     */
    public get backFaceCulling(): boolean {
        return this._backFaceCulling;
    }

    /**
     * Specifies if back or front faces should be culled (when culling is enabled)
     */
    @serialize("cullBackFaces")
    protected _cullBackFaces = true;

    /**
     * Sets the type of faces that should be culled (true for back faces, false for front faces)
     */
    public set cullBackFaces(value: boolean) {
        if (this._cullBackFaces === value) {
            return;
        }
        this._cullBackFaces = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }

    /**
     * Gets the type of faces that should be culled
     */
    public get cullBackFaces(): boolean {
        return this._cullBackFaces;
    }

    private _blockDirtyMechanism = false;

    /**
     * Block the dirty-mechanism for this specific material
     * When set to false after being true the material will be marked as dirty.
     */
    public get blockDirtyMechanism(): boolean {
        return this._blockDirtyMechanism;
    }

    public set blockDirtyMechanism(value: boolean) {
        if (this._blockDirtyMechanism === value) {
            return;
        }

        this._blockDirtyMechanism = value;

        if (!value) {
            this.markDirty();
        }
    }

    /**
     * This allows you to modify the material without marking it as dirty after every change.
     * This function should be used if you need to make more than one dirty-enabling change to the material - adding a texture, setting a new fill mode and so on.
     * The callback will pass the material as an argument, so you can make your changes to it.
     * @param callback the callback to be executed that will update the material
     */
    public atomicMaterialsUpdate(callback: (material: this) => void): void {
        this.blockDirtyMechanism = true;
        try {
            callback(this);
        } finally {
            this.blockDirtyMechanism = false;
        }
    }

    /**
     * Stores the value for side orientation
     */
    @serialize()
    public sideOrientation: number;

    /**
     * Callback triggered when the material is compiled
     */
    public onCompiled: Nullable<(effect: Effect) => void> = null;

    /**
     * Callback triggered when an error occurs
     */
    public onError: Nullable<(effect: Effect, errors: string) => void> = null;

    /**
     * Callback triggered to get the render target textures
     */
    public getRenderTargetTextures: Nullable<() => SmartArray<RenderTargetTexture>> = null;

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        this._eventInfo.hasRenderTargetTextures = false;
        this._callbackPluginEventHasRenderTargetTextures(this._eventInfo);
        return this._eventInfo.hasRenderTargetTextures;
    }

    /**
     * Specifies if the material should be serialized
     */
    public doNotSerialize = false;

    /**
     * @internal
     */
    public _storeEffectOnSubMeshes = false;

    /**
     * Stores the animations for the material
     */
    public animations: Nullable<Array<Animation>> = null;

    /**
     * An event triggered when the material is disposed
     */
    public onDisposeObservable = new Observable<Material>();

    /**
     * An observer which watches for dispose events
     */
    private _onDisposeObserver: Nullable<Observer<Material>> = null;
    private _onUnBindObservable: Nullable<Observable<Material>> = null;

    /**
     * Called during a dispose event
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    private _onBindObservable: Nullable<Observable<AbstractMesh>>;

    /**
     * An event triggered when the material is bound
     */
    public get onBindObservable(): Observable<AbstractMesh> {
        if (!this._onBindObservable) {
            this._onBindObservable = new Observable<AbstractMesh>();
        }

        return this._onBindObservable;
    }

    /**
     * An observer which watches for bind events
     */
    private _onBindObserver: Nullable<Observer<AbstractMesh>> = null;

    /**
     * Called during a bind event
     */
    public set onBind(callback: (Mesh: AbstractMesh) => void) {
        if (this._onBindObserver) {
            this.onBindObservable.remove(this._onBindObserver);
        }
        this._onBindObserver = this.onBindObservable.add(callback);
    }

    /**
     * An event triggered when the material is unbound
     */
    public get onUnBindObservable(): Observable<Material> {
        if (!this._onUnBindObservable) {
            this._onUnBindObservable = new Observable<Material>();
        }

        return this._onUnBindObservable;
    }

    protected _onEffectCreatedObservable: Nullable<Observable<{ effect: Effect; subMesh: Nullable<SubMesh> }>>;

    /**
     * An event triggered when the effect is (re)created
     */
    public get onEffectCreatedObservable(): Observable<{ effect: Effect; subMesh: Nullable<SubMesh> }> {
        if (!this._onEffectCreatedObservable) {
            this._onEffectCreatedObservable = new Observable<{ effect: Effect; subMesh: Nullable<SubMesh> }>();
        }

        return this._onEffectCreatedObservable;
    }

    /**
     * Stores the value of the alpha mode
     */
    @serialize("alphaMode")
    private _alphaMode: number = Constants.ALPHA_COMBINE;

    /**
     * Sets the value of the alpha mode.
     *
     * | Value | Type | Description |
     * | --- | --- | --- |
     * | 0 | ALPHA_DISABLE |   |
     * | 1 | ALPHA_ADD |   |
     * | 2 | ALPHA_COMBINE |   |
     * | 3 | ALPHA_SUBTRACT |   |
     * | 4 | ALPHA_MULTIPLY |   |
     * | 5 | ALPHA_MAXIMIZED |   |
     * | 6 | ALPHA_ONEONE |   |
     * | 7 | ALPHA_PREMULTIPLIED |   |
     * | 8 | ALPHA_PREMULTIPLIED_PORTERDUFF |   |
     * | 9 | ALPHA_INTERPOLATE |   |
     * | 10 | ALPHA_SCREENMODE |   |
     *
     */
    public set alphaMode(value: number) {
        if (this._alphaMode === value) {
            return;
        }
        this._alphaMode = value;
        this.markAsDirty(Material.TextureDirtyFlag);
    }

    /**
     * Gets the value of the alpha mode
     */
    public get alphaMode(): number {
        return this._alphaMode;
    }

    /**
     * Stores the state of the need depth pre-pass value
     */
    @serialize()
    private _needDepthPrePass = false;

    /**
     * Sets the need depth pre-pass value
     */
    public set needDepthPrePass(value: boolean) {
        if (this._needDepthPrePass === value) {
            return;
        }
        this._needDepthPrePass = value;
        if (this._needDepthPrePass) {
            this.checkReadyOnEveryCall = true;
        }
    }

    /**
     * Gets the depth pre-pass value
     */
    public get needDepthPrePass(): boolean {
        return this._needDepthPrePass;
    }

    /**
     * Can this material render to prepass
     */
    public get isPrePassCapable(): boolean {
        return false;
    }

    /**
     * Specifies if depth writing should be disabled
     */
    @serialize()
    public disableDepthWrite = false;

    /**
     * Specifies if color writing should be disabled
     */
    @serialize()
    public disableColorWrite = false;

    /**
     * Specifies if depth writing should be forced
     */
    @serialize()
    public forceDepthWrite = false;

    /**
     * Specifies the depth function that should be used. 0 means the default engine function
     */
    @serialize()
    public depthFunction = 0;

    /**
     * Specifies if there should be a separate pass for culling
     */
    @serialize()
    public separateCullingPass = false;

    /**
     * Stores the state specifying if fog should be enabled
     */
    @serialize("fogEnabled")
    private _fogEnabled = true;

    /**
     * Sets the state for enabling fog
     */
    public set fogEnabled(value: boolean) {
        if (this._fogEnabled === value) {
            return;
        }
        this._fogEnabled = value;
        this.markAsDirty(Material.MiscDirtyFlag);
    }

    /**
     * Gets the value of the fog enabled state
     */
    public get fogEnabled(): boolean {
        return this._fogEnabled;
    }

    /**
     * Stores the size of points
     */
    @serialize()
    public pointSize = 1.0;

    /**
     * Stores the z offset Factor value
     */
    @serialize()
    public zOffset = 0;

    /**
     * Stores the z offset Units value
     */
    @serialize()
    public zOffsetUnits = 0;

    public get wireframe(): boolean {
        switch (this._fillMode) {
            case Material.WireFrameFillMode:
            case Material.LineListDrawMode:
            case Material.LineLoopDrawMode:
            case Material.LineStripDrawMode:
                return true;
        }

        return this._scene.forceWireframe;
    }

    /**
     * Sets the state of wireframe mode
     */
    public set wireframe(value: boolean) {
        this.fillMode = value ? Material.WireFrameFillMode : Material.TriangleFillMode;
    }

    /**
     * Gets the value specifying if point clouds are enabled
     */
    @serialize()
    public get pointsCloud(): boolean {
        switch (this._fillMode) {
            case Material.PointFillMode:
            case Material.PointListDrawMode:
                return true;
        }

        return this._scene.forcePointsCloud;
    }

    /**
     * Sets the state of point cloud mode
     */
    public set pointsCloud(value: boolean) {
        this.fillMode = value ? Material.PointFillMode : Material.TriangleFillMode;
    }

    /**
     * Gets the material fill mode
     */
    @serialize()
    public get fillMode(): number {
        return this._fillMode;
    }

    /**
     * Sets the material fill mode
     */
    public set fillMode(value: number) {
        if (this._fillMode === value) {
            return;
        }

        this._fillMode = value;
        this.markAsDirty(Material.MiscDirtyFlag);
    }

    /**
     * Gets or sets the active clipplane 1
     */
    public clipPlane: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 2
     */
    public clipPlane2: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 3
     */
    public clipPlane3: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 4
     */
    public clipPlane4: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 5
     */
    public clipPlane5: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 6
     */
    public clipPlane6: Nullable<Plane>;

    /**
     * Gives access to the stencil properties of the material
     */
    public readonly stencil = new MaterialStencilState();

    protected _useLogarithmicDepth: boolean;

    /**
     * In case the depth buffer does not allow enough depth precision for your scene (might be the case in large scenes)
     * You can try switching to logarithmic depth.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer
     */
    @serialize()
    public get useLogarithmicDepth(): boolean {
        return this._useLogarithmicDepth;
    }

    public set useLogarithmicDepth(value: boolean) {
        const fragmentDepthSupported = this.getScene().getEngine().getCaps().fragmentDepthSupported;

        if (value && !fragmentDepthSupported) {
            Logger.Warn("Logarithmic depth has been requested for a material on a device that doesn't support it.");
        }

        this._useLogarithmicDepth = value && fragmentDepthSupported;

        this._markAllSubMeshesAsMiscDirty();
    }

    /**
     * @internal
     * Stores the effects for the material
     */
    public _materialContext: IMaterialContext | undefined;

    protected _drawWrapper: DrawWrapper;
    /** @internal */
    public _getDrawWrapper(): DrawWrapper {
        return this._drawWrapper;
    }
    /**
     * @internal
     */
    public _setDrawWrapper(drawWrapper: DrawWrapper) {
        this._drawWrapper = drawWrapper;
    }

    /**
     * Specifies if uniform buffers should be used
     */
    private _useUBO: boolean = false;

    /**
     * Stores a reference to the scene
     */
    private _scene: Scene;
    protected _needToBindSceneUbo: boolean;

    /**
     * Stores the fill mode state
     */
    private _fillMode = Material.TriangleFillMode;

    /**
     * Specifies if the depth write state should be cached
     */
    private _cachedDepthWriteState: boolean = false;

    /**
     * Specifies if the color write state should be cached
     */
    private _cachedColorWriteState: boolean = false;

    /**
     * Specifies if the depth function state should be cached
     */
    private _cachedDepthFunctionState: number = 0;

    /**
     * Stores the uniform buffer
     * @internal
     */
    public _uniformBuffer: UniformBuffer;

    /** @internal */
    public _indexInSceneMaterialArray = -1;

    /** @internal */
    public meshMap: Nullable<{ [id: string]: AbstractMesh | undefined }> = null;

    /** @internal */
    public _parentContainer: Nullable<AbstractScene> = null;

    /** @internal */
    public _dirtyCallbacks: { [code: number]: () => void };

    /** @internal */
    public _uniformBufferLayoutBuilt = false;

    protected _eventInfo: MaterialPluginCreated &
        MaterialPluginDisposed &
        MaterialPluginHasTexture &
        MaterialPluginIsReadyForSubMesh &
        MaterialPluginGetDefineNames &
        MaterialPluginPrepareEffect &
        MaterialPluginPrepareDefines &
        MaterialPluginPrepareUniformBuffer &
        MaterialPluginBindForSubMesh &
        MaterialPluginGetAnimatables &
        MaterialPluginGetActiveTextures &
        MaterialPluginFillRenderTargetTextures &
        MaterialPluginHasRenderTargetTextures &
        MaterialPluginHardBindForSubMesh = {} as any; // will be initialized before each event notification

    /** @internal */
    public _callbackPluginEventGeneric: (
        id: number,
        info:
            | MaterialPluginGetActiveTextures
            | MaterialPluginGetAnimatables
            | MaterialPluginHasTexture
            | MaterialPluginDisposed
            | MaterialPluginGetDefineNames
            | MaterialPluginPrepareEffect
            | MaterialPluginPrepareUniformBuffer
    ) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventIsReadyForSubMesh: (eventData: MaterialPluginIsReadyForSubMesh) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventPrepareDefines: (eventData: MaterialPluginPrepareDefines) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventPrepareDefinesBeforeAttributes: (eventData: MaterialPluginPrepareDefines) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventHardBindForSubMesh: (eventData: MaterialPluginHardBindForSubMesh) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventBindForSubMesh: (eventData: MaterialPluginBindForSubMesh) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventHasRenderTargetTextures: (eventData: MaterialPluginHasRenderTargetTextures) => void = () => void 0;
    /** @internal */
    public _callbackPluginEventFillRenderTargetTextures: (eventData: MaterialPluginFillRenderTargetTextures) => void = () => void 0;

    /**
     * Creates a material instance
     * @param name defines the name of the material
     * @param scene defines the scene to reference
     * @param doNotAdd specifies if the material should be added to the scene
     */
    constructor(name: string, scene?: Nullable<Scene>, doNotAdd?: boolean) {
        this.name = name;
        const setScene = scene || EngineStore.LastCreatedScene;
        if (!setScene) {
            return;
        }
        this._scene = setScene;
        this._dirtyCallbacks = {};

        this._dirtyCallbacks[Constants.MATERIAL_TextureDirtyFlag] = this._markAllSubMeshesAsTexturesDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_LightDirtyFlag] = this._markAllSubMeshesAsLightsDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_FresnelDirtyFlag] = this._markAllSubMeshesAsFresnelDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_AttributesDirtyFlag] = this._markAllSubMeshesAsAttributesDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_MiscDirtyFlag] = this._markAllSubMeshesAsMiscDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_PrePassDirtyFlag] = this._markAllSubMeshesAsPrePassDirty.bind(this);
        this._dirtyCallbacks[Constants.MATERIAL_AllDirtyFlag] = this._markAllSubMeshesAsAllDirty.bind(this);

        this.id = name || Tools.RandomId();
        this.uniqueId = this._scene.getUniqueId();
        this._materialContext = this._scene.getEngine().createMaterialContext();
        this._drawWrapper = new DrawWrapper(this._scene.getEngine(), false);
        this._drawWrapper.materialContext = this._materialContext;

        if (this._scene.useRightHandedSystem) {
            this.sideOrientation = Material.ClockWiseSideOrientation;
        } else {
            this.sideOrientation = Material.CounterClockWiseSideOrientation;
        }

        this._uniformBuffer = new UniformBuffer(this._scene.getEngine(), undefined, undefined, name);
        this._useUBO = this.getScene().getEngine().supportsUniformBuffers;

        if (!doNotAdd) {
            this._scene.addMaterial(this);
        }

        if (this._scene.useMaterialMeshMap) {
            this.meshMap = {};
        }

        Material.OnEventObservable.notifyObservers(this, MaterialPluginEvent.Created);
    }

    /**
     * Returns a string representation of the current material
     * @param fullDetails defines a boolean indicating which levels of logging is desired
     * @returns a string with material information
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public toString(fullDetails?: boolean): string {
        const ret = "Name: " + this.name;
        return ret;
    }

    /**
     * Gets the class name of the material
     * @returns a string with the class name of the material
     */
    public getClassName(): string {
        return "Material";
    }

    /** @internal */
    public get _isMaterial() {
        return true;
    }

    /**
     * Specifies if updates for the material been locked
     */
    public get isFrozen(): boolean {
        return this.checkReadyOnlyOnce;
    }

    /**
     * Locks updates for the material
     */
    public freeze(): void {
        this.markDirty();
        this.checkReadyOnlyOnce = true;
    }

    /**
     * Unlocks updates for the material
     */
    public unfreeze(): void {
        this.markDirty();
        this.checkReadyOnlyOnce = false;
    }

    /**
     * Specifies if the material is ready to be used
     * @param mesh defines the mesh to check
     * @param useInstances specifies if instances should be used
     * @returns a boolean indicating if the material is ready to be used
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        return true;
    }

    /**
     * Specifies that the submesh is ready to be used
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        const defines = subMesh.materialDefines;
        if (!defines) {
            return false;
        }

        this._eventInfo.isReadyForSubMesh = true;
        this._eventInfo.defines = defines;
        this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);

        return this._eventInfo.isReadyForSubMesh;
    }

    /**
     * Returns the material effect
     * @returns the effect associated with the material
     */
    public getEffect(): Nullable<Effect> {
        return this._drawWrapper.effect;
    }

    /**
     * Returns the current scene
     * @returns a Scene
     */
    public getScene(): Scene {
        return this._scene;
    }

    /**
     * Enforces alpha test in opaque or blend mode in order to improve the performances of some situations.
     */
    protected _forceAlphaTest = false;

    /**
     * The transparency mode of the material.
     */
    protected _transparencyMode: Nullable<number> = null;

    /**
     * Gets the current transparency mode.
     */
    @serialize()
    public get transparencyMode(): Nullable<number> {
        return this._transparencyMode;
    }

    /**
     * Sets the transparency mode of the material.
     *
     * | Value | Type                                | Description |
     * | ----- | ----------------------------------- | ----------- |
     * | 0     | OPAQUE                              |             |
     * | 1     | ALPHATEST                           |             |
     * | 2     | ALPHABLEND                          |             |
     * | 3     | ALPHATESTANDBLEND                   |             |
     *
     */
    public set transparencyMode(value: Nullable<number>) {
        if (this._transparencyMode === value) {
            return;
        }

        this._transparencyMode = value;

        this._forceAlphaTest = value === Material.MATERIAL_ALPHATESTANDBLEND;

        this._markAllSubMeshesAsTexturesAndMiscDirty();
    }

    /**
     * Returns true if alpha blending should be disabled.
     */
    protected get _disableAlphaBlending(): boolean {
        return this._transparencyMode === Material.MATERIAL_OPAQUE || this._transparencyMode === Material.MATERIAL_ALPHATEST;
    }

    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     * @returns a boolean specifying if alpha blending is needed
     */
    public needAlphaBlending(): boolean {
        if (this._disableAlphaBlending) {
            return false;
        }

        return this.alpha < 1.0;
    }

    /**
     * Specifies if the mesh will require alpha blending
     * @param mesh defines the mesh to check
     * @returns a boolean specifying if alpha blending is needed for the mesh
     */
    public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
        if (mesh.visibility < 1.0) {
            return true;
        }

        if (this._disableAlphaBlending) {
            return false;
        }

        return mesh.hasVertexAlpha || this.needAlphaBlending();
    }

    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     * @returns a boolean specifying if an alpha test is needed.
     */
    public needAlphaTesting(): boolean {
        if (this._forceAlphaTest) {
            return true;
        }

        return false;
    }

    /**
     * Specifies if material alpha testing should be turned on for the mesh
     * @param mesh defines the mesh to check
     * @returns a boolean specifying if alpha testing should be turned on for the mesh
     */
    protected _shouldTurnAlphaTestOn(mesh: AbstractMesh): boolean {
        return !this.needAlphaBlendingForMesh(mesh) && this.needAlphaTesting();
    }

    /**
     * Gets the texture used for the alpha test
     * @returns the texture to use for alpha testing
     */
    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    /**
     * Marks the material to indicate that it needs to be re-calculated
     * @param forceMaterialDirty - Forces the material to be marked as dirty for all components (same as this.markAsDirty(Material.AllDirtyFlag)). You should use this flag if the material is frozen and you want to force a recompilation.
     */
    public markDirty(forceMaterialDirty = false): void {
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }

                for (const drawWrapper of subMesh._drawWrappers) {
                    if (!drawWrapper) {
                        continue;
                    }
                    if (this._materialContext === drawWrapper.materialContext) {
                        drawWrapper._wasPreviouslyReady = false;
                        drawWrapper._wasPreviouslyUsingInstances = null;
                        drawWrapper._forceRebindOnNextCall = forceMaterialDirty;
                    }
                }
            }
        }

        if (forceMaterialDirty) {
            this.markAsDirty(Material.AllDirtyFlag);
        }
    }

    /**
     * @internal
     */
    public _preBind(effect?: Effect | DrawWrapper, overrideOrientation: Nullable<number> = null): boolean {
        const engine = this._scene.getEngine();

        const orientation = overrideOrientation == null ? this.sideOrientation : overrideOrientation;
        const reverse = orientation === Material.ClockWiseSideOrientation;

        engine.enableEffect(effect ? effect : this._getDrawWrapper());
        engine.setState(
            this.backFaceCulling,
            this.zOffset,
            false,
            reverse,
            this._scene._mirroredCameraPosition ? !this.cullBackFaces : this.cullBackFaces,
            this.stencil,
            this.zOffsetUnits
        );

        return reverse;
    }

    /**
     * Binds the material to the mesh
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh to bind the material to
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public bind(world: Matrix, mesh?: Mesh): void {}

    /**
     * Initializes the uniform buffer layout for the shader.
     */
    public buildUniformLayout(): void {
        const ubo = this._uniformBuffer;

        this._eventInfo.ubo = ubo;
        this._callbackPluginEventGeneric(MaterialPluginEvent.PrepareUniformBuffer, this._eventInfo);

        ubo.create();

        this._uniformBufferLayoutBuilt = true;
    }

    /**
     * Binds the submesh to the material
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const drawWrapper = subMesh._drawWrapper;

        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventBindForSubMesh(this._eventInfo);
        drawWrapper._forceRebindOnNextCall = false;
    }

    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public bindOnlyWorldMatrix(world: Matrix): void {}

    /**
     * Binds the view matrix to the effect
     * @param effect defines the effect to bind the view matrix to
     */
    public bindView(effect: Effect): void {
        if (!this._useUBO) {
            effect.setMatrix("view", this.getScene().getViewMatrix());
        } else {
            this._needToBindSceneUbo = true;
        }
    }

    /**
     * Binds the view projection and projection matrices to the effect
     * @param effect defines the effect to bind the view projection and projection matrices to
     */
    public bindViewProjection(effect: Effect): void {
        if (!this._useUBO) {
            effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
            effect.setMatrix("projection", this.getScene().getProjectionMatrix());
        } else {
            this._needToBindSceneUbo = true;
        }
    }

    /**
     * Binds the view matrix to the effect
     * @param effect defines the effect to bind the view matrix to
     * @param variableName name of the shader variable that will hold the eye position
     */
    public bindEyePosition(effect: Effect, variableName?: string): void {
        if (!this._useUBO) {
            this._scene.bindEyePosition(effect, variableName);
        } else {
            this._needToBindSceneUbo = true;
        }
    }

    /**
     * Processes to execute after binding the material to a mesh
     * @param mesh defines the rendered mesh
     * @param effect defines the effect used to bind the material
     * @param _subMesh defines the subMesh that the material has been bound for
     */
    protected _afterBind(mesh?: Mesh, effect: Nullable<Effect> = null, _subMesh?: SubMesh): void {
        this._scene._cachedMaterial = this;
        if (this._needToBindSceneUbo) {
            if (effect) {
                this._needToBindSceneUbo = false;
                MaterialHelper.BindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
                this._scene.finalizeSceneUbo();
            }
        }
        if (mesh) {
            this._scene._cachedVisibility = mesh.visibility;
        } else {
            this._scene._cachedVisibility = 1;
        }

        if (this._onBindObservable && mesh) {
            this._onBindObservable.notifyObservers(mesh);
        }

        if (this.disableDepthWrite) {
            const engine = this._scene.getEngine();
            this._cachedDepthWriteState = engine.getDepthWrite();
            engine.setDepthWrite(false);
        }

        if (this.disableColorWrite) {
            const engine = this._scene.getEngine();
            this._cachedColorWriteState = engine.getColorWrite();
            engine.setColorWrite(false);
        }

        if (this.depthFunction !== 0) {
            const engine = this._scene.getEngine();
            this._cachedDepthFunctionState = engine.getDepthFunction() || 0;
            engine.setDepthFunction(this.depthFunction);
        }
    }

    /**
     * Unbinds the material from the mesh
     */
    public unbind(): void {
        if (this._onUnBindObservable) {
            this._onUnBindObservable.notifyObservers(this);
        }

        if (this.depthFunction !== 0) {
            const engine = this._scene.getEngine();
            engine.setDepthFunction(this._cachedDepthFunctionState);
        }

        if (this.disableDepthWrite) {
            const engine = this._scene.getEngine();
            engine.setDepthWrite(this._cachedDepthWriteState);
        }

        if (this.disableColorWrite) {
            const engine = this._scene.getEngine();
            engine.setColorWrite(this._cachedColorWriteState);
        }
    }

    /**
     * Returns the animatable textures.
     * @returns - Array of animatable textures.
     */
    public getAnimatables(): IAnimatable[] {
        this._eventInfo.animatables = [];
        this._callbackPluginEventGeneric(MaterialPluginEvent.GetAnimatables, this._eventInfo);
        return this._eventInfo.animatables;
    }

    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    public getActiveTextures(): BaseTexture[] {
        this._eventInfo.activeTextures = [];
        this._callbackPluginEventGeneric(MaterialPluginEvent.GetActiveTextures, this._eventInfo);
        return this._eventInfo.activeTextures;
    }

    /**
     * Specifies if the material uses a texture
     * @param texture defines the texture to check against the material
     * @returns a boolean specifying if the material uses the texture
     */
    public hasTexture(texture: BaseTexture): boolean {
        this._eventInfo.hasTexture = false;
        this._eventInfo.texture = texture;
        this._callbackPluginEventGeneric(MaterialPluginEvent.HasTexture, this._eventInfo);
        return this._eventInfo.hasTexture;
    }

    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @returns the cloned material
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clone(name: string): Nullable<Material> {
        return null;
    }

    protected _clonePlugins(targetMaterial: Material, rootUrl: string) {
        const serializationObject: any = {};

        // Create plugins in targetMaterial in case they don't exist
        this._serializePlugins(serializationObject);

        Material._ParsePlugins(serializationObject, targetMaterial, this._scene, rootUrl);

        // Copy the properties of the current plugins to the cloned material's plugins
        if (this.pluginManager) {
            for (const plugin of this.pluginManager._plugins) {
                const targetPlugin = targetMaterial.pluginManager!.getPlugin(plugin.name);
                if (targetPlugin) {
                    plugin.copyTo(targetPlugin);
                }
            }
        }
    }

    /**
     * Gets the meshes bound to the material
     * @returns an array of meshes bound to the material
     */
    public getBindedMeshes(): AbstractMesh[] {
        if (this.meshMap) {
            const result: AbstractMesh[] = [];
            for (const meshId in this.meshMap) {
                const mesh = this.meshMap[meshId];
                if (mesh) {
                    result.push(mesh);
                }
            }
            return result;
        } else {
            const meshes = this._scene.meshes;
            return meshes.filter((mesh) => mesh.material === this);
        }
    }

    /**
     * Force shader compilation
     * @param mesh defines the mesh associated with this material
     * @param onCompiled defines a function to execute once the material is compiled
     * @param options defines the options to configure the compilation
     * @param onError defines a function to execute if the material fails compiling
     */
    public forceCompilation(
        mesh: AbstractMesh,
        onCompiled?: (material: Material) => void,
        options?: Partial<IMaterialCompilationOptions>,
        onError?: (reason: string) => void
    ): void {
        const localOptions = {
            clipPlane: false,
            useInstances: false,
            ...options,
        };

        const scene = this.getScene();
        const currentHotSwapingState = this.allowShaderHotSwapping;
        this.allowShaderHotSwapping = false; // Turned off to let us evaluate the real compilation state

        const checkReady = () => {
            if (!this._scene || !this._scene.getEngine()) {
                return;
            }

            const clipPlaneState = scene.clipPlane;

            if (localOptions.clipPlane) {
                scene.clipPlane = new Plane(0, 0, 0, 1);
            }

            if (this._storeEffectOnSubMeshes) {
                let allDone = true,
                    lastError = null;
                if (mesh.subMeshes) {
                    const tempSubMesh = new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false, false);
                    if (tempSubMesh.materialDefines) {
                        tempSubMesh.materialDefines._renderId = -1;
                    }
                    if (!this.isReadyForSubMesh(mesh, tempSubMesh, localOptions.useInstances)) {
                        if (tempSubMesh.effect && tempSubMesh.effect.getCompilationError() && tempSubMesh.effect.allFallbacksProcessed()) {
                            lastError = tempSubMesh.effect.getCompilationError();
                        } else {
                            allDone = false;
                            setTimeout(checkReady, 16);
                        }
                    }
                }
                if (allDone) {
                    this.allowShaderHotSwapping = currentHotSwapingState;
                    if (lastError) {
                        if (onError) {
                            onError(lastError);
                        }
                    }
                    if (onCompiled) {
                        onCompiled(this);
                    }
                }
            } else {
                if (this.isReady()) {
                    this.allowShaderHotSwapping = currentHotSwapingState;
                    if (onCompiled) {
                        onCompiled(this);
                    }
                } else {
                    setTimeout(checkReady, 16);
                }
            }

            if (localOptions.clipPlane) {
                scene.clipPlane = clipPlaneState;
            }
        };

        checkReady();
    }

    /**
     * Force shader compilation
     * @param mesh defines the mesh that will use this material
     * @param options defines additional options for compiling the shaders
     * @returns a promise that resolves when the compilation completes
     */
    public forceCompilationAsync(mesh: AbstractMesh, options?: Partial<IMaterialCompilationOptions>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.forceCompilation(
                mesh,
                () => {
                    resolve();
                },
                options,
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    private static readonly _AllDirtyCallBack = (defines: MaterialDefines) => defines.markAllAsDirty();
    private static readonly _ImageProcessingDirtyCallBack = (defines: MaterialDefines) => defines.markAsImageProcessingDirty();
    private static readonly _TextureDirtyCallBack = (defines: MaterialDefines) => defines.markAsTexturesDirty();
    private static readonly _FresnelDirtyCallBack = (defines: MaterialDefines) => defines.markAsFresnelDirty();
    private static readonly _MiscDirtyCallBack = (defines: MaterialDefines) => defines.markAsMiscDirty();
    private static readonly _PrePassDirtyCallBack = (defines: MaterialDefines) => defines.markAsPrePassDirty();
    private static readonly _LightsDirtyCallBack = (defines: MaterialDefines) => defines.markAsLightDirty();
    private static readonly _AttributeDirtyCallBack = (defines: MaterialDefines) => defines.markAsAttributesDirty();

    private static _FresnelAndMiscDirtyCallBack = (defines: MaterialDefines) => {
        Material._FresnelDirtyCallBack(defines);
        Material._MiscDirtyCallBack(defines);
    };

    private static _TextureAndMiscDirtyCallBack = (defines: MaterialDefines) => {
        Material._TextureDirtyCallBack(defines);
        Material._MiscDirtyCallBack(defines);
    };

    private static readonly _DirtyCallbackArray: Array<(defines: MaterialDefines) => void> = [];
    private static readonly _RunDirtyCallBacks = (defines: MaterialDefines) => {
        for (const cb of Material._DirtyCallbackArray) {
            cb(defines);
        }
    };

    /**
     * Marks a define in the material to indicate that it needs to be re-computed
     * @param flag defines a flag used to determine which parts of the material have to be marked as dirty
     */
    public markAsDirty(flag: number): void {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }

        Material._DirtyCallbackArray.length = 0;

        if (flag & Material.TextureDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._TextureDirtyCallBack);
        }

        if (flag & Material.LightDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._LightsDirtyCallBack);
        }

        if (flag & Material.FresnelDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._FresnelDirtyCallBack);
        }

        if (flag & Material.AttributesDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._AttributeDirtyCallBack);
        }

        if (flag & Material.MiscDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._MiscDirtyCallBack);
        }

        if (flag & Material.PrePassDirtyFlag) {
            Material._DirtyCallbackArray.push(Material._PrePassDirtyCallBack);
        }

        if (Material._DirtyCallbackArray.length) {
            this._markAllSubMeshesAsDirty(Material._RunDirtyCallBacks);
        }

        this.getScene().resetCachedMaterial();
    }

    /**
     * Resets the draw wrappers cache for all submeshes that are using this material
     */
    public resetDrawCache(): void {
        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                if (subMesh.getMaterial() !== this) {
                    continue;
                }

                subMesh.resetDrawCache();
            }
        }
    }

    /**
     * Marks all submeshes of a material to indicate that their material defines need to be re-calculated
     * @param func defines a function which checks material defines against the submeshes
     */
    protected _markAllSubMeshesAsDirty(func: (defines: MaterialDefines) => void) {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }

        const meshes = this.getScene().meshes;
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                // We want to skip the submeshes which are not using this material or which have not yet rendered at least once
                if (subMesh.getMaterial(false) !== this) {
                    continue;
                }

                for (const drawWrapper of subMesh._drawWrappers) {
                    if (!drawWrapper || !drawWrapper.defines || !(drawWrapper.defines as MaterialDefines).markAllAsDirty) {
                        continue;
                    }
                    if (this._materialContext === drawWrapper.materialContext) {
                        func(drawWrapper.defines as MaterialDefines);
                    }
                }
            }
        }
    }

    /**
     * Indicates that the scene should check if the rendering now needs a prepass
     */
    protected _markScenePrePassDirty() {
        if (this.getScene().blockMaterialDirtyMechanism || this._blockDirtyMechanism) {
            return;
        }

        const prePassRenderer = this.getScene().enablePrePassRenderer();
        if (prePassRenderer) {
            prePassRenderer.markAsDirty();
        }
    }

    /**
     * Indicates that we need to re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsAllDirty() {
        this._markAllSubMeshesAsDirty(Material._AllDirtyCallBack);
    }

    /**
     * Indicates that image processing needs to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsImageProcessingDirty() {
        this._markAllSubMeshesAsDirty(Material._ImageProcessingDirtyCallBack);
    }

    /**
     * Indicates that textures need to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsTexturesDirty() {
        this._markAllSubMeshesAsDirty(Material._TextureDirtyCallBack);
    }

    /**
     * Indicates that fresnel needs to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsFresnelDirty() {
        this._markAllSubMeshesAsDirty(Material._FresnelDirtyCallBack);
    }

    /**
     * Indicates that fresnel and misc need to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsFresnelAndMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._FresnelAndMiscDirtyCallBack);
    }

    /**
     * Indicates that lights need to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsLightsDirty() {
        this._markAllSubMeshesAsDirty(Material._LightsDirtyCallBack);
    }

    /**
     * Indicates that attributes need to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsAttributesDirty() {
        this._markAllSubMeshesAsDirty(Material._AttributeDirtyCallBack);
    }

    /**
     * Indicates that misc needs to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._MiscDirtyCallBack);
    }

    /**
     * Indicates that prepass needs to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsPrePassDirty() {
        this._markAllSubMeshesAsDirty(Material._MiscDirtyCallBack);
    }

    /**
     * Indicates that textures and misc need to be re-calculated for all submeshes
     */
    protected _markAllSubMeshesAsTexturesAndMiscDirty() {
        this._markAllSubMeshesAsDirty(Material._TextureAndMiscDirtyCallBack);
    }

    protected _checkScenePerformancePriority() {
        if (this._scene.performancePriority !== ScenePerformancePriority.BackwardCompatible) {
            this.checkReadyOnlyOnce = true;
            // re-set the flag when the perf priority changes
            const observer = this._scene.onScenePerformancePriorityChangedObservable.addOnce(() => {
                this.checkReadyOnlyOnce = false;
            });
            // if this material is disposed before the scene is disposed, cleanup the observer
            this.onDisposeObservable.add(() => {
                this._scene.onScenePerformancePriorityChangedObservable.remove(observer);
            });
        }
    }

    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setPrePassRenderer(prePassRenderer: PrePassRenderer): boolean {
        // Do Nothing by default
        return false;
    }

    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     * @param notBoundToMesh specifies if the material that is being disposed is known to be not bound to any mesh
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean): void {
        const scene = this.getScene();
        // Animations
        scene.stopAnimation(this);
        scene.freeProcessedMaterials();

        // Remove from scene
        scene.removeMaterial(this);

        this._eventInfo.forceDisposeTextures = forceDisposeTextures;
        this._callbackPluginEventGeneric(MaterialPluginEvent.Disposed, this._eventInfo);

        if (this._parentContainer) {
            const index = this._parentContainer.materials.indexOf(this);
            if (index > -1) {
                this._parentContainer.materials.splice(index, 1);
            }
            this._parentContainer = null;
        }

        if (notBoundToMesh !== true) {
            // Remove from meshes
            if (this.meshMap) {
                for (const meshId in this.meshMap) {
                    const mesh = this.meshMap[meshId];
                    if (mesh) {
                        mesh.material = null; // will set the entry in the map to undefined
                        this.releaseVertexArrayObject(mesh, forceDisposeEffect);
                    }
                }
            } else {
                const meshes = scene.meshes;
                for (const mesh of meshes) {
                    if (mesh.material === this && !(mesh as InstancedMesh).sourceMesh) {
                        mesh.material = null;
                        this.releaseVertexArrayObject(mesh, forceDisposeEffect);
                    }
                }
            }
        }

        this._uniformBuffer.dispose();

        // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
        if (forceDisposeEffect && this._drawWrapper.effect) {
            if (!this._storeEffectOnSubMeshes) {
                this._drawWrapper.effect.dispose();
            }

            this._drawWrapper.effect = null;
        }

        this.metadata = null;

        // Callback
        this.onDisposeObservable.notifyObservers(this);

        this.onDisposeObservable.clear();
        if (this._onBindObservable) {
            this._onBindObservable.clear();
        }

        if (this._onUnBindObservable) {
            this._onUnBindObservable.clear();
        }

        if (this._onEffectCreatedObservable) {
            this._onEffectCreatedObservable.clear();
        }

        if (this._eventInfo) {
            this._eventInfo = {} as any;
        }
    }

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private releaseVertexArrayObject(mesh: AbstractMesh, forceDisposeEffect?: boolean) {
        const geometry = (<Mesh>mesh).geometry;
        if (geometry) {
            if (this._storeEffectOnSubMeshes) {
                if (mesh.subMeshes) {
                    for (const subMesh of mesh.subMeshes) {
                        geometry._releaseVertexArrayObject(subMesh.effect);
                        if (forceDisposeEffect && subMesh.effect) {
                            subMesh.effect.dispose();
                        }
                    }
                }
            } else {
                geometry._releaseVertexArrayObject(this._drawWrapper.effect);
            }
        }
    }

    /**
     * Serializes this material
     * @returns the serialized material object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);

        serializationObject.stencil = this.stencil.serialize();
        serializationObject.uniqueId = this.uniqueId;

        this._serializePlugins(serializationObject);

        return serializationObject;
    }

    protected _serializePlugins(serializationObject: any) {
        serializationObject.plugins = {};

        if (this.pluginManager) {
            for (const plugin of this.pluginManager._plugins) {
                serializationObject.plugins[plugin.getClassName()] = plugin.serialize();
            }
        }
    }

    /**
     * Creates a material from parsed material data
     * @param parsedMaterial defines parsed material data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures
     * @returns a new material
     */
    public static Parse(parsedMaterial: any, scene: Scene, rootUrl: string): Nullable<Material> {
        if (!parsedMaterial.customType) {
            parsedMaterial.customType = "BABYLON.StandardMaterial";
        } else if (parsedMaterial.customType === "BABYLON.PBRMaterial" && parsedMaterial.overloadedAlbedo) {
            parsedMaterial.customType = "BABYLON.LegacyPBRMaterial";
            if (!BABYLON.LegacyPBRMaterial) {
                Logger.Error("Your scene is trying to load a legacy version of the PBRMaterial, please, include it from the materials library.");
                return null;
            }
        }

        const materialType = Tools.Instantiate(parsedMaterial.customType);
        const material = materialType.Parse(parsedMaterial, scene, rootUrl);
        material._loadedUniqueId = parsedMaterial.uniqueId;

        return material;
    }

    protected static _ParsePlugins(serializationObject: any, material: Material, scene: Scene, rootUrl: string) {
        if (!serializationObject.plugins) {
            return;
        }

        for (const pluginClassName in serializationObject.plugins) {
            const pluginData = serializationObject.plugins[pluginClassName];

            let plugin = material.pluginManager?.getPlugin(pluginData.name);

            if (!plugin) {
                const pluginClassType = Tools.Instantiate("BABYLON." + pluginClassName);
                if (pluginClassType) {
                    plugin = new pluginClassType(material);
                }
            }

            plugin?.parse(pluginData, scene, rootUrl);
        }
    }
}
