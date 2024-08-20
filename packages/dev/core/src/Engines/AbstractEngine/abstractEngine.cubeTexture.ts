import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { LoadImage } from "../../Misc/fileTools";
import { RandomGUID } from "../../Misc/guid";
import type { IWebRequest } from "../../Misc/interfaces/iWebRequest";
import { AbstractEngine } from "../abstractEngine";
import { _GetCompatibleTextureLoader } from "core/Materials/Textures/Loaders/textureLoaderManager";

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
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
    }
}

AbstractEngine.prototype._partialLoadFile = function (
    url: string,
    index: number,
    loadedFiles: ArrayBuffer[],
    onfinish: (files: ArrayBuffer[]) => void,
    onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null
): void {
    const onload = (data: ArrayBuffer) => {
        loadedFiles[index] = data;
        (<any>loadedFiles)._internalCount++;

        if ((<any>loadedFiles)._internalCount === 6) {
            onfinish(loadedFiles);
        }
    };

    const onerror = (request?: IWebRequest, exception?: any) => {
        if (onErrorCallBack && request) {
            onErrorCallBack(request.status + " " + request.statusText, exception);
        }
    };

    this._loadFile(url, onload as (data: string | ArrayBuffer) => void, undefined, undefined, true, onerror);
};

AbstractEngine.prototype._cascadeLoadFiles = function (
    scene: Nullable<Scene>,
    onfinish: (images: ArrayBuffer[]) => void,
    files: string[],
    onError: Nullable<(message?: string, exception?: any) => void> = null
): void {
    const loadedFiles: ArrayBuffer[] = [];
    (<any>loadedFiles)._internalCount = 0;

    for (let index = 0; index < 6; index++) {
        this._partialLoadFile(files[index], index, loadedFiles, onfinish, onError);
    }
};

AbstractEngine.prototype._cascadeLoadImgs = function (
    scene: Nullable<Scene>,
    texture: InternalTexture,
    onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
    files: string[],
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    mimeType?: string
) {
    const loadedImages: HTMLImageElement[] | ImageBitmap[] = [];
    (<any>loadedImages)._internalCount = 0;

    for (let index = 0; index < 6; index++) {
        this._partialLoadImg(files[index], index, loadedImages, scene, texture, onfinish, onError, mimeType);
    }
};

AbstractEngine.prototype._partialLoadImg = function (
    url: string,
    index: number,
    loadedImages: HTMLImageElement[] | ImageBitmap[],
    scene: Nullable<Scene>,
    texture: InternalTexture,
    onfinish: Nullable<(texture: InternalTexture, images: HTMLImageElement[] | ImageBitmap[]) => void>,
    onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null,
    mimeType?: string
) {
    const tokenPendingData = RandomGUID();

    const onload = (img: HTMLImageElement | ImageBitmap) => {
        loadedImages[index] = img;
        (<any>loadedImages)._internalCount++;

        if (scene) {
            scene.removePendingData(tokenPendingData);
        }

        if ((<any>loadedImages)._internalCount === 6 && onfinish) {
            onfinish(texture, loadedImages);
        }
    };

    const onerror = (message?: string, exception?: any) => {
        if (scene) {
            scene.removePendingData(tokenPendingData);
        }

        if (onErrorCallBack) {
            onErrorCallBack(message, exception);
        }
    };

    LoadImage(url, onload, onerror, scene ? scene.offlineProvider : null, mimeType);
    if (scene) {
        scene.addPendingData(tokenPendingData);
    }
};

AbstractEngine.prototype.createCubeTextureBase = function (
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
    useSRGBBuffer = false,
    buffer: Nullable<ArrayBufferView> = null
): InternalTexture {
    const texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Cube);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;
    texture._useSRGBBuffer = !!useSRGBBuffer && this._caps.supportSRGBBuffers && (this.version > 1 || this.isWebGPU || !!noMipmap);
    if (texture !== fallback) {
        texture.label = rootUrl.substring(0, 60); // default label, can be overriden by the caller
    }

    if (!this._doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
        texture._buffer = buffer;
    }

    const originalRootUrl = rootUrl;
    if (this._transformTextureUrl && !fallback) {
        rootUrl = this._transformTextureUrl(rootUrl);
    }

    const rootUrlWithoutUriParams = rootUrl.split("?")[0];
    const lastDot = rootUrlWithoutUriParams.lastIndexOf(".");
    const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrlWithoutUriParams.substring(lastDot).toLowerCase() : "";

    const loaderPromise = _GetCompatibleTextureLoader(extension);

    const onInternalError = (request?: IWebRequest, exception?: any) => {
        if (rootUrl === originalRootUrl) {
            if (onError && request) {
                onError(request.status + " " + request.statusText, exception);
            }
        } else {
            // fall back to the original url if the transformed url fails to load
            Logger.Warn(`Failed to load ${rootUrl}, falling back to the ${originalRootUrl}`);
            this.createCubeTextureBase(
                originalRootUrl,
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
                texture,
                beforeLoadCubeDataCallback,
                imageHandler,
                useSRGBBuffer,
                buffer
            );
        }
    };

    if (loaderPromise) {
        loaderPromise.then((loader) => {
            const onloaddata = (data: ArrayBufferView | ArrayBufferView[]) => {
                if (beforeLoadCubeDataCallback) {
                    beforeLoadCubeDataCallback(texture, data);
                }
                loader.loadCubeData(data, texture, createPolynomials, onLoad, onError);
            };
            if (buffer) {
                onloaddata(buffer);
            } else if (files && files.length === 6) {
                if (loader.supportCascades) {
                    this._cascadeLoadFiles(scene, (images) => onloaddata(images.map((image) => new Uint8Array(image))), files, onError);
                } else {
                    if (onError) {
                        onError("Textures type does not support cascades.");
                    } else {
                        Logger.Warn("Texture loader does not support cascades.");
                    }
                }
            } else {
                this._loadFile(rootUrl, (data) => onloaddata(new Uint8Array(data as ArrayBuffer)), undefined, undefined, true, onInternalError);
            }
        });
    } else {
        if (!files || files.length === 0) {
            throw new Error("Cannot load cubemap because files were not defined, or the correct loader was not found.");
        }

        this._cascadeLoadImgs(
            scene,
            texture,
            (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
                if (imageHandler) {
                    imageHandler(texture, imgs);
                }
            },
            files,
            onError
        );
    }

    this._internalTexturesCache.push(texture);

    return texture;
};
