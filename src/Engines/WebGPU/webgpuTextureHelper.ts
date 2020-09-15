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
//import { DataBuffer } from '../../Meshes/dataBuffer';
import { WebGPUBufferManager } from './webgpuBufferManager';

export class WebGPUTextureHelper {

    private _device: GPUDevice;
    //private _bufferManager: WebGPUBufferManager;
    private _mipmapSampler: GPUSampler;
    private _mipmapPipeline: GPURenderPipeline;

    public static computeNumMipmapLevels(width: number, height: number) {
        return Math.round(Scalar.Log2(Math.max(width, height))) + 1;
    }

    constructor(device: GPUDevice, glslang: any, bufferManager: WebGPUBufferManager) {
        this._device = device;
        //this._bufferManager = bufferManager;

        const mipmapVertexSource = `
            #version 450

            const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
            const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

            layout(location = 0) out vec2 vTex;

            void main() {
                vTex = tex[gl_VertexIndex];
                gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
            }
        `;

        const mipmapFragmentSource = `
            #version 450

            layout(set = 0, binding = 0) uniform sampler imgSampler;
            layout(set = 0, binding = 1) uniform texture2D img;

            layout(location = 0) in vec2 vTex;
            layout(location = 0) out vec4 outColor;

            void main() {
                outColor = texture(sampler2D(img, imgSampler), vTex);
            }
        `;

        this._mipmapSampler = device.createSampler({ minFilter: WebGPUConstants.FilterMode.Linear });

        this._mipmapPipeline = device.createRenderPipeline({
            vertexStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(mipmapVertexSource, 'vertex')
                }),
                entryPoint: 'main'
            },
            fragmentStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(mipmapFragmentSource, 'fragment')
                }),
                entryPoint: 'main'
            },
            primitiveTopology: WebGPUConstants.PrimitiveTopology.TriangleStrip,
            vertexState: {
                indexFormat: WebGPUConstants.IndexFormat.Uint16
            },
            colorStates: [{
                format: WebGPUConstants.TextureFormat.RGBA8Unorm,
            }]
        });
    }

    private _isImageBitmap(imageBitmap: ImageBitmap | { width: number, height: number }): imageBitmap is ImageBitmap {
        return (imageBitmap as ImageBitmap).close !== undefined;
    }

    private _isImageBitmapArray(imageBitmap: ImageBitmap[] | { width: number, height: number }): imageBitmap is ImageBitmap[] {
        return Array.isArray(imageBitmap as ImageBitmap[]) && (imageBitmap as ImageBitmap[])[0].close !== undefined;
    }

    public async createTexture(imageBitmap: ImageBitmap | { width: number, height: number }, generateMipmaps = false, invertY = false, premultiplyAlpha = false, format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm, sampleCount = 1): Promise<GPUTexture> {
        let textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depth: 1,
        };

        const mipLevelCount = generateMipmaps ? WebGPUTextureHelper.computeNumMipmapLevels(imageBitmap.width, imageBitmap.height) : 1;
        const additionalUsages = generateMipmaps ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.OutputAttachment : 0;

        const gpuTexture = this._device.createTexture({
            size: textureSize,
            dimension: WebGPUConstants.TextureDimension.E2d,
            format,
            usage:  WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.Sampled | additionalUsages,
            sampleCount,
            mipLevelCount
        });

        if (this._isImageBitmap(imageBitmap)) {
            if (invertY || premultiplyAlpha) {
                imageBitmap = await createImageBitmap(imageBitmap, { imageOrientation: "flipY", premultiplyAlpha: premultiplyAlpha ? "premultiply" : "none" });
            }

            this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap: imageBitmap as ImageBitmap }, { texture: gpuTexture }, textureSize);

            if (!generateMipmaps) {
                return gpuTexture;
            }

            const commandEncoder = this._device.createCommandEncoder({});

            this.generateMipmaps(gpuTexture, mipLevelCount, 0, commandEncoder);

            this._device.defaultQueue.submit([commandEncoder.finish()]);
        }

        return gpuTexture;
    }

    public async createCubeTexture(imageBitmaps: ImageBitmap[] | { width: number, height: number }, generateMipmaps = false, invertY = false, premultiplyAlpha = false, format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm, sampleCount = 1): Promise<GPUTexture> {
        const width = this._isImageBitmapArray(imageBitmaps) ? imageBitmaps[0].width : imageBitmaps.width;
        const height = this._isImageBitmapArray(imageBitmaps) ? imageBitmaps[0].height : imageBitmaps.height;

        const mipLevelCount = generateMipmaps ? WebGPUTextureHelper.computeNumMipmapLevels(width, height) : 1;
        const additionalUsages = generateMipmaps ? WebGPUConstants.TextureUsage.CopySrc | WebGPUConstants.TextureUsage.OutputAttachment : 0;

        const gpuTexture = this._device.createTexture({
            size: {
                width,
                height,
                depth: 6,
            },
            dimension: WebGPUConstants.TextureDimension.E2d,
            format,
            usage: WebGPUConstants.TextureUsage.CopyDst | WebGPUConstants.TextureUsage.Sampled | additionalUsages,
            sampleCount,
            mipLevelCount
        });

        if (this._isImageBitmapArray(imageBitmaps)) {
            const textureSizeFace = {
                width,
                height,
                depth: 1,
            };

            const textureView: GPUTextureCopyView = {
                texture: gpuTexture,
                origin: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                mipLevel: 0
            };

            const faces = [0, 3, 1, 4, 2, 5];

            for (let f = 0; f < faces.length; ++f) {
                let imageBitmap = imageBitmaps[faces[f]];

                if (invertY || premultiplyAlpha) {
                    imageBitmap = await createImageBitmap(imageBitmap, { imageOrientation: "flipY", premultiplyAlpha: premultiplyAlpha ? "premultiply" : "none" });
                }

                (textureView.origin as GPUOrigin3DDict).z = f;

                this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, textureView, textureSizeFace);
            }

            if (generateMipmaps) {
                const commandEncoder = this._device.createCommandEncoder({});

                this.generateCubeMipmaps(gpuTexture, mipLevelCount, commandEncoder);

                this._device.defaultQueue.submit([commandEncoder.finish()]);
            }
        }

        return gpuTexture;
    }

    public generateCubeMipmaps(gpuTexture: GPUTexture, mipLevelCount: number, commandEncoder?: GPUCommandEncoder): void {
        for (let f = 0; f < 6; ++f) {
            this.generateMipmaps(gpuTexture, mipLevelCount, f, commandEncoder);
        }
    }

    public generateMipmaps(gpuTexture: GPUTexture, mipLevelCount: number, faceIndex= 0, commandEncoder?: GPUCommandEncoder): void {
        const useOwnCommandEncoder = commandEncoder === undefined;
        const bindGroupLayout = this._mipmapPipeline.getBindGroupLayout(0);

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }

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

            passEncoder.setPipeline(this._mipmapPipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4, 1, 0, 0);
            passEncoder.endPass();
        }

        if (useOwnCommandEncoder) {
            this._device.defaultQueue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }
    }

    public async updateTexture(imageBitmap: ImageBitmap, gpuTexture: GPUTexture, width: number, height: number, faceIndex: number = 0, mipLevel: number = 0, invertY = false, premultiplyAlpha = false, offsetX = 0, offsetY = 0, commandEncoder?: GPUCommandEncoder) {
        /*const useOwnCommandEncoder = commandEncoder === undefined;

        if (useOwnCommandEncoder) {
            commandEncoder = this._device.createCommandEncoder({});
        }*/

        const textureView: GPUTextureCopyView = {
            texture: gpuTexture,
            origin: {
                x: offsetX,
                y: offsetY,
                z: Math.max(faceIndex, 0)
            },
            mipLevel: mipLevel
        };

        const textureExtent = {
            width,
            height,
            depth: 1
        };

        if (invertY || premultiplyAlpha) {
            imageBitmap = await createImageBitmap(imageBitmap, { imageOrientation: "flipY", premultiplyAlpha: premultiplyAlpha ? "premultiply" : "none" });
        }

        this._device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, textureView, textureExtent);

        /*const bytesPerRow = Math.ceil(width * 4 / 256) * 256;

        let dataBuffer: DataBuffer;
        if (bytesPerRow === width * 4) {
            dataBuffer = this._bufferManager.createBuffer(pixels, WebGPUConstants.BufferUsage.CopySrc | WebGPUConstants.BufferUsage.CopyDst);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                bytesPerRow: bytesPerRow,
                rowsPerImage: height,
                offset: 0,
            };
            commandEncoder!.copyBufferToTexture(bufferView, textureView, textureExtent);
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
            dataBuffer = this._bufferManager.createBuffer(alignedPixels, WebGPUConstants.BufferUsage.CopySrc | WebGPUConstants.BufferUsage.CopyDst);
            const bufferView: GPUBufferCopyView = {
                buffer: dataBuffer.underlyingResource,
                bytesPerRow: bytesPerRow,
                rowsPerImage: height,
                offset: 0,
            };
            commandEncoder!.copyBufferToTexture(bufferView, textureView, textureExtent);
        }

        if (useOwnCommandEncoder) {
            this._device.defaultQueue.submit([commandEncoder!.finish()]);
            commandEncoder = null as any;
        }*/
   }
}