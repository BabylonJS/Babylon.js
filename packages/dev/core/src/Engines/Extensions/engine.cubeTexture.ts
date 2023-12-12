import { ThinEngine } from "../../Engines/thinEngine";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { DepthTextureCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import * as extension from "core/esm/Engines/WebGL/Extensions/cubeTexture/cubeTexture.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a depth stencil cube texture.
         * This is only available in WebGL 2.
         * @param size The size of face edge in the cube texture.
         * @param options The options defining the cube texture.
         * @param rtWrapper The render target wrapper for which the depth/stencil texture must be created
         * @returns The cube texture
         */
        _createDepthStencilCubeTexture(size: number, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

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
            useSRGBBuffer: boolean
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
            useSRGBBuffer: boolean
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
         * @internal
         */
        _setCubeMapTextureParams(texture: InternalTexture, loadMipmap: boolean, maxLevel?: number): void;
    }
}

ThinEngine.prototype._createDepthStencilCubeTexture = function (size: number, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    return extension._createDepthStencilCubeTexture(this._engineState, size, options, rtWrapper);
};

ThinEngine.prototype._partialLoadFile = function (
    url: string,
    index: number,
    loadedFiles: ArrayBuffer[],
    onfinish: (files: ArrayBuffer[]) => void,
    onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null
): void {
    extension._partialLoadFile(this._engineState, url, index, loadedFiles, onfinish, onErrorCallBack);
};

ThinEngine.prototype._cascadeLoadFiles = function (
    scene: Nullable<Scene>,
    onfinish: (images: ArrayBuffer[]) => void,
    files: string[],
    onError: Nullable<(message?: string, exception?: any) => void> = null
): void {
    extension._cascadeLoadFiles(this._engineState, scene, onfinish, files, onError);
};

ThinEngine.prototype._cascadeLoadImgs = function (
    scene: Nullable<Scene>,
    texture: InternalTexture,
    onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
    files: string[],
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    mimeType?: string
) {
    extension._cascadeLoadImgs(this._engineState, scene, texture, onfinish, files, onError, mimeType);
};

ThinEngine.prototype._partialLoadImg = function (
    url: string,
    index: number,
    loadedImages: HTMLImageElement[] | ImageBitmap[],
    scene: Nullable<Scene>,
    texture: InternalTexture,
    onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
    onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null,
    mimeType?: string
) {
    extension._partialLoadImg(this._engineState, url, index, loadedImages, scene, texture, onfinish, onErrorCallBack, mimeType);
};

ThinEngine.prototype._setCubeMapTextureParams = function (texture: InternalTexture, loadMipmap: boolean, maxLevel?: number): void {
    extension._setCubeMapTextureParams(this._engineState, texture, loadMipmap, maxLevel);
};

ThinEngine.prototype.createCubeTextureBase = function (
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
    beforeLoadCubeDataCallback: Nullable<(texture: InternalTexture, data: ArrayBufferView | ArrayBufferView[]) => void> = null,
    imageHandler: Nullable<(texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => void> = null,
    useSRGBBuffer = false
): InternalTexture {
    return extension.createCubeTextureBase(
        this._engineState,
        rootUrl,
        scene,
        files,
        noMipmap,
        onLoad,
        onError,
        format,
        forcedExtension,
        createPolynomials,
        lodScale,
        lodOffset,
        fallback,
        beforeLoadCubeDataCallback,
        imageHandler,
        useSRGBBuffer
    );
};

ThinEngine.prototype.createCubeTexture = function (
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
    useSRGBBuffer: boolean = false
): InternalTexture {
    return extension.createCubeTexture(
        this._engineState,
        rootUrl,
        scene,
        files,
        noMipmap,
        onLoad,
        onError,
        format,
        forcedExtension,
        createPolynomials,
        lodScale,
        lodOffset,
        fallback,
        loaderOptions,
        useSRGBBuffer
    );
};

loadExtension(EngineExtensions.CUBE_TEXTURE, extension);
