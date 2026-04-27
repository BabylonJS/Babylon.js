import { NullEngine } from "core/Engines";
import { Mesh, MeshBuilder, SubMesh } from "core/Meshes";
import { MultiMaterial, StandardMaterial } from "core/Materials";
import { Scene } from "core/scene";

describe("Mesh.MergeMeshes", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("should merge meshes with multiMaterials and consolidate same-material submeshes", () => {
        const matA = new StandardMaterial("matA", scene);
        const matB = new StandardMaterial("matB", scene);

        const meshA = MeshBuilder.CreateBox("a", { size: 1 }, scene);
        const meshB = MeshBuilder.CreateBox("b", { size: 1 }, scene);
        const meshC = MeshBuilder.CreateBox("c", { size: 1 }, scene);
        const meshD = MeshBuilder.CreateBox("d", { size: 1 }, scene);
        const meshE = MeshBuilder.CreateBox("e", { size: 1 }, scene);

        meshA.material = matA;
        meshB.material = matA;
        meshC.material = matB;
        meshD.material = matB;
        meshE.material = matB;

        const merged = Mesh.MergeMeshes([meshA, meshB, meshC, meshD, meshE], true, true, undefined, false, true);

        expect(merged).not.toBeNull();
        // Should have 2 submeshes (one per distinct material), not 5
        expect(merged!.subMeshes.length).toBe(2);
        // Material should be a MultiMaterial with 2 sub-materials
        expect(merged!.material).toBeInstanceOf(MultiMaterial);
        const multiMat = merged!.material as MultiMaterial;
        expect(multiMat.subMaterials.length).toBe(2);
        expect(multiMat.subMaterials).toContain(matA);
        expect(multiMat.subMaterials).toContain(matB);
    });

    it("should merge meshes with multiMaterials when meshes are interleaved by material", () => {
        const matA = new StandardMaterial("matA", scene);
        const matB = new StandardMaterial("matB", scene);

        // Interleave materials: A, B, A, B, A
        const meshes: Mesh[] = [];
        for (let i = 0; i < 5; i++) {
            const m = MeshBuilder.CreateBox(`m${i}`, { size: 1 }, scene);
            m.material = i % 2 === 0 ? matA : matB;
            meshes.push(m);
        }

        const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, true);

        expect(merged).not.toBeNull();
        // Should still consolidate to 2 submeshes regardless of input order
        expect(merged!.subMeshes.length).toBe(2);
    });

    it("should handle single material with multiMaterials flag", () => {
        const mat = new StandardMaterial("mat", scene);

        const meshA = MeshBuilder.CreateBox("a", { size: 1 }, scene);
        const meshB = MeshBuilder.CreateBox("b", { size: 1 }, scene);
        meshA.material = mat;
        meshB.material = mat;

        const merged = Mesh.MergeMeshes([meshA, meshB], true, true, undefined, false, true);

        expect(merged).not.toBeNull();
        // Single material should produce a single submesh
        expect(merged!.subMeshes.length).toBe(1);
    });

    it("should preserve total index count after consolidation", () => {
        const matA = new StandardMaterial("matA", scene);
        const matB = new StandardMaterial("matB", scene);

        const meshA = MeshBuilder.CreateBox("a", { size: 1 }, scene);
        const meshB = MeshBuilder.CreateBox("b", { size: 1 }, scene);
        const meshC = MeshBuilder.CreateSphere("c", { diameter: 1 }, scene);

        meshA.material = matA;
        meshB.material = matA;
        meshC.material = matB;

        const totalIndicesBefore = meshA.getTotalIndices() + meshB.getTotalIndices() + meshC.getTotalIndices();

        const merged = Mesh.MergeMeshes([meshA, meshB, meshC], true, true, undefined, false, true);

        expect(merged).not.toBeNull();
        // Total indices across all submeshes should equal the sum of source indices
        const totalIndicesAfter = merged!.subMeshes.reduce((sum, sub) => sum + sub.indexCount, 0);
        expect(totalIndicesAfter).toBe(totalIndicesBefore);
    });

    it("should handle merging meshes that already have MultiMaterial", () => {
        const matA = new StandardMaterial("matA", scene);
        const matB = new StandardMaterial("matB", scene);
        const matC = new StandardMaterial("matC", scene);

        // Create a mesh with MultiMaterial (2 submeshes)
        const mesh1 = MeshBuilder.CreateBox("m1", { size: 1 }, scene);
        const multi1 = new MultiMaterial("multi1", scene);
        multi1.subMaterials = [matA, matB];
        mesh1.material = multi1;
        mesh1.subMeshes.length = 0;
        const totalIndices1 = mesh1.getTotalIndices();
        const halfIndices1 = Math.floor(totalIndices1 / 2);
        new SubMesh(0, 0, mesh1.getTotalVertices(), 0, halfIndices1, mesh1);
        new SubMesh(1, 0, mesh1.getTotalVertices(), halfIndices1, totalIndices1 - halfIndices1, mesh1);

        // Create a simple mesh with matC
        const mesh2 = MeshBuilder.CreateBox("m2", { size: 1 }, scene);
        mesh2.material = matC;

        const merged = Mesh.MergeMeshes([mesh1, mesh2], true, true, undefined, false, true);

        expect(merged).not.toBeNull();
        // Should have 3 submeshes (matA, matB, matC)
        expect(merged!.subMeshes.length).toBe(3);
        const multiMat = merged!.material as MultiMaterial;
        expect(multiMat.subMaterials.length).toBe(3);
    });
});
