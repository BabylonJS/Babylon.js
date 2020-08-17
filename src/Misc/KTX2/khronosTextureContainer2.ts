import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { ThinEngine } from "../../Engines/thinEngine";
//import { EngineCapabilities } from '../../Engines/engineCapabilities';
//import { Tools } from '../tools';
import { Nullable } from '../../types';
import { KTX2FileReader, supercompressionScheme, IKTX2_ImageDesc } from './KTX2FileReader';
import { sourceTextureFormat, Transcoder, transcodeTarget } from './transcoder';
import { WASMMemoryManager } from './wasmMemoryManager';

import { LiteTranscoder_UASTC_BC7 } from "./LiteTranscoder_UASTC_BC7";
import { LiteTranscoder_UASTC_ASTC } from "./LiteTranscoder_UASTC_ASTC";
import { MSCTranscoder } from "./mscTranscoder";

//const RGB_S3TC_DXT1_Format = 33776;
//const RGBA_S3TC_DXT5_Format = 33779;

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 36492;

/**
 * Class for loading KTX2 files
 * @hidden
 */
export class KhronosTextureContainer2 {

    private static _Transcoders: Array<typeof Transcoder> = [];

    public static registerTranscoder(transcoder: typeof Transcoder) {
        KhronosTextureContainer2._Transcoders.push(transcoder);
    }

    private _engine: ThinEngine;
    private _wasmMemoryManager: WASMMemoryManager;
    private _transcoderInstances: { [key: string]: Transcoder };

    public constructor(engine: ThinEngine) {
        this._engine = engine;
        this._transcoderInstances = {};
    }

    private _findTranscoder(src: sourceTextureFormat, dst: transcodeTarget): Nullable<Transcoder> {
        let transcoder: Nullable<Transcoder> = null;

        for (let i = 0; i < KhronosTextureContainer2._Transcoders.length; ++i) {
            if (KhronosTextureContainer2._Transcoders[i].CanTranscode(src, dst)) {
                const key = sourceTextureFormat[src] + "_" + transcodeTarget[dst];
                transcoder = this._transcoderInstances[key];
                if (!transcoder) {
                    transcoder = new KhronosTextureContainer2._Transcoders[i]();
                    transcoder!.initialize();
                    if (transcoder!.needMemoryManager()) {
                        if (!this._wasmMemoryManager) {
                            this._wasmMemoryManager = new WASMMemoryManager();
                        }
                        transcoder!.setMemoryManager(this._wasmMemoryManager);
                    }
                    this._transcoderInstances[key] = transcoder;
                }
                break;
            }
        }

        return transcoder;
    }

    private async _createMipmaps(kfr: KTX2FileReader, internalTexture: InternalTexture) {
        /*await this.zstd.init();*/

        //var mipmaps = [];
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        let targetFormat = transcodeTarget.BC7_M5_RGBA;
        let transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;

        const transcoder = this._findTranscoder(srcTexFormat, targetFormat);

        if (transcoder === null) {
            throw new Error(`KTX2 container - no transcoder found to transcode source texture format "${sourceTextureFormat[srcTexFormat]}" to format "${transcodeTarget[targetFormat]}"`);
        }

        const texturePromises: Array<Promise<Nullable<Uint8Array>>> = [];

        let firstImageDescIndex = 0;

        for (let level = 0; level < kfr.header.levelCount; level ++) {
            if (level > 0) {
                firstImageDescIndex += Math.max(kfr.header.layerCount, 1) * kfr.header.faceCount * Math.max(kfr.header.pixelDepth >> (level - 1), 1);
            }

            const levelWidth = width / Math.pow(2, level);
            const levelHeight = height / Math.pow(2, level);

            const numImagesInLevel = kfr.header.faceCount; // note that cubemap are not supported yet (see KTX2FileReader), so faceCount == 1
            const levelByteLength = kfr.levels[level].byteLength;
            const levelUncompressedByteLength = kfr.levels[level].uncompressedByteLength;

            let levelDataBuffer = kfr.data.buffer;
            let levelDataOffset = kfr.levels[level].byteOffset;
            let imageOffsetInLevel = 0;

            if (kfr.header.supercompressionScheme === supercompressionScheme.ZStandard) {
                //levelDataBuffer = this.zstd.decode(new Uint8Array(levelDataBuffer, levelDataOffset, levelByteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }

            //const levelImageByteLength = imageInfo.numBlocksX * imageInfo.numBlocksY * DFD bytesPlane0;

            for (let imageIndex = 0; imageIndex < numImagesInLevel; imageIndex ++) {
                let encodedData: Uint8Array;
                let imageDesc: Nullable<IKTX2_ImageDesc> = null;

                if (kfr.header.supercompressionScheme === supercompressionScheme.BasisLZ) {
                    imageDesc = kfr.supercompressionGlobalData.imageDescs![firstImageDescIndex + imageIndex];

                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageDesc.rgbSliceByteOffset, imageDesc.rgbSliceByteLength + imageDesc.alphaSliceByteLength);
                } else {
                    encodedData = new Uint8Array(levelDataBuffer, levelDataOffset + imageOffsetInLevel, levelByteLength);

                    imageOffsetInLevel += levelByteLength;
                }

                texturePromises.push(transcoder.transcode(srcTexFormat, targetFormat, level, levelWidth, levelHeight, levelUncompressedByteLength, kfr, imageDesc, encodedData));
            }
        }

        Promise.all(texturePromises).then((textures) => {
            for (let t = 0; t < textures.length; ++t) {
                let textureData = textures[t];

                if (textureData === null) {
                    throw new Error("KTX2 container - could not transcode one of the image");
                }

                console.log("texture byte length=", textureData.byteLength);

                //textureData = new Uint8Array(textureData.buffer, 0, textureData.byteLength / 6);

                //console.log("texture byte length=", textureData.byteLength);

                internalTexture.width = internalTexture.baseWidth = width;
                internalTexture.height = internalTexture.baseHeight = height;
                internalTexture.generateMipMaps = false;
                internalTexture.invertY = false;

                this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);
                this._engine._uploadCompressedDataToTextureDirectly(internalTexture, transcodedFormat, width, height, textureData, 0, 0);

                internalTexture.isReady = true;
                break;
            }
        });

        //this.mipmaps = mipmaps;
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        const kfr = new KTX2FileReader(data);

        return this._createMipmaps(kfr, internalTexture);
    }

    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        return KTX2FileReader.IsValid(data);
    }
}

// Put in the order you want the transcoders to be used in priority
KhronosTextureContainer2.registerTranscoder(LiteTranscoder_UASTC_ASTC);
KhronosTextureContainer2.registerTranscoder(LiteTranscoder_UASTC_BC7);
KhronosTextureContainer2.registerTranscoder(MSCTranscoder);
