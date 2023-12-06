/* eslint-disable @typescript-eslint/no-unused-vars */
import { EngineStore } from "./engineStore";
import type { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import type { IEffectCreationOptions } from "../Materials/effect";
import { Effect } from "../Materials/effect";
import { _WarnImport } from "../Misc/devTools";
import type { IShaderProcessor } from "./Processors/iShaderProcessor";
import type { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import type { UniformBuffer } from "../Materials/uniformBuffer";
import type { Nullable, DataArray, IndicesArray } from "../types";
import type { EngineCapabilities } from "./engineCapabilities";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import { DepthCullingState } from "../States/depthCullingState";
import { StencilState } from "../States/stencilState";
import { AlphaState } from "../States/alphaCullingState";
import { Constants } from "./constants";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IViewportLike, IColor4Like } from "../Maths/math.like";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { IFileRequest } from "../Misc/fileRequest";
import { Logger } from "../Misc/logger";
import { IsDocumentAvailable, IsWindowObjectExist } from "../Misc/domManagement";
import { WebGLDataBuffer } from "../Meshes/WebGL/webGLDataBuffer";
import type { IPipelineContext } from "./IPipelineContext";
import { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { VertexBuffer } from "../Buffers/buffer";
import type { InstancingAttributeInfo } from "./instancingAttributeInfo";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { IEffectFallbacks } from "../Materials/iEffectFallbacks";
import type { IWebRequest } from "../Misc/interfaces/iWebRequest";
import type { EngineFeatures } from "./engineFeatures";
import type { HardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import { WebGLHardwareTexture } from "./WebGL/webGLHardwareTexture";
import { DrawWrapper } from "../Materials/drawWrapper";
import type { IMaterialContext } from "./IMaterialContext";
import type { IDrawContext } from "./IDrawContext";
import type { ICanvas, ICanvasRenderingContext, IImage } from "./ICanvas";
import { StencilStateComposer } from "../States/stencilStateComposer";
import type { StorageBuffer } from "../Buffers/storageBuffer";
import type { IAudioEngineOptions } from "../Audio/Interfaces/IAudioEngineOptions";
import type { IStencilState } from "../States/IStencilState";
import type { InternalTextureCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "./WebGL/webGLRenderTargetWrapper";
import type { VideoTexture } from "../Materials/Textures/videoTexture";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { WebRequest } from "../Misc/webRequest";
import type { LoadFileError } from "../Misc/fileTools";
import type { Texture } from "../Materials/Textures/texture";
import { ExceptionList, NpmPackage, QueueNewFrame, Version, _CreateCanvas } from "core/esm/Engines/engine.static";
import {
    _initGLContext,
    clear,
    dispose,
    initWebGLEngineState,
    wipeCaches,
    type WebGLEngineState,
    _initFeatures,
    getGlInfo,
    getRenderWidth,
    getRenderHeight,
    _viewport,
    setViewport,
    setSize,
    bindFramebuffer,
    _bindUnboundFramebuffer,
    generateMipmaps,
    unBindFramebuffer,
    restoreDefaultFramebuffer,
    _resetVertexBufferBinding,
    createVertexBuffer,
    createDynamicVertexBuffer,
    _resetIndexBufferBinding,
    createIndexBuffer,
    _normalizeIndexData,
    setState,
    getDepthBuffer,
    setDepthBuffer,
    setZOffset,
    getZOffset,
    getZOffsetUnits,
    setZOffsetUnits,
    bindArrayBuffer,
    bindUniformBlock,
    _bindIndexBuffer,
    updateArrayBuffer,
    _bindIndexBufferWithCache,
    recordVertexArrayObject,
    bindVertexArrayObject,
    bindBuffersDirectly,
    bindBuffers,
    unbindInstanceAttributes,
    releaseVertexArrayObject,
    _releaseBuffer,
    _deleteBuffer,
} from "core/esm/Engines/WebGL/engine.webgl";
import {
    _prepareWorkingCanvas,
    _rebuildBuffers,
    _setupMobileChecks,
    _sharedInit,
    areAllEffectsReady,
    getEmptyCubeTexture,
    getEmptyTexture,
    getEmptyTexture2DArray,
    getEmptyTexture3D,
    getHostWindow,
    resetTextureCache,
    resize,
    setHardwareScalingLevel,
    stopRenderLoop,
} from "core/esm/Engines/engine.base";
import { createRawCubeTexture, createRawTexture, createRawTexture2DArray, createRawTexture3D } from "core/esm/Engines/WebGL/Extensions/rawTexture/engine.rawTexture.webgl";
import { _restoreEngineAfterContextLost } from "core/esm/Engines/engine.extendable";

/**
 * Defines the interface used by objects working like Scene
 * @internal
 */
export interface ISceneLike {
    addPendingData(data: any): void;
    removePendingData(data: any): void;
    offlineProvider: IOfflineProvider;
}

/**
 * Keeps track of all the buffer info used in engine.
 */
class BufferPointer {
    public active: boolean;
    public index: number;
    public size: number;
    public type: number;
    public normalized: boolean;
    public stride: number;
    public offset: number;
    public buffer: WebGLBuffer;
}

/**
 * Information about the current host
 */
export interface HostInformation {
    /**
     * Defines if the current host is a mobile
     */
    isMobile: boolean;
}

/** Interface defining initialization parameters for ThinEngine class */
export interface ThinEngineOptions {
    /**
     * Defines if the engine should no exceed a specified device ratio
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
     */
    limitDeviceRatio?: number;
    /**
     * Defines if webaudio should be initialized as well
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
     */
    audioEngine?: boolean;
    /**
     * Specifies options for the audio engine
     */
    audioEngineOptions?: IAudioEngineOptions;

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

/** Interface defining initialization parameters for Engine class */
export interface EngineOptions extends ThinEngineOptions, WebGLContextAttributes {
    /**
     * Defines if webgl2 should be turned off even if supported
     * @see https://doc.babylonjs.com/setup/support/webGL2
     */
    disableWebGL2Support?: boolean;

    /**
     * Defines that engine should compile shaders with high precision floats (if supported). True by default
     */
    useHighPrecisionFloats?: boolean;
    /**
     * Make the canvas XR Compatible for XR sessions
     */
    xrCompatible?: boolean;

    /**
     * Will prevent the system from falling back to software implementation if a hardware device cannot be created
     */
    failIfMajorPerformanceCaveat?: boolean;

    /**
     * If sRGB Buffer support is not set during construction, use this value to force a specific state
     * This is added due to an issue when processing textures in chrome/edge/firefox
     * This will not influence NativeEngine and WebGPUEngine which set the behavior to true during construction.
     */
    forceSRGBBufferSupportState?: boolean;

    /**
     * Defines if the gl context should be released.
     * It's false by default for backward compatibility, but you should probably pass true (see https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/)
     */
    loseContextOnDispose?: boolean;
}

/**
 * The base engine class (root of all engines)
 */
export class ThinEngine {
    private _engineState: WebGLEngineState;
    /** Use this array to turn off some WebGL2 features on known buggy browsers version */
    public static ExceptionList = ExceptionList;

    /** @internal */
    public static _TextureLoaders: IInternalTextureLoader[] = [];

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static get NpmPackage(): string {
        return NpmPackage;
    }

    /**
     * Returns the current version of the framework
     */
    public static get Version(): string {
        return Version;
    }

    /**
     * Returns a string describing the current engine
     */
    public get description(): string {
        let description = this.name + this.webGLVersion;

        if (this._caps.parallelShaderCompile) {
            description += " - Parallel shader compilation";
        }

        return description;
    }

    /** @internal */
    protected _name = "WebGL";

    /**
     * Gets or sets the name of the engine
     */
    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    /**
     * Returns the version of the engine
     */
    public get version(): number {
        return this._webGLVersion;
    }

    protected _isDisposed = false;

    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    // Updatable statics so stick with vars here

    /**
     * Gets or sets the epsilon value used by collision engine
     */
    public static CollisionsEpsilon = 0.001;

    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static get ShadersRepository(): string {
        return Effect.ShadersRepository;
    }
    public static set ShadersRepository(value: string) {
        Effect.ShadersRepository = value;
    }

    protected _shaderProcessor: Nullable<IShaderProcessor>;

    /**
     * @internal
     */
    public _getShaderProcessor(shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
        return this._shaderProcessor;
    }

    /**
     * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
     */
    public forcePOTTextures = false;

    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    public isFullscreen = false;

    /**
     * Gets or sets a boolean indicating if back faces must be culled. If false, front faces are culled instead (true by default)
     * If non null, this takes precedence over the value from the material
     */
    public cullBackFaces: Nullable<boolean> = null;

    /**
     * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foreground
     */
    public renderEvenInBackground = true;

    /**
     * Gets or sets a boolean indicating that cache can be kept between frames
     */
    public preventCacheWipeBetweenFrames = false;

    /** Gets or sets a boolean indicating if the engine should validate programs after compilation */
    public validateShaderPrograms = false;
    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    public get useReverseDepthBuffer(): boolean {
        return this._engineState.useReverseDepthBuffer;
    }

    public set useReverseDepthBuffer(useReverse) {
        this._engineState.useReverseDepthBuffer = useReverse;
    }

    /**
     * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
     */
    public readonly isNDCHalfZRange: boolean = false;

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    public readonly hasOriginBottomLeft: boolean = true;

    /**
     * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
     */
    public disableUniformBuffers = false;

    /**
     * An event triggered when the engine is disposed.
     */
    public readonly onDisposeObservable = new Observable<ThinEngine>();

    /**
     * Gets the current frame id
     */
    public get frameId(): number {
        return this._engineState._frameId;
    }

    /**
     * The time (in milliseconds elapsed since the current page has been loaded) when the engine was initialized
     */
    public readonly startTime: number;

    /** @internal */
    public _uniformBuffers = new Array<UniformBuffer>();
    /** @internal */
    public _storageBuffers = new Array<StorageBuffer>();

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     */
    public get supportsUniformBuffers(): boolean {
        return this._engineState.supportsUniformBuffers;
    }

    /** @internal */
    public _gl: WebGL2RenderingContext;
    /** @internal */
    public _webGLVersion = 1.0;
    protected _renderingCanvas: Nullable<HTMLCanvasElement>;
    protected _windowIsBackground = false;
    protected _creationOptions: EngineOptions;
    protected _audioContext: Nullable<AudioContext>;
    protected _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
    /** @internal */
    public _glSRGBExtensionValues: {
        SRGB: typeof WebGL2RenderingContext.SRGB;
        SRGB8: typeof WebGL2RenderingContext.SRGB8 | EXT_sRGB["SRGB_ALPHA_EXT"];
        SRGB8_ALPHA8: typeof WebGL2RenderingContext.SRGB8_ALPHA8 | EXT_sRGB["SRGB_ALPHA_EXT"];
    };
    /**
     * Gets the options used for engine creation
     * @returns EngineOptions object
     */
    public getCreationOptions() {
        return this._engineState._creationOptions;
    }

    protected _highPrecisionShadersAllowed = true;
    /** @internal */
    public get _shouldUseHighPrecisionShader(): boolean {
        return this._engineState._shouldUseHighPrecisionShader;
    }

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    public get needPOTTextures(): boolean {
        return this._engineState.needPOTTextures;
    }

    /** @internal */
    public _badOS = false;

    /** @internal */
    public _badDesktopOS = false;

    /** @internal */
    public _hardwareScalingLevel: number;
    /** @internal */
    public _caps: EngineCapabilities;
    /** @internal */
    public _features: EngineFeatures;
    protected _isStencilEnable: boolean;

    /** @internal */
    public _videoTextureSupported: boolean;

    protected _renderingQueueLaunched = false;
    protected _activeRenderLoops = new Array<() => void>();

    /**
     * Gets the list of current active render loop functions
     * @returns an array with the current render loop functions
     */
    public get activeRenderLoops(): Array<() => void> {
        return this._engineState._activeRenderLoops;
    }

    // Lost context
    /**
     * Observable signaled when a context lost event is raised
     */
    public onContextLostObservable = new Observable<ThinEngine>();
    /**
     * Observable signaled when a context restored event is raised
     */
    public onContextRestoredObservable = new Observable<ThinEngine>();
    protected _contextWasLost = false;

    /** @internal */
    public _doNotHandleContextLost = false;

    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#handling-webgl-context-lost
     */
    public get doNotHandleContextLost(): boolean {
        return this._engineState.doNotHandleContextLost;
    }

    public set doNotHandleContextLost(value: boolean) {
        this._engineState.doNotHandleContextLost = value;
    }

    /**
     * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
     */
    public disableVertexArrayObjects = false;

    // States
    /** @internal */
    protected _colorWrite = true;
    /** @internal */
    protected _colorWriteChanged = true;
    /** @internal */
    protected _depthCullingState = new DepthCullingState();
    /** @internal */
    protected _stencilStateComposer = new StencilStateComposer();
    /** @internal */
    protected _stencilState = new StencilState();
    /** @internal */
    public _alphaState = new AlphaState();
    /** @internal */
    public _alphaMode = Constants.ALPHA_ADD;
    /** @internal */
    public _alphaEquation = Constants.ALPHA_DISABLE;

    // Cache
    /** @internal */
    public _internalTexturesCache = new Array<InternalTexture>();
    /** @internal */
    public _renderTargetWrapperCache = new Array<RenderTargetWrapper>();
    /** @internal */
    protected _activeChannel = 0;
    /** @internal */
    protected _boundTexturesCache: { [key: string]: Nullable<InternalTexture> } = {};
    protected _currentEffect: Nullable<Effect>;
    /** @internal */
    public _currentDrawContext: IDrawContext;
    /** @internal */
    public _currentMaterialContext: IMaterialContext;
    /** @internal */
    protected _currentProgram: Nullable<WebGLProgram>;
    protected _compiledEffects: { [key: string]: Effect } = {};
    /** @internal */
    protected _cachedViewport: Nullable<IViewportLike>;
    /** @internal */
    protected _cachedVertexBuffers: any;
    /** @internal */
    protected _cachedIndexBuffer: Nullable<DataBuffer>;
    /** @internal */
    protected _cachedEffectForVertexBuffers: Nullable<Effect>;

    /** @internal */
    public _currentRenderTarget: Nullable<RenderTargetWrapper> = null;
    protected _currentBoundBuffer = new Array<Nullable<DataBuffer>>();
    /** @internal */
    public _currentFramebuffer: Nullable<WebGLFramebuffer> = null;
    /** @internal */
    public _dummyFramebuffer: Nullable<WebGLFramebuffer> = null;

    /** @internal */
    public _workingCanvas: Nullable<ICanvas>;
    /** @internal */
    public _workingContext: Nullable<ICanvasRenderingContext>;

    /** @internal */
    public _boundRenderFunction: any;

    /** @internal */
    public _frameHandler: number;

    /**
     * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
     */
    public adaptToDeviceRatio: boolean = false;
    /** @internal */
    protected _lastDevicePixelRatio: number = 1.0;

    /** @internal */
    public _transformTextureUrl: Nullable<(url: string) => string> = null;

    /**
     * Gets information about the current host
     */
    public hostInformation: HostInformation = {
        isMobile: false,
    };

    protected get _supportsHardwareTextureRescaling() {
        return false;
    }

    /**
     * sets the object from which width and height will be taken from when getting render width and height
     * Will fallback to the gl object
     * @param dimensions the framebuffer width and height that will be used.
     */
    public set framebufferDimensionsObject(dimensions: Nullable<{ framebufferWidth: number; framebufferHeight: number }>) {
        this._engineState._renderWidthOverride = dimensions
            ? {
                  width: dimensions.framebufferWidth,
                  height: dimensions.framebufferHeight,
              }
            : null;
    }

    /**
     * Gets the current viewport
     */
    public get currentViewport(): Nullable<IViewportLike> {
        return this._engineState.currentViewport;
    }

    /**
     * Gets the default empty texture
     */
    public get emptyTexture(): InternalTexture {
        return getEmptyTexture(this._engineState, { createRawTexture })!;
    }

    /**
     * Gets the default empty 3D texture
     */
    public get emptyTexture3D(): InternalTexture {
        return getEmptyTexture3D(this._engineState, { createRawTexture3D })!;
    }

    /**
     * Gets the default empty 2D array texture
     */
    public get emptyTexture2DArray(): InternalTexture {
        return getEmptyTexture2DArray(this._engineState, { createRawTexture2DArray })!;
    }

    /**
     * Gets the default empty cube texture
     */
    public get emptyCubeTexture(): InternalTexture {
        return getEmptyCubeTexture(this._engineState, { createRawCubeTexture })!;
    }

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    public premultipliedAlpha: boolean = true;

    /**
     * Observable event triggered before each texture is initialized
     */
    public onBeforeTextureInitObservable = new Observable<Texture>();

    /** @internal */
    protected _isWebGPU: boolean = false;
    /**
     * Gets a boolean indicating if the engine runs in WebGPU or not.
     */
    public get isWebGPU(): boolean {
        return this._isWebGPU;
    }

    /** @internal */
    protected _shaderPlatformName: string;
    /**
     * Gets the shader platform name used by the effects.
     */
    public get shaderPlatformName(): string {
        return this._shaderPlatformName;
    }

    /**
     * Enables or disables the snapshot rendering mode
     * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
     */
    public get snapshotRendering(): boolean {
        return false;
    }

    public set snapshotRendering(activate) {
        // WebGL engine does not support snapshot rendering
    }

    protected _snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD;
    /**
     * Gets or sets the snapshot rendering mode
     */
    public get snapshotRenderingMode(): number {
        return this._snapshotRenderingMode;
    }

    public set snapshotRenderingMode(mode: number) {
        this._snapshotRenderingMode = mode;
    }

    /**
     * Gets a boolean indicating if the exact sRGB conversions or faster approximations are used for converting to and from linear space.
     */
    public readonly useExactSrgbConversions: boolean;

    /**
     * Creates a new snapshot at the next frame using the current snapshotRenderingMode
     */
    public snapshotRenderingReset(): void {
        this.snapshotRendering = false;
    }

    /**
     * Create a canvas. This method is overridden by other engines
     * @param width width
     * @param height height
     * @returns ICanvas interface
     */
    public createCanvas(width: number, height: number): ICanvas {
        return _CreateCanvas(width, height);
    }

    /**
     * Create an image to use with canvas
     * @returns IImage interface
     */
    public createCanvasImage(): IImage {
        return document.createElement("img");
    }

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(
        canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>,
        antialias?: boolean,
        options?: EngineOptions,
        adaptToDeviceRatio?: boolean
    ) {
        initWebGLEngineState(canvasOrContext, { ...options, antialias, adaptToDeviceRatio });
    }

    protected _setupMobileChecks(): void {
        return _setupMobileChecks(this._engineState);
    }

    protected _restoreEngineAfterContextLost(initEngine: () => void): void {
        return _restoreEngineAfterContextLost({ wipeCaches }, this._engineState, initEngine);
    }

    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    protected _sharedInit(canvas: HTMLCanvasElement) {
        return _sharedInit(this._engineState, canvas);
    }

    /**
     * @internal
     */
    public _getShaderProcessingContext(shaderLanguage: ShaderLanguage): Nullable<ShaderProcessingContext> {
        return null;
    }

    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns true if all effects are ready
     */
    public areAllEffectsReady(): boolean {
        return areAllEffectsReady(this._engineState);
    }

    protected _rebuildBuffers(): void {
        return _rebuildBuffers(this._engineState);
    }

    protected _initGLContext(): void {
        return _initGLContext(this._engineState);
    }

    protected _initFeatures(): void {
        return _initFeatures(this._engineState);
    }

    /**
     * Gets version of the current webGL context
     * Keep it for back compat - use version instead
     */
    public get webGLVersion(): number {
        return this._webGLVersion;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "Engine" string
     */
    public getClassName(): string {
        return "ThinEngine";
    }

    /**
     * Returns true if the stencil buffer has been enabled through the creation option of the context.
     */
    public get isStencilEnable(): boolean {
        return this._engineState._isStencilEnable;
    }

    /** @internal */
    public _prepareWorkingCanvas(): void {
        return _prepareWorkingCanvas(this._engineState);
    }

    /**
     * Reset the texture cache to empty state
     */
    public resetTextureCache() {
        resetTextureCache(this._engineState);
    }

    /**
     * Gets an object containing information about the current engine context
     * @returns an object containing the vendor, the renderer and the version of the current engine context
     */
    public getInfo() {
        return getGlInfo(this._engineState);
    }

    /**
     * Gets an object containing information about the current webGL context
     * @returns an object containing the vendor, the renderer and the version of the current webGL context
     */
    public getGlInfo() {
        getGlInfo(this._engineState);
    }

    /**
     * Defines the hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @param level defines the level to use
     */
    public setHardwareScalingLevel(level: number): void {
        setHardwareScalingLevel(this._engineState, level);
    }

    /**
     * Gets the current hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @returns a number indicating the current hardware scaling level
     */
    public getHardwareScalingLevel(): number {
        return this._engineState._hardwareScalingLevel;
    }

    /**
     * Gets the list of loaded textures
     * @returns an array containing all loaded textures
     */
    public getLoadedTexturesCache(): InternalTexture[] {
        return this._engineState._internalTexturesCache;
    }

    /**
     * Gets the object containing all engine capabilities
     * @returns the EngineCapabilities object
     */
    public getCaps(): EngineCapabilities {
        return this._engineState._caps;
    }

    /**
     * stop executing a render loop function and remove it from the execution array
     * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
     */
    public stopRenderLoop(renderFunction?: () => void): void {
        stopRenderLoop(this._engineState, renderFunction);
    }

    protected _cancelFrame() {
        if (this._renderingQueueLaunched && this._frameHandler) {
            this._renderingQueueLaunched = false;
            if (!IsWindowObjectExist()) {
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(this._frameHandler);
                }
            } else {
                const { cancelAnimationFrame } = this.getHostWindow() || window;
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(this._frameHandler);
                }
            }
            return clearTimeout(this._frameHandler);
        }
    }

    /** @internal */
    public _renderLoop(): void {
        if (!this._contextWasLost) {
            let shouldRender = true;
            if (this._isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                for (let index = 0; index < this._activeRenderLoops.length; index++) {
                    const renderFunction = this._activeRenderLoops[index];

                    renderFunction();
                }

                // Present
                this.endFrame();
            }
        }

        if (this._activeRenderLoops.length > 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        } else {
            this._renderingQueueLaunched = false;
        }
    }

    /**
     * Gets the HTML canvas attached with the current webGL context
     * @returns a HTML canvas
     */
    public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._engineState._renderingCanvas;
    }

    /**
     * Gets the audio context specified in engine initialization options
     * @returns an Audio Context
     */
    public getAudioContext(): Nullable<AudioContext> {
        return this._audioContext;
    }

    /**
     * Gets the audio destination specified in engine initialization options
     * @returns an audio destination node
     */
    public getAudioDestination(): Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode> {
        return this._audioDestination;
    }

    /**
     * Gets host window
     * @returns the host window object
     */
    public getHostWindow(): Nullable<Window> {
        return getHostWindow(this._engineState);
    }

    /**
     * Gets the current render width
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render width
     */
    public getRenderWidth(useScreen = false): number {
        return getRenderWidth(this._engineState, useScreen);
    }

    /**
     * Gets the current render height
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render height
     */
    public getRenderHeight(useScreen = false): number {
        return getRenderHeight(this._engineState, useScreen);
    }

    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @internal
     */
    protected _queueNewFrame(bindedRenderFunction: any, requester?: any): number {
        return QueueNewFrame(bindedRenderFunction, requester);
    }

    /**
     * Register and execute a render loop. The engine can have more than one render function
     * @param renderFunction defines the function to continuously execute
     */
    public runRenderLoop(renderFunction: () => void): void {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
            return;
        }

        this._activeRenderLoops.push(renderFunction);

        if (!this._renderingQueueLaunched) {
            this._renderingQueueLaunched = true;
            this._boundRenderFunction = () => this._renderLoop();
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }

    /**
     * Clear the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        clear(this._engineState, color, backBuffer, depth, stencil);
    }

    protected _viewportCached = { x: 0, y: 0, z: 0, w: 0 };

    /**
     * @internal
     */
    public _viewport(x: number, y: number, width: number, height: number): void {
        _viewport(this._engineState, x, y, width, height);
    }

    /**
     * Set the WebGL's viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
     * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
     */
    public setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        setViewport(this._engineState, viewport, requiredWidth, requiredHeight);
    }

    /**
     * Begin a new frame
     */
    public beginFrame(): void {}

    /**
     * Enf the current frame
     */
    public endFrame(): void {
        // Force a flush in case we are using a bad OS.
        if (this._badOS) {
            this.flushFramebuffer();
        }
        this._frameId++;
    }

    /**
     * Resize the view according to the canvas' size
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     */
    public resize(forceSetSize = false): void {
        resize(this._engineState, forceSetSize);
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number, forceSetSize = false): boolean {
        return setSize(this._engineState, width, height, forceSetSize);
    }

    /**
     * Binds the frame buffer to the specified texture.
     * @param rtWrapper The render target wrapper to render to
     * @param faceIndex The face of the texture to render to in case of cube texture and if the render target wrapper is not a multi render target
     * @param requiredWidth The width of the target to render to
     * @param requiredHeight The height of the target to render to
     * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
     * @param lodLevel Defines the lod level to bind to the frame buffer
     * @param layer Defines the 2d array index to bind to the frame buffer if the render target wrapper is not a multi render target
     */
    public bindFramebuffer(
        rtWrapper: RenderTargetWrapper,
        faceIndex: number = 0,
        requiredWidth?: number,
        requiredHeight?: number,
        forceFullscreenViewport?: boolean,
        lodLevel = 0,
        layer = 0
    ): void {
        return bindFramebuffer(this._engineState, rtWrapper, faceIndex, requiredWidth, requiredHeight, forceFullscreenViewport, lodLevel, layer);
    }

    /**
     * Set various states to the webGL context
     * @param culling defines culling state: true to enable culling, false to disable it
     * @param zOffset defines the value to apply to zOffset (0 by default)
     * @param force defines if states must be applied even if cache is up to date
     * @param reverseSide defines if culling must be reversed (CCW if false, CW if true)
     * @param cullBackFaces true to cull back faces, false to cull front faces (if culling is enabled)
     * @param stencil stencil states to set
     * @param zOffsetUnits defines the value to apply to zOffsetUnits (0 by default)
     */
    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false, cullBackFaces?: boolean, stencil?: IStencilState, zOffsetUnits: number = 0): void {
        setState(this._engineState, culling, zOffset, force, reverseSide, cullBackFaces, stencil, zOffsetUnits);
    }

    /**
     * Gets a boolean indicating if depth testing is enabled
     * @returns the current state
     */
    public getDepthBuffer(): boolean {
        return getDepthBuffer(this._engineState);
    }

    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    public setDepthBuffer(enable: boolean): void {
        setDepthBuffer(this._engineState, enable);
    }

    /**
     * Set the z offset Factor to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffset(value: number): void {
        setZOffset(this._engineState, value);
    }

    /**
     * Gets the current value of the zOffset Factor
     * @returns the current zOffset Factor state
     */
    public getZOffset(): number {
        return getZOffset(this._engineState);
    }

    /**
     * Set the z offset Units to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffsetUnits(value: number): void {
        setZOffsetUnits(this._engineState, value);
    }

    /**
     * Gets the current value of the zOffset Units
     * @returns the current zOffset Units state
     */
    public getZOffsetUnits(): number {
        return getZOffsetUnits(this._engineState);
    }

    /**
     * @internal
     */
    public _bindUnboundFramebuffer(framebuffer: Nullable<WebGLFramebuffer>) {
        _bindUnboundFramebuffer(this._engineState, framebuffer);
    }

    /** @internal */
    public _currentFrameBufferIsDefaultFrameBuffer() {
        return this._engineState._currentFramebuffer === null;
    }

    /**
     * Generates the mipmaps for a texture
     * @param texture texture to generate the mipmaps for
     */
    public generateMipmaps(texture: InternalTexture): void {
        generateMipmaps(this._engineState, texture);
    }

    /**
     * Unbind the current render target texture from the webGL context
     * @param texture defines the render target wrapper to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public unBindFramebuffer(texture: RenderTargetWrapper, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        unBindFramebuffer(this._engineState, texture, disableGenerateMipMaps, onBeforeUnbind);
    }

    /**
     * Force a webGL flush (ie. a flush of all waiting webGL commands)
     */
    public flushFramebuffer(): void {
        this._engineState._gl.flush();
    }

    /**
     * Unbind the current render target and bind the default framebuffer
     */
    public restoreDefaultFramebuffer(): void {
        restoreDefaultFramebuffer(this._engineState);
    }

    // VBOs

    /** @internal */
    protected _resetVertexBufferBinding(): void {
        _resetVertexBufferBinding(this._engineState);
    }

    /**
     * Creates a vertex buffer
     * @param data the data for the vertex buffer
     * @param _updatable whether the buffer should be created as updatable
     * @param _label defines the label of the buffer (for debug purpose)
     * @returns the new WebGL static buffer
     */
    public createVertexBuffer(data: DataArray, _updatable?: boolean, _label?: string): DataBuffer {
        return createVertexBuffer(this._engineState, data, _updatable);
    }

    /**
     * Creates a dynamic vertex buffer
     * @param data the data for the dynamic vertex buffer
     * @param _label defines the label of the buffer (for debug purpose)
     * @returns the new WebGL dynamic buffer
     */
    public createDynamicVertexBuffer(data: DataArray, _label?: string): DataBuffer {
        return createDynamicVertexBuffer(this._engineState, data);
    }

    protected _resetIndexBufferBinding(): void {
        _resetIndexBufferBinding(this._engineState);
    }

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @param updatable defines if the index buffer must be updatable
     * @param _label defines the label of the buffer (for debug purpose)
     * @returns a new webGL buffer
     */
    public createIndexBuffer(indices: IndicesArray, updatable?: boolean, _label?: string): DataBuffer {
        return createIndexBuffer(this._engineState, indices, updatable, _label);
    }

    protected _normalizeIndexData(indices: IndicesArray): Uint16Array | Uint32Array {
        return _normalizeIndexData(this._engineState, indices);
    }

    /**
     * Bind a webGL buffer to the webGL context
     * @param buffer defines the buffer to bind
     */
    public bindArrayBuffer(buffer: Nullable<DataBuffer>): void {
        bindArrayBuffer(this._engineState, buffer);
    }

    /**
     * Bind a specific block at a given index in a specific shader program
     * @param pipelineContext defines the pipeline context to use
     * @param blockName defines the block name
     * @param index defines the index where to bind the block
     */
    public bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
        bindUniformBlock(this._engineState, pipelineContext, blockName, index);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected bindIndexBuffer(buffer: Nullable<DataBuffer>): void {
        _bindIndexBuffer(this._engineState, buffer);
    }

    /**
     * update the bound buffer with the given data
     * @param data defines the data to update
     */
    public updateArrayBuffer(data: Float32Array): void {
        updateArrayBuffer(this._engineState, data);
    }

    /**
     * @internal
     */
    public _bindIndexBufferWithCache(indexBuffer: Nullable<DataBuffer>): void {
        _bindIndexBufferWithCache(this._engineState, indexBuffer);
    }

    /**
     * Records a vertex array object
     * @see https://doc.babylonjs.com/setup/support/webGL2#vertex-array-objects
     * @param vertexBuffers defines the list of vertex buffers to store
     * @param indexBuffer defines the index buffer to store
     * @param effect defines the effect to store
     * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
     * @returns the new vertex array object
     */
    public recordVertexArrayObject(
        vertexBuffers: { [key: string]: VertexBuffer },
        indexBuffer: Nullable<DataBuffer>,
        effect: Effect,
        overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
    ): WebGLVertexArrayObject {
        return recordVertexArrayObject(this._engineState, vertexBuffers, indexBuffer, effect, overrideVertexBuffers);
    }

    /**
     * Bind a specific vertex array object
     * @see https://doc.babylonjs.com/setup/support/webGL2#vertex-array-objects
     * @param vertexArrayObject defines the vertex array object to bind
     * @param indexBuffer defines the index buffer to bind
     */
    public bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<DataBuffer>): void {
        bindVertexArrayObject(this._engineState, vertexArrayObject, indexBuffer);
    }

    /**
     * Bind webGl buffers directly to the webGL context
     * @param vertexBuffer defines the vertex buffer to bind
     * @param indexBuffer defines the index buffer to bind
     * @param vertexDeclaration defines the vertex declaration to use with the vertex buffer
     * @param vertexStrideSize defines the vertex stride of the vertex buffer
     * @param effect defines the effect associated with the vertex buffer
     */
    public bindBuffersDirectly(vertexBuffer: DataBuffer, indexBuffer: DataBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
        bindBuffersDirectly(this._engineState, vertexBuffer, indexBuffer, vertexDeclaration, vertexStrideSize, effect);
    }

    /**
     * Bind a list of vertex buffers to the webGL context
     * @param vertexBuffers defines the list of vertex buffers to bind
     * @param indexBuffer defines the index buffer to bind
     * @param effect defines the effect associated with the vertex buffers
     * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
     */
    public bindBuffers(
        vertexBuffers: { [key: string]: Nullable<VertexBuffer> },
        indexBuffer: Nullable<DataBuffer>,
        effect: Effect,
        overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
    ): void {
        bindBuffers(this._engineState, vertexBuffers, indexBuffer, effect, overrideVertexBuffers);
    }

    /**
     * Unbind all instance attributes
     */
    public unbindInstanceAttributes() {
        unbindInstanceAttributes(this._engineState);
    }

    /**
     * Release and free the memory of a vertex array object
     * @param vao defines the vertex array object to delete
     */
    public releaseVertexArrayObject(vao: WebGLVertexArrayObject) {
        releaseVertexArrayObject(this._engineState, vao);
    }

    /**
     * @internal
     */
    public _releaseBuffer(buffer: DataBuffer): boolean {
        return _releaseBuffer(this._engineState, buffer);
    }

    protected _deleteBuffer(buffer: DataBuffer): void {
        _deleteBuffer(this._engineState, buffer);
    }

    /**
     * Update the content of a webGL buffer used with instantiation and bind it to the webGL context
     * @param instancesBuffer defines the webGL buffer to update and bind
     * @param data defines the data to store in the buffer
     * @param offsetLocations defines the offsets or attributes information used to determine where data must be stored in the buffer
     */
    public updateAndBindInstancesBuffer(instancesBuffer: DataBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
        this.bindArrayBuffer(instancesBuffer);
        if (data) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
        }

        if ((<any>offsetLocations[0]).index !== undefined) {
            this.bindInstancesBuffer(instancesBuffer, offsetLocations as any, true);
        } else {
            for (let index = 0; index < 4; index++) {
                const offsetLocation = <number>offsetLocations[index];

                if (!this._vertexAttribArraysEnabled[offsetLocation]) {
                    this._gl.enableVertexAttribArray(offsetLocation);
                    this._vertexAttribArraysEnabled[offsetLocation] = true;
                }

                this._vertexAttribPointer(instancesBuffer, offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                this._gl.vertexAttribDivisor(offsetLocation, 1);
                this._currentInstanceLocations.push(offsetLocation);
                this._currentInstanceBuffers.push(instancesBuffer);
            }
        }
    }

    /**
     * Bind the content of a webGL buffer used with instantiation
     * @param instancesBuffer defines the webGL buffer to bind
     * @param attributesInfo defines the offsets or attributes information used to determine where data must be stored in the buffer
     * @param computeStride defines Whether to compute the strides from the info or use the default 0
     */
    public bindInstancesBuffer(instancesBuffer: DataBuffer, attributesInfo: InstancingAttributeInfo[], computeStride = true): void {
        this.bindArrayBuffer(instancesBuffer);

        let stride = 0;
        if (computeStride) {
            for (let i = 0; i < attributesInfo.length; i++) {
                const ai = attributesInfo[i];
                stride += ai.attributeSize * 4;
            }
        }

        for (let i = 0; i < attributesInfo.length; i++) {
            const ai = attributesInfo[i];
            if (ai.index === undefined) {
                ai.index = this._currentEffect!.getAttributeLocationByName(ai.attributeName);
            }

            if (ai.index < 0) {
                continue;
            }

            if (!this._vertexAttribArraysEnabled[ai.index]) {
                this._gl.enableVertexAttribArray(ai.index);
                this._vertexAttribArraysEnabled[ai.index] = true;
            }

            this._vertexAttribPointer(instancesBuffer, ai.index, ai.attributeSize, ai.attributeType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
            this._gl.vertexAttribDivisor(ai.index, ai.divisor === undefined ? 1 : ai.divisor);
            this._currentInstanceLocations.push(ai.index);
            this._currentInstanceBuffers.push(instancesBuffer);
        }
    }

    /**
     * Disable the instance attribute corresponding to the name in parameter
     * @param name defines the name of the attribute to disable
     */
    public disableInstanceAttributeByName(name: string) {
        if (!this._currentEffect) {
            return;
        }

        const attributeLocation = this._currentEffect.getAttributeLocationByName(name);
        this.disableInstanceAttribute(attributeLocation);
    }

    /**
     * Disable the instance attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableInstanceAttribute(attributeLocation: number) {
        let shouldClean = false;
        let index: number;
        while ((index = this._currentInstanceLocations.indexOf(attributeLocation)) !== -1) {
            this._currentInstanceLocations.splice(index, 1);
            this._currentInstanceBuffers.splice(index, 1);

            shouldClean = true;
            index = this._currentInstanceLocations.indexOf(attributeLocation);
        }

        if (shouldClean) {
            this._gl.vertexAttribDivisor(attributeLocation, 0);
            this.disableAttributeByIndex(attributeLocation);
        }
    }

    /**
     * Disable the attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableAttributeByIndex(attributeLocation: number) {
        this._gl.disableVertexAttribArray(attributeLocation);
        this._vertexAttribArraysEnabled[attributeLocation] = false;
        this._currentBufferPointers[attributeLocation].active = false;
    }

    /**
     * Send a draw order
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
        this.drawElementsType(useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, indexStart, indexCount, instancesCount);
    }

    /**
     * Draw a list of points
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
        this.drawArraysType(Constants.MATERIAL_PointFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of unindexed primitives
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        this.drawArraysType(useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
        // Apply states
        this.applyStates();

        this._reportDrawCall();

        // Render

        const drawMode = this._drawMode(fillMode);
        const indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;
        const mult = this._uintIndicesCurrentlySet ? 4 : 2;
        if (instancesCount) {
            this._gl.drawElementsInstanced(drawMode, indexCount, indexFormat, indexStart * mult, instancesCount);
        } else {
            this._gl.drawElements(drawMode, indexCount, indexFormat, indexStart * mult);
        }
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        // Apply states
        this.applyStates();

        this._reportDrawCall();

        const drawMode = this._drawMode(fillMode);
        if (instancesCount) {
            this._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
        } else {
            this._gl.drawArrays(drawMode, verticesStart, verticesCount);
        }
    }

    /** @internal */
    protected _reportDrawCall() {
        // Will be implemented by children
    }

    // Shaders

    /**
     * @internal
     */
    public _releaseEffect(effect: Effect): void {
        if (this._compiledEffects[effect._key]) {
            delete this._compiledEffects[effect._key];
        }
        const pipelineContext = effect.getPipelineContext();
        if (pipelineContext) {
            this._deletePipelineContext(pipelineContext);
        }
    }

    /**
     * @internal
     */
    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            webGLPipelineContext.program.__SPECTOR_rebuildProgram = null;

            this._gl.deleteProgram(webGLPipelineContext.program);
        }
    }

    /** @internal */
    public _getGlobalDefines(defines?: { [key: string]: string }): string | undefined {
        if (defines) {
            if (this.isNDCHalfZRange) {
                defines["IS_NDC_HALF_ZRANGE"] = "";
            } else {
                delete defines["IS_NDC_HALF_ZRANGE"];
            }
            if (this.useReverseDepthBuffer) {
                defines["USE_REVERSE_DEPTHBUFFER"] = "";
            } else {
                delete defines["USE_REVERSE_DEPTHBUFFER"];
            }
            if (this.useExactSrgbConversions) {
                defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
            } else {
                delete defines["USE_EXACT_SRGB_CONVERSIONS"];
            }
            return;
        } else {
            let s = "";
            if (this.isNDCHalfZRange) {
                s += "#define IS_NDC_HALF_ZRANGE";
            }
            if (this.useReverseDepthBuffer) {
                if (s) {
                    s += "\n";
                }
                s += "#define USE_REVERSE_DEPTHBUFFER";
            }
            if (this.useExactSrgbConversions) {
                if (s) {
                    s += "\n";
                }
                s += "#define USE_EXACT_SRGB_CONVERSIONS";
            }
            return s;
        }
    }

    /**
     * Create a new effect (used to store vertex/fragment shaders)
     * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
     * @param attributesNamesOrOptions defines either a list of attribute names or an IEffectCreationOptions object
     * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
     * @param samplers defines an array of string used to represent textures
     * @param defines defines the string containing the defines to use to compile the shaders
     * @param fallbacks defines the list of potential fallbacks to use if shader compilation fails
     * @param onCompiled defines a function to call when the effect creation is successful
     * @param onError defines a function to call when the effect creation has failed
     * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
     * @param shaderLanguage the language the shader is written in (default: GLSL)
     * @returns the new Effect
     */
    public createEffect(
        baseName: any,
        attributesNamesOrOptions: string[] | IEffectCreationOptions,
        uniformsNamesOrEngine: string[] | ThinEngine,
        samplers?: string[],
        defines?: string,
        fallbacks?: IEffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>,
        onError?: Nullable<(effect: Effect, errors: string) => void>,
        indexParameters?: any,
        shaderLanguage = ShaderLanguage.GLSL
    ): Effect {
        const vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName.vertexSource || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName.fragmentSource || baseName;
        const globalDefines = this._getGlobalDefines()!;

        let fullDefines = defines ?? (<IEffectCreationOptions>attributesNamesOrOptions).defines ?? "";

        if (globalDefines) {
            fullDefines += globalDefines;
        }

        const name = vertex + "+" + fragment + "@" + fullDefines;
        if (this._compiledEffects[name]) {
            const compiledEffect = <Effect>this._compiledEffects[name];
            if (onCompiled && compiledEffect.isReady()) {
                onCompiled(compiledEffect);
            }

            return compiledEffect;
        }
        const effect = new Effect(
            baseName,
            attributesNamesOrOptions,
            uniformsNamesOrEngine,
            samplers,
            this,
            defines,
            fallbacks,
            onCompiled,
            onError,
            indexParameters,
            name,
            shaderLanguage
        );
        this._compiledEffects[name] = effect;

        return effect;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
        return shaderVersion + (defines ? defines + "\n" : "") + source;
    }

    /**
     * @internal
     */
    public _getShaderSource(shader: WebGLShader): Nullable<string> {
        return this._gl.getShaderSource(shader);
    }

    /**
     * Directly creates a webGL program
     * @param pipelineContext  defines the pipeline context to attach to
     * @param vertexCode defines the vertex shader code to use
     * @param fragmentCode defines the fragment shader code to use
     * @param context defines the webGL context to use (if not set, the current one will be used)
     * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
     * @returns the new webGL program
     */
    public createRawShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        context = context || this._gl;

        const vertexShader = this._compileRawShader(vertexCode, "vertex");
        const fragmentShader = this._compileRawShader(fragmentCode, "fragment");

        return this._createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    /**
     * Creates a webGL program
     * @param pipelineContext  defines the pipeline context to attach to
     * @param vertexCode  defines the vertex shader code to use
     * @param fragmentCode defines the fragment shader code to use
     * @param defines defines the string containing the defines to use to compile the shaders
     * @param context defines the webGL context to use (if not set, the current one will be used)
     * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
     * @returns the new webGL program
     */
    public createShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        context = context || this._gl;

        const shaderVersion = this._webGLVersion > 1 ? "#version 300 es\n#define WEBGL2 \n" : "";
        const vertexShader = this._compileShader(vertexCode, "vertex", defines, shaderVersion);
        const fragmentShader = this._compileShader(fragmentCode, "fragment", defines, shaderVersion);

        return this._createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    /**
     * Inline functions in shader code that are marked to be inlined
     * @param code code to inline
     * @returns inlined code
     */
    public inlineShaderCode(code: string): string {
        // no inlining needed in the WebGL engine
        return code;
    }

    /**
     * Creates a new pipeline context
     * @param shaderProcessingContext defines the shader processing context used during the processing if available
     * @returns the new pipeline
     */
    public createPipelineContext(shaderProcessingContext: Nullable<ShaderProcessingContext>): IPipelineContext {
        const pipelineContext = new WebGLPipelineContext();
        pipelineContext.engine = this;

        if (this._caps.parallelShaderCompile) {
            pipelineContext.isParallelCompiled = true;
        }

        return pipelineContext;
    }

    /**
     * Creates a new material context
     * @returns the new context
     */
    public createMaterialContext(): IMaterialContext | undefined {
        return undefined;
    }

    /**
     * Creates a new draw context
     * @returns the new context
     */
    public createDrawContext(): IDrawContext | undefined {
        return undefined;
    }

    protected _createShaderProgram(
        pipelineContext: WebGLPipelineContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader,
        context: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        const shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        context.linkProgram(shaderProgram);

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    protected _finalizePipelineContext(pipelineContext: WebGLPipelineContext) {
        const context = pipelineContext.context!;
        const vertexShader = pipelineContext.vertexShader!;
        const fragmentShader = pipelineContext.fragmentShader!;
        const program = pipelineContext.program!;

        const linked = context.getProgramParameter(program, context.LINK_STATUS);
        if (!linked) {
            // Get more info
            // Vertex
            if (!this._gl.getShaderParameter(vertexShader, this._gl.COMPILE_STATUS)) {
                const log = this._gl.getShaderInfoLog(vertexShader);
                if (log) {
                    pipelineContext.vertexCompilationError = log;
                    throw new Error("VERTEX SHADER " + log);
                }
            }

            // Fragment
            if (!this._gl.getShaderParameter(fragmentShader, this._gl.COMPILE_STATUS)) {
                const log = this._gl.getShaderInfoLog(fragmentShader);
                if (log) {
                    pipelineContext.fragmentCompilationError = log;
                    throw new Error("FRAGMENT SHADER " + log);
                }
            }

            const error = context.getProgramInfoLog(program);
            if (error) {
                pipelineContext.programLinkError = error;
                throw new Error(error);
            }
        }

        if (this.validateShaderPrograms) {
            context.validateProgram(program);
            const validated = context.getProgramParameter(program, context.VALIDATE_STATUS);

            if (!validated) {
                const error = context.getProgramInfoLog(program);
                if (error) {
                    pipelineContext.programValidationError = error;
                    throw new Error(error);
                }
            }
        }

        context.deleteShader(vertexShader);
        context.deleteShader(fragmentShader);

        pipelineContext.vertexShader = undefined;
        pipelineContext.fragmentShader = undefined;

        if (pipelineContext.onCompiled) {
            pipelineContext.onCompiled();
            pipelineContext.onCompiled = undefined;
        }
    }

    /**
     * @internal
     */
    public _preparePipelineContext(
        pipelineContext: IPipelineContext,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        createAsRaw: boolean,
        rawVertexSourceCode: string,
        rawFragmentSourceCode: string,
        rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>,
        key: string
    ) {
        const webGLRenderingState = pipelineContext as WebGLPipelineContext;

        if (createAsRaw) {
            webGLRenderingState.program = this.createRawShaderProgram(webGLRenderingState, vertexSourceCode, fragmentSourceCode, undefined, transformFeedbackVaryings);
        } else {
            webGLRenderingState.program = this.createShaderProgram(webGLRenderingState, vertexSourceCode, fragmentSourceCode, defines, undefined, transformFeedbackVaryings);
        }
        webGLRenderingState.program.__SPECTOR_rebuildProgram = rebuildRebind;
    }

    /**
     * @internal
     */
    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (this._isDisposed || webGLPipelineContext._isDisposed) {
            return false;
        }
        if (this._gl.getProgramParameter(webGLPipelineContext.program!, this._caps.parallelShaderCompile!.COMPLETION_STATUS_KHR)) {
            this._finalizePipelineContext(webGLPipelineContext);
            return true;
        }

        return false;
    }

    /**
     * @internal
     */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        if (!webGLPipelineContext.isParallelCompiled) {
            action();
            return;
        }

        const oldHandler = webGLPipelineContext.onCompiled;

        if (oldHandler) {
            webGLPipelineContext.onCompiled = () => {
                oldHandler!();
                action();
            };
        } else {
            webGLPipelineContext.onCompiled = action;
        }
    }

    /**
     * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
     * @param pipelineContext defines the pipeline context to use
     * @param uniformsNames defines the list of uniform names
     * @returns an array of webGL uniform locations
     */
    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
        const results = new Array<Nullable<WebGLUniformLocation>>();
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        for (let index = 0; index < uniformsNames.length; index++) {
            results.push(this._gl.getUniformLocation(webGLPipelineContext.program!, uniformsNames[index]));
        }

        return results;
    }

    /**
     * Gets the list of active attributes for a given webGL program
     * @param pipelineContext defines the pipeline context to use
     * @param attributesNames defines the list of attribute names to get
     * @returns an array of indices indicating the offset of each attribute
     */
    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const results = [];
        const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        for (let index = 0; index < attributesNames.length; index++) {
            try {
                results.push(this._gl.getAttribLocation(webGLPipelineContext.program!, attributesNames[index]));
            } catch (e) {
                results.push(-1);
            }
        }

        return results;
    }

    /**
     * Activates an effect, making it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    public enableEffect(effect: Nullable<Effect | DrawWrapper>): void {
        effect = effect !== null && DrawWrapper.IsWrapper(effect) ? effect.effect : effect; // get only the effect, we don't need a Wrapper in the WebGL engine

        if (!effect || effect === this._currentEffect) {
            return;
        }

        this._stencilStateComposer.stencilMaterial = undefined;

        effect = effect as Effect;

        // Use program
        this.bindSamplers(effect);

        this._currentEffect = effect;

        if (effect.onBind) {
            effect.onBind(effect);
        }
        if (effect._onBindObservable) {
            effect._onBindObservable.notifyObservers(effect);
        }
    }

    /**
     * Set the value of an uniform to a number (int)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the int number to store
     * @returns true if the value was set
     */
    public setInt(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform1i(uniform, value);

        return true;
    }

    /**
     * Set the value of an uniform to a int2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setInt2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform2i(uniform, x, y);

        return true;
    }

    /**
     * Set the value of an uniform to a int3
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @returns true if the value was set
     */
    public setInt3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform3i(uniform, x, y, z);

        return true;
    }

    /**
     * Set the value of an uniform to a int4
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @param w defines the 4th component of the value
     * @returns true if the value was set
     */
    public setInt4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform4i(uniform, x, y, z, w);

        return true;
    }

    /**
     * Set the value of an uniform to an array of int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform1iv(uniform, array);

        return true;
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        if (!uniform || array.length % 2 !== 0) {
            return false;
        }

        this._gl.uniform2iv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        if (!uniform || array.length % 3 !== 0) {
            return false;
        }

        this._gl.uniform3iv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        if (!uniform || array.length % 4 !== 0) {
            return false;
        }

        this._gl.uniform4iv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to a number (unsigned int)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the unsigned int number to store
     * @returns true if the value was set
     */
    public setUInt(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform1ui(uniform, value);

        return true;
    }

    /**
     * Set the value of an uniform to a unsigned int2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setUInt2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform2ui(uniform, x, y);

        return true;
    }

    /**
     * Set the value of an uniform to a unsigned int3
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @returns true if the value was set
     */
    public setUInt3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform3ui(uniform, x, y, z);

        return true;
    }

    /**
     * Set the value of an uniform to a unsigned int4
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @param w defines the 4th component of the value
     * @returns true if the value was set
     */
    public setUInt4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform4ui(uniform, x, y, z, w);

        return true;
    }

    /**
     * Set the value of an uniform to an array of unsigned int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform1uiv(uniform, array);

        return true;
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        if (!uniform || array.length % 2 !== 0) {
            return false;
        }

        this._gl.uniform2uiv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        if (!uniform || array.length % 3 !== 0) {
            return false;
        }

        this._gl.uniform3uiv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        if (!uniform || array.length % 4 !== 0) {
            return false;
        }

        this._gl.uniform4uiv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of number
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        if (array.length < 1) {
            return false;
        }
        this._gl.uniform1fv(uniform, array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        if (!uniform || array.length % 2 !== 0) {
            return false;
        }

        this._gl.uniform2fv(uniform, <any>array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        if (!uniform || array.length % 3 !== 0) {
            return false;
        }

        this._gl.uniform3fv(uniform, <any>array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        if (!uniform || array.length % 4 !== 0) {
            return false;
        }

        this._gl.uniform4fv(uniform, <any>array);
        return true;
    }

    /**
     * Set the value of an uniform to an array of float32 (stored as matrices)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrices defines the array of float32 to store
     * @returns true if the value was set
     */
    public setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniformMatrix4fv(uniform, false, matrices);
        return true;
    }

    /**
     * Set the value of an uniform to a matrix (3x3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 3x3 matrix to store
     * @returns true if the value was set
     */
    public setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniformMatrix3fv(uniform, false, matrix);
        return true;
    }

    /**
     * Set the value of an uniform to a matrix (2x2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 2x2 matrix to store
     * @returns true if the value was set
     */
    public setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniformMatrix2fv(uniform, false, matrix);
        return true;
    }

    /**
     * Set the value of an uniform to a number (float)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the float number to store
     * @returns true if the value was transferred
     */
    public setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform1f(uniform, value);

        return true;
    }

    /**
     * Set the value of an uniform to a vec2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform2f(uniform, x, y);

        return true;
    }

    /**
     * Set the value of an uniform to a vec3
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @returns true if the value was set
     */
    public setFloat3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform3f(uniform, x, y, z);

        return true;
    }

    /**
     * Set the value of an uniform to a vec4
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @param w defines the 4th component of the value
     * @returns true if the value was set
     */
    public setFloat4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        this._gl.uniform4f(uniform, x, y, z, w);

        return true;
    }

    // States

    /**
     * Apply all cached states (depth, culling, stencil and alpha)
     */
    public applyStates() {
        this._depthCullingState.apply(this._gl);
        this._stencilStateComposer.apply(this._gl);
        this._alphaState.apply(this._gl);

        if (this._colorWriteChanged) {
            this._colorWriteChanged = false;
            const enable = this._colorWrite;
            this._gl.colorMask(enable, enable, enable, enable);
        }
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public setColorWrite(enable: boolean): void {
        if (enable !== this._colorWrite) {
            this._colorWriteChanged = true;
            this._colorWrite = enable;
        }
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return this._colorWrite;
    }

    /**
     * Gets the depth culling state manager
     */
    public get depthCullingState(): DepthCullingState {
        return this._depthCullingState;
    }

    /**
     * Gets the alpha state manager
     */
    public get alphaState(): AlphaState {
        return this._alphaState;
    }

    /**
     * Gets the stencil state manager
     */
    public get stencilState(): StencilState {
        return this._stencilState;
    }

    /**
     * Gets the stencil state composer
     */
    public get stencilStateComposer(): StencilStateComposer {
        return this._stencilStateComposer;
    }

    // Textures

    /**
     * Clears the list of texture accessible through engine.
     * This can help preventing texture load conflict due to name collision.
     */
    public clearInternalTexturesCache() {
        this._internalTexturesCache.length = 0;
    }

    /**
     * Force the entire cache to be cleared
     * You should not have to use this function unless your engine needs to share the webGL context with another engine
     * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
     */
    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames && !bruteForce) {
            return;
        }
        this._currentEffect = null;
        this._viewportCached.x = 0;
        this._viewportCached.y = 0;
        this._viewportCached.z = 0;
        this._viewportCached.w = 0;

        // Done before in case we clean the attributes
        this._unbindVertexArrayObject();

        if (bruteForce) {
            this._currentProgram = null;
            this.resetTextureCache();

            this._stencilStateComposer.reset();

            this._depthCullingState.reset();
            this._depthCullingState.depthFunc = this._gl.LEQUAL;

            this._alphaState.reset();
            this._alphaMode = Constants.ALPHA_ADD;
            this._alphaEquation = Constants.ALPHA_DISABLE;

            this._colorWrite = true;
            this._colorWriteChanged = true;

            this._unpackFlipYCached = null;

            this._gl.pixelStorei(this._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._gl.NONE);
            this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);

            this._mustWipeVertexAttributes = true;
            this.unbindAllAttributes();
        }

        this._resetVertexBufferBinding();
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
        this.bindIndexBuffer(null);
    }

    /**
     * @internal
     */
    public _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
        const gl = this._gl;
        let magFilter: GLenum = gl.NEAREST;
        let minFilter: GLenum = gl.NEAREST;

        switch (samplingMode) {
            case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR:
                magFilter = gl.NEAREST;
                minFilter = gl.LINEAR;
                break;
            case Constants.TEXTURE_NEAREST_NEAREST:
                magFilter = gl.NEAREST;
                minFilter = gl.NEAREST;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR:
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST:
                magFilter = gl.LINEAR;
                minFilter = gl.NEAREST;
                break;
        }

        return {
            min: minFilter,
            mag: magFilter,
        };
    }

    /** @internal */
    protected _createTexture(): WebGLTexture {
        const texture = this._gl.createTexture();

        if (!texture) {
            throw new Error("Unable to create texture");
        }

        return texture;
    }

    /** @internal */
    public _createHardwareTexture(): HardwareTextureWrapper {
        return new WebGLHardwareTexture(this._createTexture(), this._gl);
    }

    /**
     * Creates an internal texture without binding it to a framebuffer
     * @internal
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @param delayGPUTextureCreation true to delay the texture creation the first time it is really needed. false to create it right away
     * @param source source type of the texture
     * @returns a new internal texture
     */
    public _createInternalTexture(
        size: TextureSize,
        options: boolean | InternalTextureCreationOptions,
        delayGPUTextureCreation = true,
        source = InternalTextureSource.Unknown
    ): InternalTexture {
        let generateMipMaps = false;
        let type = Constants.TEXTURETYPE_UNSIGNED_INT;
        let samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        let format = Constants.TEXTUREFORMAT_RGBA;
        let useSRGBBuffer = false;
        let samples = 1;
        let label: string | undefined;
        if (options !== undefined && typeof options === "object") {
            generateMipMaps = !!options.generateMipMaps;
            type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
            useSRGBBuffer = options.useSRGBBuffer === undefined ? false : options.useSRGBBuffer;
            samples = options.samples ?? 1;
            label = options.label;
        } else {
            generateMipMaps = !!options;
        }

        useSRGBBuffer &&= this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU);

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }

        const gl = this._gl;
        const texture = new InternalTexture(this, source);
        const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
        const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
        const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;
        const filters = this._getSamplingParameters(samplingMode, generateMipMaps);
        const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
        const sizedFormat = this._getRGBABufferInternalSizedFormat(type, format, useSRGBBuffer);
        const internalFormat = this._getInternalFormat(format);
        const textureType = this._getWebGLTextureType(type);

        // Bind
        this._bindTextureDirectly(target, texture);

        if (layers !== 0) {
            texture.is2DArray = true;
            gl.texImage3D(target, 0, sizedFormat, width, height, layers, 0, internalFormat, textureType, null);
        } else {
            gl.texImage2D(target, 0, sizedFormat, width, height, 0, internalFormat, textureType, null);
        }

        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filters.min);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // MipMaps
        if (generateMipMaps) {
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(target, null);

        texture._useSRGBBuffer = useSRGBBuffer;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.depth = layers;
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture.format = format;
        texture.label = label;

        this._internalTexturesCache.push(texture);

        return texture;
    }

    /**
     * @internal
     */
    public _getUseSRGBBuffer(useSRGBBuffer: boolean, noMipmap: boolean): boolean {
        // Generating mipmaps for sRGB textures is not supported in WebGL1 so we must disable the support if mipmaps is enabled
        return useSRGBBuffer && this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU || noMipmap);
    }

    protected _createTextureBase(
        url: Nullable<string>,
        noMipmap: boolean,
        invertY: boolean,
        scene: Nullable<ISceneLike>,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
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
        url = url || "";
        const fromData = url.substr(0, 5) === "data:";
        const fromBlob = url.substr(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;

        const texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Url);

        if (texture !== fallback) {
            texture.label = url.substring(0, 60); // default label, can be overriden by the caller
        }

        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
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

        for (const availableLoader of ThinEngine._TextureLoaders) {
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
        texture._useSRGBBuffer = this._getUseSRGBBuffer(!!useSRGBBuffer, noMipmap);

        if (!this._doNotHandleContextLost) {
            // Keep a link to the buffer only if we plan to handle context lost
            texture._buffer = buffer;
        }

        let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
        if (onLoad && !fallback) {
            onLoadObserver = texture.onLoadedObservable.add(onLoad);
        }

        if (!fallback) {
            this._internalTexturesCache.push(texture);
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
                    this._createTextureBase(
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
                this._createTextureBase(
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
                this._loadFile(
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
                if (fromBlob && !this._doNotHandleContextLost) {
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
                    ThinEngine._FileToolsLoadImage(
                        url,
                        onload,
                        onInternalError,
                        scene ? scene.offlineProvider : null,
                        mimeType,
                        texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
                    );
                }
            } else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
                ThinEngine._FileToolsLoadImage(
                    buffer,
                    onload,
                    onInternalError,
                    scene ? scene.offlineProvider : null,
                    mimeType,
                    texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
                );
            } else if (buffer) {
                onload(buffer);
            }
        }

        return texture;
    }

    /**
     * Usually called from Texture.ts.
     * Passed information to create a WebGLTexture
     * @param url defines a value which contains one of the following:
     * * A conventional http URL, e.g. 'http://...' or 'file://...'
     * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
     * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
     * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
     * @param scene needed for loading to the correct scene
     * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
     * @param onLoad optional callback to be called upon successful completion
     * @param onError optional callback to be called upon failure
     * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
     * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
     * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param mimeType defines an optional mime type
     * @param loaderOptions options to be passed to the loader
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(
        url: Nullable<string>,
        noMipmap: boolean,
        invertY: boolean,
        scene: Nullable<ISceneLike>,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<(texture: InternalTexture) => void> = null,
        onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
        fallback: Nullable<InternalTexture> = null,
        format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null,
        mimeType?: string,
        loaderOptions?: any,
        creationFlags?: number,
        useSRGBBuffer?: boolean
    ): InternalTexture {
        return this._createTextureBase(
            url,
            noMipmap,
            invertY,
            scene,
            samplingMode,
            onLoad,
            onError,
            this._prepareWebGLTexture.bind(this),
            (potWidth, potHeight, img, extension, texture, continuationCallback) => {
                const gl = this._gl;
                const isPot = img.width === potWidth && img.height === potHeight;

                const tip = this._getTexImageParametersForCreateTexture(format, extension, texture._useSRGBBuffer);
                if (isPot) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, img as any);
                    return false;
                }

                const maxTextureSize = this._caps.maxTextureSize;

                if (img.width > maxTextureSize || img.height > maxTextureSize || !this._supportsHardwareTextureRescaling) {
                    this._prepareWorkingCanvas();
                    if (!this._workingCanvas || !this._workingContext) {
                        return false;
                    }

                    this._workingCanvas.width = potWidth;
                    this._workingCanvas.height = potHeight;

                    this._workingContext.drawImage(img as any, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                    gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, this._workingCanvas as TexImageSource);

                    texture.width = potWidth;
                    texture.height = potHeight;

                    return false;
                } else {
                    // Using shaders when possible to rescale because canvas.drawImage is lossy
                    const source = new InternalTexture(this, InternalTextureSource.Temp);
                    this._bindTextureDirectly(gl.TEXTURE_2D, source, true);
                    gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, img as any);

                    this._rescaleTexture(source, texture, scene, tip.format, () => {
                        this._releaseTexture(source);
                        this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);

                        continuationCallback();
                    });
                }

                return true;
            },
            buffer,
            fallback,
            format,
            forcedExtension,
            mimeType,
            loaderOptions,
            useSRGBBuffer
        );
    }

    /**
     * Calls to the GL texImage2D and texImage3D functions require three arguments describing the pixel format of the texture.
     * createTexture derives these from the babylonFormat and useSRGBBuffer arguments and also the file extension of the URL it's working with.
     * This function encapsulates that derivation for easy unit testing.
     * @param babylonFormat Babylon's format enum, as specified in ITextureCreationOptions.
     * @param fileExtension The file extension including the dot, e.g. .jpg.
     * @param useSRGBBuffer Use SRGB not linear.
     * @returns The options to pass to texImage2D or texImage3D calls.
     * @internal
     */
    public _getTexImageParametersForCreateTexture(babylonFormat: Nullable<number>, fileExtension: string, useSRGBBuffer: boolean): TexImageParameters {
        if (babylonFormat === undefined || babylonFormat === null) {
            babylonFormat = fileExtension === ".jpg" && !useSRGBBuffer ? Constants.TEXTUREFORMAT_RGB : Constants.TEXTUREFORMAT_RGBA;
        }

        let format: number, internalFormat: number;
        if (this.webGLVersion === 1) {
            // In WebGL 1, format and internalFormat must be the same and taken from a limited set of values, see https://docs.gl/es2/glTexImage2D.
            // The SRGB extension (https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB) adds some extra values, hence passing useSRGBBuffer
            // to getInternalFormat.
            format = this._getInternalFormat(babylonFormat, useSRGBBuffer);
            internalFormat = format;
        } else {
            // In WebGL 2, format has a wider range of values and internal format can be one of the sized formats, see
            // https://registry.khronos.org/OpenGL-Refpages/es3.0/html/glTexImage2D.xhtml.
            // SRGB is included in the sized format and should not be passed in "format", hence always passing useSRGBBuffer as false.
            format = this._getInternalFormat(babylonFormat, false);
            internalFormat = this._getRGBABufferInternalSizedFormat(Constants.TEXTURETYPE_UNSIGNED_BYTE, babylonFormat, useSRGBBuffer);
        }

        return {
            internalFormat,
            format,
            type: this._gl.UNSIGNED_BYTE,
        };
    }

    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @param imageBitmapOptions optional the options to use when creating an ImageBitmap
     * @returns the HTMLImageElement of the loaded image
     * @internal
     */
    public static _FileToolsLoadImage(
        input: string | ArrayBuffer | ArrayBufferView | Blob,
        onLoad: (img: HTMLImageElement | ImageBitmap) => void,
        onError: (message?: string, exception?: any) => void,
        offlineProvider: Nullable<IOfflineProvider>,
        mimeType?: string,
        imageBitmapOptions?: ImageBitmapOptions
    ): Nullable<HTMLImageElement> {
        throw _WarnImport("FileTools");
    }

    /**
     * @internal
     */
    public _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {}

    /**
     * Creates a raw texture
     * @param data defines the data to store in the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param format defines the format of the data
     * @param generateMipMaps defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
     * @param compression defines the compression used (null by default)
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the raw texture inside an InternalTexture
     */
    public createRawTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        creationFlags = 0,
        useSRGBBuffer: boolean = false
    ): InternalTexture {
        throw _WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw cube texture
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
     * @param generateMipMaps  defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     * @returns the cube texture as an InternalTexture
     */
    public createRawCubeTexture(
        data: Nullable<ArrayBufferView[]>,
        size: number,
        format: number,
        type: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null
    ): InternalTexture {
        throw _WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw 3D texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the depth of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @returns a new raw 3D texture (stored in an InternalTexture)
     */
    public createRawTexture3D(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT
    ): InternalTexture {
        throw _WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw 2D array texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the number of layers of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @returns a new raw 2D array texture (stored in an InternalTexture)
     */
    public createRawTexture2DArray(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT
    ): InternalTexture {
        throw _WarnImport("Engine.RawTexture");
    }

    /**
     * In case you are sharing the context with other applications, it might
     * be interested to not cache the unpack flip y state to ensure a consistent
     * value would be set.
     */
    public enableUnpackFlipYCached = true;

    /**
     * @internal
     */
    public _unpackFlipY(value: boolean): void {
        if (this._unpackFlipYCached !== value) {
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, value ? 1 : 0);

            if (this.enableUnpackFlipYCached) {
                this._unpackFlipYCached = value;
            }
        }
    }

    /** @internal */
    public _getUnpackAlignement(): number {
        return this._gl.getParameter(this._gl.UNPACK_ALIGNMENT);
    }

    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     * @param generateMipMaps defines whether to generate mipmaps for the texture
     */
    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture, generateMipMaps: boolean = false): void {
        const target = this._getTextureTarget(texture);
        const filters = this._getSamplingParameters(samplingMode, texture.useMipMaps || generateMipMaps);

        this._setTextureParameterInteger(target, this._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
        this._setTextureParameterInteger(target, this._gl.TEXTURE_MIN_FILTER, filters.min);

        if (generateMipMaps) {
            texture.generateMipMaps = true;
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(target, null);

        texture.samplingMode = samplingMode;
    }

    /**
     * Update the dimensions of a texture
     * @param texture texture to update
     * @param width new width of the texture
     * @param height new height of the texture
     * @param depth new depth of the texture
     */
    public updateTextureDimensions(texture: InternalTexture, width: number, height: number, depth: number = 1): void {}

    /**
     * Update the sampling mode of a given texture
     * @param texture defines the texture to update
     * @param wrapU defines the texture wrap mode of the u coordinates
     * @param wrapV defines the texture wrap mode of the v coordinates
     * @param wrapR defines the texture wrap mode of the r coordinates
     */
    public updateTextureWrappingMode(texture: InternalTexture, wrapU: Nullable<number>, wrapV: Nullable<number> = null, wrapR: Nullable<number> = null): void {
        const target = this._getTextureTarget(texture);

        if (wrapU !== null) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(wrapU), texture);
            texture._cachedWrapU = wrapU;
        }
        if (wrapV !== null) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(wrapV), texture);
            texture._cachedWrapV = wrapV;
        }
        if ((texture.is2DArray || texture.is3D) && wrapR !== null) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_R, this._getTextureWrapMode(wrapR), texture);
            texture._cachedWrapR = wrapR;
        }

        this._bindTextureDirectly(target, null);
    }

    /**
     * @internal
     */
    public _setupDepthStencilTexture(
        internalTexture: InternalTexture,
        size: number | { width: number; height: number; layers?: number },
        generateStencil: boolean,
        bilinearFiltering: boolean,
        comparisonFunction: number,
        samples = 1
    ): void {
        const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
        const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
        const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;

        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.is2DArray = layers > 0;
        internalTexture.depth = layers;
        internalTexture.isReady = true;
        internalTexture.samples = samples;
        internalTexture.generateMipMaps = false;
        internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        internalTexture._comparisonFunction = comparisonFunction;

        const gl = this._gl;
        const target = this._getTextureTarget(internalTexture);
        const samplingParameters = this._getSamplingParameters(internalTexture.samplingMode, false);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // TEXTURE_COMPARE_FUNC/MODE are only availble in WebGL2.
        if (this.webGLVersion > 1) {
            if (comparisonFunction === 0) {
                gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
                gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            } else {
                gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }
        }
    }

    /**
     * @internal
     */
    public _uploadCompressedDataToTextureDirectly(
        texture: InternalTexture,
        internalFormat: number,
        width: number,
        height: number,
        data: ArrayBufferView,
        faceIndex: number = 0,
        lod: number = 0
    ) {
        const gl = this._gl;

        let target: GLenum = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        if (texture._useSRGBBuffer) {
            switch (internalFormat) {
                case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
                case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
                    // Note, if using ETC1 and sRGB is requested, this will use ETC2 if available.
                    if (this._caps.etc2) {
                        internalFormat = gl.COMPRESSED_SRGB8_ETC2;
                    } else {
                        texture._useSRGBBuffer = false;
                    }
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                    if (this._caps.etc2) {
                        internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
                    } else {
                        texture._useSRGBBuffer = false;
                    }
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                    internalFormat = gl.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT;
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                    internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                    if (this._caps.s3tc_srgb) {
                        internalFormat = gl.COMPRESSED_SRGB_S3TC_DXT1_EXT;
                    } else {
                        // S3TC sRGB extension not supported
                        texture._useSRGBBuffer = false;
                    }
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
                    if (this._caps.s3tc_srgb) {
                        internalFormat = gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
                    } else {
                        // S3TC sRGB extension not supported
                        texture._useSRGBBuffer = false;
                    }
                    break;
                case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                    if (this._caps.s3tc_srgb) {
                        internalFormat = gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
                    } else {
                        // S3TC sRGB extension not supported
                        texture._useSRGBBuffer = false;
                    }
                    break;
                default:
                    // We don't support a sRGB format corresponding to internalFormat, so revert to non sRGB format
                    texture._useSRGBBuffer = false;
                    break;
            }
        }

        this._gl.compressedTexImage2D(target, lod, internalFormat, width, height, 0, <DataView>data);
    }

    /**
     * @internal
     */
    public _uploadDataToTextureDirectly(
        texture: InternalTexture,
        imageData: ArrayBufferView,
        faceIndex: number = 0,
        lod: number = 0,
        babylonInternalFormat?: number,
        useTextureWidthAndHeight = false
    ): void {
        const gl = this._gl;

        const textureType = this._getWebGLTextureType(texture.type);
        const format = this._getInternalFormat(texture.format);
        const internalFormat =
            babylonInternalFormat === undefined
                ? this._getRGBABufferInternalSizedFormat(texture.type, texture.format, texture._useSRGBBuffer)
                : this._getInternalFormat(babylonInternalFormat, texture._useSRGBBuffer);

        this._unpackFlipY(texture.invertY);

        let target: GLenum = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
        const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);
        const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
        const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

        gl.texImage2D(target, lod, internalFormat, width, height, 0, format, textureType, imageData);
    }

    /**
     * Update a portion of an internal texture
     * @param texture defines the texture to update
     * @param imageData defines the data to store into the texture
     * @param xOffset defines the x coordinates of the update rectangle
     * @param yOffset defines the y coordinates of the update rectangle
     * @param width defines the width of the update rectangle
     * @param height defines the height of the update rectangle
     * @param faceIndex defines the face index if texture is a cube (0 by default)
     * @param lod defines the lod level to update (0 by default)
     * @param generateMipMaps defines whether to generate mipmaps or not
     */
    public updateTextureData(
        texture: InternalTexture,
        imageData: ArrayBufferView,
        xOffset: number,
        yOffset: number,
        width: number,
        height: number,
        faceIndex: number = 0,
        lod: number = 0,
        generateMipMaps = false
    ): void {
        const gl = this._gl;

        const textureType = this._getWebGLTextureType(texture.type);
        const format = this._getInternalFormat(texture.format);

        this._unpackFlipY(texture.invertY);

        let targetForBinding: GLenum = gl.TEXTURE_2D;
        let target: GLenum = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
            targetForBinding = gl.TEXTURE_CUBE_MAP;
        }

        this._bindTextureDirectly(targetForBinding, texture, true);

        gl.texSubImage2D(target, lod, xOffset, yOffset, width, height, format, textureType, imageData);

        if (generateMipMaps) {
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(targetForBinding, null);
    }

    /**
     * @internal
     */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        const gl = this._gl;
        const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        this._bindTextureDirectly(bindTarget, texture, true);

        this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);

        this._bindTextureDirectly(bindTarget, null, true);
    }

    protected _prepareWebGLTextureContinuation(texture: InternalTexture, scene: Nullable<ISceneLike>, noMipmap: boolean, isCompressed: boolean, samplingMode: number): void {
        const gl = this._gl;
        if (!gl) {
            return;
        }

        const filters = this._getSamplingParameters(samplingMode, !noMipmap);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

        if (!noMipmap && !isCompressed) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        this._bindTextureDirectly(gl.TEXTURE_2D, null);

        // this.resetTextureCache();
        if (scene) {
            scene.removePendingData(texture);
        }

        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();
    }

    /**
     * @internal
     */
    public _setupFramebufferDepthAttachments(
        generateStencilBuffer: boolean,
        generateDepthBuffer: boolean,
        width: number,
        height: number,
        samples = 1
    ): Nullable<WebGLRenderbuffer> {
        const gl = this._gl;

        // Create the depth/stencil buffer
        if (generateStencilBuffer && generateDepthBuffer) {
            return this._createRenderBuffer(width, height, samples, gl.DEPTH_STENCIL, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        }
        if (generateDepthBuffer) {
            let depthFormat: GLenum = gl.DEPTH_COMPONENT16;
            if (this._webGLVersion > 1) {
                depthFormat = gl.DEPTH_COMPONENT32F;
            }

            return this._createRenderBuffer(width, height, samples, depthFormat, depthFormat, gl.DEPTH_ATTACHMENT);
        }
        if (generateStencilBuffer) {
            return this._createRenderBuffer(width, height, samples, gl.STENCIL_INDEX8, gl.STENCIL_INDEX8, gl.STENCIL_ATTACHMENT);
        }

        return null;
    }

    /**
     * @internal
     */
    public _createRenderBuffer(
        width: number,
        height: number,
        samples: number,
        internalFormat: number,
        msInternalFormat: number,
        attachment: number,
        unbindBuffer = true
    ): Nullable<WebGLRenderbuffer> {
        const gl = this._gl;
        const renderBuffer = gl.createRenderbuffer();
        return this._updateRenderBuffer(renderBuffer, width, height, samples, internalFormat, msInternalFormat, attachment, unbindBuffer);
    }

    public _updateRenderBuffer(
        renderBuffer: Nullable<WebGLRenderbuffer>,
        width: number,
        height: number,
        samples: number,
        internalFormat: number,
        msInternalFormat: number,
        attachment: number,
        unbindBuffer = true
    ): Nullable<WebGLRenderbuffer> {
        const gl = this._gl;

        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

        if (samples > 1 && gl.renderbufferStorageMultisample) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, msInternalFormat, width, height);
        } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
        }

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, renderBuffer);

        if (unbindBuffer) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        }

        return renderBuffer;
    }

    /**
     * @internal
     */
    public _releaseTexture(texture: InternalTexture): void {
        this._deleteTexture(texture._hardwareTexture?.underlyingResource);

        // Unbind channels
        this.unbindAllTextures();

        const index = this._internalTexturesCache.indexOf(texture);
        if (index !== -1) {
            this._internalTexturesCache.splice(index, 1);
        }

        // Integrated fixed lod samplers.
        if (texture._lodTextureHigh) {
            texture._lodTextureHigh.dispose();
        }
        if (texture._lodTextureMid) {
            texture._lodTextureMid.dispose();
        }
        if (texture._lodTextureLow) {
            texture._lodTextureLow.dispose();
        }

        // Integrated irradiance map.
        if (texture._irradianceTexture) {
            texture._irradianceTexture.dispose();
        }
    }

    /**
     * @internal
     */
    public _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
        const index = this._renderTargetWrapperCache.indexOf(rtWrapper);
        if (index !== -1) {
            this._renderTargetWrapperCache.splice(index, 1);
        }
    }

    protected _deleteTexture(texture: Nullable<WebGLTexture>): void {
        if (texture) {
            this._gl.deleteTexture(texture);
        }
    }

    protected _setProgram(program: WebGLProgram): void {
        if (this._currentProgram !== program) {
            this._gl.useProgram(program);
            this._currentProgram = program;
        }
    }

    protected _boundUniforms: { [key: number]: WebGLUniformLocation } = {};

    /**
     * Binds an effect to the webGL context
     * @param effect defines the effect to bind
     */
    public bindSamplers(effect: Effect): void {
        const webGLPipelineContext = effect.getPipelineContext() as WebGLPipelineContext;
        this._setProgram(webGLPipelineContext.program!);
        const samplers = effect.getSamplers();
        for (let index = 0; index < samplers.length; index++) {
            const uniform = effect.getUniform(samplers[index]);

            if (uniform) {
                this._boundUniforms[index] = uniform;
            }
        }
        this._currentEffect = null;
    }

    /**
     * @internal
     */
    public _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate = false, force = false): boolean {
        let wasPreviouslyBound = false;
        const isTextureForRendering = texture && texture._associatedChannel > -1;
        if (forTextureDataUpdate && isTextureForRendering) {
            this._activeChannel = texture!._associatedChannel;
        }

        const currentTextureBound = this._boundTexturesCache[this._activeChannel];

        if (currentTextureBound !== texture || force) {
            this._activateCurrentTexture();

            if (texture && texture.isMultiview) {
                //this._gl.bindTexture(target, texture ? texture._colorTextureArray : null);
                console.error(target, texture);
                throw "_bindTextureDirectly called with a multiview texture!";
            } else {
                this._gl.bindTexture(target, texture?._hardwareTexture?.underlyingResource ?? null);
            }

            this._boundTexturesCache[this._activeChannel] = texture;

            if (texture) {
                texture._associatedChannel = this._activeChannel;
            }
        } else if (forTextureDataUpdate) {
            wasPreviouslyBound = true;
            this._activateCurrentTexture();
        }

        if (isTextureForRendering && !forTextureDataUpdate) {
            this._bindSamplerUniformToChannel(texture!._associatedChannel, this._activeChannel);
        }

        return wasPreviouslyBound;
    }

    /**
     * @internal
     */
    public _bindTexture(channel: number, texture: Nullable<InternalTexture>, name: string): void {
        if (channel === undefined) {
            return;
        }

        if (texture) {
            texture._associatedChannel = channel;
        }

        this._activeChannel = channel;
        const target = texture ? this._getTextureTarget(texture) : this._gl.TEXTURE_2D;
        this._bindTextureDirectly(target, texture);
    }

    /**
     * Unbind all textures from the webGL context
     */
    public unbindAllTextures(): void {
        for (let channel = 0; channel < this._maxSimultaneousTextures; channel++) {
            this._activeChannel = channel;
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            if (this.webGLVersion > 1) {
                this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);
            }
        }
    }

    /**
     * Sets a texture to the according uniform.
     * @param channel The texture channel
     * @param uniform The uniform to set
     * @param texture The texture to apply
     * @param name The name of the uniform in the effect
     */
    public setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<ThinTexture>, name: string): void {
        if (channel === undefined) {
            return;
        }

        if (uniform) {
            this._boundUniforms[channel] = uniform;
        }

        this._setTexture(channel, texture);
    }

    protected _setTexture(channel: number, texture: Nullable<ThinTexture>, isPartOfTextureArray = false, depthStencilTexture = false, name = ""): boolean {
        // Not ready?
        if (!texture) {
            if (this._boundTexturesCache[channel] != null) {
                this._activeChannel = channel;
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
                if (this.webGLVersion > 1) {
                    this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);
                }
            }
            return false;
        }

        // Video
        if ((<VideoTexture>texture).video) {
            this._activeChannel = channel;
            const videoInternalTexture = (<VideoTexture>texture).getInternalTexture();
            if (videoInternalTexture) {
                videoInternalTexture._associatedChannel = channel;
            }
            (<VideoTexture>texture).update();
        } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) {
            // Delay loading
            texture.delayLoad();
            return false;
        }

        let internalTexture: InternalTexture;
        if (depthStencilTexture) {
            internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
        } else if (texture.isReady()) {
            internalTexture = <InternalTexture>texture.getInternalTexture();
        } else if (texture.isCube) {
            internalTexture = this.emptyCubeTexture;
        } else if (texture.is3D) {
            internalTexture = this.emptyTexture3D;
        } else if (texture.is2DArray) {
            internalTexture = this.emptyTexture2DArray;
        } else {
            internalTexture = this.emptyTexture;
        }

        if (!isPartOfTextureArray && internalTexture) {
            internalTexture._associatedChannel = channel;
        }

        let needToBind = true;
        if (this._boundTexturesCache[channel] === internalTexture) {
            if (!isPartOfTextureArray) {
                this._bindSamplerUniformToChannel(internalTexture._associatedChannel, channel);
            }

            needToBind = false;
        }

        this._activeChannel = channel;
        const target = this._getTextureTarget(internalTexture);
        if (needToBind) {
            this._bindTextureDirectly(target, internalTexture, isPartOfTextureArray);
        }

        if (internalTexture && !internalTexture.isMultiview) {
            // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
            if (internalTexture.isCube && internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                internalTexture._cachedCoordinatesMode = texture.coordinatesMode;

                const textureWrapMode =
                    texture.coordinatesMode !== Constants.TEXTURE_CUBIC_MODE && texture.coordinatesMode !== Constants.TEXTURE_SKYBOX_MODE
                        ? Constants.TEXTURE_WRAP_ADDRESSMODE
                        : Constants.TEXTURE_CLAMP_ADDRESSMODE;
                texture.wrapU = textureWrapMode;
                texture.wrapV = textureWrapMode;
            }

            if (internalTexture._cachedWrapU !== texture.wrapU) {
                internalTexture._cachedWrapU = texture.wrapU;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(texture.wrapU), internalTexture);
            }

            if (internalTexture._cachedWrapV !== texture.wrapV) {
                internalTexture._cachedWrapV = texture.wrapV;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(texture.wrapV), internalTexture);
            }

            if (internalTexture.is3D && internalTexture._cachedWrapR !== texture.wrapR) {
                internalTexture._cachedWrapR = texture.wrapR;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_R, this._getTextureWrapMode(texture.wrapR), internalTexture);
            }

            this._setAnisotropicLevel(target, internalTexture, texture.anisotropicFilteringLevel);
        }

        return true;
    }

    /**
     * Sets an array of texture to the webGL context
     * @param channel defines the channel where the texture array must be set
     * @param uniform defines the associated uniform location
     * @param textures defines the array of textures to bind
     * @param name name of the channel
     */
    public setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: ThinTexture[], name: string): void {
        if (channel === undefined || !uniform) {
            return;
        }

        if (!this._textureUnits || this._textureUnits.length !== textures.length) {
            this._textureUnits = new Int32Array(textures.length);
        }
        for (let i = 0; i < textures.length; i++) {
            const texture = textures[i].getInternalTexture();

            if (texture) {
                this._textureUnits[i] = channel + i;
                texture._associatedChannel = channel + i;
            } else {
                this._textureUnits[i] = -1;
            }
        }
        this._gl.uniform1iv(uniform, this._textureUnits);

        for (let index = 0; index < textures.length; index++) {
            this._setTexture(this._textureUnits[index], textures[index], true);
        }
    }

    /**
     * @internal
     */
    public _setAnisotropicLevel(target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
        const anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
        if (
            internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST &&
            internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR &&
            internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR
        ) {
            anisotropicFilteringLevel = 1; // Forcing the anisotropic to 1 because else webgl will force filters to linear
        }

        if (anisotropicFilterExtension && internalTexture._cachedAnisotropicFilteringLevel !== anisotropicFilteringLevel) {
            this._setTextureParameterFloat(
                target,
                anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT,
                Math.min(anisotropicFilteringLevel, this._caps.maxAnisotropy),
                internalTexture
            );
            internalTexture._cachedAnisotropicFilteringLevel = anisotropicFilteringLevel;
        }
    }

    /**
     * Unbind all vertex attributes from the webGL context
     */
    public unbindAllAttributes() {
        if (this._mustWipeVertexAttributes) {
            this._mustWipeVertexAttributes = false;

            for (let i = 0; i < this._caps.maxVertexAttribs; i++) {
                this.disableAttributeByIndex(i);
            }
            return;
        }

        for (let i = 0, ul = this._vertexAttribArraysEnabled.length; i < ul; i++) {
            if (i >= this._caps.maxVertexAttribs || !this._vertexAttribArraysEnabled[i]) {
                continue;
            }

            this.disableAttributeByIndex(i);
        }
    }

    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseEffects() {
        for (const name in this._compiledEffects) {
            const webGLPipelineContext = this._compiledEffects[name].getPipelineContext() as WebGLPipelineContext;
            this._deletePipelineContext(webGLPipelineContext);
        }

        this._compiledEffects = {};
    }

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        dispose(this._engineState);
    }

    /**
     * Attach a new callback raised when context lost event is fired
     * @param callback defines the callback to call
     */
    public attachContextLostEvent(callback: (event: WebGLContextEvent) => void): void {
        if (this._renderingCanvas) {
            this._renderingCanvas.addEventListener("webglcontextlost", <any>callback, false);
        }
    }

    /**
     * Attach a new callback raised when context restored event is fired
     * @param callback defines the callback to call
     */
    public attachContextRestoredEvent(callback: (event: WebGLContextEvent) => void): void {
        if (this._renderingCanvas) {
            this._renderingCanvas.addEventListener("webglcontextrestored", <any>callback, false);
        }
    }

    /**
     * Get the current error code of the webGL context
     * @returns the error code
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
     */
    public getError(): number {
        return this._gl.getError();
    }

    /**
     * @internal
     */
    public _getWebGLTextureType(type: number): number {
        if (this._webGLVersion === 1) {
            switch (type) {
                case Constants.TEXTURETYPE_FLOAT:
                    return this._gl.FLOAT;
                case Constants.TEXTURETYPE_HALF_FLOAT:
                    return this._gl.HALF_FLOAT_OES;
                case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                    return this._gl.UNSIGNED_BYTE;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                    return this._gl.UNSIGNED_SHORT_4_4_4_4;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                    return this._gl.UNSIGNED_SHORT_5_5_5_1;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                    return this._gl.UNSIGNED_SHORT_5_6_5;
            }
            return this._gl.UNSIGNED_BYTE;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                return this._gl.BYTE;
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                return this._gl.UNSIGNED_BYTE;
            case Constants.TEXTURETYPE_SHORT:
                return this._gl.SHORT;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                return this._gl.UNSIGNED_SHORT;
            case Constants.TEXTURETYPE_INT:
                return this._gl.INT;
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                return this._gl.UNSIGNED_INT;
            case Constants.TEXTURETYPE_FLOAT:
                return this._gl.FLOAT;
            case Constants.TEXTURETYPE_HALF_FLOAT:
                return this._gl.HALF_FLOAT;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return this._gl.UNSIGNED_SHORT_4_4_4_4;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return this._gl.UNSIGNED_SHORT_5_5_5_1;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return this._gl.UNSIGNED_SHORT_5_6_5;
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                return this._gl.UNSIGNED_INT_2_10_10_10_REV;
            case Constants.TEXTURETYPE_UNSIGNED_INT_24_8:
                return this._gl.UNSIGNED_INT_24_8;
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                return this._gl.UNSIGNED_INT_10F_11F_11F_REV;
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                return this._gl.UNSIGNED_INT_5_9_9_9_REV;
            case Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV:
                return this._gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
        }

        return this._gl.UNSIGNED_BYTE;
    }

    /**
     * @internal
     */
    public _getInternalFormat(format: number, useSRGBBuffer = false): number {
        let internalFormat: GLenum = useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : this._gl.RGBA;

        switch (format) {
            case Constants.TEXTUREFORMAT_ALPHA:
                internalFormat = this._gl.ALPHA;
                break;
            case Constants.TEXTUREFORMAT_LUMINANCE:
                internalFormat = this._gl.LUMINANCE;
                break;
            case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                internalFormat = this._gl.LUMINANCE_ALPHA;
                break;
            case Constants.TEXTUREFORMAT_RED:
                internalFormat = this._gl.RED;
                break;
            case Constants.TEXTUREFORMAT_RG:
                internalFormat = this._gl.RG;
                break;
            case Constants.TEXTUREFORMAT_RGB:
                internalFormat = useSRGBBuffer ? this._glSRGBExtensionValues.SRGB : this._gl.RGB;
                break;
            case Constants.TEXTUREFORMAT_RGBA:
                internalFormat = useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : this._gl.RGBA;
                break;
        }

        if (this._webGLVersion > 1) {
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    internalFormat = this._gl.RED_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    internalFormat = this._gl.RG_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    internalFormat = this._gl.RGB_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    internalFormat = this._gl.RGBA_INTEGER;
                    break;
            }
        }

        return internalFormat;
    }

    /**
     * @internal
     */
    public _getRGBABufferInternalSizedFormat(type: number, format?: number, useSRGBBuffer = false): number {
        if (this._webGLVersion === 1) {
            if (format !== undefined) {
                switch (format) {
                    case Constants.TEXTUREFORMAT_ALPHA:
                        return this._gl.ALPHA;
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        return this._gl.LUMINANCE;
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        return this._gl.LUMINANCE_ALPHA;
                    case Constants.TEXTUREFORMAT_RGB:
                        return useSRGBBuffer ? this._glSRGBExtensionValues.SRGB : this._gl.RGB;
                }
            }
            return this._gl.RGBA;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R8_SNORM;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG8_SNORM;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB8_SNORM;
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R8I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG8I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB8I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA8I;
                    default:
                        return this._gl.RGBA8_SNORM;
                }
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R8;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG8;
                    case Constants.TEXTUREFORMAT_RGB:
                        return useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8 : this._gl.RGB8; // By default. Other possibilities are RGB565, SRGB8.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : this._gl.RGBA8; // By default. Other possibilities are RGB5_A1, RGBA4, SRGB8_ALPHA8.
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R8UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG8UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB8UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA8UI;
                    case Constants.TEXTUREFORMAT_ALPHA:
                        return this._gl.ALPHA;
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        return this._gl.LUMINANCE;
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        return this._gl.LUMINANCE_ALPHA;
                    default:
                        return this._gl.RGBA8;
                }
            case Constants.TEXTURETYPE_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R16I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG16I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB16I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA16I;
                    default:
                        return this._gl.RGBA16I;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R16UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG16UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB16UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA16UI;
                    default:
                        return this._gl.RGBA16UI;
                }
            case Constants.TEXTURETYPE_INT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R32I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG32I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB32I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA32I;
                    default:
                        return this._gl.RGBA32I;
                }
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R32UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG32UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB32UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA32UI;
                    default:
                        return this._gl.RGBA32UI;
                }
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R32F; // By default. Other possibility is R16F.
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG32F; // By default. Other possibility is RG16F.
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB32F; // By default. Other possibilities are RGB16F, R11F_G11F_B10F, RGB9_E5.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGBA32F; // By default. Other possibility is RGBA16F.
                    default:
                        return this._gl.RGBA32F;
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R16F;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG16F;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB16F; // By default. Other possibilities are R11F_G11F_B10F, RGB9_E5.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGBA16F;
                    default:
                        return this._gl.RGBA16F;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return this._gl.RGB565;
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                return this._gl.R11F_G11F_B10F;
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                return this._gl.RGB9_E5;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return this._gl.RGBA4;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return this._gl.RGB5_A1;
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGB10_A2; // By default. Other possibility is RGB5_A1.
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGB10_A2UI;
                    default:
                        return this._gl.RGB10_A2;
                }
        }

        return useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : this._gl.RGBA8;
    }

    /**
     * @internal
     */
    public _getRGBAMultiSampleBufferFormat(type: number, format = Constants.TEXTUREFORMAT_RGBA): number {
        switch (type) {
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_R:
                        return this._gl.R32F;
                    default:
                        return this._gl.RGBA32F;
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_R:
                        return this._gl.R16F;
                    default:
                        return this._gl.RGBA16F;
                }
        }

        return this._gl.RGBA8;
    }

    /**
     * @internal
     */
    public _loadFile(
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (data: any) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: IWebRequest, exception?: any) => void
    ): IFileRequest {
        const request = ThinEngine._FileToolsLoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @internal
     */
    public static _FileToolsLoadFile(
        url: string,
        onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void,
        onProgress?: (ev: ProgressEvent) => void,
        offlineProvider?: IOfflineProvider,
        useArrayBuffer?: boolean,
        onError?: (request?: WebRequest, exception?: LoadFileError) => void
    ): IFileRequest {
        throw _WarnImport("FileTools");
    }

    /**
     * Reads pixels from the current frame buffer. Please note that this function can be slow
     * @param x defines the x coordinate of the rectangle where pixels must be read
     * @param y defines the y coordinate of the rectangle where pixels must be read
     * @param width defines the width of the rectangle where pixels must be read
     * @param height defines the height of the rectangle where pixels must be read
     * @param hasAlpha defines whether the output should have alpha or not (defaults to true)
     * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
     * @returns a ArrayBufferView promise (Uint8Array) containing RGBA colors
     */
    public readPixels(x: number, y: number, width: number, height: number, hasAlpha = true, flushRenderer = true): Promise<ArrayBufferView> {
        const numChannels = hasAlpha ? 4 : 3;
        const format = hasAlpha ? this._gl.RGBA : this._gl.RGB;
        const data = new Uint8Array(height * width * numChannels);
        if (flushRenderer) {
            this.flushFramebuffer();
        }
        this._gl.readPixels(x, y, width, height, format, this._gl.UNSIGNED_BYTE, data);
        return Promise.resolve(data);
    }

    // Statics

    /**
     * Gets a Promise<boolean> indicating if the engine can be instantiated (ie. if a webGL context can be found)
     */
    public static get IsSupportedAsync(): Promise<boolean> {
        return Promise.resolve(this.isSupported());
    }

    /**
     * Gets a boolean indicating if the engine can be instantiated (ie. if a webGL context can be found)
     */
    public static get IsSupported(): boolean {
        return this.isSupported(); // Backward compat
    }

    /**
     * Gets a boolean indicating if the engine can be instantiated (ie. if a webGL context can be found)
     * @returns true if the engine can be created
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static isSupported(): boolean {
        if (this._HasMajorPerformanceCaveat !== null) {
            return !this._HasMajorPerformanceCaveat; // We know it is performant so WebGL is supported
        }

        if (this._IsSupported === null) {
            try {
                const tempcanvas = this._CreateCanvas(1, 1);
                const gl = tempcanvas.getContext("webgl") || (tempcanvas as any).getContext("experimental-webgl");

                this._IsSupported = gl != null && !!window.WebGLRenderingContext;
            } catch (e) {
                this._IsSupported = false;
            }
        }

        return this._IsSupported;
    }

    /**
     * Gets a boolean indicating if the engine can be instantiated on a performant device (ie. if a webGL context can be found and it does not use a slow implementation)
     */
    public static get HasMajorPerformanceCaveat(): boolean {
        if (this._HasMajorPerformanceCaveat === null) {
            try {
                const tempcanvas = this._CreateCanvas(1, 1);
                const gl =
                    tempcanvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
                    (tempcanvas as any).getContext("experimental-webgl", { failIfMajorPerformanceCaveat: true });

                this._HasMajorPerformanceCaveat = !gl;
            } catch (e) {
                this._HasMajorPerformanceCaveat = false;
            }
        }

        return this._HasMajorPerformanceCaveat;
    }

    /**
     * Find the next highest power of two.
     * @param x Number to start search from.
     * @returns Next highest power of two.
     */
    public static CeilingPOT(x: number): number {
        x--;
        x |= x >> 1;
        x |= x >> 2;
        x |= x >> 4;
        x |= x >> 8;
        x |= x >> 16;
        x++;
        return x;
    }

    /**
     * Find the next lowest power of two.
     * @param x Number to start search from.
     * @returns Next lowest power of two.
     */
    public static FloorPOT(x: number): number {
        x = x | (x >> 1);
        x = x | (x >> 2);
        x = x | (x >> 4);
        x = x | (x >> 8);
        x = x | (x >> 16);
        return x - (x >> 1);
    }

    /**
     * Find the nearest power of two.
     * @param x Number to start search from.
     * @returns Next nearest power of two.
     */
    public static NearestPOT(x: number): number {
        const c = ThinEngine.CeilingPOT(x);
        const f = ThinEngine.FloorPOT(x);
        return c - x > x - f ? f : c;
    }

    /**
     * Get the closest exponent of two
     * @param value defines the value to approximate
     * @param max defines the maximum value to return
     * @param mode defines how to define the closest value
     * @returns closest exponent of two of the given value
     */
    public static GetExponentOfTwo(value: number, max: number, mode = Constants.SCALEMODE_NEAREST): number {
        let pot;

        switch (mode) {
            case Constants.SCALEMODE_FLOOR:
                pot = ThinEngine.FloorPOT(value);
                break;
            case Constants.SCALEMODE_NEAREST:
                pot = ThinEngine.NearestPOT(value);
                break;
            case Constants.SCALEMODE_CEILING:
            default:
                pot = ThinEngine.CeilingPOT(value);
                break;
        }

        return Math.min(pot, max);
    }

    /**
     * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
     * @param func - the function to be called
     * @param requester - the object that will request the next frame. Falls back to window.
     * @returns frame number
     */
    public static QueueNewFrame(func: () => void, requester?: any): number {
        // Note that there is kind of a typing issue here, as `setTimeout` might return something else than a number (NodeJs returns a NodeJS.Timeout object).
        // Also if the global `requestAnimationFrame`'s returnType is number, `requester.requestPostAnimationFrame` and `requester.requestAnimationFrame` types
        // are `any`.

        if (!IsWindowObjectExist()) {
            if (typeof requestAnimationFrame === "function") {
                return requestAnimationFrame(func);
            }
        } else {
            const { requestAnimationFrame } = requester || window;
            if (typeof requestAnimationFrame === "function") {
                return requestAnimationFrame(func);
            }
        }

        // fallback to the global `setTimeout`.
        // In most cases (aka in the browser), `window` is the global object, so instead of calling `window.setTimeout` we could call the global `setTimeout`.
        return setTimeout(func, 16) as unknown as number;
    }

    /**
     * Gets host document
     * @returns the host document object
     */
    public getHostDocument(): Nullable<Document> {
        if (this._renderingCanvas && this._renderingCanvas.ownerDocument) {
            return this._renderingCanvas.ownerDocument;
        }

        return IsDocumentAvailable() ? document : null;
    }
}

interface TexImageParameters {
    internalFormat: number;
    format: number;
    type: number;
}
