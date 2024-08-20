import type { DataCursor } from "./exrLoader.core";
import { CompressionCodes, DecodeFloat32, ParseFloat16, ParseFloat32, ParseInt32, ParseInt64, ParseUint16, ParseUint32 } from "./exrLoader.core";
import { UncompressPIZ, UncompressPXR, UncompressRAW, UncompressRLE, UncompressZIP } from "./exrLoader.compression";
import { FLOAT32_SIZE, INT16_SIZE, type IEXRDecoder, type IEXRHeader } from "./exrLoader.interfaces";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools";
import { ExrLoaderGlobalConfiguration, EXROutputType } from "./exrLoader.configuration";

/**
 * Create a decoder for the exr file
 * @param header header of the exr file
 * @param dataView dataview of the exr file
 * @param offset current offset
 * @param outputType expected output type (float or half float)
 * @returns a promise that resolves with the decoder
 */
export async function CreateDecoderAsync(header: IEXRHeader, dataView: DataView, offset: DataCursor, outputType: EXROutputType): Promise<IEXRDecoder> {
    const decoder: IEXRDecoder = {
        size: 0,
        viewer: dataView,
        array: new Uint8Array(dataView.buffer),
        offset: offset,
        width: header.dataWindow.xMax - header.dataWindow.xMin + 1,
        height: header.dataWindow.yMax - header.dataWindow.yMin + 1,
        channels: header.channels.length,
        channelLineOffsets: {},
        scanOrder: () => 0,
        bytesPerLine: 0,
        outLineWidth: 0,
        lines: 0,
        scanlineBlockSize: 0,
        inputSize: null,
        type: 0,
        uncompress: null,
        getter: () => 0,
        format: Constants.TEXTUREFORMAT_RGBA,
        outputChannels: 0,
        decodeChannels: {},
        blockCount: null,
        byteArray: null,
        linearSpace: false,
        textureType: 0,
    };

    switch (header.compression) {
        case CompressionCodes.NO_COMPRESSION:
            decoder.lines = 1;
            decoder.uncompress = UncompressRAW;
            break;

        case CompressionCodes.RLE_COMPRESSION:
            decoder.lines = 1;
            decoder.uncompress = UncompressRLE;
            break;

        case CompressionCodes.ZIPS_COMPRESSION:
            decoder.lines = 1;
            decoder.uncompress = UncompressZIP;
            await Tools.LoadScriptAsync(ExrLoaderGlobalConfiguration.FFLATEUrl);
            break;

        case CompressionCodes.ZIP_COMPRESSION:
            decoder.lines = 16;
            decoder.uncompress = UncompressZIP;
            await Tools.LoadScriptAsync(ExrLoaderGlobalConfiguration.FFLATEUrl);
            break;

        case CompressionCodes.PIZ_COMPRESSION:
            decoder.lines = 32;
            decoder.uncompress = UncompressPIZ;
            break;

        case CompressionCodes.PXR24_COMPRESSION:
            decoder.lines = 16;
            decoder.uncompress = UncompressPXR;
            await Tools.LoadScriptAsync(ExrLoaderGlobalConfiguration.FFLATEUrl);
            break;

        default:
            throw new Error(CompressionCodes[header.compression] + " is unsupported");
    }

    decoder.scanlineBlockSize = decoder.lines;

    const channels: {
        [key: string]: boolean;
    } = {};
    for (const channel of header.channels) {
        switch (channel.name) {
            case "Y":
            case "R":
            case "G":
            case "B":
            case "A":
                channels[channel.name] = true;
                decoder.type = channel.pixelType;
        }
    }

    // RGB images will be converted to RGBA format, preventing software emulation in select devices.
    let fillAlpha = false;

    if (channels.R && channels.G && channels.B) {
        fillAlpha = !channels.A;
        decoder.outputChannels = 4;
        decoder.decodeChannels = { R: 0, G: 1, B: 2, A: 3 };
    } else if (channels.Y) {
        decoder.outputChannels = 1;
        decoder.decodeChannels = { Y: 0 };
    } else {
        throw new Error("EXRLoader.parse: file contains unsupported data channels.");
    }

    if (decoder.type === 1) {
        // half
        switch (outputType) {
            case EXROutputType.Float:
                decoder.getter = ParseFloat16;
                decoder.inputSize = INT16_SIZE;
                break;

            case EXROutputType.HalfFloat:
                decoder.getter = ParseUint16;
                decoder.inputSize = INT16_SIZE;
                break;
        }
    } else if (decoder.type === 2) {
        // float
        switch (outputType) {
            case EXROutputType.Float:
                decoder.getter = ParseFloat32;
                decoder.inputSize = FLOAT32_SIZE;
                break;

            case EXROutputType.HalfFloat:
                decoder.getter = DecodeFloat32;
                decoder.inputSize = FLOAT32_SIZE;
        }
    } else {
        throw new Error("Unsupported pixelType " + decoder.type + " for " + header.compression);
    }

    decoder.blockCount = decoder.height / decoder.scanlineBlockSize;

    for (let i = 0; i < decoder.blockCount; i++) {
        ParseInt64(dataView, offset); // scanlineOffset
    }

    // we should be passed the scanline offset table, ready to start reading pixel data.
    const size = decoder.width * decoder.height * decoder.outputChannels;

    switch (outputType) {
        case EXROutputType.Float:
            decoder.byteArray = new Float32Array(size);
            decoder.textureType = Constants.TEXTURETYPE_FLOAT;

            // Fill initially with 1s for the alpha value if the texture is not RGBA, RGB values will be overwritten
            if (fillAlpha) {
                decoder.byteArray.fill(1, 0, size);
            }

            break;

        case EXROutputType.HalfFloat:
            decoder.byteArray = new Uint16Array(size);
            decoder.textureType = Constants.TEXTURETYPE_HALF_FLOAT;

            if (fillAlpha) {
                decoder.byteArray.fill(0x3c00, 0, size); // Uint16Array holds half float data, 0x3C00 is 1
            }

            break;

        default:
            throw new Error("Unsupported type: " + outputType);
    }

    let byteOffset = 0;
    for (const channel of header.channels) {
        if (decoder.decodeChannels[channel.name] !== undefined) {
            decoder.channelLineOffsets[channel.name] = byteOffset * decoder.width;
        }

        byteOffset += channel.pixelType * 2;
    }

    decoder.bytesPerLine = decoder.width * byteOffset;
    decoder.outLineWidth = decoder.width * decoder.outputChannels;

    if (header.lineOrder === "INCREASING_Y") {
        decoder.scanOrder = (y) => y;
    } else {
        decoder.scanOrder = (y) => decoder.height - 1 - y;
    }

    if (decoder.outputChannels == 4) {
        decoder.format = Constants.TEXTUREFORMAT_RGBA;
        decoder.linearSpace = true;
    } else {
        decoder.format = Constants.TEXTUREFORMAT_R;
        decoder.linearSpace = false;
    }

    return decoder;
}

/**
 * Scan the data of the exr file
 * @param decoder decoder to use
 * @param header header of the exr file
 * @param dataView dataview of the exr file
 * @param offset current offset
 */
export function ScanData(decoder: IEXRDecoder, header: IEXRHeader, dataView: DataView, offset: DataCursor): void {
    const tmpOffset = { value: 0 };

    for (let scanlineBlockIdx = 0; scanlineBlockIdx < decoder.height / decoder.scanlineBlockSize; scanlineBlockIdx++) {
        const line = ParseInt32(dataView, offset) - header.dataWindow.yMin; // line_no
        decoder.size = ParseUint32(dataView, offset); // data_len
        decoder.lines = line + decoder.scanlineBlockSize > decoder.height ? decoder.height - line : decoder.scanlineBlockSize;

        const isCompressed = decoder.size < decoder.lines * decoder.bytesPerLine;
        const viewer = isCompressed && decoder.uncompress ? decoder.uncompress(decoder) : UncompressRAW(decoder);

        offset.value += decoder.size;

        for (let line_y = 0; line_y < decoder.scanlineBlockSize; line_y++) {
            const scan_y = scanlineBlockIdx * decoder.scanlineBlockSize;
            const true_y = line_y + decoder.scanOrder(scan_y);
            if (true_y >= decoder.height) {
                continue;
            }

            const lineOffset = line_y * decoder.bytesPerLine;
            const outLineOffset = (decoder.height - 1 - true_y) * decoder.outLineWidth;

            for (let channelID = 0; channelID < decoder.channels; channelID++) {
                const name = header.channels[channelID].name;
                const lOff = decoder.channelLineOffsets[name];
                const cOff = decoder.decodeChannels[name];

                if (cOff === undefined) {
                    continue;
                }

                tmpOffset.value = lineOffset + lOff;

                for (let x = 0; x < decoder.width; x++) {
                    const outIndex = outLineOffset + x * decoder.outputChannels + cOff;
                    if (decoder.byteArray) {
                        decoder.byteArray[outIndex] = decoder.getter(viewer, tmpOffset);
                    }
                }
            }
        }
    }
}
