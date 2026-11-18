import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { Material } from "core/Materials/material";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Scene } from "core/scene";

// a plugin with a uniform of each kind the declarations write: a vector, an array, a matrix and a float
class TestPlugin extends MaterialPluginBase {
    constructor(material: Material, name: string) {
        super(material, name, 200, undefined, true, true);
    }

    public override isCompatible(): boolean {
        return true;
    }

    public override getUniforms() {
        return {
            ubo: [
                { name: `${this.name}Color`, size: 4, type: "vec4" },
                { name: `${this.name}Weights`, size: 4, type: "vec4", arraySize: 2 },
                { name: `${this.name}Matrix`, size: 16, type: "mat4" },
                { name: `${this.name}Scale`, size: 1, type: "float" },
            ],
            vertex: `// ${this.name} vertex`,
            fragment: `// ${this.name} fragment`,
        };
    }
}

describe("MaterialPluginManager declarations", () => {
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

    const material = (shaderLanguage: ShaderLanguage) => {
        const material = new Material("material", scene);
        (material as any)._shaderLanguage = shaderLanguage;
        new TestPlugin(material, "a");
        new TestPlugin(material, "b");
        return material;
    };

    const declarations = (material: Material) => {
        material.buildUniformLayout();
        const manager = material.pluginManager as any;
        return [manager._uboDeclaration, manager._vertexDeclaration, manager._fragmentDeclaration];
    };

    it("declares the uniforms of the plugins in their order, in GLSL", () => {
        expect(declarations(material(ShaderLanguage.GLSL))).toEqual([
            "vec4 aColor;\nvec4 aWeights[2];\nmat4 aMatrix;\nfloat aScale;\nvec4 bColor;\nvec4 bWeights[2];\nmat4 bMatrix;\nfloat bScale;\n",
            "// a vertex\n// b vertex\n",
            "// a fragment\n// b fragment\n",
        ]);
    });

    it("declares the uniforms of the plugins in their order, in WGSL", () => {
        expect(declarations(material(ShaderLanguage.WGSL))).toEqual([
            "uniform aColor: vec4f;\nuniform aWeights: array<vec4f, 2>;\nuniform aMatrix: mat4x4f;\nuniform aScale: f32;\n" +
                "uniform bColor: vec4f;\nuniform bWeights: array<vec4f, 2>;\nuniform bMatrix: mat4x4f;\nuniform bScale: f32;\n",
            "// a vertex\n// b vertex\n",
            "// a fragment\n// b fragment\n",
        ]);
    });

    it("declares them again, not twice, when the layout is built again", () => {
        const target = material(ShaderLanguage.GLSL);
        const first = declarations(target);

        expect(declarations(target)).toEqual(first);
    });
});
