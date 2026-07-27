import { DecompressFromBufferToSizeLimit } from "./crateLz4";

/**
 * Result returned by crate variable-length integer readers.
 */
export interface ICrateVarIntResult<Value> {
    /** Decoded integer value. */
    value: Value;
    /** Offset immediately after the decoded integer. */
    nextOffset: number;
}

/**
 * Decodes an unsigned little-endian base-128 variable-length integer.
 * @param data The byte buffer containing the encoded integer.
 * @param offset The byte offset where decoding should begin.
 * @returns The decoded value and next unread byte offset.
 */
export function DecodeUnsignedVarInt(data: Uint8Array, offset = 0): ICrateVarIntResult<number> {
    const result = DecodeUnsignedVarInt64(data, offset);
    if (result.value > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error("USD crate: varint exceeds JavaScript safe integer range.");
    }
    return { value: Number(result.value), nextOffset: result.nextOffset };
}

/**
 * Decodes a signed zig-zag little-endian base-128 variable-length integer.
 * @param data The byte buffer containing the encoded integer.
 * @param offset The byte offset where decoding should begin.
 * @returns The decoded value and next unread byte offset.
 */
export function DecodeSignedVarInt(data: Uint8Array, offset = 0): ICrateVarIntResult<number> {
    const result = DecodeUnsignedVarInt(data, offset);
    const value = (result.value >>> 1) ^ -(result.value & 1);
    return { value, nextOffset: result.nextOffset };
}

/**
 * Decodes an unsigned 64-bit little-endian base-128 variable-length integer.
 * @param data The byte buffer containing the encoded integer.
 * @param offset The byte offset where decoding should begin.
 * @returns The decoded bigint value and next unread byte offset.
 */
export function DecodeUnsignedVarInt64(data: Uint8Array, offset = 0): ICrateVarIntResult<bigint> {
    let result = 0n;
    let shift = 0n;
    let currentOffset = offset;

    while (currentOffset < data.length) {
        const byte = data[currentOffset++];
        result |= BigInt(byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) {
            return { value: result, nextOffset: currentOffset };
        }
        shift += 7n;
        if (shift > 63n) {
            throw new Error("USD crate: varint exceeds 64 bits.");
        }
    }

    throw new Error("USD crate: truncated varint.");
}

/**
 * Decodes a signed 64-bit zig-zag little-endian base-128 variable-length integer.
 * @param data The byte buffer containing the encoded integer.
 * @param offset The byte offset where decoding should begin.
 * @returns The decoded bigint value and next unread byte offset.
 */
export function DecodeSignedVarInt64(data: Uint8Array, offset = 0): ICrateVarIntResult<bigint> {
    const result = DecodeUnsignedVarInt64(data, offset);
    const value = (result.value >> 1n) ^ -(result.value & 1n);
    return { value, nextOffset: result.nextOffset };
}

/**
 * Decodes a crate integer-compression block for 32-bit integer arrays.
 * @param encoded The integer-coded bytes after LZ4 decompression.
 * @param count The number of integers expected in the result.
 * @returns The decoded integer array.
 */
export function DecodeCrateIntegerBlock32(encoded: Uint8Array, count: number): number[] {
    if (count === 0) {
        return [];
    }

    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    const codeByteCount = GetCodeByteCount(count);
    EnsureAvailable(encoded, 4 + codeByteCount, "USD crate: truncated 32-bit integer block.");

    const commonValue = view.getInt32(0, true);
    const codesOffset = 4;
    let valuesOffset = codesOffset + codeByteCount;
    let previousValue = 0;
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
        const codeByte = encoded[codesOffset + (i >> 2)];
        const code = (codeByte >> ((i & 3) * 2)) & 3;
        let delta: number;
        switch (code) {
            case 0:
                delta = commonValue;
                break;
            case 1:
                EnsureAvailable(encoded, valuesOffset + 1, "USD crate: truncated 8-bit integer delta.");
                delta = view.getInt8(valuesOffset);
                valuesOffset += 1;
                break;
            case 2:
                EnsureAvailable(encoded, valuesOffset + 2, "USD crate: truncated 16-bit integer delta.");
                delta = view.getInt16(valuesOffset, true);
                valuesOffset += 2;
                break;
            default:
                EnsureAvailable(encoded, valuesOffset + 4, "USD crate: truncated 32-bit integer delta.");
                delta = view.getInt32(valuesOffset, true);
                valuesOffset += 4;
                break;
        }
        previousValue = ToInt32(previousValue + delta);
        values.push(previousValue);
    }

    return values;
}

/**
 * Decodes a raw LZ4-compressed crate integer-compression block for 32-bit integer arrays.
 * @param compressed The raw LZ4-compressed integer-coded bytes.
 * @param count The number of integers expected in the result.
 * @returns The decoded integer array.
 */
export function DecodeCrateCompressedIntegerBlock32(compressed: Uint8Array, count: number): number[] {
    const encoded = DecompressFromBufferToSizeLimit(compressed, GetEncodedBufferSize(count, 4));
    return DecodeCrateIntegerBlock32(encoded, count);
}

/**
 * Decodes a crate integer-compression block for 64-bit integer arrays.
 * @param encoded The integer-coded bytes after LZ4 decompression.
 * @param count The number of integers expected in the result.
 * @returns The decoded bigint array.
 */
export function DecodeCrateIntegerBlock64(encoded: Uint8Array, count: number): bigint[] {
    if (count === 0) {
        return [];
    }

    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    const codeByteCount = GetCodeByteCount(count);
    EnsureAvailable(encoded, 8 + codeByteCount, "USD crate: truncated 64-bit integer block.");

    const commonValue = view.getBigInt64(0, true);
    const codesOffset = 8;
    let valuesOffset = codesOffset + codeByteCount;
    let previousValue = 0n;
    const values: bigint[] = [];

    for (let i = 0; i < count; i++) {
        const codeByte = encoded[codesOffset + (i >> 2)];
        const code = (codeByte >> ((i & 3) * 2)) & 3;
        let delta: bigint;
        switch (code) {
            case 0:
                delta = commonValue;
                break;
            case 1:
                EnsureAvailable(encoded, valuesOffset + 2, "USD crate: truncated 16-bit integer delta.");
                delta = BigInt(view.getInt16(valuesOffset, true));
                valuesOffset += 2;
                break;
            case 2:
                EnsureAvailable(encoded, valuesOffset + 4, "USD crate: truncated 32-bit integer delta.");
                delta = BigInt(view.getInt32(valuesOffset, true));
                valuesOffset += 4;
                break;
            default:
                EnsureAvailable(encoded, valuesOffset + 8, "USD crate: truncated 64-bit integer delta.");
                delta = view.getBigInt64(valuesOffset, true);
                valuesOffset += 8;
                break;
        }
        previousValue += delta;
        values.push(previousValue);
    }

    return values;
}

/**
 * Decodes a raw LZ4-compressed crate integer-compression block for 64-bit integer arrays.
 * @param compressed The raw LZ4-compressed integer-coded bytes.
 * @param count The number of integers expected in the result.
 * @returns The decoded bigint array.
 */
export function DecodeCrateCompressedIntegerBlock64(compressed: Uint8Array, count: number): bigint[] {
    const encoded = DecompressFromBufferToSizeLimit(compressed, GetEncodedBufferSize(count, 8));
    return DecodeCrateIntegerBlock64(encoded, count);
}

// The crate stores four 2-bit kind codes per byte.
function GetCodeByteCount(count: number): number {
    return Math.ceil((count * 2) / 8);
}

// Mirrors the crate decoder's signed 32-bit accumulation behavior.
function ToInt32(value: number): number {
    return value | 0;
}

// The integer codec's working buffer is common value + code bytes + worst-case deltas.
function GetEncodedBufferSize(count: number, integerByteSize: 4 | 8): number {
    return count === 0 ? 0 : integerByteSize + GetCodeByteCount(count) + count * integerByteSize;
}

// Keeps every manual DataView read guarded by a clear crate-specific error.
function EnsureAvailable(data: Uint8Array, endOffset: number, message: string): void {
    if (endOffset > data.length) {
        throw new Error(message);
    }
}
