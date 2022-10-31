/* eslint-disable @typescript-eslint/naming-convention */
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
import { Scalar } from "../../Maths/math.scalar";
import type { WebGPUBufferManager } from "./webgpuBufferManager";
import { Constants } from "../constants";
import type { Nullable } from "../../types";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { WebGPUHardwareTexture } from "./webgpuHardwareTexture";
import type { WebGPUTintWASM } from "./webgpuTintWASM";

// TODO WEBGPU improve mipmap generation by using compute shaders

// TODO WEBGPU use WGSL instead of GLSL
const mipmapVertexSource = `
    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
    const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

    layout(location = 0) out vec2 vTex;

    void main() {
        vTex = tex[gl_VertexIndex];
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `;

const mipmapFragmentSource = `
    layout(set = 0, binding = 0) uniform sampler imgSampler;
    layout(set = 0, binding = 1) uniform texture2D img;

    layout(location = 0) in vec2 vTex;
    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = texture(sampler2D(img, imgSampler), vTex);
    }
    `;

const invertYPreMultiplyAlphaVertexSource = `
    #extension GL_EXT_samplerless_texture_functions : enable

    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
    const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

    layout(set = 0, binding = 0) uniform texture2D img;

    #ifdef INVERTY
        layout(location = 0) out flat ivec2 vTextureSize;
    #endif

    void main() {
        #ifdef INVERTY
            vTextureSize = textureSize(img, 0);
        #endif
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `;

const invertYPreMultiplyAlphaFragmentSource = `
    #extension GL_EXT_samplerless_texture_functions : enable

    layout(set = 0, binding = 0) uniform texture2D img;

    #ifdef INVERTY
        layout(location = 0) in flat ivec2 vTextureSize;
    #endif
    layout(location = 0) out vec4 outColor;

    void main() {
    #ifdef INVERTY
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.x, vTextureSize.y - gl_FragCoord.y), 0);
    #else
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color.rgb *= color.a;
    #endif
        outColor = color;
    }
    `;

const invertYPreMultiplyAlphaWithOfstVertexSource = invertYPreMultiplyAlphaVertexSource;

const invertYPreMultiplyAlphaWithOfstFragmentSource = `
    #extension GL_EXT_samplerless_texture_functions : enable

    layout(set = 0, binding = 0) uniform texture2D img;
    layout(set = 0, binding = 1) uniform Params {
        float ofstX;
        float ofstY;
        float width;
        float height;
    };

    #ifdef INVERTY
        layout(location = 0) in flat ivec2 vTextureSize;
    #endif
    layout(location = 0) out vec4 outColor;

    void main() {
        if (gl_FragCoord.x < ofstX || gl_FragCoord.x >= ofstX + width) {
            discard;
        }
        if (gl_FragCoord.y < ofstY || gl_FragCoord.y >= ofstY + height) {
            discard;
        }
    #ifdef INVERTY
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.x, ofstY + height - (gl_FragCoord.y - ofstY)), 0);
    #else
        vec4 color = texelFetch(img, ivec2(gl_FragCoord.xy), 0);
    #endif
    #ifdef PREMULTIPLYALPHA
        color.rgb *= color.a;
    #endif
        outColor = color;
    }
    `;

const clearVertexSource = `
    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));

    void main() {
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `;

const clearFragmentSource = `
    layout(set = 0, binding = 0) uniform Uniforms {
        uniform vec4 color;
    };

    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = color;
    }
    `;

enum PipelineType {
    MipMap = 0,
    InvertYPremultiplyAlpha = 1,
    Clear = 2,
    InvertYPremultiplyAlphaWithOfst = 3,
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
];

/**
 * Map a (renderable) texture format (GPUTextureFormat) to an index for fast lookup (in caches for eg)
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

    rgb10a2unorm: 22,

    rg32uint: 23,
    rg32sint: 24,
    rg32float: 25,
    rgba16uint: 26,
    rgba16sint: 27,
    rgba16float: 28,

    rgba32uint: 29,
    rgba32sint: 30,
    rgba32float: 31,

    stencil8: 32,
    depth16unorm: 33,
    depth24plus: 34,
    "depth24plus-stencil8": 35,
    depth32float: 36,

    "depth24unorm-stencil8": 37,

    "depth32float-stencil8": 38,
};

/** @internal */
export class WebGPUTextureHelper {
    private _device: GPUDevice;
    private _glslang: any;
    private _tintWASM: Nullable<WebGPUTintWASM>;
    private _bufferManager: WebGPUBufferManager;
    private _mipmapSampler: GPUSampler;
    private _ubCopyWithOfst: GPUBuffer;
    private _pipelines: { [format: string]: Array<[GPURenderPipeline, GPUBindGroupLayout]> } = {};
    private _compiledShaders: GPUShaderModule[][] = [];
    private _deferredReleaseTextures: Array<[Nullable<HardwareTextureWrapper | GPUTexture>, Nullable<BaseTexture>]> = [];
    private _commandEncoderForCreation: GPUCommandEncoder;

    public static ComputeNumMipmapLevels(width: number, height: number) {
        return Scalar.ILog2(Math.max(width, height)) + 1;
    }

    //------------------------------------------------------------------------------
    //                         Initialization / Helpers
    //------------------------------------------------------------------------------

    constructor(device: GPUDevice, glslang: any, tintWASM: Nullable<WebGPUTintWASM>, bufferManager: WebGPUBufferManager) {
        this._device = device;
        this._glslang = glslang;
        this._tintWASM = tintWASM;
        this._bufferManager = bufferManager;

        this._mipmapSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Linear });
        this._ubCopyWithOfst = this._bufferManager.createBuffer(4 * 4, WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst).underlyingResource;

        this._getPipeline(WebGPUConstants.TextureFormat.RGBA8Unorm);
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
                : 0;

        if (!this._pipelines[format]) {
            this._pipelines[format] = [];
        }

        let pipelineAndBGL = this._pipelines[format][index];
        if (!pipelineAndBGL) {
            let defines = "#version 450\r\n";
            if (type === PipelineType.InvertYPremultiplyAlpha || type === PipelineType.InvertYPremultiplyAlphaWithOfst) {
                if (params!.invertY) {
                    defines += "#define INVERTY\r\n";
                }
                if (params!.premultiplyAlpha) {
                    defines += "#define PREMULTIPLYALPHA\r\n";
                }
            }

            let modules = this._compiledShaders[index];
            if (!modules) {
                let vertexCode = this._glslang.compileGLSL(defines + shadersForPipelineType[type].vertex, "vertex");
                let fragmentCode = this._glslang.compileGLSL(defines + shadersForPipelineType[type].fragment, "fragment");

                if (this._tintWASM) {
                    vertexCode = this._tintWASM.convertSpirV2WGSL(vertexCode);
                    fragmentCode = this._tintWASM.convertSpirV2WGSL(fragmentCode);
                }

                const vertexModule = this._device.createShaderModule({
                    code: vertexCode,
                });
                const fragmentModule = this._device.createShaderModule({
                    code: fragmentCode,
                });
                modules = this._compiledShaders[index] = [vertexModule, fragmentModule];
            }

            const pipeline = this._device.createRenderPipeline({
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

    private static _GetTextureTypeFromFormat(format: GPUTextureFormat): number {
        switch (format) {
            // One Component = 8 bits
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB10A2Unorm: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RGB9E5UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RG11B10UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.Depth24UnormStencil8: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return Constants.TEXTURETYPE_UNSIGNED_BYTE;

            // One component = 16 bits
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.Depth16Unorm:
                return Constants.TEXTURETYPE_UNSIGNED_SHORT;

            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RGBA16Float:
                return Constants.TEXTURETYPE_HALF_FLOAT;

            // One component = 32 bits
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
                return Constants.TEXTURETYPE_UNSIGNED_INTEGER;

            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.RGBA32Float:
            case WebGPUConstants.TextureFormat.Depth32Float:
                return Constants.TEXTURETYPE_FLOAT;

            case WebGPUConstants.TextureFormat.Stencil8:
                throw "No fixed size for Stencil8 format!";
            case WebGPUConstants.TextureFormat.Depth24Plus:
                throw "No fixed size for Depth24Plus format!";
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                throw "No fixed size for Depth24PlusStencil8 format!";
        }

        return Constants.TEXTURETYPE_UNSIGNED_BYTE;
    }

    private static _GetBlockInformationFromFormat(format: GPUTextureFormat): { width: number; height: number; length: number } {
        switch (format) {
            // 8 bits formats
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
                return { width: 1, height: 1, length: 1 };

            // 16 bits formats
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
                return { width: 1, height: 1, length: 2 };

            // 32 bits formats
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB9E5UFloat:
            case WebGPUConstants.TextureFormat.RGB10A2Unorm:
            case WebGPUConstants.TextureFormat.RG11B10UFloat:
                return { width: 1, height: 1, length: 4 };

            // 64 bits formats
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Float:
                return { width: 1, height: 1, length: 8 };

            // 128 bits formats
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Float:
                return { width: 1, height: 1, length: 16 };

            // Depth and stencil formats
            case WebGPUConstants.TextureFormat.Stencil8:
                throw "No fixed size for Stencil8 format!";
            case WebGPUConstants.TextureFormat.Depth16Unorm:
                return { width: 1, height: 1, length: 2 };
            case WebGPUConstants.TextureFormat.Depth24Plus:
                throw "No fixed size for Depth24Plus format!";
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                throw "No fixed size for Depth24PlusStencil8 format!";
            case WebGPUConstants.TextureFormat.Depth32Float:
                return { width: 1, height: 1, length: 4 };
            case WebGPUConstants.TextureFormat.Depth24UnormStencil8:
                return { width: 1, height: 1, length: 4 };
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
                return { width: 1, height: 1, length: 5 };

            // BC compressed formats usable if "texture-compression-bc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
                return { width: 4, height: 4, length: 16 };

            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
                return { width: 4, height: 4, length: 8 };

            // ETC2 compressed formats usable if "texture-compression-etc2" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
                return { width: 4, height: 4, length: 8 };

            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
                return { width: 4, height: 4, length: 16 };

            // ASTC compressed formats usable if "texture-compression-astc" is both
            // supported by the device/user agent and enabled in requestDevice.
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
                return { width: 4, height: 4, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
                return { width: 5, height: 4, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
                return { width: 5, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
                return { width: 6, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
                return { width: 6, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
                return { width: 8, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
                return { width: 8, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
                return { width: 8, height: 8, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
                return { width: 10, height: 5, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
                return { width: 10, height: 6, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
                return { width: 10, height: 8, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
                return { width: 10, height: 10, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
                return { width: 12, height: 10, length: 16 };
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return { width: 12, height: 12, length: 16 };
        }

        return { width: 1, height: 1, length: 4 };
    }

    private static _IsHardwareTexture(texture: HardwareTextureWrapper | GPUTexture): texture is HardwareTextureWrapper {
        return !!(texture as HardwareTextureWrapper).release;
    }

    private static _IsInternalTexture(texture: InternalTexture | GPUTexture): texture is InternalTexture {
        return !!(texture as InternalTexture).dispose;
    }

    public static IsImageBitmap(imageBitmap: ImageBitmap | { width: number; height: number }): imageBitmap is ImageBitmap {
        return (imageBitmap as ImageBitmap).close !== undefined;
    }

    public static IsImageBitmapArray(imageBitmap: ImageBitmap[] | { width: number; height: number }): imageBitmap is ImageBitmap[] {
        return Array.isArray(imageBitmap as ImageBitmap[]) && (imageBitmap as ImageBitmap[])[0].close !== undefined;
    }

    public setCommandEncoder(encoder: GPUCommandEncoder): void {
        this._commandEncoderForCreation = encoder;
    }

    public static IsCompressedFormat(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return true;
        }

        return false;
    }

    public static GetWebGPUTextureFormat(type: number, format: number, useSRGBBuffer = false): GPUTextureFormat {
        switch (format) {
            case Constants.TEXTUREFORMAT_DEPTH16:
                return WebGPUConstants.TextureFormat.Depth16Unorm;
            case Constants.TEXTUREFORMAT_DEPTH24:
                return WebGPUConstants.TextureFormat.Depth24Plus;
            case Constants.TEXTUREFORMAT_DEPTH24_STENCIL8:
                return WebGPUConstants.TextureFormat.Depth24PlusStencil8;
            case Constants.TEXTUREFORMAT_DEPTH32_FLOAT:
                return WebGPUConstants.TextureFormat.Depth32Float;
            case Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8:
                return WebGPUConstants.TextureFormat.Depth24UnormStencil8;
            case Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8:
                return WebGPUConstants.TextureFormat.Depth32FloatStencil8;

            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC7RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBUFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_BPTC_SIGNED_FLOAT:
                return WebGPUConstants.TextureFormat.BC6HRGBFloat;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC3RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC2RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB : WebGPUConstants.TextureFormat.BC1RGBAUnorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB : WebGPUConstants.TextureFormat.ASTC4x4Unorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB : WebGPUConstants.TextureFormat.ETC2RGB8Unorm;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                return useSRGBBuffer ? WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB : WebGPUConstants.TextureFormat.ETC2RGBA8Unorm;
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
                        return useSRGBBuffer ? WebGPUConstants.TextureFormat.RGBA8UnormSRGB : WebGPUConstants.TextureFormat.RGBA8Unorm;
                    case Constants.TEXTUREFORMAT_BGRA:
                        return useSRGBBuffer ? WebGPUConstants.TextureFormat.BGRA8UnormSRGB : WebGPUConstants.TextureFormat.BGRA8Unorm;
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

        return useSRGBBuffer ? WebGPUConstants.TextureFormat.RGBA8UnormSRGB : WebGPUConstants.TextureFormat.RGBA8Unorm;
    }

    public static GetNumChannelsFromWebGPUTextureFormat(format: GPUTextureFormat): number {
        switch (format) {
            case WebGPUConstants.TextureFormat.R8Unorm:
            case WebGPUConstants.TextureFormat.R8Snorm:
            case WebGPUConstants.TextureFormat.R8Uint:
            case WebGPUConstants.TextureFormat.R8Sint:
            case WebGPUConstants.TextureFormat.BC4RUnorm:
            case WebGPUConstants.TextureFormat.BC4RSnorm:
            case WebGPUConstants.TextureFormat.R16Uint:
            case WebGPUConstants.TextureFormat.R16Sint:
            case WebGPUConstants.TextureFormat.Depth16Unorm:
            case WebGPUConstants.TextureFormat.R16Float:
            case WebGPUConstants.TextureFormat.R32Uint:
            case WebGPUConstants.TextureFormat.R32Sint:
            case WebGPUConstants.TextureFormat.R32Float:
            case WebGPUConstants.TextureFormat.Depth32Float:
            case WebGPUConstants.TextureFormat.Stencil8:
            case WebGPUConstants.TextureFormat.Depth24Plus:
            case WebGPUConstants.TextureFormat.EACR11Unorm:
            case WebGPUConstants.TextureFormat.EACR11Snorm:
                return 1;

            case WebGPUConstants.TextureFormat.RG8Unorm:
            case WebGPUConstants.TextureFormat.RG8Snorm:
            case WebGPUConstants.TextureFormat.RG8Uint:
            case WebGPUConstants.TextureFormat.RG8Sint:
            case WebGPUConstants.TextureFormat.Depth24UnormStencil8: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.BC5RGUnorm:
            case WebGPUConstants.TextureFormat.BC5RGSnorm:
            case WebGPUConstants.TextureFormat.RG16Uint:
            case WebGPUConstants.TextureFormat.RG16Sint:
            case WebGPUConstants.TextureFormat.RG16Float:
            case WebGPUConstants.TextureFormat.RG32Uint:
            case WebGPUConstants.TextureFormat.RG32Sint:
            case WebGPUConstants.TextureFormat.RG32Float:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
            case WebGPUConstants.TextureFormat.EACRG11Unorm:
            case WebGPUConstants.TextureFormat.EACRG11Snorm:
                return 2;

            case WebGPUConstants.TextureFormat.RGB9E5UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.RG11B10UFloat: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.BC6HRGBUFloat:
            case WebGPUConstants.TextureFormat.BC6HRGBFloat:
            case WebGPUConstants.TextureFormat.ETC2RGB8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8UnormSRGB:
                return 3;

            case WebGPUConstants.TextureFormat.RGBA8Unorm:
            case WebGPUConstants.TextureFormat.RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA8Snorm:
            case WebGPUConstants.TextureFormat.RGBA8Uint:
            case WebGPUConstants.TextureFormat.RGBA8Sint:
            case WebGPUConstants.TextureFormat.BGRA8Unorm:
            case WebGPUConstants.TextureFormat.BGRA8UnormSRGB:
            case WebGPUConstants.TextureFormat.RGB10A2Unorm: // composite format - let's say it's byte...
            case WebGPUConstants.TextureFormat.BC7RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC7RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC3RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC3RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC2RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC2RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.BC1RGBAUnorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
            case WebGPUConstants.TextureFormat.RGBA16Uint:
            case WebGPUConstants.TextureFormat.RGBA16Sint:
            case WebGPUConstants.TextureFormat.RGBA16Float:
            case WebGPUConstants.TextureFormat.RGBA32Uint:
            case WebGPUConstants.TextureFormat.RGBA32Sint:
            case WebGPUConstants.TextureFormat.RGBA32Float:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGB8A1UnormSRGB:
            case WebGPUConstants.TextureFormat.ETC2RGBA8Unorm:
            case WebGPUConstants.TextureFormat.ETC2RGBA8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC4x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC4x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x4Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x4UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC5x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC5x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC6x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC6x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC8x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC8x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x5Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x5UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x6Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x6UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x8Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x8UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC10x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC10x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x10Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x10UnormSRGB:
            case WebGPUConstants.TextureFormat.ASTC12x12Unorm:
            case WebGPUConstants.TextureFormat.ASTC12x12UnormSRGB:
                return 4;
        }

        throw `Unknown format ${format}!`;
    }

    public static HasStencilAspect(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.Stencil8:
            case WebGPUConstants.TextureFormat.Depth24UnormStencil8:
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return true;
        }

        return false;
    }

    public static HasDepthAndStencilAspects(format: GPUTextureFormat): boolean {
        switch (format) {
            case WebGPUConstants.TextureFormat.Depth24UnormStencil8:
            case WebGPUConstants.TextureFormat.Depth32FloatStencil8:
            case WebGPUConstants.TextureFormat.Depth24PlusStencil8:
                return true;
        }

        return false;
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

        commandEncoder!.pushDebugGroup?.(`internal process texture - invertY=${invertY} premultiplyAlpha=${premultiplyAlpha}`);

        let gpuTexture: Nullable<GPUTexture>;
        if (WebGPUTextureHelper._IsHardwareTexture(gpuOrHdwTexture)) {
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
                WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.TextureBinding
            );

        const renderPassDescriptor = webgpuHardwareTexture?._copyInvertYRenderPassDescr ?? {
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
                width,
                height,
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

        commandEncoder!.popDebugGroup?.();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public copyWithInvertY(srcTextureView: GPUTextureView, format: GPUTextureFormat, renderPassDescriptor: GPURenderPassDescriptor, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const [pipeline, bindGroupLayout] = this._getPipeline(format, PipelineType.InvertYPremultiplyAlpha, { invertY: true, premultiplyAlpha: false });

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup?.(`internal copy texture with invertY`);

        const passEncoder = commandEncoder!.beginRenderPass(renderPassDescriptor);

        const bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: srcTextureView,
                },
            ],
        });

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4, 1, 0, 0);
        passEncoder.end();

        commandEncoder!.popDebugGroup?.();

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
        additionalUsages = 0
    ): GPUTexture {
        if (sampleCount > 1) {
            // WebGPU only supports 1 or 4
            sampleCount = 4;
        }

        const layerCount = (imageBitmap as any).layers || 1;
        const textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depthOrArrayLayers: layerCount,
        };

        const isCompressedFormat = WebGPUTextureHelper.IsCompressedFormat(format);
        const mipLevelCount = hasMipmaps ? WebGPUTextureHelper.ComputeNumMipmapLevels(imageBitmap.width, imageBitmap.height) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.TextureBinding;
        additionalUsages |= hasMipmaps && !isCompressedFormat ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.RenderAttachment : 0;

        if (!isCompressedFormat && !is3D) {
            // we don't know in advance if the texture will be updated with copyExternalImageToTexture (which requires to have those flags), so we need to force the flags all the times
            additionalUsages |= WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopyDst;
        }

        const gpuTexture = this._device.createTexture({
            label: `Texture_${textureSize.width}x${textureSize.height}x${textureSize.depthOrArrayLayers}_${hasMipmaps ? "wmips" : "womips"}_${format}_samples${sampleCount}`,
            size: textureSize,
            dimension: is3D ? WebGPUConstants.TextureDimension.E3d : WebGPUConstants.TextureDimension.E2d,
            format,
            usage: usages | additionalUsages,
            sampleCount,
            mipLevelCount,
        });

        if (WebGPUTextureHelper.IsImageBitmap(imageBitmap)) {
            this.updateTexture(imageBitmap, gpuTexture, imageBitmap.width, imageBitmap.height, layerCount, format, 0, 0, invertY, premultiplyAlpha, 0, 0);

            if (hasMipmaps && generateMipmaps) {
                this.generateMipmaps(gpuTexture, format, mipLevelCount, 0, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public createCubeTexture(
        imageBitmaps: ImageBitmap[] | { width: number; height: number },
        hasMipmaps = false,
        generateMipmaps = false,
        invertY = false,
        premultiplyAlpha = false,
        format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm,
        sampleCount = 1,
        commandEncoder?: GPUCommandEncoder,
        usage = -1,
        additionalUsages = 0
    ): GPUTexture {
        if (sampleCount > 1) {
            // WebGPU only supports 1 or 4
            sampleCount = 4;
        }

        const width = WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps) ? imageBitmaps[0].width : imageBitmaps.width;
        const height = WebGPUTextureHelper.IsImageBitmapArray(imageBitmaps) ? imageBitmaps[0].height : imageBitmaps.height;

        const isCompressedFormat = WebGPUTextureHelper.IsCompressedFormat(format);
        const mipLevelCount = hasMipmaps ? WebGPUTextureHelper.ComputeNumMipmapLevels(width, height) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.TextureBinding;
        additionalUsages |= hasMipmaps && !isCompressedFormat ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.RenderAttachment : 0;

        if (!isCompressedFormat) {
            // we don't know in advance if the texture will be updated with copyExternalImageToTexture (which requires to have those flags), so we need to force the flags all the times
            additionalUsages |= WebGPUConstants.TextureUsage.RenderAttachment | WebGPUConstants.TextureUsage.CopyDst;
        }

        const gpuTexture = this._device.createTexture({
            label: `TextureCube_${width}x${height}x6_${hasMipmaps ? "wmips" : "womips"}_${format}_samples${sampleCount}`,
            size: {
                width,
                height,
                depthOrArrayLayers: 6,
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
                this.generateCubeMipmaps(gpuTexture, format, mipLevelCount, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public generateCubeMipmaps(gpuTexture: GPUTexture | WebGPUHardwareTexture, format: GPUTextureFormat, mipLevelCount: number, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup?.(`create cube mipmaps - ${mipLevelCount} levels`);

        for (let f = 0; f < 6; ++f) {
            this.generateMipmaps(gpuTexture, format, mipLevelCount, f, commandEncoder);
        }

        commandEncoder!.popDebugGroup?.();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public generateMipmaps(
        gpuOrHdwTexture: GPUTexture | WebGPUHardwareTexture,
        format: GPUTextureFormat,
        mipLevelCount: number,
        faceIndex = 0,
        commandEncoder?: GPUCommandEncoder
    ): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const [pipeline, bindGroupLayout] = this._getPipeline(format);

        faceIndex = Math.max(faceIndex, 0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup?.(`create mipmaps for face #${faceIndex} - ${mipLevelCount} levels`);

        let gpuTexture: Nullable<GPUTexture>;
        if (WebGPUTextureHelper._IsHardwareTexture(gpuOrHdwTexture)) {
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

        const webgpuHardwareTexture = gpuOrHdwTexture as Nullable<WebGPUHardwareTexture>;
        for (let i = 1; i < mipLevelCount; ++i) {
            const renderPassDescriptor = webgpuHardwareTexture?._mipmapGenRenderPassDescr[faceIndex]?.[i - 1] ?? {
                colorAttachments: [
                    {
                        view: gpuTexture.createView({
                            format,
                            dimension: WebGPUConstants.TextureViewDimension.E2d,
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
                            resource: this._mipmapSampler,
                        },
                        {
                            binding: 1,
                            resource: gpuTexture.createView({
                                format,
                                dimension: WebGPUConstants.TextureViewDimension.E2d,
                                baseMipLevel: i - 1,
                                mipLevelCount: 1,
                                arrayLayerCount: 1,
                                baseArrayLayer: faceIndex,
                            }),
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

        commandEncoder!.popDebugGroup?.();

        if (useOwnCommandEncoder) {
            this._device.queue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public createGPUTextureForInternalTexture(texture: InternalTexture, width?: number, height?: number, depth?: number, creationFlags?: number): WebGPUHardwareTexture {
        if (!texture._hardwareTexture) {
            texture._hardwareTexture = new WebGPUHardwareTexture();
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

        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const isStorageTexture = ((creationFlags ?? 0) & Constants.TEXTURE_CREATIONFLAG_STORAGE) !== 0;

        gpuTextureWrapper.format = WebGPUTextureHelper.GetWebGPUTextureFormat(texture.type, texture.format, texture._useSRGBBuffer);

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
            mipmapCount = hasMipMaps ? WebGPUTextureHelper.ComputeNumMipmapLevels(width!, height!) : 1;
        }

        if (texture.isCube) {
            const gpuTexture = this.createCubeTexture(
                { width, height },
                texture.generateMipMaps,
                texture.generateMipMaps,
                texture.invertY,
                false,
                gpuTextureWrapper.format,
                1,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages
            );

            gpuTextureWrapper.set(gpuTexture);
            gpuTextureWrapper.createView(
                {
                    format: gpuTextureWrapper.format,
                    dimension: WebGPUConstants.TextureViewDimension.Cube,
                    mipLevelCount: mipmapCount,
                    baseArrayLayer: 0,
                    baseMipLevel: 0,
                    arrayLayerCount: 6,
                    aspect: WebGPUTextureHelper.HasDepthAndStencilAspects(gpuTextureWrapper.format) ? WebGPUConstants.TextureAspect.DepthOnly : WebGPUConstants.TextureAspect.All,
                },
                isStorageTexture
            );
        } else {
            const gpuTexture = this.createTexture(
                { width, height, layers: layerCount },
                texture.generateMipMaps,
                texture.generateMipMaps,
                texture.invertY,
                false,
                texture.is3D,
                gpuTextureWrapper.format,
                1,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages
            );

            gpuTextureWrapper.set(gpuTexture);
            gpuTextureWrapper.createView(
                {
                    format: gpuTextureWrapper.format,
                    dimension: texture.is2DArray
                        ? WebGPUConstants.TextureViewDimension.E2dArray
                        : texture.is3D
                        ? WebGPUConstants.TextureDimension.E3d
                        : WebGPUConstants.TextureViewDimension.E2d,
                    mipLevelCount: mipmapCount,
                    baseArrayLayer: 0,
                    baseMipLevel: 0,
                    arrayLayerCount: texture.is3D ? 1 : layerCount,
                    aspect: WebGPUTextureHelper.HasDepthAndStencilAspects(gpuTextureWrapper.format) ? WebGPUConstants.TextureAspect.DepthOnly : WebGPUConstants.TextureAspect.All,
                },
                isStorageTexture
            );
        }

        texture.width = texture.baseWidth = width;
        texture.height = texture.baseHeight = height;
        texture.depth = texture.baseDepth = depth;

        this.createMSAATexture(texture, texture.samples);

        return gpuTextureWrapper;
    }

    public createMSAATexture(texture: InternalTexture, samples: number): void {
        const gpuTextureWrapper = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        if (gpuTextureWrapper?.msaaTexture) {
            this.releaseTexture(gpuTextureWrapper.msaaTexture);
            gpuTextureWrapper.msaaTexture = null;
        }

        if (!gpuTextureWrapper || (samples ?? 1) <= 1) {
            return;
        }

        const width = texture.width;
        const height = texture.height;
        const layerCount = texture.depth || 1;

        if (texture.isCube) {
            const gpuMSAATexture = this.createCubeTexture(
                { width, height },
                false,
                false,
                texture.invertY,
                false,
                gpuTextureWrapper.format,
                samples,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages
            );
            gpuTextureWrapper.msaaTexture = gpuMSAATexture;
        } else {
            const gpuMSAATexture = this.createTexture(
                { width, height, layers: layerCount },
                false,
                false,
                texture.invertY,
                false,
                texture.is3D,
                gpuTextureWrapper.format,
                samples,
                this._commandEncoderForCreation,
                gpuTextureWrapper.textureUsages,
                gpuTextureWrapper.textureAdditionalUsages
            );
            gpuTextureWrapper.msaaTexture = gpuMSAATexture;
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
        imageBitmap: ImageBitmap | Uint8Array | HTMLCanvasElement | OffscreenCanvas,
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
        const gpuTexture = WebGPUTextureHelper._IsInternalTexture(texture) ? (texture._hardwareTexture as WebGPUHardwareTexture).underlyingResource! : texture;
        const blockInformation = WebGPUTextureHelper._GetBlockInformationFromFormat(format);
        const gpuOrHdwTexture = WebGPUTextureHelper._IsInternalTexture(texture) ? (texture._hardwareTexture as WebGPUHardwareTexture) : texture;

        const textureCopyView: GPUImageCopyTextureTagged = {
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

                const buffer = this._bufferManager.createRawBuffer(imageBitmap.byteLength, WebGPUConstants.BufferUsage.MapWrite | WebGPUConstants.BufferUsage.CopySrc, true);

                const arrayBuffer = buffer.getMappedRange();

                new Uint8Array(arrayBuffer).set(imageBitmap);

                buffer.unmap();

                commandEncoder!.copyBufferToTexture(
                    {
                        buffer: buffer,
                        offset: 0,
                        bytesPerRow,
                        rowsPerImage: height,
                    },
                    textureCopyView,
                    textureExtent
                );

                this._device.queue.submit([commandEncoder!.finish()]);

                this._bufferManager.releaseBuffer(buffer);
            } else {
                this._device.queue.writeTexture(
                    textureCopyView,
                    imageBitmap,
                    {
                        offset: 0,
                        bytesPerRow,
                        rowsPerImage: height,
                    },
                    textureExtent
                );
            }

            if (invertY || premultiplyAlpha) {
                if (WebGPUTextureHelper._IsInternalTexture(texture)) {
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
                    throw "updateTexture: Can't process the texture data because a GPUTexture was provided instead of an InternalTexture!";
                }
            }
        } else {
            imageBitmap = imageBitmap as ImageBitmap | HTMLCanvasElement | OffscreenCanvas;

            if (invertY) {
                textureCopyView.premultipliedAlpha = false; // we are going to handle premultiplyAlpha ourselves

                // we must preprocess the image
                if (WebGPUTextureHelper._IsInternalTexture(texture) && offsetX === 0 && offsetY === 0 && width === texture.width && height === texture.height) {
                    // optimization when the source image is the same size than the destination texture and offsets X/Y == 0:
                    // we simply copy the source to the destination and we apply the preprocessing on the destination
                    this._device.queue.copyExternalImageToTexture({ source: imageBitmap }, textureCopyView, textureExtent);

                    this.invertYPreMultiplyAlpha(
                        gpuOrHdwTexture,
                        width,
                        height,
                        format,
                        invertY,
                        premultiplyAlpha,
                        faceIndex,
                        mipLevel,
                        layers || 1,
                        0,
                        0,
                        0,
                        0,
                        undefined,
                        allowGPUOptimization
                    );
                } else {
                    // we must apply the preprocessing on the source image before copying it into the destination texture
                    const commandEncoder = this._device.createCommandEncoder({});

                    // create a temp texture and copy the image to it
                    const srcTexture = this.createTexture(
                        { width, height, layers: 1 },
                        false,
                        false,
                        false,
                        false,
                        false,
                        format,
                        1,
                        commandEncoder,
                        WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.TextureBinding
                    );

                    this._deferredReleaseTextures.push([srcTexture, null]);

                    textureExtent.depthOrArrayLayers = 1;
                    this._device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture: srcTexture }, textureExtent);
                    textureExtent.depthOrArrayLayers = layers || 1;

                    // apply the preprocessing to this temp texture
                    this.invertYPreMultiplyAlpha(
                        srcTexture,
                        width,
                        height,
                        format,
                        invertY,
                        premultiplyAlpha,
                        faceIndex,
                        mipLevel,
                        layers || 1,
                        0,
                        0,
                        0,
                        0,
                        commandEncoder,
                        allowGPUOptimization
                    );

                    // copy the temp texture to the destination texture
                    commandEncoder.copyTextureToTexture({ texture: srcTexture }, textureCopyView, textureExtent);

                    this._device.queue.submit([commandEncoder!.finish()]);
                }
            } else {
                // no preprocessing: direct copy to destination texture
                this._device.queue.copyExternalImageToTexture({ source: imageBitmap }, textureCopyView, textureExtent);
            }
        }
    }

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
        const blockInformation = WebGPUTextureHelper._GetBlockInformationFromFormat(format);

        const bytesPerRow = Math.ceil(width / blockInformation.width) * blockInformation.length;

        const bytesPerRowAligned = Math.ceil(bytesPerRow / 256) * 256;

        const size = bytesPerRowAligned * height;

        const gpuBuffer = this._bufferManager.createRawBuffer(size, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst);

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

        this._device.queue.submit([commandEncoder!.finish()]);

        return this._bufferManager.readDataFromBuffer(
            gpuBuffer,
            size,
            width,
            height,
            bytesPerRow,
            bytesPerRowAligned,
            WebGPUTextureHelper._GetTextureTypeFromFormat(format),
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
        if (WebGPUTextureHelper._IsInternalTexture(texture)) {
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
                if (WebGPUTextureHelper._IsHardwareTexture(hardwareTexture)) {
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
