import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Nullable } from '../../types';
import * as WebGPUConstants from './webgpuConstants';
import { WebGPUTextureHelper } from './webgpuTextureHelper';

/** @hidden */
export class WebGPUHardwareTexture implements HardwareTextureWrapper {

    private _webgpuTexture: Nullable<GPUTexture>;

    public get underlyingResource(): Nullable<GPUTexture> {
        return this._webgpuTexture;
    }

    public view: Nullable<GPUTextureView>;
    public sampler: Nullable<GPUSampler>;
    public format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;

    constructor(existingTexture: Nullable<GPUTexture> = null) {
        this._webgpuTexture = existingTexture;
        this.view = null;
        this.sampler = null;
    }

    public set(hardwareTexture: GPUTexture): void {
        this._webgpuTexture = hardwareTexture;
    }

    public setUsage(textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void {
        generateMipMaps = textureSource === InternalTextureSource.RenderTarget ? false : generateMipMaps;

        this.createView({
            dimension: isCube ? WebGPUConstants.TextureViewDimension.Cube : WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: generateMipMaps ? WebGPUTextureHelper.computeNumMipmapLevels(width, height) : 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            aspect: WebGPUConstants.TextureAspect.All
        });
    }

    public createView(descriptor?: GPUTextureViewDescriptor): void {
        this.view = this._webgpuTexture!.createView(descriptor);
    }

    public reset(): void {
        this._webgpuTexture = null;
        this.view = null;
        this.sampler = null;
    }

    public release(): void {
        this._webgpuTexture?.destroy();
        this.reset();
    }
}
