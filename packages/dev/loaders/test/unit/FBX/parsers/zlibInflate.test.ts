import { deflateSync } from "zlib";
import { describe, expect, it } from "vitest";
import { inflateZlib } from "loaders/FBX/parsers/zlibInflate";

describe("inflateZlib", () => {
    it("inflates an empty stored payload", () => {
        const output = inflateZlib(hex("78 9c 03 00 00 00 00 01"), 0);

        expect(output).toEqual(new Uint8Array());
    });

    it("inflates a fixed-Huffman ASCII payload", () => {
        const output = inflateZlib(hex("78 9c f3 48 cd c9 c9 d7 51 08 cf 2f ca 49 51 04 00 1f 9e 04 6a"), 13);

        expect(output).toEqual(ascii("Hello, World!"));
    });

    it("inflates a stored block", () => {
        const output = inflateZlib(hex("78 01 01 05 00 fa ff 41 42 43 44 45 03 e8 01 50"), 5);

        expect(output).toEqual(ascii("ABCDE"));
    });

    it("inflates multiple stored blocks in one stream", () => {
        const expected = ascii("abcdef");
        const compressed = zlibStoredBlocks([ascii("abc"), ascii("def")]);

        expect(inflateZlib(compressed, expected.byteLength)).toEqual(expected);
    });

    it("inflates overlapping back-references", () => {
        const expected = ascii("abcabcabcabcabcabcabcabc");
        const compressed = deflateSync(expected);

        expect(inflateZlib(compressed, expected.byteLength)).toEqual(expected);
    });

    it("inflates long overlapping run-length back-references", () => {
        const expected = new Uint8Array(2048);
        expected.fill("A".charCodeAt(0));
        const compressed = deflateSync(expected, { level: 9 });

        expect(inflateZlib(compressed, expected.byteLength)).toEqual(expected);
    });

    it("inflates dynamic-Huffman payloads", () => {
        const expected = pseudoRandomPrintableBytes(4096);
        const compressed = deflateSync(expected, { level: 6 });
        expect(firstDeflateBlockType(compressed)).toBe(2);

        expect(inflateZlib(compressed, expected.byteLength)).toEqual(expected);
    });

    it("matches Node deflate output for deterministic random payloads", () => {
        const sizes = [0, 1, 2, 3, 7, 31, 32, 127, 128, 1024, 4096];
        const levels = [0, 1, 6, 9];
        let seed = 0xdecafbad;

        for (const size of sizes) {
            for (const level of levels) {
                const expected = pseudoRandomBytes(size, seed);
                seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
                const compressed = deflateSync(expected, { level });

                expect(inflateZlib(compressed, expected.byteLength)).toEqual(expected);
            }
        }
    });

    it("rejects truncated input", () => {
        const compressed = hex("78 9c f3 48 cd c9 c9 d7 51 08 cf 2f ca 49 51 04 00 1f 9e 04 6a");

        expect(() => inflateZlib(compressed.subarray(0, compressed.byteLength - 1), 13)).toThrow(/unexpected end|adler32 mismatch|trailing deflate data/);
    });

    it("rejects corrupted Adler-32 trailers", () => {
        const compressed = hex("78 9c f3 48 cd c9 c9 d7 51 08 cf 2f ca 49 51 04 00 1f 9e 04 6a");
        compressed[compressed.byteLength - 1] ^= 0xff;

        expect(() => inflateZlib(compressed, 13)).toThrow("zlib: adler32 mismatch");
    });

    it("rejects invalid zlib headers", () => {
        expect(() => inflateZlib(hex("00 00 03 00 00 00 00 01"), 0)).toThrow("zlib: invalid header");
    });

    it("rejects streams that require a preset dictionary", () => {
        const stream = hex(`${fdictHeaderHex()} 03 00 00 00 00 01`);

        expect(() => inflateZlib(stream, 0)).toThrow("zlib: preset dictionary not supported");
    });

    it("rejects invalid stored-block lengths", () => {
        const invalidStoredBlock = hex("78 01 01 05 00 00 00 41 42 43 44 45 00 00 00 00");

        expect(() => inflateZlib(invalidStoredBlock, 5)).toThrow("deflate: invalid stored block length");
    });

    it("rejects output-length mismatches", () => {
        const compressed = hex("78 01 01 05 00 fa ff 41 42 43 44 45 03 e8 01 50");

        expect(() => inflateZlib(compressed, 4)).toThrow("zlib: output length mismatch");
        expect(() => inflateZlib(compressed, 6)).toThrow("zlib: output length mismatch");
    });
});

function hex(value: string): Uint8Array {
    const bytes = value
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0)
        .map((part) => Number.parseInt(part, 16));
    return new Uint8Array(bytes);
}

function ascii(value: string): Uint8Array {
    return new TextEncoder().encode(value);
}

function pseudoRandomPrintableBytes(length: number): Uint8Array {
    let state = 0x12345678;
    const output = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        output[i] = 32 + (state % 95);
    }
    return output;
}

function pseudoRandomBytes(length: number, seed: number): Uint8Array {
    let state = seed;
    const output = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        state = (Math.imul(state, 1664525) + 12345) >>> 0;
        output[i] = state & 0xff;
    }
    return output;
}

function zlibStoredBlocks(blocks: Uint8Array[]): Uint8Array {
    const payloadLength = blocks.reduce((sum, block) => sum + block.byteLength, 0);
    const output = new Uint8Array(2 + blocks.reduce((sum, block) => sum + 5 + block.byteLength, 0) + 4);
    output[0] = 0x78;
    output[1] = 0x01;
    let offset = 2;
    const payload = new Uint8Array(payloadLength);
    let payloadOffset = 0;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        output[offset++] = i === blocks.length - 1 ? 0x01 : 0x00;
        output[offset++] = block.byteLength & 0xff;
        output[offset++] = block.byteLength >> 8;
        output[offset++] = ~block.byteLength & 0xff;
        output[offset++] = (~block.byteLength >> 8) & 0xff;
        output.set(block, offset);
        offset += block.byteLength;
        payload.set(block, payloadOffset);
        payloadOffset += block.byteLength;
    }

    const adler = adler32(payload);
    output[offset++] = (adler >>> 24) & 0xff;
    output[offset++] = (adler >>> 16) & 0xff;
    output[offset++] = (adler >>> 8) & 0xff;
    output[offset] = adler & 0xff;
    return output;
}

function adler32(bytes: Uint8Array): number {
    let a = 1;
    let b = 0;
    for (const byte of bytes) {
        a = (a + byte) % 65521;
        b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
}

function firstDeflateBlockType(zlibStream: Uint8Array): number {
    return (zlibStream[2] >> 1) & 0x03;
}

function fdictHeaderHex(): string {
    const cmf = 0x78;
    for (let flg = 0x20; flg < 0x100; flg++) {
        if ((flg & 0x20) !== 0 && ((cmf << 8) + flg) % 31 === 0) {
            return `${cmf.toString(16).padStart(2, "0")} ${flg.toString(16).padStart(2, "0")}`;
        }
    }
    throw new Error("test setup failed to build FDICT header");
}
