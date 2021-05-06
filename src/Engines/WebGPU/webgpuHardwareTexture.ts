import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Scalar } from '../../Maths/math.scalar';
import { Nullable } from '../../types';
import * as WebGPUConstants from './webgpuConstants';

declare type WebGPUBundleList = import("./webgpuBundleList").WebGPUBundleList;

/** @hidden */
export class WebGPUHardwareTexture implements HardwareTextureWrapper {

    /** @hidden */
    public _bundleLists: WebGPUBundleList[];
    /** @hidden */
    public _currentLayer: number;

    private _webgpuTexture: Nullable<GPUTexture>;
    private _webgpuMSAATexture: Nullable<GPUTexture>;

    public get underlyingResource(): Nullable<GPUTexture> {
        return this._webgpuTexture;
    }

    public get msaaTexture(): Nullable<GPUTexture> {
        return this._webgpuMSAATexture;
    }

    public set msaaTexture(texture: Nullable<GPUTexture>) {
        this._webgpuMSAATexture = texture;
    }

    public view: Nullable<GPUTextureView>;
    public format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;
    public textureUsages = 0;
    public textureAdditionalUsages = 0;

    constructor(existingTexture: Nullable<GPUTexture> = null) {
        this._webgpuTexture = existingTexture;
        this._webgpuMSAATexture = null;
        this.view = null;
    }

    public set(hardwareTexture: GPUTexture): void {
        this._webgpuTexture = hardwareTexture;
    }

    public setMSAATexture(hardwareTexture: GPUTexture): void {
        this._webgpuMSAATexture = hardwareTexture;
    }

    public setUsage(textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void {
        generateMipMaps = textureSource === InternalTextureSource.RenderTarget ? false : generateMipMaps;

        this.createView({
            format: this.format,
            dimension: isCube ? WebGPUConstants.TextureViewDimension.Cube : WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: generateMipMaps ? Scalar.ILog2(Math.max(width, height)) + 1 : 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            arrayLayerCount: isCube ? 6 : 1,
            aspect: WebGPUConstants.TextureAspect.All
        });
    }

    public createView(descriptor?: GPUTextureViewDescriptor): void {
        this.view = this._webgpuTexture!.createView(descriptor);
    }

    public reset(): void {
        this._webgpuTexture = null;
        this._webgpuMSAATexture = null;
        this.view = null;
    }

    public release(): void {
        this._webgpuTexture?.destroy();
        this._webgpuMSAATexture?.destroy();
        this.reset();
    }
}
