import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VertexBuffer } from "core/Buffers/buffer";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { SubMesh } from "core/Meshes/subMesh";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import { Scene } from "core/scene";
import "core/Meshes/instancedMesh";

describe.each([false, true])("SolidParticleSystem winding (right-handed scene: %s)", (rightHanded) => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = rightHanded;
        new FreeCamera("camera", new Vector3(0, 0, -10), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function createModel(oppositeOrientation = false): Mesh {
        const mesh = new Mesh("model", scene);
        const data = new VertexData();
        data.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
        data.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1];
        data.indices = oppositeOrientation ? [0, 2, 1] : [0, 1, 2];
        data.applyToMesh(mesh);
        if (oppositeOrientation) {
            mesh.sideOrientation = mesh.sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        }
        return mesh;
    }

    function expectTrianglePositions(mesh: Mesh, model: Mesh, expectedIndices: number[]): void {
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        const modelPositions = model.getVerticesData(VertexBuffer.PositionKind)!;
        const indices = mesh.getIndices()!;
        expect(indices.length).toBe(expectedIndices.length);
        for (let i = 0; i < indices.length; i++) {
            for (let component = 0; component < 3; component++) {
                expect(positions[indices[i] * 3 + component]).toBeCloseTo(modelPositions[expectedIndices[i] * 3 + component], 6);
            }
        }
    }

    it.each([false, true])("normalizes model winding without changing source geometry (opposite orientation: %s)", (oppositeOrientation) => {
        const model = createModel(oppositeOrientation);
        const originalIndices = Array.from(model.getIndices()!);
        const originalNormals = Array.from(model.getVerticesData(VertexBuffer.NormalKind)!);
        const originalPositions = Array.from(model.getVerticesData(VertexBuffer.PositionKind)!);
        const system = new SolidParticleSystem("sps", scene);

        system.addShape(model, 1);
        const mesh = system.buildMesh();
        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.NormalKind)!)).toEqual(originalNormals);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(originalPositions);
        expect(Array.from(model.getIndices()!)).toEqual(originalIndices);
        expect(Array.from(model.getVerticesData(VertexBuffer.NormalKind)!)).toEqual(originalNormals);
    });

    it.each([false, true])("recomputes outward normals when the model has no normals (opposite orientation: %s)", (oppositeOrientation) => {
        const model = createModel(oppositeOrientation);
        model.removeVerticesData(VertexBuffer.NormalKind);
        const originalIndices = Array.from(model.getIndices()!);
        const system = new SolidParticleSystem("sps", scene);

        system.addShape(model, 1);
        expect(system.recomputeNormals).toBe(true);
        const mesh = system.buildMesh();
        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.NormalKind)!)).toEqual([0, 0, -1, 0, 0, -1, 0, 0, -1]);
        expect(model.getVerticesData(VertexBuffer.NormalKind)).toBeNull();
        expect(Array.from(model.getIndices()!)).toEqual(originalIndices);
    });

    it.each([1, -1])("does not use the source world determinant (%s) to determine local winding", (parentScale) => {
        const model = createModel(true);
        const parent = new Mesh("root", scene);
        parent.scaling.x = parentScale;
        parent.position.set(4, 5, 6);
        model.parent = parent;
        expect(model.computeWorldMatrix(true).determinant()).toBe(parentScale);
        const system = new SolidParticleSystem("sps", scene);

        system.addShape(model, 1);
        const mesh = system.buildMesh();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(Array.from(model.getVerticesData(VertexBuffer.PositionKind)!));
    });

    it("combines models with opposite winding conventions", () => {
        const system = new SolidParticleSystem("sps", scene);
        system.addShape(createModel(), 1);
        system.addShape(createModel(true), 1);

        expect(Array.from(system.buildMesh().getIndices()!)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it("uses the source mesh orientation when adding an instance", () => {
        const model = createModel(true);
        const instance = model.createInstance("instance");
        const system = new SolidParticleSystem("sps", scene);

        system.addShape(instance, 1);

        expect(Array.from(system.buildMesh().getIndices()!)).toEqual([0, 1, 2]);
        expect(Array.from(model.getIndices()!)).toEqual([0, 2, 1]);
    });

    it("keeps normalized indices when rebuilding after removing particles", () => {
        const system = new SolidParticleSystem("sps", scene, { expandable: true });
        system.addShape(createModel(true), 2);
        system.buildMesh();

        system.removeParticles(0, 0);

        expect(Array.from(system.buildMesh().getIndices()!)).toEqual([0, 1, 2]);
    });

    it("keeps normalized model indices when transferring particles", () => {
        const source = new SolidParticleSystem("source", scene, { expandable: true });
        source.addShape(createModel(true), 2);
        source.buildMesh();
        const particles = source.removeParticles(0, 0);
        const target = new SolidParticleSystem("target", scene, { expandable: true });

        target.insertParticlesFromArray(particles);

        expect(Array.from(target.buildMesh().getIndices()!)).toEqual([0, 1, 2]);
    });

    it("keeps normalized winding after depth sorting", () => {
        const system = new SolidParticleSystem("sps", scene, { enableDepthSort: true });
        system.addShape(createModel(true), 1);
        const mesh = system.buildMesh();

        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
    });

    it("composes model winding correction with negative particle scaling", () => {
        const system = new SolidParticleSystem("sps", scene, { autoFixFaceOrientation: true });
        system.addShape(createModel(true), 1);
        const mesh = system.buildMesh();
        system.particles[0].scaling.x = -1;

        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([1, 0, 2]);
    });

    it("normalizes immutable systems", () => {
        const system = new SolidParticleSystem("sps", scene, { updatable: false });
        system.addShape(createModel(true), 1);

        expect(Array.from(system.buildMesh().getIndices()!)).toEqual([0, 1, 2]);
    });

    it("normalizes winding when digesting a mesh", () => {
        const model = createModel(true);
        const system = new SolidParticleSystem("sps", scene);
        system.digest(model);
        const mesh = system.buildMesh();
        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
        expect(Array.from(mesh.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(Array.from(model.getVerticesData(VertexBuffer.PositionKind)!));
        expect(Array.from(model.getIndices()!)).toEqual([0, 2, 1]);
    });

    it("respects a source material orientation override", () => {
        const model = createModel(true);
        const material = new StandardMaterial("material", scene);
        model.material = material;
        material.sideOrientation = rightHanded ? Material.ClockWiseSideOrientation : Material.CounterClockWiseSideOrientation;
        const system = new SolidParticleSystem("sps", scene);

        system.addShape(model, 1);

        expect(Array.from(system.buildMesh().getIndices()!)).toEqual([0, 2, 1]);
    });

    it("does not compensate twice for an explicit orientation on a reused model material", () => {
        const model = createModel(true);
        const material = new StandardMaterial("material", scene);
        model.material = material;
        material.sideOrientation = model.sideOrientation;
        const system = new SolidParticleSystem("sps", scene, { useModelMaterial: true });

        system.addShape(model, 1);
        const mesh = system.buildMesh();
        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 2, 1]);
        expect(system.materials).toContain(material);
    });

    it.each(["mesh", "material", "default material"])("keeps a stable winding convention after changing the SPS %s orientation", (target) => {
        const model = createModel();
        const system = new SolidParticleSystem("sps", scene, { expandable: true });
        system.addShape(model, 1);
        const mesh = system.buildMesh();
        const oppositeOrientation = mesh.sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        if (target === "mesh") {
            mesh.sideOrientation = oppositeOrientation;
        } else {
            const material = target === "default material" ? scene.defaultMaterial : new StandardMaterial("target", scene);
            mesh.material = material;
            material.sideOrientation = oppositeOrientation;
        }

        system.addShape(model, 1);
        system.buildMesh();
        system.setParticles();

        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it.each(["addShape", "digest"])("resolves mixed submaterial orientations in %s", (method) => {
        const model = createModel(true);
        const data = new VertexData();
        data.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0];
        data.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
        data.indices = [0, 2, 1, 3, 4, 5];
        data.applyToMesh(model);
        const material = new MultiMaterial("multi", scene);
        const first = new StandardMaterial("first", scene);
        const second = new StandardMaterial("second", scene);
        first.sideOrientation = rightHanded ? Material.ClockWiseSideOrientation : Material.CounterClockWiseSideOrientation;
        second.sideOrientation = model.sideOrientation;
        material.subMaterials = [first, second];
        model.material = material;
        model.releaseSubMeshes();
        new SubMesh(0, 0, 3, 0, 3, model);
        new SubMesh(1, 3, 3, 3, 3, model);
        const system = new SolidParticleSystem("sps", scene);

        if (method === "addShape") {
            system.addShape(model, 1);
        } else {
            system.digest(model);
        }
        const mesh = system.buildMesh();
        system.setParticles();

        expectTrianglePositions(mesh, model, [0, 2, 1, 3, 5, 4]);
        expect(Array.from(model.getIndices()!)).toEqual([0, 2, 1, 3, 4, 5]);
    });

    it.each(["addShape", "digest"])("uses the shared scene default material orientation in %s", (method) => {
        const model = createModel(true);
        scene.defaultMaterial.sideOrientation = model.sideOrientation;
        const system = new SolidParticleSystem("sps", scene);

        if (method === "addShape") {
            system.addShape(model, 1);
        } else {
            system.digest(model);
        }
        const mesh = system.buildMesh();
        system.setParticles();

        expectTrianglePositions(mesh, model, [0, 2, 1]);
    });

    it.each(["addShape", "digest"])("uses the target default material when the source has an explicit material in %s", (method) => {
        const model = createModel();
        scene.defaultMaterial.sideOrientation =
            model.sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        const material = new StandardMaterial("source", scene);
        model.material = material;
        material.sideOrientation = model.sideOrientation;
        const system = new SolidParticleSystem("sps", scene);

        if (method === "addShape") {
            system.addShape(model, 1);
        } else {
            system.digest(model);
        }
        const mesh = system.buildMesh();
        system.setParticles();

        expectTrianglePositions(mesh, model, [0, 2, 1]);
    });
});
