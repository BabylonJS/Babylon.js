import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import type { DepthTextureCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { WebGPUTextureHelper } from "../webgpuTextureHelper";

import type { Scene } from "../../../scene";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

declare module "../../abstractEngine" {
    export interface AbstractEngine {
        /**
         * @internal
         */
        _setCubeMapTextureParams(texture: InternalTexture, loadMipmap: boolean, maxLevel?: number): void;

        /**
         * Creates a depth stencil cube texture.
         * This is only available in WebGL 2.
         * @param size The size of face edge in the cube texture.
         * @param options The options defining the cube texture.
         * @returns The cube texture
         */
        _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials if a polynomial sphere should be created for the cube texture
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @param fallback defines texture to use while falling back when (compressed) texture file not found.
         * @param loaderOptions options to be passed to the loader
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         * @param buffer defines the data buffer to load instead of loading the rootUrl
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean | undefined,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number,
            fallback: Nullable<InternalTexture>,
            loaderOptions: any,
            useSRGBBuffer: boolean,
            buffer: Nullable<ArrayBufferView>
        ): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any
        ): InternalTexture;

        /**
         * Creates a cube texture
         * @param rootUrl defines the url where the files to load is located
         * @param scene defines the current scene
         * @param files defines the list of files to load (1 per face)
         * @param noMipmap defines a boolean indicating that no mipmaps shall be generated (false by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials if a polynomial sphere should be created for the cube texture
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number
        ): InternalTexture;

        /** @internal */
        createCubeTextureBase(
            rootUrl: string,
            scene: Nullable<Scene>,
            files: Nullable<string[]>,
            noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined,
            forcedExtension: any,
            createPolynomials: boolean,
            lodScale: number,
            lodOffset: number,
            fallback: Nullable<InternalTexture>,
            beforeLoadCubeDataCallback: Nullable<(texture: InternalTexture, data: ArrayBufferView | ArrayBufferView[]) => void>,
            imageHandler: Nullable<(texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => void>,
            useSRGBBuffer: boolean,
            buffer: Nullable<ArrayBufferView>
        ): InternalTexture;

        /** @internal */
        _partialLoadFile(
            url: string,
            index: number,
            loadedFiles: ArrayBuffer[],
            onfinish: (files: ArrayBuffer[]) => void,
            onErrorCallBack: Nullable<(message?: string, exception?: any) => void>
        ): void;

        /** @internal */
        _cascadeLoadFiles(scene: Nullable<Scene>, onfinish: (images: ArrayBuffer[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void>): void;

        /** @internal */
        _cascadeLoadImgs(
            scene: Nullable<Scene>,
            texture: InternalTexture,
            onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
            files: string[],
            onError: Nullable<(message?: string, exception?: any) => void>,
            mimeType?: string
        ): void;

        /** @internal */
        _partialLoadImg(
            url: string,
            index: number,
            loadedImages: HTMLImageElement[] | ImageBitmap[],
            scene: Nullable<Scene>,
            texture: InternalTexture,
            onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
            onErrorCallBack: Nullable<(message?: string, exception?: any) => void>,
            mimeType?: string
        ): void;

        /**
         * Force the mipmap generation for the given render target texture
         * @param texture defines the render target texture to use
         * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
         */
        generateMipMapsForCubemap(texture: InternalTexture, unbind?: boolean): void;
    }
}

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
