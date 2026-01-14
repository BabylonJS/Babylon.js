/* eslint-disable @typescript-eslint/no-unused-vars */
import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { Texture } from "../../../Materials/Textures/texture";
import { CreateRadianceImageDataArrayBufferViews, GetEnvInfo, UploadEnvSpherical } from "../../../Misc/environmentTextureTools";
import type { IWebRequest } from "../../../Misc/interfaces/iWebRequest";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { ThinNativeEngine } from "../../thinNativeEngine";

declare module "../../../Engines/thinNativeEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinNativeEngine {
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
            noMipmap?: boolean,
            onLoad?: Nullable<(data?: any) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number,
            forcedExtension?: any,
            createPolynomials?: boolean,
            lodScale?: number,
            lodOffset?: number,
            fallback?: Nullable<InternalTexture>,
            loaderOptions?: any,
            useSRGBBuffer?: boolean,
            buffer?: Nullable<ArrayBufferView>
        ): InternalTexture;
    }
}

ThinNativeEngine.prototype.createCubeTexture = function (
    rootUrl: string,
    scene: Nullable<Scene>,
    files: Nullable<string[]>,
    noMipmap?: boolean,
    onLoad: Nullable<(data?: any) => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    format?: number,
    forcedExtension: any = null,
    createPolynomials = false,
    lodScale: number = 0,
    lodOffset: number = 0,
    fallback: Nullable<InternalTexture> = null,
    loaderOptions?: any,
    useSRGBBuffer = false,
    buffer: Nullable<ArrayBufferView> = null
): InternalTexture {
    const texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Cube);
    texture.isCube = true;
    texture.url = rootUrl;
    texture.generateMipMaps = !noMipmap;
    texture._lodGenerationScale = lodScale;
    texture._lodGenerationOffset = lodOffset;
    texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !!noMipmap);

    if (!this._doNotHandleContextLost) {
        texture._extension = forcedExtension;
        texture._files = files;
        texture._buffer = buffer;
    }

    const lastDot = rootUrl.lastIndexOf(".");
    const extension = forcedExtension ? forcedExtension : lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "";

    // TODO: use texture loader to load env files?
    if (extension === ".env") {
        const onloaddata = (data: ArrayBufferView) => {
            const info = GetEnvInfo(data)!;
            texture.width = info.width;
            texture.height = info.width;

            UploadEnvSpherical(texture, info);

            const specularInfo = info.specular;
            if (!specularInfo) {
                throw new Error(`Nothing else parsed so far`);
            }

            texture._lodGenerationScale = specularInfo.lodGenerationScale;
            const imageData = CreateRadianceImageDataArrayBufferViews(data, info);

            texture.format = Constants.TEXTUREFORMAT_RGBA;
            texture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            texture.generateMipMaps = true;
            texture.getEngine().updateTextureSamplingMode(Texture.TRILINEAR_SAMPLINGMODE, texture);
            texture._isRGBD = true;
            texture.invertY = true;

            this._engine.loadCubeTextureWithMips(
                texture._hardwareTexture!.underlyingResource,
                imageData,
                false,
                texture._useSRGBBuffer,
                () => {
                    texture.isReady = true;
                    if (onLoad) {
                        onLoad();
                    }
                },
                () => {
                    throw new Error("Could not load a native cube texture.");
                }
            );
        };

        if (buffer) {
            onloaddata(buffer);
        } else if (files && files.length === 6) {
            throw new Error(`Multi-file loading not allowed on env files.`);
        } else {
            const onInternalError = (request?: IWebRequest, exception?: any) => {
                if (onError && request) {
                    onError(request.status + " " + request.statusText, exception);
                }
            };

            this._loadFile(
                rootUrl,
                (data) => {
                    onloaddata(new Uint8Array(data as ArrayBuffer, 0, (data as ArrayBuffer).byteLength));
                },
                undefined,
                undefined,
                true,
                onInternalError
            );
        }
    } else {
        if (!files || files.length !== 6) {
            throw new Error("Cannot load cubemap because 6 files were not defined");
        }

        // Reorder from [+X, +Y, +Z, -X, -Y, -Z] to [+X, -X, +Y, -Y, +Z, -Z].
        const reorderedFiles = [files[0], files[3], files[1], files[4], files[2], files[5]];
        // eslint-disable-next-line github/no-then
        Promise.all(reorderedFiles.map(async (file) => await this._loadFileAsync(file, undefined, true).then((data) => new Uint8Array(data, 0, data.byteLength))))
            // eslint-disable-next-line github/no-then
            .then(async (data) => {
                return await new Promise<void>((resolve, reject) => {
                    this._engine.loadCubeTexture(texture._hardwareTexture!.underlyingResource, data, !noMipmap, true, texture._useSRGBBuffer, resolve, reject);
                });
            })
            // eslint-disable-next-line github/no-then
            .then(
                () => {
                    texture.isReady = true;
                    if (onLoad) {
                        onLoad();
                    }
                },
                (error) => {
                    if (onError) {
                        onError(`Failed to load cubemap: ${error.message}`, error);
                    }
                }
            );
    }

    this._internalTexturesCache.push(texture);

    return texture;
};
