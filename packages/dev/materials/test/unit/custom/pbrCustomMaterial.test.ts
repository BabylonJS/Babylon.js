import { NullEngine } from "core/Engines/nullEngine";
import { Effect } from "core/Materials/effect";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { PBRCustomMaterial } from "materials/custom/pbrCustomMaterial";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("PBRCustomMaterial", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: PBRCustomMaterial;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new PBRCustomMaterial("custom", scene);
    });

    afterEach(() => {
        delete Effect.ShadersStore[material._createdShaderName + "VertexShader"];
        delete Effect.ShadersStore[material._createdShaderName + "PixelShader"];
        scene.dispose();
        engine.dispose();
    });

    it("removes generated shader source entries when disposed", () => {
        const shaderName = material.Builder("", [], [], [], []);

        expect(Effect.ShadersStore[shaderName + "VertexShader"]).toBeDefined();
        expect(Effect.ShadersStore[shaderName + "PixelShader"]).toBeDefined();

        material.dispose(true, true);

        expect(Effect.ShadersStore[shaderName + "VertexShader"]).toBeUndefined();
        expect(Effect.ShadersStore[shaderName + "PixelShader"]).toBeUndefined();
    });

    it("releases a previous custom effect when a new custom effect is created for the same submesh", () => {
        const shaderName = material.Builder("", [], [], [], []);
        const mesh = MeshBuilder.CreateBox("box", {}, scene);
        const subMesh = mesh.subMeshes[0];
        const shaderSource = {
            vertexSource: "void main(void) { gl_Position = vec4(0.0); }",
            fragmentSource: "void main(void) { gl_FragColor = vec4(1.0); }",
            vertexToken: shaderName,
            fragmentToken: shaderName,
        };
        const firstEffect = engine.createEffect(
            shaderSource,
            {
                attributes: [],
                uniformsNames: [],
                samplers: [],
                defines: "#define FIRST",
                fallbacks: null,
                onCompiled: null,
                onError: null,
            },
            engine
        );
        const secondEffect = engine.createEffect(
            shaderSource,
            {
                attributes: [],
                uniformsNames: [],
                samplers: [],
                defines: "#define SECOND",
                fallbacks: null,
                onCompiled: null,
                onError: null,
            },
            engine
        );

        subMesh.setEffect(firstEffect);
        material.onEffectCreatedObservable.notifyObservers({ effect: secondEffect, subMesh });

        expect(firstEffect.isDisposed).toBe(true);
        expect(secondEffect.isDisposed).toBe(false);
    });
});
