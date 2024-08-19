import { ApplyLut, HufUncompress, ReverseLutFromBitmap, Wav2Decode } from "./exrLoader.compression.huf";
import { ParseUint16, ParseUint32, ParseUint8 } from "./exrLoader.core";
import { BITMAP_SIZE, INT16_SIZE, USHORT_RANGE, type IEXRDecoder } from "./exrLoader.interfaces";

/**
 * No compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressRAW(decoder: IEXRDecoder): DataView {
    return new DataView(decoder.array.buffer, decoder.offset.value, decoder.size);
}

/**
 * PIZ compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressPIZ(decoder: IEXRDecoder): DataView {
    const inDataView = decoder.viewer;
    const inOffset = { value: decoder.offset.value };

    const outBuffer = new Uint16Array(decoder.width * decoder.scanlineBlockSize * (decoder.channels * decoder.type));
    const bitmap = new Uint8Array(BITMAP_SIZE);

    // Setup channel info
    let outBufferEnd = 0;
    const pizChannelData = new Array(decoder.channels);
    for (let i = 0; i < decoder.channels; i++) {
        pizChannelData[i] = {};
        pizChannelData[i]["start"] = outBufferEnd;
        pizChannelData[i]["end"] = pizChannelData[i]["start"];
        pizChannelData[i]["nx"] = decoder.width;
        pizChannelData[i]["ny"] = decoder.lines;
        pizChannelData[i]["size"] = decoder.type;

        outBufferEnd += pizChannelData[i].nx * pizChannelData[i].ny * pizChannelData[i].size;
    }

    // Read range compression data
    const minNonZero = ParseUint16(inDataView, inOffset);
    const maxNonZero = ParseUint16(inDataView, inOffset);

    if (maxNonZero >= BITMAP_SIZE) {
        throw new Error("Wrong PIZ_COMPRESSION BITMAP_SIZE");
    }

    if (minNonZero <= maxNonZero) {
        for (let i = 0; i < maxNonZero - minNonZero + 1; i++) {
            bitmap[i + minNonZero] = ParseUint8(inDataView, inOffset);
        }
    }

    // Reverse LUT
    const lut = new Uint16Array(USHORT_RANGE);
    const maxValue = ReverseLutFromBitmap(bitmap, lut);

    const length = ParseUint32(inDataView, inOffset);

    // Huffman decoding
    HufUncompress(decoder.array, inDataView, inOffset, length, outBuffer, outBufferEnd);

    // Wavelet decoding
    for (let i = 0; i < decoder.channels; ++i) {
        const cd = pizChannelData[i];

        for (let j = 0; j < pizChannelData[i].size; ++j) {
            Wav2Decode(outBuffer, cd.start + j, cd.nx, cd.size, cd.ny, cd.nx * cd.size, maxValue);
        }
    }

    // Expand the pixel data to their original range
    ApplyLut(lut, outBuffer, outBufferEnd);

    // Rearrange the pixel data into the format expected by the caller.
    let tmpOffset = 0;
    const tmpBuffer = new Uint8Array(outBuffer.buffer.byteLength);
    for (let y = 0; y < decoder.lines; y++) {
        for (let c = 0; c < decoder.channels; c++) {
            const cd = pizChannelData[c];

            const n = cd.nx * cd.size;
            const cp = new Uint8Array(outBuffer.buffer, cd.end * INT16_SIZE, n * INT16_SIZE);

            tmpBuffer.set(cp, tmpOffset);
            tmpOffset += n * INT16_SIZE;
            cd.end += n;
        }
    }

    return new DataView(tmpBuffer.buffer);
}
