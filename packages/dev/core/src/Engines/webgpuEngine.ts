import { Logger } from "../Misc/logger";
import { IsWindowObjectExist } from "../Misc/domManagement";
import type { Nullable, DataArray, IndicesArray, Immutable } from "../types";
import { Color4 } from "../Maths/math";
import { Engine } from "../Engines/engine";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IEffectCreationOptions } from "../Materials/effect";
import { Effect } from "../Materials/effect";
import type { EffectFallbacks } from "../Materials/effectFallbacks";
import { Constants } from "./constants";
import * as WebGPUConstants from "./WebGPU/webgpuConstants";
import { VertexBuffer } from "../Buffers/buffer";
import type { IWebGPURenderPipelineStageDescriptor } from "./WebGPU/webgpuPipelineContext";
import { WebGPUPipelineContext } from "./WebGPU/webgpuPipelineContext";
import type { IPipelineContext } from "./IPipelineContext";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { IShaderProcessor } from "./Processors/iShaderProcessor";
import { WebGPUShaderProcessorGLSL } from "./WebGPU/webgpuShaderProcessorsGLSL";
import { WebGPUShaderProcessorWGSL } from "./WebGPU/webgpuShaderProcessorsWGSL";
import type { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from "./WebGPU/webgpuShaderProcessingContext";
import { Tools } from "../Misc/tools";
import { WebGPUTextureHelper } from "./WebGPU/webgpuTextureHelper";
import type { ISceneLike } from "./thinEngine";
import { WebGPUBufferManager } from "./WebGPU/webgpuBufferManager";
import type { HardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import { WebGPUHardwareTexture } from "./WebGPU/webgpuHardwareTexture";
import type { IColor4Like } from "../Maths/math.like";
import { UniformBuffer } from "../Materials/uniformBuffer";
import { WebGPURenderPassWrapper } from "./WebGPU/webgpuRenderPassWrapper";
import { WebGPUCacheSampler } from "./WebGPU/webgpuCacheSampler";
import type { WebGPUCacheRenderPipeline } from "./WebGPU/webgpuCacheRenderPipeline";
import { WebGPUCacheRenderPipelineTree } from "./WebGPU/webgpuCacheRenderPipelineTree";
import { WebGPUStencilStateComposer } from "./WebGPU/webgpuStencilStateComposer";
import { WebGPUDepthCullingState } from "./WebGPU/webgpuDepthCullingState";
import { DrawWrapper } from "../Materials/drawWrapper";
import { WebGPUMaterialContext } from "./WebGPU/webgpuMaterialContext";
import { WebGPUDrawContext } from "./WebGPU/webgpuDrawContext";
import { WebGPUCacheBindGroups } from "./WebGPU/webgpuCacheBindGroups";
import { WebGPUClearQuad } from "./WebGPU/webgpuClearQuad";
import type { IStencilState } from "../States/IStencilState";
import { WebGPURenderItemBlendColor, WebGPURenderItemScissor, WebGPURenderItemStencilRef, WebGPURenderItemViewport, WebGPUBundleList } from "./WebGPU/webgpuBundleList";
import { WebGPUTimestampQuery } from "./WebGPU/webgpuTimestampQuery";
import type { ComputeEffect } from "../Compute/computeEffect";
import { WebGPUOcclusionQuery } from "./WebGPU/webgpuOcclusionQuery";
import { Observable } from "../Misc/observable";
import { ShaderCodeInliner } from "./Processors/shaderCodeInliner";
import type { TwgslOptions } from "./WebGPU/webgpuTintWASM";
import { WebGPUTintWASM } from "./WebGPU/webgpuTintWASM";
import type { ExternalTexture } from "../Materials/Textures/externalTexture";
import { WebGPUShaderProcessor } from "./WebGPU/webgpuShaderProcessor";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { InternalTextureCreationOptions, TextureSize } from "../Materials/Textures/textureCreationOptions";
import { WebGPUSnapshotRendering } from "./WebGPU/webgpuSnapshotRendering";
import type { WebGPUDataBuffer } from "../Meshes/WebGPU/webgpuDataBuffer";
import type { WebGPURenderTargetWrapper } from "./WebGPU/webgpuRenderTargetWrapper";
import { PerformanceConfigurator } from "./performanceConfigurator";

declare function importScripts(...urls: string[]): void;

declare type VideoTexture = import("../Materials/Textures/videoTexture").VideoTexture;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type RenderTargetWrapper = import("./renderTargetWrapper").RenderTargetWrapper;

/**
 * Options to load the associated Glslang library
 */
export interface GlslangOptions {
    /**
     * Defines an existing instance of Glslang (useful in modules who do not access the global instance).
     */
    glslang?: any;
    /**
     * Defines the URL of the glslang JS File.
     */
    jsPath?: string;
    /**
     * Defines the URL of the glslang WASM File.
     */
    wasmPath?: string;
}

/**
 * Options to create the WebGPU engine
 */
export interface WebGPUEngineOptions extends GPURequestAdapterOptions {
    /**
     * If delta time between frames should be constant
     * @see https://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     */
    deterministicLockstep?: boolean;

    /**
     * Maximum about of steps between frames (Default: 4)
     * @see https://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     */
    lockstepMaxSteps?: number;

    /**
     * Defines the seconds between each deterministic lock step
     */
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
     * Defines if webaudio should be initialized as well
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    audioEngine?: boolean;

    /**
     * Defines the category of adapter to use.
     * Is it the discrete or integrated device.
     */
    powerPreference?: GPUPowerPreference;

    /**
     * Defines the device descriptor used to create a device.
     */
    deviceDescriptor?: GPUDeviceDescriptor;

    /**
     * Defines the requested Swap Chain Format.
     */
    swapChainFormat?: GPUTextureFormat;

    /**
     * Defines whether MSAA is enabled on the canvas.
     */
    antialiasing?: boolean;

    /**
     * Defines whether the stencil buffer should be enabled.
     */
    stencil?: boolean;

    /**
     * Defines whether we should generate debug markers in the gpu command lists (can be seen with PIX for eg)
     */
    enableGPUDebugMarkers?: boolean;

    /**
     * Options to load the associated Glslang library
     */
    glslangOptions?: GlslangOptions;

    /**
     * Options to load the associated Twgsl library
     */
    twgslOptions?: TwgslOptions;

    /**
     * Defines if the engine should no exceed a specified device ratio
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
     */
    limitDeviceRatio?: number;

    /**
     * Defines whether to adapt to the device's viewport characteristics (default: false)
     */
    adaptToDeviceRatio?: boolean;

    /**
     * Defines whether the canvas should be created in "premultiplied" mode (if false, the canvas is created in the "opaque" mode) (true by default)
     */
    premultipliedAlpha?: boolean;

    /**
     * Make the matrix computations to be performed in 64 bits instead of 32 bits. False by default
     */
    useHighPrecisionMatrix?: boolean;
}

/**
 * The web GPU engine class provides support for WebGPU version of babylon.js.
 * @since 5.0.0
 */
export class WebGPUEngine extends Engine {
    // Default glslang options.
    private static readonly _GLSLslangDefaultOptions: GlslangOptions = {
        jsPath: "https://preview.babylonjs.com/glslang/glslang.js",
        wasmPath: "https://preview.babylonjs.com/glslang/glslang.wasm",
    };

    /** true to enable using TintWASM to convert Spir-V to WGSL */
    public static UseTWGSL = true;

    // Page Life cycle and constants
    private readonly _uploadEncoderDescriptor = { label: "upload" };
    private readonly _renderEncoderDescriptor = { label: "render" };
    private readonly _renderTargetEncoderDescriptor = { label: "renderTarget" };
    /** @internal */
    public readonly _clearDepthValue = 1;
    /** @internal */
    public readonly _clearReverseDepthValue = 0;
    /** @internal */
    public readonly _clearStencilValue = 0;
    private readonly _defaultSampleCount = 4; // Only supported value for now.

    // Engine Life Cycle
    private _canvas: HTMLCanvasElement;
    /** @internal */
    public _options: WebGPUEngineOptions;
    private _glslang: any = null;
    private _tintWASM: Nullable<WebGPUTintWASM> = null;
    private _adapter: GPUAdapter;
    private _adapterSupportedExtensions: GPUFeatureName[];
    /** @internal */
    public _device: GPUDevice;
    private _deviceEnabledExtensions: GPUFeatureName[];
    private _context: GPUCanvasContext;
    private _swapChainTexture: GPUTexture;
    private _mainPassSampleCount: number;
    /** @internal */
    public _textureHelper: WebGPUTextureHelper;
    /** @internal */
    public _bufferManager: WebGPUBufferManager;
    private _clearQuad: WebGPUClearQuad;
    /** @internal */
    public _cacheSampler: WebGPUCacheSampler;
    /** @internal */
    public _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    private _cacheBindGroups: WebGPUCacheBindGroups;
    private _emptyVertexBuffer: VertexBuffer;
    /** @internal */
    public _mrtAttachments: number[];
    /** @internal */
    public _timestampQuery: WebGPUTimestampQuery;
    /** @internal */
    public _occlusionQuery: WebGPUOcclusionQuery;
    /** @internal */
    public _compiledComputeEffects: { [key: string]: ComputeEffect } = {};
    /** @internal */
    public _counters: {
        numEnableEffects: number;
        numEnableDrawWrapper: number;
        numBundleCreationNonCompatMode: number;
        numBundleReuseNonCompatMode: number;
    } = {
        numEnableEffects: 0,
        numEnableDrawWrapper: 0,
        numBundleCreationNonCompatMode: 0,
        numBundleReuseNonCompatMode: 0,
    };
    /**
     * Counters from last frame
     */
    public readonly countersLastFrame: {
        numEnableEffects: number;
        numEnableDrawWrapper: number;
        numBundleCreationNonCompatMode: number;
        numBundleReuseNonCompatMode: number;
    } = {
        numEnableEffects: 0,
        numEnableDrawWrapper: 0,
        numBundleCreationNonCompatMode: 0,
        numBundleReuseNonCompatMode: 0,
    };
    /**
     * Max number of uncaptured error messages to log
     */
    public numMaxUncapturedErrors = 20;

    // Some of the internal state might change during the render pass.
    // This happens mainly during clear for the state
    // And when the frame starts to swap the target texture from the swap chain
    private _mainTexture: GPUTexture;
    private _mainTextureLastCopy: GPUTexture;
    private _depthTexture: GPUTexture;
    private _mainTextureExtends: GPUExtent3D;
    private _depthTextureFormat: GPUTextureFormat | undefined;
    private _colorFormat: GPUTextureFormat | null;
    /** @internal */
    public _ubInvertY: WebGPUDataBuffer;
    /** @internal */
    public _ubDontInvertY: WebGPUDataBuffer;

    // Frame Life Cycle (recreated each frame)
    /** @internal */
    public _uploadEncoder: GPUCommandEncoder;
    /** @internal */
    public _renderEncoder: GPUCommandEncoder;
    /** @internal */
    public _renderTargetEncoder: GPUCommandEncoder;

    private _commandBuffers: GPUCommandBuffer[] = [null as any, null as any, null as any];

    // Frame Buffer Life Cycle (recreated for each render target pass)
    /** @internal */
    public _currentRenderPass: Nullable<GPURenderPassEncoder> = null;
    /** @internal */
    public _mainRenderPassWrapper: WebGPURenderPassWrapper = new WebGPURenderPassWrapper();
    /** @internal */
    public _rttRenderPassWrapper: WebGPURenderPassWrapper = new WebGPURenderPassWrapper();
    /** @internal */
    public _pendingDebugCommands: Array<[string, Nullable<string>]> = [];
    /** @internal */
    public _bundleList: WebGPUBundleList;
    /** @internal */
    public _bundleListRenderTarget: WebGPUBundleList;
    /** @internal */
    public _onAfterUnbindFrameBufferObservable = new Observable<WebGPUEngine>();

    // DrawCall Life Cycle
    // Effect is on the parent class
    // protected _currentEffect: Nullable<Effect> = null;
    private _defaultDrawContext: WebGPUDrawContext;
    private _defaultMaterialContext: WebGPUMaterialContext;
    /** @internal */
    public _currentDrawContext: WebGPUDrawContext;
    /** @internal */
    public _currentMaterialContext: WebGPUMaterialContext;
    private _currentOverrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }> = null;
    private _currentIndexBuffer: Nullable<DataBuffer> = null;
    private _colorWriteLocal = true;
    private _forceEnableEffect = false;

    // TODO WEBGPU remove those variables when code stabilized
    /** @internal */
    public dbgShowShaderCode = false;
    /** @internal */
    public dbgSanityChecks = true;
    /** @internal */
    public dbgVerboseLogsForFirstFrames = false;
    /** @internal */
    public dbgVerboseLogsNumFrames = 10;
    /** @internal */
    public dbgLogIfNotDrawWrapper = true;
    /** @internal */
    public dbgShowEmptyEnableEffectCalls = true;

    private _snapshotRendering: WebGPUSnapshotRendering;

    /**
     * Gets or sets the snapshot rendering mode
     */
    public get snapshotRenderingMode(): number {
        return this._snapshotRendering.mode;
    }

    public set snapshotRenderingMode(mode: number) {
        this._snapshotRendering.mode = mode;
    }

    /**
     * Creates a new snapshot at the next frame using the current snapshotRenderingMode
     */
    public snapshotRenderingReset(): void {
        this._snapshotRendering.reset();
    }

    /**
     * Enables or disables the snapshot rendering mode
     * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
     */
    public get snapshotRendering(): boolean {
        return this._snapshotRendering.enabled;
    }

    public set snapshotRendering(activate) {
        this._snapshotRendering.enabled = activate;
    }

    /**
     * Sets this to true to disable the cache for the samplers. You should do it only for testing purpose!
     */
    public get disableCacheSamplers(): boolean {
        return this._cacheSampler ? this._cacheSampler.disabled : false;
    }

    public set disableCacheSamplers(disable: boolean) {
        if (this._cacheSampler) {
            this._cacheSampler.disabled = disable;
        }
    }

    /**
     * Sets this to true to disable the cache for the render pipelines. You should do it only for testing purpose!
     */
    public get disableCacheRenderPipelines(): boolean {
        return this._cacheRenderPipeline ? this._cacheRenderPipeline.disabled : false;
    }

    public set disableCacheRenderPipelines(disable: boolean) {
        if (this._cacheRenderPipeline) {
            this._cacheRenderPipeline.disabled = disable;
        }
    }

    /**
     * Sets this to true to disable the cache for the bind groups. You should do it only for testing purpose!
     */
    public get disableCacheBindGroups(): boolean {
        return this._cacheBindGroups ? this._cacheBindGroups.disabled : false;
    }

    public set disableCacheBindGroups(disable: boolean) {
        if (this._cacheBindGroups) {
            this._cacheBindGroups.disabled = disable;
        }
    }

    /**
     * Gets a Promise<boolean> indicating if the engine can be instantiated (ie. if a WebGPU context can be found)
     */
    public static get IsSupportedAsync(): Promise<boolean> {
        return !navigator.gpu
            ? Promise.resolve(false)
            : navigator.gpu
                  .requestAdapter()
                  .then(
                      (adapter: GPUAdapter | null) => !!adapter,
                      () => false
                  )
                  .catch(() => false);
    }

    /**
     * Not supported by WebGPU, you should call IsSupportedAsync instead!
     */
    public static get IsSupported(): boolean {
        Logger.Warn("You must call IsSupportedAsync for WebGPU!");
        return false;
    }

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     */
    public get supportsUniformBuffers(): boolean {
        return true;
    }

    /** Gets the supported extensions by the WebGPU adapter */
    public get supportedExtensions(): Immutable<GPUFeatureName[]> {
        return this._adapterSupportedExtensions;
    }

    /** Gets the currently enabled extensions on the WebGPU device */
    public get enabledExtensions(): Immutable<GPUFeatureName[]> {
        return this._deviceEnabledExtensions;
    }

    /**
     * Returns a string describing the current engine
     */
    public get description(): string {
        const description = this.name + this.version;

        return description;
    }

    /**
     * Returns the version of the engine
     */
    public get version(): number {
        return 1;
    }

    /**
     * Gets an object containing information about the current engine context
     * @returns an object containing the vendor, the renderer and the version of the current engine context
     */
    public getInfo() {
        return {
            vendor: "unknown vendor",
            renderer: "unknown renderer",
            version: "unknown version",
        };
    }

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/advanced_topics/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    public get compatibilityMode() {
        return this._compatibilityMode;
    }

    public set compatibilityMode(mode: boolean) {
        this._compatibilityMode = mode;
    }

    /** @internal */
    public get currentSampleCount(): number {
        return this._currentRenderTarget ? this._currentRenderTarget.samples : this._mainPassSampleCount;
    }

    /**
     * Create a new instance of the gpu engine asynchronously
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     * @returns a promise that resolves with the created engine
     */
    public static CreateAsync(canvas: HTMLCanvasElement, options: WebGPUEngineOptions = {}): Promise<WebGPUEngine> {
        const engine = new WebGPUEngine(canvas, options);

        return new Promise((resolve) => {
            engine.initAsync(options.glslangOptions, options.twgslOptions).then(() => resolve(engine));
        });
    }

    /**
     * Create a new instance of the gpu engine.
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     */
    public constructor(canvas: HTMLCanvasElement, options: WebGPUEngineOptions = {}) {
        super(null);
        this._name = "WebGPU";

        (this.isNDCHalfZRange as any) = true;
        (this.hasOriginBottomLeft as any) = false;

        options.deviceDescriptor = options.deviceDescriptor || {};
        options.antialiasing = options.antialiasing === undefined ? true : options.antialiasing;
        options.stencil = options.stencil ?? true;
        options.enableGPUDebugMarkers = options.enableGPUDebugMarkers ?? false;

        PerformanceConfigurator.SetMatrixPrecision(!!options.useHighPrecisionMatrix);

        Logger.Log(`Babylon.js v${Engine.Version} - ${this.description} engine`);
        if (!navigator.gpu) {
            Logger.Error("WebGPU is not supported by your browser.");
            return;
        }

        options.swapChainFormat = options.swapChainFormat || navigator.gpu.getPreferredCanvasFormat();

        this._isWebGPU = true;
        this._shaderPlatformName = "WEBGPU";

        if (options.deterministicLockstep === undefined) {
            options.deterministicLockstep = false;
        }

        if (options.lockstepMaxSteps === undefined) {
            options.lockstepMaxSteps = 4;
        }

        if (options.audioEngine === undefined) {
            options.audioEngine = true;
        }

        this._deterministicLockstep = options.deterministicLockstep;
        this._lockstepMaxSteps = options.lockstepMaxSteps;
        this._timeStep = options.timeStep || 1 / 60;

        this._doNotHandleContextLost = !!options.doNotHandleContextLost;

        this._canvas = canvas;
        this._options = options;
        this.premultipliedAlpha = options.premultipliedAlpha ?? true;

        const devicePixelRatio = IsWindowObjectExist() ? window.devicePixelRatio || 1.0 : 1.0;
        const limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;
        const adaptToDeviceRatio = options.adaptToDeviceRatio ?? false;

        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0;
        this._mainPassSampleCount = options.antialiasing ? this._defaultSampleCount : 1;
        this._isStencilEnable = options.stencil;

        this._sharedInit(canvas, !!options.doNotHandleTouchAction, options.audioEngine);

        this._shaderProcessor = new WebGPUShaderProcessorGLSL();
        this._shaderProcessorWGSL = new WebGPUShaderProcessorWGSL();
    }

    //------------------------------------------------------------------------------
    //                              Initialization
    //------------------------------------------------------------------------------

    /**
     * Initializes the WebGPU context and dependencies.
     * @param glslangOptions Defines the GLSLang compiler options if necessary
     * @param twgslOptions Defines the Twgsl compiler options if necessary
     * @returns a promise notifying the readiness of the engine.
     */
    public initAsync(glslangOptions?: GlslangOptions, twgslOptions?: TwgslOptions): Promise<void> {
        return this._initGlslang(glslangOptions ?? this._options?.glslangOptions)
            .then(
                (glslang: any) => {
                    this._glslang = glslang;
                    this._tintWASM = WebGPUEngine.UseTWGSL ? new WebGPUTintWASM() : null;
                    return this._tintWASM
                        ? this._tintWASM.initTwgsl(twgslOptions ?? this._options?.twgslOptions).then(
                              () => {
                                  return navigator.gpu!.requestAdapter(this._options);
                              },
                              (msg: string) => {
                                  Logger.Error("Can not initialize twgsl!");
                                  Logger.Error(msg);
                                  throw Error("WebGPU initializations stopped.");
                              }
                          )
                        : navigator.gpu!.requestAdapter(this._options);
                },
                (msg: string) => {
                    Logger.Error("Can not initialize glslang!");
                    Logger.Error(msg);
                    throw Error("WebGPU initializations stopped.");
                }
            )
            .then((adapter: GPUAdapter | null) => {
                if (!adapter) {
                    throw "Could not retrieve a WebGPU adapter (adapter is null).";
                } else {
                    this._adapter = adapter!;
                    this._adapterSupportedExtensions = [];
                    this._adapter.features?.forEach((feature) => this._adapterSupportedExtensions.push(feature as WebGPUConstants.FeatureName));

                    const deviceDescriptor = this._options.deviceDescriptor;

                    if (deviceDescriptor?.requiredFeatures) {
                        const requestedExtensions = deviceDescriptor.requiredFeatures;
                        const validExtensions: GPUFeatureName[] = [];

                        for (const extension of requestedExtensions) {
                            if (this._adapterSupportedExtensions.indexOf(extension) !== -1) {
                                validExtensions.push(extension);
                            }
                        }

                        deviceDescriptor.requiredFeatures = validExtensions;
                    }

                    return this._adapter.requestDevice(this._options.deviceDescriptor);
                }
            })
            .then(
                (device: GPUDevice) => {
                    this._device = device;
                    this._deviceEnabledExtensions = [];
                    this._device.features?.forEach((feature) => this._deviceEnabledExtensions.push(feature as WebGPUConstants.FeatureName));

                    let numUncapturedErrors = -1;
                    this._device.addEventListener("uncapturederror", (event) => {
                        if (++numUncapturedErrors < this.numMaxUncapturedErrors) {
                            Logger.Warn(`WebGPU uncaptured error (${numUncapturedErrors + 1}): ${(<GPUUncapturedErrorEvent>event).error} - ${(<any>event).error.message}`);
                        } else if (numUncapturedErrors++ === this.numMaxUncapturedErrors) {
                            Logger.Warn(
                                `WebGPU uncaptured error: too many warnings (${this.numMaxUncapturedErrors}), no more warnings will be reported to the console for this engine.`
                            );
                        }
                    });

                    if (!this._doNotHandleContextLost) {
                        this._device.lost?.then((info) => {
                            this._contextWasLost = true;
                            Logger.Warn("WebGPU context lost. " + info);
                            this.onContextLostObservable.notifyObservers(this);
                            this._restoreEngineAfterContextLost(this.initAsync.bind(this));
                        });
                    }
                },
                (e: any) => {
                    Logger.Error("Could not retrieve a WebGPU device.");
                    Logger.Error(e);
                }
            )
            .then(() => {
                this._bufferManager = new WebGPUBufferManager(this._device);
                this._textureHelper = new WebGPUTextureHelper(this._device, this._glslang, this._tintWASM, this._bufferManager);
                this._cacheSampler = new WebGPUCacheSampler(this._device);
                this._cacheBindGroups = new WebGPUCacheBindGroups(this._device, this._cacheSampler, this);
                this._timestampQuery = new WebGPUTimestampQuery(this._device, this._bufferManager);
                this._occlusionQuery = (this._device as any).createQuerySet ? new WebGPUOcclusionQuery(this, this._device, this._bufferManager) : (undefined as any);
                this._bundleList = new WebGPUBundleList(this._device);
                this._bundleListRenderTarget = new WebGPUBundleList(this._device);
                this._snapshotRendering = new WebGPUSnapshotRendering(this, this._snapshotRenderingMode, this._bundleList, this._bundleListRenderTarget);

                this._ubInvertY = this._bufferManager.createBuffer(new Float32Array([-1, 0]), WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);
                this._ubDontInvertY = this._bufferManager.createBuffer(new Float32Array([1, 0]), WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);

                if (this.dbgVerboseLogsForFirstFrames) {
                    if ((this as any)._count === undefined) {
                        (this as any)._count = 0;
                        console.log("%c frame #" + (this as any)._count + " - begin", "background: #ffff00");
                    }
                }

                this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
                this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);
                this._renderTargetEncoder = this._device.createCommandEncoder(this._renderTargetEncoderDescriptor);

                this._emptyVertexBuffer = new VertexBuffer(this, [0], "", false, false, 1, false, 0, 1);

                this._initializeLimits();

                this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, this._emptyVertexBuffer, !this._caps.textureFloatLinearFiltering);

                this._depthCullingState = new WebGPUDepthCullingState(this._cacheRenderPipeline);
                this._stencilStateComposer = new WebGPUStencilStateComposer(this._cacheRenderPipeline);
                this._stencilStateComposer.stencilGlobal = this._stencilState;

                this._depthCullingState.depthTest = true;
                this._depthCullingState.depthFunc = Constants.LEQUAL;
                this._depthCullingState.depthMask = true;

                this._textureHelper.setCommandEncoder(this._uploadEncoder);

                this._clearQuad = new WebGPUClearQuad(this._device, this, this._emptyVertexBuffer);
                this._defaultDrawContext = this.createDrawContext()!;
                this._currentDrawContext = this._defaultDrawContext;
                this._defaultMaterialContext = this.createMaterialContext()!;
                this._currentMaterialContext = this._defaultMaterialContext;

                this._initializeContextAndSwapChain();
                this._initializeMainAttachments();
                this.resize();
            })
            .catch((e: any) => {
                Logger.Error("Can not create WebGPU Device and/or context.");
                Logger.Error(e);
                if (console.trace) {
                    console.trace();
                }
            });
    }

    private _initGlslang(glslangOptions?: GlslangOptions): Promise<any> {
        glslangOptions = glslangOptions || {};
        glslangOptions = {
            ...WebGPUEngine._GLSLslangDefaultOptions,
            ...glslangOptions,
        };

        if (glslangOptions.glslang) {
            return Promise.resolve(glslangOptions.glslang);
        }

        if ((self as any).glslang) {
            return (self as any).glslang(glslangOptions!.wasmPath);
        }

        if (glslangOptions.jsPath && glslangOptions.wasmPath) {
            if (IsWindowObjectExist()) {
                return Tools.LoadScriptAsync(glslangOptions.jsPath).then(() => {
                    return (self as any).glslang(glslangOptions!.wasmPath);
                });
            } else {
                importScripts(glslangOptions.jsPath);
                return (self as any).glslang(glslangOptions!.wasmPath);
            }
        }

        return Promise.reject("gslang is not available.");
    }

    private _initializeLimits(): void {
        // Init caps
        // TODO WEBGPU Real Capability check once limits will be working.

        this._caps = {
            maxTexturesImageUnits: 16,
            maxVertexTextureImageUnits: 16,
            maxCombinedTexturesImageUnits: 32,
            maxTextureSize: 8192,
            maxCubemapTextureSize: 2048,
            maxRenderTextureSize: 8192,
            maxVertexAttribs: 16,
            maxVaryingVectors: 15,
            maxFragmentUniformVectors: 1024,
            maxVertexUniformVectors: 1024,
            standardDerivatives: true,
            astc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionASTC) >= 0 ? true : undefined) as any,
            s3tc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined) as any,
            pvrtc: null,
            etc1: null,
            etc2: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionETC2) >= 0 ? true : undefined) as any,
            bptc: this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined,
            maxAnisotropy: 4, // the spec only supports values of 1 and 4
            uintIndices: true,
            fragmentDepthSupported: true,
            highPrecisionShaderSupported: true,
            colorBufferFloat: true,
            textureFloat: true,
            textureFloatLinearFiltering: false, // WebGPU does not allow filtering 32 bits float textures
            textureFloatRender: true,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: true,
            textureHalfFloatRender: true,
            textureLOD: true,
            drawBuffersExtension: true,
            depthTextureExtension: true,
            vertexArrayObject: false,
            instancedArrays: true,
            timerQuery: typeof BigUint64Array !== "undefined" && this.enabledExtensions.indexOf(WebGPUConstants.FeatureName.TimestampQuery) !== -1 ? (true as any) : undefined,
            supportOcclusionQuery: typeof BigUint64Array !== "undefined",
            canUseTimestampForTimerQuery: true,
            multiview: false,
            oculusMultiview: false,
            parallelShaderCompile: undefined,
            blendMinMax: true,
            maxMSAASamples: 4,
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: true,
            supportSRGBBuffers: true,
            supportTransformFeedbacks: false,
            textureMaxLevel: true,
            texture2DArrayMaxLayerCount: 2048,
        };

        this._caps.parallelShaderCompile = null as any;

        this._features = {
            forceBitmapOverHTMLImageElement: true,
            supportRenderAndCopyToLodForFloatTextures: true,
            supportDepthStencilTexture: true,
            supportShadowSamplers: true,
            uniformBufferHardCheckMatrix: false,
            allowTexturePrefiltering: true,
            trackUbosInFrame: true,
            checkUbosContentBeforeUpload: true,
            supportCSM: true,
            basisNeedsPOT: false,
            support3DTextures: true,
            needTypeSuffixInShaderConstants: true,
            supportMSAA: true,
            supportSSAO2: true,
            supportExtendedTextureFormats: true,
            supportSwitchCaseInShader: true,
            supportSyncTextureRead: false,
            needsInvertingBitmap: false,
            useUBOBindingCache: false,
            needShaderCodeInlining: true,
            needToAlwaysBindUniformBuffers: true,
            supportRenderPasses: true,
            supportSpriteInstancing: true,
            _collectUbosUpdatedInFrame: false,
        };
    }

    private _initializeContextAndSwapChain(): void {
        this._context = this._canvas.getContext("webgpu") as unknown as GPUCanvasContext;
        this._configureContext();
        this._colorFormat = this._options.swapChainFormat!;
        this._mainRenderPassWrapper.colorAttachmentGPUTextures = [new WebGPUHardwareTexture()];
        this._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.format = this._colorFormat;
    }

    // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
    private _initializeMainAttachments(): void {
        if (!this._bufferManager) {
            return;
        }

        this._mainTextureExtends = {
            width: this.getRenderWidth(),
            height: this.getRenderHeight(),
            depthOrArrayLayers: 1,
        };

        const bufferDataUpdate = new Float32Array([this.getRenderHeight()]);

        this._bufferManager.setSubData(this._ubInvertY, 4, bufferDataUpdate);
        this._bufferManager.setSubData(this._ubDontInvertY, 4, bufferDataUpdate);

        let mainColorAttachments: GPURenderPassColorAttachment[];

        if (this._options.antialiasing) {
            const mainTextureDescriptor: GPUTextureDescriptor = {
                size: this._mainTextureExtends,
                mipLevelCount: 1,
                sampleCount: this._mainPassSampleCount,
                dimension: WebGPUConstants.TextureDimension.E2d,
                format: this._options.swapChainFormat!,
                usage: WebGPUConstants.TextureUsage.RenderAttachment,
            };

            this._mainTexture?.destroy();
            this._mainTexture = this._device.createTexture(mainTextureDescriptor);
            mainColorAttachments = [
                {
                    view: this._mainTexture.createView(),
                    clearValue: new Color4(0, 0, 0, 1),
                    loadOp: WebGPUConstants.LoadOp.Clear,
                    storeOp: WebGPUConstants.StoreOp.Store, // don't use StoreOp.Discard, else using several cameras with different viewports or using scissors will fail because we call beginRenderPass / endPass several times for the same color attachment!
                },
            ];
        } else {
            mainColorAttachments = [
                {
                    view: undefined as any,
                    clearValue: new Color4(0, 0, 0, 1),
                    loadOp: WebGPUConstants.LoadOp.Clear,
                    storeOp: WebGPUConstants.StoreOp.Store,
                },
            ];
        }

        this._mainRenderPassWrapper.depthTextureFormat = this.isStencilEnable ? WebGPUConstants.TextureFormat.Depth24PlusStencil8 : WebGPUConstants.TextureFormat.Depth32Float;

        this._setDepthTextureFormat(this._mainRenderPassWrapper);

        const depthTextureDescriptor: GPUTextureDescriptor = {
            size: this._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: this._mainPassSampleCount,
            dimension: WebGPUConstants.TextureDimension.E2d,
            format: this._mainRenderPassWrapper.depthTextureFormat,
            usage: WebGPUConstants.TextureUsage.RenderAttachment,
        };

        if (this._depthTexture) {
            this._depthTexture.destroy();
        }
        this._depthTexture = this._device.createTexture(depthTextureDescriptor);
        const mainDepthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this._depthTexture.createView(),

            depthClearValue: this._clearDepthValue,
            depthLoadOp: WebGPUConstants.LoadOp.Clear,
            depthStoreOp: WebGPUConstants.StoreOp.Store,
            stencilClearValue: this._clearStencilValue,
            stencilLoadOp: !this.isStencilEnable ? undefined : WebGPUConstants.LoadOp.Clear,
            stencilStoreOp: !this.isStencilEnable ? undefined : WebGPUConstants.StoreOp.Store,
        };

        this._mainRenderPassWrapper.renderPassDescriptor = {
            colorAttachments: mainColorAttachments,
            depthStencilAttachment: mainDepthAttachment,
        };

        if (this._mainRenderPassWrapper.renderPass !== null) {
            this._endMainRenderPass();
        }
    }

    private _configureContext(): void {
        this._context.configure({
            device: this._device,
            format: this._options.swapChainFormat!,
            usage: WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopySrc,
            alphaMode: this.premultipliedAlpha ? WebGPUConstants.CanvasAlphaMode.Premultiplied : WebGPUConstants.CanvasAlphaMode.Opaque,
        });
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number, forceSetSize = false): boolean {
        if (!super.setSize(width, height, forceSetSize)) {
            return false;
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - setSize called -", width, height);
            }
        }

        this._initializeMainAttachments();

        if (this.snapshotRendering) {
            // reset snapshot rendering so that the next frame will record a new list of bundles
            this.snapshotRenderingReset();
        }

        return true;
    }

    private _shaderProcessorWGSL: Nullable<IShaderProcessor>;

    /**
     * @internal
     */
    public _getShaderProcessor(shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
        if (shaderLanguage === ShaderLanguage.WGSL) {
            return this._shaderProcessorWGSL;
        }
        return this._shaderProcessor;
    }

    /**
     * @internal
     */
    public _getShaderProcessingContext(shaderLanguage: ShaderLanguage): Nullable<ShaderProcessingContext> {
        return new WebGPUShaderProcessingContext(shaderLanguage);
    }

    //------------------------------------------------------------------------------
    //                          Static Pipeline WebGPU States
    //------------------------------------------------------------------------------

    /** @internal */
    public applyStates() {
        this._stencilStateComposer.apply();
        this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
    }

    /**
     * Force the entire cache to be cleared
     * You should not have to use this function unless your engine needs to share the WebGPU context with another engine
     * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
     */
    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames && !bruteForce) {
            return;
        }

        //this._currentEffect = null; // can't reset _currentEffect, else some crashes can occur (for eg in ProceduralTexture which calls bindFrameBuffer (which calls wipeCaches) after having called enableEffect and before drawing into the texture)
        // _forceEnableEffect = true assumes the role of _currentEffect = null
        this._forceEnableEffect = true;
        this._currentIndexBuffer = null;
        this._currentOverrideVertexBuffers = null;
        this._cacheRenderPipeline.setBuffers(null, null, null);

        if (bruteForce) {
            this._stencilStateComposer.reset();

            this._depthCullingState.reset();
            this._depthCullingState.depthFunc = Constants.LEQUAL;

            this._alphaState.reset();
            this._alphaMode = Constants.ALPHA_ADD;
            this._alphaEquation = Constants.ALPHA_DISABLE;
            this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
            this._cacheRenderPipeline.setAlphaBlendEnabled(false);

            this.setColorWrite(true);
        }

        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public setColorWrite(enable: boolean): void {
        this._colorWriteLocal = enable;
        this._cacheRenderPipeline.setWriteMask(enable ? 0xf : 0);
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return this._colorWriteLocal;
    }

    //------------------------------------------------------------------------------
    //                              Dynamic WebGPU States
    //------------------------------------------------------------------------------

    // index 0 is for main render pass, 1 for RTT render pass
    private _viewportsCurrent: Array<{ x: number; y: number; w: number; h: number }> = [
        { x: 0, y: 0, w: 0, h: 0 },
        { x: 0, y: 0, w: 0, h: 0 },
    ];

    private _resetCurrentViewport(index: number) {
        this._viewportsCurrent[index].x = 0;
        this._viewportsCurrent[index].y = 0;
        this._viewportsCurrent[index].w = 0;
        this._viewportsCurrent[index].h = 0;

        if (index === 1) {
            this._viewportCached.x = 0;
            this._viewportCached.y = 0;
            this._viewportCached.z = 0;
            this._viewportCached.w = 0;
        }
    }

    private _mustUpdateViewport(renderPass: GPURenderPassEncoder): boolean {
        const index = renderPass === this._mainRenderPassWrapper.renderPass ? 0 : 1;

        const x = this._viewportCached.x,
            y = this._viewportCached.y,
            w = this._viewportCached.z,
            h = this._viewportCached.w;

        const update =
            this._viewportsCurrent[index].x !== x || this._viewportsCurrent[index].y !== y || this._viewportsCurrent[index].w !== w || this._viewportsCurrent[index].h !== h;

        if (update) {
            this._viewportsCurrent[index].x = this._viewportCached.x;
            this._viewportsCurrent[index].y = this._viewportCached.y;
            this._viewportsCurrent[index].w = this._viewportCached.z;
            this._viewportsCurrent[index].h = this._viewportCached.w;
        }

        return update;
    }

    private _applyViewport(renderPass: GPURenderPassEncoder): void {
        let y = Math.floor(this._viewportCached.y);
        const h = Math.floor(this._viewportCached.w);

        if (!this._currentRenderTarget) {
            y = this.getRenderHeight() - y - h;
        }

        renderPass.setViewport(Math.floor(this._viewportCached.x), y, Math.floor(this._viewportCached.z), h, 0, 1);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log(
                    "frame #" + (this as any)._count + " - viewport applied - (",
                    this._viewportCached.x,
                    this._viewportCached.y,
                    this._viewportCached.z,
                    this._viewportCached.w,
                    ") current pass is main pass=" + (renderPass === this._mainRenderPassWrapper.renderPass)
                );
            }
        }
    }

    /**
     * @internal
     */
    public _viewport(x: number, y: number, width: number, height: number): void {
        this._viewportCached.x = x;
        this._viewportCached.y = y;
        this._viewportCached.z = width;
        this._viewportCached.w = height;
    }

    private _scissorsCurrent: Array<{ x: number; y: number; w: number; h: number }> = [
        { x: 0, y: 0, w: 0, h: 0 },
        { x: 0, y: 0, w: 0, h: 0 },
    ];
    protected _scissorCached = { x: 0, y: 0, z: 0, w: 0 };

    private _resetCurrentScissor(index: number) {
        this._scissorsCurrent[index].x = 0;
        this._scissorsCurrent[index].y = 0;
        this._scissorsCurrent[index].w = 0;
        this._scissorsCurrent[index].h = 0;
    }

    private _mustUpdateScissor(renderPass: GPURenderPassEncoder): boolean {
        const index = renderPass === this._mainRenderPassWrapper.renderPass ? 0 : 1;

        const x = this._scissorCached.x,
            y = this._scissorCached.y,
            w = this._scissorCached.z,
            h = this._scissorCached.w;

        const update = this._scissorsCurrent[index].x !== x || this._scissorsCurrent[index].y !== y || this._scissorsCurrent[index].w !== w || this._scissorsCurrent[index].h !== h;

        if (update) {
            this._scissorsCurrent[index].x = this._scissorCached.x;
            this._scissorsCurrent[index].y = this._scissorCached.y;
            this._scissorsCurrent[index].w = this._scissorCached.z;
            this._scissorsCurrent[index].h = this._scissorCached.w;
        }

        return update;
    }

    private _applyScissor(renderPass: GPURenderPassEncoder): void {
        renderPass.setScissorRect(
            this._scissorCached.x,
            this._currentRenderTarget ? this._scissorCached.y : this.getRenderHeight() - this._scissorCached.w - this._scissorCached.y,
            this._scissorCached.z,
            this._scissorCached.w
        );

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log(
                    "frame #" + (this as any)._count + " - scissor applied - (",
                    this._scissorCached.x,
                    this._scissorCached.y,
                    this._scissorCached.z,
                    this._scissorCached.w,
                    ") current pass is main pass=" + (renderPass === this._mainRenderPassWrapper.renderPass)
                );
            }
        }
    }

    private _scissorIsActive() {
        return this._scissorCached.x !== 0 || this._scissorCached.y !== 0 || this._scissorCached.z !== 0 || this._scissorCached.w !== 0;
    }

    public enableScissor(x: number, y: number, width: number, height: number): void {
        this._scissorCached.x = x;
        this._scissorCached.y = y;
        this._scissorCached.z = width;
        this._scissorCached.w = height;
    }

    public disableScissor() {
        this._scissorCached.x = 0;
        this._scissorCached.y = 0;
        this._scissorCached.z = 0;
        this._scissorCached.w = 0;

        this._resetCurrentScissor(0);
        this._resetCurrentScissor(1);
    }

    private _stencilRefsCurrent: Array<number> = [-1, -1];

    private _resetCurrentStencilRef(index: number): void {
        this._stencilRefsCurrent[index] = -1;
    }

    private _mustUpdateStencilRef(renderPass: GPURenderPassEncoder): boolean {
        const index = renderPass === this._mainRenderPassWrapper.renderPass ? 0 : 1;
        const update = this._stencilStateComposer.funcRef !== this._stencilRefsCurrent[index];
        if (update) {
            this._stencilRefsCurrent[index] = this._stencilStateComposer.funcRef;
        }
        return update;
    }

    /**
     * @internal
     */
    public _applyStencilRef(renderPass: GPURenderPassEncoder): void {
        renderPass.setStencilReference(this._stencilStateComposer.funcRef ?? 0);
    }

    private _blendColorsCurrent: Array<Array<Nullable<number>>> = [
        [null, null, null, null],
        [null, null, null, null],
    ];

    private _resetCurrentColorBlend(index: number): void {
        this._blendColorsCurrent[index][0] = this._blendColorsCurrent[index][1] = this._blendColorsCurrent[index][2] = this._blendColorsCurrent[index][3] = null;
    }

    private _mustUpdateBlendColor(renderPass: GPURenderPassEncoder): boolean {
        const index = renderPass === this._mainRenderPassWrapper.renderPass ? 0 : 1;
        const colorBlend = this._alphaState._blendConstants;

        const update =
            colorBlend[0] !== this._blendColorsCurrent[index][0] ||
            colorBlend[1] !== this._blendColorsCurrent[index][1] ||
            colorBlend[2] !== this._blendColorsCurrent[index][2] ||
            colorBlend[3] !== this._blendColorsCurrent[index][3];

        if (update) {
            this._blendColorsCurrent[index][0] = colorBlend[0];
            this._blendColorsCurrent[index][1] = colorBlend[1];
            this._blendColorsCurrent[index][2] = colorBlend[2];
            this._blendColorsCurrent[index][3] = colorBlend[3];
        }

        return update;
    }

    private _applyBlendColor(renderPass: GPURenderPassEncoder): void {
        renderPass.setBlendConstant(this._alphaState._blendConstants as GPUColor);
    }

    /**
     * Clear the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        // Some PGs are using color3...
        if (color && color.a === undefined) {
            color.a = 1;
        }

        const hasScissor = this._scissorIsActive();

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log(
                    "frame #" + (this as any)._count + " - clear called - backBuffer=",
                    backBuffer,
                    " depth=",
                    depth,
                    " stencil=",
                    stencil,
                    " scissor is active=",
                    hasScissor
                );
            }
        }

        // We need to recreate the render pass so that the new parameters for clear color / depth / stencil are taken into account
        if (this._currentRenderTarget) {
            if (hasScissor) {
                if (!this._rttRenderPassWrapper.renderPass) {
                    this._startRenderTargetRenderPass(this._currentRenderTarget!, false, backBuffer ? color : null, depth, stencil);
                }
                if (!this.compatibilityMode) {
                    this._bundleListRenderTarget.addItem(new WebGPURenderItemScissor(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w));
                } else {
                    this._applyScissor(this._currentRenderPass!);
                }
                this._clearFullQuad(backBuffer ? color : null, depth, stencil);
            } else {
                if (this._currentRenderPass) {
                    this._endRenderTargetRenderPass();
                }
                this._startRenderTargetRenderPass(this._currentRenderTarget!, true, backBuffer ? color : null, depth, stencil);
            }
        } else {
            if (!this._mainRenderPassWrapper.renderPass || !hasScissor) {
                this._startMainRenderPass(!hasScissor, backBuffer ? color : null, depth, stencil);
            }
            if (hasScissor) {
                if (!this.compatibilityMode) {
                    this._bundleList.addItem(new WebGPURenderItemScissor(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w));
                } else {
                    this._applyScissor(this._currentRenderPass!);
                }
                this._clearFullQuad(backBuffer ? color : null, depth, stencil);
            }
        }
    }

    private _clearFullQuad(clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
        const renderPass = !this.compatibilityMode ? null : this._getCurrentRenderPass();
        const renderPassIndex = this._getCurrentRenderPassIndex();
        const bundleList = renderPassIndex === 0 ? this._bundleList : this._bundleListRenderTarget;

        this._clearQuad.setColorFormat(this._colorFormat);
        this._clearQuad.setDepthStencilFormat(this._depthTextureFormat);
        this._clearQuad.setMRTAttachments(
            this._cacheRenderPipeline.mrtAttachments ?? [],
            this._cacheRenderPipeline.mrtTextureArray ?? [],
            this._cacheRenderPipeline.mrtTextureCount
        );

        if (!this.compatibilityMode) {
            bundleList.addItem(new WebGPURenderItemStencilRef(this._clearStencilValue));
        } else {
            renderPass!.setStencilReference(this._clearStencilValue);
        }

        const bundle = this._clearQuad.clear(renderPass, clearColor, clearDepth, clearStencil, this.currentSampleCount);

        if (!this.compatibilityMode) {
            bundleList.addBundle(bundle!);
            bundleList.addItem(new WebGPURenderItemStencilRef(this._stencilStateComposer.funcRef ?? 0));
            this._reportDrawCall();
        } else {
            this._applyStencilRef(renderPass!);
        }
    }

    //------------------------------------------------------------------------------
    //                              Vertex/Index/Storage Buffers
    //------------------------------------------------------------------------------

    /**
     * Creates a vertex buffer
     * @param data the data for the vertex buffer
     * @returns the new buffer
     */
    public createVertexBuffer(data: DataArray): DataBuffer {
        let view: ArrayBufferView;

        if (data instanceof Array) {
            view = new Float32Array(data);
        } else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        } else {
            view = data;
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Vertex | WebGPUConstants.BufferUsage.CopyDst);
        return dataBuffer;
    }

    /**
     * Creates a vertex buffer
     * @param data the data for the dynamic vertex buffer
     * @returns the new buffer
     */
    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        return this.createVertexBuffer(data);
    }

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @returns a new buffer
     */
    public createIndexBuffer(indices: IndicesArray): DataBuffer {
        let is32Bits = true;
        let view: ArrayBufferView;

        if (indices instanceof Uint32Array || indices instanceof Int32Array) {
            view = indices;
        } else if (indices instanceof Uint16Array) {
            view = indices;
            is32Bits = false;
        } else {
            if (indices.length > 65535) {
                view = new Uint32Array(indices);
            } else {
                view = new Uint16Array(indices);
                is32Bits = false;
            }
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Index | WebGPUConstants.BufferUsage.CopyDst);
        dataBuffer.is32Bits = is32Bits;
        return dataBuffer;
    }

    /**
     * @internal
     */
    public _createBuffer(data: DataArray | number, creationFlags: number): DataBuffer {
        let view: ArrayBufferView | number;

        if (data instanceof Array) {
            view = new Float32Array(data);
        } else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        } else {
            view = data;
        }

        let flags = 0;
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_READ) {
            flags |= WebGPUConstants.BufferUsage.CopySrc;
        }
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_WRITE) {
            flags |= WebGPUConstants.BufferUsage.CopyDst;
        }
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_UNIFORM) {
            flags |= WebGPUConstants.BufferUsage.Uniform;
        }
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_VERTEX) {
            flags |= WebGPUConstants.BufferUsage.Vertex;
        }
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_INDEX) {
            flags |= WebGPUConstants.BufferUsage.Index;
        }
        if (creationFlags & Constants.BUFFER_CREATIONFLAG_STORAGE) {
            flags |= WebGPUConstants.BufferUsage.Storage;
        }

        return this._bufferManager.createBuffer(view, flags);
    }

    /**
     * @internal
     */
    public bindBuffersDirectly(): void {
        throw "Not implemented on WebGPU";
    }

    /**
     * @internal
     */
    public updateAndBindInstancesBuffer(): void {
        throw "Not implemented on WebGPU";
    }

    /**
     * Bind a list of vertex buffers with the engine
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
        this._currentIndexBuffer = indexBuffer;
        this._currentOverrideVertexBuffers = overrideVertexBuffers ?? null;
        this._cacheRenderPipeline.setBuffers(vertexBuffers, indexBuffer, this._currentOverrideVertexBuffers);
    }

    /**
     * @internal
     */
    public _releaseBuffer(buffer: DataBuffer): boolean {
        return this._bufferManager.releaseBuffer(buffer);
    }

    //------------------------------------------------------------------------------
    //                              Effects
    //------------------------------------------------------------------------------

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
        uniformsNamesOrEngine: string[] | Engine,
        samplers?: string[],
        defines?: string,
        fallbacks?: EffectFallbacks,
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
            fullDefines += "\n" + globalDefines;
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

    private _compileRawShaderToSpirV(source: string, type: string): Uint32Array {
        return this._glslang.compileGLSL(source, type);
    }

    private _compileShaderToSpirV(source: string, type: string, defines: Nullable<string>, shaderVersion: string): Uint32Array {
        return this._compileRawShaderToSpirV(shaderVersion + (defines ? defines + "\n" : "") + source, type);
    }

    private _getWGSLShader(source: string, type: string, defines: Nullable<string>): string {
        if (defines) {
            defines = "//" + defines.split("\n").join("\n//") + "\n";
        } else {
            defines = "";
        }
        return defines + source;
    }

    private _createPipelineStageDescriptor(
        vertexShader: Uint32Array | string,
        fragmentShader: Uint32Array | string,
        shaderLanguage: ShaderLanguage
    ): IWebGPURenderPipelineStageDescriptor {
        if (this._tintWASM && shaderLanguage === ShaderLanguage.GLSL) {
            vertexShader = this._tintWASM.convertSpirV2WGSL(vertexShader as Uint32Array) as any;
            fragmentShader = this._tintWASM.convertSpirV2WGSL(fragmentShader as Uint32Array) as any;
        }

        return {
            vertexStage: {
                module: this._device.createShaderModule({
                    code: vertexShader,
                }),
                entryPoint: "main",
            },
            fragmentStage: {
                module: this._device.createShaderModule({
                    code: fragmentShader,
                }),
                entryPoint: "main",
            },
        };
    }

    private _compileRawPipelineStageDescriptor(vertexCode: string, fragmentCode: string, shaderLanguage: ShaderLanguage): IWebGPURenderPipelineStageDescriptor {
        const vertexShader = shaderLanguage === ShaderLanguage.GLSL ? this._compileRawShaderToSpirV(vertexCode, "vertex") : vertexCode;
        const fragmentShader = shaderLanguage === ShaderLanguage.GLSL ? this._compileRawShaderToSpirV(fragmentCode, "fragment") : fragmentCode;

        return this._createPipelineStageDescriptor(vertexShader, fragmentShader, shaderLanguage);
    }

    private _compilePipelineStageDescriptor(
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        shaderLanguage: ShaderLanguage
    ): IWebGPURenderPipelineStageDescriptor {
        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const shaderVersion = "#version 450\n";
        const vertexShader =
            shaderLanguage === ShaderLanguage.GLSL ? this._compileShaderToSpirV(vertexCode, "vertex", defines, shaderVersion) : this._getWGSLShader(vertexCode, "vertex", defines);
        const fragmentShader =
            shaderLanguage === ShaderLanguage.GLSL
                ? this._compileShaderToSpirV(fragmentCode, "fragment", defines, shaderVersion)
                : this._getWGSLShader(fragmentCode, "fragment", defines);

        const program = this._createPipelineStageDescriptor(vertexShader, fragmentShader, shaderLanguage);

        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    /**
     * @internal
     */
    public createRawShaderProgram(): WebGLProgram {
        throw "Not available on WebGPU";
    }

    /**
     * @internal
     */
    public createShaderProgram(): WebGLProgram {
        throw "Not available on WebGPU";
    }

    /**
     * Inline functions in shader code that are marked to be inlined
     * @param code code to inline
     * @returns inlined code
     */
    public inlineShaderCode(code: string): string {
        const sci = new ShaderCodeInliner(code);
        sci.debug = false;
        sci.processCode();
        return sci.code;
    }

    /**
     * Creates a new pipeline context
     * @param shaderProcessingContext defines the shader processing context used during the processing if available
     * @returns the new pipeline
     */
    public createPipelineContext(shaderProcessingContext: Nullable<ShaderProcessingContext>): IPipelineContext {
        return new WebGPUPipelineContext(shaderProcessingContext! as WebGPUShaderProcessingContext, this);
    }

    /**
     * Creates a new material context
     * @returns the new context
     */
    public createMaterialContext(): WebGPUMaterialContext | undefined {
        return new WebGPUMaterialContext();
    }

    /**
     * Creates a new draw context
     * @returns the new context
     */
    public createDrawContext(): WebGPUDrawContext | undefined {
        return new WebGPUDrawContext(this._bufferManager);
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
        defines: Nullable<string>
    ) {
        const webGpuContext = pipelineContext as WebGPUPipelineContext;
        const shaderLanguage = webGpuContext.shaderProcessingContext.shaderLanguage;

        if (this.dbgShowShaderCode) {
            console.log(defines);
            console.log(vertexSourceCode);
            console.log(fragmentSourceCode);
        }

        webGpuContext.sources = {
            fragment: fragmentSourceCode,
            vertex: vertexSourceCode,
            rawVertex: rawVertexSourceCode,
            rawFragment: rawFragmentSourceCode,
        };

        if (createAsRaw) {
            webGpuContext.stages = this._compileRawPipelineStageDescriptor(vertexSourceCode, fragmentSourceCode, shaderLanguage);
        } else {
            webGpuContext.stages = this._compilePipelineStageDescriptor(vertexSourceCode, fragmentSourceCode, defines, shaderLanguage);
        }
    }

    /**
     * Gets the list of active attributes for a given WebGPU program
     * @param pipelineContext defines the pipeline context to use
     * @param attributesNames defines the list of attribute names to get
     * @returns an array of indices indicating the offset of each attribute
     */
    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const results = new Array(attributesNames.length);
        const gpuPipelineContext = pipelineContext as WebGPUPipelineContext;

        for (let i = 0; i < attributesNames.length; i++) {
            const attributeName = attributesNames[i];
            const attributeLocation = gpuPipelineContext.shaderProcessingContext.availableAttributes[attributeName];
            if (attributeLocation === undefined) {
                continue;
            }

            results[i] = attributeLocation;
        }

        return results;
    }

    /**
     * Activates an effect, making it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    public enableEffect(effect: Nullable<Effect | DrawWrapper>): void {
        if (!effect) {
            return;
        }

        let isNewEffect = true;

        if (!DrawWrapper.IsWrapper(effect)) {
            isNewEffect = effect !== this._currentEffect;
            this._currentEffect = effect;
            this._currentMaterialContext = this._defaultMaterialContext;
            this._currentDrawContext = this._defaultDrawContext;
            this._counters.numEnableEffects++;
            if (this.dbgLogIfNotDrawWrapper) {
                Logger.Warn(
                    `enableEffect has been called with an Effect and not a Wrapper! effect.uniqueId=${effect.uniqueId}, effect.name=${effect.name}, effect.name.vertex=${effect.name.vertex}, effect.name.fragment=${effect.name.fragment}`,
                    10
                );
            }
        } else if (
            !effect.effect ||
            (effect.effect === this._currentEffect &&
                effect.materialContext === this._currentMaterialContext &&
                effect.drawContext === this._currentDrawContext &&
                !this._forceEnableEffect)
        ) {
            if (!effect.effect && this.dbgShowEmptyEnableEffectCalls) {
                console.error("drawWrapper=", effect);
                throw "Invalid call to enableEffect: the effect property is empty!";
            }
            return;
        } else {
            isNewEffect = effect.effect !== this._currentEffect;
            this._currentEffect = effect.effect;
            this._currentMaterialContext = effect.materialContext as WebGPUMaterialContext;
            this._currentDrawContext = effect.drawContext as WebGPUDrawContext;
            this._counters.numEnableDrawWrapper++;
            if (!this._currentMaterialContext) {
                console.error("drawWrapper=", effect);
                throw `Invalid call to enableEffect: the materialContext property is empty!`;
            }
        }

        this._stencilStateComposer.stencilMaterial = undefined;

        this._forceEnableEffect = isNewEffect || this._forceEnableEffect ? false : this._forceEnableEffect;

        if (isNewEffect) {
            if (this._currentEffect!.onBind) {
                this._currentEffect!.onBind(this._currentEffect!);
            }
            if (this._currentEffect!._onBindObservable) {
                this._currentEffect!._onBindObservable.notifyObservers(this._currentEffect!);
            }
        }
    }

    /**
     * @internal
     */
    public _releaseEffect(effect: Effect): void {
        if (this._compiledEffects[effect._key]) {
            delete this._compiledEffects[effect._key];

            this._deletePipelineContext(effect.getPipelineContext() as WebGPUPipelineContext);
        }
    }

    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseEffects() {
        for (const name in this._compiledEffects) {
            const webGPUPipelineContext = this._compiledEffects[name].getPipelineContext() as WebGPUPipelineContext;
            this._deletePipelineContext(webGPUPipelineContext);
        }

        this._compiledEffects = {};
    }

    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        const webgpuPipelineContext = pipelineContext as WebGPUPipelineContext;
        if (webgpuPipelineContext) {
            pipelineContext.dispose();
        }
    }

    //------------------------------------------------------------------------------
    //                              Textures
    //------------------------------------------------------------------------------

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    public get needPOTTextures(): boolean {
        return false;
    }

    /** @internal */
    public _createHardwareTexture(): HardwareTextureWrapper {
        return new WebGPUHardwareTexture();
    }

    /**
     * @internal
     */
    public _releaseTexture(texture: InternalTexture): void {
        const index = this._internalTexturesCache.indexOf(texture);
        if (index !== -1) {
            this._internalTexturesCache.splice(index, 1);
        }

        this._textureHelper.releaseTexture(texture);
    }

    /**
     * @internal
     */
    public _getRGBABufferInternalSizedFormat(): number {
        return Constants.TEXTUREFORMAT_RGBA;
    }

    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        texture._comparisonFunction = comparisonFunction;
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
        const fullOptions: InternalTextureCreationOptions = {};

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            fullOptions.format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
            fullOptions.samples = options.samples ?? 1;
            fullOptions.creationFlags = options.creationFlags ?? 0;
            fullOptions.useSRGBBuffer = options.useSRGBBuffer ?? false;
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
            fullOptions.format = Constants.TEXTUREFORMAT_RGBA;
            fullOptions.samples = 1;
            fullOptions.creationFlags = 0;
            fullOptions.useSRGBBuffer = false;
        }

        if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (fullOptions.type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }

        const texture = new InternalTexture(this, source);

        const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
        const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
        const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.depth = layers;
        texture.isReady = true;
        texture.samples = fullOptions.samples;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        texture.format = fullOptions.format;
        texture.is2DArray = layers > 0;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._useSRGBBuffer = fullOptions.useSRGBBuffer;

        this._internalTexturesCache.push(texture);

        if (!delayGPUTextureCreation) {
            this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, layers || 1, fullOptions.creationFlags);
        }

        return texture;
    }

    /**
     * Usually called from Texture.ts.
     * Passed information to create a hardware texture
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
            (
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
                ) => boolean
            ) => {
                const imageBitmap = img as ImageBitmap | { width: number; height: number }; // we will never get an HTMLImageElement in WebGPU

                texture.baseWidth = imageBitmap.width;
                texture.baseHeight = imageBitmap.height;
                texture.width = imageBitmap.width;
                texture.height = imageBitmap.height;
                texture.format = format ?? -1;

                processFunction(texture.width, texture.height, imageBitmap, extension, texture, () => {});

                if (!texture._hardwareTexture?.underlyingResource) {
                    // the texture could have been created before reaching this point so don't recreate it if already existing
                    const gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, imageBitmap.width, imageBitmap.height, undefined, creationFlags);

                    if (WebGPUTextureHelper.IsImageBitmap(imageBitmap)) {
                        this._textureHelper.updateTexture(
                            imageBitmap,
                            texture,
                            imageBitmap.width,
                            imageBitmap.height,
                            texture.depth,
                            gpuTextureWrapper.format,
                            0,
                            0,
                            invertY,
                            false,
                            0,
                            0
                        );
                        if (!noMipmap && !isCompressed) {
                            this._generateMipmaps(texture, this._uploadEncoder);
                        }
                    }
                } else if (!noMipmap && !isCompressed) {
                    this._generateMipmaps(texture, this._uploadEncoder);
                }

                if (scene) {
                    scene.removePendingData(texture);
                }

                texture.isReady = true;

                texture.onLoadedObservable.notifyObservers(texture);
                texture.onLoadedObservable.clear();
            },
            () => false,
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
     * Wraps an external web gpu texture in a Babylon texture.
     * @param texture defines the external texture
     * @returns the babylon internal texture
     */
    wrapWebGPUTexture(texture: GPUTexture): InternalTexture {
        const hardwareTexture = new WebGPUHardwareTexture(texture);
        const internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.isReady = true;
        return internalTexture;
    }

    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @returns the babylon internal texture
     */
    wrapWebGLTexture(): InternalTexture {
        throw new Error("wrapWebGLTexture is not supported, use wrapWebGPUTexture instead.");
    }

    public generateMipMapsForCubemap(texture: InternalTexture) {
        if (texture.generateMipMaps) {
            const gpuTexture = texture._hardwareTexture?.underlyingResource;

            if (!gpuTexture) {
                this._textureHelper.createGPUTextureForInternalTexture(texture);
            }

            this._generateMipmaps(
                texture,
                texture.source === InternalTextureSource.RenderTarget || texture.source === InternalTextureSource.MultiRenderTarget ? this._renderTargetEncoder : undefined
            );
        }
    }

    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     * @param generateMipMaps defines whether to generate mipmaps for the texture
     */
    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture, generateMipMaps: boolean = false): void {
        if (generateMipMaps) {
            texture.generateMipMaps = true;
            this._generateMipmaps(texture);
        }

        texture.samplingMode = samplingMode;
    }

    /**
     * Update the sampling mode of a given texture
     * @param texture defines the texture to update
     * @param wrapU defines the texture wrap mode of the u coordinates
     * @param wrapV defines the texture wrap mode of the v coordinates
     * @param wrapR defines the texture wrap mode of the r coordinates
     */
    public updateTextureWrappingMode(texture: InternalTexture, wrapU: Nullable<number>, wrapV: Nullable<number> = null, wrapR: Nullable<number> = null): void {
        if (wrapU !== null) {
            texture._cachedWrapU = wrapU;
        }
        if (wrapV !== null) {
            texture._cachedWrapV = wrapV;
        }
        if ((texture.is2DArray || texture.is3D) && wrapR !== null) {
            texture._cachedWrapR = wrapR;
        }
    }

    /**
     * Update the dimensions of a texture
     * @param texture texture to update
     * @param width new width of the texture
     * @param height new height of the texture
     * @param depth new depth of the texture
     */
    public updateTextureDimensions(texture: InternalTexture, width: number, height: number, depth: number = 1): void {
        if (!texture._hardwareTexture) {
            // the gpu texture is not created yet, so when it is it will be created with the right dimensions
            return;
        }

        if (texture.width === width && texture.height === height && texture.depth === depth) {
            return;
        }

        const additionalUsages = (texture._hardwareTexture as WebGPUHardwareTexture).textureAdditionalUsages;

        texture._hardwareTexture.release(); // don't defer the releasing! Else we will release at the end of this frame the gpu texture we are about to create in the next line...

        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, depth, additionalUsages);
    }

    /**
     * @internal
     */
    public _setInternalTexture(name: string, texture: Nullable<InternalTexture | ExternalTexture>, baseName?: string): void {
        baseName = baseName ?? name;
        if (this._currentEffect) {
            const webgpuPipelineContext = this._currentEffect._pipelineContext as WebGPUPipelineContext;
            const availableTexture = webgpuPipelineContext.shaderProcessingContext.availableTextures[baseName];

            this._currentMaterialContext.setTexture(name, texture);

            if (availableTexture && availableTexture.autoBindSampler) {
                const samplerName = baseName + WebGPUShaderProcessor.AutoSamplerSuffix;
                this._currentMaterialContext.setSampler(samplerName, texture as InternalTexture); // we can safely cast to InternalTexture because ExternalTexture always has autoBindSampler = false
            }
        }
    }

    /**
     * Sets a texture to the according uniform.
     * @param channel The texture channel
     * @param unused unused parameter
     * @param texture The texture to apply
     * @param name The name of the uniform in the effect
     */
    public setTexture(channel: number, unused: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>, name: string): void {
        this._setTexture(channel, texture, false, false, name, name);
    }

    /**
     * Sets an array of texture to the WebGPU context
     * @param channel defines the channel where the texture array must be set
     * @param unused unused parameter
     * @param textures defines the array of textures to bind
     * @param name name of the channel
     */
    public setTextureArray(channel: number, unused: Nullable<WebGLUniformLocation>, textures: BaseTexture[], name: string): void {
        for (let index = 0; index < textures.length; index++) {
            this._setTexture(-1, textures[index], true, false, name + index.toString(), name);
        }
    }

    protected _setTexture(
        channel: number,
        texture: Nullable<BaseTexture>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isPartOfTextureArray = false,
        depthStencilTexture = false,
        name = "",
        baseName?: string
    ): boolean {
        // name == baseName for a texture that is not part of a texture array
        // Else, name is something like 'myTexture0' / 'myTexture1' / ... and baseName is 'myTexture'
        // baseName is used to look up the texture in the shaderProcessingContext.availableTextures map
        // name is used to look up the texture in the _currentMaterialContext.textures map
        baseName = baseName ?? name;
        if (this._currentEffect) {
            if (!texture) {
                this._currentMaterialContext.setTexture(name, null);
                return false;
            }

            // Video
            if ((<VideoTexture>texture).video) {
                (<VideoTexture>texture).update();
            } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) {
                // Delay loading
                texture.delayLoad();
                return false;
            }

            let internalTexture: Nullable<InternalTexture> = null;
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

                internalTexture._cachedWrapU = texture.wrapU;
                internalTexture._cachedWrapV = texture.wrapV;
                if (internalTexture.is3D) {
                    internalTexture._cachedWrapR = texture.wrapR;
                }

                this._setAnisotropicLevel(0, internalTexture, texture.anisotropicFilteringLevel);
            }

            this._setInternalTexture(name, internalTexture, baseName);
        } else {
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) {
                    (this as any)._count = 0;
                }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - _setTexture called with a null _currentEffect! texture=", texture);
                }
            }
        }

        return true;
    }

    /**
     * @internal
     */
    public _setAnisotropicLevel(target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
        if (internalTexture._cachedAnisotropicFilteringLevel !== anisotropicFilteringLevel) {
            internalTexture._cachedAnisotropicFilteringLevel = Math.min(anisotropicFilteringLevel, this._caps.maxAnisotropy);
        }
    }

    /**
     * @internal
     */
    public _bindTexture(channel: number, texture: InternalTexture, name: string): void {
        if (channel === undefined) {
            return;
        }

        this._setInternalTexture(name, texture);
    }

    /**
     * Generates the mipmaps for a texture
     * @param texture texture to generate the mipmaps for
     */
    public generateMipmaps(texture: InternalTexture): void {
        this._generateMipmaps(texture, this._renderTargetEncoder);
    }

    /**
     * @internal
     */
    public _generateMipmaps(texture: InternalTexture, commandEncoder?: GPUCommandEncoder) {
        const gpuHardwareTexture = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        if (!gpuHardwareTexture) {
            return;
        }

        // try as much as possible to use the command encoder corresponding to the current pass.
        // If not possible (because the pass is started - generateMipmaps itself creates a pass and it's not allowed to have a pass inside a pass), use _uploadEncoder
        commandEncoder =
            commandEncoder ??
            (this._currentRenderTarget && !this._currentRenderPass ? this._renderTargetEncoder : !this._currentRenderPass ? this._renderEncoder : this._uploadEncoder);

        const format = (texture._hardwareTexture as WebGPUHardwareTexture).format;
        const mipmapCount = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - generate mipmaps called - width=", texture.width, "height=", texture.height, "isCube=", texture.isCube);
            }
        }

        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuHardwareTexture, format, mipmapCount, commandEncoder);
        } else {
            this._textureHelper.generateMipmaps(gpuHardwareTexture, format, mipmapCount, 0, commandEncoder);
        }
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
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, texture, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, xOffset, yOffset);

        if (generateMipMaps) {
            this._generateMipmaps(texture, this._renderTargetEncoder);
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
        imageData: ArrayBufferView,
        faceIndex: number = 0,
        lod: number = 0
    ) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            texture.format = internalFormat;
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, texture, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, false, false, 0, 0);
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
        const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
        const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);

        const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
        const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, texture, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0);
    }

    /**
     * @internal
     */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);
    }

    /**
     * @internal
     */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        const bitmap = image as ImageBitmap; // in WebGPU we will always get an ImageBitmap, not an HTMLImageElement

        const width = Math.ceil(texture.width / (1 << lod));
        const height = Math.ceil(texture.height / (1 << lod));

        this._textureHelper.updateTexture(bitmap, texture, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public readPixels(x: number, y: number, width: number, height: number, hasAlpha = true, flushRenderer = true): Promise<ArrayBufferView> {
        const renderPassWrapper = this._rttRenderPassWrapper.renderPass ? this._rttRenderPassWrapper : this._mainRenderPassWrapper;
        const hardwareTexture = renderPassWrapper.colorAttachmentGPUTextures[0];
        if (!hardwareTexture) {
            // we are calling readPixels for a render pass with no color texture bound
            return Promise.resolve(new Uint8Array(0));
        }
        const gpuTexture = hardwareTexture.underlyingResource;
        const gpuTextureFormat = hardwareTexture.format;
        if (!gpuTexture) {
            // we are calling readPixels before startMainRenderPass has been called and no RTT is bound, so swapChainTexture is not setup yet!
            return Promise.resolve(new Uint8Array(0));
        }
        if (flushRenderer) {
            this.flushFramebuffer();
        }
        return this._textureHelper.readPixels(gpuTexture, x, y, width, height, gpuTextureFormat);
    }

    //------------------------------------------------------------------------------
    //                              Frame management
    //------------------------------------------------------------------------------

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        super.beginFrame();
    }

    /**
     * End the current frame
     */
    public endFrame() {
        this._snapshotRendering.endFrame(this._mainRenderPassWrapper.renderPass);

        this._endMainRenderPass();

        this._timestampQuery.endFrame(this._renderEncoder);

        this.flushFramebuffer(false);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - counters");
            }
        }

        this._textureHelper.destroyDeferredTextures();
        this._bufferManager.destroyDeferredBuffers();

        if (this._features._collectUbosUpdatedInFrame) {
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) {
                    (this as any)._count = 0;
                }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    const list: Array<string> = [];
                    for (const name in UniformBuffer._UpdatedUbosInFrame) {
                        list.push(name + ":" + UniformBuffer._UpdatedUbosInFrame[name]);
                    }
                    console.log("frame #" + (this as any)._count + " - updated ubos -", list.join(", "));
                }
            }
            UniformBuffer._UpdatedUbosInFrame = {};
        }

        this.countersLastFrame.numEnableEffects = this._counters.numEnableEffects;
        this.countersLastFrame.numEnableDrawWrapper = this._counters.numEnableDrawWrapper;
        this.countersLastFrame.numBundleCreationNonCompatMode = this._counters.numBundleCreationNonCompatMode;
        this.countersLastFrame.numBundleReuseNonCompatMode = this._counters.numBundleReuseNonCompatMode;
        this._counters.numEnableEffects = 0;
        this._counters.numEnableDrawWrapper = 0;
        this._counters.numBundleCreationNonCompatMode = 0;
        this._counters.numBundleReuseNonCompatMode = 0;

        this._cacheRenderPipeline.endFrame();
        this._cacheBindGroups.endFrame();

        this._pendingDebugCommands.length = 0;

        super.endFrame();

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if ((this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("%c frame #" + (this as any)._count + " - end", "background: #ffff00");
            }
            if ((this as any)._count < this.dbgVerboseLogsNumFrames) {
                (this as any)._count++;
                if ((this as any)._count !== this.dbgVerboseLogsNumFrames) {
                    console.log("%c frame #" + (this as any)._count + " - begin", "background: #ffff00");
                }
            }
        }
    }

    /**
     * Force a WebGPU flush (ie. a flush of all waiting commands)
     * @param reopenPass true to reopen at the end of the function the pass that was active when entering the function
     */
    public flushFramebuffer(reopenPass = true): void {
        // we need to end the current render pass (main or rtt) if any as we are not allowed to submit the command buffers when being in a pass
        const currentRenderPassIsNULL = !this._currentRenderPass;
        let currentPasses = 0; // 0 if no pass, 1 for rtt, 2 for main pass
        if (this._currentRenderPass && this._currentRenderTarget) {
            currentPasses |= 1;
            this._endRenderTargetRenderPass();
        }
        if (this._mainRenderPassWrapper.renderPass) {
            currentPasses |= 2;
            this._endMainRenderPass();
        }

        this._commandBuffers[0] = this._uploadEncoder.finish();
        this._commandBuffers[1] = this._renderTargetEncoder.finish();
        this._commandBuffers[2] = this._renderEncoder.finish();

        this._device.queue.submit(this._commandBuffers);

        this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
        this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);
        this._renderTargetEncoder = this._device.createCommandEncoder(this._renderTargetEncoderDescriptor);

        this._timestampQuery.startFrame(this._uploadEncoder);

        this._textureHelper.setCommandEncoder(this._uploadEncoder);

        this._bundleList.reset();
        this._bundleListRenderTarget.reset();

        // restart the render pass
        if (reopenPass) {
            if (currentPasses & 2) {
                this._startMainRenderPass(false);
            }
            if (currentPasses & 1) {
                this._startRenderTargetRenderPass(this._currentRenderTarget!, false, null, false, false);
            }
            if (currentRenderPassIsNULL && this._currentRenderTarget) {
                this._currentRenderPass = null;
            }
        }
    }

    /** @internal */
    public _currentFrameBufferIsDefaultFrameBuffer() {
        return this._currentRenderTarget === null;
    }

    //------------------------------------------------------------------------------
    //                              Render Pass
    //------------------------------------------------------------------------------

    private _startRenderTargetRenderPass(
        renderTargetWrapper: RenderTargetWrapper,
        setClearStates: boolean,
        clearColor: Nullable<IColor4Like>,
        clearDepth: boolean,
        clearStencil: boolean
    ) {
        const rtWrapper = renderTargetWrapper as WebGPURenderTargetWrapper;

        const depthStencilTexture = rtWrapper._depthStencilTexture;
        const gpuDepthStencilWrapper = depthStencilTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
        const gpuDepthStencilTexture = gpuDepthStencilWrapper?.underlyingResource as Nullable<GPUTexture>;
        const gpuDepthStencilMSAATexture = gpuDepthStencilWrapper?.msaaTexture;

        const depthTextureView = gpuDepthStencilTexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
        const depthMSAATextureView = gpuDepthStencilMSAATexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
        const depthTextureHasStencil = gpuDepthStencilWrapper ? WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format) : false;

        const colorAttachments: (GPURenderPassColorAttachment | null)[] = [];

        if (this.useReverseDepthBuffer) {
            this.setDepthFunctionToGreaterOrEqual();
        }

        const mustClearColor = setClearStates && clearColor;
        const mustClearDepth = setClearStates && clearDepth;
        const mustClearStencil = setClearStates && clearStencil;

        if (rtWrapper._attachments && rtWrapper.isMulti) {
            // multi render targets
            if (!this._mrtAttachments || this._mrtAttachments.length === 0) {
                this._mrtAttachments = rtWrapper._defaultAttachments;
            }
            for (let i = 0; i < this._mrtAttachments.length; ++i) {
                const index = this._mrtAttachments[i]; // if index == 0 it means the texture should not be written to => at render pass creation time, it means we should not clear it
                const mrtTexture = rtWrapper.textures![i];
                const gpuMRTWrapper = mrtTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
                const gpuMRTTexture = gpuMRTWrapper?.underlyingResource;
                if (gpuMRTWrapper && gpuMRTTexture) {
                    const viewDescriptor = {
                        ...this._rttRenderPassWrapper.colorAttachmentViewDescriptor!,
                        format: gpuMRTWrapper.format,
                    };
                    const gpuMSAATexture = gpuMRTWrapper.msaaTexture;
                    const colorTextureView = gpuMRTTexture.createView(viewDescriptor);
                    const colorMSAATextureView = gpuMSAATexture?.createView(viewDescriptor);

                    colorAttachments.push({
                        view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                        resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                        clearValue: index !== 0 && mustClearColor ? clearColor : undefined,
                        loadOp: index !== 0 && mustClearColor ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load,
                        storeOp: WebGPUConstants.StoreOp.Store,
                    });
                }
            }
            this._cacheRenderPipeline.setMRT(rtWrapper.textures!, this._mrtAttachments.length);
            this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
        } else {
            // single render target
            const internalTexture = rtWrapper.texture;
            if (internalTexture) {
                const gpuWrapper = internalTexture._hardwareTexture as WebGPUHardwareTexture;
                const gpuTexture = gpuWrapper.underlyingResource!;

                const gpuMSAATexture = gpuWrapper.msaaTexture;
                const colorTextureView = gpuTexture.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
                const colorMSAATextureView = gpuMSAATexture?.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);

                colorAttachments.push({
                    view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                    resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                    clearValue: mustClearColor ? clearColor : undefined,
                    loadOp: mustClearColor ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load,
                    storeOp: WebGPUConstants.StoreOp.Store,
                });
            } else {
                colorAttachments.push(null);
            }
        }

        this._debugPushGroup?.("render target pass", 1);

        this._rttRenderPassWrapper.renderPassDescriptor = {
            colorAttachments,
            depthStencilAttachment:
                depthStencilTexture && gpuDepthStencilTexture
                    ? {
                          view: depthMSAATextureView ? depthMSAATextureView : depthTextureView!,
                          depthClearValue: mustClearDepth ? (this.useReverseDepthBuffer ? this._clearReverseDepthValue : this._clearDepthValue) : undefined,
                          depthLoadOp: mustClearDepth ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load,
                          depthStoreOp: WebGPUConstants.StoreOp.Store,
                          stencilClearValue: rtWrapper._depthStencilTextureWithStencil && mustClearStencil ? this._clearStencilValue : undefined,
                          stencilLoadOp: !depthTextureHasStencil
                              ? undefined
                              : rtWrapper._depthStencilTextureWithStencil && mustClearStencil
                              ? WebGPUConstants.LoadOp.Clear
                              : WebGPUConstants.LoadOp.Load,
                          stencilStoreOp: !depthTextureHasStencil ? undefined : WebGPUConstants.StoreOp.Store,
                      }
                    : undefined,
            occlusionQuerySet: this._occlusionQuery?.hasQueries ? this._occlusionQuery.querySet : undefined,
        };
        this._rttRenderPassWrapper.renderPass = this._renderTargetEncoder.beginRenderPass(this._rttRenderPassWrapper.renderPassDescriptor);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                const internalTexture = rtWrapper.texture!;
                console.log(
                    "frame #" + (this as any)._count + " - render target begin pass - internalTexture.uniqueId=",
                    internalTexture.uniqueId,
                    "width=",
                    internalTexture.width,
                    "height=",
                    internalTexture.height,
                    this._rttRenderPassWrapper.renderPassDescriptor
                );
            }
        }

        this._currentRenderPass = this._rttRenderPassWrapper.renderPass;

        this._debugFlushPendingCommands?.();

        this._resetCurrentViewport(1);
        this._resetCurrentScissor(1);
        this._resetCurrentStencilRef(1);
        this._resetCurrentColorBlend(1);

        if (!gpuDepthStencilWrapper || !WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format)) {
            this._stencilStateComposer.enabled = false;
        }
    }

    /** @internal */
    public _endRenderTargetRenderPass() {
        if (this._currentRenderPass) {
            const gpuWrapper = this._currentRenderTarget!.texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
            if (gpuWrapper && !this._snapshotRendering.endRenderTargetPass(this._currentRenderPass, gpuWrapper) && !this.compatibilityMode) {
                this._bundleListRenderTarget.run(this._currentRenderPass);
                this._bundleListRenderTarget.reset();
            }
            this._currentRenderPass.end();
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) {
                    (this as any)._count = 0;
                }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - render target end pass - internalTexture.uniqueId=", this._currentRenderTarget?.texture?.uniqueId);
                }
            }
            this._debugPopGroup?.(1);
            this._resetCurrentViewport(1);
            this._resetCurrentScissor(1);
            this._resetCurrentStencilRef(1);
            this._resetCurrentColorBlend(1);
            this._currentRenderPass = null;
            this._rttRenderPassWrapper.reset();
        }
    }

    private _getCurrentRenderPass(): GPURenderPassEncoder {
        if (this._currentRenderTarget && !this._currentRenderPass) {
            // delayed creation of the render target pass, but we now need to create it as we are requested the render pass
            this._startRenderTargetRenderPass(this._currentRenderTarget, false, null, false, false);
        } else if (!this._currentRenderPass) {
            this._startMainRenderPass(false);
        }

        return this._currentRenderPass!;
    }

    /** @internal */
    public _getCurrentRenderPassIndex(): number {
        return this._currentRenderPass === null ? -1 : this._currentRenderPass === this._mainRenderPassWrapper.renderPass ? 0 : 1;
    }

    private _startMainRenderPass(setClearStates: boolean, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
        if (this._mainRenderPassWrapper.renderPass) {
            this._endMainRenderPass();
        }

        if (this.useReverseDepthBuffer) {
            this.setDepthFunctionToGreaterOrEqual();
        }

        const mustClearColor = setClearStates && clearColor;
        const mustClearDepth = setClearStates && clearDepth;
        const mustClearStencil = setClearStates && clearStencil;

        this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.clearValue = mustClearColor ? clearColor : undefined;
        this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.loadOp = mustClearColor ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.depthClearValue = mustClearDepth
            ? this.useReverseDepthBuffer
                ? this._clearReverseDepthValue
                : this._clearDepthValue
            : undefined;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.depthLoadOp = mustClearDepth ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.stencilClearValue = mustClearStencil ? this._clearStencilValue : undefined;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.stencilLoadOp = !this.isStencilEnable
            ? undefined
            : mustClearStencil
            ? WebGPUConstants.LoadOp.Clear
            : WebGPUConstants.LoadOp.Load;
        this._mainRenderPassWrapper.renderPassDescriptor!.occlusionQuerySet = this._occlusionQuery?.hasQueries ? this._occlusionQuery.querySet : undefined;

        this._swapChainTexture = this._context.getCurrentTexture();
        this._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.set(this._swapChainTexture);

        // Resolve in case of MSAA
        if (this._options.antialiasing) {
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.resolveTarget = this._swapChainTexture.createView();
        } else {
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.view = this._swapChainTexture.createView();
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log(
                    "frame #" + (this as any)._count + " - main begin pass - texture width=" + (this._mainTextureExtends as any).width,
                    " height=" + (this._mainTextureExtends as any).height,
                    this._mainRenderPassWrapper.renderPassDescriptor
                );
            }
        }

        this._debugPushGroup?.("main pass", 0);

        this._currentRenderPass = this._renderEncoder.beginRenderPass(this._mainRenderPassWrapper.renderPassDescriptor!);

        this._mainRenderPassWrapper.renderPass = this._currentRenderPass;

        this._debugFlushPendingCommands?.();

        this._resetCurrentViewport(0);
        this._resetCurrentScissor(0);
        this._resetCurrentStencilRef(0);
        this._resetCurrentColorBlend(0);

        if (!this._isStencilEnable) {
            this._stencilStateComposer.enabled = false;
        }
    }

    private _endMainRenderPass(): void {
        if (this._mainRenderPassWrapper.renderPass !== null) {
            this._snapshotRendering.endMainRenderPass();
            if (!this.compatibilityMode && !this._snapshotRendering.play) {
                this._bundleList.run(this._mainRenderPassWrapper.renderPass);
                this._bundleList.reset();
            }
            this._mainRenderPassWrapper.renderPass.end();
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) {
                    (this as any)._count = 0;
                }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - main end pass");
                }
            }
            this._debugPopGroup?.(0);
            this._resetCurrentViewport(0);
            this._resetCurrentScissor(0);
            this._resetCurrentStencilRef(0);
            this._resetCurrentColorBlend(0);
            if (this._mainRenderPassWrapper.renderPass === this._currentRenderPass) {
                this._currentRenderPass = null;
            }
            this._mainRenderPassWrapper.reset(false);
        }
    }

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
    public bindFramebuffer(
        texture: RenderTargetWrapper,
        faceIndex: number = 0,
        requiredWidth?: number,
        requiredHeight?: number,
        forceFullscreenViewport?: boolean,
        lodLevel = 0,
        layer = 0
    ): void {
        const hardwareTexture = texture.texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = texture;
        if (hardwareTexture) {
            hardwareTexture._currentLayer = texture.isCube ? layer * 6 + faceIndex : layer;
        }

        this._rttRenderPassWrapper.colorAttachmentGPUTextures[0] = hardwareTexture;
        this._rttRenderPassWrapper.depthTextureFormat = this._currentRenderTarget._depthStencilTexture
            ? WebGPUTextureHelper.GetWebGPUTextureFormat(-1, this._currentRenderTarget._depthStencilTexture.format)
            : undefined;

        this._setDepthTextureFormat(this._rttRenderPassWrapper);
        this._setColorFormat(this._rttRenderPassWrapper);

        this._rttRenderPassWrapper.colorAttachmentViewDescriptor = {
            format: this._colorFormat as GPUTextureFormat,
            dimension: WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: texture.isCube ? layer * 6 + faceIndex : layer,
            baseMipLevel: lodLevel,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All,
        };

        this._rttRenderPassWrapper.depthAttachmentViewDescriptor = {
            format: this._depthTextureFormat!,
            dimension: WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: texture.isCube ? layer * 6 + faceIndex : layer,
            baseMipLevel: 0,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All,
        };

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log(
                    "frame #" + (this as any)._count + " - bindFramebuffer called - internalTexture.uniqueId=",
                    texture.texture?.uniqueId,
                    "face=",
                    faceIndex,
                    "lodLevel=",
                    lodLevel,
                    "layer=",
                    layer,
                    this._rttRenderPassWrapper.colorAttachmentViewDescriptor,
                    this._rttRenderPassWrapper.depthAttachmentViewDescriptor
                );
            }
        }

        this._currentRenderPass = null; // lazy creation of the render pass, hoping the render pass will be created by a call to clear()...

        if (this.snapshotRendering && this.snapshotRenderingMode === Constants.SNAPSHOTRENDERING_FAST) {
            // force the creation of the render pass as we know in fast snapshot rendering mode clear() won't be called
            this._getCurrentRenderPass();
        }

        if (this._cachedViewport && !forceFullscreenViewport) {
            this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
        } else {
            if (!requiredWidth) {
                requiredWidth = texture.width;
                if (lodLevel) {
                    requiredWidth = requiredWidth / Math.pow(2, lodLevel);
                }
            }
            if (!requiredHeight) {
                requiredHeight = texture.height;
                if (lodLevel) {
                    requiredHeight = requiredHeight / Math.pow(2, lodLevel);
                }
            }

            this._viewport(0, 0, requiredWidth, requiredHeight);
        }

        this.wipeCaches();
    }

    /**
     * Unbind the current render target texture from the WebGPU context
     * @param texture defines the render target wrapper to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public unBindFramebuffer(texture: RenderTargetWrapper, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        const saveCRT = this._currentRenderTarget;

        this._currentRenderTarget = null; // to be iso with thinEngine, this._currentRenderTarget must be null when onBeforeUnbind is called

        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        this._currentRenderTarget = saveCRT;

        if (this._currentRenderPass && this._currentRenderPass !== this._mainRenderPassWrapper.renderPass) {
            this._endRenderTargetRenderPass();
        }

        if (texture.texture?.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._generateMipmaps(texture.texture);
        }

        this._currentRenderTarget = null;

        this._onAfterUnbindFrameBufferObservable.notifyObservers(this);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - unBindFramebuffer called - internalTexture.uniqueId=", texture.texture?.uniqueId);
            }
        }

        this._mrtAttachments = [];
        this._cacheRenderPipeline.setMRT([]);
        this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
        this._currentRenderPass = this._mainRenderPassWrapper.renderPass;
        this._setDepthTextureFormat(this._mainRenderPassWrapper);
        this._setColorFormat(this._mainRenderPassWrapper);
    }

    /**
     * Unbind the current render target and bind the default framebuffer
     */
    public restoreDefaultFramebuffer(): void {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        } else {
            this._currentRenderPass = this._mainRenderPassWrapper.renderPass;
            this._setDepthTextureFormat(this._mainRenderPassWrapper);
            this._setColorFormat(this._mainRenderPassWrapper);
        }
        if (this._currentRenderPass) {
            if (this._cachedViewport) {
                this.setViewport(this._cachedViewport);
            }
        }

        this.wipeCaches();
    }

    //------------------------------------------------------------------------------
    //                              Render
    //------------------------------------------------------------------------------

    /**
     * @internal
     */
    public _setColorFormat(wrapper: WebGPURenderPassWrapper): void {
        const format = wrapper.colorAttachmentGPUTextures[0]?.format ?? null;
        this._cacheRenderPipeline.setColorFormat(format);
        if (this._colorFormat === format) {
            return;
        }
        this._colorFormat = format;
    }

    /**
     * @internal
     */
    public _setDepthTextureFormat(wrapper: WebGPURenderPassWrapper): void {
        this._cacheRenderPipeline.setDepthStencilFormat(wrapper.depthTextureFormat);
        if (this._depthTextureFormat === wrapper.depthTextureFormat) {
            return;
        }
        this._depthTextureFormat = wrapper.depthTextureFormat;
    }

    public setDitheringState(): void {
        // Does not exist in WebGPU
    }

    public setRasterizerState(): void {
        // Does not exist in WebGPU
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
        // Culling
        if (this._depthCullingState.cull !== culling || force) {
            this._depthCullingState.cull = culling;
        }

        // Cull face
        const cullFace = this.cullBackFaces ?? cullBackFaces ?? true ? 1 : 2;
        if (this._depthCullingState.cullFace !== cullFace || force) {
            this._depthCullingState.cullFace = cullFace;
        }

        // Z offset
        this.setZOffset(zOffset);
        this.setZOffsetUnits(zOffsetUnits);

        // Front face
        const frontFace = reverseSide ? (this._currentRenderTarget ? 1 : 2) : this._currentRenderTarget ? 2 : 1;
        if (this._depthCullingState.frontFace !== frontFace || force) {
            this._depthCullingState.frontFace = frontFace;
        }

        this._stencilStateComposer.stencilMaterial = stencil;
    }

    private _applyRenderPassChanges(renderPass: GPURenderPassEncoder, bundleList: Nullable<WebGPUBundleList>): void {
        const mustUpdateViewport = this._mustUpdateViewport(renderPass);
        const mustUpdateScissor = this._mustUpdateScissor(renderPass);
        const mustUpdateStencilRef = !this._stencilStateComposer.enabled ? false : this._mustUpdateStencilRef(renderPass);
        const mustUpdateBlendColor = !this._alphaState.alphaBlend ? false : this._mustUpdateBlendColor(renderPass);

        if (bundleList) {
            if (mustUpdateViewport) {
                bundleList.addItem(new WebGPURenderItemViewport(this._viewportCached.x, this._viewportCached.y, this._viewportCached.z, this._viewportCached.w));
            }
            if (mustUpdateScissor) {
                bundleList.addItem(new WebGPURenderItemScissor(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w));
            }
            if (mustUpdateStencilRef) {
                bundleList.addItem(new WebGPURenderItemStencilRef(this._stencilStateComposer.funcRef ?? 0));
            }
            if (mustUpdateBlendColor) {
                bundleList.addItem(new WebGPURenderItemBlendColor(this._alphaState._blendConstants.slice()));
            }
        } else {
            if (mustUpdateViewport) {
                this._applyViewport(renderPass as GPURenderPassEncoder);
            }
            if (mustUpdateScissor) {
                this._applyScissor(renderPass as GPURenderPassEncoder);
            }
            if (mustUpdateStencilRef) {
                this._applyStencilRef(renderPass as GPURenderPassEncoder);
            }
            if (mustUpdateBlendColor) {
                this._applyBlendColor(renderPass as GPURenderPassEncoder);
            }
        }
    }

    private _draw(drawType: number, fillMode: number, start: number, count: number, instancesCount: number): void {
        const renderPass = this._getCurrentRenderPass();
        const renderPassIndex = this._getCurrentRenderPassIndex();
        const bundleList = renderPassIndex === 0 ? this._bundleList : this._bundleListRenderTarget;

        this.applyStates();

        const webgpuPipelineContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;

        this.bindUniformBufferBase(this._currentRenderTarget ? this._ubInvertY : this._ubDontInvertY, 0, WebGPUShaderProcessor.InternalsUBOName);

        if (webgpuPipelineContext.uniformBuffer) {
            webgpuPipelineContext.uniformBuffer.update();
            this.bindUniformBufferBase(webgpuPipelineContext.uniformBuffer.getBuffer()!, 0, WebGPUShaderProcessor.LeftOvertUBOName);
        }

        if (this._snapshotRendering.play) {
            this._reportDrawCall();
            return;
        }

        if (
            !this.compatibilityMode &&
            (this._currentDrawContext.isDirty(this._currentMaterialContext.updateId) || this._currentMaterialContext.isDirty || this._currentMaterialContext.forceBindGroupCreation)
        ) {
            this._currentDrawContext.fastBundle = undefined;
        }

        const useFastPath = !this.compatibilityMode && this._currentDrawContext.fastBundle;
        let renderPass2: GPURenderPassEncoder | GPURenderBundleEncoder = renderPass;

        if (useFastPath || this._snapshotRendering.record) {
            this._applyRenderPassChanges(renderPass, bundleList);
            if (!this._snapshotRendering.record) {
                this._counters.numBundleReuseNonCompatMode++;
                if (this._currentDrawContext.indirectDrawBuffer) {
                    this._currentDrawContext.setIndirectData(count, instancesCount || 1, start);
                }
                bundleList.addBundle(this._currentDrawContext.fastBundle);
                this._reportDrawCall();
                return;
            }

            renderPass2 = bundleList.getBundleEncoder(this._cacheRenderPipeline.colorFormats, this._depthTextureFormat, this.currentSampleCount); // for snapshot recording mode
            bundleList.numDrawCalls++;
        }

        let textureState = 0;
        if (!this._caps.textureFloatLinearFiltering && this._currentMaterialContext.hasFloatTextures) {
            let bitVal = 1;
            for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.textureNames.length; ++i) {
                const textureName = webgpuPipelineContext.shaderProcessingContext.textureNames[i];
                const texture = this._currentMaterialContext.textures[textureName]?.texture;
                if (texture?.type === Constants.TEXTURETYPE_FLOAT) {
                    textureState |= bitVal;
                }
                bitVal = bitVal << 1;
            }
        }

        const pipeline = this._cacheRenderPipeline.getRenderPipeline(fillMode, this._currentEffect!, this.currentSampleCount, textureState);
        const bindGroups = this._cacheBindGroups.getBindGroups(webgpuPipelineContext, this._currentDrawContext, this._currentMaterialContext);

        if (!this._snapshotRendering.record) {
            this._applyRenderPassChanges(renderPass, !this.compatibilityMode ? bundleList : null);
            if (!this.compatibilityMode) {
                this._counters.numBundleCreationNonCompatMode++;
                renderPass2 = this._device.createRenderBundleEncoder({
                    colorFormats: this._cacheRenderPipeline.colorFormats,
                    depthStencilFormat: this._depthTextureFormat,
                    sampleCount: this.currentSampleCount,
                });
            }
        }

        // bind pipeline
        renderPass2.setPipeline(pipeline);

        // bind index/vertex buffers
        if (this._currentIndexBuffer) {
            renderPass2.setIndexBuffer(
                this._currentIndexBuffer.underlyingResource,
                this._currentIndexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16,
                0
            );
        }

        const vertexBuffers = this._cacheRenderPipeline.vertexBuffers;
        for (let index = 0; index < vertexBuffers.length; index++) {
            const vertexBuffer = vertexBuffers[index];

            const buffer = vertexBuffer.getBuffer();
            if (buffer) {
                renderPass2.setVertexBuffer(index, buffer.underlyingResource, vertexBuffer._validOffsetRange ? 0 : vertexBuffer.byteOffset);
            }
        }

        // bind bind groups
        for (let i = 0; i < bindGroups.length; i++) {
            renderPass2.setBindGroup(i, bindGroups[i]);
        }

        // draw
        const nonCompatMode = !this.compatibilityMode && !this._snapshotRendering.record;

        if (nonCompatMode && this._currentDrawContext.indirectDrawBuffer) {
            this._currentDrawContext.setIndirectData(count, instancesCount || 1, start);
            if (drawType === 0) {
                renderPass2.drawIndexedIndirect(this._currentDrawContext.indirectDrawBuffer, 0);
            } else {
                renderPass2.drawIndirect(this._currentDrawContext.indirectDrawBuffer, 0);
            }
        } else if (drawType === 0) {
            renderPass2.drawIndexed(count, instancesCount || 1, start, 0, 0);
        } else {
            renderPass2.draw(count, instancesCount || 1, start, 0);
        }

        if (nonCompatMode) {
            this._currentDrawContext.fastBundle = (renderPass2 as GPURenderBundleEncoder).finish();
            bundleList.addBundle(this._currentDrawContext.fastBundle);
        }

        this._reportDrawCall();
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount: number = 1): void {
        this._draw(0, fillMode, indexStart, indexCount, instancesCount);
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount: number = 1): void {
        this._currentIndexBuffer = null;
        this._draw(1, fillMode, verticesStart, verticesCount, instancesCount);
    }

    //------------------------------------------------------------------------------
    //                              Dispose
    //------------------------------------------------------------------------------

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        this._mainTexture?.destroy();
        this._mainTextureLastCopy?.destroy();
        this._depthTexture?.destroy();
        super.dispose();
    }

    //------------------------------------------------------------------------------
    //                              Misc
    //------------------------------------------------------------------------------

    /**
     * Gets the current render width
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render width
     */
    public getRenderWidth(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }

        return this._canvas.width;
    }

    /**
     * Gets the current render height
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render height
     */
    public getRenderHeight(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }

        return this._canvas.height;
    }

    /**
     * Gets the HTML canvas attached with the current WebGPU context
     * @returns a HTML canvas
     */
    public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._canvas;
    }

    //------------------------------------------------------------------------------
    //                              Errors
    //------------------------------------------------------------------------------

    /**
     * Get the current error code of the WebGPU context
     * @returns the error code
     */
    public getError(): number {
        // TODO WEBGPU. from the webgpu errors.
        return 0;
    }

    //------------------------------------------------------------------------------
    //                              Unused WebGPU
    //------------------------------------------------------------------------------

    /**
     * @internal
     */
    public bindSamplers(): void {}

    /**
     * @internal
     */
    public _bindTextureDirectly(): boolean {
        return false;
    }

    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns always true - No parallel shader compilation
     */
    public areAllEffectsReady(): boolean {
        return true;
    }

    /**
     * @internal
     */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        // No parallel shader compilation.
        // No Async, so direct launch
        action();
    }

    /**
     * @internal
     */
    public _isRenderingStateCompiled(): boolean {
        // No parallel shader compilation.
        return true;
    }

    /** @internal */
    public _getUnpackAlignement(): number {
        return 1;
    }

    /**
     * @internal
     */
    public _unpackFlipY() {}

    /**
     * @internal
     */
    public _bindUnboundFramebuffer() {
        throw "_bindUnboundFramebuffer is not implementedin WebGPU! You probably want to use restoreDefaultFramebuffer or unBindFramebuffer instead";
    }

    // TODO WEBGPU. All of the below should go once engine split with baseEngine.

    /**
     * @internal
     */
    public _getSamplingParameters(): { min: number; mag: number } {
        throw "_getSamplingParameters is not available in WebGPU";
    }

    /**
     * @internal
     */
    public getUniforms(): Nullable<WebGLUniformLocation>[] {
        return [];
    }

    /**
     * @internal
     */
    public setIntArray(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setIntArray2(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setIntArray3(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setIntArray4(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setArray(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setArray2(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setArray3(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setArray4(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setMatrices(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setMatrix3x3(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setMatrix2x2(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setFloat(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setFloat2(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setFloat3(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public setFloat4(): boolean {
        return false;
    }
}
