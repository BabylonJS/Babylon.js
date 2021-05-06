import { Constants } from "../constants";
import * as WebGPUConstants from './webgpuConstants';
import { Effect } from "../../Materials/effect";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { VertexBuffer } from "../../Buffers/buffer";
import { DataBuffer } from "../../Buffers/dataBuffer";
import { Nullable } from "../../types";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import { WebGPUPipelineContext } from "./webgpuPipelineContext";

enum StatePosition {
    //DepthBias = 0, // not used, so remove it to improve perf
    //DepthBiasClamp = 1, // not used, so remove it to improve perf
    StencilReadMask = 0,
    StencilWriteMask = 1,
    DepthBiasSlopeScale = 2,
    MRTAttachments1 = 3,
    MRTAttachments2 = 4,
    DepthStencilState = 5,
    RasterizationState = 6,
    ColorStates = 7,
    ShaderStage = 8,
    VertexState = 9, // vertex state will consume positions 9, 10, ... depending on the number of vertex inputs

    NumStates = 10
}

const textureFormatToIndex: { [name: string]: number } = {
    "" : 0,
    "r8unorm": 1,
    "r8snorm": 2,
    "r8uint": 3,
    "r8sint": 4,

    "r16uint": 5,
    "r16sint": 6,
    "r16float": 7,
    "rg8unorm": 8,
    "rg8snorm": 9,
    "rg8uint": 10,
    "rg8sint": 11,

    "r32uint": 12,
    "r32sint": 13,
    "r32float": 14,
    "rg16uint": 15,
    "rg16sint": 16,
    "rg16float": 17,
    "rgba8unorm": 18,
    "rgba8unorm-srgb": 19,
    "rgba8snorm": 20,
    "rgba8uint": 21,
    "rgba8sint": 22,
    "bgra8unorm": 23,
    "bgra8unorm-srgb": 24,

    "rgb9e5ufloat": 25,
    "rgb10a2unorm": 26,
    "rg11b10ufloat": 27,

    "rg32uint": 28,
    "rg32sint": 29,
    "rg32float": 30,
    "rgba16uint": 31,
    "rgba16sint": 32,
    "rgba16float": 33,

    "rgba32uint": 34,
    "rgba32sint": 35,
    "rgba32float": 36,

    "stencil8": 37,
    "depth16unorm": 38,
    "depth24plus": 39,
    "depth24plus-stencil8": 40,
    "depth32float": 41,

    "bc1-rgba-unorm": 42,
    "bc1-rgba-unorm-srgb": 43,
    "bc2-rgba-unorm": 44,
    "bc2-rgba-unorm-srgb": 45,
    "bc3-rgba-unorm": 46,
    "bc3-rgba-unorm-srgb": 47,
    "bc4-r-unorm": 48,
    "bc4-r-snorm": 49,
    "bc5-rg-unorm": 50,
    "bc5-rg-snorm": 51,
    "bc6h-rgb-ufloat": 52,
    "bc6h-rgb-float": 53,
    "bc7-rgba-unorm": 54,
    "bc7-rgba-unorm-srgb": 55,

    "depth24unorm-stencil8": 56,

    "depth32float-stencil8": 57,
};

const alphaBlendFactorToIndex: { [name: number]: number } = {
    0: 1, // Zero
    1: 2, // One
    0x0300: 3, // SrcColor
    0x0301: 4, // OneMinusSrcColor
    0x0302: 5, // SrcAlpha
    0x0303: 6, // OneMinusSrcAlpha
    0x0304: 7, // DstAlpha
    0x0305: 8, // OneMinusDstAlpha
    0x0306: 9, // DstColor
    0x0307: 10, // OneMinusDstColor
    0x0308: 11, // SrcAlphaSaturated
    0x8001: 12, // BlendColor
    0x8002: 13, // OneMinusBlendColor
    0x8003: 12, // BlendColor (alpha)
    0x8004: 13, // OneMinusBlendColor (alpha)
};

const stencilOpToIndex: { [name: number]: number } = {
    0x0000: 0, // ZERO
    0x1E00: 1, // KEEP
    0x1E01: 2, // REPLACE
    0x1E02: 3, // INCR
    0x1E03: 4, // DECR
    0x150A: 5, // INVERT
    0x8507: 6, // INCR_WRAP
    0x8508: 7, // DECR_WRAP
};

/** @hidden */
export abstract class WebGPUCacheRenderPipeline {

    public static NumCacheHitWithoutHash = 0;
    public static NumCacheHitWithHash = 0;
    public static NumCacheMiss = 0;
    public static NumPipelineCreationLastFrame = 0;

    public disabled: boolean;

    private static _NumPipelineCreationCurrentFrame = 0;

    protected _states: number[];
    protected _statesLength: number;
    protected _stateDirtyLowestIndex: number;
    public lastStateDirtyLowestIndex: number; // for stats only

    private _device: GPUDevice;
    private _isDirty: boolean;
    private _emptyVertexBuffer: VertexBuffer;
    private _parameter: { token: any, pipeline: Nullable<GPURenderPipeline> };
    private _kMaxVertexBufferStride;

    private _shaderId: number;
    private _alphaToCoverageEnabled: boolean;
    private _frontFace: number;
    private _cullEnabled: boolean;
    private _cullFace: number;
    private _clampDepth: boolean;
    private _rasterizationState: number;
    private _depthBias: number;
    private _depthBiasClamp: number;
    private _depthBiasSlopeScale: number;
    private _colorFormat: number;
    private _webgpuColorFormat: GPUTextureFormat[];
    private _mrtAttachments1: number;
    private _mrtAttachments2: number;
    private _mrtFormats: GPUTextureFormat[];
    private _alphaBlendEnabled: boolean;
    private _alphaBlendFuncParams: Array<Nullable<number>>;
    private _alphaBlendEqParams: Array<Nullable<number>>;
    private _writeMask: number;
    private _colorStates: number;
    private _depthStencilFormat: number;
    private _webgpuDepthStencilFormat: GPUTextureFormat | undefined;
    private _depthTestEnabled: boolean;
    private _depthWriteEnabled: boolean;
    private _depthCompare: number;
    private _stencilEnabled: boolean;
    private _stencilFrontCompare: number;
    private _stencilFrontDepthFailOp: number;
    private _stencilFrontPassOp: number;
    private _stencilFrontFailOp: number;
    private _stencilReadMask: number;
    private _stencilWriteMask: number;
    private _depthStencilState: number;
    private _vertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>;
    private _overrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>;
    private _indexBuffer: Nullable<DataBuffer>;

    constructor(device: GPUDevice, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._states = new Array(30); // pre-allocate enough room so that no new allocation will take place afterwards
        this._statesLength = 0;
        this._stateDirtyLowestIndex = 0;
        this._emptyVertexBuffer = emptyVertexBuffer;
        this._mrtFormats = [];
        this._parameter = { token: undefined, pipeline: null };
        this.disabled = false;
        this.vertexBuffers = [];
        this._kMaxVertexBufferStride = 2048; // TODO WEBGPU: get this value from device.limits.maxVertexBufferArrayStride
        this.reset();
    }

    public reset(): void {
        this._isDirty = true;
        this.vertexBuffers.length = 0;
        this.setAlphaToCoverage(false);
        this.resetDepthCullingState();
        this.setClampDepth(false);
        //this.setDepthBias(0);
        //this.setDepthBiasClamp(0);
        this._webgpuColorFormat = [WebGPUConstants.TextureFormat.BGRA8Unorm];
        this.setColorFormat(WebGPUConstants.TextureFormat.BGRA8Unorm);
        this.setMRTAttachments([], []);
        this.setAlphaBlendEnabled(false);
        this.setAlphaBlendFactors([null, null, null, null], [null, null]);
        this.setWriteMask(0xF);
        this.setDepthStencilFormat(WebGPUConstants.TextureFormat.Depth24PlusStencil8);
        this.setStencilEnabled(false);
        this.resetStencilState();
        this.setBuffers(null, null, null);
    }

    protected abstract _getRenderPipeline(param: { token: any, pipeline: Nullable<GPURenderPipeline> }): void;
    protected abstract _setRenderPipeline(param: { token: any, pipeline: Nullable<GPURenderPipeline> }): void;

    public readonly vertexBuffers: VertexBuffer[];

    public get colorFormats(): GPUTextureFormat[] {
        return this._mrtAttachments1 > 0 ? this._mrtFormats : this._webgpuColorFormat;
    }

    public readonly mrtAttachments: number[];
    public readonly mrtTextureArray: InternalTexture[];

    public getRenderPipeline(fillMode: number, effect: Effect, sampleCount: number): GPURenderPipeline {
        if (this.disabled) {
            const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

            this._setVertexState(effect); // to fill this.vertexBuffers with correct data

            this._parameter.pipeline = this._createRenderPipeline(effect, topology, sampleCount);

            WebGPUCacheRenderPipeline.NumCacheMiss++;
            WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;

            return this._parameter.pipeline;
        }

        this._setShaderStage(effect.uniqueId);
        this._setRasterizationState(fillMode, sampleCount);
        this._setColorStates();
        this._setDepthStencilState();
        this._setVertexState(effect);

        this.lastStateDirtyLowestIndex = this._stateDirtyLowestIndex;

        if (!this._isDirty && this._parameter.pipeline) {
            this._stateDirtyLowestIndex = this._statesLength;
            WebGPUCacheRenderPipeline.NumCacheHitWithoutHash++;
            return this._parameter.pipeline;
        }

        this._getRenderPipeline(this._parameter);

        this._isDirty = false;
        this._stateDirtyLowestIndex = this._statesLength;

        if (this._parameter.pipeline) {
            WebGPUCacheRenderPipeline.NumCacheHitWithHash++;
            return this._parameter.pipeline;
        }

        const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

        this._parameter.pipeline = this._createRenderPipeline(effect, topology, sampleCount);
        this._setRenderPipeline(this._parameter);

        WebGPUCacheRenderPipeline.NumCacheMiss++;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;

        return this._parameter.pipeline;
    }

    public endFrame(): void {
        WebGPUCacheRenderPipeline.NumPipelineCreationLastFrame = WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame = 0;
    }

    public setAlphaToCoverage(enabled: boolean): void {
        this._alphaToCoverageEnabled = enabled;
    }

    public setFrontFace(frontFace: number): void {
        this._frontFace = frontFace;
    }

    public setCullEnabled(enabled: boolean): void {
        this._cullEnabled = enabled;
    }

    public setCullFace(cullFace: number): void {
        this._cullFace = cullFace;
    }

    public setClampDepth(clampDepth: boolean): void {
        this._clampDepth = clampDepth;
    }

    public resetDepthCullingState(): void {
        this.setDepthCullingState(false, 2, 1, 0, true, true, Constants.ALWAYS);
    }

    public setDepthCullingState(cullEnabled: boolean, frontFace: number, cullFace: number, zOffset: number, depthTestEnabled: boolean, depthWriteEnabled: boolean, depthCompare: Nullable<number>): void {
        this._depthWriteEnabled = depthWriteEnabled;
        this._depthTestEnabled = depthTestEnabled;
        this._depthCompare = (depthCompare ?? Constants.ALWAYS) - 0x0200;
        this._cullFace = cullFace;
        this._cullEnabled = cullEnabled;
        this._frontFace = frontFace;
        this.setDepthBiasSlopeScale(zOffset);
    }

    /*public setDepthBias(depthBias: number): void {
        if (this._depthBias !== depthBias) {
            this._depthBias = depthBias;
            this._states[StatePosition.DepthBias] = depthBias.toString();
            this._isDirty = true;
        }
    }

    public setDepthBiasClamp(depthBiasClamp: number): void {
        if (this._depthBiasClamp !== depthBiasClamp) {
            this._depthBiasClamp = depthBiasClamp;
            this._states[StatePosition.DepthBiasClamp] = depthBiasClamp.toString();
            this._isDirty = true;
        }
    }*/

    public setDepthBiasSlopeScale(depthBiasSlopeScale: number): void {
        if (this._depthBiasSlopeScale !== depthBiasSlopeScale) {
            this._depthBiasSlopeScale = depthBiasSlopeScale;
            this._states[StatePosition.DepthBiasSlopeScale] = depthBiasSlopeScale;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthBiasSlopeScale);
        }
    }

    public setColorFormat(format: GPUTextureFormat): void {
        this._webgpuColorFormat[0] = format;
        this._colorFormat = textureFormatToIndex[format];
    }

    public setMRTAttachments(attachments: number[], textureArray: InternalTexture[]): void {
        if (attachments.length > 10) {
            // If we want more than 10 attachments we need to change this method but 10 seems plenty
            // Note we can do better without changing this method if only dealing with texture formats that can be used as output attachments
            // It could allow to use 5 bits (or even less) to code a texture format. For the time being, we use 6 bits as we need 58 different values (2^6=64)
            // so we can encode 5 texture formats in 32 bits
            throw "Can't handle more than 10 attachments for a MRT in cache render pipeline!";
        }
        (this.mrtAttachments as any) = attachments;
        (this.mrtTextureArray as any) = textureArray;

        let bits: number[] = [0, 0], indexBits = 0, mask = 0, numRT = 0;
        for (let i = 0; i < attachments.length; ++i) {
            const index = attachments[i];
            if (index === 0) {
                continue;
            }

            const texture = textureArray[index - 1];
            const gpuWrapper = texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;

            this._mrtFormats[numRT] = gpuWrapper?.format ?? this._webgpuColorFormat[0];

            bits[indexBits] += textureFormatToIndex[this._mrtFormats[numRT]] << mask;
            mask += 6;
            numRT++;

            if (mask >= 32) {
                mask = 0;
                indexBits++;
            }
        }
        this._mrtFormats.length = numRT;
        if (this._mrtAttachments1 !== bits[0] || this._mrtAttachments2 !== bits[1]) {
            this._mrtAttachments1 = bits[0];
            this._mrtAttachments2 = bits[1];
            this._states[StatePosition.MRTAttachments1] = bits[0];
            this._states[StatePosition.MRTAttachments2] = bits[1];
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.MRTAttachments1);
        }
    }

    public setAlphaBlendEnabled(enabled: boolean): void {
        this._alphaBlendEnabled = enabled;
    }

    public setAlphaBlendFactors(factors: Array<Nullable<number>>, operations: Array<Nullable<number>>): void {
        this._alphaBlendFuncParams = factors;
        this._alphaBlendEqParams = operations;
    }

    public setWriteMask(mask: number): void {
        this._writeMask = mask;
    }

    public setDepthStencilFormat(format: GPUTextureFormat | undefined): void {
        this._webgpuDepthStencilFormat = format;
        this._depthStencilFormat = format === undefined ? 0 : textureFormatToIndex[format];
    }

    public setDepthTestEnabled(enabled: boolean): void {
        this._depthTestEnabled = enabled;
    }

    public setDepthWriteEnabled(enabled: boolean): void {
        this._depthWriteEnabled = enabled;
    }

    public setDepthCompare(func: Nullable<number>): void {
        this._depthCompare = (func ?? Constants.ALWAYS) - 0x0200;
    }

    public setStencilEnabled(enabled: boolean): void {
        this._stencilEnabled = enabled;
    }

    public setStencilCompare(func: Nullable<number>): void {
        this._stencilFrontCompare = (func ?? Constants.ALWAYS) - 0x0200;
    }

    public setStencilDepthFailOp(op: Nullable<number>): void {
        this._stencilFrontDepthFailOp = op === null ? 1 /* KEEP */ : stencilOpToIndex[op];
    }

    public setStencilPassOp(op: Nullable<number>): void {
        this._stencilFrontPassOp = op === null ? 2 /* REPLACE */ : stencilOpToIndex[op];
    }

    public setStencilFailOp(op: Nullable<number>): void {
        this._stencilFrontFailOp = op === null ? 1 /* KEEP */ : stencilOpToIndex[op];
    }

    public setStencilReadMask(mask: number): void {
        if (this._stencilReadMask !== mask) {
            this._stencilReadMask = mask;
            this._states[StatePosition.StencilReadMask] = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.StencilReadMask);
        }
    }

    public setStencilWriteMask(mask: number): void {
        if (this._stencilWriteMask !== mask) {
            this._stencilWriteMask = mask;
            this._states[StatePosition.StencilWriteMask] = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.StencilWriteMask);
        }
    }

    public resetStencilState(): void {
        this.setStencilState(false, Constants.ALWAYS, Constants.KEEP, Constants.REPLACE, Constants.KEEP, 0xFF, 0xFF);
    }

    public setStencilState(stencilEnabled: boolean, compare: Nullable<number>, depthFailOp: Nullable<number>, passOp: Nullable<number>, failOp: Nullable<number>, readMask: number, writeMask: number): void {
        this._stencilEnabled = stencilEnabled;
        this._stencilFrontCompare = (compare ?? Constants.ALWAYS) - 0x0200;
        this._stencilFrontDepthFailOp = depthFailOp === null ? 1 /* KEEP */ : stencilOpToIndex[depthFailOp];
        this._stencilFrontPassOp = passOp === null ? 2 /* REPLACE */ : stencilOpToIndex[passOp];
        this._stencilFrontFailOp = failOp === null ? 1 /* KEEP */ : stencilOpToIndex[failOp];
        this.setStencilReadMask(readMask);
        this.setStencilWriteMask(writeMask);
    }

    public setBuffers(vertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>, indexBuffer: Nullable<DataBuffer>, overrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>): void {
        this._vertexBuffers = vertexBuffers;
        this._overrideVertexBuffers = overrideVertexBuffers;
        this._indexBuffer = indexBuffer;
    }

    private static _GetTopology(fillMode: number): GPUPrimitiveTopology {
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

    private static _GetAphaBlendOperation(operation: Nullable<number>): GPUBlendOperation {
        switch (operation) {
            case 0x8006:
                return WebGPUConstants.BlendOperation.Add;
            case 0x800A:
                return WebGPUConstants.BlendOperation.Subtract;
            case 0x800B:
                return WebGPUConstants.BlendOperation.ReverseSubtract;
            case 0x8007:
                return WebGPUConstants.BlendOperation.Min;
            case 0x8008:
                return WebGPUConstants.BlendOperation.Max;
            default:
                return WebGPUConstants.BlendOperation.Add;
        }
    }

    private static _GetAphaBlendFactor(factor: Nullable<number>): GPUBlendFactor {
        switch (factor) {
            case 0:
                return WebGPUConstants.BlendFactor.Zero;
            case 1:
                return WebGPUConstants.BlendFactor.One;
            case 0x0300:
                return WebGPUConstants.BlendFactor.Src;
            case 0x0301:
                return WebGPUConstants.BlendFactor.OneMinusSrc;
            case 0x0302:
                return WebGPUConstants.BlendFactor.SrcAlpha;
            case 0x0303:
                return WebGPUConstants.BlendFactor.OneMinusSrcAlpha;
            case 0x0304:
                return WebGPUConstants.BlendFactor.DstAlpha;
            case 0x0305:
                return WebGPUConstants.BlendFactor.OneMinusDstAlpha;
            case 0x0306:
                return WebGPUConstants.BlendFactor.Dst;
            case 0x0307:
                return WebGPUConstants.BlendFactor.OneMinusDst;
            case 0x0308:
                return WebGPUConstants.BlendFactor.SrcAlphaSaturated;
            case 0x8001:
                return WebGPUConstants.BlendFactor.Constant;
            case 0x8002:
                return WebGPUConstants.BlendFactor.OneMinusConstant;
            case 0x8003:
                return WebGPUConstants.BlendFactor.Constant;
            case 0x8004:
                return WebGPUConstants.BlendFactor.OneMinusConstant;
            default:
                return WebGPUConstants.BlendFactor.One;
        }
    }

    private static _GetCompareFunction(compareFunction: number): GPUCompareFunction {
        switch (compareFunction) {
            case 0: // NEVER
                return WebGPUConstants.CompareFunction.Never;
            case 1: // LESS
                return WebGPUConstants.CompareFunction.Less;
            case 2: // EQUAL
                return WebGPUConstants.CompareFunction.Equal;
            case 3: // LEQUAL
                return WebGPUConstants.CompareFunction.LessEqual;
            case 4: // GREATER
                return WebGPUConstants.CompareFunction.Greater;
            case 5: // NOTEQUAL
                return WebGPUConstants.CompareFunction.NotEqual;
            case 6: // GEQUAL
                return WebGPUConstants.CompareFunction.GreaterEqual;
            case 7: // ALWAYS
                return WebGPUConstants.CompareFunction.Always;
        }
        return WebGPUConstants.CompareFunction.Never;
    }

    private static _GetStencilOpFunction(operation: number): GPUStencilOperation {
        switch (operation) {
            case 0:
                return WebGPUConstants.StencilOperation.Zero;
            case 1:
                return WebGPUConstants.StencilOperation.Keep;
            case 2:
                return WebGPUConstants.StencilOperation.Replace;
            case 3:
                return WebGPUConstants.StencilOperation.IncrementClamp;
            case 4:
                return WebGPUConstants.StencilOperation.DecrementClamp;
            case 5:
                return WebGPUConstants.StencilOperation.Invert;
            case 6:
                return WebGPUConstants.StencilOperation.IncrementWrap;
            case 7:
                return WebGPUConstants.StencilOperation.DecrementWrap;
        }
        return WebGPUConstants.StencilOperation.Keep;
    }

    private static _GetVertexInputDescriptorFormat(vertexBuffer: VertexBuffer): GPUVertexFormat {
        const type = vertexBuffer.type;
        const normalized = vertexBuffer.normalized;
        const size = vertexBuffer.getSize();

        switch (type) {
            case VertexBuffer.BYTE:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Snorm8x2 : WebGPUConstants.VertexFormat.Sint8x2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Snorm8x4 : WebGPUConstants.VertexFormat.Sint8x4;
                }
                break;
            case VertexBuffer.UNSIGNED_BYTE:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Unorm8x2 : WebGPUConstants.VertexFormat.Uint8x2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Unorm8x4 : WebGPUConstants.VertexFormat.Uint8x4;
                }
                break;
            case VertexBuffer.SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Snorm16x2 : WebGPUConstants.VertexFormat.Sint16x2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Snorm16x4 : WebGPUConstants.VertexFormat.Sint16x4;
                }
                break;
            case VertexBuffer.UNSIGNED_SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Unorm16x2 : WebGPUConstants.VertexFormat.Uint16x2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Unorm16x4 : WebGPUConstants.VertexFormat.Uint16x4;
                }
                break;
            case VertexBuffer.INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Sint32;
                    case 2:
                        return WebGPUConstants.VertexFormat.Sint32x2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Sint32x3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Sint32x4;
                }
                break;
            case VertexBuffer.UNSIGNED_INT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Uint32;
                    case 2:
                        return WebGPUConstants.VertexFormat.Uint32x2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Uint32x3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Uint32x4;
                }
                break;
            case VertexBuffer.FLOAT:
                switch (size) {
                    case 1:
                        return WebGPUConstants.VertexFormat.Float32;
                    case 2:
                        return WebGPUConstants.VertexFormat.Float32x2;
                    case 3:
                        return WebGPUConstants.VertexFormat.Float32x3;
                    case 4:
                        return WebGPUConstants.VertexFormat.Float32x4;
                }
                break;
        }

        throw new Error(`Invalid Format '${vertexBuffer.getKind()}' - type=${type}, normalized=${normalized}, size=${size}`);
    }

    private _getAphaBlendState(): GPUBlendComponent {
        if (!this._alphaBlendEnabled) {
            return { };
        }

        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[2]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[3]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[1]),
        };
    }

    private _getColorBlendState(): GPUBlendComponent {
        if (!this._alphaBlendEnabled) {
            return { };
        }

        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[0]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[1]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[0]),
        };
    }

    private _setShaderStage(id: number): void {
        if (this._shaderId !== id) {
            this._shaderId = id;
            this._states[StatePosition.ShaderStage] = id;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.ShaderStage);
        }
    }

    private _setRasterizationState(topology: number, sampleCount: number): void {
        const frontFace = this._frontFace;
        const cullMode = this._cullEnabled ? this._cullFace : 0;
        const clampDepth = this._clampDepth ? 1 : 0;
        const alphaToCoverage = this._alphaToCoverageEnabled ? 1 : 0;
        const rasterizationState =
            (frontFace - 1) +
            (cullMode << 1) +
            (clampDepth << 3) +
            (alphaToCoverage << 4) +
            (topology << 5) +
            (sampleCount << 8);

        if (this._rasterizationState !== rasterizationState) {
            this._rasterizationState = rasterizationState;
            this._states[StatePosition.RasterizationState] = this._rasterizationState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.RasterizationState);
        }
    }

    private _setColorStates(): void {
        let colorStates =
            ((this._writeMask ? 1 : 0) << 22) + (this._colorFormat << 23) +
            ((this._depthWriteEnabled ? 1 : 0) << 29); // this state has been moved from depthStencilState here because alpha and depth are related (generally when alpha is on, depth write is off and the other way around)

        if (this._alphaBlendEnabled) {
            colorStates +=
                ((this._alphaBlendFuncParams[0] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[0]]) << 0) +
                ((this._alphaBlendFuncParams[1] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[1]]) << 4) +
                ((this._alphaBlendFuncParams[2] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[2]]) << 8) +
                ((this._alphaBlendFuncParams[3] === null ? 2 : alphaBlendFactorToIndex[this._alphaBlendFuncParams[3]]) << 12) +
                ((this._alphaBlendEqParams[0] === null ? 1 : this._alphaBlendEqParams[0] - 0x8005) << 16) +
                ((this._alphaBlendEqParams[1] === null ? 1 : this._alphaBlendEqParams[1] - 0x8005) << 19);
        }

        if (colorStates !== this._colorStates) {
            this._colorStates = colorStates;
            this._states[StatePosition.ColorStates] = this._colorStates;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.ColorStates);
        }
    }

    private _setDepthStencilState(): void {
        let stencilState = !this._stencilEnabled ?
            7 /* ALWAYS */ + (1 /* KEEP */ << 3) + (1 /* KEEP */ << 6) + (1 /* KEEP */ << 9) :
            this._stencilFrontCompare + (this._stencilFrontDepthFailOp << 3) + (this._stencilFrontPassOp << 6) + (this._stencilFrontFailOp << 9);

        const depthStencilState =
                this._depthStencilFormat +
                ((this._depthTestEnabled ? this._depthCompare : 7 /* ALWAYS */) << 6) +
                (stencilState << 10); // stencil front - stencil back is the same

        if (this._depthStencilState !== depthStencilState) {
            this._depthStencilState = depthStencilState;
            this._states[StatePosition.DepthStencilState] = this._depthStencilState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthStencilState);
        }
    }

    private _setVertexState(effect: Effect): void {
        const currStateLen = this._statesLength;
        let newNumStates = StatePosition.VertexState;

        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const attributes = webgpuPipelineContext.shaderProcessingContext.attributeNamesFromEffect;
        const locations = webgpuPipelineContext.shaderProcessingContext.attributeLocationsFromEffect;

        let currentGPUBuffer;
        let numVertexBuffers = 0;
        for (var index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers![attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
            }

            const buffer = vertexBuffer.getBuffer()?.underlyingResource;

            // We optimize usage of GPUVertexBufferLayout: we will create a single GPUVertexBufferLayout for all the attributes which follow each other and which use the same GPU buffer
            // However, there are some constraints in the attribute.offset value range, so we must check for them before being able to reuse the same GPUVertexBufferLayout
            // See _getVertexInputDescriptor() below
            if (vertexBuffer._validOffsetRange === undefined) {
                const offset = vertexBuffer.byteOffset;
                const formatSize = vertexBuffer.getSize(true);
                const byteStride = vertexBuffer.byteStride;
                vertexBuffer._validOffsetRange = offset <= (this._kMaxVertexBufferStride - formatSize) && (byteStride === 0 || (offset + formatSize) <= byteStride);
            }

            if (!(currentGPUBuffer && currentGPUBuffer === buffer && vertexBuffer._validOffsetRange)) {
                // we can't combine the previous vertexBuffer with the current one
                this.vertexBuffers[numVertexBuffers++] = vertexBuffer;
                currentGPUBuffer = vertexBuffer._validOffsetRange ? buffer : null;
            }

            const vid = vertexBuffer.hashCode + (location << 7);

            this._isDirty = this._isDirty || this._states[newNumStates] !== vid;
            this._states[newNumStates++] = vid;
        }

        this.vertexBuffers.length = numVertexBuffers;

        this._statesLength = newNumStates;
        this._isDirty = this._isDirty || newNumStates !== currStateLen;
        if (this._isDirty) {
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.VertexState);
        }
    }

    private _createPipelineLayout(webgpuPipelineContext: WebGPUPipelineContext): GPUPipelineLayout {
        const bindGroupLayouts: GPUBindGroupLayout[] = [];

        for (let i = 0; i < webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers.length; i++) {
            const setDefinition = webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers[i];
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
                const bindingDefinition = webgpuPipelineContext.shaderProcessingContext.orderedUBOsAndSamplers[i][j];
                if (bindingDefinition === undefined) {
                    continue;
                }

                let visibility = 0;
                if (bindingDefinition.usedInVertex) {
                    visibility = visibility | WebGPUConstants.ShaderStage.Vertex;
                }
                if (bindingDefinition.usedInFragment) {
                    visibility = visibility | WebGPUConstants.ShaderStage.Fragment;
                }

                const entry: GPUBindGroupLayoutEntry = {
                    binding: j,
                    visibility,
                };
                entries.push(entry);

                if (bindingDefinition.isSampler) {
                    entry.sampler = {
                        type: bindingDefinition.isComparisonSampler ? WebGPUConstants.SamplerBindingType.Comparison : WebGPUConstants.SamplerBindingType.Filtering
                    };
                } else if (bindingDefinition.isTexture) {
                    entry.texture = {
                        sampleType: bindingDefinition.sampleType,
                        viewDimension: bindingDefinition.textureDimension,
                        multisampled: false,
                    };
                } else {
                    entry.buffer = {
                        type: WebGPUConstants.BufferBindingType.Uniform,
                    };
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

    private _getVertexInputDescriptor(effect: Effect, topology: GPUPrimitiveTopology): GPUVertexBufferLayout[] {
        const descriptors: GPUVertexBufferLayout[] = [];
        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const attributes = webgpuPipelineContext.shaderProcessingContext.attributeNamesFromEffect;
        const locations = webgpuPipelineContext.shaderProcessingContext.attributeLocationsFromEffect;

        let currentGPUBuffer;
        let currentGPUAttributes: GPUVertexAttribute[] | undefined;
        for (var index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers![attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
            }

            let buffer = vertexBuffer.getBuffer()?.underlyingResource;

            // We reuse the same GPUVertexBufferLayout for all attributes that use the same underlying GPU buffer (and for attributes that follow each other in the attributes array)
            let offset = vertexBuffer.byteOffset;
            const invalidOffsetRange = !vertexBuffer._validOffsetRange;
            if (!(currentGPUBuffer && currentGPUAttributes && currentGPUBuffer === buffer) || invalidOffsetRange) {
                const vertexBufferDescriptor: GPUVertexBufferLayout = {
                    arrayStride: vertexBuffer.byteStride,
                    stepMode: vertexBuffer.getIsInstanced() ? WebGPUConstants.InputStepMode.Instance : WebGPUConstants.InputStepMode.Vertex,
                    attributes: []
                };

                descriptors.push(vertexBufferDescriptor);
                currentGPUAttributes = vertexBufferDescriptor.attributes;
                if (invalidOffsetRange) {
                    offset = 0; // the offset will be set directly in the setVertexBuffer call
                    buffer = null; // buffer can't be reused
                }
            }

            currentGPUAttributes.push({
                shaderLocation: location,
                offset,
                format: WebGPUCacheRenderPipeline._GetVertexInputDescriptorFormat(vertexBuffer),
            });

            currentGPUBuffer = buffer;
        }

        return descriptors;
    }

    private _createRenderPipeline(effect: Effect, topology: GPUPrimitiveTopology, sampleCount: number): GPURenderPipeline {
        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const inputStateDescriptor = this._getVertexInputDescriptor(effect, topology);
        const pipelineLayout = this._createPipelineLayout(webgpuPipelineContext);

        const colorStates: Array<GPUColorTargetState> = [];
        const alphaBlend = this._getAphaBlendState();
        const colorBlend = this._getColorBlendState();

        if (this._mrtAttachments1 > 0) {
            for (let i = 0; i < this._mrtFormats.length; ++i) {
                colorStates.push({
                    format: this._mrtFormats[i],
                    blend: {
                        alpha: alphaBlend,
                        color: colorBlend,
                    },
                    writeMask: this._writeMask,
                });
            }
        } else {
            colorStates.push({
                format: this._webgpuColorFormat[0],
                blend: {
                    alpha: alphaBlend,
                    color: colorBlend,
                },
                writeMask: this._writeMask,
            });
        }

        const stencilFrontBack: GPUStencilStateFace = {
            compare: WebGPUCacheRenderPipeline._GetCompareFunction(this._stencilEnabled ? this._stencilFrontCompare : 7 /* ALWAYS */),
            depthFailOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontDepthFailOp : 1 /* KEEP */),
            failOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontFailOp : 1 /* KEEP */),
            passOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontPassOp : 1 /* KEEP */)
        };

        let stripIndexFormat: GPUIndexFormat | undefined = undefined;
        if (topology === WebGPUConstants.PrimitiveTopology.LineStrip || topology === WebGPUConstants.PrimitiveTopology.TriangleStrip) {
            stripIndexFormat = !this._indexBuffer || this._indexBuffer.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16;
        }

        return this._device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: webgpuPipelineContext.stages!.vertexStage.module,
                entryPoint: webgpuPipelineContext.stages!.vertexStage.entryPoint,
                buffers: inputStateDescriptor,
            },
            primitive: {
                topology,
                stripIndexFormat,
                frontFace: this._frontFace === 1 ? WebGPUConstants.FrontFace.CCW : WebGPUConstants.FrontFace.CW,
                cullMode: !this._cullEnabled ? WebGPUConstants.CullMode.None : this._cullFace === 2 ? WebGPUConstants.CullMode.Front : WebGPUConstants.CullMode.Back,
            },
            fragment: !webgpuPipelineContext.stages!.fragmentStage ? undefined : {
                module: webgpuPipelineContext.stages!.fragmentStage.module,
                entryPoint: webgpuPipelineContext.stages!.fragmentStage.entryPoint,
                targets: colorStates,
            },

            multisample: {
                count: sampleCount,
                /*mask,
                alphaToCoverageEnabled,*/
            },
            depthStencil: this._webgpuDepthStencilFormat === undefined ? undefined : {
                depthWriteEnabled: this._depthWriteEnabled,
                depthCompare: this._depthTestEnabled ? WebGPUCacheRenderPipeline._GetCompareFunction(this._depthCompare) : WebGPUConstants.CompareFunction.Always,
                format: this._webgpuDepthStencilFormat,
                stencilFront: stencilFrontBack,
                stencilBack: stencilFrontBack,
                stencilReadMask: this._stencilReadMask,
                stencilWriteMask: this._stencilWriteMask,
                depthBias: this._depthBias,
                depthBiasClamp: this._depthBiasClamp,
                depthBiasSlopeScale: this._depthBiasSlopeScale,
                /*clampDepth*/
            },
        });
    }

}
