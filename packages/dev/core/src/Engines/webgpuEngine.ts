/* eslint-disable babylonjs/available */
import { Logger } from "../Misc/logger";
import type { Nullable, DataArray, IndicesArray, Immutable, FloatArray } from "../types";
import { Color4 } from "../Maths/math";
import { Engine } from "../Engines/engine";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { IEffectCreationOptions, IShaderPath } from "../Materials/effect";
import { Effect } from "../Materials/effect";
import type { EffectFallbacks } from "../Materials/effectFallbacks";
import { Constants } from "./constants";
// eslint-disable-next-line @typescript-eslint/naming-convention
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
import { WebGPUTextureManager } from "./WebGPU/webgpuTextureManager";
import type { ISceneLike, ThinEngineOptions } from "./thinEngine";
import { WebGPUBufferManager } from "./WebGPU/webgpuBufferManager";
import type { HardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import { WebGPUHardwareTexture } from "./WebGPU/webgpuHardwareTexture";
import type { IColor4Like } from "../Maths/math.like";
import { UniformBuffer } from "../Materials/uniformBuffer";
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

import "../Buffers/buffer.align";

import "../ShadersWGSL/postprocess.vertex";

import type { VideoTexture } from "../Materials/Textures/videoTexture";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { RenderTargetWrapper } from "./renderTargetWrapper";
import { WebGPUPerfCounter } from "./WebGPU/webgpuPerfCounter";
import type { Scene } from "core/scene";

const viewDescriptorSwapChainAntialiasing: GPUTextureViewDescriptor = {
    label: `TextureView_SwapChain_ResolveTarget`,
    dimension: WebGPUConstants.TextureDimension.E2d,
    format: undefined as any, // will be updated with the right value
    mipLevelCount: 1,
    arrayLayerCount: 1,
};

const viewDescriptorSwapChain: GPUTextureViewDescriptor = {
    label: `TextureView_SwapChain`,
    dimension: WebGPUConstants.TextureDimension.E2d,
    format: undefined as any, // will be updated with the right value
    mipLevelCount: 1,
    arrayLayerCount: 1,
};

const disableUniformityAnalysisMarker = "/* disable_uniformity_analysis */";

const tempColor4 = new Color4();

/** @internal */
interface IWebGPURenderPassWrapper {
    renderPassDescriptor: Nullable<GPURenderPassDescriptor>;

    colorAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    depthAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    colorAttachmentGPUTextures: (WebGPUHardwareTexture | null)[];
    depthTextureFormat: GPUTextureFormat | undefined;
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
export interface WebGPUEngineOptions extends ThinEngineOptions, GPURequestAdapterOptions {
    /**
     * Defines the category of adapter to use.
     * Is it the discrete or integrated device.
     */
    powerPreference?: GPUPowerPreference;

    /**
     * When set to true, indicates that only a fallback adapter may be returned when requesting an adapter.
     * If the user agent does not support a fallback adapter, will cause requestAdapter() to resolve to null.
     * Default: false
     */
    forceFallbackAdapter?: boolean;

    /**
     * Defines the device descriptor used to create a device once we have retrieved an appropriate adapter
     */
    deviceDescriptor?: GPUDeviceDescriptor;

    /**
     * When requesting the device, enable all the features supported by the adapter. Default: false
     * Note that this setting is ignored if you explicitely set deviceDescriptor.requiredFeatures
     */
    enableAllFeatures?: boolean;

    /**
     * When requesting the device, set the required limits to the maximum possible values (the ones from adapter.limits). Default: false
     * Note that this setting is ignored if you explicitely set deviceDescriptor.requiredLimits
     */
    setMaximumLimits?: boolean;

    /**
     * Defines the requested Swap Chain Format.
     */
    swapChainFormat?: GPUTextureFormat;

    /**
     * Defines whether we should generate debug markers in the gpu command lists (can be seen with PIX for eg). Default: false
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
}

/**
 * The web GPU engine class provides support for WebGPU version of babylon.js.
 * @since 5.0.0
 */
export class WebGPUEngine extends Engine {
    // Default glslang options.
    private static readonly _GLSLslangDefaultOptions: GlslangOptions = {
        jsPath: `${Tools._DefaultCdnUrl}/glslang/glslang.js`,
        wasmPath: `${Tools._DefaultCdnUrl}/glslang/glslang.wasm`,
    };

    private static _InstanceId = 0;

    /** true to enable using TintWASM to convert Spir-V to WGSL */
    public static UseTWGSL = true;

    /** A unique id to identify this instance */
    public readonly uniqueId = -1;

    // Page Life cycle and constants
    private readonly _uploadEncoderDescriptor = { label: "upload" };
    private readonly _renderEncoderDescriptor = { label: "render" };
    /** @internal */
    public readonly _clearDepthValue = 1;
    /** @internal */
    public readonly _clearReverseDepthValue = 0;
    /** @internal */
    public readonly _clearStencilValue = 0;
    private readonly _defaultSampleCount = 4; // Only supported value for now.

    // Engine Life Cycle
    /** @internal */
    public _options: WebGPUEngineOptions;
    private _glslang: any = null;
    private _tintWASM: Nullable<WebGPUTintWASM> = null;
    private _adapter: GPUAdapter;
    private _adapterSupportedExtensions: GPUFeatureName[];
    private _adapterInfo: GPUAdapterInfo = {
        vendor: "",
        architecture: "",
        device: "",
        description: "",
    };
    private _adapterSupportedLimits: GPUSupportedLimits;
    /** @internal */
    public _device: GPUDevice;
    private _deviceEnabledExtensions: GPUFeatureName[];
    private _deviceLimits: GPUSupportedLimits;
    private _context: GPUCanvasContext;
    private _mainPassSampleCount: number;
    private _glslangOptions?: GlslangOptions;
    private _twgslOptions?: TwgslOptions;
    /** @internal */
    public _textureHelper: WebGPUTextureManager;
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
    public _timestampIndex = 0;
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

    private _commandBuffers: GPUCommandBuffer[] = [null as any, null as any];

    // Frame Buffer Life Cycle (recreated for each render target pass)
    /** @internal */
    public _currentRenderPass: Nullable<GPURenderPassEncoder> = null;
    private _mainRenderPassWrapper: IWebGPURenderPassWrapper = {
        renderPassDescriptor: null,
        colorAttachmentViewDescriptor: null,
        depthAttachmentViewDescriptor: null,
        colorAttachmentGPUTextures: [],
        depthTextureFormat: undefined,
    };
    private _rttRenderPassWrapper: IWebGPURenderPassWrapper = {
        renderPassDescriptor: null,
        colorAttachmentViewDescriptor: null,
        depthAttachmentViewDescriptor: null,
        colorAttachmentGPUTextures: [],
        depthTextureFormat: undefined,
    };
    /** @internal */
    public _pendingDebugCommands: Array<[string, Nullable<string>]> = [];
    /**
     * Used for both the compatibilityMode=false and the snapshot rendering modes (as both can't be enabled at the same time)
     * @internal
     */
    public _bundleList: WebGPUBundleList;

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
                      (adapter: GPUAdapter | undefined) => !!adapter,
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

    /** Gets the supported limits by the WebGPU adapter */
    public get supportedLimits(): GPUSupportedLimits {
        return this._adapterSupportedLimits;
    }

    /** Gets the current limits of the WebGPU device */
    public get currentLimits() {
        return this._deviceLimits;
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
            vendor: this._adapterInfo.vendor || "unknown vendor",
            renderer: this._adapterInfo.architecture || "unknown renderer",
            version: this._adapterInfo.description || "unknown version",
        };
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
        this._compatibilityMode = mode;
    }

    /**
     * Enables or disables GPU timing measurements.
     * Note that this is only supported if the "timestamp-query" extension is enabled in the options.
     */
    public get enableGPUTimingMeasurements(): boolean {
        return this._timestampQuery.enable;
    }

    public set enableGPUTimingMeasurements(enable: boolean) {
        if (this._timestampQuery.enable === enable) {
            return;
        }
        (this.gpuTimeInFrameForMainPass as any) = enable ? new WebGPUPerfCounter() : undefined;
        this._timestampQuery.enable = enable;
    }

    /**
     * Gets the GPU time spent in the main render pass for the last frame rendered (in nanoseconds).
     * You have to enable the "timestamp-query" extension in the engine constructor options and set engine.enableGPUTimingMeasurements = true.
     * It will only return time spent in the main pass, not additional render target / compute passes (if any)!
     */
    public readonly gpuTimeInFrameForMainPass?: WebGPUPerfCounter;

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
     * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
     */
    public readonly isNDCHalfZRange: boolean = true;

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    public readonly hasOriginBottomLeft: boolean = false;

    /**
     * Create a new instance of the gpu engine.
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     */
    public constructor(canvas: HTMLCanvasElement | OffscreenCanvas, options: WebGPUEngineOptions = {}) {
        super(null, options.antialias ?? true, options);
        this._name = "WebGPU";

        options.deviceDescriptor = options.deviceDescriptor || {};
        options.enableGPUDebugMarkers = options.enableGPUDebugMarkers ?? false;

        Logger.Log(`Babylon.js v${Engine.Version} - ${this.description} engine`);
        if (!navigator.gpu) {
            Logger.Error("WebGPU is not supported by your browser.");
            return;
        }

        options.swapChainFormat = options.swapChainFormat || navigator.gpu.getPreferredCanvasFormat();

        this._isWebGPU = true;
        this._shaderPlatformName = "WEBGPU";

        this._renderingCanvas = canvas as HTMLCanvasElement;
        this._options = options;

        this._mainPassSampleCount = options.antialias ? this._defaultSampleCount : 1;

        this._setupMobileChecks();

        this._sharedInit(this._renderingCanvas);

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
        (this.uniqueId as number) = WebGPUEngine._InstanceId++;
        this._glslangOptions = glslangOptions;
        this._twgslOptions = twgslOptions;
        return this._initGlslang(glslangOptions ?? this._options?.glslangOptions)
            .then((glslang: any) => {
                this._glslang = glslang;
                this._tintWASM = WebGPUEngine.UseTWGSL ? new WebGPUTintWASM() : null;
                return this._tintWASM
                    ? this._tintWASM.initTwgsl(twgslOptions ?? this._options?.twgslOptions).then(() => {
                          return navigator.gpu!.requestAdapter(this._options);
                      })
                    : navigator.gpu!.requestAdapter(this._options);
            })
            .then((adapter: GPUAdapter | undefined) => {
                if (!adapter) {
                    // eslint-disable-next-line no-throw-literal
                    throw "Could not retrieve a WebGPU adapter (adapter is null).";
                } else {
                    this._adapter = adapter!;
                    this._adapterSupportedExtensions = [];
                    this._adapter.features?.forEach((feature) => this._adapterSupportedExtensions.push(feature as WebGPUConstants.FeatureName));
                    this._adapterSupportedLimits = this._adapter.limits;

                    this._adapter.requestAdapterInfo().then((adapterInfo) => {
                        this._adapterInfo = adapterInfo;
                    });

                    const deviceDescriptor = this._options.deviceDescriptor ?? {};
                    const requiredFeatures = deviceDescriptor?.requiredFeatures ?? (this._options.enableAllFeatures ? this._adapterSupportedExtensions : undefined);

                    if (requiredFeatures) {
                        const requestedExtensions = requiredFeatures;
                        const validExtensions: GPUFeatureName[] = [];

                        for (const extension of requestedExtensions) {
                            if (this._adapterSupportedExtensions.indexOf(extension) !== -1) {
                                validExtensions.push(extension);
                            }
                        }

                        deviceDescriptor.requiredFeatures = validExtensions;
                    }

                    if (this._options.setMaximumLimits && !deviceDescriptor.requiredLimits) {
                        deviceDescriptor.requiredLimits = {};
                        for (const name in this._adapterSupportedLimits) {
                            if (name === "minSubgroupSize" || name === "maxSubgroupSize") {
                                // Chrome exposes these limits in "webgpu developer" mode, but these can't be set on the device.
                                continue;
                            }
                            deviceDescriptor.requiredLimits[name] = this._adapterSupportedLimits[name];
                        }
                    }

                    deviceDescriptor.label = `BabylonWebGPUDevice${this.uniqueId}`;

                    return this._adapter.requestDevice(deviceDescriptor);
                }
            })
            .then((device: GPUDevice) => {
                this._device = device;
                this._deviceEnabledExtensions = [];
                this._device.features?.forEach((feature) => this._deviceEnabledExtensions.push(feature as WebGPUConstants.FeatureName));
                this._deviceLimits = device.limits;

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
                        if (this._isDisposed) {
                            return;
                        }
                        this._contextWasLost = true;
                        Logger.Warn("WebGPU context lost. " + info);
                        this.onContextLostObservable.notifyObservers(this);
                        this._restoreEngineAfterContextLost(async () => {
                            const snapshotRenderingMode = this.snapshotRenderingMode;
                            const snapshotRendering = this.snapshotRendering;
                            const disableCacheSamplers = this.disableCacheSamplers;
                            const disableCacheRenderPipelines = this.disableCacheRenderPipelines;
                            const disableCacheBindGroups = this.disableCacheBindGroups;
                            const enableGPUTimingMeasurements = this.enableGPUTimingMeasurements;

                            await this.initAsync(this._glslangOptions ?? this._options?.glslangOptions, this._twgslOptions ?? this._options?.twgslOptions);

                            this.snapshotRenderingMode = snapshotRenderingMode;
                            this.snapshotRendering = snapshotRendering;
                            this.disableCacheSamplers = disableCacheSamplers;
                            this.disableCacheRenderPipelines = disableCacheRenderPipelines;
                            this.disableCacheBindGroups = disableCacheBindGroups;
                            this.enableGPUTimingMeasurements = enableGPUTimingMeasurements;
                            this._currentRenderPass = null;
                        });
                    });
                }
            })
            .then(() => {
                this._bufferManager = new WebGPUBufferManager(this, this._device);
                this._textureHelper = new WebGPUTextureManager(this, this._device, this._glslang, this._tintWASM, this._bufferManager, this._deviceEnabledExtensions);
                this._cacheSampler = new WebGPUCacheSampler(this._device);
                this._cacheBindGroups = new WebGPUCacheBindGroups(this._device, this._cacheSampler, this);
                this._timestampQuery = new WebGPUTimestampQuery(this, this._device, this._bufferManager);
                this._occlusionQuery = (this._device as any).createQuerySet ? new WebGPUOcclusionQuery(this, this._device, this._bufferManager) : (undefined as any);
                this._bundleList = new WebGPUBundleList(this._device);
                this._snapshotRendering = new WebGPUSnapshotRendering(this, this._snapshotRenderingMode, this._bundleList);

                this._ubInvertY = this._bufferManager.createBuffer(
                    new Float32Array([-1, 0]),
                    WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst,
                    "UBInvertY"
                );
                this._ubDontInvertY = this._bufferManager.createBuffer(
                    new Float32Array([1, 0]),
                    WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst,
                    "UBDontInvertY"
                );

                if (this.dbgVerboseLogsForFirstFrames) {
                    if ((this as any)._count === undefined) {
                        (this as any)._count = 0;
                        Logger.Log(["%c frame #" + (this as any)._count + " - begin", "background: #ffff00"]);
                    }
                }

                this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
                this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);

                this._initializeLimits();

                this._emptyVertexBuffer = new VertexBuffer(this, [0], "", {
                    stride: 1,
                    offset: 0,
                    size: 1,
                    label: "EmptyVertexBuffer",
                });

                this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, this._emptyVertexBuffer);

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
                Logger.Error("A fatal error occurred during WebGPU creation/initialization.");
                throw e;
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
            return Tools.LoadBabylonScriptAsync(glslangOptions.jsPath).then(() => {
                return (self as any).glslang(Tools.GetBabylonScriptURL(glslangOptions!.wasmPath!));
            });
        }

        return Promise.reject("gslang is not available.");
    }

    private _initializeLimits(): void {
        // Init caps
        // TODO WEBGPU Real Capability check once limits will be working.

        this._caps = {
            maxTexturesImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage,
            maxVertexTextureImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage,
            maxCombinedTexturesImageUnits: this._deviceLimits.maxSampledTexturesPerShaderStage * 2,
            maxTextureSize: this._deviceLimits.maxTextureDimension2D,
            maxCubemapTextureSize: this._deviceLimits.maxTextureDimension2D,
            maxRenderTextureSize: this._deviceLimits.maxTextureDimension2D,
            maxVertexAttribs: this._deviceLimits.maxVertexAttributes,
            maxVaryingVectors: this._deviceLimits.maxInterStageShaderVariables,
            maxFragmentUniformVectors: Math.floor(this._deviceLimits.maxUniformBufferBindingSize / 4),
            maxVertexUniformVectors: Math.floor(this._deviceLimits.maxUniformBufferBindingSize / 4),
            standardDerivatives: true,
            astc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionASTC) >= 0 ? true : undefined) as any,
            s3tc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined) as any,
            pvrtc: null,
            etc1: null,
            etc2: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionETC2) >= 0 ? true : undefined) as any,
            bptc: this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TextureCompressionBC) >= 0 ? true : undefined,
            maxAnisotropy: 16, // Most implementations support maxAnisotropy values in range between 1 and 16, inclusive. The used value of maxAnisotropy will be clamped to the maximum value that the platform supports.
            uintIndices: true,
            fragmentDepthSupported: true,
            highPrecisionShaderSupported: true,
            colorBufferFloat: true,
            supportFloatTexturesResolve: false, // See https://github.com/gpuweb/gpuweb/issues/3844
            rg11b10ufColorRenderable: this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.RG11B10UFloatRenderable) >= 0,
            textureFloat: true,
            textureFloatLinearFiltering: this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.Float32Filterable) >= 0,
            textureFloatRender: true,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: true,
            textureHalfFloatRender: true,
            textureLOD: true,
            texelFetch: true,
            drawBuffersExtension: true,
            depthTextureExtension: true,
            vertexArrayObject: false,
            instancedArrays: true,
            timerQuery:
                typeof BigUint64Array !== "undefined" && this._deviceEnabledExtensions.indexOf(WebGPUConstants.FeatureName.TimestampQuery) !== -1 ? (true as any) : undefined,
            supportOcclusionQuery: typeof BigUint64Array !== "undefined",
            canUseTimestampForTimerQuery: true,
            multiview: false,
            oculusMultiview: false,
            parallelShaderCompile: undefined,
            blendMinMax: true,
            maxMSAASamples: 4, // the spec only supports values of 1 and 4
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: true,
            supportSRGBBuffers: true,
            supportTransformFeedbacks: false,
            textureMaxLevel: true,
            texture2DArrayMaxLayerCount: this._deviceLimits.maxTextureArrayLayers,
            disableMorphTargetTexture: false,
        };

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
            forceVertexBufferStrideAndOffsetMultiple4Bytes: true,
            _collectUbosUpdatedInFrame: false,
        };
    }

    private _initializeContextAndSwapChain(): void {
        if (!this._renderingCanvas) {
            // eslint-disable-next-line no-throw-literal
            throw "The rendering canvas has not been set!";
        }
        this._context = this._renderingCanvas.getContext("webgpu") as unknown as GPUCanvasContext;
        this._configureContext();
        this._colorFormat = this._options.swapChainFormat!;
        this._mainRenderPassWrapper.colorAttachmentGPUTextures = [new WebGPUHardwareTexture()];
        this._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.format = this._colorFormat;
        this._setColorFormat(this._mainRenderPassWrapper);
    }

    // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
    private _initializeMainAttachments(): void {
        if (!this._bufferManager) {
            return;
        }

        this.flushFramebuffer();

        this._mainTextureExtends = {
            width: this.getRenderWidth(true),
            height: this.getRenderHeight(true),
            depthOrArrayLayers: 1,
        };

        const bufferDataUpdate = new Float32Array([this.getRenderHeight(true)]);

        this._bufferManager.setSubData(this._ubInvertY, 4, bufferDataUpdate);
        this._bufferManager.setSubData(this._ubDontInvertY, 4, bufferDataUpdate);

        let mainColorAttachments: GPURenderPassColorAttachment[];

        if (this._options.antialias) {
            const mainTextureDescriptor: GPUTextureDescriptor = {
                label: `Texture_MainColor_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}_antialiasing`,
                size: this._mainTextureExtends,
                mipLevelCount: 1,
                sampleCount: this._mainPassSampleCount,
                dimension: WebGPUConstants.TextureDimension.E2d,
                format: this._options.swapChainFormat!,
                usage: WebGPUConstants.TextureUsage.RenderAttachment,
            };

            if (this._mainTexture) {
                this._textureHelper.releaseTexture(this._mainTexture);
            }
            this._mainTexture = this._device.createTexture(mainTextureDescriptor);
            mainColorAttachments = [
                {
                    view: this._mainTexture.createView({
                        label: "TextureView_MainColor_antialiasing",
                        dimension: WebGPUConstants.TextureDimension.E2d,
                        format: this._options.swapChainFormat!,
                        mipLevelCount: 1,
                        arrayLayerCount: 1,
                    }),
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
        this._setColorFormat(this._mainRenderPassWrapper);

        const depthTextureDescriptor: GPUTextureDescriptor = {
            label: `Texture_MainDepthStencil_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}`,
            size: this._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: this._mainPassSampleCount,
            dimension: WebGPUConstants.TextureDimension.E2d,
            format: this._mainRenderPassWrapper.depthTextureFormat,
            usage: WebGPUConstants.TextureUsage.RenderAttachment,
        };

        if (this._depthTexture) {
            this._textureHelper.releaseTexture(this._depthTexture);
        }
        this._depthTexture = this._device.createTexture(depthTextureDescriptor);
        const mainDepthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this._depthTexture.createView({
                label: `TextureView_MainDepthStencil_${this._mainTextureExtends.width}x${this._mainTextureExtends.height}`,
                dimension: WebGPUConstants.TextureDimension.E2d,
                format: this._depthTexture.format,
                mipLevelCount: 1,
                arrayLayerCount: 1,
            }),

            depthClearValue: this._clearDepthValue,
            depthLoadOp: WebGPUConstants.LoadOp.Clear,
            depthStoreOp: WebGPUConstants.StoreOp.Store,
            stencilClearValue: this._clearStencilValue,
            stencilLoadOp: !this.isStencilEnable ? undefined : WebGPUConstants.LoadOp.Clear,
            stencilStoreOp: !this.isStencilEnable ? undefined : WebGPUConstants.StoreOp.Store,
        };

        this._mainRenderPassWrapper.renderPassDescriptor = {
            label: "MainRenderPass",
            colorAttachments: mainColorAttachments,
            depthStencilAttachment: mainDepthAttachment,
        };
    }

    private _configureContext(): void {
        this._context.configure({
            device: this._device,
            format: this._options.swapChainFormat!,
            usage: WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopySrc,
            alphaMode: this.premultipliedAlpha ? WebGPUConstants.CanvasAlphaMode.Premultiplied : WebGPUConstants.CanvasAlphaMode.Opaque,
        });
    }

    protected _rebuildBuffers(): void {
        super._rebuildBuffers();

        for (const storageBuffer of this._storageBuffers) {
            // The buffer can already be rebuilt by the call to _rebuildGeometries(), which recreates the storage buffers for the ComputeShaderParticleSystem
            if ((storageBuffer.getBuffer() as WebGPUDataBuffer).engineId !== this.uniqueId) {
                storageBuffer._rebuild();
            }
        }
    }

    protected _restoreEngineAfterContextLost(initEngine: () => void) {
        WebGPUCacheRenderPipelineTree.ResetCache();
        WebGPUCacheBindGroups.ResetCache();

        // Clear the draw wrappers and material contexts
        const cleanScenes = (scenes: Scene[]) => {
            for (const scene of scenes) {
                for (const mesh of scene.meshes) {
                    const subMeshes = mesh.subMeshes;
                    if (!subMeshes) {
                        continue;
                    }
                    for (const subMesh of subMeshes) {
                        subMesh._drawWrappers = [];
                    }
                }

                for (const material of scene.materials) {
                    material._materialContext?.reset();
                }
            }
        };

        cleanScenes(this.scenes);
        cleanScenes(this._virtualScenes);

        // The leftOver uniform buffers are removed from the list because they will be recreated when we rebuild the effects
        const uboList: UniformBuffer[] = [];
        for (const uniformBuffer of this._uniformBuffers) {
            if (uniformBuffer.name.indexOf("leftOver") < 0) {
                uboList.push(uniformBuffer);
            }
        }
        this._uniformBuffers = uboList;

        super._restoreEngineAfterContextLost(initEngine);
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
                Logger.Log(["frame #" + (this as any)._count + " - setSize -", width, height]);
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

    private _currentPassIsMainPass() {
        return this._currentRenderTarget === null;
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
    public _getCurrentRenderPassWrapper() {
        return this._currentRenderTarget ? this._rttRenderPassWrapper : this._mainRenderPassWrapper;
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
    private _viewportsCurrent: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };

    private _mustUpdateViewport(): boolean {
        const x = this._viewportCached.x,
            y = this._viewportCached.y,
            w = this._viewportCached.z,
            h = this._viewportCached.w;

        const update = this._viewportsCurrent.x !== x || this._viewportsCurrent.y !== y || this._viewportsCurrent.w !== w || this._viewportsCurrent.h !== h;

        if (update) {
            this._viewportsCurrent.x = this._viewportCached.x;
            this._viewportsCurrent.y = this._viewportCached.y;
            this._viewportsCurrent.w = this._viewportCached.z;
            this._viewportsCurrent.h = this._viewportCached.w;
        }

        return update;
    }

    private _applyViewport(bundleList: Nullable<WebGPUBundleList>): void {
        const x = Math.floor(this._viewportCached.x);
        const w = Math.floor(this._viewportCached.z);
        const h = Math.floor(this._viewportCached.w);

        let y = Math.floor(this._viewportCached.y);

        if (!this._currentRenderTarget) {
            y = this.getRenderHeight(true) - y - h;
        }

        if (bundleList) {
            bundleList.addItem(new WebGPURenderItemViewport(x, y, w, h));
        } else {
            this._getCurrentRenderPass().setViewport(x, y, w, h, 0, 1);
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log([
                    "frame #" + (this as any)._count + " - viewport applied - (",
                    this._viewportCached.x,
                    this._viewportCached.y,
                    this._viewportCached.z,
                    this._viewportCached.w,
                    ") current pass is main pass=" + this._currentPassIsMainPass(),
                ]);
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

    private _scissorsCurrent: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };
    protected _scissorCached = { x: 0, y: 0, z: 0, w: 0 };

    private _mustUpdateScissor(): boolean {
        const x = this._scissorCached.x,
            y = this._scissorCached.y,
            w = this._scissorCached.z,
            h = this._scissorCached.w;

        const update = this._scissorsCurrent.x !== x || this._scissorsCurrent.y !== y || this._scissorsCurrent.w !== w || this._scissorsCurrent.h !== h;

        if (update) {
            this._scissorsCurrent.x = this._scissorCached.x;
            this._scissorsCurrent.y = this._scissorCached.y;
            this._scissorsCurrent.w = this._scissorCached.z;
            this._scissorsCurrent.h = this._scissorCached.w;
        }

        return update;
    }

    private _applyScissor(bundleList: Nullable<WebGPUBundleList>): void {
        const y = this._currentRenderTarget ? this._scissorCached.y : this.getRenderHeight() - this._scissorCached.w - this._scissorCached.y;

        if (bundleList) {
            bundleList.addItem(new WebGPURenderItemScissor(this._scissorCached.x, y, this._scissorCached.z, this._scissorCached.w));
        } else {
            this._getCurrentRenderPass().setScissorRect(this._scissorCached.x, y, this._scissorCached.z, this._scissorCached.w);
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log([
                    "frame #" + (this as any)._count + " - scissor applied - (",
                    this._scissorCached.x,
                    this._scissorCached.y,
                    this._scissorCached.z,
                    this._scissorCached.w,
                    ") current pass is main pass=" + this._currentPassIsMainPass(),
                ]);
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
        this._scissorCached.x = this._scissorCached.y = this._scissorCached.z = this._scissorCached.w = 0;
        this._scissorsCurrent.x = this._scissorsCurrent.y = this._scissorsCurrent.w = this._scissorsCurrent.h = 0;
    }

    private _stencilRefsCurrent = -1;

    private _mustUpdateStencilRef(): boolean {
        const update = this._stencilStateComposer.funcRef !== this._stencilRefsCurrent;
        if (update) {
            this._stencilRefsCurrent = this._stencilStateComposer.funcRef;
        }
        return update;
    }

    private _applyStencilRef(bundleList: Nullable<WebGPUBundleList>): void {
        if (bundleList) {
            bundleList.addItem(new WebGPURenderItemStencilRef(this._stencilStateComposer.funcRef ?? 0));
        } else {
            this._getCurrentRenderPass().setStencilReference(this._stencilStateComposer.funcRef ?? 0);
        }
    }

    private _blendColorsCurrent: Array<Nullable<number>> = [null, null, null, null];

    private _mustUpdateBlendColor(): boolean {
        const colorBlend = this._alphaState._blendConstants;

        const update =
            colorBlend[0] !== this._blendColorsCurrent[0] ||
            colorBlend[1] !== this._blendColorsCurrent[1] ||
            colorBlend[2] !== this._blendColorsCurrent[2] ||
            colorBlend[3] !== this._blendColorsCurrent[3];

        if (update) {
            this._blendColorsCurrent[0] = colorBlend[0];
            this._blendColorsCurrent[1] = colorBlend[1];
            this._blendColorsCurrent[2] = colorBlend[2];
            this._blendColorsCurrent[3] = colorBlend[3];
        }

        return update;
    }

    private _applyBlendColor(bundleList: Nullable<WebGPUBundleList>): void {
        if (bundleList) {
            bundleList.addItem(new WebGPURenderItemBlendColor(this._alphaState._blendConstants.slice()));
        } else {
            this._getCurrentRenderPass().setBlendConstant(this._alphaState._blendConstants as GPUColor);
        }
    }

    private _resetRenderPassStates() {
        this._viewportsCurrent.x = this._viewportsCurrent.y = this._viewportsCurrent.w = this._viewportsCurrent.h = 0;
        this._scissorsCurrent.x = this._scissorsCurrent.y = this._scissorsCurrent.w = this._scissorsCurrent.h = 0;
        this._stencilRefsCurrent = -1;
        this._blendColorsCurrent[0] = this._blendColorsCurrent[1] = this._blendColorsCurrent[2] = this._blendColorsCurrent[3] = null;
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
                Logger.Log(["frame #" + (this as any)._count + " - clear - backBuffer=", backBuffer, " depth=", depth, " stencil=", stencil, " scissor is active=", hasScissor]);
            }
        }

        // We need to recreate the render pass so that the new parameters for clear color / depth / stencil are taken into account
        if (this._currentRenderTarget) {
            if (hasScissor) {
                if (!this._currentRenderPass) {
                    this._startRenderTargetRenderPass(this._currentRenderTarget!, false, backBuffer ? color : null, depth, stencil);
                }
                this._applyScissor(!this.compatibilityMode ? this._bundleList : null);
                this._clearFullQuad(backBuffer ? color : null, depth, stencil);
            } else {
                if (this._currentRenderPass) {
                    this._endCurrentRenderPass();
                }
                this._startRenderTargetRenderPass(this._currentRenderTarget!, true, backBuffer ? color : null, depth, stencil);
            }
        } else {
            if (!this._currentRenderPass || !hasScissor) {
                this._startMainRenderPass(!hasScissor, backBuffer ? color : null, depth, stencil);
            }
            if (hasScissor) {
                this._applyScissor(!this.compatibilityMode ? this._bundleList : null);
                this._clearFullQuad(backBuffer ? color : null, depth, stencil);
            }
        }
    }

    private _clearFullQuad(clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
        const renderPass = !this.compatibilityMode ? null : this._getCurrentRenderPass();

        this._clearQuad.setColorFormat(this._colorFormat);
        this._clearQuad.setDepthStencilFormat(this._depthTextureFormat);
        this._clearQuad.setMRTAttachments(
            this._cacheRenderPipeline.mrtAttachments ?? [],
            this._cacheRenderPipeline.mrtTextureArray ?? [],
            this._cacheRenderPipeline.mrtTextureCount
        );

        if (!this.compatibilityMode) {
            this._bundleList.addItem(new WebGPURenderItemStencilRef(this._clearStencilValue));
        } else {
            renderPass!.setStencilReference(this._clearStencilValue);
        }

        const bundle = this._clearQuad.clear(renderPass, clearColor, clearDepth, clearStencil, this.currentSampleCount);

        if (!this.compatibilityMode) {
            this._bundleList.addBundle(bundle!);
            this._applyStencilRef(this._bundleList);
            this._reportDrawCall();
        } else {
            this._applyStencilRef(null);
        }
    }

    //------------------------------------------------------------------------------
    //                              Vertex/Index/Storage Buffers
    //------------------------------------------------------------------------------

    /**
     * Creates a vertex buffer
     * @param data the data or the size for the vertex buffer
     * @param _updatable whether the buffer should be created as updatable
     * @param label defines the label of the buffer (for debug purpose)
     * @returns the new buffer
     */
    public createVertexBuffer(data: DataArray | number, _updatable?: boolean, label?: string): DataBuffer {
        let view: ArrayBufferView | number;

        if (data instanceof Array) {
            view = new Float32Array(data);
        } else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        } else {
            view = data;
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Vertex | WebGPUConstants.BufferUsage.CopyDst, label);
        return dataBuffer;
    }

    /**
     * Creates a vertex buffer
     * @param data the data for the dynamic vertex buffer
     * @param label defines the label of the buffer (for debug purpose)
     * @returns the new buffer
     */
    public createDynamicVertexBuffer(data: DataArray, label?: string): DataBuffer {
        return this.createVertexBuffer(data, undefined, label);
    }

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @param _updatable defines if the index buffer must be updatable
     * @param label defines the label of the buffer (for debug purpose)
     * @returns a new buffer
     */
    public createIndexBuffer(indices: IndicesArray, _updatable?: boolean, label?: string): DataBuffer {
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

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Index | WebGPUConstants.BufferUsage.CopyDst, label);
        dataBuffer.is32Bits = is32Bits;
        return dataBuffer;
    }

    /**
     * Update a dynamic index buffer
     * @param indexBuffer defines the target index buffer
     * @param indices defines the data to update
     * @param offset defines the offset in the target index buffer where update should start
     */
    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        const gpuBuffer = indexBuffer as WebGPUDataBuffer;

        let view: ArrayBufferView;
        if (indexBuffer.is32Bits) {
            view = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
        } else {
            view = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
        }

        this._bufferManager.setSubData(gpuBuffer, offset, view);
    }

    /**
     * Updates a dynamic vertex buffer.
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
            } else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            } else {
                view = data;
            }
            byteLength = view.byteLength;
        } else {
            if (data instanceof Array) {
                view = new Float32Array(data);
            } else if (data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
            } else {
                view = data;
            }
        }

        this._bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
    }

    /**
     * @internal
     */
    public _createBuffer(data: DataArray | number, creationFlags: number, label?: string): DataBuffer {
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

        return this._bufferManager.createBuffer(view, flags, label);
    }

    /**
     * @internal
     */
    public bindBuffersDirectly(): void {
        // eslint-disable-next-line no-throw-literal
        throw "Not implemented on WebGPU";
    }

    /**
     * @internal
     */
    public updateAndBindInstancesBuffer(): void {
        // eslint-disable-next-line no-throw-literal
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
    //                              Uniform Buffers
    //------------------------------------------------------------------------------

    /**
     * Create an uniform buffer
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @param label defines a name for the buffer (for debugging purpose)
     * @returns the webGL uniform buffer
     */
    public createUniformBuffer(elements: FloatArray, label?: string): DataBuffer {
        let view: Float32Array;
        if (elements instanceof Array) {
            view = new Float32Array(elements);
        } else {
            view = elements;
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst, label);
        return dataBuffer;
    }

    /**
     * Create a dynamic uniform buffer (no different from a non dynamic uniform buffer in WebGPU)
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     * @param elements defines the content of the uniform buffer
     * @param label defines a name for the buffer (for debugging purpose)
     * @returns the webGL uniform buffer
     */
    public createDynamicUniformBuffer(elements: FloatArray, label?: string): DataBuffer {
        return this.createUniformBuffer(elements, label);
    }

    /**
     * Update an existing uniform buffer
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
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
     * Bind a buffer to the current draw context
     * @param buffer defines the buffer to bind
     * @param _location not used in WebGPU
     * @param name Name of the uniform variable to bind
     */
    public bindUniformBufferBase(buffer: DataBuffer, _location: number, name: string): void {
        this._currentDrawContext.setBuffer(name, buffer as WebGPUDataBuffer);
    }

    /**
     * Unused in WebGPU
     */
    public bindUniformBlock(): void {}

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
        baseName: string | (IShaderPath & { vertexToken?: string; fragmentToken?: string }),
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
        const vertex = typeof baseName === "string" ? baseName : baseName.vertexToken || baseName.vertexSource || baseName.vertexElement || baseName.vertex;
        const fragment = typeof baseName === "string" ? baseName : baseName.fragmentToken || baseName.fragmentSource || baseName.fragmentElement || baseName.fragment;
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
        shaderLanguage: ShaderLanguage,
        disableUniformityAnalysisInVertex: boolean,
        disableUniformityAnalysisInFragment: boolean
    ): IWebGPURenderPipelineStageDescriptor {
        if (this._tintWASM && shaderLanguage === ShaderLanguage.GLSL) {
            vertexShader = this._tintWASM.convertSpirV2WGSL(vertexShader as Uint32Array, disableUniformityAnalysisInVertex);
            fragmentShader = this._tintWASM.convertSpirV2WGSL(fragmentShader as Uint32Array, disableUniformityAnalysisInFragment);
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
        const disableUniformityAnalysisInVertex = vertexCode.indexOf(disableUniformityAnalysisMarker) >= 0;
        const disableUniformityAnalysisInFragment = fragmentCode.indexOf(disableUniformityAnalysisMarker) >= 0;

        const vertexShader = shaderLanguage === ShaderLanguage.GLSL ? this._compileRawShaderToSpirV(vertexCode, "vertex") : vertexCode;
        const fragmentShader = shaderLanguage === ShaderLanguage.GLSL ? this._compileRawShaderToSpirV(fragmentCode, "fragment") : fragmentCode;

        return this._createPipelineStageDescriptor(vertexShader, fragmentShader, shaderLanguage, disableUniformityAnalysisInVertex, disableUniformityAnalysisInFragment);
    }

    private _compilePipelineStageDescriptor(
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        shaderLanguage: ShaderLanguage
    ): IWebGPURenderPipelineStageDescriptor {
        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const disableUniformityAnalysisInVertex = vertexCode.indexOf(disableUniformityAnalysisMarker) >= 0;
        const disableUniformityAnalysisInFragment = fragmentCode.indexOf(disableUniformityAnalysisMarker) >= 0;

        const shaderVersion = "#version 450\n";
        const vertexShader =
            shaderLanguage === ShaderLanguage.GLSL ? this._compileShaderToSpirV(vertexCode, "vertex", defines, shaderVersion) : this._getWGSLShader(vertexCode, "vertex", defines);
        const fragmentShader =
            shaderLanguage === ShaderLanguage.GLSL
                ? this._compileShaderToSpirV(fragmentCode, "fragment", defines, shaderVersion)
                : this._getWGSLShader(fragmentCode, "fragment", defines);

        const program = this._createPipelineStageDescriptor(vertexShader, fragmentShader, shaderLanguage, disableUniformityAnalysisInVertex, disableUniformityAnalysisInFragment);

        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    /**
     * @internal
     */
    public createRawShaderProgram(): WebGLProgram {
        // eslint-disable-next-line no-throw-literal
        throw "Not available on WebGPU";
    }

    /**
     * @internal
     */
    public createShaderProgram(): WebGLProgram {
        // eslint-disable-next-line no-throw-literal
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
            Logger.Log(["defines", defines]);
            Logger.Log(vertexSourceCode);
            Logger.Log(fragmentSourceCode);
            Logger.Log("***********************************************");
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

        if (!DrawWrapper.IsWrapper(effect)) {
            this._currentEffect = effect;
            this._currentMaterialContext = this._defaultMaterialContext;
            this._currentDrawContext = this._defaultDrawContext;
            this._counters.numEnableEffects++;
            if (this.dbgLogIfNotDrawWrapper) {
                Logger.Warn(
                    `enableEffect has been called with an Effect and not a Wrapper! effect.uniqueId=${effect.uniqueId}, effect.name=${effect.name}, effect.name.vertex=${typeof effect.name === "string" ? "" : effect.name.vertex}, effect.name.fragment=${typeof effect.name === "string" ? "" : effect.name.fragment}`,
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
                Logger.Log(["drawWrapper=", effect]);
                // eslint-disable-next-line no-throw-literal
                throw "Invalid call to enableEffect: the effect property is empty!";
            }
            return;
        } else {
            this._currentEffect = effect.effect;
            this._currentMaterialContext = effect.materialContext as WebGPUMaterialContext;
            this._currentDrawContext = effect.drawContext as WebGPUDrawContext;
            this._counters.numEnableDrawWrapper++;
            if (!this._currentMaterialContext) {
                Logger.Log(["drawWrapper=", effect]);
                // eslint-disable-next-line no-throw-literal
                throw `Invalid call to enableEffect: the materialContext property is empty!`;
            }
        }

        this._stencilStateComposer.stencilMaterial = undefined;

        this._forceEnableEffect = false;

        if (this._currentEffect!.onBind) {
            this._currentEffect!.onBind(this._currentEffect!);
        }
        if (this._currentEffect!._onBindObservable) {
            this._currentEffect!._onBindObservable.notifyObservers(this._currentEffect!);
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
            fullOptions.label = options.label;
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
        const depth = (<{ width: number; height: number; depth?: number; layers?: number }>size).depth || 0;
        const layers = (<{ width: number; height: number; depth?: number; layers?: number }>size).layers || 0;

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.depth = depth || layers;
        texture.isReady = true;
        texture.samples = fullOptions.samples;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        texture.format = fullOptions.format;
        texture.is2DArray = layers > 0;
        texture.is3D = depth > 0;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._useSRGBBuffer = fullOptions.useSRGBBuffer;
        texture.label = fullOptions.label;

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
                texture.format = texture.format !== -1 ? texture.format : format ?? Constants.TEXTUREFORMAT_RGBA;
                texture.type = texture.type !== -1 ? texture.type : Constants.TEXTURETYPE_UNSIGNED_BYTE;
                texture._creationFlags = creationFlags ?? 0;

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
    public wrapWebGPUTexture(texture: GPUTexture): InternalTexture {
        const hardwareTexture = new WebGPUHardwareTexture(texture);
        const internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.isReady = true;
        return internalTexture;
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @returns the babylon internal texture
     */
    public wrapWebGLTexture(): InternalTexture {
        throw new Error("wrapWebGLTexture is not supported, use wrapWebGPUTexture instead.");
    }

    public generateMipMapsForCubemap(texture: InternalTexture) {
        if (texture.generateMipMaps) {
            const gpuTexture = texture._hardwareTexture?.underlyingResource;

            if (!gpuTexture) {
                this._textureHelper.createGPUTextureForInternalTexture(texture);
            }

            this._generateMipmaps(texture);
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
                    Logger.Log(["frame #" + (this as any)._count + " - _setTexture called with a null _currentEffect! texture=", texture]);
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
        this._generateMipmaps(texture);
    }

    /**
     * @internal
     */
    public _generateMipmaps(texture: InternalTexture, commandEncoder?: GPUCommandEncoder) {
        commandEncoder = commandEncoder ?? this._renderEncoder;

        const gpuHardwareTexture = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        if (!gpuHardwareTexture) {
            return;
        }

        if (commandEncoder === this._renderEncoder) {
            // We must close the current pass (if any) because we are going to use the render encoder to generate the mipmaps (so, we are going to create a new render pass)
            this._endCurrentRenderPass();
        }

        const format = (texture._hardwareTexture as WebGPUHardwareTexture).format;
        const mipmapCount = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log(
                    "frame #" +
                        (this as any)._count +
                        " - generate mipmaps - width=" +
                        texture.width +
                        ", height=" +
                        texture.height +
                        ", isCube=" +
                        texture.isCube +
                        ", command encoder=" +
                        (commandEncoder === this._renderEncoder ? "render" : "copy")
                );
            }
        }

        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuHardwareTexture, format, mipmapCount, commandEncoder);
        } else {
            this._textureHelper.generateMipmaps(gpuHardwareTexture, format, mipmapCount, 0, texture.is3D, commandEncoder);
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
            this._generateMipmaps(texture);
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

        if (image instanceof HTMLImageElement) {
            // eslint-disable-next-line no-throw-literal
            throw "WebGPU engine: HTMLImageElement not supported in _uploadImageToTexture!";
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
        const renderPassWrapper = this._getCurrentRenderPassWrapper();
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
        this._endCurrentRenderPass();

        this._snapshotRendering.endFrame();

        this._timestampQuery.endFrame(this._renderEncoder);
        this._timestampIndex = 0;

        this.flushFramebuffer();

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
                    Logger.Log(["frame #" + (this as any)._count + " - updated ubos -", list.join(", ")]);
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
                Logger.Log(["%c frame #" + (this as any)._count + " - end", "background: #ffff00"]);
            }
            if ((this as any)._count < this.dbgVerboseLogsNumFrames) {
                (this as any)._count++;
                if ((this as any)._count !== this.dbgVerboseLogsNumFrames) {
                    Logger.Log(["%c frame #" + (this as any)._count + " - begin", "background: #ffff00"]);
                }
            }
        }
    }

    /**
     * Force a WebGPU flush (ie. a flush of all waiting commands)
     */
    public flushFramebuffer(): void {
        // we need to end the current render pass (main or rtt) if any as we are not allowed to submit the command buffers when being in a pass
        this._endCurrentRenderPass();

        this._commandBuffers[0] = this._uploadEncoder.finish();
        this._commandBuffers[1] = this._renderEncoder.finish();

        this._device.queue.submit(this._commandBuffers);

        this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
        this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);

        this._timestampQuery.startFrame(this._uploadEncoder);

        this._textureHelper.setCommandEncoder(this._uploadEncoder);

        this._bundleList.reset();
    }

    /** @internal */
    public _currentFrameBufferIsDefaultFrameBuffer() {
        return this._currentPassIsMainPass();
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
        this._endCurrentRenderPass();

        const rtWrapper = renderTargetWrapper as WebGPURenderTargetWrapper;

        const depthStencilTexture = rtWrapper._depthStencilTexture;
        const gpuDepthStencilWrapper = depthStencilTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
        const gpuDepthStencilTexture = gpuDepthStencilWrapper?.underlyingResource as Nullable<GPUTexture>;
        const gpuDepthStencilMSAATexture = gpuDepthStencilWrapper?.getMSAATexture();

        const depthTextureView = gpuDepthStencilTexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
        const depthMSAATextureView = gpuDepthStencilMSAATexture?.createView(this._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
        const depthTextureHasStencil = gpuDepthStencilWrapper ? WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format) : false;

        const colorAttachments: (GPURenderPassColorAttachment | null)[] = [];

        if (this.useReverseDepthBuffer) {
            this.setDepthFunctionToGreaterOrEqual();
        }

        const clearColorForIntegerRT = tempColor4;
        if (clearColor) {
            clearColorForIntegerRT.r = clearColor.r * 255;
            clearColorForIntegerRT.g = clearColor.g * 255;
            clearColorForIntegerRT.b = clearColor.b * 255;
            clearColorForIntegerRT.a = clearColor.a * 255;
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
                    const gpuMSAATexture = gpuMRTWrapper.getMSAATexture(i);

                    const layerIndex = rtWrapper.layerIndices?.[i] ?? 0;
                    const faceIndex = rtWrapper.faceIndices?.[i] ?? 0;
                    const viewDescriptor = {
                        ...this._rttRenderPassWrapper.colorAttachmentViewDescriptor!,
                        dimension: mrtTexture.is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
                        format: gpuMRTWrapper.format,
                        baseArrayLayer: mrtTexture.isCube ? layerIndex * 6 + faceIndex : mrtTexture.is3D ? 0 : layerIndex,
                    };
                    const msaaViewDescriptor = {
                        ...this._rttRenderPassWrapper.colorAttachmentViewDescriptor!,
                        dimension: mrtTexture.is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
                        format: gpuMRTWrapper.format,
                        baseArrayLayer: 0,
                    };
                    const isRTInteger = mrtTexture.type === Constants.TEXTURETYPE_UNSIGNED_INTEGER || mrtTexture.type === Constants.TEXTURETYPE_UNSIGNED_SHORT;

                    const colorTextureView = gpuMRTTexture.createView(viewDescriptor);
                    const colorMSAATextureView = gpuMSAATexture?.createView(msaaViewDescriptor);

                    colorAttachments.push({
                        view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                        resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                        depthSlice: mrtTexture.is3D ? layerIndex : undefined,
                        clearValue: index !== 0 && mustClearColor ? (isRTInteger ? clearColorForIntegerRT : clearColor) : undefined,
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

                let depthSlice: number | undefined = undefined;

                if (rtWrapper.is3D) {
                    depthSlice = this._rttRenderPassWrapper.colorAttachmentViewDescriptor!.baseArrayLayer;
                    this._rttRenderPassWrapper.colorAttachmentViewDescriptor!.baseArrayLayer = 0;
                }

                const gpuMSAATexture = gpuWrapper.getMSAATexture();
                const colorTextureView = gpuTexture.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
                const colorMSAATextureView = gpuMSAATexture?.createView(this._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
                const isRTInteger = internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_INTEGER || internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_SHORT;

                colorAttachments.push({
                    view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                    resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                    depthSlice,
                    clearValue: mustClearColor ? (isRTInteger ? clearColorForIntegerRT : clearColor) : undefined,
                    loadOp: mustClearColor ? WebGPUConstants.LoadOp.Clear : WebGPUConstants.LoadOp.Load,
                    storeOp: WebGPUConstants.StoreOp.Store,
                });
            } else {
                colorAttachments.push(null);
            }
        }

        this._debugPushGroup?.("render target pass" + (renderTargetWrapper.label ? " (" + renderTargetWrapper.label + ")" : ""), 1);

        this._rttRenderPassWrapper.renderPassDescriptor = {
            label: (renderTargetWrapper.label ?? "RTT") + "RenderPass",
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
        this._timestampQuery.startPass(this._rttRenderPassWrapper.renderPassDescriptor, this._timestampIndex);
        this._currentRenderPass = this._renderEncoder.beginRenderPass(this._rttRenderPassWrapper.renderPassDescriptor);

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                const internalTexture = rtWrapper.texture!;
                Logger.Log([
                    "frame #" +
                        (this as any)._count +
                        " - render target begin pass - rtt name=" +
                        renderTargetWrapper.label +
                        ", internalTexture.uniqueId=" +
                        internalTexture.uniqueId +
                        ", width=" +
                        internalTexture.width +
                        ", height=" +
                        internalTexture.height +
                        ", setClearStates=" +
                        setClearStates,
                    "renderPassDescriptor=",
                    this._rttRenderPassWrapper.renderPassDescriptor,
                ]);
            }
        }

        this._debugFlushPendingCommands?.();

        this._resetRenderPassStates();

        if (!gpuDepthStencilWrapper || !WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format)) {
            this._stencilStateComposer.enabled = false;
        }
    }

    private _startMainRenderPass(setClearStates: boolean, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
        this._endCurrentRenderPass();

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

        const swapChainTexture = this._context.getCurrentTexture();
        this._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.set(swapChainTexture);

        // Resolve in case of MSAA
        if (this._options.antialias) {
            viewDescriptorSwapChainAntialiasing.format = swapChainTexture.format;
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.resolveTarget = swapChainTexture.createView(viewDescriptorSwapChainAntialiasing);
        } else {
            viewDescriptorSwapChain.format = swapChainTexture.format;
            this._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.view = swapChainTexture.createView(viewDescriptorSwapChain);
        }

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log([
                    "frame #" + (this as any)._count + " - main begin pass - texture width=" + (this._mainTextureExtends as any).width,
                    " height=" + (this._mainTextureExtends as any).height + ", setClearStates=" + setClearStates,
                    "renderPassDescriptor=",
                    this._mainRenderPassWrapper.renderPassDescriptor,
                ]);
            }
        }

        this._debugPushGroup?.("main pass", 0);

        this._timestampQuery.startPass(this._mainRenderPassWrapper.renderPassDescriptor!, this._timestampIndex);
        this._currentRenderPass = this._renderEncoder.beginRenderPass(this._mainRenderPassWrapper.renderPassDescriptor!);

        this._setDepthTextureFormat(this._mainRenderPassWrapper);
        this._setColorFormat(this._mainRenderPassWrapper);

        this._debugFlushPendingCommands?.();

        this._resetRenderPassStates();

        if (!this._isStencilEnable) {
            this._stencilStateComposer.enabled = false;
        }
    }

    /** @internal */
    public _endCurrentRenderPass(): number {
        if (!this._currentRenderPass) {
            return 0;
        }

        const currentPassIndex = this._currentPassIsMainPass() ? 2 : 1;

        if (!this._snapshotRendering.endRenderPass(this._currentRenderPass) && !this.compatibilityMode) {
            this._bundleList.run(this._currentRenderPass);
            this._bundleList.reset();
        }
        this._currentRenderPass.end();

        this._timestampQuery.endPass(
            this._timestampIndex,
            (this._currentRenderTarget && (this._currentRenderTarget as WebGPURenderTargetWrapper).gpuTimeInFrame
                ? (this._currentRenderTarget as WebGPURenderTargetWrapper).gpuTimeInFrame
                : this.gpuTimeInFrameForMainPass) as WebGPUPerfCounter
        );
        this._timestampIndex += 2;

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log(
                    "frame #" +
                        (this as any)._count +
                        " - " +
                        (currentPassIndex === 2 ? "main" : "render target") +
                        " end pass" +
                        (currentPassIndex === 1 ? " - internalTexture.uniqueId=" + this._currentRenderTarget?.texture?.uniqueId : "")
                );
            }
        }
        this._debugPopGroup?.(0);
        this._currentRenderPass = null;

        return currentPassIndex;
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
        } else {
            this._endCurrentRenderPass();
        }
        this._currentRenderTarget = texture;

        const depthStencilTexture = this._currentRenderTarget._depthStencilTexture;

        this._rttRenderPassWrapper.colorAttachmentGPUTextures[0] = hardwareTexture;
        this._rttRenderPassWrapper.depthTextureFormat = depthStencilTexture ? WebGPUTextureHelper.GetWebGPUTextureFormat(-1, depthStencilTexture.format) : undefined;

        this._setDepthTextureFormat(this._rttRenderPassWrapper);
        this._setColorFormat(this._rttRenderPassWrapper);

        this._rttRenderPassWrapper.colorAttachmentViewDescriptor = {
            format: this._colorFormat as GPUTextureFormat,
            dimension: texture.is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: texture.isCube ? layer * 6 + faceIndex : layer,
            baseMipLevel: lodLevel,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All,
        };

        this._rttRenderPassWrapper.depthAttachmentViewDescriptor = {
            format: this._depthTextureFormat!,
            dimension: depthStencilTexture && depthStencilTexture.is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: 1,
            baseArrayLayer: depthStencilTexture ? (depthStencilTexture.isCube ? layer * 6 + faceIndex : layer) : 0,
            baseMipLevel: 0,
            arrayLayerCount: 1,
            aspect: WebGPUConstants.TextureAspect.All,
        };

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log([
                    "frame #" +
                        (this as any)._count +
                        " - bindFramebuffer - rtt name=" +
                        texture.label +
                        ", internalTexture.uniqueId=" +
                        texture.texture?.uniqueId +
                        ", face=" +
                        faceIndex +
                        ", lodLevel=" +
                        lodLevel +
                        ", layer=" +
                        layer,
                    "colorAttachmentViewDescriptor=",
                    this._rttRenderPassWrapper.colorAttachmentViewDescriptor,
                    "depthAttachmentViewDescriptor=",
                    this._rttRenderPassWrapper.depthAttachmentViewDescriptor,
                ]);
            }
        }

        // We don't create the render pass just now, we do a lazy creation of the render pass, hoping the render pass will be created by a call to clear()...

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

        this._endCurrentRenderPass();

        if (texture.texture?.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._generateMipmaps(texture.texture);
        }

        this._currentRenderTarget = null;

        if (this.dbgVerboseLogsForFirstFrames) {
            if ((this as any)._count === undefined) {
                (this as any)._count = 0;
            }
            if (!(this as any)._count || (this as any)._count < this.dbgVerboseLogsNumFrames) {
                Logger.Log("frame #" + (this as any)._count + " - unBindFramebuffer - rtt name=" + texture.label + ", internalTexture.uniqueId=", texture.texture?.uniqueId);
            }
        }

        this._mrtAttachments = [];
        this._cacheRenderPipeline.setMRT([]);
        this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
    }

    /**
     * Unbind the current render target and bind the default framebuffer
     */
    public restoreDefaultFramebuffer(): void {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        } else if (!this._currentRenderPass) {
            this._startMainRenderPass(false);
        }

        if (this._cachedViewport) {
            this.setViewport(this._cachedViewport);
        }

        this.wipeCaches();
    }

    //------------------------------------------------------------------------------
    //                              Render
    //------------------------------------------------------------------------------

    /**
     * @internal
     */
    public _setColorFormat(wrapper: IWebGPURenderPassWrapper): void {
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
    public _setDepthTextureFormat(wrapper: IWebGPURenderPassWrapper): void {
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

    private _applyRenderPassChanges(bundleList: Nullable<WebGPUBundleList>): void {
        const mustUpdateStencilRef = !this._stencilStateComposer.enabled ? false : this._mustUpdateStencilRef();
        const mustUpdateBlendColor = !this._alphaState.alphaBlend ? false : this._mustUpdateBlendColor();

        if (this._mustUpdateViewport()) {
            this._applyViewport(bundleList);
        }
        if (this._mustUpdateScissor()) {
            this._applyScissor(bundleList);
        }
        if (mustUpdateStencilRef) {
            this._applyStencilRef(bundleList);
        }
        if (mustUpdateBlendColor) {
            this._applyBlendColor(bundleList);
        }
    }

    private _draw(drawType: number, fillMode: number, start: number, count: number, instancesCount: number): void {
        const renderPass = this._getCurrentRenderPass();
        const bundleList = this._bundleList;

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
            this._applyRenderPassChanges(bundleList);
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
        if (this._currentMaterialContext.hasFloatOrDepthTextures) {
            let bitVal = 1;
            for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.textureNames.length; ++i) {
                const textureName = webgpuPipelineContext.shaderProcessingContext.textureNames[i];
                const texture = this._currentMaterialContext.textures[textureName]?.texture;
                const textureIsDepth = texture && texture.format >= Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 && texture.format <= Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8;
                if ((texture?.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) || textureIsDepth) {
                    textureState |= bitVal;
                }
                bitVal = bitVal << 1;
            }
        }

        this._currentMaterialContext.textureState = textureState;

        const pipeline = this._cacheRenderPipeline.getRenderPipeline(fillMode, this._currentEffect!, this.currentSampleCount, textureState);
        const bindGroups = this._cacheBindGroups.getBindGroups(webgpuPipelineContext, this._currentDrawContext, this._currentMaterialContext);

        if (!this._snapshotRendering.record) {
            this._applyRenderPassChanges(!this.compatibilityMode ? bundleList : null);
            if (!this.compatibilityMode) {
                this._counters.numBundleCreationNonCompatMode++;
                renderPass2 = this._device.createRenderBundleEncoder({
                    colorFormats: this._cacheRenderPipeline.colorFormats,
                    depthStencilFormat: this._depthTextureFormat,
                    sampleCount: WebGPUTextureHelper.GetSample(this.currentSampleCount),
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

            const buffer = vertexBuffer.effectiveBuffer;
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
        this._isDisposed = true;
        this._timestampQuery.dispose();
        this._mainTexture?.destroy();
        this._depthTexture?.destroy();
        this._textureHelper.destroyDeferredTextures();
        this._bufferManager.destroyDeferredBuffers();
        this._device.destroy();
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

        return this._renderingCanvas?.width ?? 0;
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

        return this._renderingCanvas?.height ?? 0;
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
        // eslint-disable-next-line no-throw-literal
        throw "_bindUnboundFramebuffer is not implementedin WebGPU! You probably want to use restoreDefaultFramebuffer or unBindFramebuffer instead";
    }

    // TODO WEBGPU. All of the below should go once engine split with baseEngine.

    /**
     * @internal
     */
    public _getSamplingParameters(): { min: number; mag: number } {
        // eslint-disable-next-line no-throw-literal
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
