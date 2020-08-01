import { Logger } from "../Misc/logger";
import { Nullable, DataArray, IndicesArray, FloatArray } from "../types";
import { Scene } from "../scene";
import { Color4 } from "../Maths/math";
import { Scalar } from "../Maths/math.scalar";
import { Engine } from "../Engines/engine";
import { InstancingAttributeInfo } from "../Engines/instancingAttributeInfo";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { IEffectCreationOptions, Effect } from "../Materials/effect";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { _TimeToken } from "../Instrumentation/timeToken";
import { Constants } from "./constants";
import { WebGPUConstants } from "./WebGPU/webgpuConstants";
import { VertexBuffer } from "../Meshes/buffer";
import { WebGPUPipelineContext, IWebGPUPipelineContextVertexInputsCache } from './WebGPU/webgpuPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { DataBuffer } from '../Meshes/dataBuffer';
import { WebGPUDataBuffer } from '../Meshes/WebGPU/webgpuDataBuffer';
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { IShaderProcessor } from "./Processors/iShaderProcessor";
import { WebGPUShaderProcessor } from "./WebGPU/webgpuShaderProcessors";
import { ShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from "./WebGPU/webgpuShaderProcessingContext";
import { Tools } from "../Misc/tools";

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
    private _device: GPUDevice;
    private _context: GPUCanvasContext;
    private _swapChain: GPUSwapChain;
    private _mainPassSampleCount: number;

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
    private _maxBufferChunk = 1024 * 1024 * 15;

    // Caches
    private _compiledShaders: { [key: string]: {
        stages: GPURenderPipelineStageDescriptor,
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

    // TODO WEBGPU. Texture Management. Temporary...
    private _decodeCanvas = document.createElement("canvas");
    private _decodeEngine = new Engine(this._decodeCanvas, false, {
        alpha: true,
        premultipliedAlpha: false,
    }, false);

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see http://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     */
    public get supportsUniformBuffers(): boolean {
        return true;
    }

    /**
     * Create a new instance of the gpu engine.
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the GPU context dependencies
     */
    public constructor(canvas: HTMLCanvasElement, options: WebGPUEngineOptions = {}) {
        super(null);

        options.deviceDescriptor = options.deviceDescriptor || { };
        options.swapChainFormat = options.swapChainFormat || WebGPUConstants.GPUTextureFormat_bgra8unorm;
        options.antialiasing = options.antialiasing === undefined ? true : options.antialiasing;

        this._decodeEngine.getCaps().textureFloat = false;
        this._decodeEngine.getCaps().textureFloatRender = false;
        this._decodeEngine.getCaps().textureHalfFloat = false;
        this._decodeEngine.getCaps().textureHalfFloatRender = false;

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
        return this._initGlslang(glslangOptions)
            .then((glslang: any) => {
                this._glslang = glslang;
                return navigator.gpu!.requestAdapter(this._options);
            })
            .then((adapter: GPUAdapter) => {
                this._adapter = adapter;
                return this._adapter.requestDevice(this._options.deviceDescriptor);
            })
            .then((device: GPUDevice) => this._device = device)
            .then(() => {
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

        this._caps = this._caps = {
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
            pvrtc: null,
            etc1: null,
            etc2: null,
            maxAnisotropy: 0,  // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
            uintIndices: false,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: false,
            textureFloat: false,
            textureFloatLinearFiltering: false,
            textureFloatRender: false,
            textureHalfFloat: false,
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
            usage: WebGPUConstants.GPUTextureUsage_OUTPUT_ATTACHMENT | WebGPUConstants.GPUTextureUsage_COPY_SRC,
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
                dimension: WebGPUConstants.GPUTextureDimension_2d,
                format: WebGPUConstants.GPUTextureFormat_bgra8unorm,
                usage: WebGPUConstants.GPUTextureUsage_OUTPUT_ATTACHMENT,
            };

            if (this._mainTexture) {
                this._mainTexture.destroy();
            }
            this._mainTexture = this._device.createTexture(mainTextureDescriptor);
            this._mainColorAttachments = [{
                attachment: this._mainTexture.createView(),
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.GPUStoreOp_store
            }];
        }
        else {
            this._mainColorAttachments = [{
                attachment: this._swapChain.getCurrentTexture().createView(),
                loadValue: new Color4(0, 0, 0, 1),
                storeOp: WebGPUConstants.GPUStoreOp_store
            }];
        }

        const depthTextureDescriptor: GPUTextureDescriptor = {
            size: this._mainTextureExtends,
            mipLevelCount: 1,
            sampleCount: this._mainPassSampleCount,
            dimension: WebGPUConstants.GPUTextureDimension_2d,
            format: WebGPUConstants.GPUTextureFormat_depth24plusStencil8,
            usage:  WebGPUConstants.GPUTextureUsage_OUTPUT_ATTACHMENT
        };

        if (this._depthTexture) {
            this._depthTexture.destroy();
        }
        this._depthTexture = this._device.createTexture(depthTextureDescriptor);
        this._mainDepthAttachment = {
            attachment: this._depthTexture.createView(),

            depthLoadValue: this._clearDepthValue,
            depthStoreOp: WebGPUConstants.GPUStoreOp_store,
            stencilLoadValue: this._clearStencilValue,
            stencilStoreOp: WebGPUConstants.GPUStoreOp_store,
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

    public clear(color: Color4, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        // Some PGs are using color3...
        if (color.a === undefined) {
            color.a = 1;
        }
        this._mainColorAttachments[0].loadValue = backBuffer ? color : WebGPUConstants.GPULoadOp_load;

        this._mainDepthAttachment.depthLoadValue = depth ? this._clearDepthValue : WebGPUConstants.GPULoadOp_load;
        this._mainDepthAttachment.stencilLoadValue = stencil ? this._clearStencilValue : WebGPUConstants.GPULoadOp_load;

        this._startMainRenderPass();
    }

    //------------------------------------------------------------------------------
    //                              WebGPU Buffers
    //------------------------------------------------------------------------------
    private _createBuffer(view: ArrayBufferView, flags: GPUBufferUsageFlags): DataBuffer {
        if (view.byteLength == 0) {
            throw new Error("Unable to create WebGPU buffer: cannot create zero-sized buffer"); // Zero size buffer would kill the tab in chrome
        }
        const padding = view.byteLength % 4;
        const mappedAtCreation: boolean = padding == 0 && view.byteLength < this._maxBufferChunk
        const verticesBufferDescriptor = {
                size: view.byteLength + padding,
                usage: flags,
                mappedAtCreation
            };
       const buffer = this._device.createBuffer(verticesBufferDescriptor);
        const dataBuffer = new WebGPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = view.byteLength;
        if (mappedAtCreation) {
            const range = buffer.getMappedRange();
            new Uint8Array(range).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
            buffer.unmap();
        } else {
            this._setSubData(dataBuffer, 0, view);
        }
        return dataBuffer;
    }
    private _setSubData(dataBuffer: WebGPUDataBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void {
        const buffer = dataBuffer.underlyingResource as GPUBuffer;

        byteLength = byteLength || src.byteLength;
        byteLength = Math.min(byteLength, dataBuffer.capacity - dstByteOffset);

        // After Migration to Canary
        let chunkStart = src.byteOffset + srcByteOffset;
        let chunkEnd = chunkStart + byteLength;

        // 4 bytes alignments for upload
        const padding = byteLength % 4;
        if (padding !== 0) {
            const tempView = new Uint8Array(src.buffer.slice(chunkStart, chunkEnd));
            src = new Uint8Array(byteLength + padding);
            tempView.forEach((element, index) => {
                (src as Uint8Array)[index] = element;
            });
            srcByteOffset = 0;
            chunkStart = 0;
            chunkEnd = byteLength + padding;
            byteLength = byteLength + padding;
        }

        // Chunk
        const commandEncoder = this._device.createCommandEncoder();
        if (byteLength - srcByteOffset < 1) {
            throw new Error("Cannot create zero-sized buffer"); // 0 size buffer would kill the tab in chrome
        }
        const uploadBuffer = this._device.createBuffer({
            usage: WebGPUConstants.GPUBufferUsage_COPY_DST,
            size: byteLength - srcByteOffset,
            mappedAtCreation: true
        });
        try {
            for (let offset = 0; offset < byteLength; offset += this._maxBufferChunk) {
                const uploadCount = Math.min(byteLength - offset, this._maxBufferChunk);
                const uploadMapping = uploadBuffer.getMappedRange(offset, uploadCount);
                new Uint8Array(uploadMapping).set(new Uint8Array(src.buffer, srcByteOffset + offset, uploadCount));
                uploadBuffer.unmap();
            }
            commandEncoder.copyBufferToBuffer(
                uploadBuffer, 0,
                buffer, dstByteOffset,
                byteLength);
            this._device.defaultQueue.submit([commandEncoder.finish()]);
        } catch (e) {
            Logger.Error(e);
        } finally {
            uploadBuffer.destroy();
        }
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_VERTEX | WebGPUConstants.GPUBufferUsage_COPY_DST);
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

        this._setSubData(dataBuffer, byteOffset, view, 0, byteLength);
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_INDEX | WebGPUConstants.GPUBufferUsage_COPY_DST);
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

        this._setSubData(gpuBuffer, offset, view);
    }

    public bindBuffersDirectly(vertexBuffer: DataBuffer, indexBuffer: DataBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
        throw "Not implemented on WebGPU so far.";
    }

    public updateAndBindInstancesBuffer(instancesBuffer: DataBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
        throw "Not implemented on WebGPU so far.";
    }

    public bindBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, indexBuffer: Nullable<DataBuffer>, effect: Effect): void {
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_UNIFORM | WebGPUConstants.GPUBufferUsage_COPY_DST);
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

        this._setSubData(dataBuffer, offset, view, 0, count);
    }

    public bindUniformBufferBase(buffer: DataBuffer, location: number, name: string): void {
        this._uniformsBuffers[name] = buffer as WebGPUDataBuffer;
    }

    //------------------------------------------------------------------------------
    //                              Effects
    //------------------------------------------------------------------------------

    public createEffect(baseName: any, attributesNamesOrOptions: string[] | IEffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any): Effect {
        const vertex = baseName.vertexElement || baseName.vertex || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName;

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

    private _createPipelineStageDescriptor(vertexShader: Uint32Array, fragmentShader: Uint32Array): GPURenderPipelineStageDescriptor {
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

    private _compileRawPipelineStageDescriptor(vertexCode: string, fragmentCode: string): GPURenderPipelineStageDescriptor {
        var vertexShader = this._compileRawShaderToSpirV(vertexCode, "vertex");
        var fragmentShader = this._compileRawShaderToSpirV(fragmentCode, "fragment");

        return this._createPipelineStageDescriptor(vertexShader, fragmentShader);
    }

    private _compilePipelineStageDescriptor(vertexCode: string, fragmentCode: string, defines: Nullable<string>): GPURenderPipelineStageDescriptor {
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
                sources: {
                    fragment: fragmentSourceCode,
                    vertex: vertexSourceCode
                }
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
    public _createTexture(): WebGLTexture {
        // TODO WEBGPU. This should return the GPUTexture, WebGLTexture might need to be wrapped like the buffers.
        return { };
    }

    /** @hidden */
    public _releaseTexture(texture: InternalTexture): void {
        if (texture._webGPUTexture) {
            texture._webGPUTexture.destroy();
        }
    }

    private _uploadMipMapsFromWebglTexture(mipMaps: number, webglEngineTexture: InternalTexture, gpuTexture: GPUTexture, width: number, height: number, face: number) {
        this._uploadFromWebglTexture(webglEngineTexture, gpuTexture, width, height, face);

        let faceWidth = width;
        let faceHeight = height;

        for (let mip = 1; mip <= mipMaps; mip++) {
            faceWidth = Math.max(Math.floor(faceWidth / 2), 1);
            faceHeight = Math.max(Math.floor(faceHeight / 2), 1);

            this._uploadFromWebglTexture(webglEngineTexture, gpuTexture, faceWidth, faceHeight, face, mip);
        }
    }

    private _uploadFromWebglTexture(webglEngineTexture: InternalTexture, gpuTexture: GPUTexture, width: number, height: number, face: number, mip: number = 0): void {
        let pixels = this._decodeEngine._readTexturePixels(webglEngineTexture, width, height, face, mip);
        if (pixels instanceof Float32Array) {
            const newPixels = new Uint8ClampedArray(pixels.length);
            pixels.forEach((value, index) => newPixels[index] = value * 255);
            pixels = newPixels;
        }

        const textureView: GPUTextureCopyView = {
            texture: gpuTexture,
            origin: {
                x: 0,
                y: 0,
                z: Math.max(face, 0)
            },
            mipLevel: mip
        };
        const textureExtent = {
            width,
            height,
            depth: 1
        };

        const commandEncoder = this._device.createCommandEncoder({});
        const bytesPerRow = Math.ceil(width * 4 / 256) * 256;

        let dataBuffer: DataBuffer;
        if (bytesPerRow == width * 4) {
            dataBuffer = this._createBuffer(pixels, WebGPUConstants.GPUBufferUsage_COPY_SRC | WebGPUConstants.GPUBufferUsage_COPY_DST);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                bytesPerRow: bytesPerRow,
                rowsPerImage: height,
                offset: 0,
            };
            commandEncoder.copyBufferToTexture(bufferView, textureView, textureExtent);
        } else {
            const alignedPixels = new Uint8Array(bytesPerRow * height);
            let pixelsIndex = 0;
            for (let y = 0; y < height; ++y) {
                for (let x = 0; x < width; ++x) {
                    let i = x * 4 + y * bytesPerRow;

                    alignedPixels[i] = (pixels as any)[pixelsIndex];
                    alignedPixels[i + 1] = (pixels as any)[pixelsIndex + 1];
                    alignedPixels[i + 2] = (pixels as any)[pixelsIndex + 2];
                    alignedPixels[i + 3] = (pixels as any)[pixelsIndex + 3];
                    pixelsIndex += 4;
                }
            }
            dataBuffer = this._createBuffer(alignedPixels, WebGPUConstants.GPUBufferUsage_COPY_SRC | WebGPUConstants.GPUBufferUsage_COPY_DST);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                bytesPerRow: bytesPerRow,
                rowsPerImage: height,
                offset: 0,
            };
            commandEncoder.copyBufferToTexture(bufferView, textureView, textureExtent);
        }

        this._device.defaultQueue.submit([commandEncoder.finish()]);

        this._releaseBuffer(dataBuffer);
    }

    private _getSamplerFilterDescriptor(internalTexture: InternalTexture): {
        magFilter: GPUFilterMode,
        minFilter: GPUFilterMode,
        mipmapFilter: GPUFilterMode
    } {
        let magFilter: GPUFilterMode, minFilter: GPUFilterMode, mipmapFilter: GPUFilterMode;
        switch (internalTexture.samplingMode) {
            case Engine.TEXTURE_BILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_TRILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_linear;
                break;
            case Engine.TEXTURE_NEAREST_SAMPLINGMODE:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_linear;
                break;
            case Engine.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_linear;
                break;
            case Engine.TEXTURE_NEAREST_LINEAR:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_NEAREST_NEAREST:
                magFilter = WebGPUConstants.GPUFilterMode_nearest;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_linear;
                break;
            case Engine.TEXTURE_LINEAR_LINEAR:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            case Engine.TEXTURE_LINEAR_NEAREST:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_nearest;
                mipmapFilter = WebGPUConstants.GPUFilterMode_nearest;
                break;
            default:
                magFilter = WebGPUConstants.GPUFilterMode_linear;
                minFilter = WebGPUConstants.GPUFilterMode_linear;
                mipmapFilter = WebGPUConstants.GPUFilterMode_linear;
                break;
        }

        return {
            magFilter,
            minFilter,
            mipmapFilter
        };
    }

    private _getWrappingMode(mode: number): GPUAddressMode {
        switch (mode) {
            case Engine.TEXTURE_WRAP_ADDRESSMODE:
                return WebGPUConstants.GPUAddressMode_repeat;
            case Engine.TEXTURE_CLAMP_ADDRESSMODE:
                return WebGPUConstants.GPUAddressMode_clampToEdge;
            case Engine.TEXTURE_MIRROR_ADDRESSMODE:
                return WebGPUConstants.GPUAddressMode_mirrorRepeat;
        }
        return WebGPUConstants.GPUAddressMode_repeat;
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

    public createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null, buffer: Nullable<ArrayBuffer | HTMLImageElement> = null, fallBack?: InternalTexture, format?: number): InternalTexture {
        const texture = new InternalTexture(this, InternalTextureSource.Url);
        const url = String(urlArg);

        // TODO WEBGPU. Find a better way.
        // TODO WEBGPU. this._options.textureSize

        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;

        if (format) {
            texture.format = format;
        }

        let webglEngineTexture: InternalTexture;
        const onLoadInternal = () => {
            texture.isReady = webglEngineTexture.isReady;

            const width = webglEngineTexture.width;
            const height = webglEngineTexture.height;
            texture.width = width;
            texture.height = height;
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture._isRGBD = texture._isRGBD || webglEngineTexture._isRGBD;
            texture._sphericalPolynomial = webglEngineTexture._sphericalPolynomial;

            let mipMaps = Scalar.Log2(Math.max(width, height));
            mipMaps = Math.floor(mipMaps);

            const textureExtent = {
                width,
                height,
                depth: 1
            };
            const textureDescriptor: GPUTextureDescriptor = {
                dimension: WebGPUConstants.GPUTextureDimension_2d,
                format: WebGPUConstants.GPUTextureFormat_rgba8unorm,
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                sampleCount: 1,
                size: textureExtent,
                usage: WebGPUConstants.GPUTextureUsage_COPY_DST | WebGPUConstants.GPUTextureUsage_SAMPLED
            };

            const gpuTexture = this._device.createTexture(textureDescriptor);
            texture._webGPUTexture = gpuTexture;

            if (noMipmap) {
                this._uploadFromWebglTexture(webglEngineTexture, gpuTexture, width, height, -1);
            }
            else {
                this._uploadMipMapsFromWebglTexture(mipMaps, webglEngineTexture, gpuTexture, width, height, -1);
            }

            texture._webGPUTextureView = gpuTexture.createView();

            webglEngineTexture.dispose();

            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();

            if (onLoad) {
                onLoad();
            }
        };

        webglEngineTexture = this._decodeEngine.createTexture(urlArg, noMipmap, invertY, scene, samplingMode,
            onLoadInternal, onError, buffer, fallBack, format);

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null): InternalTexture {
        var texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Cube);
        texture.isCube = true;
        texture.url = rootUrl;
        texture.generateMipMaps = !noMipmap;
        // TODO WEBGPU. Cube Texture Sampling Mode.
        texture.samplingMode = noMipmap ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        texture._lodGenerationScale = lodScale;
        texture._lodGenerationOffset = lodOffset;

        if (!this._doNotHandleContextLost) {
            texture._extension = forcedExtension;
            texture._files = files;
        }

        let webglEngineTexture: InternalTexture;
        const onLoadInternal = () => {
            texture.isReady = webglEngineTexture.isReady;

            const width = webglEngineTexture.width;
            const height = webglEngineTexture.height;
            const depth = 1;
            texture.width = width;
            texture.height = height;
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.depth = depth;
            texture.baseDepth = depth;
            texture._isRGBD = texture._isRGBD || webglEngineTexture._isRGBD;
            texture._sphericalPolynomial = webglEngineTexture._sphericalPolynomial;

            let mipMaps = Scalar.Log2(width);
            mipMaps = Math.round(mipMaps);

            const textureExtent = {
                width,
                height,
                depth: depth * 6,
            };
            const textureDescriptor: GPUTextureDescriptor = {
                dimension: WebGPUConstants.GPUTextureDimension_2d,
                format: WebGPUConstants.GPUTextureFormat_rgba8unorm,
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                sampleCount: 1,
                size: textureExtent,
                usage: WebGPUConstants.GPUTextureUsage_COPY_DST | WebGPUConstants.GPUTextureUsage_SAMPLED
            };

            const gpuTexture = this._device.createTexture(textureDescriptor);
            texture._webGPUTexture = gpuTexture;

            const faces = [0, 1, 2, 3, 4, 5];
            for (let face of faces) {
                if (noMipmap) {
                    this._uploadFromWebglTexture(webglEngineTexture, gpuTexture, width, height, face);
                }
                else {
                    this._uploadMipMapsFromWebglTexture(mipMaps, webglEngineTexture, gpuTexture, width, height, face);
                }
            }
            texture._webGPUTextureView = gpuTexture.createView({
                dimension: WebGPUConstants.GPUTextureViewDimension_cube,
                format: WebGPUConstants.GPUTextureFormat_rgba8unorm,
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                baseArrayLayer: 0,
                baseMipLevel: 0,
                aspect: WebGPUConstants.GPUTextureAspect_all
            } as any);
            webglEngineTexture.dispose();

            onLoad && onLoad();
        };
        webglEngineTexture = this._decodeEngine.createCubeTexture(rootUrl, scene, files, noMipmap, onLoadInternal, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, fallback);

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
        texture.samplingMode = samplingMode;
    }

    public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
        throw "Unimplemented updateDynamicTexture on WebGPU so far";
    }

    public setTexture(channel: number, _: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>, name: string): void {
        if (this._currentEffect) {
            const pipeline = this._currentEffect._pipelineContext as WebGPUPipelineContext;
            if (!texture) {
                pipeline.samplers[name] = null;
                return;
            }

            const internalTexture = texture!.getInternalTexture();
            if (internalTexture) {
                internalTexture._cachedWrapU = texture.wrapU;
                internalTexture._cachedWrapV = texture.wrapV;
                internalTexture._cachedWrapR = texture.wrapR;
            }

            if (pipeline.samplers[name]) {
                pipeline.samplers[name]!.texture = internalTexture!;
            }
            else {
                // TODO WEBGPU. 121 mapping samplers <-> availableSamplers
                const availableSampler = pipeline.availableSamplers[name];
                if (availableSampler) {
                    pipeline.samplers[name] = {
                        setIndex: availableSampler.setIndex,
                        textureBinding: availableSampler.bindingIndex,
                        samplerBinding: availableSampler.bindingIndex + 1,
                        texture: internalTexture!
                    };
                }
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

    /** @hidden */
    public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, data: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
    }

    /** @hidden */
    public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
    }

    /** @hidden */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
    }

    /** @hidden */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement, faceIndex: number = 0, lod: number = 0) {
    }

    //------------------------------------------------------------------------------
    //                              Render Target Textures
    //------------------------------------------------------------------------------

    public createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
        let fullOptions = new RenderTargetCreationOptions();

        if (options !== undefined && typeof options === "object") {
            fullOptions.generateMipMaps = options.generateMipMaps;
            fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
            fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
            fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        } else {
            fullOptions.generateMipMaps = <boolean>options;
            fullOptions.generateDepthBuffer = true;
            fullOptions.generateStencilBuffer = false;
            fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
            fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        }
        var texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

        var width = size.width || size;
        var height = size.height || size;

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

    //------------------------------------------------------------------------------
    //                              Render Commands
    //------------------------------------------------------------------------------

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        super.beginFrame();

        this._uploadEncoder = this._device.createCommandEncoder(this._uploadEncoderDescriptor);
        this._renderEncoder = this._device.createCommandEncoder(this._renderEncoderDescriptor);
    }

    /**
     * End the current frame
     */
    public endFrame(): void {
        this._endRenderPass();

        this._commandBuffers[0] = this._uploadEncoder.finish();
        this._commandBuffers[1] = this._renderEncoder.finish();

        this._device.defaultQueue.submit(this._commandBuffers);

        super.endFrame();
    }

    //------------------------------------------------------------------------------
    //                              Render Pass
    //------------------------------------------------------------------------------

    private _startMainRenderPass(): void {
        if (this._currentRenderPass) {
            this._endRenderPass();
        }

        // Resolve in case of MSAA
        if (this._options.antialiasing) {
            this._mainColorAttachments[0].resolveTarget = this._swapChain.getCurrentTexture().createView();
        }
        else {
            this._mainColorAttachments[0].attachment = this._swapChain.getCurrentTexture().createView();
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

    private _getTopology(fillMode: number): GPUPrimitiveTopology {
        switch (fillMode) {
            // Triangle views
            case Constants.MATERIAL_TriangleFillMode:
                return WebGPUConstants.GPUPrimitiveTopology_triangleList;
            case Constants.MATERIAL_PointFillMode:
                return WebGPUConstants.GPUPrimitiveTopology_pointList;
            case Constants.MATERIAL_WireFrameFillMode:
                return WebGPUConstants.GPUPrimitiveTopology_lineList;
            // Draw modes
            case Constants.MATERIAL_PointListDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_pointList;
            case Constants.MATERIAL_LineListDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_lineList;
            case Constants.MATERIAL_LineLoopDrawMode:
                // return this._gl.LINE_LOOP;
                // TODO WEBGPU. Line Loop Mode Fallback at buffer load time.
                throw "LineLoop is an unsupported fillmode in WebGPU";
            case Constants.MATERIAL_LineStripDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_lineStrip;
            case Constants.MATERIAL_TriangleStripDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_triangleStrip;
            case Constants.MATERIAL_TriangleFanDrawMode:
                // return this._gl.TRIANGLE_FAN;
                // TODO WEBGPU. Triangle Fan Mode Fallback at buffer load time.
                throw "TriangleFan is an unsupported fillmode in WebGPU";
            default:
                return WebGPUConstants.GPUPrimitiveTopology_triangleList;
        }
    }

    private _getCompareFunction(compareFunction: Nullable<number>): GPUCompareFunction {
        switch (compareFunction) {
            case Constants.ALWAYS:
                return WebGPUConstants.GPUCompareFunction_always;
            case Constants.EQUAL:
                return WebGPUConstants.GPUCompareFunction_equal;
            case Constants.GREATER:
                return WebGPUConstants.GPUCompareFunction_greater;
            case Constants.GEQUAL:
                return WebGPUConstants.GPUCompareFunction_greaterEqual;
            case Constants.LESS:
                return WebGPUConstants.GPUCompareFunction_less;
            case Constants.LEQUAL:
                return WebGPUConstants.GPUCompareFunction_lessEqual;
            case Constants.NEVER:
                return WebGPUConstants.GPUCompareFunction_never;
            case Constants.NOTEQUAL:
                return WebGPUConstants.GPUCompareFunction_notEqual;
            default:
                return WebGPUConstants.GPUCompareFunction_less;
        }
    }

    private _getOpFunction(operation: Nullable<number>, defaultOp: GPUStencilOperation): GPUStencilOperation {
        switch (operation) {
            case Constants.KEEP:
                return WebGPUConstants.GPUStencilOperation_keep;
            case Constants.ZERO:
                return WebGPUConstants.GPUStencilOperation_zero;
            case Constants.REPLACE:
                return WebGPUConstants.GPUStencilOperation_replace;
            case Constants.INVERT:
                return WebGPUConstants.GPUStencilOperation_invert;
            case Constants.INCR:
                return WebGPUConstants.GPUStencilOperation_incrementClamp;
            case Constants.DECR:
                return WebGPUConstants.GPUStencilOperation_decrementClamp;
            case Constants.INCR_WRAP:
                return WebGPUConstants.GPUStencilOperation_incrementWrap;
            case Constants.DECR_WRAP:
                return WebGPUConstants.GPUStencilOperation_decrementWrap;
            default:
                return defaultOp;
        }
    }

    private _getDepthStencilStateDescriptor(): GPUDepthStencilStateDescriptor {
        // TODO WEBGPU. Depth State according to the cached state.
        // And the current render pass attachment setup.
        const stencilFrontBack: GPUStencilStateFaceDescriptor = {
            compare: this._getCompareFunction(this._stencilState.stencilFunc),
            depthFailOp: this._getOpFunction(this._stencilState.stencilOpDepthFail, WebGPUConstants.GPUStencilOperation_keep),
            failOp: this._getOpFunction(this._stencilState.stencilOpStencilFail, WebGPUConstants.GPUStencilOperation_keep),
            passOp: this._getOpFunction(this._stencilState.stencilOpStencilDepthPass, WebGPUConstants.GPUStencilOperation_replace)
        };

        return {
            depthWriteEnabled: this.getDepthWrite(),
            depthCompare: this._getCompareFunction(this.getDepthFunction()),
            format: WebGPUConstants.GPUTextureFormat_depth24plusStencil8,
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
                return WebGPUConstants.GPUFrontFace_ccw;
            default:
                return WebGPUConstants.GPUFrontFace_cw;
        }
    }

    private _getCullMode(): GPUCullMode {
        if (this._depthCullingState.cull === false) {
            return WebGPUConstants.GPUCullMode_none;
        }

        if (this._depthCullingState.cullFace === 2) {
            return WebGPUConstants.GPUCullMode_front;
        }
        else {
            return WebGPUConstants.GPUCullMode_back;
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
            return WebGPUConstants.GPUColorWriteBits_ALL;
        }
        return WebGPUConstants.GPUColorWriteBits_NONE;
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
                return WebGPUConstants.GPUBlendOperation_add;
            case 0x800A:
                return WebGPUConstants.GPUBlendOperation_substract;
            case 0x800B:
                return WebGPUConstants.GPUBlendOperation_reverseSubtract;
            default:
                return WebGPUConstants.GPUBlendOperation_add;
        }
    }

    private _getAphaBlendFactor(factor: Nullable<number>): GPUBlendFactor {
        switch (factor) {
            case 0:
                return WebGPUConstants.GPUBlendFactor_zero;
            case 1:
                return WebGPUConstants.GPUBlendFactor_one;
            case 0x0300:
                return WebGPUConstants.GPUBlendFactor_srcColor;
            case 0x0301:
                return WebGPUConstants.GPUBlendFactor_oneMinusSrcColor;
            case 0x0302:
                return WebGPUConstants.GPUBlendFactor_srcAlpha;
            case 0x0303:
                return WebGPUConstants.GPUBlendFactor_oneMinusSrcAlpha;
            case 0x0304:
                return WebGPUConstants.GPUBlendFactor_dstAlpha;
            case 0x0305:
                return WebGPUConstants.GPUBlendFactor_oneMinusDstAlpha;
            case 0x0306:
                return WebGPUConstants.GPUBlendFactor_dstColor;
            case 0x0307:
                return WebGPUConstants.GPUBlendFactor_oneMinusDstColor;
            case 0x0308:
                return WebGPUConstants.GPUBlendFactor_srcAlphaSaturated;
            case 0x8001:
                return WebGPUConstants.GPUBlendFactor_blendColor;
            case 0x8002:
                return WebGPUConstants.GPUBlendFactor_oneMinusBlendColor;
            case 0x8003:
                return WebGPUConstants.GPUBlendFactor_blendColor;
            case 0x8004:
                return WebGPUConstants.GPUBlendFactor_oneMinusBlendColor;
            default:
                return WebGPUConstants.GPUBlendFactor_one;
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

    private _getStages(): GPURenderPipelineStageDescriptor {
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
                        return normalized ? WebGPUConstants.GPUVertexFormat_char2norm : WebGPUConstants.GPUVertexFormat_char2;
                    case 4:
                        return normalized ? WebGPUConstants.GPUVertexFormat_char4norm : WebGPUConstants.GPUVertexFormat_char4;
                }
            case VertexBuffer.UNSIGNED_BYTE:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.GPUVertexFormat_uchar2norm : WebGPUConstants.GPUVertexFormat_uchar2;
                    case 4:
                        return normalized ? WebGPUConstants.GPUVertexFormat_uchar4norm : WebGPUConstants.GPUVertexFormat_uchar4;
                }
            case VertexBuffer.SHORT:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.GPUVertexFormat_short2norm : WebGPUConstants.GPUVertexFormat_short2;
                    case 4:
                        return normalized ? WebGPUConstants.GPUVertexFormat_short4norm : WebGPUConstants.GPUVertexFormat_short4;
                }
            case VertexBuffer.UNSIGNED_SHORT:
                switch (size) {
                    case 2:
                        return normalized ? WebGPUConstants.GPUVertexFormat_ushort2norm : WebGPUConstants.GPUVertexFormat_ushort2;
                    case 4:
                        return normalized ? WebGPUConstants.GPUVertexFormat_ushort4norm : WebGPUConstants.GPUVertexFormat_ushort4;
                }
            case VertexBuffer.INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.GPUVertexFormat_int;
                    case 2:
                        return WebGPUConstants.GPUVertexFormat_int2;
                    case 3:
                        return WebGPUConstants.GPUVertexFormat_int3;
                    case 4:
                        return WebGPUConstants.GPUVertexFormat_int4;
                }
            case VertexBuffer.UNSIGNED_INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.GPUVertexFormat_uint;
                    case 2:
                        return WebGPUConstants.GPUVertexFormat_uint2;
                    case 3:
                        return WebGPUConstants.GPUVertexFormat_uint3;
                    case 4:
                        return WebGPUConstants.GPUVertexFormat_uint4;
                }
            case VertexBuffer.FLOAT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.GPUVertexFormat_float;
                    case 2:
                        return WebGPUConstants.GPUVertexFormat_float2;
                    case 3:
                        return WebGPUConstants.GPUVertexFormat_float3;
                    case 4:
                        return WebGPUConstants.GPUVertexFormat_float4;
                }
        }

        throw new Error("Invalid Format '" + kind + "'");
    }

    private _getVertexInputDescriptor(): GPUVertexStateDescriptor {
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
                    stepMode: vertexBuffer.getIsInstanced() ? WebGPUConstants.GPUInputStepMode_instance : WebGPUConstants.GPUInputStepMode_vertex,
                    attributes: [positionAttributeDescriptor]
                };

               descriptors.push(vertexBufferDescriptor);
            }
        }

        if (!this._currentIndexBuffer) {
            return {
                indexFormat: WebGPUConstants.GPUIndexFormat_uint32,
                vertexBuffers: descriptors
            };
        }

        const inputStateDescriptor: GPUVertexStateDescriptor = {
            indexFormat: this._currentIndexBuffer!.is32Bits ? WebGPUConstants.GPUIndexFormat_uint32 : WebGPUConstants.GPUIndexFormat_uint16,
            vertexBuffers: descriptors
        };
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
                        visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                        type: WebGPUConstants.GPUBindingType_sampledTexture,
                        viewDimension: bindingDefinition.textureDimension,
                        // TODO WEBGPU. Handle texture component type properly.
                        // textureComponentType?: GPUTextureComponentType,
                        // multisampled?: boolean;
                        // hasDynamicOffset?: boolean;
                        // storageTextureFormat?: GPUTextureFormat;
                    }, {
                        // TODO WEBGPU. No Magic + 1 (coming from current 1 texture 1 sampler startegy).
                        binding: j + 1,
                        visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                        type: WebGPUConstants.GPUBindingType_sampler
                    });
                }
                else {
                    entries.push({
                        binding: j,
                        visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                        type: WebGPUConstants.GPUBindingType_uniformBuffer,
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

    private _getRenderPipeline(fillMode: number): GPURenderPipeline {
        // This is wrong to cache this way but workarounds the need of cache in the simple demo context.
        const gpuPipeline = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        if (gpuPipeline.renderPipeline) {
            return gpuPipeline.renderPipeline;
        }

        // Unsupported at the moment but needs to be extracted from the MSAA param.
        const topology = this._getTopology(fillMode);
        const rasterizationStateDescriptor = this._getRasterizationStateDescriptor();
        const depthStateDescriptor = this._getDepthStencilStateDescriptor();
        const colorStateDescriptors = this._getColorStateDescriptors();
        const stages = this._getStages();
        const inputStateDescriptor = this._getVertexInputDescriptor();
        const pipelineLayout = this._getPipelineLayout();

        gpuPipeline.renderPipeline = this._device.createRenderPipeline({
            sampleCount: this._mainPassSampleCount,
            primitiveTopology: topology,
            rasterizationState: rasterizationStateDescriptor,
            depthStencilState: depthStateDescriptor,
            colorStates: colorStateDescriptors,

            ...stages,
            vertexState: inputStateDescriptor,
            layout: pipelineLayout,
        });
        return gpuPipeline.renderPipeline;
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
                        if (!bindingInfo.texture._webGPUSampler) {
                            const samplerDescriptor: GPUSamplerDescriptor = this._getSamplerDescriptor(bindingInfo.texture!);
                            const gpuSampler = this._device.createSampler(samplerDescriptor);
                            bindingInfo.texture._webGPUSampler = gpuSampler;
                        }

                        entries.push({
                            binding: bindingInfo.textureBinding,
                            resource: bindingInfo.texture._webGPUTextureView!,
                        }, {
                            binding: bindingInfo.samplerBinding,
                            resource: bindingInfo.texture._webGPUSampler!,
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

    private _bindVertexInputs(vertexInputs: IWebGPUPipelineContextVertexInputsCache): void {
        const renderPass = this._bundleEncoder || this._currentRenderPass!;

        if (vertexInputs.indexBuffer) {
            // TODO WEBGPU. Check if cache would be worth it.
            renderPass.setIndexBuffer(vertexInputs.indexBuffer, vertexInputs.indexOffset);
        }

        // TODO WEBGPU. Optimize buffer reusability and types as more are now allowed.
        for (let i = 0; i < vertexInputs.vertexBuffers.length; i++) {
            const buf = vertexInputs.vertexBuffers[i];
            if (buf) {
                renderPass.setVertexBuffer(vertexInputs.vertexStartSlot + i, vertexInputs.vertexBuffers[i], vertexInputs.vertexOffsets[i]);
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

        const pipeline = this._getRenderPipeline(fillMode);
        renderPass.setPipeline(pipeline);

        const vertexInputs = this._getVertexInputsToRender();
        this._bindVertexInputs(vertexInputs);

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
            colorFormats: [ WebGPUConstants.GPUTextureFormat_bgra8unorm ],
            depthStencilFormat: WebGPUConstants.GPUTextureFormat_depth24plusStencil8,
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
        this._decodeEngine.dispose();
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

    public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void {
    }

    public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void {
    }

    public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void {
    }

    public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void {
    }

    public setArray(uniform: WebGLUniformLocation, array: number[]): void {
    }

    public setArray2(uniform: WebGLUniformLocation, array: number[]): void {
    }

    public setArray3(uniform: WebGLUniformLocation, array: number[]): void {
    }

    public setArray4(uniform: WebGLUniformLocation, array: number[]): void {
    }

    public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void {
    }

    public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void {
    }

    public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void {
    }

    public setFloat(uniform: WebGLUniformLocation, value: number): void {
    }

    public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void {
    }

    public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void {
    }

    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
    }
}
