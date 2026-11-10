import { describe, it, expect, afterEach, vi } from "vitest";
import { DracoDecoder } from "core/Meshes/Compression/dracoDecoder";
import { type IDracoCodecConfiguration } from "core/Meshes/Compression/dracoCodec";
import { DracoCompression } from "core/Meshes/Compression/dracoCompression";

vi.mock("core/Meshes/Compression/dracoCompressionWorker", async (importOriginal) => {
    const original = await importOriginal<typeof import("core/Meshes/Compression/dracoCompressionWorker")>();
    return {
        ...original,
        DecodeMesh: (
            _module: unknown,
            _data: Int8Array,
            _attributes: unknown,
            onIndicesData: (indices: Uint32Array) => void,
            onAttributeData: (kind: string, data: ArrayBufferView, size: number, offset: number, stride: number, normalized: boolean) => void
        ) => {
            onIndicesData(new Uint32Array([0, 1, 2]));
            onAttributeData("position", new Int16Array(9), 3, 0, 6, false);
            onAttributeData("normal", new Int8Array(9), 3, 0, 3, false);
            return 3;
        },
    };
});

describe("Draco Mesh Compression tests", () => {
    describe("DracoDecoder without workers", () => {
        it("applies the glTF normalized override when decoding on the main thread", async () => {
            // Simulate a decoder created without workers (e.g. no Worker support), which decodes through the module.
            const decoder = Object.create(DracoDecoder.prototype) as DracoDecoder;
            (decoder as any)._modulePromise = Promise.resolve({ module: {} });

            const meshData = await decoder.decodeMeshToMeshDataAsync(new Int8Array(4), { position: 0, normal: 1 }, { position: true });

            expect(meshData.totalVertices).toBe(3);
            expect(meshData.attributes.find((a) => a.kind === "position")!.normalized).toBe(true);
            expect(meshData.attributes.find((a) => a.kind === "normal")!.normalized).toBe(false);
        });
    });

    describe("DracoDecoder's configuration is affected by updates to DracoCompression's", () => {
        const originalConfig: IDracoCodecConfiguration = { ...DracoDecoder.DefaultConfiguration };
        const testUrl = "testUrl";

        afterEach(() => {
            expect(DracoDecoder.DefaultConfiguration.fallbackUrl).toBe(testUrl);
            expect(DracoDecoder.DefaultConfiguration.fallbackUrl).toBe(DracoCompression.Configuration.decoder.fallbackUrl);
            expect(DracoDecoder.DefaultConfiguration).toBe(DracoCompression.Configuration.decoder);
            DracoDecoder.DefaultConfiguration = originalConfig;
        });

        it("updates via DracoCompression.Configuration.decoder.fallbackUrl", () => {
            DracoCompression.Configuration.decoder.fallbackUrl = testUrl;
        });

        it("updates via DracoCompression.Configuration.decoder", () => {
            DracoCompression.Configuration.decoder = {
                fallbackUrl: testUrl,
            };
        });

        it("updates via DracoCompression.Configuration", () => {
            DracoCompression.Configuration = {
                decoder: {
                    fallbackUrl: testUrl,
                },
            };
        });
    });
});
