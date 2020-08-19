import { TranscoderManager } from "./transcoderManager";
import { sourceTextureFormat, transcodeTarget } from './transcoder';
import { KTX2FileReader, supercompressionScheme, IKTX2_ImageDesc } from './KTX2FileReader';
import { Nullable } from '../../types';
import { LiteTranscoder_UASTC_ASTC } from './LiteTranscoder_UASTC_ASTC';
import { LiteTranscoder_UASTC_BC7 } from './LiteTranscoder_UASTC_BC7';
import { MSCTranscoder } from './mscTranscoder';

declare function postMessage(message: any, transfer?: any[]): void;

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
const COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
const COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
const COMPRESSED_RGB8_ETC2 = 0x9274;
const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;
const RGBAFormat = 0x3FF;

export interface IMipmap {
    data: Nullable<Uint8Array>;
    width: number;
    height: number;
    transcodedFormat: number;
}

export function workerFunc(): void {
    TranscoderManager.registerTranscoder(LiteTranscoder_UASTC_ASTC);
    TranscoderManager.registerTranscoder(LiteTranscoder_UASTC_BC7);
    TranscoderManager.registerTranscoder(MSCTranscoder);

    let transcoderMgr = new TranscoderManager();

    onmessage = (event) => {
        if (event.data.action === "init") {
            postMessage({action: "init"});
        } else if (event.data.action === "createMipmaps") {
            const kfr = new KTX2FileReader(event.data.data);
            _createMipmaps(kfr, event.data.caps).then((mipmaps) => {
                postMessage({ action: "mipmapsCreated", success: true, id: event.data.id, mipmaps: mipmaps.mipmaps }, mipmaps.mipmapsData);
            }).catch((reason) => {
                postMessage({ action: "mipmapsCreated", success: false, id: event.data.id, msg: reason });
            });
        }
    };

    const _createMipmaps = (kfr: KTX2FileReader, caps: { [name: string]: any }): Promise<{ mipmaps: Array<IMipmap>, mipmapsData: Array<ArrayBuffer> }> => {
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        const isPowerOfTwo = (value: number)  => {
            return (value & (value - 1)) === 0 && value !== 0;
        };

        // PVRTC1 transcoders (from both ETC1S and UASTC) only support power of 2 dimensions.
        const pvrtcTranscodable = isPowerOfTwo(width) && isPowerOfTwo(height);

        let targetFormat = transcodeTarget.BC7_M5_RGBA;
        let transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;

        if (caps.astc) {
            targetFormat = transcodeTarget.ASTC_4x4_RGBA;
            transcodedFormat = COMPRESSED_RGBA_ASTC_4x4_KHR;
        } else if (caps.bptc && srcTexFormat === sourceTextureFormat.UASTC4x4) {
            targetFormat = transcodeTarget.BC7_M5_RGBA;
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
            transcodedFormat = RGBAFormat;
        }

        const transcoder = transcoderMgr.findTranscoder(srcTexFormat, targetFormat);

        if (transcoder === null) {
            throw new Error(`KTX2 container - no transcoder found to transcode source texture format "${sourceTextureFormat[srcTexFormat]}" to format "${transcodeTarget[targetFormat]}"`);
        }

        const mipmaps: Array<IMipmap> = [];
        const texturePromises: Array<Promise<Nullable<Uint8Array>>> = [];
        const mipmapsData: Array<ArrayBuffer> = [];

        let firstImageDescIndex = 0;

        for (let level = 0; level < kfr.header.levelCount; level ++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }

            const levelWidth = width / Math.pow(2, level);
            const levelHeight = height / Math.pow(2, level);

            const numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            const levelImageByteLength = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2) * kfr.dfdBlock.bytesPlane[0];

            const levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;

            let levelDataBuffer = kfr.data.buffer;
            let levelDataOffset = kfr.levels[level].byteOffset;
            let imageOffsetInLevel = 0;

            if (kfr.header.supercompressionScheme === supercompressionScheme.ZStandard) {
                //levelDataBuffer = this.zstd.decode(new Uint8Array(levelDataBuffer, levelDataOffset, levelByteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }

            for (let imageIndex = 0; imageIndex < numImagesInLevel; imageIndex ++) {
                let encodedData: Uint8Array;
                let imageDesc: Nullable<IKTX2_ImageDesc> = null;

                if (kfr.header.supercompressionScheme === supercompressionScheme.BasisLZ) {
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
                    transcodedFormat: transcodedFormat
                };

                const transcodedData = transcoder.transcode(srcTexFormat, targetFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData).
                        then((data) => {
                            mipmap.data = data;
                            if (data) {
                                mipmapsData.push(data.buffer);
                            }
                            return data;
                        }
                      );

                mipmaps.push(mipmap);

                texturePromises.push(transcodedData);
            }
        }

        return Promise.all(texturePromises).then(() => {
            return { mipmaps, mipmapsData };
        });
    };
}
