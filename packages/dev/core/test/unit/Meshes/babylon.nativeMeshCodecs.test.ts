import { afterEach, describe, expect, it, vi } from "vitest";
import { DracoDecoder } from "core/Meshes/Compression/dracoDecoder";
import { DracoEncoder } from "core/Meshes/Compression/dracoEncoder";
import { MeshoptCompression } from "core/Meshes/Compression/meshoptCompression";
import { Tools } from "core/Misc/tools";

describe("Native mesh codecs", () => {
    afterEach(() => {
        delete (globalThis as any)._native;
        vi.restoreAllMocks();
    });

    describe("DracoDecoder", () => {
        it("decodes through the native codec without loading the WebAssembly module", async () => {
            const loadFile = vi.spyOn(Tools, "LoadFileAsync");
            const positions = new Float32Array([0, 1, 2]);
            const indices = new Uint16Array([0, 1, 2]);
            const decodeDracoMesh = vi.fn(() => ({
                indices,
                attributes: [{ kind: "position", data: positions, size: 3, byteOffset: 0, byteStride: 12, normalized: true }],
                totalVertices: 1,
            }));
            (globalThis as any)._native = { decodeDracoMesh };

            const decoder = new DracoDecoder();
            await decoder.whenReadyAsync();
            const source = new Uint8Array([1, 2, 3, 4]);
            const result = await decoder.decodeMeshToMeshDataAsync(source.subarray(1), { position: 7 }, { position: false });

            expect(loadFile).not.toHaveBeenCalled();
            const [data, attributes] = decodeDracoMesh.mock.calls[0] as unknown as [Int8Array, { [kind: string]: number }];
            expect(Array.from(data)).toEqual([2, 3, 4]);
            expect(attributes).toEqual({ position: 7 });
            expect(result.indices).toBe(indices);
            expect(result.totalVertices).toBe(1);
            expect(result.attributes).toEqual([{ kind: "position", data: positions, size: 3, byteOffset: 0, byteStride: 12, normalized: false }]);
            decoder.dispose();
        });

        it("keeps an injected worker pool or JS module instead of the native codec", async () => {
            const decodeDracoMesh = vi.fn();
            (globalThis as any)._native = { decodeDracoMesh };

            const workerPool = { dispose: vi.fn() };
            const pooledDecoder = new DracoDecoder({ workerPool: workerPool as any });
            expect((pooledDecoder as any)._useNativeCodec).toBe(false);
            await expect((pooledDecoder as any)._workerPoolPromise).resolves.toBe(workerPool);

            const jsModule = vi.fn(() => Promise.reject(new Error("module stub")));
            const moduleDecoder = new DracoDecoder({ jsModule, numWorkers: 0 });
            expect((moduleDecoder as any)._useNativeCodec).toBe(false);
            await expect((moduleDecoder as any)._modulePromise).rejects.toThrow("module stub");
            expect(jsModule).toHaveBeenCalledOnce();
            expect(decodeDracoMesh).not.toHaveBeenCalled();
        });

        it("rejects instead of throwing synchronously when the native decoder fails", async () => {
            (globalThis as any)._native = {
                decodeDracoMesh: () => {
                    throw new Error("bad draco data");
                },
            };

            const decoder = new DracoDecoder();
            let promise: Promise<unknown> | undefined;
            expect(() => {
                promise = decoder.decodeMeshToMeshDataAsync(new Uint8Array(4));
            }).not.toThrow();
            await expect(promise).rejects.toThrow("bad draco data");
            decoder.dispose();
        });
    });

    describe("DracoEncoder", () => {
        it("encodes through the native codec with the merged default options", async () => {
            const loadFile = vi.spyOn(Tools, "LoadFileAsync");
            const encoded = { data: new Int8Array([9]), attributeIds: { position: 0 } };
            const encodeDracoMesh = vi.fn(() => encoded);
            (globalThis as any)._native = { encodeDracoMesh };

            const encoder = new DracoEncoder();
            const attributes = [{ kind: "position", dracoName: "POSITION", size: 3, data: new Float32Array([0, 1, 2]) }];
            const indices = new Uint32Array([0, 0, 0]);
            const result = await encoder._encodeAsync(attributes as any, indices, { encodeSpeed: 3 });

            expect(loadFile).not.toHaveBeenCalled();
            expect(result).toBe(encoded);
            const [passedAttributes, passedIndices, options] = encodeDracoMesh.mock.calls[0] as unknown as [unknown, unknown, { method: string; encodeSpeed: number }];
            expect(passedAttributes).toBe(attributes);
            expect(passedIndices).toBe(indices);
            expect(options.encodeSpeed).toBe(3);
            expect(options.method).toBe("MESH_EDGEBREAKER_ENCODING");
            encoder.dispose();
        });
    });

    describe("MeshoptCompression", () => {
        it("decodes through the native decoder without loading the WebAssembly module", async () => {
            const loadScript = vi.spyOn(Tools, "LoadBabylonScriptAsync");
            const decoded = new Uint8Array([5, 6]);
            const decodeMeshopt = vi.fn(() => decoded);
            (globalThis as any)._native = { decodeMeshopt };

            const meshopt = new MeshoptCompression();
            const source = new Uint8Array([1]);
            const result = await meshopt.decodeGltfBufferAsync(source, 2, 1, "ATTRIBUTES", "NONE");

            expect(loadScript).not.toHaveBeenCalled();
            expect(result).toBe(decoded);
            expect(decodeMeshopt).toHaveBeenCalledWith(source, 2, 1, "ATTRIBUTES", "NONE");
            meshopt.dispose();
        });
    });
});
