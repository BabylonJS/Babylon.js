import { describe, expect, it } from "vitest";
import {
    DecodeCrateCompressedIntegerBlock32,
    DecodeCrateIntegerBlock32,
    DecodeCrateIntegerBlock64,
    DecodeSignedVarInt,
    DecodeUnsignedVarInt,
    DecodeUnsignedVarInt64,
} from "loaders/USD/resolution/parser/crate/crateIntegerDecoder";

function Int32Bytes(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    return Array.from(bytes);
}

function Int64Bytes(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigInt64(0, value, true);
    return Array.from(bytes);
}

describe("USDC crate integer decoders", () => {
    it("decodes unsigned and signed varints", () => {
        expect(DecodeUnsignedVarInt(new Uint8Array([0xac, 0x02]))).toEqual({ value: 300, nextOffset: 2 });
        expect(DecodeSignedVarInt(new Uint8Array([0x53]))).toEqual({ value: -42, nextOffset: 1 });
        expect(DecodeUnsignedVarInt64(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f])).value).toBe(0xffffffffn);
    });

    it("decodes 32-bit delta/common-value integer blocks", () => {
        const encoded = new Uint8Array([...Int32Bytes(1), 0xc1, 0x11, 123, ...Int32Bytes(100000), 0, 0]);

        expect(DecodeCrateIntegerBlock32(encoded, 7)).toEqual([123, 124, 125, 100125, 100125, 100126, 100126]);
    });

    it("decodes LZ4-wrapped 32-bit integer blocks", () => {
        const encoded = new Uint8Array([...Int32Bytes(1), 0xc1, 0x11, 123, ...Int32Bytes(100000), 0, 0]);
        // USD wraps the integer codec output with TfFastCompression: a 0 chunk-count byte then the raw LZ4 block.
        const compressed = new Uint8Array([0x00, 0xd0, ...encoded]);

        expect(DecodeCrateCompressedIntegerBlock32(compressed, 7)).toEqual([123, 124, 125, 100125, 100125, 100126, 100126]);
    });

    it("decodes 64-bit delta/common-value integer blocks", () => {
        const encoded = new Uint8Array([...Int64Bytes(5n), 0xe4, 0x27, 0x01, ...Int32Bytes(69700), ...Int64Bytes(6999930000n)]);

        expect(DecodeCrateIntegerBlock64(encoded, 4)).toEqual([5n, 300n, 70000n, 7000000000n]);
    });
});
