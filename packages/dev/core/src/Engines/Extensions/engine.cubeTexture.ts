import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { IInternalTextureLoader } from "../../Materials/Textures/internalTextureLoader";
import { LoadImage } from "../../Misc/fileTools";
import { RandomGUID } from "../../Misc/guid";
import type { IWebRequest } from "../../Misc/interfaces/iWebRequest";
import { Constants } from "../constants";
import type { DepthTextureCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "../renderTargetWrapper";

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
    const internalTexture = new InternalTexture(this, InternalTextureSource.DepthStencil);
    internalTexture.isCube = true;

    if (this.webGLVersion === 1) {
        Logger.Error("Depth cube texture is not supported by WebGL 1.");
        return internalTexture;
    }

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options,
    };

    const gl = this._gl;
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, internalTexture, true);

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

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

    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

    this._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

ThinEngine.prototype._partialLoadFile = function (
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

ThinEngine.prototype._cascadeLoadFiles = function (
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

ThinEngine.prototype._cascadeLoadImgs = function (
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

ThinEngine.prototype._setCubeMapTextureParams = function (texture: InternalTexture, loadMipmap: boolean, maxLevel?: number): void {
    const gl = this._gl;
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texture.samplingMode = loadMipmap ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_LINEAR_LINEAR;

    if (loadMipmap && this.getCaps().textureMaxLevel && maxLevel !== undefined && maxLevel > 0) {
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAX_LEVEL, maxLevel);
        texture._maxLodLevel = maxLevel;
    }

    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
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
    const texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Cube);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;
    texture._useSRGBBuffer = !!useSRGBBuffer && this._caps.supportSRGBBuffers && (this.webGLVersion > 1 || this.isWebGPU || !!noMipmap);

    if (!this._doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
    }

    const originalRootUrl = rootUrl;
    if (this._transformTextureUrl && !fallback) {
        rootUrl = this._transformTextureUrl(rootUrl);
    }

    const rootUrlWithoutUriParams = rootUrl.split("?")[0];
    const lastDot = rootUrlWithoutUriParams.lastIndexOf(".");
    const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrlWithoutUriParams.substring(lastDot).toLowerCase() : "";

    let loader: Nullable<IInternalTextureLoader> = null;
    for (const availableLoader of ThinEngine._TextureLoaders) {
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
    } else {
        if (!files) {
            throw new Error("Cannot load cubemap because files were not defined");
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
    useSRGBBuffer = false
): InternalTexture {
    const gl = this._gl;

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
        (texture: InternalTexture) => this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true),
        (texture: InternalTexture, imgs: HTMLImageElement[] | ImageBitmap[]) => {
            const width = this.needPOTTextures ? ThinEngine.GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize) : imgs[0].width;
            const height = width;

            const faces = [
                gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            ];

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            this._unpackFlipY(false);

            const internalFormat = format ? this._getInternalFormat(format, texture._useSRGBBuffer) : texture._useSRGBBuffer ? gl.SRGB8_ALPHA8 : gl.RGBA;
            let texelFormat = format ? this._getInternalFormat(format) : gl.RGBA;

            if (texture._useSRGBBuffer && this.webGLVersion === 1) {
                texelFormat = internalFormat;
            }

            for (let index = 0; index < faces.length; index++) {
                if (imgs[index].width !== width || imgs[index].height !== height) {
                    this._prepareWorkingCanvas();

                    if (!this._workingCanvas || !this._workingContext) {
                        Logger.Warn("Cannot create canvas to resize texture.");
                        return;
                    }
                    this._workingCanvas.width = width;
                    this._workingCanvas.height = height;

                    this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                    gl.texImage2D(faces[index], 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, this._workingCanvas as TexImageSource);
                } else {
                    gl.texImage2D(faces[index], 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, imgs[index]);
                }
            }

            if (!noMipmap) {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            this._setCubeMapTextureParams(texture, !noMipmap);

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
