import type { Observer } from "../Misc/observable";
import type { DataArray, FloatArray, IndicesArray, Nullable } from "../types";
import type { PerfCounter } from "../Misc/perfCounter";
import type { PostProcess } from "../PostProcesses/postProcess";
import type { Scene } from "../scene";
import type { IColor4Like, IViewportLike } from "../Maths/math.like";
import type { ICanvas, IImage, IPath2D } from "./ICanvas";
import type { HardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import type { EngineCapabilities } from "./engineCapabilities";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import type { IShaderProcessor } from "./Processors/iShaderProcessor";
import type { ShaderLanguage } from "../Materials/shaderLanguage";
import type { IAudioEngineOptions } from "../Audio/Interfaces/IAudioEngineOptions";
import type { EngineFeatures } from "./engineFeatures";
import type { UniformBuffer } from "../Materials/uniformBuffer";
import type { StorageBuffer } from "../Buffers/storageBuffer";
import type { IEffectCreationOptions, IShaderPath } from "../Materials/effect";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { IWebRequest } from "../Misc/interfaces/iWebRequest";
import type { IFileRequest } from "../Misc/fileRequest";
import type { Texture } from "../Materials/Textures/texture";
import type { LoadFileError } from "../Misc/fileTools";
import type { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import type { IPipelineContext } from "./IPipelineContext";
import type { ThinTexture } from "../Materials/Textures/thinTexture";
import type { InternalTextureCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import type { EffectFallbacks } from "../Materials/effectFallbacks";
import type { IMaterialContext } from "./IMaterialContext";
import type { IStencilState } from "../States/IStencilState";
import type { DrawWrapper } from "../Materials/drawWrapper";
import type { IDrawContext } from "./IDrawContext";
import type { VertexBuffer } from "../Meshes/buffer";
import type { IAudioEngine } from "../Audio/Interfaces/IAudioEngine";
import type { WebRequest } from "core/Misc/webRequest";
import type { PerformanceMonitor } from "core/Misc/performanceMonitor";
import type { ILoadingScreen } from "../Loading/loadingScreen";
import { EngineStore } from "./engineStore";
import { Logger } from "../Misc/logger";
import { Effect } from "../Materials/effect";
import { PerformanceConfigurator } from "./performanceConfigurator";
import { PrecisionDate } from "../Misc/precisionDate";
import { DepthCullingState } from "../States/depthCullingState";
import { StencilStateComposer } from "../States/stencilStateComposer";
import { StencilState } from "../States/stencilState";
import { AlphaState } from "../States/alphaCullingState";
import { _WarnImport } from "../Misc/devTools";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { IsDocumentAvailable, IsNavigatorAvailable, IsWindowObjectExist } from "../Misc/domManagement";
import { Constants } from "./constants";
import { Observable } from "../Misc/observable";
import { EngineFunctionContext, _loadFile } from "./abstractEngine.functions";
import type { Material } from "core/Materials/material";
import { _GetCompatibleTextureLoader } from "core/Materials/Textures/Loaders/textureLoaderManager";

/**
 * Defines the interface used by objects working like Scene
 * @internal
 */
export interface ISceneLike {
    /** Add pending data  (to load) */
    addPendingData(data: any): void;
    /** Remove pending data */
    removePendingData(data: any): void;
    /** Offline provider */
    offlineProvider: IOfflineProvider;
}

/**
 * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
 * @param func - the function to be called
 * @param requester - the object that will request the next frame. Falls back to window.
 * @returns frame number
 */
export function QueueNewFrame(func: () => void, requester?: any): number {
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

/** Interface defining initialization parameters for AbstractEngine class */
export interface AbstractEngineOptions {
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
    /**
     * True if the more expensive but exact conversions should be used for transforming colors to and from linear space within shaders.
     * Otherwise, the default is to use a cheaper approximation.
     */
    useExactSrgbConversions?: boolean;
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

export type PrepareTextureProcessFunction = (
    width: number,
    height: number,
    img: HTMLImageElement | ImageBitmap | { width: number; height: number },
    extension: string,
    texture: InternalTexture,
    continuationCallback: () => void
) => boolean;

export type PrepareTextureFunction = (
    texture: InternalTexture,
    extension: string,
    scene: Nullable<ISceneLike>,
    img: HTMLImageElement | ImageBitmap | { width: number; height: number },
    invertY: boolean,
    noMipmap: boolean,
    isCompressed: boolean,
    processFunction: PrepareTextureProcessFunction,
    samplingMode: number
) => void;

/**
 * The parent class for specialized engines (WebGL, WebGPU)
 */
export abstract class AbstractEngine {
    // States
    /** @internal */
    protected _colorWrite = true;
    /** @internal */
    protected _colorWriteChanged = true;
    /** @internal */
    public _depthCullingState = new DepthCullingState();
    /** @internal */
    protected _stencilStateComposer = new StencilStateComposer();
    /** @internal */
    public _stencilState = new StencilState();
    /** @internal */
    public _alphaState = new AlphaState();
    /** @internal */
    public _alphaMode = Constants.ALPHA_ADD;
    /** @internal */
    public _alphaEquation = Constants.ALPHA_DISABLE;

    protected _activeRequests: IFileRequest[] = [];

    /** @internal */
    public _badOS = false;
    /** @internal */
    public _badDesktopOS = false;
    /** @internal */
    public _videoTextureSupported: boolean;

    protected _compatibilityMode = true;
    /** @internal */
    public _pointerLockRequested: boolean;
    /** @internal */
    public _loadingScreen: ILoadingScreen;
    /** @internal */
    public _renderingCanvas: Nullable<HTMLCanvasElement>;
    /** @internal */
    public _internalTexturesCache = new Array<InternalTexture>();
    protected _currentEffect: Nullable<Effect>;
    /** @internal */
    protected _cachedVertexBuffers: any;
    /** @internal */
    protected _cachedIndexBuffer: Nullable<DataBuffer>;
    /** @internal */
    protected _cachedEffectForVertexBuffers: Nullable<Effect>;
    /** @internal */
    public _currentRenderTarget: Nullable<RenderTargetWrapper> = null;
    /** @internal */
    public _caps: EngineCapabilities;
    /** @internal */
    protected _cachedViewport: Nullable<IViewportLike>;
    /** @internal */
    public _currentDrawContext: IDrawContext;

    /** @internal */
    protected _boundTexturesCache: { [key: string]: Nullable<InternalTexture> } = {};
    /** @internal */
    protected _activeChannel = 0;
    /** @internal */
    protected _currentTextureChannel = -1;
    /** @internal */
    protected _viewportCached = { x: 0, y: 0, z: 0, w: 0 };

    /** @internal */
    protected _isWebGPU: boolean = false;

    // Focus
    /** @internal */
    public _onFocus: () => void;
    /** @internal */
    public _onBlur: () => void;
    /** @internal */
    public _onCanvasPointerOut: (event: PointerEvent) => void;
    /** @internal */
    public _onCanvasBlur: () => void;
    /** @internal */
    public _onCanvasFocus: () => void;
    /** @internal */
    public _onCanvasContextMenu: (evt: Event) => void;
    /** @internal */
    public _onFullscreenChange: () => void;

    /**
     * Observable event triggered each time the canvas loses focus
     */
    public onCanvasBlurObservable = new Observable<AbstractEngine>();
    /**
     * Observable event triggered each time the canvas gains focus
     */
    public onCanvasFocusObservable = new Observable<AbstractEngine>();

    /**
     * Event raised when a new scene is created
     */
    public onNewSceneAddedObservable = new Observable<Scene>();

    /**
     * Observable event triggered each time the rendering canvas is resized
     */
    public onResizeObservable = new Observable<AbstractEngine>();

    /**
     * Observable event triggered each time the canvas receives pointerout event
     */
    public onCanvasPointerOutObservable = new Observable<PointerEvent>();

    /**
     * Observable event triggered each time an effect compilation fails
     */
    public onEffectErrorObservable = new Observable<{ effect: Effect; errors: string }>();

    /**
     * Turn this value on if you want to pause FPS computation when in background
     */
    public disablePerformanceMonitorInBackground = false;

    /**
     * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
     */
    public disableVertexArrayObjects = false;

    /** @internal */
    protected _frameId = 0;
    /**
     * Gets the current frame id
     */
    public get frameId(): number {
        return this._frameId;
    }
    /**
     * Gets a boolean indicating if the engine runs in WebGPU or not.
     */
    public get isWebGPU(): boolean {
        return this._isWebGPU;
    }

    protected _shaderProcessor: Nullable<IShaderProcessor>;

    /**
     * @internal
     */
    public _getShaderProcessor(shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
        return this._shaderProcessor;
    }

    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns true if all effects are ready
     */
    public abstract areAllEffectsReady(): boolean;

    /**
     * @internal
     */
    public abstract _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void): void;

    /**
     * @internal
     */
    public abstract _setTexture(channel: number, texture: Nullable<ThinTexture>, isPartOfTextureArray?: boolean, depthStencilTexture?: boolean, name?: string): boolean;

    /**
     * Sets a texture to the according uniform.
     * @param channel The texture channel
     * @param unused unused parameter
     * @param texture The texture to apply
     * @param name The name of the uniform in the effect
     */
    public abstract setTexture(channel: number, unused: Nullable<WebGLUniformLocation>, texture: Nullable<ThinTexture>, name: string): void;

    /**
     * Binds an effect to the webGL context
     * @param effect defines the effect to bind
     */
    public abstract bindSamplers(effect: Effect): void;

    /**
     * @internal
     */
    public abstract _bindTexture(channel: number, texture: Nullable<InternalTexture>, name: string): void;

    /**
     * @internal
     */
    public abstract _deletePipelineContext(pipelineContext: IPipelineContext): void;

    /**
     * @internal
     */
    public abstract _preparePipelineContext(
        pipelineContext: IPipelineContext,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        createAsRaw: boolean,
        rawVertexSourceCode: string,
        rawFragmentSourceCode: string,
        rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>,
        key: string,
        onReady: () => void
    ): void;

    /** @internal */
    protected _shaderPlatformName: string;
    /**
     * Gets the shader platform name used by the effects.
     */
    public get shaderPlatformName(): string {
        return this._shaderPlatformName;
    }

    /**
     * Gets information about the current host
     */
    public hostInformation: HostInformation = {
        isMobile: false,
    };

    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    public isFullscreen = false;

    /**
     * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
     **/
    public enableOfflineSupport = false;

    /**
     * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
     **/
    public disableManifestCheck = false;

    /**
     * Gets or sets a boolean to enable/disable the context menu (right-click) from appearing on the main canvas
     */
    public disableContextMenu: boolean = true;

    /**
     * Gets or sets the current render pass id
     */
    public currentRenderPassId = Constants.RENDERPASS_MAIN;

    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    public isPointerLock = false;

    /**
     * Gets the list of created postprocesses
     */
    public postProcesses: PostProcess[] = [];

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    public canvasTabIndex = 1;

    /** @internal */
    protected _onContextLost: (evt: Event) => void;
    /** @internal */
    protected _onContextRestored: (evt: Event) => void;
    /** @internal */
    protected _contextWasLost = false;

    private _emptyTexture: Nullable<InternalTexture>;
    private _emptyCubeTexture: Nullable<InternalTexture>;
    private _emptyTexture3D: Nullable<InternalTexture>;
    private _emptyTexture2DArray: Nullable<InternalTexture>;

    protected _clearEmptyResources(): void {
        this._emptyTexture = null;
        this._emptyCubeTexture = null;
        this._emptyTexture3D = null;
        this._emptyTexture2DArray = null;
    }

    public abstract wipeCaches(bruteForce?: boolean): void;

    private _useReverseDepthBuffer = false;
    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    public get useReverseDepthBuffer(): boolean {
        return this._useReverseDepthBuffer;
    }

    public set useReverseDepthBuffer(useReverse) {
        if (useReverse === this._useReverseDepthBuffer) {
            return;
        }

        this._useReverseDepthBuffer = useReverse;

        if (useReverse) {
            this._depthCullingState.depthFunc = Constants.GEQUAL;
        } else {
            this._depthCullingState.depthFunc = Constants.LEQUAL;
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

    /**
     * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
     */
    public readonly isNDCHalfZRange: boolean = false;

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    public readonly hasOriginBottomLeft: boolean = true;

    /**
     * Gets a boolean indicating if the exact sRGB conversions or faster approximations are used for converting to and from linear space.
     */
    public readonly useExactSrgbConversions: boolean;

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

    /** @internal */
    public _renderTargetWrapperCache = new Array<RenderTargetWrapper>();
    /** @internal */
    protected _compiledEffects: { [key: string]: Effect } = {};

    private _rebuildInternalTextures(): void {
        const currentState = this._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

        for (const internalTexture of currentState) {
            internalTexture._rebuild();
        }
    }

    private _rebuildRenderTargetWrappers(): void {
        const currentState = this._renderTargetWrapperCache.slice(); // Do a copy because the rebuild will add proxies

        for (const renderTargetWrapper of currentState) {
            renderTargetWrapper._rebuild();
        }
    }

    private _rebuildEffects(): void {
        for (const key in this._compiledEffects) {
            const effect = <Effect>this._compiledEffects[key];

            effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
            effect._prepareEffect();
        }

        Effect.ResetCache();
    }

    protected _rebuildGraphicsResources(): void {
        // Ensure webgl and engine states are matching
        this.wipeCaches(true);

        // Rebuild effects
        this._rebuildEffects();
        this._rebuildComputeEffects?.();

        // Note:
        //  The call to _rebuildBuffers must be made before the call to _rebuildInternalTextures because in the process of _rebuildBuffers the buffers used by the post process managers will be rebuilt
        //  and we may need to use the post process manager of the scene during _rebuildInternalTextures (in WebGL1, non-POT textures are rescaled using a post process + post process manager of the scene)

        // Rebuild buffers
        this._rebuildBuffers();
        // Rebuild textures
        this._rebuildInternalTextures();
        // Rebuild textures
        this._rebuildTextures();
        // Rebuild textures
        this._rebuildRenderTargetWrappers();

        // Reset engine states after all the buffer/textures/... have been rebuilt
        this.wipeCaches(true);
    }

    protected _flagContextRestored(): void {
        Logger.Warn(this.name + " context successfully restored.");
        this.onContextRestoredObservable.notifyObservers(this);
        this._contextWasLost = false;
    }

    protected _restoreEngineAfterContextLost(initEngine: () => void): void {
        // Adding a timeout to avoid race condition at browser level
        setTimeout(async () => {
            this._clearEmptyResources();

            const depthTest = this._depthCullingState.depthTest; // backup those values because the call to initEngine / wipeCaches will reset them
            const depthFunc = this._depthCullingState.depthFunc;
            const depthMask = this._depthCullingState.depthMask;
            const stencilTest = this._stencilState.stencilTest;

            // Rebuild context
            await initEngine();
            this._rebuildGraphicsResources();

            this._depthCullingState.depthTest = depthTest;
            this._depthCullingState.depthFunc = depthFunc;
            this._depthCullingState.depthMask = depthMask;
            this._stencilState.stencilTest = stencilTest;

            this._flagContextRestored();
        }, 0);
    }

    /** @internal */
    protected _isDisposed = false;

    /** Gets a boolean indicating if the engine was disposed */
    public get isDisposed(): boolean {
        return this._isDisposed;
    }

    /**
     * Gets the list of created scenes
     */
    public scenes: Scene[] = [];

    /** @internal */
    public _virtualScenes = new Array<Scene>();

    /** @internal */
    public _features: EngineFeatures;

    /**
     * Enables or disables the snapshot rendering mode
     * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
     */
    public get snapshotRendering(): boolean {
        return false;
    }

    public set snapshotRendering(activate) {
        // Do nothing
    }

    /**
     * Gets or sets the snapshot rendering mode
     */
    public get snapshotRenderingMode(): number {
        return Constants.SNAPSHOTRENDERING_STANDARD;
    }

    public set snapshotRenderingMode(mode: number) {}

    /**
     * Observable event triggered before each texture is initialized
     */
    public onBeforeTextureInitObservable = new Observable<Texture>();

    /**
     * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foreground
     */
    public renderEvenInBackground = true;

    /**
     * Gets or sets a boolean indicating that cache can be kept between frames
     */
    public preventCacheWipeBetweenFrames = false;

    /**
     * Returns the string "AbstractEngine"
     * @returns "AbstractEngine"
     */
    public getClassName(): string {
        return "AbstractEngine";
    }

    /**
     * Gets the default empty texture
     */
    public get emptyTexture(): InternalTexture {
        if (!this._emptyTexture) {
            this._emptyTexture = this.createRawTexture(new Uint8Array(4), 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyTexture;
    }

    /**
     * Gets the default empty 3D texture
     */
    public get emptyTexture3D(): InternalTexture {
        if (!this._emptyTexture3D) {
            this._emptyTexture3D = this.createRawTexture3D(new Uint8Array(4), 1, 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyTexture3D;
    }

    /**
     * Gets the default empty 2D array texture
     */
    public get emptyTexture2DArray(): InternalTexture {
        if (!this._emptyTexture2DArray) {
            this._emptyTexture2DArray = this.createRawTexture2DArray(
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

        return this._emptyTexture2DArray;
    }

    /**
     * Gets the default empty cube texture
     */
    public get emptyCubeTexture(): InternalTexture {
        if (!this._emptyCubeTexture) {
            const faceData = new Uint8Array(4);
            const cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
            this._emptyCubeTexture = this.createRawCubeTexture(
                cubeData,
                1,
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE
            );
        }

        return this._emptyCubeTexture;
    }

    /** @internal */
    public _frameHandler: number = 0;

    /** @internal */
    protected _activeRenderLoops = new Array<() => void>();

    /**
     * Gets the list of current active render loop functions
     * @returns a read only array with the current render loop functions
     */
    public get activeRenderLoops(): ReadonlyArray<() => void> {
        return this._activeRenderLoops;
    }

    /**
     * stop executing a render loop function and remove it from the execution array
     * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
     */
    public stopRenderLoop(renderFunction?: () => void): void {
        if (!renderFunction) {
            this._activeRenderLoops.length = 0;
            this._cancelFrame();
            return;
        }

        const index = this._activeRenderLoops.indexOf(renderFunction);

        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
            if (this._activeRenderLoops.length == 0) {
                this._cancelFrame();
            }
        }
    }

    protected _cancelFrame() {
        if (this._frameHandler !== 0) {
            const handlerToCancel = this._frameHandler;
            this._frameHandler = 0;

            if (!IsWindowObjectExist()) {
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(handlerToCancel);
                }
            } else {
                const { cancelAnimationFrame } = this.getHostWindow() || window;
                if (typeof cancelAnimationFrame === "function") {
                    return cancelAnimationFrame(handlerToCancel);
                }
            }
            return clearTimeout(handlerToCancel);
        }
    }

    /** @internal */
    public _windowIsBackground = false;

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        this.onBeginFrameObservable.notifyObservers(this);
    }

    /**
     * End the current frame
     */
    public endFrame(): void {
        this._frameId++;

        this.onEndFrameObservable.notifyObservers(this);
    }

    /**
     * Gets the performance monitor attached to this engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     */
    public abstract get performanceMonitor(): PerformanceMonitor;

    /** @internal */
    public _boundRenderFunction: any = (timestamp: number) => this._renderLoop(timestamp);

    protected _maxFPS: number | undefined;
    protected _minFrameTime: number;
    protected _lastFrameTime: number = 0;
    protected _renderAccumulator: number = 0;

    /**
     * Skip frame rendering but keep the frame heartbeat (begin/end frame).
     * This is useful if you need all the plumbing but not the rendering work.
     * (for instance when capturing a screenshot where you do not want to mix rendering to the screen and to the screenshot)
     */
    public skipFrameRender = false;

    /** Gets or sets max frame per second allowed. Will return undefined if not capped */
    public get maxFPS(): number | undefined {
        return this._maxFPS;
    }

    public set maxFPS(value: number | undefined) {
        this._maxFPS = value;

        if (value === undefined) {
            return;
        }

        if (value <= 0) {
            this._minFrameTime = Number.MAX_VALUE;
            return;
        }

        this._minFrameTime = 1000 / value;
    }

    protected _isOverFrameTime(timestamp?: number): boolean {
        if (!timestamp || this._maxFPS === undefined) {
            return false;
        }

        const elapsedTime = timestamp - this._lastFrameTime;
        this._lastFrameTime = timestamp;

        this._renderAccumulator += elapsedTime;

        if (this._renderAccumulator < this._minFrameTime) {
            return true;
        }

        this._renderAccumulator -= this._minFrameTime;

        if (this._renderAccumulator > this._minFrameTime) {
            this._renderAccumulator = this._minFrameTime;
        }

        return false;
    }

    protected _processFrame(timestamp?: number) {
        this._frameHandler = 0;

        if (!this._contextWasLost && !this._isOverFrameTime(timestamp)) {
            let shouldRender = true;
            if (this.isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                // Child canvases
                if (!this.skipFrameRender && !this._renderViews()) {
                    // Main frame
                    this._renderFrame();
                }

                // Present
                this.endFrame();
            }
        }
    }

    /** @internal */
    public _renderLoop(timestamp: number | undefined): void {
        this._processFrame(timestamp);

        // The first condition prevents queuing another frame if we no longer have active render loops (e.g., if
        // `stopRenderLoop` is called mid frame). The second condition prevents queuing another frame if one has
        // already been queued (e.g., if `stopRenderLoop` and `runRenderLoop` is called mid frame).
        if (this._activeRenderLoops.length > 0 && this._frameHandler === 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }

    /** @internal */
    public _renderFrame() {
        for (let index = 0; index < this._activeRenderLoops.length; index++) {
            const renderFunction = this._activeRenderLoops[index];

            renderFunction();
        }
    }

    /** @internal */
    public _renderViews() {
        return false;
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

        // On the first added function, start the render loop.
        if (this._activeRenderLoops.length === 1 && this._frameHandler === 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }

    /**
     * Gets a boolean indicating if depth testing is enabled
     * @returns the current state
     */
    public getDepthBuffer(): boolean {
        return this._depthCullingState.depthTest;
    }

    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    public setDepthBuffer(enable: boolean): void {
        this._depthCullingState.depthTest = enable;
    }

    /**
     * Set the z offset Factor to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffset(value: number): void {
        this._depthCullingState.zOffset = this.useReverseDepthBuffer ? -value : value;
    }

    /**
     * Gets the current value of the zOffset Factor
     * @returns the current zOffset Factor state
     */
    public getZOffset(): number {
        const zOffset = this._depthCullingState.zOffset;
        return this.useReverseDepthBuffer ? -zOffset : zOffset;
    }

    /**
     * Set the z offset Units to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffsetUnits(value: number): void {
        this._depthCullingState.zOffsetUnits = this.useReverseDepthBuffer ? -value : value;
    }

    /**
     * Gets the current value of the zOffset Units
     * @returns the current zOffset Units state
     */
    public getZOffsetUnits(): number {
        const zOffsetUnits = this._depthCullingState.zOffsetUnits;
        return this.useReverseDepthBuffer ? -zOffsetUnits : zOffsetUnits;
    }

    /**
     * Gets host window
     * @returns the host window object
     */
    public getHostWindow(): Nullable<Window> {
        if (!IsWindowObjectExist()) {
            return null;
        }

        if (this._renderingCanvas && this._renderingCanvas.ownerDocument && this._renderingCanvas.ownerDocument.defaultView) {
            return this._renderingCanvas.ownerDocument.defaultView;
        }

        return window;
    }

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    public get compatibilityMode() {
        return this._compatibilityMode;
    }

    public set compatibilityMode(mode: boolean) {
        // not supported in WebGL
        this._compatibilityMode = true;
    }

    /**
     * Observable raised when the engine is about to compile a shader
     */
    public onBeforeShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine has just compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine begins a new frame
     */
    public onBeginFrameObservable = new Observable<AbstractEngine>();

    /**
     * Observable raised when the engine ends the current frame
     */
    public onEndFrameObservable = new Observable<AbstractEngine>();

    protected _rebuildTextures(): void {
        for (const scene of this.scenes) {
            scene._rebuildTextures();
        }

        for (const scene of this._virtualScenes) {
            scene._rebuildTextures();
        }
    }

    /**
     * @internal
     */
    public abstract _getRGBABufferInternalSizedFormat(type: number, format?: number, useSRGBBuffer?: boolean): number;

    /** @internal */
    public abstract _getUnpackAlignement(): number;

    /**
     * @internal
     */
    public abstract _uploadCompressedDataToTextureDirectly(
        texture: InternalTexture,
        internalFormat: number,
        width: number,
        height: number,
        data: ArrayBufferView,
        faceIndex: number,
        lod?: number
    ): void;

    /**
     * @internal
     */
    public abstract _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate?: boolean, force?: boolean): boolean;

    /**
     * @internal
     */
    public abstract _uploadDataToTextureDirectly(
        texture: InternalTexture,
        imageData: ArrayBufferView,
        faceIndex?: number,
        lod?: number,
        babylonInternalFormat?: number,
        useTextureWidthAndHeight?: boolean
    ): void;

    /** @internal */
    public abstract _unpackFlipY(value: boolean): void;

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public abstract readPixels(x: number, y: number, width: number, height: number, hasAlpha?: boolean, flushRenderer?: boolean): Promise<ArrayBufferView>;

    /**
     * Generates mipmaps for a texture
     * @param texture The texture to generate the mipmaps for
     */
    public abstract generateMipmaps(texture: InternalTexture): void;

    /**
     * Force a flush (ie. a flush of all waiting commands)
     */
    public abstract flushFramebuffer(): void;

    /** @internal */
    public abstract _currentFrameBufferIsDefaultFrameBuffer(): boolean;

    /**
     * Creates an internal texture without binding it to a framebuffer
     * @internal
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @param delayGPUTextureCreation true to delay the texture creation the first time it is really needed. false to create it right away
     * @param source source type of the texture
     * @returns a new internal texture
     */
    public abstract _createInternalTexture(
        size: TextureSize,
        options: boolean | InternalTextureCreationOptions,
        delayGPUTextureCreation?: boolean,
        source?: InternalTextureSource
    ): InternalTexture;

    /** @internal */
    public abstract applyStates(): void;

    /**
     * Binds the frame buffer to the specified texture.
     * @param texture The render target wrapper to render to
     * @param faceIndex The face of the texture to render to in case of cube texture
     * @param requiredWidth The width of the target to render to
     * @param requiredHeight The height of the target to render to
     * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
     * @param lodLevel defines the lod level to bind to the frame buffer
     * @param layer defines the 2d array index to bind to frame buffer to
     */
    public abstract bindFramebuffer(
        texture: RenderTargetWrapper,
        faceIndex?: number,
        requiredWidth?: number,
        requiredHeight?: number,
        forceFullscreenViewport?: boolean,
        lodLevel?: number,
        layer?: number
    ): void;

    /**
     * Update the sampling mode of a given texture
     * @param texture defines the texture to update
     * @param wrapU defines the texture wrap mode of the u coordinates
     * @param wrapV defines the texture wrap mode of the v coordinates
     * @param wrapR defines the texture wrap mode of the r coordinates
     */
    public abstract updateTextureWrappingMode(texture: InternalTexture, wrapU: Nullable<number>, wrapV?: Nullable<number>, wrapR?: Nullable<number>): void;

    /**
     * Unbind the current render target and bind the default framebuffer
     */
    public abstract restoreDefaultFramebuffer(): void;

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public abstract drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void;

    /**
     * Unbind the current render target texture from the webGL context
     * @param texture defines the render target wrapper to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public abstract unBindFramebuffer(texture: RenderTargetWrapper, disableGenerateMipMaps?: boolean, onBeforeUnbind?: () => void): void;

    /**
     * Generates mipmaps for the texture of the (single) render target
     * @param texture The render target containing the texture to generate the mipmaps for
     */
    public abstract generateMipMapsFramebuffer(texture: RenderTargetWrapper): void;

    /**
     * Resolves the MSAA texture of the (single) render target into its non-MSAA version.
     * Note that if "texture" is not a MSAA render target, no resolve is performed.
     * @param texture The render target texture containing the MSAA texture to resolve
     */
    public abstract resolveFramebuffer(texture: RenderTargetWrapper): void;

    /**Gets driver info if available */
    public abstract extractDriverInfo(): string;

    /**
     * Bind a list of vertex buffers to the webGL context
     * @param vertexBuffers defines the list of vertex buffers to bind
     * @param indexBuffer defines the index buffer to bind
     * @param effect defines the effect associated with the vertex buffers
     * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
     */
    public abstract bindBuffers(
        vertexBuffers: { [key: string]: Nullable<VertexBuffer> },
        indexBuffer: Nullable<DataBuffer>,
        effect: Effect,
        overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
    ): void;

    /**
     * @internal
     */
    public _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
        const index = this._renderTargetWrapperCache.indexOf(rtWrapper);
        if (index !== -1) {
            this._renderTargetWrapperCache.splice(index, 1);
        }
    }

    /**
     * Activates an effect, making it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    public abstract enableEffect(effect: Nullable<Effect | DrawWrapper>): void;

    /**
     * Sets the type of faces to cull
     * @param cullBackFaces true to cull back faces, false to cull front faces (if culling is enabled)
     * @param force defines if states must be applied even if cache is up to date
     */
    public abstract setStateCullFaceType(cullBackFaces?: boolean, force?: boolean): void;

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
    public abstract setState(
        culling: boolean,
        zOffset?: number,
        force?: boolean,
        reverseSide?: boolean,
        cullBackFaces?: boolean,
        stencil?: IStencilState,
        zOffsetUnits?: number
    ): void;

    /**
     * Creates a new material context
     * @returns the new context
     */
    public abstract createMaterialContext(): IMaterialContext | undefined;

    /**
     * Creates a new draw context
     * @returns the new context
     */
    public abstract createDrawContext(): IDrawContext | undefined;

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
     * @param extraInitializationsAsync additional async code to run before preparing the effect
     * @returns the new Effect
     */
    public abstract createEffect(
        baseName: string | (IShaderPath & { vertexToken?: string; fragmentToken?: string }),
        attributesNamesOrOptions: string[] | IEffectCreationOptions,
        uniformsNamesOrEngine: string[] | AbstractEngine,
        samplers?: string[],
        defines?: string,
        fallbacks?: EffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>,
        onError?: Nullable<(effect: Effect, errors: string) => void>,
        indexParameters?: any,
        shaderLanguage?: ShaderLanguage,
        extraInitializationsAsync?: () => Promise<void>
    ): Effect;

    /**
     * Clear the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public abstract clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil?: boolean): void;

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    public abstract get needPOTTextures(): boolean;

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @param _updatable defines if the index buffer must be updatable
     * @param label defines the label of the buffer (for debug purpose)
     * @returns a new buffer
     */
    public abstract createIndexBuffer(indices: IndicesArray, _updatable?: boolean, label?: string): DataBuffer;

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public abstract drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void;

    /**
     * Force the engine to release all cached effects.
     * This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public abstract releaseEffects(): void;

    /**
     * @internal
     */
    public abstract _viewport(x: number, y: number, width: number, height: number): void;

    /**
     * Gets the current viewport
     */
    public get currentViewport(): Nullable<IViewportLike> {
        return this._cachedViewport;
    }

    /**
     * Set the WebGL's viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
     * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
     */
    public setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        const width = requiredWidth || this.getRenderWidth();
        const height = requiredHeight || this.getRenderHeight();
        const x = viewport.x || 0;
        const y = viewport.y || 0;

        this._cachedViewport = viewport;

        this._viewport(x * width, y * height, width * viewport.width, height * viewport.height);
    }

    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     * @param generateMipMaps defines whether to generate mipmaps for the texture
     */
    public abstract updateTextureSamplingMode(samplingMode: number, texture: InternalTexture, generateMipMaps?: boolean): void;

    /**
     * Sets an array of texture to the webGL context
     * @param channel defines the channel where the texture array must be set
     * @param uniform defines the associated uniform location
     * @param textures defines the array of textures to bind
     * @param name name of the channel
     */
    public abstract setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: ThinTexture[], name: string): void;

    /** @internal */
    public _transformTextureUrl: Nullable<(url: string) => string> = null;

    /**
     * Unbind all instance attributes
     */
    public abstract unbindInstanceAttributes(): void;

    /**
     * @internal
     */
    public abstract _getUseSRGBBuffer(useSRGBBuffer: boolean, noMipmap: boolean): boolean;

    /**
     * Create an image to use with canvas
     * @returns IImage interface
     */
    public createCanvasImage(): IImage {
        return document.createElement("img");
    }

    /**
     * Create a 2D path to use with canvas
     * @returns IPath2D interface
     * @param d SVG path string
     */
    public createCanvasPath2D(d?: string): IPath2D {
        return new Path2D(d);
    }

    /**
     * Returns a string describing the current engine
     */
    public get description(): string {
        let description = this.name + this.version;

        if (this._caps.parallelShaderCompile) {
            description += " - Parallel shader compilation";
        }

        return description;
    }

    protected _createTextureBase(
        url: Nullable<string>,
        noMipmap: boolean,
        invertY: boolean,
        scene: Nullable<ISceneLike>,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<(texture: InternalTexture) => void> = null,
        onError: Nullable<(message: string, exception: any) => void> = null,
        prepareTexture: PrepareTextureFunction,
        prepareTextureProcess: PrepareTextureProcessFunction,
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

        // Remove query string
        const queryStringIndex = extension.indexOf("?");

        if (queryStringIndex > -1) {
            extension = extension.split("?")[0];
        }

        const loaderPromise = _GetCompatibleTextureLoader(extension, mimeType);

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

                if (EngineStore.UseFallbackTexture && url !== EngineStore.FallbackTexture) {
                    this._createTextureBase(
                        EngineStore.FallbackTexture,
                        noMipmap,
                        texture.invertY,
                        scene,
                        samplingMode,
                        null,
                        onError,
                        prepareTexture,
                        prepareTextureProcess,
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
                    prepareTextureProcess,
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
        if (loaderPromise) {
            const callback = async (data: ArrayBufferView) => {
                const loader = await loaderPromise;
                loader.loadData(
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

                prepareTexture(texture, extension, scene, img, texture.invertY, noMipmap, false, prepareTextureProcess, samplingMode);
            };
            // According to the WebGL spec section 6.10, ImageBitmaps must be inverted on creation.
            // So, we pass imageOrientation to _FileToolsLoadImage() as it may create an ImageBitmap.

            if (!fromData || isBase64) {
                if (buffer && (typeof (<HTMLImageElement>buffer).decoding === "string" || (<ImageBitmap>buffer).close)) {
                    onload(<HTMLImageElement>buffer);
                } else {
                    AbstractEngine._FileToolsLoadImage(
                        url || "",
                        onload,
                        onInternalError,
                        scene ? scene.offlineProvider : null,
                        mimeType,
                        texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined,
                        this
                    );
                }
            } else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
                AbstractEngine._FileToolsLoadImage(
                    buffer,
                    onload,
                    onInternalError,
                    scene ? scene.offlineProvider : null,
                    mimeType,
                    texture.invertY && this._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined,
                    this
                );
            } else if (buffer) {
                onload(buffer);
            }
        }

        return texture;
    }

    /**
     * Creates a new pipeline context
     * @param shaderProcessingContext defines the shader processing context used during the processing if available
     * @returns the new pipeline
     */
    public abstract createPipelineContext(shaderProcessingContext: Nullable<ShaderProcessingContext>): IPipelineContext;

    /**
     * Inline functions in shader code that are marked to be inlined
     * @param code code to inline
     * @returns inlined code
     */
    public abstract inlineShaderCode(code: string): string;

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     */
    public abstract get supportsUniformBuffers(): boolean;

    /**
     * Returns the version of the engine
     */
    public abstract get version(): number;

    /**
     * @internal
     */
    public abstract _releaseEffect(effect: Effect): void;

    /**
     * Bind a buffer to the current draw context
     * @param buffer defines the buffer to bind
     * @param _location not used in WebGPU
     * @param name Name of the uniform variable to bind
     */
    public abstract bindUniformBufferBase(buffer: DataBuffer, _location: number, name: string): void;

    /**
     * Bind a specific block at a given index in a specific shader program
     * @param pipelineContext defines the pipeline context to use
     * @param blockName defines the block name
     * @param index defines the index where to bind the block
     */
    public abstract bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void;

    /** @internal */
    public _uniformBuffers = new Array<UniformBuffer>();
    /** @internal */
    public _storageBuffers = new Array<StorageBuffer>();
    protected _rebuildBuffers(): void {
        // Uniforms
        for (const uniformBuffer of this._uniformBuffers) {
            uniformBuffer._rebuildAfterContextLost();
        }
    }

    protected _highPrecisionShadersAllowed = true;
    /** @internal */
    public get _shouldUseHighPrecisionShader(): boolean {
        return !!(this._caps.highPrecisionShaderSupported && this._highPrecisionShadersAllowed);
    }
    /**
     * @internal
     */
    public abstract _getShaderProcessingContext(shaderLanguage: ShaderLanguage, pureMode: boolean): Nullable<ShaderProcessingContext>;

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

    // Lost context
    /**
     * Observable signaled when a context lost event is raised
     */
    public onContextLostObservable = new Observable<AbstractEngine>();
    /**
     * Observable signaled when a context restored event is raised
     */
    public onContextRestoredObservable = new Observable<AbstractEngine>();

    /**
     * Gets the list of loaded textures
     * @returns an array containing all loaded textures
     */
    public getLoadedTexturesCache(): InternalTexture[] {
        return this._internalTexturesCache;
    }

    /**
     * Clears the list of texture accessible through engine.
     * This can help preventing texture load conflict due to name collision.
     */
    public clearInternalTexturesCache() {
        this._internalTexturesCache.length = 0;
    }

    /**
     * @internal
     */
    public abstract _releaseTexture(texture: InternalTexture): void;

    /**
     * Gets the object containing all engine capabilities
     * @returns the EngineCapabilities object
     */
    public getCaps(): EngineCapabilities {
        return this._caps;
    }

    /**
     * Reset the texture cache to empty state
     */
    public resetTextureCache() {
        for (const key in this._boundTexturesCache) {
            if (!Object.prototype.hasOwnProperty.call(this._boundTexturesCache, key)) {
                continue;
            }
            this._boundTexturesCache[key] = null;
        }

        this._currentTextureChannel = -1;
    }

    /** @internal */
    protected _name = "";

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
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static get NpmPackage(): string {
        return "babylonjs@8.4.1";
    }

    /**
     * Returns the current version of the framework
     */
    public static get Version(): string {
        return "8.4.1";
    }

    /**
     * The time (in milliseconds elapsed since the current page has been loaded) when the engine was initialized
     */
    public readonly startTime: number;

    /** @internal */
    protected _audioContext: Nullable<AudioContext>;
    /** @internal */
    protected _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
    /**
     * Gets the HTML canvas attached with the current webGL context
     * @returns a HTML canvas
     */
    public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._renderingCanvas;
    }

    /**
     * Gets the audio context specified in engine initialization options
     * @deprecated please use AudioEngineV2 instead
     * @returns an Audio Context
     */
    public getAudioContext(): Nullable<AudioContext> {
        return this._audioContext;
    }

    /**
     * Gets the audio destination specified in engine initialization options
     * @deprecated please use AudioEngineV2 instead
     * @returns an audio destination node
     */
    public getAudioDestination(): Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode> {
        return this._audioDestination;
    }

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    public premultipliedAlpha: boolean = true;

    /**
     * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
     */
    public adaptToDeviceRatio: boolean = false;

    /** @internal */
    protected _lastDevicePixelRatio: number = 1.0;

    /** @internal */
    public _hardwareScalingLevel: number;

    /**
     * Defines the hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @param level defines the level to use
     */
    public setHardwareScalingLevel(level: number): void {
        this._hardwareScalingLevel = level;
        this.resize();
    }

    /**
     * Gets the current hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @returns a number indicating the current hardware scaling level
     */
    public getHardwareScalingLevel(): number {
        return this._hardwareScalingLevel;
    }

    /** @internal */
    public _doNotHandleContextLost = false;

    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#handling-webgl-context-lost
     */
    public get doNotHandleContextLost(): boolean {
        return this._doNotHandleContextLost;
    }

    public set doNotHandleContextLost(value: boolean) {
        this._doNotHandleContextLost = value;
    }

    /** @internal */
    protected _isStencilEnable: boolean;

    /**
     * Returns true if the stencil buffer has been enabled through the creation option of the context.
     */
    public get isStencilEnable(): boolean {
        return this._isStencilEnable;
    }

    /** @internal */
    protected _creationOptions: AbstractEngineOptions;

    /**
     * Gets the options used for engine creation
     * @returns EngineOptions object
     */
    public getCreationOptions() {
        return this._creationOptions;
    }

    /**
     * Creates a new engine
     * @param antialias defines whether anti-aliasing should be enabled. If undefined, it means that the underlying engine is free to enable it or not
     * @param options defines further options to be sent to the creation context
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(antialias: boolean | undefined, options: AbstractEngineOptions, adaptToDeviceRatio?: boolean) {
        EngineStore.Instances.push(this);
        this.startTime = PrecisionDate.Now;

        this._stencilStateComposer.stencilGlobal = this._stencilState;

        PerformanceConfigurator.SetMatrixPrecision(!!options.useHighPrecisionMatrix);

        if (IsNavigatorAvailable() && navigator.userAgent) {
            // Detect if we are running on a faulty buggy OS.
            this._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

            // Detect if we are running on a faulty buggy desktop OS.
            this._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        }

        // Save this off for use in resize().
        this.adaptToDeviceRatio = adaptToDeviceRatio ?? false;

        options.antialias = antialias ?? options.antialias;
        options.deterministicLockstep = options.deterministicLockstep ?? false;
        options.lockstepMaxSteps = options.lockstepMaxSteps ?? 4;
        options.timeStep = options.timeStep ?? 1 / 60;
        options.stencil = options.stencil ?? true;

        this._audioContext = options.audioEngineOptions?.audioContext ?? null;
        this._audioDestination = options.audioEngineOptions?.audioDestination ?? null;
        this.premultipliedAlpha = options.premultipliedAlpha ?? true;
        this._doNotHandleContextLost = !!options.doNotHandleContextLost;
        this._isStencilEnable = options.stencil ? true : false;
        this.useExactSrgbConversions = options.useExactSrgbConversions ?? false;

        const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;

        const limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;
        // Viewport
        adaptToDeviceRatio = adaptToDeviceRatio || options.adaptToDeviceRatio || false;
        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0;
        this._lastDevicePixelRatio = devicePixelRatio;

        this._creationOptions = options;
    }

    /**
     * Resize the view according to the canvas' size
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     */
    public resize(forceSetSize = false): void {
        let width: number;
        let height: number;

        // Re-query hardware scaling level to handle zoomed-in resizing.
        if (this.adaptToDeviceRatio) {
            const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;
            const changeRatio = this._lastDevicePixelRatio / devicePixelRatio;
            this._lastDevicePixelRatio = devicePixelRatio;
            this._hardwareScalingLevel *= changeRatio;
        }

        if (IsWindowObjectExist() && IsDocumentAvailable()) {
            // make sure it is a Node object, and is a part of the document.
            if (this._renderingCanvas) {
                const boundingRect = this._renderingCanvas.getBoundingClientRect?.();
                width = this._renderingCanvas.clientWidth || boundingRect?.width || this._renderingCanvas.width * this._hardwareScalingLevel || 100;
                height = this._renderingCanvas.clientHeight || boundingRect?.height || this._renderingCanvas.height * this._hardwareScalingLevel || 100;
            } else {
                width = window.innerWidth;
                height = window.innerHeight;
            }
        } else {
            width = this._renderingCanvas ? this._renderingCanvas.width : 100;
            height = this._renderingCanvas ? this._renderingCanvas.height : 100;
        }

        this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel, forceSetSize);
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number, forceSetSize = false): boolean {
        if (!this._renderingCanvas) {
            return false;
        }

        width = width | 0;
        height = height | 0;

        if (!forceSetSize && this._renderingCanvas.width === width && this._renderingCanvas.height === height) {
            return false;
        }

        this._renderingCanvas.width = width;
        this._renderingCanvas.height = height;

        if (this.scenes) {
            for (let index = 0; index < this.scenes.length; index++) {
                const scene = this.scenes[index];

                for (let camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    const cam = scene.cameras[camIndex];

                    cam._currentRenderId = 0;
                }
            }

            if (this.onResizeObservable.hasObservers()) {
                this.onResizeObservable.notifyObservers(this);
            }
        }

        return true;
    }

    /**
     * @internal
     */
    public abstract _releaseBuffer(buffer: DataBuffer): boolean;

    /**
     * Create a dynamic uniform buffer
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @param label defines a name for the buffer (for debugging purpose)
     * @returns the webGL uniform buffer
     */
    public abstract createDynamicUniformBuffer(elements: FloatArray, label?: string): DataBuffer;

    /**
     * Create an uniform buffer
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @param label defines a name for the buffer (for debugging purpose)
     * @returns the webGL uniform buffer
     */
    public abstract createUniformBuffer(elements: FloatArray, label?: string): DataBuffer;

    /**
     * Update an existing uniform buffer
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     * @param uniformBuffer defines the target uniform buffer
     * @param elements defines the content to update
     * @param offset defines the offset in the uniform buffer where update should start
     * @param count defines the size of the data to update
     */
    public abstract updateUniformBuffer(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void;

    /**
     * Creates a dynamic vertex buffer
     * @param data the data for the dynamic vertex buffer
     * @param _label defines the label of the buffer (for debug purpose)
     * @returns the new WebGL dynamic buffer
     */
    public abstract createDynamicVertexBuffer(data: DataArray | number, _label?: string): DataBuffer;

    /**
     * Creates a vertex buffer
     * @param data the data or size for the vertex buffer
     * @param _updatable whether the buffer should be created as updatable
     * @param _label defines the label of the buffer (for debug purpose)
     * @returns the new WebGL static buffer
     */
    public abstract createVertexBuffer(data: DataArray | number, _updatable?: boolean, _label?: string): DataBuffer;

    /**
     * Update the dimensions of a texture
     * @param texture texture to update
     * @param width new width of the texture
     * @param height new height of the texture
     * @param depth new depth of the texture
     */
    public abstract updateTextureDimensions(texture: InternalTexture, width: number, height: number, depth: number): void;

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
    public abstract createTexture(
        url: Nullable<string>,
        noMipmap: boolean,
        invertY: boolean,
        scene: Nullable<ISceneLike>,
        samplingMode?: number,
        onLoad?: Nullable<(texture: InternalTexture) => void>,
        onError?: Nullable<(message: string, exception: any) => void>,
        buffer?: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap>,
        fallback?: Nullable<InternalTexture>,
        format?: Nullable<number>,
        forcedExtension?: Nullable<string>,
        mimeType?: string,
        loaderOptions?: any,
        creationFlags?: number,
        useSRGBBuffer?: boolean
    ): InternalTexture;

    // eslint-disable-next-line jsdoc/require-returns-check
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
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
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
        compression?: Nullable<string>,
        type?: number,
        creationFlags?: number,
        useSRGBBuffer?: boolean
    ): InternalTexture {
        throw _WarnImport("engine.rawTexture");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Creates a new raw cube texture
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
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
        compression?: Nullable<string>
    ): InternalTexture {
        throw _WarnImport("engine.rawTexture");
    }
    // eslint-disable-next-line jsdoc/require-returns-check
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
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
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
        compression?: Nullable<string>,
        textureType?: number,
        creationFlags?: number
    ): InternalTexture {
        throw _WarnImport("engine.rawTexture");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
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
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
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
        compression?: Nullable<string>,
        textureType?: number,
        creationFlags?: number
    ): InternalTexture {
        throw _WarnImport("engine.rawTexture");
    }

    /**
     * Gets or sets a boolean indicating if back faces must be culled. If false, front faces are culled instead (true by default)
     * If non null, this takes precedence over the value from the material
     */
    public cullBackFaces: Nullable<boolean> = null;

    /**
     * Gets the current render width
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render width
     */
    public abstract getRenderWidth(useScreen?: boolean): number;

    /**
     * Gets the current render height
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render height
     */
    public abstract getRenderHeight(useScreen?: boolean): number;

    /**
     * Shared initialization across engines types.
     * @param canvas The canvas associated with this instance of the engine.
     */
    protected _sharedInit(canvas: HTMLCanvasElement) {
        this._renderingCanvas = canvas;
    }

    private _checkForMobile: () => void;

    protected _setupMobileChecks(): void {
        if (!(navigator && navigator.userAgent)) {
            return;
        }

        // Function to check if running on mobile device
        this._checkForMobile = () => {
            const currentUA = navigator.userAgent;
            this.hostInformation.isMobile =
                currentUA.indexOf("Mobile") !== -1 ||
                // Needed for iOS 13+ detection on iPad (inspired by solution from https://stackoverflow.com/questions/9038625/detect-if-device-is-ios)
                (currentUA.indexOf("Mac") !== -1 && IsDocumentAvailable() && "ontouchend" in document);
        };

        // Set initial isMobile value
        this._checkForMobile();

        // Set up event listener to check when window is resized (used to get emulator activation to work properly)
        if (IsWindowObjectExist()) {
            window.addEventListener("resize", this._checkForMobile);
        }
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    /** @internal */
    public static _RenderPassIdCounter = 0;

    /** @internal */
    public _renderPassNames: string[] = ["main"];

    /** @internal */
    public abstract _createHardwareTexture(): HardwareTextureWrapper;

    /**
     * creates and returns a new video element
     * @param constraints video constraints
     * @returns video element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createVideoElement(constraints: MediaTrackConstraints): any {
        return document.createElement("video");
    }

    // FPS
    protected _fps = 60;
    protected _deltaTime = 0;

    /** @internal */
    public _drawCalls: PerfCounter;

    /**
     * @internal
     */
    public _reportDrawCall(numDrawCalls = 1) {
        this._drawCalls?.addCount(numDrawCalls, false);
    }
    /**
     * Gets the current framerate
     * @returns a number representing the framerate
     */
    public getFps(): number {
        return this._fps;
    }

    /**
     * Gets the time spent between current and previous frame
     * @returns a number representing the delta time in ms
     */
    public getDeltaTime(): number {
        return this._deltaTime;
    }

    // Deterministic lockstepMaxSteps
    /** @internal */
    public _deterministicLockstep: boolean = false;
    /** @internal */
    public _lockstepMaxSteps: number = 4;
    /** @internal */
    public _timeStep: number = 1 / 60;

    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    public isDeterministicLockStep(): boolean {
        return this._deterministicLockstep;
    }

    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the max steps
     */
    public getLockstepMaxSteps(): number {
        return this._lockstepMaxSteps;
    }

    /**
     * Returns the time in ms between steps when using deterministic lock step.
     * @returns time step in (ms)
     */
    public getTimeStep(): number {
        return this._timeStep * 1000;
    }

    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     */
    public _createImageBitmapFromSource(imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        throw new Error("createImageBitmapFromSource is not implemented");
    }

    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return createImageBitmap(image, options);
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     */
    public resizeImageBitmap(image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        throw new Error("resizeImageBitmap is not implemented");
    }

    /**
     * Get the current error code of the webGL context
     * @returns the error code
     */
    public abstract getError(): number;

    /**
     * Get Font size information
     * @param font font name
     */
    public getFontOffset(font: string): { ascent: number; height: number; descent: number } {
        throw new Error("getFontOffset is not implemented");
    }

    protected static _CreateCanvas(width: number, height: number): ICanvas {
        if (typeof document === "undefined") {
            return <ICanvas>(<any>new OffscreenCanvas(width, height));
        }
        const canvas = <ICanvas>(<any>document.createElement("canvas"));
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * Create a canvas. This method is overridden by other engines
     * @param width width
     * @param height height
     * @returns ICanvas interface
     */
    public createCanvas(width: number, height: number): ICanvas {
        return AbstractEngine._CreateCanvas(width, height);
    }

    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @param imageBitmapOptions optional the options to use when creating an ImageBitmap
     * @param engine the engine instance to use
     * @returns the HTMLImageElement of the loaded image
     * @internal
     */
    public static _FileToolsLoadImage(
        input: string | ArrayBuffer | ArrayBufferView | Blob,
        onLoad: (img: HTMLImageElement | ImageBitmap) => void,
        onError: (message?: string, exception?: any) => void,
        offlineProvider: Nullable<IOfflineProvider>,
        mimeType?: string,
        imageBitmapOptions?: ImageBitmapOptions,
        engine?: AbstractEngine
    ): Nullable<HTMLImageElement> {
        throw _WarnImport("FileTools");
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
        const request = _loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add(() => {
            const index = this._activeRequests.indexOf(request);
            if (index !== -1) {
                this._activeRequests.splice(index, 1);
            }
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
        if (EngineFunctionContext.loadFile) {
            return EngineFunctionContext.loadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        }
        throw _WarnImport("FileTools");
    }

    /**
     * An event triggered when the engine is disposed.
     */
    public readonly onDisposeObservable = new Observable<AbstractEngine>();

    /**
     * An event triggered when a global cleanup of all effects is required
     */
    public readonly onReleaseEffectsObservable = new Observable<AbstractEngine>();

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        this.releaseEffects();

        this._isDisposed = true;
        this.stopRenderLoop();

        // Empty texture
        if (this._emptyTexture) {
            this._releaseTexture(this._emptyTexture);
            this._emptyTexture = null;
        }
        if (this._emptyCubeTexture) {
            this._releaseTexture(this._emptyCubeTexture);
            this._emptyCubeTexture = null;
        }

        this._renderingCanvas = null;

        // Clear observables
        if (this.onBeforeTextureInitObservable) {
            this.onBeforeTextureInitObservable.clear();
        }

        // Release postProcesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }

        // Release scenes
        while (this.scenes.length) {
            this.scenes[0].dispose();
        }

        while (this._virtualScenes.length) {
            this._virtualScenes[0].dispose();
        }

        // Release effects
        this.releaseComputeEffects?.();

        Effect.ResetCache();

        // Abort active requests
        for (const request of this._activeRequests) {
            request.abort();
        }

        this._boundRenderFunction = null;

        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();

        this.onResizeObservable.clear();
        this.onCanvasBlurObservable.clear();
        this.onCanvasFocusObservable.clear();
        this.onCanvasPointerOutObservable.clear();
        this.onNewSceneAddedObservable.clear();
        this.onEffectErrorObservable.clear();

        if (IsWindowObjectExist()) {
            window.removeEventListener("resize", this._checkForMobile);
        }

        // Remove from Instances
        const index = EngineStore.Instances.indexOf(this);

        if (index >= 0) {
            EngineStore.Instances.splice(index, 1);
        }

        // no more engines left in the engine store? Notify!
        if (!EngineStore.Instances.length) {
            EngineStore.OnEnginesDisposedObservable.notifyObservers(this);
            EngineStore.OnEnginesDisposedObservable.clear();
        }

        // Observables
        this.onBeginFrameObservable.clear();
        this.onEndFrameObservable.clear();
    }

    /**
     * Method called to create the default rescale post process on each engine.
     */
    public static _RescalePostProcessFactory: Nullable<(engine: AbstractEngine) => PostProcess> = null;

    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        throw _WarnImport("LoadingScreen");
    }

    /**
     * Gets the audio engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
     * @deprecated please use AudioEngineV2 instead
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static audioEngine: Nullable<IAudioEngine>;

    /**
     * Default AudioEngine factory responsible of creating the Audio Engine.
     * By default, this will create a BabylonJS Audio Engine if the workload has been embedded.
     * @deprecated please use AudioEngineV2 instead
     */
    public static AudioEngineFactory: (
        hostElement: Nullable<HTMLElement>,
        audioContext: Nullable<AudioContext>,
        audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>
    ) => IAudioEngine;

    /**
     * Default offline support factory responsible of creating a tool used to store data locally.
     * By default, this will create a Database object if the workload has been embedded.
     */
    public static OfflineProviderFactory: (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck: boolean) => IOfflineProvider;

    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        for (let engineIndex = 0; engineIndex < EngineStore.Instances.length; engineIndex++) {
            const engine = EngineStore.Instances[engineIndex];

            for (let sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
            }
        }
    }

    // Updatable statics so stick with vars here

    /**
     * Gets or sets the epsilon value used by collision engine
     */
    public static CollisionsEpsilon = 0.001;

    /**
     * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
     * @param func - the function to be called
     * @param requester - the object that will request the next frame. Falls back to window.
     * @returns frame number
     */
    public static QueueNewFrame: (func: () => void, requester?: any) => number = QueueNewFrame;
}
