/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { DataCursor } from "./exrLoader.core";
import { ParseUint32, ParseUint8Array } from "./exrLoader.core";
import { HUF_DECBITS, HUF_DECMASK, HUF_DECSIZE, HUF_ENCSIZE, LONG_ZEROCODE_RUN, SHORT_ZEROCODE_RUN, SHORTEST_LONG_RUN, USHORT_RANGE } from "./exrLoader.interfaces";

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

const NBITS = 16;
const A_OFFSET = 1 << (NBITS - 1);
const MOD_MASK = (1 << NBITS) - 1;

interface IGetBits {
    l: number;
    c: number;
    lc: number;
}

interface IGetChar {
    c: number;
    lc: number;
}

/** @internal */
export function ReverseLutFromBitmap(bitmap: Uint8Array, lut: Uint16Array) {
    let k = 0;

    for (let i = 0; i < USHORT_RANGE; ++i) {
        if (i == 0 || bitmap[i >> 3] & (1 << (i & 7))) {
            lut[k++] = i;
        }
    }

    const n = k - 1;

    while (k < USHORT_RANGE) lut[k++] = 0;

    return n;
}

function HufClearDecTable(hdec: Array<any>) {
    for (let i = 0; i < HUF_DECSIZE; i++) {
        hdec[i] = {};
        hdec[i].len = 0;
        hdec[i].lit = 0;
        hdec[i].p = null;
    }
}

function GetBits(nBits: number, c: number, lc: number, array: Uint8Array, offset: DataCursor): IGetBits {
    while (lc < nBits) {
        c = (c << 8) | ParseUint8Array(array, offset);
        lc += 8;
    }

    lc -= nBits;

    return {
        l: (c >> lc) & ((1 << nBits) - 1),
        c,
        lc,
    };
}

function GetChar(c: number, lc: number, array: Uint8Array, offset: DataCursor): IGetChar {
    c = (c << 8) | ParseUint8Array(array, offset);
    lc += 8;

    return {
        c,
        lc,
    };
}

function GetCode(
    po: number,
    rlc: number,
    c: number,
    lc: number,
    array: Uint8Array,
    offset: DataCursor,
    outBuffer: Uint16Array,
    outBufferOffset: DataCursor,
    outBufferEndOffset: number
): Nullable<IGetChar> {
    if (po == rlc) {
        if (lc < 8) {
            const gc = GetChar(c, lc, array, offset);
            c = gc.c;
            lc = gc.lc;
        }

        lc -= 8;

        let cs = c >> lc;
        cs = new Uint8Array([cs])[0];

        if (outBufferOffset.value + cs > outBufferEndOffset) {
            return null;
        }

        const s = outBuffer[outBufferOffset.value - 1];

        while (cs-- > 0) {
            outBuffer[outBufferOffset.value++] = s;
        }
    } else if (outBufferOffset.value < outBufferEndOffset) {
        outBuffer[outBufferOffset.value++] = po;
    } else {
        return null;
    }

    return { c, lc };
}

const HufTableBuffer = new Array(59);

function HufCanonicalCodeTable(hcode: Array<any>) {
    for (let i = 0; i <= 58; ++i) HufTableBuffer[i] = 0;
    for (let i = 0; i < HUF_ENCSIZE; ++i) HufTableBuffer[hcode[i]] += 1;

    let c = 0;

    for (let i = 58; i > 0; --i) {
        const nc = (c + HufTableBuffer[i]) >> 1;
        HufTableBuffer[i] = c;
        c = nc;
    }

    for (let i = 0; i < HUF_ENCSIZE; ++i) {
        const l = hcode[i];
        if (l > 0) hcode[i] = l | (HufTableBuffer[l]++ << 6);
    }
}

function HufUnpackEncTable(array: Uint8Array, offset: DataCursor, ni: number, im: number, iM: number, hcode: Array<any>) {
    const p = offset;
    let c = 0;
    let lc = 0;

    for (; im <= iM; im++) {
        if (p.value - offset.value > ni) {
            return;
        }

        let gb = GetBits(6, c, lc, array, p);

        const l = gb.l;
        c = gb.c;
        lc = gb.lc;

        hcode[im] = l;

        if (l == LONG_ZEROCODE_RUN) {
            if (p.value - offset.value > ni) {
                throw new Error("Error in HufUnpackEncTable");
            }

            gb = GetBits(8, c, lc, array, p);

            let zerun = gb.l + SHORTEST_LONG_RUN;
            c = gb.c;
            lc = gb.lc;

            if (im + zerun > iM + 1) {
                throw new Error("Error in HufUnpackEncTable");
            }

            while (zerun--) hcode[im++] = 0;

            im--;
        } else if (l >= SHORT_ZEROCODE_RUN) {
            let zerun = l - SHORT_ZEROCODE_RUN + 2;

            if (im + zerun > iM + 1) {
                throw new Error("Error in HufUnpackEncTable");
            }

            while (zerun--) hcode[im++] = 0;

            im--;
        }
    }

    HufCanonicalCodeTable(hcode);
}

function HufLength(code: number) {
    return code & 63;
}

function HufCode(code: number) {
    return code >> 6;
}

function HufBuildDecTable(hcode: Array<any>, im: number, iM: number, hdecod: Array<any>) {
    for (; im <= iM; im++) {
        const c = HufCode(hcode[im]);
        const l = HufLength(hcode[im]);

        if (c >> l) {
            throw new Error("Invalid table entry");
        }

        if (l > HUF_DECBITS) {
            const pl = hdecod[c >> (l - HUF_DECBITS)];

            if (pl.len) {
                throw new Error("Invalid table entry");
            }

            pl.lit++;

            if (pl.p) {
                const p = pl.p;
                pl.p = new Array(pl.lit);

                for (let i = 0; i < pl.lit - 1; ++i) {
                    pl.p[i] = p[i];
                }
            } else {
                pl.p = new Array(1);
            }

            pl.p[pl.lit - 1] = im;
        } else if (l) {
            let plOffset = 0;

            for (let i = 1 << (HUF_DECBITS - l); i > 0; i--) {
                const pl = hdecod[(c << (HUF_DECBITS - l)) + plOffset];

                if (pl.len || pl.p) {
                    throw new Error("Invalid table entry");
                }

                pl.len = l;
                pl.lit = im;

                plOffset++;
            }
        }
    }

    return true;
}

function HufDecode(
    encodingTable: Array<any>,
    decodingTable: Array<any>,
    array: Uint8Array,
    offset: DataCursor,
    ni: number,
    rlc: number,
    no: number,
    outBuffer: Uint16Array,
    outOffset: DataCursor
) {
    let c = 0;
    let lc = 0;
    const outBufferEndOffset = no;
    const inOffsetEnd = Math.trunc(offset.value + (ni + 7) / 8);

    while (offset.value < inOffsetEnd) {
        let gc = GetChar(c, lc, array, offset);

        c = gc.c;
        lc = gc.lc;

        while (lc >= HUF_DECBITS) {
            const index = (c >> (lc - HUF_DECBITS)) & HUF_DECMASK;
            const pl = decodingTable[index];

            if (pl.len) {
                lc -= pl.len;

                const gCode = GetCode(pl.lit, rlc, c, lc, array, offset, outBuffer, outOffset, outBufferEndOffset);
                if (gCode) {
                    c = gCode.c;
                    lc = gCode.lc;
                }
            } else {
                if (!pl.p) {
                    throw new Error("hufDecode issues");
                }

                let j;

                for (j = 0; j < pl.lit; j++) {
                    const l = HufLength(encodingTable[pl.p[j]]);

                    while (lc < l && offset.value < inOffsetEnd) {
                        gc = GetChar(c, lc, array, offset);

                        c = gc.c;
                        lc = gc.lc;
                    }

                    if (lc >= l) {
                        if (HufCode(encodingTable[pl.p[j]]) == ((c >> (lc - l)) & ((1 << l) - 1))) {
                            lc -= l;

                            const gCode = GetCode(pl.p[j], rlc, c, lc, array, offset, outBuffer, outOffset, outBufferEndOffset);

                            if (gCode) {
                                c = gCode.c;
                                lc = gCode.lc;
                            }

                            break;
                        }
                    }
                }

                if (j == pl.lit) {
                    throw new Error("HufDecode issues");
                }
            }
        }
    }

    const i = (8 - ni) & 7;

    c >>= i;
    lc -= i;

    while (lc > 0) {
        const pl = decodingTable[(c << (HUF_DECBITS - lc)) & HUF_DECMASK];

        if (pl.len) {
            lc -= pl.len;

            const gCode = GetCode(pl.lit, rlc, c, lc, array, offset, outBuffer, outOffset, outBufferEndOffset);
            if (gCode) {
                c = gCode.c;
                lc = gCode.lc;
            }
        } else {
            throw new Error("HufDecode issues");
        }
    }

    return true;
}

/** @internal */
export function HufUncompress(array: Uint8Array, dataView: DataView, offset: DataCursor, nCompressed: number, outBuffer: Uint16Array, nRaw: number) {
    const outOffset: DataCursor = { value: 0 };
    const initialInOffset = offset.value;

    const im = ParseUint32(dataView, offset);
    const iM = ParseUint32(dataView, offset);

    offset.value += 4;

    const nBits = ParseUint32(dataView, offset);

    offset.value += 4;

    if (im < 0 || im >= HUF_ENCSIZE || iM < 0 || iM >= HUF_ENCSIZE) {
        throw new Error("Wrong HUF_ENCSIZE");
    }

    const freq = new Array(HUF_ENCSIZE);
    const hdec = new Array(HUF_DECSIZE);

    HufClearDecTable(hdec);

    const ni = nCompressed - (offset.value - initialInOffset);

    HufUnpackEncTable(array, offset, ni, im, iM, freq);

    if (nBits > 8 * (nCompressed - (offset.value - initialInOffset))) {
        throw new Error("Wrong hufUncompress");
    }

    HufBuildDecTable(freq, im, iM, hdec);

    HufDecode(freq, hdec, array, offset, nBits, iM, nRaw, outBuffer, outOffset);
}

function UInt16(value: number) {
    return value & 0xffff;
}

function Int16(value: number) {
    const ref = UInt16(value);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function Wdec14(l: number, h: number) {
    const ls = Int16(l);
    const hs = Int16(h);

    const hi = hs;
    const ai = ls + (hi & 1) + (hi >> 1);

    const as = ai;
    const bs = ai - hi;

    return { a: as, b: bs };
}

function Wdec16(l: number, h: number) {
    const m = UInt16(l);
    const d = UInt16(h);

    const bb = (m - (d >> 1)) & MOD_MASK;
    const aa = (d + bb - A_OFFSET) & MOD_MASK;

    return { a: aa, b: bb };
}

/** @internal */
export function Wav2Decode(buffer: Uint16Array, j: number, nx: number, ox: number, ny: number, oy: number, mx: number) {
    const w14 = mx < 1 << 14;
    const n = nx > ny ? ny : nx;
    let p = 1;
    let p2;
    let py;

    while (p <= n) p <<= 1;

    p >>= 1;
    p2 = p;
    p >>= 1;

    while (p >= 1) {
        py = 0;
        const ey = py + oy * (ny - p2);
        const oy1 = oy * p;
        const oy2 = oy * p2;
        const ox1 = ox * p;
        const ox2 = ox * p2;
        let i00, i01, i10, i11;

        for (; py <= ey; py += oy2) {
            let px = py;
            const ex = py + ox * (nx - p2);

            for (; px <= ex; px += ox2) {
                const p01 = px + ox1;
                const p10 = px + oy1;
                const p11 = p10 + ox1;

                if (w14) {
                    let result = Wdec14(buffer[px + j], buffer[p10 + j]);

                    i00 = result.a;
                    i10 = result.b;

                    result = Wdec14(buffer[p01 + j], buffer[p11 + j]);

                    i01 = result.a;
                    i11 = result.b;

                    result = Wdec14(i00, i01);

                    buffer[px + j] = result.a;
                    buffer[p01 + j] = result.b;

                    result = Wdec14(i10, i11);

                    buffer[p10 + j] = result.a;
                    buffer[p11 + j] = result.b;
                } else {
                    let result = Wdec16(buffer[px + j], buffer[p10 + j]);

                    i00 = result.a;
                    i10 = result.b;

                    result = Wdec16(buffer[p01 + j], buffer[p11 + j]);

                    i01 = result.a;
                    i11 = result.b;

                    result = Wdec16(i00, i01);

                    buffer[px + j] = result.a;
                    buffer[p01 + j] = result.b;

                    result = Wdec16(i10, i11);

                    buffer[p10 + j] = result.a;
                    buffer[p11 + j] = result.b;
                }
            }

            if (nx & p) {
                const p10 = px + oy1;
                let result;
                if (w14) {
                    result = Wdec14(buffer[px + j], buffer[p10 + j]);
                } else {
                    result = Wdec16(buffer[px + j], buffer[p10 + j]);
                }

                i00 = result.a;
                buffer[p10 + j] = result.b;

                buffer[px + j] = i00;
            }
        }

        if (ny & p) {
            let px = py;
            const ex = py + ox * (nx - p2);

            for (; px <= ex; px += ox2) {
                const p01 = px + ox1;
                let result;

                if (w14) {
                    result = Wdec14(buffer[px + j], buffer[p01 + j]);
                } else {
                    result = Wdec16(buffer[px + j], buffer[p01 + j]);
                }

                i00 = result.a;
                buffer[p01 + j] = result.b;

                buffer[px + j] = i00;
            }
        }

        p2 = p;
        p >>= 1;
    }

    return py;
}

/** @internal */
export function ApplyLut(lut: Uint16Array, data: Uint16Array, nData: number) {
    for (let i = 0; i < nData; ++i) {
        data[i] = lut[data[i]];
    }
}
