import { Nullable } from '../../types';
import { WebGPUHardwareTexture } from './webgpuHardwareTexture';

/** @hidden */
export class WebGPURenderPassWrapper {
    public renderPassDescriptor: Nullable<GPURenderPassDescriptor>;
    public renderPass: Nullable<GPURenderPassEncoder>;
    public colorAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    public depthAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    public colorAttachmentGPUTextures: WebGPUHardwareTexture[] = [];
    public depthTextureFormat: GPUTextureFormat | undefined;

    constructor() {
        this.reset();
    }

    public reset(fullReset = false): void {
        this.renderPass = null;
        if (fullReset) {
            this.renderPassDescriptor = null;
            this.colorAttachmentViewDescriptor = null;
            this.depthAttachmentViewDescriptor = null;
            this.colorAttachmentGPUTextures = [];
            this.depthTextureFormat = undefined;
        }
    }
}
