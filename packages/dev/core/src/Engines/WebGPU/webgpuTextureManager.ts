/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
// License for the mipmap generation code:
//
// Copyright 2020 Brandon Jones
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
import * as WebGPUConstants from "./webgpuConstants";
import type { WebGPUBufferManager } from "./webgpuBufferManager";
import { Constants } from "../constants";
import type { Nullable } from "../../types";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { IHardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import type { ExternalTexture } from "../../Materials/Textures/externalTexture";
import type { WebGPUEngine } from "../webgpuEngine";
import { WebGPUTextureHelper } from "./webgpuTextureHelper";
import type { _IProcessingOptions } from "../Processors/shaderProcessingOptions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Finalize, Initialize, Process } from "../Processors/shaderProcessor";
import type { WebGPUShaderProcessorWGSL } from "./webgpuShaderProcessorsWGSL";

// TODO WEBGPU improve mipmap generation by using compute shaders

const mipmapVertexSource = `
    const pos = array<vec2<f32>, 4>( vec2f(-1.0f, 1.0f),  vec2f(1.0f, 1.0f),  vec2f(-1.0f, -1.0f),  vec2f(1.0f, -1.0f));
    const tex = array<vec2<f32>, 4>( vec2f(0.0f, 0.0f),  vec2f(1.0f, 0.0f),  vec2f(0.0f, 1.0f),  vec2f(1.0f, 1.0f));

    varying vTex: vec2f;

    @vertex
    fn main(input : VertexInputs) -> FragmentInputs {
        vertexOutputs.vTex = tex[input.vertexIndex];
        vertexOutputs.position = vec4f(pos[input.vertexIndex], 0.0, 1.0);
    }
    `;

const mipmapFragmentSource = `
    var imgSampler: sampler;
    var img: texture_2d<f32>;

    varying vTex: vec2f;

    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
        fragmentOutputs.color = textureSample(img, imgSampler, input.vTex);
    }
    `;

const invertYPreMultiplyAlphaVertexSource = `
    const pos = array<vec2<f32>, 4>( vec2f(-1.0f, 1.0f),  vec2f(1.0f, 1.0f),  vec2f(-1.0f, -1.0f),  vec2f(1.0f, -1.0f));
    const tex = array<vec2<f32>, 4>( vec2f(0.0f, 0.0f),  vec2f(1.0f, 0.0f),  vec2f(0.0f, 1.0f),  vec2f(1.0f, 1.0f));

    var img: texture_2d<f32>;

    #ifdef INVERTY
        varying vTextureSize: vec2f;
    #endif

    @vertex
    fn main(input : VertexInputs) -> FragmentInputs {
        #ifdef INVERTY
            vertexOutputs.vTextureSize = vec2f(textureDimensions(img, 0));
        #endif
        vertexOutputs.position =  vec4f(pos[input.vertexIndex], 0.0, 1.0);
    }
    `;

const invertYPreMultiplyAlphaFragmentSource = `
    var img: texture_2d<f32>;

    #ifdef INVERTY
        varying vTextureSize: vec2f;
    #endif

    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
    #ifdef INVERTY
        var color: vec4f = textureLoad(img, vec2i(i32(input.position.x), i32(input.vTextureSize.y - input.position.y)), 0);
    #else
        var color: vec4f = textureLoad(img, vec2i(input.position.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color = vec4f(color.rgb * color.a, color.a);
    #endif
        fragmentOutputs.color = color;
    }
    `;

const invertYPreMultiplyAlphaWithOfstVertexSource = invertYPreMultiplyAlphaVertexSource;

const invertYPreMultiplyAlphaWithOfstFragmentSource = `
    var img: texture_2d<f32>;
    uniform ofstX: f32;
    uniform ofstY: f32;
    uniform width: f32;
    uniform height: f32;

    #ifdef INVERTY
        varying vTextureSize: vec2f;
    #endif

    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
        if (input.position.x < uniforms.ofstX || input.position.x >= uniforms.ofstX + uniforms.width) {
            discard;
        }
        if (input.position.y < uniforms.ofstY || input.position.y >= uniforms.ofstY + uniforms.height) {
            discard;
        }
    #ifdef INVERTY
        var color: vec4f = textureLoad(img, vec2i(i32(input.position.x), i32(uniforms.ofstY + uniforms.height - (input.position.y - uniforms.ofstY))), 0);
    #else
        var color: vec4f = textureLoad(img, vec2i(input.position.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color = vec4f(color.rgb * color.a, color.a);
    #endif
        fragmentOutputs.color = color;
    }
    `;

const clearVertexSource = `
    const pos = array<vec2<f32>, 4>( vec2f(-1.0f, 1.0f),  vec2f(1.0f, 1.0f),  vec2f(-1.0f, -1.0f),  vec2f(1.0f, -1.0f));

    @vertex
    fn main(input : VertexInputs) -> FragmentInputs {
        vertexOutputs.position =  vec4f(pos[input.vertexIndex], 0.0, 1.0);
    }
    `;

const clearFragmentSource = `
    uniform color: vec4f;

    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
        fragmentOutputs.color = uniforms.color;
    }
    `;

const copyVideoToTextureVertexSource = `
    struct VertexOutput {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragUV : vec2<f32>
    }

    @vertex
    fn main(
        @builtin(vertex_index) VertexIndex : u32
    ) -> VertexOutput {
        var pos = array<vec2<f32>, 4>(
            vec2(-1.0,  1.0),
            vec2( 1.0,  1.0),
            vec2(-1.0, -1.0),
            vec2( 1.0, -1.0)
        );
        var tex = array<vec2<f32>, 4>(
            vec2(0.0, 0.0),
            vec2(1.0, 0.0),
            vec2(0.0, 1.0),
            vec2(1.0, 1.0)
        );

        var output: VertexOutput;

        output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.fragUV = tex[VertexIndex];

        return output;
    }
    `;

const copyVideoToTextureFragmentSource = `
    @group(0) @binding(0) var videoSampler: sampler;
    @group(0) @binding(1) var videoTexture: texture_external;

    @fragment
    fn main(
        @location(0) fragUV: vec2<f32>
    ) -> @location(0) vec4<f32> {
        return textureSampleBaseClampToEdge(videoTexture, videoSampler, fragUV);
    }
    `;

const copyVideoToTextureInvertYFragmentSource = `
    @group(0) @binding(0) var videoSampler: sampler;
    @group(0) @binding(1) var videoTexture: texture_external;

    @fragment
    fn main(
        @location(0) fragUV: vec2<f32>
    ) -> @location(0) vec4<f32> {
        return textureSampleBaseClampToEdge(videoTexture, videoSampler, vec2<f32>(fragUV.x, 1.0 - fragUV.y));
    }
    `;

const resolveDepthVertexSource = `
    const pos = array<vec2<f32>, 4>( vec2f(-1.0f, 1.0f),  vec2f(1.0f, 1.0f),  vec2f(-1.0f, -1.0f),  vec2f(1.0f, -1.0f));

    @vertex
    fn main(input : VertexInputs) -> FragmentInputs {
        vertexOutputs.position = vec4f(pos[input.vertexIndex], 0.0, 1.0);
    }
    `;

const resolveDepthFragmentSource = `
    var msaaDepthTexture: texture_depth_multisampled_2d;

    @fragment
    fn main(input: FragmentInputs) -> FragmentOutputs {
    #ifdef USE_MIN
        let numSamples = textureNumSamples(msaaDepthTexture);
        var depth = 1.0;

        for (var i = 0u; i < numSamples; i = i + 1u) {
            depth = min(depth, textureLoad(msaaDepthTexture, vec2u(input.position.xy), i));
        }

        fragmentOutputs.color = vec4f(depth);
    #else
        fragmentOutputs.color = vec4f(textureLoad(msaaDepthTexture, vec2u(input.position.xy), 0)); // do like WebGL, take the first sample
    #endif
    }
    `;

enum PipelineType {
    MipMap = 0,
    InvertYPremultiplyAlpha = 1,
    Clear = 2,
    InvertYPremultiplyAlphaWithOfst = 3,
    ResolveDepth = 4,
}

enum VideoPipelineType {
    DontInvertY = 0,
    InvertY = 1,
}

interface IPipelineParameters {
    invertY?: boolean;
    premultiplyAlpha?: boolean;
}

const shadersForPipelineType = [
    { vertex: mipmapVertexSource, fragment: mipmapFragmentSource },
    { vertex: invertYPreMultiplyAlphaVertexSource, fragment: invertYPreMultiplyAlphaFragmentSource },
    { vertex: clearVertexSource, fragment: clearFragmentSource },
    { vertex: invertYPreMultiplyAlphaWithOfstVertexSource, fragment: invertYPreMultiplyAlphaWithOfstFragmentSource },
    { vertex: resolveDepthVertexSource, fragment: resolveDepthFragmentSource },
];

/**
 * Map a (renderable) texture format (GPUTextureFormat) to an index for fast lookup (in caches for eg)
 * The number of entries should not go over 64! Else, the code in WebGPUCacheRenderPipeline.setMRT should be updated
 */
export const renderableTextureFormatToIndex: { [name: string]: number } = {
    "": 0,
    r8unorm: 1,
    r8uint: 2,
    r8sint: 3,

    r16uint: 4,
    r16sint: 5,
    r16float: 6,
    rg8unorm: 7,
    rg8uint: 8,
    rg8sint: 9,

    r32uint: 10,
    r32sint: 11,
    r32float: 12,
    rg16uint: 13,
    rg16sint: 14,
    rg16float: 15,
    rgba8unorm: 16,
    "rgba8unorm-srgb": 17,
    rgba8uint: 18,
    rgba8sint: 19,
    bgra8unorm: 20,
    "bgra8unorm-srgb": 21,

    rgb10a2uint: 22,
    rgb10a2unorm: 23,
    /* rg11b10ufloat: this entry is dynamically added if the "RG11B10UFloatRenderable" extension is supported */

    rg32uint: 24,
    rg32sint: 25,
    rg32float: 26,
    rgba16uint: 27,
    rgba16sint: 28,
    rgba16float: 29,

    rgba32uint: 30,
    rgba32sint: 31,
    rgba32float: 32,

    stencil8: 33,
    depth16unorm: 34,
    depth24plus: 35,
    "depth24plus-stencil8": 36,
    depth32float: 37,

    "depth32float-stencil8": 38,

    r16unorm: 39,
    rg16unorm: 40,
    rgba16unorm: 41,
    r16snorm: 42,
    rg16snorm: 43,
    rgba16snorm: 44,
};

/** @internal */
export class WebGPUTextureManager {
    private _engine: WebGPUEngine;
    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;
    private _mipmapSampler: GPUSampler;
    private _videoSampler: GPUSampler;
    private _ubCopyWithOfst: GPUBuffer;
    private _pipelines: { [format: string]: Array<[GPURenderPipeline, GPUBindGroupLayout]> } = {};
    private _compiledShaders: GPUShaderModule[][] = [];
    private _videoPipelines: { [format: string]: Array<[GPURenderPipeline, GPUBindGroupLayout]> } = {};
    private _videoCompiledShaders: GPUShaderModule[][] = [];
    private _deferredReleaseTextures: Array<[Nullable<IHardwareTextureWrapper | GPUTexture>, Nullable<BaseTexture>]> = [];
    private _commandEncoderForCreation: GPUCommandEncoder;

    //------------------------------------------------------------------------------
    //                         Initialization / Helpers
    //------------------------------------------------------------------------------

    constructor(engine: WebGPUEngine, device: GPUDevice, bufferManager: WebGPUBufferManager, enabledExtensions: GPUFeatureName[]) {
        this._engine = engine;
        this._device = device;
        this._bufferManager = bufferManager;

        if (enabledExtensions.indexOf(WebGPUConstants.FeatureName.RG11B10UFloatRenderable) !== -1) {
            const keys = Object.keys(renderableTextureFormatToIndex);
            renderableTextureFormatToIndex[WebGPUConstants.TextureFormat.RG11B10UFloat] = renderableTextureFormatToIndex[keys[keys.length - 1]] + 1;
        }

        this._mipmapSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Linear });
        this._videoSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Linear });
        this._ubCopyWithOfst = this._bufferManager.createBuffer(
            4 * 4,
            WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst,
            "UBCopyWithOffset"
        ).underlyingResource;

        this._getPipeline(WebGPUConstants.TextureFormat.RGBA8Unorm);
        this._getVideoPipeline(WebGPUConstants.TextureFormat.RGBA8Unorm);
    }

    private _getPipeline(format: GPUTextureFormat, type: PipelineType = PipelineType.MipMap, params?: IPipelineParameters): [GPURenderPipeline, GPUBindGroupLayout] {
        const index =
            type === PipelineType.MipMap
                ? 1 << 0
                : type === PipelineType.InvertYPremultiplyAlpha
                  ? ((params!.invertY ? 1 : 0) << 1) + ((params!.premultiplyAlpha ? 1 : 0) << 2)
                  : type === PipelineType.Clear
                    ? 1 << 3
                    : type === PipelineType.InvertYPremultiplyAlphaWithOfst
                      ? ((params!.invertY ? 1 : 0) << 4) + ((params!.premultiplyAlpha ? 1 : 0) << 5)
                      : type === PipelineType.ResolveDepth
                        ? 1 << 6
                        : 0;

        if (!this._pipelines[format]) {
            this._pipelines[format] = [];
        }

        let pipelineAndBGL = this._pipelines[format][index];
        if (!pipelineAndBGL) {
            let defines = "";
            if (type === PipelineType.InvertYPremultiplyAlpha || type === PipelineType.InvertYPremultiplyAlphaWithOfst) {
                if (params!.invertY) {
                    defines += "#define INVERTY\n";
                }
                if (params!.premultiplyAlpha) {
                    defines += "#define PREMULTIPLYALPHA\n";
                }
            }

            let modules = this._compiledShaders[index];
            if (!modules) {
                let vertexCode = shadersForPipelineType[type].vertex;
                let fragmentCode = shadersForPipelineType[type].fragment;

                const processorOptions: _IProcessingOptions = {
                    defines: defines.split("\n"),
                    indexParameters: null,
                    isFragment: false,
                    shouldUseHighPrecisionShader: true,
                    processor: this._engine._getShaderProcessor(ShaderLanguage.WGSL),
                    supportsUniformBuffers: true,
                    shadersRepository: "",
                    includesShadersStore: {},
                    version: (this._engine.version * 100).toString(),
                    platformName: this._engine.shaderPlatformName,
                    processingContext: this._engine._getShaderProcessingContext(ShaderLanguage.WGSL, true),
                    isNDCHalfZRange: this._engine.isNDCHalfZRange,
                    useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
                };

                Initialize(processorOptions);

                // Disable special additions not needed here
                (processorOptions.processor as WebGPUShaderProcessorWGSL).pureMode = true;

                Process(
                    vertexCode,
                    processorOptions,
                    (migratedVertexCode) => {
                        vertexCode = migratedVertexCode;
                    },
                    this._engine
                );

                processorOptions.isFragment = true;

                Process(
                    fragmentCode,
                    processorOptions,
                    (migratedFragmentCode) => {
                        fragmentCode = migratedFragmentCode;
                    },
                    this._engine
                );

                const final = Finalize(vertexCode, fragmentCode, processorOptions);

                // Restore
                (processorOptions.processor as WebGPUShaderProcessorWGSL).pureMode = false;

                const vertexModule = this._device.createShaderModule({
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_InternalVertexShader_${index}`,
                    code: final.vertexCode,
                });
                const fragmentModule = this._device.createShaderModule({
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_InternalFragmentShader_${index}`,
                    code: final.fragmentCode,
                });
                modules = this._compiledShaders[index] = [vertexModule, fragmentModule];
            }

            const pipeline = this._device.createRenderPipeline({
                label: `BabylonWebGPUDevice${this._engine.uniqueId}_InternalPipeline_${format}_${index}`,
                layout: WebGPUConstants.AutoLayoutMode.Auto,
                vertex: {
                    module: modules[0],
                    entryPoint: "main",
                },
                fragment: {
                    module: modules[1],
                    entryPoint: "main",
                    targets: [
                        {
                            format,
                        },
                    ],
                },
                primitive: {
                    topology: WebGPUConstants.PrimitiveTopology.TriangleStrip,
                    stripIndexFormat: WebGPUConstants.IndexFormat.Uint16,
                },
            });

            pipelineAndBGL = this._pipelines[format][index] = [pipeline, pipeline.getBindGroupLayout(0)];
        }

        return pipelineAndBGL;
    }

    private _getVideoPipeline(format: GPUTextureFormat, type: VideoPipelineType = VideoPipelineType.DontInvertY): [GPURenderPipeline, GPUBindGroupLayout] {
        const index = type === VideoPipelineType.InvertY ? 1 << 0 : 0;

        if (!this._videoPipelines[format]) {
            this._videoPipelines[format] = [];
        }

        let pipelineAndBGL = this._videoPipelines[format][index];
        if (!pipelineAndBGL) {
            let modules = this._videoCompiledShaders[index];
            if (!modules) {
                const vertexModule = this._device.createShaderModule({
                    code: copyVideoToTextureVertexSource,
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_CopyVideoToTexture_VertexShader`,
                });
                const fragmentModule = this._device.createShaderModule({
                    code: index === 0 ? copyVideoToTextureFragmentSource : copyVideoToTextureInvertYFragmentSource,
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_CopyVideoToTexture_FragmentShader_${index === 0 ? "DontInvertY" : "InvertY"}`,
                });
                modules = this._videoCompiledShaders[index] = [vertexModule, fragmentModule];
            }

            const pipeline = this._device.createRenderPipeline({
                label: `BabylonWebGPUDevice${this._engine.uniqueId}_InternalVideoPipeline_${format}_${index === 0 ? "DontInvertY" : "InvertY"}`,
                layout: WebGPUConstants.AutoLayoutMode.Auto,
                vertex: {
                    module: modules[0],
                    entryPoint: "main",
                },
                fragment: {
                    module: modules[1],
                    entryPoint: "main",
                    targets: [
                        {
                            format,
                        },
                    ],
                },
                primitive: {
                    topology: WebGPUConstants.PrimitiveTopology.TriangleStrip,
                    stripIndexFormat: WebGPUConstants.IndexFormat.Uint16,
                },
            });

            pipelineAndBGL = this._videoPipelines[format][index] = [pipeline, pipeline.getBindGroupLayout(0)];
        }

        return pipelineAndBGL;
    }

    public setCommandEncoder(encoder: GPUCommandEncoder): void {
        this._commandEncoderForCreation = encoder;
    }

    public copyVideoToTexture(video: ExternalTexture, texture: InternalTexture, format: GPUTextureFormat, invertY = false, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const [pipeline, bindGroupLayout] = this._getVideoPipeline(format, invertY ? VideoPipelineType.InvertY : VideoPipelineType.DontInvertY);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`copy video to texture (invertY=${invertY})`);

        const webgpuHardwareTexture = texture._hardwareTexture as WebGPUHardwareTexture;

        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: `BabylonWebGPUDevice${this._engine.uniqueId}_copyVideoToTexture_${format}_${invertY ? "InvertY" : "DontInvertY"}${texture.label ? "_" + texture.label : ""}`,
            colorAttachments: [
                {
                    view: webgpuHardwareTexture.underlyingResource!.createView({
                        format,
                        dimension: WebGPUConstants.TextureViewDimension.E2d,
                        mipLevelCount: 1,
                        baseArrayLayer: 0,
                        baseMipLevel: 0,
                        arrayLayerCount: 1,
                        aspect: WebGPUConstants.TextureAspect.All,
                    }),
                    loadOp: WebGPUConstants.LoadOp.Load,
                    storeOp: WebGPUConstants.StoreOp.Store,
                },
            ],
        };
        const passEncoder = commandEncoder!.beginRenderPass(renderPassDescriptor);

        const descriptor: GPUBindGroupDescriptor = {
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this._videoSampler,
                },
                {
                    binding: 1,
                    resource: this._device.importExternalTexture({
                        source: video.underlyingResource,
                    }),
                },
            ],
        };

        const bindGroup = this._device.createBindGroup(descriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4, 1, 0, 0);
        passEncoder.end();

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public invertYPreMultiplyAlpha(
        gpuOrHdwTexture: GPUTexture | WebGPUHardwareTexture,
        width: number,
        height: number,
        format: GPUTextureFormat,
        invertY = false,
        premultiplyAlpha = false,
        faceIndex = 0,
        mipLevel = 0,
        layers = 1,
        ofstX = 0,
        ofstY = 0,
        rectWidth = 0,
        rectHeight = 0,
        commandEncoder?: GPUCommandEncoder,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        allowGPUOptimization?: boolean
    ): void {
        const useRect = rectWidth !== 0;
        const useOwnCommandEncoder = commandEncoder === undefined;
        const [pipeline, bindGroupLayout] = this._getPipeline(format, useRect ? PipelineType.InvertYPremultiplyAlphaWithOfst : PipelineType.InvertYPremultiplyAlpha, {
            invertY,
            premultiplyAlpha,
        });

        faceIndex = Math.max(faceIndex, 0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        let gpuTexture: Nullable<GPUTexture>;
        if (WebGPUTextureHelper.IsHardwareTexture(gpuOrHdwTexture)) {
            gpuTexture = gpuOrHdwTexture.underlyingResource;
            if (!(invertY && !premultiplyAlpha && layers === 1 && faceIndex === 0)) {
                // we optimize only for the most likely case (invertY=true, premultiplyAlpha=false, layers=1, faceIndex=0) to avoid dealing with big caches
                gpuOrHdwTexture = undefined as any;
            }
        } else {
            gpuTexture = gpuOrHdwTexture;
            gpuOrHdwTexture = undefined as any;
        }
        if (!gpuTexture) {
            return;
        }

        commandEncoder!.pushDebugGroup(`internal process texture "${gpuTexture.label}" (invertY=${invertY} premultiplyAlpha=${premultiplyAlpha})`);

        if (useRect) {
            this._bufferManager.setRawData(this._ubCopyWithOfst, 0, new Float32Array([ofstX, ofstY, rectWidth, rectHeight]), 0, 4 * 4);
        }

        const webgpuHardwareTexture = gpuOrHdwTexture as Nullable<WebGPUHardwareTexture>;

        const outputTexture =
            webgpuHardwareTexture?._copyInvertYTempTexture ??
            this.createTexture(
                { width, height, layers: 1 },
                false,
                false,
                false,
                false,
                false,
                format,
                1,
                commandEncoder,
                WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.TextureBinding,
                undefined,
                "TempTextureForCopyWithInvertY"
            );

        const renderPassDescriptor = webgpuHardwareTexture?._copyInvertYRenderPassDescr ?? {
            label: `BabylonWebGPUDevice${this._engine.uniqueId}_invertYPreMultiplyAlpha_${format}_${invertY ? "InvertY" : "DontInvertY"}_${
                premultiplyAlpha ? "PremultiplyAlpha" : "DontPremultiplyAlpha"
            }`,
            colorAttachments: [
                {
                    view: outputTexture.createView({
                        format,
                        dimension: WebGPUConstants.TextureViewDimension.E2d,
                        baseMipLevel: 0,
                        mipLevelCount: 1,
                        arrayLayerCount: 1,
                        baseArrayLayer: 0,
                    }),
                    loadOp: WebGPUConstants.LoadOp.Load,
                    storeOp: WebGPUConstants.StoreOp.Store,
                },
            ],
        };
        const passEncoder = commandEncoder!.beginRenderPass(renderPassDescriptor);

        let bindGroup = useRect ? webgpuHardwareTexture?._copyInvertYBindGroupWithOfst : webgpuHardwareTexture?._copyInvertYBindGroup;
        if (!bindGroup) {
            const descriptor: GPUBindGroupDescriptor = {
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: gpuTexture.createView({
                            format,
                            dimension: WebGPUConstants.TextureViewDimension.E2d,
                            baseMipLevel: mipLevel,
                            mipLevelCount: 1,
                            arrayLayerCount: layers,
                            baseArrayLayer: faceIndex,
                        }),
                    },
                ],
            };
            if (useRect) {
                descriptor.entries.push({
                    binding: 1,
                    resource: {
                        buffer: this._ubCopyWithOfst,
                    },
                });
            }
            bindGroup = this._device.createBindGroup(descriptor);
        }

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4, 1, 0, 0);
        passEncoder.end();

        commandEncoder!.copyTextureToTexture(
            {
                texture: outputTexture,
            },
            {
                texture: gpuTexture,
                mipLevel,
                origin: {
                    x: 0,
                    y: 0,
                    z: faceIndex,
                },
            },
            {
                width: rectWidth || width,
                height: rectHeight || height,
                depthOrArrayLayers: 1,
            }
        );

        if (webgpuHardwareTexture) {
            webgpuHardwareTexture._copyInvertYTempTexture = outputTexture;
            webgpuHardwareTexture._copyInvertYRenderPassDescr = renderPassDescriptor;
            if (useRect) {
                webgpuHardwareTexture._copyInvertYBindGroupWithOfst = bindGroup;
            } else {
                webgpuHardwareTexture._copyInvertYBindGroup = bindGroup;
            }
        } else {
            this._deferredReleaseTextures.push([outputTexture, null]);
        }

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    //------------------------------------------------------------------------------
    //                               Creation
    //------------------------------------------------------------------------------

    public createTexture(
        imageBitmap: ImageBitmap | { width: number; height: number; layers: number },
        hasMipmaps = false,
        generateMipmaps = false,
        invertY = false,
        premultiplyAlpha = false,
        is3D = false,
        format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm,
        sampleCount = 1,
        commandEncoder?: GPUCommandEncoder,
        usage = -1,
        additionalUsages = 0,
        label?: string,
        mipLevelCount?: number
    ): GPUTexture {
        sampleCount = WebGPUTextureHelper.GetSample(sampleCount);

        const layerCount = (imageBitmap as any).layers || 1;
        const textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depthOrArrayLayers: layerCount,
        };

        const renderAttachmentFlag = renderableTextureFormatToIndex[format] ? WebGPUConstants.TextureUsage.RenderAttachment : 0;
        const isCompressedFormat = WebGPUTextureHelper.IsCompressedFormat(format);
        const maxNumMipLevels = WebGPUTextureHelper.ComputeNumMipmapLevels(imageBitmap.width, imageBitmap.height);
        const effectiveMipLevelCount = hasMipmaps ? Math.min(mipLevelCount ?? maxNumMipLevels, maxNumMipLevels) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.TextureBinding;

        additionalUsages |= hasMipmaps && !isCompressedFormat ? WebGPUConstants.TextureUsage.CopySrc | renderAttachmentFlag : 0;

        if (!isCompressedFormat && !is3D) {
            // we don't know in advance if the texture will be updated with copyExternalImageToTexture (which requires to have those flags), so we need to force the flags all the times
            additionalUsages |= renderAttachmentFlag | WebGPUConstants.TextureUsage.CopyDst;
        }

        const gpuTexture = this._device.createTexture({
            label: `BabylonWebGPUDevice${this._engine.uniqueId}_Texture${is3D ? "3D" : "2D"}_${label ? label + "_" : ""}${textureSize.width}x${textureSize.height}x${
                textureSize.depthOrArrayLayers
            }_${hasMipmaps ? "wmips" : "womips"}_${format}_samples${sampleCount}`,
            size: textureSize,
            dimension: is3D ? WebGPUConstants.TextureDimension.E3d : WebGPUConstants.TextureDimension.E2d,
            format,
            usage: usages | additionalUsages,
            sampleCount,
            mipLevelCount: effectiveMipLevelCount,
        });

        if (WebGPUTextureHelper.IsImageBitmap(imageBitmap)) {
            this.updateTexture(imageBitmap, gpuTexture, imageBitmap.width, imageBitmap.height, layerCount, format, 0, 0, invertY, premultiplyAlpha, 0, 0);

            if (hasMipmaps && generateMipmaps) {
                this.generateMipmaps(gpuTexture, effectiveMipLevelCount, 0, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public createCubeTexture(
        imageBitmaps: ImageBitmap[] | { width: number; height: number; layers: number },
        hasMipmaps = false,
        generateMipmaps = false,
        invertY = false,
        premultiplyAlpha = false,
        format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm,
        sampleCount = 1,
        commandEncoder?: GPUCommandEncoder,
        usage = -1,
        additionalUsages = 0,
        label?: string
    ): GPUTexture {
        sampleCount = WebGPUTextureHelper.GetSample(sampleCount);

        const width = WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps) ? imageBitmaps[0].width : imageBitmaps.width;
        const height = WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps) ? imageBitmaps[0].height : imageBitmaps.height;
        const layerCount = WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps) ? 1 : imageBitmaps.layers;

        const renderAttachmentFlag = renderableTextureFormatToIndex[format] ? WebGPUConstants.TextureUsage.RenderAttachment : 0;
        const isCompressedFormat = WebGPUTextureHelper.IsCompressedFormat(format);
        const mipLevelCount = hasMipmaps ? WebGPUTextureHelper.ComputeNumMipmapLevels(width, height) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.TextureBinding;

        additionalUsages |= hasMipmaps && !isCompressedFormat ? WebGPUConstants.TextureUsage.CopySrc | renderAttachmentFlag : 0;

        if (!isCompressedFormat) {
            // we don't know in advance if the texture will be updated with copyExternalImageToTexture (which requires to have those flags), so we need to force the flags all the times
            additionalUsages |= renderAttachmentFlag | WebGPUConstants.TextureUsage.CopyDst;
        }

        const gpuTexture = this._device.createTexture({
            label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureCube_${label ? label + "_" : ""}${width}x${height}x${layerCount}_${
                hasMipmaps ? "wmips" : "womips"
            }_${format}_samples${sampleCount}`,
            size: {
                width,
                height,
                depthOrArrayLayers: 6 * layerCount,
            },
            dimension: WebGPUConstants.TextureDimension.E2d,
            format,
            usage: usages | additionalUsages,
            sampleCount,
            mipLevelCount,
        });

        if (WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps)) {
            this.updateCubeTextures(imageBitmaps, gpuTexture, width, height, format, invertY, premultiplyAlpha, 0, 0);

            if (hasMipmaps && generateMipmaps) {
                this.generateCubeMipmaps(gpuTexture, mipLevelCount, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public generateCubeMipmaps(gpuOrHdwTexture: GPUTexture | WebGPUHardwareTexture, mipLevelCount: number, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const gpuTexture = WebGPUTextureHelper.IsHardwareTexture(gpuOrHdwTexture) ? gpuOrHdwTexture.underlyingResource! : (gpuOrHdwTexture as GPUTexture);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`create cube mipmaps for "${gpuTexture.label}" (${mipLevelCount} levels)`);

        for (let f = 0; f < gpuTexture.depthOrArrayLayers; ++f) {
            this.generateMipmaps(gpuOrHdwTexture, mipLevelCount, f, commandEncoder);
        }

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public generateMipmaps(gpuOrHdwTexture: GPUTexture | WebGPUHardwareTexture, mipLevelCount: number, faceIndex = 0, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;

        faceIndex = Math.max(faceIndex, 0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        let gpuTexture: Nullable<GPUTexture>;
        if (WebGPUTextureHelper.IsHardwareTexture(gpuOrHdwTexture)) {
            gpuTexture = gpuOrHdwTexture.underlyingResource;
            gpuOrHdwTexture._mipmapGenRenderPassDescr = gpuOrHdwTexture._mipmapGenRenderPassDescr || [];
            gpuOrHdwTexture._mipmapGenBindGroup = gpuOrHdwTexture._mipmapGenBindGroup || [];
        } else {
            gpuTexture = gpuOrHdwTexture;
            gpuOrHdwTexture = undefined as any;
        }
        if (!gpuTexture) {
            return;
        }

        commandEncoder!.pushDebugGroup(`create mipmaps for "${gpuTexture.label}" (face #${faceIndex} - ${mipLevelCount} levels)`);

        const format = gpuTexture.format;
        const [pipeline, bindGroupLayout] = this._getPipeline(format);

        const is3D = gpuTexture.dimension === WebGPUConstants.TextureDimension.E3d;
        const webgpuHardwareTexture = gpuOrHdwTexture as Nullable<WebGPUHardwareTexture>;
        for (let i = 1; i < mipLevelCount; ++i) {
            const renderPassDescriptor = webgpuHardwareTexture?._mipmapGenRenderPassDescr[faceIndex]?.[i - 1] ?? {
                label: `BabylonWebGPUDevice${this._engine.uniqueId}_generateMipmaps_${format}_faceIndex${faceIndex}_level${i}`,
                colorAttachments: [
                    {
                        view: gpuTexture.createView({
                            format,
                            dimension: is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
                            baseMipLevel: i,
                            mipLevelCount: 1,
                            arrayLayerCount: 1,
                            baseArrayLayer: faceIndex,
                        }),
                        loadOp: WebGPUConstants.LoadOp.Load,
                        storeOp: WebGPUConstants.StoreOp.Store,
                    },
                ],
            };
            if (webgpuHardwareTexture) {
                webgpuHardwareTexture._mipmapGenRenderPassDescr[faceIndex] = webgpuHardwareTexture._mipmapGenRenderPassDescr[faceIndex] || [];
                webgpuHardwareTexture._mipmapGenRenderPassDescr[faceIndex][i - 1] = renderPassDescriptor;
            }
            const passEncoder = commandEncoder!.beginRenderPass(renderPassDescriptor);

            const bindGroup =
                webgpuHardwareTexture?._mipmapGenBindGroup[faceIndex]?.[i - 1] ??
                this._device.createBindGroup({
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: gpuTexture.createView({
                                format,
                                dimension: is3D ? WebGPUConstants.TextureViewDimension.E3d : WebGPUConstants.TextureViewDimension.E2d,
                                baseMipLevel: i - 1,
                                mipLevelCount: 1,
                                arrayLayerCount: 1,
                                baseArrayLayer: faceIndex,
                            }),
                        },
                        {
                            binding: 1,
                            resource: this._mipmapSampler,
                        },
                    ],
                });
            if (webgpuHardwareTexture) {
                webgpuHardwareTexture._mipmapGenBindGroup[faceIndex] = webgpuHardwareTexture._mipmapGenBindGroup[faceIndex] || [];
                webgpuHardwareTexture._mipmapGenBindGroup[faceIndex][i - 1] = bindGroup;
            }

            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4, 1, 0, 0);
            passEncoder.end();
        }

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public createGPUTextureForInternalTexture(texture: InternalTexture, width?: number, height?: number, depth?: number, creationFlags?: number): WebGPUHardwareTexture {
        if (!texture._hardwareTexture) {
            texture._hardwareTexture = new WebGPUHardwareTexture(this._engine);
        }

        if (width === undefined) {
            width = texture.width;
        }
        if (height === undefined) {
            height = texture.height;
        }
        if (depth === undefined) {
            depth = texture.depth;
        }

        texture.width = texture.baseWidth = width;
        texture.height = texture.baseHeight = height;
        texture.depth = texture.baseDepth = depth;

        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const isStorageTexture = ((creationFlags ?? 0) & Constants.TEXTURE_CREATIONFLAG_STORAGE) !== 0;

        gpuTextureWrapper.format = gpuTextureWrapper.originalFormat = WebGPUTextureHelper.GetWebGPUTextureFormat(texture.type, texture.format, texture._useSRGBBuffer);

        if (texture.samples > 1) {
            // In case of a MSAA texture, the current texture will be the "resolve" texture, which cannot have a depth format
            switch (gpuTextureWrapper.format) {
                case WebGPUConstants.TextureFormat.Depth16Unorm:
                    gpuTextureWrapper.format = WebGPUConstants.TextureFormat.R16Unorm;
                    break;
                case WebGPUConstants.TextureFormat.Depth24Plus:
                case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                case WebGPUConstants.TextureFormat.Depth32Float:
                case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
                    gpuTextureWrapper.format = WebGPUConstants.TextureFormat.R32Float;
                    break;
            }
        }

        gpuTextureWrapper.textureUsages =
            texture._source === InternalTextureSource.RenderTarget || texture.source === InternalTextureSource.MultiRenderTarget
                ? WebGPUConstants.TextureUsage.TextureBinding | WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.RenderAttachment
                : texture._source === InternalTextureSource.DepthStencil
                  ? WebGPUConstants.TextureUsage.TextureBinding | WebGPUConstants.TextureUsage.RenderAttachment
                  : -1;

        gpuTextureWrapper.textureAdditionalUsages = isStorageTexture ? WebGPUConstants.TextureUsage.StorageBinding : 0;

        const hasMipMaps = texture.generateMipMaps;
        const layerCount = depth || 1;
        let mipmapCount;
        if (texture._maxLodLevel !== null) {
            mipmapCount = texture._maxLodLevel;
        } else {
            mipmapCount = hasMipMaps ? WebGPUTextureHelper.ComputeNumMipmapLevels(width, height) : 1;
        }
        if (texture.isCube) {
            const gpuTexture = this.createCubeTexture(
                { width, height, layers: layerCount },
                texture.generateMipMaps,
                texture.generateMipMaps,
                texture.invertY,
                false,
                gpuTextureWrapper.format,
                1,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages,
                texture.label
            );

            gpuTextureWrapper.set(gpuTexture);

            const format = WebGPUTextureHelper.GetDepthFormatOnly(gpuTextureWrapper.format);
            const aspect = WebGPUTextureHelper.HasDepthAndStencilAspects(gpuTextureWrapper.format) ? WebGPUConstants.TextureAspect.DepthOnly : WebGPUConstants.TextureAspect.All;
            const dimension = texture.is2DArray ? WebGPUConstants.TextureViewDimension.CubeArray : WebGPUConstants.TextureViewDimension.Cube;

            gpuTextureWrapper.createView(
                {
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureViewCube${texture.is2DArray ? "_Array" + layerCount : ""}_${width}x${height}_${
                        hasMipMaps ? "wmips" : "womips"
                    }_${format}_${dimension}_${aspect}_${texture.label ?? "noname"}`,
                    format,
                    dimension,
                    mipLevelCount: mipmapCount,
                    baseArrayLayer: 0,
                    baseMipLevel: 0,
                    arrayLayerCount: 6 * layerCount,
                    aspect,
                },
                isStorageTexture
            );
        } else {
            const gpuTexture = this.createTexture(
                { width, height, layers: layerCount },
                hasMipMaps,
                texture.generateMipMaps,
                texture.invertY,
                false,
                texture.is3D,
                gpuTextureWrapper.format,
                1,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages,
                texture.label
            );

            gpuTextureWrapper.set(gpuTexture);

            const arrayLayerCount = texture.is3D ? 1 : layerCount;
            const format = WebGPUTextureHelper.GetDepthFormatOnly(gpuTextureWrapper.format);
            const aspect = WebGPUTextureHelper.HasDepthAndStencilAspects(gpuTextureWrapper.format) ? WebGPUConstants.TextureAspect.DepthOnly : WebGPUConstants.TextureAspect.All;
            const dimension = texture.is2DArray
                ? WebGPUConstants.TextureViewDimension.E2dArray
                : texture.is3D
                  ? WebGPUConstants.TextureDimension.E3d
                  : WebGPUConstants.TextureViewDimension.E2d;

            gpuTextureWrapper.createView(
                {
                    label: `BabylonWebGPUDevice${this._engine.uniqueId}_TextureView${texture.is3D ? "3D" : "2D"}${
                        texture.is2DArray ? "_Array" + arrayLayerCount : ""
                    }_${width}x${height}${texture.is3D ? "x" + layerCount : ""}_${hasMipMaps ? "wmips" : "womips"}_${format}_${dimension}_${aspect}_${texture.label ?? "noname"}`,
                    format,
                    dimension,
                    mipLevelCount: mipmapCount,
                    baseArrayLayer: 0,
                    baseMipLevel: 0,
                    arrayLayerCount,
                    aspect,
                },
                isStorageTexture
            );
        }

        return gpuTextureWrapper;
    }

    public createMSAATexture(gpuTexture: GPUTexture, format: GPUTextureFormat, samples: number) {
        return this.createTexture(
            { width: gpuTexture.width, height: gpuTexture.height, layers: 1 },
            false,
            false,
            false,
            false,
            false,
            format,
            samples,
            this._commandEncoderForCreation,
            WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.TextureBinding,
            0,
            gpuTexture.label ? gpuTexture.label + " (MSAA)" : "MSAA"
        );
    }

    public resolveMSAADepthTexture(msaaTexture: GPUTexture, outputTexture: GPUTexture, commandEncoder?: GPUCommandEncoder): void {
        const format = outputTexture.format;

        const useOwnCommandEncoder = commandEncoder === undefined;
        const [pipeline, bindGroupLayout] = this._getPipeline(format, PipelineType.ResolveDepth);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`resolve MSAA Depth texture "${msaaTexture.label}" to "${outputTexture.label}"`);

        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: `BabylonWebGPUDevice${this._engine.uniqueId}_resolveMSAADepthTexture${msaaTexture.label ? "_" + msaaTexture.label : ""}`,
            colorAttachments: [
                {
                    view: outputTexture,
                    loadOp: WebGPUConstants.LoadOp.Load,
                    storeOp: WebGPUConstants.StoreOp.Store,
                },
            ],
        };
        const passEncoder = commandEncoder!.beginRenderPass(renderPassDescriptor);

        const descriptor: GPUBindGroupDescriptor = {
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: msaaTexture.createView({
                        format: WebGPUTextureHelper.GetDepthFormatOnly(msaaTexture.format),
                        dimension: WebGPUConstants.TextureViewDimension.E2d,
                        mipLevelCount: 1,
                        baseArrayLayer: 0,
                        baseMipLevel: 0,
                        arrayLayerCount: 1,
                        aspect: WebGPUConstants.TextureAspect.DepthOnly,
                    }),
                },
            ],
        };

        const bindGroup = this._device.createBindGroup(descriptor);

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4, 1, 0, 0);
        passEncoder.end();

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    //------------------------------------------------------------------------------
    //                                  Update
    //------------------------------------------------------------------------------

    public updateCubeTextures(
        imageBitmaps: ImageBitmap[] | Uint8Array[],
        gpuTexture: GPUTexture,
        width: number,
        height: number,
        format: GPUTextureFormat,
        invertY = false,
        premultiplyAlpha = false,
        offsetX = 0,
        offsetY = 0
    ): void {
        const faces = [0, 3, 1, 4, 2, 5];

        for (let f = 0; f < faces.length; ++f) {
            const imageBitmap = imageBitmaps[faces[f]];

            this.updateTexture(imageBitmap, gpuTexture, width, height, 1, format, f, 0, invertY, premultiplyAlpha, offsetX, offsetY);
        }
    }

    // TODO WEBGPU handle data source not being in the same format than the destination texture?
    public updateTexture(
        imageBitmap: ImageBitmap | Uint8Array | ImageData | HTMLImageElement | HTMLVideoElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas,
        texture: GPUTexture | InternalTexture,
        width: number,
        height: number,
        layers: number,
        format: GPUTextureFormat,
        faceIndex: number = 0,
        mipLevel: number = 0,
        invertY = false,
        premultiplyAlpha = false,
        offsetX = 0,
        offsetY = 0,
        allowGPUOptimization?: boolean
    ): void {
        const gpuTexture = WebGPUTextureHelper.IsInternalTexture(texture) ? (texture._hardwareTexture as WebGPUHardwareTexture).underlyingResource! : texture;
        const blockInformation = WebGPUTextureHelper.GetBlockInformationFromFormat(format);
        const gpuOrHdwTexture = WebGPUTextureHelper.IsInternalTexture(texture) ? (texture._hardwareTexture as WebGPUHardwareTexture) : texture;

        const textureCopyView: GPUCopyExternalImageDestInfo = {
            texture: gpuTexture,
            origin: {
                x: offsetX,
                y: offsetY,
                z: Math.max(faceIndex, 0),
            },
            mipLevel: mipLevel,
            premultipliedAlpha: premultiplyAlpha,
        };

        const textureExtent = {
            width: Math.ceil(width / blockInformation.width) * blockInformation.width,
            height: Math.ceil(height / blockInformation.height) * blockInformation.height,
            depthOrArrayLayers: layers || 1,
        };

        if ((imageBitmap as Uint8Array).byteLength !== undefined) {
            imageBitmap = imageBitmap as Uint8Array;

            const bytesPerRow = Math.ceil(width / blockInformation.width) * blockInformation.length;
            const aligned = Math.ceil(bytesPerRow / 256) * 256 === bytesPerRow;

            if (aligned) {
                const commandEncoder = this._device.createCommandEncoder({});

                const buffer = this._bufferManager.createRawBuffer(
                    imageBitmap.byteLength,
                    WebGPUConstants.BufferUsage.MapWrite | WebGPUConstants.BufferUsage.CopySrc,
                    true,
                    "TempBufferForUpdateTexture" + (gpuTexture ? "_" + gpuTexture.label : "")
                );

                const arrayBuffer = buffer.getMappedRange();

                new Uint8Array(arrayBuffer).set(imageBitmap);

                buffer.unmap();

                commandEncoder.copyBufferToTexture(
                    {
                        buffer: buffer,
                        offset: 0,
                        bytesPerRow,
                        rowsPerImage: textureExtent.height / blockInformation.height,
                    },
                    textureCopyView,
                    textureExtent
                );

                this._device.queue.submit([commandEncoder.finish()]);

                this._bufferManager.releaseBuffer(buffer);
            } else {
                this._device.queue.writeTexture(
                    textureCopyView,
                    imageBitmap,
                    {
                        offset: 0,
                        bytesPerRow,
                        rowsPerImage: textureExtent.height / blockInformation.height,
                    },
                    textureExtent
                );
            }

            if (invertY || premultiplyAlpha) {
                if (WebGPUTextureHelper.IsInternalTexture(texture)) {
                    const dontUseRect = offsetX === 0 && offsetY === 0 && width === texture.width && height === texture.height;
                    this.invertYPreMultiplyAlpha(
                        gpuOrHdwTexture,
                        texture.width,
                        texture.height,
                        format,
                        invertY,
                        premultiplyAlpha,
                        faceIndex,
                        mipLevel,
                        layers || 1,
                        offsetX,
                        offsetY,
                        dontUseRect ? 0 : width,
                        dontUseRect ? 0 : height,
                        undefined,
                        allowGPUOptimization
                    );
                } else {
                    // we should never take this code path
                    // eslint-disable-next-line no-throw-literal
                    throw "updateTexture: Can't process the texture data because a GPUTexture was provided instead of an InternalTexture!";
                }
            }
        } else {
            imageBitmap = imageBitmap as ImageBitmap | ImageData | HTMLImageElement | HTMLVideoElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas;
            this._device.queue.copyExternalImageToTexture({ source: imageBitmap, flipY: invertY }, textureCopyView, textureExtent);
        }
    }

    public updateMipLevelCountForInternalTexture(texture: InternalTexture, mipLevelCount?: number) {
        const maxNumMipLevels = WebGPUTextureHelper.ComputeNumMipmapLevels(texture.width, texture.height);
        if (mipLevelCount !== undefined) {
            texture.mipLevelCount = Math.min(Math.max(1, mipLevelCount), maxNumMipLevels);
        } else if (texture.generateMipMaps) {
            texture.mipLevelCount = maxNumMipLevels;
        } else {
            texture.mipLevelCount = 1;
        }
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    public readPixels(
        texture: GPUTexture,
        x: number,
        y: number,
        width: number,
        height: number,
        format: GPUTextureFormat,
        faceIndex: number = 0,
        mipLevel: number = 0,
        buffer: Nullable<ArrayBufferView> = null,
        noDataConversion = false
    ): Promise<ArrayBufferView> {
        const blockInformation = WebGPUTextureHelper.GetBlockInformationFromFormat(format);

        const bytesPerRow = Math.ceil(width / blockInformation.width) * blockInformation.length;

        const bytesPerRowAligned = Math.ceil(bytesPerRow / 256) * 256;

        const size = bytesPerRowAligned * height;

        const gpuBuffer = this._bufferManager.createRawBuffer(
            size,
            WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst,
            undefined,
            "TempBufferForReadPixels" + (texture.label ? "_" + texture.label : "")
        );

        const commandEncoder = this._device.createCommandEncoder({});

        commandEncoder.copyTextureToBuffer(
            {
                texture,
                mipLevel,
                origin: {
                    x,
                    y,
                    z: Math.max(faceIndex, 0),
                },
            },
            {
                buffer: gpuBuffer,
                offset: 0,
                bytesPerRow: bytesPerRowAligned,
            },
            {
                width,
                height,
                depthOrArrayLayers: 1,
            }
        );

        this._device.queue.submit([commandEncoder.finish()]);

        return this._bufferManager.readDataFromBuffer(
            gpuBuffer,
            size,
            width,
            height,
            bytesPerRow,
            bytesPerRowAligned,
            WebGPUTextureHelper.GetTextureTypeFromFormat(format),
            0,
            buffer,
            true,
            noDataConversion
        );
    }

    //------------------------------------------------------------------------------
    //                              Dispose
    //------------------------------------------------------------------------------

    public releaseTexture(texture: InternalTexture | GPUTexture): void {
        if (WebGPUTextureHelper.IsInternalTexture(texture)) {
            const hardwareTexture = texture._hardwareTexture;
            const irradianceTexture = texture._irradianceTexture;

            // We can't destroy the objects just now because they could be used in the current frame - we delay the destroying after the end of the frame
            this._deferredReleaseTextures.push([hardwareTexture, irradianceTexture]);
        } else {
            this._deferredReleaseTextures.push([texture, null]);
        }
    }

    public destroyDeferredTextures(): void {
        for (let i = 0; i < this._deferredReleaseTextures.length; ++i) {
            const [hardwareTexture, irradianceTexture] = this._deferredReleaseTextures[i];

            if (hardwareTexture) {
                if (WebGPUTextureHelper.IsHardwareTexture(hardwareTexture)) {
                    hardwareTexture.release();
                } else {
                    hardwareTexture.destroy();
                }
            }
            irradianceTexture?.dispose();
        }

        this._deferredReleaseTextures.length = 0;
    }
}
