import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type ISceneLoaderAsyncResult } from "core/Loading/sceneLoader";
import { Scene } from "core/scene";
import { GLTFFileLoader, type IGLTFLoaderData } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";

function buildMinimalGltf(): string {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const bytes = new Uint8Array(positions.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return JSON.stringify({
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
        bufferViews: [{ buffer: 0, byteLength: bytes.length }],
        buffers: [{ byteLength: bytes.length, uri: `data:application/octet-stream;base64,${btoa(binary)}` }],
    });
}

describe("glTF entity collection scopes", () => {
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

    async function importMeshAsync(): Promise<ISceneLoaderAsyncResult> {
        const loader = new GLTFFileLoader();
        const data = (await loader.directLoad(scene, buildMinimalGltf())) as IGLTFLoaderData;
        return await loader.importMeshAsync(null, scene, data, "");
    }

    it("collects resources during a normal load and restores the unblocked state", async () => {
        const result = await importMeshAsync();

        expect(result.meshes.length).toBeGreaterThan(0);
        expect(scene.meshes).toEqual(result.meshes);
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("preserves a pre-existing block throughout nested loader creation", async () => {
        scene._blockEntityCollection = true;

        const result = await importMeshAsync();

        expect(result.meshes.length).toBeGreaterThan(0);
        expect(scene.meshes).toHaveLength(0);
        expect(scene._blockEntityCollection).toBe(true);
        result.meshes.forEach((mesh) => mesh.dispose());
    });

    it("restores the state when a loader-owned constructor throws", async () => {
        const error = new Error("Mesh registration failed");
        vi.spyOn(scene, "addMesh").mockImplementation(() => {
            throw error;
        });

        await expect(importMeshAsync()).rejects.toThrow(error);
        expect(scene._blockEntityCollection).toBe(false);
    });
});
