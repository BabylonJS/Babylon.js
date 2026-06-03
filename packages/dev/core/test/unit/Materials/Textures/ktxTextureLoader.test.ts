import { describe, expect, it, vi } from "vitest";

import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { _KTXTextureLoader } from "core/Materials/Textures/Loaders/ktxTextureLoader";

const KTX_IDENTIFIER = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];

function createKtx1Data(glInternalFormat: number, faceCount = 1): Uint8Array {
    const imageSize = 16;
    const data = new Uint8Array(68 + imageSize * faceCount);
    data.set(KTX_IDENTIFIER, 0);

    const header = new DataView(data.buffer, 12);
    header.setUint32(0, 0x04030201, true); // endianness
    header.setUint32(4, 0, true); // glType: compressed texture
    header.setUint32(8, 1, true); // glTypeSize
    header.setUint32(12, 0, true); // glFormat
    header.setUint32(16, glInternalFormat, true);
    header.setUint32(20, Constants.TEXTUREFORMAT_RGBA, true);
    header.setUint32(24, 4, true); // pixelWidth
    header.setUint32(28, 4, true); // pixelHeight
    header.setUint32(32, 0, true); // pixelDepth
    header.setUint32(36, 0, true); // numberOfArrayElements
    header.setUint32(40, faceCount, true); // numberOfFaces
    header.setUint32(44, 1, true); // numberOfMipmapLevels
    header.setUint32(48, 0, true); // bytesOfKeyValueData
    header.setUint32(52, imageSize, true); // level imageSize

    return data;
}

describe("KTX texture loader", () => {
    it.each([true, false])("preserves compressed sRGB metadata for 2D textures with generateMipMaps=%s", (generateMipMaps) => {
        const engine = new NullEngine();
        const texture = new InternalTexture(engine, InternalTextureSource.Url);
        texture.generateMipMaps = generateMipMaps;
        texture.invertY = false;
        const getUseSRGBBufferSpy = vi.spyOn(engine, "_getUseSRGBBuffer").mockReturnValue(true);

        new _KTXTextureLoader().loadData(createKtx1Data(Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR), texture, (width, height, loadMipmap, isCompressed) => {
            expect(width).toBe(4);
            expect(height).toBe(4);
            expect(loadMipmap).toBe(generateMipMaps);
            expect(isCompressed).toBe(true);
            expect(texture.format).toBe(Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4);
            expect(texture._gammaSpace).toBe(true);
            expect(texture._useSRGBBuffer).toBe(true);
        });

        expect(getUseSRGBBufferSpy).toHaveBeenCalledWith(true, !generateMipMaps);
        engine.dispose();
    });

    it.each([true, false])("preserves compressed sRGB metadata for cube textures with generateMipMaps=%s", (generateMipMaps) => {
        const engine = new NullEngine();
        const texture = new InternalTexture(engine, InternalTextureSource.Cube);
        texture.generateMipMaps = generateMipMaps;
        texture.invertY = false;
        const getUseSRGBBufferSpy = vi.spyOn(engine, "_getUseSRGBBuffer").mockReturnValue(true);
        vi.spyOn(engine, "_uploadCompressedDataToTextureDirectly").mockImplementation(() => {});
        vi.spyOn(engine, "_unpackFlipY").mockImplementation(() => {});
        vi.spyOn(engine, "_setCubeMapTextureParams").mockImplementation(() => {});
        const onLoad = vi.fn();

        new _KTXTextureLoader().loadCubeData(createKtx1Data(Constants.TEXTUREFORMAT_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR, 6), texture, false, onLoad);

        expect(getUseSRGBBufferSpy).toHaveBeenCalledWith(true, !generateMipMaps);
        expect(texture.format).toBe(Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4);
        expect(texture._gammaSpace).toBe(true);
        expect(texture._useSRGBBuffer).toBe(true);
        expect(onLoad).toHaveBeenCalledTimes(1);
        engine.dispose();
    });
});
