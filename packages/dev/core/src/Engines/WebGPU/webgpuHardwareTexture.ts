import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import { Scalar } from "../../Maths/math.scalar";
import type { Nullable } from "../../types";
import * as WebGPUConstants from "./webgpuConstants";

/** @internal */
export class WebGPUHardwareTexture implements HardwareTextureWrapper {
    /**
     * Cache of RenderPassDescriptor and BindGroup used when generating mipmaps (see WebGPUTextureHelper.generateMipmaps)
     * @internal
     */
    public _mipmapGenRenderPassDescr: GPURenderPassDescriptor[][];
    /** @internal */
    public _mipmapGenBindGroup: GPUBindGroup[][];

    /**
     * Cache for the invertYPreMultiplyAlpha function (see WebGPUTextureHelper)
     * @internal
     */
    public _copyInvertYTempTexture?: GPUTexture;
    /** @internal */
    public _copyInvertYRenderPassDescr: GPURenderPassDescriptor;
    /** @internal */
    public _copyInvertYBindGroup: GPUBindGroup;
    /** @internal */
    public _copyInvertYBindGroupWithOfst: GPUBindGroup;

    private _webgpuTexture: Nullable<GPUTexture>;
    // There can be multiple MSAA textures for a single WebGPU texture because different layers of a 2DArrayTexture / 3DTexture
    // or different faces of a cube texture can be bound to different render targets at the same time (in a multi RenderTargetWrapper)
    private _webgpuMSAATexture: Nullable<GPUTexture[]>;

    public get underlyingResource(): Nullable<GPUTexture> {
        return this._webgpuTexture;
    }

    public getMSAATexture(index = 0): Nullable<GPUTexture> {
        return this._webgpuMSAATexture?.[index] ?? null;
    }

    public setMSAATexture(texture: GPUTexture, index = -1) {
        if (!this._webgpuMSAATexture) {
            this._webgpuMSAATexture = [];
        }

        if (index === -1) {
            index = this._webgpuMSAATexture.length;
        }

        this._webgpuMSAATexture![index] = texture;
    }

    public releaseMSAATexture() {
        if (this._webgpuMSAATexture) {
            for (const texture of this._webgpuMSAATexture) {
                texture?.destroy();
            }
            this._webgpuMSAATexture = null;
        }
    }

    public view: Nullable<GPUTextureView>;
    public viewForWriting: Nullable<GPUTextureView>;
    public format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;
    public textureUsages = 0;
    public textureAdditionalUsages = 0;

    constructor(existingTexture: Nullable<GPUTexture> = null) {
        this._webgpuTexture = existingTexture;
        this._webgpuMSAATexture = null;
        this.view = null;
        this.viewForWriting = null;
    }

    public set(hardwareTexture: GPUTexture): void {
        this._webgpuTexture = hardwareTexture;
    }

    public setUsage(_textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void {
        this.createView({
            format: this.format,
            dimension: isCube ? WebGPUConstants.TextureViewDimension.Cube : WebGPUConstants.TextureViewDimension.E2d,
            mipLevelCount: generateMipMaps ? Scalar.ILog2(Math.max(width, height)) + 1 : 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            arrayLayerCount: isCube ? 6 : 1,
            aspect: WebGPUConstants.TextureAspect.All,
        });
    }

    public createView(descriptor?: GPUTextureViewDescriptor, createViewForWriting = false): void {
        this.view = this._webgpuTexture!.createView(descriptor);
        if (createViewForWriting && descriptor) {
            const saveNumMipMaps = descriptor.mipLevelCount;
            descriptor.mipLevelCount = 1;
            this.viewForWriting = this._webgpuTexture!.createView(descriptor);
            descriptor.mipLevelCount = saveNumMipMaps;
        }
    }

    public reset(): void {
        this._webgpuTexture = null;
        this._webgpuMSAATexture = null;
        this.view = null;
        this.viewForWriting = null;
    }

    public release(): void {
        this._webgpuTexture?.destroy();
        this.releaseMSAATexture();
        this._copyInvertYTempTexture?.destroy();
        this.reset();
    }
}
