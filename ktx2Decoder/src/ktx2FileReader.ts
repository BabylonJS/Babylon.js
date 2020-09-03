import { DataReader } from './Misc/dataReader';
import { sourceTextureFormat } from './transcoder';

/** @hidden */
export enum SupercompressionScheme {
    None = 0,
    BasisLZ = 1,
    ZStandard = 2,
    ZLib = 3
}

const enum DFDModel {
    ETC1S = 163,
    UASTC = 166
}

const enum DFDChannel_ETC1S {
    RGB = 0,
    RRR = 3,
    GGG = 4,
    AAA = 15

}

const enum DFDChannel_UASTC {
    RGB  = 0,
    RGBA = 3,
    RRR  = 4,
    RRRG = 5
}

const enum DFDTransferFunction {
    linear = 1,
    sRGB = 2
}

/** @hidden */
export interface IKTX2_Header {
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

/** @hidden */
export interface IKTX2_Level {
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

/** @hidden */
export interface IKTX2_DFD {
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

/** @hidden */
export interface IKTX2_ImageDesc {
    imageFlags: number;
    rgbSliceByteOffset: number;
    rgbSliceByteLength: number;
    alphaSliceByteOffset: number;
    alphaSliceByteLength: number;
}

/** @hidden */
export interface IKTX2_SupercompressionGlobalData {
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

export class KTX2FileReader {

    private _data: Uint8Array;
    private _header: IKTX2_Header;
    private _levels: Array<IKTX2_Level>;
    private _dfdBlock: IKTX2_DFD;
    private _supercompressionGlobalData: IKTX2_SupercompressionGlobalData;

    /**
     * Will throw an exception if the file can't be parsed
     */
    constructor(data: Uint8Array) {
        this._data = data;
    }

    public get data(): Uint8Array {
        return this._data;
    }

    public get header(): IKTX2_Header {
        return this._header;
    }

    public get levels(): Array<IKTX2_Level> {
        return this._levels;
    }

    public get dfdBlock(): IKTX2_DFD {
        return this._dfdBlock;
    }

    public get supercompressionGlobalData(): IKTX2_SupercompressionGlobalData {
        return this._supercompressionGlobalData;
    }

    public isValid() {
        return KTX2FileReader.IsValid(this._data);
    }

    public parse() {
        let offsetInFile = 12; // skip the header

        /**
         * Get the header
         */
        const hdrReader = new DataReader(this._data, offsetInFile, 17 * 4);

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
            throw new Error(`Failed to parse KTX2 file - Only 2D textures are currently supported.`);
        }

        if (header.layerCount > 1) {
            throw new Error(`Failed to parse KTX2 file - Array textures are not currently supported.`);
        }

        if (header.faceCount > 1) {
            throw new Error(`Failed to parse KTX2 file - Cube textures are not currently supported.`);
        }

        offsetInFile += hdrReader.byteOffset;

        /**
         * Get the levels
         */
        let levelCount = Math.max(1, header.levelCount);

        const levelReader = new DataReader(this._data, offsetInFile, levelCount * 3 * (2 * 4));

        const levels: Array<IKTX2_Level> = this._levels = [];

        while (levelCount--) {
            levels.push({
                byteOffset: levelReader.readUint64(),
                byteLength: levelReader.readUint64(),
                uncompressedByteLength: levelReader.readUint64(),
            });
        }

        offsetInFile += levelReader.byteOffset;

        /**
         * Get the data format descriptor (DFD) blocks
         */
        const dfdReader = new DataReader(this._data, header.dfdByteOffset, header.dfdByteLength);

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

        /**
         * Get the Supercompression Global Data (sgd)
         */
        const sgd: IKTX2_SupercompressionGlobalData = this._supercompressionGlobalData = {};

        if (header.sgdByteLength > 0) {
            const sgdReader = new DataReader(this._data, header.sgdByteOffset, header.sgdByteLength);

            sgd.endpointCount = sgdReader.readUint16();
            sgd.selectorCount = sgdReader.readUint16();
            sgd.endpointsByteLength = sgdReader.readUint32();
            sgd.selectorsByteLength = sgdReader.readUint32();
            sgd.tablesByteLength = sgdReader.readUint32();
            sgd.extendedByteLength = sgdReader.readUint32();
            sgd.imageDescs = [];

            const imageCount = this._getImageCount();

            for (let i = 0; i < imageCount; i ++) {
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

            sgd.endpointsData = new Uint8Array(this._data.buffer, this._data.byteOffset + endpointsByteOffset, sgd.endpointsByteLength);
            sgd.selectorsData = new Uint8Array(this._data.buffer, this._data.byteOffset + selectorsByteOffset, sgd.selectorsByteLength);
            sgd.tablesData = new Uint8Array(this._data.buffer, this._data.byteOffset + tablesByteOffset, sgd.tablesByteLength);
            sgd.extendedData = new Uint8Array(this._data.buffer, this._data.byteOffset + extendedByteOffset, sgd.extendedByteLength);
        }

    }

    private _getImageCount(): number {
        let layerPixelDepth = Math.max(this._header.pixelDepth, 1);
        for (let i = 1; i < this._header.levelCount; i++) {
            layerPixelDepth += Math.max(this._header.pixelDepth >> i, 1);
        }

        return Math.max(this._header.layerCount, 1) * this._header.faceCount * layerPixelDepth;
    }

    public get textureFormat(): sourceTextureFormat {
        return this._dfdBlock.colorModel === DFDModel.UASTC ? sourceTextureFormat.UASTC4x4 : sourceTextureFormat.ETC1S;
    }

    public get hasAlpha(): boolean {
        const tformat = this.textureFormat;

        switch (tformat) {
            case sourceTextureFormat.ETC1S:
                return this._dfdBlock.numSamples === 2 && (this._dfdBlock.samples[0].channelType === DFDChannel_ETC1S.AAA || this._dfdBlock.samples[1].channelType === DFDChannel_ETC1S.AAA);

            case sourceTextureFormat.UASTC4x4:
                return this._dfdBlock.samples[0].channelType === DFDChannel_UASTC.RGBA;
        }

        return false;
    }

    public get needZSTDDecoder(): boolean {
        return this._header.supercompressionScheme === SupercompressionScheme.ZStandard;
    }

    public get isInGammaSpace(): boolean {
        return this._dfdBlock.transferFunction === DFDTransferFunction.sRGB;
    }

    public static IsValid(data: ArrayBufferView): boolean {
        if (data.byteLength >= 12) {
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
