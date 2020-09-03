/**
 * Resources used for the implementation:
 *  - 3js KTX2 loader: https://github.com/mrdoob/three.js/blob/dfb5c23ce126ec845e4aa240599915fef5375797/examples/jsm/loaders/KTX2Loader.js
 *  - Universal Texture Transcoders: https://github.com/KhronosGroup/Universal-Texture-Transcoders
 *  - KTX2 specification: http://github.khronos.org/KTX-Specification/
 *  - KTX2 binaries to convert files: https://github.com/KhronosGroup/KTX-Software/releases
 *  - KTX specification: https://www.khronos.org/registry/DataFormat/specs/1.3/dataformat.1.3.html
 *  - KTX-Software: https://github.com/KhronosGroup/KTX-Software
 */

import { KTX2FileReader, SupercompressionScheme, IKTX2_ImageDesc } from './ktx2FileReader';
import { TranscoderManager } from './transcoderManager';
import { LiteTranscoder_UASTC_ASTC } from './Transcoders/liteTranscoder_UASTC_ASTC';
import { LiteTranscoder_UASTC_BC7 } from './Transcoders/liteTranscoder_UASTC_BC7';
import { MSCTranscoder } from './Transcoders/mscTranscoder';
import { transcodeTarget, sourceTextureFormat } from './transcoder';
import { Nullable } from './types';
import { ZSTDDecoder } from './zstddec';

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
const COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
const COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
const COMPRESSED_RGB8_ETC2 = 0x9274;
const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;
const RGBA8Format = 0x8058;

export interface IDecodedData {
    width: number;
    height: number;
    transcodedFormat: number;
    mipmaps: Array<IMipmap>;
    isInGammaSpace: boolean;
    errors?: string;
}

export interface IMipmap {
    data: Nullable<Uint8Array>;
    width: number;
    height: number;
}

export interface ICompressedFormatCapabilities {
    astc?: boolean;
    bptc?: boolean;
    s3tc?: boolean;
    pvrtc?: boolean;
    etc2?: boolean;
    etc1?: boolean;
}

const isPowerOfTwo = (value: number)  => {
    return (value & (value - 1)) === 0 && value !== 0;
};

/**
 * Class for decoding KTX2 files
 */
export class KTX2Decoder {

    private _transcoderMgr: TranscoderManager;
    private _zstdDecoder: ZSTDDecoder;

    constructor() {
        this._transcoderMgr = new TranscoderManager();
    }

    public decode(data: Uint8Array, caps: ICompressedFormatCapabilities): Nullable<Promise<IDecodedData>> {
        const kfr = new KTX2FileReader(data);

        if (!kfr.isValid()) {
            throw new Error("Invalid KT2 file: wrong signature");
        }

        kfr.parse();

        if (kfr.needZSTDDecoder && !this._zstdDecoder) {
            this._zstdDecoder = new ZSTDDecoder();

            return this._zstdDecoder.init().then(() => {
                return this._decodeData(kfr, caps);
            });
        }

        return this._decodeData(kfr, caps);
    }

    private _decodeData(kfr: KTX2FileReader, caps: ICompressedFormatCapabilities): Promise<IDecodedData> {
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        // PVRTC1 transcoders (from both ETC1S and UASTC) only support power of 2 dimensions.
        const pvrtcTranscodable = isPowerOfTwo(width) && isPowerOfTwo(height);

        let targetFormat = -1;
        let transcodedFormat = -1;

        if (caps.astc) {
            targetFormat = transcodeTarget.ASTC_4x4_RGBA;
            transcodedFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
        } else if (caps.bptc) {
            targetFormat = transcodeTarget.BC7_RGBA;
            transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;
        } else if (caps.s3tc) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.BC3_RGBA : transcodeTarget.BC1_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_S3TC_DXT5_EXT : COMPRESSED_RGB_S3TC_DXT1_EXT;
        } else if (caps.pvrtc && pvrtcTranscodable) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.PVRTC1_4_RGBA : transcodeTarget.PVRTC1_4_RGB;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA_PVRTC_4BPPV1_IMG : COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
        } else if (caps.etc2) {
            targetFormat = kfr.hasAlpha ? transcodeTarget.ETC2_RGBA : transcodeTarget.ETC1_RGB /* subset of ETC2 */;
            transcodedFormat = kfr.hasAlpha ? COMPRESSED_RGBA8_ETC2_EAC : COMPRESSED_RGB8_ETC2;
        } else if (caps.etc1) {
            targetFormat = transcodeTarget.ETC1_RGB;
            transcodedFormat = COMPRESSED_RGB_ETC1_WEBGL;
        } else {
            targetFormat = transcodeTarget.RGBA32;
            transcodedFormat = RGBA8Format;
        }

        const transcoder = this._transcoderMgr.findTranscoder(srcTexFormat, targetFormat);

        if (transcoder === null) {
            throw new Error(`no transcoder found to transcode source texture format "${sourceTextureFormat[srcTexFormat]}" to format "${transcodeTarget[targetFormat]}"`);
        }

        const mipmaps: Array<IMipmap> = [];
        const dataPromises: Array<Promise<Nullable<Uint8Array>>> = [];
        const mipmapBuffers: Array<ArrayBuffer> = [];
        const decodedData: IDecodedData = { width: 0, height: 0, transcodedFormat, mipmaps, isInGammaSpace: kfr.isInGammaSpace };

        let firstImageDescIndex = 0;

        for (let level = 0; level < kfr.header.levelCount; level ++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }

            const levelWidth = Math.ceil(width / (1 << level));
            const levelHeight = Math.ceil(height / (1 << level));

            const numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            const levelImageByteLength = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2) * kfr.dfdBlock.bytesPlane[0];

            const levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;

            let levelDataBuffer = kfr.data.buffer;

            let levelDataOffset = kfr.levels[level].byteOffset + kfr.data.byteOffset;
            let imageOffsetInLevel = 0;

            if (kfr.header.supercompressionScheme === SupercompressionScheme.ZStandard) {
                levelDataBuffer = this._zstdDecoder.decode(new Uint8Array(levelDataBuffer, levelDataOffset, kfr.levels[level].byteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }

            if (level === 0) {
                decodedData.width = levelWidth;
                decodedData.height = levelHeight;
            }

            for (let imageIndex = 0; imageIndex < numImagesInLevel; imageIndex ++) {
                let encodedData: Uint8Array;
                let imageDesc: Nullable<IKTX2_ImageDesc> = null;

                if (kfr.header.supercompressionScheme === SupercompressionScheme.BasisLZ) {
                    imageDesc = kfr.supercompressionGlobalData.imageDescs![firstImageDescIndex + imageIndex];

                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageDesc.rgbSliceByteOffset, imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength);
                } else {
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageOffsetInLevel, levelImageByteLength);

                    imageOffsetInLevel += levelImageByteLength;
                }

                const mipmap: IMipmap = {
                    data: null,
                    width: levelWidth,
                    height: levelHeight,
                };

                const transcodedData = transcoder.transcode(srcTexFormat, targetFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData)
                    .then((data) => {
                        mipmap.data = data;
                        if (data) {
                            mipmapBuffers.push(data.buffer);
                        }
                        return data;
                    })
                    .catch((reason) => {
                        decodedData.errors = decodedData.errors ?? "";
                        decodedData.errors += reason + "\n";
                        return null;
                    });

                dataPromises.push(transcodedData);

                mipmaps.push(mipmap);
            }
        }

        return Promise.all(dataPromises).then(() => {
            return decodedData;
        });
    }
}

// Put in the order you want the transcoders to be used in priority
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_ASTC);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_BC7);
TranscoderManager.RegisterTranscoder(MSCTranscoder); // catch all transcoder - will throw an error if the format can't be transcoded
