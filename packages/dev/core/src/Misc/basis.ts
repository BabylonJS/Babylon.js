/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import { Tools } from "./tools";
import { Texture } from "../Materials/Textures/texture";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { Scalar } from "../Maths/math.scalar";
import { Constants } from "../Engines/constants";
import type { Engine } from "../Engines/engine";

/**
 * Info about the .basis files
 */
class BasisFileInfo {
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
export const GetInternalFormatFromBasisFormat = (basisFormat: number, engine: Engine) => {
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
                        const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], { type: "application/javascript" }));
                        _Worker = new Worker(workerBlobUrl);

                        const initHandler = (msg: any) => {
                            if (msg.data.action === "init") {
                                _Worker!.removeEventListener("message", initHandler);
                                res(_Worker!);
                            } else if (msg.data.action === "error") {
                                reject(msg.data.error || "error initializing worker");
                            }
                        };
                        _Worker.addEventListener("message", initHandler);
                        _Worker.postMessage({ action: "init", url: Tools.GetBabylonScriptURL(BasisToolsOptions.JSModuleURL), wasmBinary: wasmBinary });
                    })
                    .catch(reject);
            }
        });
    }
    return _WorkerPromise;
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

            if (engine._features.basisNeedsPOT && (Scalar.Log2(rootImage.width) % 1 !== 0 || Scalar.Log2(rootImage.height) % 1 !== 0)) {
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
            transcodeResult.fileInfo.images[i].levels.forEach((level: any, index: number) => {
                engine._uploadCompressedDataToTextureDirectly(texture, format, level.width, level.height, level.transcodedPixels, i, index);
            });

            if (engine._features.basisNeedsPOT && (Scalar.Log2(texture.width) % 1 !== 0 || Scalar.Log2(texture.height) % 1 !== 0)) {
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

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare let BASIS: any;
function workerFunc(): void {
    const _BASIS_FORMAT = {
        cTFETC1: 0,
        cTFETC2: 1,
        cTFBC1: 2,
        cTFBC3: 3,
        cTFBC4: 4,
        cTFBC5: 5,
        cTFBC7: 6,
        cTFPVRTC1_4_RGB: 8,
        cTFPVRTC1_4_RGBA: 9,
        cTFASTC_4x4: 10,
        cTFATC_RGB: 11,
        cTFATC_RGBA_INTERPOLATED_ALPHA: 12,
        cTFRGBA32: 13,
        cTFRGB565: 14,
        cTFBGR565: 15,
        cTFRGBA4444: 16,
        cTFFXT1_RGB: 17,
        cTFPVRTC2_4_RGB: 18,
        cTFPVRTC2_4_RGBA: 19,
        cTFETC2_EAC_R11: 20,
        cTFETC2_EAC_RG11: 21,
    };
    let transcoderModulePromise: Nullable<PromiseLike<any>> = null;
    onmessage = (event) => {
        if (event.data.action === "init") {
            // Load the transcoder if it hasn't been yet
            if (!transcoderModulePromise) {
                // make sure we loaded the script correctly
                try {
                    importScripts(event.data.url);
                } catch (e) {
                    postMessage({ action: "error", error: e });
                }
                transcoderModulePromise = BASIS({
                    // Override wasm binary
                    wasmBinary: event.data.wasmBinary,
                });
            }
            if (transcoderModulePromise !== null) {
                transcoderModulePromise.then((m) => {
                    BASIS = m;
                    m.initializeBasis();
                    postMessage({ action: "init" });
                });
            }
        } else if (event.data.action === "transcode") {
            // Transcode the basis image and return the resulting pixels
            const config: BasisTranscodeConfiguration = event.data.config;
            const imgData = event.data.imageData;
            const loadedFile = new BASIS.BasisFile(imgData);
            const fileInfo = GetFileInfo(loadedFile);
            let format = event.data.ignoreSupportedFormats ? null : GetSupportedTranscodeFormat(event.data.config, fileInfo);

            let needsConversion = false;
            if (format === null) {
                needsConversion = true;
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            }

            // Begin transcode
            let success = true;
            if (!loadedFile.startTranscoding()) {
                success = false;
            }

            const buffers: Array<any> = [];
            for (let imageIndex = 0; imageIndex < fileInfo.images.length; imageIndex++) {
                if (!success) {
                    break;
                }
                const image = fileInfo.images[imageIndex];
                if (config.loadSingleImage === undefined || config.loadSingleImage === imageIndex) {
                    let mipCount = image.levels.length;
                    if (config.loadMipmapLevels === false) {
                        mipCount = 1;
                    }
                    for (let levelIndex = 0; levelIndex < mipCount; levelIndex++) {
                        const levelInfo = image.levels[levelIndex];

                        const pixels = TranscodeLevel(loadedFile, imageIndex, levelIndex, format!, needsConversion);
                        if (!pixels) {
                            success = false;
                            break;
                        }
                        levelInfo.transcodedPixels = pixels;
                        buffers.push(levelInfo.transcodedPixels.buffer);
                    }
                }
            }
            // Close file
            loadedFile.close();
            loadedFile.delete();

            if (needsConversion) {
                format = -1;
            }
            if (!success) {
                postMessage({ action: "transcode", success: success, id: event.data.id });
            } else {
                postMessage({ action: "transcode", success: success, id: event.data.id, fileInfo: fileInfo, format: format }, buffers);
            }
        }
    };

    /**
     * Detects the supported transcode format for the file
     * @param config transcode config
     * @param fileInfo info about the file
     * @returns the chosed format or null if none are supported
     */
    function GetSupportedTranscodeFormat(config: BasisTranscodeConfiguration, fileInfo: BasisFileInfo): Nullable<number> {
        let format = null;
        if (config.supportedCompressionFormats) {
            if (config.supportedCompressionFormats.astc) {
                format = _BASIS_FORMAT.cTFASTC_4x4;
            } else if (config.supportedCompressionFormats.bc7) {
                format = _BASIS_FORMAT.cTFBC7;
            } else if (config.supportedCompressionFormats.s3tc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            } else if (config.supportedCompressionFormats.pvrtc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFPVRTC1_4_RGBA : _BASIS_FORMAT.cTFPVRTC1_4_RGB;
            } else if (config.supportedCompressionFormats.etc2) {
                format = _BASIS_FORMAT.cTFETC2;
            } else if (config.supportedCompressionFormats.etc1) {
                format = _BASIS_FORMAT.cTFETC1;
            } else {
                format = _BASIS_FORMAT.cTFRGB565;
            }
        }
        return format;
    }

    /**
     * Retrieves information about the basis file eg. dimensions
     * @param basisFile the basis file to get the info from
     * @returns information about the basis file
     */
    function GetFileInfo(basisFile: any): BasisFileInfo {
        const hasAlpha = basisFile.getHasAlpha();
        const imageCount = basisFile.getNumImages();
        const images = [];
        for (let i = 0; i < imageCount; i++) {
            const imageInfo = {
                levels: [] as Array<any>,
            };
            const levelCount = basisFile.getNumLevels(i);
            for (let level = 0; level < levelCount; level++) {
                const levelInfo = {
                    width: basisFile.getImageWidth(i, level),
                    height: basisFile.getImageHeight(i, level),
                };
                imageInfo.levels.push(levelInfo);
            }
            images.push(imageInfo);
        }
        const info = { hasAlpha, images };
        return info;
    }

    function TranscodeLevel(loadedFile: any, imageIndex: number, levelIndex: number, format: number, convertToRgb565: boolean): Nullable<Uint8Array | Uint16Array> {
        const dstSize = loadedFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, format);
        let dst: Uint8Array | Uint16Array = new Uint8Array(dstSize);
        if (!loadedFile.transcodeImage(dst, imageIndex, levelIndex, format, 1, 0)) {
            return null;
        }
        // If no supported format is found, load as dxt and convert to rgb565
        if (convertToRgb565) {
            const alignedWidth = (loadedFile.getImageWidth(imageIndex, levelIndex) + 3) & ~3;
            const alignedHeight = (loadedFile.getImageHeight(imageIndex, levelIndex) + 3) & ~3;
            dst = ConvertDxtToRgb565(dst, 0, alignedWidth, alignedHeight);
        }
        return dst;
    }

    /**
     * From https://github.com/BinomialLLC/basis_universal/blob/master/webgl/texture/dxt-to-rgb565.js
     * An unoptimized version of dxtToRgb565.  Also, the floating
     * point math used to compute the colors actually results in
     * slightly different colors compared to hardware DXT decoders.
     * @param src dxt src pixels
     * @param srcByteOffset offset for the start of src
     * @param  width aligned width of the image
     * @param  height aligned height of the image
     * @returns the converted pixels
     */
    function ConvertDxtToRgb565(src: Uint8Array, srcByteOffset: number, width: number, height: number): Uint16Array {
        const c = new Uint16Array(4);
        const dst = new Uint16Array(width * height);

        const blockWidth = width / 4;
        const blockHeight = height / 4;
        for (let blockY = 0; blockY < blockHeight; blockY++) {
            for (let blockX = 0; blockX < blockWidth; blockX++) {
                const i = srcByteOffset + 8 * (blockY * blockWidth + blockX);
                c[0] = src[i] | (src[i + 1] << 8);
                c[1] = src[i + 2] | (src[i + 3] << 8);
                c[2] =
                    ((2 * (c[0] & 0x1f) + 1 * (c[1] & 0x1f)) / 3) |
                    (((2 * (c[0] & 0x7e0) + 1 * (c[1] & 0x7e0)) / 3) & 0x7e0) |
                    (((2 * (c[0] & 0xf800) + 1 * (c[1] & 0xf800)) / 3) & 0xf800);
                c[3] =
                    ((2 * (c[1] & 0x1f) + 1 * (c[0] & 0x1f)) / 3) |
                    (((2 * (c[1] & 0x7e0) + 1 * (c[0] & 0x7e0)) / 3) & 0x7e0) |
                    (((2 * (c[1] & 0xf800) + 1 * (c[0] & 0xf800)) / 3) & 0xf800);
                for (let row = 0; row < 4; row++) {
                    const m = src[i + 4 + row];
                    let dstI = (blockY * 4 + row) * width + blockX * 4;
                    dst[dstI++] = c[m & 0x3];
                    dst[dstI++] = c[(m >> 2) & 0x3];
                    dst[dstI++] = c[(m >> 4) & 0x3];
                    dst[dstI++] = c[(m >> 6) & 0x3];
                }
            }
        }
        return dst;
    }
}

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
