/**
 * Resources used for the implementation:
 *  - 3js KTX2 loader: https://github.com/mrdoob/three.js/blob/dfb5c23ce126ec845e4aa240599915fef5375797/examples/jsm/loaders/KTX2Loader.js
 *  - Universal Texture Transcoders: https://github.com/KhronosGroup/Universal-Texture-Transcoders
 *  - KTX2 specification: http://github.khronos.org/KTX-Specification/
 *  - KTX2 binaries to convert files: https://github.com/KhronosGroup/KTX-Software/releases
 *  - KTX specification: https://www.khronos.org/registry/DataFormat/specs/1.3/dataformat.1.3.html
 *  - KTX-Software: https://github.com/KhronosGroup/KTX-Software
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import type { IKTX2_ImageDesc } from "./ktx2FileReader";
import { KTX2FileReader, SupercompressionScheme } from "./ktx2FileReader";
import { TranscoderManager } from "./transcoderManager";
import { LiteTranscoder_UASTC_ASTC } from "./Transcoders/liteTranscoder_UASTC_ASTC";
import { LiteTranscoder_UASTC_BC7 } from "./Transcoders/liteTranscoder_UASTC_BC7";
import { LiteTranscoder_UASTC_RGBA_UNORM } from "./Transcoders/liteTranscoder_UASTC_RGBA_UNORM";
import { LiteTranscoder_UASTC_RGBA_SRGB } from "./Transcoders/liteTranscoder_UASTC_RGBA_SRGB";
import { LiteTranscoder_UASTC_R8_UNORM } from "./Transcoders/liteTranscoder_UASTC_R8_UNORM";
import { LiteTranscoder_UASTC_RG8_UNORM } from "./Transcoders/liteTranscoder_UASTC_RG8_UNORM";
import { MSCTranscoder } from "./Transcoders/mscTranscoder";
import { ZSTDDecoder } from "./zstddec";
import { TranscodeDecisionTree } from "./transcodeDecisionTree";

const IsPowerOfTwo = (value: number) => {
    return (value & (value - 1)) === 0 && value !== 0;
};

/**
 * Class for decoding KTX2 files
 *
 */
export class KTX2Decoder {
    private _transcoderMgr: TranscoderManager;
    private _zstdDecoder: ZSTDDecoder;

    public static DefaultDecoderOptions: KTX2.IKTX2DecoderOptions = {};

    constructor() {
        this._transcoderMgr = new TranscoderManager();
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async decode(data: Uint8Array, caps: KTX2.ICompressedFormatCapabilities, options?: KTX2.IKTX2DecoderOptions): Promise<KTX2.IDecodedData> {
        const finalOptions = { ...options, ...KTX2Decoder.DefaultDecoderOptions };

        const kfr = new KTX2FileReader(data);

        if (!kfr.isValid()) {
            throw new Error("Invalid KT2 file: wrong signature");
        }

        kfr.parse();

        if (kfr.needZSTDDecoder) {
            if (!this._zstdDecoder) {
                this._zstdDecoder = new ZSTDDecoder();
            }

            await this._zstdDecoder.init();
            return await this._decodeDataAsync(kfr, caps, finalOptions);
        }

        return await this._decodeDataAsync(kfr, caps, finalOptions);
    }

    private async _decodeDataAsync(kfr: KTX2FileReader, caps: KTX2.ICompressedFormatCapabilities, options?: KTX2.IKTX2DecoderOptions): Promise<KTX2.IDecodedData> {
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        const decisionTree = new TranscodeDecisionTree(srcTexFormat, kfr.hasAlpha, IsPowerOfTwo(width) && IsPowerOfTwo(height), caps, options);

        if (options?.transcodeFormatDecisionTree) {
            decisionTree.parseTree(options?.transcodeFormatDecisionTree);
        }

        const transcodeFormat = decisionTree.transcodeFormat;
        const engineFormat = decisionTree.engineFormat;
        const roundToMultiple4 = decisionTree.roundToMultiple4;

        const transcoder = this._transcoderMgr.findTranscoder(srcTexFormat, transcodeFormat, kfr.isInGammaSpace, options?.bypassTranscoders);

        if (transcoder === null) {
            throw new Error(
                `no transcoder found to transcode source texture format "${KTX2.SourceTextureFormat[srcTexFormat]}" to format "${KTX2.TranscodeTarget[transcodeFormat]}"`
            );
        }

        const mipmaps: Array<KTX2.IMipmap> = [];
        const dataPromises: Array<Promise<Uint8Array | null>> = [];
        const decodedData: KTX2.IDecodedData = {
            width: 0,
            height: 0,
            transcodedFormat: engineFormat,
            mipmaps,
            isInGammaSpace: kfr.isInGammaSpace,
            hasAlpha: kfr.hasAlpha,
            transcoderName: transcoder.getName(),
        };

        let firstImageDescIndex = 0;

        for (let level = 0; level < kfr.header.levelCount; level++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }

            const levelWidth = Math.floor(width / (1 << level)) || 1;
            const levelHeight = Math.floor(height / (1 << level)) || 1;

            const numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            const levelImageByteLength = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2) * kfr.dfdBlock.bytesPlane[0];

            const levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;

            let levelDataBuffer: ArrayBufferLike | ArrayBufferView = kfr.data.buffer;

            let levelDataOffset = kfr.levels[level].byteOffset + kfr.data.byteOffset;
            let imageOffsetInLevel = 0;

            if (kfr.header.supercompressionScheme === SupercompressionScheme.ZStandard) {
                levelDataBuffer = this._zstdDecoder.decode(new Uint8Array(levelDataBuffer, levelDataOffset, kfr.levels[level].byteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }

            if (level === 0) {
                decodedData.width = roundToMultiple4 ? (levelWidth + 3) & ~3 : levelWidth;
                decodedData.height = roundToMultiple4 ? (levelHeight + 3) & ~3 : levelHeight;
            }

            for (let imageIndex = 0; imageIndex < numImagesInLevel; imageIndex++) {
                let encodedData: Uint8Array;
                let imageDesc: IKTX2_ImageDesc | null = null;

                if (kfr.header.supercompressionScheme === SupercompressionScheme.BasisLZ) {
                    imageDesc = kfr.supercompressionGlobalData.imageDescs![firstImageDescIndex + imageIndex];

                    encodedData = new Uint8Array(
                        levelDataBuffer as ArrayBuffer,
                        levelDataOffset + imageDesc.rgbSliceByteOffset,
                        imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength
                    );
                } else {
                    encodedData = new Uint8Array(levelDataBuffer as ArrayBuffer, levelDataOffset + imageOffsetInLevel, levelImageByteLength);

                    imageOffsetInLevel += levelImageByteLength;
                }

                const mipmap: KTX2.IMipmap = {
                    data: null,
                    width: levelWidth,
                    height: levelHeight,
                };

                const transcodedData = transcoder
                    .transcode(srcTexFormat, transcodeFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData)
                    // eslint-disable-next-line github/no-then
                    .then((data) => {
                        mipmap.data = data;
                        return data;
                    })
                    // eslint-disable-next-line github/no-then
                    .catch((reason) => {
                        decodedData.errors = decodedData.errors ?? "";
                        decodedData.errors += reason + "\n" + reason.stack + "\n";
                        return null;
                    });

                dataPromises.push(transcodedData);

                mipmaps.push(mipmap);
            }
        }

        await Promise.all(dataPromises);
        return decodedData;
    }
}

// Put in the order you want the transcoders to be used in priority
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_ASTC);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_BC7);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_RGBA_UNORM);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_RGBA_SRGB);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_R8_UNORM);
TranscoderManager.RegisterTranscoder(LiteTranscoder_UASTC_RG8_UNORM);
TranscoderManager.RegisterTranscoder(MSCTranscoder); // catch all transcoder - will throw an error if the format can't be transcoded
