import { describe, expect, it } from "vitest";

import { KTX2Decoder } from "ktx2decoder/ktx2Decoder";
import { type ICompressedFormatCapabilities } from "core/Materials/Textures/ktx2decoderTypes";

const KTX2_IDENTIFIER = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];

const VK_FORMAT_R8G8B8A8_UNORM = 37;
const DFD_MODEL_RGBSDA = 1;
const DFD_TRANSFER_LINEAR = 1;

/**
 * Builds a minimal uncompressed RGBA8 KTX2 file with the requested number of array layers and mip levels.
 * Every layer of every level is filled with a single distinct byte value so the decoder output can be checked.
 * @param width width of the base level
 * @param layerCount number of array layers
 * @param levelCount number of mip levels
 * @param vkFormat the vkFormat value to write in the header
 * @param supercompressionScheme the supercompression scheme to declare in the header (the level data is left uncompressed)
 * @returns the raw KTX2 bytes
 */
function createUncompressedKtx2(width: number, layerCount: number, levelCount: number, vkFormat = VK_FORMAT_R8G8B8A8_UNORM, supercompressionScheme = 0): Uint8Array {
    const numSamples = 4;
    const descriptorBlockSize = 24 + numSamples * 16;
    const dfdByteLength = 4 + descriptorBlockSize;

    const headerEnd = 12 + 17 * 4;
    const levelIndexEnd = headerEnd + levelCount * 24;
    const dfdByteOffset = levelIndexEnd;
    const dataOffset = dfdByteOffset + dfdByteLength;

    const levelByteLengths: number[] = [];
    let totalDataLength = 0;
    for (let level = 0; level < levelCount; level++) {
        const size = Math.max(width >> level, 1);
        const byteLength = size * size * 4 * layerCount;
        levelByteLengths.push(byteLength);
        totalDataLength += byteLength;
    }

    const data = new Uint8Array(dataOffset + totalDataLength);
    const view = new DataView(data.buffer);
    data.set(KTX2_IDENTIFIER, 0);

    let offset = 12;
    const writeU32 = (value: number) => {
        view.setUint32(offset, value, true);
        offset += 4;
    };
    const writeU64 = (value: number) => {
        view.setUint32(offset, value, true);
        view.setUint32(offset + 4, 0, true);
        offset += 8;
    };

    writeU32(vkFormat);
    writeU32(1); // typeSize
    writeU32(width); // pixelWidth
    writeU32(width); // pixelHeight
    writeU32(0); // pixelDepth
    writeU32(layerCount);
    writeU32(1); // faceCount
    writeU32(levelCount);
    writeU32(supercompressionScheme);
    writeU32(dfdByteOffset);
    writeU32(dfdByteLength);
    writeU32(0); // kvdByteOffset
    writeU32(0); // kvdByteLength
    writeU64(0); // sgdByteOffset
    writeU64(0); // sgdByteLength

    // Level index, level 0 first.
    let levelDataOffset = dataOffset;
    for (let level = 0; level < levelCount; level++) {
        writeU64(levelDataOffset);
        writeU64(levelByteLengths[level]);
        writeU64(levelByteLengths[level]);
        levelDataOffset += levelByteLengths[level];
    }

    // Data format descriptor.
    offset = dfdByteOffset;
    writeU32(dfdByteLength); // dfdTotalSize
    view.setUint16(offset, 0, true); // vendorId
    view.setUint16(offset + 2, 0, true); // descriptorType
    view.setUint16(offset + 4, 2, true); // versionNumber
    view.setUint16(offset + 6, descriptorBlockSize, true);
    data[offset + 8] = DFD_MODEL_RGBSDA;
    data[offset + 9] = 1; // colorPrimaries
    data[offset + 10] = DFD_TRANSFER_LINEAR;
    data[offset + 11] = 0; // flags
    data[offset + 12] = 0; // texelBlockDimension0 (stored as dimension - 1)
    data[offset + 13] = 0;
    data[offset + 14] = 0;
    data[offset + 15] = 0;
    data[offset + 16] = 4; // bytesPlane0
    const samplesOffset = offset + 24;
    const channelTypes = [0, 1, 2, 15]; // R, G, B, A
    for (let i = 0; i < numSamples; i++) {
        const sampleOffset = samplesOffset + i * 16;
        view.setUint16(sampleOffset, i * 8, true); // bitOffset
        data[sampleOffset + 2] = 7; // bitLength - 1
        data[sampleOffset + 3] = channelTypes[i];
    }

    // Image data: for each level, for each layer, a solid block of a distinct value.
    let writeOffset = dataOffset;
    for (let level = 0; level < levelCount; level++) {
        const size = Math.max(width >> level, 1);
        const layerByteLength = size * size * 4;
        for (let layer = 0; layer < layerCount; layer++) {
            data.fill(level * 16 + layer + 1, writeOffset, writeOffset + layerByteLength);
            writeOffset += layerByteLength;
        }
    }

    return data;
}

const EmptyCaps: ICompressedFormatCapabilities = {};

describe("KTX2Decoder", () => {
    it("decodes an uncompressed array texture into one mipmap per level and layer", async () => {
        const file = createUncompressedKtx2(4, 3, 3);

        const decoded = await new KTX2Decoder().decode(file, EmptyCaps);

        expect(decoded.errors).toBeUndefined();
        expect(decoded.width).toBe(4);
        expect(decoded.height).toBe(4);
        expect(decoded.layerCount).toBe(3);
        expect(decoded.transcoderName).toBe("UncompressedRGBA32Transcoder");
        // Levels are emitted in order, and within a level the layers are in ascending order.
        expect(decoded.mipmaps).toHaveLength(9);
        expect(decoded.mipmaps.map((mipmap) => [mipmap.width, mipmap.layerIndex])).toEqual([
            [4, 0],
            [4, 1],
            [4, 2],
            [2, 0],
            [2, 1],
            [2, 2],
            [1, 0],
            [1, 1],
            [1, 2],
        ]);
        // Each layer must carry its own bytes rather than a repeat of layer 0.
        expect(decoded.mipmaps.map((mipmap) => mipmap.data![0])).toEqual([1, 2, 3, 17, 18, 19, 33, 34, 35]);
        expect(decoded.mipmaps[0].data!.byteLength).toBe(4 * 4 * 4);
        expect(decoded.mipmaps[3].data!.byteLength).toBe(2 * 2 * 4);
    });

    it("reports a layerCount of 1 for a non-array uncompressed texture", async () => {
        const file = createUncompressedKtx2(4, 1, 1);

        const decoded = await new KTX2Decoder().decode(file, EmptyCaps);

        expect(decoded.errors).toBeUndefined();
        expect(decoded.layerCount).toBe(1);
        expect(decoded.mipmaps).toHaveLength(1);
    });

    it("copies the data out of the source buffer", async () => {
        const file = createUncompressedKtx2(4, 1, 1);

        const decoded = await new KTX2Decoder().decode(file, EmptyCaps);
        file.fill(0);

        expect(decoded.mipmaps[0].data![0]).toBe(1);
    });

    it("rejects an unsupported uncompressed format", async () => {
        const file = createUncompressedKtx2(4, 1, 1, 23 /* VK_FORMAT_R8G8B8_UNORM */);

        await expect(new KTX2Decoder().decode(file, EmptyCaps)).rejects.toThrow(/Unsupported uncompressed format/);
    });

    it("rejects a BasisLZ file that carries no supercompression global data", async () => {
        const file = createUncompressedKtx2(4, 1, 1, VK_FORMAT_R8G8B8A8_UNORM, 1 /* SupercompressionScheme.BasisLZ */);

        await expect(new KTX2Decoder().decode(file, EmptyCaps)).rejects.toThrow(/BasisLZ supercompression is declared but the file has no supercompression global data/);
    });

    it("honors the byte offset of a decompressed ZStandard level", async () => {
        const file = createUncompressedKtx2(4, 3, 1, VK_FORMAT_R8G8B8A8_UNORM, 2 /* SupercompressionScheme.ZStandard */);

        const decoder = new KTX2Decoder();
        // Stand in for the real ZStandard decoder: pass the level through unchanged, but hand it back as a view
        // that starts partway into a larger buffer, which is what the wasm decoder does in practice.
        (decoder as any)._zstdDecoder = {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            init: async () => {},
            decode: (array: Uint8Array) => {
                const backingBuffer = new Uint8Array(array.byteLength + 8);
                backingBuffer.set(array, 8);
                return backingBuffer.subarray(8);
            },
        };

        const decoded = await decoder.decode(file, EmptyCaps);

        expect(decoded.errors).toBeUndefined();
        expect(decoded.mipmaps).toHaveLength(3);
        // Each layer must be sliced out of the decompressed level, not silently replaced by the whole level.
        expect(decoded.mipmaps.map((mipmap) => mipmap.data![0])).toEqual([1, 2, 3]);
        expect(decoded.mipmaps.map((mipmap) => mipmap.data!.byteLength)).toEqual([4 * 4 * 4, 4 * 4 * 4, 4 * 4 * 4]);
    });
});
