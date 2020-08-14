import { Nullable } from '../../types';
import { Transcoder, sourceTextureFormat, transcodeTarget } from './transcoder';
import { IKTX2_SupercompressionGlobalData, IKTX2_ImageDesc } from './KTX2FileReader';

declare var MSC_TRANSCODER: any;

/**
 * @hidden
 */
export class MSCTranscoder extends Transcoder {

    private _mscBasisTranscoderPromise: Promise<any>;
    private _mscBasisModule: any;

    private _getMSCBasisTranscoder() {
        if (this._mscBasisTranscoderPromise) {
            return this._mscBasisTranscoderPromise;
        }

        this._mscBasisTranscoderPromise = new Promise((resolve) => {
            MSC_TRANSCODER().then((basisModule: any) => {
                basisModule.initTranscoders();
                this._mscBasisModule = basisModule;
                resolve();
            });
        });

        return this._mscBasisTranscoderPromise;
    }

    public static CanTranscode(src: sourceTextureFormat, dst: transcodeTarget): boolean {
        return true;
    }

    public transcode(src: sourceTextureFormat, dst: transcodeTarget, level: number, width: number, height: number, levelUncompressedByteLength: number, hasAlpha: boolean, sgd: IKTX2_SupercompressionGlobalData, imageDesc: Nullable<IKTX2_ImageDesc>, encodedData: Uint8Array): Promise<Nullable<Uint8Array>> {
        const isVideo = false;
        return this._getMSCBasisTranscoder().then(() => {
            const basisModule = this._mscBasisModule;

            const TranscodeTarget: any = basisModule.TranscodeTarget;
            const TextureFormat: any = basisModule.TextureFormat;
            const ImageInfo: any = basisModule.ImageInfo;

            var transcoder = src === sourceTextureFormat.UASTC4x4 ? new basisModule.UastcImageTranscoder() : new basisModule.BasisLzEtc1sImageTranscoder();
            var texFormat = src === sourceTextureFormat.UASTC4x4 ? TextureFormat.UASTC4x4 : TextureFormat.ETC1S;

            var imageInfo = new ImageInfo(texFormat, width, height, level);

            const targetFormat = TranscodeTarget[transcodeTarget[dst]]; // works because the labels of the sourceTextureFormat enum are the same than the property names used in TranscodeTarget!

            if (!basisModule.isFormatSupported(targetFormat, texFormat)) {
                throw new Error(`MSCTranscoder: Transcoding from "${sourceTextureFormat[src]}" to "${transcodeTarget[dst]}" not supported by current transcoder build.`);
            }

            let result: any;

            if (src === sourceTextureFormat.ETC1S) {
                var numEndpoints = sgd.endpointCount;
                var numSelectors = sgd.selectorCount;
                var endpoints = sgd.endpointsData;
                var selectors = sgd.selectorsData;
                var tables = sgd.tablesData;

                transcoder.decodePalettes(numEndpoints, endpoints, numSelectors, selectors);
                transcoder.decodeTables(tables);

                imageInfo.flags = imageDesc!.imageFlags;
                imageInfo.rgbByteOffset = 0;
                imageInfo.rgbByteLength = imageDesc!.rgbSliceByteLength;
                imageInfo.alphaByteOffset = imageDesc!.alphaSliceByteOffset > 0 ? imageDesc!.rgbSliceByteLength : 0;
                imageInfo.alphaByteLength = imageDesc!.alphaSliceByteLength;

                result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, isVideo);
            } else {
                imageInfo.flags = 0;
                imageInfo.rgbByteOffset = 0;
                imageInfo.rgbByteLength = levelUncompressedByteLength;
                imageInfo.alphaByteOffset = 0;
                imageInfo.alphaByteLength = 0;

                result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, hasAlpha, isVideo);
            }

            if (result && result.transcodedImage !== undefined) {
                const textureData = result.transcodedImage.get_typed_memory_view().slice();
                result.transcodedImage.delete();
                return textureData;
            }

            return null;
        });
    }
}