import { HardwareTextureWrapper } from '../../Materials/Textures/hardwareTextureWrapper';
import { Nullable } from '../../types';
import * as WebGPUConstants from './webgpuConstants';

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

    public set(hardwareTexture: GPUTexture) {
        this._webgpuTexture = hardwareTexture;
    }

    public createView(descriptor?: GPUTextureViewDescriptor) {
        this.view = this._webgpuTexture!.createView(descriptor);
    }

    public reset() {
        this._webgpuTexture = null;
        this.view = null;
        this.sampler = null;
    }

    public release() {
        this._webgpuTexture?.destroy();
        this.reset();
    }
}
