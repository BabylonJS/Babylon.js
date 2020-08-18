import { TranscoderManager } from "./transcoderManager";
import { sourceTextureFormat, transcodeTarget } from './transcoder';
import { KTX2FileReader, supercompressionScheme, IKTX2_ImageDesc } from './KTX2FileReader';
import { Nullable } from '../../types';
import { LiteTranscoder_UASTC_ASTC } from './LiteTranscoder_UASTC_ASTC';
import { LiteTranscoder_UASTC_BC7 } from './LiteTranscoder_UASTC_BC7';
import { MSCTranscoder } from './mscTranscoder';

declare function postMessage(message: any, transfer?: any[]): void;

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 36492;

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
            _createMipmaps(event.data.kfr).then((mipmaps) => {
                //if (!success) {
                //    postMessage({action: "transcode", success: success, id: event.data.id});
                //} else {
                    postMessage({ action: "mipmapsCreated", success: true/*success*/, id: event.data.id, mipmaps: mipmaps.mipmaps }, mipmaps.mipmapsData);
                //}
            });
        }
    };

    const _createMipmaps = (kfr: KTX2FileReader): Promise<{ mipmaps: Array<IMipmap>, mipmapsData: Array<ArrayBuffer> }> => {
        /*await this.zstd.init();*/

        //var mipmaps = [];
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        let targetFormat = transcodeTarget.BC7_M5_RGBA;
        let transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;

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
