import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PrePassOutputBlock } from "core/Materials/Node/Blocks/Fragment/prePassOutputBlock";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialBuildState } from "core/Materials/Node/nodeMaterialBuildState";
import { NodeMaterialBuildStateSharedData } from "core/Materials/Node/nodeMaterialBuildStateSharedData";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Scene } from "core/scene";

class TestablePrePassOutputBlock extends PrePassOutputBlock {
    public build(state: NodeMaterialBuildState) {
        return this._buildBlock(state);
    }
}

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

    it("writes the typed GLSL tag from the prepass output block", () => {
        const block = new TestablePrePassOutputBlock("prePassOutput");
        const state = new NodeMaterialBuildState();
        state.sharedData = new NodeMaterialBuildStateSharedData();
        state.sharedData.nodeMaterial = new NodeMaterial("nodeMaterial", scene, { shaderLanguage: ShaderLanguage.GLSL });

        block.build(state);

        expect(state.compilationString).toContain("#ifdef PREPASS_MESH_BLEND_TAG");
        expect(state.compilationString).toContain("meshBlendTagOutput = uvec4(uint(meshBlendTag), 0u, 0u, 0u)");
    });
});
