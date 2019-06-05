import { Nullable } from '../types';
import { Tools } from './tools';

/**
 * Info about the .basis files
 */
class BasisFileInfo {
    /**
     * If the file has alpha
     */
    public hasAlpha: boolean;
    /**
     * Width of the image
     */
    public width: number;
    /**
     * Height of the image
     */
    public height: number;
    /**
     * Aligned width used when falling back to Rgb565 ((width + 3) & ~3)
     */
    public alignedWidth: number;
    /**
     * Aligned height used when falling back to Rgb565 ((height + 3) & ~3)
     */
    public alignedHeight: number;
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
        etc1?:boolean;
        /**
         * s3tc compression format
         */
        s3tc?:boolean;
        /**
         * pvrtc compression format
         */
        pvrtc?:boolean;
        /**
         * etc2 compression format
         */
        etc2?:boolean;
    };
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

    private static _WorkerPromise:Nullable<Promise<Worker>> = null;
    private static _Worker:Nullable<Worker> = null;
    private static _CreateWorkerAsync(){
        if(!this._WorkerPromise){
            this._WorkerPromise = new Promise((res)=>{
                if(this._Worker){
                    res(this._Worker)
                }else{
                    Tools.loadFileAsync(BasisTools.WasmModuleURL).then((wasmBinary)=>{
                        const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], { type: "application/javascript" }));
                        this._Worker = new Worker(workerBlobUrl)
                        
                        var initHandler = (msg:any)=>{
                            if(msg.data.action === "init"){
                                this._Worker!.removeEventListener("message", initHandler);
                                res(this._Worker!);
                            }
                        };
                        this._Worker.addEventListener("message", initHandler);
                        this._Worker.postMessage({action: "init", url: BasisTools.JSModuleURL, wasmBinary: wasmBinary});
                    })
                }
            });
        }
        return this._WorkerPromise;
    }

    /**
     * Transcodes a loaded image file to compressed pixel data 
     * @param imageData image data to transcode
     * @param config configuration options for the transcoding
     * @returns a promise resulting in the transcoded image
     */
    public static TranscodeAsync(imageData: ArrayBuffer, config:BasisTranscodeConfiguration):Promise<{fileInfo:any, pixels: any, format:number}>{
        return new Promise((res)=>{
            this._CreateWorkerAsync().then(()=>{
                var messageHandler = (msg:any)=>{
                    if(msg.data.action === "transcode"){
                        this._Worker!.removeEventListener("message", messageHandler);
                        res(msg.data);
                    }
                };
                this._Worker!.addEventListener("message", messageHandler);
                this._Worker!.postMessage({action: "transcode", imageData: imageData, config:config, ignoreSupportedFormats: this._IgnoreSupportedFormats}, [imageData])
            })
        })
    }
}


// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare var Module:any;
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
    var transcoderModulePromise:Nullable<Promise<any>> = null;
    onmessage = (event) => {
        if(event.data.action === "init"){
             // Load the transcoder if it hasn't been yet
            if(!transcoderModulePromise){
                // Override wasm binary
                Module = { wasmBinary: (event.data.wasmBinary) };
                importScripts(event.data.url)
                transcoderModulePromise = new Promise((res)=>{
                    Module.onRuntimeInitialized = () => {
                        Module.initializeBasis();
                        res();
                    };
                });
            }
            transcoderModulePromise.then(()=>{
                postMessage({action: "init"})
            })
        }else if(event.data.action === "transcode"){
            // Transcode the basis image and return the resulting pixels
            var imgData = event.data.imageData;
            var loadedFile = new Module.BasisFile(new Uint8Array(imgData));
            var fileInfo = GetFileInfo(loadedFile);
            var format = event.data.ignoreSupportedFormats ? null : GetSupportedTranscodeFormat(event.data.config, fileInfo);
            var transcodeResult = TranscodeFile(format, fileInfo, loadedFile);
            if(transcodeResult.fallbackToRgb565){
                format = -1;
            }
            postMessage({action: "transcode", pixels:transcodeResult.pixels, fileInfo: fileInfo, format: format}, [transcodeResult.pixels.buffer]);
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
        if(config.supportedCompressionFormats){
            if (config.supportedCompressionFormats.etc1) {
                format = _BASIS_FORMAT.cTFETC1;
            }else if (config.supportedCompressionFormats.s3tc) {
                format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
            }else if (config.supportedCompressionFormats.pvrtc) {
                format = _BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY;
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
        var width = basisFile.getImageWidth(0, 0);
        var height = basisFile.getImageHeight(0, 0);
        var alignedWidth = (width + 3) & ~3;
        var alignedHeight = (height + 3) & ~3;
        var info = { hasAlpha, width, height, alignedWidth, alignedHeight };
        return info;
    }

    /**
     * Transcodes the basis file to the requested format to be transferred to the gpu
     * @param format fromat to be transferred to
     * @param fileInfo information about the loaded file
     * @param loadedFile the loaded basis file
     * @returns the resulting pixels and if the transcode fell back to using Rgb565
     */
    function TranscodeFile(format: Nullable<number>, fileInfo: BasisFileInfo, loadedFile: any) {
        var needsConversion = false;
        if (format === null) {
            needsConversion = true;
            format = fileInfo.hasAlpha ? _BASIS_FORMAT.cTFBC3 : _BASIS_FORMAT.cTFBC1;
        }

        if (!loadedFile.startTranscoding()) {
            loadedFile.close();
            loadedFile.delete();
            throw "transcode failed";
        }
        var dstSize = loadedFile.getImageTranscodedSizeInBytes(0, 0, format);
        var dst = new Uint8Array(dstSize);
        if (!loadedFile.transcodeImage(dst, 0, 0, format, 1, 0)) {
            loadedFile.close();
            loadedFile.delete();
            throw "transcode failed";
        }
        loadedFile.close();
        loadedFile.delete();

        // If no supported format is found, load as dxt and convert to rgb565
        if (needsConversion) {
            dst = ConvertDxtToRgb565(dst, 0, fileInfo.alignedWidth, fileInfo.alignedHeight);
        }

        return {
            fallbackToRgb565: needsConversion, pixels: dst
        };
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
    function ConvertDxtToRgb565(src: Uint16Array, srcByteOffset: number, width: number, height: number): Uint16Array {
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