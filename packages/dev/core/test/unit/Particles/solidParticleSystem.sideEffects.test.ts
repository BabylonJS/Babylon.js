import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("SolidParticleSystem without StandardMaterial registration", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it.each([
        ["addShape", false],
        ["addShape", true],
        ["digest", false],
        ["digest", true],
    ] as const)("copies explicit-material geometry with %s (useModelMaterial: %s)", async (method, useModelMaterial) => {
        const { NullEngine } = await import("core/Engines/nullEngine");
        const { Scene } = await import("core/scene");
        const { Mesh } = await import("core/Meshes/mesh");
        const { VertexData } = await import("core/Meshes/mesh.vertexData");
        const { ShaderMaterial } = await import("core/Materials/shaderMaterial.pure");
        const { Material } = await import("core/Materials/material.pure");
        const { SolidParticleSystem } = await import("core/Particles/solidParticleSystem");
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const factory = Scene.DefaultMaterialFactory;

        try {
            expect(scene._hasDefaultMaterial).toBe(false);
            expect(() => factory(scene)).toThrow();
            const model = new Mesh("model", scene);
            const data = new VertexData();
            data.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
            data.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1];
            data.indices = [0, 2, 1];
            data.applyToMesh(model);
            model.sideOrientation = Material.ClockWiseSideOrientation;
            const material = new ShaderMaterial("explicit", scene, { vertexSource: "", fragmentSource: "" });
            model.material = material;
            const system = new SolidParticleSystem("sps", scene, { useModelMaterial });

            if (method === "addShape") {
                system.addShape(model, 1);
            } else {
                system.digest(model);
            }
            const mesh = system.buildMesh();
            system.setParticles();

            expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2]);
            expect(scene._hasDefaultMaterial).toBe(false);
            expect(Scene.DefaultMaterialFactory).toBe(factory);
            expect(() => factory(scene)).toThrow();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
