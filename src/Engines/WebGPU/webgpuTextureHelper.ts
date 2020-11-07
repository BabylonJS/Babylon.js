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
import * as WebGPUConstants from './webgpuConstants';
import { Scalar } from '../../Maths/math.scalar';
import { WebGPUBufferManager } from './webgpuBufferManager';
import { Constants } from '../constants';
import { Nullable } from '../../types';
import { InternalTexture } from '../../Materials/Textures/internalTexture';
import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { BaseTexture } from '../../Materials/Textures/baseTexture';

// TODO WEBGPU improve mipmap generation by not using the OutputAttachment flag
// see https://github.com/toji/web-texture-tool/tree/main/src

// TODO WEBGPU optimize, don't recreate things that can be cached (bind groups, descriptors, etc)

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
    const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
    const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

    layout(location = 0) out vec2 vTex;

    void main() {
        vTex = tex[gl_VertexIndex];
    #ifdef INVERTY
        vTex.y = 1.0 - vTex.y;
    #endif
        gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
    }
    `;

const invertYPreMultiplyAlphaFragmentSource = `
    layout(set = 0, binding = 0) uniform sampler imgSampler;
    layout(set = 0, binding = 1) uniform texture2D img;

    layout(location = 0) in vec2 vTex;
    layout(location = 0) out vec4 outColor;

    void main() {
        vec4 color = texture(sampler2D(img, imgSampler), vTex);
    #ifdef PREMULTIPLYALPHA
        color.rgb *= color.a;
    #endif
        outColor = color;
    }
    `;

export class WebGPUTextureHelper {

    private _device: GPUDevice;
    private _glslang: any;
    private _bufferManager: WebGPUBufferManager;
    private _mipmapSampler: GPUSampler;
    private _invertYPreMultiplyAlphaSampler: GPUSampler;
    private _pipelines: { [format: string]: Array<GPURenderPipeline> } = {};
    private _compiledShaders: GPUShaderModule[][] = [];
    private _deferredReleaseTextures: Array<[Nullable<InternalTexture>, Nullable<HardwareTextureWrapper | GPUTexture>, Nullable<BaseTexture>, Nullable<InternalTexture>]> = [];

    public static computeNumMipmapLevels(width: number, height: number) {
        return Scalar.ILog2(Math.max(width, height)) + 1;
    }

    constructor(device: GPUDevice, glslang: any, bufferManager: WebGPUBufferManager) {
        this._device = device;
        this._glslang = glslang;
        this._bufferManager = bufferManager;

        this._mipmapSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Linear });
        this._invertYPreMultiplyAlphaSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Nearest, magFilter: WebGPUConstants.FilterMode.Nearest });

        this._getPipeline(WebGPUConstants.TextureFormat.RGBA8Unorm);
    }

    private _getPipeline(format: GPUTextureFormat, forMipMap = true, invertY = false, premultiplyAlpha = false): GPURenderPipeline {
        const index = (forMipMap ? 1 : 0) + ((invertY ? 1 : 0) << 1) + (premultiplyAlpha ? 1 : 0) << 2;
        if (!this._pipelines[format]) {
            this._pipelines[format] = [];
        }
        let pipeline = this._pipelines[format][index];
        if (!pipeline) {
            let defines = "#version 450\r\n";
            if (invertY) {
                defines += "#define INVERTY\r\n";
            }
            if (premultiplyAlpha) {
                defines += "define PREMULTIPLYALPHA\r\n";
            }
            let modules = this._compiledShaders[index];
            if (!modules) {
                const vertexModule = this._device.createShaderModule({
                    code: this._glslang.compileGLSL(forMipMap ? defines + mipmapVertexSource : defines + invertYPreMultiplyAlphaVertexSource, 'vertex')
                });
                const fragmentModule = this._device.createShaderModule({
                    code: this._glslang.compileGLSL(forMipMap ? defines + mipmapFragmentSource : defines + invertYPreMultiplyAlphaFragmentSource, 'fragment')
                });
                modules = this._compiledShaders[index] = [vertexModule, fragmentModule];
            }
            pipeline = this._pipelines[format][index] = this._device.createRenderPipeline({
                vertexStage: {
                    module: modules[0],
                    entryPoint: 'main'
                },
                fragmentStage: {
                    module: modules[1],
                    entryPoint: 'main'
                },
                primitiveTopology: WebGPUConstants.PrimitiveTopology.TriangleStrip,
                vertexState: {
                    indexFormat: WebGPUConstants.IndexFormat.Uint16
                },
                colorStates: [{
                    format,
                }]
            });
        }
        return pipeline;
    }

    private _isHardwareTexture(texture: HardwareTextureWrapper | GPUTexture): texture is HardwareTextureWrapper {
        return !!(texture as HardwareTextureWrapper).release;
    }

    public isImageBitmap(imageBitmap: ImageBitmap | { width: number, height: number }): imageBitmap is ImageBitmap {
        return (imageBitmap as ImageBitmap).close !== undefined;
    }

    public isImageBitmapArray(imageBitmap: ImageBitmap[] | { width: number, height: number }): imageBitmap is ImageBitmap[] {
        return Array.isArray(imageBitmap as ImageBitmap[]) && (imageBitmap as ImageBitmap[])[0].close !== undefined;
    }

    public isCompressedFormat(format: GPUTextureFormat): boolean {
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
            case WebGPUConstants.TextureFormat.BC1RGBAUNorm:
                return true;
        }

        return false;
    }

    public createTexture(imageBitmap: ImageBitmap | { width: number, height: number, layers: number }, hasMipmaps = false, generateMipmaps = false, invertY = false, premultiplyAlpha = false, is3D = false, format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm,
        sampleCount = 1, commandEncoder?: GPUCommandEncoder, usage = -1): GPUTexture
    {
        const layerCount = (imageBitmap as any).layers || 1;
        let textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depth: layerCount,
        };

        const mipLevelCount = hasMipmaps ? WebGPUTextureHelper.computeNumMipmapLevels(imageBitmap.width, imageBitmap.height) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.Sampled;
        const additionalUsages = hasMipmaps && !this.isCompressedFormat(format) ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.OutputAttachment : 0;

        const gpuTexture = this._device.createTexture({
            size: textureSize,
            dimension: is3D ? WebGPUConstants.TextureDimension.E3d : WebGPUConstants.TextureDimension.E2d,
            format,
            usage:  usages | additionalUsages,
            sampleCount,
            mipLevelCount
        });

        if (this.isImageBitmap(imageBitmap)) {
            this.updateTexture(imageBitmap, gpuTexture, imageBitmap.width, imageBitmap.height, layerCount, format, 0, 0, invertY, premultiplyAlpha, 0, 0, commandEncoder);

            if (hasMipmaps && generateMipmaps) {
                this.generateMipmaps(gpuTexture, format, mipLevelCount, 0, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public createCubeTexture(imageBitmaps: ImageBitmap[] | { width: number, height: number }, hasMipmaps = false, generateMipmaps = false, invertY = false, premultiplyAlpha = false, format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm,
        sampleCount = 1, commandEncoder?: GPUCommandEncoder, usage = -1): GPUTexture
    {
        const width = this.isImageBitmapArray(imageBitmaps) ? imageBitmaps[0].width : imageBitmaps.width;
        const height = this.isImageBitmapArray(imageBitmaps) ? imageBitmaps[0].height : imageBitmaps.height;

        const mipLevelCount = hasMipmaps ? WebGPUTextureHelper.computeNumMipmapLevels(width, height) : 1;
        const usages = usage >= 0 ? usage : WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.Sampled;
        const additionalUsages = hasMipmaps && !this.isCompressedFormat(format) ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.OutputAttachment : 0;

        const gpuTexture = this._device.createTexture({
            size: {
                width,
                height,
                depth: 6,
            },
            dimension: WebGPUConstants.TextureDimension.E2d,
            format,
            usage: usages | additionalUsages,
            sampleCount,
            mipLevelCount
        });

        if (this.isImageBitmapArray(imageBitmaps)) {
            this.updateCubeTextures(imageBitmaps, gpuTexture, width, height, format, invertY, premultiplyAlpha, 0, 0, commandEncoder);

            if (hasMipmaps && generateMipmaps) {
                this.generateCubeMipmaps(gpuTexture, format, mipLevelCount, commandEncoder);
            }
        }

        return gpuTexture;
    }

    public generateCubeMipmaps(gpuTexture: GPUTexture, format: GPUTextureFormat, mipLevelCount: number, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`create cube mipmaps - ${mipLevelCount} levels`);

        for (let f = 0; f < 6; ++f) {
            this.generateMipmaps(gpuTexture, format, mipLevelCount, f, commandEncoder);
        }

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.defaultQueue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public invertYPreMultiplyAlpha(gpuTexture: GPUTexture, width: number, height: number, format: GPUTextureFormat, invertY = false, premultiplyAlpha = false, faceIndex= 0, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const pipeline = this._getPipeline(format, false, invertY, premultiplyAlpha);
        const bindGroupLayout = pipeline.getBindGroupLayout(0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`internal process texture - invertY=${invertY} premultiplyAlpha=${premultiplyAlpha}`);

        const outputTexture = this.createTexture({ width, height, layers: 1 }, false, false, false, false, false, format, 1, commandEncoder, WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.OutputAttachment | WebGPUConstants.TextureUsage.Sampled);

        const passEncoder = commandEncoder!.beginRenderPass({
            colorAttachments: [{
                attachment: outputTexture.createView({
                    dimension: WebGPUConstants.TextureViewDimension.E2d,
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                    arrayLayerCount: 1,
                    baseArrayLayer: 0,
                }),
                loadValue: WebGPUConstants.LoadOp.Load,
            }],
        });

        const bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: this._invertYPreMultiplyAlphaSampler,
            }, {
                binding: 1,
                resource: gpuTexture.createView({
                    dimension: WebGPUConstants.TextureViewDimension.E2d,
                    baseMipLevel: 0,
                    mipLevelCount: 1,
                    arrayLayerCount: 1,
                    baseArrayLayer: faceIndex,
                }),
            }],
        });

        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(4, 1, 0, 0);
        passEncoder.endPass();

        commandEncoder!.copyTextureToTexture({
                texture: outputTexture,
            }, {
                texture: gpuTexture,
                origin: {
                    x: 0,
                    y: 0,
                    z: Math.max(faceIndex, 0),
                }
            }, {
                width,
                height,
                depth: 1,
            }
        );

        this._deferredReleaseTextures.push([null, outputTexture, null, null]);

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.defaultQueue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public generateMipmaps(gpuTexture: GPUTexture, format: GPUTextureFormat, mipLevelCount: number, faceIndex= 0, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const pipeline = this._getPipeline(format);
        const bindGroupLayout = pipeline.getBindGroupLayout(0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        commandEncoder!.pushDebugGroup(`create mipmaps for face #${faceIndex} - ${mipLevelCount} levels`);

        for (let i = 1; i < mipLevelCount; ++i) {
            const passEncoder = commandEncoder!.beginRenderPass({
                colorAttachments: [{
                    attachment: gpuTexture.createView({
                        dimension: WebGPUConstants.TextureViewDimension.E2d,
                        baseMipLevel: i,
                        mipLevelCount: 1,
                        arrayLayerCount: 1,
                        baseArrayLayer: faceIndex,
                    }),
                    loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                }],
            });

            const bindGroup = this._device.createBindGroup({
                layout: bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: this._mipmapSampler,
                }, {
                    binding: 1,
                    resource: gpuTexture.createView({
                        dimension: WebGPUConstants.TextureViewDimension.E2d,
                        baseMipLevel: i - 1,
                        mipLevelCount: 1,
                        arrayLayerCount: 1,
                        baseArrayLayer: faceIndex,
                    }),
                }],
            });

            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4, 1, 0, 0);
            passEncoder.endPass();
        }

        commandEncoder!.popDebugGroup();

        if (useOwnCommandEncoder) {
            this._device.defaultQueue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    private _getTextureTypeFromFormat(format: GPUTextureFormat): number {
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
            case WebGPUConstants.TextureFormat.BC1RGBAUNorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
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

    private _getBlockInformationFromFormat(format: GPUTextureFormat): { width: number, height: number, length: number } {
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
            case WebGPUConstants.TextureFormat.BC1RGBAUNorm:
            case WebGPUConstants.TextureFormat.BC1RGBAUnormSRGB:
                return { width: 4, height: 4, length: 8 };
        }

        return { width: 1, height: 1, length: 4 };
    }

    public updateCubeTextures(imageBitmaps: ImageBitmap[] | Uint8Array[], gpuTexture: GPUTexture, width: number, height: number, format: GPUTextureFormat, invertY = false, premultiplyAlpha = false, offsetX = 0, offsetY = 0,
        commandEncoder?: GPUCommandEncoder): void {
        const faces = [0, 3, 1, 4, 2, 5];

        for (let f = 0; f < faces.length; ++f) {
            let imageBitmap = imageBitmaps[faces[f]];

            this.updateTexture(imageBitmap, gpuTexture, width, height, 1, format, f, 0, invertY, premultiplyAlpha, offsetX, offsetY, commandEncoder);
        }
    }

    public updateTexture(imageBitmap: ImageBitmap | Uint8Array, gpuTexture: GPUTexture, width: number, height: number, layers: number, format: GPUTextureFormat, faceIndex: number = 0, mipLevel: number = 0, invertY = false, premultiplyAlpha = false, offsetX = 0, offsetY = 0,
        commandEncoder?: GPUCommandEncoder): void
    {
        const useOwnCommandEncoder = commandEncoder === undefined;

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

        const blockInformation = this._getBlockInformationFromFormat(format);

        const textureCopyView: GPUTextureCopyView = {
            texture: gpuTexture,
            origin: {
                x: offsetX,
                y: offsetY,
                z: Math.max(faceIndex, 0)
            },
            mipLevel: mipLevel
        };

        const textureExtent = {
            width: Math.ceil(width / blockInformation.width) * blockInformation.width,
            height: Math.ceil(height / blockInformation.height) * blockInformation.height,
            depth: layers || 1
        };

        if ((imageBitmap as Uint8Array).byteLength !== undefined) {
            imageBitmap = imageBitmap as Uint8Array;

            const bytesPerRow = Math.ceil(width / blockInformation.width) * blockInformation.length;
            const aligned = Math.ceil(bytesPerRow / 256) * 256 === bytesPerRow;

            if (aligned) {
                const buffer = this._bufferManager.createRawBuffer(imageBitmap.byteLength, GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC, true);

                const arrayBuffer = buffer.getMappedRange();

                new Uint8Array(arrayBuffer).set(imageBitmap);

                buffer.unmap();

                commandEncoder!.copyBufferToTexture({
                    buffer: buffer,
                    offset: 0,
                    bytesPerRow
                }, textureCopyView, textureExtent);

                if (useOwnCommandEncoder) {
                    this._device.defaultQueue.submit([commandEncoder!.finish()]);
                    commandEncoder = null as any;
                }

                this._bufferManager.releaseBuffer(buffer);
            } else {
                this._device.defaultQueue.writeTexture(textureCopyView, imageBitmap, {
                    offset: 0,
                    bytesPerRow
                }, textureExtent);
            }

            if (invertY || premultiplyAlpha) {
                this.invertYPreMultiplyAlpha(gpuTexture, width, height, format, invertY, premultiplyAlpha, faceIndex, commandEncoder);
            }
        } else {
            imageBitmap = imageBitmap as ImageBitmap;

            if (invertY || premultiplyAlpha) {
                createImageBitmap(imageBitmap, { imageOrientation: invertY ? "flipY" : "none", premultiplyAlpha: premultiplyAlpha ? "premultiply" : "none" }).then((imageBitmap) => {
                    this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, textureCopyView, textureExtent);
                });
            } else {
                this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, textureCopyView, textureExtent);
            }
        }
    }

    public readPixels(texture: GPUTexture, x: number, y: number, width: number, height: number, format: GPUTextureFormat, faceIndex: number = 0, mipLevel: number = 0, buffer: Nullable<ArrayBufferView> = null): Promise<ArrayBufferView> {
        const blockInformation = this._getBlockInformationFromFormat(format);

        const bytesPerRow = Math.ceil(width / blockInformation.width) * blockInformation.length;

        const bytesPerRowAligned = Math.ceil(bytesPerRow / 256) * 256;

        const size = bytesPerRowAligned * height;

        const gpuBuffer = this._bufferManager.createRawBuffer(size, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

        const commandEncoder = this._device.createCommandEncoder({});

        commandEncoder.copyTextureToBuffer({
            texture,
            mipLevel,
            origin: {
                x,
                y,
                z: Math.max(faceIndex, 0)
            }
        }, {
            buffer: gpuBuffer,
            offset: 0,
            bytesPerRow: bytesPerRowAligned
        }, {
            width,
            height,
            depth: 1
        });

        this._device.defaultQueue.submit([commandEncoder!.finish()]);

        const type = this._getTextureTypeFromFormat(format);
        const floatFormat = type === Constants.TEXTURETYPE_FLOAT ? 2 : type === Constants.TEXTURETYPE_HALF_FLOAT ? 1 : 0;

        return this._bufferManager.readDataFromBuffer(gpuBuffer, size, width, height, bytesPerRow, bytesPerRowAligned, floatFormat, 0, buffer);
    }

    public releaseTexture(texture: InternalTexture): void {
        const hardwareTexture = texture._hardwareTexture;
        const irradianceTexture = texture._irradianceTexture;
        const depthStencilTexture = texture._depthStencilTexture;

        // We can't destroy the objects just now because they could be used in the current frame - we delay the destroying after the end of the frame
        this._deferredReleaseTextures.push([texture, hardwareTexture, irradianceTexture, depthStencilTexture]);
    }

    public destroyDeferredTextures(): void {
        for (let i = 0; i < this._deferredReleaseTextures.length; ++i) {
            const [texture, hardwareTexture, irradianceTexture, depthStencilTexture] = this._deferredReleaseTextures[i];

            if (hardwareTexture) {
                if (this._isHardwareTexture(hardwareTexture)) {
                    hardwareTexture.release();
                } else {
                    hardwareTexture.destroy();
                }
            }
            irradianceTexture?.dispose();
            depthStencilTexture?.dispose();

            // TODO WEBGPU remove debug code
            if (texture) {
                if ((texture as any)._swapped) {
                    delete (texture as any)._swapped;
                } else {
                    (texture as any)._released = true;
                }
            }
        }

        this._deferredReleaseTextures.length = 0;
   }
}