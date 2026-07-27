// USD compresses every crate section and compressed-integer array with TfFastCompression, which
// wraps the raw LZ4 data in a tiny framing: a single leading byte holds the chunk count, where 0
// means "one chunk, raw LZ4 block follows" and N>=1 means N chunks each prefixed by an int32 little
// endian size. pxr splits input into chunks no larger than this so each decodes independently.
const Lz4MaxInputSize = 0x7e000000;
const MaxCrateDecompressedBytes = 512 * 1024 * 1024;

/**
 * Decodes a TfFastCompression buffer (the framing USD uses for crate sections and integer arrays)
 * to an exact output size. The buffer is one chunk-count byte followed by one or more raw LZ4 blocks.
 * @param data The TfFastCompression buffer, including the leading chunk-count byte.
 * @param uncompressedSize The exact number of bytes expected after decompression.
 * @returns The decoded bytes.
 */
export function DecompressFromBuffer(data: Uint8Array, uncompressedSize: number): Uint8Array {
    const output = DecompressFromBufferToSizeLimit(data, uncompressedSize);
    if (output.length !== uncompressedSize) {
        throw new Error(`USD crate: invalid decompressed length ${output.length}; expected ${uncompressedSize}.`);
    }
    return output;
}

/**
 * Decodes a TfFastCompression buffer with an upper bound on output size.
 * @param data The TfFastCompression buffer, including the leading chunk-count byte.
 * @param maxUncompressedSize The maximum number of decoded bytes to allow.
 * @returns The decoded bytes, trimmed to the actual decoded size.
 */
export function DecompressFromBufferToSizeLimit(data: Uint8Array, maxUncompressedSize: number): Uint8Array {
    ValidateOutputSize(maxUncompressedSize, "decompressed");
    if (data.length === 0) {
        return new Uint8Array(0);
    }

    const chunkCount = data[0];
    if (chunkCount === 0) {
        return DecodeLz4BlockToSizeLimit(data.subarray(1), maxUncompressedSize);
    }

    const output = new Uint8Array(maxUncompressedSize);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let inputOffset = 1;
    let outputOffset = 0;
    for (let chunk = 0; chunk < chunkCount; chunk++) {
        if (inputOffset + 4 > data.length) {
            throw new Error("USD crate: truncated TfFastCompression chunk size.");
        }
        const chunkSize = view.getInt32(inputOffset, true);
        inputOffset += 4;
        if (chunkSize < 0 || inputOffset + chunkSize > data.length) {
            throw new Error("USD crate: invalid TfFastCompression chunk size.");
        }

        const chunkLimit = Math.min(Lz4MaxInputSize, maxUncompressedSize - outputOffset);
        const decoded = DecodeLz4BlockToSizeLimit(data.subarray(inputOffset, inputOffset + chunkSize), chunkLimit);
        output.set(decoded, outputOffset);
        inputOffset += chunkSize;
        outputOffset += decoded.length;
    }

    if (inputOffset !== data.length) {
        throw new Error("USD crate: trailing TfFastCompression data.");
    }
    return output.subarray(0, outputOffset);
}

/**
 * Decodes a single raw LZ4 block to an exact output size.
 * @param data The raw LZ4 block bytes, without an LZ4 frame header.
 * @param uncompressedSize The exact number of bytes expected from the block.
 * @returns The decoded bytes.
 */
export function DecodeLz4Block(data: Uint8Array, uncompressedSize: number): Uint8Array {
    const output = DecodeLz4BlockToSizeLimit(data, uncompressedSize);
    if (output.length !== uncompressedSize) {
        throw new Error(`USD crate: invalid LZ4 block length ${output.length}; expected ${uncompressedSize}.`);
    }
    return output;
}

/**
 * Decodes a single raw LZ4 block with an upper bound on output size.
 * @param data The raw LZ4 block bytes, without an LZ4 frame header.
 * @param maxUncompressedSize The maximum number of decoded bytes to allow.
 * @returns The decoded bytes, trimmed to the actual decoded size.
 */
export function DecodeLz4BlockToSizeLimit(data: Uint8Array, maxUncompressedSize: number): Uint8Array {
    ValidateOutputSize(maxUncompressedSize, "LZ4");

    const output = new Uint8Array(maxUncompressedSize);
    let inputOffset = 0;
    let outputOffset = 0;

    while (inputOffset < data.length) {
        const token = data[inputOffset++];
        const literalLength = ReadLength(data, token >> 4, () => inputOffset++);
        if (inputOffset + literalLength > data.length) {
            throw new Error("USD crate: invalid LZ4 literal length.");
        }

        if (outputOffset + literalLength > output.length) {
            throw new Error("USD crate: LZ4 literal output exceeds expected size.");
        }

        output.set(data.subarray(inputOffset, inputOffset + literalLength), outputOffset);
        inputOffset += literalLength;
        outputOffset += literalLength;

        if (inputOffset === data.length) {
            break;
        }
        if (inputOffset + 2 > data.length) {
            throw new Error("USD crate: truncated LZ4 match offset.");
        }

        const matchOffset = data[inputOffset] | (data[inputOffset + 1] << 8);
        inputOffset += 2;
        if (matchOffset === 0 || matchOffset > outputOffset) {
            throw new Error("USD crate: invalid LZ4 match offset.");
        }

        const matchLength = ReadLength(data, token & 0x0f, () => inputOffset++) + 4;
        if (outputOffset + matchLength > output.length) {
            throw new Error("USD crate: LZ4 match output exceeds expected size.");
        }

        for (let i = 0; i < matchLength; i++) {
            output[outputOffset + i] = output[outputOffset - matchOffset + i];
        }
        outputOffset += matchLength;
    }

    return output.subarray(0, outputOffset);
}

function ValidateOutputSize(size: number, kind: string): void {
    if (size < 0 || !Number.isSafeInteger(size)) {
        throw new Error(`USD crate: invalid ${kind} output size.`);
    }
    if (size > MaxCrateDecompressedBytes) {
        throw new Error(`USD crate: ${kind} output exceeds the ${MaxCrateDecompressedBytes}-byte resource cap.`);
    }
}

// Reads an LZ4 nibble length and its optional 255-byte extension chain.
function ReadLength(data: Uint8Array, nibble: number, advance: () => number): number {
    let length = nibble;
    if (nibble !== 15) {
        return length;
    }

    let extension = 255;
    while (extension === 255) {
        const offset = advance();
        if (offset >= data.length) {
            throw new Error("USD crate: truncated LZ4 extended length.");
        }
        extension = data[offset];
        length += extension;
    }
    return length;
}
