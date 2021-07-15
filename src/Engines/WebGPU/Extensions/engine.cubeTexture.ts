import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { DepthTextureCreationOptions } from "../../depthTextureCreationOptions";
import { WebGPUEngine } from "../../webgpuEngine";

declare type Scene = import("../../../scene").Scene;

WebGPUEngine.prototype._createDepthStencilCubeTexture = function(size: number, options: DepthTextureCreationOptions): InternalTexture {
    const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

    internalTexture.isCube = true;

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        samples: 1,
        ...options
    };

    // TODO WEBGPU allow to choose the format?
    internalTexture.format = internalOptions.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);

    this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

    this._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

WebGPUEngine.prototype.createCubeTexture = function(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null,
     onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0,
     fallback: Nullable<InternalTexture> = null, useSRGBBuffer = false): InternalTexture
{
     return this.createCubeTextureBase(
         rootUrl, scene, files, !!noMipmap, onLoad, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset, fallback,
         null,
         (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
             const imageBitmaps = imgs as ImageBitmap[]; // we will always get an ImageBitmap array in WebGPU
             const width = imageBitmaps[0].width;
             const height = width;

             this._setCubeMapTextureParams(texture, !noMipmap);
             texture.format = format ?? -1;

             const gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);

             this._textureHelper.updateCubeTextures(imageBitmaps, gpuTextureWrapper.underlyingResource!, width, height, gpuTextureWrapper.format, false, false, 0, 0, this._uploadEncoder);

             if (!noMipmap) {
                 this._generateMipmaps(texture, this._uploadEncoder);
             }

             texture.isReady = true;

             texture.onLoadedObservable.notifyObservers(texture);
             texture.onLoadedObservable.clear();

             if (onLoad) {
                 onLoad();
             }
         }, !!useSRGBBuffer
     );
};

WebGPUEngine.prototype._setCubeMapTextureParams = function(texture: InternalTexture, loadMipmap: boolean) {
    texture.samplingMode = loadMipmap ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
};
