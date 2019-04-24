import { Logger } from "../Misc/logger";
import { Nullable, DataArray, IndicesArray, FloatArray } from "../types";
import { Scene } from "../scene";
import { Matrix, Color3, Color4 } from "../Maths/math";
import { Scalar } from "../Maths/math.scalar";
import { Engine, EngineCapabilities, InstancingAttributeInfo } from "../Engines/engine";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { EffectCreationOptions, EffectFallbacks, Effect } from "../Materials/effect";
import { _TimeToken } from "../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { Constants } from "./constants";
import { WebGPUConstants } from "./WebGPU/webgpuConstants";
import { VertexBuffer } from "../Meshes/buffer";
import { WebGPUPipelineContext, IWebGPUPipelineContextVertexInputsCache } from './WebGPU/webgpuPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { DataBuffer } from '../Meshes/dataBuffer';
import { WebGPUDataBuffer } from '../Meshes/WebGPU/webgpuDataBuffer';
import { IInternalTextureLoader } from "../Materials/Textures/internalTextureLoader";
import { BaseTexture } from "../Materials/Textures/baseTexture";

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
}

/**
 * The web GPU engine class provides support for WebGPU version of babylon.js.
 */
export class WebGPUEngine extends Engine {
    // Page Life cycle and constants
    private readonly _uploadEncoderDescriptor = { label: "upload" };
    private readonly _renderEncoderDescriptor = { label: "render" };

    // Engine Life Cycle
    private _canvas: HTMLCanvasElement;
    private _options: WebGPUEngineOptions;
    private _shaderc: any = null;
    private _adapter: GPUAdapter;
    private _device: GPUDevice;
    private _context: GPUCanvasContext;
    private _swapChain: GPUSwapChain;

    // Some of the internal state might change during the render pass.
    // This happens mainly during clear for the state
    // And when the frame starts to swap the target texture from the swap chain
    private _mainColorAttachments: GPURenderPassColorAttachmentDescriptor[];
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
    private _compiledStages: { [key: string]: GPURenderPipelineStageDescriptor } = {};

    // Temporary...
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

        this._decodeEngine.getCaps().textureFloat = false;
        this._decodeEngine.getCaps().textureFloatRender = false;
        this._decodeEngine.getCaps().textureHalfFloat = false;
        this._decodeEngine.getCaps().textureHalfFloatRender = false;

        Logger.Log(`Babylon.js v${Engine.Version} - WebGPU engine`);
        if (!navigator.gpu) {
            // ToDo Fall back to webgl.
            Logger.Error("WebGPU is not supported by your browser.");
            return;
        }

        this._isWebGPU = true;

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
        this._doNotHandleContextLost = true;

        this._canvas = canvas;
        this._options = options;

        this._sharedInit(canvas, !!options.doNotHandleTouchAction, options.audioEngine);
    }

    //------------------------------------------------------------------------------
    //                              Initialization
    //------------------------------------------------------------------------------

    /**
     * Initializes the WebGPU context and dependencies.
     * @param shadercOptions Defines the ShaderC compiler options if necessary
     * @returns a promise notifying the readiness of the engine.
     */
    public initEngineAsync(shadercOptions: any = null): Promise<void> {
        return (window as any).Shaderc(shadercOptions)
            .then((shaderc: any) => {
                this._shaderc = shaderc;
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
            })
            .catch((e: any) => {
                Logger.Error("Can not create WebGPU Device and/or context.");
                Logger.Error(e);
            });
    }

    private _initializeLimits(): void {
        // Init caps
        // ToDo Real Capability check once limits will be working.

        this._caps = new EngineCapabilities();
        this._caps.maxTexturesImageUnits = 16;
        this._caps.maxVertexTextureImageUnits = 16;
        this._caps.maxTextureSize = 2048;
        this._caps.maxCubemapTextureSize = 2048;
        this._caps.maxRenderTextureSize = 2048;
        this._caps.maxVertexAttribs = 16;
        this._caps.maxVaryingVectors = 16;
        this._caps.maxFragmentUniformVectors = 1024;
        this._caps.maxVertexUniformVectors = 1024;

        // Extensions
        this._caps.standardDerivatives = true;

        this._caps.astc = null;
        this._caps.s3tc = null;
        this._caps.pvrtc = null;
        this._caps.etc1 = null;
        this._caps.etc2 = null;

        this._caps.textureAnisotropicFilterExtension = null;
        this._caps.maxAnisotropy = 0;
        this._caps.uintIndices = true;
        this._caps.fragmentDepthSupported = false;
        this._caps.highPrecisionShaderSupported = true;

        this._caps.colorBufferFloat = true;
        this._caps.textureFloat = false;
        this._caps.textureFloatLinearFiltering = false;
        this._caps.textureFloatRender = false;

        this._caps.textureHalfFloat = false;
        this._caps.textureHalfFloatLinearFiltering = false;
        this._caps.textureHalfFloatRender = false;

        this._caps.textureLOD = true;
        this._caps.drawBuffersExtension = true;

        this._caps.depthTextureExtension = true;
        // TODO. No need here but could be use to create descriptors ???
        this._caps.vertexArrayObject = false;
        this._caps.instancedArrays = true;

        // TODO. Unused for now.
        // this._caps.parallelShaderCompile = null;
    }

    private _initializeContextAndSwapChain(): void {
        this._context = this._canvas.getContext('gpupresent') as GPUCanvasContext;
        this._swapChain = this._device.createSwapChain({
            context: this._context,
            format: this._options.swapChainFormat,
        });
    }

    // Set default values as WebGL with depth and stencil attachment for the broadest Compat.
    // TODO. Reinit on resize.
    private _initializeMainAttachments(): void {
        this._mainColorAttachments = [{
            // attachment is acquired in render loop.
            clearColor: new Color4(0, 0, 0, 1),
            loadOp: WebGPUConstants.GPULoadOp_clear,
            storeOp: WebGPUConstants.GPUStoreOp_store
        }];

        const depthSize = {
            width: this.getRenderWidth(),
            height: this.getRenderHeight(),
            depth: 1
        };

        const depthTextureDescriptor = {
            size: depthSize,
            arrayLayerCount: 1,
            mipLevelCount: 1,
            sampleCount: 1,
            dimension: WebGPUConstants.GPUTextureDimension_2d,
            format: WebGPUConstants.GPUTextureFormat_depth32floatStencil8,
            usage: WebGPUConstants.GPUTextureUsage_OUTPUT_ATTACHMENT
        };

        const depthTexture = this._device.createTexture(depthTextureDescriptor);
        this._mainDepthAttachment = {
            attachment: depthTexture.createDefaultView(),

            depthLoadOp: WebGPUConstants.GPULoadOp_clear,
            depthStoreOp: WebGPUConstants.GPUStoreOp_store,
            stencilLoadOp: WebGPUConstants.GPULoadOp_clear,
            stencilStoreOp: WebGPUConstants.GPUStoreOp_store,
            clearDepth: 1.0
        };
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

    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
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
        // TODO. Cache.
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
        // TODO. Viewport.
        // Use 0 1 like the default webgl values.
        // this._currentRenderPass!.setViewport(x, y, width, height, 0, 1);
    }

    public enableScissor(x: number, y: number, width: number, height: number): void {
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }

        // TODO. Scissor.
        //this._currentRenderPass!.setScissorRect(x, y, width, height);
    }

    public disableScissor() {
        if (!this._currentRenderPass) {
            this._startMainRenderPass();
        }

        // TODO. Scissor.
        //this._currentRenderPass!.setScissorRect(0, 0, this.getRenderWidth(), this.getRenderHeight());
    }

    public clear(color: Color4, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        this._mainColorAttachments[0].clearColor = color;
        this._mainColorAttachments[0].loadOp = backBuffer ? WebGPUConstants.GPULoadOp_clear : WebGPUConstants.GPULoadOp_load;

        this._mainDepthAttachment.depthLoadOp = depth ? WebGPUConstants.GPULoadOp_clear : WebGPUConstants.GPULoadOp_load;
        this._mainDepthAttachment.stencilLoadOp = stencil ? WebGPUConstants.GPULoadOp_clear : WebGPUConstants.GPULoadOp_load;

        // TODO. Where to store GPUOpStore ???
        // TODO. Should be main or rtt with a frame buffer like object.
        this._startMainRenderPass();
    }

    //------------------------------------------------------------------------------
    //                              WebGPU Buffers
    //------------------------------------------------------------------------------

    private _createBuffer(view: ArrayBufferView, flags: GPUBufferUsageFlags): DataBuffer {
        const padding = view.byteLength % 4;
        const verticesBufferDescriptor = {
            size: view.byteLength + padding,
            usage: flags
        };
        const buffer = this._device.createBuffer(verticesBufferDescriptor);
        const dataBuffer = new WebGPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = view.byteLength;

        this._setSubData(dataBuffer, 0, view);

        return dataBuffer;
    }

    private _setSubData(dataBuffer: WebGPUDataBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void {
        const buffer = dataBuffer.underlyingResource as GPUBuffer;

        byteLength = byteLength || src.byteLength;
        byteLength = Math.min(byteLength, dataBuffer.capacity - dstByteOffset);

        // After Migration to Canary
        // This would do from PR #261
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
        // After Migration to Canary
        // const maxChunk = 1024 * 1024 * 16;
        const maxChunk = 1024 * 1024;
        let offset = 0;
        while ((chunkEnd - (chunkStart + offset)) > maxChunk) {
            const tempView = new Uint8Array(src.buffer.slice(chunkStart + offset, chunkStart + offset + maxChunk));
            buffer.setSubData(dstByteOffset + offset, tempView.buffer);
            offset += maxChunk;

            // After Migration to Canary
            // buffer.setSubData(dstByteOffset + offset, src, srcByteOffset + offset, maxChunk);
        }

        const tempView = new Uint8Array(src.buffer.slice(chunkStart + offset, chunkEnd));
        buffer.setSubData(dstByteOffset + offset, tempView.buffer);

        // After Migration to Canary
        // buffer.setSubData(dstByteOffset + offset, src, srcByteOffset + offset, byteLength - offset);
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_VERTEX | WebGPUConstants.GPUBufferUsage_TRANSFER_DST);
        return dataBuffer;
    }

    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        // TODO.
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_INDEX | WebGPUConstants.GPUBufferUsage_TRANSFER_DST);
        dataBuffer.is32Bits = is32Bits;
        return dataBuffer;
    }

    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        const gpuBuffer = indexBuffer as WebGPUDataBuffer;

        // TODO. Manage buffer morphing from small int to bigint.
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

        // TODO. check if offset is in bytes ???
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

        const dataBuffer = this._createBuffer(view, WebGPUConstants.GPUBufferUsage_UNIFORM | WebGPUConstants.GPUBufferUsage_TRANSFER_DST);
        return dataBuffer;
    }

    public createDynamicUniformBuffer(elements: FloatArray): DataBuffer {
        // TODO. Implement dynamic buffers.
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

        // TODO. Check count and offset are in bytes.
        this._setSubData(dataBuffer, offset, view, 0, count);
    }

    public bindUniformBufferBase(buffer: DataBuffer, location: number, name: string): void {
        this._uniformsBuffers[name] = buffer as WebGPUDataBuffer;
    }

    //------------------------------------------------------------------------------
    //                              Effects
    //------------------------------------------------------------------------------

    public createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any): Effect {
        const vertex = baseName.vertexElement || baseName.vertex || baseName;
        const fragment = baseName.fragmentElement || baseName.fragment || baseName;

        const name = vertex + "+" + fragment + "@" + (defines ? defines : (<EffectCreationOptions>attributesNamesOrOptions).defines);
        const effect = new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters, name);
        return effect;
    }

    private _compileRawShaderToSpirV(source: string, type: string): Uint32Array {
        const Shaderc = this._shaderc;
        const compiler = new Shaderc.Compiler();
        const opts = new Shaderc.CompileOptions();
        const result = compiler.CompileGlslToSpv(source,
            type === "fragment" ? Shaderc.shader_kind.fragment :
                type === "vertex" ? Shaderc.shader_kind.vertex :
                    type === "compute" ? Shaderc.shader_kind.compute : null,
            "tempCompilation.glsl", "main", opts);
        const error = result.GetErrorMessage();
        if (error) {
            Logger.Error(error);
            throw new Error("Something went wrong while compile the shader.");
        }
        return result.GetBinary().slice();
    }

    private _compileShaderToSpirV(source: string, type: string, defines: Nullable<string>, shaderVersion: string): Uint32Array {
        return this._compileRawShaderToSpirV(shaderVersion + (defines ? defines + "\n" : "") + source, type);
    }

    private _createPipelineStageDescriptor(vertexShader: Uint32Array, fragmentShader: Uint32Array): GPURenderPipelineStageDescriptor {
        // After Migration to Canary
        return {
            vertexStage: {
                module: this._device.createShaderModule({
                    // code: vertexShader,
                    code: vertexShader.buffer,
                }),
                entryPoint: "main",
            },
            fragmentStage: {
                module: this._device.createShaderModule({
                    // code: fragmentShader,
                    code: fragmentShader.buffer,
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

        var shaderVersion = "#version 450\n#define WEBGPU \n";
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

    public createPipelineContext(): IPipelineContext {
        var pipelineContext = new WebGPUPipelineContext();
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
        webGpuContext.vertexShaderCode = vertexSourceCode;
        webGpuContext.fragmentShaderCode = fragmentSourceCode;

        const stages = this._compiledStages[key];
        if (stages) {
            webGpuContext.stages = stages;
        }
        else {
            if (createAsRaw) {
                webGpuContext.stages = this._compileRawPipelineStageDescriptor(vertexSourceCode, fragmentSourceCode);
            }
            else {
                webGpuContext.stages = this._compilePipelineStageDescriptor(vertexSourceCode, fragmentSourceCode, defines);
            }
            this._compiledStages[key] = webGpuContext.stages;
        }
    }

    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const results = new Array(attributesNames.length);

        // TODO.
        // Hard coded for WebGPU until an introspection lib is available.

        const vertexShaderCode = (pipelineContext as WebGPUPipelineContext).vertexShaderCode;
        const attributesRegex = /layout\(location\s*=\s*([0-9]*)\)\s*in\s*\S*\s*(\S*);/gm;
        let matches: RegExpExecArray | null;
        while (matches = attributesRegex.exec(vertexShaderCode)) {
            const location = matches[1];
            const name = matches[2];

            const attributeIndex = attributesNames.indexOf(name);
            if (attributeIndex === -1) {
                continue;
            }

            results[attributeIndex] = +location;
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
            // TODO. Spector like cleanup.
            // TODO. Any pipeline required cleanup.
        }
    }

    //------------------------------------------------------------------------------
    //                              Textures
    //------------------------------------------------------------------------------

    // TODO. SHOULD not be possible to return gl unwrapped from Engine.
    /** @hidden */
    public _createTexture(): WebGLTexture {
        return { };
    }

    /** @hidden */
    public _releaseTexture(texture: InternalTexture): void {
        // TODO. check if it is all to release.
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
                z: 0
            },
            mipLevel: mip,
            arrayLayer: Math.max(face, 0),
        };
        const textureExtent = {
            width,
            height,
            depth: 1
        };

        const commandEncoder = this._device.createCommandEncoder({});
        const rowPitch = Math.ceil(width * 4 / 256) * 256;

        let dataBuffer: DataBuffer;
        if (rowPitch == width * 4) {
            dataBuffer = this._createBuffer(pixels, WebGPUConstants.GPUBufferUsage_TRANSFER_SRC | WebGPUConstants.GPUBufferUsage_TRANSFER_DST);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                rowPitch: rowPitch,
                imageHeight: height,
                offset: 0,
            };
            commandEncoder.copyBufferToTexture(bufferView, textureView, textureExtent);
        } else {
            const alignedPixels = new Uint8Array(rowPitch * height);
            let pixelsIndex = 0;
            for (let y = 0; y < height; ++y) {
                for (let x = 0; x < width; ++x) {
                    let i = x * 4 + y * rowPitch;

                    alignedPixels[i] = (pixels as any)[pixelsIndex];
                    alignedPixels[i + 1] = (pixels as any)[pixelsIndex + 1];
                    alignedPixels[i + 2] = (pixels as any)[pixelsIndex + 2];
                    alignedPixels[i + 3] = (pixels as any)[pixelsIndex + 3];
                    pixelsIndex += 4;
                }
            }
            dataBuffer = this._createBuffer(alignedPixels, WebGPUConstants.GPUBufferUsage_TRANSFER_SRC | WebGPUConstants.GPUBufferUsage_TRANSFER_DST);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                rowPitch: rowPitch,
                imageHeight: height,
                offset: 0,
            };
            commandEncoder.copyBufferToTexture(bufferView, textureView, textureExtent);
        }

        this._device.getQueue().submit([commandEncoder.finish()]);

        this._releaseBuffer(dataBuffer);
    }

    public createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null, buffer: Nullable<ArrayBuffer | HTMLImageElement> = null, fallBack?: InternalTexture, format?: number): InternalTexture {
        const texture = new InternalTexture(this, InternalTexture.DATASOURCE_URL);
        const url = String(urlArg);

        // TODO. Find a better way.
        // TODO. this._options.textureSize

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
            texture._isRGBD = webglEngineTexture._isRGBD;
            texture._sphericalPolynomial = webglEngineTexture._sphericalPolynomial;

            let mipMaps = Scalar.Log2(Math.max(width, height));
            mipMaps = Math.round(mipMaps);

            const textureExtent = {
                width,
                height,
                depth: 1
            };
            const textureDescriptor: GPUTextureDescriptor = {
                dimension: WebGPUConstants.GPUTextureDimension_2d,
                format: WebGPUConstants.GPUTextureFormat_rgba8unorm,
                arrayLayerCount: 1,
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                sampleCount: 1,
                size: textureExtent,
                usage: WebGPUConstants.GPUTextureUsage_TRANSFER_DST | WebGPUConstants.GPUTextureUsage_SAMPLED
            };

            const gpuTexture = this._device.createTexture(textureDescriptor);
            texture._webGPUTexture = gpuTexture;

            // TODO.
            const samplerDescriptor: GPUSamplerDescriptor = {
                magFilter: "linear",
                minFilter: "linear",
                mipmapFilter: "linear",
                addressModeU: "repeat",
                addressModeV: "repeat",
                addressModeW: "repeat",
            };
            const gpuSampler = this._device.createSampler(samplerDescriptor);
            texture._webGPUSampler = gpuSampler;

            if (noMipmap) {
                this._uploadFromWebglTexture(webglEngineTexture, gpuTexture, width, height, -1);
            }
            else {
                this._uploadMipMapsFromWebglTexture(mipMaps, webglEngineTexture, gpuTexture, width, height, -1);
            }

            texture._webGPUTextureView = gpuTexture.createDefaultView();

            webglEngineTexture.dispose();

            if (onLoad) {
                onLoad();
            }
        };
        webglEngineTexture = this._decodeEngine.createTexture(urlArg, noMipmap, invertY, scene, samplingMode,
            onLoadInternal, onError, buffer, fallBack, format);

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null, excludeLoaders: Array<IInternalTextureLoader> = []): InternalTexture {
        var texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_CUBE);
        texture.isCube = true;
        texture.url = rootUrl;
        texture.generateMipMaps = !noMipmap;
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
            texture._isRGBD = webglEngineTexture._isRGBD;
            texture._sphericalPolynomial = webglEngineTexture._sphericalPolynomial;

            let mipMaps = Scalar.Log2(width);
            mipMaps = Math.round(mipMaps);

            const textureExtent = {
                width,
                height,
                depth,
            };
            const textureDescriptor: GPUTextureDescriptor = {
                dimension: WebGPUConstants.GPUTextureDimension_2d,
                format: WebGPUConstants.GPUTextureFormat_rgba8unorm,
                arrayLayerCount: 6,
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                sampleCount: 1,
                size: textureExtent,
                usage: WebGPUConstants.GPUTextureUsage_TRANSFER_DST | WebGPUConstants.GPUTextureUsage_SAMPLED
            };

            const gpuTexture = this._device.createTexture(textureDescriptor);
            texture._webGPUTexture = gpuTexture;

            // TODO.
            const samplerDescriptor: GPUSamplerDescriptor = {
                magFilter: "linear",
                minFilter: "linear",
                mipmapFilter: "linear",
                addressModeU: "repeat",
                addressModeV: "repeat",
                addressModeW: "repeat",
            };
            const gpuSampler = this._device.createSampler(samplerDescriptor);
            texture._webGPUSampler = gpuSampler;

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
                arrayLayerCount: 6,
                dimension: "cube",
                format: "rgba8unorm",
                mipLevelCount: noMipmap ? 1 : mipMaps + 1,
                baseArrayLayer: 0,
                baseMipLevel: 0
            });
            webglEngineTexture.dispose();
        };
        webglEngineTexture = this._decodeEngine.createCubeTexture(rootUrl, scene, files, noMipmap, onLoadInternal, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, fallback, excludeLoaders);

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
        texture.samplingMode = samplingMode;
    }

    public updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
        // TODO.
        throw "Unimplemented updateDynamicTexture on WebGPU so far";
    }

    public setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>, name: string): void {
        if (this._currentEffect) {
            const pipeline = this._currentEffect._pipelineContext as WebGPUPipelineContext;
            if (!texture) {
                pipeline.samplers[name] = null;
            }
            else if (pipeline.samplers[name]) {
                pipeline.samplers[name]!.texture = texture!.getInternalTexture()!;
            }
            else {
                pipeline.samplers[name] = {
                    textureBinding: channel,
                    samplerBinding: channel + 1,
                    texture: texture!.getInternalTexture()!
                };
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
        var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);

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

        this._device.getQueue().submit(this._commandBuffers);

        super.endFrame();
    }

    //------------------------------------------------------------------------------
    //                              Render Pass
    //------------------------------------------------------------------------------

    private _startMainRenderPass(): void {
        if (this._currentRenderPass) {
            this._endRenderPass();
        }

        this._mainColorAttachments[0].attachment = this._swapChain.getCurrentTexture().createDefaultView();

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
                // TODO. Line Loop Mode
                throw "LineLoop is an unsupported fillmode in WebGPU";
            case Constants.MATERIAL_LineStripDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_lineStrip;
            case Constants.MATERIAL_TriangleStripDrawMode:
                return WebGPUConstants.GPUPrimitiveTopology_triangleStrip;
            case Constants.MATERIAL_TriangleFanDrawMode:
                // return this._gl.TRIANGLE_FAN;
                // TODO. Triangle Fan Mode
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
        // TODO. Depth State according to the cached state.
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
            format: WebGPUConstants.GPUTextureFormat_depth32floatStencil8,
            stencilFront: stencilFrontBack,
            stencilBack: stencilFrontBack,
            stencilReadMask: this._stencilState.stencilFuncMask,
            stencilWriteMask: this._stencilState.stencilMask,
        };
    }

    private _getFrontFace(): GPUFrontFace {
        switch (this._depthCullingState.cullFace) {
            case Constants.MATERIAL_ClockWiseSideOrientation:
                return WebGPUConstants.GPUFrontFace_cw;
            default:
                return WebGPUConstants.GPUFrontFace_ccw;
        }
    }

    private _getCullMode(): GPUCullMode {
        if (this._depthCullingState.cull === false) {
            return WebGPUConstants.GPUCullMode_none;
        }

        if (this.cullBackFaces) {
            return WebGPUConstants.GPUCullMode_back;
        }
        else {
            return WebGPUConstants.GPUCullMode_front;
        }
    }

    private _getRasterizationStateDescriptor(): GPURasterizationStateDescriptor {
        // TODO. Cull State according to the cached state.
        // And the current render pass attachment setup.
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

    private _getColorStateDescriptors(): GPUColorStateDescriptor[] {
        // TODO. Color State according to the cached blend state.
        // And the current render pass attaschment setup.
        // Manage Multi render target.
        return [{
            format: this._options.swapChainFormat,
            // alphaBlend: {
            //     srcFactor: ,
            //     dstFactor: ,
            //     operation: ,
            // },
            // colorBlend: {
            //     srcFactor: ,
            //     dstFactor: ,
            //     operation: ,
            // },
            alphaBlend: {},
            colorBlend: {},
            writeMask: this._getWriteMask(),
        }];
    }

    private _getStages(): GPURenderPipelineStageDescriptor {
        const gpuPipeline = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        return gpuPipeline.stages!;
    }

    private _getVertexInputDescriptorFormat(kind: string, type: number, normalized: boolean): GPUVertexFormat {
        switch (kind) {
            case VertexBuffer.UVKind:
            case VertexBuffer.UV2Kind:
            case VertexBuffer.UV3Kind:
            case VertexBuffer.UV4Kind:
            case VertexBuffer.UV5Kind:
            case VertexBuffer.UV6Kind:
                switch (type) {
                    case VertexBuffer.BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_char2norm : WebGPUConstants.GPUVertexFormat_char2;
                    case VertexBuffer.UNSIGNED_BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_uchar2norm : WebGPUConstants.GPUVertexFormat_uchar2;
                    case VertexBuffer.SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_short2norm : WebGPUConstants.GPUVertexFormat_short2;
                    case VertexBuffer.UNSIGNED_SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_ushort2norm : WebGPUConstants.GPUVertexFormat_ushort2;
                    case VertexBuffer.INT:
                        return WebGPUConstants.GPUVertexFormat_int2;
                    case VertexBuffer.UNSIGNED_INT:
                        return WebGPUConstants.GPUVertexFormat_uint2;
                    case VertexBuffer.FLOAT:
                        return WebGPUConstants.GPUVertexFormat_float2;
                }
            case VertexBuffer.NormalKind:
            case VertexBuffer.PositionKind:
                switch (type) {
                    case VertexBuffer.BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_char3norm : WebGPUConstants.GPUVertexFormat_char3;
                    case VertexBuffer.UNSIGNED_BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_uchar3norm : WebGPUConstants.GPUVertexFormat_uchar3;
                    case VertexBuffer.SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_short3norm : WebGPUConstants.GPUVertexFormat_short3;
                    case VertexBuffer.UNSIGNED_SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_ushort3norm : WebGPUConstants.GPUVertexFormat_ushort3;
                    case VertexBuffer.INT:
                        return WebGPUConstants.GPUVertexFormat_int3;
                    case VertexBuffer.UNSIGNED_INT:
                        return WebGPUConstants.GPUVertexFormat_uint3;
                    case VertexBuffer.FLOAT:
                        return WebGPUConstants.GPUVertexFormat_float3;
                }
            case VertexBuffer.ColorKind:
            case VertexBuffer.MatricesIndicesKind:
            case VertexBuffer.MatricesIndicesExtraKind:
            case VertexBuffer.MatricesWeightsKind:
            case VertexBuffer.MatricesWeightsExtraKind:
            case VertexBuffer.TangentKind:
            case "world0":
            case "world1":
            case "world2":
            case "world3":
                switch (type) {
                    case VertexBuffer.BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_char4norm : WebGPUConstants.GPUVertexFormat_char4;
                    case VertexBuffer.UNSIGNED_BYTE:
                        return normalized ? WebGPUConstants.GPUVertexFormat_uchar4norm : WebGPUConstants.GPUVertexFormat_uchar4;
                    case VertexBuffer.SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_short4norm : WebGPUConstants.GPUVertexFormat_short3;
                    case VertexBuffer.UNSIGNED_SHORT:
                        return normalized ? WebGPUConstants.GPUVertexFormat_ushort4norm : WebGPUConstants.GPUVertexFormat_ushort4;
                    case VertexBuffer.INT:
                        return WebGPUConstants.GPUVertexFormat_int4;
                    case VertexBuffer.UNSIGNED_INT:
                        return WebGPUConstants.GPUVertexFormat_uint4;
                    case VertexBuffer.FLOAT:
                        return WebGPUConstants.GPUVertexFormat_float4;
                }
            default:
                throw new Error("Invalid kind '" + kind + "'");
        }
    }

    private _getVertexInputDescriptor(): GPUInputStateDescriptor {
        const descriptors: GPUVertexInputDescriptor[] = [];
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
                    attributeIndex: location,

                    // After Migration to Canary
                    // shaderLocation: location,
                    offset: 0, // not available in WebGL
                    format: this._getVertexInputDescriptorFormat(vertexBuffer.getKind(), vertexBuffer.type, vertexBuffer.normalized),
                };

                // TODO. Factorize the one with the same underlying buffer.
                // manage interleaved and instances.
                const vertexBufferDescriptor: GPUVertexInputDescriptor = {
                    stride: vertexBuffer.byteStride,
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

        const inputStateDescriptor: GPUInputStateDescriptor = {
            indexFormat: this._currentIndexBuffer!.is32Bits ? WebGPUConstants.GPUIndexFormat_uint32 : WebGPUConstants.GPUIndexFormat_uint16,
            vertexBuffers: descriptors
        };
        return inputStateDescriptor;
    }

    private _getPipelineLayout(): GPUPipelineLayout {
        const bindGroupLayouts: GPUBindGroupLayout[] = [];
        let bindings: GPUBindGroupLayoutBinding[] = [];

        // Group 0: Scene Lights Image Processing Environment
        bindings = [];

        // Group 1: Camera
        if (this._currentEffect!._uniformBuffersNames["Scene"] > -1) {
            const groupLayoutBinding: GPUBindGroupLayoutBinding = {
                binding: 0,
                visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                type: WebGPUConstants.GPUBindingType_uniformBuffer,
            };
            bindings.push(groupLayoutBinding);
        }
        if (bindings.length > 0) {
            const uniformsBindGroupLayout = this._device.createBindGroupLayout({
                bindings,
            });
            bindGroupLayouts[0] = uniformsBindGroupLayout;
        }
        bindings = [];

        // Group 3: Materials
        if (this._currentEffect!._uniformBuffersNames["Material"] > -1) {
            const groupLayoutBinding: GPUBindGroupLayoutBinding = {
                binding: 0,
                visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                type: WebGPUConstants.GPUBindingType_uniformBuffer,
            };
            bindings.push(groupLayoutBinding);
        }
        if (bindings.length > 0) {
            const uniformsBindGroupLayout = this._device.createBindGroupLayout({
                bindings,
            });
            bindGroupLayouts[1] = uniformsBindGroupLayout;
        }
        bindings = [];

        // Group 4: Mesh
        if (this._currentEffect!._uniformBuffersNames["Mesh"]) {
            const groupLayoutBinding: GPUBindGroupLayoutBinding = {
                binding: 0,
                visibility: WebGPUConstants.GPUShaderStageBit_VERTEX | WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                type: WebGPUConstants.GPUBindingType_uniformBuffer,
            };
            bindings.push(groupLayoutBinding);
        }

        // TODO. Should be on group 2 at the end so as we only have one mesh :-)
        const samplers = this._currentEffect!._samplerList;
        const context = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        for (let samplerName of samplers) {
            const bindingInfo = context.samplers[samplerName];
            if (bindingInfo) {
                bindings.push({
                    binding: bindingInfo.textureBinding,
                    visibility: WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                    type: "sampled-texture"
                }, {
                    binding: bindingInfo.samplerBinding,
                    visibility: WebGPUConstants.GPUShaderStageBit_FRAGMENT,
                    type: "sampler"
                });
            }
        }

        if (bindings.length > 0) {
            const uniformsBindGroupLayout = this._device.createBindGroupLayout({
                bindings,
            });
            bindGroupLayouts[2] = uniformsBindGroupLayout;
        }

        (this._currentEffect!._pipelineContext as WebGPUPipelineContext).bindGroupLayouts = bindGroupLayouts;
        return this._device.createPipelineLayout({
            bindGroupLayouts
        });
    }

    private _getRenderPipeline(fillMode: number): GPURenderPipeline {
        // This is wrong to cache this way but workarounds the need of cache in the simple demo context.
        const gpuPipeline = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        if (gpuPipeline.renderPipeline) {
            return gpuPipeline.renderPipeline;
        }

        // Unsupported at the moment but needs to be extracted from the MSAA param.
        const sampleCount = 1;
        const topology = this._getTopology(fillMode);
        const rasterizationStateDescrriptor = this._getRasterizationStateDescriptor();
        const depthStateDescriptor = this._getDepthStencilStateDescriptor();
        const colorStateDescriptors = this._getColorStateDescriptors();
        const stages = this._getStages();
        const inputStateDescriptor = this._getVertexInputDescriptor();
        const pipelineLayout = this._getPipelineLayout();

        gpuPipeline.renderPipeline = this._device.createRenderPipeline({
            sampleCount: sampleCount,
            primitiveTopology: topology,
            rasterizationState: rasterizationStateDescrriptor,
            depthStencilState: depthStateDescriptor,
            colorStates: colorStateDescriptors,

            ...stages,
            vertexInput: inputStateDescriptor,
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
            // TODO. Check if cache would be worth it.
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

        // TODO. Optimize buffer reusability and types as more are now allowed.
        return vertexInputs;
    }

    // TODO. find a better solution than hardcoded groups.
    private _getBindGroupsToRender(): GPUBindGroup[] {
        const gpuContext = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
        let bindGroups = gpuContext.bindGroups;
        if (bindGroups) {
            return bindGroups;
        }

        bindGroups = [];
        gpuContext.bindGroups = bindGroups;

        const bindGroupLayouts = (this._currentEffect!._pipelineContext as WebGPUPipelineContext).bindGroupLayouts;
        if (this._currentEffect!._uniformBuffersNames["Scene"] > -1) {
            const dataBuffer = this._uniformsBuffers["Scene"];
            const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
            const uniformBindGroup = this._device.createBindGroup({
                layout: bindGroupLayouts[0],
                bindings: [{
                    binding: 0,
                    resource: {
                        buffer: webgpuBuffer,
                        offset: 0,
                        size: dataBuffer.capacity,
                    },
                }],
            });

            bindGroups.push(uniformBindGroup);
        }

        if (this._currentEffect!._uniformBuffersNames["Material"] > -1) {
            const dataBuffer = this._uniformsBuffers["Material"];
            const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
            const uniformBindGroup = this._device.createBindGroup({
                layout: bindGroupLayouts[0],
                bindings: [{
                    binding: 0,
                    resource: {
                        buffer: webgpuBuffer,
                        offset: 0,
                        size: dataBuffer.capacity,
                    },
                }],
            });

            bindGroups.push(uniformBindGroup);
        }

        if (this._currentEffect!._uniformBuffersNames["Mesh"]) {
            const dataBuffer = this._uniformsBuffers["Mesh"];
            const webgpuBuffer = dataBuffer.underlyingResource as GPUBuffer;
            const bindings: GPUBindGroupBinding[] = [{
                binding: 0,
                resource: {
                    buffer: webgpuBuffer,
                    offset: 0,
                    size: dataBuffer.capacity,
                },
            }];

            // TODO. Should be on group 2 at the end so as we only have one mesh :-)
            const samplers = this._currentEffect!._samplerList;
            const context = this._currentEffect!._pipelineContext as WebGPUPipelineContext;
            for (let samplerName of samplers) {
                const bindingInfo = context.samplers[samplerName];
                if (bindingInfo) {
                    bindings.push({
                        binding: bindingInfo.textureBinding,
                        resource: bindingInfo.texture._webGPUTextureView!,
                    }, {
                        binding: bindingInfo.samplerBinding,
                        resource: bindingInfo.texture._webGPUSampler!,
                    });
                }
            }
            const uniformBindGroup = this._device.createBindGroup({
                layout: bindGroupLayouts[2],
                bindings: bindings,
            });

            bindGroups.push(uniformBindGroup);
        }
        return bindGroups;
    }

    private _bindVertexInputs(vertexInputs: IWebGPUPipelineContextVertexInputsCache): void {
        const renderPass = this._currentRenderPass!;

        if (vertexInputs.indexBuffer) {
            // TODO. Check if cache would be worth it.
            renderPass.setIndexBuffer(vertexInputs.indexBuffer, vertexInputs.indexOffset);
        }

        // TODO. Optimize buffer reusability and types as more are now allowed.
        this._currentRenderPass!.setVertexBuffers(vertexInputs.vertexStartSlot, vertexInputs.vertexBuffers, vertexInputs.vertexOffsets);
    }

    private _setRenderBindGroups(bindGroups: GPUBindGroup[]): void {
        // TODO. Only set groups if changes happened if changes.
        const renderPass = this._currentRenderPass!;
        for (let i = 0; i < bindGroups.length; i++) {
            renderPass.setBindGroup(i, bindGroups[i]);
        }
    }

    private _setRenderPipeline(fillMode: number): void {
        // TODO. Add dynamicity to the data.
        const pipeline = this._getRenderPipeline(fillMode);
        this._currentRenderPass!.setPipeline(pipeline);

        const vertexInputs = this._getVertexInputsToRender();
        this._bindVertexInputs(vertexInputs);

        const bindGroups = this._getBindGroupsToRender();
        this._setRenderBindGroups(bindGroups);
    }

    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount: number = 1): void {
        this._setRenderPipeline(fillMode);

        this._currentRenderPass!.drawIndexed(indexCount, instancesCount, indexStart, 0, 0);
    }

    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount: number = 1): void {
        this._currentIndexBuffer = null;

        this._setRenderPipeline(fillMode);

        this._currentRenderPass!.draw(verticesCount, instancesCount, verticesStart, 0);
    }

    //------------------------------------------------------------------------------
    //                              Dispose
    //------------------------------------------------------------------------------

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        this._decodeEngine.dispose();
        this._compiledStages = { };
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
        // TODO. from the webgpu errors.
        return 0;
    }

    //------------------------------------------------------------------------------
    //                              Unused WebGPU
    //------------------------------------------------------------------------------
    public areAllEffectsReady(): boolean {
        // TODO.
        // No parallel shader compilation.
        return true;
    }

    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        // TODO.
        // No parallel shader compilation.
        // No Async, so direct launch
        action();
    }

    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        // TODO.
        // No parallel shader compilation.
        return true;
    }

    public _getUnpackAlignement(): number {
        return 1;
    }

    public _unpackFlipY(value: boolean) { }

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

    public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): void {
    }

    public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): void {
    }

    public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): void {
    }

    public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): void {
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

    public setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void {
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

    public setBool(uniform: WebGLUniformLocation, bool: number): void {
    }

    public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
    }

    public setColor3(uniform: WebGLUniformLocation, color3: Color3): void {
    }

    public setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void {
    }
}
