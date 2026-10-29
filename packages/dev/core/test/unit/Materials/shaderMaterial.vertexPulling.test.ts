import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { type IEffectCreationOptions } from "core/Materials/effect";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { type Mesh } from "core/Meshes/mesh";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ShaderMaterial vertex pulling", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: Mesh;

    const createMaterial = (uniforms: string[]) => {
        const material = new ShaderMaterial(
            "vertexPulling",
            scene,
            { vertexSource: "void main() { gl_Position = vec4(0.); }", fragmentSource: "void main() { gl_FragColor = vec4(1.); }" },
            { attributes: ["position"], uniforms }
        );
        material.useVertexPulling = true;
        return material;
    };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.activeCamera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        mesh = CreateBox("box", {}, scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("does not add vertex pulling uniforms to the material options or the caller's array", () => {
        const callerUniforms = ["worldViewProjection", "custom"];
        const material = createMaterial(callerUniforms);
        const expected = ["worldViewProjection", "custom"];

        for (let i = 0; i < 10; i++) {
            material.isReady(mesh);
        }

        expect(material.options.uniforms).toEqual(expected);
        expect(callerUniforms).toEqual(expected);
        expect(material.options.uniforms.some((name) => name.startsWith("vp_"))).toBe(false);
    });

    it("still gives the effect the vertex pulling uniforms", () => {
        const material = createMaterial(["worldViewProjection"]);
        const createEffect = vi.spyOn(engine, "createEffect");

        material.isReady(mesh);

        expect(createEffect).toHaveBeenCalledTimes(1);
        const options = createEffect.mock.calls[0][1] as IEffectCreationOptions;
        expect(options.uniformsNames).toContain("vp_position_info");
        expect(options.uniformsNames).toContain("worldViewProjection");
    });
});
