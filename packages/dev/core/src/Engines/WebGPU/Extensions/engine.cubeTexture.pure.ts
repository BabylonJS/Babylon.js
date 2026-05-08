/** This file must only contain pure code and pure imports */

import { InternalTextureSource, InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { DepthTextureCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { WebGPUTextureHelper } from "../webgpuTextureHelper";
import { Scene } from "../../../scene.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _registered = false;
export function registerEnginesWebGPUExtensionsEngineCubeTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    ThinWebGPUEngine.prototype._createDepthStencilCubeTexture = function (size: number, options: DepthTextureCreationOptions): InternalTexture {
        const internalTexture = new InternalTexture(this, options.generateStencil ? InternalTextureSource.DepthStencil : InternalTextureSource.Depth);

        internalTexture.isCube = true;
        internalTexture.label = options.label;

        const internalOptions = {
            bilinearFiltering: false,
            comparisonFunction: 0,
            generateStencil: false,
            samples: 1,
            depthTextureFormat: options.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
            ...options,
        };

        internalTexture.format = internalOptions.depthTextureFormat;

        this._setupDepthStencilTexture(internalTexture, size, internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);

        this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

        // Now that the hardware texture is created, we can retrieve the GPU format and set the right type to the internal texture
        const gpuTextureWrapper = internalTexture._hardwareTexture as WebGPUHardwareTexture;

        internalTexture.type = WebGPUTextureHelper.GetTextureTypeFromFormat(gpuTextureWrapper.format);

        this._internalTexturesCache.push(internalTexture);

        return internalTexture;
    };

    ThinWebGPUEngine.prototype.createCubeTexture = function (
        rootUrl: string,
        scene: Nullable<Scene>,
        files: Nullable<string[]>,
        noMipmap?: boolean,
        onLoad: Nullable<(data?: any) => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        format?: number,
        forcedExtension: any = null,
        createPolynomials: boolean = false,
        lodScale: number = 0,
        lodOffset: number = 0,
        fallback: Nullable<InternalTexture> = null,
        loaderOptions?: any,
        useSRGBBuffer = false,
        buffer: Nullable<ArrayBufferView> = null
    ): InternalTexture {
        return this.createCubeTextureBase(
            rootUrl,
            scene,
            files,
            !!noMipmap,
            onLoad,
            onError,
            format,
            forcedExtension,
            createPolynomials,
            lodScale,
            lodOffset,
            fallback,
            null,
            (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
                const imageBitmaps = imgs as ImageBitmap[]; // we will always get an ImageBitmap array in WebGPU
                const width = imageBitmaps[0].width;
                const height = width;

                this._setCubeMapTextureParams(texture, !noMipmap);
                texture.format = format ?? -1;

                const gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);

                this._textureHelper.updateCubeTextures(imageBitmaps, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, false, false, 0, 0);

                if (!noMipmap) {
                    this._generateMipmaps(texture, this._uploadEncoder);
                }

                texture.isReady = true;

                texture.onLoadedObservable.notifyObservers(texture);
                texture.onLoadedObservable.clear();

                if (onLoad) {
                    onLoad();
                }
            },
            !!useSRGBBuffer,
            buffer
        );
    };

    ThinWebGPUEngine.prototype._setCubeMapTextureParams = function (texture: InternalTexture, loadMipmap: boolean, maxLevel?: number) {
        texture.samplingMode = loadMipmap ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        if (maxLevel) {
            texture._maxLodLevel = maxLevel;
        }
    };

    ThinWebGPUEngine.prototype.generateMipMapsForCubemap = function (texture: InternalTexture) {
        if (texture.generateMipMaps) {
            const gpuTexture = texture._hardwareTexture?.underlyingResource;

            if (!gpuTexture) {
                this._textureHelper.createGPUTextureForInternalTexture(texture);
            }

            this._generateMipmaps(texture);
        }
    };
}
