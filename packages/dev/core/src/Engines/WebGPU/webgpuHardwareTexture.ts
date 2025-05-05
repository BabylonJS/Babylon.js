/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable babylonjs/available */
import type { IHardwareTextureWrapper } from "../../Materials/Textures/hardwareTextureWrapper";
import { ILog2 } from "../../Maths/math.scalar.functions";
import type { Nullable } from "../../types";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebGPUConstants from "./webgpuConstants";
import { WebGPUTextureHelper } from "./webgpuTextureHelper";
import type { WebGPUEngine } from "../webgpuEngine";

/** @internal */
export class WebGPUHardwareTexture implements IHardwareTextureWrapper {
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

    /** @internal */
    public _originalFormatIsRGB = false;

    private _webgpuTexture: Nullable<GPUTexture>;
    // There can be multiple MSAA textures for a single WebGPU texture because different layers of a 2DArrayTexture / 3DTexture
    // or different faces of a cube texture can be bound to different render targets at the same time (in a multi RenderTargetWrapper)
    private _webgpuMSAATexture: Nullable<GPUTexture[]>;

    public get underlyingResource(): Nullable<GPUTexture> {
        return this._webgpuTexture;
    }

    public getMSAATexture(index: number): Nullable<GPUTexture> {
        return this._webgpuMSAATexture?.[index] ?? null;
    }

    public setMSAATexture(texture: GPUTexture, index: number) {
        if (!this._webgpuMSAATexture) {
            this._webgpuMSAATexture = [];
        }

        this._webgpuMSAATexture[index] = texture;
    }

    public releaseMSAATexture(index?: number): void {
        if (this._webgpuMSAATexture) {
            if (index !== undefined) {
                this._engine._textureHelper.releaseTexture(this._webgpuMSAATexture[index]);
                delete this._webgpuMSAATexture[index];
            } else {
                for (const texture of this._webgpuMSAATexture) {
                    this._engine._textureHelper.releaseTexture(texture);
                }
                this._webgpuMSAATexture = null;
            }
        }
    }

    public view: Nullable<GPUTextureView>;
    public viewForWriting: Nullable<GPUTextureView>;
    public format: GPUTextureFormat = WebGPUConstants.TextureFormat.RGBA8Unorm;
    public textureUsages = 0;
    public textureAdditionalUsages = 0;

    constructor(
        private _engine: WebGPUEngine,
        existingTexture: Nullable<GPUTexture> = null
    ) {
        this._webgpuTexture = existingTexture;
        this._webgpuMSAATexture = null;
        this.view = null;
        this.viewForWriting = null;
    }

    public set(hardwareTexture: GPUTexture): void {
        this._webgpuTexture = hardwareTexture;
    }

    public setUsage(_textureSource: number, generateMipMaps: boolean, is2DArray: boolean, isCube: boolean, is3D: boolean, width: number, height: number, depth: number): void {
        let viewDimension: GPUTextureViewDimension = WebGPUConstants.TextureViewDimension.E2d;
        let arrayLayerCount = 1;
        if (isCube) {
            viewDimension = is2DArray ? WebGPUConstants.TextureViewDimension.CubeArray : WebGPUConstants.TextureViewDimension.Cube;
            arrayLayerCount = 6 * (depth || 1);
        } else if (is3D) {
            viewDimension = WebGPUConstants.TextureViewDimension.E3d;
            arrayLayerCount = 1;
        } else if (is2DArray) {
            viewDimension = WebGPUConstants.TextureViewDimension.E2dArray;
            arrayLayerCount = depth;
        }

        const format = WebGPUTextureHelper.GetDepthFormatOnly(this.format);
        const aspect = WebGPUTextureHelper.HasDepthAndStencilAspects(this.format) ? WebGPUConstants.TextureAspect.DepthOnly : WebGPUConstants.TextureAspect.All;

        this.createView({
            label: `TextureView${is3D ? "3D" : isCube ? "Cube" : "2D"}${is2DArray ? "_Array" + arrayLayerCount : ""}_${width}x${height}_${generateMipMaps ? "wmips" : "womips"}_${
                this.format
            }_${viewDimension}`,
            format,
            dimension: viewDimension,
            mipLevelCount: generateMipMaps ? ILog2(Math.max(width, height)) + 1 : 1,
            baseArrayLayer: 0,
            baseMipLevel: 0,
            arrayLayerCount,
            aspect,
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
