import { NullEngine } from "core/Engines/nullEngine";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { Mesh } from "core/Meshes/mesh";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ShaderMaterial effect creation", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: ShaderMaterial;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new ShaderMaterial(
            "shader",
            scene,
            { vertexSource: "void main() { gl_Position = vec4(0.); }", fragmentSource: "void main() { gl_FragColor = vec4(1.); }" },
            { attributes: ["position"], uniforms: ["worldViewProjection"] },
            false
        );
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("checks readiness of a geometry-less mesh without effect observers", () => {
        const mesh = new Mesh("__root__", scene);

        expect(mesh.subMeshes).toBeUndefined();
        expect(() => material.isReady(mesh)).not.toThrow();
        expect(material.getEffect()).toBeDefined();
    });

    it("notifies effect observers with a null submesh for a geometry-less mesh", () => {
        const mesh = new Mesh("__root__", scene);
        const onEffectCreated = vi.fn();
        material.onEffectCreatedObservable.add(onEffectCreated);

        material.isReady(mesh);

        expect(onEffectCreated).toHaveBeenCalledOnce();
        expect(onEffectCreated.mock.calls[0][0]).toEqual({ effect: material.getEffect(), subMesh: null });
    });

    it("preserves the first submesh in effect notifications for meshes with geometry", () => {
        const mesh = CreateBox("box", {}, scene);
        const onEffectCreated = vi.fn();
        material.onEffectCreatedObservable.add(onEffectCreated);

        material.isReady(mesh);

        expect(onEffectCreated).toHaveBeenCalledOnce();
        expect(onEffectCreated.mock.calls[0][0]).toEqual({ effect: material.getEffect(), subMesh: mesh.subMeshes[0] });
    });
});
