import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { EngineCapabilities } from '../Engines/engineCapabilities';
import { Tools } from './tools';
import { DataReader } from './dataReader';
import { Constants } from '../Engines/constants';
import { Nullable } from '../types';

declare var MSC_TRANSCODER: any;

const RGB_S3TC_DXT1_Format = 33776;
const RGBA_S3TC_DXT5_Format = 33779;

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 36492;

const enum supercompressionScheme {
    BasisLZ = 1,
    ZStandard = 2
}

const enum dfdModel {
    ETC1S = 163, /* not supported yet */
    UASTC = 166
}

const enum textureFormat {
    ETC1S,
    UASTC4x4
}

const enum dfdChannel_ETC1S {
    RGB = 0,
    RRR = 3,
    GGG = 4,
    AAA = 15

}

const enum dfdChannel_UASTC {
    RGB  = 0,
    RGBA = 3,
    RRR  = 4,
    RRRG = 5
}

interface IKTX2_Header {
    vkFormat: number;
    typeSize: number;
    pixelWidth: number;
    pixelHeight: number;
    pixelDepth: number;
    layerCount: number;
    faceCount: number;
    levelCount: number;
    supercompressionScheme: number;
    dfdByteOffset: number;
    dfdByteLength: number;
    kvdByteOffset: number;
    kvdByteLength: number;
    sgdByteOffset: number;
    sgdByteLength: number;
}

interface IKTX2_Level {
    byteOffset: number;
    byteLength: number;
    uncompressedByteLength: number;
}

interface IKTX2_Sample {
    bitOffset: number;
    bitLength: number;
    channelType: number;
    channelFlags: number;
    samplePosition: number[];
    sampleLower: number;
    sampleUpper: number;
}

interface IKTX2_DFD {
    vendorId: number;
    descriptorType: number;
    versionNumber: number;
    descriptorBlockSize: number;
    colorModel: number;
    colorPrimaries: number;
    transferFunction: number;
    flags: number;
    texelBlockDimension: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    bytesPlane: Array<number>;
    numSamples: number;
    samples: Array<IKTX2_Sample>;
}

interface IKTX2_ImageDesc {
    imageFlags: number;
    rgbSliceByteOffset: number;
    rgbSliceByteLength: number;
    alphaSliceByteOffset: number;
    alphaSliceByteLength: number;
}

interface IKTX2_SupercompressionGlobalData {
    endpointCount?: number;
    selectorCount?: number;
    endpointsByteLength?: number;
    selectorsByteLength?: number;
    tablesByteLength?: number;
    extendedByteLength?: number;
    imageDescs?: Array<IKTX2_ImageDesc>;
    endpointsData?: Uint8Array;
    selectorsData?: Uint8Array;
    tablesData?: Uint8Array;
    extendedData?: Uint8Array;
}

/**
 * Class for loading KTX2 files
 * !!! Experimental Extension Subject to Changes !!!
 * @hidden
 */
export class KhronosTextureContainer2 {
    public static WasmModules = {
        "uastc_astc" : "/dist/preview release/basisTranscoder/uastc_astc.wasm",
        "uastc_bc7" : "/dist/preview release/basisTranscoder/uastc_bc7.wasm",
    };

    private static _ModulePromise: Promise<{ module: any }>;
    private static _TranscodeFormat: number;

    private static readonly VK_FORMAT_UNDEFINED = 0x00;

    private _engine: ThinEngine;

    private _data: ArrayBufferView;
    private _header: IKTX2_Header;
    private _levels: Array<IKTX2_Level>;
    private _dfdBlock: IKTX2_DFD;
    private _sgd: IKTX2_SupercompressionGlobalData;

    private _mscBasisTranscoder: Promise<any>;

    public constructor(engine: ThinEngine) {
        this._engine = engine;

        if (!KhronosTextureContainer2._ModulePromise) {
            KhronosTextureContainer2._ModulePromise = new Promise((resolve) => {
                Tools.LoadFileAsync(KhronosTextureContainer2.WasmModules.uastc_bc7).then((wasmBinary) => {
                    resolve({ module: wasmBinary });
                });
            });
        }
    }

    private _mscBasisModule: any;

    private _getMSCBasisTranscoder() {
        if (this._mscBasisTranscoder) {
            return this._mscBasisTranscoder;
        }

        this._mscBasisTranscoder = new Promise((resolve) => {
            MSC_TRANSCODER().then((basisModule: any) => {
                basisModule.initTranscoders();
                this._mscBasisModule = basisModule;
                resolve();
            });
        });

        return this._mscBasisTranscoder;
    }
    /**
     * Based on https://github.com/mrdoob/three.js/blob/dfb5c23ce126ec845e4aa240599915fef5375797/examples/jsm/loaders/KTX2Loader.js
     */
    private _parseData() {
        let offsetInFile = 12; // skip the header

        /**
         * Get the header
         */
        const hdrReader = new DataReader().setBuffer(this._data, offsetInFile, 17 * 4);

        const header = this._header = {
            vkFormat:               hdrReader.readUint32(),
            typeSize:               hdrReader.readUint32(),
            pixelWidth:             hdrReader.readUint32(),
            pixelHeight:            hdrReader.readUint32(),
            pixelDepth:             hdrReader.readUint32(),
            layerCount:             hdrReader.readUint32(),
            faceCount:              hdrReader.readUint32(),
            levelCount:             hdrReader.readUint32(),
            supercompressionScheme: hdrReader.readUint32(),

            dfdByteOffset:          hdrReader.readUint32(),
            dfdByteLength:          hdrReader.readUint32(),
            kvdByteOffset:          hdrReader.readUint32(),
            kvdByteLength:          hdrReader.readUint32(),
            sgdByteOffset:          hdrReader.readUint64(),
            sgdByteLength:          hdrReader.readUint64(),
        };

        if (header.pixelDepth > 0) {
            throw new Error(`Failed to upload - Only 2D textures are currently supported.`);
        }

        if (header.layerCount > 1) {
            throw new Error(`Failed to upload - Array textures are not currently supported.`);
        }

        if (header.faceCount > 1) {
            throw new Error(`Failed to upload - Cube textures are not currently supported.`);
        }

        console.log(header);

        offsetInFile += hdrReader.byteOffset;

        /**
         * Get the levels
         */
        let levelCount = Math.max(1, header.levelCount);

        const levelReader = new DataReader().setBuffer(this._data, offsetInFile, levelCount * 3 * (2 * 4));

        const levels: Array<IKTX2_Level> = this._levels = [];

        while (levelCount--) {
            levels.push({
                byteOffset: levelReader.readUint64(),
                byteLength: levelReader.readUint64(),
                uncompressedByteLength: levelReader.readUint64(),
            });
        }

        offsetInFile += levelReader.byteOffset;

        console.log(levels);

        /**
         * Get the data format descriptor (DFD) blocks
         */
        const dfdReader = new DataReader().setBuffer(this._data, header.dfdByteOffset, header.dfdByteLength);

        const dfdBlock = this._dfdBlock = {
            vendorId: dfdReader.skipBytes(4 /* skip totalSize */).readUint16(),
            descriptorType: dfdReader.readUint16(),
            versionNumber: dfdReader.readUint16(),
            descriptorBlockSize: dfdReader.readUint16(),
            colorModel: dfdReader.readUint8(),
            colorPrimaries: dfdReader.readUint8(),
            transferFunction: dfdReader.readUint8(),
            flags: dfdReader.readUint8(),
            texelBlockDimension: {
                x: dfdReader.readUint8() + 1,
                y: dfdReader.readUint8() + 1,
                z: dfdReader.readUint8() + 1,
                w: dfdReader.readUint8() + 1,
            },
            bytesPlane: [
                dfdReader.readUint8(), /* bytesPlane0 */
                dfdReader.readUint8(), /* bytesPlane1 */
                dfdReader.readUint8(), /* bytesPlane2 */
                dfdReader.readUint8(), /* bytesPlane3 */
                dfdReader.readUint8(), /* bytesPlane4 */
                dfdReader.readUint8(), /* bytesPlane5 */
                dfdReader.readUint8(), /* bytesPlane6 */
                dfdReader.readUint8(), /* bytesPlane7 */
            ],
            numSamples: 0,
            samples: new Array<IKTX2_Sample>(),
        };

        dfdBlock.numSamples = (dfdBlock.descriptorBlockSize - 24) / 16;

        for (let i = 0; i < dfdBlock.numSamples; i++) {
            const sample = {
                bitOffset: dfdReader.readUint16(),
                bitLength: dfdReader.readUint8() + 1,
                channelType: dfdReader.readUint8(),
                channelFlags: 0,
                samplePosition: [
                    dfdReader.readUint8(), /* samplePosition0 */
                    dfdReader.readUint8(), /* samplePosition1 */
                    dfdReader.readUint8(), /* samplePosition2 */
                    dfdReader.readUint8(), /* samplePosition3 */
                ],
                sampleLower: dfdReader.readUint32(),
                sampleUpper: dfdReader.readUint32(),
            };

            sample.channelFlags = (sample.channelType & 0xF0) >> 4;
            sample.channelType = sample.channelType & 0x0F;

            dfdBlock.samples.push(sample);
        }

        console.log(dfdBlock);

        if (dfdBlock.colorModel !== dfdModel.UASTC) {
            throw new Error(`Failed to upload - Only UASTC color model files are currently supported.`);
        }

        /*if (header.vkFormat !== KhronosTextureContainer2.VK_FORMAT_UNDEFINED &&
             !(header.supercompressionScheme === supercompressionScheme.BasisLZ ||
                dfdBlock.colorModel === dfdModel.UASTC)) {
            throw new Error(`Failed to upload - Only Basis Universal supercompression is currently supported.`);
        }*/

        /**
         * Get the Supercompression Global Data (sgd)
         */
        const sgd: IKTX2_SupercompressionGlobalData = this._sgd = {};

        if (header.sgdByteLength > 0) {
            const sgdReader = new DataReader().setBuffer(this._data, header.sgdByteOffset, header.sgdByteLength);

            sgd.endpointCount = sgdReader.readUint16();
            sgd.selectorCount = sgdReader.readUint16();
            sgd.endpointsByteLength = sgdReader.readUint32();
            sgd.selectorsByteLength = sgdReader.readUint32();
            sgd.tablesByteLength = sgdReader.readUint32();
            sgd.extendedByteLength = sgdReader.readUint32();
            sgd.imageDescs = [];

            for (let i = 0; i < header.levelCount; i ++) {
                sgd.imageDescs.push({
                    imageFlags: sgdReader.readUint32(),
                    rgbSliceByteOffset: sgdReader.readUint32(),
                    rgbSliceByteLength: sgdReader.readUint32(),
                    alphaSliceByteOffset: sgdReader.readUint32(),
                    alphaSliceByteLength: sgdReader.readUint32(),
                });
            }

            const endpointsByteOffset = header.sgdByteOffset + sgdReader.byteOffset;
            const selectorsByteOffset = endpointsByteOffset + sgd.endpointsByteLength;
            const tablesByteOffset = selectorsByteOffset + sgd.selectorsByteLength;
            const extendedByteOffset = tablesByteOffset + sgd.tablesByteLength;

            sgd.endpointsData = new Uint8Array(this._data.buffer, endpointsByteOffset, sgd.endpointsByteLength);
            sgd.selectorsData = new Uint8Array(this._data.buffer, selectorsByteOffset, sgd.selectorsByteLength);
            sgd.tablesData = new Uint8Array(this._data.buffer, tablesByteOffset, sgd.tablesByteLength);
            sgd.extendedData = new Uint8Array(this._data.buffer, extendedByteOffset, sgd.extendedByteLength);
        }

        console.log("sgd", sgd);

    }

    private get textureFormat(): textureFormat {
        return this._dfdBlock.colorModel === dfdModel.UASTC ? textureFormat.UASTC4x4 : textureFormat.ETC1S;
    }

    private get hasAlpha(): boolean {
        const tformat = this.textureFormat;

        switch (tformat) {
            case textureFormat.ETC1S:
                return this._dfdBlock.numSamples === 2 && (this._dfdBlock.samples[0].channelType === dfdChannel_ETC1S.AAA || this._dfdBlock.samples[1].channelType === dfdChannel_ETC1S.AAA);
            case textureFormat.UASTC4x4:
                return this._dfdBlock.samples[0].channelType === dfdChannel_UASTC.RGBA;
        }

        return false;
    }

    private async _initMipmaps(internalTexture: InternalTexture) {

        await this._getMSCBasisTranscoder();

        const basisModule = this._mscBasisModule;

        const TranscodeTarget: any = basisModule.TranscodeTarget;
        const TextureFormat: any = basisModule.TextureFormat;
        const ImageInfo: any = basisModule.ImageInfo;

        /*await this.zstd.init();*/

        var mipmaps = [];
        var width = this._header.pixelWidth;
        var height = this._header.pixelHeight;
        var texFormat = this.textureFormat;
        var hasAlpha = this.hasAlpha;
        var isVideo = false;

        var BasisLzEtc1sImageTranscoder = basisModule.BasisLzEtc1sImageTranscoder;
        var UastcImageTranscoder = basisModule.UastcImageTranscoder;

        var transcoder = texFormat === textureFormat.UASTC4x4 ? new UastcImageTranscoder() : new BasisLzEtc1sImageTranscoder();

        let targetFormat = hasAlpha ? TranscodeTarget.BC7_RGBA : TranscodeTarget.BC1_RGB;
        //let transcodedFormat = hasAlpha ? RGBA_S3TC_DXT5_Format : RGB_S3TC_DXT1_Format;
        let transcodedFormat = COMPRESSED_RGBA_BPTC_UNORM_EXT;

        const useMSCTranscoder = false;

        for (var level = 0; level < this._header.levelCount; level ++) {
            var levelWidth = width / Math.pow(2, level);
            var levelHeight = height / Math.pow(2, level);

            var numImagesInLevel = 1; // TODO(donmccurdy): Support cubemaps, arrays and 3D.
            var imageOffsetInLevel = 0;
            var imageInfo = new ImageInfo(texFormat, levelWidth, levelHeight, level);
            var levelByteLength = this._levels[level].byteLength;
            var levelUncompressedByteLength = this._levels[level].uncompressedByteLength;

            for (var imageIndex = 0; imageIndex < numImagesInLevel; imageIndex ++) {
                if (texFormat === textureFormat.UASTC4x4) {
                    // UASTC
                    let textureData: Nullable<Uint8Array> = null;
                    if (useMSCTranscoder) {
                        imageInfo.flags = 0;
                        imageInfo.rgbByteOffset = 0;
                        imageInfo.rgbByteLength = levelUncompressedByteLength;
                        imageInfo.alphaByteOffset = 0;
                        imageInfo.alphaByteLength = 0;

                        let encodedData = new Uint8Array(this._data.buffer, this._levels[level].byteOffset + imageOffsetInLevel, levelByteLength);

                        if (this._header.supercompressionScheme === supercompressionScheme.ZStandard) {
                            //encodedData = this.zstd.decode( encodedData, levelUncompressedByteLength );
                        }

                        const result: any = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, hasAlpha, isVideo);

                        if (result) {
                            textureData = result.transcodedImage.get_typed_memory_view().slice();
                            result.transcodedImage.delete();
                        }
                    } else {
                        const nBlocks = ((levelWidth + 3) >> 2) * ((levelHeight + 3) >> 2);

                        const texMemoryPages = (nBlocks * 16 + 65535) >> 16;
                        const memory = new WebAssembly.Memory({ initial: texMemoryPages + 1 });
                        const textureView = new Uint8Array(memory.buffer, 65536, nBlocks * 16);

                        const encodedData = new Uint8Array(this._data.buffer, this._levels[level].byteOffset + imageOffsetInLevel, levelByteLength);

                        textureView.set(encodedData);

                        const transcoder = (
                            await WebAssembly.instantiateStreaming(
                                fetch(KhronosTextureContainer2.WasmModules.uastc_bc7),
                                { env: { memory: memory } }
                            )
                        ).instance.exports;

                        if ((transcoder as any).transcode(nBlocks) === 0) {
                            textureData = textureView;
                        }
                    }
                    if (textureData) {
                        console.log("yes!");

                        internalTexture.width = internalTexture.baseWidth = levelWidth;
                        internalTexture.height = internalTexture.baseHeight = levelHeight;
                        internalTexture.generateMipMaps = false;
                        internalTexture.invertY = false;

                        this._engine._bindTextureDirectly(this._engine._gl.TEXTURE_2D, internalTexture);
                        this._engine._uploadCompressedDataToTextureDirectly(internalTexture, transcodedFormat, levelWidth, levelHeight, textureData, 0, 0);

                        internalTexture.isReady = true;
                    } else {
                        console.log("no...");
                    }

                    /*if (this._header.supercompressionScheme === supercompressionScheme.ZStandard) {
                        encodedData = this.zstd.decode(encodedData, levelUncompressedByteLength);
                    }*/

                    //result = transcoder.transcodeImage(targetFormat, encodedData, imageInfo, 0, hasAlpha, isVideo);
                    //mipmaps.push({ data: levelData, width: levelWidth, height: levelHeight });
                }

                imageOffsetInLevel += levelByteLength;
            }
        }

        //this.mipmaps = mipmaps;
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        this._data = data;
        return KhronosTextureContainer2._ModulePromise.then((moduleWrapper: any) => {
            const module = moduleWrapper.module;

            this._parseData();
            this._initMipmaps(internalTexture);

            /*const ktxTexture = new module.ktxTexture(data);
            try {
                if (ktxTexture.needsTranscoding) {
                    ktxTexture.transcodeBasis(KhronosTextureContainer2._TranscodeFormat, 0);
                }

                internalTexture.width = internalTexture.baseWidth = ktxTexture.baseWidth;
                internalTexture.height = internalTexture.baseHeight = ktxTexture.baseHeight;
                internalTexture.generateMipMaps = false;

                const result = ktxTexture.glUpload();
                if (result.error === 0) {
                    internalTexture._webGLTexture = result.texture;
                }
                else {
                    throw new Error(`Failed to upload: ${result.error}`);
                }

                internalTexture.isReady = true;
            }
            finally {
                ktxTexture.delete();
            }*/
        });
    }

    private _determineTranscodeFormat(transcodeTarget: any, caps: EngineCapabilities): number {
        if (caps.s3tc) {
            return transcodeTarget.BC1_OR_3;
        }
        else if (caps.etc2) {
            return transcodeTarget.ETC;
        }

        throw new Error("No compatible format available");
    }

    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        if (data.byteLength >= 12)
        {
            // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
            const identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x32 &&
                identifier[6] === 0x30 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                return true;
            }
        }

        return false;
    }
}
