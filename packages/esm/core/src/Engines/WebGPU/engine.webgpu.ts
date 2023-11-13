import type { IShaderProcessor } from "@babylonjs/core/Engines/Processors/iShaderProcessor.js";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage.js";
import type { DataArray, Nullable } from "@babylonjs/core/types.js";
import { WebGPUShaderProcessorWGSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsWGSL.js";
import { WebGPUShaderProcessorGLSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsGLSL.js";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals, IBaseEngineOptions } from "../engine.base.js";
import {
    _getGlobalDefines,
    _setupMobileChecks,
    _sharedInit,
    _viewport,
    getRenderHeight,
    getRenderWidth,
    initBaseEngineState,
    resize,
    setDepthFunctionToGreaterOrEqual,
} from "../engine.base.js";
import { WebGPUSnapshotRendering } from "@babylonjs/core/Engines/WebGPU/webgpuSnapshotRendering.js";
import type { IDrawContext } from "@babylonjs/core/Engines/IDrawContext.js";
import type { IMaterialContext } from "@babylonjs/core/Engines/IMaterialContext.js";
import { Version } from "../engine.static.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";

// TODO the next two can move to this file
import type { GlslangOptions, WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine.js";
import { WebGPUTintWASM, type TwgslOptions } from "@babylonjs/core/Engines/WebGPU/webgpuTintWASM.js";
import { EngineType } from "../engine.interfaces.js";
import { IsWindowObjectExist } from "../runtimeEnvironment.js";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import { BufferUsage, CanvasAlphaMode, FeatureName, LoadOp, StoreOp, TextureDimension, TextureFormat, TextureUsage } from "./engine.webgpu.constants.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { WebGPUBufferManager } from "@babylonjs/core/Engines/WebGPU/webgpuBufferManager.js";
import { WebGPUBundleList, WebGPURenderItemScissor, WebGPURenderItemStencilRef } from "@babylonjs/core/Engines/WebGPU/webgpuBundleList.js";
import { WebGPUCacheSampler } from "@babylonjs/core/Engines/WebGPU/webgpuCacheSampler.js";
import { WebGPUOcclusionQuery } from "@babylonjs/core/Engines/WebGPU/webgpuOcclusionQuery.js";
import { WebGPUTextureHelper } from "@babylonjs/core/Engines/WebGPU/webgpuTextureHelper.js";
import { WebGPUTimestampQuery } from "@babylonjs/core/Engines/WebGPU/webgpuTimestampQuery.js";
import { Constants } from "../engine.constants.js";
import { _restoreEngineAfterContextLost } from "../engine.extendable.js";
import type { ComputeEffect } from "@babylonjs/core/Compute/computeEffect.js";
import type { WebGPUCacheRenderPipeline } from "@babylonjs/core/Engines/WebGPU/webgpuCacheRenderPipeline.js";
import { WebGPURenderPassWrapper } from "@babylonjs/core/Engines/WebGPU/webgpuRenderPassWrapper.js";
import type { WebGPUDataBuffer } from "@babylonjs/core/Meshes/WebGPU/webgpuDataBuffer.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import type { DataBuffer } from "@babylonjs/core/Buffers/dataBuffer.js";
import { WebGPUClearQuad } from "@babylonjs/core/Engines/WebGPU/webgpuClearQuad.js";
import { WebGPUDrawContext } from "@babylonjs/core/Engines/WebGPU/webgpuDrawContext.js";
import { WebGPUMaterialContext } from "@babylonjs/core/Engines/WebGPU/webgpuMaterialContext.js";
import { WebGPUCacheBindGroups } from "@babylonjs/core/Engines/WebGPU/webgpuCacheBindGroups.js";
import { WebGPUCacheRenderPipelineTree } from "@babylonjs/core/Engines/WebGPU/webgpuCacheRenderPipelineTree.js";
import { WebGPUDepthCullingState } from "@babylonjs/core/Engines/WebGPU/webgpuDepthCullingState.js";
import { WebGPUStencilStateComposer } from "@babylonjs/core/Engines/WebGPU/webgpuStencilStateComposer.js";
import { wipeCaches } from "../WebGL/engine.webgl.js";
import { augmentEngineState } from "../engine.adapters.js";
import { _reportDrawCall } from "../engine.tools.js";
import type { IEffectCreationOptions } from "@babylonjs/core/Materials/effect.js";
import { Effect } from "@babylonjs/core/Materials/effect.js";
import type { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { effectWebGPUAdapter } from "../WebGL/engine.adapterHelpers.js";
import type { Engine } from "@babylonjs/core/Engines/engine.js";
import { WebGPUHardwareTexture } from "@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import type { IColor4Like } from "@babylonjs/core/Maths/math.like.js";
import type { WebGPURenderTargetWrapper } from "@babylonjs/core/Engines/WebGPU/webgpuRenderTargetWrapper.js";

declare function importScripts(jsPath: string): void;

const GLSLslangDefaultOptions: GlslangOptions = {
    jsPath: "https://preview.babylonjs.com/glslang/glslang.js",
    wasmPath: "https://preview.babylonjs.com/glslang/glslang.wasm",
};

// private readonly
const _uploadEncoderDescriptor = { label: "upload" };
const _renderEncoderDescriptor = { label: "render" };
const _renderTargetEncoderDescriptor = { label: "renderTarget" };
const _defaultSampleCount = 4;
const tempColor4 = new Color4();

const viewDescriptorSwapChainAntialiasing: GPUTextureViewDescriptor = {
    label: `TextureView_SwapChain_ResolveTarget`,
    dimension: TextureDimension.E2d,
    format: undefined as any, // will be updated with the right value
    mipLevelCount: 1,
    arrayLayerCount: 1,
};

const viewDescriptorSwapChain: GPUTextureViewDescriptor = {
    label: `TextureView_SwapChain`,
    dimension: TextureDimension.E2d,
    format: undefined as any, // will be updated with the right value
    mipLevelCount: 1,
    arrayLayerCount: 1,
};

// public readonly
/** @internal */
export const _clearDepthValue = 1;
/** @internal */
export const _clearReverseDepthValue = 0;
/** @internal */
export const _clearStencilValue = 0;
/**
 * Counters from last frame
 */
export const countersLastFrame: {
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

export interface IWebGPUEngineOptions extends IBaseEngineOptions, GPURequestAdapterOptions {
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

interface IWebGPUEnginePrivate {
    _shaderProcessorWGSL: Nullable<IShaderProcessor>;
    _snapshotRendering: WebGPUSnapshotRendering;
    _mainPassSampleCount: number;
    _glslang: any;
    _tintWASM: Nullable<WebGPUTintWASM>;
    _adapter: GPUAdapter;
    _adapterSupportedExtensions: GPUFeatureName[];
    _adapterInfo: GPUAdapterInfo;
    _adapterSupportedLimits: GPUSupportedLimits;
    _deviceEnabledExtensions: GPUFeatureName[];
    _deviceLimits: GPUSupportedLimits;
    _context: GPUCanvasContext;
    _clearQuad: WebGPUClearQuad;
    _cacheBindGroups: WebGPUCacheBindGroups;
    _emptyVertexBuffer: VertexBuffer;
    // Some of the internal state might change during the render pass.
    // This happens mainly during clear for the state
    // And when the frame starts to swap the target texture from the swap chain
    _mainTexture: GPUTexture;
    _depthTexture: GPUTexture;
    _mainTextureExtends: GPUExtent3D;
    _depthTextureFormat: GPUTextureFormat | undefined;
    _colorFormat: GPUTextureFormat | null;
    _commandBuffers: GPUCommandBuffer[];
    _defaultDrawContext: WebGPUDrawContext;
    _defaultMaterialContext: WebGPUMaterialContext;
    _currentOverrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>;
    _currentIndexBuffer: Nullable<DataBuffer>;
    _colorWriteLocal: boolean;
    _forceEnableEffect: boolean;
    _snapshotRenderingMode: number;
    _viewportsCurrent: Array<{ x: number; y: number; w: number; h: number }>;
    _scissorsCurrent: Array<{ x: number; y: number; w: number; h: number }>;
    _stencilRefsCurrent: number[];
    _blendColorsCurrent: Array<Array<Nullable<number>>>;
}

export interface IWebGPUEngineProtected extends IBaseEngineProtected {
    _scissorCached: { x: number; y: number; w: number; z: number };
}

export interface IWebGPUEngineInternals extends IBaseEngineInternals {
    _currentDrawContext: IDrawContext;
    _currentMaterialContext: IMaterialContext;
    _options: IWebGPUEngineOptions;
}

export interface IWebGPUEnginePublic extends IBaseEnginePublic {
    snapshotRendering: boolean;
    snapshotRenderingMode: number;
    /** @internal */
    _device: GPUDevice;
    /** @internal */
    _textureHelper: WebGPUTextureHelper;
    /** @internal */
    _bufferManager: WebGPUBufferManager;
    /** @internal */
    _cacheSampler: WebGPUCacheSampler;
    /** @internal */
    _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    /** @internal */
    _mrtAttachments: number[];
    /** @internal */
    _timestampQuery: WebGPUTimestampQuery;
    /** @internal */
    _occlusionQuery: WebGPUOcclusionQuery;
    /** @internal */
    _compiledComputeEffects: { [key: string]: ComputeEffect };
    /** @internal */
    _counters: {
        numEnableEffects: number;
        numEnableDrawWrapper: number;
        numBundleCreationNonCompatMode: number;
        numBundleReuseNonCompatMode: number;
    };
    /**
     * Max number of uncaptured error messages to log
     */
    numMaxUncapturedErrors: number;
    /** @internal */
    _ubInvertY: WebGPUDataBuffer;
    /** @internal */
    _ubDontInvertY: WebGPUDataBuffer;
    // Frame Life Cycle (recreated each frame)
    /** @internal */
    _uploadEncoder: GPUCommandEncoder;
    /** @internal */
    _renderEncoder: GPUCommandEncoder;
    /** @internal */
    _renderTargetEncoder: GPUCommandEncoder;
    // Frame Buffer Life Cycle (recreated for each render target pass)
    /** @internal */
    _currentRenderPass: Nullable<GPURenderPassEncoder>;
    /** @internal */
    _mainRenderPassWrapper: WebGPURenderPassWrapper;
    /** @internal */
    _rttRenderPassWrapper: WebGPURenderPassWrapper;
    /** @internal */
    _pendingDebugCommands: Array<[string, Nullable<string>]>;
    /** @internal */
    _bundleList: WebGPUBundleList;
    /** @internal */
    _bundleListRenderTarget: WebGPUBundleList;
    /** @internal */
    _onAfterUnbindFrameBufferObservable: Observable<IWebGPUEnginePublic>;
    /** @internal */
    _currentDrawContext: WebGPUDrawContext;
    /** @internal */
    _currentMaterialContext: WebGPUMaterialContext;
    /** @internal */
    dbgShowShaderCode: boolean;
    /** @internal */
    dbgSanityChecks: boolean;
    /** @internal */
    dbgVerboseLogsForFirstFrames: boolean;
    /** @internal */
    dbgVerboseLogsNumFrames: number;
    /** @internal */
    dbgLogIfNotDrawWrapper: boolean;
    /** @internal */
    dbgShowEmptyEnableEffectCalls: boolean;

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    compatibilityMode: boolean;

    readonly currentSampleCount: number;
}

export type WebGPUEngineState = IWebGPUEnginePublic & IWebGPUEngineInternals & IWebGPUEngineProtected;
export type WebGPUEngineStateFull = WebGPUEngineState & IWebGPUEnginePrivate;

// this is readonly and cannot be externaly changed. TODO - move it to engine options.
const UseTWGSL = true;

export async function CreateAsyncWebGPUEngine(canvas: HTMLCanvasElement, options?: IWebGPUEngineOptions): Promise<IWebGPUEnginePublic> {
    const engineState = initWebGPUEngineState(canvas, options);

    await initAsync(engineState, options?.glslangOptions, options?.twgslOptions);

    return engineState;
}

export function initWebGPUEngineState(canvas: HTMLCanvasElement, options: IWebGPUEngineOptions = {}): WebGPUEngineState {
    const baseEngineState = initBaseEngineState({
        name: "WebGPU",
        _type: EngineType.WEBGPU,
        description: "Babylon.js WebGPU Engine",
        isNDCHalfZRange: true,
        hasOriginBottomLeft: false,
        needPOTTextures: false,
        _creationOptions: options,
        _shaderPlatformName: "WEBGPU",
    });
    // public and protected
    const fes = baseEngineState as WebGPUEngineStateFull;
    fes._shaderProcessor = new WebGPUShaderProcessorGLSL();
    fes._shaderProcessorWGSL = new WebGPUShaderProcessorWGSL();
    // fes._snapshotRendering = new WebGPUSnapshotRendering(); // TODO
    fes._tintWASM = null;
    fes._adapterInfo = {
        vendor: "",
        architecture: "",
        device: "",
        description: "",
    };
    fes._compiledComputeEffects = {};
    fes._counters = {
        numEnableEffects: 0,
        numEnableDrawWrapper: 0,
        numBundleCreationNonCompatMode: 0,
        numBundleReuseNonCompatMode: 0,
    };
    fes.numMaxUncapturedErrors = 20;
    fes._commandBuffers = [null as any, null as any, null as any];
    fes._currentRenderPass = null;
    fes._mainRenderPassWrapper = new WebGPURenderPassWrapper();
    fes._rttRenderPassWrapper = new WebGPURenderPassWrapper();
    fes._onAfterUnbindFrameBufferObservable = new Observable<IWebGPUEnginePublic>();
    fes._currentOverrideVertexBuffers = null;
    fes._currentIndexBuffer = null;
    fes._colorWriteLocal = true;
    fes._forceEnableEffect = false;
    fes.dbgShowShaderCode = false;
    fes.dbgSanityChecks = true;
    fes.dbgVerboseLogsForFirstFrames = false;
    fes.dbgVerboseLogsNumFrames = 10;
    fes.dbgLogIfNotDrawWrapper = true;
    fes.dbgShowEmptyEnableEffectCalls = true;
    fes._snapshotRenderingMode = Constants.SNAPSHOTRENDERING_STANDARD;
    fes._viewportsCurrent = [
        { x: 0, y: 0, w: 0, h: 0 },
        { x: 0, y: 0, w: 0, h: 0 },
    ];
    fes._scissorsCurrent = [
        { x: 0, y: 0, w: 0, h: 0 },
        { x: 0, y: 0, w: 0, h: 0 },
    ];

    fes._scissorCached = { x: 0, y: 0, w: 0, z: 0 };

    fes._stencilRefsCurrent = [-1, -1];

    fes._blendColorsCurrent = [
        [null, null, null, null],
        [null, null, null, null],
    ];

    options.deviceDescriptor = options.deviceDescriptor || {};
    options.enableGPUDebugMarkers = options.enableGPUDebugMarkers ?? false;

    const versionToLog = `Babylon.js v${Version}`;
    Logger.Log(versionToLog + ` - ${fes.description}`);
    if (!navigator.gpu) {
        const error = "WebGPU is not supported by your browser.";
        Logger.Error(error);
        throw error;
    }

    options.swapChainFormat = options.swapChainFormat || navigator.gpu.getPreferredCanvasFormat();

    fes._options = options;

    fes._mainPassSampleCount = options.antialias ? _defaultSampleCount : 1;

    _setupMobileChecks(fes);

    _sharedInit(fes, canvas);

    // TODO - this is a hack to get the snapshotRendering property to work. Normalize it.
    Object.defineProperty(fes, "snapshotRendering", {
        get() {
            return fes._snapshotRendering.enabled;
        },
        set(value) {
            fes._snapshotRendering.enabled = value;
        },
    });
    Object.defineProperty(fes, "snapshotRenderingMode", {
        get() {
            return fes._snapshotRendering.mode;
        },
        set(value) {
            fes._snapshotRendering.mode = value;
        },
    });

    Object.defineProperty(fes, "currentSampleCount", {
        get() {
            return fes._currentRenderTarget ? fes._currentRenderTarget.samples : fes._mainPassSampleCount;
        },
    });

    return fes;
}

//------------------------------------------------------------------------------
//                              Initialization
//------------------------------------------------------------------------------

const baseEngineMethods = {
    _getCurrentRenderPassIndex,
    _reportDrawCall,
    //vertexbuffer
    createDynamicVertexBuffer,
    createVertexBuffer,
    // updateDynamicVertexBuffer,
    _releaseBuffer,
    //ClearQuad
    createEffect,
};
/**
 * Initializes the WebGPU context and dependencies.
 * @param glslangOptions Defines the GLSLang compiler options if necessary
 * @param twgslOptions Defines the Twgsl compiler options if necessary
 * @returns a promise notifying the readiness of the engine.
 */
export function initAsync(engineState: IWebGPUEnginePublic, glslangOptions?: GlslangOptions, twgslOptions?: TwgslOptions): Promise<void> {
    const fes = engineState as WebGPUEngineStateFull;
    return _initGlslang(engineState, glslangOptions ?? fes._options?.glslangOptions)
        .then(
            (glslang: any) => {
                fes._glslang = glslang;
                fes._tintWASM = UseTWGSL ? new WebGPUTintWASM() : null;
                return fes._tintWASM
                    ? fes._tintWASM.initTwgsl(twgslOptions ?? fes._options?.twgslOptions).then(
                          () => {
                              return navigator.gpu!.requestAdapter(fes._options);
                          },
                          (msg: string) => {
                              Logger.Error("Can not initialize twgsl!");
                              Logger.Error(msg);
                              throw Error("WebGPU initializations stopped.");
                          }
                      )
                    : navigator.gpu!.requestAdapter(fes._options);
            },
            (msg: string) => {
                Logger.Error("Can not initialize glslang!");
                Logger.Error(msg);
                throw Error("WebGPU initializations stopped.");
            }
        )
        .then((adapter: GPUAdapter | undefined) => {
            if (!adapter) {
                throw "Could not retrieve a WebGPU adapter (adapter is null).";
            } else {
                fes._adapter = adapter!;
                fes._adapterSupportedExtensions = [];
                fes._adapter.features?.forEach((feature) => fes._adapterSupportedExtensions.push(feature as FeatureName));
                fes._adapterSupportedLimits = fes._adapter.limits;

                fes._adapter.requestAdapterInfo().then((adapterInfo) => {
                    fes._adapterInfo = adapterInfo;
                });

                const deviceDescriptor = fes._options.deviceDescriptor ?? {};
                const requiredFeatures = deviceDescriptor?.requiredFeatures ?? (fes._options.enableAllFeatures ? fes._adapterSupportedExtensions : undefined);

                if (requiredFeatures) {
                    const requestedExtensions = requiredFeatures;
                    const validExtensions: GPUFeatureName[] = [];

                    for (const extension of requestedExtensions) {
                        if (fes._adapterSupportedExtensions.indexOf(extension) !== -1) {
                            validExtensions.push(extension);
                        }
                    }

                    deviceDescriptor.requiredFeatures = validExtensions;
                }

                if (fes._options.setMaximumLimits && !deviceDescriptor.requiredLimits) {
                    deviceDescriptor.requiredLimits = {};
                    for (const name in fes._adapterSupportedLimits) {
                        deviceDescriptor.requiredLimits[name] = fes._adapterSupportedLimits[name];
                    }
                }

                return fes._adapter.requestDevice(deviceDescriptor);
            }
        })
        .then(
            (device: GPUDevice) => {
                fes._device = device;
                fes._deviceEnabledExtensions = [];
                fes._device.features?.forEach((feature) => fes._deviceEnabledExtensions.push(feature as FeatureName));
                fes._deviceLimits = device.limits;

                let numUncapturedErrors = -1;
                fes._device.addEventListener("uncapturederror", (event) => {
                    if (++numUncapturedErrors < fes.numMaxUncapturedErrors) {
                        Logger.Warn(`WebGPU uncaptured error (${numUncapturedErrors + 1}): ${(<GPUUncapturedErrorEvent>event).error} - ${(<any>event).error.message}`);
                    } else if (numUncapturedErrors++ === fes.numMaxUncapturedErrors) {
                        Logger.Warn(
                            `WebGPU uncaptured error: too many warnings (${fes.numMaxUncapturedErrors}), no more warnings will be reported to the console for this engine.`
                        );
                    }
                });

                if (!fes.doNotHandleContextLost) {
                    fes._device.lost?.then((info) => {
                        if (fes._isDisposed) {
                            return;
                        }
                        fes._contextWasLost = true;
                        Logger.Warn("WebGPU context lost. " + info);
                        fes.onContextLostObservable.notifyObservers(fes);
                        _restoreEngineAfterContextLost({ wipeCaches }, fes, () => initAsync(fes));
                    });
                }
            },
            (e: any) => {
                Logger.Error("Could not retrieve a WebGPU device.");
                Logger.Error(e);
            }
        )
        .then(() => {
            const augmentedEngineState: WebGPUEngine = augmentEngineState(fes, baseEngineMethods);
            fes._bufferManager = new WebGPUBufferManager(fes._device);
            fes._textureHelper = new WebGPUTextureHelper(fes._device, fes._glslang, fes._tintWASM, fes._bufferManager, fes._deviceEnabledExtensions);
            fes._cacheSampler = new WebGPUCacheSampler(fes._device);
            fes._cacheBindGroups = new WebGPUCacheBindGroups(fes._device, fes._cacheSampler, augmentedEngineState);
            fes._timestampQuery = new WebGPUTimestampQuery(fes._device, fes._bufferManager);
            fes._occlusionQuery = (fes._device as any).createQuerySet ? new WebGPUOcclusionQuery(augmentedEngineState, fes._device, fes._bufferManager) : (undefined as any);
            fes._bundleList = new WebGPUBundleList(fes._device);
            fes._bundleListRenderTarget = new WebGPUBundleList(fes._device);
            fes._snapshotRendering = new WebGPUSnapshotRendering(augmentedEngineState, fes._snapshotRenderingMode, fes._bundleList, fes._bundleListRenderTarget);

            fes._ubInvertY = fes._bufferManager.createBuffer(new Float32Array([-1, 0]), BufferUsage.Uniform | BufferUsage.CopyDst);
            fes._ubDontInvertY = fes._bufferManager.createBuffer(new Float32Array([1, 0]), BufferUsage.Uniform | BufferUsage.CopyDst);

            if (fes.dbgVerboseLogsForFirstFrames) {
                if ((fes as any)._count === undefined) {
                    (fes as any)._count = 0;
                    // Used to have , "background: #ffff00", but Logger doesn't support it
                    Logger.Log("%c frame #" + (fes as any)._count + " - begin");
                }
            }

            fes._uploadEncoder = fes._device.createCommandEncoder(_uploadEncoderDescriptor);
            fes._renderEncoder = fes._device.createCommandEncoder(_renderEncoderDescriptor);
            fes._renderTargetEncoder = fes._device.createCommandEncoder(_renderTargetEncoderDescriptor);

            fes._emptyVertexBuffer = new VertexBuffer(augmentedEngineState, [0], "", false, false, 1, false, 0, 1);

            _initializeLimits(fes);

            fes._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(fes._device, fes._emptyVertexBuffer, !fes._caps.textureFloatLinearFiltering);

            fes._depthCullingState = new WebGPUDepthCullingState(fes._cacheRenderPipeline);
            fes._stencilStateComposer = new WebGPUStencilStateComposer(fes._cacheRenderPipeline);
            fes._stencilStateComposer.stencilGlobal = fes._stencilState;

            fes._depthCullingState.depthTest = true;
            fes._depthCullingState.depthFunc = Constants.LEQUAL;
            fes._depthCullingState.depthMask = true;

            fes._textureHelper.setCommandEncoder(fes._uploadEncoder);

            fes._clearQuad = new WebGPUClearQuad(fes._device, augmentedEngineState, fes._emptyVertexBuffer);
            fes._defaultDrawContext = createDrawContext(fes)!;
            fes._currentDrawContext = fes._defaultDrawContext;
            fes._defaultMaterialContext = createMaterialContext(fes)!;
            fes._currentMaterialContext = fes._defaultMaterialContext;

            _initializeContextAndSwapChain(fes);
            _initializeMainAttachments(fes);
            resize(fes);
        })
        .catch((e: any) => {
            Logger.Error("Can not create WebGPU Device and/or context.");
            Logger.Error(e);
            if (console.trace) {
                console.trace();
            }
        });
}

export function _getShaderProcessor(engineState: IWebGPUEnginePublic, shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
    // private member(s) of webgpu
    const { _shaderProcessorWGSL: shaderProcessorWGSL, _shaderProcessor } = engineState as WebGPUEngineStateFull;
    if (shaderLanguage === ShaderLanguage.WGSL) {
        return shaderProcessorWGSL;
    }
    return _shaderProcessor;
}

export function isWebGPU(engineState: IWebGPUEnginePublic): engineState is WebGPUEngineState {
    return engineState.name === "WebGPU";
}

export function resetSnapshotRendering(engineState: IWebGPUEnginePublic) {
    (engineState as WebGPUEngineStateFull)._snapshotRendering.reset();
}

/**
 * @internal
 */
export function _getUseSRGBBuffer(engineState: IWebGPUEnginePublic, useSRGBBuffer: boolean, noMipmap: boolean): boolean {
    // Generating mipmaps for sRGB textures is not supported in WebGL1 so we must disable the support if mipmaps is enabled
    // the call to isWebGPU is not needed, as this function is part of the webgpu engine. Need to be reinstated in UMD
    return useSRGBBuffer && (engineState as WebGPUEngineState)._caps.supportSRGBBuffers && /*isWebGPU(engineState) ||*/ noMipmap;
}

async function _initGlslang(engineState: IWebGPUEnginePublic, glslangOptions?: GlslangOptions): Promise<any> {
    glslangOptions = glslangOptions || {};
    glslangOptions = {
        ...GLSLslangDefaultOptions,
        ...glslangOptions,
    };

    if (glslangOptions.glslang) {
        glslangOptions.glslang;
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

    throw "gslang is not available.";
}

/** @internal */
export function _getCurrentRenderPassIndex(engineState: IWebGPUEnginePublic): number {
    const fes = engineState as WebGPUEngineStateFull;
    return fes._currentRenderPass === null ? -1 : fes._currentRenderPass === fes._mainRenderPassWrapper.renderPass ? 0 : 1;
}

/**
 * Creates a vertex buffer
 * @param data the data for the vertex buffer
 * @returns the new buffer
 */
export function createVertexBuffer(engineState: IWebGPUEnginePublic, data: DataArray): DataBuffer {
    let view: ArrayBufferView;

    if (data instanceof Array) {
        view = new Float32Array(data);
    } else if (data instanceof ArrayBuffer) {
        view = new Uint8Array(data);
    } else {
        view = data;
    }

    const dataBuffer = engineState._bufferManager.createBuffer(view, BufferUsage.Vertex | BufferUsage.CopyDst);
    return dataBuffer;
}

/**
 * Creates a vertex buffer
 * @param data the data for the dynamic vertex buffer
 * @returns the new buffer
 * @deprecated Please use createVertexBuffer instead.
 */
export function createDynamicVertexBuffer(engineState: IWebGPUEnginePublic, data: DataArray): DataBuffer {
    return createVertexBuffer(engineState, data);
}

/**
 * @internal
 */
export function _releaseBuffer(engineState: IWebGPUEnginePublic, buffer: DataBuffer): boolean {
    return engineState._bufferManager.releaseBuffer(buffer);
}

function _initializeLimits(engineState: IWebGPUEnginePublic): void {
    const fes = engineState as WebGPUEngineStateFull;
    // Init caps
    // TODO WEBGPU Real Capability check once limits will be working.

    fes._caps = {
        maxTexturesImageUnits: fes._deviceLimits.maxSampledTexturesPerShaderStage,
        maxVertexTextureImageUnits: fes._deviceLimits.maxSampledTexturesPerShaderStage,
        maxCombinedTexturesImageUnits: fes._deviceLimits.maxSampledTexturesPerShaderStage * 2,
        maxTextureSize: fes._deviceLimits.maxTextureDimension2D,
        maxCubemapTextureSize: fes._deviceLimits.maxTextureDimension2D,
        maxRenderTextureSize: fes._deviceLimits.maxTextureDimension2D,
        maxVertexAttribs: fes._deviceLimits.maxVertexAttributes,
        maxVaryingVectors: fes._deviceLimits.maxInterStageShaderVariables,
        maxFragmentUniformVectors: Math.floor(fes._deviceLimits.maxUniformBufferBindingSize / 4),
        maxVertexUniformVectors: Math.floor(fes._deviceLimits.maxUniformBufferBindingSize / 4),
        standardDerivatives: true,
        astc: (fes._deviceEnabledExtensions.indexOf(FeatureName.TextureCompressionASTC) >= 0 ? true : undefined) as any,
        s3tc: (fes._deviceEnabledExtensions.indexOf(FeatureName.TextureCompressionBC) >= 0 ? true : undefined) as any,
        pvrtc: null,
        etc1: null,
        etc2: (fes._deviceEnabledExtensions.indexOf(FeatureName.TextureCompressionETC2) >= 0 ? true : undefined) as any,
        bptc: fes._deviceEnabledExtensions.indexOf(FeatureName.TextureCompressionBC) >= 0 ? true : undefined,
        maxAnisotropy: 16, // Most implementations support maxAnisotropy values in range between 1 and 16, inclusive. The used value of maxAnisotropy will be clamped to the maximum value that the platform supports.
        uintIndices: true,
        fragmentDepthSupported: true,
        highPrecisionShaderSupported: true,
        colorBufferFloat: true,
        textureFloat: true,
        textureFloatLinearFiltering: fes._deviceEnabledExtensions.indexOf(FeatureName.Float32Filterable) >= 0,
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
        timerQuery: typeof BigUint64Array !== "undefined" && fes._deviceEnabledExtensions.indexOf(FeatureName.TimestampQuery) !== -1 ? (true as any) : undefined,
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
        texture2DArrayMaxLayerCount: fes._deviceLimits.maxTextureArrayLayers,
        disableMorphTargetTexture: false,
    };

    fes._caps.parallelShaderCompile = null as any;

    fes._features = {
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
export function createEffect(
    engineState: IWebGPUEnginePublic,
    baseName: any,
    attributesNamesOrOptions: string[] | IEffectCreationOptions,
    uniformsNamesOrEngine: string[] | Engine, // Engine is just a type here, so i don't have to change Effect's signature
    samplers?: string[],
    defines?: string,
    fallbacks?: EffectFallbacks,
    onCompiled?: Nullable<(effect: Effect) => void>,
    onError?: Nullable<(effect: Effect, errors: string) => void>,
    indexParameters?: any,
    shaderLanguage = ShaderLanguage.GLSL
): Effect {
    const fes = engineState as WebGPUEngineStateFull;
    const effectAdapter = augmentEngineState(fes, effectWebGPUAdapter);
    const vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName.vertexSource || baseName;
    const fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName.fragmentSource || baseName;
    const globalDefines = _getGlobalDefines(fes)!;

    let fullDefines = defines ?? (<IEffectCreationOptions>attributesNamesOrOptions).defines ?? "";

    if (globalDefines) {
        fullDefines += "\n" + globalDefines;
    }

    const name = vertex + "+" + fragment + "@" + fullDefines;
    if (fes._compiledEffects[name]) {
        const compiledEffect = <Effect>fes._compiledEffects[name];
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
        effectAdapter,
        defines,
        fallbacks,
        onCompiled,
        onError,
        indexParameters,
        name,
        shaderLanguage
    );
    fes._compiledEffects[name] = effect;

    return effect;
}

/**
 * Creates a new draw context
 * @returns the new context
 */
export function createDrawContext(engineState: IWebGPUEnginePublic): WebGPUDrawContext {
    // was returning | undefined
    return new WebGPUDrawContext(engineState._bufferManager);
}

/**
 * Creates a new material context
 * @returns the new context
 */
export function createMaterialContext(_engineState: IWebGPUEnginePublic): WebGPUMaterialContext {
    // was returning | undefined
    return new WebGPUMaterialContext();
}

export function _initializeContextAndSwapChain(engineState: IWebGPUEnginePublic): void {
    const fes = engineState as WebGPUEngineStateFull;
    if (!fes._renderingCanvas) {
        throw "The rendering canvas has not been set!";
    }
    fes._context = fes._renderingCanvas.getContext("webgpu") as unknown as GPUCanvasContext;
    _configureContext(fes);
    fes._colorFormat = fes._options.swapChainFormat!;
    fes._mainRenderPassWrapper.colorAttachmentGPUTextures = [new WebGPUHardwareTexture()];
    fes._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.format = fes._colorFormat;
}

// Set default values as WebGL with depth and stencil attachment for the broadest Compat.
export function _initializeMainAttachments(engineState: IWebGPUEnginePublic): void {
    const fes = engineState as WebGPUEngineStateFull;
    if (!fes._bufferManager) {
        return;
    }

    flushFramebuffer(fes, false);

    fes._mainTextureExtends = {
        width: getRenderWidth(fes, true),
        height: getRenderHeight(fes, true),
        depthOrArrayLayers: 1,
    };

    const bufferDataUpdate = new Float32Array([getRenderHeight(fes, true)]);

    fes._bufferManager.setSubData(fes._ubInvertY, 4, bufferDataUpdate);
    fes._bufferManager.setSubData(fes._ubDontInvertY, 4, bufferDataUpdate);

    let mainColorAttachments: GPURenderPassColorAttachment[];

    if (fes._options.antialias) {
        const mainTextureDescriptor: GPUTextureDescriptor = {
            label: `Texture_MainColor_${fes._mainTextureExtends.width}x${fes._mainTextureExtends.height}_antialiasing`,
            size: fes._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: fes._mainPassSampleCount,
            dimension: TextureDimension.E2d,
            format: fes._options.swapChainFormat!,
            usage: TextureUsage.RenderAttachment,
        };

        if (fes._mainTexture) {
            fes._textureHelper.releaseTexture(fes._mainTexture);
        }
        fes._mainTexture = fes._device.createTexture(mainTextureDescriptor);
        mainColorAttachments = [
            {
                view: fes._mainTexture.createView({
                    label: "TextureView_MainColor_antialiasing",
                    dimension: TextureDimension.E2d,
                    format: fes._options.swapChainFormat!,
                    mipLevelCount: 1,
                    arrayLayerCount: 1,
                }),
                clearValue: new Color4(0, 0, 0, 1),
                loadOp: LoadOp.Clear,
                storeOp: StoreOp.Store, // don't use StoreOp.Discard, else using several cameras with different viewports or using scissors will fail because we call beginRenderPass / endPass several times for the same color attachment!
            },
        ];
    } else {
        mainColorAttachments = [
            {
                view: undefined as any,
                clearValue: new Color4(0, 0, 0, 1),
                loadOp: LoadOp.Clear,
                storeOp: StoreOp.Store,
            },
        ];
    }

    fes._mainRenderPassWrapper.depthTextureFormat = fes.isStencilEnable ? TextureFormat.Depth24PlusStencil8 : TextureFormat.Depth32Float;

    _setDepthTextureFormat(fes, fes._mainRenderPassWrapper);

    const depthTextureDescriptor: GPUTextureDescriptor = {
        label: `Texture_MainDepthStencil_${fes._mainTextureExtends.width}x${fes._mainTextureExtends.height}`,
        size: fes._mainTextureExtends,
        mipLevelCount: 1,
        sampleCount: fes._mainPassSampleCount,
        dimension: TextureDimension.E2d,
        format: fes._mainRenderPassWrapper.depthTextureFormat,
        usage: TextureUsage.RenderAttachment,
    };

    if (fes._depthTexture) {
        fes._textureHelper.releaseTexture(fes._depthTexture);
    }
    fes._depthTexture = fes._device.createTexture(depthTextureDescriptor);
    const mainDepthAttachment: GPURenderPassDepthStencilAttachment = {
        view: fes._depthTexture.createView({
            label: `TextureView_MainDepthStencil_${fes._mainTextureExtends.width}x${fes._mainTextureExtends.height}`,
            dimension: TextureDimension.E2d,
            format: fes._depthTexture.format,
            mipLevelCount: 1,
            arrayLayerCount: 1,
        }),

        depthClearValue: _clearDepthValue,
        depthLoadOp: LoadOp.Clear,
        depthStoreOp: StoreOp.Store,
        stencilClearValue: _clearStencilValue,
        stencilLoadOp: !fes.isStencilEnable ? undefined : LoadOp.Clear,
        stencilStoreOp: !fes.isStencilEnable ? undefined : StoreOp.Store,
    };

    fes._mainRenderPassWrapper.renderPassDescriptor = {
        label: "MainRenderPass",
        colorAttachments: mainColorAttachments,
        depthStencilAttachment: mainDepthAttachment,
    };
}

export function _configureContext(engineState: IWebGPUEnginePublic): void {
    const fes = engineState as WebGPUEngineStateFull;
    fes._context.configure({
        device: fes._device,
        format: fes._options.swapChainFormat!,
        usage: TextureUsage.RenderAttachment | TextureUsage.CopySrc,
        alphaMode: fes.premultipliedAlpha ? CanvasAlphaMode.Premultiplied : CanvasAlphaMode.Opaque,
    });
}

/**
 * Force a WebGPU flush (ie. a flush of all waiting commands)
 * @param reopenPass true to reopen at the end of the function the pass that was active when entering the function
 */
export function flushFramebuffer(engineState: IWebGPUEnginePublic, reopenPass = true): void {
    const fes = engineState as WebGPUEngineStateFull;
    // we need to end the current render pass (main or rtt) if any as we are not allowed to submit the command buffers when being in a pass
    const currentRenderPassIsNULL = !fes._currentRenderPass;
    let currentPasses = 0; // 0 if no pass, 1 for rtt, 2 for main pass
    if (fes._currentRenderPass && fes._currentRenderTarget) {
        currentPasses |= 1;
        _endRenderTargetRenderPass(fes);
    }
    if (fes._mainRenderPassWrapper.renderPass) {
        currentPasses |= 2;
        _endMainRenderPass(fes);
    }

    fes._commandBuffers[0] = fes._uploadEncoder.finish();
    fes._commandBuffers[1] = fes._renderTargetEncoder.finish();
    fes._commandBuffers[2] = fes._renderEncoder.finish();

    fes._device.queue.submit(fes._commandBuffers);

    fes._uploadEncoder = fes._device.createCommandEncoder(_uploadEncoderDescriptor);
    fes._renderEncoder = fes._device.createCommandEncoder(_renderEncoderDescriptor);
    fes._renderTargetEncoder = fes._device.createCommandEncoder(_renderTargetEncoderDescriptor);

    fes._timestampQuery.startFrame(fes._uploadEncoder);

    fes._textureHelper.setCommandEncoder(fes._uploadEncoder);

    fes._bundleList.reset();
    fes._bundleListRenderTarget.reset();

    // restart the render pass
    if (reopenPass) {
        if (currentPasses & 2) {
            _startMainRenderPass(fes, false);
        }
        if (currentPasses & 1) {
            _startRenderTargetRenderPass(fes, fes._currentRenderTarget!, false, null, false, false);
        }
        if (currentRenderPassIsNULL && fes._currentRenderTarget) {
            fes._currentRenderPass = null;
        }
    }
}

//------------------------------------------------------------------------------
//                              Render Pass
//------------------------------------------------------------------------------

function _startRenderTargetRenderPass(
    engineState: IWebGPUEnginePublic,
    renderTargetWrapper: RenderTargetWrapper,
    setClearStates: boolean,
    clearColor: Nullable<IColor4Like>,
    clearDepth: boolean,
    clearStencil: boolean
) {
    const fes = engineState as WebGPUEngineStateFull;
    const rtWrapper = renderTargetWrapper as WebGPURenderTargetWrapper;

    const depthStencilTexture = rtWrapper._depthStencilTexture;
    const gpuDepthStencilWrapper = depthStencilTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
    const gpuDepthStencilTexture = gpuDepthStencilWrapper?.underlyingResource as Nullable<GPUTexture>;
    const gpuDepthStencilMSAATexture = gpuDepthStencilWrapper?.getMSAATexture();

    const depthTextureView = gpuDepthStencilTexture?.createView(fes._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
    const depthMSAATextureView = gpuDepthStencilMSAATexture?.createView(fes._rttRenderPassWrapper.depthAttachmentViewDescriptor!);
    const depthTextureHasStencil = gpuDepthStencilWrapper ? WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format) : false;

    const colorAttachments: (GPURenderPassColorAttachment | null)[] = [];

    if (fes.useReverseDepthBuffer) {
        setDepthFunctionToGreaterOrEqual(fes);
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
        if (!fes._mrtAttachments || fes._mrtAttachments.length === 0) {
            fes._mrtAttachments = rtWrapper._defaultAttachments;
        }
        for (let i = 0; i < fes._mrtAttachments.length; ++i) {
            const index = fes._mrtAttachments[i]; // if index == 0 it means the texture should not be written to => at render pass creation time, it means we should not clear it
            const mrtTexture = rtWrapper.textures![i];
            const gpuMRTWrapper = mrtTexture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
            const gpuMRTTexture = gpuMRTWrapper?.underlyingResource;
            if (gpuMRTWrapper && gpuMRTTexture) {
                const gpuMSAATexture = gpuMRTWrapper.getMSAATexture(i);

                const layerIndex = rtWrapper.layerIndices?.[i] ?? 0;
                const faceIndex = rtWrapper.faceIndices?.[i] ?? 0;
                const viewDescriptor = {
                    ...fes._rttRenderPassWrapper.colorAttachmentViewDescriptor!,
                    format: gpuMRTWrapper.format,
                    baseArrayLayer: mrtTexture.isCube ? layerIndex * 6 + faceIndex : layerIndex,
                };
                const msaaViewDescriptor = {
                    ...fes._rttRenderPassWrapper.colorAttachmentViewDescriptor!,
                    format: gpuMRTWrapper.format,
                    baseArrayLayer: 0,
                };
                const isRTInteger = mrtTexture.type === Constants.TEXTURETYPE_UNSIGNED_INTEGER || mrtTexture.type === Constants.TEXTURETYPE_UNSIGNED_SHORT;

                const colorTextureView = gpuMRTTexture.createView(viewDescriptor);
                const colorMSAATextureView = gpuMSAATexture?.createView(msaaViewDescriptor);

                colorAttachments.push({
                    view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                    resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                    clearValue: index !== 0 && mustClearColor ? (isRTInteger ? clearColorForIntegerRT : clearColor) : undefined,
                    loadOp: index !== 0 && mustClearColor ? LoadOp.Clear : LoadOp.Load,
                    storeOp: StoreOp.Store,
                });
            }
        }
        fes._cacheRenderPipeline.setMRT(rtWrapper.textures!, fes._mrtAttachments.length);
        fes._cacheRenderPipeline.setMRTAttachments(fes._mrtAttachments);
    } else {
        // single render target
        const internalTexture = rtWrapper.texture;
        if (internalTexture) {
            const gpuWrapper = internalTexture._hardwareTexture as WebGPUHardwareTexture;
            const gpuTexture = gpuWrapper.underlyingResource!;

            const gpuMSAATexture = gpuWrapper.getMSAATexture();
            const colorTextureView = gpuTexture.createView(fes._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
            const colorMSAATextureView = gpuMSAATexture?.createView(fes._rttRenderPassWrapper.colorAttachmentViewDescriptor!);
            const isRTInteger = internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_INTEGER || internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_SHORT;

            colorAttachments.push({
                view: colorMSAATextureView ? colorMSAATextureView : colorTextureView,
                resolveTarget: gpuMSAATexture ? colorTextureView : undefined,
                clearValue: mustClearColor ? (isRTInteger ? clearColorForIntegerRT : clearColor) : undefined,
                loadOp: mustClearColor ? LoadOp.Clear : LoadOp.Load,
                storeOp: StoreOp.Store,
            });
        } else {
            colorAttachments.push(null);
        }
    }

    _debugPushGroup?.(fes, "render target pass", 1);

    fes._rttRenderPassWrapper.renderPassDescriptor = {
        label: (renderTargetWrapper.label ?? "RTT") + "RenderPass",
        colorAttachments,
        depthStencilAttachment:
            depthStencilTexture && gpuDepthStencilTexture
                ? {
                      view: depthMSAATextureView ? depthMSAATextureView : depthTextureView!,
                      depthClearValue: mustClearDepth ? (fes.useReverseDepthBuffer ? _clearReverseDepthValue : _clearDepthValue) : undefined,
                      depthLoadOp: mustClearDepth ? LoadOp.Clear : LoadOp.Load,
                      depthStoreOp: StoreOp.Store,
                      stencilClearValue: rtWrapper._depthStencilTextureWithStencil && mustClearStencil ? _clearStencilValue : undefined,
                      stencilLoadOp: !depthTextureHasStencil ? undefined : rtWrapper._depthStencilTextureWithStencil && mustClearStencil ? LoadOp.Clear : LoadOp.Load,
                      stencilStoreOp: !depthTextureHasStencil ? undefined : StoreOp.Store,
                  }
                : undefined,
        occlusionQuerySet: fes._occlusionQuery?.hasQueries ? fes._occlusionQuery.querySet : undefined,
    };
    fes._rttRenderPassWrapper.renderPass = fes._renderTargetEncoder.beginRenderPass(fes._rttRenderPassWrapper.renderPassDescriptor);

    if (fes.dbgVerboseLogsForFirstFrames) {
        if ((fes as any)._count === undefined) {
            (fes as any)._count = 0;
        }
        if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
            const internalTexture = rtWrapper.texture!;
            console.log(
                "frame #" + (fes as any)._count + " - render target begin pass - internalTexture.uniqueId=",
                internalTexture.uniqueId,
                "width=",
                internalTexture.width,
                "height=",
                internalTexture.height,
                fes._rttRenderPassWrapper.renderPassDescriptor
            );
        }
    }

    fes._currentRenderPass = fes._rttRenderPassWrapper.renderPass;

    _debugFlushPendingCommands?.(fes);

    _resetCurrentViewport(fes, 1);
    _resetCurrentScissor(fes, 1);
    _resetCurrentStencilRef(fes, 1);
    _resetCurrentColorBlend(fes, 1);

    if (!gpuDepthStencilWrapper || !WebGPUTextureHelper.HasStencilAspect(gpuDepthStencilWrapper.format)) {
        fes._stencilStateComposer!.enabled = false;
    }
}

/** @internal */
export function _endRenderTargetRenderPass(engineState: IWebGPUEnginePublic) {
    const fes = engineState as WebGPUEngineStateFull;
    if (fes._currentRenderPass) {
        const gpuWrapper = fes._currentRenderTarget!.texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
        if (gpuWrapper && !fes._snapshotRendering.endRenderTargetPass(fes._currentRenderPass, gpuWrapper) && !fes.compatibilityMode) {
            fes._bundleListRenderTarget.run(fes._currentRenderPass);
            fes._bundleListRenderTarget.reset();
        }
        fes._currentRenderPass.end();
        if (fes.dbgVerboseLogsForFirstFrames) {
            if ((fes as any)._count === undefined) {
                (fes as any)._count = 0;
            }
            if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (fes as any)._count + " - render target end pass - internalTexture.uniqueId=", fes._currentRenderTarget?.texture?.uniqueId);
            }
        }
        _debugPopGroup?.(fes, 1);
        _resetCurrentViewport(fes, 1);
        _viewport(fes, 0, 0, 0, 0);
        _resetCurrentScissor(fes, 1);
        _resetCurrentStencilRef(fes, 1);
        _resetCurrentColorBlend(fes, 1);
        fes._currentRenderPass = null;
        fes._rttRenderPassWrapper.reset();
    }
}

function _getCurrentRenderPass(engineState: IWebGPUEnginePublic): GPURenderPassEncoder {
    const fes = engineState as WebGPUEngineStateFull;
    if (fes._currentRenderTarget && !fes._currentRenderPass) {
        // delayed creation of the render target pass, but we now need to create it as we are requested the render pass
        _startRenderTargetRenderPass(fes, fes._currentRenderTarget, false, null, false, false);
    } else if (!fes._currentRenderPass) {
        _startMainRenderPass(fes, false);
    }

    return fes._currentRenderPass!;
}

function _startMainRenderPass(engineState: IWebGPUEnginePublic, setClearStates: boolean, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
    const fes = engineState as WebGPUEngineStateFull;
    if (fes._mainRenderPassWrapper.renderPass) {
        flushFramebuffer(fes, false);
    }

    if (fes.useReverseDepthBuffer) {
        setDepthFunctionToGreaterOrEqual(fes);
    }

    const mustClearColor = setClearStates && clearColor;
    const mustClearDepth = setClearStates && clearDepth;
    const mustClearStencil = setClearStates && clearStencil;

    fes._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.clearValue = mustClearColor ? clearColor : undefined;
    fes._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.loadOp = mustClearColor ? LoadOp.Clear : LoadOp.Load;
    fes._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.depthClearValue = mustClearDepth
        ? fes.useReverseDepthBuffer
            ? _clearReverseDepthValue
            : _clearDepthValue
        : undefined;
    fes._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.depthLoadOp = mustClearDepth ? LoadOp.Clear : LoadOp.Load;
    fes._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.stencilClearValue = mustClearStencil ? _clearStencilValue : undefined;
    fes._mainRenderPassWrapper.renderPassDescriptor!.depthStencilAttachment!.stencilLoadOp = !fes.isStencilEnable ? undefined : mustClearStencil ? LoadOp.Clear : LoadOp.Load;
    fes._mainRenderPassWrapper.renderPassDescriptor!.occlusionQuerySet = fes._occlusionQuery?.hasQueries ? fes._occlusionQuery.querySet : undefined;

    const swapChainTexture = fes._context.getCurrentTexture();
    fes._mainRenderPassWrapper.colorAttachmentGPUTextures[0]!.set(swapChainTexture);

    // Resolve in case of MSAA
    if (fes._options.antialias) {
        viewDescriptorSwapChainAntialiasing.format = swapChainTexture.format;
        fes._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.resolveTarget = swapChainTexture.createView(viewDescriptorSwapChainAntialiasing);
    } else {
        viewDescriptorSwapChain.format = swapChainTexture.format;
        fes._mainRenderPassWrapper.renderPassDescriptor!.colorAttachments[0]!.view = swapChainTexture.createView(viewDescriptorSwapChain);
    }

    if (fes.dbgVerboseLogsForFirstFrames) {
        if ((fes as any)._count === undefined) {
            (fes as any)._count = 0;
        }
        if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
            console.log(
                "frame #" + (fes as any)._count + " - main begin pass - texture width=" + (fes._mainTextureExtends as any).width,
                " height=" + (fes._mainTextureExtends as any).height,
                fes._mainRenderPassWrapper.renderPassDescriptor
            );
        }
    }

    _debugPushGroup?.(fes, "main pass", 0);

    fes._currentRenderPass = fes._renderEncoder.beginRenderPass(fes._mainRenderPassWrapper.renderPassDescriptor!);

    fes._mainRenderPassWrapper.renderPass = fes._currentRenderPass;

    _debugFlushPendingCommands?.(fes);

    _resetCurrentViewport(fes, 0);
    _resetCurrentScissor(fes, 0);
    _resetCurrentStencilRef(fes, 0);
    _resetCurrentColorBlend(fes, 0);

    if (!fes._isStencilEnable) {
        fes._stencilStateComposer!.enabled = false;
    }
}

function _endMainRenderPass(engineState: IWebGPUEnginePublic): void {
    const fes = engineState as WebGPUEngineStateFull;
    if (fes._mainRenderPassWrapper.renderPass !== null) {
        fes._snapshotRendering.endMainRenderPass();
        if (!fes.compatibilityMode && !fes._snapshotRendering.play) {
            fes._bundleList.run(fes._mainRenderPassWrapper.renderPass);
            fes._bundleList.reset();
        }
        fes._mainRenderPassWrapper.renderPass.end();
        if (fes.dbgVerboseLogsForFirstFrames) {
            if ((fes as any)._count === undefined) {
                (fes as any)._count = 0;
            }
            if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
                console.log("frame #" + (fes as any)._count + " - main end pass");
            }
        }
        _debugPopGroup?.(fes, 0);
        _resetCurrentViewport(fes, 0);
        _resetCurrentScissor(fes, 0);
        _resetCurrentStencilRef(fes, 0);
        _resetCurrentColorBlend(fes, 0);
        if (fes._mainRenderPassWrapper.renderPass === fes._currentRenderPass) {
            fes._currentRenderPass = null;
        }
        fes._mainRenderPassWrapper.reset(false);
    }
}

/**
 * @internal
 */
export function _setDepthTextureFormat(engineState: IWebGPUEnginePublic, wrapper: WebGPURenderPassWrapper): void {
    const fes = engineState as WebGPUEngineStateFull;
    fes._cacheRenderPipeline.setDepthStencilFormat(wrapper.depthTextureFormat);
    if (fes._depthTextureFormat === wrapper.depthTextureFormat) {
        return;
    }
    fes._depthTextureFormat = wrapper.depthTextureFormat;
}

//------------------------------------------------------------------------------
//                              Dynamic WebGPU States
//------------------------------------------------------------------------------

function _resetCurrentViewport(engineState: IWebGPUEnginePublic, index: number) {
    const fes = engineState as WebGPUEngineStateFull;
    fes._viewportsCurrent[index].x = 0;
    fes._viewportsCurrent[index].y = 0;
    fes._viewportsCurrent[index].w = 0;
    fes._viewportsCurrent[index].h = 0;
}

// function _mustUpdateViewport(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): boolean {
//     const fes = engineState as WebGPUEngineStateFull;
//     const index = renderPass === fes._mainRenderPassWrapper.renderPass ? 0 : 1;

//     const x = fes._viewportCached.x,
//         y = fes._viewportCached.y,
//         w = fes._viewportCached.z,
//         h = fes._viewportCached.w;

//     const update = fes._viewportsCurrent[index].x !== x || fes._viewportsCurrent[index].y !== y || fes._viewportsCurrent[index].w !== w || fes._viewportsCurrent[index].h !== h;

//     if (update) {
//         fes._viewportsCurrent[index].x = fes._viewportCached.x;
//         fes._viewportsCurrent[index].y = fes._viewportCached.y;
//         fes._viewportsCurrent[index].w = fes._viewportCached.z;
//         fes._viewportsCurrent[index].h = fes._viewportCached.w;
//     }

//     return update;
// }

// function _applyViewport(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): void {
//     const fes = engineState as WebGPUEngineStateFull;
//     let y = Math.floor(fes._viewportCached.y);
//     const h = Math.floor(fes._viewportCached.w);

//     if (!fes._currentRenderTarget) {
//         y = getRenderHeight(fes, true) - y - h;
//     }

//     renderPass.setViewport(Math.floor(fes._viewportCached.x), y, Math.floor(fes._viewportCached.z), h, 0, 1);

//     if (fes.dbgVerboseLogsForFirstFrames) {
//         if ((fes as any)._count === undefined) {
//             (fes as any)._count = 0;
//         }
//         if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
//             console.log(
//                 "frame #" + (fes as any)._count + " - viewport applied - (",
//                 fes._viewportCached.x,
//                 fes._viewportCached.y,
//                 fes._viewportCached.z,
//                 fes._viewportCached.w,
//                 ") current pass is main pass=" + (renderPass === fes._mainRenderPassWrapper.renderPass)
//             );
//         }
//     }
// }

function _resetCurrentScissor(engineState: IWebGPUEnginePublic, index: number) {
    const fes = engineState as WebGPUEngineStateFull;
    fes._scissorsCurrent[index].x = 0;
    fes._scissorsCurrent[index].y = 0;
    fes._scissorsCurrent[index].w = 0;
    fes._scissorsCurrent[index].h = 0;
}

// function _mustUpdateScissor(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): boolean {
//     const fes = engineState as WebGPUEngineStateFull;
//     const index = renderPass === fes._mainRenderPassWrapper.renderPass ? 0 : 1;

//     const x = fes._scissorCached.x,
//         y = fes._scissorCached.y,
//         w = fes._scissorCached.z,
//         h = fes._scissorCached.w;

//     const update = fes._scissorsCurrent[index].x !== x || fes._scissorsCurrent[index].y !== y || fes._scissorsCurrent[index].w !== w || fes._scissorsCurrent[index].h !== h;

//     if (update) {
//         fes._scissorsCurrent[index].x = fes._scissorCached.x;
//         fes._scissorsCurrent[index].y = fes._scissorCached.y;
//         fes._scissorsCurrent[index].w = fes._scissorCached.z;
//         fes._scissorsCurrent[index].h = fes._scissorCached.w;
//     }

//     return update;
// }

function _applyScissor(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): void {
    const fes = engineState as WebGPUEngineStateFull;
    renderPass.setScissorRect(
        fes._scissorCached.x,
        fes._currentRenderTarget ? fes._scissorCached.y : getRenderHeight(fes) - fes._scissorCached.w - fes._scissorCached.y,
        fes._scissorCached.z,
        fes._scissorCached.w
    );

    if (fes.dbgVerboseLogsForFirstFrames) {
        if ((fes as any)._count === undefined) {
            (fes as any)._count = 0;
        }
        if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
            console.log(
                "frame #" + (fes as any)._count + " - scissor applied - (",
                fes._scissorCached.x,
                fes._scissorCached.y,
                fes._scissorCached.z,
                fes._scissorCached.w,
                ") current pass is main pass=" + (renderPass === fes._mainRenderPassWrapper.renderPass)
            );
        }
    }
}

function _scissorIsActive(engineState: IWebGPUEnginePublic) {
    const fes = engineState as WebGPUEngineStateFull;
    return fes._scissorCached.x !== 0 || fes._scissorCached.y !== 0 || fes._scissorCached.z !== 0 || fes._scissorCached.w !== 0;
}

export function enableScissor(engineState: IWebGPUEnginePublic, x: number, y: number, width: number, height: number): void {
    const fes = engineState as WebGPUEngineStateFull;
    fes._scissorCached.x = x;
    fes._scissorCached.y = y;
    fes._scissorCached.z = width;
    fes._scissorCached.w = height;
}

export function disableScissor(engineState: IWebGPUEnginePublic) {
    const fes = engineState as WebGPUEngineStateFull;
    fes._scissorCached.x = 0;
    fes._scissorCached.y = 0;
    fes._scissorCached.z = 0;
    fes._scissorCached.w = 0;

    _resetCurrentScissor(fes, 0);
    _resetCurrentScissor(fes, 1);
}

function _resetCurrentStencilRef(engineState: IWebGPUEnginePublic, index: number): void {
    (engineState as WebGPUEngineStateFull)._stencilRefsCurrent[index] = -1;
}

// function _mustUpdateStencilRef(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): boolean {
//     const fes = engineState as WebGPUEngineStateFull;
//     const index = renderPass === fes._mainRenderPassWrapper.renderPass ? 0 : 1;
//     const update = fes._stencilStateComposer?.funcRef !== fes._stencilRefsCurrent[index];
//     if (update) {
//         fes._stencilRefsCurrent[index] = fes._stencilStateComposer!.funcRef;
//     }
//     return update;
// }

/**
 * @internal
 */
export function _applyStencilRef(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): void {
    renderPass.setStencilReference((engineState as WebGPUEngineStateFull)._stencilStateComposer?.funcRef ?? 0);
}

function _resetCurrentColorBlend(engineState: IWebGPUEnginePublic, index: number): void {
    const fes = engineState as WebGPUEngineStateFull;
    fes._blendColorsCurrent[index][0] = fes._blendColorsCurrent[index][1] = fes._blendColorsCurrent[index][2] = fes._blendColorsCurrent[index][3] = null;
}

// function _mustUpdateBlendColor(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): boolean {
//     const fes = engineState as WebGPUEngineStateFull;
//     const index = renderPass === fes._mainRenderPassWrapper.renderPass ? 0 : 1;
//     const colorBlend = fes._alphaState._blendConstants;

//     const update =
//         colorBlend[0] !== fes._blendColorsCurrent[index][0] ||
//         colorBlend[1] !== fes._blendColorsCurrent[index][1] ||
//         colorBlend[2] !== fes._blendColorsCurrent[index][2] ||
//         colorBlend[3] !== fes._blendColorsCurrent[index][3];

//     if (update) {
//         fes._blendColorsCurrent[index][0] = colorBlend[0];
//         fes._blendColorsCurrent[index][1] = colorBlend[1];
//         fes._blendColorsCurrent[index][2] = colorBlend[2];
//         fes._blendColorsCurrent[index][3] = colorBlend[3];
//     }

//     return update;
// }

// function _applyBlendColor(engineState: IWebGPUEnginePublic, renderPass: GPURenderPassEncoder): void {
//     renderPass.setBlendConstant((engineState as WebGPUEngineStateFull)._alphaState._blendConstants as GPUColor);
// }

/**
 * Clear the current render buffer or the current render target (if any is set up)
 * @param color defines the color to use
 * @param backBuffer defines if the back buffer must be cleared
 * @param depth defines if the depth buffer must be cleared
 * @param stencil defines if the stencil buffer must be cleared
 */
export function clear(engineState: IWebGPUEnginePublic, color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
    const fes = engineState as WebGPUEngineStateFull;
    // Some PGs are using color3...
    if (color && color.a === undefined) {
        color.a = 1;
    }

    const hasScissor = _scissorIsActive(fes);

    if (fes.dbgVerboseLogsForFirstFrames) {
        if ((fes as any)._count === undefined) {
            (fes as any)._count = 0;
        }
        if (!(fes as any)._count || (fes as any)._count < fes.dbgVerboseLogsNumFrames) {
            console.log("frame #" + (fes as any)._count + " - clear called - backBuffer=", backBuffer, " depth=", depth, " stencil=", stencil, " scissor is active=", hasScissor);
        }
    }

    // We need to recreate the render pass so that the new parameters for clear color / depth / stencil are taken into account
    if (fes._currentRenderTarget) {
        if (hasScissor) {
            if (!fes._rttRenderPassWrapper.renderPass) {
                _startRenderTargetRenderPass(fes, fes._currentRenderTarget!, false, backBuffer ? color : null, depth, stencil);
            }
            if (!fes.compatibilityMode) {
                fes._bundleListRenderTarget.addItem(new WebGPURenderItemScissor(fes._scissorCached.x, fes._scissorCached.y, fes._scissorCached.z, fes._scissorCached.w));
            } else {
                _applyScissor(fes, fes._currentRenderPass!);
            }
            _clearFullQuad(fes, backBuffer ? color : null, depth, stencil);
        } else {
            if (fes._currentRenderPass) {
                _endRenderTargetRenderPass(fes);
            }
            _startRenderTargetRenderPass(fes, fes._currentRenderTarget!, true, backBuffer ? color : null, depth, stencil);
        }
    } else {
        if (!fes._mainRenderPassWrapper.renderPass || !hasScissor) {
            _startMainRenderPass(fes, !hasScissor, backBuffer ? color : null, depth, stencil);
        }
        if (hasScissor) {
            if (!fes.compatibilityMode) {
                fes._bundleList.addItem(new WebGPURenderItemScissor(fes._scissorCached.x, fes._scissorCached.y, fes._scissorCached.z, fes._scissorCached.w));
            } else {
                _applyScissor(fes, fes._currentRenderPass!);
            }
            _clearFullQuad(fes, backBuffer ? color : null, depth, stencil);
        }
    }
}

function _clearFullQuad(engineState: IWebGPUEnginePublic, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean): void {
    const fes = engineState as WebGPUEngineStateFull;
    const renderPass = !fes.compatibilityMode ? null : _getCurrentRenderPass(fes);
    const renderPassIndex = _getCurrentRenderPassIndex(fes);
    const bundleList = renderPassIndex === 0 ? fes._bundleList : fes._bundleListRenderTarget;

    fes._clearQuad.setColorFormat(fes._colorFormat);
    fes._clearQuad.setDepthStencilFormat(fes._depthTextureFormat);
    fes._clearQuad.setMRTAttachments(fes._cacheRenderPipeline.mrtAttachments ?? [], fes._cacheRenderPipeline.mrtTextureArray ?? [], fes._cacheRenderPipeline.mrtTextureCount);

    if (!fes.compatibilityMode) {
        bundleList.addItem(new WebGPURenderItemStencilRef(_clearStencilValue));
    } else {
        renderPass!.setStencilReference(_clearStencilValue);
    }

    const bundle = fes._clearQuad.clear(renderPass, clearColor, clearDepth, clearStencil, fes.currentSampleCount);

    if (!fes.compatibilityMode) {
        bundleList.addBundle(bundle!);
        bundleList.addItem(new WebGPURenderItemStencilRef(fes._stencilStateComposer?.funcRef ?? 0));
        _reportDrawCall(fes);
    } else {
        _applyStencilRef(fes, renderPass!);
    }
}

// TEMP - this is a part of an extension
function _debugPushGroup(..._ags: any[]): void {
    // no-op
}

function _debugPopGroup(..._ags: any[]): void {
    // no-op
}

function _debugFlushPendingCommands(..._ags: any[]): void {
    // no-op
}
