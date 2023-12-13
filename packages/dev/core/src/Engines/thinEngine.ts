/* eslint-disable @typescript-eslint/no-unused-vars */
import type { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import type { IEffectCreationOptions } from "../Materials/effect";
import { Effect } from "../Materials/effect";
import { _WarnImport } from "../Misc/devTools";
import type { IShaderProcessor } from "./Processors/iShaderProcessor";
import type { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import type { UniformBuffer } from "../Materials/uniformBuffer";
import type { Nullable, DataArray, IndicesArray } from "../types";
import type { EngineCapabilities } from "./engineCapabilities";
import { Observable } from "../Misc/observable";
import type { DepthCullingState } from "../States/depthCullingState";
import type { StencilState } from "../States/stencilState";
import type { AlphaState } from "../States/alphaCullingState";
import { Constants } from "./constants";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IViewportLike, IColor4Like } from "../Maths/math.like";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { IFileRequest } from "../Misc/fileRequest";
import type { IPipelineContext } from "./IPipelineContext";
import type { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { VertexBuffer } from "../Buffers/buffer";
import type { InstancingAttributeInfo } from "./instancingAttributeInfo";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { IEffectFallbacks } from "../Materials/iEffectFallbacks";
import type { IWebRequest } from "../Misc/interfaces/iWebRequest";
import type { EngineFeatures } from "./engineFeatures";
import type { HardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import type { DrawWrapper } from "../Materials/drawWrapper";
import type { IMaterialContext } from "./IMaterialContext";
import type { IDrawContext } from "./IDrawContext";
import type { ICanvas, ICanvasRenderingContext, IImage } from "./ICanvas";
import type { StencilStateComposer } from "../States/stencilStateComposer";
import type { StorageBuffer } from "../Buffers/storageBuffer";
import type { IAudioEngineOptions } from "../Audio/Interfaces/IAudioEngineOptions";
import type { IStencilState } from "../States/IStencilState";
import type { InternalTextureCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import type { WebRequest } from "../Misc/webRequest";
import type { LoadFileError } from "../Misc/fileTools";
import type { Texture } from "../Materials/Textures/texture";
import {
    CeilingPOT,
    ExceptionList,
    FloorPOT,
    GetExponentOfTwo,
    HasMajorPerformanceCaveat,
    IsWebGLSupported,
    NearestPOT,
    NpmPackage,
    QueueNewFrame,
    Version,
    _ConcatenateShader,
    _CreateCanvas,
    _TextureLoaders,
} from "core/esm/Engines/engine.static";
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
    updateAndBindInstancesBuffer,
    bindInstancesBuffer,
    disableInstanceAttributeByName,
    disableInstanceAttribute,
    disableAttributeByIndex,
    drawElementsType,
    drawArraysType,
    _deletePipelineContext,
    createEffect,
    _getShaderSource,
    createRawShaderProgram,
    createShaderProgram,
    createPipelineContext,
    _createShaderProgramThin,
    _finalizePipelineContext,
    _preparePipelineContext,
    _isRenderingStateCompiled,
    _executeWhenRenderingStateIsCompiled,
    getUniforms,
    getAttributes,
    enableEffect,
    setArray,
    setArray2,
    setArray3,
    setArray4,
    setFloat,
    setFloat2,
    setFloat3,
    setFloat4,
    setInt,
    setInt2,
    setInt3,
    setInt4,
    setIntArray,
    setIntArray2,
    setIntArray3,
    setIntArray4,
    setMatrices,
    setMatrix2x2,
    setMatrix3x3,
    setUInt,
    setUInt2,
    setUInt3,
    setUInt4,
    setUIntArray,
    setUIntArray2,
    setUIntArray3,
    setUIntArray4,
    applyStates,
    _getSamplingParameters,
    _createTexture,
    _createHardwareTexture,
    _createInternalTexture,
    _getUseSRGBBuffer,
    createTexture,
    _getTexImageParametersForCreateTexture,
    _unpackFlipY,
    _getUnpackAlignement,
    updateTextureSamplingMode,
    updateTextureWrappingMode,
    _setupDepthStencilTexture,
    _uploadCompressedDataToTextureDirectly,
    _uploadDataToTextureDirectly,
    updateTextureData,
    _uploadArrayBufferViewToTexture,
    _prepareWebGLTextureContinuation,
    _setupFramebufferDepthAttachments,
    _createRenderBuffer,
    _updateRenderBuffer,
    _releaseTexture,
    _deleteTexture,
    _setProgram,
    bindSamplers,
    _bindTextureDirectly,
    _bindTexture,
    unbindAllTextures,
    setTexture,
    _setTexture,
    setTextureArray,
    _setAnisotropicLevel,
    unbindAllAttributes,
    releaseEffects,
    attachContextLostEvent,
    attachContextRestoredEvent,
    getError,
    _getWebGLTextureType,
    _getInternalFormat,
    _getRGBABufferInternalSizedFormat,
    _getRGBAMultiSampleBufferFormat,
    readPixels,
    setHardwareScalingLevel,
    resize,
    _releaseEffect,
} from "core/esm/Engines/WebGL/engine.webgl";
import {
    _cancelFrameThin,
    _getGlobalDefines,
    _prepareWorkingCanvas,
    _rebuildBuffers,
    _releaseRenderTargetWrapper,
    _setupMobileChecks,
    _sharedInit,
    areAllEffectsReady,
    clearInternalTexturesCache,
    endFrame,
    getColorWrite,
    getHostDocument,
    getHostWindow,
    resetTextureCache,
    setColorWrite,
    stopRenderLoop,
} from "core/esm/Engines/engine.base";
import { _createTextureBase, _renderLoopBase, _restoreEngineAfterContextLost, runRenderLoopBase } from "core/esm/Engines/engine.extendable";
import { _loadFile } from "core/esm/Engines/engine.tools";
import type { ISceneLike } from "core/esm/Engines/engine.interfaces";
import { hostInformation } from "core/esm/Engines/runtimeEnvironment";
import { augmentEngineState } from "core/esm/Engines/engine.adapters";

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
    /** @internal */
    public _engineState: WebGLEngineState;
    /** Use this array to turn off some WebGL2 features on known buggy browsers version */
    public static ExceptionList = ExceptionList;

    /** @internal */
    public static _TextureLoaders: IInternalTextureLoader[] = _TextureLoaders;

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
        return this._engineState.description;
    }

    /** @internal */
    protected _name = "WebGL";

    /**
     * Gets or sets the name of the engine
     */
    public get name(): string {
        return this._engineState.name;
    }

    public set name(value: string) {
        this._engineState.name = value;
    }

    /**
     * Returns the version of the engine
     */
    public get version(): number {
        return this._engineState._webGLVersion;
    }

    // ESMTODO Support other engines
    protected _isDisposed = false;

    public get isDisposed(): boolean {
        return this._engineState._isDisposed;
    }

    // Updatable statics so stick with vars here

    /**
     * // ESMTODO - not sure what to do with this one
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

    // ESMTODO Support other engines
    protected _shaderProcessor: Nullable<IShaderProcessor>;

    /**
     * @internal
     */
    public _getShaderProcessor(shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
        return this._engineState._shaderProcessor;
    }

    /**
     * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
     */
    public get forcePOTTextures(): boolean {
        return this._engineState.forcePOTTextures;
    }

    public set forcePOTTextures(value: boolean) {
        this._engineState.forcePOTTextures = value;
    }

    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    public get isFullscreen(): boolean {
        return this._engineState.isFullscreen;
    }

    public set isFullscreen(value: boolean) {
        this._engineState.isFullscreen = value;
    }

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
    public get isNDCHalfZRange(): boolean {
        return this._engineState.isNDCHalfZRange;
    }

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    public get hasOriginBottomLeft(): boolean {
        return this._engineState.hasOriginBottomLeft;
    }

    /**
     * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
     */
    public get disableUniformBuffers(): boolean {
        return this._engineState.disableUniformBuffers;
    }

    public set disableUniformBuffers(value: boolean) {
        this._engineState.disableUniformBuffers = value;
    }

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
    public get startTime(): number {
        return this._engineState.startTime;
    }

    /** @internal */
    public get _uniformBuffers(): UniformBuffer[] {
        return this._engineState._uniformBuffers;
    }
    /** @internal */
    public get _storageBuffers(): StorageBuffer[] {
        return this._engineState._storageBuffers;
    }

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     */
    public get supportsUniformBuffers(): boolean {
        return this._engineState.supportsUniformBuffers;
    }

    /** @internal */
    public get _gl(): WebGL2RenderingContext {
        return this._engineState._gl;
    }
    /** @internal */
    public get _webGLVersion(): number {
        return this._engineState._webGLVersion;
    }

    public set _webGLVersion(value: number) {
        this._engineState._webGLVersion = value;
    }

    protected get _renderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._engineState._renderingCanvas;
    }

    protected set _renderingCanvas(value: Nullable<HTMLCanvasElement>) {
        this._engineState._renderingCanvas = value;
    }

    protected get _windowIsBackground(): boolean {
        return this._engineState._windowIsBackground;
    }

    protected set _windowIsBackground(value: boolean) {
        this._engineState._windowIsBackground = value;
    }

    protected get _creationOptions(): EngineOptions {
        return this._engineState._creationOptions;
    }

    protected set _creationOptions(value: EngineOptions) {
        this._engineState._creationOptions = value;
    }
    protected _audioContext: Nullable<AudioContext>;
    protected _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
    /** @internal */
    public get _glSRGBExtensionValues() {
        return this._engineState._glSRGBExtensionValues;
    }
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
    public get _badOS(): boolean {
        return this._engineState._badOS;
    }

    public set _badOS(value: boolean) {
        this._engineState._badOS = value;
    }

    /** @internal */
    /** @internal */
    public get _badDesktopOS(): boolean {
        return this._engineState._badDesktopOS;
    }
    public set _badDesktopOS(value: boolean) {
        this._engineState._badDesktopOS = value;
    }

    /** @internal */
    public get _hardwareScalingLevel(): number {
        return this._engineState._hardwareScalingLevel;
    }
    public set _hardwareScalingLevel(value: number) {
        this._engineState._hardwareScalingLevel = value;
    }

    /** @internal */
    public get _caps(): EngineCapabilities {
        return this._engineState._caps;
    }
    public set _caps(value: EngineCapabilities) {
        this._engineState._caps = value;
    }

    /** @internal */
    public get _features(): EngineFeatures {
        return this._engineState._features;
    }
    public set _features(value: EngineFeatures) {
        this._engineState._features = value;
    }
    protected _isStencilEnable: boolean;

    /** @internal */
    public get _videoTextureSupported(): boolean {
        return this._engineState._videoTextureSupported;
    }

    public set _videoTextureSupported(value: boolean) {
        this._engineState._videoTextureSupported = value;
    }

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
    public get _doNotHandleContextLost(): boolean {
        return this._engineState.doNotHandleContextLost;
    }

    public set _doNotHandleContextLost(value: boolean) {
        this._engineState.doNotHandleContextLost = value;
    }

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
    public get disableVertexArrayObjects(): boolean {
        return this._engineState.disableVertexArrayObjects;
    }

    public set disableVertexArrayObjects(value: boolean) {
        this._engineState.disableVertexArrayObjects = value;
    }

    // States
    /** @internal */
    protected get _colorWrite(): boolean {
        return this._engineState._colorWrite;
    }

    /** @internal */
    protected set _colorWrite(value: boolean) {
        this._engineState._colorWrite = value;
    }

    /** @internal */
    protected get _colorWriteChanged(): boolean {
        return this._engineState._colorWriteChanged;
    }

    /** @internal */
    protected set _colorWriteChanged(value: boolean) {
        this._engineState._colorWriteChanged = value;
    }

    /** @internal */
    protected get _depthCullingState(): DepthCullingState {
        return this._engineState._depthCullingState;
    }

    protected set _depthCullingState(value: DepthCullingState) {
        this._engineState._depthCullingState = value;
    }

    /** @internal */
    protected get _stencilStateComposer(): StencilStateComposer {
        return this._engineState._stencilStateComposer;
    }

    protected set _stencilStateComposer(value: StencilStateComposer) {
        this._engineState._stencilStateComposer = value;
    }

    /** @internal */
    protected get _stencilState(): StencilState {
        return this._engineState._stencilState;
    }

    protected set _stencilState(value: StencilState) {
        this._engineState._stencilState = value;
    }

    /** @internal */
    public get _alphaState(): AlphaState {
        return this._engineState._alphaState;
    }

    public set _alphaState(value: AlphaState) {
        this._engineState._alphaState = value;
    }

    /** @internal */
    public get _alphaMode(): number {
        return this._engineState._alphaMode;
    }

    /** @internal */
    public set _alphaMode(value: number) {
        this._engineState._alphaMode = value;
    }

    /** @internal */
    public get _alphaEquation(): number {
        return this._engineState._alphaEquation;
    }

    public set _alphaEquation(value: number) {
        this._engineState._alphaEquation = value;
    }

    // Cache
    /** @internal */
    public get _internalTexturesCache(): InternalTexture[] {
        return this._engineState._internalTexturesCache;
    }

    public set _internalTexturesCache(value: InternalTexture[]) {
        this._engineState._internalTexturesCache = value;
    }

    /** @internal */
    public get _renderTargetWrapperCache(): RenderTargetWrapper[] {
        return this._engineState._renderTargetWrapperCache;
    }

    public set _renderTargetWrapperCache(value: RenderTargetWrapper[]) {
        this._engineState._renderTargetWrapperCache = value;
    }
    /** @internal */
    protected get _activeChannel(): number {
        return this._engineState._activeChannel;
    }

    protected set _activeChannel(value: number) {
        this._engineState._activeChannel = value;
    }

    /** @internal */
    protected get _boundTexturesCache(): { [key: string]: Nullable<InternalTexture> } {
        return this._engineState._boundTexturesCache;
    }

    protected set _boundTexturesCache(value: { [key: string]: Nullable<InternalTexture> }) {
        this._engineState._boundTexturesCache = value;
    }

    protected get _currentEffect(): Nullable<Effect> {
        return this._engineState._currentEffect;
    }

    protected set _currentEffect(value: Nullable<Effect>) {
        this._engineState._currentEffect = value;
    }
    /** @internal */
    public _currentDrawContext: IDrawContext; // WebGPU only
    /** @internal */
    public _currentMaterialContext: IMaterialContext; // WebGPU only
    /** @internal */
    protected get _currentProgram(): Nullable<WebGLProgram> {
        return this._engineState._currentProgram;
    }

    protected set _currentProgram(value: Nullable<WebGLProgram>) {
        this._engineState._currentProgram = value;
    }
    protected get _compiledEffects(): { [key: string]: Effect } {
        return this._engineState._compiledEffects;
    }

    protected set _compiledEffects(value: { [key: string]: Effect }) {
        this._engineState._compiledEffects = value;
    }
    /** @internal */
    protected get _cachedViewport(): Nullable<IViewportLike> {
        return this._engineState._cachedViewport;
    }

    protected set _cachedViewport(value: Nullable<IViewportLike>) {
        this._engineState._cachedViewport = value;
    }
    /** @internal */
    protected get _cachedVertexBuffers(): any {
        return this._engineState._cachedVertexBuffers;
    }

    protected set _cachedVertexBuffers(value: any) {
        this._engineState._cachedVertexBuffers = value;
    }
    /** @internal */
    protected get _cachedIndexBuffer(): Nullable<DataBuffer> {
        return this._engineState._cachedIndexBuffer;
    }

    protected set _cachedIndexBuffer(value: Nullable<DataBuffer>) {
        this._engineState._cachedIndexBuffer = value;
    }
    /** @internal */
    protected get _cachedEffectForVertexBuffers(): Nullable<Effect> {
        return this._engineState._cachedEffectForVertexBuffers;
    }

    protected set _cachedEffectForVertexBuffers(value: Nullable<Effect>) {
        this._engineState._cachedEffectForVertexBuffers = value;
    }

    /** @internal */
    public get _currentRenderTarget(): Nullable<RenderTargetWrapper> {
        return this._engineState._currentRenderTarget;
    }

    public set _currentRenderTarget(value: Nullable<RenderTargetWrapper>) {
        this._engineState._currentRenderTarget = value;
    }

    protected get _currentBoundBuffer(): Array<Nullable<DataBuffer>> {
        return this._engineState._currentBoundBuffer;
    }

    protected set _currentBoundBuffer(value: Array<Nullable<DataBuffer>>) {
        this._engineState._currentBoundBuffer = value;
    }

    /** @internal */
    public get _currentFramebuffer(): Nullable<WebGLFramebuffer> {
        return this._engineState._currentFramebuffer;
    }

    public set _currentFramebuffer(value: Nullable<WebGLFramebuffer>) {
        this._engineState._currentFramebuffer = value;
    }

    /** @internal */
    public get _dummyFramebuffer(): Nullable<WebGLFramebuffer> {
        return this._engineState._dummyFramebuffer;
    }

    public set _dummyFramebuffer(value: Nullable<WebGLFramebuffer>) {
        this._engineState._dummyFramebuffer = value;
    }

    /** @internal */
    public get _workingCanvas(): Nullable<ICanvas> {
        return this._engineState._workingCanvas;
    }

    public set _workingCanvas(value: Nullable<ICanvas>) {
        this._engineState._workingCanvas = value;
    }

    /** @internal */
    public get _workingContext(): Nullable<ICanvasRenderingContext> {
        return this._engineState._workingContext;
    }

    public set _workingContext(value: Nullable<ICanvasRenderingContext>) {
        this._engineState._workingContext = value;
    }

    /** @internal */
    public get _boundRenderFunction(): any {
        return this._engineState._boundRenderFunction;
    }

    public set _boundRenderFunction(value: any) {
        this._engineState._boundRenderFunction = value;
    }

    /** @internal */
    public get _frameHandler(): number {
        return this._engineState._frameHandler;
    }

    public set _frameHandler(value: number) {
        this._engineState._frameHandler = value;
    }
    /**
     * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
     */
    public get adaptToDeviceRatio(): boolean {
        return this._engineState.adaptToDeviceRatio;
    }

    public set adaptToDeviceRatio(value: boolean) {
        this._engineState.adaptToDeviceRatio = value;
    }

    /** @internal */
    protected get _lastDevicePixelRatio(): number {
        return this._engineState._lastDevicePixelRatio;
    }

    protected set _lastDevicePixelRatio(value: number) {
        this._engineState._lastDevicePixelRatio = value;
    }

    /** @internal */
    public get _transformTextureUrl(): Nullable<(url: string) => string> {
        return this._engineState._transformTextureUrl;
    }

    public set _transformTextureUrl(value: Nullable<(url: string) => string>) {
        this._engineState._transformTextureUrl = value;
    }

    /**
     * Gets information about the current host
     */
    public get hostInformation(): HostInformation {
        return hostInformation;
    }

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
        return this._engineState.emptyTexture!;
    }

    /**
     * Gets the default empty 3D texture
     */
    public get emptyTexture3D(): InternalTexture {
        return this._engineState.emptyTexture3D!;
    }

    /**
     * Gets the default empty 2D array texture
     */
    public get emptyTexture2DArray(): InternalTexture {
        return this._engineState.emptyTexture2DArray!;
    }

    /**
     * Gets the default empty cube texture
     */
    public get emptyCubeTexture(): InternalTexture {
        return this._engineState.emptyCubeTexture!;
    }

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    public get premultipliedAlpha(): boolean {
        return this._engineState.premultipliedAlpha;
    }

    public set premultipliedAlpha(value: boolean) {
        this._engineState.premultipliedAlpha = value;
    }

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
    protected get _shaderPlatformName(): string {
        return this._engineState._shaderPlatformName;
    }

    /** @internal */
    protected set _shaderPlatformName(value: string) {
        this._engineState._shaderPlatformName = value;
    }
    /**
     * Gets the shader platform name used by the effects.
     */
    public get shaderPlatformName(): string {
        return this._engineState.shaderPlatformName;
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

    // WebGPU only, not in ESM for now
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
    public get useExactSrgbConversions(): boolean {
        return this._engineState.useExactSrgbConversions;
    }

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
        this._engineState = initWebGLEngineState(canvasOrContext, { ...options, antialias, adaptToDeviceRatio });
        this._engineState.onDisposeObservable.add(() => {
            this.onDisposeObservable.notifyObservers(this);
        });
        this._engineState.onContextLostObservable.add(() => {
            this.onContextLostObservable.notifyObservers(this);
        });
        this._engineState.onContextRestoredObservable.add(() => {
            this.onContextRestoredObservable.notifyObservers(this);
        });

        augmentEngineState(this._engineState, {
            // add all of the thinEngine functions here
            _unpackFlipY,
            updateTextureSamplingMode,
            _getRGBABufferInternalSizedFormat,
            _uploadDataToTextureDirectly,
            enableEffect,
            setState,
            setDepthBuffer,
            createEffect,
            _bindTexture,
            setTexture,
            restoreDefaultFramebuffer,
            _releaseRenderTargetWrapper,
            _createHardwareTexture,
            createTexture,
            _releaseTexture,
            _releaseEffect,
            _bindUnboundFramebuffer,
            getUniforms,
            getAttributes,
        });
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
        return this._engineState._webGLVersion;
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
        return this.getGlInfo();
    }

    /**
     * Gets an object containing information about the current webGL context
     * @returns an object containing the vendor, the renderer and the version of the current webGL context
     */
    public getGlInfo() {
        const glInfo = getGlInfo(this._engineState);
        return {
            vendor: glInfo.glVendor,
            renderer: glInfo.glRenderer,
            version: glInfo.glVersion,
        };
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
        return _cancelFrameThin(this._engineState);
    }

    /** @internal */
    public _renderLoop(): void {
        _renderLoopBase(
            {
                endFrameFunc: this.endFrame,
                queueNewFrameFunc: QueueNewFrame,
                beginFrameFunc: this.beginFrame,
            },
            this._engineState
        );
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
        runRenderLoopBase(
            {
                endFrameFunc: this.endFrame,
                queueNewFrameFunc: QueueNewFrame,
                beginFrameFunc: this.beginFrame,
            },
            this._engineState,
            renderFunction
        );
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

    protected get _viewportCached(): { x: number; y: number; z: number; w: number } {
        return this._engineState._viewportCached;
    }

    protected set _viewportCached(value: { x: number; y: number; z: number; w: number }) {
        this._engineState._viewportCached = value;
    }

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
    public beginFrame = () => {};

    /**
     * Enf the current frame
     */
    public endFrame = () => {
        endFrame(this._engineState);
    };

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
        updateAndBindInstancesBuffer(this._engineState, instancesBuffer, data, offsetLocations);
    }

    /**
     * Bind the content of a webGL buffer used with instantiation
     * @param instancesBuffer defines the webGL buffer to bind
     * @param attributesInfo defines the offsets or attributes information used to determine where data must be stored in the buffer
     * @param computeStride defines Whether to compute the strides from the info or use the default 0
     */
    public bindInstancesBuffer(instancesBuffer: DataBuffer, attributesInfo: InstancingAttributeInfo[], computeStride = true): void {
        bindInstancesBuffer(this._engineState, instancesBuffer, attributesInfo, computeStride);
    }

    /**
     * Disable the instance attribute corresponding to the name in parameter
     * @param name defines the name of the attribute to disable
     */
    public disableInstanceAttributeByName(name: string) {
        disableInstanceAttributeByName(this._engineState, name);
    }

    /**
     * Disable the instance attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableInstanceAttribute(attributeLocation: number) {
        disableInstanceAttribute(this._engineState, attributeLocation);
    }

    /**
     * Disable the attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableAttributeByIndex(attributeLocation: number) {
        disableAttributeByIndex(this._engineState, attributeLocation);
    }

    /**
     * Send a draw order
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
        drawElementsType(this._engineState, useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, indexStart, indexCount, instancesCount);
    }

    /**
     * Draw a list of points
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
        drawArraysType(this._engineState, Constants.MATERIAL_PointFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of unindexed primitives
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        drawArraysType(this._engineState, useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
        drawElementsType(this._engineState, fillMode, indexStart, indexCount, instancesCount);
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        drawArraysType(this._engineState, fillMode, verticesStart, verticesCount, instancesCount);
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
        _releaseEffect(this._engineState, effect);
    }

    /**
     * @internal
     */
    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        _deletePipelineContext(this._engineState, pipelineContext);
    }

    /** @internal */
    public _getGlobalDefines(defines?: { [key: string]: string }): string | undefined {
        return _getGlobalDefines(this._engineState, defines);
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
        return createEffect(
            this._engineState,
            baseName,
            attributesNamesOrOptions,
            uniformsNamesOrEngine,
            samplers,
            defines,
            fallbacks,
            onCompiled,
            onError,
            indexParameters,
            shaderLanguage
        );
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _ConcatenateShader = _ConcatenateShader;

    /**
     * @internal
     */
    public _getShaderSource(shader: WebGLShader): Nullable<string> {
        return _getShaderSource(this._engineState, shader);
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
        return createRawShaderProgram(this._engineState, pipelineContext, vertexCode, fragmentCode, context, transformFeedbackVaryings);
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
        return createShaderProgram(this._engineState, pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
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
        return createPipelineContext(this._engineState, shaderProcessingContext);
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
        return _createShaderProgramThin(this._engineState, pipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    protected _finalizePipelineContext(pipelineContext: WebGLPipelineContext) {
        _finalizePipelineContext(this._engineState, pipelineContext);
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
        _preparePipelineContext(
            this._engineState,
            pipelineContext,
            vertexSourceCode,
            fragmentSourceCode,
            createAsRaw,
            rawVertexSourceCode,
            rawFragmentSourceCode,
            rebuildRebind,
            defines,
            transformFeedbackVaryings,
            key
        );
    }

    /**
     * @internal
     */
    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        return _isRenderingStateCompiled(this._engineState, pipelineContext);
    }

    /**
     * @internal
     */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        _executeWhenRenderingStateIsCompiled(this._engineState, pipelineContext, action);
    }

    /**
     * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
     * @param pipelineContext defines the pipeline context to use
     * @param uniformsNames defines the list of uniform names
     * @returns an array of webGL uniform locations
     */
    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
        return getUniforms(this._engineState, pipelineContext, uniformsNames);
    }

    /**
     * Gets the list of active attributes for a given webGL program
     * @param pipelineContext defines the pipeline context to use
     * @param attributesNames defines the list of attribute names to get
     * @returns an array of indices indicating the offset of each attribute
     */
    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        return getAttributes(this._engineState, pipelineContext, attributesNames);
    }

    /**
     * Activates an effect, making it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    public enableEffect(effect: Nullable<Effect | DrawWrapper>): void {
        enableEffect(this._engineState, effect);
    }

    /**
     * Set the value of an uniform to a number (int)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the int number to store
     * @returns true if the value was set
     */
    public setInt(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        return setInt(this._engineState, uniform, value);
    }

    /**
     * Set the value of an uniform to a int2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setInt2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        return setInt2(this._engineState, uniform, x, y);
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
        return setInt3(this._engineState, uniform, x, y, z);
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
        return setInt4(this._engineState, uniform, x, y, z, w);
    }

    /**
     * Set the value of an uniform to an array of int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        return setIntArray(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        return setIntArray2(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        return setIntArray3(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     * @returns true if the value was set
     */
    public setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
        return setIntArray4(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to a number (unsigned int)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the unsigned int number to store
     * @returns true if the value was set
     */
    public setUInt(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        return setUInt(this._engineState, uniform, value);
    }

    /**
     * Set the value of an uniform to a unsigned int2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setUInt2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        return setUInt2(this._engineState, uniform, x, y);
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
        return setUInt3(this._engineState, uniform, x, y, z);
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
        return setUInt4(this._engineState, uniform, x, y, z, w);
    }

    /**
     * Set the value of an uniform to an array of unsigned int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        return setUIntArray(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        return setUIntArray2(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        return setUIntArray3(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of unsigned int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of unsigned int32 to store
     * @returns true if the value was set
     */
    public setUIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
        return setUIntArray4(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        return setArray(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        return setArray2(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        return setArray3(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     * @returns true if the value was set
     */
    public setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
        return setArray4(this._engineState, uniform, array);
    }

    /**
     * Set the value of an uniform to an array of float32 (stored as matrices)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrices defines the array of float32 to store
     * @returns true if the value was set
     */
    public setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): boolean {
        return setMatrices(this._engineState, uniform, matrices);
    }

    /**
     * Set the value of an uniform to a matrix (3x3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 3x3 matrix to store
     * @returns true if the value was set
     */
    public setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
        return setMatrix3x3(this._engineState, uniform, matrix);
    }

    /**
     * Set the value of an uniform to a matrix (2x2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 2x2 matrix to store
     * @returns true if the value was set
     */
    public setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
        return setMatrix2x2(this._engineState, uniform, matrix);
    }

    /**
     * Set the value of an uniform to a number (float)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the float number to store
     * @returns true if the value was transferred
     */
    public setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
        return setFloat(this._engineState, uniform, value);
    }

    /**
     * Set the value of an uniform to a vec2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @returns true if the value was set
     */
    public setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        return setFloat2(this._engineState, uniform, x, y);
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
        return setFloat3(this._engineState, uniform, x, y, z);
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
        return setFloat4(this._engineState, uniform, x, y, z, w);
    }

    // States

    /**
     * Apply all cached states (depth, culling, stencil and alpha)
     */
    public applyStates() {
        applyStates(this._engineState);
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public setColorWrite(enable: boolean): void {
        setColorWrite(this._engineState, enable);
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return getColorWrite(this._engineState);
    }

    /**
     * Gets the depth culling state manager
     */
    public get depthCullingState(): DepthCullingState {
        return this._engineState._depthCullingState;
    }

    /**
     * Gets the alpha state manager
     */
    public get alphaState(): AlphaState {
        return this._engineState._alphaState;
    }

    /**
     * Gets the stencil state manager
     */
    public get stencilState(): StencilState {
        return this._engineState._stencilState;
    }

    /**
     * Gets the stencil state composer
     */
    public get stencilStateComposer(): StencilStateComposer {
        return this._engineState._stencilStateComposer;
    }

    // Textures

    /**
     * Clears the list of texture accessible through engine.
     * This can help preventing texture load conflict due to name collision.
     */
    public clearInternalTexturesCache() {
        clearInternalTexturesCache(this._engineState);
    }

    /**
     * Force the entire cache to be cleared
     * You should not have to use this function unless your engine needs to share the webGL context with another engine
     * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
     */
    public wipeCaches(bruteForce?: boolean): void {
        wipeCaches(this._engineState, bruteForce);
    }

    /**
     * @internal
     */
    public _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
        return _getSamplingParameters(this._engineState, samplingMode, generateMipMaps);
    }

    /** @internal */
    protected _createTexture(): WebGLTexture {
        return _createTexture(this._engineState);
    }

    /** @internal */
    public _createHardwareTexture(): HardwareTextureWrapper {
        return _createHardwareTexture(this._engineState);
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
        return _createInternalTexture(this._engineState, size, options, delayGPUTextureCreation, source);
    }

    /**
     * @internal
     * // ESMTODO - WebGPU is not present in ESM's implementation.
     */
    public _getUseSRGBBuffer(useSRGBBuffer: boolean, noMipmap: boolean): boolean {
        return _getUseSRGBBuffer(this._engineState, useSRGBBuffer, noMipmap);
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
        return _createTextureBase<ThinEngine>(
            {
                getUseSRGBBuffer: _getUseSRGBBuffer,
                engineAdapter: this,
            },
            this._engineState,
            url,
            noMipmap,
            invertY,
            scene,
            samplingMode,
            onLoad,
            onError,
            prepareTexture,
            prepareTextureProcessFunction,
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
        return createTexture(
            this._engineState,
            url,
            noMipmap,
            invertY,
            scene,
            samplingMode,
            onLoad,
            onError,
            buffer,
            fallback,
            format,
            forcedExtension,
            mimeType,
            loaderOptions,
            creationFlags,
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
        return _getTexImageParametersForCreateTexture(this._engineState, babylonFormat, fileExtension, useSRGBBuffer);
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
        _unpackFlipY(this._engineState, value);
    }

    /** @internal */
    public _getUnpackAlignement(): number {
        return _getUnpackAlignement(this._engineState);
    }

    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     * @param generateMipMaps defines whether to generate mipmaps for the texture
     */
    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture, generateMipMaps: boolean = false): void {
        return updateTextureSamplingMode(this._engineState, samplingMode, texture, generateMipMaps);
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
        return updateTextureWrappingMode(this._engineState, texture, wrapU, wrapV, wrapR);
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
        _setupDepthStencilTexture(this._engineState, internalTexture, size, generateStencil, bilinearFiltering, comparisonFunction, samples);
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
        _uploadCompressedDataToTextureDirectly(this._engineState, texture, internalFormat, width, height, data, faceIndex, lod);
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
        _uploadDataToTextureDirectly(this._engineState, texture, imageData, faceIndex, lod, babylonInternalFormat, useTextureWidthAndHeight);
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
        updateTextureData(this._engineState, texture, imageData, xOffset, yOffset, width, height, faceIndex, lod, generateMipMaps);
    }

    /**
     * @internal
     */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        _uploadArrayBufferViewToTexture(this._engineState, texture, imageData, faceIndex, lod);
    }

    protected _prepareWebGLTextureContinuation(texture: InternalTexture, scene: Nullable<ISceneLike>, noMipmap: boolean, isCompressed: boolean, samplingMode: number): void {
        _prepareWebGLTextureContinuation(this._engineState, texture, scene, noMipmap, isCompressed, samplingMode);
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
        return _setupFramebufferDepthAttachments(this._engineState, generateStencilBuffer, generateDepthBuffer, width, height, samples);
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
        return _createRenderBuffer(this._engineState, width, height, samples, internalFormat, msInternalFormat, attachment, unbindBuffer);
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
        return _updateRenderBuffer(this._engineState, renderBuffer, width, height, samples, internalFormat, msInternalFormat, attachment, unbindBuffer);
    }

    /**
     * @internal
     */
    public _releaseTexture(texture: InternalTexture): void {
        _releaseTexture(this._engineState, texture);
    }

    /**
     * @internal
     */
    public _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
        _releaseRenderTargetWrapper(this._engineState, rtWrapper);
    }

    protected _deleteTexture(texture: Nullable<WebGLTexture>): void {
        _deleteTexture(this._engineState, texture);
    }

    protected _setProgram(program: WebGLProgram): void {
        _setProgram(this._engineState, program);
    }

    protected _boundUniforms: { [key: number]: WebGLUniformLocation } = {};

    /**
     * Binds an effect to the webGL context
     * @param effect defines the effect to bind
     */
    public bindSamplers(effect: Effect): void {
        bindSamplers(this._engineState, effect);
    }

    /**
     * @internal
     */
    public _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate = false, force = false): boolean {
        return _bindTextureDirectly(this._engineState, target, texture, forTextureDataUpdate, force);
    }

    /**
     * @internal
     */
    public _bindTexture(channel: number, texture: Nullable<InternalTexture>, name: string): void {
        _bindTexture(this._engineState, channel, texture, name);
    }

    /**
     * Unbind all textures from the webGL context
     */
    public unbindAllTextures(): void {
        unbindAllTextures(this._engineState);
    }

    /**
     * Sets a texture to the according uniform.
     * @param channel The texture channel
     * @param uniform The uniform to set
     * @param texture The texture to apply
     * @param name The name of the uniform in the effect
     */
    public setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<ThinTexture>, name: string): void {
        setTexture(this._engineState, channel, uniform, texture, name);
    }

    protected _setTexture(channel: number, texture: Nullable<ThinTexture>, isPartOfTextureArray = false, depthStencilTexture = false, name = ""): boolean {
        return _setTexture(this._engineState, channel, texture, isPartOfTextureArray, depthStencilTexture, name);
    }

    /**
     * Sets an array of texture to the webGL context
     * @param channel defines the channel where the texture array must be set
     * @param uniform defines the associated uniform location
     * @param textures defines the array of textures to bind
     * @param name name of the channel
     */
    public setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: ThinTexture[], name: string): void {
        return setTextureArray(this._engineState, channel, uniform, textures, name);
    }

    /**
     * @internal
     */
    public _setAnisotropicLevel(target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
        _setAnisotropicLevel(this._engineState, target, internalTexture, anisotropicFilteringLevel);
    }

    /**
     * Unbind all vertex attributes from the webGL context
     */
    public unbindAllAttributes() {
        unbindAllAttributes(this._engineState);
    }

    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseEffects() {
        releaseEffects(this._engineState);
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
        attachContextLostEvent(this._engineState, callback);
    }

    /**
     * Attach a new callback raised when context restored event is fired
     * @param callback defines the callback to call
     */
    public attachContextRestoredEvent(callback: (event: WebGLContextEvent) => void): void {
        attachContextRestoredEvent(this._engineState, callback);
    }

    /**
     * Get the current error code of the webGL context
     * @returns the error code
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
     */
    public getError(): number {
        return getError(this._engineState);
    }

    /**
     * @internal
     */
    public _getWebGLTextureType(type: number): number {
        return _getWebGLTextureType(this._engineState, type);
    }

    /**
     * @internal
     */
    public _getInternalFormat(format: number, useSRGBBuffer = false): number {
        return _getInternalFormat(this._engineState, format, useSRGBBuffer);
    }

    /**
     * @internal
     */
    public _getRGBABufferInternalSizedFormat(type: number, format?: number, useSRGBBuffer = false): number {
        return _getRGBABufferInternalSizedFormat(this._engineState, type, format, useSRGBBuffer);
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
        return _loadFile(this._engineState, url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
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
        return readPixels(this._engineState, x, y, width, height, hasAlpha, flushRenderer);
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
    public static isSupported = IsWebGLSupported;

    /**
     * Gets a boolean indicating if the engine can be instantiated on a performant device (ie. if a webGL context can be found and it does not use a slow implementation)
     */
    public static get HasMajorPerformanceCaveat(): boolean {
        return HasMajorPerformanceCaveat();
    }

    /**
     * Find the next highest power of two.
     * @param x Number to start search from.
     * @returns Next highest power of two.
     */
    public static CeilingPOT = CeilingPOT;

    /**
     * Find the next lowest power of two.
     * @param x Number to start search from.
     * @returns Next lowest power of two.
     */
    public static FloorPOT = FloorPOT;

    /**
     * Find the nearest power of two.
     * @param x Number to start search from.
     * @returns Next nearest power of two.
     */
    public static NearestPOT = NearestPOT;

    /**
     * Get the closest exponent of two
     * @param value defines the value to approximate
     * @param max defines the maximum value to return
     * @param mode defines how to define the closest value
     * @returns closest exponent of two of the given value
     */
    public static GetExponentOfTwo = GetExponentOfTwo;

    /**
     * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
     * @param func - the function to be called
     * @param requester - the object that will request the next frame. Falls back to window.
     * @returns frame number
     */
    public static QueueNewFrame = QueueNewFrame;

    /**
     * Gets host document
     * @returns the host document object
     */
    public getHostDocument(): Nullable<Document> {
        return getHostDocument(this._engineState);
    }
}

interface TexImageParameters {
    internalFormat: number;
    format: number;
    type: number;
}
