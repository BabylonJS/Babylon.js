/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { Tools } from "./tools";
import type { BasisFileInfo, BasisTranscodeConfiguration } from "./basis";

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare let BASIS: any;
/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function workerFunction(): void {
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
            if (event.data.url) {
                // make sure we loaded the script correctly
                try {
                    importScripts(event.data.url);
                } catch (e) {
                    postMessage({ action: "error", error: e });
                }
            }
            if (!transcoderModulePromise) {
                transcoderModulePromise = BASIS({
                    // Override wasm binary
                    wasmBinary: event.data.wasmBinary,
                });
            }
            if (transcoderModulePromise !== null) {
                // eslint-disable-next-line github/no-then
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

                        const pixels = TranscodeLevel(loadedFile, imageIndex, levelIndex, format, needsConversion);
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

/**
 * Initialize a web worker with the basis transcoder
 * @param worker the worker to initialize
 * @param wasmBinary the wasm binary to load into the worker
 * @param moduleUrl the url to the basis transcoder module
 * @returns a promise that resolves when the worker is initialized
 */
// eslint-disable-next-line no-restricted-syntax
export async function initializeWebWorker(worker: Worker, wasmBinary: ArrayBuffer, moduleUrl?: string) {
    return await new Promise<Worker>((res, reject) => {
        const initHandler = (msg: any) => {
            if (msg.data.action === "init") {
                worker.removeEventListener("message", initHandler);
                res(worker);
            } else if (msg.data.action === "error") {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(msg.data.error || "error initializing worker");
            }
        };
        worker.addEventListener("message", initHandler);
        // we can use transferable objects here because the worker will own the ArrayBuffer
        worker.postMessage({ action: "init", url: moduleUrl ? Tools.GetBabylonScriptURL(moduleUrl) : undefined, wasmBinary }, [wasmBinary]);
    });
}
