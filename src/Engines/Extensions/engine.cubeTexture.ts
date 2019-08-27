import { Engine, DepthTextureCreationOptions } from "../../Engines/engine";
import { InternalTexture } from '../../Materials/Textures/internalTexture';
import { Logger } from '../../Misc/logger';
import { Nullable } from '../../types';
import { Scene } from '../../scene';
import { IInternalTextureLoader } from '../../Materials/Textures/internalTextureLoader';
import { WebRequest } from '../../Misc/webRequest';
import { FileTools } from '../../Misc/fileTools';

declare module "../../Engines/engine" {
    export interface Engine {
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
         * @param excludeLoaders array of texture loaders that should be excluded when picking a loader for the texture (defualt: empty array)
         * @returns the cube texture as an InternalTexture
         */
        createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap: boolean | undefined,
            onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined, forcedExtension: any, createPolynomials: boolean, lodScale: number, lodOffset: number, fallback: Nullable<InternalTexture>, excludeLoaders: Array<IInternalTextureLoader>): InternalTexture;

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
        createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined, forcedExtension: any): InternalTexture;

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
        createCubeTexture(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap: boolean,
            onLoad: Nullable<(data?: any) => void>, onError: Nullable<(message?: string, exception?: any) => void>,
            format: number | undefined, forcedExtension: any, createPolynomials: boolean, lodScale: number, lodOffset: number): InternalTexture;

        /** @hidden */
        _partialLoadFile(url: string, index: number, loadedFiles: (string | ArrayBuffer)[], onfinish: (files: (string | ArrayBuffer)[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void>): void;

        /** @hidden */
        _cascadeLoadFiles(scene: Nullable<Scene>, onfinish: (images: (string | ArrayBuffer)[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void>): void;

        /** @hidden */
        _cascadeLoadImgs(scene: Nullable<Scene>, onfinish: (images: HTMLImageElement[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void>): void;

        /** @hidden */
        _partialLoadImg(url: string, index: number, loadedImages: HTMLImageElement[], scene: Nullable<Scene>, onfinish: (images: HTMLImageElement[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void>): void;
    }
}

Engine.prototype._createDepthStencilCubeTexture = function(size: number, options: DepthTextureCreationOptions): InternalTexture {
    var internalTexture = new InternalTexture(this, InternalTexture.DATASOURCE_UNKNOWN);
    internalTexture.isCube = true;

    if (this.webGLVersion === 1) {
        Logger.Error("Depth cube texture is not supported by WebGL 1.");
        return internalTexture;
    }

    var internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options
    };

    var gl = this._gl;
    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, internalTexture, true);

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

    // Create the depth/stencil buffer
    for (var face = 0; face < 6; face++) {
        if (internalOptions.generateStencil) {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH24_STENCIL8, size, size, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        }
        else {
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        }
    }

    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

    return internalTexture;
};

Engine.prototype._partialLoadFile = function(url: string, index: number, loadedFiles: (string | ArrayBuffer)[], onfinish: (files: (string | ArrayBuffer)[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null): void {
    var onload = (data: string | ArrayBuffer) => {
        loadedFiles[index] = data;
        (<any>loadedFiles)._internalCount++;

        if ((<any>loadedFiles)._internalCount === 6) {
            onfinish(loadedFiles);
        }
    };

    const onerror = (request?: WebRequest, exception?: any) => {
        if (onErrorCallBack && request) {
            onErrorCallBack(request.status + " " + request.statusText, exception);
        }
    };

    this._loadFile(url, onload, undefined, undefined, true, onerror);
};

Engine.prototype._cascadeLoadFiles = function(scene: Nullable<Scene>, onfinish: (images: (string | ArrayBuffer)[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void> = null): void {
    var loadedFiles: (string | ArrayBuffer)[] = [];
    (<any>loadedFiles)._internalCount = 0;

    for (let index = 0; index < 6; index++) {
        this._partialLoadFile(files[index], index, loadedFiles, onfinish, onError);
    }
};

Engine.prototype._cascadeLoadImgs = function(scene: Nullable<Scene>,
    onfinish: (images: HTMLImageElement[]) => void, files: string[], onError: Nullable<(message?: string, exception?: any) => void> = null) {

    var loadedImages: HTMLImageElement[] = [];
    (<any>loadedImages)._internalCount = 0;

    for (let index = 0; index < 6; index++) {
        this._partialLoadImg(files[index], index, loadedImages, scene, onfinish, onError);
    }
};

Engine.prototype._partialLoadImg = function(url: string, index: number, loadedImages: HTMLImageElement[], scene: Nullable<Scene>,
    onfinish: (images: HTMLImageElement[]) => void, onErrorCallBack: Nullable<(message?: string, exception?: any) => void> = null) {

    var img: HTMLImageElement;

    var onload = () => {
        loadedImages[index] = img;
        (<any>loadedImages)._internalCount++;

        if (scene) {
            scene._removePendingData(img);
        }

        if ((<any>loadedImages)._internalCount === 6) {
            onfinish(loadedImages);
        }
    };

    var onerror = (message?: string, exception?: any) => {
        if (scene) {
            scene._removePendingData(img);
        }

        if (onErrorCallBack) {
            onErrorCallBack(message, exception);
        }
    };

    img = FileTools.LoadImage(url, onload, onerror, scene ? scene.offlineProvider : null);
    if (scene) {
        scene._addPendingData(img);
    }
};

Engine.prototype.createCubeTexture = function(rootUrl: string, scene: Nullable<Scene>, files: Nullable<string[]>, noMipmap?: boolean, onLoad: Nullable<(data?: any) => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format?: number, forcedExtension: any = null, createPolynomials: boolean = false, lodScale: number = 0, lodOffset: number = 0, fallback: Nullable<InternalTexture> = null, excludeLoaders: Array<IInternalTextureLoader> = []): InternalTexture {
    var gl = this._gl;

    var texture = fallback ? fallback : new InternalTexture(this, InternalTexture.DATASOURCE_CUBE);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;

    if (!this._doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
    }

    var lastDot = rootUrl.lastIndexOf('.');
    var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");

    let loader: Nullable<IInternalTextureLoader> = null;
    for (let availableLoader of Engine._TextureLoaders) {
        if (excludeLoaders.indexOf(availableLoader) === -1 && availableLoader.canLoad(extension, this._textureFormatInUse, fallback, false, false)) {
            loader = availableLoader;
            break;
        }
    }

    let onInternalError = (request?: WebRequest, exception?: any) => {
        if (loader) {
            const fallbackUrl = loader.getFallbackTextureUrl(texture.url, this._textureFormatInUse);
            Logger.Warn((loader.constructor as any).name + " failed when trying to load " + texture.url + ", falling back to the next supported loader");
            if (fallbackUrl) {
                excludeLoaders.push(loader);
                this.createCubeTexture(fallbackUrl, scene, files, noMipmap, onLoad, onError, format, extension, createPolynomials, lodScale, lodOffset, texture, excludeLoaders);
                return;
            }
        }

        if (onError && request) {
            onError(request.status + " " + request.statusText, exception);
        }
    };

    if (loader) {
        rootUrl = loader.transformUrl(rootUrl, this._textureFormatInUse);

        const onloaddata = (data: any) => {
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            loader!.loadCubeData(data, texture, createPolynomials, onLoad, onError);
        };
        if (files && files.length === 6) {
            if (loader.supportCascades) {
                this._cascadeLoadFiles(scene, onloaddata, files, onError);
            }
            else {
                if (onError) {
                    onError("Textures type does not support cascades.");
                } else {
                    Logger.Warn("Texture loader does not support cascades.");
                }
            }
        }
        else {
            this._loadFile(rootUrl, onloaddata, undefined, undefined, true, onInternalError);
        }
    }
    else {
        if (!files) {
            throw new Error("Cannot load cubemap because files were not defined");
        }

        this._cascadeLoadImgs(scene, (imgs) => {
            var width = this.needPOTTextures ? Engine.GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize) : imgs[0].width;
            var height = width;

            this._prepareWorkingCanvas();

            if (!this._workingCanvas || !this._workingContext) {
                return;
            }
            this._workingCanvas.width = width;
            this._workingCanvas.height = height;

            var faces = [
                gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            this._unpackFlipY(false);

            let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
            for (var index = 0; index < faces.length; index++) {
                if (imgs[index].width !== width || imgs[index].height !== height) {
                    this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                    gl.texImage2D(faces[index], 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, this._workingCanvas);
                } else {
                    gl.texImage2D(faces[index], 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, imgs[index]);
                }
            }

            if (!noMipmap) {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            this._setCubeMapTextureParams(!noMipmap);

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
        }, files, onError);
    }

    this._internalTexturesCache.push(texture);

    return texture;
};