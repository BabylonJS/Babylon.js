import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type IFileRequest } from "core/Misc/fileRequest";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader.pure";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";

describe("glTF 2.1 thumbnails", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("loads a data URI thumbnail without constructing the scene", async () => {
        const data = {
            json: {
                asset: { version: "2.1", thumbnail: 0 },
                images: [{ uri: `data:image/webp;base64,${btoa("thumbnail")}` }],
                scenes: [{ nodes: [0] }],
                nodes: [{ name: "not-loaded" }],
            },
            bin: null,
        };
        const thumbnail = await GLTFLoader.LoadThumbnailAsync(scene, data, "");
        expect(thumbnail?.mimeType).toBe("image/webp");
        expect(new TextDecoder().decode(thumbnail?.data)).toBe("thumbnail");
        expect(scene.meshes).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
        expect(data.json.images[0]).toEqual({ uri: `data:image/webp;base64,${btoa("thumbnail")}` });
    });

    it("reads a thumbnail directly from a binary glTF file", async () => {
        const json = new TextEncoder().encode(
            JSON.stringify({
                asset: { version: "2.1", thumbnail: 0 },
                extensionsRequired: ["UNSUPPORTED_scene_extension"],
                images: [{ bufferView: 0, mimeType: "image/png" }],
                bufferViews: [{ buffer: 0, byteLength: 4 }],
                buffers: [{ byteLength: 4 }],
            })
        );
        const jsonLength = Math.ceil(json.length / 4) * 4;
        const glb = new Uint8Array(12 + 8 + jsonLength + 8 + 4);
        const view = new DataView(glb.buffer);
        view.setUint32(0, 0x46546c67, true);
        view.setUint32(4, 2, true);
        view.setUint32(8, glb.length, true);
        view.setUint32(12, jsonLength, true);
        view.setUint32(16, 0x4e4f534a, true);
        glb.fill(0x20, 20, 20 + jsonLength);
        glb.set(json, 20);
        view.setUint32(20 + jsonLength, 4, true);
        view.setUint32(24 + jsonLength, 0x004e4942, true);
        glb.set([1, 2, 3, 4], 28 + jsonLength);
        const thumbnail = await GLTFLoader.LoadThumbnailAsync(scene, glb, "");
        expect(thumbnail?.mimeType).toBe("image/png");
        expect(Array.from(thumbnail!.data)).toEqual([1, 2, 3, 4]);
    });

    it("resolves an external thumbnail relative to the asset", async () => {
        const request = vi.spyOn(GLTFFileLoader.prototype, "_loadFile").mockImplementation((_scene, url, success) => {
            expect(url).toBe("https://example.test/asset/preview.webp");
            success(new Uint8Array([5, 6]).buffer);
            return { abort: () => {}, onCompleteObservable: new Observable<IFileRequest>() };
        });
        const json = JSON.stringify({ asset: { version: "2.1", thumbnail: 0 }, images: [{ uri: "preview.webp" }] });
        const thumbnail = await GLTFLoader.LoadThumbnailAsync(scene, json, "https://example.test/asset/");
        expect(thumbnail?.mimeType).toBe("image/webp");
        expect(Array.from(thumbnail!.data)).toEqual([5, 6]);
        expect(request).toHaveBeenCalledOnce();
    });

    it("loads only the requested range from an explicitly referenced chunk", async () => {
        const bytes = new Uint8Array([0, 1, 2, 3, 4]);
        const reads: number[][] = [];
        const data = {
            json: {
                asset: { version: "2.1", thumbnail: 0 },
                images: [{ bufferView: 0, mimeType: "image/png" }],
                bufferViews: [{ buffer: 0, byteOffset: 1, byteLength: 3 }],
                buffers: [{ chunk: 1, byteLength: bytes.length }],
            },
            bin: null,
            chunks: [
                { byteLength: 0, readAsync: async () => new Uint8Array() },
                {
                    byteLength: bytes.length,
                    readAsync: async (offset: number, length: number) => {
                        reads.push([offset, length]);
                        return bytes.subarray(offset, offset + length);
                    },
                },
            ],
        };
        const thumbnail = await GLTFLoader.LoadThumbnailAsync(scene, data, "");
        expect(thumbnail?.mimeType).toBe("image/png");
        expect(Array.from(thumbnail!.data)).toEqual([1, 2, 3]);
        expect(reads).toEqual([[1, 3]]);
    });

    it("returns undefined without a thumbnail and rejects an invalid image reference", async () => {
        await expect(GLTFLoader.LoadThumbnailAsync(scene, { json: { asset: { version: "2.1" } }, bin: null }, "")).resolves.toBeUndefined();
        await expect(GLTFLoader.LoadThumbnailAsync(scene, { json: { asset: { version: "2.1", thumbnail: 1 }, images: [] }, bin: null }, "")).rejects.toThrow();
    });
});
