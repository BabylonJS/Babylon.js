/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import { Tools } from "./tools";
import { Texture } from "../Materials/Textures/texture";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { Constants } from "../Engines/constants";
import { initializeWebWorker, workerFunction } from "./basisWorker";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { Engine } from "core/Engines/engine";

/**
 * Info about the .basis files
 */
export class BasisFileInfo {
    /**
     * If the file has alpha
     */
    public hasAlpha: boolean;
    /**
     * Info about each image of the basis file
     */
    public images: Array<{ levels: Array<{ width: number; height: number; transcodedPixels: ArrayBufferView }> }>;
}

/**
 * Result of transcoding a basis file
 */
class TranscodeResult {
    /**
     * Info about the .basis file
     */
    public fileInfo: BasisFileInfo;
    /**
     * Format to use when loading the file
     */
    public format: number;
}

/**
 * Configuration options for the Basis transcoder
 */
export class BasisTranscodeConfiguration {
    /**
     * Supported compression formats used to determine the supported output format of the transcoder
     */
    supportedCompressionFormats?: {
        /**
         * etc1 compression format
         */
        etc1?: boolean;
        /**
         * s3tc compression format
         */
        s3tc?: boolean;
        /**
         * pvrtc compression format
         */
        pvrtc?: boolean;
        /**
         * etc2 compression format
         */
        etc2?: boolean;
        /**
         * astc compression format
         */
        astc?: boolean;
        /**
         * bc7 compression format
         */
        bc7?: boolean;
    };
    /**
     * If mipmap levels should be loaded for transcoded images (Default: true)
     */
    loadMipmapLevels?: boolean;
    /**
     * Index of a single image to load (Default: all images)
     */
    loadSingleImage?: number;
}

/**
 * @internal
 * Enum of basis transcoder formats
 */
enum BASIS_FORMATS {
    cTFETC1 = 0,
    cTFETC2 = 1,
    cTFBC1 = 2,
    cTFBC3 = 3,
    cTFBC4 = 4,
    cTFBC5 = 5,
    cTFBC7 = 6,
    cTFPVRTC1_4_RGB = 8,
    cTFPVRTC1_4_RGBA = 9,
    cTFASTC_4x4 = 10,
    cTFATC_RGB = 11,
    cTFATC_RGBA_INTERPOLATED_ALPHA = 12,
    cTFRGBA32 = 13,
    cTFRGB565 = 14,
    cTFBGR565 = 15,
    cTFRGBA4444 = 16,
    cTFFXT1_RGB = 17,
    cTFPVRTC2_4_RGB = 18,
    cTFPVRTC2_4_RGBA = 19,
    cTFETC2_EAC_R11 = 20,
    cTFETC2_EAC_RG11 = 21,
}

/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export const BasisToolsOptions = {
    /**
     * URL to use when loading the basis transcoder
     */
    JSModuleURL: `${Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.js`,
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    WasmModuleURL: `${Tools._DefaultCdnUrl}/basisTranscoder/1/basis_transcoder.wasm`,
};

/**
 * Get the internal format to be passed to texImage2D corresponding to the .basis format value
 * @param basisFormat format chosen from GetSupportedTranscodeFormat
 * @param engine
 * @returns internal format corresponding to the Basis format
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GetInternalFormatFromBasisFormat = (basisFormat: number, engine: AbstractEngine) => {
    let format;
    switch (basisFormat) {
        case BASIS_FORMATS.cTFETC1:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL;
            break;
        case BASIS_FORMATS.cTFBC1:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1;
            break;
        case BASIS_FORMATS.cTFBC4:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
            break;
        case BASIS_FORMATS.cTFASTC_4x4:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4;
            break;
        case BASIS_FORMATS.cTFETC2:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC;
            break;
        case BASIS_FORMATS.cTFBC7:
            format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM;
            break;
    }

    if (format === undefined) {
        // eslint-disable-next-line no-throw-literal
        throw "The chosen Basis transcoder format is not currently supported";
    }

    return format;
};

let _WorkerPromise: Nullable<Promise<Worker>> = null;
let _Worker: Nullable<Worker> = null;
let _actionId = 0;
const _IgnoreSupportedFormats = false;
const _CreateWorkerAsync = () => {
    if (!_WorkerPromise) {
        _WorkerPromise = new Promise((res, reject) => {
            if (_Worker) {
                res(_Worker);
            } else {
                Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisToolsOptions.WasmModuleURL))
                    .then((wasmBinary) => {
                        if (typeof URL !== "function") {
                            return reject("Basis transcoder requires an environment with a URL constructor");
                        }
                        const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunction})()`], { type: "application/javascript" }));
                        _Worker = new Worker(workerBlobUrl);
                        initializeWebWorker(_Worker, wasmBinary, BasisToolsOptions.JSModuleURL).then(res, reject);
                    })
                    .catch(reject);
            }
        });
    }
    return _WorkerPromise;
};

/**
 * Set the worker to use for transcoding
 * @param worker The worker that will be used for transcoding
 */
export const SetBasisTranscoderWorker = (worker: Worker) => {
    _Worker = worker;
};

/**
 * Transcodes a loaded image file to compressed pixel data
 * @param data image data to transcode
 * @param config configuration options for the transcoding
 * @returns a promise resulting in the transcoded image
 */
export const TranscodeAsync = (data: ArrayBuffer | ArrayBufferView, config: BasisTranscodeConfiguration): Promise<TranscodeResult> => {
    const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

    return new Promise((res, rej) => {
        _CreateWorkerAsync().then(
            () => {
                const actionId = _actionId++;
                const messageHandler = (msg: any) => {
                    if (msg.data.action === "transcode" && msg.data.id === actionId) {
                        _Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej("Transcode is not supported on this device");
                        } else {
                            res(msg.data);
                        }
                    }
                };
                _Worker!.addEventListener("message", messageHandler);

                const dataViewCopy = new Uint8Array(dataView.byteLength);
                dataViewCopy.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));
                _Worker!.postMessage({ action: "transcode", id: actionId, imageData: dataViewCopy, config: config, ignoreSupportedFormats: _IgnoreSupportedFormats }, [
                    dataViewCopy.buffer,
                ]);
            },
            (error) => {
                rej(error);
            }
        );
    });
};

/**
 * Binds a texture according to its underlying target.
 * @param texture texture to bind
 * @param engine the engine to bind the texture in
 */
const BindTexture = (texture: InternalTexture, engine: Engine): void => {
    let target: GLenum = engine._gl?.TEXTURE_2D;
    if (texture.isCube) {
        target = engine._gl?.TEXTURE_CUBE_MAP;
    }

    engine._bindTextureDirectly(target, texture, true);
};

/**
 * Loads a texture from the transcode result
 * @param texture texture load to
 * @param transcodeResult the result of transcoding the basis file to load from
 */
export const LoadTextureFromTranscodeResult = (texture: InternalTexture, transcodeResult: TranscodeResult) => {
    const engine = texture.getEngine() as Engine;
    for (let i = 0; i < transcodeResult.fileInfo.images.length; i++) {
        const rootImage = transcodeResult.fileInfo.images[i].levels[0];
        texture._invertVScale = texture.invertY;
        if (transcodeResult.format === -1 || transcodeResult.format === BASIS_FORMATS.cTFRGB565) {
            // No compatable compressed format found, fallback to RGB
            texture.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
            texture.format = Constants.TEXTUREFORMAT_RGB;

            if (engine._features.basisNeedsPOT && (Math.log2(rootImage.width) % 1 !== 0 || Math.log2(rootImage.height) % 1 !== 0)) {
                // Create non power of two texture
                const source = new InternalTexture(engine, InternalTextureSource.Temp);

                texture._invertVScale = texture.invertY;
                source.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
                source.format = Constants.TEXTUREFORMAT_RGB;
                // Fallback requires aligned width/height
                source.width = (rootImage.width + 3) & ~3;
                source.height = (rootImage.height + 3) & ~3;
                BindTexture(source, engine);
                engine._uploadDataToTextureDirectly(source, new Uint16Array(rootImage.transcodedPixels.buffer), i, 0, Constants.TEXTUREFORMAT_RGB, true);

                // Resize to power of two
                engine._rescaleTexture(source, texture, engine.scenes[0], engine._getInternalFormat(Constants.TEXTUREFORMAT_RGB), () => {
                    engine._releaseTexture(source);
                    BindTexture(texture, engine);
                });
            } else {
                // Fallback is already inverted
                texture._invertVScale = !texture.invertY;

                // Upload directly
                texture.width = (rootImage.width + 3) & ~3;
                texture.height = (rootImage.height + 3) & ~3;
                texture.samplingMode = Constants.TEXTURE_LINEAR_LINEAR;
                BindTexture(texture, engine);
                engine._uploadDataToTextureDirectly(texture, new Uint16Array(rootImage.transcodedPixels.buffer), i, 0, Constants.TEXTUREFORMAT_RGB, true);
            }
        } else {
            texture.width = rootImage.width;
            texture.height = rootImage.height;
            texture.generateMipMaps = transcodeResult.fileInfo.images[i].levels.length > 1;

            const format = BasisTools.GetInternalFormatFromBasisFormat(transcodeResult.format!, engine);
            texture.format = format;

            BindTexture(texture, engine);

            // Upload all mip levels in the file
            const levels = transcodeResult.fileInfo.images[i].levels;

            for (let index = 0; index < levels.length; index++) {
                const level = levels[index];
                engine._uploadCompressedDataToTextureDirectly(texture, format, level.width, level.height, level.transcodedPixels, i, index);
            }

            if (engine._features.basisNeedsPOT && (Math.log2(texture.width) % 1 !== 0 || Math.log2(texture.height) % 1 !== 0)) {
                Tools.Warn(
                    "Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1."
                );
                texture._cachedWrapU = Texture.CLAMP_ADDRESSMODE;
                texture._cachedWrapV = Texture.CLAMP_ADDRESSMODE;
            }
        }
    }
};

/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export const BasisTools = {
    /**
     * URL to use when loading the basis transcoder
     */
    JSModuleURL: BasisToolsOptions.JSModuleURL,
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    WasmModuleURL: BasisToolsOptions.WasmModuleURL,

    /**
     * Get the internal format to be passed to texImage2D corresponding to the .basis format value
     * @param basisFormat format chosen from GetSupportedTranscodeFormat
     * @returns internal format corresponding to the Basis format
     */
    GetInternalFormatFromBasisFormat,

    /**
     * Transcodes a loaded image file to compressed pixel data
     * @param data image data to transcode
     * @param config configuration options for the transcoding
     * @returns a promise resulting in the transcoded image
     */
    TranscodeAsync,

    /**
     * Loads a texture from the transcode result
     * @param texture texture load to
     * @param transcodeResult the result of transcoding the basis file to load from
     */
    LoadTextureFromTranscodeResult,
};

Object.defineProperty(BasisTools, "JSModuleURL", {
    get: function (this: null) {
        return BasisToolsOptions.JSModuleURL;
    },
    set: function (this: null, value: string) {
        BasisToolsOptions.JSModuleURL = value;
    },
});

Object.defineProperty(BasisTools, "WasmModuleURL", {
    get: function (this: null) {
        return BasisToolsOptions.WasmModuleURL;
    },
    set: function (this: null, value: string) {
        BasisToolsOptions.WasmModuleURL = value;
    },
});
