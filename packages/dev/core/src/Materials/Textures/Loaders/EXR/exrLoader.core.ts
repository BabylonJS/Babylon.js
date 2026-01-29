import { Clamp } from "core/Maths/math.scalar.functions";
import { FLOAT32_SIZE, INT16_SIZE, INT32_SIZE, INT8_SIZE, ULONG_SIZE } from "./exrLoader.interfaces";

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

export enum CompressionCodes {
    NO_COMPRESSION,
    RLE_COMPRESSION,
    ZIPS_COMPRESSION,
    ZIP_COMPRESSION,
    PIZ_COMPRESSION,
    PXR24_COMPRESSION,
}

enum LineOrders {
    INCREASING_Y,
    DECREASING_Y,
}

/**
 * Interface used to define the cursor position in the data
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface DataCursor {
    /** Curosr position */
    value: number;
}

const Tables = GenerateTables();

// Fast Half Float Conversions, http://www.fox-toolkit.org/ftp/fasthalffloatconversion.pdf
function GenerateTables() {
    // float32 to float16 helpers

    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const uint32View = new Uint32Array(buffer);

    const baseTable = new Uint32Array(512);
    const shiftTable = new Uint32Array(512);

    for (let i = 0; i < 256; ++i) {
        const e = i - 127;

        // very small number (0, -0)

        if (e < -27) {
            baseTable[i] = 0x0000;
            baseTable[i | 0x100] = 0x8000;
            shiftTable[i] = 24;
            shiftTable[i | 0x100] = 24;

            // small number (denorm)
        } else if (e < -14) {
            baseTable[i] = 0x0400 >> (-e - 14);
            baseTable[i | 0x100] = (0x0400 >> (-e - 14)) | 0x8000;
            shiftTable[i] = -e - 1;
            shiftTable[i | 0x100] = -e - 1;

            // normal number
        } else if (e <= 15) {
            baseTable[i] = (e + 15) << 10;
            baseTable[i | 0x100] = ((e + 15) << 10) | 0x8000;
            shiftTable[i] = 13;
            shiftTable[i | 0x100] = 13;

            // large number (Infinity, -Infinity)
        } else if (e < 128) {
            baseTable[i] = 0x7c00;
            baseTable[i | 0x100] = 0xfc00;
            shiftTable[i] = 24;
            shiftTable[i | 0x100] = 24;

            // stay (NaN, Infinity, -Infinity)
        } else {
            baseTable[i] = 0x7c00;
            baseTable[i | 0x100] = 0xfc00;
            shiftTable[i] = 13;
            shiftTable[i | 0x100] = 13;
        }
    }

    // float16 to float32 helpers
    const mantissaTable = new Uint32Array(2048);
    const exponentTable = new Uint32Array(64);
    const offsetTable = new Uint32Array(64);

    for (let i = 1; i < 1024; ++i) {
        let m = i << 13; // zero pad mantissa bits
        let e = 0; // zero exponent

        // normalized
        while ((m & 0x00800000) === 0) {
            m <<= 1;
            e -= 0x00800000; // decrement exponent
        }

        m &= ~0x00800000; // clear leading 1 bit
        e += 0x38800000; // adjust bias

        mantissaTable[i] = m | e;
    }

    for (let i = 1024; i < 2048; ++i) {
        mantissaTable[i] = 0x38000000 + ((i - 1024) << 13);
    }

    for (let i = 1; i < 31; ++i) {
        exponentTable[i] = i << 23;
    }

    exponentTable[31] = 0x47800000;
    exponentTable[32] = 0x80000000;

    for (let i = 33; i < 63; ++i) {
        exponentTable[i] = 0x80000000 + ((i - 32) << 23);
    }

    exponentTable[63] = 0xc7800000;

    for (let i = 1; i < 64; ++i) {
        if (i !== 32) {
            offsetTable[i] = 1024;
        }
    }

    return {
        floatView: floatView,
        uint32View: uint32View,
        baseTable: baseTable,
        shiftTable: shiftTable,
        mantissaTable: mantissaTable,
        exponentTable: exponentTable,
        offsetTable: offsetTable,
    };
}

/**
 * Parse a null terminated string from the buffer
 * @param buffer buffer to read from
 * @param offset current offset in the buffer
 * @returns a string
 */
export function ParseNullTerminatedString(buffer: ArrayBufferLike, offset: DataCursor) {
    const uintBuffer = new Uint8Array(buffer);
    let endOffset = 0;

    while (uintBuffer[offset.value + endOffset] != 0) {
        endOffset += 1;
    }

    const stringValue = new TextDecoder().decode(uintBuffer.slice(offset.value, offset.value + endOffset));

    offset.value = offset.value + endOffset + 1;

    return stringValue;
}

/**
 * Parse an int32 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns an int32
 */
export function ParseInt32(dataView: DataView, offset: DataCursor) {
    const value = dataView.getInt32(offset.value, true);

    offset.value += INT32_SIZE;

    return value;
}

/**
 * Parse an uint32 from the buffer
 * @param dataView data view to read from
 * @param offset offset in the data view
 * @returns an uint32
 */
export function ParseUint32(dataView: DataView, offset: DataCursor) {
    const value = dataView.getUint32(offset.value, true);

    offset.value += INT32_SIZE;

    return value;
}

/**
 * Parse an uint8 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns an uint8
 */
export function ParseUint8(dataView: DataView, offset: DataCursor) {
    const value = dataView.getUint8(offset.value);

    offset.value += INT8_SIZE;

    return value;
}

/**
 * Parse an uint16 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns an uint16
 */
export function ParseUint16(dataView: DataView, offset: DataCursor) {
    const value = dataView.getUint16(offset.value, true);

    offset.value += INT16_SIZE;

    return value;
}

/**
 * Parse an uint8 from an array buffer
 * @param array array buffer
 * @param offset current offset in the data view
 * @returns an uint16
 */
export function ParseUint8Array(array: Uint8Array, offset: DataCursor) {
    const value = array[offset.value];

    offset.value += INT8_SIZE;

    return value;
}

/**
 * Parse an int64 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns an int64
 */
export function ParseInt64(dataView: DataView, offset: DataCursor) {
    let int;

    if ("getBigInt64" in DataView.prototype) {
        int = Number(dataView.getBigInt64(offset.value, true));
    } else {
        int = dataView.getUint32(offset.value + 4, true) + Number(dataView.getUint32(offset.value, true) << 32);
    }

    offset.value += ULONG_SIZE;

    return int;
}

/**
 * Parse a float32 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns a float32
 */
export function ParseFloat32(dataView: DataView, offset: DataCursor) {
    const value = dataView.getFloat32(offset.value, true);

    offset.value += FLOAT32_SIZE;

    return value;
}

/**
 * Parse a float16 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns a float16
 */
export function ParseFloat16(dataView: DataView, offset: DataCursor) {
    return DecodeFloat16(ParseUint16(dataView, offset));
}

function DecodeFloat16(binary: number) {
    const exponent = (binary & 0x7c00) >> 10;
    const fraction = binary & 0x03ff;

    return (
        (binary >> 15 ? -1 : 1) *
        (exponent ? (exponent === 0x1f ? (fraction ? NaN : Infinity) : Math.pow(2, exponent - 15) * (1 + fraction / 0x400)) : 6.103515625e-5 * (fraction / 0x400))
    );
}

function ToHalfFloat(value: number) {
    if (Math.abs(value) > 65504) {
        throw new Error("Value out of range.Consider using float instead of half-float.");
    }

    value = Clamp(value, -65504, 65504);

    Tables.floatView[0] = value;
    const f = Tables.uint32View[0];
    const e = (f >> 23) & 0x1ff;
    return Tables.baseTable[e] + ((f & 0x007fffff) >> Tables.shiftTable[e]);
}

/**
 * Decode a float32 from the buffer
 * @param dataView dataview on the data
 * @param offset current offset in the data view
 * @returns a float32
 */
export function DecodeFloat32(dataView: DataView, offset: DataCursor) {
    return ToHalfFloat(ParseFloat32(dataView, offset));
}

function ParseFixedLengthString(buffer: ArrayBufferLike, offset: DataCursor, size: number) {
    const stringValue = new TextDecoder().decode(new Uint8Array(buffer).slice(offset.value, offset.value + size));

    offset.value = offset.value + size;

    return stringValue;
}

function ParseRational(dataView: DataView, offset: DataCursor) {
    const x = ParseInt32(dataView, offset);
    const y = ParseUint32(dataView, offset);

    return [x, y];
}

function ParseTimecode(dataView: DataView, offset: DataCursor) {
    const x = ParseUint32(dataView, offset);
    const y = ParseUint32(dataView, offset);

    return [x, y];
}

function ParseV2f(dataView: DataView, offset: DataCursor) {
    const x = ParseFloat32(dataView, offset);
    const y = ParseFloat32(dataView, offset);

    return [x, y];
}

function ParseV3f(dataView: DataView, offset: DataCursor) {
    const x = ParseFloat32(dataView, offset);
    const y = ParseFloat32(dataView, offset);
    const z = ParseFloat32(dataView, offset);

    return [x, y, z];
}

function ParseChlist(dataView: DataView, offset: DataCursor, size: number) {
    const startOffset = offset.value;
    const channels = [];

    while (offset.value < startOffset + size - 1) {
        const name = ParseNullTerminatedString(dataView.buffer, offset);
        const pixelType = ParseInt32(dataView, offset);
        const pLinear = ParseUint8(dataView, offset);
        offset.value += 3; // reserved, three chars
        const xSampling = ParseInt32(dataView, offset);
        const ySampling = ParseInt32(dataView, offset);

        channels.push({
            name: name,
            pixelType: pixelType,
            pLinear: pLinear,
            xSampling: xSampling,
            ySampling: ySampling,
        });
    }

    offset.value += 1;

    return channels;
}

function ParseChromaticities(dataView: DataView, offset: DataCursor) {
    const redX = ParseFloat32(dataView, offset);
    const redY = ParseFloat32(dataView, offset);
    const greenX = ParseFloat32(dataView, offset);
    const greenY = ParseFloat32(dataView, offset);
    const blueX = ParseFloat32(dataView, offset);
    const blueY = ParseFloat32(dataView, offset);
    const whiteX = ParseFloat32(dataView, offset);
    const whiteY = ParseFloat32(dataView, offset);

    return { redX: redX, redY: redY, greenX: greenX, greenY: greenY, blueX: blueX, blueY: blueY, whiteX: whiteX, whiteY: whiteY };
}

function ParseCompression(dataView: DataView, offset: DataCursor) {
    return ParseUint8(dataView, offset);
}

function ParseBox2i(dataView: DataView, offset: DataCursor) {
    const xMin = ParseInt32(dataView, offset);
    const yMin = ParseInt32(dataView, offset);
    const xMax = ParseInt32(dataView, offset);
    const yMax = ParseInt32(dataView, offset);

    return { xMin: xMin, yMin: yMin, xMax: xMax, yMax: yMax };
}

function ParseLineOrder(dataView: DataView, offset: DataCursor) {
    const lineOrder = ParseUint8(dataView, offset);

    return LineOrders[lineOrder];
}

/**
 * Parse a value from the data view
 * @param dataView defines the data view to read from
 * @param offset defines the current offset in the data view
 * @param type defines the type of the value to read
 * @param size defines the size of the value to read
 * @returns the parsed value
 */
export function ParseValue(dataView: DataView, offset: DataCursor, type: string, size: number) {
    switch (type) {
        case "string":
        case "stringvector":
        case "iccProfile":
            return ParseFixedLengthString(dataView.buffer, offset, size);
        case "chlist":
            return ParseChlist(dataView, offset, size);
        case "chromaticities":
            return ParseChromaticities(dataView, offset);
        case "compression":
            return ParseCompression(dataView, offset);
        case "box2i":
            return ParseBox2i(dataView, offset);
        case "lineOrder":
            return ParseLineOrder(dataView, offset);
        case "float":
            return ParseFloat32(dataView, offset);
        case "v2f":
            return ParseV2f(dataView, offset);
        case "v3f":
            return ParseV3f(dataView, offset);
        case "int":
            return ParseInt32(dataView, offset);
        case "rational":
            return ParseRational(dataView, offset);
        case "timecode":
            return ParseTimecode(dataView, offset);
        case "preview":
            offset.value += size;
            return "skipped";
        default:
            offset.value += size;
            return undefined;
    }
}

/**
 * Revert the endianness of the data
 * @param source defines the source
 */
export function Predictor(source: Uint8Array) {
    for (let t = 1; t < source.length; t++) {
        const d = source[t - 1] + source[t] - 128;
        source[t] = d;
    }
}

/**
 * Interleave pixels
 * @param source defines the data source
 * @param out defines the output
 */
export function InterleaveScalar(source: Uint8Array, out: Uint8Array) {
    let t1 = 0;
    let t2 = Math.floor((source.length + 1) / 2);
    let s = 0;
    const stop = source.length - 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (s > stop) {
            break;
        }
        out[s++] = source[t1++];

        if (s > stop) {
            break;
        }
        out[s++] = source[t2++];
    }
}
