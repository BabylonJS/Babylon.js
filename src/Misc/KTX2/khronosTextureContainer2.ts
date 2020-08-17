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

interface IMipmap {
    data: Nullable<Uint8Array>;
    width: number;
    height: number;
    transcodedFormat: number;
}

/**
 * Class for loading KTX2 files
 * @hidden
 */
export class KhronosTextureContainer2 {

    /** @hidden */
    public static _Transcoders: Array<typeof Transcoder> = [];

    public static registerTranscoder(transcoder: typeof Transcoder) {
        KhronosTextureContainer2._Transcoders.push(transcoder);
    }

    private _engine: ThinEngine;

    private static _WorkerPromise: Nullable<Promise<Worker>> = null;
    private static _Worker: Nullable<Worker> = null;
    private static _actionId = 0;
    private static _CreateWorkerAsync() {
        if (!this._WorkerPromise) {
            this._WorkerPromise = new Promise((res) => {
                if (this._Worker) {
                    res(this._Worker);
                } else {
                    const workerBlobUrl = URL.createObjectURL(new Blob([`(${workerFunc})()`], { type: "application/javascript" }));
                    this._Worker = new Worker(workerBlobUrl);
                    URL.revokeObjectURL(workerBlobUrl);

                    const initHandler = (msg: any) => {
                        if (msg.data.action === "init") {
                            this._Worker!.removeEventListener("message", initHandler);
                            res(this._Worker!);
                        }
                    };
                    this._Worker.addEventListener("message", initHandler);
                    this._Worker.postMessage({ action: "init" });
                }
            });
        }
        return this._WorkerPromise;
    }

    public constructor(engine: ThinEngine) {
        this._engine = engine;
        //this._transcoderInstances = {};
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        const kfr = new KTX2FileReader(data);

        return new Promise((res, rej) => {
            KhronosTextureContainer2._CreateWorkerAsync().then(() => {
                const actionId = KhronosTextureContainer2._actionId++;
                const messageHandler = (msg: any) => {
                    if (msg.data.action === "mipmapsCreated" && msg.data.id === actionId) {
                        KhronosTextureContainer2._Worker!.removeEventListener("message", messageHandler);
                        if (!msg.data.success) {
                            rej();
                        }else {
                            this._createTexture(msg.data.mipmaps, internalTexture);
                            res();
                        }
                    }
                };
                KhronosTextureContainer2._Worker!.addEventListener("message", messageHandler);

                KhronosTextureContainer2._Worker!.postMessage({
                    action: "createMipmaps",
                    id: actionId,
                    kfr: {
                        header: kfr.header,
                        textureFormat: kfr.textureFormat,
                        dfdBlock: kfr.dfdBlock,
                        levels: kfr.levels,
                        bufferData: kfr.data.buffer,
                        supercompressionGlobalData: kfr.supercompressionGlobalData,
                    },
                }, [kfr.data.buffer]);
            });
        });

        //return this._createMipmaps(kfr, internalTexture);
    }

    protected _createTexture(mipmaps: Array<IMipmap>, internalTexture: InternalTexture) {
        for (let t = 0; t < mipmaps.length; ++t) {
            let mipmap = mipmaps[t];

            if (!mipmap || !mipmap.data) {
                throw new Error("KTX2 container - could not transcode one of the image");
            }

            console.log(`mipmap #${t} byte length=`, mipmap.data.byteLength);

            internalTexture.width = internalTexture.baseWidth = mipmap.width;
            internalTexture.height = internalTexture.baseHeight = mipmap.height;
            internalTexture.generateMipMaps = false;
            internalTexture.invertY = false;

            this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);
            this._engine._uploadCompressedDataToTextureDirectly(internalTexture, mipmap.transcodedFormat, mipmap.width, mipmap.height, mipmap.data, 0, 0);

            internalTexture.isReady = true;
            break;
        }
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

/**
 *
 * Worker thread
 *
 */

declare function postMessage(message: any, transfer?: any[]): void;
function workerFunc(): void {

    let _wasmMemoryManager: WASMMemoryManager;
    let _transcoderInstances: { [key: string]: Transcoder } = {};

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

    const _findTranscoder = (src: sourceTextureFormat, dst: transcodeTarget): Nullable<Transcoder> => {
        let transcoder: Nullable<Transcoder> = null;

        for (let i = 0; i < KhronosTextureContainer2._Transcoders.length; ++i) {
            if (KhronosTextureContainer2._Transcoders[i].CanTranscode(src, dst)) {
                const key = sourceTextureFormat[src] + "_" + transcodeTarget[dst];
                transcoder = _transcoderInstances[key];
                if (!transcoder) {
                    transcoder = new KhronosTextureContainer2._Transcoders[i]();
                    transcoder!.initialize();
                    if (transcoder!.needMemoryManager()) {
                        if (!_wasmMemoryManager) {
                            _wasmMemoryManager = new WASMMemoryManager();
                        }
                        transcoder!.setMemoryManager(_wasmMemoryManager);
                    }
                    _transcoderInstances[key] = transcoder;
                }
                break;
            }
        }

        return transcoder;
    };

    const _createMipmaps = (kfr: KTX2FileReader): Promise<{ mipmaps: Array<IMipmap>, mipmapsData: Array<ArrayBuffer> }> => {
        /*await this.zstd.init();*/

        //var mipmaps = [];
        const width = kfr.header.pixelWidth;
        const height = kfr.header.pixelHeight;
        const srcTexFormat = kfr.textureFormat;

        let targetFormat = 1/*transcodeTarget.BC7_M5_RGBA*/;
        let transcodedFormat = 36492/*COMPRESSED_RGBA_BPTC_UNORM_EXT*/;

        const transcoder = _findTranscoder(srcTexFormat, targetFormat);

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

            if (kfr.header.supercompressionScheme === 2/*supercompressionScheme.ZStandard*/) {
                //levelDataBuffer = this.zstd.decode(new Uint8Array(levelDataBuffer, levelDataOffset, levelByteLength), levelUncompressedByteLength);
                levelDataOffset = 0;
            }

            for (let imageIndex = 0; imageIndex < numImagesInLevel; imageIndex ++) {
                let encodedData: Uint8Array;
                let imageDesc: Nullable<IKTX2_ImageDesc> = null;

                if (kfr.header.supercompressionScheme === 1/*supercompressionScheme.BasisLZ*/) {
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
