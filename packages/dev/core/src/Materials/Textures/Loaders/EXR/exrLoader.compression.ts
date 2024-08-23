import { ApplyLut, HufUncompress, ReverseLutFromBitmap, Wav2Decode } from "./exrLoader.compression.huf";
import { DecodeRunLength } from "./exrLoader.compression.rle";
import { InterleaveScalar, ParseUint16, ParseUint32, ParseUint8, Predictor } from "./exrLoader.core";
import { BITMAP_SIZE, INT16_SIZE, USHORT_RANGE, type IEXRDecoder } from "./exrLoader.interfaces";

/**
 * Inspired by https://github.com/sciecode/three.js/blob/dev/examples/jsm/loaders/EXRLoader.js
 * Referred to the original Industrial Light & Magic OpenEXR implementation and the TinyEXR / Syoyo Fujita
 * implementation.
 */

// /*
// Copyright (c) 2014 - 2017, Syoyo Fujita
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Syoyo Fujita nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// */

// // TinyEXR contains some OpenEXR code, which is licensed under ------------

// ///////////////////////////////////////////////////////////////////////////
// //
// // Copyright (c) 2002, Industrial Light & Magic, a division of Lucas
// // Digital Ltd. LLC
// //
// // All rights reserved.
// //
// // Redistribution and use in source and binary forms, with or without
// // modification, are permitted provided that the following conditions are
// // met:
// // *       Redistributions of source code must retain the above copyright
// // notice, this list of conditions and the following disclaimer.
// // *       Redistributions in binary form must reproduce the above
// // copyright notice, this list of conditions and the following disclaimer
// // in the documentation and/or other materials provided with the
// // distribution.
// // *       Neither the name of Industrial Light & Magic nor the names of
// // its contributors may be used to endorse or promote products derived
// // from this software without specific prior written permission.
// //
// // THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// // "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// // LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// // A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// // OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// // SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// // LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// // THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// // (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// // OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// //
// ///////////////////////////////////////////////////////////////////////////

// // End of OpenEXR license -------------------------------------------------

// FFlate access
declare const fflate: any;

/**
 * No compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressRAW(decoder: IEXRDecoder): DataView {
    return new DataView(decoder.array.buffer, decoder.offset.value, decoder.size);
}

/**
 * RLE compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressRLE(decoder: IEXRDecoder): DataView {
    const compressed = decoder.viewer.buffer.slice(decoder.offset.value, decoder.offset.value + decoder.size);

    const rawBuffer = new Uint8Array(DecodeRunLength(compressed));
    const tmpBuffer = new Uint8Array(rawBuffer.length);

    Predictor(rawBuffer);

    InterleaveScalar(rawBuffer, tmpBuffer);

    return new DataView(tmpBuffer.buffer);
}

/**
 * Zip compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressZIP(decoder: IEXRDecoder): DataView {
    const compressed = decoder.array.slice(decoder.offset.value, decoder.offset.value + decoder.size);

    const rawBuffer = fflate.unzlibSync(compressed);
    const tmpBuffer = new Uint8Array(rawBuffer.length);

    Predictor(rawBuffer);

    InterleaveScalar(rawBuffer, tmpBuffer);

    return new DataView(tmpBuffer.buffer);
}

/**
 * PXR compression
 * @param decoder defines the decoder to use
 * @returns a decompressed data view
 */
export function UncompressPXR(decoder: IEXRDecoder): DataView {
    const compressed = decoder.array.slice(decoder.offset.value, decoder.offset.value + decoder.size);

    const rawBuffer = fflate.unzlibSync(compressed);

    const sz = decoder.lines * decoder.channels * decoder.width;
    const tmpBuffer = decoder.type == 1 ? new Uint16Array(sz) : new Uint32Array(sz);

    let tmpBufferEnd = 0;
    let writePtr = 0;
    const ptr = new Array(4);

    for (let y = 0; y < decoder.lines; y++) {
        for (let c = 0; c < decoder.channels; c++) {
            let pixel = 0;

            switch (decoder.type) {
                case 1:
                    ptr[0] = tmpBufferEnd;
                    ptr[1] = ptr[0] + decoder.width;
                    tmpBufferEnd = ptr[1] + decoder.width;

                    for (let j = 0; j < decoder.width; ++j) {
                        const diff = (rawBuffer[ptr[0]++] << 8) | rawBuffer[ptr[1]++];

                        pixel += diff;

                        tmpBuffer[writePtr] = pixel;
                        writePtr++;
                    }

                    break;

                case 2:
                    ptr[0] = tmpBufferEnd;
                    ptr[1] = ptr[0] + decoder.width;
                    ptr[2] = ptr[1] + decoder.width;
                    tmpBufferEnd = ptr[2] + decoder.width;

                    for (let j = 0; j < decoder.width; ++j) {
                        const diff = (rawBuffer[ptr[0]++] << 24) | (rawBuffer[ptr[1]++] << 16) | (rawBuffer[ptr[2]++] << 8);

                        pixel += diff;

                        tmpBuffer[writePtr] = pixel;
                        writePtr++;
                    }

                    break;
            }
        }
    }

    return new DataView(tmpBuffer.buffer);
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
