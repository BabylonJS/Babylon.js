import type { HardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import { InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Scalar } from "../../Maths/math.scalar";
import type { Nullable } from "../../types";
import * as WebGPUConstants from "./webgpuConstants";

declare type WebGPUBundleList = import("./webgpuBundleList").WebGPUBundleList;

/** @internal */
export class WebGPUHardwareTexture implements HardwareTextureWrapper {
    /**
     * List of bundles collected in the snapshot rendering mode when the texture is a render target texture
     * The index in this array is the current layer we are rendering into
     * @internal
     */
    public _bundleLists: WebGPUBundleList[];
    /**
     * Current layer we are rendering into when in snapshot rendering mode (if the texture is a render target texture)
     * @internal
     */
    public _currentLayer: number;

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

    public setUsage(textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void {
        generateMipMaps = textureSource === InternalTextureSource.RenderTarget ? false : generateMipMaps;

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
        this._webgpuMSAATexture?.destroy();
        this._copyInvertYTempTexture?.destroy();
        this.reset();
    }
}
