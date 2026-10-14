import { expect } from "vitest";

const Identifier = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];

export interface IKTX2Expectations {
    width: number;
    height: number;
    levelCount: number;
    supercompressionScheme: number;
    colorModel: number;
    primaries: number;
    transferFunction: number;
}

const _readKeyValues = (data: Uint8Array, offset: number, length: number): Map<string, string> => {
    const values = new Map<string, string>();
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const decoder = new TextDecoder();
    const end = offset + length;
    let position = offset;
    while (position < end) {
        const entryLength = view.getUint32(position, true);
        const entryStart = position + 4;
        const entry = data.subarray(entryStart, entryStart + entryLength);
        const separator = entry.indexOf(0);
        if (separator !== -1) {
            values.set(decoder.decode(entry.subarray(0, separator)), decoder.decode(entry.subarray(separator + 1)).replace(/\0+$/, ""));
        }
        position = entryStart + ((entryLength + 3) & ~3);
    }
    return values;
};

export const CheckKTX2 = (data: Uint8Array, expected: IKTX2Expectations): void => {
    expect(Array.from(data.subarray(0, Identifier.length))).toEqual(Identifier);

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    expect(view.getUint32(20, true)).toBe(expected.width);
    expect(view.getUint32(24, true)).toBe(expected.height);
    expect(view.getUint32(28, true)).toBe(0);
    expect(view.getUint32(32, true)).toBe(0);
    expect(view.getUint32(36, true)).toBe(1);
    expect(view.getUint32(40, true)).toBe(expected.levelCount);
    expect(view.getUint32(44, true)).toBe(expected.supercompressionScheme);

    const dfdByteOffset = view.getUint32(48, true);
    expect(data[dfdByteOffset + 12]).toBe(expected.colorModel);
    expect(data[dfdByteOffset + 13]).toBe(expected.primaries);
    expect(data[dfdByteOffset + 14]).toBe(expected.transferFunction);

    const keyValues = _readKeyValues(data, view.getUint32(56, true), view.getUint32(60, true));
    const orientation = keyValues.get("KTXorientation");
    const swizzle = keyValues.get("KTXswizzle");
    expect(orientation === undefined || orientation === "rd").toBe(true);
    expect(swizzle === undefined || swizzle === "rgba").toBe(true);
};
