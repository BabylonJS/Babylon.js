import { RGBE_ReadHeader, GetCubeMapTextureData } from "core/Misc/HighDynamicRange/hdr";

/**
 * Tests for HDR (RGBE) texture file parsing.
 * Validates that invalid HDR data produces clear errors rather than silent failures.
 * Related to issue #18151.
 */
describe("RGBE_ReadHeader", () => {
    it("should throw on empty data", () => {
        const emptyBuffer = new Uint8Array(0);
        expect(() => RGBE_ReadHeader(emptyBuffer)).toThrow("Bad HDR Format.");
    });

    it("should throw on data with invalid magic bytes", () => {
        // HDR files must start with #?
        const badMagic = new TextEncoder().encode("INVALID_HEADER\n");
        expect(() => RGBE_ReadHeader(badMagic)).toThrow("Bad HDR Format.");
    });

    it("should throw when FORMAT line is missing", () => {
        // Valid magic but no FORMAT=32-bit_rle_rgbe line before the empty line
        const noFormat = new TextEncoder().encode("#?RADIANCE\n\n-Y 100 +X 100\n");
        expect(() => RGBE_ReadHeader(noFormat)).toThrow("HDR Bad header format, unsupported FORMAT");
    });

    it("should throw when size line is missing or malformed", () => {
        // Valid magic, valid FORMAT, but no valid size line
        const noSize = new TextEncoder().encode("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\nBAD_SIZE_LINE\n");
        expect(() => RGBE_ReadHeader(noSize)).toThrow("HDR Bad header format, no size");
    });

    it("should throw when width is out of supported range", () => {
        // Width must be [8, 0x7fff]. Width of 4 is too small.
        // Buffer must be large enough to work around ReadStringLine's loop condition (i < length - startIndex).
        const header = new TextEncoder().encode("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 100 +X 4\n");
        const badSize = new Uint8Array(header.length * 3);
        badSize.set(header);
        expect(() => RGBE_ReadHeader(badSize)).toThrow("HDR Bad header format, unsupported size");
    });

    it("should parse a valid header", () => {
        // Buffer must be large enough to work around ReadStringLine's loop condition (i < length - startIndex).
        const header = new TextEncoder().encode("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 64 +X 128\n");
        const validHeader = new Uint8Array(header.length * 3);
        validHeader.set(header);
        const info = RGBE_ReadHeader(validHeader);
        expect(info.width).toBe(128);
        expect(info.height).toBe(64);
        expect(info.dataPosition).toBeGreaterThan(0);
    });
});

describe("GetCubeMapTextureData", () => {
    it("should throw on invalid buffer data", () => {
        const invalidBuffer = new ArrayBuffer(16);
        expect(() => GetCubeMapTextureData(invalidBuffer, 64)).toThrow("Bad HDR Format.");
    });
});
