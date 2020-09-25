import { Logger } from "../Misc/logger";
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
import * as WebGPUConstants from './webGPU/webgpuConstants';
import { VertexBuffer } from "../Meshes/buffer";
import { WebGPUPipelineContext, IWebGPUPipelineContextVertexInputsCache, IWebGPURenderPipelineStageDescriptor } from './WebGPU/webgpuPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { DataBuffer } from '../Meshes/dataBuffer';
import { WebGPUDataBuffer } from '../Meshes/WebGPU/webgpuDataBuffer';
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { IShaderProcessor } from "./Processors/iShaderProcessor";
import { WebGPUShaderProcessor } from "./WebGPU/webgpuShaderProcessors";
import { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from "./WebGPU/webgpuShaderProcessingContext";
import { Tools } from "../Misc/tools";
import { WebGPUTextureHelper } from './WebGPU/webgpuTextureHelper';
import { ISceneLike, ThinEngine } from './thinEngine';
import { Scene } from '../scene';
import { WebGPUBufferManager } from './WebGPU/webgpuBufferManager';
import { DepthTextureCreationOptions } from './depthTextureCreationOptions';
import { HardwareTextureWrapper } from '../Materials/Textures/hardwareTextureWrapper';
import { WebGPUHardwareTexture } from './WebGPU/webgpuHardwareTexture';
import { IColor4Like } from '../Maths/math.like';

declare type VideoTexture = import("../Materials/Textures/videoTexture").VideoTexture;

/**
 * Options to load the associated Glslang library
 */
export interface GlslangOptions {
    /**
     * Defines an existing instance of Glslang (usefull in modules who do not access the global instance).
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
     * Defines wether MSAA is enabled on the canvas.
     */
    antialiasing?: boolean;
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
    private readonly _clearDepthValue = 1;
    private readonly _clearStencilValue = 0;
    private readonly _defaultSampleCount = 4; // Only supported value for now.

    // Engine Life Cycle
    private _canvas: HTMLCanvasElement;
    private _options: WebGPUEngineOptions;
    private _glslang: any = null;
    private _adapter: GPUAdapter;
    private _adapterSupportedExtensions: GPUExtensionName[];
    private _device: GPUDevice;
    private _deviceEnabledExtensions: GPUExtensionName[];
    private _context: GPUCanvasContext;
    private _swapChain: GPUSwapChain;
    private _swapChainTexture: GPUTexture;
    private _mainPassSampleCount: number;
    private _textureHelper: WebGPUTextureHelper;
    private _bufferManager: WebGPUBufferManager;

    // Some of the internal state might change during the render pass.
    // This happens mainly during clear for the state
    // And when the frame starts to swap the target texture from the swap chain
    private _mainTexture: GPUTexture;
    private _depthTexture: GPUTexture;
    private _mainColorAttachments: GPURenderPassColorAttachmentDescriptor[];
    private _mainTextureExtends: GPUExtent3D;
    private _mainDepthAttachment: GPURenderPassDepthStencilAttachmentDescriptor;

    // Frame Life Cycle (recreated each frame)
    private _uploadEncoder: GPUCommandEncoder;
    private _renderEncoder: GPUCommandEncoder;

    private _commandBuffers: GPUCommandBuffer[] = [null as any, null as any];

    // Frame Buffer Life Cycle (recreated for each render target pass)
    private _currentRenderPass: Nullable<GPURenderPassEncoder> = null;

    // DrawCall Life Cycle
    // Effect is on the parent class
    // protected _currentEffect: Nullable<Effect> = null;
    private _currentVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }> = null;
    private _currentIndexBuffer: Nullable<DataBuffer> = null;
    private __colorWrite = true;
    private _uniformsBuffers: { [name: string]: WebGPUDataBuffer } = {};

    // Caches
    private _compiledShaders: { [key: string]: {
        stages: IWebGPURenderPipelineStageDescriptor,
        availableAttributes: { [key: string]: number },
        availableUBOs: { [key: string]: { setIndex: number, bindingIndex: number} },
        availableSamplers: { [key: string]: { setIndex: number, bindingIndex: number} },
        orderedAttributes: string[],
        orderedUBOsAndSamplers: { name: string, isSampler: boolean }[][],
        leftOverUniforms: { name: string, type: string, length: number }[],
        leftOverUniformsByName: { [name: string]: string },
        sources: {
            vertex: string
            fragment: string,
        }
    } } = {};

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     */
    public get supportsUniformBuffers(): boolean {
        return true;
    }

    /** Gets the supported extensions by the WebGPU adapter */
    public get supportedExtensions(): Immutable<GPUExtensionName[]> {
        return this._adapterSupportedExtensions;
    }

    /** Gets the currently enabled extensions on the WebGPU device */
    public get enabledExtensions(): Immutable<GPUExtensionName[]> {
        return this._deviceEnabledExtensions;
    }

    /**
     * Create a new instance of the gpu engine.
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     */
    public constructor(canvas: HTMLCanvasElement, options: WebGPUEngineOptions = {}) {
        super(null);

        ThinEngine.Features.forceBitmapOverHTMLImageElement = true;
        ThinEngine.Features.supportRenderAndCopyToLodForFloatTextures = false; // TODO WEBGPU should be true but needs RTT support first for env texture to be generated correctly with this flag on
        ThinEngine.Features.framebuffersHaveYTopToBottom = true;

        options.deviceDescriptor = options.deviceDescriptor || { };
        options.swapChainFormat = options.swapChainFormat || WebGPUConstants.TextureFormat.BGRA8Unorm;
        options.antialiasing = options.antialiasing === undefined ? true : options.antialiasing;

        Logger.Log(`Babylon.js v${Engine.Version} - WebGPU engine`);
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

        this._doNotHandleContextLost = true;

        this._canvas = canvas;
        this._options = options;

        this._hardwareScalingLevel = 1;
        this._mainPassSampleCount = options.antialiasing ? this._defaultSampleCount : 1;

        this._sharedInit(canvas, !!options.doNotHandleTouchAction, options.audioEngine);
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
        return this._initGlslang(glslangOptions)
            .then((glslang: any) => {
                this._glslang = glslang;
                return navigator.gpu!.requestAdapter(this._options);
            })
            .then((adapter: GPUAdapter | null) => {
                this._adapter = adapter!;
                this._adapterSupportedExtensions = this._adapter.extensions.slice(0);

                const deviceDescriptor = this._options.deviceDescriptor;

                if (deviceDescriptor?.extensions) {
                    const requestedExtensions = deviceDescriptor.extensions;
                    const validExtensions = [];

                    const iterator = requestedExtensions[Symbol.iterator]();
                    while (true) {
                        const { done, value : extension } = iterator.next();
                        if (done) {
                            break;
                        }
                        if (this._adapterSupportedExtensions.indexOf(extension) >= 0) {
                            validExtensions.push(extension);
                        }
                    }

                    deviceDescriptor.extensions = validExtensions;
                }

                return this._adapter.requestDevice(this._options.deviceDescriptor);
            })
            .then((device: GPUDevice | null) => {
                this._device = device!;
                this._deviceEnabledExtensions = this._device.extensions.slice(0);
            })
            .then(() => {
                this._bufferManager = new WebGPUBufferManager(this._device);
                this._textureHelper = new WebGPUTextureHelper(this._device, this._glslang, this._bufferManager);

                this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
                this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);

                this._initializeLimits();
                this._initializeContextAndSwapChain();
                this._initializeMainAttachments();
                this.resize();
            })
            .catch((e: any) => {
                Logger.Error("Can not create WebGPU Device and/or context.");
                Logger.Error(e);
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
            s3tc: (this._deviceEnabledExtensions.indexOf(WebGPUConstants.ExtensionName.TextureCompressionBC) >= 0 ? true : undefined) as any,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: this._deviceEnabledExtensions.indexOf(WebGPUConstants.ExtensionName.TextureCompressionBC) >= 0 ? true : undefined,
            maxAnisotropy: 0,  // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
            uintIndices: false,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: false,
            textureFloat: true,
            textureFloatLinearFiltering: false,
            textureFloatRender: false,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: false,
            textureHalfFloatRender: false,
            textureLOD: true,
            drawBuffersExtension: true,
            depthTextureExtension: true,
            vertexArrayObject: false,
            instancedArrays: true,
            canUseTimestampForTimerQuery: false,
            blendMinMax: false,
            maxMSAASamples: 1
        };

        this._caps.parallelShaderCompile = null as any;
    }

    private _initializeContextAndSwapChain(): void {
        this._context = this._canvas.getContext('gpupresent') as unknown as GPUCanvasContext;
        this._swapChain = this._context.configureSwapChain({
            device: this._device,
            format: this._options.swapChainFormat!,
            usage: WebGPUConstants.TextureUsage.OutputAttachment | WebGPUConstants.TextureUsage.CopySrc,
        });
        // TODO WEBGPU remove debug code
        this._context.getSwapChainPreferredFormat(this._device).then((format) => {
            console.log("Swap chain preferred format:", format);
        });
    }

    // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
    private _initializeMainAttachments(): void {
        this._mainTextureExtends = {
            width: this.getRenderWidth(),
            height: this.getRenderHeight(),
            depth: 1
        };

        if (this._options.antialiasing) {
            const mainTextureDescriptor: GPUTextureDescriptor = {
                size: this._mainTextureExtends,
                mipLevelCount: 1,
                sampleCount: this._mainPassSampleCount,
                dimension: WebGPUConstants.TextureDimension.E2d,
                format: WebGPUConstants.TextureFormat.BGRA8Unorm,
                usage: WebGPUConstants.TextureUsage.OutputAttachment,
            };

            if (this._mainTexture) {
                this._mainTexture.destroy();
            }
            this._mainTexture = this._device.createTexture(mainTextureDescriptor);
            this._mainColorAttachments = [{
                attachment: this._mainTexture.createView(),
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.StoreOp.Clear // Better than "Store" as we don't need to reuse the content of the multisampled texture
            }];
        }
        else {
            this._mainColorAttachments = [{
                attachment: undefined as any,
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.StoreOp.Store
            }];
        }

        const depthTextureDescriptor: GPUTextureDescriptor = {
            size: this._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: this._mainPassSampleCount,
            dimension: WebGPUConstants.TextureDimension.E2d,
            format: WebGPUConstants.TextureFormat.Depth24PlusStencil8,
            usage:  WebGPUConstants.TextureUsage.OutputAttachment
        };

        if (this._depthTexture) {
            this._depthTexture.destroy();
        }
        this._depthTexture = this._device.createTexture(depthTextureDescriptor);
        this._mainDepthAttachment = {
            attachment: this._depthTexture.createView(),

            depthLoadValue: this._clearDepthValue,
            depthStoreOp: WebGPUConstants.StoreOp.Store,
            stencilLoadValue: this._clearStencilValue,
            stencilStoreOp: WebGPUConstants.StoreOp.Store,
        };
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

    //------------------------------------------------------------------------------
    //                          Static Pipeline WebGPU States
    //------------------------------------------------------------------------------

    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();

        this._currentEffect = null;
        this._currentIndexBuffer = null;
        this._currentVertexBuffers = null;

        if (bruteForce) {
            this._currentProgram = null;

            this._stencilState.reset();
            this._depthCullingState.reset();
            this._alphaState.reset();
        }

        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }

    public setColorWrite(enable: boolean): void {
        this.__colorWrite = enable;
    }

    public getColorWrite(): boolean {
        return this.__colorWrite;
    }

    //------------------------------------------------------------------------------
    //                              Dynamic WebGPU States
    //------------------------------------------------------------------------------

    public _viewport(x: number, y: number, width: number, height: number): void {
        // TODO WEBGPU. Cache.
        // if (x !== this._viewportCached.x ||
        //     y !== this._viewportCached.y ||
        //     width !== this._viewportCached.z ||
        //     height !== this._viewportCached.w) {
        //     this._viewportCached.x = x;
        //     this._viewportCached.y = y;
        //     this._viewportCached.z = width;
        //     this._viewportCached.w = height;

        //     this._gl.viewport(x, y, width, height);
        // }
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }
        // TODO WEBGPU. Viewport.
        // Use 0 1 like the default webgl values.
        // this._currentRenderPass!.setViewport(x, y, width, height, 0, 1);
    }

    public enableScissor(x: number, y: number, width: number, height: number): void {
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }

        this._currentRenderPass!.setScissorRect(x, y, width, height);
    }

    public disableScissor() {
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }

        this._currentRenderPass!.setScissorRect(0, 0, this.getRenderWidth(), this.getRenderHeight());
    }

    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        // Some PGs are using color3...
        if (color && color.a === undefined) {
            color.a = 1;
        }

        // TODO WEBGPU handle calling this function multiple times in a frame (for eg in the case of multi cameras) - handle reverse depth buffer
        this._mainColorAttachments[0].loadValue = backBuffer && color ? color : WebGPUConstants.LoadOp.Load;

        this._mainDepthAttachment.depthLoadValue = depth ? this._clearDepthValue : WebGPUConstants.LoadOp.Load;
        this._mainDepthAttachment.stencilLoadValue = stencil ? this._clearStencilValue : WebGPUConstants.LoadOp.Load;

        this._startMainRenderPass();
    }

    //------------------------------------------------------------------------------
    //                              Vertex/Index Buffers
    //------------------------------------------------------------------------------

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

    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        return this.createVertexBuffer(data);
    }

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

    public createIndexBuffer(data: IndicesArray): DataBuffer {
        let is32Bits = true;
        let view: ArrayBufferView;

        if (data instanceof Uint32Array || data instanceof Int32Array) {
            view = data;
        }
        else if (data instanceof Uint16Array) {
            view = data;
            is32Bits = false;
        }
        else {
            if (data.length > 65535) {
                view = new Uint32Array(data);
            }
            else {
                view = new Uint16Array(data);
                is32Bits = false;
            }
        }

        const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Index | WebGPUConstants.BufferUsage.CopyDst);
        dataBuffer.is32Bits = is32Bits;
        return dataBuffer;
    }

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

    public bindBuffersDirectly(vertexBuffer: DataBuffer, indexBuffer: DataBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
        throw "Not implemented on WebGPU so far.";
    }

    public updateAndBindInstancesBuffer(instancesBuffer: DataBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
        throw "Not implemented on WebGPU so far.";
    }

    public bindBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, indexBuffer: Nullable<DataBuffer>, effect: Effect): void {
        // TODO WEBGPU why not caching also effect?
        this._currentIndexBuffer = indexBuffer;
        this._currentVertexBuffers = vertexBuffers;
    }

    /** @hidden */
    public _releaseBuffer(buffer: DataBuffer): boolean {
        buffer.references--;

        if (buffer.references === 0) {
            (buffer.underlyingResource as GPUBuffer).destroy();
            return true;
        }

        return false;
    }

    //------------------------------------------------------------------------------
    //                              UBO
    //------------------------------------------------------------------------------

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

    public createDynamicUniformBuffer(elements: FloatArray): DataBuffer {
        return this.createUniformBuffer(elements);
    }

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

    public bindUniformBufferBase(buffer: DataBuffer, location: number, name: string): void {
        this._uniformsBuffers[name] = buffer as WebGPUDataBuffer;
    }

    //------------------------------------------------------------------------------
    //                              Effects
    //------------------------------------------------------------------------------

    public createEffect(baseName: any, attributesNamesOrOptions: string[] | IEffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any): Effect {
        const vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName.vertexSource || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName.fragmentSource || baseName;

        const name = vertex + "+" + fragment + "@" + (defines ? defines : (<IEffectCreationOptions>attributesNamesOrOptions).defines);
        const shader = this._compiledShaders[name];
        if (shader) {
            return new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters, name, shader.sources);
        }
        else {
            return new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters, name);
        }
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

    public createRawShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        throw "Not available on WebGPU";
    }

    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        throw "Not available on WebGPU";
    }

    public createPipelineContext(shaderProcessingContext: Nullable<ShaderProcessingContext>): IPipelineContext {
        var pipelineContext = new WebGPUPipelineContext(shaderProcessingContext! as WebGPUShaderProcessingContext, this);
        pipelineContext.engine = this;
        return pipelineContext;
    }

    /** @hidden */
    public _preparePipelineContext(pipelineContext: IPipelineContext, vertexSourceCode: string, fragmentSourceCode: string, createAsRaw: boolean,
        rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>,
        key: string) {
        const webGpuContext = pipelineContext as WebGPUPipelineContext;

        // TODO WEBGPU. Check if caches could be reuse from piepline ???
        const shader = this._compiledShaders[key];
        if (shader) {
            webGpuContext.stages = shader.stages;
            webGpuContext.availableAttributes = shader.availableAttributes;
            webGpuContext.availableUBOs = shader.availableUBOs;
            webGpuContext.availableSamplers = shader.availableSamplers;
            webGpuContext.orderedAttributes = shader.orderedAttributes;
            webGpuContext.orderedUBOsAndSamplers = shader.orderedUBOsAndSamplers;
            webGpuContext.leftOverUniforms = shader.leftOverUniforms;
            webGpuContext.leftOverUniformsByName = shader.leftOverUniformsByName;
            webGpuContext.sources = shader.sources;
        }
        else {
            webGpuContext.sources = {
                fragment: fragmentSourceCode,
                vertex: vertexSourceCode
            };

            if (createAsRaw) {
                webGpuContext.stages = this._compileRawPipelineStageDescriptor(vertexSourceCode, fragmentSourceCode);
            }
            else {
                webGpuContext.stages = this._compilePipelineStageDescriptor(vertexSourceCode, fragmentSourceCode, defines);
            }

            this._compiledShaders[key] = {
                stages: webGpuContext.stages,
                availableAttributes: webGpuContext.availableAttributes,
                availableUBOs: webGpuContext.availableUBOs,
                availableSamplers: webGpuContext.availableSamplers,
                orderedAttributes: webGpuContext.orderedAttributes,
                orderedUBOsAndSamplers: webGpuContext.orderedUBOsAndSamplers,
                leftOverUniforms: webGpuContext.leftOverUniforms,
                leftOverUniformsByName: webGpuContext.leftOverUniformsByName,
                sources: webGpuContext.sources
            };
        }
    }

    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const results = new Array(attributesNames.length);
        const gpuPipelineContext = (pipelineContext as WebGPUPipelineContext);

        // TODO WEBGPU. Hard coded for WebGPU until an introspection lib is available.
        // Should be done at processing time, not need to double the work in here.
        for (let i = 0; i < attributesNames.length; i++) {
            const attributeName = attributesNames[i];
            const attributeLocation = gpuPipelineContext.availableAttributes[attributeName];
            if (attributeLocation === undefined) {
                continue;
            }

            results[i] = attributeLocation;
        }

        return results;
    }

    public enableEffect(effect: Effect): void {
        this._currentEffect = effect;

        if (effect.onBind) {
            effect.onBind(effect);
        }
        if (effect._onBindObservable) {
            effect._onBindObservable.notifyObservers(effect);
        }
    }

    public _releaseEffect(effect: Effect): void {
        // Effect gets garbage collected without explicit destroy in WebGPU.
    }

    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseEffects() {
        // Effect gets garbage collected without explicit destroy in WebGPU.
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

    /** @hidden */
    public _createHardwareTexture(): HardwareTextureWrapper {
        return new WebGPUHardwareTexture();
    }

    /** @hidden */
    public _releaseTexture(texture: InternalTexture): void {
        texture._hardwareTexture?.release();

        // TODO WEBGPU remove debug code
        (texture as any)._released = true;

        const index = this._internalTexturesCache.indexOf(texture);
        if (index !== -1) {
            this._internalTexturesCache.splice(index, 1);
        }
    }

    private _getSamplerFilterDescriptor(internalTexture: InternalTexture): {
        magFilter: GPUFilterMode,
        minFilter: GPUFilterMode,
        mipmapFilter: GPUFilterMode
    } {
        let magFilter: GPUFilterMode, minFilter: GPUFilterMode, mipmapFilter: GPUFilterMode;
        switch (internalTexture.samplingMode) {
            case Engine.TEXTURE_BILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_TRILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Linear;
                break;
            case Engine.TEXTURE_NEAREST_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Linear;
                break;
            case Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Linear;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_NEAREST_NEAREST:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Linear;
                break;
            case Engine.TEXTURE_LINEAR_LINEAR:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                break;
            default:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Linear;
                break;
        }

        return {
            magFilter,
            minFilter,
            mipmapFilter
        };
    }

    /** @hidden */
    public _getWebGPUInternalFormat(format: number): GPUTextureFormat {
        let internalFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;

        switch (format) {
            case Constants.TEXTUREFORMAT_ALPHA:
                throw "TEXTUREFORMAT_ALPHA format not supported in WebGPU";
            case Constants.TEXTUREFORMAT_LUMINANCE:
                throw "TEXTUREFORMAT_LUMINANCE format not supported in WebGPU";
            case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                throw "TEXTUREFORMAT_LUMINANCE_ALPHA format not supported in WebGPU";
            case Constants.TEXTUREFORMAT_RED:
                internalFormat = WebGPUConstants.TextureFormat.R8Snorm;
            case Constants.TEXTUREFORMAT_RG:
                internalFormat = WebGPUConstants.TextureFormat.RG8Snorm;
            case Constants.TEXTUREFORMAT_RGB:
                throw "RGB format not supported in WebGPU";
            case Constants.TEXTUREFORMAT_RGBA:
                internalFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;
        }

        return internalFormat;
    }

    /** @hidden */
    public _getRGBABufferInternalSizedFormat(type: number, format?: number): number {
        return Constants.TEXTUREFORMAT_RGBA;
    }

    private _getWebGPUTextureFormat(type: number, format: number): GPUTextureFormat {
        switch (format) {
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                return WebGPUConstants.TextureFormat.BC7RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBUFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBSFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                return WebGPUConstants.TextureFormat.BC3RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
                return WebGPUConstants.TextureFormat.BC2RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
                return WebGPUConstants.TextureFormat.BC1RGBAUNorm;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R8Snorm;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG8Snorm;
                    case Constants.TEXTUREFORMAT_RGB:
                        throw "RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R8Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG8Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA8Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA8Snorm;
                }
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R8Unorm;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG8Unorm;
                    case Constants.TEXTUREFORMAT_RGB:
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGBA8Unorm;
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R8Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG8Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA8Uint;
                    case Constants.TEXTUREFORMAT_ALPHA:
                        throw "TEXTUREFORMAT_ALPHA format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        throw "TEXTUREFORMAT_LUMINANCE format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        throw "TEXTUREFORMAT_LUMINANCE_ALPHA format not supported in WebGPU";
                    default:
                        return WebGPUConstants.TextureFormat.RGBA8Unorm;
                }
            case Constants.TEXTURETYPE_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R16Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG16Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA16Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Sint;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R16Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG16Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA16Uint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Uint;
                }
            case Constants.TEXTURETYPE_INT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R32Sint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG32Sint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA32Sint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Sint;
                }
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return WebGPUConstants.TextureFormat.R32Uint;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return WebGPUConstants.TextureFormat.RG32Uint;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        throw "TEXTUREFORMAT_RGB_INTEGER format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return WebGPUConstants.TextureFormat.RGBA32Uint;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Uint;
                }
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R32Float; // By default. Other possibility is R16Float.
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG32Float; // By default. Other possibility is RG16Float.
                    case Constants.TEXTUREFORMAT_RGB:
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGBA32Float; // By default. Other possibility is RGBA16Float.
                    default:
                        return WebGPUConstants.TextureFormat.RGBA32Float;
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return WebGPUConstants.TextureFormat.R16Float;
                    case Constants.TEXTUREFORMAT_RG:
                        return WebGPUConstants.TextureFormat.RG16Float;
                    case Constants.TEXTUREFORMAT_RGB:
                        throw "TEXTUREFORMAT_RGB format not supported in WebGPU";
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGBA16Float;
                    default:
                        return WebGPUConstants.TextureFormat.RGBA16Float;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                throw "TEXTURETYPE_UNSIGNED_SHORT_5_6_5 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                throw "TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                throw "TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                throw "TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                throw "TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 format not supported in WebGPU";
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return WebGPUConstants.TextureFormat.RGB10A2Unorm;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        throw "TEXTUREFORMAT_RGBA_INTEGER format not supported in WebGPU when type is TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV";
                    default:
                        return WebGPUConstants.TextureFormat.RGB10A2Unorm;
                }
        }

        return WebGPUConstants.TextureFormat.RGBA8Unorm;
    }

    private _getWrappingMode(mode: number): GPUAddressMode {
        switch (mode) {
            case Engine.TEXTURE_WRAP_ADDRESSMODE:
                return WebGPUConstants.AddressMode.Repeat;
            case Engine.TEXTURE_CLAMP_ADDRESSMODE:
                return WebGPUConstants.AddressMode.ClampToEdge;
            case Engine.TEXTURE_MIRROR_ADDRESSMODE:
                return WebGPUConstants.AddressMode.MirrorRepeat;
        }
        return WebGPUConstants.AddressMode.Repeat;
    }

    private _getSamplerWrappingDescriptor(internalTexture: InternalTexture): {
        addressModeU: GPUAddressMode,
        addressModeV: GPUAddressMode,
        addressModeW: GPUAddressMode
    } {
        return {
            addressModeU: this._getWrappingMode(internalTexture._cachedWrapU!),
            addressModeV: this._getWrappingMode(internalTexture._cachedWrapV!),
            addressModeW: this._getWrappingMode(internalTexture._cachedWrapR!),
        };
    }

    private _getSamplerDescriptor(internalTexture: InternalTexture): GPUSamplerDescriptor {
        return {
            ...this._getSamplerFilterDescriptor(internalTexture),
            ...this._getSamplerWrappingDescriptor(internalTexture),
        };
    }

    public createTexture(url: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<ISceneLike>, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null, mimeType?: string): InternalTexture {

        // TODO WEBGPU. this._options.textureSize
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
                        const gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture, imageBitmap.width, imageBitmap.height);

                        if (this._textureHelper.isImageBitmap(imageBitmap)) {
                            this._textureHelper.updateTexture(imageBitmap, gpuTextureWrapper.underlyingResource!, imageBitmap.width, imageBitmap.height, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0, this._uploadEncoder);
                            if (!noMipmap && !isCompressed) {
                                this._generateMipmaps(texture, texture._hardwareTexture!.underlyingResource);
                            }
                        }
                    } else if (!noMipmap && !isCompressed) {
                        this._generateMipmaps(texture, texture._hardwareTexture!.underlyingResource);
                    }

                    if (scene) {
                        scene._removePendingData(texture);
                    }

                    texture.isReady = true;

                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();
            },
            () => false,
            buffer, fallback, format, forcedExtension, mimeType
        );
    }

    /** @hidden */
    public _setCubeMapTextureParams(texture: InternalTexture, loadMipmap: boolean) {
        texture.samplingMode = loadMipmap ? Engine.TEXTURE_TRILINEAR_SAMPLINGMODE : Engine.TEXTURE_BILINEAR_SAMPLINGMODE;

        // TODO WEBGPU the webgl code also sets wraps / wrapt to CLAMP_TO_EDGE by calling gl.texParameteri but we can't do it as wrapu/wraps are properties of BaseTexture
    }

    public createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null): InternalTexture {

        return this.createCubeTextureBase(
            rootUrl, scene, files, !!noMipmap, onLoad, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, fallback,
            null,
            (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
                const imageBitmaps = imgs as ImageBitmap[]; // we will always get an ImageBitmap array in WebGPU
                const width = imageBitmaps[0].width;
                const height = width;

                // TODO WEBGPU. Cube Texture Sampling Mode.
                texture.samplingMode = noMipmap ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
                texture.format = format ?? -1;

                const gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture, width, height);

                this._textureHelper.updateCubeTextures(imageBitmaps, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, false, false, 0, 0, this._uploadEncoder);

                texture.isReady = true;

                texture.onLoadedObservable.notifyObservers(texture);
                texture.onLoadedObservable.clear();

                if (onLoad) {
                    onLoad();
                }
            }
        );
    }

    public generateMipMapsForCubemap(texture: InternalTexture, unbind = true) {
        if (texture.generateMipMaps) {
            let gpuTexture = texture._hardwareTexture?.underlyingResource;

            if (!gpuTexture) {
                gpuTexture = this._createGPUTextureForInternalTexture(texture);
            }

            this._textureHelper.generateCubeMipmaps(gpuTexture, WebGPUTextureHelper.computeNumMipmapLevels(texture.width, texture.height), this._uploadEncoder);
        }
    }

    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
        texture.samplingMode = samplingMode;
    }

    public setTexture(channel: number, _: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>, name: string): void {
        if (this._currentEffect) {
            const webgpuPipelineContext = this._currentEffect._pipelineContext as WebGPUPipelineContext;
            if (!texture) {
                if (webgpuPipelineContext.samplers[name] && webgpuPipelineContext.samplers[name]!.texture) {
                    webgpuPipelineContext.bindGroups = null as any; // the bind groups need to be rebuilt (at least the bind group owning this texture, but it's easier to just have them all rebuilt)
                }
                webgpuPipelineContext.samplers[name] = null;
                return;
            }

            const internalTexture = texture!.getInternalTexture();
            if (internalTexture) {
                internalTexture._cachedWrapU = texture.wrapU;
                internalTexture._cachedWrapV = texture.wrapV;
                internalTexture._cachedWrapR = texture.wrapR;
            }

            // TODO WEBGPU remove debug code
            if ((internalTexture as any)._released) {
                console.error("using a released texture in engine.setTexture!", internalTexture);
                debugger;
            }

            if (webgpuPipelineContext.samplers[name]) {
                if (webgpuPipelineContext.samplers[name]!.texture !== internalTexture) {
                    webgpuPipelineContext.bindGroups = null as any; // the bind groups need to be rebuilt (at least the bind group owning this texture, but it's easier to just have them all rebuilt)
                }
                webgpuPipelineContext.samplers[name]!.texture = internalTexture!;
            }
            else {
                // TODO WEBGPU. 121 mapping samplers <-> availableSamplers
                const availableSampler = webgpuPipelineContext.availableSamplers[name];
                if (availableSampler) {
                    webgpuPipelineContext.samplers[name] = {
                        setIndex: availableSampler.setIndex,
                        textureBinding: availableSampler.bindingIndex,
                        samplerBinding: availableSampler.bindingIndex + 1,
                        texture: internalTexture!
                    };
                }
            }

            // Video
            if ((<VideoTexture>texture).video) {
                this._activeChannel = channel;
                (<VideoTexture>texture).update();
            } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return;
            }
        }
    }

    public bindSamplers(effect: Effect): void { }

    public _bindTextureDirectly(target: number, texture: InternalTexture): boolean {
        if (this._boundTexturesCache[this._activeChannel] !== texture) {
            this._boundTexturesCache[this._activeChannel] = texture;
            return true;
        }
        return false;
    }

    /** @hidden */
    public _bindTexture(channel: number, texture: InternalTexture): void {
        if (channel < 0) {
            return;
        }

        this._bindTextureDirectly(0, texture);
    }

    private _createGPUTextureForInternalTexture(texture: InternalTexture, width?: number, height?: number): WebGPUHardwareTexture {
        if (!texture._hardwareTexture) {
            texture._hardwareTexture = this._createHardwareTexture();
        }

        if (width === undefined) {
            width = texture.width;
        }
        if (height === undefined) {
            height = texture.height;
        }

        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        gpuTextureWrapper.format = this._getWebGPUTextureFormat(texture.type, texture.format);

        if (texture.isCube) {
            const gpuTexture = this._textureHelper.createCubeTexture({ width, height }, texture.generateMipMaps, texture.generateMipMaps, texture.invertY, false, gpuTextureWrapper.format, texture.samples || 1, this._uploadEncoder);

            gpuTextureWrapper.set(gpuTexture);
            gpuTextureWrapper.createView({
                dimension: WebGPUConstants.TextureViewDimension.Cube,
                mipLevelCount: texture.generateMipMaps ? WebGPUTextureHelper.computeNumMipmapLevels(width!, height!) : 1,
                baseArrayLayer: 0,
                baseMipLevel: 0,
                aspect: WebGPUConstants.TextureAspect.All
            });
        } else {
            const gpuTexture = this._textureHelper.createTexture({ width, height }, texture.generateMipMaps, texture.generateMipMaps, texture.invertY, false, gpuTextureWrapper.format, texture.samples || 1, this._uploadEncoder);

            gpuTextureWrapper.set(gpuTexture);
            gpuTextureWrapper.createView();
        }

        texture.width = texture.baseWidth = width;
        texture.height = texture.baseHeight = height;

        return gpuTextureWrapper;
    }

    private _generateMipmaps(texture: InternalTexture, gpuTexture: GPUTexture) {
        const mipmapCount = WebGPUTextureHelper.computeNumMipmapLevels(texture.width, texture.height);

        if (texture.isCube) {
            this._textureHelper.generateCubeMipmaps(gpuTexture, mipmapCount, this._uploadEncoder);
        } else {
            this._textureHelper.generateMipmaps(gpuTexture, mipmapCount, 0, this._uploadEncoder);
        }
    }

    public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement | OffscreenCanvas, invertY: boolean, premulAlpha: boolean = false, format?: number, forceBindTexture?: boolean): void {
        if (!texture) {
            return;
        }

        const width = canvas.width, height = canvas.height;

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture, width, height);
        }

        // TODO WEBGPU remove debug code
        if ((texture as any)._released) {
            console.log("using a released texture in updateDynamicTexture");
        }

        // TODO WEBGPU: handle format if <> 0
        // let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;

        // TODO WEBGPU remove test code
        if (canvas.width === 25600) {
            if ((this as any)._swap === undefined) { (this as any)._swap = 0; }
            (this as any)._swap ^= 1;

            const swap = (this as any)._swap;

            /*if (!(this as any)._bitmap) {
                createImageBitmap(canvas).then((imageBitmap) => {
                    (this as any)._bitmap = imageBitmap;
                });
            }*/
            //if ((this as any)._bitmap) {
                /*createImageBitmap(canvas).then((bitmap: ImageBitmap) => {
                    this._textureHelper.updateTextureTest(bitmap, gpuTexture, width, height, 0, 0, invertY, premulAlpha, swap, 0, this._uploadEncoder);
                    texture.isReady = true;
                });*/
            //}

            this._textureHelper.updateTextureTest(canvas as HTMLCanvasElement, gpuTextureWrapper.underlyingResource!, width, height, 0, 0, invertY, premulAlpha, swap, 0/*, this._uploadEncoder*/);
            texture.isReady = true;
            return;
        }

        createImageBitmap(canvas).then((bitmap) => {
            this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, gpuTextureWrapper.underlyingResource!);
            }

            texture.isReady = true;
        });
    }

    public updateTextureData(texture: InternalTexture, imageData: ArrayBufferView, xOffset: number, yOffset: number, width: number, height: number, faceIndex: number = 0, lod: number = 0): void {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture);
        }

        this._textureHelper.updateTexture(new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength), gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    public updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
        if (!texture || texture._isDisabled) {
            return;
        }

        if (this._videoTextureSupported === undefined) {
            this._videoTextureSupported = true;
        }

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture);
        }

        createImageBitmap(video).then((bitmap) => {
            this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0, this._uploadEncoder);
            if (texture.generateMipMaps) {
                this._generateMipmaps(texture, gpuTextureWrapper.underlyingResource!);
            }

            texture.isReady = true;
        }).catch((msg) => {
            // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
            // Just keep going on
            texture.isReady = true;
        });
    }

    /** @hidden */
    public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, data: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            texture.format = internalFormat;
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture, width, height);
        }

        this._textureHelper.updateTexture(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    /** @hidden */
    public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0, babylonInternalFormat?: number, useTextureWidthAndHeight = false): void {
        // TODO WEBPU what to do with babylonInternalFormat? Texture format is set at creation time and can't be changed afterwards...
        const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
        const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);

        const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
        const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture, width, height);
        }

        this._textureHelper.updateTexture(new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength), gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    /** @hidden */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);
    }

    /** @hidden */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (!texture._hardwareTexture?.underlyingResource) {
            gpuTextureWrapper = this._createGPUTextureForInternalTexture(texture);
        }

        const bitmap = image as ImageBitmap; // in WebGPU we will always get an ImageBitmap, not an HTMLImageElement

        const width = Math.ceil(texture.width / (1 << lod));
        const height = Math.ceil(texture.height / (1 << lod));

        this._textureHelper.updateTexture(bitmap, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, faceIndex, lod, texture.invertY, false, 0, 0, this._uploadEncoder);
    }

    public readPixels(x: number, y: number, width: number, height: number, hasAlpha = true): Promise<Uint8Array> | Uint8Array {
        const numChannels = 4; // no RGB format in WebGPU
        const size = height * width * numChannels;

        const buffer = this._bufferManager.createRawBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

        const commandEncoder = this._device.createCommandEncoder({});

        commandEncoder.copyTextureToBuffer({
            texture: this._swapChainTexture,
            mipLevel: 0,
            origin: {
                x,
                y,
                z: 0
            }
        }, {
            buffer: buffer,
            offset: 0,
            bytesPerRow: width * numChannels,
            rowsPerImage: height
        }, {
            width,
            height,
            depth: 1
        });

        this._device.defaultQueue.submit([commandEncoder!.finish()]);

        return this._bufferManager.readDataFromBuffer(buffer, size);
    }

    /** @hidden */
    public _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null): ArrayBufferView {
        console.warn("_readTexturePixels not implemented yet in WebGPU");

        return null as any;
        /*let readType = (texture.type !== undefined) ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;

        switch (readType) {
            case gl.UNSIGNED_BYTE:
                if (!buffer) {
                    buffer = new Uint8Array(4 * width * height);
                }
                readType = gl.UNSIGNED_BYTE;
                break;
            default:
                if (!buffer) {
                    buffer = new Float32Array(4 * width * height);
                }
                readType = gl.FLOAT;
                break;
        }

        gl.readPixels(0, 0, width, height, gl.RGBA, readType, <DataView>buffer);*/
    }

    //------------------------------------------------------------------------------
    //                              Render Target Textures
    //------------------------------------------------------------------------------

    /** @hidden */
    public _setupDepthStencilTexture(internalTexture: InternalTexture, size: number | { width: number, height: number, layers?: number }, generateStencil: boolean, bilinearFiltering: boolean, comparisonFunction: number): void {
        console.warn("_setupDepthStencilTexture not implemented yet in WebGPU");
    }

    public createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
        let fullOptions = new RenderTargetCreationOptions();

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            // TODO WEBGPU fullOptions.format not set?
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
            // TODO WEBGPU fullOptions.format not set?
        }
        var texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        var width = size.width || size;
        var height = size.height || size;

        // TODO WEBGPU handle layers

        texture._depthStencilBuffer = {};
        texture._framebuffer = {};
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
        texture.samplingMode = fullOptions.samplingMode;
        texture.type = fullOptions.type;
        texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
        texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public createRenderTargetCubeTexture(size: number, options?: Partial<RenderTargetCreationOptions>): InternalTexture {
        var texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        this._internalTexturesCache.push(texture);

        console.warn("createRenderTargetCubeTexture not implemented yet in WebGPU");

        return texture;
    }

    /** @hidden */
    public _createDepthStencilTexture(size: number | { width: number, height: number, layers?: number }, options: DepthTextureCreationOptions): InternalTexture {
        const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

        console.warn("_createDepthStencilTexture not implemented yet in WebGPU");

        return internalTexture;
    }

    /** @hidden */
    public _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions): InternalTexture {
        var internalTexture = new InternalTexture(this, InternalTextureSource.Unknown);
        internalTexture.isCube = true;

        console.warn("_createDepthStencilCubeTexture not implemented yet in WebGPU");

        return internalTexture;
    }

    //------------------------------------------------------------------------------
    //                              Render Commands
    //------------------------------------------------------------------------------

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        // TODO WEBGPU debug only code
        if (!(this as any)._count || (this as any)._count < 20) {
            if (!(this as any)._count) {
                (this as any)._count = 1;
             } else {
                 (this as any)._count++;
             }
            console.log("begin frame", (this as any)._count);
        }

        super.beginFrame();
    }

    /**
     * End the current frame
     */
    public endFrame() {
        this._endRenderPass();

        this._commandBuffers[0] = this._uploadEncoder.finish();
        this._commandBuffers[1] = this._renderEncoder.finish();

        this._device.defaultQueue.submit(this._commandBuffers);

        this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
        this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);

        super.endFrame();

        // TODO WEBGPU debug only code
        if (!(this as any)._count || (this as any)._count < 20) {
            console.log("end frame", (this as any)._count);
        }
    }

    //------------------------------------------------------------------------------
    //                              Render Pass
    //------------------------------------------------------------------------------

    private _startMainRenderPass(): void {
        if (this._currentRenderPass) {
            this._endRenderPass();
        }

        this._swapChainTexture = this._swapChain.getCurrentTexture();

        // Resolve in case of MSAA
        if (this._options.antialiasing) {
            this._mainColorAttachments[0].resolveTarget = this._swapChainTexture.createView();
        }
        else {
            this._mainColorAttachments[0].attachment = this._swapChainTexture.createView();
        }

        this._currentRenderPass = this._renderEncoder.beginRenderPass({
            colorAttachments: this._mainColorAttachments,
            depthStencilAttachment: this._mainDepthAttachment
        });
    }

    private _endRenderPass(): void {
        if (this._currentRenderPass) {
            this._currentRenderPass.endPass();
            this._currentRenderPass = null;
        }
    }

    public bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = texture;
        this._currentFramebuffer = texture._MSAAFramebuffer ? texture._MSAAFramebuffer : texture._framebuffer;
        if (this._cachedViewport && !forceFullscreenViewport) {
            this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
        }
    }

    public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        this._currentRenderTarget = null;

        if (onBeforeUnbind) {
            if (texture._MSAAFramebuffer) {
                this._currentFramebuffer = texture._framebuffer;
            }
            onBeforeUnbind();
        }
        this._currentFramebuffer = null;
    }

    //------------------------------------------------------------------------------
    //                              Render
    //------------------------------------------------------------------------------

    private _indexFormatInRenderPass(topology: GPUPrimitiveTopology): boolean {
        return  topology === WebGPUConstants.PrimitiveTopology.PointList ||
                topology === WebGPUConstants.PrimitiveTopology.LineList ||
                topology === WebGPUConstants.PrimitiveTopology.TriangleList;
    }

    private _getTopology(fillMode: number): GPUPrimitiveTopology {
        switch (fillMode) {
            // Triangle views
            case Constants.MATERIAL_TriangleFillMode:
                return WebGPUConstants.PrimitiveTopology.TriangleList;
            case Constants.MATERIAL_PointFillMode:
                return WebGPUConstants.PrimitiveTopology.PointList;
            case Constants.MATERIAL_WireFrameFillMode:
                return WebGPUConstants.PrimitiveTopology.LineList;
            // Draw modes
            case Constants.MATERIAL_PointListDrawMode:
                return WebGPUConstants.PrimitiveTopology.PointList;
            case Constants.MATERIAL_LineListDrawMode:
                return WebGPUConstants.PrimitiveTopology.LineList;
            case Constants.MATERIAL_LineLoopDrawMode:
                // return this._gl.LINE_LOOP;
                // TODO WEBGPU. Line Loop Mode Fallback at buffer load time.
                throw "LineLoop is an unsupported fillmode in WebGPU";
            case Constants.MATERIAL_LineStripDrawMode:
                return WebGPUConstants.PrimitiveTopology.LineStrip;
            case Constants.MATERIAL_TriangleStripDrawMode:
                return WebGPUConstants.PrimitiveTopology.TriangleStrip;
            case Constants.MATERIAL_TriangleFanDrawMode:
                // return this._gl.TRIANGLE_FAN;
                // TODO WEBGPU. Triangle Fan Mode Fallback at buffer load time.
                throw "TriangleFan is an unsupported fillmode in WebGPU";
            default:
                return WebGPUConstants.PrimitiveTopology.TriangleList;
        }
    }

    private _getCompareFunction(compareFunction: Nullable<number>): GPUCompareFunction {
        switch (compareFunction) {
            case Constants.ALWAYS:
                return WebGPUConstants.CompareFunction.Always;
            case Constants.EQUAL:
                return WebGPUConstants.CompareFunction.Equal;
            case Constants.GREATER:
                return WebGPUConstants.CompareFunction.Greater;
            case Constants.GEQUAL:
                return WebGPUConstants.CompareFunction.GreaterEqual;
            case Constants.LESS:
                return WebGPUConstants.CompareFunction.Less;
            case Constants.LEQUAL:
                return WebGPUConstants.CompareFunction.LessEqual;
            case Constants.NEVER:
                return WebGPUConstants.CompareFunction.Never;
            case Constants.NOTEQUAL:
                return WebGPUConstants.CompareFunction.NotEqual;
            default:
                return WebGPUConstants.CompareFunction.Less;
        }
    }

    private _getOpFunction(operation: Nullable<number>, defaultOp: GPUStencilOperation): GPUStencilOperation {
        switch (operation) {
            case Constants.KEEP:
                return WebGPUConstants.StencilOperation.Keep;
            case Constants.ZERO:
                return WebGPUConstants.StencilOperation.Zero;
            case Constants.REPLACE:
                return WebGPUConstants.StencilOperation.Replace;
            case Constants.INVERT:
                return WebGPUConstants.StencilOperation.Invert;
            case Constants.INCR:
                return WebGPUConstants.StencilOperation.IncrementClamp;
            case Constants.DECR:
                return WebGPUConstants.StencilOperation.DecrementClamp;
            case Constants.INCR_WRAP:
                return WebGPUConstants.StencilOperation.IncrementWrap;
            case Constants.DECR_WRAP:
                return WebGPUConstants.StencilOperation.DecrementWrap;
            default:
                return defaultOp;
        }
    }

    private _getDepthStencilStateDescriptor(): GPUDepthStencilStateDescriptor {
        // TODO WEBGPU. Depth State according to the cached state.
        // And the current render pass attachment setup.
        const stencilFrontBack: GPUStencilStateFaceDescriptor = {
            compare: this._getCompareFunction(this._stencilState.stencilFunc),
            depthFailOp: this._getOpFunction(this._stencilState.stencilOpDepthFail, WebGPUConstants.StencilOperation.Keep),
            failOp: this._getOpFunction(this._stencilState.stencilOpStencilFail, WebGPUConstants.StencilOperation.Keep),
            passOp: this._getOpFunction(this._stencilState.stencilOpStencilDepthPass, WebGPUConstants.StencilOperation.Replace)
        };

        return {
            depthWriteEnabled: this.getDepthWrite(),
            depthCompare: this._getCompareFunction(this.getDepthFunction()),
            format: WebGPUConstants.TextureFormat.Depth24PlusStencil8,
            stencilFront: stencilFrontBack,
            stencilBack: stencilFrontBack,
            stencilReadMask: this._stencilState.stencilFuncMask,
            stencilWriteMask: this._stencilState.stencilMask,
        };
    }

    /**
     * Set various states to the webGL context
     * @param culling defines backface culling state
     * @param zOffset defines the value to apply to zOffset (0 by default)
     * @param force defines if states must be applied even if cache is up to date
     * @param reverseSide defines if culling must be reversed (CCW instead of CW and CW instead of CCW)
     */
    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
        // Culling
        if (this._depthCullingState.cull !== culling || force) {
            this._depthCullingState.cull = culling;
        }

        // Cull face
        // var cullFace = this.cullBackFaces ? this._gl.BACK : this._gl.FRONT;
        var cullFace = this.cullBackFaces ? 1 : 2;
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
    }

    private _getFrontFace(): GPUFrontFace {
        switch (this._depthCullingState.frontFace) {
            case 1:
                return WebGPUConstants.FrontFace.CW;
            default:
                return WebGPUConstants.FrontFace.CCW;
        }
    }

    private _getCullMode(): GPUCullMode {
        if (this._depthCullingState.cull === false) {
            return WebGPUConstants.CullMode.None;
        }

        if (this._depthCullingState.cullFace === 2) {
            return WebGPUConstants.CullMode.Front;
        }
        else {
            return WebGPUConstants.CullMode.Back;
        }
    }

    private _getRasterizationStateDescriptor(): GPURasterizationStateDescriptor {
        return {
            frontFace: this._getFrontFace(),
            cullMode: this._getCullMode(),
            depthBias: this._depthCullingState.zOffset,
            // depthBiasClamp: 0,
            // depthBiasSlopeScale: 0,
        };
    }

    private _getWriteMask(): number {
        if (this.__colorWrite) {
            return WebGPUConstants.ColorWrite.All;
        }
        return 0;
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
        }
        this._alphaMode = mode;
    }

    private _getAphaBlendOperation(operation: Nullable<number>): GPUBlendOperation {
        switch (operation) {
            case 0x8006:
                return WebGPUConstants.BlendOperation.Add;
            case 0x800A:
                return WebGPUConstants.BlendOperation.Subtract;
            case 0x800B:
                return WebGPUConstants.BlendOperation.ReverseSubtract;
            default:
                return WebGPUConstants.BlendOperation.Add;
        }
    }

    private _getAphaBlendFactor(factor: Nullable<number>): GPUBlendFactor {
        switch (factor) {
            case 0:
                return WebGPUConstants.BlendFactor.Zero;
            case 1:
                return WebGPUConstants.BlendFactor.One;
            case 0x0300:
                return WebGPUConstants.BlendFactor.SrcColor;
            case 0x0301:
                return WebGPUConstants.BlendFactor.OneMinusSrcColor;
            case 0x0302:
                return WebGPUConstants.BlendFactor.SrcAlpha;
            case 0x0303:
                return WebGPUConstants.BlendFactor.OneMinusSrcAlpha;
            case 0x0304:
                return WebGPUConstants.BlendFactor.DstAlpha;
            case 0x0305:
                return WebGPUConstants.BlendFactor.OneMinusDstAlpha;
            case 0x0306:
                return WebGPUConstants.BlendFactor.DstColor;
            case 0x0307:
                return WebGPUConstants.BlendFactor.OneMinusDstColor;
            case 0x0308:
                return WebGPUConstants.BlendFactor.SrcAlphaSaturated;
            case 0x8001:
                return WebGPUConstants.BlendFactor.BlendColor;
            case 0x8002:
                return WebGPUConstants.BlendFactor.OneMinusBlendColor;
            case 0x8003:
                return WebGPUConstants.BlendFactor.BlendColor;
            case 0x8004:
                return WebGPUConstants.BlendFactor.OneMinusBlendColor;
            default:
                return WebGPUConstants.BlendFactor.One;
        }
    }

    private _getAphaBlendState(): GPUBlendDescriptor {
        if (!this._alphaState.alphaBlend) {
            return { };
        }

        return {
            srcFactor: this._getAphaBlendFactor(this._alphaState._blendFunctionParameters[2]),
            dstFactor: this._getAphaBlendFactor(this._alphaState._blendFunctionParameters[3]),
            operation: this._getAphaBlendOperation(this._alphaState._blendEquationParameters[1]),
        };
    }

    private _getColorBlendState(): GPUBlendDescriptor {
        if (!this._alphaState.alphaBlend) {
            return { };
        }

        return {
            srcFactor: this._getAphaBlendFactor(this._alphaState._blendFunctionParameters[0]),
            dstFactor: this._getAphaBlendFactor(this._alphaState._blendFunctionParameters[1]),
            operation: this._getAphaBlendOperation(this._alphaState._blendEquationParameters[0]),
        };
    }

    private _getColorStateDescriptors(): GPUColorStateDescriptor[] {
        // TODO WEBGPU. Manage Multi render target.
        return [{
            format: this._options.swapChainFormat!,
            alphaBlend: this._getAphaBlendState(),
            colorBlend: this._getColorBlendState(),
            writeMask: this._getWriteMask(),
        }];
    }

    private _getStages(): IWebGPURenderPipelineStageDescriptor {
        const gpuPipeline = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        return gpuPipeline.stages!;
    }

    private _getVertexInputDescriptorFormat(vertexBuffer: VertexBuffer): GPUVertexFormat {
        const kind = vertexBuffer.getKind();
        const type = vertexBuffer.type;
        const normalized = vertexBuffer.normalized;
        const size = vertexBuffer.getSize();

        switch (type) {
            case VertexBuffer.BYTE:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Char2Norm : WebGPUConstants.VertexFormat.Char2;
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Char4Norm : WebGPUConstants.VertexFormat.Char4;
                }
            case VertexBuffer.UNSIGNED_BYTE:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Uchar2Norm : WebGPUConstants.VertexFormat.Uchar2;
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Uchar4Norm : WebGPUConstants.VertexFormat.Uchar4;
                }
            case VertexBuffer.SHORT:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Short2Norm : WebGPUConstants.VertexFormat.Short2;
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Short4Norm : WebGPUConstants.VertexFormat.Short4;
                }
            case VertexBuffer.UNSIGNED_SHORT:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Ushort2Norm : WebGPUConstants.VertexFormat.Ushort2;
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Ushort4Norm : WebGPUConstants.VertexFormat.Ushort4;
                }
            case VertexBuffer.INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Int;
                    case 2:
                        return WebGPUConstants.VertexFormat.Int2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Int3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Int4;
                }
            case VertexBuffer.UNSIGNED_INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Uint;
                    case 2:
                        return WebGPUConstants.VertexFormat.Uint2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Uint3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Uint4;
                }
            case VertexBuffer.FLOAT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Float;
                    case 2:
                        return WebGPUConstants.VertexFormat.Float2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Float3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Float4;
                }
        }

        throw new Error("Invalid Format '" + kind + "'");
    }

    private _getVertexInputDescriptor(topology: GPUPrimitiveTopology): GPUVertexStateDescriptor {
        const descriptors: GPUVertexBufferLayoutDescriptor[] = [];
        const effect = this._currentEffect!;
        const attributes = effect.getAttributesNames();
        for (var index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);

            if (location >= 0) {
                const vertexBuffer = this._currentVertexBuffers![attributes[index]];
                if (!vertexBuffer) {
                    continue;
                }

                const positionAttributeDescriptor: GPUVertexAttributeDescriptor = {
                    shaderLocation: location,
                    offset: 0, // not available in WebGL
                    format: this._getVertexInputDescriptorFormat(vertexBuffer),
                };

                // TODO WEBGPU. Factorize the one with the same underlying buffer.
                const vertexBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
                    arrayStride: vertexBuffer.byteStride,
                    stepMode: vertexBuffer.getIsInstanced() ? WebGPUConstants.InputStepMode.Instance : WebGPUConstants.InputStepMode.Vertex,
                    attributes: [positionAttributeDescriptor]
                };

               descriptors.push(vertexBufferDescriptor);
            }
        }

        if (!this._currentIndexBuffer) {
            return {
                indexFormat: WebGPUConstants.IndexFormat.Uint32,
                vertexBuffers: descriptors
            };
        }

        const inputStateDescriptor: GPUVertexStateDescriptor = {
            vertexBuffers: descriptors
        };

        if (!this._indexFormatInRenderPass(topology)) {
            inputStateDescriptor.indexFormat = this._currentIndexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16;
        }

        return inputStateDescriptor;
    }

    private _getPipelineLayout(): GPUPipelineLayout {
        const bindGroupLayouts: GPUBindGroupLayout[] = [];
        const webgpuPipelineContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;

        for (let i = 0; i < webgpuPipelineContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = webgpuPipelineContext.orderedUBOsAndSamplers[i];
            if (setDefinition === undefined) {
                const entries: GPUBindGroupLayoutEntry[] = [];
                const uniformsBindGroupLayout = this._device.createBindGroupLayout({
                    entries,
                });
                bindGroupLayouts[i] = uniformsBindGroupLayout;
                continue;
            }

            const entries: GPUBindGroupLayoutEntry[] = [];
            for (let j = 0; j < setDefinition.length; j++) {
                const bindingDefinition = webgpuPipelineContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition === undefined) {
                    continue;
                }

                // TODO WEBGPU. Optimize shared samplers visibility for vertex/framgent.
                if (bindingDefinition.isSampler) {
                    entries.push({
                        binding: j,
                        visibility: WebGPUConstants.ShaderStage.Vertex | WebGPUConstants.ShaderStage.Fragment,
                        type: WebGPUConstants.BindingType.SampledTexture,
                        viewDimension: bindingDefinition.textureDimension,
                        // TODO WEBGPU. Handle texture component type properly.
                        // textureComponentType?: GPUTextureComponentType,
                        // multisampled?: boolean;
                        // hasDynamicOffset?: boolean;
                        // storageTextureFormat?: GPUTextureFormat;
                    }, {
                        // TODO WEBGPU. No Magic + 1 (coming from current 1 texture 1 sampler startegy).
                        binding: j + 1,
                        visibility: WebGPUConstants.ShaderStage.Vertex | WebGPUConstants.ShaderStage.Fragment,
                        type: WebGPUConstants.BindingType.Sampler
                    });
                }
                else {
                    entries.push({
                        binding: j,
                        visibility: WebGPUConstants.ShaderStage.Vertex | WebGPUConstants.ShaderStage.Fragment,
                        type: WebGPUConstants.BindingType.UniformBuffer,
                    });
                }
            }

            if (entries.length > 0) {
                const uniformsBindGroupLayout = this._device.createBindGroupLayout({
                    entries,
                });
                bindGroupLayouts[i] = uniformsBindGroupLayout;
            }
        }

        webgpuPipelineContext.bindGroupLayouts = bindGroupLayouts;
        return this._device.createPipelineLayout({ bindGroupLayouts });
    }

    private _getRenderPipeline(topology: GPUPrimitiveTopology): GPURenderPipeline {
        // This is wrong to cache this way but workarounds the need of cache in the simple demo context.
        const webgpuPipelineContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        if (webgpuPipelineContext.renderPipeline) {
            return webgpuPipelineContext.renderPipeline;
        }

        // Unsupported at the moment but needs to be extracted from the MSAA param.
        const rasterizationStateDescriptor = this._getRasterizationStateDescriptor();
        const depthStateDescriptor = this._getDepthStencilStateDescriptor();
        const colorStateDescriptors = this._getColorStateDescriptors();
        const stages = this._getStages();
        const inputStateDescriptor = this._getVertexInputDescriptor(topology);
        const pipelineLayout = this._getPipelineLayout();

        webgpuPipelineContext.renderPipeline = this._device.createRenderPipeline({
            sampleCount: this._mainPassSampleCount,
            primitiveTopology: topology,
            rasterizationState: rasterizationStateDescriptor,
            depthStencilState: depthStateDescriptor,
            colorStates: colorStateDescriptors,

            ...stages,
            vertexState: inputStateDescriptor,
            layout: pipelineLayout,
        });
        return webgpuPipelineContext.renderPipeline;
    }

    private _getVertexInputsToRender(): IWebGPUPipelineContextVertexInputsCache {
        const effect = this._currentEffect!;
        const gpuContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;

        let vertexInputs = gpuContext.vertexInputs;
        if (vertexInputs) {
            return vertexInputs;
        }

        vertexInputs = {
            indexBuffer: null,
            indexOffset: 0,

            vertexStartSlot: 0,
            vertexBuffers: [],
            vertexOffsets: [],
        };
        gpuContext.vertexInputs = vertexInputs;

        if (this._currentIndexBuffer) {
            // TODO WEBGPU. Check if cache would be worth it.
            vertexInputs.indexBuffer = this._currentIndexBuffer.underlyingResource;
            vertexInputs.indexOffset = 0;
        }
        else {
            vertexInputs.indexBuffer = null;
        }

        const attributes = effect.getAttributesNames();
        for (var index = 0; index < attributes.length; index++) {
            const order = effect.getAttributeLocation(index);

            if (order >= 0) {
                const vertexBuffer = this._currentVertexBuffers![attributes[index]];
                if (!vertexBuffer) {
                    continue;
                }

                var buffer = vertexBuffer.getBuffer();
                if (buffer) {
                    vertexInputs.vertexBuffers.push(buffer.underlyingResource);
                    vertexInputs.vertexOffsets.push(vertexBuffer.byteOffset);
                }
            }
        }

        // TODO WEBGPU. Optimize buffer reusability and types as more are now allowed.
        return vertexInputs;
    }

    private _getBindGroupsToRender(): GPUBindGroup[] {
        const webgpuPipelineContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        let bindGroups = webgpuPipelineContext.bindGroups;
        if (bindGroups) {
            if (webgpuPipelineContext.uniformBuffer) {
                webgpuPipelineContext.uniformBuffer.update();
            }
            return bindGroups;
        }

        if (webgpuPipelineContext.uniformBuffer) {
            this.bindUniformBufferBase(webgpuPipelineContext.uniformBuffer.getBuffer()!, 0, "LeftOver");
            webgpuPipelineContext.uniformBuffer.update();
        }

        bindGroups = [];
        webgpuPipelineContext.bindGroups = bindGroups;

        const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts;

        for (let i = 0; i < webgpuPipelineContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = webgpuPipelineContext.orderedUBOsAndSamplers[i];
            if (setDefinition === undefined) {
                let groupLayout: GPUBindGroupLayout;
                if (bindGroupLayouts && bindGroupLayouts[i]) {
                    groupLayout = bindGroupLayouts[i];
                }
                else {
                    groupLayout = webgpuPipelineContext.renderPipeline.getBindGroupLayout(i);
                }
                bindGroups[i] = this._device.createBindGroup({
                    layout: groupLayout,
                    entries: [],
                });
                continue;
            }

            const entries: GPUBindGroupEntry[] = [];
            for (let j = 0; j < setDefinition.length; j++) {
                const bindingDefinition = webgpuPipelineContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition === undefined) {
                    continue;
                }

                // TODO WEBGPU. Authorize shared samplers and Vertex Textures.
                if (bindingDefinition.isSampler) {
                    const bindingInfo = webgpuPipelineContext.samplers[bindingDefinition.name];
                    if (bindingInfo) {
                        const hardwareTexture = bindingInfo.texture._hardwareTexture as WebGPUHardwareTexture;
                        if (!hardwareTexture.sampler) {
                            const samplerDescriptor: GPUSamplerDescriptor = this._getSamplerDescriptor(bindingInfo.texture!);
                            const gpuSampler = this._device.createSampler(samplerDescriptor);
                            hardwareTexture.setSampler(gpuSampler);
                        }

                        // TODO WEBGPU Remove this when all testings are ok
                        if (!hardwareTexture.view) {
                            console.error("Trying to bind a null gpu texture! bindingDefinition=", bindingDefinition, " | bindingInfo=", bindingInfo);
                            debugger;
                        }

                        if ((bindingInfo.texture as any)._released) {
                            console.error("Trying to bind a released texture!", bindingInfo.texture);
                            debugger;
                        }

                        entries.push({
                            binding: bindingInfo.textureBinding,
                            resource: hardwareTexture.view!,
                        }, {
                            binding: bindingInfo.samplerBinding,
                            resource: hardwareTexture.sampler!,
                        });
                    }
                    else {
                        Logger.Error("Sampler has not been bound: " + bindingDefinition.name);
                    }
                }
                else {
                    const dataBuffer = this._uniformsBuffers[bindingDefinition.name];
                    if (dataBuffer) {
                        const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
                        entries.push({
                            binding: j,
                            resource: {
                                buffer: webgpuBuffer,
                                offset: 0,
                                size: dataBuffer.capacity,
                            },
                        });
                    }
                    else {
                        Logger.Error("UBO has not been bound: " + bindingDefinition.name);
                    }
                }
            }

            if (entries.length > 0) {
                let groupLayout: GPUBindGroupLayout;
                if (bindGroupLayouts && bindGroupLayouts[i]) {
                    groupLayout = bindGroupLayouts[i];
                }
                else {
                    groupLayout = webgpuPipelineContext.renderPipeline.getBindGroupLayout(i);
                }
                bindGroups[i] = this._device.createBindGroup({
                    layout: groupLayout,
                    entries,
                });
            }
        }

        return bindGroups;
    }

    private _bindVertexInputs(vertexInputs: IWebGPUPipelineContextVertexInputsCache, setIndexFormat: boolean): void {
        const renderPass = this._bundleEncoder || this._currentRenderPass!;

        if (vertexInputs.indexBuffer) {
            // TODO WEBGPU. Check if cache would be worth it.
            if (setIndexFormat) {
                renderPass.setIndexBuffer(vertexInputs.indexBuffer, this._currentIndexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16, vertexInputs.indexOffset);
            } else {
                renderPass.setIndexBuffer(vertexInputs.indexBuffer, vertexInputs.indexOffset);
            }
        }

        // TODO WEBGPU. Optimize buffer reusability and types as more are now allowed.
        for (let i = 0; i < vertexInputs.vertexBuffers.length; i++) {
            const buf = vertexInputs.vertexBuffers[i];
            if (buf) {
                renderPass.setVertexBuffer(vertexInputs.vertexStartSlot + i, buf, vertexInputs.vertexOffsets[i]);
            }
        }
    }

    private _setRenderBindGroups(bindGroups: GPUBindGroup[]): void {
        // TODO WEBGPU. Only set groups if changes happened.
        const renderPass = this._bundleEncoder || this._currentRenderPass!;
        for (let i = 0; i < bindGroups.length; i++) {
            renderPass.setBindGroup(i, bindGroups[i]);
        }
    }

    private _setRenderPipeline(fillMode: number): void {
        const renderPass = this._bundleEncoder || this._currentRenderPass!;

        const topology = this._getTopology(fillMode);
        const setIndexFormatInRenderPass = this._indexFormatInRenderPass(topology);

        const pipeline = this._getRenderPipeline(topology);
        renderPass.setPipeline(pipeline);

        const vertexInputs = this._getVertexInputsToRender();
        this._bindVertexInputs(vertexInputs, setIndexFormatInRenderPass);

        const bindGroups = this._getBindGroupsToRender();
        this._setRenderBindGroups(bindGroups);

        if (this._alphaState.alphaBlend && this._alphaState._isBlendConstantsDirty) {
            // TODO WebGPU. should use renderPass.
            this._currentRenderPass!.setBlendColor(this._alphaState._blendConstants as any);
        }
    }

    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount: number = 1): void {
        const renderPass = this._bundleEncoder || this._currentRenderPass!;

        this._setRenderPipeline(fillMode);

        renderPass.drawIndexed(indexCount, instancesCount, indexStart, 0, 0);
    }

    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount: number = 1): void {
        const renderPass = this._bundleEncoder || this._currentRenderPass!;

        this._currentIndexBuffer = null;

        this._setRenderPipeline(fillMode);

        renderPass.draw(verticesCount, instancesCount, verticesStart, 0);
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number): boolean {
        if (!super.setSize(width, height)) {
            return false;
        }

        this._initializeMainAttachments();
        return true;
    }

    //------------------------------------------------------------------------------
    //                              Render Bundle
    //------------------------------------------------------------------------------

    private _bundleEncoder: Nullable<GPURenderBundleEncoder>;

    /**
     * Start recording all the gpu calls into a bundle.
     */
    public startRecordBundle(): void {
        // TODO. WebGPU. options should be dynamic.
        this._bundleEncoder = this._device.createRenderBundleEncoder({
            colorFormats: [ WebGPUConstants.TextureFormat.BGRA8Unorm ],
            depthStencilFormat: WebGPUConstants.TextureFormat.Depth24PlusStencil8,
            sampleCount: this._mainPassSampleCount,
        });
    }

    /**
     * Stops recording the bundle.
     * @returns the recorded bundle
     */
    public stopRecordBundle(): GPURenderBundle {
        const bundle = this._bundleEncoder!.finish();
        this._bundleEncoder = null;
        return bundle;
    }

    /**
     * Execute the previously recorded bundle.
     * @param bundles defines the bundle to replay
     */
    public executeBundles(bundles: GPURenderBundle[]): void {
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }

        this._currentRenderPass!.executeBundles(bundles);
    }

    //------------------------------------------------------------------------------
    //                              Dispose
    //------------------------------------------------------------------------------

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        this._compiledShaders = { };
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

    public getRenderWidth(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }

        return this._canvas.width;
    }

    public getRenderHeight(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }

        return this._canvas.height;
    }

    public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._canvas;
    }

    //------------------------------------------------------------------------------
    //                              Errors
    //------------------------------------------------------------------------------

    public getError(): number {
        // TODO WEBGPU. from the webgpu errors.
        return 0;
    }

    //------------------------------------------------------------------------------
    //                              Unused WebGPU
    //------------------------------------------------------------------------------
    public areAllEffectsReady(): boolean {
        // No parallel shader compilation.
        return true;
    }

    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        // No parallel shader compilation.
        // No Async, so direct launch
        action();
    }

    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        // No parallel shader compilation.
        return true;
    }

    public _getUnpackAlignement(): number {
        return 1;
    }

    public _unpackFlipY(value: boolean) { }

    // TODO WEBGPU. All of the below should go once engine split with baseEngine.

    public applyStates() {
        // Apply States dynamically.
        // This is done at the pipeline creation level for the moment...
    }

    /** @hidden */
    public _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
        throw "_getSamplingParameters is not available in WebGPU";
    }

    public bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
    }

    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
        return [];
    }

    public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        return false;
    }

    public setArray(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    public setArray2(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    public setArray3(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    public setArray4(uniform: WebGLUniformLocation, array: number[]): boolean {
        return false;
    }

    public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): boolean {
        return false;
    }

    public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        return false;
    }

    public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        return false;
    }

    public setFloat(uniform: WebGLUniformLocation, value: number): boolean {
        return false;
    }

    public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): boolean {
        return false;
    }

    public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): boolean {
        return false;
    }

    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): boolean {
        return false;
    }
}
