/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import { Constants } from "../constants";
import * as WebGPUConstants from "./webgpuConstants";
import type { Effect } from "../../Materials/effect";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { VertexBuffer } from "../../Buffers/buffer";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import type { Nullable } from "../../types";
import type { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import type { WebGPUPipelineContext } from "./webgpuPipelineContext";
import { WebGPUShaderProcessor } from "./webgpuShaderProcessor";
import { WebGPUTextureHelper } from "./webgpuTextureHelper";
import { renderableTextureFormatToIndex } from "./webgpuTextureManager";

enum StatePosition {
    StencilReadMask = 0,
    StencilWriteMask = 1,
    //DepthBiasClamp = 1, // not used, so remove it to improve perf
    DepthBias = 2,
    DepthBiasSlopeScale = 3,
    DepthStencilState = 4,
    MRTAttachments1 = 5,
    MRTAttachments2 = 6,
    RasterizationState = 7,
    ColorStates = 8,
    ShaderStage = 9,
    TextureStage = 10,
    VertexState = 11, // vertex state will consume positions 11, 12, ... depending on the number of vertex inputs

    NumStates = 12,
}

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
    0x1e00: 1, // KEEP
    0x1e01: 2, // REPLACE
    0x1e02: 3, // INCR
    0x1e03: 4, // DECR
    0x150a: 5, // INVERT
    0x8507: 6, // INCR_WRAP
    0x8508: 7, // DECR_WRAP
};

const vertexBufferKindForNonFloatProcessing: { [kind: string]: boolean } = {
    [VertexBuffer.PositionKind]: true,
    [VertexBuffer.NormalKind]: true,
    [VertexBuffer.TangentKind]: true,
    [VertexBuffer.UVKind]: true,
    [VertexBuffer.UV2Kind]: true,
    [VertexBuffer.UV3Kind]: true,
    [VertexBuffer.UV4Kind]: true,
    [VertexBuffer.UV5Kind]: true,
    [VertexBuffer.UV6Kind]: true,
    [VertexBuffer.ColorKind]: true,
    [VertexBuffer.ColorInstanceKind]: true,
    [VertexBuffer.MatricesIndicesKind]: true,
    [VertexBuffer.MatricesWeightsKind]: true,
    [VertexBuffer.MatricesIndicesExtraKind]: true,
    [VertexBuffer.MatricesWeightsExtraKind]: true,
};

/** @internal */
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
    private _parameter: { token: any; pipeline: Nullable<GPURenderPipeline> };
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
    private _webgpuColorFormat: (GPUTextureFormat | null)[];
    private _mrtAttachments1: number;
    private _mrtAttachments2: number;
    private _mrtFormats: (GPUTextureFormat | null)[];
    private _mrtEnabledMask: number;
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
    private _textureState: number;
    private _useTextureStage: boolean;

    private static _IsSignedType(type: number): boolean {
        switch (type) {
            case VertexBuffer.BYTE:
            case VertexBuffer.SHORT:
            case VertexBuffer.INT:
            case VertexBuffer.FLOAT:
                return true;
            case VertexBuffer.UNSIGNED_BYTE:
            case VertexBuffer.UNSIGNED_SHORT:
            case VertexBuffer.UNSIGNED_INT:
                return false;
            default:
                throw new Error(`Invalid type '${type}'`);
        }
    }

    constructor(device: GPUDevice, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._useTextureStage = true; // we force usage because we must handle depth textures with "float" filtering, which can't be fixed by a caps (like "textureFloatLinearFiltering" can for float textures)
        this._states = new Array(30); // pre-allocate enough room so that no new allocation will take place afterwards
        this._statesLength = 0;
        this._stateDirtyLowestIndex = 0;
        this._emptyVertexBuffer = emptyVertexBuffer;
        this._mrtFormats = [];
        this._parameter = { token: undefined, pipeline: null };
        this.disabled = false;
        this.vertexBuffers = [];
        this._kMaxVertexBufferStride = device.limits.maxVertexBufferArrayStride || 2048;
        this.reset();
    }

    public reset(): void {
        this._isDirty = true;
        this.vertexBuffers.length = 0;
        this.setAlphaToCoverage(false);
        this.resetDepthCullingState();
        this.setClampDepth(false);
        this.setDepthBias(0);
        //this.setDepthBiasClamp(0);
        this._webgpuColorFormat = [WebGPUConstants.TextureFormat.BGRA8Unorm];
        this.setColorFormat(WebGPUConstants.TextureFormat.BGRA8Unorm);
        this.setMRT([]);
        this.setAlphaBlendEnabled(false);
        this.setAlphaBlendFactors([null, null, null, null], [null, null]);
        this.setWriteMask(0xf);
        this.setDepthStencilFormat(WebGPUConstants.TextureFormat.Depth24PlusStencil8);
        this.setStencilEnabled(false);
        this.resetStencilState();
        this.setBuffers(null, null, null);
        this._setTextureState(0);
    }

    protected abstract _getRenderPipeline(param: { token: any; pipeline: Nullable<GPURenderPipeline> }): void;
    protected abstract _setRenderPipeline(param: { token: any; pipeline: Nullable<GPURenderPipeline> }): void;

    public readonly vertexBuffers: VertexBuffer[];

    public get colorFormats(): (GPUTextureFormat | null)[] {
        return this._mrtAttachments1 > 0 ? this._mrtFormats : this._webgpuColorFormat;
    }

    public readonly mrtAttachments: number[];
    public readonly mrtTextureArray: InternalTexture[];
    public readonly mrtTextureCount: number = 0;

    public getRenderPipeline(fillMode: number, effect: Effect, sampleCount: number, textureState = 0): GPURenderPipeline {
        sampleCount = WebGPUTextureHelper.GetSample(sampleCount);

        if (this.disabled) {
            const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

            this._setVertexState(effect); // to fill this.vertexBuffers with correct data
            this._setTextureState(textureState);

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
        this._setTextureState(textureState);

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
        this.setDepthCullingState(false, 2, 1, 0, 0, true, true, Constants.ALWAYS);
    }

    public setDepthCullingState(
        cullEnabled: boolean,
        frontFace: number,
        cullFace: number,
        zOffset: number,
        zOffsetUnits: number,
        depthTestEnabled: boolean,
        depthWriteEnabled: boolean,
        depthCompare: Nullable<number>
    ): void {
        this._depthWriteEnabled = depthWriteEnabled;
        this._depthTestEnabled = depthTestEnabled;
        this._depthCompare = (depthCompare ?? Constants.ALWAYS) - 0x0200;
        this._cullFace = cullFace;
        this._cullEnabled = cullEnabled;
        this._frontFace = frontFace;
        this.setDepthBiasSlopeScale(zOffset);
        this.setDepthBias(zOffsetUnits);
    }

    public setDepthBias(depthBias: number): void {
        if (this._depthBias !== depthBias) {
            this._depthBias = depthBias;
            this._states[StatePosition.DepthBias] = depthBias;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.DepthBias);
        }
    }

    /*public setDepthBiasClamp(depthBiasClamp: number): void {
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

    public setColorFormat(format: GPUTextureFormat | null): void {
        this._webgpuColorFormat[0] = format;
        this._colorFormat = renderableTextureFormatToIndex[format ?? ""];
    }

    public setMRTAttachments(attachments: number[]): void {
        (this.mrtAttachments as any) = attachments;
        let mask = 0;
        for (let i = 0; i < attachments.length; ++i) {
            if (attachments[i] !== 0) {
                mask += 1 << i;
            }
        }
        if (this._mrtEnabledMask !== mask) {
            this._mrtEnabledMask = mask;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.MRTAttachments1);
        }
    }

    public setMRT(textureArray: InternalTexture[], textureCount?: number): void {
        textureCount = textureCount ?? textureArray.length;
        if (textureCount > 10) {
            // If we want more than 10 attachments we need to change this method (and the StatePosition enum) but 10 seems plenty: note that WebGPU only supports 8 at the time (2021/12/13)!
            // As we need ~39 different values we are using 6 bits to encode a texture format, meaning we can encode 5 texture formats in 32 bits
            // We are using 2x32 bit values to handle 10 textures
            // eslint-disable-next-line no-throw-literal
            throw "Can't handle more than 10 attachments for a MRT in cache render pipeline!";
        }
        (this.mrtTextureArray as any) = textureArray;
        (this.mrtTextureCount as any) = textureCount;

        this._mrtEnabledMask = 0xffff; // all textures are enabled at start (meaning we can write to them). Calls to setMRTAttachments may disable some

        const bits: number[] = [0, 0];
        let indexBits = 0,
            mask = 0,
            numRT = 0;
        for (let i = 0; i < textureCount; ++i) {
            const texture = textureArray[i];
            const gpuWrapper = texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;

            this._mrtFormats[numRT] = gpuWrapper?.format ?? this._webgpuColorFormat[0];

            bits[indexBits] += renderableTextureFormatToIndex[this._mrtFormats[numRT] ?? ""] << mask;
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
        this._depthStencilFormat = format === undefined ? 0 : renderableTextureFormatToIndex[format];
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
        this.setStencilState(false, Constants.ALWAYS, Constants.KEEP, Constants.REPLACE, Constants.KEEP, 0xff, 0xff);
    }

    public setStencilState(
        stencilEnabled: boolean,
        compare: Nullable<number>,
        depthFailOp: Nullable<number>,
        passOp: Nullable<number>,
        failOp: Nullable<number>,
        readMask: number,
        writeMask: number
    ): void {
        this._stencilEnabled = stencilEnabled;
        this._stencilFrontCompare = (compare ?? Constants.ALWAYS) - 0x0200;
        this._stencilFrontDepthFailOp = depthFailOp === null ? 1 /* KEEP */ : stencilOpToIndex[depthFailOp];
        this._stencilFrontPassOp = passOp === null ? 2 /* REPLACE */ : stencilOpToIndex[passOp];
        this._stencilFrontFailOp = failOp === null ? 1 /* KEEP */ : stencilOpToIndex[failOp];
        this.setStencilReadMask(readMask);
        this.setStencilWriteMask(writeMask);
    }

    public setBuffers(
        vertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>,
        indexBuffer: Nullable<DataBuffer>,
        overrideVertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>
    ): void {
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
                // eslint-disable-next-line no-throw-literal
                throw "LineLoop is an unsupported fillmode in WebGPU";
            case Constants.MATERIAL_LineStripDrawMode:
                return WebGPUConstants.PrimitiveTopology.LineStrip;
            case Constants.MATERIAL_TriangleStripDrawMode:
                return WebGPUConstants.PrimitiveTopology.TriangleStrip;
            case Constants.MATERIAL_TriangleFanDrawMode:
                // return this._gl.TRIANGLE_FAN;
                // TODO WEBGPU. Triangle Fan Mode Fallback at buffer load time.
                // eslint-disable-next-line no-throw-literal
                throw "TriangleFan is an unsupported fillmode in WebGPU";
            default:
                return WebGPUConstants.PrimitiveTopology.TriangleList;
        }
    }

    private static _GetAphaBlendOperation(operation: Nullable<number>): GPUBlendOperation {
        switch (operation) {
            case Constants.GL_ALPHA_EQUATION_ADD:
                return WebGPUConstants.BlendOperation.Add;
            case Constants.GL_ALPHA_EQUATION_SUBTRACT:
                return WebGPUConstants.BlendOperation.Subtract;
            case Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT:
                return WebGPUConstants.BlendOperation.ReverseSubtract;
            case Constants.GL_ALPHA_EQUATION_MIN:
                return WebGPUConstants.BlendOperation.Min;
            case Constants.GL_ALPHA_EQUATION_MAX:
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
            case Constants.GL_ALPHA_FUNCTION_SRC:
                return WebGPUConstants.BlendFactor.Src;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR:
                return WebGPUConstants.BlendFactor.OneMinusSrc;
            case Constants.GL_ALPHA_FUNCTION_SRC_ALPHA:
                return WebGPUConstants.BlendFactor.SrcAlpha;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA:
                return WebGPUConstants.BlendFactor.OneMinusSrcAlpha;
            case Constants.GL_ALPHA_FUNCTION_DST_ALPHA:
                return WebGPUConstants.BlendFactor.DstAlpha;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA:
                return WebGPUConstants.BlendFactor.OneMinusDstAlpha;
            case Constants.GL_ALPHA_FUNCTION_DST_COLOR:
                return WebGPUConstants.BlendFactor.Dst;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR:
                return WebGPUConstants.BlendFactor.OneMinusDst;
            case Constants.GL_ALPHA_FUNCTION_SRC_ALPHA_SATURATED:
                return WebGPUConstants.BlendFactor.SrcAlphaSaturated;
            case Constants.GL_ALPHA_FUNCTION_CONSTANT_COLOR:
                return WebGPUConstants.BlendFactor.Constant;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR:
                return WebGPUConstants.BlendFactor.OneMinusConstant;
            case Constants.GL_ALPHA_FUNCTION_CONSTANT_ALPHA:
                return WebGPUConstants.BlendFactor.Constant;
            case Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA:
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

    private _getAphaBlendState(): Nullable<GPUBlendComponent> {
        if (!this._alphaBlendEnabled) {
            return null;
        }

        return {
            srcFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[2]),
            dstFactor: WebGPUCacheRenderPipeline._GetAphaBlendFactor(this._alphaBlendFuncParams[3]),
            operation: WebGPUCacheRenderPipeline._GetAphaBlendOperation(this._alphaBlendEqParams[1]),
        };
    }

    private _getColorBlendState(): Nullable<GPUBlendComponent> {
        if (!this._alphaBlendEnabled) {
            return null;
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
        const rasterizationState = frontFace - 1 + (cullMode << 1) + (clampDepth << 3) + (alphaToCoverage << 4) + (topology << 5) + (sampleCount << 8);

        if (this._rasterizationState !== rasterizationState) {
            this._rasterizationState = rasterizationState;
            this._states[StatePosition.RasterizationState] = this._rasterizationState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.RasterizationState);
        }
    }

    private _setColorStates(): void {
        let colorStates = ((this._writeMask ? 1 : 0) << 22) + (this._colorFormat << 23) + ((this._depthWriteEnabled ? 1 : 0) << 29); // this state has been moved from depthStencilState here because alpha and depth are related (generally when alpha is on, depth write is off and the other way around)

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
        const stencilState = !this._stencilEnabled
            ? 7 /* ALWAYS */ + (1 /* KEEP */ << 3) + (1 /* KEEP */ << 6) + (1 /* KEEP */ << 9)
            : this._stencilFrontCompare + (this._stencilFrontDepthFailOp << 3) + (this._stencilFrontPassOp << 6) + (this._stencilFrontFailOp << 9);

        const depthStencilState = this._depthStencilFormat + ((this._depthTestEnabled ? this._depthCompare : 7) /* ALWAYS */ << 6) + (stencilState << 10); // stencil front - stencil back is the same

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
        for (let index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers![attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
            }

            const buffer = vertexBuffer.effectiveBuffer?.underlyingResource;

            // We optimize usage of GPUVertexBufferLayout: we will create a single GPUVertexBufferLayout for all the attributes which follow each other and which use the same GPU buffer
            // However, there are some constraints in the attribute.offset value range, so we must check for them before being able to reuse the same GPUVertexBufferLayout
            // See _getVertexInputDescriptor() below
            if (vertexBuffer._validOffsetRange === undefined) {
                const offset = vertexBuffer.effectiveByteOffset;
                const formatSize = vertexBuffer.getSize(true);
                const byteStride = vertexBuffer.effectiveByteStride;

                vertexBuffer._validOffsetRange =
                    (offset + formatSize <= this._kMaxVertexBufferStride && byteStride === 0) || (byteStride !== 0 && offset + formatSize <= byteStride);
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

    private _setTextureState(textureState: number): void {
        if (this._textureState !== textureState) {
            this._textureState = textureState;
            this._states[StatePosition.TextureStage] = this._textureState;
            this._isDirty = true;
            this._stateDirtyLowestIndex = Math.min(this._stateDirtyLowestIndex, StatePosition.TextureStage);
        }
    }

    private _createPipelineLayout(webgpuPipelineContext: WebGPUPipelineContext): GPUPipelineLayout {
        if (this._useTextureStage) {
            return this._createPipelineLayoutWithTextureStage(webgpuPipelineContext);
        }

        const bindGroupLayouts: GPUBindGroupLayout[] = [];
        const bindGroupLayoutEntries = webgpuPipelineContext.shaderProcessingContext.bindGroupLayoutEntries;

        for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
            const setDefinition = bindGroupLayoutEntries[i];

            bindGroupLayouts[i] = this._device.createBindGroupLayout({
                entries: setDefinition,
            });
        }

        webgpuPipelineContext.bindGroupLayouts[0] = bindGroupLayouts;

        return this._device.createPipelineLayout({ bindGroupLayouts });
    }

    private _createPipelineLayoutWithTextureStage(webgpuPipelineContext: WebGPUPipelineContext): GPUPipelineLayout {
        const shaderProcessingContext = webgpuPipelineContext.shaderProcessingContext;
        const bindGroupLayoutEntries = shaderProcessingContext.bindGroupLayoutEntries;

        let bitVal = 1;
        for (let i = 0; i < bindGroupLayoutEntries.length; i++) {
            const setDefinition = bindGroupLayoutEntries[i];

            for (let j = 0; j < setDefinition.length; j++) {
                const entry = bindGroupLayoutEntries[i][j];

                if (entry.texture) {
                    const name = shaderProcessingContext.bindGroupLayoutEntryInfo[i][entry.binding].name;
                    const textureInfo = shaderProcessingContext.availableTextures[name];
                    const samplerInfo = textureInfo.autoBindSampler ? shaderProcessingContext.availableSamplers[name + WebGPUShaderProcessor.AutoSamplerSuffix] : null;

                    let sampleType = textureInfo.sampleType;
                    let samplerType = samplerInfo?.type ?? WebGPUConstants.SamplerBindingType.Filtering;

                    if (this._textureState & bitVal && sampleType !== WebGPUConstants.TextureSampleType.Depth) {
                        // The texture is a 32 bits float texture but the system does not support linear filtering for them OR the texture is a depth texture with "float" filtering:
                        // we set the sampler to "non-filtering" and the texture sample type to "unfilterable-float"
                        if (textureInfo.autoBindSampler) {
                            samplerType = WebGPUConstants.SamplerBindingType.NonFiltering;
                        }
                        sampleType = WebGPUConstants.TextureSampleType.UnfilterableFloat;
                    }

                    entry.texture!.sampleType = sampleType;

                    if (samplerInfo) {
                        const binding = shaderProcessingContext.bindGroupLayoutEntryInfo[samplerInfo.binding.groupIndex][samplerInfo.binding.bindingIndex].index;
                        bindGroupLayoutEntries[samplerInfo.binding.groupIndex][binding].sampler!.type = samplerType;
                    }

                    bitVal = bitVal << 1;
                }
            }
        }

        const bindGroupLayouts: GPUBindGroupLayout[] = [];

        for (let i = 0; i < bindGroupLayoutEntries.length; ++i) {
            bindGroupLayouts[i] = this._device.createBindGroupLayout({
                entries: bindGroupLayoutEntries[i],
            });
        }

        webgpuPipelineContext.bindGroupLayouts[this._textureState] = bindGroupLayouts;

        return this._device.createPipelineLayout({ bindGroupLayouts });
    }

    private _getVertexInputDescriptor(effect: Effect): GPUVertexBufferLayout[] {
        const descriptors: GPUVertexBufferLayout[] = [];
        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const attributes = webgpuPipelineContext.shaderProcessingContext.attributeNamesFromEffect;
        const locations = webgpuPipelineContext.shaderProcessingContext.attributeLocationsFromEffect;

        let currentGPUBuffer;
        let currentGPUAttributes: GPUVertexAttribute[] | undefined;
        for (let index = 0; index < attributes.length; index++) {
            const location = locations[index];
            let vertexBuffer = (this._overrideVertexBuffers && this._overrideVertexBuffers[attributes[index]]) ?? this._vertexBuffers![attributes[index]];
            if (!vertexBuffer) {
                // In WebGL it's valid to not bind a vertex buffer to an attribute, but it's not valid in WebGPU
                // So we must bind a dummy buffer when we are not given one for a specific attribute
                vertexBuffer = this._emptyVertexBuffer;
            }

            let buffer = vertexBuffer.effectiveBuffer?.underlyingResource;

            // We reuse the same GPUVertexBufferLayout for all attributes that use the same underlying GPU buffer (and for attributes that follow each other in the attributes array)
            let offset = vertexBuffer.effectiveByteOffset;
            const invalidOffsetRange = !vertexBuffer._validOffsetRange;
            if (!(currentGPUBuffer && currentGPUAttributes && currentGPUBuffer === buffer) || invalidOffsetRange) {
                const vertexBufferDescriptor: GPUVertexBufferLayout = {
                    arrayStride: vertexBuffer.effectiveByteStride,
                    stepMode: vertexBuffer.getIsInstanced() ? WebGPUConstants.VertexStepMode.Instance : WebGPUConstants.VertexStepMode.Vertex,
                    attributes: [],
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

    private _processNonFloatVertexBuffers(webgpuPipelineContext: WebGPUPipelineContext, effect: Effect) {
        const webgpuShaderProcessor = webgpuPipelineContext.engine._getShaderProcessor(webgpuPipelineContext.shaderProcessingContext.shaderLanguage) as WebGPUShaderProcessor;

        let reprocessShaders = false;

        for (const kind in this._vertexBuffers) {
            const currentVertexBuffer = this._vertexBuffers[kind];

            if (!currentVertexBuffer || !vertexBufferKindForNonFloatProcessing[kind]) {
                continue;
            }

            const currentVertexBufferType = currentVertexBuffer.normalized ? VertexBuffer.FLOAT : currentVertexBuffer.type;
            const vertexBufferType = webgpuPipelineContext.vertexBufferKindToType[kind];

            if (
                (currentVertexBufferType !== VertexBuffer.FLOAT && vertexBufferType === undefined) ||
                (vertexBufferType !== undefined && vertexBufferType !== currentVertexBufferType)
            ) {
                reprocessShaders = true;
                webgpuPipelineContext.vertexBufferKindToType[kind] = currentVertexBufferType;
                if (currentVertexBufferType !== VertexBuffer.FLOAT) {
                    webgpuShaderProcessor.vertexBufferKindToNumberOfComponents[kind] = VertexBuffer.DeduceStride(kind);
                    if (WebGPUCacheRenderPipeline._IsSignedType(currentVertexBufferType)) {
                        webgpuShaderProcessor.vertexBufferKindToNumberOfComponents[kind] *= -1;
                    }
                }
            }
        }

        if (reprocessShaders) {
            effect._processShaderCode(webgpuShaderProcessor, true);
        }
    }

    private _createRenderPipeline(effect: Effect, topology: GPUPrimitiveTopology, sampleCount: number): GPURenderPipeline {
        const webgpuPipelineContext = effect._pipelineContext as WebGPUPipelineContext;
        const inputStateDescriptor = this._getVertexInputDescriptor(effect);
        const pipelineLayout = this._createPipelineLayout(webgpuPipelineContext);

        const colorStates: Array<GPUColorTargetState | null> = [];
        const alphaBlend = this._getAphaBlendState();
        const colorBlend = this._getColorBlendState();

        this._processNonFloatVertexBuffers(webgpuPipelineContext, effect);

        if (this._mrtAttachments1 > 0) {
            for (let i = 0; i < this._mrtFormats.length; ++i) {
                const format = this._mrtFormats[i];
                if (format) {
                    const descr: GPUColorTargetState = {
                        format,
                        writeMask: (this._mrtEnabledMask & (1 << i)) !== 0 ? this._writeMask : 0,
                    };
                    if (alphaBlend && colorBlend) {
                        descr.blend = {
                            alpha: alphaBlend,
                            color: colorBlend,
                        };
                    }
                    colorStates.push(descr);
                } else {
                    colorStates.push(null);
                }
            }
        } else {
            if (this._webgpuColorFormat[0]) {
                const descr: GPUColorTargetState = {
                    format: this._webgpuColorFormat[0],
                    writeMask: this._writeMask,
                };
                if (alphaBlend && colorBlend) {
                    descr.blend = {
                        alpha: alphaBlend,
                        color: colorBlend,
                    };
                }
                colorStates.push(descr);
            } else {
                colorStates.push(null);
            }
        }

        const stencilFrontBack: GPUStencilFaceState = {
            compare: WebGPUCacheRenderPipeline._GetCompareFunction(this._stencilEnabled ? this._stencilFrontCompare : 7 /* ALWAYS */),
            depthFailOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontDepthFailOp : 1 /* KEEP */),
            failOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontFailOp : 1 /* KEEP */),
            passOp: WebGPUCacheRenderPipeline._GetStencilOpFunction(this._stencilEnabled ? this._stencilFrontPassOp : 1 /* KEEP */),
        };

        let stripIndexFormat: GPUIndexFormat | undefined = undefined;
        if (topology === WebGPUConstants.PrimitiveTopology.LineStrip || topology === WebGPUConstants.PrimitiveTopology.TriangleStrip) {
            stripIndexFormat = !this._indexBuffer || this._indexBuffer.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16;
        }

        const depthStencilFormatHasStencil = this._webgpuDepthStencilFormat ? WebGPUTextureHelper.HasStencilAspect(this._webgpuDepthStencilFormat) : false;

        return this._device.createRenderPipeline({
            label: `RenderPipeline_${colorStates[0]?.format ?? "nooutput"}_${this._webgpuDepthStencilFormat ?? "nodepth"}_samples${sampleCount}_textureState${this._textureState}`,
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
            fragment: !webgpuPipelineContext.stages!.fragmentStage
                ? undefined
                : {
                      module: webgpuPipelineContext.stages!.fragmentStage.module,
                      entryPoint: webgpuPipelineContext.stages!.fragmentStage.entryPoint,
                      targets: colorStates,
                  },

            multisample: {
                count: sampleCount,
                /*mask,
                alphaToCoverageEnabled,*/
            },
            depthStencil:
                this._webgpuDepthStencilFormat === undefined
                    ? undefined
                    : {
                          depthWriteEnabled: this._depthWriteEnabled,
                          depthCompare: this._depthTestEnabled ? WebGPUCacheRenderPipeline._GetCompareFunction(this._depthCompare) : WebGPUConstants.CompareFunction.Always,
                          format: this._webgpuDepthStencilFormat,
                          stencilFront: this._stencilEnabled && depthStencilFormatHasStencil ? stencilFrontBack : undefined,
                          stencilBack: this._stencilEnabled && depthStencilFormatHasStencil ? stencilFrontBack : undefined,
                          stencilReadMask: this._stencilEnabled && depthStencilFormatHasStencil ? this._stencilReadMask : undefined,
                          stencilWriteMask: this._stencilEnabled && depthStencilFormatHasStencil ? this._stencilWriteMask : undefined,
                          depthBias: this._depthBias,
                          depthBiasClamp: this._depthBiasClamp,
                          depthBiasSlopeScale: this._depthBiasSlopeScale,
                      },
        });
    }
}
