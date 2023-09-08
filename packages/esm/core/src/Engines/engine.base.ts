import { Effect } from "core/Materials/effect";
import type { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Observable } from "core/Misc/observable";
import {
    ALPHA_ADD,
    ALPHA_DISABLE,
    GEQUAL,
    LEQUAL,
    MATERIAL_PointFillMode,
    MATERIAL_TriangleFillMode,
    MATERIAL_WireFrameFillMode,
    TEXTUREFORMAT_RGBA,
    TEXTURETYPE_UNSIGNED_INT,
    TEXTURE_NEAREST_SAMPLINGMODE,
} from "./engine.constants";
import { PrecisionDate } from "core/Misc";
import type { DataBuffer, StorageBuffer } from "core/Buffers";
import type { EngineCapabilities } from "core/Engines/engineCapabilities";
import type { EngineFeatures } from "core/Engines/engineFeatures";
import type { DepthCullingState } from "core/States/depthCullingState";
import { AlphaState } from "core/States/alphaCullingState";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { IViewportLike } from "core/Maths/math.like";
import type { ICanvas, ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { IFileRequest } from "core/Misc/fileRequest";
import type { IRawTextureEngineExtension } from "./Extensions/engine.rawTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { EngineType } from "./engine.interfaces";
import { IsDocumentAvailable, IsWindowObjectExist } from "./runtimeEnvironment";
import { PerformanceConfigurator } from "core/Engines/performanceConfigurator";
import { QueueNewFrame } from "./engine.static";
import type { IPipelineContext } from "core/Engines/IPipelineContext";

const activeRequests: WeakMap<any, IFileRequest> = new WeakMap();

export interface IBaseEngineOptions {
    /**
     * Defines if the engine should no exceed a specified device ratio
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
     */
    limitDeviceRatio?: number;
    // taken the audio engine out of this context
    // /**
    //  * Defines if webaudio should be initialized as well
    //  * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
    //  */
    // audioEngine?: boolean;
    // /**
    //  * Specifies options for the audio engine
    //  */
    // audioEngineOptions?: IAudioEngineOptions;

    /**
     * Defines if animations should run using a deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     */
    deterministicLockstep?: boolean;
    /** Defines the maximum steps to use with deterministic lock step mode */
    lockstepMaxSteps?: number;
    /** Defines the seconds between each deterministic lock step */
    timeStep?: number;
    /**
     * Defines that engine should ignore context lost events
     * If this event happens when this parameter is true, you will have to reload the page to restore rendering
     */
    doNotHandleContextLost?: boolean;
    /**
     * Defines that engine should ignore modifying touch action attribute and style
     * If not handle, you might need to set it up on your side for expected touch devices behavior.
     */
    doNotHandleTouchAction?: boolean;

    /**
     * Make the matrix computations to be performed in 64 bits instead of 32 bits. False by default
     */
    useHighPrecisionMatrix?: boolean;

    /**
     * Defines whether to adapt to the device's viewport characteristics (default: false)
     */
    adaptToDeviceRatio?: boolean;

    /**
     * True if the more expensive but exact conversions should be used for transforming colors to and from linear space within shaders.
     * Otherwise, the default is to use a cheaper approximation.
     */
    useExactSrgbConversions?: boolean;

    /**
     * Defines whether MSAA is enabled on the canvas.
     */
    antialias?: boolean;

    /**
     * Defines whether the stencil buffer should be enabled.
     */
    stencil?: boolean;

    /**
     * Defines whether the canvas should be created in "premultiplied" mode (if false, the canvas is created in the "opaque" mode) (true by default)
     */
    premultipliedAlpha?: boolean;
}

interface IBaseEnginePrivate {
    _useReverseDepthBuffer: boolean;
    _frameId: number;
    // Those can move out of the engine context and be standalone functions
    // _onContextLost: (evt: Event) => void;
    // _onContextRestored: (evt: Event) => void;
    _currentTextureChannel: number;
    _vertexAttribArraysEnabled: boolean[];

    // _vaoRecordInProgress // moved to webgl

    _emptyTexture: Nullable<InternalTexture>;
    _emptyCubeTexture: Nullable<InternalTexture>;
    _emptyTexture3D: Nullable<InternalTexture>;
    _emptyTexture2DArray: Nullable<InternalTexture>;
    // _activeRequests - moved to the scope of this file, privately. Maps object to IFileRequest.
    // _checkForMobile - moved to hostInformation
}

export interface IBaseEngineProtected {
    _type: EngineType;
    _isDisposed: boolean;
    _shaderProcessor: Nullable<IShaderProcessor>;
    _renderingCanvas: Nullable<HTMLCanvasElement>;
    _windowIsBackground: boolean;
    _creationOptions: IBaseEngineOptions; // TODO?
    // _audioContext: Nullable<AudioContext>; // move out of the context of the engine
    // _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
    _highPrecisionShadersAllowed: boolean; // part of options, can be removed?
    _isStencilEnable: boolean;
    _renderingQueueLaunched: boolean;
    _activeRenderLoops: Array<() => void>;
    _contextWasLost: boolean;
    _colorWrite: boolean;
    _colorWriteChanged: boolean;
    // TODO - the following can be taken out of the engine completely. be state objects
    _depthCullingState: Nullable<DepthCullingState>;
    // _stencilStateComposer: StencilStateComposer; // moved to the engine level
    // _stencilState: StencilState; // moved to the engine level
    _activeChannel: number;
    _boundTexturesCache: { [key: string]: Nullable<InternalTexture> };
    _currentEffect: Nullable<Effect>;
    _compiledEffects: { [key: string]: Effect };
    _cachedViewport: Nullable<IViewportLike>;
    _workingCanvas: Nullable<ICanvas>;
    _workingContext: Nullable<ICanvasRenderingContext>;
    _lastDevicePixelRatio: number;
    _shaderPlatformName: string; // feels redundant
    _viewportCached: { x: number; y: number; z: number; w: number };
}

export interface IBaseEngineInternals {
    // description: string;
    _version: number;
    _frameId: number;
    _uniformBuffers: Array<UniformBuffer>;
    _storageBuffers: Array<StorageBuffer>;
    _uniqueId: number;
    _shouldUseHighPrecisionShader: boolean;
    _badOS?: boolean;
    _badDesktopOS?: boolean;
    _hardwareScalingLevel: number;
    _caps: EngineCapabilities; // TODO
    _features: EngineFeatures;
    // _videoTextureSupported: boolean;
    _alphaState: AlphaState;
    _alphaMode: number;
    _alphaEquation: number;
    _internalTexturesCache: Array<InternalTexture>;
    _renderTargetWrapperCache: Array<RenderTargetWrapper>;
    // _currentDrawContext: IDrawContext;
    // _currentMaterialContext: IMaterialContext;
    _currentRenderTarget: Nullable<RenderTargetWrapper>;
    _boundRenderFunction: FrameRequestCallback;
    _frameHandler: number;
    _transformTextureUrl: Nullable<(url: string) => string>; // can move out?
    // replacing _framebufferDimensionsObject
    _renderWidthOverride: Nullable<{ width: number; height: number }>;
    _dimensionsObject: Nullable<{ width: number; height: number }>;
}

/**
 * Engine state's public API.
 */
export interface IBaseEnginePublic {
    /**
     * The base functionality of this engine. Can be overwritten or populated by other init functions.
     */
    // module: Partial<IEngineModule>;
    /**
     * Returns a string describing the current engine
     */
    readonly description: string;
    /**
     * Gets or sets the name of the engine
     */
    name: string;
    /**
     * Returns the version of the engine, depending on its type
     */
    // readonly version: number; // No real need for that in the public API
    /**
     * Returns a boolean whether this engine is disposed
     */
    readonly isDisposed: boolean;
    /**
     * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
     */
    forcePOTTextures: boolean;
    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    isFullscreen: boolean;
    /**
     * Gets or sets a boolean indicating if back faces must be culled. If false, front faces are culled instead (true by default)
     * If non null, this takes precedence over the value from the material
     */
    cullBackFaces: Nullable<boolean>;

    /**
     * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foreground
     */
    renderEvenInBackground: boolean;

    /**
     * Gets or sets a boolean indicating that cache can be kept between frames
     */
    preventCacheWipeBetweenFrames: boolean;

    /** Gets or sets a boolean indicating if the engine should validate programs after compilation */
    validateShaderPrograms: boolean;

    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    useReverseDepthBuffer: boolean;

    /**
     * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
     */
    readonly isNDCHalfZRange: boolean;

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    readonly hasOriginBottomLeft: boolean;

    /**
     * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
     */
    disableUniformBuffers: boolean;

    /**
     * An event triggered when the engine is disposed.
     */
    readonly onDisposeObservable: Observable<IBaseEnginePublic>;
    /**
     * Gets the current frame id
     */
    readonly frameId: number;
    /**
     * The time (in milliseconds elapsed since the current page has been loaded) when the engine was initialized
     */
    readonly startTime: number;

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     */
    readonly supportsUniformBuffers: boolean;

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    readonly needPOTTextures: boolean;

    /**
     * Gets the list of current active render loop functions
     */
    readonly activeRenderLoops: Array<() => void>;

    /**
     * Observable signaled when a context lost event is raised
     */
    onContextLostObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable signaled when a context restored event is raised
     */
    onContextRestoredObservable: Observable<IBaseEnginePublic>;

    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#handling-webgl-context-lost
     */
    doNotHandleContextLost: boolean;

    /**
     * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
     */
    disableVertexArrayObjects: boolean;

    /**
     * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
     */
    adaptToDeviceRatio: boolean;

    /**
     * Gets information about the current host
     */
    // hostInformation: HostInformation; // REDUNDANT!! can move to top level
    /**
     * Gets the current viewport
     */
    readonly currentViewport: Nullable<IViewportLike>;

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    premultipliedAlpha: boolean;

    /**
     * Observable event triggered before each texture is initialized
     */
    onBeforeTextureInitObservable: Observable<Texture>;

    /**
     * Gets a boolean indicating if the engine runs in WebGPU or not.
     */
    readonly isWebGPU: boolean;

    /**
     * Gets the shader platform name used by the effects.
     */
    readonly shaderPlatformName: string;

    // snapshotRendering - only in WebGPU
    // snapshotRenderingMode - only in WebGPU

    /**
     * Gets a boolean indicating if the exact sRGB conversions or faster approximations are used for converting to and from linear space.
     */
    readonly useExactSrgbConversions: boolean;
}

export type BaseEngineState<T extends IBaseEnginePublic = IBaseEnginePublic> = T & IBaseEngineInternals & IBaseEngineProtected;
export type BaseEngineStateFull<T extends IBaseEnginePublic = IBaseEnginePublic> = BaseEngineState<T> & IBaseEnginePrivate;

let engineCounter = 0;

/**
 * @internal
 */
export function initBaseEngineState(overrides: Partial<BaseEngineState> = {}, options: IBaseEngineOptions = {}): BaseEngineState {
    const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;

    const limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;

    options.deterministicLockstep = options.deterministicLockstep ?? false;
    options.lockstepMaxSteps = options.lockstepMaxSteps ?? 4;
    options.timeStep = options.timeStep ?? 1 / 60;
    options.stencil = options.stencil ?? true;

    // TODO - this needs to be a module as well
    PerformanceConfigurator.SetMatrixPrecision(!!options.useHighPrecisionMatrix);

    const engineState: BaseEngineStateFull = {
        // module: {},
        _uniqueId: engineCounter++,
        _type: EngineType.BASE,
        description: "Babylon.js Base Engine",
        name: "Base",
        _version: 1,
        _isDisposed: false,
        get isDisposed(): boolean {
            return engineState._isDisposed;
        },
        forcePOTTextures: false,
        isFullscreen: false,
        cullBackFaces: null,
        renderEvenInBackground: true,
        preventCacheWipeBetweenFrames: false,
        validateShaderPrograms: false,
        _useReverseDepthBuffer: false,
        get useReverseDepthBuffer(): boolean {
            return engineState._useReverseDepthBuffer;
        },
        set useReverseDepthBuffer(useReverse: boolean) {
            if (useReverse === engineState._useReverseDepthBuffer) {
                return;
            }

            engineState._useReverseDepthBuffer = useReverse;
            if (engineState._depthCullingState) {
                if (useReverse) {
                    engineState._depthCullingState.depthFunc = GEQUAL;
                } else {
                    engineState._depthCullingState.depthFunc = LEQUAL;
                }
            }
        },
        isNDCHalfZRange: false,
        hasOriginBottomLeft: true,
        disableUniformBuffers: false,
        onDisposeObservable: new Observable<IBaseEnginePublic>(),
        _frameId: 0,
        get frameId(): number {
            return engineState._frameId;
        },
        startTime: PrecisionDate.Now,
        get needPOTTextures(): boolean {
            return engineState.forcePOTTextures;
        },
        _renderingQueueLaunched: false,
        _activeRenderLoops: new Array<() => void>(),
        get activeRenderLoops(): Array<() => void> {
            return engineState._activeRenderLoops;
        },
        onContextLostObservable: new Observable<IBaseEnginePublic>(),
        onContextRestoredObservable: new Observable<IBaseEnginePublic>(),
        doNotHandleContextLost: false,
        disableVertexArrayObjects: false,
        adaptToDeviceRatio: options.adaptToDeviceRatio ?? false,
        get currentViewport() {
            return engineState._cachedViewport;
        },
        premultipliedAlpha: true,
        onBeforeTextureInitObservable: new Observable<Texture>(),
        get isWebGPU(): boolean {
            return engineState._type === EngineType.WEBGPU;
        },
        get shaderPlatformName(): string {
            return engineState._shaderPlatformName;
        },
        get supportsUniformBuffers(): boolean {
            return false;
        },
        useExactSrgbConversions: options.useExactSrgbConversions || false,

        // internals
        _uniformBuffers: [],
        _storageBuffers: [],
        _windowIsBackground: false,
        get _shouldUseHighPrecisionShader(): boolean {
            return !!(engineState._caps.highPrecisionShaderSupported && engineState._highPrecisionShadersAllowed);
        },
        _badOS: false,
        _badDesktopOS: false,
        _contextWasLost: false,
        _internalTexturesCache: [],
        _renderTargetWrapperCache: [],
        _activeChannel: 0,
        _currentTextureChannel: -1,
        _boundTexturesCache: {},
        _compiledEffects: {},
        _vertexAttribArraysEnabled: [],
        _lastDevicePixelRatio: devicePixelRatio,
        _hardwareScalingLevel: options.adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0,
        _transformTextureUrl: null, // can be moved out, probably
        _renderWidthOverride: null,
        _creationOptions: options,
        _isStencilEnable: !!options.stencil,

        // Missing vars
        _shaderProcessor: null,
        _renderingCanvas: null,
        _caps: {} as EngineCapabilities,
        _features: {} as EngineFeatures,
        _alphaState: new AlphaState(),
        _alphaMode: ALPHA_ADD,
        _alphaEquation: ALPHA_DISABLE,
        _currentRenderTarget: null,
        _boundRenderFunction: () => void 0,
        _frameHandler: -1,

        _highPrecisionShadersAllowed: true, // part of options, can be removed?
        _colorWrite: true,
        _colorWriteChanged: true,
        _depthCullingState: null,
        _currentEffect: null,
        _cachedViewport: null,
        _workingCanvas: null,
        _workingContext: null,
        _shaderPlatformName: "",
        _emptyTexture: null,
        _emptyCubeTexture: null,
        _emptyTexture3D: null,
        _emptyTexture2DArray: null,
        _dimensionsObject: null,
        _viewportCached: { x: 0, y: 0, z: 0, w: 0 },
    };

    // TODO is getOwnPropertyDescriptors supported in native? if it doesn't we will need to use getOwnPropertyNames
    // Extend the engine state with the overrides
    Object.defineProperties(engineState, Object.getOwnPropertyDescriptors(overrides));

    // TODO - this actually prevents tree shaking. Should be done by the dev, apart from the most basic functions.
    // populateBaseModule(engineState);

    return engineState;
}

/**
 * Resize the view according to the canvas' size
 * @param engineState defines the engine state
 * @param forceSetSize true to force setting the sizes of the underlying canvas
 */
export function resize(engineState: IBaseEnginePublic, forceSetSize = false): void {
    let width: number;
    let height: number;
    const fes = engineState as BaseEngineState;

    // Re-query hardware scaling level to handle zoomed-in resizing.
    if (engineState.adaptToDeviceRatio) {
        const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;
        const changeRatio = fes._lastDevicePixelRatio / devicePixelRatio;
        fes._lastDevicePixelRatio = devicePixelRatio;
        fes._hardwareScalingLevel *= changeRatio;
    }

    if (IsWindowObjectExist() && IsDocumentAvailable()) {
        // make sure it is a Node object, and is a part of the document.
        if (fes._renderingCanvas) {
            const boundingRect = fes._renderingCanvas.getBoundingClientRect
                ? fes._renderingCanvas.getBoundingClientRect()
                : {
                      // fallback to last solution in case the function doesn't exist
                      width: fes._renderingCanvas.width * fes._hardwareScalingLevel,
                      height: fes._renderingCanvas.height * fes._hardwareScalingLevel,
                  };
            width = fes._renderingCanvas.clientWidth || boundingRect.width || fes._renderingCanvas.width || 100;
            height = fes._renderingCanvas.clientHeight || boundingRect.height || fes._renderingCanvas.height || 100;
        } else {
            width = window.innerWidth;
            height = window.innerHeight;
        }
    } else {
        width = fes._renderingCanvas ? fes._renderingCanvas.width : 100;
        height = fes._renderingCanvas ? fes._renderingCanvas.height : 100;
    }

    setSize(engineState, width / fes._hardwareScalingLevel, height / fes._hardwareScalingLevel, forceSetSize);
}

/**
 * Force a specific size of the canvas
 * @param engineState defines the engine state
 * @param width defines the new canvas' width
 * @param height defines the new canvas' height
 * @param forceSetSize true to force setting the sizes of the underlying canvas
 * @returns true if the size was changed
 */
export function setSize(engineState: IBaseEnginePublic, width: number, height: number, forceSetSize = false): boolean {
    const fes = engineState as BaseEngineState;
    if (!fes._renderingCanvas) {
        return false;
    }

    width = width | 0;
    height = height | 0;

    if (!forceSetSize && fes._renderingCanvas.width === width && fes._renderingCanvas.height === height) {
        return false;
    }

    fes._renderingCanvas.width = width;
    fes._renderingCanvas.height = height;

    return true;
}

function _rebuildInternalTextures(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    const currentState = fes._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

    for (const internalTexture of currentState) {
        internalTexture._rebuild();
    }
}

function _rebuildRenderTargetWrappers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    const currentState = fes._renderTargetWrapperCache.slice(); // Do a copy because the rebuild will add proxies

    for (const renderTargetWrapper of currentState) {
        renderTargetWrapper._rebuild();
    }
}

function _rebuildEffects(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    for (const key in fes._compiledEffects) {
        const effect = <Effect>fes._compiledEffects[key];

        effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }

    Effect.ResetCache();
}

function _getShaderProcessor(engineState: IBaseEnginePublic, _shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
    const fes = engineState as BaseEngineState;
    return fes._shaderProcessor;
}

/**
 * Gets the default empty texture
 * @param engineState defines the engine state
 * @param createRawTexture defines a function used to create the raw texture from the rawTexture extension
 * @returns the default empty texture
 */
export function getEmptyTexture(engineState: IBaseEnginePublic, { createRawTexture }: Pick<IRawTextureEngineExtension, "createRawTexture">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture) {
        (engineState as BaseEngineStateFull)._emptyTexture = createRawTexture(engineState, new Uint8Array(4), 1, 1, TEXTUREFORMAT_RGBA, false, false, TEXTURE_NEAREST_SAMPLINGMODE);
    }
    return (engineState as BaseEngineStateFull)._emptyTexture;
}

/**
 * Gets the default empty 3D texture
 * @param engineState defines the engine state
 * @param createRawTexture3D defines a function used to create the raw texture from the rawTexture extension
 * @returns the default empty 3D texture
 */
export function getEmptyTexture3D(engineState: IBaseEnginePublic, { createRawTexture3D }: Pick<IRawTextureEngineExtension, "createRawTexture3D">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture3D) {
        (engineState as BaseEngineStateFull)._emptyTexture3D = createRawTexture3D(
            engineState,
            new Uint8Array(4),
            1,
            1,
            1,
            TEXTUREFORMAT_RGBA,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyTexture3D;
}

/**
 * Gets the default empty texture 2D
 * @param engineState defines the engine state
 * @param createRawCubeTexture defines a function used to create the raw texture 2D from the rawTexture extension
 * @returns the default empty texture 2D
 */
export function getEmptyTexture2DArray(
    engineState: IBaseEnginePublic,
    { createRawTexture2DArray }: Pick<IRawTextureEngineExtension, "createRawTexture2DArray">
): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture2DArray) {
        (engineState as BaseEngineStateFull)._emptyTexture2DArray = createRawTexture2DArray(
            engineState,
            new Uint8Array(4),
            1,
            1,
            1,
            TEXTUREFORMAT_RGBA,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyTexture2DArray;
}

/**
 * Gets the default empty cube texture
 * @param engineState defines the engine state
 * @param createRawCubeTexture defines a function used to create the raw cube texture from the rawTexture extension
 * @returns the default empty cube texture
 */
export function getEmptyCubeTexture(engineState: IBaseEnginePublic, { createRawCubeTexture }: Pick<IRawTextureEngineExtension, "createRawCubeTexture">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyCubeTexture) {
        const faceData = new Uint8Array(4);
        const cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
        (engineState as BaseEngineStateFull)._emptyCubeTexture = createRawCubeTexture(
            engineState,
            cubeData,
            1,
            TEXTUREFORMAT_RGBA,
            TEXTURETYPE_UNSIGNED_INT,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyCubeTexture;
}

/**
 * Gets a boolean indicating if all created effects are ready
 * @param engineState defines the engine state
 * @returns true if all effects are ready
 */
export function areAllEffectsReady(engineState: IBaseEnginePublic): boolean {
    const fes = engineState as BaseEngineState;
    for (const key in fes._compiledEffects) {
        const effect = <Effect>fes._compiledEffects[key];

        if (!effect.isReady()) {
            return false;
        }
    }

    return true;
}

/**
 * @internal
 */
export function _rebuildBuffers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    // Uniforms
    for (const uniformBuffer of fes._uniformBuffers) {
        uniformBuffer._rebuild();
    }
    // Storage buffers
    for (const storageBuffer of fes._storageBuffers) {
        storageBuffer._rebuild();
    }
}

/**
 * Reset the texture cache to empty state
 */
export function resetTextureCache(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    for (const key in fes._boundTexturesCache) {
        if (!Object.prototype.hasOwnProperty.call(fes._boundTexturesCache, key)) {
            continue;
        }
        fes._boundTexturesCache[key] = null;
    }

    fes._currentTextureChannel = -1;
}

/**
 * Defines the hardware scaling level.
 * By default the hardware scaling level is computed from the window device ratio.
 * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
 * @param level defines the level to use
 */
export function setHardwareScalingLevel(engineState: IBaseEnginePublic, level: number): void {
    const fes = engineState as BaseEngineStateFull;
    fes._hardwareScalingLevel = level;
    resize(engineState);
}

/**
 * Register and execute a render loop. The engine can have more than one render function
 * @param engineState defines the engine state
 * @param renderFunction defines the function to continuously execute
 */
export function runRenderLoop(
    {
        beginFrameFunc,
        endFrameFunc = endFrame,
        queueNewFrameFunc = QueueNewFrame,
    }: {
        beginFrameFunc?: (engineState: IBaseEnginePublic) => void;
        endFrameFunc: (engineState: IBaseEnginePublic) => void;
        queueNewFrameFunc?: (func: FrameRequestCallback, requester?: any) => number;
    },
    engineState: IBaseEnginePublic,
    renderFunction: () => void
): void {
    const fes = engineState as BaseEngineStateFull;
    if (fes._activeRenderLoops.indexOf(renderFunction) !== -1) {
        return;
    }

    fes._activeRenderLoops.push(renderFunction);

    if (!fes._renderingQueueLaunched) {
        fes._renderingQueueLaunched = true;
        _renderLoop({ beginFrameFunc, endFrameFunc, queueNewFrameFunc }, engineState);
        fes._boundRenderFunction = _renderLoop.bind(null, engineState, { beginFrameFunc, endFrameFunc, queueNewFrameFunc });
        fes._frameHandler = queueNewFrameFunc(fes._boundRenderFunction, getHostWindow(engineState));
    }
}

/**
 * stop executing a render loop function and remove it from the execution array
 * @param engineState defines the engine state
 * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
 */
export function stopRenderLoop(engineState: IBaseEnginePublic, renderFunction?: () => void, cancelFrame = _cancelFrame): void {
    const fes = engineState as BaseEngineState;
    if (!renderFunction) {
        fes._activeRenderLoops.length = 0;
        cancelFrame(engineState);
        return;
    }

    const index = fes._activeRenderLoops.indexOf(renderFunction);

    if (index >= 0) {
        fes._activeRenderLoops.splice(index, 1);
        if (fes._activeRenderLoops.length == 0) {
            cancelFrame(engineState);
        }
    }
}

/**
 * Enf the current frame
 */
export function endFrame(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    fes._frameId++;
}

// Was protected, now passed as a variable
function _cancelFrame(engineState: IBaseEnginePublic) {
    const fes = engineState as BaseEngineState;
    if (fes._renderingQueueLaunched && fes._frameHandler) {
        fes._renderingQueueLaunched = false;
        if (!IsWindowObjectExist()) {
            if (typeof cancelAnimationFrame === "function") {
                return cancelAnimationFrame(fes._frameHandler);
            }
        } else {
            const { cancelAnimationFrame } = getHostWindow(engineState) || window;
            if (typeof cancelAnimationFrame === "function") {
                return cancelAnimationFrame(fes._frameHandler);
            }
        }
        return clearTimeout(fes._frameHandler);
    }
}

/** @internal */
export function _renderLoop(
    {
        queueNewFrameFunc = QueueNewFrame,
        endFrameFunc = endFrame,
        beginFrameFunc,
    }: {
        beginFrameFunc?: (engineState: IBaseEnginePublic) => void;
        endFrameFunc?: typeof endFrame;
        queueNewFrameFunc: typeof QueueNewFrame;
    },
    engineState: IBaseEnginePublic
): void {
    const fes = engineState as BaseEngineState;
    if (!fes._contextWasLost) {
        let shouldRender = true;
        if (fes._isDisposed || (!fes.renderEvenInBackground && fes._windowIsBackground)) {
            shouldRender = false;
        }

        if (shouldRender) {
            // Start new frame
            beginFrameFunc?.(engineState);

            for (let index = 0; index < fes._activeRenderLoops.length; index++) {
                const renderFunction = fes._activeRenderLoops[index];

                renderFunction();
            }

            // Present
            endFrameFunc(engineState);
        }
    }

    if (fes._activeRenderLoops.length > 0) {
        fes._frameHandler = queueNewFrameFunc(fes._boundRenderFunction, getHostWindow(engineState));
    } else {
        fes._renderingQueueLaunched = false;
    }
}

/**
 * Gets host window
 * @returns the host window object
 */
export function getHostWindow(engineState: IBaseEnginePublic): Nullable<Window> {
    const fes = engineState as BaseEngineState;
    if (!IsWindowObjectExist()) {
        return null;
    }

    if (fes._renderingCanvas && fes._renderingCanvas.ownerDocument && fes._renderingCanvas.ownerDocument.defaultView) {
        return fes._renderingCanvas.ownerDocument.defaultView;
    }

    return window;
}

/**
 * Gets the current render width
 * @param engineState defines the engine state
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the current render width
 */
export function getRenderWidth<T extends IBaseEnginePublic = IBaseEnginePublic>(engineState: T, useScreen = false): number {
    const fes = engineState as BaseEngineState<T>;
    if (!useScreen && fes._currentRenderTarget) {
        return fes._currentRenderTarget.width;
    }

    return fes._dimensionsObject ? fes._dimensionsObject.width : 0;
}

/**
 * Gets the current render height
 * @param engineState defines the engine state
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the current render height
 */
export function getRenderHeight<T extends IBaseEnginePublic = IBaseEnginePublic>(engineState: T, useScreen = false): number {
    const fes = engineState as BaseEngineState<T>;
    if (!useScreen && fes._currentRenderTarget) {
        return fes._currentRenderTarget.height;
    }

    return fes._dimensionsObject ? fes._dimensionsObject.width : 0;
}

/**
 * Set the WebGL's viewport
 * @param viewport defines the viewport element to be used
 * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
 * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
 */
export function setViewport<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        viewportChangedFunc = _viewport,
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        viewportChangedFunc: (engineState: T, x: number, y: number, width: number, height: number) => void;
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T,
    viewport: IViewportLike,
    requiredWidth?: number,
    requiredHeight?: number
): void {
    const width = requiredWidth || getRenderWidthFunc(engineState);
    const height = requiredHeight || getRenderHeightFunc(engineState);
    const x = viewport.x || 0;
    const y = viewport.y || 0;

    (engineState as BaseEngineState<T>)._cachedViewport = viewport;

    viewportChangedFunc(engineState, x * width, y * height, width * viewport.width, height * viewport.height);
}

/**
 * @internal
 */
export function _viewport(engineState: IBaseEnginePublic, x: number, y: number, width: number, height: number): void {
    const fes = engineState as BaseEngineState;
    fes._viewportCached.x = x;
    fes._viewportCached.y = y;
    fes._viewportCached.z = width;
    fes._viewportCached.w = height;
}

/**
 * Send a draw order
 * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
 * @param indexStart defines the starting index
 * @param indexCount defines the number of index to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function draw(
    { drawElementsType }: { drawElementsType: (engineState: IBaseEnginePublic, fillMode: number, indexStart: number, indexCount: number, instancesCount?: number) => void },
    engineState: IBaseEnginePublic,
    useTriangles: boolean,
    indexStart: number,
    indexCount: number,
    instancesCount?: number
): void {
    drawElementsType(engineState, useTriangles ? MATERIAL_TriangleFillMode : MATERIAL_WireFrameFillMode, indexStart, indexCount, instancesCount);
}

/**
 * Draw a list of points
 * @param verticesStart defines the index of first vertex to draw
 * @param verticesCount defines the count of vertices to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawPointClouds(
    { drawArraysType }: { drawArraysType: (engineState: IBaseEnginePublic, fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number) => void },
    engineState: IBaseEnginePublic,
    verticesStart: number,
    verticesCount: number,
    instancesCount?: number
): void {
    drawArraysType(engineState, MATERIAL_PointFillMode, verticesStart, verticesCount, instancesCount);
}

/**
 * Draw a list of unindexed primitives
 * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
 * @param verticesStart defines the index of first vertex to draw
 * @param verticesCount defines the count of vertices to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawUnIndexed(
    { drawArraysType }: { drawArraysType: (engineState: IBaseEnginePublic, fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number) => void },
    engineState: IBaseEnginePublic,
    useTriangles: boolean,
    verticesStart: number,
    verticesCount: number,
    instancesCount?: number
): void {
    drawArraysType(engineState, useTriangles ? MATERIAL_TriangleFillMode : MATERIAL_WireFrameFillMode, verticesStart, verticesCount, instancesCount);
}

/**
 * @internal
 */
export function _releaseEffect(
    { _deletePipelineContext }: { _deletePipelineContext: (engineState: IBaseEnginePublic, pipelineContext: IPipelineContext) => void },
    engineState: IBaseEnginePublic,
    effect: Effect
): void {
    const fes = engineState as BaseEngineState;
    if (fes._compiledEffects[effect._key]) {
        delete fes._compiledEffects[effect._key];
    }
    const pipelineContext = effect.getPipelineContext();
    if (pipelineContext) {
        _deletePipelineContext(engineState, pipelineContext);
    }
}

/** @internal */
export function _getGlobalDefines(engineState: IBaseEnginePublic, defines?: { [key: string]: string }): string | undefined {
    if (defines) {
        if (engineState.isNDCHalfZRange) {
            defines["IS_NDC_HALF_ZRANGE"] = "";
        } else {
            delete defines["IS_NDC_HALF_ZRANGE"];
        }
        if (engineState.useReverseDepthBuffer) {
            defines["USE_REVERSE_DEPTHBUFFER"] = "";
        } else {
            delete defines["USE_REVERSE_DEPTHBUFFER"];
        }
        if (engineState.useExactSrgbConversions) {
            defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
        } else {
            delete defines["USE_EXACT_SRGB_CONVERSIONS"];
        }
        return;
    } else {
        let s = "";
        if (engineState.isNDCHalfZRange) {
            s += "#define IS_NDC_HALF_ZRANGE";
        }
        if (engineState.useReverseDepthBuffer) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_REVERSE_DEPTHBUFFER";
        }
        if (engineState.useExactSrgbConversions) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_EXACT_SRGB_CONVERSIONS";
        }
        return s;
    }
}
