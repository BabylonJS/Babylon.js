/* eslint-disable jsdoc/require-jsdoc */
import { Effect } from "core/Materials/effect";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import type { Observer } from "core/Misc/observable";
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
    TEXTURE_TRILINEAR_SAMPLINGMODE,
} from "./engine.constants.js";
import { PrecisionDate } from "core/Misc/precisionDate";
import type { PerfCounter } from "core/Misc/perfCounter";
import type { StorageBuffer } from "core/Buffers";
import type { EngineCapabilities } from "core/Engines/engineCapabilities";
import type { EngineFeatures } from "core/Engines/engineFeatures";
import type { DepthCullingState } from "core/States/depthCullingState";
import { AlphaState } from "core/States/alphaCullingState";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { IViewportLike } from "core/Maths/math.like";
import type { ICanvas, ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { IFileRequest } from "core/Misc/fileRequest";
import type { IRawTextureEngineExtension } from "./Extensions/rawTexture/engine.rawTexture.base.js";
import type { Texture } from "core/Materials/Textures/texture";
import type { ISceneLike } from "./engine.interfaces.js";
import { EngineType } from "./engine.interfaces.js";
import { IsDocumentAvailable, IsWindowObjectExist, hostInformation } from "./runtimeEnvironment.js";
import { PerformanceConfigurator } from "core/Engines/performanceConfigurator";
import { EngineStore, QueueNewFrame, _CreateCanvas, _RequestPointerlock, _TextureLoaders } from "./engine.static.js";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import type { IInternalTextureLoader } from "core/Materials/Textures/internalTextureLoader";
import { Logger } from "core/Misc/logger";
import type { IWebRequest } from "core/Misc/interfaces/iWebRequest";
import { _loadFile } from "./engine.tools.js";
import { LoadImage } from "core/Misc/fileTools";
import type { ThinEngine } from "core/Engines/thinEngine";
import { PerformanceMonitor } from "core/Misc/performanceMonitor";
import type { StencilStateComposer } from "core/States/stencilStateComposer";
import type { StencilState } from "core/States/stencilState";
import type { Scene } from "core/scene";
import type { PostProcess } from "core/PostProcesses/postProcess";

/**
 * Defines the interface used by objects containing a viewport (like a camera)
 */
interface IViewportOwnerLike {
    /**
     * Gets or sets the viewport
     */
    viewport: IViewportLike;
}

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
    _activeRequests: IFileRequest[]; // - moved to the scope of this file, privately. Maps object to IFileRequest.
    // _checkForMobile - moved to hostInformation

    _onFocus?: () => void;
    _onBlur?: () => void;
    _onCanvasPointerOut?: (event: PointerEvent) => void;
    _onCanvasBlur?: () => void;
    _onCanvasFocus?: () => void;
    _onCanvasContextMenu?: (evt: Event) => void;

    _onFullscreenChange?: () => void;
    _onPointerLockChange?: () => void;

    _pointerLockRequested: boolean;

    _checkForMobile?: () => void;
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
    _stencilStateComposer: Nullable<StencilStateComposer>;
    _stencilState: Nullable<StencilState>;
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
    _emptyTexture: Nullable<InternalTexture>;
    _emptyCubeTexture: Nullable<InternalTexture>;
    _emptyTexture3D: Nullable<InternalTexture>;
    _emptyTexture2DArray: Nullable<InternalTexture>;
    _performanceMonitor: Nullable<PerformanceMonitor>;
    _fps: number;
    _deltaTime: number;
    // Deterministic lockstepMaxSteps
    _deterministicLockstep: boolean;
    _lockstepMaxSteps: number;
    _timeStep: number;
}

export interface IBaseEngineInternals {
    // description: string;
    _version: number;
    _frameId: number;
    _uniformBuffers: Array<UniformBuffer>;
    _storageBuffers: Array<StorageBuffer>;
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
    _boundRenderFunction: Nullable<FrameRequestCallback>;
    _frameHandler: number;
    _transformTextureUrl: Nullable<(url: string) => string>; // can move out?
    // replacing _framebufferDimensionsObject
    _renderWidthOverride: Nullable<{ width: number; height: number }>;
    _dimensionsObject: Nullable<{ width: number; height: number }>;
    _drawCalls?: PerfCounter;
}

/**
 * Engine state's public API.
 */
export interface IBaseEnginePublic {
    /**
     * Gets the current engine unique identifier
     */
    uniqueId: number;
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

    /**
     * Observable raised when the engine begins a new frame
     */
    readonly onBeginFrameObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable raised when the engine ends the current frame
     */
    readonly onEndFrameObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable raised when the engine is about to compile a shader
     */
    readonly onBeforeShaderCompilationObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable raised when the engine has just compiled a shader
     */
    readonly onAfterShaderCompilationObservable: Observable<IBaseEnginePublic>;

    /**
     * Gets the list of created scenes
     */
    readonly scenes: Scene[];

    /**
     * Gets the list of created postprocesses
     */
    readonly postProcesses: PostProcess[];

    /**
     * Observable event triggered each time the rendering canvas is resized
     */
    readonly onResizeObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable event triggered each time the canvas loses focus
     */
    readonly onCanvasBlurObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable event triggered each time the canvas gains focus
     */
    readonly onCanvasFocusObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable event triggered each time the canvas receives pointerout event
     */
    readonly onCanvasPointerOutObservable: Observable<PointerEvent>;

    /**
     * Gets or sets a boolean to enable/disable the context menu (right-click) from appearing on the main canvas
     */
    disableContextMenu: boolean;

    /**
     * Turn this value on if you want to pause FPS computation when in background
     */
    disablePerformanceMonitorInBackground: boolean;
    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    isPointerLock: boolean;

    /**
     * Returns true if the stencil buffer has been enabled through the creation option of the context.
     */
    isStencilEnable: boolean;
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
        uniqueId: engineCounter++,
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
        onBeginFrameObservable: new Observable<IBaseEnginePublic>(),
        onEndFrameObservable: new Observable<IBaseEnginePublic>(),
        onBeforeShaderCompilationObservable: new Observable<IBaseEnginePublic>(),
        onAfterShaderCompilationObservable: new Observable<IBaseEnginePublic>(),
        scenes: [],
        postProcesses: [],
        onResizeObservable: new Observable<IBaseEnginePublic>(),
        onCanvasBlurObservable: new Observable<IBaseEnginePublic>(),
        onCanvasFocusObservable: new Observable<IBaseEnginePublic>(),
        onCanvasPointerOutObservable: new Observable<PointerEvent>(),
        disableContextMenu: true,
        disablePerformanceMonitorInBackground: false,
        isPointerLock: false,
        get isStencilEnable(): boolean {
            return engineState._isStencilEnable;
        },

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
        _stencilStateComposer: null,
        _stencilState: null,
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
        _activeRequests: [],
        _performanceMonitor: null,
        _fps: 60,
        _deltaTime: 0,
        _pointerLockRequested: false,
        _deterministicLockstep: false,
        _lockstepMaxSteps: 4,
        _timeStep: 1 / 60,
    };

    // TODO is getOwnPropertyDescriptors supported in native? if it doesn't we will need to use getOwnPropertyNames
    // Extend the engine state with the overrides
    Object.defineProperties(engineState, Object.getOwnPropertyDescriptors(overrides));

    // TODO - this actually prevents tree shaking. Should be done by the dev, apart from the most basic functions.
    // populateBaseModule(engineState);

    EngineStore.Instances.push(engineState);

    return engineState;
}

export function getPerformanceMonitor(engineState: IBaseEnginePublic): PerformanceMonitor {
    if (!(engineState as BaseEngineStateFull)._performanceMonitor) {
        (engineState as BaseEngineStateFull)._performanceMonitor = new PerformanceMonitor();
    }
    return (engineState as BaseEngineStateFull)._performanceMonitor as PerformanceMonitor;
}

export function getFps(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineStateFull)._fps;
}

export function getDeltaTime(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineStateFull)._deltaTime;
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
export function getEmptyCubeTexture(engineState: IBaseEnginePublic, { createRawCubeTexture }: Pick<IRawTextureEngineExtension, "createRawCubeTexture">): InternalTexture {
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
    return (engineState as BaseEngineStateFull)._emptyCubeTexture as InternalTexture;
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
        fes._frameHandler = queueNewFrameFunc(fes._boundRenderFunction!, getHostWindow(engineState));
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

    if (fes._activeRenderLoops.length > 0 && fes._boundRenderFunction) {
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
 * Gets host document
 * @returns the host document object
 */
export function getHostDocument(engineState: IBaseEnginePublic): Nullable<Document> {
    const fes = engineState as BaseEngineState;
    if (fes._renderingCanvas && fes._renderingCanvas.ownerDocument) {
        return fes._renderingCanvas.ownerDocument;
    }

    return IsDocumentAvailable() ? document : null;
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

/**
 * Clears the list of texture accessible through engine.
 * This can help preventing texture load conflict due to name collision.
 */
export function clearInternalTexturesCache(engineState: IBaseEnginePublic) {
    (engineState as BaseEngineStateFull)._internalTexturesCache.length = 0;
}

export function _createTextureBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        getUseSRGBBuffer,
        engineAdapter,
    }: {
        getUseSRGBBuffer: (engineState: T, useSRGBBuffer: boolean, noMipmap: boolean) => boolean;
        engineAdapter?: ThinEngine;
    },
    engineState: T,
    url: Nullable<string>,
    noMipmap: boolean,
    invertY: boolean,
    scene: Nullable<ISceneLike>,
    samplingMode: number = TEXTURE_TRILINEAR_SAMPLINGMODE,
    onLoad: Nullable<(texture: InternalTexture) => void> = null,
    onError: Nullable<(message: string, exception: any) => void> = null,
    prepareTexture: (
        texture: InternalTexture,
        extension: string,
        scene: Nullable<ISceneLike>,
        img: HTMLImageElement | ImageBitmap | { width: number; height: number },
        invertY: boolean,
        noMipmap: boolean,
        isCompressed: boolean,
        processFunction: (
            width: number,
            height: number,
            img: HTMLImageElement | ImageBitmap | { width: number; height: number },
            extension: string,
            texture: InternalTexture,
            continuationCallback: () => void
        ) => boolean,
        samplingMode: number
    ) => void,
    prepareTextureProcessFunction: (
        width: number,
        height: number,
        img: HTMLImageElement | ImageBitmap | { width: number; height: number },
        extension: string,
        texture: InternalTexture,
        continuationCallback: () => void
    ) => boolean,
    buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
    fallback: Nullable<InternalTexture> = null,
    format: Nullable<number> = null,
    forcedExtension: Nullable<string> = null,
    mimeType?: string,
    loaderOptions?: any,
    useSRGBBuffer?: boolean
): InternalTexture {
    const fes = engineState as BaseEngineStateFull<T>;
    url = url || "";
    const fromData = url.substring(0, 5) === "data:";
    const fromBlob = url.substring(0, 5) === "blob:";
    const isBase64 = fromData && url.indexOf(";base64,") !== -1;

    if (!engineAdapter && !fallback) {
        throw new Error("either engineAdapter or fallback are required");
    }

    const texture = fallback ? fallback : new InternalTexture(engineAdapter!, InternalTextureSource.Url);

    if (texture !== fallback) {
        texture.label = url.substring(0, 60); // default label, can be overriden by the caller
    }

    const originalUrl = url;
    if (fes._transformTextureUrl && !isBase64 && !fallback && !buffer) {
        url = fes._transformTextureUrl(url);
    }

    if (originalUrl !== url) {
        texture._originalUrl = originalUrl;
    }

    // establish the file extension, if possible
    const lastDot = url.lastIndexOf(".");
    let extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";
    let loader: Nullable<IInternalTextureLoader> = null;

    // Remove query string
    const queryStringIndex = extension.indexOf("?");

    if (queryStringIndex > -1) {
        extension = extension.split("?")[0];
    }

    for (const availableLoader of _TextureLoaders) {
        if (availableLoader.canLoad(extension, mimeType)) {
            loader = availableLoader;
            break;
        }
    }

    if (scene) {
        scene.addPendingData(texture);
    }
    texture.url = url;
    texture.generateMipMaps = !noMipmap;
    texture.samplingMode = samplingMode;
    texture.invertY = invertY;
    texture._useSRGBBuffer = getUseSRGBBuffer(engineState, !!useSRGBBuffer, noMipmap);

    if (!fes.doNotHandleContextLost) {
        // Keep a link to the buffer only if we plan to handle context lost
        texture._buffer = buffer;
    }

    let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
    if (onLoad && !fallback) {
        onLoadObserver = texture.onLoadedObservable.add(onLoad);
    }

    if (!fallback) {
        fes._internalTexturesCache.push(texture);
    }

    const onInternalError = (message?: string, exception?: any) => {
        if (scene) {
            scene.removePendingData(texture);
        }

        if (url === originalUrl) {
            if (onLoadObserver) {
                texture.onLoadedObservable.remove(onLoadObserver);
            }

            if (EngineStore.UseFallbackTexture) {
                _createTextureBase(
                    {
                        getUseSRGBBuffer,
                        engineAdapter,
                    },
                    engineState,
                    EngineStore.FallbackTexture,
                    noMipmap,
                    texture.invertY,
                    scene,
                    samplingMode,
                    null,
                    onError,
                    prepareTexture,
                    prepareTextureProcessFunction,
                    buffer,
                    texture
                );
            }

            message = (message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : "");
            texture.onErrorObservable.notifyObservers({ message, exception });
            if (onError) {
                onError(message, exception);
            }
        } else {
            // fall back to the original url if the transformed url fails to load
            Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
            _createTextureBase(
                {
                    getUseSRGBBuffer,
                    engineAdapter,
                },
                engineState,
                originalUrl,
                noMipmap,
                texture.invertY,
                scene,
                samplingMode,
                onLoad,
                onError,
                prepareTexture,
                prepareTextureProcessFunction,
                buffer,
                texture,
                format,
                forcedExtension,
                mimeType,
                loaderOptions,
                useSRGBBuffer
            );
        }
    };

    // processing for non-image formats
    if (loader) {
        const callback = (data: ArrayBufferView) => {
            loader!.loadData(
                data,
                texture,
                (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed) => {
                    if (loadFailed) {
                        onInternalError("TextureLoader failed to load data");
                    } else {
                        prepareTexture(
                            texture,
                            extension,
                            scene,
                            { width, height },
                            texture.invertY,
                            !loadMipmap,
                            isCompressed,
                            () => {
                                done();
                                return false;
                            },
                            samplingMode
                        );
                    }
                },
                loaderOptions
            );
        };

        if (!buffer) {
            _loadFile(
                engineState,
                url,
                (data) => callback(new Uint8Array(data as ArrayBuffer)),
                undefined,
                scene ? scene.offlineProvider : undefined,
                true,
                (request?: IWebRequest, exception?: any) => {
                    onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                }
            );
        } else {
            if (buffer instanceof ArrayBuffer) {
                callback(new Uint8Array(buffer));
            } else if (ArrayBuffer.isView(buffer)) {
                callback(buffer);
            } else {
                if (onError) {
                    onError("Unable to load: only ArrayBuffer or ArrayBufferView is supported", null);
                }
            }
        }
    } else {
        const onload = (img: HTMLImageElement | ImageBitmap) => {
            if (fromBlob && !fes.doNotHandleContextLost) {
                // We need to store the image if we need to rebuild the texture
                // in case of a webgl context lost
                texture._buffer = img;
            }

            prepareTexture(texture, extension, scene, img, texture.invertY, noMipmap, false, prepareTextureProcessFunction, samplingMode);
        };
        // According to the WebGL spec section 6.10, ImageBitmaps must be inverted on creation.
        // So, we pass imageOrientation to _FileToolsLoadImage() as it may create an ImageBitmap.

        if (!fromData || isBase64) {
            if (buffer && (typeof (<HTMLImageElement>buffer).decoding === "string" || (<ImageBitmap>buffer).close)) {
                onload(<HTMLImageElement>buffer);
            } else {
                LoadImage(
                    url,
                    onload,
                    onInternalError,
                    scene ? scene.offlineProvider : null,
                    mimeType,
                    texture.invertY && fes._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
                );
            }
        } else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
            LoadImage(
                buffer,
                onload,
                onInternalError,
                scene ? scene.offlineProvider : null,
                mimeType,
                texture.invertY && fes._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
            );
        } else if (buffer) {
            onload(buffer);
        }
    }

    return texture;
}

/** @internal */
export function _prepareWorkingCanvas(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    if (fes._workingCanvas) {
        return;
    }

    fes._workingCanvas = _CreateCanvas(1, 1);
    const context = fes._workingCanvas.getContext("2d");

    if (context) {
        fes._workingContext = context;
    }
}

export function _setupMobileChecks(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    if (!(navigator && navigator.userAgent)) {
        return;
    }

    // Function to check if running on mobile device
    fes._checkForMobile = () => {
        const currentUA = navigator.userAgent;
        hostInformation.isMobile =
            currentUA.indexOf("Mobile") !== -1 ||
            // Needed for iOS 13+ detection on iPad (inspired by solution from https://stackoverflow.com/questions/9038625/detect-if-device-is-ios)
            (currentUA.indexOf("Mac") !== -1 && IsDocumentAvailable() && "ontouchend" in document);
    };

    // Set initial isMobile value
    fes._checkForMobile();

    // Set up event listener to check when window is resized (used to get emulator activation to work properly)
    if (IsWindowObjectExist()) {
        window.addEventListener("resize", fes._checkForMobile);
    }
}

/**
 * Dispose and release all associated resources
 */
export function dispose(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    fes._isDisposed = true;
    stopRenderLoop(engineState);

    // Clear observables
    if (engineState.onBeforeTextureInitObservable) {
        engineState.onBeforeTextureInitObservable.clear();
    }

    if (IsWindowObjectExist()) {
        if (fes._checkForMobile) {
            window.removeEventListener("resize", fes._checkForMobile);
        }
    }

    fes._workingCanvas = null;
    fes._workingContext = null;
    fes._renderingCanvas = null;

    Effect.ResetCache();

    // Abort active requests
    for (const request of fes._activeRequests) {
        request.abort();
    }

    fes.onDisposeObservable.notifyObservers(fes);
    fes.onDisposeObservable.clear();
}

/**
 * Gets the object containing all engine capabilities
 * @param engineState defines the engine state
 * @returns the EngineCapabilities object
 */
export function getCaps(engineState: IBaseEnginePublic): EngineCapabilities {
    const fes = engineState as BaseEngineState;
    return fes._caps;
}

// From Engine

// createImageBitmap is just a proxy to the browser's native implementation
// Should not be implemented

/**
 * Shared initialization across engines types.
 * @param canvas The canvas associated with this instance of the engine.
 */
export function _sharedInit(engineState: IBaseEnginePublic, canvas: HTMLCanvasElement) {
    const fes = engineState as BaseEngineStateFull;
    // moved from thinEngine
    fes._renderingCanvas = canvas;

    fes._onCanvasFocus = () => {
        fes.onCanvasFocusObservable.notifyObservers(engineState);
    };

    fes._onCanvasBlur = () => {
        fes.onCanvasBlurObservable.notifyObservers(engineState);
    };

    fes._onCanvasContextMenu = (evt: Event) => {
        if (fes.disableContextMenu) {
            evt.preventDefault();
        }
    };

    canvas.addEventListener("focus", fes._onCanvasFocus);
    canvas.addEventListener("blur", fes._onCanvasBlur);
    canvas.addEventListener("contextmenu", fes._onCanvasContextMenu);
    const performanceMonitor = getPerformanceMonitor(engineState);
    fes._onBlur = () => {
        if (fes.disablePerformanceMonitorInBackground) {
            performanceMonitor.disable();
        }
        fes._windowIsBackground = true;
    };

    fes._onFocus = () => {
        if (fes.disablePerformanceMonitorInBackground) {
            performanceMonitor.enable();
        }
        fes._windowIsBackground = false;
    };

    fes._onCanvasPointerOut = (ev) => {
        // Check that the element at the point of the pointer out isn't the canvas and if it isn't, notify observers
        // Note: This is a workaround for a bug with Safari
        if (document.elementFromPoint(ev.clientX, ev.clientY) !== canvas) {
            fes.onCanvasPointerOutObservable.notifyObservers(ev);
        }
    };

    const hostWindow = getHostWindow(engineState); // it calls IsWindowObjectExist()
    if (hostWindow && typeof hostWindow.addEventListener === "function") {
        hostWindow.addEventListener("blur", fes._onBlur);
        hostWindow.addEventListener("focus", fes._onFocus);
    }

    canvas.addEventListener("pointerout", fes._onCanvasPointerOut);

    if (!fes._creationOptions.doNotHandleTouchAction) {
        _disableTouchAction(fes);
    }

    // Create Audio Engine if needed.
    // if (!Engine.audioEngine && fes._creationOptions.audioEngine && Engine.AudioEngineFactory) {
    //     Engine.audioEngine = Engine.AudioEngineFactory(this.getRenderingCanvas(), this.getAudioContext(), this.getAudioDestination());
    // }
    if (IsDocumentAvailable()) {
        // Fullscreen
        fes._onFullscreenChange = () => {
            fes.isFullscreen = !!document.fullscreenElement;

            // Pointer lock
            if (fes.isFullscreen && fes._pointerLockRequested && canvas) {
                _RequestPointerlock(canvas);
            }
        };

        document.addEventListener("fullscreenchange", fes._onFullscreenChange, false);
        document.addEventListener("webkitfullscreenchange", fes._onFullscreenChange, false);

        // Pointer lock
        fes._onPointerLockChange = () => {
            fes.isPointerLock = document.pointerLockElement === canvas;
        };

        document.addEventListener("pointerlockchange", fes._onPointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", fes._onPointerLockChange, false);
    }

    // fes.enableOfflineSupport = Engine.OfflineProviderFactory !== undefined;

    fes._deterministicLockstep = !!fes._creationOptions.deterministicLockstep;
    fes._lockstepMaxSteps = fes._creationOptions.lockstepMaxSteps || 0;
    fes._timeStep = fes._creationOptions.timeStep || 1 / 60;
}

function _disableTouchAction(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    if (!fes._renderingCanvas || !fes._renderingCanvas.setAttribute) {
        return;
    }

    fes._renderingCanvas.setAttribute("touch-action", "none");
    fes._renderingCanvas.style.touchAction = "none";
    (fes._renderingCanvas.style as any).webkitTapHighlightColor = "transparent";
}

/** @internal */
export function _verifyPointerLock(engineState: IBaseEnginePublic): void {
    (engineState as BaseEngineStateFull)._onPointerLockChange?.();
}

/**
 * Gets current aspect ratio
 * @param viewportOwner defines the camera to use to get the aspect ratio
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the aspect ratio
 */
export function getAspectRatio<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T,
    viewportOwner: IViewportOwnerLike,
    useScreen = false
): number {
    const viewport = viewportOwner.viewport;
    return (getRenderWidthFunc(engineState, useScreen) * viewport.width) / (getRenderHeightFunc(engineState, useScreen) * viewport.height);
}

/**
 * Gets current screen aspect ratio
 * @returns a number defining the aspect ratio
 */
export function getScreenAspectRatio<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T
): number {
    return getRenderWidthFunc(engineState, true) / getRenderHeightFunc(engineState, true);
}

/**
 * Gets the client rect of the HTML canvas attached with the current webGL context
 * @returns a client rectangle
 */
export function getRenderingCanvasClientRect(engineState: IBaseEnginePublic): Nullable<ClientRect> {
    const fes = engineState as BaseEngineState;
    if (!fes._renderingCanvas) {
        return null;
    }
    return fes._renderingCanvas.getBoundingClientRect();
}

/**
 * Gets the HTML element used to attach event listeners
 * @returns a HTML element
 */
export function getInputElement(engineState: IBaseEnginePublic): Nullable<HTMLElement> {
    return (engineState as BaseEngineState)._renderingCanvas;
}

/**
 * Gets the client rect of the HTML element used for events
 * @returns a client rectangle
 */
export function getInputElementClientRect(engineState: IBaseEnginePublic): Nullable<ClientRect> {
    const fes = engineState as BaseEngineState;
    if (!fes._renderingCanvas) {
        return null;
    }
    return getInputElement(fes)!.getBoundingClientRect();
}

/**
 * Gets the max steps when engine is running in deterministic lock step
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
 * @returns the max steps
 */
export function getLockstepMaxSteps(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._lockstepMaxSteps;
}

/**
 * Returns the time in ms between steps when using deterministic lock step.
 * @returns time step in (ms)
 */
export function getTimeStep(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._timeStep * 1000;
}
