/** This file must only contain pure code and pure imports */

import { InternalTextureSource, InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Texture } from "../../../Materials/Textures/texture.pure";
import { CreateRadianceImageDataArrayBufferViews, GetEnvInfo, UploadEnvSpherical } from "../../../Misc/environmentTextureTools.pure";
import { IWebRequest } from "../../../Misc/interfaces/iWebRequest";
import { Scene } from "../../../scene.pure";
import { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { ThinNativeEngine } from "../../thinNativeEngine.pure";

let _registered = false;
export function registerNativeEngineCubeTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
