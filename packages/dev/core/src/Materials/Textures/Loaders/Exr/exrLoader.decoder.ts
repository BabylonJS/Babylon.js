import type { DataCursor } from "./exrLoader.core";
import { CompressionCodes, DecodeFloat32, ParseFloat16, ParseFloat32, ParseInt64, ParseUint16 } from "./exrLoader.core";
import { UncompressPIZ, UncompressRAW } from "./exrLoader.compression";
import { FLOAT32_SIZE, INT16_SIZE, type IEXRDecoder, type IEXRHeader } from "./exrLoader.interfaces";

export enum OutputType {
    FloatType,
    HalfFloatType,
}

export function CreateDecoder(header: IEXRHeader, dataView: DataView, offset: DataCursor, outputType: OutputType): IEXRDecoder {
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
        format: null,
        outputChannels: 0,
        decodeChannels: {},
        blockCount: null,
        byteArray: null,
        //  colorSpace: LinearSRGBColorSpace,
    };

    switch (header.compression) {
        case CompressionCodes.NO_COMPRESSION:
            decoder.lines = 1;
            decoder.uncompress = UncompressRAW;
            break;

        // case "RLE_COMPRESSION":
        //     EXRDecoder.lines = 1;
        //     EXRDecoder.uncompress = uncompressRLE;
        //     break;

        // case "ZIPS_COMPRESSION":
        //     EXRDecoder.lines = 1;
        //     EXRDecoder.uncompress = uncompressZIP;
        //     break;

        // case "ZIP_COMPRESSION":
        //     EXRDecoder.lines = 16;
        //     EXRDecoder.uncompress = uncompressZIP;
        //     break;

        case "PIZ_COMPRESSION":
            decoder.lines = 32;
            decoder.uncompress = UncompressPIZ;
            break;

        // case "PXR24_COMPRESSION":
        //     EXRDecoder.lines = 16;
        //     EXRDecoder.uncompress = uncompressPXR;
        //     break;

        // case "DWAA_COMPRESSION":
        //     EXRDecoder.lines = 32;
        //     EXRDecoder.uncompress = uncompressDWA;
        //     break;

        // case "DWAB_COMPRESSION":
        //     EXRDecoder.lines = 256;
        //     EXRDecoder.uncompress = uncompressDWA;
        //     break;

        default:
            throw new Error(header.compression + " is unsupported");
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
            case OutputType.FloatType:
                decoder.getter = ParseFloat16;
                decoder.inputSize = INT16_SIZE;
                break;

            case OutputType.HalfFloatType:
                decoder.getter = ParseUint16;
                decoder.inputSize = INT16_SIZE;
                break;
        }
    } else if (decoder.type === 2) {
        // float
        switch (outputType) {
            case OutputType.FloatType:
                decoder.getter = ParseFloat32;
                decoder.inputSize = FLOAT32_SIZE;
                break;

            case OutputType.HalfFloatType:
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
        case OutputType.FloatType:
            decoder.byteArray = new Float32Array(size);

            // Fill initially with 1s for the alpha value if the texture is not RGBA, RGB values will be overwritten
            if (fillAlpha) {
                decoder.byteArray.fill(1, 0, size);
            }

            break;

        case OutputType.HalfFloatType:
            decoder.byteArray = new Uint16Array(size);

            if (fillAlpha) decoder.byteArray.fill(0x3c00, 0, size); // Uint16Array holds half float data, 0x3C00 is 1

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
        // decoder.format = RGBAFormat;
        // decoder.colorSpace = LinearSRGBColorSpace;
    } else {
        // decoder.format = RedFormat;
        //decoder.colorSpace = NoColorSpace;
    }

    return decoder;
}
