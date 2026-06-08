/**
 * Lookup tables used for fast conversions between 32-bit floats and 16-bit (half) floats.
 * @see Fast Half Float Conversions, http://www.fox-toolkit.org/ftp/fasthalffloatconversion.pdf
 */
interface IHalfFloatConversionTables {
    floatView: Float32Array;
    uint32View: Uint32Array;
    baseTable: Uint32Array;
    shiftTable: Uint32Array;
    mantissaTable: Uint32Array;
    exponentTable: Uint32Array;
    offsetTable: Uint32Array;
}

let Tables: IHalfFloatConversionTables | null = null;

/**
 * Returns the conversion tables, building them lazily on first use.
 * Generation is deferred so that importing this module allocates nothing: tree-shaken code paths
 * that never convert a half float pay no cost, keeping the module side-effect free at import time.
 * @returns the shared conversion tables
 */
// Fast Half Float Conversions, http://www.fox-toolkit.org/ftp/fasthalffloatconversion.pdf
function GenerateTables(): IHalfFloatConversionTables {
    if (Tables) {
        return Tables;
    }

    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const uint32View = new Uint32Array(buffer);

    // float32 to float16 helpers
    const baseTable = new Uint32Array(512);
    const shiftTable = new Uint32Array(512);

    for (let i = 0; i < 256; ++i) {
        const e = i - 127;

        // very small number (0, -0)
        if (e < -24) {
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

    Tables = {
        floatView,
        uint32View,
        baseTable,
        shiftTable,
        mantissaTable,
        exponentTable,
        offsetTable,
    };

    return Tables;
}

/**
 * The largest finite magnitude representable by a 16-bit half-float (binary16): 65504.
 * Use this to clamp values into the half-float range before conversion instead of hardcoding the literal.
 */
export const MaxHalfFloat = 65504;

/**
 * Converts a 32-bit float to its 16-bit half-float bit pattern.
 * @param value the float to convert
 * @returns the half-float bit pattern, in the range 0..65535
 */
export function ToHalfFloat(value: number): number {
    // For now this truncates toward zero (drops the extra mantissa bits instead of rounding).
    // TODO: replace with the native Float16Array / Math.f16round once Node 24 is the minimum version;
    //       those round to nearest-even, so some results will change.
    const tables = GenerateTables();

    tables.floatView[0] = value;
    const f = tables.uint32View[0];
    const e = (f >> 23) & 0x1ff;
    return tables.baseTable[e] + ((f & 0x007fffff) >> tables.shiftTable[e]);
}

/**
 * Converts a 16-bit half-float bit pattern back to a 32-bit float.
 * @param value the half-float bit pattern, in the range 0..65535
 * @returns the decoded float
 */
export function FromHalfFloat(value: number): number {
    const tables = GenerateTables();

    tables.uint32View[0] = tables.mantissaTable[tables.offsetTable[value >> 10] + (value & 0x03ff)] + tables.exponentTable[value >> 10];
    return tables.floatView[0];
}
