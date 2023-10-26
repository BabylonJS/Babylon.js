// import type { IShaderProcessor } from "@babylonjs/core/Engines/Processors/iShaderProcessor.js";
// import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage.js";
// import type { Nullable } from "@babylonjs/core/types.js";
// import { WebGPUShaderProcessorWGSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsWGSL.js";
// import { WebGPUShaderProcessorGLSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsGLSL.js";
// import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals, IBaseEngineOptions } from "./engine.base.js";
// import { initBaseEngineState } from "./engine.base.js";
// import type { WebGPUSnapshotRendering } from "@babylonjs/core/Engines/WebGPU/webgpuSnapshotRendering.js";
// import type { IDrawContext } from "@babylonjs/core/Engines/IDrawContext.js";
// import type { IMaterialContext } from "@babylonjs/core/Engines/IMaterialContext.js";
// import { Version } from "./engine.static.js";
// import { Logger } from "@babylonjs/core/Misc/logger.js";

// // TODO the next two can move to this file
// import type { GlslangOptions } from "@babylonjs/core/Engines/webgpuEngine.js";
// import type { TwgslOptions } from "@babylonjs/core/Engines/WebGPU/webgpuTintWASM.js";
// import { EngineType } from "./engine.interfaces.js";

// export interface IWebGPUEngineOptions extends IBaseEngineOptions, GPURequestAdapterOptions {
//     /**
//      * Defines the category of adapter to use.
//      * Is it the discrete or integrated device.
//      */
//     powerPreference?: GPUPowerPreference;

//     /**
//      * When set to true, indicates that only a fallback adapter may be returned when requesting an adapter.
//      * If the user agent does not support a fallback adapter, will cause requestAdapter() to resolve to null.
//      * Default: false
//      */
//     forceFallbackAdapter?: boolean;

//     /**
//      * Defines the device descriptor used to create a device once we have retrieved an appropriate adapter
//      */
//     deviceDescriptor?: GPUDeviceDescriptor;

//     /**
//      * When requesting the device, enable all the features supported by the adapter. Default: false
//      * Note that this setting is ignored if you explicitely set deviceDescriptor.requiredFeatures
//      */
//     enableAllFeatures?: boolean;

//     /**
//      * When requesting the device, set the required limits to the maximum possible values (the ones from adapter.limits). Default: false
//      * Note that this setting is ignored if you explicitely set deviceDescriptor.requiredLimits
//      */
//     setMaximumLimits?: boolean;

//     /**
//      * Defines the requested Swap Chain Format.
//      */
//     swapChainFormat?: GPUTextureFormat;

//     /**
//      * Defines whether we should generate debug markers in the gpu command lists (can be seen with PIX for eg). Default: false
//      */
//     enableGPUDebugMarkers?: boolean;

//     /**
//      * Options to load the associated Glslang library
//      */
//     glslangOptions?: GlslangOptions;

//     /**
//      * Options to load the associated Twgsl library
//      */
//     twgslOptions?: TwgslOptions;
// }

// interface IWebGPUEnginePrivate {
//     _shaderProcessorWGSL: Nullable<IShaderProcessor>;
//     _snapshotRendering: WebGPUSnapshotRendering;
// }

// export interface IWebGPUEngineProtected extends IBaseEngineProtected {}

// export interface IWebGPUEngineInternals extends IBaseEngineInternals {
//     _currentDrawContext: IDrawContext;
//     _currentMaterialContext: IMaterialContext;
//     _options: IWebGPUEngineOptions;
// }

// export interface IWebGPUEnginePublic extends IBaseEnginePublic {
//     snapshotRendering: boolean;
//     snapshotRenderingMode: number;
// }

// export type WebGPUEngineState = IWebGPUEnginePublic & IWebGPUEngineInternals & IWebGPUEngineProtected;
// export type WebGPUEngineStateFull = WebGPUEngineState & IWebGPUEnginePrivate;

// const _GLSLslangDefaultOptions: GlslangOptions = {
//     jsPath: "glslang/glslang.js",
//     wasmPath: "glslang/glslang.wasm",
// };

// const _uploadEncoderDescriptor = { label: "upload" };
// const _renderEncoderDescriptor = { label: "render" };
// const _renderTargetEncoderDescriptor = { label: "renderTarget" };

// export async function CreateAsyncWebGPUEngine(canvas: HTMLCanvasElement, options?: IWebGPUEngineOptions): Promise<IWebGPUEnginePublic> {
//     const engineState = initWebGPUEngineState(canvas, options);
//     await initAsync(options?.glslangOptions, options?.twgslOptions);

//     return engineState;
// }

// export function initWebGPUEngineState(canvas: HTMLCanvasElement, options: IWebGPUEngineOptions = {}): WebGPUEngineState {
//     const baseEngineState = initBaseEngineState({
//         name: "WebGPU",
//         _type: EngineType.WEBGPU,
//         description: "Babylon.js WebGPU Engine",
//         isNDCHalfZRange: true,
//         hasOriginBottomLeft: false,
//         needPOTTextures: false,
//         _creationOptions: options,
//         _shaderPlatformName: "WEBGPU",
//     });
//     // public and protected
//     const fes = baseEngineState as WebGPUEngineStateFull;
//     fes._shaderProcessor = new WebGPUShaderProcessorGLSL();
//     fes._shaderProcessorWGSL = new WebGPUShaderProcessorWGSL();
//     // fes._snapshotRendering = new WebGPUSnapshotRendering(); // TODO

//     options.deviceDescriptor = options.deviceDescriptor || {};
//     options.enableGPUDebugMarkers = options.enableGPUDebugMarkers ?? false;

//     const versionToLog = `Babylon.js v${Version}`;
//     Logger.Log(versionToLog + ` - ${fes.description}`);
//     if (!navigator.gpu) {
//         const error = "WebGPU is not supported by your browser.";
//         Logger.Error(error);
//         throw error;
//     }

//     options.swapChainFormat = options.swapChainFormat || navigator.gpu.getPreferredCanvasFormat();

//     fes._options = options;

//     fes._mainPassSampleCount = options.antialias ? fes._defaultSampleCount : 1;

//     _setupMobileChecks();

//     _sharedInit(canvas);

//     // TODO - this is a hack to get the snapshotRendering property to work. Normalize it.
//     Object.defineProperty(fes, "snapshotRendering", {
//         get() {
//             return (fes as WebGPUEngineStateFull)._snapshotRendering.enabled;
//         },
//         set(value) {
//             (fes as WebGPUEngineStateFull)._snapshotRendering.enabled = value;
//         },
//     });
//     Object.defineProperty(fes, "snapshotRenderingMode", {
//         get() {
//             return (fes as WebGPUEngineStateFull)._snapshotRendering.mode;
//         },
//         set(value) {
//             (fes as WebGPUEngineStateFull)._snapshotRendering.mode = value;
//         },
//     });

//     return fes;
// }

// //------------------------------------------------------------------------------
// //                              Initialization
// //------------------------------------------------------------------------------

// /**
//  * Initializes the WebGPU context and dependencies.
//  * @param glslangOptions Defines the GLSLang compiler options if necessary
//  * @param twgslOptions Defines the Twgsl compiler options if necessary
//  * @returns a promise notifying the readiness of the engine.
//  */
// export function initAsync(engineState: IWebGPUEnginePublic, glslangOptions?: GlslangOptions, twgslOptions?: TwgslOptions): Promise<void> {
//     return _initGlslang(glslangOptions ?? fes_options?.glslangOptions)
//         .then(
//             (glslang: any) => {
//                 this._glslang = glslang;
//                 this._tintWASM = WebGPUEngine.UseTWGSL ? new WebGPUTintWASM() : null;
//                 return this._tintWASM
//                     ? this._tintWASM.initTwgsl(twgslOptions ?? this._options?.twgslOptions).then(
//                           () => {
//                               return navigator.gpu!.requestAdapter(this._options);
//                           },
//                           (msg: string) => {
//                               Logger.Error("Can not initialize twgsl!");
//                               Logger.Error(msg);
//                               throw Error("WebGPU initializations stopped.");
//                           }
//                       )
//                     : navigator.gpu!.requestAdapter(this._options);
//             },
//             (msg: string) => {
//                 Logger.Error("Can not initialize glslang!");
//                 Logger.Error(msg);
//                 throw Error("WebGPU initializations stopped.");
//             }
//         )
//         .then((adapter: GPUAdapter | undefined) => {
//             if (!adapter) {
//                 throw "Could not retrieve a WebGPU adapter (adapter is null).";
//             } else {
//                 this._adapter = adapter!;
//                 this._adapterSupportedExtensions = [];
//                 this._adapter.features?.forEach((feature) => this._adapterSupportedExtensions.push(feature as WebGPUConstants.FeatureName));
//                 this._adapterSupportedLimits = this._adapter.limits;

//                 this._adapter.requestAdapterInfo().then((adapterInfo) => {
//                     this._adapterInfo = adapterInfo;
//                 });

//                 const deviceDescriptor = this._options.deviceDescriptor ?? {};
//                 const requiredFeatures = deviceDescriptor?.requiredFeatures ?? (this._options.enableAllFeatures ? this._adapterSupportedExtensions : undefined);

//                 if (requiredFeatures) {
//                     const requestedExtensions = requiredFeatures;
//                     const validExtensions: GPUFeatureName[] = [];

//                     for (const extension of requestedExtensions) {
//                         if (this._adapterSupportedExtensions.indexOf(extension) !== -1) {
//                             validExtensions.push(extension);
//                         }
//                     }

//                     deviceDescriptor.requiredFeatures = validExtensions;
//                 }

//                 if (this._options.setMaximumLimits && !deviceDescriptor.requiredLimits) {
//                     deviceDescriptor.requiredLimits = {};
//                     for (const name in this._adapterSupportedLimits) {
//                         deviceDescriptor.requiredLimits[name] = this._adapterSupportedLimits[name];
//                     }
//                 }

//                 return this._adapter.requestDevice(deviceDescriptor);
//             }
//         })
//         .then(
//             (device: GPUDevice) => {
//                 this._device = device;
//                 this._deviceEnabledExtensions = [];
//                 this._device.features?.forEach((feature) => this._deviceEnabledExtensions.push(feature as WebGPUConstants.FeatureName));
//                 this._deviceLimits = device.limits;

//                 let numUncapturedErrors = -1;
//                 this._device.addEventListener("uncapturederror", (event) => {
//                     if (++numUncapturedErrors < this.numMaxUncapturedErrors) {
//                         Logger.Warn(`WebGPU uncaptured error (${numUncapturedErrors + 1}): ${(<GPUUncapturedErrorEvent>event).error} - ${(<any>event).error.message}`);
//                     } else if (numUncapturedErrors++ === this.numMaxUncapturedErrors) {
//                         Logger.Warn(
//                             `WebGPU uncaptured error: too many warnings (${this.numMaxUncapturedErrors}), no more warnings will be reported to the console for this engine.`
//                         );
//                     }
//                 });

//                 if (!this._doNotHandleContextLost) {
//                     this._device.lost?.then((info) => {
//                         if (this._isDisposed) {
//                             return;
//                         }
//                         this._contextWasLost = true;
//                         Logger.Warn("WebGPU context lost. " + info);
//                         this.onContextLostObservable.notifyObservers(this);
//                         this._restoreEngineAfterContextLost(this.initAsync.bind(this));
//                     });
//                 }
//             },
//             (e: any) => {
//                 Logger.Error("Could not retrieve a WebGPU device.");
//                 Logger.Error(e);
//             }
//         )
//         .then(() => {
//             this._bufferManager = new WebGPUBufferManager(this._device);
//             this._textureHelper = new WebGPUTextureHelper(this._device, this._glslang, this._tintWASM, this._bufferManager, this._deviceEnabledExtensions);
//             this._cacheSampler = new WebGPUCacheSampler(this._device);
//             this._cacheBindGroups = new WebGPUCacheBindGroups(this._device, this._cacheSampler, this);
//             this._timestampQuery = new WebGPUTimestampQuery(this._device, this._bufferManager);
//             this._occlusionQuery = (this._device as any).createQuerySet ? new WebGPUOcclusionQuery(this, this._device, this._bufferManager) : (undefined as any);
//             this._bundleList = new WebGPUBundleList(this._device);
//             this._bundleListRenderTarget = new WebGPUBundleList(this._device);
//             this._snapshotRendering = new WebGPUSnapshotRendering(this, this._snapshotRenderingMode, this._bundleList, this._bundleListRenderTarget);

//             this._ubInvertY = this._bufferManager.createBuffer(new Float32Array([-1, 0]), WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);
//             this._ubDontInvertY = this._bufferManager.createBuffer(new Float32Array([1, 0]), WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);

//             if (this.dbgVerboseLogsForFirstFrames) {
//                 if ((this as any)._count === undefined) {
//                     (this as any)._count = 0;
//                     console.log("%c frame #" + (this as any)._count + " - begin", "background: #ffff00");
//                 }
//             }

//             this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
//             this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);
//             this._renderTargetEncoder = this._device.createCommandEncoder(this._renderTargetEncoderDescriptor);

//             this._emptyVertexBuffer = new VertexBuffer(this, [0], "", false, false, 1, false, 0, 1);

//             this._initializeLimits();

//             this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, this._emptyVertexBuffer, !this._caps.textureFloatLinearFiltering);

//             this._depthCullingState = new WebGPUDepthCullingState(this._cacheRenderPipeline);
//             this._stencilStateComposer = new WebGPUStencilStateComposer(this._cacheRenderPipeline);
//             this._stencilStateComposer.stencilGlobal = this._stencilState;

//             this._depthCullingState.depthTest = true;
//             this._depthCullingState.depthFunc = Constants.LEQUAL;
//             this._depthCullingState.depthMask = true;

//             this._textureHelper.setCommandEncoder(this._uploadEncoder);

//             this._clearQuad = new WebGPUClearQuad(this._device, this, this._emptyVertexBuffer);
//             this._defaultDrawContext = this.createDrawContext()!;
//             this._currentDrawContext = this._defaultDrawContext;
//             this._defaultMaterialContext = this.createMaterialContext()!;
//             this._currentMaterialContext = this._defaultMaterialContext;

//             this._initializeContextAndSwapChain();
//             this._initializeMainAttachments();
//             this.resize();
//         })
//         .catch((e: any) => {
//             Logger.Error("Can not create WebGPU Device and/or context.");
//             Logger.Error(e);
//             if (console.trace) {
//                 console.trace();
//             }
//         });
// }

// export function _getShaderProcessor(engineState: IWebGPUEnginePublic, shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
//     // private member(s) of webgpu
//     const { _shaderProcessorWGSL: shaderProcessorWGSL, _shaderProcessor } = engineState as WebGPUEngineStateFull;
//     if (shaderLanguage === ShaderLanguage.WGSL) {
//         return shaderProcessorWGSL;
//     }
//     return _shaderProcessor;
// }

// export function isWebGPU(engineState: IBaseEnginePublic): engineState is WebGPUEngineState {
//     return engineState.name === "WebGPU";
// }

// export function resetSnapshotRendering(engineState: IWebGPUEnginePublic) {
//     (engineState as WebGPUEngineStateFull)._snapshotRendering.reset();
// }

// /**
//  * @internal
//  */
// export function _getUseSRGBBuffer(engineState: IWebGPUEnginePublic, useSRGBBuffer: boolean, noMipmap: boolean): boolean {
//     // Generating mipmaps for sRGB textures is not supported in WebGL1 so we must disable the support if mipmaps is enabled
//     return useSRGBBuffer && (engineState as WebGPUEngineState)._caps.supportSRGBBuffers && (isWebGPU(engineState) || noMipmap);
// }
