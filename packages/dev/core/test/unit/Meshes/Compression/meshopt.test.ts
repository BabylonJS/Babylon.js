import { describe, it, expect, vi, afterEach } from "vitest";
import { MeshoptCompression } from "core/Meshes/Compression/meshoptCompression";

describe("MeshoptCompression", () => {
    afterEach(() => {
        delete (globalThis as any).MeshoptDecoder;
    });

    it("decodes on the main thread when Worker is not available", async () => {
        expect(typeof Worker).toBe("undefined");

        const decoded = new Uint8Array([1, 2, 3]);
        const meshoptDecoder = {
            useWorkers: vi.fn(),
            decodeGltfBufferAsync: vi.fn().mockResolvedValue(decoded),
        };
        (globalThis as any).MeshoptDecoder = meshoptDecoder;

        // Skip the constructor, which would download the decoder script.
        const compression = Object.create(MeshoptCompression.prototype) as MeshoptCompression;
        (compression as any)._decoderModulePromise = Promise.resolve();

        const source = new Uint8Array(4);
        const result = await compression.decodeGltfBufferAsync(source, 3, 1, "ATTRIBUTES");

        expect(result).toBe(decoded);
        expect(meshoptDecoder.decodeGltfBufferAsync).toHaveBeenCalledWith(3, 1, source, "ATTRIBUTES", undefined);
        expect(meshoptDecoder.useWorkers).not.toHaveBeenCalled();
    });
});
