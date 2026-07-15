import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { GetRegisteredSceneLoaderPluginMetadata, ImportMeshAsync } from "core/Loading/sceneLoader";
// The pure module has no side effects, so importing the class here does not register anything.
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";

// Builds a minimal, self-contained glTF 2.0 asset (a single triangle) as a data string.
function buildMinimalGltf(): string {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const bytes = new Uint8Array(positions.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const gltf = {
        asset: { version: "2.0", generator: "test" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
        bufferViews: [{ buffer: 0, byteLength: 36, byteOffset: 0 }],
        buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${base64}` }],
    };
    return JSON.stringify(gltf);
}

function isExtensionRegistered(extension: string): boolean {
    return GetRegisteredSceneLoaderPluginMetadata().some((plugin) => plugin.extensions.some((e) => e.extension.toLowerCase() === extension));
}

/**
 * Guards the pre-9.15 behavior that importing only `@babylonjs/loaders/glTF/2.0`
 * auto-registers the .gltf/.glb SceneLoader plugin, without dragging in the
 * legacy glTF 1.0 loader.
 */
describe("glTF 2.0 SceneLoader plugin auto-registration", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, 0), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("registers the .gltf/.glb plugin and does not pull in glTF 1.0 when importing only glTF/2.0", async () => {
        // Before importing the 2.0 entry point, nothing has registered the gltf plugin
        // and the version registry has no loader factories yet.
        expect(isExtensionRegistered(".gltf")).toBe(false);
        expect(isExtensionRegistered(".glb")).toBe(false);
        expect(GLTFFileLoader._CreateGLTF2Loader).toBeUndefined();
        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();

        // Importing ONLY the 2.0 entry point must restore auto-registration.
        await import("loaders/glTF/2.0");

        expect(isExtensionRegistered(".gltf")).toBe(true);
        expect(isExtensionRegistered(".glb")).toBe(true);

        // The 2.0 parser factory must be registered...
        expect(GLTFFileLoader._CreateGLTF2Loader).toBeDefined();
        // ...but the legacy glTF 1.0 loader must NOT have been imported/instantiated.
        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();
    });

    it("loads a minimal glTF 2.0 asset through SceneLoader after importing only glTF/2.0", async () => {
        await import("loaders/glTF/2.0");

        const gltf = buildMinimalGltf();
        const result = await ImportMeshAsync(`data:${gltf}`, scene);

        // A __root__ node plus at least one mesh with geometry should have loaded.
        const loadedMeshes = result.meshes.filter((m) => m.getTotalVertices() > 0);
        expect(loadedMeshes.length).toBeGreaterThanOrEqual(1);
    });
});
