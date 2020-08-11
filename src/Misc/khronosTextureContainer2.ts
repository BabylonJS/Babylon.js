import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { EngineCapabilities } from '../Engines/engineCapabilities';
import { Tools } from './tools';
import { DataReader } from './dataReader';

/**
 * Class for loading KTX2 files
 * !!! Experimental Extension Subject to Changes !!!
 * @hidden
 */
export class KhronosTextureContainer2 {
    public static WasmModuleUASTC_ASTC = "/dist/preview release/basisTranscoder/uastc_astc.wasm";

    private static _ModulePromise: Promise<{ module: any }>;
    private static _TranscodeFormat: number;

    private static readonly VK_FORMAT_UNDEFINED = 0x00;
    private static readonly SupercompressionScheme_BasisLZ = 1;

    private static readonly DFDModel = {
        ETC1S: 163,
        UASTC: 166,
    };

    private static readonly DFDChannel = {
        ETC1S: {
            RGB: 0,
            RRR: 3,
            GGG: 4,
            AAA: 15,
        },
        UASTC: {
            RGB: 0,
            RGBA: 3,
            RRR: 4,
            RRRG: 5
        },
    };

    public constructor(engine: ThinEngine) {
        if (!KhronosTextureContainer2._ModulePromise) {
            KhronosTextureContainer2._ModulePromise = new Promise((resolve) => {
                Tools.LoadFileAsync(KhronosTextureContainer2.WasmModuleUASTC_ASTC).then((wasmBinary) => {
                    resolve({ module: wasmBinary });
                });
            });
        }
    }

    private _parseData(data: ArrayBufferView) {
        let offsetInFile = 12; // skip the header

        // Get the header
        const hdrReader = new DataReader().setBuffer(data, offsetInFile, 17 * 4);

        const header = {
            vkFormat:               hdrReader.readUint32(),
            typeSize:               hdrReader.readUint32(),
            pixelWidth:             hdrReader.readUint32(),
            pixelHeight:            hdrReader.readUint32(),
            pixelDepth:             hdrReader.readUint32(),
            layerCount:             hdrReader.readUint32(),
            faceCount:              hdrReader.readUint32(),
            levelCount:             hdrReader.readUint32(),
            supercompressionScheme: hdrReader.readUint32(),

            dfdByteOffset: hdrReader.readUint32(),
            dfdByteLength: hdrReader.readUint32(),
            kvdByteOffset: hdrReader.readUint32(),
            kvdByteLength: hdrReader.readUint32(),
            sgdByteOffset: hdrReader.readUint64(),
            sgdByteLength: hdrReader.readUint64(),
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

        // Get the levels
        let levelCount = Math.max(1, header.levelCount);

        const levelReader = new DataReader().setBuffer(data, offsetInFile, levelCount * 3 * (2 * 4));

        const levels: Array<{ byteOffset: number, byteLength: number, uncompressedByteLength: number }> = [];

        while (levelCount--) {
            levels.push({
                byteOffset: levelReader.readUint64(),
                byteLength: levelReader.readUint64(),
                uncompressedByteLength: levelReader.readUint64()
            });
        }

        offsetInFile += levelReader.byteOffset;

        console.log(levels);

        // Get the data format descriptor (DFD) blocks
        const dfdReader = new DataReader().setBuffer(data, header.dfdByteOffset, header.dfdByteLength);

        const dfdBlock = {
            vendorId: dfdReader.skipBytes(4 /* skip totalSize */).readUint16(),
            descriptorType: dfdReader.readUint16(),
            versionNumber: dfdReader.readUint16(),
            descriptorBlockSize: dfdReader.readUint16(),
            colorModel: dfdReader.readUint8(),
            colorPrimaries: dfdReader.readUint8(),
            transferFunction: dfdReader.readUint8(),
            flags: dfdReader.readUint8(),
            texelBlockDimension: {
                r: dfdReader.readUint8() + 1,
                g: dfdReader.readUint8() + 1,
                b: dfdReader.readUint8() + 1,
                a: dfdReader.readUint8() + 1,
            },
            bytesPlane: [
                dfdReader.readUint8(), /* bytesPlane0 */
                dfdReader.readUint8(), /* bytesPlane1 */
                dfdReader.readUint8(), /* bytesPlane2 */
                dfdReader.readUint8(), /* bytesPlane3 */
                dfdReader.readUint8(), /* bytesPlane4 */
                dfdReader.readUint8(), /* bytesPlane5 */
                dfdReader.readUint8(), /* bytesPlane6 */
                dfdReader.readUint8()  /* bytesPlane7 */
            ],
            numSamples: 0,
            samples: new Array<{ bitOffset: number, bitLength: number, channelType: number, samplePosition: number[], sampleLower: number, sampleUpper: number }>()
        };

        dfdBlock.numSamples = (dfdBlock.descriptorBlockSize - 24) / 16;

        for (let i = 0; i < dfdBlock.numSamples; i++) {
            dfdBlock.samples.push({
                bitOffset: dfdReader.readUint16(),
                bitLength: dfdReader.readUint8(),
                channelType: dfdReader.readUint8(),
                samplePosition: [
                    dfdReader.readUint8(), /* samplePosition0 */
                    dfdReader.readUint8(), /* samplePosition1 */
                    dfdReader.readUint8(), /* samplePosition2 */
                    dfdReader.readUint8()  /* samplePosition3 */
                ],
                sampleLower: dfdReader.readUint32(),
                sampleUpper: dfdReader.readUint32()
            });
        }

        console.log(dfdBlock);

        if (header.vkFormat !== KhronosTextureContainer2.VK_FORMAT_UNDEFINED &&
             !(header.supercompressionScheme === KhronosTextureContainer2.SupercompressionScheme_BasisLZ ||
                dfdBlock.colorModel === KhronosTextureContainer2.DFDModel.UASTC)) {
            throw new Error(`Failed to upload - Only Basis Universal supercompression is currently supported.`);
        }

        // Get the Supercompression Global Data (sgd)
        const sgd: any = {};

        if (header.sgdByteLength > 0) {
            const sgdReader = new DataReader().setBuffer(data, header.sgdByteOffset, header.sgdByteLength);
        }

    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        return KhronosTextureContainer2._ModulePromise.then((moduleWrapper: any) => {
            const module = moduleWrapper.module;

            this._parseData(data);

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
