import { Logger } from "../Misc/logger";
import { DomManagement } from '../Misc/domManagement';
import { Nullable, DataArray, IndicesArray, FloatArray, Immutable } from "../types";
import { Color4 } from "../Maths/math";
import { Engine } from "../Engines/engine";
import { InstancingAttributeInfo } from "../Engines/instancingAttributeInfo";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { IEffectCreationOptions, Effect } from "../Materials/effect";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { _TimeToken } from "../Instrumentation/timeToken";
import { Constants } from "./constants";
import * as WebGPUConstants from './WebGPU/webgpuConstants';
import { VertexBuffer } from "../Buffers/buffer";
import { WebGPUPipelineContext, IWebGPURenderPipelineStageDescriptor } from './WebGPU/webgpuPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { DataBuffer } from '../Buffers/dataBuffer';
import { WebGPUDataBuffer } from '../Meshes/WebGPU/webgpuDataBuffer';
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { IShaderProcessor } from "./Processors/iShaderProcessor";
import { WebGPUShaderProcessor } from "./WebGPU/webgpuShaderProcessors";
import { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from "./WebGPU/webgpuShaderProcessingContext";
import { Tools } from "../Misc/tools";
import { WebGPUTextureHelper } from './WebGPU/webgpuTextureHelper';
import { ISceneLike } from './thinEngine';
import { Scene } from '../scene';
import { WebGPUBufferManager } from './WebGPU/webgpuBufferManager';
import { DepthTextureCreationOptions } from './depthTextureCreationOptions';
import { HardwareTextureWrapper } from '../Materials/Textures/hardwareTextureWrapper';
import { WebGPUHardwareTexture } from './WebGPU/webgpuHardwareTexture';
import { IColor4Like } from '../Maths/math.like';
import { IWebRequest } from '../Misc/interfaces/iWebRequest';
import { UniformBuffer } from '../Materials/uniformBuffer';
import { WebGPURenderPassWrapper } from './WebGPU/webgpuRenderPassWrapper';
import { IMultiRenderTargetOptions } from '../Materials/Textures/multiRenderTarget';
import { WebGPUCacheSampler } from "./WebGPU/webgpuCacheSampler";
import { WebGPUCacheRenderPipeline } from "./WebGPU/webgpuCacheRenderPipeline";
import { WebGPUCacheRenderPipelineTree } from "./WebGPU/webgpuCacheRenderPipelineTree";
import { WebGPUStencilStateComposer } from "./WebGPU/webgpuStencilStateComposer";
import { WebGPUDepthCullingState } from "./WebGPU/webgpuDepthCullingState";
import { DrawWrapper } from "../Materials/drawWrapper";
import { WebGPUMaterialContext } from "./WebGPU/webgpuMaterialContext";
import { WebGPUDrawContext } from "./WebGPU/webgpuDrawContext";
import { WebGPUCacheBindGroups } from "./WebGPU/webgpuCacheBindGroups";
import { WebGPUClearQuad } from "./WebGPU/webgpuClearQuad";
import { IStencilState } from "../States/IStencilState";
import { WebGPURenderItemBlendColor, WebGPURenderItemScissor, WebGPURenderItemStencilRef, WebGPURenderItemViewport, WebGPUBundleList } from "./WebGPU/webgpuBundleList";
import { WebGPUTimestampQuery } from "./WebGPU/webgpuTimestampQuery";
import { ComputeEffect, IComputeEffectCreationOptions } from "../Compute/computeEffect";
import { IComputePipelineContext } from "../Compute/IComputePipelineContext";
import { WebGPUComputePipelineContext } from "./WebGPU/webgpuComputePipelineContext";
import { ComputeBindingList } from "./Extensions/engine.computeShader";
import { IComputeContext } from "../Compute/IComputeContext";
import { WebGPUComputeContext } from "./WebGPU/webgpuComputeContext";

import "../Shaders/clearQuad.vertex";
import "../Shaders/clearQuad.fragment";

declare type VideoTexture = import("../Materials/Textures/videoTexture").VideoTexture;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type PerfCounter = import("../Misc/perfCounter").PerfCounter;

// TODO WEBGPU remove when not needed anymore
function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg);
    }
}

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
}

/**
 * The web GPU engine class provides support for WebGPU version of babylon.js.
 */
export class WebGPUEngine extends Engine {
    // Default glslang options.
    private static readonly _glslangDefaultOptions: GlslangOptions = {
        jsPath: "https://preview.babylonjs.com/glslang/glslang.js",
        wasmPath: "https://preview.babylonjs.com/glslang/glslang.wasm"
    };

    // Page Life cycle and constants
    private readonly _uploadEncoderDescriptor = { label: "upload" };
    private readonly _renderEncoderDescriptor = { label: "render" };
    private readonly _renderTargetEncoderDescriptor = { label: "renderTarget" };
    /** @hidden */
    public readonly _clearDepthValue = 1;
    /** @hidden */
    public readonly _clearReverseDepthValue = 0;
    /** @hidden */
    public readonly _clearStencilValue = 0;
    private readonly _defaultSampleCount = 4; // Only supported value for now.

    // Engine Life Cycle
    private _canvas: HTMLCanvasElement;
    private _options: WebGPUEngineOptions;
    private _glslang: any = null;
    private _adapter: GPUAdapter;
    private _adapterSupportedExtensions: GPUFeatureName[];
    private _device: GPUDevice;
    private _deviceEnabledExtensions: GPUFeatureName[];
    private _context: GPUCanvasContext;
    private _swapChain: GPUSwapChain;
    private _swapChainTexture: GPUTexture;
    private _mainPassSampleCount: number;
    private _textureHelper: WebGPUTextureHelper;
    private _bufferManager: WebGPUBufferManager;
    private _clearQuad: WebGPUClearQuad;
    private _cacheSampler: WebGPUCacheSampler;
    private _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    private _cacheBindGroups: WebGPUCacheBindGroups;
    private _emptyVertexBuffer: VertexBuffer;
    private _mrtAttachments: number[];
    private _timestampQuery: WebGPUTimestampQuery;
    private _compiledComputeEffects: { [key: string]: ComputeEffect } = {};
    /** @hidden */
    public _counters: {
        numEnableEffects: number;
        numEnableDrawWrapper: number;
    } = {
        numEnableEffects: 0,
        numEnableDrawWrapper: 0,
    };
    /**
     * Counters from last frame
     */
    public readonly countersLastFrame: {
        numEnableEffects: number;
        numEnableDrawWrapper: number;
    } = {
        numEnableEffects: 0,
        numEnableDrawWrapper: 0,
    };

    // Some of the internal state might change during the render pass.
    // This happens mainly during clear for the state
    // And when the frame starts to swap the target texture from the swap chain
    private _mainTexture: GPUTexture;
    private _depthTexture: GPUTexture;
    private _mainTextureExtends: GPUExtent3D;
    private _depthTextureFormat: GPUTextureFormat | undefined;
    private _colorFormat: GPUTextureFormat;

    // Frame Life Cycle (recreated each frame)
    private _uploadEncoder: GPUCommandEncoder;
    private _renderEncoder: GPUCommandEncoder;
    private _renderTargetEncoder: GPUCommandEncoder;

    private _commandBuffers: GPUCommandBuffer[] = [null as any, null as any, null as any];

    // Frame Buffer Life Cycle (recreated for each render target pass)
    private _currentRenderPass: Nullable<GPURenderPassEncoder> = null;
    private _mainRenderPassWrapper: WebGPURenderPassWrapper = new WebGPURenderPassWrapper();
    private _rttRenderPassWrapper: WebGPURenderPassWrapper = new WebGPURenderPassWrapper();
    private _pendingDebugCommands: Array<[string, Nullable<string>]> = [];
    private _bundleList: WebGPUBundleList;

    // DrawCall Life Cycle
    // Effect is on the parent class
    // protected _currentEffect: Nullable<Effect> = null;
    private _defaultMaterialContext: WebGPUMaterialContext;
    private _currentMaterialContext: WebGPUMaterialContext;
    private _currentDrawContext: WebGPUDrawContext | undefined;
    private _currentOverrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }> = null;
    private _currentIndexBuffer: Nullable<DataBuffer> = null;
    private __colorWrite = true;
    private _uniformsBuffers: { [name: string]: WebGPUDataBuffer } = {};
    private _forceEnableEffect = false;

    // TODO WEBGPU remove those variables when code stabilized
    /** @hidden */
    public dbgShowShaderCode = false;
    /** @hidden */
    public dbgSanityChecks = true;
    /** @hidden */
    public dbgVerboseLogsForFirstFrames = false;
    /** @hidden */
    public dbgVerboseLogsNumFrames = 10;
    /** @hidden */
    public dbgLogIfNotDrawWrapper = true;
    /** @hidden */
    public dbgShowEmptyEnableEffectCalls = true;

    private _snapshotRenderingRecordBundles = false;
    private _snapshotRenderingPlayBundles = false;
    private _snapshotRenderingMainPassBundleList: WebGPUBundleList[] = [];
    private _snapshotRenderingModeSaved: number;

    /**
     * Gets or sets the snapshot rendering mode
     */
     public get snapshotRenderingMode(): number {
        return this._snapshotRenderingMode;
    }

    public set snapshotRenderingMode(mode: number) {
        if (this._snapshotRenderingRecordBundles) {
            this._snapshotRenderingModeSaved = mode;
        } else {
            this._snapshotRenderingMode = mode;
        }
    }

    /**
     * Enables or disables the snapshot rendering mode
     * Note that the WebGL engine does not support snapshot rendering so setting the value won't have any effect for this engine
     */
     public get snapshotRendering(): boolean {
        return this._snapshotRenderingEnabled;
    }

    public set snapshotRendering(activate) {
        this._snapshotRenderingMainPassBundleList.length = 0;
        this._snapshotRenderingRecordBundles = this._snapshotRenderingEnabled = activate;
        this._snapshotRenderingPlayBundles = false;
        if (activate) {
            this._snapshotRenderingModeSaved = this._snapshotRenderingMode;
            this._snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD; // need to reset to standard for the recording pass to avoid some code being bypassed
        }
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
     * Gets a boolean indicating if the engine can be instantiated (ie. if a WebGPU context can be found)
     * @returns true if the engine can be created
     */
    public static get IsSupported(): boolean {
        return !!navigator.gpu;
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
     * Returns the name of the engine
     */
    public get name(): string {
        return "WebGPU";
    }

    /**
     * Returns a string describing the current engine
     */
    public get description(): string {
        let description = this.name + this.version;

        return description;
    }

    /**
     * Returns the version of the engine
     */
    public get version(): number {
        return 1;
    }

    /**
     * True to be in compatibility mode, meaning rendering in the same way than OpenGL.
     * Setting the property to false will improve performances, but can lead to rendering artifacts.
     * See @TODO WEBGPU DOC PAGE
     * @hidden
     */
    public compatibilityMode = true;

    /** @hidden */
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
            engine.initAsync(options.glslangOptions).then(() => resolve(engine));
        });
    }

    /**
     * Create a new instance of the gpu engine.
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     */
    public constructor(canvas: HTMLCanvasElement, options: WebGPUEngineOptions = {}) {
        super(null);

        options.deviceDescriptor = options.deviceDescriptor || { };
        options.swapChainFormat = options.swapChainFormat || WebGPUConstants.TextureFormat.BGRA8Unorm;
        options.antialiasing = options.antialiasing === undefined ? true : options.antialiasing;
        options.stencil = options.stencil ?? true;
        options.enableGPUDebugMarkers = options.enableGPUDebugMarkers ?? false;

        Logger.Log(`Babylon.js v${Engine.Version} - ${this.description} engine`);
        if (!navigator.gpu) {
            Logger.Error("WebGPU is not supported by your browser.");
            return;
        }

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

        this._doNotHandleContextLost = false;

        this._canvas = canvas;
        this._options = options;
        this.premultipliedAlpha = options.premultipliedAlpha ?? true;

        const devicePixelRatio = DomManagement.IsWindowObjectExist() ? (window.devicePixelRatio || 1.0) : 1.0;
        const limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;
        const adaptToDeviceRatio = options.adaptToDeviceRatio ?? false;

        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0;
        this._mainPassSampleCount = options.antialiasing ? this._defaultSampleCount : 1;
        this._isStencilEnable = options.stencil;

        this._sharedInit(canvas, !!options.doNotHandleTouchAction, options.audioEngine);

        this._shaderProcessor = this._getShaderProcessor();

        // TODO. WEBGPU. Use real way to do it.
        this._canvas.style.transform = "scaleY(-1)";
    }

    //------------------------------------------------------------------------------
    //                              Initialization
    //------------------------------------------------------------------------------

    /**
     * Initializes the WebGPU context and dependencies.
     * @param glslangOptions Defines the GLSLang compiler options if necessary
     * @returns a promise notifying the readiness of the engine.
     */
    public initAsync(glslangOptions?: GlslangOptions): Promise<void> {
        return this._initGlslang(glslangOptions ?? this._options?.glslangOptions)
            .then((glslang: any) => {
                this._glslang = glslang;
                return navigator.gpu!.requestAdapter(this._options);
            })
            .then((adapter: GPUAdapter | null) => {
                this._adapter = adapter!;
                this._adapterSupportedExtensions = [];
                this._adapter.features.forEach((feature) => this._adapterSupportedExtensions.push(feature));

                const deviceDescriptor = this._options.deviceDescriptor;

                if (deviceDescriptor?.nonGuaranteedFeatures) {
                    const requestedExtensions = deviceDescriptor.nonGuaranteedFeatures;
                    const validExtensions: GPUFeatureName[] = [];

                    for (let extension of requestedExtensions) {
                        if (this._adapterSupportedExtensions.indexOf(extension) !== -1) {
                            validExtensions.push(extension);
                        }
                    }

                    deviceDescriptor.nonGuaranteedFeatures = validExtensions;
                }

                return this._adapter.requestDevice(this._options.deviceDescriptor);
            })
            .then((device: GPUDevice | null) => {
                this._device = device!;
                this._deviceEnabledExtensions = [];
                this._device.features.forEach((feature) => this._deviceEnabledExtensions.push(feature));
            })
            .then(() => {
                this._bufferManager = new WebGPUBufferManager(this._device);
                this._textureHelper = new WebGPUTextureHelper(this._device, this._glslang, this._bufferManager);
                this._cacheSampler = new WebGPUCacheSampler(this._device);
                this._cacheBindGroups = new WebGPUCacheBindGroups(this._device, this._cacheSampler, this);
                this._timestampQuery = new WebGPUTimestampQuery(this._device, this._bufferManager);
                this._bundleList = new WebGPUBundleList(this._device);

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

                this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, this._emptyVertexBuffer);

                this._depthCullingState = new WebGPUDepthCullingState(this._cacheRenderPipeline);
                this._stencilStateComposer = new WebGPUStencilStateComposer(this._cacheRenderPipeline);
                this._stencilStateComposer.stencilGlobal = this._stencilState;

                this._depthCullingState.depthTest = true;
                this._depthCullingState.depthFunc = Constants.LEQUAL;
                this._depthCullingState.depthMask = true;

                this._textureHelper.setCommandEncoder(this._uploadEncoder);

                this._initializeLimits();

                this._clearQuad = new WebGPUClearQuad(this._device, this, this._emptyVertexBuffer);
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
        glslangOptions = glslangOptions || { };
        glslangOptions = {
            ...WebGPUEngine._glslangDefaultOptions,
            ...glslangOptions
        };

        if (glslangOptions.glslang) {
            return Promise.resolve(glslangOptions.glslang);
        }

        if ((window as any).glslang) {
            return (window as any).glslang(glslangOptions!.wasmPath);
        }

        if (glslangOptions.jsPath && glslangOptions.wasmPath) {
            return Tools.LoadScriptAsync(glslangOptions.jsPath)
                .then(() => {
                    return (window as any).glslang(glslangOptions!.wasmPath);
                });
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
            maxTextureSize: 2048,
            maxCubemapTextureSize: 2048,
            maxRenderTextureSize: 2048,
            maxVertexAttribs: 16,
            maxVaryingVectors: 16,
            maxFragmentUniformVectors: 1024,
            maxVertexUniformVectors: 1024,
            standardDerivatives: true,
            astc: null,
            s3tc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined) as any,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined,
            maxAnisotropy: 16, // TODO WEBGPU: Retrieve this smartly
            uintIndices: true,
            fragmentDepthSupported: true,
            highPrecisionShaderSupported: true,
            colorBufferFloat: true,
            textureFloat: true,
            textureFloatLinearFiltering: true,
            textureFloatRender: true,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: true,
            textureHalfFloatRender: true,
            textureLOD: true,
            drawBuffersExtension: true,
            depthTextureExtension: true,
            vertexArrayObject: false,
            instancedArrays: true,
            timerQuery: typeof(BigUint64Array) !== "undefined" && this.enabledExtensions.indexOf(WebGPUConstants.FeatureName.TimestampQuery) !== -1 ? true as any : undefined,
            canUseTimestampForTimerQuery: true,
            multiview: false,
            oculusMultiview: false,
            parallelShaderCompile: undefined,
            blendMinMax: true,
            maxMSAASamples: 4,
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: true,
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
            support3DTextures: false, // TODO WEBGPU change to true when Chrome supports 3D textures
            needTypeSuffixInShaderConstants: true,
            supportMSAA: true,
            supportSSAO2: true,
            supportExtendedTextureFormats: true,
            supportSwitchCaseInShader: true,
            supportSyncTextureRead: false,
            needsInvertingBitmap: false,
            useUBOBindingCache: false,
            _collectUbosUpdatedInFrame: false,
        };
    }

    private _initializeContextAndSwapChain(): void {
        this._context = this._canvas.getContext('gpupresent') as unknown as GPUCanvasContext;
        this._swapChain = this._context.configureSwapChain({
            device: this._device,
            format: this._options.swapChainFormat!,
            usage: WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopySrc,
            compositingAlphaMode: this.premultipliedAlpha ? WebGPUConstants.CanvasCompositingAlphaMode.Premultiplied : WebGPUConstants.CanvasCompositingAlphaMode.Opaque
        });
        this._colorFormat = this._options.swapChainFormat!;
        this._mainRenderPassWrapper.colorAttachmentGPUTextures = [new WebGPUHardwareTexture()];
        this._mainRenderPassWrapper.colorAttachmentGPUTextures[0].format = this._colorFormat;
    }

    // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
    private _initializeMainAttachments(): void {
        this._mainTextureExtends = {
            width: this.getRenderWidth(),
            height: this.getRenderHeight(),
            depthOrArrayLayers: 1
        };

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

            if (this._mainTexture) {
                this._mainTexture.destroy();
            }
            this._mainTexture = this._device.createTexture(mainTextureDescriptor);
            mainColorAttachments = [{
                view: this._mainTexture.createView(),
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.StoreOp.Store
            }];
        }
        else {
            mainColorAttachments = [{
                view: undefined as any,
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.StoreOp.Store
            }];
        }

        this._mainRenderPassWrapper.depthTextureFormat = this.isStencilEnable ? WebGPUConstants.TextureFormat.Depth24PlusStencil8 : WebGPUConstants.TextureFormat.Depth32Float;

        this._setDepthTextureFormat(this._mainRenderPassWrapper);

        const depthTextureDescriptor: GPUTextureDescriptor = {
            size: this._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: this._mainPassSampleCount,
            dimension: WebGPUConstants.TextureDimension.E2d,
            format: this._mainRenderPassWrapper.depthTextureFormat,
            usage:  WebGPUConstants.TextureUsage.RenderAttachment
        };

        if (this._depthTexture) {
            this._depthTexture.destroy();
        }
        this._depthTexture = this._device.createTexture(depthTextureDescriptor);
        const mainDepthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this._depthTexture.createView(),

            depthLoadValue: this._clearDepthValue,
            depthStoreOp: WebGPUConstants.StoreOp.Store,
            stencilLoadValue: this._clearStencilValue,
            stencilStoreOp: WebGPUConstants.StoreOp.Store,
        };

        this._mainRenderPassWrapper.renderPassDescriptor = {
            colorAttachments: mainColorAttachments,
            depthStencilAttachment: mainDepthAttachment
        };

        if (this._mainRenderPassWrapper.renderPass !== null) {
            this._endMainRenderPass();
        }
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
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - setSize called -", width, height);
            }
        }

        this._initializeMainAttachments();
        return true;
    }

    /**
     * Gets a shader processor implementation fitting with the current engine type.
     * @returns The shader processor implementation.
     */
    protected _getShaderProcessor(): Nullable<IShaderProcessor> {
        return new WebGPUShaderProcessor();
    }

    /** @hidden */
    public _getShaderProcessingContext(): Nullable<ShaderProcessingContext> {
        return new WebGPUShaderProcessingContext();
    }

    /**
     * Get the performance counter associated with the frame time computation
     * @returns the perf counter
     */
    public getGPUFrameTimeCounter(): PerfCounter {
        return this._timestampQuery.gpuFrameTimeCounter;
    }

    /**
     * Enable or disable the GPU frame time capture
     * @param value True to enable, fale to disable
     */
    public captureGPUFrameTime(value: boolean) {
        this._timestampQuery.enable = value;
    }

    //------------------------------------------------------------------------------
    //                          Static Pipeline WebGPU States
    //------------------------------------------------------------------------------

    /** @hidden */
    public applyStates() {
        this._stencilStateComposer.apply();
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
        this.__colorWrite = enable;
        this._cacheRenderPipeline.setWriteMask(enable ? 0xF : 0);
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return this.__colorWrite;
    }

    //------------------------------------------------------------------------------
    //                              Dynamic WebGPU States
    //------------------------------------------------------------------------------

    // index 0 is for main render pass, 1 for RTT render pass
    private _viewportsCurrent: Array<{ x: number, y: number, w: number, h: number }> = [{ x: 0, y: 0, w: 0, h: 0 }, { x: 0, y: 0, w: 0, h: 0 }];

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
            this._viewportsCurrent[index].x !== x || this._viewportsCurrent[index].y !== y ||
            this._viewportsCurrent[index].w !== w || this._viewportsCurrent[index].h !== h;

        if (update) {
            this._viewportsCurrent[index].x = this._viewportCached.x;
            this._viewportsCurrent[index].y = this._viewportCached.y;
            this._viewportsCurrent[index].w = this._viewportCached.z;
            this._viewportsCurrent[index].h = this._viewportCached.w;
        }

        return update;
    }

    private _applyViewport(renderPass: GPURenderPassEncoder): void {
        renderPass.setViewport(Math.floor(this._viewportCached.x), Math.floor(this._viewportCached.y), Math.floor(this._viewportCached.z), Math.floor(this._viewportCached.w), 0, 1);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - viewport applied - (", this._viewportCached.x, this._viewportCached.y, this._viewportCached.z, this._viewportCached.w, ") current pass is main pass=" + (renderPass === this._mainRenderPassWrapper.renderPass));
            }
        }
    }

    /** @hidden */
    public _viewport(x: number, y: number, width: number, height: number): void {
        this._viewportCached.x = x;
        this._viewportCached.y = y;
        this._viewportCached.z = width;
        this._viewportCached.w = height;
    }

    private _scissorsCurrent: Array<{ x: number, y: number, w: number, h: number }> = [{ x: 0, y: 0, w: 0, h: 0 }, { x: 0, y: 0, w: 0, h: 0 }];
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

        const update =
            this._scissorsCurrent[index].x !== x || this._scissorsCurrent[index].y !== y ||
            this._scissorsCurrent[index].w !== w || this._scissorsCurrent[index].h !== h;

        if (update) {
            this._scissorsCurrent[index].x = this._scissorCached.x;
            this._scissorsCurrent[index].y = this._scissorCached.y;
            this._scissorsCurrent[index].w = this._scissorCached.z;
            this._scissorsCurrent[index].h = this._scissorCached.w;
        }

        return update;
    }

    private _applyScissor(renderPass: GPURenderPassEncoder): void {
        renderPass.setScissorRect(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - scissor applied - (", this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w, ") current pass is main pass=" + (renderPass === this._mainRenderPassWrapper.renderPass));
            }
        }
    }

    private _scissorIsActive() {
        return  this._scissorCached.x !== 0 ||
                this._scissorCached.y !== 0 ||
                this._scissorCached.z !== 0 ||
                this._scissorCached.w !== 0;
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

    /** @hidden */
    public _applyStencilRef(renderPass: GPURenderPassEncoder): void {
        renderPass.setStencilReference(this._stencilStateComposer.funcRef ?? 0);
    }

    private _blendColorsCurrent: Array<Array<Nullable<number>>> = [[null, null, null, null], [null, null, null, null]];

    private _resetCurrentColorBlend(index: number): void {
        this._blendColorsCurrent[index][0] =
        this._blendColorsCurrent[index][1] =
        this._blendColorsCurrent[index][2] =
        this._blendColorsCurrent[index][3] = null;
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
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - clear called - backBuffer=", backBuffer, " depth=", depth, " stencil=", stencil, " scissor is active=", hasScissor);
            }
        }

        // We need to recreate the render pass so that the new parameters for clear color / depth / stencil are taken into account
        if (this._currentRenderTarget) {
            if (hasScissor) {
                if (!this._rttRenderPassWrapper.renderPass) {
                    this._startRenderTargetRenderPass(this._currentRenderTarget!, false, backBuffer ? color : null, depth, stencil);
                }
                if (!this.compatibilityMode) {
                    this._bundleList.addItem(new WebGPURenderItemScissor(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w));
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

        this._clearQuad.setColorFormat(this._colorFormat);
        this._clearQuad.setDepthStencilFormat(this._depthTextureFormat);
        this._clearQuad.setMRTAttachments(this._cacheRenderPipeline.mrtAttachments ?? [], this._cacheRenderPipeline.mrtTextureArray ?? []);

        if (!this.compatibilityMode) {
            this._bundleList.addItem(new WebGPURenderItemStencilRef(this._clearStencilValue));
        } else {
            renderPass!.setStencilReference(this._clearStencilValue);
        }

        const bundle = this._clearQuad.clear(renderPass, clearColor, clearDepth, clearStencil, this.currentSampleCount);

        if (!this.compatibilityMode) {
            this._bundleList.addBundle(bundle!);
            this._bundleList.addItem(new WebGPURenderItemStencilRef(this._stencilStateComposer.funcRef ?? 0));
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
        }
        else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        }
        else {
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
     * Updates a vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param data the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data
     * @param byteLength the byte length of the data
     */
    public updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
        const dataBuffer = vertexBuffer as WebGPUDataBuffer;
        if (byteOffset === undefined) {
            byteOffset = 0;
        }

        let view: ArrayBufferView;
        if (byteLength === undefined) {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
            byteLength = view.byteLength;
        } else {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
        }

        this._bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
    }

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @param updatable defines if the index buffer must be updatable - not used in WebGPU
     * @returns a new buffer
     */
    public createIndexBuffer(indices: IndicesArray, updatable?: boolean): DataBuffer {
        let is32Bits = true;
        let view: ArrayBufferView;

        if (indices instanceof Uint32Array || indices instanceof Int32Array) {
            view = indices;
        }
        else if (indices instanceof Uint16Array) {
            view = indices;
            is32Bits = false;
        }
        else {
            if (indices.length > 65535) {
                view = new Uint32Array(indices);
            }
            else {
                view = new Uint16Array(indices);
                is32Bits = false;
            }
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Index | WebGPUConstants.BufferUsage.CopyDst);
        dataBuffer.is32Bits = is32Bits;
        return dataBuffer;
    }

    /**
     * Update an index buffer
     * @param indexBuffer defines the target index buffer
     * @param indices defines the data to update
     * @param offset defines the offset in the target index buffer where update should start
     */
    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        const gpuBuffer = indexBuffer as WebGPUDataBuffer;

        var view: ArrayBufferView;
        if (indices instanceof Uint16Array) {
            if (indexBuffer.is32Bits) {
                view = Uint32Array.from(indices);
            }
            else {
                view = indices;
            }
        }
        else if (indices instanceof Uint32Array) {
            if (indexBuffer.is32Bits) {
                view = indices;
            }
            else {
                view = Uint16Array.from(indices);
            }
        }
        else {
            if (indexBuffer.is32Bits) {
                view = new Uint32Array(indices);
            }
            else {
                view = new Uint16Array(indices);
            }
        }

        this._bufferManager.setSubData(gpuBuffer, offset, view);
    }

    /**
     * Creates a storage buffer
     * @param data the data for the storage buffer or the size of the buffer
     * @param creationFlags flags to use when creating the buffer (see Constants.BUFFER_CREATIONFLAG_XXX). The BUFFER_CREATIONFLAG_STORAGE will be automatically added
     * @returns the new buffer
     */
     public createStorageBuffer(data: DataArray | number, creationFlags: number): DataBuffer {
        return this._createBuffer(data, creationFlags | Constants.BUFFER_CREATIONFLAG_STORAGE);
    }

    private _createBuffer(data: DataArray | number, creationFlags: number): DataBuffer {
        let view: ArrayBufferView | number;

        if (data instanceof Array) {
            view = new Float32Array(data);
        }
        else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        }
        else {
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
     * Updates a storage buffer.
     * @param buffer the storage buffer to update
     * @param data the data used to update the storage buffer
     * @param byteOffset the byte offset of the data
     * @param byteLength the byte length of the data
     */
    public updateStorageBuffer(buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
        const dataBuffer = buffer as WebGPUDataBuffer;
        if (byteOffset === undefined) {
            byteOffset = 0;
        }

        let view: ArrayBufferView;
        if (byteLength === undefined) {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
            byteLength = view.byteLength;
        } else {
            if (data instanceof Array) {
                view = new Float32Array(data);
            }
            else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            }
            else {
                view = data;
            }
        }

        this._bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
    }

    /**
     * Read data from a storage buffer
     * @param storageBuffer The storage buffer to read from
     * @param offset The offset in the storage buffer to start reading from (default: 0)
     * @param size  The number of bytes to read from the storage buffer (default: capacity of the buffer)
     * @param buffer The buffer to write the data we have read from the storage buffer to (optional)
     * @returns If not undefined, returns the (promise) buffer (as provided by the 4th parameter) filled with the data, else it returns a (promise) Uint8Array with the data read from the storage buffer
     */
    public readFromStorageBuffer(storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView> {
        size = size || storageBuffer.capacity;

        const gpuBuffer = this._bufferManager.createRawBuffer(size, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst);

        this._renderTargetEncoder.copyBufferToBuffer(
            storageBuffer.underlyingResource,
            offset ?? 0,
            gpuBuffer,
            0,
            size
        );

        return new Promise((resolve, reject) => {
            // we are using onEndFrameObservable because we need to map the gpuBuffer AFTER the command buffers
            // have been submitted, else we get the error: "Buffer used in a submit while mapped"
            this.onEndFrameObservable.addOnce(() => {
                gpuBuffer.mapAsync(WebGPUConstants.MapMode.Read, 0, size).then(() => {
                    const copyArrayBuffer = gpuBuffer.getMappedRange(0, size);
                    let data: ArrayBufferView | undefined = buffer;
                    if (data === undefined) {
                        data = new Uint8Array(size!);
                        (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                    } else {
                        const ctor = data.constructor as any; // we want to create result data with the same type as buffer (Uint8Array, Float32Array, ...)
                        data = new ctor(data.buffer);
                        (data as any).set(new ctor(copyArrayBuffer));
                    }
                    gpuBuffer.unmap();
                    this._bufferManager.releaseBuffer(gpuBuffer);
                    resolve(data!);
                }, (reason) => reject(reason));
            });
        });
    }

    /** @hidden */
    public bindBuffersDirectly(vertexBuffer: DataBuffer, indexBuffer: DataBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
        throw "Not implemented on WebGPU so far.";
    }

    /** @hidden */
    public updateAndBindInstancesBuffer(instancesBuffer: DataBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
        throw "Not implemented on WebGPU so far.";
    }

    /**
     * Bind a list of vertex buffers with the engine
     * @param vertexBuffers defines the list of vertex buffers to bind
     * @param indexBuffer defines the index buffer to bind
     * @param effect defines the effect associated with the vertex buffers
     * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
     */
    public bindBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, indexBuffer: Nullable<DataBuffer>, effect: Effect, overrideVertexBuffers?: {[kind: string]: Nullable<VertexBuffer>}): void {
        this._currentIndexBuffer = indexBuffer;
        this._currentOverrideVertexBuffers = overrideVertexBuffers ?? null;
        this._cacheRenderPipeline.setBuffers(vertexBuffers, indexBuffer, this._currentOverrideVertexBuffers);
    }

    /** @hidden */
    public _releaseBuffer(buffer: DataBuffer): boolean {
        return this._bufferManager.releaseBuffer(buffer);
    }

    //------------------------------------------------------------------------------
    //                              UBO
    //------------------------------------------------------------------------------

    /**
     * Create an uniform buffer
     * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @returns the webGL uniform buffer
     */
    public createUniformBuffer(elements: FloatArray): DataBuffer {
        let view: Float32Array;
        if (elements instanceof Array) {
            view = new Float32Array(elements);
        }
        else {
            view = elements;
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);
        return dataBuffer;
    }

    /**
     * Create a dynamic uniform buffer
     * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @returns the webGL uniform buffer
     */
    public createDynamicUniformBuffer(elements: FloatArray): DataBuffer {
        return this.createUniformBuffer(elements);
    }

    /**
     * Update an existing uniform buffer
     * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     * @param uniformBuffer defines the target uniform buffer
     * @param elements defines the content to update
     * @param offset defines the offset in the uniform buffer where update should start
     * @param count defines the size of the data to update
     */
    public updateUniformBuffer(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void {
        if (offset === undefined) {
            offset = 0;
        }

        const dataBuffer = uniformBuffer as WebGPUDataBuffer;
        let view: Float32Array;
        if (count === undefined) {
            if (elements instanceof Float32Array) {
                view = elements;
            } else {
                view = new Float32Array(elements);
            }
            count = view.byteLength;
        } else {
            if (elements instanceof Float32Array) {
                view = elements;
            } else {
                view = new Float32Array(elements);
            }
        }

        this._bufferManager.setSubData(dataBuffer, offset, view, 0, count);
    }

    /**
     * Bind a buffer to the current webGL context at a given location
     * @param buffer defines the buffer to bind
     * @param location defines the index where to bind the buffer
     * @param name Name of the uniform variable to bind
     */
    public bindUniformBufferBase(buffer: DataBuffer, location: number, name: string): void {
        this._uniformsBuffers[name] = buffer as WebGPUDataBuffer;
    }

    //------------------------------------------------------------------------------
    //                             Compute Shaders
    //------------------------------------------------------------------------------

    /**
     * Creates a new compute context
     * @returns the new context
     */
     public createComputeContext(): IComputeContext | undefined {
        return new WebGPUComputeContext(this._device, this._cacheSampler);
    }

    /**
     * Creates a new compute effect
     * @param baseName Name of the effect
     * @param options Options used to create the effect
     * @returns The new compute effect
     */
    public createComputeEffect(baseName: any, options: IComputeEffectCreationOptions): ComputeEffect {
        const compute = baseName.computeElement || baseName.compute || baseName.computeToken || baseName.computeSource || baseName;

        const name = compute + "@" + options.defines;
        if (this._compiledComputeEffects[name]) {
            var compiledEffect = <ComputeEffect>this._compiledComputeEffects[name];
            if (options.onCompiled && compiledEffect.isReady()) {
                options.onCompiled(compiledEffect);
            }

            return compiledEffect;
        }
        const effect = new ComputeEffect(baseName, options, this, name);
        this._compiledComputeEffects[name] = effect;

        return effect;
    }

    /**
     * Creates a new compute pipeline context
     * @returns the new pipeline
     */
    public createComputePipelineContext(): IComputePipelineContext {
        return new WebGPUComputePipelineContext(this);
    }

    /**
     * Gets a boolean indicating if all created compute effects are ready
     * @returns true if all effects are ready
     */
    public areAllComputeEffectsReady(): boolean {
        for (const key in this._compiledComputeEffects) {
            const effect = this._compiledComputeEffects[key];

            if (!effect.isReady()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Dispatches a compute shader
     * @param effect The compute effect
     * @param context The compute context
     * @param bindings The list of resources to bind to the shader
     * @param x The number of workgroups to execute on the X dimension
     * @param y The number of workgroups to execute on the Y dimension
     * @param z The number of workgroups to execute on the Z dimension
     */
    public computeDispatch(effect: ComputeEffect, context: IComputeContext, bindings: ComputeBindingList, x: number, y?: number, z?: number): void {
        const contextPipeline = effect._pipelineContext as WebGPUComputePipelineContext;
        const computeContext = context as WebGPUComputeContext;

        if (!contextPipeline.computePipeline) {
            contextPipeline.computePipeline = this._device.createComputePipeline({
                compute: contextPipeline.stage!
            });
        }

        const commandEncoder = this._renderTargetEncoder;
        const computePass = commandEncoder.beginComputePass();

        computePass.setPipeline(contextPipeline.computePipeline);

        const bindGroups = computeContext.getBindGroups(bindings, contextPipeline.computePipeline);
        for (let i = 0; i < bindGroups.length; ++i) {
            const bindGroup = bindGroups[i];
            if (!bindGroup) {
                continue;
            }
            computePass.setBindGroup(i, bindGroup);
        }

        computePass.dispatch(x, y, z);
        computePass.endPass();
    }

    /**
     * Forces the engine to release all cached compute effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseComputeEffects() {
        for (const name in this._compiledComputeEffects) {
            const webGPUPipelineContextCompute = this._compiledComputeEffects[name].getPipelineContext() as WebGPUComputePipelineContext;
            this._deleteComputePipelineContext(webGPUPipelineContextCompute);
        }

        this._compiledComputeEffects = {};
    }

    /** @hidden */
    public _prepareComputePipelineContext(pipelineContext: IComputePipelineContext, computeSourceCode: string, rawComputeSourceCode: string, defines: Nullable<string>): void {
        const webGpuContext = pipelineContext as WebGPUComputePipelineContext;

        if (this.dbgShowShaderCode) {
            console.log(defines);
            console.log(computeSourceCode);
        }

        webGpuContext.sources = {
            compute: computeSourceCode,
            rawCompute: rawComputeSourceCode,
        };

        webGpuContext.stage = this._createComputePipelineStageDescriptor(computeSourceCode, defines);
    }

    /** @hidden */
    public _releaseComputeEffect(effect: ComputeEffect): void {
        if (this._compiledComputeEffects[effect._key]) {
            delete this._compiledComputeEffects[effect._key];

            this._deleteComputePipelineContext(effect.getPipelineContext() as WebGPUComputePipelineContext);
        }
    }

    /** @hidden */
    public _rebuildComputeEffects(): void {
        for (const key in this._compiledComputeEffects) {
            const effect = this._compiledComputeEffects[key];

            effect._pipelineContext = null;
            effect._wasPreviouslyReady = false;
            effect._prepareEffect();
        }
    }

    /** @hidden */
    public _deleteComputePipelineContext(pipelineContext: IComputePipelineContext): void {
        const webgpuPipelineContext = pipelineContext as WebGPUComputePipelineContext;
        if (webgpuPipelineContext) {
            pipelineContext.dispose();
        }
    }

    private _createComputePipelineStageDescriptor(computeShader: string, defines: Nullable<string>): GPUProgrammableStage {
        if (defines) {
            defines = "//" + defines.split("\n").join("\n//") + "\n";
        } else {
            defines = "";
        }
        return {
            module: this._device.createShaderModule({
                code: defines + computeShader,
            }),
            entryPoint: "main",
        };
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
     * @returns the new Effect
     */
    public createEffect(baseName: any, attributesNamesOrOptions: string[] | IEffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any): Effect {
        const vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName.vertexSource || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName.fragmentSource || baseName;

        const name = vertex + "+" + fragment + "@" + (defines ? defines : (<IEffectCreationOptions>attributesNamesOrOptions).defines);
        if (this._compiledEffects[name]) {
            var compiledEffect = <Effect>this._compiledEffects[name];
            if (onCompiled && compiledEffect.isReady()) {
                onCompiled(compiledEffect);
            }

            return compiledEffect;
        }
        var effect = new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters, name);
        this._compiledEffects[name] = effect;

        return effect;
    }

    private _compileRawShaderToSpirV(source: string, type: string): Uint32Array {
        return this._glslang.compileGLSL(source, type);
    }

    private _compileShaderToSpirV(source: string, type: string, defines: Nullable<string>, shaderVersion: string): Uint32Array {
        return this._compileRawShaderToSpirV(shaderVersion + (defines ? defines + "\n" : "") + source, type);
    }

    private _createPipelineStageDescriptor(vertexShader: Uint32Array, fragmentShader: Uint32Array): IWebGPURenderPipelineStageDescriptor {
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
                entryPoint: "main"
            }
        };
    }

    private _compileRawPipelineStageDescriptor(vertexCode: string, fragmentCode: string): IWebGPURenderPipelineStageDescriptor {
        var vertexShader = this._compileRawShaderToSpirV(vertexCode, "vertex");
        var fragmentShader = this._compileRawShaderToSpirV(fragmentCode, "fragment");

        return this._createPipelineStageDescriptor(vertexShader, fragmentShader);
    }

    private _compilePipelineStageDescriptor(vertexCode: string, fragmentCode: string, defines: Nullable<string>): IWebGPURenderPipelineStageDescriptor {
        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        var shaderVersion = "#version 450\n";
        var vertexShader = this._compileShaderToSpirV(vertexCode, "vertex", defines, shaderVersion);
        var fragmentShader = this._compileShaderToSpirV(fragmentCode, "fragment", defines, shaderVersion);

        let program = this._createPipelineStageDescriptor(vertexShader, fragmentShader);

        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    /** @hidden */
    public createRawShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        throw "Not available on WebGPU";
    }

    /** @hidden */
    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        throw "Not available on WebGPU";
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
        return new WebGPUMaterialContext(this._cacheBindGroups);
    }

    /**
     * Creates a new draw context
     * @returns the new context
     */
    public createDrawContext(): WebGPUDrawContext | undefined {
        return new WebGPUDrawContext();
    }

    /** @hidden */
    public _preparePipelineContext(pipelineContext: IPipelineContext, vertexSourceCode: string, fragmentSourceCode: string, createAsRaw: boolean, rawVertexSourceCode: string, rawFragmentSourceCode: string,
        rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>,
        key: string) {
        const webGpuContext = pipelineContext as WebGPUPipelineContext;

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
            webGpuContext.stages = this._compileRawPipelineStageDescriptor(vertexSourceCode, fragmentSourceCode);
        }
        else {
            webGpuContext.stages = this._compilePipelineStageDescriptor(vertexSourceCode, fragmentSourceCode, defines);
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
        const gpuPipelineContext = (pipelineContext as WebGPUPipelineContext);

        // TODO WEBGPU. Hard coded for WebGPU until an introspection lib is available.
        // Should be done at processing time, not need to double the work in here.
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
     * Activates an effect, mkaing it the current one (ie. the one used for rendering)
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
            this._currentDrawContext = undefined;
            this._counters.numEnableEffects++;
            if (this.dbgLogIfNotDrawWrapper) {
                Logger.Warn(`enableEffect has been called with an Effect and not a Wrapper! effect.uniqueId=${effect.uniqueId}, effect.name=${effect.name}, effect.name.vertex=${effect.name.vertex}, effect.name.fragment=${effect.name.fragment}`, 10);
            }
        } else if (!effect.effect || effect.effect === this._currentEffect && effect.materialContext === this._currentMaterialContext && effect.drawContext === this._currentDrawContext && !this._forceEnableEffect) {
            if (!effect.effect && this.dbgShowEmptyEnableEffectCalls) {
                console.warn("Invalid call to enableEffect: the effect property is empty! drawWrapper=", effect);
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

    /** @hidden */
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

    /** @hidden */
    public _createHardwareTexture(): HardwareTextureWrapper {
        return new WebGPUHardwareTexture();
    }

    /** @hidden */
    public _releaseTexture(texture: InternalTexture): void {
        const index = this._internalTexturesCache.indexOf(texture);
        if (index !== -1) {
            this._internalTexturesCache.splice(index, 1);
        }

        this._textureHelper.releaseTexture(texture);
    }

    /** @hidden */
    public _getRGBABufferInternalSizedFormat(type: number, format?: number): number {
        return Constants.TEXTUREFORMAT_RGBA;
    }

    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        texture._comparisonFunction = comparisonFunction;
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
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(url: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<ISceneLike>, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null, mimeType?: string, loaderOptions?: any, creationFlags?: number): InternalTexture {

        return this._createTextureBase(
            url, noMipmap, invertY, scene, samplingMode, onLoad, onError,
            (texture: InternalTexture, extension: string, scene: Nullable<ISceneLike>, img: HTMLImageElement | ImageBitmap | { width: number, height: number }, invertY: boolean, noMipmap: boolean, isCompressed: boolean,
                processFunction: (width: number, height: number, img: HTMLImageElement | ImageBitmap | { width: number, height: number }, extension: string, texture: InternalTexture, continuationCallback: () => void) => boolean, samplingMode: number) => {
                    const imageBitmap = img as (ImageBitmap | { width: number, height: number}); // we will never get an HTMLImageElement in WebGPU

                    texture.baseWidth = imageBitmap.width;
                    texture.baseHeight = imageBitmap.height;
                    texture.width = imageBitmap.width;
                    texture.height = imageBitmap.height;
                    texture.format = format ?? -1;

                    processFunction(texture.width, texture.height, imageBitmap, extension, texture, () => {});

                    if (!texture._hardwareTexture?.underlyingResource) { // the texture could have been created before reaching this point so don't recreate it if already existing
                        const gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, imageBitmap.width, imageBitmap.height, undefined, creationFlags);

                        if (WebGPUTextureHelper.IsImageBitmap(imageBitmap)) {
                            this._textureHelper.updateTexture(imageBitmap, gpuTextureWrapper.underlyingResource!, imageBitmap.width, imageBitmap.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0, this._uploadEncoder);
                            if (!noMipmap && !isCompressed) {
                                this._generateMipmaps(texture, this._uploadEncoder);
                            }
                        }
                    } else if (!noMipmap && !isCompressed) {
                        this._generateMipmaps(texture, this._uploadEncoder);
                    }

                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    texture.isReady = true;

                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();
            },
            () => false,
            buffer, fallback, format, forcedExtension, mimeType, loaderOptions
        );
    }

    /** @hidden */
    public _setCubeMapTextureParams(texture: InternalTexture, loadMipmap: boolean) {
        texture.samplingMode = loadMipmap ? Engine.TEXTURE_TRILINEAR_SAMPLINGMODE : Engine.TEXTURE_BILINEAR_SAMPLINGMODE;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    }

    /**
     * Creates a cube texture
     * @param rootUrl defines the url where the files to load is located
     * @param scene defines the current scene
     * @param files defines the list of files to load (1 per face)
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
     * @param onLoad defines an optional callback raised when the texture is loaded
     * @param onError defines an optional callback raised if there is an issue to load the texture
     * @param format defines the format of the data
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param createPolynomials if a polynomial sphere should be created for the cube texture
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @param fallback defines texture to use while falling back when (compressed) texture file not found.
     * @param loaderOptions options to be passed to the loader
     * @returns the cube texture as an InternalTexture
     */
    public createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null): InternalTexture {

        return this.createCubeTextureBase(
            rootUrl, scene, files, !!noMipmap, onLoad, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, fallback,
            null,
            (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
                const imageBitmaps = imgs as ImageBitmap[]; // we will always get an ImageBitmap array in WebGPU
                const width = imageBitmaps[0].width;
                const height = width;

                this._setCubeMapTextureParams(texture, !noMipmap);
                texture.format = format ?? -1;

                const gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);

                this._textureHelper.updateCubeTextures(imageBitmaps, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, false, false, 0, 0, this._uploadEncoder);

                if (!noMipmap) {
                    this._generateMipmaps(texture, this._uploadEncoder);
                }

                texture.isReady = true;

                texture.onLoadedObservable.notifyObservers(texture);
                texture.onLoadedObservable.clear();

                if (onLoad) {
                    onLoad();
                }
            }
        );
    }

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
     * @returns the raw texture inside an InternalTexture
     */
    public createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number,
        compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT, creationFlags = 0): InternalTexture
    {
        const texture = new InternalTexture(this, InternalTextureSource.Raw);
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.format = format;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture._compression = compression;
        texture.type = type;

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);

        this.updateRawTexture(texture, data, format, invertY, compression, type);

        this._internalTexturesCache.push(texture);

        return texture;
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
    public createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number,
        generateMipMaps: boolean, invertY: boolean, samplingMode: number,
        compression: Nullable<string> = null): InternalTexture
    {
        const texture = new InternalTexture(this, InternalTextureSource.CubeRaw);
        texture.isCube = true;
        texture.format = format === Constants.TEXTUREFORMAT_RGB ? Constants.TEXTUREFORMAT_RGBA : format;
        texture.type = type;
        texture.generateMipMaps = generateMipMaps;
        texture.width = size;
        texture.height = size;
        texture.samplingMode = samplingMode;
        if (!this._doNotHandleContextLost) {
            texture._bufferViewArray = data;
        }
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._textureHelper.createGPUTextureForInternalTexture(texture);

        if (data) {
            this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
        }

        return texture;
    }

    /**
     * Creates a new raw cube texture from a specified url
     * @param url defines the url where the data is located
     * @param scene defines the current scene
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
     * @param noMipmap defines if the engine should avoid generating the mip levels
     * @param callback defines a callback used to extract texture data from loaded data
     * @param mipmapGenerator defines to provide an optional tool to generate mip levels
     * @param onLoad defines a callback called when texture is loaded
     * @param onError defines a callback called if there is an error
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param invertY defines if data must be stored with Y axis inverted
     * @returns the cube texture as an InternalTexture
     */
    public createRawCubeTextureFromUrl(url: string, scene: Nullable<Scene>, size: number, format: number, type: number, noMipmap: boolean,
        callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
        mipmapGenerator: Nullable<((faces: ArrayBufferView[]) => ArrayBufferView[][])>,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        invertY: boolean = false): InternalTexture
    {
        const texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode, null);
        scene?._addPendingData(texture);
        texture.url = url;

        this._internalTexturesCache.push(texture);

        const onerror = (request?: IWebRequest, exception?: any) => {
            scene?._removePendingData(texture);
            if (onError && request) {
                onError(request.status + " " + request.statusText, exception);
            }
        };

        const internalCallback = (data: any) => {
            const width = texture.width;
            const faceDataArrays = callback(data);

            if (!faceDataArrays) {
                return;
            }

            const faces = [0, 2, 4, 1, 3, 5];

            if (mipmapGenerator) {
                const needConversion = format === Constants.TEXTUREFORMAT_RGB;
                const mipData = mipmapGenerator(faceDataArrays);
                const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
                const faces = [0, 1, 2, 3, 4, 5];
                for (let level = 0; level < mipData.length; level++) {
                    const mipSize = width >> level;
                    const allFaces = [];
                    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                        let mipFaceData = mipData[level][faces[faceIndex]];
                        if (needConversion) {
                            mipFaceData = _convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                        }
                        allFaces.push(new Uint8Array(mipFaceData.buffer, mipFaceData.byteOffset, mipFaceData.byteLength));
                    }
                    this._textureHelper.updateCubeTextures(allFaces, gpuTextureWrapper.underlyingResource!, mipSize, mipSize, gpuTextureWrapper.format, invertY, false, 0, 0, this._uploadEncoder);
                }
            }
            else {
                const allFaces = [];
                for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                    allFaces.push(faceDataArrays[faces[faceIndex]]);
                }
                this.updateRawCubeTexture(texture, allFaces, format, type, invertY);
            }

            texture.isReady = true;
            scene?._removePendingData(texture);

            if (onLoad) {
                onLoad();
            }
        };

        this._loadFile(url, (data) => {
            internalCallback(data);
        }, undefined, scene?.offlineProvider, true, onerror);

        return texture;
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
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @returns a new raw 2D array texture (stored in an InternalTexture)
     */
    public createRawTexture2DArray(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number,
        compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, creationFlags = 0): InternalTexture
    {
        var source = InternalTextureSource.Raw2DArray;
        var texture = new InternalTexture(this, source);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.is2DArray = true;

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, depth, creationFlags);

        this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);

        this._internalTexturesCache.push(texture);

        return texture;
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
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @returns a new raw 3D texture (stored in an InternalTexture)
     */
    public createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number,
        compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, creationFlags = 0): InternalTexture
    {
        const source = InternalTextureSource.Raw3D;
        const texture = new InternalTexture(this, source);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.is3D = true;

        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);

        this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public generateMipMapsForCubemap(texture: InternalTexture, unbind = true) {
        if (texture.generateMipMaps) {
            let gpuTexture = texture._hardwareTexture?.underlyingResource;

            if (!gpuTexture) {
                this._textureHelper.createGPUTextureForInternalTexture(texture);
            }

            this._generateMipmaps(texture, texture.source === InternalTextureSource.RenderTarget || texture.source === InternalTextureSource.MultiRenderTarget ? this._renderTargetEncoder : undefined);
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
        if ((texture.is2DArray || texture.is3D) && (wrapR !== null)) {
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

    private _setInternalTexture(name: string, internalTexture: Nullable<InternalTexture>, baseName?: string, textureIndex = 0): void {
        baseName = baseName ?? name;
        if (this._currentEffect && !this._currentMaterialContext.setTexture(name, internalTexture)) {
            const webgpuPipelineContext = this._currentEffect._pipelineContext as WebGPUPipelineContext;
            const availableSampler = webgpuPipelineContext.shaderProcessingContext.availableSamplers[baseName];
            if (availableSampler) {
                this._currentMaterialContext.samplers[baseName] = {
                    firstTextureName: name,
                };
                this._currentMaterialContext.textures[name] = {
                    texture: internalTexture!,
                    wrapU: internalTexture?._cachedWrapU,
                    wrapV: internalTexture?._cachedWrapV,
                    wrapR: internalTexture?._cachedWrapR,
                    anisotropicFilteringLevel: internalTexture?._cachedAnisotropicFilteringLevel,
                    samplingMode: internalTexture?.samplingMode,
                };
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
        for (var index = 0; index < textures.length; index++) {
            this._setTexture(-1, textures[index], true, false, name + index.toString(), name, index);
        }
    }

    protected _setTexture(channel: number, texture: Nullable<BaseTexture>, isPartOfTextureArray = false, depthStencilTexture = false, name = "", baseName?: string, textureIndex = 0): boolean {
        // name == baseName for a texture that is not part of a texture array
        // Else, name is something like 'myTexture0' / 'myTexture1' / ... and baseName is 'myTexture'
        // baseName is used to look up the sampler in the effectContext.samplers map
        // name is used to look up the texture in the effectContext.textures map
        baseName = baseName ?? name;
        if (this._currentEffect) {
            if (!texture) {
                this._currentMaterialContext.setTexture(name, null);
                return false;
            }

            // Video
            if ((<VideoTexture>texture).video) {
                (<VideoTexture>texture).update();
            } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return false;
            }

            let internalTexture: Nullable<InternalTexture> = null;
            if (depthStencilTexture) {
                internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
            }
            else if (texture.isReady()) {
                internalTexture = <InternalTexture>texture.getInternalTexture();
            }
            else if (texture.isCube) {
                internalTexture = this.emptyCubeTexture;
            }
            else if (texture.is3D) {
                internalTexture = this.emptyTexture3D;
            }
            else if (texture.is2DArray) {
                internalTexture = this.emptyTexture2DArray;
            }
            else {
                internalTexture = this.emptyTexture;
            }

            if (internalTexture && !internalTexture.isMultiview) {
                // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
                if (internalTexture.isCube && internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                    internalTexture._cachedCoordinatesMode = texture.coordinatesMode;

                    const textureWrapMode = (texture.coordinatesMode !== Constants.TEXTURE_CUBIC_MODE && texture.coordinatesMode !== Constants.TEXTURE_SKYBOX_MODE) ? Constants.TEXTURE_WRAP_ADDRESSMODE : Constants.TEXTURE_CLAMP_ADDRESSMODE;
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

            this._setInternalTexture(name, internalTexture, baseName, textureIndex);
        } else {
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) { (this as any)._count = 0; }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - _setTexture called with a null _currentEffect! texture=", texture);
                }
            }
        }

        return true;
    }

    /** @hidden */
    public _setAnisotropicLevel(target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
        if (internalTexture._cachedAnisotropicFilteringLevel !== anisotropicFilteringLevel) {
            internalTexture._cachedAnisotropicFilteringLevel = Math.min(anisotropicFilteringLevel, this._caps.maxAnisotropy);
        }
    }

    /** @hidden */
    public _bindTexture(channel: number, texture: InternalTexture, name: string): void {
        if (channel === undefined) {
            return;
        }

        this._setInternalTexture(name, texture);
    }

    private _generateMipmaps(texture: InternalTexture, commandEncoder?: GPUCommandEncoder) {
        const gpuTexture = texture._hardwareTexture?.underlyingResource;

        if (!gpuTexture) {
            return;
        }

        // try as much as possible to use the command encoder corresponding to the current pass.
        // If not possible (because the pass is started - generateMipmaps itself creates a pass and it's not allowed to have a pass inside a pass), use _uploadEncoder
        commandEncoder = commandEncoder ?? (this._currentRenderTarget && !this._currentRenderPass ? this._renderTargetEncoder : !this._currentRenderPass ? this._renderEncoder : this._uploadEncoder);

        const format = (texture._hardwareTexture as WebGPUHardwareTexture).format;
        const mipmapCount = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - generate mipmaps called - width=", texture.width, "height=", texture.height, "isCube=", texture.isCube);
            }
        }

        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuTexture, format, mipmapCount, commandEncoder);
        } else {
            this._textureHelper.generateMipmaps(gpuTexture, format, mipmapCount, 0, commandEncoder);
        }
    }

    /**
     * Update the content of a texture
     * @param texture defines the texture to update
     * @param canvas defines the source containing the data
     * @param invertY defines if data must be stored with Y axis inverted
     * @param premulAlpha defines if alpha is stored as premultiplied
     * @param format defines the format of the data
     * @param forceBindTexture if the texture should be forced to be bound eg. after a graphics context loss (Default: false)
     */
    public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement | OffscreenCanvas, invertY: boolean, premulAlpha: boolean = false, format?: number, forceBindTexture?: boolean): void {
        if (!texture) {
            return;
        }

        const width = canvas.width, height = canvas.height;

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
        }

        this.createImageBitmap(canvas).then((bitmap) => {
            this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, width, height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, this._uploadEncoder);
            }

            texture.isReady = true;
        });
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
     */
    public updateTextureData(texture: InternalTexture, imageData: ArrayBufferView, xOffset: number, yOffset: number, width: number, height: number, faceIndex: number = 0, lod: number = 0): void {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, xOffset, yOffset, this._uploadEncoder);
    }

    /**
     * Update a video texture
     * @param texture defines the texture to update
     * @param video defines the video element to use
     * @param invertY defines if data must be stored with Y axis inverted
     */
    public updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
        if (!texture || texture._isDisabled) {
            return;
        }

        if (this._videoTextureSupported === undefined) {
            this._videoTextureSupported = true;
        }

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        this.createImageBitmap(video).then((bitmap) => {
            this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, this._uploadEncoder);
            }

            texture.isReady = true;
        }).catch((msg) => {
            // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
            // Just keep going on
            texture.isReady = true;
        });
    }

    /** @hidden */
    public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            texture.format = internalFormat;
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, false, false, 0, 0, this._uploadEncoder);
    }

    /** @hidden */
    public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0, babylonInternalFormat?: number, useTextureWidthAndHeight = false): void {
        // TODO WEBPU babylonInternalFormat not handled.
        // Note that it is used only by BasisTools.LoadTextureFromTranscodeResult when transcoding could not be done, and in that case the texture format used (TEXTURETYPE_UNSIGNED_SHORT_5_6_5) is not compatible with WebGPU...
        const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
        const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);

        const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
        const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
        }

        const data = new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);

        this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    /** @hidden */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);
    }

    /** @hidden */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        const bitmap = image as ImageBitmap; // in WebGPU we will always get an ImageBitmap, not an HTMLImageElement

        const width = Math.ceil(texture.width / (1 << lod));
        const height = Math.ceil(texture.height / (1 << lod));

        this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, width, height, texture.depth, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    /**
     * Update a raw texture
     * @param texture defines the texture to update
     * @param bufferView defines the data to store in the texture
     * @param format defines the format of the data
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     */
    public updateRawTexture(texture: Nullable<InternalTexture>, bufferView: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
        if (!texture) {
            return;
        }

        if (!this._doNotHandleContextLost) {
            texture._bufferView = bufferView;
            texture.invertY = invertY;
            texture._compression = compression;
        }

        if (bufferView) {
            const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
            const needConversion = format === Constants.TEXTUREFORMAT_RGB;

            if (needConversion) {
                bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, type);
            }

            const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

            this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, this._uploadEncoder);
            }
        }

        texture.isReady = true;
    }

    /**
     * Update a raw cube texture
     * @param texture defines the texture to update
     * @param bufferView defines the data to store
     * @param format defines the data format
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     * @param level defines which level of the texture to update
     */
    public updateRawCubeTexture(texture: InternalTexture, bufferView: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string> = null, level: number = 0): void {
        texture._bufferViewArray = bufferView;
        texture.invertY = invertY;
        texture._compression = compression;

        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        const data = [];
        for (let i = 0; i < bufferView.length; ++i) {
            let faceData = bufferView[i];
            if (needConversion) {
                faceData = _convertRGBtoRGBATextureData(bufferView[i], texture.width, texture.height, type);
            }
            data.push(new Uint8Array(faceData.buffer, faceData.byteOffset, faceData.byteLength));
        }

        this._textureHelper.updateCubeTextures(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, gpuTextureWrapper.format, invertY, false, 0, 0, this._uploadEncoder);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }

        texture.isReady = true;
    }

    /**
     * Update a raw 2D array texture
     * @param texture defines the texture to update
     * @param bufferView defines the data to store
     * @param format defines the data format
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the used compression (can be null)
     * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
     */
    public updateRawTexture2DArray(texture: InternalTexture, bufferView: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
        if (!this._doNotHandleContextLost) {
            texture._bufferView = bufferView;
            texture.format = format;
            texture.invertY = invertY;
            texture._compression = compression;
        }

        if (bufferView) {
            const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
            const needConversion = format === Constants.TEXTUREFORMAT_RGB;

            if (needConversion) {
                bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
            }

            const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

            this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, this._uploadEncoder);
            }
        }

        texture.isReady = true;
    }

    /**
     * Update a raw 3D texture
     * @param texture defines the texture to update
     * @param bufferView defines the data to store
     * @param format defines the data format
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the used compression (can be null)
     * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
     */
    public updateRawTexture3D(texture: InternalTexture, bufferView: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT): void {
        if (!this._doNotHandleContextLost) {
            texture._bufferView = bufferView;
            texture.format = format;
            texture.invertY = invertY;
            texture._compression = compression;
        }

        if (bufferView) {
            const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
            const needConversion = format === Constants.TEXTUREFORMAT_RGB;

            if (needConversion) {
                bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
            }

            const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

            this._textureHelper.updateTexture(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, this._uploadEncoder);
            }
        }

        texture.isReady = true;
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
        const renderPassWrapper = this._rttRenderPassWrapper.renderPass ? this._rttRenderPassWrapper : this._mainRenderPassWrapper;
        const gpuTexture = renderPassWrapper.colorAttachmentGPUTextures![0].underlyingResource;
        const gpuTextureFormat = renderPassWrapper.colorAttachmentGPUTextures![0].format;
        if (!gpuTexture) {
            // we are calling readPixels before startMainRenderPass has been called and no RTT is bound, so swapChainTexture is not setup yet!
            return Promise.resolve(new Uint8Array(0));
        }
        if (flushRenderer) {
            this.flushFramebuffer();
        }
        return this._textureHelper.readPixels(gpuTexture, x, y, width, height, gpuTextureFormat);
    }

    /** @hidden */
    public _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true): Promise<ArrayBufferView> {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (flushRenderer) {
            this.flushFramebuffer();
        }

        return this._textureHelper.readPixels(gpuTextureWrapper.underlyingResource!, 0, 0, width, height, gpuTextureWrapper.format, faceIndex, level, buffer);
    }

    /** @hidden */
    public _readTexturePixelsSync(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true): ArrayBufferView {
        throw "_readTexturePixelsSync is unsupported in WebGPU!";
    }

    //------------------------------------------------------------------------------
    //                              Render Target Textures
    //------------------------------------------------------------------------------

    /**
     * Creates a new render target texture
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target texture stored in an InternalTexture
     */
    public createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
        let fullOptions = new RenderTargetCreationOptions();

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            fullOptions.format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
            fullOptions.samples = options.samples ?? 1;
            fullOptions.creationFlags = options.creationFlags ?? 0;
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
            fullOptions.format = Constants.TEXTUREFORMAT_RGBA;
            fullOptions.samples = 1;
            fullOptions.creationFlags = 0;
        }

        const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        const width = size.width || size;
        const height = size.height || size;
        const layers = size.layers || 0;

        texture._depthStencilBuffer = {};
        texture._framebuffer = {};
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
        texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
        texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;
        texture.is2DArray = layers > 0;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._internalTexturesCache.push(texture);

        if (texture._generateDepthBuffer || texture._generateStencilBuffer) {
            texture._depthStencilTexture = this.createDepthStencilTexture({ width, height, layers }, {
                bilinearFiltering:
                    fullOptions.samplingMode === undefined ||
                    fullOptions.samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST || fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST,
                comparisonFunction: 0,
                generateStencil: texture._generateStencilBuffer,
                isCube: texture.isCube,
                samples: texture.samples,
            });
        }

        if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = true;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture, undefined, undefined, undefined, fullOptions.creationFlags);

        if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = false;
        }

        return texture;
    }

    /**
     * Create a multi render target texture
     * @param size defines the size of the texture
     * @param options defines the creation options
     * @returns the cube texture as an InternalTexture
     */
    public createMultipleRenderTarget(size: any, options: IMultiRenderTargetOptions): InternalTexture[] {
        let generateMipMaps = false;
        let generateDepthBuffer = true;
        let generateStencilBuffer = false;
        let generateDepthTexture = false;
        let textureCount = 1;

        let defaultType = Constants.TEXTURETYPE_UNSIGNED_INT;
        let defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

        let types = new Array<number>();
        let samplingModes = new Array<number>();

        if (options !== undefined) {
            generateMipMaps = options.generateMipMaps === undefined ? false : options.generateMipMaps;
            generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;
            generateDepthTexture = options.generateDepthTexture === undefined ? false : options.generateDepthTexture;
            textureCount = options.textureCount || 1;

            if (options.types) {
                types = options.types;
            }
            if (options.samplingModes) {
                samplingModes = options.samplingModes;
            }

        }

        const width = size.width || size;
        const height = size.height || size;

        let depthStencilTexture = null;
        if (generateDepthBuffer || generateStencilBuffer || generateDepthTexture) {
            depthStencilTexture = this.createDepthStencilTexture({ width, height }, {
                bilinearFiltering: false,
                comparisonFunction: 0,
                generateStencil: generateStencilBuffer,
                isCube: false,
                samples: 1,
            });
        }

        const textures = [];
        const attachments = [];

        for (let i = 0; i < textureCount; i++) {
            let samplingMode = samplingModes[i] || defaultSamplingMode;
            let type = types[i] || defaultType;

            if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            }
            else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            }

            if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                type = Constants.TEXTURETYPE_UNSIGNED_INT;
                Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }

            const texture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);

            textures.push(texture);
            attachments.push(i + 1);

            texture._depthStencilTexture = i === 0 ? depthStencilTexture : null;
            texture._framebuffer = {};
            texture._depthStencilBuffer = {};
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.isReady = true;
            texture.samples = 1;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;
            texture.type = type;
            texture._generateDepthBuffer = generateDepthBuffer;
            texture._generateStencilBuffer = generateStencilBuffer ? true : false;
            texture._attachments = attachments;
            texture._textureArray = textures;
            texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

            this._internalTexturesCache.push(texture);

            this._textureHelper.createGPUTextureForInternalTexture(texture);
        }

        if (depthStencilTexture) {
            textures.push(depthStencilTexture);
            this._internalTexturesCache.push(depthStencilTexture);
        }

        return textures;
    }

    /**
     * Creates a new render target cube texture
     * @param size defines the size of the texture
     * @param options defines the options used to create the texture
     * @returns a new render target cube texture stored in an InternalTexture
     */
    public createRenderTargetCubeTexture(size: number, options?: Partial<RenderTargetCreationOptions>): InternalTexture {
        let fullOptions = {
            generateMipMaps: true,
            generateDepthBuffer: true,
            generateStencilBuffer: false,
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
            format: Constants.TEXTUREFORMAT_RGBA,
            samples: 1,
            ...options
        };
        fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

        const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        texture.width = size;
        texture.height = size;
        texture.depth = 0;
        texture.isReady = true;
        texture.isCube = true;
        texture.samples = fullOptions.samples;
        texture.generateMipMaps = fullOptions.generateMipMaps;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        texture.format = fullOptions.format;
        texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
        texture._generateStencilBuffer = fullOptions.generateStencilBuffer;

        this._internalTexturesCache.push(texture);

        if (texture._generateDepthBuffer || texture._generateStencilBuffer) {
            texture._depthStencilTexture = this.createDepthStencilTexture({ width: texture.width, height: texture.height, layers: texture.depth }, {
                bilinearFiltering:
                    fullOptions.samplingMode === undefined ||
                    fullOptions.samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST || fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR ||
                    fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST,
                comparisonFunction: 0,
                generateStencil: texture._generateStencilBuffer,
                isCube: texture.isCube,
                samples: texture.samples,
            });
        }

        if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = true;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture);

        if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = false;
        }

        return texture;
    }

    /** @hidden */
    public _setupDepthStencilTexture(internalTexture: InternalTexture, size: number | { width: number, height: number, layers?: number }, generateStencil: boolean, bilinearFiltering: boolean, comparisonFunction: number, samples = 1): void {
        const width = (<{ width: number, height: number, layers?: number }>size).width || <number>size;
        const height = (<{ width: number, height: number, layers?: number }>size).height || <number>size;
        const layers = (<{ width: number, height: number, layers?: number }>size).layers || 0;

        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.is2DArray = layers > 0;
        internalTexture.depth = layers;
        internalTexture.isReady = true;
        internalTexture.samples = samples;
        internalTexture.generateMipMaps = false;
        internalTexture._generateDepthBuffer = true;
        internalTexture._generateStencilBuffer = generateStencil;
        internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        internalTexture._comparisonFunction = comparisonFunction;
        internalTexture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        internalTexture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    }

    /** @hidden */
    public _createDepthStencilTexture(size: number | { width: number, height: number, layers?: number }, options: DepthTextureCreationOptions): InternalTexture {
        const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

        const internalOptions = {
            bilinearFiltering: false,
            comparisonFunction: 0,
            generateStencil: false,
            samples: 1,
            ...options
        };

        // TODO WEBGPU allow to choose the format?
        internalTexture.format = internalOptions.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

        this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);

        this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

        this._internalTexturesCache.push(internalTexture);

        return internalTexture;
    }

    /** @hidden */
    public _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions): InternalTexture {
        const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

        internalTexture.isCube = true;

        const internalOptions = {
            bilinearFiltering: false,
            comparisonFunction: 0,
            generateStencil: false,
            samples: 1,
            ...options
        };

        // TODO WEBGPU allow to choose the format?
        internalTexture.format = internalOptions.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

        this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);

        this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

        this._internalTexturesCache.push(internalTexture);

        return internalTexture;
    }

    public updateRenderTargetTextureSampleCount(texture: Nullable<InternalTexture>, samples: number): number {
        if (!texture || texture.samples === samples) {
            return samples;
        }

        samples = Math.min(samples, this.getCaps().maxMSAASamples);

        if (samples > 1) {
            // TODO WEBGPU for the time being, Chrome only accepts values of 1 or 4
            samples = 4;
        }

        this._textureHelper.createMSAATexture(texture, samples);

        if (texture._depthStencilTexture) {
            this._textureHelper.createMSAATexture(texture._depthStencilTexture, samples);
            texture._depthStencilTexture.samples = samples;
        }

        texture.samples = samples;

        return samples;
    }

    /**
     * Update the sample count for a given multiple render target texture
     * @param textures defines the textures to update
     * @param samples defines the sample count to set
     * @returns the effective sample count (could be 0 if multisample render targets are not supported)
     */
    public updateMultipleRenderTargetTextureSampleCount(textures: Nullable<InternalTexture[]>, samples: number): number {
        if (!textures || textures[0].samples === samples) {
            return samples;
        }

        samples = Math.min(samples, this.getCaps().maxMSAASamples);

        if (samples > 1) {
            // TODO WEBGPU for the time being, Chrome only accepts values of 1 or 4
            samples = 4;
        }

        // Note that the last texture of textures is the depth texture (if the depth texture has been generated by the MRT class) and so the MSAA texture
        // will be recreated for this texture too. As a consequence, there's no need to explicitly recreate the MSAA texture for textures[0]._depthStencilTexture
        for (let i = 0; i < textures.length; ++i) {
            const texture = textures[i];
            this._textureHelper.createMSAATexture(texture, samples);
            texture.samples = samples;
        }

        return samples;
    }

    //------------------------------------------------------------------------------
    //                              Render Commands
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
        if (this._snapshotRenderingRecordBundles) {
            this._snapshotRenderingMainPassBundleList.push(this._bundleList.clone());
            this._snapshotRenderingRecordBundles = false;
            this._snapshotRenderingPlayBundles = true;
            this._snapshotRenderingMode = this._snapshotRenderingModeSaved;
        }

        if (this._mainRenderPassWrapper.renderPass !== null && this._snapshotRenderingPlayBundles) {
            for (let i = 0; i < this._snapshotRenderingMainPassBundleList.length; ++i) {
                this._snapshotRenderingMainPassBundleList[i].run(this._mainRenderPassWrapper.renderPass);
                if (this._snapshotRenderingMode === Constants.SNAPSHOTRENDERING_FAST) {
                    this._reportDrawCall(this._snapshotRenderingMainPassBundleList[i].numDrawCalls);
                }
            }
        }

        this._endMainRenderPass();

        this._timestampQuery.endFrame(this._renderEncoder);

        this.flushFramebuffer(false);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - counters");
            }
        }

        this._textureHelper.destroyDeferredTextures();
        this._bufferManager.destroyDeferredBuffers();

        if (this._features._collectUbosUpdatedInFrame) {
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) { (this as any)._count = 0; }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    const list: Array<string> = [];
                    for (const name in UniformBuffer._updatedUbosInFrame) {
                        list.push(name + ":" + UniformBuffer._updatedUbosInFrame[name]);
                    }
                    console.log("frame #" + (this as any)._count + " - updated ubos -", list.join(", "));
                }
            }
            UniformBuffer._updatedUbosInFrame = {};
        }

        this.countersLastFrame.numEnableEffects = this._counters.numEnableEffects;
        this.countersLastFrame.numEnableDrawWrapper = this._counters.numEnableDrawWrapper;
        this._counters.numEnableEffects = 0;
        this._counters.numEnableDrawWrapper = 0;

        this._cacheRenderPipeline.endFrame();
        this._cacheBindGroups.endFrame();

        this._pendingDebugCommands.length = 0;

        super.endFrame();

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
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
        let currentPassType = 0; // 0 if no pass, 1 for rtt, 2 for main pass
        if (this._currentRenderPass) {
            if (this._currentRenderTarget) {
                currentPassType = 1;
                this._endRenderTargetRenderPass();
            } else {
                currentPassType = 2;
                this._endMainRenderPass();
            }
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

        // restart the render pass
        if (reopenPass) {
            if (currentPassType === 1) {
                this._startRenderTargetRenderPass(this._currentRenderTarget!, false, null, false, false);
            } else if (currentPassType === 2) {
                this._startMainRenderPass(false);
            }
        }
    }

    //------------------------------------------------------------------------------
    //                              Render Pass
    //------------------------------------------------------------------------------

    private _startRenderTargetRenderPass(internalTexture: InternalTexture, setClearStates: boolean, clearColor: Nullable<IColor4Like>, clearDepth: boolean, clearStencil: boolean) {
        const gpuWrapper = internalTexture._hardwareTexture as WebGPUHardwareTexture;
        const gpuTexture = gpuWrapper.underlyingResource!;

        const depthStencilTexture = internalTexture._depthStencilTexture;
        const gpuDepthStencilWrapper = depthStencilTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
        const gpuDepthStencilTexture = gpuDepthStencilWrapper?.underlyingResource as Nullable<GPUTexture>;
        const gpuDepthStencilMSAATexture = gpuDepthStencilWrapper?.msaaTexture;

        const depthTextureView = gpuDepthStencilTexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
        const depthMSAATextureView = gpuDepthStencilMSAATexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);

        const colorAttachments: GPURenderPassColorAttachment[] = [];

        if (this.useReverseDepthBuffer) {
            this.setDepthFunctionToGreater();
        }

        const colorClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearColor ? clearColor : WebGPUConstants.LoadOp.Load;
        const depthClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearDepth ? (this.useReverseDepthBuffer ? this._clearReverseDepthValue : this._clearDepthValue) : WebGPUConstants.LoadOp.Load;
        const stencilClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearStencil ? this._clearStencilValue : WebGPUConstants.LoadOp.Load;

        if (internalTexture._attachments && internalTexture._textureArray) {
            // multi render targets
            // We bind a texture only if this._mrtAttachments[i] !== 0
            // It does work in the current state of Babylon (because we use _mrtAttachments only to include/exclude
            // some textures from the clearing process) but it is not iso with WebGL!
            // We should instead bind all textures but "disable" the textures for which this._mrtAttachments[i] == 0
            // but it's not possible to do that in WebGPU (at least not as of 2021/03/03).
            if (!this._mrtAttachments || this._mrtAttachments.length === 0) {
                this._mrtAttachments = internalTexture._attachments;
            }
            for (let i = 0; i < this._mrtAttachments.length; ++i) {
                const index = this._mrtAttachments[i];
                if (index === 0) {
                    continue;
                }
                const mrtTexture = internalTexture._textureArray[index - 1];
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
                        loadValue: colorClearValue,
                        storeOp: WebGPUConstants.StoreOp.Store,
                    });
                }
            }
            this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments, internalTexture._textureArray);
        } else {
            // single render target
            const gpuMSAATexture = gpuWrapper.msaaTexture;
            const colorTextureView = gpuTexture.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
            const colorMSAATextureView = gpuMSAATexture?.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);

            colorAttachments.push({
                view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                loadValue: colorClearValue,
                storeOp: WebGPUConstants.StoreOp.Store,
            });
        }

        this._debugPushGroup("render target pass", 1);

        this._rttRenderPassWrapper.renderPassDescriptor = {
            colorAttachments,
            depthStencilAttachment: depthStencilTexture && gpuDepthStencilTexture ? {
                view: depthMSAATextureView ? depthMSAATextureView : depthTextureView!,
                depthLoadValue: depthStencilTexture._generateDepthBuffer ? depthClearValue : WebGPUConstants.LoadOp.Load,
                depthStoreOp: WebGPUConstants.StoreOp.Store,
                stencilLoadValue: depthStencilTexture._generateStencilBuffer ? stencilClearValue : WebGPUConstants.LoadOp.Load,
                stencilStoreOp: WebGPUConstants.StoreOp.Store,
            } : undefined
        };
        this._rttRenderPassWrapper.renderPass = this._renderTargetEncoder.beginRenderPass(this._rttRenderPassWrapper.renderPassDescriptor);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - render target begin pass - internalTexture.uniqueId=", internalTexture.uniqueId, "width=", internalTexture.width, "height=", internalTexture.height, this._rttRenderPassWrapper.renderPassDescriptor);
            }
        }

        this._currentRenderPass = this._rttRenderPassWrapper.renderPass;

        this._debugFlushPendingCommands();

        this._resetCurrentViewport(1);
        this._resetCurrentScissor(1);
        this._resetCurrentStencilRef(1);
        this._resetCurrentColorBlend(1);
    }

    private _endRenderTargetRenderPass() {
        if (this._currentRenderPass) {
            const gpuWrapper = this._currentRenderTarget!._hardwareTexture as WebGPUHardwareTexture;
            if (this._snapshotRenderingPlayBundles) {
                gpuWrapper._bundleLists[gpuWrapper._currentLayer]?.run(this._currentRenderPass);
                if (this._snapshotRenderingMode === Constants.SNAPSHOTRENDERING_FAST) {
                    this._reportDrawCall(gpuWrapper._bundleLists[gpuWrapper._currentLayer]?.numDrawCalls);
                }
            } else if (this._snapshotRenderingRecordBundles) {
                if (!gpuWrapper._bundleLists) {
                    gpuWrapper._bundleLists = [];
                }
                gpuWrapper._bundleLists[gpuWrapper._currentLayer] = this._bundleList.clone();
                gpuWrapper._bundleLists[gpuWrapper._currentLayer].run(this._currentRenderPass);
                this._bundleList.reset();
            } else if (!this.compatibilityMode) {
                this._bundleList.run(this._currentRenderPass);
                this._bundleList.reset();
            }
            this._currentRenderPass.endPass();
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) { (this as any)._count = 0; }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - render target end pass - internalTexture.uniqueId=", this._currentRenderTarget?.uniqueId);
                }
            }
            this._debugPopGroup(1);
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

    private _startMainRenderPass(setClearStates: boolean, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
        if (this._mainRenderPassWrapper.renderPass) {
            this._endMainRenderPass();
        }

        if (this.useReverseDepthBuffer) {
            this.setDepthFunctionToGreater();
        }

        const colorClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearColor ? clearColor : WebGPUConstants.LoadOp.Load;
        const depthClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearDepth ? (this.useReverseDepthBuffer ? this._clearReverseDepthValue : this._clearDepthValue) : WebGPUConstants.LoadOp.Load;
        const stencilClearValue = !setClearStates ? WebGPUConstants.LoadOp.Load : clearStencil ? this._clearStencilValue : WebGPUConstants.LoadOp.Load;

        this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0].loadValue = colorClearValue;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.depthLoadValue = depthClearValue;
        this._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.stencilLoadValue = stencilClearValue;

        this._swapChainTexture = this._swapChain.getCurrentTexture();
        this._mainRenderPassWrapper.colorAttachmentGPUTextures![0].set(this._swapChainTexture);

        // Resolve in case of MSAA
        if (this._options.antialiasing) {
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0].resolveTarget = this._swapChainTexture.createView();
        }
        else {
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0].view = this._swapChainTexture.createView();
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - main begin pass - texture width=" + (this._mainTextureExtends as any).width, " height=" + (this._mainTextureExtends as any).height, this._mainRenderPassWrapper.renderPassDescriptor);
            }
        }

        this._debugPushGroup("main pass", 0);

        this._currentRenderPass = this._renderEncoder.beginRenderPass(this._mainRenderPassWrapper.renderPassDescriptor!);

        this._mainRenderPassWrapper.renderPass = this._currentRenderPass;

        this._debugFlushPendingCommands();

        this._resetCurrentViewport(0);
        this._resetCurrentScissor(0);
        this._resetCurrentStencilRef(0);
        this._resetCurrentColorBlend(0);
    }

    private _endMainRenderPass(): void {
        if (this._mainRenderPassWrapper.renderPass !== null) {
            if (this._snapshotRenderingRecordBundles) {
                this._snapshotRenderingMainPassBundleList.push(this._bundleList.clone());
            }
            if (!this.compatibilityMode && !this._snapshotRenderingPlayBundles) {
                this._bundleList.run(this._mainRenderPassWrapper.renderPass);
                this._bundleList.reset();
            }
            this._mainRenderPassWrapper.renderPass.endPass();
            if (this.dbgVerboseLogsForFirstFrames) {
                if ((this as any)._count === undefined) { (this as any)._count = 0; }
                if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                    console.log("frame #" + (this as any)._count + " - main end pass");
                }
            }
            this._debugPopGroup(0);
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
     * Restores the WebGPU state to only draw on the main color attachment
     */
    public restoreSingleAttachment(): void {
        // nothing to do, this is done automatically in the unBindFramebuffer function
    }

    /**
     * Creates a layout object to draw/clear on specific textures in a MRT
     * @param textureStatus textureStatus[i] indicates if the i-th is active
     * @returns A layout to be fed to the engine, calling `bindAttachments`.
     */
    public buildTextureLayout(textureStatus: boolean[]): number[] {
        const result = [];

        for (let i = 0; i < textureStatus.length; i++) {
            if (textureStatus[i]) {
                result.push(i + 1);
            } else {
                result.push(0);
            }
        }

        return result;
    }

    /**
     * Select a subsets of attachments to draw to.
     * @param attachments index of attachments
     */
    public bindAttachments(attachments: number[]): void {
        if (attachments.length === 0 || !this._currentRenderTarget) {
            return;
        }

        this._mrtAttachments = attachments;
    }

    /**
     * Binds the frame buffer to the specified texture.
     * @param texture The texture to render to or null for the default canvas
     * @param faceIndex The face of the texture to render to in case of cube texture
     * @param requiredWidth The width of the target to render to
     * @param requiredHeight The height of the target to render to
     * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
     * @param lodLevel defines the lod level to bind to the frame buffer
     * @param layer defines the 2d array index to bind to frame buffer to
     */
    public bindFramebuffer(texture: InternalTexture, faceIndex: number = 0, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean, lodLevel = 0, layer = 0): void {
        const hardwareTexture = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;
        const gpuTexture = hardwareTexture?.underlyingResource as Nullable<GPUTexture>;

        if (!hardwareTexture || !gpuTexture) {
            if (this.dbgSanityChecks) {
                console.error("bindFramebuffer: Trying to bind a texture that does not have a hardware texture or that has a webgpu texture empty!", texture, hardwareTexture, gpuTexture);
            }
            return;
        }

        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = texture;
        hardwareTexture._currentLayer = texture.isCube ? layer * 6 + faceIndex : layer;

        this._rttRenderPassWrapper.colorAttachmentGPUTextures[0] = hardwareTexture;
        this._rttRenderPassWrapper.depthTextureFormat = this._currentRenderTarget._depthStencilTexture ? WebGPUTextureHelper.GetWebGPUTextureFormat(-1, this._currentRenderTarget._depthStencilTexture.format) : undefined;

        this._setDepthTextureFormat(this._rttRenderPassWrapper);
        this._setColorFormat(this._rttRenderPassWrapper);

        this._rttRenderPassWrapper.colorAttachmentViewDescriptor = {
            format: this._colorFormat,
            dimension: WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: texture.isCube ? layer * 6 + faceIndex : layer,
            baseMipLevel: lodLevel,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All
        };

        this._rttRenderPassWrapper.depthAttachmentViewDescriptor = {
            format: this._depthTextureFormat!,
            dimension: WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: texture.isCube ? layer * 6 + faceIndex : layer,
            baseMipLevel: 0,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All
        };

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) { (this as any)._count = 0; }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (this as any)._count + " - bindFramebuffer called - face=", faceIndex, "lodLevel=", lodLevel, "layer=", layer, this._rttRenderPassWrapper.colorAttachmentViewDescriptor, this._rttRenderPassWrapper.depthAttachmentViewDescriptor);
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
     * @param texture defines the render target texture to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        // TODO WEBGPU remove the assert debugging code
        assert(this._currentRenderTarget === null || (this._currentRenderTarget !== null && texture === this._currentRenderTarget), "unBindFramebuffer - the texture we want to unbind is not the same than the currentRenderTarget! texture id=" + texture.uniqueId + ", this._currentRenderTarget id=" + this._currentRenderTarget?.uniqueId);

        const saveCRT = this._currentRenderTarget;

        this._currentRenderTarget = null; // to be iso with thinEngine, this._currentRenderTarget must be null when onBeforeUnbind is called

        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        this._currentRenderTarget = saveCRT;

        if (this._currentRenderPass && this._currentRenderPass !== this._mainRenderPassWrapper.renderPass) {
            this._endRenderTargetRenderPass();
        }

        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._generateMipmaps(texture);
        }

        this._currentRenderTarget = null;

        this._mrtAttachments = [];
        this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments, []);
        this._currentRenderPass = this._mainRenderPassWrapper.renderPass;
        this._setDepthTextureFormat(this._mainRenderPassWrapper);
        this._setColorFormat(this._mainRenderPassWrapper);
    }

    /**
     * Unbind a list of render target textures from the WebGPU context
     * @param textures defines the render target textures to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public unBindMultiColorAttachmentFramebuffer(textures: InternalTexture[], disableGenerateMipMaps: boolean = false, onBeforeUnbind?: () => void): void {
        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        const attachments = textures[0]._attachments!;
        const count = attachments.length;

        if (this._currentRenderPass && this._currentRenderPass !== this._mainRenderPassWrapper.renderPass) {
            this._endRenderTargetRenderPass();
        }

        for (let i = 0; i < count; i++) {
            const texture = textures[i];
            if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
                this._generateMipmaps(texture);
            }
        }

        this._currentRenderTarget = null;

        this._mrtAttachments = [];
        this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments, []);
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

    private _setColorFormat(wrapper: WebGPURenderPassWrapper): void {
        const format = wrapper.colorAttachmentGPUTextures[0].format;
        this._cacheRenderPipeline.setColorFormat(format);
        if (this._colorFormat === format) {
            return;
        }
        this._colorFormat = format;
    }

    private _setDepthTextureFormat(wrapper: WebGPURenderPassWrapper): void {
        this._cacheRenderPipeline.setDepthStencilFormat(wrapper.depthTextureFormat);
        if (this._depthTextureFormat === wrapper.depthTextureFormat) {
            return;
        }
        this._depthTextureFormat = wrapper.depthTextureFormat;
    }

    public setDitheringState(value: boolean): void {
        // Does not exist in WebGPU
    }

    public setRasterizerState(value: boolean): void {
        // Does not exist in WebGPU
    }

    /**
     * Set various states to the context
     * @param culling defines culling state: true to enable culling, false to disable it
     * @param zOffset defines the value to apply to zOffset (0 by default)
     * @param force defines if states must be applied even if cache is up to date
     * @param reverseSide defines if culling must be reversed (CCW if false, CW if true)
     * @param cullBackFaces true to cull back faces, false to cull front faces (if culling is enabled)
     * @param stencil stencil states to set
     */
    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false, cullBackFaces?: boolean, stencil?: IStencilState): void {
        // Culling
        if (this._depthCullingState.cull !== culling || force) {
            this._depthCullingState.cull = culling;
        }

        // Cull face
        var cullFace = (this.cullBackFaces ?? cullBackFaces ?? true) ? 1 : 2;
        if (this._depthCullingState.cullFace !== cullFace || force) {
            this._depthCullingState.cullFace = cullFace;
        }

        // Z offset
        this.setZOffset(zOffset);

        // Front face
        // var frontFace = reverseSide ? this._gl.CW : this._gl.CCW;
        var frontFace = reverseSide ? 1 : 2;
        if (this._depthCullingState.frontFace !== frontFace || force) {
            this._depthCullingState.frontFace = frontFace;
        }

        this._stencilStateComposer.stencilMaterial = stencil;
    }

    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
     */
    public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
        if (this._alphaMode === mode) {
            return;
        }

        switch (mode) {
            case Engine.ALPHA_DISABLE:
                this._alphaState.alphaBlend = false;
                break;
            case Engine.ALPHA_PREMULTIPLIED:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(1, 0x0303, 1, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_PREMULTIPLIED_PORTERDUFF:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                this._alphaState.setAlphaBlendFunctionParameters(1, 0x0303, 1, 0x0303);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_COMBINE:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(0x0302, 0x0303, 1, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_ONEONE:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(1, 1, 0, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_ADD:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(0x0302, 1, 0, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_SUBTRACT:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(0, 0x0301, 1, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_MULTIPLY:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(0x0306, 0, 1, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_MAXIMIZED:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                this._alphaState.setAlphaBlendFunctionParameters(0x0302, 0x0301, 1, 1);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_INTERPOLATE:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.CONSTANT_COLOR, this._gl.ONE_MINUS_CONSTANT_COLOR, this._gl.CONSTANT_ALPHA, this._gl.ONE_MINUS_CONSTANT_ALPHA);
                this._alphaState.setAlphaBlendFunctionParameters(0x8001, 0x8002, 0x8003, 0x8004);
                this._alphaState.alphaBlend = true;
                break;
            case Engine.ALPHA_SCREENMODE:
                // this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                this._alphaState.setAlphaBlendFunctionParameters(1, 0x0301, 1, 0x0303);
                this._alphaState.alphaBlend = true;
                break;
        }
        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
            this._cacheRenderPipeline.setDepthWriteEnabled(mode === Engine.ALPHA_DISABLE);
        }
        this._alphaMode = mode;
        this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
        this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
    }

    /**
     * Sets the current alpha equation
     * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
     */
    public setAlphaEquation(equation: number): void {
        super.setAlphaEquation(equation);

        this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
    }

    private _draw(drawType: number, fillMode: number, start: number, count: number, instancesCount: number): void {
        const renderPass = this._getCurrentRenderPass();

        this.applyStates();

        const mustUpdateViewport = this._mustUpdateViewport(renderPass as GPURenderPassEncoder);
        const mustUpdateScissor = this._mustUpdateScissor(renderPass as GPURenderPassEncoder);
        const mustUpdateStencilRef = !this._stencilStateComposer.enabled ? false : this._mustUpdateStencilRef(renderPass as GPURenderPassEncoder);
        const mustUpdateBlendColor = !this._alphaState.alphaBlend ? false : this._mustUpdateBlendColor(renderPass as GPURenderPassEncoder);

        const webgpuPipelineContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;

        if (webgpuPipelineContext.uniformBuffer) {
            webgpuPipelineContext.uniformBuffer.update();
        }

        if (this._snapshotRenderingPlayBundles) {
            this._reportDrawCall();
            return;
        }

        const useFastPath = !this.compatibilityMode && this._currentDrawContext?.fastBundle;
        let renderPass2: GPURenderPassEncoder | GPURenderBundleEncoder = renderPass;

        if (useFastPath || this._snapshotRenderingRecordBundles) {
            if (mustUpdateViewport) {
                this._bundleList.addItem(new WebGPURenderItemViewport(this._viewportCached.x, this._viewportCached.y, this._viewportCached.z, this._viewportCached.w));
            }
            if (mustUpdateScissor) {
                this._bundleList.addItem(new WebGPURenderItemScissor(this._scissorCached.x, this._scissorCached.y, this._scissorCached.z, this._scissorCached.w));
            }
            if (mustUpdateStencilRef) {
                this._bundleList.addItem(new WebGPURenderItemStencilRef(this._stencilStateComposer.funcRef ?? 0));
            }
            if (mustUpdateBlendColor) {
                this._bundleList.addItem(new WebGPURenderItemBlendColor(this._alphaState._blendConstants.slice()));
            }

            if (!this._snapshotRenderingRecordBundles) {
                this._bundleList.addBundle(this._currentDrawContext!.fastBundle);
                this._reportDrawCall();
                return;
            }

            renderPass2 = this._bundleList.getBundleEncoder(this._cacheRenderPipeline.colorFormats, this._depthTextureFormat, this.currentSampleCount); // for snapshot recording mode
            this._bundleList.numDrawCalls++;
        }

        if (webgpuPipelineContext.uniformBuffer) {
            this.bindUniformBufferBase(webgpuPipelineContext.uniformBuffer.getBuffer()!, 0, "LeftOver");
        }

        const pipeline = this._cacheRenderPipeline.getRenderPipeline(fillMode, this._currentEffect!, this.currentSampleCount);
        const bindGroups = this._cacheBindGroups.getBindGroups(webgpuPipelineContext, this._currentMaterialContext, this._uniformsBuffers);

        if (!this._snapshotRenderingRecordBundles) {
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
            if (!this.compatibilityMode) {
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
            renderPass2.setIndexBuffer(this._currentIndexBuffer.underlyingResource, this._currentIndexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16, 0);
        }

        const vertexBuffers = this._cacheRenderPipeline.vertexBuffers;
        for (var index = 0; index < vertexBuffers.length; index++) {
            let vertexBuffer = vertexBuffers[index];

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
        if (drawType === 0) {
            renderPass2.drawIndexed(count, instancesCount || 1, start, 0, 0);
        } else {
            renderPass2.draw(count, instancesCount || 1, start, 0);
        }

        if (!this.compatibilityMode && this._currentDrawContext && !this._snapshotRenderingRecordBundles) {
            this._currentDrawContext.fastBundle = (renderPass2 as GPURenderBundleEncoder).finish();
            this._bundleList.addBundle(this._currentDrawContext.fastBundle);
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
        if (this._mainTexture) {
            this._mainTexture.destroy();
        }
        if (this._depthTexture) {
            this._depthTexture.destroy();
        }
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

    /** @hidden */
    public _debugPushGroup(groupName: string, targetObject?: number): void {
        if (!this._options.enableGPUDebugMarkers) {
            return;
        }

        if (targetObject === 0 || targetObject === 1) {
            const encoder = targetObject === 0 ? this._renderEncoder : this._renderTargetEncoder;
            encoder.pushDebugGroup(groupName);
        } else if (this._currentRenderPass) {
            this._currentRenderPass.pushDebugGroup(groupName);
        } else {
            this._pendingDebugCommands.push(["push", groupName]);
        }
    }

    /** @hidden */
    public _debugPopGroup(targetObject?: number): void {
        if (!this._options.enableGPUDebugMarkers) {
            return;
        }

        if (targetObject === 0 || targetObject === 1) {
            const encoder = targetObject === 0 ? this._renderEncoder : this._renderTargetEncoder;
            encoder.popDebugGroup();
        } else if (this._currentRenderPass) {
            this._currentRenderPass.popDebugGroup();
        } else {
            this._pendingDebugCommands.push(["pop", null]);
        }
    }

    /** @hidden */
    public _debugInsertMarker(text: string, targetObject?: number): void {
        if (!this._options.enableGPUDebugMarkers) {
            return;
        }

        if (targetObject === 0 || targetObject === 1) {
            const encoder = targetObject === 0 ? this._renderEncoder : this._renderTargetEncoder;
            encoder.insertDebugMarker(text);
        } else if (this._currentRenderPass) {
            this._currentRenderPass.insertDebugMarker(text);
        } else {
            this._pendingDebugCommands.push(["insert", text]);
        }
    }

    private _debugFlushPendingCommands(): void {
        for (let i = 0; i < this._pendingDebugCommands.length; ++i) {
            const [name, param] = this._pendingDebugCommands[i];

            switch (name) {
                case "push":
                    this._debugPushGroup(param!);
                    break;
                case "pop":
                    this._debugPopGroup();
                    break;
                case "insert":
                    this._debugInsertMarker(param!);
                    break;
            }
        }
        this._pendingDebugCommands.length = 0;
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

    /** @hidden */
    public bindSamplers(effect: Effect): void { }

    /** @hidden */
    public _bindTextureDirectly(target: number, texture: InternalTexture, forTextureDataUpdate = false, force = false): boolean {
        return false;
    }

    /** @hidden */
    public _releaseFramebufferObjects(texture: InternalTexture): void { }

    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns always true - No parallel shader compilation
     */
    public areAllEffectsReady(): boolean {
        return true;
    }

    /** @hidden */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        // No parallel shader compilation.
        // No Async, so direct launch
        action();
    }

    /** @hidden */
    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        // No parallel shader compilation.
        return true;
    }

    /** @hidden */
    public _getUnpackAlignement(): number {
        return 1;
    }

    /** @hidden */
    public _unpackFlipY(value: boolean) { }

    // TODO WEBGPU. All of the below should go once engine split with baseEngine.

    /** @hidden */
    public _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
        throw "_getSamplingParameters is not available in WebGPU";
    }

    /** @hidden */
    public bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
    }

    /** @hidden */
    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
        return [];
    }

    /** @hidden */
    public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    /** @hidden */
    public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    /** @hidden */
    public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    /** @hidden */
    public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    /** @hidden */
    public setArray(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    /** @hidden */
    public setArray2(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    /** @hidden */
    public setArray3(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    /** @hidden */
    public setArray4(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    /** @hidden */
    public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): boolean {
        return false;
    }

    /** @hidden */
    public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        return false;
    }

    /** @hidden */
    public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        return false;
    }

    /** @hidden */
    public setFloat(uniform: WebGLUniformLocation, value: number): boolean {
        return false;
    }

    /** @hidden */
    public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): boolean {
        return false;
    }

    /** @hidden */
    public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): boolean {
        return false;
    }

    /** @hidden */
    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): boolean {
        return false;
    }
}

/** @hidden */
function _convertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
    // Create new RGBA data container.
    var rgbaData: any;
    if (textureType === Constants.TEXTURETYPE_FLOAT) {
        rgbaData = new Float32Array(width * height * 4);
    }
    else {
        rgbaData = new Uint32Array(width * height * 4);
    }

    // Convert each pixel.
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let index = (y * width + x) * 3;
            let newIndex = (y * width + x) * 4;

            // Map Old Value to new value.
            rgbaData[newIndex + 0] = rgbData[index + 0];
            rgbaData[newIndex + 1] = rgbData[index + 1];
            rgbaData[newIndex + 2] = rgbData[index + 2];

            // Add fully opaque alpha channel.
            rgbaData[newIndex + 3] = 1;
        }
    }

    return rgbaData;
}
