import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { Nullable } from '../../types';
import * as WebGPUConstants from './webgpuConstants';

/** @hidden */
export class WebGPUHardwareTexture implements HardwareTextureWrapper {

    private _webgpuTexture: Nullable<GPUTexture>;
    private _webgpuTextureView: Nullable<GPUTextureView>;
    private _webgpuSampler: Nullable<GPUSampler>;

    public get underlyingResource(): Nullable<GPUTexture> {
        return this._webgpuTexture;
    }

    public get view(): Nullable<GPUTextureView> {
        return this._webgpuTextureView;
    }

    public get sampler(): Nullable<GPUSampler> {
        return this._webgpuSampler;
    }

    public format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;

    constructor(existingTexture: Nullable<GPUTexture> = null) {
        this._webgpuTexture = existingTexture;
        this._webgpuTextureView = null;
        this._webgpuSampler = null;
    }

    public set(hardwareTexture: GPUTexture) {
        this._webgpuTexture = hardwareTexture;
    }

    public createView(descriptor?: GPUTextureViewDescriptor) {
        this._webgpuTextureView = this._webgpuTexture!.createView(descriptor);
    }

    public setSampler(sampler: GPUSampler) {
        this._webgpuSampler = sampler;
    }

    public reset() {
        this._webgpuTexture = null;
        this._webgpuTextureView = null as any;
        this._webgpuSampler = null as any;
    }

    public release() {
        this._webgpuTexture?.destroy();
        this.reset();
    }
}
