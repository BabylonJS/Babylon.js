import { Scalar } from "../Maths/math.scalar";
import { SphericalPolynomial } from "../Maths/sphericalPolynomial";
import { Constants } from "../Engines/constants";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { CubeMapToSphericalPolynomialTools } from "../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { Scene } from '../scene';
import { BaseTexture } from '../Materials/Textures/baseTexture';

import "../Engines/Extensions/engine.cubeTexture";
import { ThinEngine } from '../Engines/thinEngine';

// Based on demo done by Brandon Jones - http://media.tojicode.com/webgl-samples/dds.html
// All values and structures referenced from:
// http://msdn.microsoft.com/en-us/library/bb943991.aspx/
var DDS_MAGIC = 0x20534444;

var
    //DDSD_CAPS = 0x1,
    //DDSD_HEIGHT = 0x2,
    //DDSD_WIDTH = 0x4,
    //DDSD_PITCH = 0x8,
    //DDSD_PIXELFORMAT = 0x1000,
    DDSD_MIPMAPCOUNT = 0x20000;
//DDSD_LINEARSIZE = 0x80000,
//DDSD_DEPTH = 0x800000;

// var DDSCAPS_COMPLEX = 0x8,
//     DDSCAPS_MIPMAP = 0x400000,
//     DDSCAPS_TEXTURE = 0x1000;

var DDSCAPS2_CUBEMAP = 0x200;
// DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
// DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
// DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
// DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
// DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
// DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
// DDSCAPS2_VOLUME = 0x200000;

var
    //DDPF_ALPHAPIXELS = 0x1,
    //DDPF_ALPHA = 0x2,
    DDPF_FOURCC = 0x4,
    DDPF_RGB = 0x40,
    //DDPF_YUV = 0x200,
    DDPF_LUMINANCE = 0x20000;

function FourCCToInt32(value: string) {
    return value.charCodeAt(0) +
        (value.charCodeAt(1) << 8) +
        (value.charCodeAt(2) << 16) +
        (value.charCodeAt(3) << 24);
}

function Int32ToFourCC(value: number) {
    return String.fromCharCode(
        value & 0xff,
        (value >> 8) & 0xff,
        (value >> 16) & 0xff,
        (value >> 24) & 0xff
    );
}

var FOURCC_DXT1 = FourCCToInt32("DXT1");
var FOURCC_DXT3 = FourCCToInt32("DXT3");
var FOURCC_DXT5 = FourCCToInt32("DXT5");
var FOURCC_DX10 = FourCCToInt32("DX10");
var FOURCC_D3DFMT_R16G16B16A16F = 113;
var FOURCC_D3DFMT_R32G32B32A32F = 116;

var DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
var DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
var DXGI_FORMAT_B8G8R8X8_UNORM = 88;

var headerLengthInt = 31; // The header length in 32 bit ints

// Offsets into the header array
var off_magic = 0;

var off_size = 1;
var off_flags = 2;
var off_height = 3;
var off_width = 4;

var off_mipmapCount = 7;

var off_pfFlags = 20;
var off_pfFourCC = 21;
var off_RGBbpp = 22;
var off_RMask = 23;
var off_GMask = 24;
var off_BMask = 25;
var off_AMask = 26;
// var off_caps1 = 27;
var off_caps2 = 28;
// var off_caps3 = 29;
// var off_caps4 = 30;
var off_dxgiFormat = 32;

/**
 * Direct draw surface info
 * @see https://docs.microsoft.com/en-us/windows/desktop/direct3ddds/dx-graphics-dds-pguide
 */
export interface DDSInfo {
    /**
     * Width of the texture
     */
    width: number;
    /**
     * Width of the texture
     */
    height: number;
    /**
     * Number of Mipmaps for the texture
     * @see https://en.wikipedia.org/wiki/Mipmap
     */
    mipmapCount: number;
    /**
     * If the textures format is a known fourCC format
     * @see https://www.fourcc.org/
     */
    isFourCC: boolean;
    /**
     * If the texture is an RGB format eg. DXGI_FORMAT_B8G8R8X8_UNORM format
     */
    isRGB: boolean;
    /**
     * If the texture is a lumincance format
     */
    isLuminance: boolean;
    /**
     * If this is a cube texture
     * @see https://docs.microsoft.com/en-us/windows/desktop/direct3ddds/dds-file-layout-for-cubic-environment-maps
     */
    isCube: boolean;
    /**
     * If the texture is a compressed format eg. FOURCC_DXT1
     */
    isCompressed: boolean;
    /**
     * The dxgiFormat of the texture
     * @see https://docs.microsoft.com/en-us/windows/desktop/api/dxgiformat/ne-dxgiformat-dxgi_format
     */
    dxgiFormat: number;
    /**
     * Texture type eg. Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT
     */
    textureType: number;
    /**
     * Sphericle polynomial created for the dds texture
     */
    sphericalPolynomial?: SphericalPolynomial;
}

/**
 * Class used to provide DDS decompression tools
 */
export class DDSTools {
    /**
     * Gets or sets a boolean indicating that LOD info is stored in alpha channel (false by default)
     */
    public static StoreLODInAlphaChannel = false;

    /**
     * Gets DDS information from an array buffer
     * @param data defines the array buffer view to read data from
     * @returns the DDS information
     */
    public static GetDDSInfo(data: ArrayBufferView): DDSInfo {
        var header = new Int32Array(data.buffer, data.byteOffset, headerLengthInt);
        var extendedHeader = new Int32Array(data.buffer, data.byteOffset, headerLengthInt + 4);

        var mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        var fourCC = header[off_pfFourCC];
        var dxgiFormat = (fourCC === FOURCC_DX10) ? extendedHeader[off_dxgiFormat] : 0;
        var textureType = Constants.TEXTURETYPE_UNSIGNED_INT;

        switch (fourCC) {
            case FOURCC_D3DFMT_R16G16B16A16F:
                textureType = Constants.TEXTURETYPE_HALF_FLOAT;
                break;
            case FOURCC_D3DFMT_R32G32B32A32F:
                textureType = Constants.TEXTURETYPE_FLOAT;
                break;
            case FOURCC_DX10:
                if (dxgiFormat === DXGI_FORMAT_R16G16B16A16_FLOAT) {
                    textureType = Constants.TEXTURETYPE_HALF_FLOAT;
                    break;
                }
                if (dxgiFormat === DXGI_FORMAT_R32G32B32A32_FLOAT) {
                    textureType = Constants.TEXTURETYPE_FLOAT;
                    break;
                }
        }

        return {
            width: header[off_width],
            height: header[off_height],
            mipmapCount: mipmapCount,
            isFourCC: (header[off_pfFlags] & DDPF_FOURCC) === DDPF_FOURCC,
            isRGB: (header[off_pfFlags] & DDPF_RGB) === DDPF_RGB,
            isLuminance: (header[off_pfFlags] & DDPF_LUMINANCE) === DDPF_LUMINANCE,
            isCube: (header[off_caps2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP,
            isCompressed: (fourCC === FOURCC_DXT1 || fourCC === FOURCC_DXT3 || fourCC === FOURCC_DXT5),
            dxgiFormat: dxgiFormat,
            textureType: textureType
        };
    }

    // ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
    private static _FloatView: Float32Array;
    private static _Int32View: Int32Array;
    private static _ToHalfFloat(value: number): number {
        if (!DDSTools._FloatView) {
            DDSTools._FloatView = new Float32Array(1);
            DDSTools._Int32View = new Int32Array(DDSTools._FloatView.buffer);
        }

        DDSTools._FloatView[0] = value;
        var x = DDSTools._Int32View[0];

        var bits = (x >> 16) & 0x8000; /* Get the sign */
        var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
        var e = (x >> 23) & 0xff; /* Using int is faster here */

        /* If zero, or denormal, or exponent underflows too much for a denormal
        * half, return signed zero. */
        if (e < 103) {
            return bits;
        }

        /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
        if (e > 142) {
            bits |= 0x7c00;
            /* If exponent was 0xff and one mantissa bit was set, it means NaN,
            * not Inf, so make sure we set one mantissa bit too. */
            bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
            return bits;
        }

        /* If exponent underflows but not too much, return a denormal */
        if (e < 113) {
            m |= 0x0800;
            /* Extra rounding may overflow and set mantissa to 0 and exponent
            * to 1, which is OK. */
            bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
            return bits;
        }

        bits |= ((e - 112) << 10) | (m >> 1);
        bits += m & 1;
        return bits;
    }

    private static _FromHalfFloat(value: number): number {
        var s = (value & 0x8000) >> 15;
        var e = (value & 0x7C00) >> 10;
        var f = value & 0x03FF;

        if (e === 0) {
            return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
        } else if (e == 0x1F) {
            return f ? NaN : ((s ? -1 : 1) * Infinity);
        }

        return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
    }

    private static _GetHalfFloatAsFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        var destArray = new Float32Array(dataLength);
        var srcData = new Uint16Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width) * 4;
                destArray[index] = DDSTools._FromHalfFloat(srcData[srcPos]);
                destArray[index + 1] = DDSTools._FromHalfFloat(srcData[srcPos + 1]);
                destArray[index + 2] = DDSTools._FromHalfFloat(srcData[srcPos + 2]);
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = lod;
                } else {
                    destArray[index + 3] = DDSTools._FromHalfFloat(srcData[srcPos + 3]);
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetHalfFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Uint16Array {
        if (DDSTools.StoreLODInAlphaChannel) {
            var destArray = new Uint16Array(dataLength);
            var srcData = new Uint16Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    destArray[index] = srcData[srcPos];
                    destArray[index + 1] = srcData[srcPos + 1];
                    destArray[index + 2] = srcData[srcPos + 2];
                    destArray[index + 3] = DDSTools._ToHalfFloat(lod);
                    index += 4;
                }
            }

            return destArray;
        }

        return new Uint16Array(arrayBuffer, dataOffset, dataLength);
    }

    private static _GetFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        if (DDSTools.StoreLODInAlphaChannel) {
            var destArray = new Float32Array(dataLength);
            var srcData = new Float32Array(arrayBuffer, dataOffset);
            var index = 0;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var srcPos = (x + y * width) * 4;
                    destArray[index] = srcData[srcPos];
                    destArray[index + 1] = srcData[srcPos + 1];
                    destArray[index + 2] = srcData[srcPos + 2];
                    destArray[index + 3] = lod;
                    index += 4;
                }
            }

            return destArray;
        }
        return new Float32Array(arrayBuffer, dataOffset, dataLength);
    }

    private static _GetFloatAsUIntRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        var destArray = new Uint8Array(dataLength);
        var srcData = new Float32Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width) * 4;
                destArray[index] = Scalar.Clamp(srcData[srcPos]) * 255;
                destArray[index + 1] = Scalar.Clamp(srcData[srcPos + 1]) * 255;
                destArray[index + 2] = Scalar.Clamp(srcData[srcPos + 2]) * 255;
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = lod;
                } else {
                    destArray[index + 3] = Scalar.Clamp(srcData[srcPos + 3]) * 255;
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetHalfFloatAsUIntRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        var destArray = new Uint8Array(dataLength);
        var srcData = new Uint16Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width) * 4;
                destArray[index] = Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos])) * 255;
                destArray[index + 1] = Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 1])) * 255;
                destArray[index + 2] = Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 2])) * 255;
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = lod;
                } else {
                    destArray[index + 3] = Scalar.Clamp(DDSTools._FromHalfFloat(srcData[srcPos + 3])) * 255;
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, rOffset: number, gOffset: number, bOffset: number, aOffset: number): Uint8Array {
        var byteArray = new Uint8Array(dataLength);
        var srcData = new Uint8Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width) * 4;

                byteArray[index] = srcData[srcPos + rOffset];
                byteArray[index + 1] = srcData[srcPos + gOffset];
                byteArray[index + 2] = srcData[srcPos + bOffset];
                byteArray[index + 3] = srcData[srcPos + aOffset];
                index += 4;
            }
        }

        return byteArray;
    }

    private static _ExtractLongWordOrder(value: number): number {
        if (value === 0 || value === 255 || value === -16777216) {
            return 0;
        }

        return 1 + DDSTools._ExtractLongWordOrder(value >> 8);
    }

    private static _GetRGBArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, rOffset: number, gOffset: number, bOffset: number): Uint8Array {
        var byteArray = new Uint8Array(dataLength);
        var srcData = new Uint8Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width) * 3;

                byteArray[index] = srcData[srcPos + rOffset];
                byteArray[index + 1] = srcData[srcPos + gOffset];
                byteArray[index + 2] = srcData[srcPos + bOffset];
                index += 3;
            }
        }

        return byteArray;
    }

    private static _GetLuminanceArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer): Uint8Array {
        var byteArray = new Uint8Array(dataLength);
        var srcData = new Uint8Array(arrayBuffer, dataOffset);
        var index = 0;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var srcPos = (x + y * width);
                byteArray[index] = srcData[srcPos];
                index++;
            }
        }

        return byteArray;
    }

    /**
     * Uploads DDS Levels to a Babylon Texture
     * @hidden
     */
    public static UploadDDSLevels(engine: ThinEngine, texture: InternalTexture, data: ArrayBufferView, info: DDSInfo, loadMipmaps: boolean, faces: number, lodIndex = -1, currentFace?: number) {
        var sphericalPolynomialFaces: Nullable<Array<ArrayBufferView>> = null;
        if (info.sphericalPolynomial) {
            sphericalPolynomialFaces = new Array<ArrayBufferView>();
        }
        var ext = engine.getCaps().s3tc;

        var header = new Int32Array(data.buffer, data.byteOffset, headerLengthInt);
        var fourCC: number, width: number, height: number, dataLength: number = 0, dataOffset: number;
        var byteArray: Uint8Array, mipmapCount: number, mip: number;
        let internalCompressedFormat = 0;
        let blockBytes = 1;

        if (header[off_magic] !== DDS_MAGIC) {
            Logger.Error("Invalid magic number in DDS header");
            return;
        }

        if (!info.isFourCC && !info.isRGB && !info.isLuminance) {
            Logger.Error("Unsupported format, must contain a FourCC, RGB or LUMINANCE code");
            return;
        }

        if (info.isCompressed && !ext) {
            Logger.Error("Compressed textures are not supported on this platform.");
            return;
        }

        var bpp = header[off_RGBbpp];
        dataOffset = header[off_size] + 4;

        let computeFormats = false;

        if (info.isFourCC) {
            fourCC = header[off_pfFourCC];
            switch (fourCC) {
                case FOURCC_DXT1:
                    blockBytes = 8;
                    internalCompressedFormat = (<WEBGL_compressed_texture_s3tc>ext).COMPRESSED_RGBA_S3TC_DXT1_EXT;
                    break;
                case FOURCC_DXT3:
                    blockBytes = 16;
                    internalCompressedFormat = (<WEBGL_compressed_texture_s3tc>ext).COMPRESSED_RGBA_S3TC_DXT3_EXT;
                    break;
                case FOURCC_DXT5:
                    blockBytes = 16;
                    internalCompressedFormat = (<WEBGL_compressed_texture_s3tc>ext).COMPRESSED_RGBA_S3TC_DXT5_EXT;
                    break;
                case FOURCC_D3DFMT_R16G16B16A16F:
                    computeFormats = true;
                    break;
                case FOURCC_D3DFMT_R32G32B32A32F:
                    computeFormats = true;
                    break;
                case FOURCC_DX10:
                    // There is an additionnal header so dataOffset need to be changed
                    dataOffset += 5 * 4; // 5 uints

                    let supported = false;
                    switch (info.dxgiFormat) {
                        case DXGI_FORMAT_R16G16B16A16_FLOAT:
                        case DXGI_FORMAT_R32G32B32A32_FLOAT:
                            computeFormats = true;
                            supported = true;
                            break;
                        case DXGI_FORMAT_B8G8R8X8_UNORM:
                            info.isRGB = true;
                            info.isFourCC = false;
                            bpp = 32;
                            supported = true;
                            break;
                    }

                    if (supported) {
                        break;
                    }
                default:
                    console.error("Unsupported FourCC code:", Int32ToFourCC(fourCC));
                    return;
            }
        }

        let rOffset = DDSTools._ExtractLongWordOrder(header[off_RMask]);
        let gOffset = DDSTools._ExtractLongWordOrder(header[off_GMask]);
        let bOffset = DDSTools._ExtractLongWordOrder(header[off_BMask]);
        let aOffset = DDSTools._ExtractLongWordOrder(header[off_AMask]);

        if (computeFormats) {
            internalCompressedFormat = engine._getRGBABufferInternalSizedFormat(info.textureType);
        }

        mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        const startFace = currentFace || 0;
        for (var face = startFace; face < faces; face++) {
            width = header[off_width];
            height = header[off_height];

            for (mip = 0; mip < mipmapCount; ++mip) {
                if (lodIndex === -1 || lodIndex === mip) {
                    // In case of fixed LOD, if the lod has just been uploaded, early exit.
                    const i = (lodIndex === -1) ? mip : 0;

                    if (!info.isCompressed && info.isFourCC) {
                        texture.format = Constants.TEXTUREFORMAT_RGBA;
                        dataLength = width * height * 4;
                        var floatArray: Nullable<ArrayBufferView> = null;

                        if (engine._badOS || engine._badDesktopOS || (!engine.getCaps().textureHalfFloat && !engine.getCaps().textureFloat)) { // Required because iOS has many issues with float and half float generation
                            if (bpp === 128) {
                                floatArray = DDSTools._GetFloatAsUIntRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(DDSTools._GetFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i));
                                }
                            }
                            else if (bpp === 64) {
                                floatArray = DDSTools._GetHalfFloatAsUIntRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i));
                                }
                            }

                            texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                        }
                        else {
                            if (bpp === 128) {
                                texture.type = Constants.TEXTURETYPE_FLOAT;
                                floatArray = DDSTools._GetFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(floatArray);
                                }
                            } else if (bpp === 64 && !engine.getCaps().textureHalfFloat) {
                                texture.type = Constants.TEXTURETYPE_FLOAT;
                                floatArray = DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(floatArray);
                                }
                            } else { // 64
                                texture.type = Constants.TEXTURETYPE_HALF_FLOAT;
                                floatArray = DDSTools._GetHalfFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, dataOffset, dataLength, data.buffer, i));
                                }
                            }
                        }

                        if (floatArray) {
                            engine._uploadDataToTextureDirectly(texture, floatArray, face, i);
                        }
                    } else if (info.isRGB) {
                        texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                        if (bpp === 24) {
                            texture.format = Constants.TEXTUREFORMAT_RGB;
                            dataLength = width * height * 3;
                            byteArray = DDSTools._GetRGBArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, rOffset, gOffset, bOffset);
                            engine._uploadDataToTextureDirectly(texture, byteArray, face, i);
                        } else { // 32
                            texture.format = Constants.TEXTUREFORMAT_RGBA;
                            dataLength = width * height * 4;
                            byteArray = DDSTools._GetRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, rOffset, gOffset, bOffset, aOffset);
                            engine._uploadDataToTextureDirectly(texture, byteArray, face, i);
                        }
                    } else if (info.isLuminance) {
                        var unpackAlignment = engine._getUnpackAlignement();
                        var unpaddedRowSize = width;
                        var paddedRowSize = Math.floor((width + unpackAlignment - 1) / unpackAlignment) * unpackAlignment;
                        dataLength = paddedRowSize * (height - 1) + unpaddedRowSize;

                        byteArray = DDSTools._GetLuminanceArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer);
                        texture.format = Constants.TEXTUREFORMAT_LUMINANCE;
                        texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;

                        engine._uploadDataToTextureDirectly(texture, byteArray, face, i);
                    } else {
                        dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes;
                        byteArray = new Uint8Array(data.buffer, data.byteOffset + dataOffset, dataLength);

                        texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                        engine._uploadCompressedDataToTextureDirectly(texture, internalCompressedFormat, width, height, byteArray, face, i);
                    }
                }
                dataOffset += bpp ? (width * height * (bpp / 8)) : dataLength;
                width *= 0.5;
                height *= 0.5;

                width = Math.max(1.0, width);
                height = Math.max(1.0, height);
            }

            if (currentFace !== undefined) {
                // Loading a single face
                break;
            }
        }
        if (sphericalPolynomialFaces && sphericalPolynomialFaces.length > 0) {
            info.sphericalPolynomial = CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial({
                size: header[off_width],
                right: sphericalPolynomialFaces[0],
                left: sphericalPolynomialFaces[1],
                up: sphericalPolynomialFaces[2],
                down: sphericalPolynomialFaces[3],
                front: sphericalPolynomialFaces[4],
                back: sphericalPolynomialFaces[5],
                format: Constants.TEXTUREFORMAT_RGBA,
                type: Constants.TEXTURETYPE_FLOAT,
                gammaSpace: false,
            });
        } else {
            info.sphericalPolynomial = undefined;
        }
    }
}

declare module "../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Create a cube texture from prefiltered data (ie. the mipmaps contain ready to use data for PBR reflection)
         * @param rootUrl defines the url where the file to load is located
         * @param scene defines the current scene
         * @param lodScale defines scale to apply to the mip map selection
         * @param lodOffset defines offset to apply to the mip map selection
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param format defines the format of the data
         * @param forcedExtension defines the extension to use to pick the right loader
         * @param createPolynomials defines wheter or not to create polynomails harmonics for the texture
         * @returns the cube texture as an InternalTexture
         */
        createPrefilteredCubeTexture(rootUrl: string, scene: Nullable<Scene>, lodScale: number, lodOffset: number,
            onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number, forcedExtension?: any,
            createPolynomials?: boolean): InternalTexture;
    }
}

/**
 * Create a cube texture from prefiltered data (ie. the mipmaps contain ready to use data for PBR reflection)
 * @param rootUrl defines the url where the file to load is located
 * @param scene defines the current scene
 * @param lodScale defines scale to apply to the mip map selection
 * @param lodOffset defines offset to apply to the mip map selection
 * @param onLoad defines an optional callback raised when the texture is loaded
 * @param onError defines an optional callback raised if there is an issue to load the texture
 * @param format defines the format of the data
 * @param forcedExtension defines the extension to use to pick the right loader
 * @param createPolynomials defines wheter or not to create polynomails harmonics for the texture
 * @returns the cube texture as an InternalTexture
 */
ThinEngine.prototype.createPrefilteredCubeTexture = function(rootUrl: string, scene: Nullable<Scene>, lodScale: number, lodOffset: number,
    onLoad: Nullable<(internalTexture: Nullable<InternalTexture>) => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    format?: number, forcedExtension: any = null,
    createPolynomials: boolean = true): InternalTexture {
    var callback = (loadData: any) => {
        if (!loadData) {
            if (onLoad) {
                onLoad(null);
            }
            return;
        }

        let texture = loadData.texture as InternalTexture;
        if (!createPolynomials) {
            texture._sphericalPolynomial = new SphericalPolynomial();
        }
        else if (loadData.info.sphericalPolynomial) {
            texture._sphericalPolynomial = loadData.info.sphericalPolynomial;
        }
        texture._source = InternalTextureSource.CubePrefiltered;

        if (this.getCaps().textureLOD) {
            // Do not add extra process if texture lod is supported.
            if (onLoad) {
                onLoad(texture);
            }
            return;
        }

        const mipSlices = 3;

        var gl = this._gl;
        const width = loadData.width;
        if (!width) {
            return;
        }

        const textures: BaseTexture[] = [];
        for (let i = 0; i < mipSlices; i++) {
            //compute LOD from even spacing in smoothness (matching shader calculation)
            let smoothness = i / (mipSlices - 1);
            let roughness = 1 - smoothness;

            let minLODIndex = lodOffset; // roughness = 0
            let maxLODIndex = Scalar.Log2(width) * lodScale + lodOffset; // roughness = 1

            let lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
            let mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));

            var glTextureFromLod = new InternalTexture(this, InternalTextureSource.Temp);
            glTextureFromLod.type = texture.type;
            glTextureFromLod.format = texture.format;
            glTextureFromLod.width = Math.pow(2, Math.max(Scalar.Log2(width) - mipmapIndex, 0));
            glTextureFromLod.height = glTextureFromLod.width;
            glTextureFromLod.isCube = true;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod, true);

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            if (loadData.isDDS) {
                var info: DDSInfo = loadData.info;
                var data: any = loadData.data;
                this._unpackFlipY(info.isCompressed);

                DDSTools.UploadDDSLevels(this, glTextureFromLod, data, info, true, 6, mipmapIndex);
            }
            else {
                Logger.Warn("DDS is the only prefiltered cube map supported so far.");
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            // Wrap in a base texture for easy binding.
            const lodTexture = new BaseTexture(scene);
            lodTexture.isCube = true;
            lodTexture._texture = glTextureFromLod;

            glTextureFromLod.isReady = true;
            textures.push(lodTexture);
        }

        texture._lodTextureHigh = textures[2];
        texture._lodTextureMid = textures[1];
        texture._lodTextureLow = textures[0];

        if (onLoad) {
            onLoad(texture);
        }
    };

    return this.createCubeTexture(rootUrl, scene, null, false, callback, onError, format, forcedExtension, createPolynomials, lodScale, lodOffset);
};
