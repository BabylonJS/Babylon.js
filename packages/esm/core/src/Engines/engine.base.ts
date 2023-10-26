/* eslint-disable jsdoc/require-jsdoc */
import { Effect } from "@babylonjs/core/Materials/effect.js";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { IShaderProcessor } from "@babylonjs/core/Engines/Processors/iShaderProcessor.js";
import type { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { Constants } from "./engine.constants.js";
import { PrecisionDate } from "@babylonjs/core/Misc/precisionDate.js";
import type { PerfCounter } from "@babylonjs/core/Misc/perfCounter.js";
import type { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer.js";
import type { EngineCapabilities } from "@babylonjs/core/Engines/engineCapabilities.js";
import type { EngineFeatures } from "@babylonjs/core/Engines/engineFeatures.js";
import type { DepthCullingState } from "@babylonjs/core/States/depthCullingState.js";
import { AlphaState } from "@babylonjs/core/States/alphaCullingState.js";
import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import type { IViewportLike } from "@babylonjs/core/Maths/math.like.js";
import type { ICanvas, ICanvasRenderingContext } from "@babylonjs/core/Engines/ICanvas.js";
import type { IFileRequest } from "@babylonjs/core/Misc/fileRequest.js";
import type { IRawTextureEngineExtension } from "./Extensions/rawTexture/engine.rawTexture.base.js";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { EngineType } from "./engine.interfaces.js";
import { IsDocumentAvailable, IsWindowObjectExist, hostInformation } from "./runtimeEnvironment.js";
import { PerformanceConfigurator } from "@babylonjs/core/Engines/performanceConfigurator.js";
import { EngineStore, _CreateCanvas, _ExitFullscreen, _ExitPointerlock, _RequestFullscreen, _RequestPointerlock } from "./engine.static.js";
import { PerformanceMonitor } from "@babylonjs/core/Misc/performanceMonitor.js";
import type { StencilStateComposer } from "@babylonjs/core/States/stencilStateComposer.js";
import type { StencilState } from "@babylonjs/core/States/stencilState.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { PostProcess } from "@babylonjs/core/PostProcesses/postProcess.js";
import type { ICustomAnimationFrameRequester } from "@babylonjs/core/Misc/customAnimationFrameRequester.js";
import type { ILoadingScreen } from "public/@babylonjs/core/Loading/loadingScreen.js";

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

    _cachedStencilBuffer: boolean;
    _cachedStencilFunction: number;
    _cachedStencilMask: number;
    _cachedStencilOperationPass: number;
    _cachedStencilOperationFail: number;
    _cachedStencilOperationDepthFail: number;
    _cachedStencilReference: number;
    _renderPassNames: string[];

    _loadingScreen?: ILoadingScreen;
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
    _depthCullingState?: DepthCullingState;
    _stencilStateComposer?: StencilStateComposer;
    _stencilState?: StencilState;
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
    _virtualScenes: Scene[];
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

    // From Engine
    /**
     * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
     **/
    enableOfflineSupport: boolean; // TODO - is that the best way to solve this?

    /**
     * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
     **/
    disableManifestCheck: boolean;

    /**
     * Gets or sets a boolean to enable/disable the context menu (right-click) from appearing on the main canvas
     */
    disableContextMenu: boolean;

    /**
     * Event raised when a new scene is created
     */
    readonly onNewSceneAddedObservable: Observable<Scene>;

    /**
     * If set, will be used to request the next animation frame for the render loop
     */
    customAnimationFrameRequester: Nullable<ICustomAnimationFrameRequester>;

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    canvasTabIndex: number;

    /**
     * Gets or sets the current render pass id
     */
    currentRenderPassId: number;

    /**
     * Gets the current alpha state object
     */
    readonly alphaState: AlphaState;
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
                    engineState._depthCullingState.depthFunc = Constants.GEQUAL;
                } else {
                    engineState._depthCullingState.depthFunc = Constants.LEQUAL;
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
        enableOfflineSupport: false,
        disableManifestCheck: false,
        onNewSceneAddedObservable: new Observable<Scene>(),
        customAnimationFrameRequester: null,
        canvasTabIndex: 1,
        currentRenderPassId: 0,
        get alphaState(): AlphaState {
            return engineState._alphaState;
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
        _virtualScenes: [],

        // Missing vars
        _shaderProcessor: null,
        _renderingCanvas: null,
        _caps: {} as EngineCapabilities,
        _features: {} as EngineFeatures,
        _alphaState: new AlphaState(),
        _alphaMode: Constants.ALPHA_ADD as number,
        _alphaEquation: Constants.ALPHA_DISABLE as number,
        _currentRenderTarget: null,
        _boundRenderFunction: () => void 0,
        _frameHandler: -1,

        _highPrecisionShadersAllowed: true, // part of options, can be removed?
        _colorWrite: true,
        _colorWriteChanged: true,
        // _depthCullingState: null,
        // _stencilStateComposer: null,
        // _stencilState: null,
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
        _renderPassNames: ["main"],
        _cachedStencilBuffer: false,
        _cachedStencilFunction: -1,
        _cachedStencilMask: -1,
        _cachedStencilOperationPass: -1,
        _cachedStencilOperationFail: -1,
        _cachedStencilOperationDepthFail: -1,
        _cachedStencilReference: -1,
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
        (engineState as BaseEngineStateFull)._emptyTexture = createRawTexture(
            engineState,
            new Uint8Array(4),
            1,
            1,
            Constants.TEXTUREFORMAT_RGBA,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
        );
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
            Constants.TEXTUREFORMAT_RGBA,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
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
            Constants.TEXTUREFORMAT_RGBA,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
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
            Constants.TEXTUREFORMAT_RGBA,
            Constants.TEXTURETYPE_UNSIGNED_INT,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
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

    // from Engine

    // Index / Vertex
    for (const scene of engineState.scenes) {
        scene.resetCachedMaterial();
        scene._rebuildGeometries();
        scene._rebuildTextures();
    }

    for (const scene of fes._virtualScenes) {
        scene.resetCachedMaterial();
        scene._rebuildGeometries();
        scene._rebuildTextures();
    }

    // From ThinEngine

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

function _measureFps(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    if (fes._performanceMonitor) {
        fes._performanceMonitor.sampleFrame();
        fes._fps = fes._performanceMonitor.averageFPS;
        fes._deltaTime = fes._performanceMonitor.instantaneousFrameTime || 0;
    }
}

/**
 * Begin a new frame
 */
export function beginFrame(engineState: IBaseEnginePublic): void {
    _measureFps(engineState);

    engineState.onBeginFrameObservable.notifyObservers(engineState);
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
    if (fes._renderingQueueLaunched && fes.customAnimationFrameRequester) {
        fes._renderingQueueLaunched = false;
        const { cancelAnimationFrame } = fes.customAnimationFrameRequester;
        if (cancelAnimationFrame) {
            cancelAnimationFrame(fes.customAnimationFrameRequester.requestID);
        }
    } else if (fes._renderingQueueLaunched && fes._frameHandler) {
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

    return fes._dimensionsObject ? fes._dimensionsObject.height : 0;
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

    hideLoadingUI(engineState);

    engineState.onNewSceneAddedObservable.clear();

    // Release postProcesses
    while (engineState.postProcesses.length) {
        engineState.postProcesses[0].dispose();
    }

    // Release scenes
    while (fes.scenes.length) {
        fes.scenes[0].dispose();
    }

    while (fes._virtualScenes.length) {
        fes._virtualScenes[0].dispose();
    }

    // TODO Release audio engine
    // if (EngineStore.Instances.length === 1 && Engine.audioEngine) {
    //     Engine.audioEngine.dispose();
    //     Engine.audioEngine = null;
    // }

    // Clear observables
    if (engineState.onBeforeTextureInitObservable) {
        engineState.onBeforeTextureInitObservable.clear();
    }

    if (IsWindowObjectExist()) {
        if (fes._checkForMobile) {
            window.removeEventListener("resize", fes._checkForMobile);
        }
    }

    // Events
    const hostWindow = getHostWindow(engineState); // it calls IsWindowObjectExist()
    if (hostWindow && typeof hostWindow.removeEventListener === "function") {
        fes._onBlur && hostWindow.removeEventListener("blur", fes._onBlur);
        fes._onFocus && hostWindow.removeEventListener("focus", fes._onFocus);
    }

    if (fes._renderingCanvas) {
        fes._onCanvasFocus && fes._renderingCanvas.removeEventListener("focus", fes._onCanvasFocus);
        fes._onCanvasBlur && fes._renderingCanvas.removeEventListener("blur", fes._onCanvasBlur);
        fes._onCanvasPointerOut && fes._renderingCanvas.removeEventListener("pointerout", fes._onCanvasPointerOut);
        fes._onCanvasContextMenu && fes._renderingCanvas.removeEventListener("contextmenu", fes._onCanvasContextMenu);
    }

    if (IsDocumentAvailable()) {
        if (fes._onFullscreenChange) {
            document.removeEventListener("fullscreenchange", fes._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", fes._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", fes._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", fes._onFullscreenChange);
        }
        if (fes._onPointerLockChange) {
            document.removeEventListener("pointerlockchange", fes._onPointerLockChange);
            document.removeEventListener("mspointerlockchange", fes._onPointerLockChange);
            document.removeEventListener("mozpointerlockchange", fes._onPointerLockChange);
            document.removeEventListener("webkitpointerlockchange", fes._onPointerLockChange);
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

    // Remove from Instances
    const index = EngineStore.Instances.indexOf(engineState);

    if (index >= 0) {
        EngineStore.Instances.splice(index, 1);
    }

    // no more engines left in the engine store? Notify!
    if (!EngineStore.Instances.length) {
        EngineStore.OnEnginesDisposedObservable.notifyObservers(engineState);
    }

    // Observables
    engineState.onResizeObservable.clear();
    engineState.onCanvasBlurObservable.clear();
    engineState.onCanvasFocusObservable.clear();
    engineState.onCanvasPointerOutObservable.clear();
    engineState.onBeginFrameObservable.clear();
    engineState.onEndFrameObservable.clear();

    fes.onDisposeObservable.notifyObservers(fes);
    fes.onDisposeObservable.clear();
}

// Loading screen

/**
 * Display the loading screen
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
 */
export function displayLoadingUI(engineState: IBaseEnginePublic): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = getLoadingScreen(engineState);
    if (loadingScreen) {
        loadingScreen.displayLoadingUI();
    }
}

/**
 * Hide the loading screen
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
 */
export function hideLoadingUI(engineState: IBaseEnginePublic): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = (engineState as BaseEngineStateFull)._loadingScreen;
    if (loadingScreen) {
        loadingScreen.hideLoadingUI();
    }
}

/**
 * Gets the current loading screen object
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
 */
export function getLoadingScreen(engineState: IBaseEnginePublic): ILoadingScreen {
    const fes = engineState as BaseEngineStateFull;
    if (!fes._loadingScreen && fes._renderingCanvas) {
        fes._loadingScreen = EngineStore.DefaultLoadingScreenFactory?.(fes._renderingCanvas);
    }
    return fes._loadingScreen!;
}

/**
 * Sets the current loading screen object
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
 */
export function setLoadingScreen(engineState: IBaseEnginePublic, loadingScreen: ILoadingScreen) {
    (engineState as BaseEngineStateFull)._loadingScreen = loadingScreen;
}

/**
 * creates and returns a new video element
 * @param constraints video constraints
 * @returns video element
 */
export function createVideoElement(_engineState: IBaseEnginePublic, _constraints: MediaTrackConstraints): any {
    return document.createElement("video");
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
 * Gets a boolean indicating that the engine is running in deterministic lock step mode
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
 * @returns true if engine is in deterministic lock step mode
 */
export function isDeterministicLockStep(engineState: IBaseEnginePublic): boolean {
    return (engineState as BaseEngineState)._deterministicLockstep;
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

/** States */

/**
 * Gets a boolean indicating if depth writing is enabled
 * @returns the current depth writing state
 */
export function getDepthWrite(engineState: IBaseEnginePublic): boolean {
    return (engineState as BaseEngineState)._depthCullingState!.depthMask;
}

/**
 * Enable or disable depth writing
 * @param enable defines the state to set
 */
export function setDepthWrite(engineState: IBaseEnginePublic, enable: boolean): void {
    (engineState as BaseEngineState)._depthCullingState!.depthMask = enable;
}

/**
 * Gets a boolean indicating if stencil buffer is enabled
 * @returns the current stencil buffer state
 */
export function getStencilBuffer(engineState: IBaseEnginePublic): boolean {
    return (engineState as BaseEngineState)._stencilState!.stencilTest;
}

/**
 * Enable or disable the stencil buffer
 * @param enable defines if the stencil buffer must be enabled or disabled
 */
export function setStencilBuffer(engineState: IBaseEnginePublic, enable: boolean): void {
    (engineState as BaseEngineState)._stencilState!.stencilTest = enable;
}

/**
 * Gets the current stencil mask
 * @returns a number defining the new stencil mask to use
 */
export function getStencilMask(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilMask;
}

/**
 * Sets the current stencil mask
 * @param mask defines the new stencil mask to use
 */
export function setStencilMask(engineState: IBaseEnginePublic, mask: number): void {
    (engineState as BaseEngineState)._stencilState!.stencilMask = mask;
}

/**
 * Gets the current stencil function
 * @returns a number defining the stencil function to use
 */
export function getStencilFunction(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilFunc;
}

/**
 * Gets the current stencil reference value
 * @returns a number defining the stencil reference value to use
 */
export function getStencilFunctionReference(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilFuncRef;
}

/**
 * Gets the current stencil mask
 * @returns a number defining the stencil mask to use
 */
export function getStencilFunctionMask(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilFuncMask;
}

/**
 * Sets the current stencil function
 * @param stencilFunc defines the new stencil function to use
 */
export function setStencilFunction(engineState: IBaseEnginePublic, stencilFunc: number) {
    (engineState as BaseEngineState)._stencilState!.stencilFunc = stencilFunc;
}

/**
 * Sets the current stencil reference
 * @param reference defines the new stencil reference to use
 */
export function setStencilFunctionReference(engineState: IBaseEnginePublic, reference: number) {
    (engineState as BaseEngineState)._stencilState!.stencilFuncRef = reference;
}

/**
 * Sets the current stencil mask
 * @param mask defines the new stencil mask to use
 */
export function setStencilFunctionMask(engineState: IBaseEnginePublic, mask: number) {
    (engineState as BaseEngineState)._stencilState!.stencilFuncMask = mask;
}

/**
 * Gets the current stencil operation when stencil fails
 * @returns a number defining stencil operation to use when stencil fails
 */
export function getStencilOperationFail(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilOpStencilFail;
}

/**
 * Gets the current stencil operation when depth fails
 * @returns a number defining stencil operation to use when depth fails
 */
export function getStencilOperationDepthFail(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilOpDepthFail;
}

/**
 * Gets the current stencil operation when stencil passes
 * @returns a number defining stencil operation to use when stencil passes
 */
export function getStencilOperationPass(engineState: IBaseEnginePublic): number {
    return (engineState as BaseEngineState)._stencilState!.stencilOpStencilDepthPass;
}

/**
 * Sets the stencil operation to use when stencil fails
 * @param operation defines the stencil operation to use when stencil fails
 */
export function setStencilOperationFail(engineState: IBaseEnginePublic, operation: number): void {
    (engineState as BaseEngineState)._stencilState!.stencilOpStencilFail = operation;
}

/**
 * Sets the stencil operation to use when depth fails
 * @param operation defines the stencil operation to use when depth fails
 */
export function setStencilOperationDepthFail(engineState: IBaseEnginePublic, operation: number): void {
    (engineState as BaseEngineState)._stencilState!.stencilOpDepthFail = operation;
}

/**
 * Sets the stencil operation to use when stencil passes
 * @param operation defines the stencil operation to use when stencil passes
 */
export function setStencilOperationPass(engineState: IBaseEnginePublic, operation: number): void {
    (engineState as BaseEngineState)._stencilState!.stencilOpStencilDepthPass = operation;
}

/**
 * Gets the current depth function
 * @returns a number defining the depth function
 */
export function getDepthFunction(engineState: IBaseEnginePublic): Nullable<number> {
    return (engineState as BaseEngineState)._depthCullingState!.depthFunc;
}

/**
 * Sets the current depth function
 * @param depthFunc defines the function to use
 */
export function setDepthFunction(engineState: IBaseEnginePublic, depthFunc: number) {
    (engineState as BaseEngineState)._depthCullingState!.depthFunc = depthFunc;
}

/**
 * Sets the current depth function to GREATER
 */
export function setDepthFunctionToGreater(engineState: IBaseEnginePublic): void {
    setDepthFunction(engineState, Constants.GREATER);
}

/**
 * Sets the current depth function to GEQUAL
 */
export function setDepthFunctionToGreaterOrEqual(engineState: IBaseEnginePublic): void {
    setDepthFunction(engineState, Constants.GEQUAL);
}

/**
 * Sets the current depth function to LESS
 */
export function setDepthFunctionToLess(engineState: IBaseEnginePublic): void {
    setDepthFunction(engineState, Constants.LESS);
}

/**
 * Sets the current depth function to LEQUAL
 */
export function setDepthFunctionToLessOrEqual(engineState: IBaseEnginePublic): void {
    setDepthFunction(engineState, Constants.LEQUAL);
}

/**
 * Caches the the state of the stencil buffer
 */
export function cacheStencilState(engineState: IBaseEnginePublic) {
    const fes = engineState as BaseEngineStateFull;
    fes._cachedStencilBuffer = getStencilBuffer(engineState);
    fes._cachedStencilFunction = getStencilFunction(engineState);
    fes._cachedStencilMask = getStencilMask(engineState);
    fes._cachedStencilOperationPass = getStencilOperationPass(engineState);
    fes._cachedStencilOperationFail = getStencilOperationFail(engineState);
    fes._cachedStencilOperationDepthFail = getStencilOperationDepthFail(engineState);
    fes._cachedStencilReference = getStencilFunctionReference(engineState);
}

/**
 * Restores the state of the stencil buffer
 */
export function restoreStencilState(engineState: IBaseEnginePublic) {
    const fes = engineState as BaseEngineStateFull;
    setStencilFunction(engineState, fes._cachedStencilFunction);
    setStencilMask(engineState, fes._cachedStencilMask);
    setStencilBuffer(engineState, fes._cachedStencilBuffer);
    setStencilOperationPass(engineState, fes._cachedStencilOperationPass);
    setStencilOperationFail(engineState, fes._cachedStencilOperationFail);
    setStencilOperationDepthFail(engineState, fes._cachedStencilOperationDepthFail);
    setStencilFunctionReference(engineState, fes._cachedStencilReference);
}

/**
 * Toggle full screen mode
 * @param requestPointerLock defines if a pointer lock should be requested from the user
 */
export function switchFullscreen(engineState: IBaseEnginePublic, requestPointerLock: boolean): void {
    if (engineState.isFullscreen) {
        exitFullscreen(engineState);
    } else {
        enterFullscreen(engineState, requestPointerLock);
    }
}

/**
 * Enters full screen mode
 * @param requestPointerLock defines if a pointer lock should be requested from the user
 */
export function enterFullscreen(engineState: IBaseEnginePublic, requestPointerLock: boolean): void {
    const fes = engineState as BaseEngineStateFull;
    if (!engineState.isFullscreen) {
        fes._pointerLockRequested = requestPointerLock;
        if (fes._renderingCanvas) {
            _RequestFullscreen(fes._renderingCanvas);
        }
    }
}

/**
 * Exits full screen mode
 */
export function exitFullscreen(engineState: IBaseEnginePublic): void {
    if (engineState.isFullscreen) {
        _ExitFullscreen();
    }
}

/**
 * Enters Pointerlock mode
 */
export function enterPointerlock(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    if (fes._renderingCanvas) {
        _RequestPointerlock(fes._renderingCanvas);
    }
}

/**
 * // TODO - this is probably not needed...
 * Exits Pointerlock mode
 */
export function exitPointerlock(engineState: IBaseEnginePublic): void {
    _ExitPointerlock();
}

/**
 * @internal
 */
export function _releaseRenderTargetWrapper(engineState: IBaseEnginePublic, rtWrapper: RenderTargetWrapper): void {
    const fes = engineState as BaseEngineStateFull;
    const index = fes._renderTargetWrapperCache.indexOf(rtWrapper);
    if (index !== -1) {
        fes._renderTargetWrapperCache.splice(index, 1);
    }

    // From Engine
    // Set output texture of post process to null if the framebuffer has been released/disposed
    fes.scenes.forEach((scene) => {
        scene.postProcesses.forEach((postProcess) => {
            if (postProcess._outputTexture === rtWrapper) {
                postProcess._outputTexture = null;
            }
        });
        scene.cameras.forEach((camera) => {
            camera._postProcesses.forEach((postProcess) => {
                if (postProcess) {
                    if (postProcess._outputTexture === rtWrapper) {
                        postProcess._outputTexture = null;
                    }
                }
            });
        });
    });
}

let renderPassIdCounter = 0;

/**
 * Gets the names of the render passes that are currently created
 * @returns list of the render pass names
 */
export function getRenderPassNames(engineState: IBaseEnginePublic): string[] {
    return (engineState as BaseEngineStateFull)._renderPassNames;
}

/**
 * Gets the name of the current render pass
 * @returns name of the current render pass
 */
export function getCurrentRenderPassName(engineState: IBaseEnginePublic): string {
    return (engineState as BaseEngineStateFull)._renderPassNames[(engineState as BaseEngineStateFull).currentRenderPassId];
}

/**
 * Creates a render pass id
 * @param name Name of the render pass (for debug purpose only)
 * @returns the id of the new render pass
 */
export function createRenderPassId(engineState: IBaseEnginePublic, name?: string) {
    // Note: render pass id == 0 is always for the main render pass
    const id = ++renderPassIdCounter;
    (engineState as BaseEngineStateFull)._renderPassNames[id] = name ?? "NONAME";
    return id;
}

/**
 * Releases a render pass id
 * @param id id of the render pass to release
 */
export function releaseRenderPassId(engineState: IBaseEnginePublic, id: number): void {
    (engineState as BaseEngineStateFull)._renderPassNames[id] = undefined as any;

    for (let s = 0; s < engineState.scenes.length; ++s) {
        const scene = engineState.scenes[s];
        for (let m = 0; m < scene.meshes.length; ++m) {
            const mesh = scene.meshes[m];
            if (mesh.subMeshes) {
                for (let b = 0; b < mesh.subMeshes.length; ++b) {
                    const subMesh = mesh.subMeshes[b];
                    subMesh._removeDrawWrapper(id);
                }
            }
        }
    }
}

/**
 * Enable or disable color writing
 * @param enable defines the state to set
 */
export function setColorWrite(engineState: IBaseEnginePublic, enable: boolean): void {
    const fes = engineState as BaseEngineStateFull;
    if (enable !== fes._colorWrite) {
        fes._colorWriteChanged = true;
        fes._colorWrite = enable;
    }
}

/**
 * Gets a boolean indicating if color writing is enabled
 * @returns the current color writing state
 */
export function getColorWrite(engineState: IBaseEnginePublic): boolean {
    return (engineState as BaseEngineStateFull)._colorWrite;
}
