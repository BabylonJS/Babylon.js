import { Nullable } from '../types';
import { Tools } from './tools';
import { Texture } from '../Materials/Textures/texture';
import { InternalTexture, InternalTextureSource } from '../Materials/Textures/internalTexture';
import { Scalar } from '../Maths/math.scalar';
import { Constants } from '../Engines/constants';
import { Engine } from '../Engines/engine';

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
    public images: Array<{levels: Array<{width: number, height: number, transcodedPixels: ArrayBufferView}>}>;
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
 * @hidden
 * Enum of basis transcoder formats
 */
enum BASIS_FORMATS {
    cTFETC1 = 0,
    cTFBC1 = 1,
    cTFBC4 = 2,
    cTFPVRTC1_4_OPAQUE_ONLY = 3,
    cTFBC7_M6_OPAQUE_ONLY = 4,
    cTFETC2 = 5,
    cTFBC3 = 6,
    cTFBC5 = 7
}

/**
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export class BasisTools {
    private static _IgnoreSupportedFormats = false;
    /**
     * URL to use when loading the basis transcoder
     */
    public static JSModuleURL = "https://preview.babylonjs.com/basisTranscoder/basis_transcoder.js";
    /**
     * URL to use when loading the wasm module for the transcoder
     */
    public static WasmModuleURL = "https://preview.babylonjs.com/basisTranscoder/basis_transcoder.wasm";

    /**
     * Get the internal format to be passed to texImage2D corresponding to the .basis format value
     * @param basisFormat format chosen from GetSupportedTranscodeFormat
     * @returns internal format corresponding to the Basis format
     */
    public static GetInternalFormatFromBasisFormat(basisFormat: number) {
        // Corrisponding internal formats
        var COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
        var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
        var RGB_ETC1_Format = 36196;

        if (basisFormat === BASIS_FORMATS.cTFETC1) {
            return RGB_ETC1_Format;
        }else if (basisFormat === BASIS_FORMATS.cTFBC1) {
            return COMPRESSED_RGB_S3TC_DXT1_EXT;
        }else if (basisFormat === BASIS_FORMATS.cTFBC3) {
            return COMPRESSED_RGBA_S3TC_DXT5_EXT;
        }else {
            throw "The chosen Basis transcoder format is not currently supported";
        }
    }

    private static _WorkerPromise: Nullable<Promise<Worker>> = null;
    private static _Worker: Nullable<Worker> = null;
    private static _actionId = 0;
    private static _CreateWorkerAsync() {
        if (!this._WorkerPromise) {
            this._WorkerPromise = new Promise((res) => {
                if (this._Worker) {
                    res(this._Worker);
                }else {
                    Tools.LoadFileAsync(BasisTools.WasmModuleURL).then((wasmBinary) => {
                        const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], { type: "application/javascript" }));
                        this._Worker = new Worker(workerBlobUrl);

                        var initHandler = (msg: any) => {
                            if (msg.data.action === "init") {
                                this._Worker!.removeEventListener("message", initHandler);
                                res(this._Worker!);
                            }
                        };
                        this._Worker.addEventListener("message", initHandler);
                        this._Worker.postMessage({action: "init", url: BasisTools.JSModuleURL, wasmBinary: wasmBinary});
                    });
                }
            });
        }
        return this._WorkerPromise;
    }

    /**
     * Transcodes a loaded image file to compressed pixel data
     * @param data image data to transcode
     * @param config configuration options for the transcoding
     * @returns a promise resulting in the transcoded image
     */
    public static TranscodeAsync(data: ArrayBuffer | ArrayBufferView, config: BasisTranscodeConfiguration): Promise<TranscodeResult> {
        const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

        return new Promise((res, rej) => {
            this._CreateWorkerAsync().then(() => {
                var actionId = this._actionId++;
                var messageHandler = (msg: any) => {
                    if (msg.data.action === "transcode" && msg.data.id === actionId) {
                        this._Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej("Transcode is not supported on this device");
                        }else {
                            res(msg.data);
                        }
                    }
                };
                this._Worker!.addEventListener("message", messageHandler);

                const dataViewCopy = new Uint8Array(dataView.byteLength);
                dataViewCopy.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));
                this._Worker!.postMessage({action: "transcode", id: actionId, imageData: dataViewCopy, config: config, ignoreSupportedFormats: this._IgnoreSupportedFormats}, [dataViewCopy.buffer]);
            });
        });
    }

    /**
     * Loads a texture from the transcode result
     * @param texture texture load to
     * @param transcodeResult the result of transcoding the basis file to load from
     */
    public static LoadTextureFromTranscodeResult(texture: InternalTexture, transcodeResult: TranscodeResult) {
        let engine = texture.getEngine() as Engine;
        for (var i = 0; i < transcodeResult.fileInfo.images.length; i++) {
            var rootImage = transcodeResult.fileInfo.images[i].levels[0];
            texture._invertVScale = texture.invertY;
            if (transcodeResult.format === -1) {
                // No compatable compressed format found, fallback to RGB
                texture.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
                texture.format = Constants.TEXTUREFORMAT_RGB;

                if (engine.webGLVersion < 2 && (Scalar.Log2(rootImage.width) % 1 !== 0 || Scalar.Log2(rootImage.height) % 1 !== 0)) {
                    // Create non power of two texture
                    let source = new InternalTexture(engine, InternalTextureSource.Temp);

                    texture._invertVScale = texture.invertY;
                    source.type = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
                    source.format = Constants.TEXTUREFORMAT_RGB;
                    // Fallback requires aligned width/height
                    source.width = (rootImage.width + 3) & ~3;
                    source.height = (rootImage.height + 3) & ~3;
                    engine._bindTextureDirectly(engine._gl.TEXTURE_2D, source, true);
                    engine._uploadDataToTextureDirectly(source, rootImage.transcodedPixels, i, 0, Constants.TEXTUREFORMAT_RGB, true);

                    // Resize to power of two
                    engine._rescaleTexture(source, texture, engine.scenes[0], engine._getInternalFormat(Constants.TEXTUREFORMAT_RGB), () => {
                        engine._releaseTexture(source);
                        engine._bindTextureDirectly(engine._gl.TEXTURE_2D, texture, true);
                    });
                } else {
                    // Fallback is already inverted
                    texture._invertVScale = !texture.invertY;

                    // Upload directly
                    texture.width = (rootImage.width + 3) & ~3;
                    texture.height = (rootImage.height + 3) & ~3;
                    engine._uploadDataToTextureDirectly(texture, rootImage.transcodedPixels, i, 0, Constants.TEXTUREFORMAT_RGB, true);
                }

            }else {
                texture.width = rootImage.width;
                texture.height = rootImage.height;

                // Upload all mip levels in the file
                transcodeResult.fileInfo.images[i].levels.forEach((level: any, index: number) => {
                    engine._uploadCompressedDataToTextureDirectly(texture, BasisTools.GetInternalFormatFromBasisFormat(transcodeResult.format!), level.width, level.height, level.transcodedPixels, i, index);
                });

                if (engine.webGLVersion < 2 && (Scalar.Log2(texture.width) % 1 !== 0 || Scalar.Log2(texture.height) % 1 !== 0)) {
                    Tools.Warn("Loaded .basis texture width and height are not a power of two. Texture wrapping will be set to Texture.CLAMP_ADDRESSMODE as other modes are not supported with non power of two dimensions in webGL 1.");
                    texture._cachedWrapU = Texture.CLAMP_ADDRESSMODE;
                    texture._cachedWrapV = Texture.CLAMP_ADDRESSMODE;
                }
            }
        }
    }
}

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare var Module: any;
function workerFunc(): void {
    var _BASIS_FORMAT = {
        cTFETC1: 0,
        cTFBC1: 1,
        cTFBC4: 2,
        cTFPVRTC1_4_OPAQUE_ONLY: 3,
        cTFBC7_M6_OPAQUE_ONLY: 4,
        cTFETC2: 5,
        cTFBC3: 6,
        cTFBC5: 7,
    };
    var transcoderModulePromise: Nullable<Promise<any>> = null;
    onmessage = (event) => {
        if (event.data.action === "init") {
             // Load the transcoder if it hasn't been yet
            if (!transcoderModulePromise) {
                // Override wasm binary
                Module = { wasmBinary: (event.data.wasmBinary) };
                importScripts(event.data.url);
                transcoderModulePromise = new Promise((res) => {
                    Module.onRuntimeInitialized = () => {
                        Module.initializeBasis();
                        res();
                    };
                });
            }
            transcoderModulePromise.then(() => {
                postMessage({action: "init"});
            });
        }else if (event.data.action === "transcode") {
            // Transcode the basis image and return the resulting pixels
            var config: BasisTranscodeConfiguration = event.data.config;
            var imgData = event.data.imageData;
            var loadedFile = new Module.BasisFile(imgData);
            var fileInfo = GetFileInfo(loadedFile);
            var format = event.data.ignoreSupportedFormats ? null : GetSupportedTranscodeFormat(event.data.config, fileInfo);

            var needsConversion = false;
            if (format === null) {
                needsConversion = true;
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            }

            // Begin transcode
            var success = true;
            if (!loadedFile.startTranscoding()) {
                success = false;
            }

            var buffers: Array<any> = [];
            for (var imageIndex = 0; imageIndex < fileInfo.images.length; imageIndex++) {
                if (!success) {
                    break;
                }
                var image = fileInfo.images[imageIndex];
                if (config.loadSingleImage === undefined || config.loadSingleImage === imageIndex) {
                    var mipCount = image.levels.length;
                    if (config.loadMipmapLevels === false) {
                        mipCount = 1;
                    }
                    for (var levelIndex = 0; levelIndex < mipCount; levelIndex++) {
                        var levelInfo = image.levels[levelIndex];

                        var pixels = TranscodeLevel(loadedFile, imageIndex, levelIndex, format!, needsConversion);
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
                postMessage({action: "transcode", success: success, id: event.data.id});
            }else {
                postMessage({action: "transcode", success: success, id: event.data.id, fileInfo: fileInfo, format: format}, buffers);
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
        var format = null;
        if (config.supportedCompressionFormats) {
            if (config.supportedCompressionFormats.etc1) {
                format = _BASIS_FORMAT.cTFETC1;
            }else if (config.supportedCompressionFormats.s3tc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            }else if (config.supportedCompressionFormats.pvrtc) {
                // TODO uncomment this after pvrtc bug is fixed is basis transcoder
                // See discussion here: https://github.com/mrdoob/three.js/issues/16524#issuecomment-498929924
                // format = _BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY;
            }else if (config.supportedCompressionFormats.etc2) {
                format = _BASIS_FORMAT.cTFETC2;
            }
        }
        return format;
    }

    /**
     * Retreives information about the basis file eg. dimensions
     * @param basisFile the basis file to get the info from
     * @returns information about the basis file
     */
    function GetFileInfo(basisFile: any): BasisFileInfo {
        var hasAlpha = basisFile.getHasAlpha();
        var imageCount = basisFile.getNumImages();
        var images = [];
        for (var i = 0; i < imageCount; i++) {
            var imageInfo = {
                levels: ([] as Array<any>)
            };
            var levelCount = basisFile.getNumLevels(i);
            for (var level = 0; level < levelCount; level++) {
                var levelInfo = {
                    width: basisFile.getImageWidth(i, level),
                    height: basisFile.getImageHeight(i, level)
                };
                imageInfo.levels.push(levelInfo);
            }
            images.push(imageInfo);
        }
        var info = { hasAlpha, images };
        return info;
    }

    function TranscodeLevel(loadedFile: any, imageIndex: number, levelIndex: number, format: number, convertToRgb565: boolean): Nullable<Uint16Array> {
        var dstSize = loadedFile.getImageTranscodedSizeInBytes(imageIndex, levelIndex, format);
        var dst = new Uint8Array(dstSize);
        if (!loadedFile.transcodeImage(dst, imageIndex, levelIndex, format, 1, 0)) {
            return null;
        }
        // If no supported format is found, load as dxt and convert to rgb565
        if (convertToRgb565) {
            var alignedWidth = (loadedFile.getImageWidth(imageIndex, levelIndex) + 3) & ~3;
            var alignedHeight = (loadedFile.getImageHeight(imageIndex, levelIndex) + 3) & ~3;
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
     * @return the converted pixels
     */
    function ConvertDxtToRgb565(src: Uint8Array, srcByteOffset: number, width: number, height: number): Uint16Array {
        var c = new Uint16Array(4);
        var dst = new Uint16Array(width * height);

        var blockWidth = width / 4;
        var blockHeight = height / 4;
        for (var blockY = 0; blockY < blockHeight; blockY++) {
            for (var blockX = 0; blockX < blockWidth; blockX++) {
            var i = srcByteOffset + 8 * (blockY * blockWidth + blockX);
            c[0] = src[i] | (src[i + 1] << 8);
            c[1] = src[i + 2] | (src[i + 3] << 8);
            c[2] = (2 * (c[0] & 0x1f) + 1 * (c[1] & 0x1f)) / 3
                    | (((2 * (c[0] & 0x7e0) + 1 * (c[1] & 0x7e0)) / 3) & 0x7e0)
                    | (((2 * (c[0] & 0xf800) + 1 * (c[1] & 0xf800)) / 3) & 0xf800);
            c[3] = (2 * (c[1] & 0x1f) + 1 * (c[0] & 0x1f)) / 3
                    | (((2 * (c[1] & 0x7e0) + 1 * (c[0] & 0x7e0)) / 3) & 0x7e0)
                    | (((2 * (c[1] & 0xf800) + 1 * (c[0] & 0xf800)) / 3) & 0xf800);
            for (var row = 0; row < 4; row++) {
                var m = src[i + 4 + row];
                var dstI = (blockY * 4 + row) * width + blockX * 4;
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
