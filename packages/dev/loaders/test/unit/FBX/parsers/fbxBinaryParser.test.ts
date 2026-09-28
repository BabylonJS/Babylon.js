import { describe, expect, it } from "vitest";
import { parseBinaryFBX } from "loaders/FBX/parsers/fbxBinaryParser";

const HEADER_SIZE = 27;
const NODE_HEADER_SIZE = 13;
const MAGIC = "Kaydara FBX Binary  \0";

describe("parseBinaryFBX", () => {
    it("parses a minimal binary node", () => {
        const nodeOffset = HEADER_SIZE;
        const nodeEnd = nodeOffset + NODE_HEADER_SIZE + 4;
        const buffer = createBinaryFBX(nodeEnd + NODE_HEADER_SIZE);
        writeNodeHeader(buffer, nodeOffset, nodeEnd, 0, 0, "Test");

        const doc = parseBinaryFBX(buffer.buffer);

        expect(doc.version).toBe(7400);
        expect(doc.nodes).toEqual([{ name: "Test", properties: [], children: [] }]);
    });

    it("keeps the exact text of int64 values beyond 2^53", () => {
        const nodeOffset = HEADER_SIZE;
        const propertyBytes = 3 * 9;
        const nodeEnd = nodeOffset + NODE_HEADER_SIZE + 4 + propertyBytes;
        const buffer = createBinaryFBX(nodeEnd + NODE_HEADER_SIZE);
        writeNodeHeader(buffer, nodeOffset, nodeEnd, 3, propertyBytes, "Test");
        let offset = nodeOffset + NODE_HEADER_SIZE + 4;
        // 2^53 + 1, -(2^53 + 1) and 42 as little-endian two's complement
        for (const bytes of [
            [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00],
            [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xdf, 0xff],
            [0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        ]) {
            buffer[offset] = "L".charCodeAt(0);
            buffer.set(bytes, offset + 1);
            offset += 9;
        }

        const doc = parseBinaryFBX(buffer.buffer);

        expect(doc.nodes[0].properties).toEqual([
            { type: "int64", value: 9007199254740992, raw: "9007199254740993" },
            { type: "int64", value: -9007199254740992, raw: "-9007199254740993" },
            { type: "int64", value: 42 },
        ]);
    });

    it("rejects truncated binary headers", () => {
        const buffer = createBinaryFBX(21);

        expect(() => parseBinaryFBX(buffer.buffer)).toThrow("Truncated binary FBX header");
    });

    it("rejects child nodes whose end offset escapes the parent node", () => {
        const parentOffset = HEADER_SIZE;
        const childOffset = parentOffset + NODE_HEADER_SIZE + 6;
        const childEnd = childOffset + NODE_HEADER_SIZE + 5;
        const parentEnd = childEnd;
        const buffer = createBinaryFBX(parentEnd + NODE_HEADER_SIZE);
        writeNodeHeader(buffer, parentOffset, parentEnd, 0, 0, "Parent");
        writeNodeHeader(buffer, childOffset, parentEnd + 1, 0, 0, "Child");

        expect(() => parseBinaryFBX(buffer.buffer)).toThrow(`Invalid FBX node end offset ${parentEnd + 1} at offset ${childOffset}`);
    });

    it("rejects raw arrays whose payload length does not match the declared array length", () => {
        const nodeOffset = HEADER_SIZE;
        const propertyLength = 1 + 12 + 4;
        const nodeEnd = nodeOffset + NODE_HEADER_SIZE + 4 + propertyLength;
        const buffer = createBinaryFBX(nodeEnd + NODE_HEADER_SIZE);
        writeNodeHeader(buffer, nodeOffset, nodeEnd, 1, propertyLength, "Ints");
        let offset = nodeOffset + NODE_HEADER_SIZE + 4;
        buffer[offset++] = "i".charCodeAt(0);
        writeUint32(buffer, offset, 2);
        writeUint32(buffer, offset + 4, 0);
        writeUint32(buffer, offset + 8, 4);

        expect(() => parseBinaryFBX(buffer.buffer)).toThrow("Invalid FBX array byte length for int32[]");
    });
});

function createBinaryFBX(byteLength: number): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(new ArrayBuffer(byteLength));
    for (let i = 0; i < MAGIC.length; i++) {
        bytes[i] = MAGIC.charCodeAt(i);
    }
    writeUint32(bytes, 23, 7400);
    return bytes;
}

function writeNodeHeader(bytes: Uint8Array, offset: number, endOffset: number, propertyCount: number, propertyListLength: number, name: string): void {
    writeUint32(bytes, offset, endOffset);
    writeUint32(bytes, offset + 4, propertyCount);
    writeUint32(bytes, offset + 8, propertyListLength);
    bytes[offset + 12] = name.length;
    for (let i = 0; i < name.length; i++) {
        bytes[offset + NODE_HEADER_SIZE + i] = name.charCodeAt(i);
    }
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >> 8) & 0xff;
    bytes[offset + 2] = (value >> 16) & 0xff;
    bytes[offset + 3] = (value >> 24) & 0xff;
}
