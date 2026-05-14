import { NullEngine } from "core/Engines/nullEngine";
import { Effect } from "core/Materials/effect";
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
});
