import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Mesh } from "core/Meshes/mesh";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { ImportMeshAsync } from "core/Loading";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import "loaders/glTF";

/**
 * Helper to build a minimal glTF JSON with two meshes: one opaque and one with
 * KHR_materials_transmission. Both share the same triangle geometry.
 */
function buildTransmissionGltf(): string {
    // Three vertices of a simple triangle, each VEC3 of float32 = 36 bytes
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const bytes = new Uint8Array(positions.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const gltf = {
        asset: { version: "2.0", generator: "test" },
        extensionsUsed: ["KHR_materials_transmission"],
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [{ mesh: 0 }, { mesh: 1 }],
        meshes: [
            { primitives: [{ attributes: { POSITION: 0 }, material: 0 }] },
            { primitives: [{ attributes: { POSITION: 0 }, material: 1 }] },
        ],
        materials: [
            { name: "opaque_mat", pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1] } },
            {
                name: "transmissive_mat",
                pbrMetallicRoughness: { baseColorFactor: [0, 1, 0, 1] },
                extensions: { KHR_materials_transmission: { transmissionFactor: 1.0 } },
            },
        ],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
        bufferViews: [{ buffer: 0, byteLength: 36, byteOffset: 0 }],
        buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${base64}` }],
    };
    return JSON.stringify(gltf);
}

/**
 * Access the TransmissionHelper stored on the scene by the KHR_materials_transmission extension.
 */
function getTransmissionHelper(scene: Scene): any {
    return (scene as any)._transmissionHelper;
}

describe("KHR_materials_transmission – MergeMeshes with MultiMaterial", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        engine.getCaps().standardDerivatives = true;

        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, 0), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should create a TransmissionHelper when loading glTF with transmission", async () => {
        const gltf = buildTransmissionGltf();
        await ImportMeshAsync(`data:${gltf}`, scene);

        const helper = getTransmissionHelper(scene);
        expect(helper).toBeDefined();
    });

    it("should classify original meshes into opaque and transparent caches", async () => {
        const gltf = buildTransmissionGltf();
        await ImportMeshAsync(`data:${gltf}`, scene);

        // Wait for SetImmediate in _addMesh to execute
        await new Promise((resolve) => setTimeout(resolve, 50));

        const helper = getTransmissionHelper(scene);
        expect(helper).toBeDefined();

        const opaque: any[] = helper._opaqueMeshesCache;
        const transparent: any[] = helper._transparentMeshesCache;

        // At least one mesh should be opaque and one transparent
        expect(opaque.length).toBeGreaterThanOrEqual(1);
        expect(transparent.length).toBeGreaterThanOrEqual(1);

        // The transparent mesh should have a PBR material with transmission
        const transparentMesh = transparent.find((m: any) => {
            const mat = m.material as PBRMaterial;
            return mat && mat.subSurface && mat.subSurface.isRefractionEnabled;
        });
        expect(transparentMesh).toBeDefined();
    });

    it("should handle merged mesh with MultiMaterial as 'mixed'", async () => {
        const gltf = buildTransmissionGltf();
        const result = await ImportMeshAsync(`data:${gltf}`, scene);

        // Wait for SetImmediate in _addMesh to execute
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Get the loaded child meshes (skip root __root__ node)
        const childMeshes = result.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
        expect(childMeshes.length).toBe(2);

        // Merge the meshes with multiMultiMaterials=true
        const merged = Mesh.MergeMeshes(childMeshes, true, true, undefined, false, true);
        expect(merged).toBeDefined();
        expect(merged!.material).toBeInstanceOf(MultiMaterial);

        // Wait for SetImmediate in _addMesh to execute for the merged mesh
        await new Promise((resolve) => setTimeout(resolve, 50));

        const helper = getTransmissionHelper(scene);
        expect(helper).toBeDefined();

        // The merged mesh should be in the opaque cache (for mixed classification)
        const opaque: any[] = helper._opaqueMeshesCache;
        expect(opaque).toContain(merged);

        // The merged mesh should NOT be in the transparent cache
        const transparent: any[] = helper._transparentMeshesCache;
        expect(transparent).not.toContain(merged);

        // The merged mesh should have translucent material indices tracked
        const translucentIndices: Map<any, Set<number>> = helper._translucentMaterialIndices;
        expect(translucentIndices.has(merged)).toBe(true);
        expect(translucentIndices.get(merged)!.size).toBeGreaterThan(0);

        // The precomputed opaque-only submesh array should exist
        const opaqueOnlySubMeshes: Map<any, any[]> = helper._opaqueOnlySubMeshes;
        expect(opaqueOnlySubMeshes.has(merged)).toBe(true);

        // The opaque-only submeshes should exclude the translucent ones
        const opaqueOnly = opaqueOnlySubMeshes.get(merged)!;
        const allSubMeshes = merged!.subMeshes;
        expect(opaqueOnly.length).toBeLessThan(allSubMeshes.length);
        expect(opaqueOnly.length).toBeGreaterThan(0);

        // Verify no translucent submesh made it into the opaque-only array
        const tlIndices = translucentIndices.get(merged)!;
        for (const sm of opaqueOnly) {
            expect(tlIndices.has(sm.materialIndex)).toBe(false);
        }
    });

    it("should reclassify mesh when material changes", async () => {
        const gltf = buildTransmissionGltf();
        const result = await ImportMeshAsync(`data:${gltf}`, scene);

        // Wait for SetImmediate
        await new Promise((resolve) => setTimeout(resolve, 50));

        const helper = getTransmissionHelper(scene);
        const transparent: any[] = helper._transparentMeshesCache;

        // Find the transparent mesh
        const transmissiveMesh = transparent[0];
        expect(transmissiveMesh).toBeDefined();

        // Change the material to a plain PBR (no transmission)
        const plainMat = new PBRMaterial("plain", scene);
        transmissiveMesh.material = plainMat;

        // The mesh should now be reclassified to opaque
        const opaque: any[] = helper._opaqueMeshesCache;
        expect(opaque).toContain(transmissiveMesh);
        expect(transparent).not.toContain(transmissiveMesh);
    });

    it("should clean up tracking when merged mesh is disposed", async () => {
        const gltf = buildTransmissionGltf();
        const result = await ImportMeshAsync(`data:${gltf}`, scene);

        // Wait for SetImmediate
        await new Promise((resolve) => setTimeout(resolve, 50));

        const childMeshes = result.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
        const merged = Mesh.MergeMeshes(childMeshes, true, true, undefined, false, true);
        expect(merged).toBeDefined();

        // Wait for SetImmediate
        await new Promise((resolve) => setTimeout(resolve, 50));

        const helper = getTransmissionHelper(scene);
        expect(helper._translucentMaterialIndices.has(merged)).toBe(true);
        expect(helper._opaqueOnlySubMeshes.has(merged)).toBe(true);

        // Dispose the merged mesh
        merged!.dispose();

        // Tracking should be cleaned up
        expect(helper._translucentMaterialIndices.has(merged)).toBe(false);
        expect(helper._opaqueOnlySubMeshes.has(merged)).toBe(false);
        expect(helper._opaqueMeshesCache).not.toContain(merged);
    });
});
