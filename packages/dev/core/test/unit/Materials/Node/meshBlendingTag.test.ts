import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Scene } from "core/scene";

describe("NodeMaterial mesh-blending tag output", () => {
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

    it("declares and writes the typed GLSL prepass output", async () => {
        const material = new NodeMaterial("nodeMaterial", scene);
        material.setToDefault();

        const buildPromise = new Promise<void>((resolve, reject) => {
            material.onBuildObservable.addOnce(() => resolve());
            material.onBuildErrorObservable.addOnce((error) => reject(new Error(error)));
        });
        material.build();
        await buildPromise;

        expect(material.compiledShaders).toContain("out highp uvec4 meshBlendTagOutput");
        expect(material.compiledShaders).toContain("writeGeometryFragmentOutput");
        expect(material.compiledShaders).toContain("meshBlendTagOutput = uvec4(uint(meshBlendTag), 0u, 0u, 0u)");
    });
});
