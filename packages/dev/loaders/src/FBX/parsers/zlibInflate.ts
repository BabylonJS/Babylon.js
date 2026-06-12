/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
const ADLER_MOD = 65521;
const MAX_BITS = 15;

const LENGTH_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LENGTH_EXTRA_BITS = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DISTANCE_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DISTANCE_EXTRA_BITS = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CODE_LENGTH_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

/**
 * Inflate a zlib-wrapped deflate stream.
 *
 * This implementation is intentionally scoped to FBX binary array payloads: one-shot,
 * synchronous zlib streams with the exact uncompressed length known up front.
 */
export function inflateZlib(input: Uint8Array, expectedLength: number): Uint8Array {
    if (!Number.isInteger(expectedLength) || expectedLength < 0) {
        throw new Error("zlib: invalid expected length");
    }
    if (input.byteLength < 6) {
        throw new Error("zlib: unexpected end of input");
    }

    const cmf = input[0];
    const flg = input[1];
    if ((cmf & 0x0f) !== 8 || cmf >> 4 > 7 || ((cmf << 8) + flg) % 31 !== 0) {
        throw new Error("zlib: invalid header");
    }
    if ((flg & 0x20) !== 0) {
        throw new Error("zlib: preset dictionary not supported");
    }

    const reader = new BitReader(input, 2, input.byteLength - 4);
    const output = new OutputWriter(expectedLength);

    let isFinalBlock = false;
    while (!isFinalBlock) {
        isFinalBlock = reader.readBits(1) === 1;
        const blockType = reader.readBits(2);
        switch (blockType) {
            case 0:
                inflateStoredBlock(reader, output);
                break;
            case 1:
                inflateCompressedBlock(reader, output, getFixedLiteralLengthTree(), getFixedDistanceTree());
                break;
            case 2: {
                const { literalLengthTree, distanceTree } = readDynamicTrees(reader);
                inflateCompressedBlock(reader, output, literalLengthTree, distanceTree);
                break;
            }
            default:
                throw new Error("deflate: invalid block type");
        }
    }

    if (reader.byteOffset < input.byteLength - 4) {
        throw new Error("zlib: trailing deflate data");
    }

    output.finish();
    const expectedAdler = ((input[input.byteLength - 4] << 24) | (input[input.byteLength - 3] << 16) | (input[input.byteLength - 2] << 8) | input[input.byteLength - 1]) >>> 0;
    if (output.adler32() !== expectedAdler) {
        throw new Error("zlib: adler32 mismatch");
    }

    return output.bytes;
}

class BitReader {
    private bitBuffer = 0;
    private bitCount = 0;

    public constructor(
        private readonly input: Uint8Array,
        public byteOffset: number,
        private readonly endOffset: number
    ) {}

    public readBits(count: number): number {
        this.ensureBits(count);
        const value = this.bitBuffer & ((1 << count) - 1);
        this.bitBuffer >>>= count;
        this.bitCount -= count;
        return value;
    }

    public readBit(): number {
        if (this.bitCount === 0) {
            if (this.byteOffset >= this.endOffset) {
                throw new Error("zlib: unexpected end of input");
            }
            this.bitBuffer = this.input[this.byteOffset++];
            this.bitCount = 8;
        }
        const bit = this.bitBuffer & 1;
        this.bitBuffer >>>= 1;
        this.bitCount--;
        return bit;
    }

    public alignToByte(): void {
        this.bitBuffer = 0;
        this.bitCount = 0;
    }

    public readUint16LE(): number {
        this.ensureByteAligned();
        if (this.byteOffset + 2 > this.endOffset) {
            throw new Error("zlib: unexpected end of input");
        }
        const value = this.input[this.byteOffset] | (this.input[this.byteOffset + 1] << 8);
        this.byteOffset += 2;
        return value;
    }

    public readByte(): number {
        this.ensureByteAligned();
        if (this.byteOffset >= this.endOffset) {
            throw new Error("zlib: unexpected end of input");
        }
        return this.input[this.byteOffset++];
    }

    private ensureByteAligned(): void {
        if (this.bitCount !== 0) {
            throw new Error("deflate: expected byte alignment");
        }
    }

    private ensureBits(count: number): void {
        while (this.bitCount < count) {
            if (this.byteOffset >= this.endOffset) {
                throw new Error("zlib: unexpected end of input");
            }
            this.bitBuffer |= this.input[this.byteOffset++] << this.bitCount;
            this.bitCount += 8;
        }
    }
}

class OutputWriter {
    private offset = 0;
    private adlerA = 1;
    private adlerB = 0;

    public readonly bytes: Uint8Array;

    public constructor(expectedLength: number) {
        this.bytes = new Uint8Array(expectedLength);
    }

    public writeByte(value: number): void {
        if (this.offset >= this.bytes.byteLength) {
            throw new Error("zlib: output length mismatch");
        }
        const byte = value & 0xff;
        this.bytes[this.offset++] = byte;
        this.adlerA += byte;
        this.adlerB += this.adlerA;
        this.adlerA %= ADLER_MOD;
        this.adlerB %= ADLER_MOD;
    }

    public copy(distance: number, length: number): void {
        if (distance <= 0 || distance > this.offset) {
            throw new Error("deflate: distance out of range");
        }
        for (let i = 0; i < length; i++) {
            this.writeByte(this.bytes[this.offset - distance]);
        }
    }

    public finish(): void {
        if (this.offset !== this.bytes.byteLength) {
            throw new Error("zlib: output length mismatch");
        }
    }

    public adler32(): number {
        return ((this.adlerB << 16) | this.adlerA) >>> 0;
    }
}

class HuffmanTree {
    private readonly symbolsByLength: Array<Int16Array | undefined>;
    private readonly maxCodeLength: number;

    public constructor(codeLengths: readonly number[], options: { allowEmpty?: boolean } = {}) {
        const counts = new Array<number>(MAX_BITS + 1).fill(0);
        let nonZeroCount = 0;
        let maxCodeLength = 0;

        for (const length of codeLengths) {
            if (!Number.isInteger(length) || length < 0 || length > MAX_BITS) {
                throw new Error("deflate: invalid huffman code lengths");
            }
            if (length > 0) {
                counts[length]++;
                nonZeroCount++;
                maxCodeLength = Math.max(maxCodeLength, length);
            }
        }

        if (nonZeroCount === 0) {
            if (options.allowEmpty) {
                this.symbolsByLength = [];
                this.maxCodeLength = 0;
                return;
            }
            throw new Error("deflate: invalid huffman code lengths");
        }

        let remaining = 1;
        for (let bits = 1; bits <= MAX_BITS; bits++) {
            remaining = (remaining << 1) - counts[bits];
            if (remaining < 0) {
                throw new Error("deflate: invalid huffman code lengths");
            }
        }
        if (remaining !== 0 && nonZeroCount !== 1) {
            throw new Error("deflate: invalid huffman code lengths");
        }

        const nextCode = new Array<number>(MAX_BITS + 1).fill(0);
        let code = 0;
        for (let bits = 1; bits <= MAX_BITS; bits++) {
            code = (code + counts[bits - 1]) << 1;
            nextCode[bits] = code;
        }

        this.symbolsByLength = Array.from({ length: MAX_BITS + 1 }, (_, length) => {
            if (counts[length] === 0) {
                return undefined;
            }
            const symbols = new Int16Array(1 << length);
            symbols.fill(-1);
            return symbols;
        });
        for (let symbol = 0; symbol < codeLengths.length; symbol++) {
            const length = codeLengths[symbol];
            if (length === 0) {
                continue;
            }
            this.symbolsByLength[length]![nextCode[length]++] = symbol;
        }
        this.maxCodeLength = maxCodeLength;
    }

    public decode(reader: BitReader): number {
        if (this.maxCodeLength === 0) {
            throw new Error("deflate: invalid huffman code");
        }

        let code = 0;
        for (let length = 1; length <= this.maxCodeLength; length++) {
            code = (code << 1) | reader.readBit();
            const symbol = this.symbolsByLength[length]?.[code] ?? -1;
            if (symbol >= 0) {
                return symbol;
            }
        }
        throw new Error("deflate: invalid huffman code");
    }
}

let fixedLiteralLengthTree: HuffmanTree | undefined;
let fixedDistanceTree: HuffmanTree | undefined;

function getFixedLiteralLengthTree(): HuffmanTree {
    if (!fixedLiteralLengthTree) {
        const lengths = new Array<number>(288);
        for (let symbol = 0; symbol <= 143; symbol++) {
            lengths[symbol] = 8;
        }
        for (let symbol = 144; symbol <= 255; symbol++) {
            lengths[symbol] = 9;
        }
        for (let symbol = 256; symbol <= 279; symbol++) {
            lengths[symbol] = 7;
        }
        for (let symbol = 280; symbol <= 287; symbol++) {
            lengths[symbol] = 8;
        }
        fixedLiteralLengthTree = new HuffmanTree(lengths);
    }
    return fixedLiteralLengthTree;
}

function getFixedDistanceTree(): HuffmanTree {
    if (!fixedDistanceTree) {
        fixedDistanceTree = new HuffmanTree(new Array<number>(32).fill(5));
    }
    return fixedDistanceTree;
}

function inflateStoredBlock(reader: BitReader, output: OutputWriter): void {
    reader.alignToByte();
    const length = reader.readUint16LE();
    const inverseLength = reader.readUint16LE();
    if (((length ^ inverseLength) & 0xffff) !== 0xffff) {
        throw new Error("deflate: invalid stored block length");
    }

    for (let i = 0; i < length; i++) {
        output.writeByte(reader.readByte());
    }
}

function inflateCompressedBlock(reader: BitReader, output: OutputWriter, literalLengthTree: HuffmanTree, distanceTree: HuffmanTree): void {
    while (true) {
        const symbol = literalLengthTree.decode(reader);
        if (symbol < 256) {
            output.writeByte(symbol);
            continue;
        }
        if (symbol === 256) {
            return;
        }
        if (symbol > 285) {
            throw new Error("deflate: invalid literal/length symbol");
        }

        const lengthIndex = symbol - 257;
        const length = LENGTH_BASE[lengthIndex] + reader.readBits(LENGTH_EXTRA_BITS[lengthIndex]);
        const distanceSymbol = distanceTree.decode(reader);
        if (distanceSymbol > 29) {
            throw new Error("deflate: invalid distance symbol");
        }
        const distance = DISTANCE_BASE[distanceSymbol] + reader.readBits(DISTANCE_EXTRA_BITS[distanceSymbol]);
        output.copy(distance, length);
    }
}

function readDynamicTrees(reader: BitReader): {
    literalLengthTree: HuffmanTree;
    distanceTree: HuffmanTree;
} {
    const literalLengthCount = reader.readBits(5) + 257;
    const distanceCount = reader.readBits(5) + 1;
    const codeLengthCount = reader.readBits(4) + 4;

    const codeLengthLengths = new Array<number>(19).fill(0);
    for (let i = 0; i < codeLengthCount; i++) {
        codeLengthLengths[CODE_LENGTH_ORDER[i]] = reader.readBits(3);
    }

    const codeLengthTree = new HuffmanTree(codeLengthLengths);
    const lengths = readCodeLengths(reader, codeLengthTree, literalLengthCount + distanceCount);
    const literalLengthLengths = lengths.slice(0, literalLengthCount);
    const distanceLengths = lengths.slice(literalLengthCount);

    if (literalLengthLengths[256] === 0) {
        throw new Error("deflate: missing end-of-block code");
    }

    return {
        literalLengthTree: new HuffmanTree(literalLengthLengths),
        distanceTree: new HuffmanTree(distanceLengths, { allowEmpty: true }),
    };
}

function readCodeLengths(reader: BitReader, codeLengthTree: HuffmanTree, count: number): number[] {
    const lengths: number[] = [];
    while (lengths.length < count) {
        const symbol = codeLengthTree.decode(reader);
        if (symbol <= 15) {
            lengths.push(symbol);
            continue;
        }

        let repeatLength: number;
        let repeatedValue: number;
        switch (symbol) {
            case 16:
                if (lengths.length === 0) {
                    throw new Error("deflate: invalid code length repeat");
                }
                repeatedValue = lengths[lengths.length - 1];
                repeatLength = reader.readBits(2) + 3;
                break;
            case 17:
                repeatedValue = 0;
                repeatLength = reader.readBits(3) + 3;
                break;
            case 18:
                repeatedValue = 0;
                repeatLength = reader.readBits(7) + 11;
                break;
            default:
                throw new Error("deflate: invalid code length symbol");
        }

        if (lengths.length + repeatLength > count) {
            throw new Error("deflate: invalid code length repeat");
        }
        for (let i = 0; i < repeatLength; i++) {
            lengths.push(repeatedValue);
        }
    }
    return lengths;
}
