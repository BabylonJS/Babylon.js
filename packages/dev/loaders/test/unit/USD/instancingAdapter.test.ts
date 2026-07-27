import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InstancedMesh } from "core/Meshes/instancedMesh.pure";
import { Mesh } from "core/Meshes/mesh.pure";
import { Scene } from "core/scene";
import { CreateInstance, CreatePointInstancerThinInstances } from "loaders/USD/adapter/instancingAdapter";
import { type IResolvedPointInstancer } from "loaders/USD/resolution/resolvedStage";

function createScene(): { engine: NullEngine; scene: Scene } {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    return { engine, scene };
}

function createPrototypeMesh(name: string, scene: Scene): Mesh {
    const mesh = new Mesh(name, scene);
    mesh.setVerticesData("position", [-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0]);
    mesh.setIndices([0, 1, 2]);
    return mesh;
}

function expectThinInstanceTranslation(matrixData: Float32Array, instanceIndex: number, x: number, y: number, z: number): void {
    const offset = instanceIndex * 16;
    expect(matrixData[offset + 12]).toBeCloseTo(x, 4);
    expect(matrixData[offset + 13]).toBeCloseTo(y, 4);
    expect(matrixData[offset + 14]).toBeCloseTo(z, 4);
}

describe("USD instancing adapter", () => {
    it("creates a Babylon instance from a source mesh", () => {
        const { engine, scene } = createScene();
        const sourceMesh = new Mesh("Prototype", scene);

        const instance = CreateInstance(sourceMesh, "Instance");

        expect(instance).toBeInstanceOf(InstancedMesh);
        expect(instance.sourceMesh).toBe(sourceMesh);

        scene.dispose();
        engine.dispose();
    });

    it("sets thin-instance matrices for visible PointInstancer instances", () => {
        const { engine, scene } = createScene();
        const prototypeMesh = createPrototypeMesh("Prototype", scene);
        const instancer: IResolvedPointInstancer = {
            prototypeMeshIndices: [0],
            protoIndices: new Int32Array([0, 0, 0]),
            positions: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
            ids: new Int32Array([10, 20, 30]),
            invisibleIds: new Int32Array([20]),
        };

        const instancedMeshes = CreatePointInstancerThinInstances(instancer, [prototypeMesh], scene);

        expect(instancedMeshes).toEqual([prototypeMesh]);
        expect(prototypeMesh.thinInstanceCount).toBe(2);
        const matrixData = prototypeMesh._thinInstanceDataStorage.matrixData!;
        expect(matrixData.length).toBe(32);
        expectThinInstanceTranslation(matrixData, 0, 1, 2, 3);
        expectThinInstanceTranslation(matrixData, 1, 7, 8, 9);

        scene.dispose();
        engine.dispose();
    });

    it("splits PointInstancer matrices across prototype meshes", () => {
        const { engine, scene } = createScene();
        const firstPrototype = createPrototypeMesh("FirstPrototype", scene);
        const secondPrototype = createPrototypeMesh("SecondPrototype", scene);
        const instancer: IResolvedPointInstancer = {
            prototypeMeshIndices: [0, 1],
            protoIndices: new Int32Array([0, 1, 0, 1]),
            positions: new Float32Array([0, 0, 0, 10, 0, 0, 0, 20, 0, 10, 20, 0]),
        };

        const instancedMeshes = CreatePointInstancerThinInstances(instancer, [firstPrototype, secondPrototype], scene);

        expect(instancedMeshes).toEqual([firstPrototype, secondPrototype]);
        expect(firstPrototype.thinInstanceCount).toBe(2);
        expect(secondPrototype.thinInstanceCount).toBe(2);

        const firstMatrixData = firstPrototype._thinInstanceDataStorage.matrixData!;
        expectThinInstanceTranslation(firstMatrixData, 0, 0, 0, 0);
        expectThinInstanceTranslation(firstMatrixData, 1, 0, 20, 0);

        const secondMatrixData = secondPrototype._thinInstanceDataStorage.matrixData!;
        expectThinInstanceTranslation(secondMatrixData, 0, 10, 0, 0);
        expectThinInstanceTranslation(secondMatrixData, 1, 10, 20, 0);

        scene.dispose();
        engine.dispose();
    });
});
