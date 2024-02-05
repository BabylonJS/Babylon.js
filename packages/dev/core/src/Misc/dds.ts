/* eslint-disable @typescript-eslint/naming-convention */
import { Scalar } from "../Maths/math.scalar";
import { SphericalPolynomial } from "../Maths/sphericalPolynomial";
import { Constants } from "../Engines/constants";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { CubeMapToSphericalPolynomialTools } from "../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import type { Scene } from "../scene";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { FromHalfFloat, ToHalfFloat } from "./textureTools";

import "../Engines/Extensions/engine.cubeTexture";

// Based on demo done by Brandon Jones - http://media.tojicode.com/webgl-samples/dds.html
// All values and structures referenced from:
// http://msdn.microsoft.com/en-us/library/bb943991.aspx/
const DDS_MAGIC = 0x20534444;

const //DDSD_CAPS = 0x1,
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

const DDSCAPS2_CUBEMAP = 0x200;
// DDSCAPS2_CUBEMAP_POSITIVEX = 0x400,
// DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800,
// DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000,
// DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000,
// DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000,
// DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000,
// DDSCAPS2_VOLUME = 0x200000;

const //DDPF_ALPHAPIXELS = 0x1,
    //DDPF_ALPHA = 0x2,
    DDPF_FOURCC = 0x4,
    DDPF_RGB = 0x40,
    //DDPF_YUV = 0x200,
    DDPF_LUMINANCE = 0x20000;

function FourCCToInt32(value: string) {
    return value.charCodeAt(0) + (value.charCodeAt(1) << 8) + (value.charCodeAt(2) << 16) + (value.charCodeAt(3) << 24);
}

function Int32ToFourCC(value: number) {
    return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

const FOURCC_DXT1 = FourCCToInt32("DXT1");
const FOURCC_DXT3 = FourCCToInt32("DXT3");
const FOURCC_DXT5 = FourCCToInt32("DXT5");
const FOURCC_DX10 = FourCCToInt32("DX10");
const FOURCC_D3DFMT_R16G16B16A16F = 113;
const FOURCC_D3DFMT_R32G32B32A32F = 116;

const DXGI_FORMAT_R32G32B32A32_FLOAT = 2;
const DXGI_FORMAT_R16G16B16A16_FLOAT = 10;
const DXGI_FORMAT_B8G8R8X8_UNORM = 88;

const headerLengthInt = 31; // The header length in 32 bit ints

// Offsets into the header array
const off_magic = 0;

const off_size = 1;
const off_flags = 2;
const off_height = 3;
const off_width = 4;

const off_mipmapCount = 7;

const off_pfFlags = 20;
const off_pfFourCC = 21;
const off_RGBbpp = 22;
const off_RMask = 23;
const off_GMask = 24;
const off_BMask = 25;
const off_AMask = 26;
// var off_caps1 = 27;
const off_caps2 = 28;
// var off_caps3 = 29;
// var off_caps4 = 30;
const off_dxgiFormat = 32;

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
        const header = new Int32Array(data.buffer, data.byteOffset, headerLengthInt);
        const extendedHeader = new Int32Array(data.buffer, data.byteOffset, headerLengthInt + 4);

        let mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        const fourCC = header[off_pfFourCC];
        const dxgiFormat = fourCC === FOURCC_DX10 ? extendedHeader[off_dxgiFormat] : 0;
        let textureType = Constants.TEXTURETYPE_UNSIGNED_INT;

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
            isCompressed: fourCC === FOURCC_DXT1 || fourCC === FOURCC_DXT3 || fourCC === FOURCC_DXT5,
            dxgiFormat: dxgiFormat,
            textureType: textureType,
        };
    }

    private static _GetHalfFloatAsFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        const destArray = new Float32Array(dataLength);
        const srcData = new Uint16Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = (x + y * width) * 4;
                destArray[index] = FromHalfFloat(srcData[srcPos]);
                destArray[index + 1] = FromHalfFloat(srcData[srcPos + 1]);
                destArray[index + 2] = FromHalfFloat(srcData[srcPos + 2]);
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = lod;
                } else {
                    destArray[index + 3] = FromHalfFloat(srcData[srcPos + 3]);
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetHalfFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Uint16Array {
        if (DDSTools.StoreLODInAlphaChannel) {
            const destArray = new Uint16Array(dataLength);
            const srcData = new Uint16Array(arrayBuffer, dataOffset);
            let index = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const srcPos = (x + y * width) * 4;
                    destArray[index] = srcData[srcPos];
                    destArray[index + 1] = srcData[srcPos + 1];
                    destArray[index + 2] = srcData[srcPos + 2];
                    destArray[index + 3] = ToHalfFloat(lod);
                    index += 4;
                }
            }

            return destArray;
        }

        return new Uint16Array(arrayBuffer, dataOffset, dataLength);
    }

    private static _GetFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Float32Array {
        if (DDSTools.StoreLODInAlphaChannel) {
            const destArray = new Float32Array(dataLength);
            const srcData = new Float32Array(arrayBuffer, dataOffset);
            let index = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const srcPos = (x + y * width) * 4;
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

    private static _GetFloatAsHalfFloatRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Uint16Array {
        const destArray = new Uint16Array(dataLength);
        const srcData = new Float32Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                destArray[index] = ToHalfFloat(srcData[index]);
                destArray[index + 1] = ToHalfFloat(srcData[index + 1]);
                destArray[index + 2] = ToHalfFloat(srcData[index + 2]);
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = ToHalfFloat(lod);
                } else {
                    destArray[index + 3] = ToHalfFloat(srcData[index + 3]);
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetFloatAsUIntRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Uint8Array {
        const destArray = new Uint8Array(dataLength);
        const srcData = new Float32Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = (x + y * width) * 4;
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

    private static _GetHalfFloatAsUIntRGBAArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number): Uint8Array {
        const destArray = new Uint8Array(dataLength);
        const srcData = new Uint16Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = (x + y * width) * 4;
                destArray[index] = Scalar.Clamp(FromHalfFloat(srcData[srcPos])) * 255;
                destArray[index + 1] = Scalar.Clamp(FromHalfFloat(srcData[srcPos + 1])) * 255;
                destArray[index + 2] = Scalar.Clamp(FromHalfFloat(srcData[srcPos + 2])) * 255;
                if (DDSTools.StoreLODInAlphaChannel) {
                    destArray[index + 3] = lod;
                } else {
                    destArray[index + 3] = Scalar.Clamp(FromHalfFloat(srcData[srcPos + 3])) * 255;
                }
                index += 4;
            }
        }

        return destArray;
    }

    private static _GetRGBAArrayBuffer(
        width: number,
        height: number,
        dataOffset: number,
        dataLength: number,
        arrayBuffer: ArrayBuffer,
        rOffset: number,
        gOffset: number,
        bOffset: number,
        aOffset: number
    ): Uint8Array {
        const byteArray = new Uint8Array(dataLength);
        const srcData = new Uint8Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = (x + y * width) * 4;

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

    private static _GetRGBArrayBuffer(
        width: number,
        height: number,
        dataOffset: number,
        dataLength: number,
        arrayBuffer: ArrayBuffer,
        rOffset: number,
        gOffset: number,
        bOffset: number
    ): Uint8Array {
        const byteArray = new Uint8Array(dataLength);
        const srcData = new Uint8Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = (x + y * width) * 3;

                byteArray[index] = srcData[srcPos + rOffset];
                byteArray[index + 1] = srcData[srcPos + gOffset];
                byteArray[index + 2] = srcData[srcPos + bOffset];
                index += 3;
            }
        }

        return byteArray;
    }

    private static _GetLuminanceArrayBuffer(width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer): Uint8Array {
        const byteArray = new Uint8Array(dataLength);
        const srcData = new Uint8Array(arrayBuffer, dataOffset);
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcPos = x + y * width;
                byteArray[index] = srcData[srcPos];
                index++;
            }
        }

        return byteArray;
    }

    /**
     * Uploads DDS Levels to a Babylon Texture
     * @internal
     */
    public static UploadDDSLevels(
        engine: ThinEngine,
        texture: InternalTexture,
        data: ArrayBufferView,
        info: DDSInfo,
        loadMipmaps: boolean,
        faces: number,
        lodIndex = -1,
        currentFace?: number,
        destTypeMustBeFilterable = true
    ) {
        let sphericalPolynomialFaces: Nullable<Array<ArrayBufferView>> = null;
        if (info.sphericalPolynomial) {
            sphericalPolynomialFaces = [] as ArrayBufferView[];
        }
        const ext = !!engine.getCaps().s3tc;

        // TODO WEBGPU Once generateMipMaps is split into generateMipMaps + hasMipMaps in InternalTexture this line can be removed
        texture.generateMipMaps = loadMipmaps;

        const header = new Int32Array(data.buffer, data.byteOffset, headerLengthInt);
        let fourCC: number,
            width: number,
            height: number,
            dataLength: number = 0,
            dataOffset: number;
        let byteArray: Uint8Array, mipmapCount: number, mip: number;
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

        let bpp = header[off_RGBbpp];
        dataOffset = header[off_size] + 4;

        let computeFormats = false;

        if (info.isFourCC) {
            fourCC = header[off_pfFourCC];
            switch (fourCC) {
                case FOURCC_DXT1:
                    blockBytes = 8;
                    internalCompressedFormat = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1;
                    break;
                case FOURCC_DXT3:
                    blockBytes = 16;
                    internalCompressedFormat = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT3;
                    break;
                case FOURCC_DXT5:
                    blockBytes = 16;
                    internalCompressedFormat = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
                    break;
                case FOURCC_D3DFMT_R16G16B16A16F:
                    computeFormats = true;
                    bpp = 64;
                    break;
                case FOURCC_D3DFMT_R32G32B32A32F:
                    computeFormats = true;
                    bpp = 128;
                    break;
                case FOURCC_DX10: {
                    // There is an additionnal header so dataOffset need to be changed
                    dataOffset += 5 * 4; // 5 uints

                    let supported = false;
                    switch (info.dxgiFormat) {
                        case DXGI_FORMAT_R16G16B16A16_FLOAT:
                            computeFormats = true;
                            bpp = 64;
                            supported = true;
                            break;
                        case DXGI_FORMAT_R32G32B32A32_FLOAT:
                            computeFormats = true;
                            bpp = 128;
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
                }
                // eslint-disable-next-line no-fallthrough
                default:
                    Logger.Error(["Unsupported FourCC code:", Int32ToFourCC(fourCC)]);
                    return;
            }
        }

        const rOffset = DDSTools._ExtractLongWordOrder(header[off_RMask]);
        const gOffset = DDSTools._ExtractLongWordOrder(header[off_GMask]);
        const bOffset = DDSTools._ExtractLongWordOrder(header[off_BMask]);
        const aOffset = DDSTools._ExtractLongWordOrder(header[off_AMask]);

        if (computeFormats) {
            internalCompressedFormat = engine._getRGBABufferInternalSizedFormat(info.textureType);
        }

        mipmapCount = 1;
        if (header[off_flags] & DDSD_MIPMAPCOUNT && loadMipmaps !== false) {
            mipmapCount = Math.max(1, header[off_mipmapCount]);
        }

        const startFace = currentFace || 0;
        const caps = engine.getCaps();
        for (let face = startFace; face < faces; face++) {
            width = header[off_width];
            height = header[off_height];

            for (mip = 0; mip < mipmapCount; ++mip) {
                if (lodIndex === -1 || lodIndex === mip) {
                    // In case of fixed LOD, if the lod has just been uploaded, early exit.
                    const i = lodIndex === -1 ? mip : 0;

                    if (!info.isCompressed && info.isFourCC) {
                        texture.format = Constants.TEXTUREFORMAT_RGBA;
                        dataLength = width * height * 4;
                        let floatArray: Nullable<ArrayBufferView> = null;

                        if (engine._badOS || engine._badDesktopOS || (!caps.textureHalfFloat && !caps.textureFloat)) {
                            // Required because iOS has many issues with float and half float generation
                            if (bpp === 128) {
                                floatArray = DDSTools._GetFloatAsUIntRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(DDSTools._GetFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i));
                                }
                            } else if (bpp === 64) {
                                floatArray = DDSTools._GetHalfFloatAsUIntRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);
                                if (sphericalPolynomialFaces && i == 0) {
                                    sphericalPolynomialFaces.push(
                                        DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i)
                                    );
                                }
                            }

                            texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                        } else {
                            const floatAvailable = caps.textureFloat && ((destTypeMustBeFilterable && caps.textureFloatLinearFiltering) || !destTypeMustBeFilterable);
                            const halfFloatAvailable = caps.textureHalfFloat && ((destTypeMustBeFilterable && caps.textureHalfFloatLinearFiltering) || !destTypeMustBeFilterable);

                            const destType =
                                (bpp === 128 || (bpp === 64 && !halfFloatAvailable)) && floatAvailable
                                    ? Constants.TEXTURETYPE_FLOAT
                                    : (bpp === 64 || (bpp === 128 && !floatAvailable)) && halfFloatAvailable
                                      ? Constants.TEXTURETYPE_HALF_FLOAT
                                      : Constants.TEXTURETYPE_UNSIGNED_BYTE;

                            let dataGetter: (width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number) => ArrayBufferView;
                            let dataGetterPolynomial: Nullable<
                                (width: number, height: number, dataOffset: number, dataLength: number, arrayBuffer: ArrayBuffer, lod: number) => ArrayBufferView
                            > = null;

                            switch (bpp) {
                                case 128: {
                                    switch (destType) {
                                        case Constants.TEXTURETYPE_FLOAT:
                                            dataGetter = DDSTools._GetFloatRGBAArrayBuffer;
                                            dataGetterPolynomial = null;
                                            break;
                                        case Constants.TEXTURETYPE_HALF_FLOAT:
                                            dataGetter = DDSTools._GetFloatAsHalfFloatRGBAArrayBuffer;
                                            dataGetterPolynomial = DDSTools._GetFloatRGBAArrayBuffer;
                                            break;
                                        case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                                            dataGetter = DDSTools._GetFloatAsUIntRGBAArrayBuffer;
                                            dataGetterPolynomial = DDSTools._GetFloatRGBAArrayBuffer;
                                            break;
                                    }
                                    break;
                                }
                                default: {
                                    // 64 bpp
                                    switch (destType) {
                                        case Constants.TEXTURETYPE_FLOAT:
                                            dataGetter = DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer;
                                            dataGetterPolynomial = null;
                                            break;
                                        case Constants.TEXTURETYPE_HALF_FLOAT:
                                            dataGetter = DDSTools._GetHalfFloatRGBAArrayBuffer;
                                            dataGetterPolynomial = DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer;
                                            break;
                                        case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                                            dataGetter = DDSTools._GetHalfFloatAsUIntRGBAArrayBuffer;
                                            dataGetterPolynomial = DDSTools._GetHalfFloatAsFloatRGBAArrayBuffer;
                                            break;
                                    }
                                    break;
                                }
                            }

                            texture.type = destType;

                            floatArray = dataGetter(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i);

                            if (sphericalPolynomialFaces && i == 0) {
                                sphericalPolynomialFaces.push(
                                    dataGetterPolynomial ? dataGetterPolynomial(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, i) : floatArray
                                );
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
                        } else {
                            // 32
                            texture.format = Constants.TEXTUREFORMAT_RGBA;
                            dataLength = width * height * 4;
                            byteArray = DDSTools._GetRGBAArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer, rOffset, gOffset, bOffset, aOffset);
                            engine._uploadDataToTextureDirectly(texture, byteArray, face, i);
                        }
                    } else if (info.isLuminance) {
                        const unpackAlignment = engine._getUnpackAlignement();
                        const unpaddedRowSize = width;
                        const paddedRowSize = Math.floor((width + unpackAlignment - 1) / unpackAlignment) * unpackAlignment;
                        dataLength = paddedRowSize * (height - 1) + unpaddedRowSize;

                        byteArray = DDSTools._GetLuminanceArrayBuffer(width, height, data.byteOffset + dataOffset, dataLength, data.buffer);
                        texture.format = Constants.TEXTUREFORMAT_LUMINANCE;
                        texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;

                        engine._uploadDataToTextureDirectly(texture, byteArray, face, i);
                    } else {
                        dataLength = (((Math.max(4, width) / 4) * Math.max(4, height)) / 4) * blockBytes;
                        byteArray = new Uint8Array(data.buffer, data.byteOffset + dataOffset, dataLength);

                        texture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
                        engine._uploadCompressedDataToTextureDirectly(texture, internalCompressedFormat, width, height, byteArray, face, i);
                    }
                }
                dataOffset += bpp ? width * height * (bpp / 8) : dataLength;
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
        createPrefilteredCubeTexture(
            rootUrl: string,
            scene: Nullable<Scene>,
            lodScale: number,
            lodOffset: number,
            onLoad?: Nullable<(internalTexture: Nullable<InternalTexture>) => void>,
            onError?: Nullable<(message?: string, exception?: any) => void>,
            format?: number,
            forcedExtension?: any,
            createPolynomials?: boolean
        ): InternalTexture;
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
ThinEngine.prototype.createPrefilteredCubeTexture = function (
    rootUrl: string,
    scene: Nullable<Scene>,
    lodScale: number,
    lodOffset: number,
    onLoad: Nullable<(internalTexture: Nullable<InternalTexture>) => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    format?: number,
    forcedExtension: any = null,
    createPolynomials: boolean = true
): InternalTexture {
    const callback = (loadData: any) => {
        if (!loadData) {
            if (onLoad) {
                onLoad(null);
            }
            return;
        }

        const texture = loadData.texture as InternalTexture;
        if (!createPolynomials) {
            texture._sphericalPolynomial = new SphericalPolynomial();
        } else if (loadData.info.sphericalPolynomial) {
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

        const gl = this._gl;
        const width = loadData.width;
        if (!width) {
            return;
        }

        const textures: BaseTexture[] = [];
        for (let i = 0; i < mipSlices; i++) {
            //compute LOD from even spacing in smoothness (matching shader calculation)
            const smoothness = i / (mipSlices - 1);
            const roughness = 1 - smoothness;

            const minLODIndex = lodOffset; // roughness = 0
            const maxLODIndex = Scalar.Log2(width) * lodScale + lodOffset; // roughness = 1

            const lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
            const mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));

            const glTextureFromLod = new InternalTexture(this, InternalTextureSource.Temp);
            glTextureFromLod.type = texture.type;
            glTextureFromLod.format = texture.format;
            glTextureFromLod.width = Math.pow(2, Math.max(Scalar.Log2(width) - mipmapIndex, 0));
            glTextureFromLod.height = glTextureFromLod.width;
            glTextureFromLod.isCube = true;
            glTextureFromLod._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            glTextureFromLod._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod, true);

            glTextureFromLod.samplingMode = Constants.TEXTURE_LINEAR_LINEAR;
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            if (loadData.isDDS) {
                const info: DDSInfo = loadData.info;
                const data: any = loadData.data;
                this._unpackFlipY(info.isCompressed);

                DDSTools.UploadDDSLevels(this, glTextureFromLod, data, info, true, 6, mipmapIndex);
            } else {
                Logger.Warn("DDS is the only prefiltered cube map supported so far.");
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            // Wrap in a base texture for easy binding.
            const lodTexture = new BaseTexture(scene);
            lodTexture._isCube = true;
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
