import { describe, expect, it } from "vitest";
import { DecodeLz4Block, DecompressFromBuffer, DecompressFromBufferToSizeLimit } from "loaders/USD/resolution/parser/crate/crateLz4";

const EncodeAscii = (value: string): number[] => Array.from(new TextEncoder().encode(value));
const DecodeAscii = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

describe("USDC crate LZ4 block decoder", () => {
    it("decodes a literal-only block", () => {
        const compressed = new Uint8Array([0x50, ...EncodeAscii("hello")]);

        expect(DecodeAscii(DecodeLz4Block(compressed, 5))).toBe("hello");
    });

    it("decodes an overlapping back-reference match", () => {
        const compressed = new Uint8Array([0x35, ...EncodeAscii("abc"), 0x03, 0x00, 0x30, ...EncodeAscii("XYZ")]);

        expect(DecodeAscii(DecodeLz4Block(compressed, 15))).toBe("abcabcabcabcXYZ");
    });

    it("rejects invalid match offsets", () => {
        const compressed = new Uint8Array([0x01, 0x00, 0x00]);

        expect(() => DecodeLz4Block(compressed, 4)).toThrow("invalid LZ4 match offset");
    });
});

describe("USDC TfFastCompression framing", () => {
    it("strips the single-chunk count byte before decoding", () => {
        // USD prepends a 0 chunk-count byte to a single raw LZ4 block. Feeding the whole buffer
        // (including that byte) straight into the LZ4 decoder is what desynchronized real .usdc reads.
        const buffer = new Uint8Array([0x00, 0x50, ...EncodeAscii("hello")]);

        expect(DecodeAscii(DecompressFromBuffer(buffer, 5))).toBe("hello");
    });

    it("decodes a multi-chunk buffer with per-chunk int32 sizes", () => {
        const firstChunk = [0x30, ...EncodeAscii("abc")];
        const secondChunk = [0x30, ...EncodeAscii("XYZ")];
        const buffer = new Uint8Array([0x02, firstChunk.length, 0, 0, 0, ...firstChunk, secondChunk.length, 0, 0, 0, ...secondChunk]);

        expect(DecodeAscii(DecompressFromBuffer(buffer, 6))).toBe("abcXYZ");
    });

    it("returns an empty result for an empty buffer", () => {
        expect(DecompressFromBufferToSizeLimit(new Uint8Array(0), 16).length).toBe(0);
    });

    it("throws when the decompressed size does not match the declared size", () => {
        const buffer = new Uint8Array([0x00, 0x50, ...EncodeAscii("hello")]);

        expect(() => DecompressFromBuffer(buffer, 8)).toThrow("invalid decompressed length");
    });

    it("rejects output sizes above the crate resource cap before allocating", () => {
        const buffer = new Uint8Array([0x00, 0x00]);

        expect(() => DecompressFromBuffer(buffer, 512 * 1024 * 1024 + 1)).toThrow("decompressed output exceeds");
    });

    it("rejects truncated and trailing multi-chunk framing", () => {
        expect(() => DecompressFromBuffer(new Uint8Array([0x01, 0x04, 0x00]), 1)).toThrow("truncated TfFastCompression chunk size");

        const chunk = [0x10, 0x61];
        const trailing = new Uint8Array([0x01, chunk.length, 0, 0, 0, ...chunk, 0xff]);
        expect(() => DecompressFromBuffer(trailing, 1)).toThrow("trailing TfFastCompression data");
    });
});
