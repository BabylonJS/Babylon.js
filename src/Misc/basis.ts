import { Nullable } from '../types';
import { Engine } from '../Engines/engine';
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
 * Used to load .Basis files
 * See https://github.com/BinomialLLC/basis_universal/tree/master/webgl
 */
export class BasisTools {
    private static _IgnoreSupportedFormats = false;
    private static LoadScriptPromise:any = null;
    // TODO should load from cdn location as fallback once it exists
    private static _FallbackURL = "../dist/preview%20release/basisTranscoder/basis_transcoder.js";
    private static _BASIS_FORMAT = {
        cTFETC1: 0,
        cTFBC1: 1,
        cTFBC4: 2,
        cTFPVRTC1_4_OPAQUE_ONLY: 3,
        cTFBC7_M6_OPAQUE_ONLY: 4,
        cTFETC2: 5,
        cTFBC3: 6,
        cTFBC5: 7,
    };
    /**
     * Basis module can be aquired from https://github.com/BinomialLLC/basis_universal/tree/master/webgl
     * This should be set prior to loading a .basis texture
     */
    public static BasisModule: Nullable<any> = null;

    /**
     * Verifies that the BasisModule has been populated and falls back to loading from the web if not availible
     */
    public static VerifyBasisModuleAsync() {
        // Complete if module has been populated
        if(BasisTools.BasisModule){
            return Promise.resolve();
        }

        // Otherwise load script from fallback url
        if(!this.LoadScriptPromise){
            this.LoadScriptPromise = Tools.LoadScriptAsync(BasisTools._FallbackURL, "basis_transcoder").then((success)=>{
                return new Promise((res, rej)=>{
                    if ((window as any).Module) {
                        (window as any).Module.onRuntimeInitialized = () => {
                            BasisTools.BasisModule = (window as any).Module;
                            BasisTools.BasisModule.initializeBasis();
                            res();
                        }
                    }else {
                        rej("Unable to load .basis texture, BasisTools.BasisModule should be populated");
                    }
                })
            })
        }
        return this.LoadScriptPromise;
    }

    /**
     * Verifies that the basis module has been populated and creates a bsis file from the image data
     * @param data array buffer of the .basis file
     * @returns the Basis file
     */
    public static LoadBasisFile(data: ArrayBuffer) {
        return new BasisTools.BasisModule.BasisFile(new Uint8Array(data));
    }

    /**
     * Detects the supported transcode format for the file
     * @param engine Babylon engine
     * @param fileInfo info about the file
     * @returns the chosed format or null if none are supported
     */
    public static GetSupportedTranscodeFormat(engine: Engine, fileInfo: BasisFileInfo): Nullable<number> {
        var caps = engine.getCaps();
        var format = null;
        if (caps.etc1) {
            format = BasisTools._BASIS_FORMAT.cTFETC1;
        }else if (caps.s3tc) {
            format = fileInfo.hasAlpha ? BasisTools._BASIS_FORMAT.cTFBC3 : BasisTools._BASIS_FORMAT.cTFBC1;
        }else if (caps.pvrtc) {
            format = BasisTools._BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY;
        }else if (caps.etc2) {
            format = BasisTools._BASIS_FORMAT.cTFETC2;
        }
        return format;
    }

    /**
     * Get the internal format to be passed to texImage2D corrisponding to the .basis format value
     * @param basisFormat format chosen from GetSupportedTranscodeFormat
     * @returns internal format corrisponding to the Basis format
     */
    public static GetInternalFormatFromBasisFormat(basisFormat: number) {
        // TODO more formats need to be added here and validated
        var COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
        var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
        var RGB_ETC1_Format = 36196;

        // var COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
        // var COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;

        if (basisFormat === this._BASIS_FORMAT.cTFETC1) {
            return RGB_ETC1_Format;
        }else if (basisFormat === this._BASIS_FORMAT.cTFBC1) {
            return COMPRESSED_RGB_S3TC_DXT1_EXT;
        }else if (basisFormat === this._BASIS_FORMAT.cTFBC3) {
            return COMPRESSED_RGBA_S3TC_DXT5_EXT;
        }else {
            // TODO find value for these formats
            // else if(basisFormat === this.BASIS_FORMAT.cTFBC4){
            // }else if(basisFormat === this.BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY){
            // }else if(basisFormat === this.BASIS_FORMAT.cTFBC7_M6_OPAQUE_ONLY){
            // }else if(basisFormat === this.BASIS_FORMAT.cTFETC2){
            // }else if(basisFormat === this.BASIS_FORMAT.cTFBC5){
            // }
            throw "Basis format not found or supported";
        }
    }

    /**
     * Retreives information about the basis file eg. dimensions
     * @param basisFile the basis file to get the info from
     * @returns information about the basis file
     */
    public static GetFileInfo(basisFile: any): BasisFileInfo {
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
    public static TranscodeFile(format: Nullable<number>, fileInfo: BasisFileInfo, loadedFile: any) {
        if (BasisTools._IgnoreSupportedFormats) {
            format = null;
        }
        var needsConversion = false;
        if (format === null) {
            needsConversion = true;
            format = fileInfo.hasAlpha ? BasisTools._BASIS_FORMAT.cTFBC3 : BasisTools._BASIS_FORMAT.cTFBC1;
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
            dst = BasisTools.ConvertDxtToRgb565(dst, 0, fileInfo.alignedWidth, fileInfo.alignedHeight);
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
    public static ConvertDxtToRgb565(src: Uint16Array, srcByteOffset: number, width: number, height: number): Uint16Array {
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
