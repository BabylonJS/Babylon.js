import type { Nullable } from "../../types";
import type { WebGPUHardwareTexture } from "./webgpuHardwareTexture";

/** @internal */
export class WebGPURenderPassWrapper {
    public renderPassDescriptor: Nullable<GPURenderPassDescriptor>;
    public renderPass: Nullable<GPURenderPassEncoder>;
    public colorAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    public depthAttachmentViewDescriptor: Nullable<GPUTextureViewDescriptor>;
    public colorAttachmentGPUTextures: (WebGPUHardwareTexture | null)[] = [];
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
