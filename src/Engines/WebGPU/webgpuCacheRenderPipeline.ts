import { Constants } from "../constants";
import * as WebGPUConstants from './webgpuConstants';
import { Effect } from "../../Materials/effect";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { VertexBuffer } from "../../Meshes/buffer";
import { DataBuffer } from "../../Meshes/dataBuffer";
import { Nullable } from "../../types";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import { WebGPUPipelineContext } from "./webgpuPipelineContext";

enum StatePosition {
    ShaderStage = 0,
    RasterizationState = 1,
    DepthBias = 2,
    DepthBiasClamp = 3,
    DepthBiasSlopeScale = 4,
    MRTAttachments1 = 5,
    MRTAttachments2 = 6,
    ColorStates = 7,
    DepthStencilState = 8,
    StencilReadMask = 9,
    StencilWriteMask = 10,
    VertexState = 11,

    NumStates = 12
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
export class WebGPUCacheRenderPipeline {

    public static NumCacheHitWithoutHash = 0;
    public static NumCacheHitWithHash = 0;
    public static NumCacheMiss = 0;
    public static NumPipelineCreationLastFrame = 0;

    public disabled: boolean;

    private static _Cache: { [hash: string]: GPURenderPipeline } = {};
    private static _NumPipelineCreationCurrentFrame = 0;

    private _device: GPUDevice;
    private _states: string[];
    private _isDirty: boolean;
    private _currentRenderPipeline: GPURenderPipeline;
    private _emptyVertexBuffer: VertexBuffer;
    //private _numFrames: number;

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
    private _webgpuColorFormat: GPUTextureFormat;
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
    private _indexBuffer: Nullable<DataBuffer>;
    private _vertexState: string;

    constructor(device: GPUDevice, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._states = [];
        this._states.length = StatePosition.NumStates;
        this._emptyVertexBuffer = emptyVertexBuffer;
        this._mrtFormats = [];
        this.disabled = false;
        //this._numFrames = 0;
        this.reset();
    }

    public reset(): void {
        this._isDirty = true;
        this.setAlphaToCoverage(false);
        this.resetDepthCullingState();
        this.setClampDepth(false);
        this.setDepthBias(0);
        this.setDepthBiasClamp(0);
        this.setColorFormat(WebGPUConstants.TextureFormat.BGRA8Unorm);
        this.setMRTAttachments([], []);
        this.setAlphaBlendEnabled(false);
        this.setAlphaBlendFactors([null, null, null, null], [null, null]);
        this.setWriteMask(0xF);
        this.setDepthStencilFormat(WebGPUConstants.TextureFormat.Depth24PlusStencil8);
        this.setStencilEnabled(false);
        this.resetStencilState();
        this.setBuffers(null, null);
    }

    public getRenderPipeline(fillMode: number, effect: Effect, sampleCount: number): GPURenderPipeline {
        if (this.disabled) {
            const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

            this._currentRenderPipeline = this._createRenderPipeline(effect, topology, sampleCount);

            WebGPUCacheRenderPipeline.NumCacheMiss++;
            WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;

            return this._currentRenderPipeline;
        }

        this._setShaderStage(effect.uniqueId);
        this._setRasterizationState(fillMode, sampleCount);
        this._setColorStates();
        this._setDepthStencilState();
        this._setVertexState(effect);

        if (!this._isDirty && this._currentRenderPipeline) {
            WebGPUCacheRenderPipeline.NumCacheHitWithoutHash++;
            return this._currentRenderPipeline;
        }

        let hash = this._states.join();
        let pipeline = WebGPUCacheRenderPipeline._Cache[hash];

        if (pipeline) {
            this._currentRenderPipeline = pipeline;
            WebGPUCacheRenderPipeline.NumCacheHitWithHash++;
            return pipeline;
        }

        const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

        this._currentRenderPipeline = this._createRenderPipeline(effect, topology, sampleCount);
        WebGPUCacheRenderPipeline._Cache[hash] = this._currentRenderPipeline;

        WebGPUCacheRenderPipeline.NumCacheMiss++;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;

        return this._currentRenderPipeline;
    }

    public endFrame(): void {
        //this._numFrames++;
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

    public setDepthBias(depthBias: number): void {
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
    }

    public setDepthBiasSlopeScale(depthBiasSlopeScale: number): void {
        if (this._depthBiasSlopeScale !== depthBiasSlopeScale) {
            this._depthBiasSlopeScale = depthBiasSlopeScale;
            this._states[StatePosition.DepthBiasSlopeScale] = depthBiasSlopeScale.toString();
            this._isDirty = true;
        }
    }

    public setColorFormat(format: GPUTextureFormat): void {
        this._webgpuColorFormat = format;
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
        let bits: number[] = [0, 0], indexBits = 0, mask = 0;
        this._mrtFormats.length = attachments.length;
        for (let i = 0; i < attachments.length; ++i) {
            const index = attachments[i];
            const texture = textureArray[index - 1];
            const gpuWrapper = texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;

            this._mrtFormats[i] = gpuWrapper?.format ?? this._webgpuColorFormat;

            bits[indexBits] += textureFormatToIndex[this._mrtFormats[i]] << mask;
            mask += 6;

            if (mask >= 32) {
                mask = 0;
                indexBits++;
            }
        }
        if (this._mrtAttachments1 !== bits[0] || this._mrtAttachments2 !== bits[1]) {
            this._mrtAttachments1 = bits[0];
            this._mrtAttachments2 = bits[1];
            this._states[StatePosition.MRTAttachments1] = bits[0].toString();
            this._states[StatePosition.MRTAttachments2] = bits[1].toString();
            this._isDirty = true;
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
            this._states[StatePosition.StencilReadMask] = mask.toString();
            this._isDirty = true;
        }
    }

    public setStencilWriteMask(mask: number): void {
        if (this._stencilWriteMask !== mask) {
            this._stencilWriteMask = mask;
            this._states[StatePosition.StencilWriteMask] = mask.toString();
            this._isDirty = true;
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

    public setBuffers(vertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>, indexBuffer: Nullable<DataBuffer>): void {
        this._vertexBuffers = vertexBuffers;
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
                        return normalized ? WebGPUConstants.VertexFormat.Char2Norm : WebGPUConstants.VertexFormat.Char2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Char4Norm : WebGPUConstants.VertexFormat.Char4;
                }
                break;
            case VertexBuffer.UNSIGNED_BYTE:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Uchar2Norm : WebGPUConstants.VertexFormat.Uchar2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Uchar4Norm : WebGPUConstants.VertexFormat.Uchar4;
                }
                break;
            case VertexBuffer.SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Short2Norm : WebGPUConstants.VertexFormat.Short2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Short4Norm : WebGPUConstants.VertexFormat.Short4;
                }
                break;
            case VertexBuffer.UNSIGNED_SHORT:
                switch (size) {
                    case 1:
                    case 2:
                        return normalized ? WebGPUConstants.VertexFormat.Ushort2Norm : WebGPUConstants.VertexFormat.Ushort2;
                    case 3:
                    case 4:
                        return normalized ? WebGPUConstants.VertexFormat.Ushort4Norm : WebGPUConstants.VertexFormat.Ushort4;
                }
                break;
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
                break;
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
                break;
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
                break;
        }

        throw new Error(`Invalid Format '${vertexBuffer.getKind()}' - type=${type}, normalized=${normalized}, size=${size}`);
    }

    private _getAphaBlendState(): GPUBlendDescriptor {
        if (!this._alphaBlendEnabled) {
            return { };
        }

        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[2]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[3]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[1]),
        };
    }

    private _getColorBlendState(): GPUBlendDescriptor {
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
            this._states[StatePosition.ShaderStage] = id.toString();
            this._isDirty = true;
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
            this._states[StatePosition.RasterizationState] = this._rasterizationState.toString();
            this._isDirty = true;
        }
    }

    private _setColorStates(): void {
        let colorStates = ((this._writeMask ? 1 : 0) << 22) + (this._colorFormat << 23);

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
            this._states[StatePosition.ColorStates] = this._colorStates.toString();
            this._isDirty = true;
        }
    }

    private _setDepthStencilState(): void {
        let stencilState = !this._stencilEnabled ?
            7 /* ALWAYS */ + (1 /* KEEP */ << 3) + (1 /* KEEP */ << 6) + (1 /* KEEP */ << 9) :
            this._stencilFrontCompare + (this._stencilFrontDepthFailOp << 3) + (this._stencilFrontPassOp << 6) + (this._stencilFrontFailOp << 9);

        const depthStencilState =
                this._depthStencilFormat +
                ((this._depthWriteEnabled ? 1 : 0) << 6) +
                ((this._depthTestEnabled ? this._depthCompare : 7 /* ALWAYS */) << 7) +
                (stencilState << 10); // stencil front - stencil back is the same

        if (this._depthStencilState !== depthStencilState) {
            this._depthStencilState = depthStencilState;
            this._states[StatePosition.DepthStencilState] = this._depthStencilState.toString();
            this._isDirty = true;
        }
    }

    private _setVertexState(effect: Effect): void {
        let vertexState = "";

        const attributes = effect.getAttributesNames();
        for (var index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);

            if (location >= 0) {
                let  vertexBuffer = this._vertexBuffers![attributes[index]];
                if (!vertexBuffer) {
                    // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                    // So we must bind a dummy buffer when we are not given one for a specific attribute
                    vertexBuffer = this._emptyVertexBuffer;
                }

                const type = vertexBuffer.type - 5120;
                const normalized = vertexBuffer.normalized ? 1 : 0;
                const size = vertexBuffer.getSize();
                const stepMode = vertexBuffer.getIsInstanced() ? 1 : 0;
                const stride = vertexBuffer.byteStride;

                const vid =
                    (type << 0) +
                    (normalized << 3) +
                    (size << 4) +
                    (stepMode << 6) +
                    (location << 7) +
                    (stride << 12);

                vertexState += vid + "_";
            }
        }

        if (vertexState !== this._vertexState) {
            this._vertexState = vertexState;
            this._states[StatePosition.VertexState] = this._vertexState;
            this._isDirty = true;
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

                if (bindingDefinition.isSampler) {
                    entries.push({
                        binding: j,
                        visibility,
                        type: bindingDefinition.isComparisonSampler ? WebGPUConstants.BindingType.ComparisonSampler : WebGPUConstants.BindingType.Sampler
                    });
                } else if (bindingDefinition.isTexture) {
                    entries.push({
                        binding: j,
                        visibility,
                        type: WebGPUConstants.BindingType.SampledTexture,
                        viewDimension: bindingDefinition.textureDimension,
                        textureComponentType: bindingDefinition.componentType,
                        // TODO WEBGPU.
                        // hasDynamicOffset?: boolean;
                        // storageTextureFormat?: GPUTextureFormat;
                        // minBufferBindingSize?: number;
                    });
                } else {
                    entries.push({
                        binding: j,
                        visibility,
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

    private _getVertexInputDescriptor(effect: Effect, topology: GPUPrimitiveTopology): GPUVertexStateDescriptor {
        const descriptors: GPUVertexBufferLayoutDescriptor[] = [];
        const attributes = effect.getAttributesNames();
        for (var index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);

            if (location >= 0) {
                let  vertexBuffer = this._vertexBuffers![attributes[index]];
                if (!vertexBuffer) {
                    // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                    // So we must bind a dummy buffer when we are not given one for a specific attribute
                    vertexBuffer = this._emptyVertexBuffer;
                }

                const attributeDescriptor: GPUVertexAttributeDescriptor = {
                    shaderLocation: location,
                    offset: 0, // not available in WebGL
                    format: WebGPUCacheRenderPipeline._GetVertexInputDescriptorFormat(vertexBuffer),
                };

                // TODO WEBGPU. Factorize the one with the same underlying buffer.
                const vertexBufferDescriptor: GPUVertexBufferLayoutDescriptor = {
                    arrayStride: vertexBuffer.byteStride,
                    stepMode: vertexBuffer.getIsInstanced() ? WebGPUConstants.InputStepMode.Instance : WebGPUConstants.InputStepMode.Vertex,
                    attributes: [attributeDescriptor]
                };

               descriptors.push(vertexBufferDescriptor);
            }
        }

        const inputStateDescriptor: GPUVertexStateDescriptor = {
            vertexBuffers: descriptors
        };

        if (topology === WebGPUConstants.PrimitiveTopology.LineStrip || topology === WebGPUConstants.PrimitiveTopology.TriangleStrip) {
            inputStateDescriptor.indexFormat = !this._indexBuffer || this._indexBuffer.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16;
        }

        return inputStateDescriptor;
    }

    private _createRenderPipeline(effect: Effect, topology: GPUPrimitiveTopology, sampleCount: number, createLayout = true): GPURenderPipeline {
        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const inputStateDescriptor = this._getVertexInputDescriptor(effect, topology);
        const pipelineLayout = createLayout ? this._createPipelineLayout(webgpuPipelineContext) : undefined;

        const colorStates: Array<GPUColorStateDescriptor> = [];
        const alphaBlend = this._getAphaBlendState();
        const colorBlend = this._getColorBlendState();

        if (this._mrtAttachments1 > 0) {
            for (let i = 0; i < this._mrtFormats.length; ++i) {
                colorStates.push({
                    format: this._mrtFormats[i],
                    alphaBlend,
                    colorBlend,
                    writeMask: this._writeMask,
                });
            }
        } else {
            colorStates.push({
                format: this._webgpuColorFormat,
                alphaBlend,
                colorBlend,
                writeMask: this._writeMask,
            });
        }

        const stencilFrontBack: GPUStencilStateFaceDescriptor = {
            compare: WebGPUCacheRenderPipeline._GetCompareFunction(this._stencilFrontCompare),
            depthFailOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilFrontDepthFailOp),
            failOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilFrontFailOp),
            passOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilFrontPassOp)
        };

        /*if (this._numFrames < 10) {
            console.log(colorStates);
        }*/

        return this._device.createRenderPipeline({
            layout: pipelineLayout,
            ...webgpuPipelineContext.stages!,
            primitiveTopology: topology,
            rasterizationState: {
                frontFace: this._frontFace === 1 ? WebGPUConstants.FrontFace.CCW : WebGPUConstants.FrontFace.CW,
                cullMode: !this._cullEnabled ? WebGPUConstants.CullMode.None : this._cullFace === 2 ? WebGPUConstants.CullMode.Front : WebGPUConstants.CullMode.Back,
                depthBias: this._depthBias,
                depthBiasClamp: this._depthBiasClamp,
                depthBiasSlopeScale: this._depthBiasSlopeScale,
            },
            colorStates,

            sampleCount,
            depthStencilState: this._webgpuDepthStencilFormat === undefined ? undefined : {
                depthWriteEnabled: this._depthWriteEnabled,
                depthCompare: this._depthTestEnabled ? WebGPUCacheRenderPipeline._GetCompareFunction(this._depthCompare) : WebGPUConstants.CompareFunction.Always,
                format: this._webgpuDepthStencilFormat,
                stencilFront: stencilFrontBack,
                stencilBack: stencilFrontBack,
                stencilReadMask: this._stencilReadMask,
                stencilWriteMask: this._stencilWriteMask,
            },

            vertexState: inputStateDescriptor,
        });
    }

}
