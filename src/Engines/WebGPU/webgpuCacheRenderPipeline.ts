//import { Constants } from "../constants";
//import * as WebGPUConstants from './webgpuConstants';
import { Effect } from "../../Materials/effect";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { VertexBuffer } from "../../Meshes/buffer";
import { DataBuffer } from "../../Meshes/dataBuffer";
import { Nullable } from "../../types";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
//import { WebGPUPipelineContext } from "./webgpuPipelineContext";

enum StatePosition {
    ShaderStage = 0,
    PrimitiveTopology = 1,
    FrontFace = 2,
    CullMode = 3,
    DepthBias=  4,
    DepthBiasClamp = 5,
    DepthBiasSlopeScale = 6,
    ColorFormat = 7,
    MRTAttachments = 8,
    AlphaBlendFactors = 9,

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

/** @hidden */
export class WebGPUCacheRenderPipeline {

    public static NumCacheHitWithoutHash = 0;
    public static NumCacheHitWithHash = 0;
    public static NumCacheMiss = 0;
    public static NumPipelineCreationLastFrame = 0;

    private static _Cache: { [hash: string]: GPURenderPipeline } = {};
    private static _NumPipelineCreationCurrentFrame = 0;

    //private _device: GPUDevice;
    private _states: string[];
    private _isDirty: boolean;
    private _currentRenderPipeline: GPURenderPipeline;

    private _shaderId: number;
    private _topology: number;
    private _frontFace: number;
    private _cullEnabled: boolean;
    private _cullFace: number;
    private _cullMode: number;
    private _depthBias: number;
    private _depthBiasClamp: number;
    private _depthBiasSlopeScale: number;
    private _colorFormat: GPUTextureFormat;
    private _mrtAttachments: number;
    private _alphaBlendEnabled: boolean;
    private _alphaBlendFuncParams: number[];
    private _alphaBlendEqParams: number[];
    private _alphaBlend: number;

    constructor(device: GPUDevice) {
        //this._device = device;
        this._states = [];
        this._states.length = StatePosition.NumStates;
        this._isDirty = true;
        this._alphaBlendFuncParams.length = 4;
        this._alphaBlendEqParams.length = 2;
    }

    public getRenderPipeline(fillMode: number, effect: Effect, sampleCount: number): GPURenderPipeline {
        this._setShaderStage(effect.uniqueId);
        this._setTopology(fillMode);
        this._applyCullMode();

        if (!this._isDirty && this._currentRenderPipeline) {
            WebGPUCacheRenderPipeline.NumCacheHitWithoutHash++;
            return this._currentRenderPipeline;
        }

        let hash = this._states.join("_");
        let pipeline = WebGPUCacheRenderPipeline._Cache[hash];

        if (pipeline) {
            this._currentRenderPipeline = pipeline;
            WebGPUCacheRenderPipeline.NumCacheHitWithHash++;
            return pipeline;
        }

        //const topology = WebGPUCacheRenderPipeline._GetTopology(fillMode);

        //this._currentRenderPipeline = WebGPUCacheRenderPipeline._Cache[hash] = this._createRenderPipeline(effect._pipelineContext as WebGPUPipelineContext, topology, sampleCount);

        WebGPUCacheRenderPipeline.NumCacheMiss++;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame++;

        return this._currentRenderPipeline;
    }

    public endFrame(): void {
        WebGPUCacheRenderPipeline.NumPipelineCreationLastFrame = WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame;
        WebGPUCacheRenderPipeline._NumPipelineCreationCurrentFrame = 0;
    }

    public setFrontFace(frontFace: number): void {
        if (this._frontFace !== frontFace) {
            this._frontFace = frontFace;
            this._states[StatePosition.FrontFace] = frontFace.toString();
            this._isDirty = true;
        }
    }

    public setCullEnabled(enabled: boolean): void {
        this._cullEnabled = enabled;
    }

    public setCullFace(cullFace: number): void {
        this._cullFace = cullFace;
    }

    private _applyCullMode(): void {
        if (!this._cullEnabled) {
            if (this._cullMode !== 0) {
                this._cullMode = 0;
                this._states[StatePosition.CullMode] = "0";
                this._isDirty = true;
            }
        } else if (this._cullMode !== this._cullFace) {
            this._cullMode = this._cullFace;
            this._states[StatePosition.CullMode] = this._cullMode.toString();
            this._isDirty = true;
        }
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
        if (this._colorFormat !== format) {
            this._colorFormat = format;
            this._states[StatePosition.ColorFormat] = format;
            this._isDirty = true;
        }
    }

    public setMRTAttachments(attachments: number[], textureArray: InternalTexture[]): void {
        if (attachments.length > 10) {
            // If we want more than 10 attachments we need to change this method but 10 seems plenty and it allows to use some bit shifting for faster operations
            // Note we can do better without changing this method if only dealing with texture formats that can be used as output attachments
            // It could allow to use 5 bits (or even less) to code a texture format. For the time being, we use 6 bits as we need 58 different values (2^6=64)
            // so we can encode 10 texture formats in 64 bits
            throw "Can't handle more than 10 attachments for a MRT in cache render pipeline!";
        }
        let bits = 0, mask = 0;
        for (let i = 0; i < attachments.length; ++i) {
            const index = attachments[i];
            if (index > 0) {
                const texture = textureArray[index - 1];
                const gpuWrapper = texture?._hardwareTexture as Nullable<WebGPUHardwareTexture>;
                const gpuTexture = gpuWrapper?.underlyingResource as Nullable<WebGPUHardwareTexture>;

                bits += textureFormatToIndex[gpuTexture?.format ?? ""] << mask;
            }
            mask += 6;
        }
        if (this._mrtAttachments !== bits) {
            this._mrtAttachments = bits;
            this._states[StatePosition.MRTAttachments] = bits.toString();
            this._isDirty = true;
        }
    }

    public setAlphaBlendEnabled(enabled: boolean): void {
        this._alphaBlendEnabled = enabled;
    }

    public setAlphaBlendFactors(factors: number[], operations: number[]): void {

    }

    private _applyAlphaBlend(): void {
        if (!this._alphaBlendEnabled) {
            if (this._alphaBlend !== 0) {
                this._alphaBlend = 0;
                this._states[StatePosition.AlphaBlendFactors] = "0";
                this._isDirty = true;
            }
        } else {
            this._cullMode = this._cullFace;
            this._states[StatePosition.AlphaBlendFactors] = this._alphaBlend.toString();
            this._isDirty = true;
        }
    }

    public setBuffers(vertexBuffers: Nullable<{ [key: string]: Nullable<VertexBuffer> }>, indexBuffer: Nullable<DataBuffer>): void {

    }

    /*private static _GetTopology(fillMode: number): GPUPrimitiveTopology {
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
    }*/

    private _setTopology(topology: number): void {
        if (this._topology !== topology) {
            this._topology = topology;
            this._states[StatePosition.PrimitiveTopology] = topology.toString();
            this._isDirty = true;
        }
    }

    private _setShaderStage(id: number): void {
        if (this._shaderId !== id) {
            this._shaderId = id;
            this._states[StatePosition.ShaderStage] = id.toString();
            this._isDirty = true;
        }
    }

    /*private _createRenderPipeline(webgpuPipelineContext: WebGPUPipelineContext, topology: GPUPrimitiveTopology, sampleCount: number, createLayout = true): GPURenderPipeline {
        const depthStateDescriptor = this._getDepthStencilStateDescriptor();
        const colorStateDescriptors = this._getColorStateDescriptors();
        const inputStateDescriptor = this._getVertexInputDescriptor(topology);
        const pipelineLayout = createLayout ? this._getPipelineLayout() : undefined;

        return this._device.createRenderPipeline({
            layout: pipelineLayout,
            ...webgpuPipelineContext.stages!,
            primitiveTopology: topology,
            rasterizationState: {
                frontFace: this._frontFace === 1 ? WebGPUConstants.FrontFace.CCW : WebGPUConstants.FrontFace.CW,
                cullMode: !this._cullEnabled ? WebGPUConstants.CullMode.None : this._cullMode === 2 ? WebGPUConstants.CullMode.Front : WebGPUConstants.CullMode.Back,
                depthBias: this._depthBias,
                depthBiasClamp: this._depthBiasClamp,
                depthBiasSlopeScale: this._depthBiasSlopeScale,
            },
            colorStates: {

            },

            sampleCount,
            depthStencilState: depthStateDescriptor,

            vertexState: inputStateDescriptor,
        });
    }*/

}