import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { IInternalTextureLoader } from "@babylonjs/core/Materials/Textures/internalTextureLoader.js";
import type { DepthTextureCreationOptions } from "@babylonjs/core/Materials/Textures/textureCreationOptions.js";
import { LoadImage } from "@babylonjs/core/Misc/fileTools.js";
import { RandomGUID } from "@babylonjs/core/Misc/guid.js";
import type { IWebRequest } from "@babylonjs/core/Misc/interfaces/iWebRequest.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl.js";
import { _bindTextureDirectly, _getInternalFormat, _setupDepthStencilTexture, _unpackFlipY } from "../../engine.webgl.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import type { ICubeTextureEngineExtension } from "../../../Extensions/cubeTexture/cubeTexture.base.js";
import { augmentEngineState } from "../../../engine.adapters.js";
import { _prepareWorkingCanvas } from "../../../engine.base.js";
import { Constants } from "../../../engine.constants.js";
import { _TextureLoaders, GetExponentOfTwo } from "../../../engine.static.js";
import { _loadFile } from "../../../engine.tools.js";

export const _createDepthStencilCubeTexture: ICubeTextureEngineExtension["_createDepthStencilCubeTexture"] = function (
    engineState: IWebGLEnginePublic,
    size: number,
    options: DepthTextureCreationOptions,
    rtWrapper: RenderTargetWrapper
): InternalTexture {
    const fes = engineState as WebGLEngineState;
    const internalTexture = new InternalTexture(augmentEngineState(fes), InternalTextureSource.DepthStencil);
    internalTexture.isCube = true;

    if (fes.webGLVersion === 1) {
        Logger.Error("Depth cube texture is not supported by WebGL 1.");
        return internalTexture;
    }

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options,
    };

    const gl = fes._gl;
    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, internalTexture, true);

    _setupDepthStencilTexture(fes, internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

    rtWrapper._depthStencilTexture = internalTexture;
    rtWrapper._depthStencilTextureWithStencil = internalOptions.generateStencil;

    // Create the depth/stencil buffer
    for (let face = 0; face < 6; face++) {
        if (internalOptions.generateStencil) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH24_STENCIL8, size, size, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        } else {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        }
    }

    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);

    fes._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

export const _partialLoadFile: ICubeTextureEngineExtension["_partialLoadFile"] = function (
    engineState: IWebGLEnginePublic,
    url: string,
    index: number,
    loadedFiles: ArrayBuffer[],
    onfinish: (files: ArrayBuffer[]) => void,
    onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null
): void {
    const fes = engineState as WebGLEngineState;
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

    _loadFile(fes, url, onload as (data: string | ArrayBuffer) => void, undefined, undefined, true, onerror);
};

export const _cascadeLoadFiles: ICubeTextureEngineExtension["_cascadeLoadFiles"] = function (
    engineState: IWebGLEnginePublic,
    scene: Nullable<Scene>,
    onfinish: (images: ArrayBuffer[]) => void,
    files: string[],
    onError: Nullable<(message?: string, exception?: any) => void> = null
): void {
    const fes = engineState as WebGLEngineState;
    const loadedFiles: ArrayBuffer[] = [];
    (<any>loadedFiles)._internalCount = 0;

    for (let index = 0; index < 6; index++) {
        _partialLoadFile(fes, files[index], index, loadedFiles, onfinish, onError);
    }
};

export const _cascadeLoadImgs: ICubeTextureEngineExtension["_cascadeLoadImgs"] = function (
    engineState: IWebGLEnginePublic,
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
        _partialLoadImg(engineState, files[index], index, loadedImages, scene, texture, onfinish, onError, mimeType);
    }
};

export const _partialLoadImg: ICubeTextureEngineExtension["_partialLoadImg"] = function (
    _engineState: IWebGLEnginePublic,
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

export const _setCubeMapTextureParams: ICubeTextureEngineExtension["_setCubeMapTextureParams"] = function (
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    loadMipmap: boolean,
    maxLevel?: number
): void {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texture.samplingMode = loadMipmap ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_LINEAR_LINEAR;

    if (loadMipmap && fes._caps.textureMaxLevel && maxLevel !== undefined && maxLevel > 0) {
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAX_LEVEL, maxLevel);
        texture._maxLodLevel = maxLevel;
    }

    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);
};

export const createCubeTextureBase: ICubeTextureEngineExtension["createCubeTextureBase"] = function (
    engineState: IWebGLEnginePublic,
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
    const fes = engineState as WebGLEngineState;
    const texture = fallback ? fallback : new InternalTexture(augmentEngineState(fes), InternalTextureSource.Cube);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;
    texture._useSRGBBuffer = !!useSRGBBuffer && fes._caps.supportSRGBBuffers && (fes.webGLVersion > 1 || !!noMipmap);
    if (texture !== fallback) {
        texture.label = rootUrl.substring(0, 60); // default label, can be overriden by the caller
    }

    if (!fes.doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
    }

    const originalRootUrl = rootUrl;
    if (fes._transformTextureUrl && !fallback) {
        rootUrl = fes._transformTextureUrl(rootUrl);
    }

    const rootUrlWithoutUriParams = rootUrl.split("?")[0];
    const lastDot = rootUrlWithoutUriParams.lastIndexOf(".");
    const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrlWithoutUriParams.substring(lastDot).toLowerCase() : "";

    let loader: Nullable<IInternalTextureLoader> = null;
    for (const availableLoader of _TextureLoaders) {
        if (availableLoader.canLoad(extension)) {
            loader = availableLoader;
            break;
        }
    }

    const onInternalError = (request?: IWebRequest, exception?: any) => {
        if (rootUrl === originalRootUrl) {
            if (onError && request) {
                onError(request.status + " " + request.statusText, exception);
            }
        } else {
            // fall back to the original url if the transformed url fails to load
            Logger.Warn(`Failed to load ${rootUrl}, falling back to the ${originalRootUrl}`);
            createCubeTextureBase(
                fes,
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
                useSRGBBuffer
            );
        }
    };

    if (loader) {
        const onloaddata = (data: ArrayBufferView | ArrayBufferView[]) => {
            if (beforeLoadCubeDataCallback) {
                beforeLoadCubeDataCallback(texture, data);
            }
            loader!.loadCubeData(data, texture, createPolynomials, onLoad, onError);
        };
        if (files && files.length === 6) {
            if (loader.supportCascades) {
                _cascadeLoadFiles(fes, scene, (images) => onloaddata(images.map((image) => new Uint8Array(image))), files, onError);
            } else {
                if (onError) {
                    onError("Textures type does not support cascades.");
                } else {
                    Logger.Warn("Texture loader does not support cascades.");
                }
            }
        } else {
            _loadFile(fes, rootUrl, (data) => onloaddata(new Uint8Array(data as ArrayBuffer)), undefined, undefined, true, onInternalError);
        }
    } else {
        if (!files) {
            throw new Error("Cannot load cubemap because files were not defined");
        }

        _cascadeLoadImgs(
            fes,
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

    fes._internalTexturesCache.push(texture);

    return texture;
};

export const createCubeTexture: ICubeTextureEngineExtension["createCubeTexture"] = function (
    engineState: IWebGLEnginePublic,
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
    useSRGBBuffer = false
): InternalTexture {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    return createCubeTextureBase(
        fes,
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
        (texture: InternalTexture) => _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true),
        (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
            const width = fes.needPOTTextures ? GetExponentOfTwo(imgs[0].width, fes._caps.maxCubemapTextureSize) : imgs[0].width;
            const height = width;

            const faces = [
                gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            ];

            _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);
            _unpackFlipY(fes, false);

            const internalFormat = format ? _getInternalFormat(fes, format, texture._useSRGBBuffer) : texture._useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : gl.RGBA;
            let texelFormat = format ? _getInternalFormat(fes, format) : gl.RGBA;

            if (texture._useSRGBBuffer && fes.webGLVersion === 1) {
                texelFormat = internalFormat;
            }

            for (let index = 0; index < faces.length; index++) {
                if (imgs[index].width !== width || imgs[index].height !== height) {
                    _prepareWorkingCanvas(fes);

                    if (!fes._workingCanvas || !fes._workingContext) {
                        Logger.Warn("Cannot create canvas to resize texture.");
                        return;
                    }
                    fes._workingCanvas.width = width;
                    fes._workingCanvas.height = height;

                    fes._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                    gl.texImage2D(faces[index], 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, fes._workingCanvas as TexImageSource);
                } else {
                    gl.texImage2D(faces[index], 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, imgs[index]);
                }
            }

            if (!noMipmap) {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            _setCubeMapTextureParams(fes, texture, !noMipmap);

            texture.width = width;
            texture.height = height;
            texture.isReady = true;
            if (format) {
                texture.format = format;
            }

            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();

            if (onLoad) {
                onLoad();
            }
        },
        !!useSRGBBuffer
    );
};

export const cubeTextureWebGLExtension: ICubeTextureEngineExtension = {
    createCubeTexture,
    createCubeTextureBase,
    _createDepthStencilCubeTexture,
    _cascadeLoadFiles,
    _cascadeLoadImgs,
    _partialLoadFile,
    _partialLoadImg,
    _setCubeMapTextureParams,
};

export default cubeTextureWebGLExtension;
