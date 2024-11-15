import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Constants } from "../constants";
import type { DepthTextureCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import { GetExponentOfTwo } from "../../Misc/tools.functions";

declare module "../../Engines/abstractEngine" {
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
            buffer: ArrayBufferView
        ): InternalTexture;

        /**
         * Force the mipmap generation for the given render target texture
         * @param texture defines the render target texture to use
         * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
         */
        generateMipMapsForCubemap(texture: InternalTexture, unbind?: boolean): void;
    }
}

ThinEngine.prototype._createDepthStencilCubeTexture = function (size: number, options: DepthTextureCreationOptions): InternalTexture {
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

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

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
    useSRGBBuffer = false,
    buffer: Nullable<ArrayBufferView> = null
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
            const width = this.needPOTTextures ? GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize) : imgs[0].width;
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

            const internalFormat = format ? this._getInternalFormat(format, texture._useSRGBBuffer) : texture._useSRGBBuffer ? this._glSRGBExtensionValues.SRGB8_ALPHA8 : gl.RGBA;
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
        !!useSRGBBuffer,
        buffer
    );
};

ThinEngine.prototype.generateMipMapsForCubemap = function (texture: InternalTexture, unbind = true) {
    if (texture.generateMipMaps) {
        const gl = this._gl;
        this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        if (unbind) {
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
        }
    }
};
