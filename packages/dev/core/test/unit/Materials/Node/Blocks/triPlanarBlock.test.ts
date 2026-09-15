import { type NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialBuildState } from "core/Materials/Node/nodeMaterialBuildState";
import { NodeMaterialBuildStateSharedData } from "core/Materials/Node/nodeMaterialBuildStateSharedData";
import { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TriPlanarBlock } from "core/Materials/Node/Blocks/triPlanarBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type Texture } from "core/Materials/Textures/texture";

class TestableTriPlanarBlock extends TriPlanarBlock {
    public generateTextureLookup(state: NodeMaterialBuildState): void {
        this._generateTextureLookup(state);
    }
}

function generateTextureLookup(shaderLanguage: ShaderLanguage): string {
    const state = new NodeMaterialBuildState();
    state.sharedData = new NodeMaterialBuildStateSharedData();
    state.sharedData.nodeMaterial = { shaderLanguage } as NodeMaterial;

    const block = new TestableTriPlanarBlock("triPlanar");
    block.position.associatedVariableName = "position";
    block.normal.associatedVariableName = "normal";
    Object.assign(block, {
        _samplerName: "triPlanarSampler",
        _textureInfoName: "textureInfo",
        _textureInfoName2: "textureInfo2",
    });

    block.generateTextureLookup(state);
    return state.compilationString;
}

describe("TriPlanarBlock", () => {
    it("returns the texture connected to sourceZ instead of the sourceY texture", () => {
        const block = new TriPlanarBlock("triPlanar");
        const sourceY = new ImageSourceBlock("sourceY");
        const sourceZ = new ImageSourceBlock("sourceZ");
        const textureY = { getScene: () => null } as Texture;
        const textureZ = { getScene: () => null } as Texture;
        sourceY.texture = textureY;
        sourceZ.texture = textureZ;
        sourceY.source.connectTo(block.sourceY);
        sourceZ.source.connectTo(block.sourceZ!);

        expect(block.textureY).toBe(textureY);
        expect(block.textureZ).toBe(textureZ);
    });

    it("returns the sourceZ texture when sourceY is not connected", () => {
        const block = new TriPlanarBlock("triPlanar");
        const sourceZ = new ImageSourceBlock("sourceZ");
        const textureZ = { getScene: () => null } as Texture;
        sourceZ.texture = textureZ;
        sourceZ.source.connectTo(block.sourceZ!);

        expect(block.textureZ).toBe(textureZ);
    });

    it("generates native WGSL declarations, uniform references, and matrix constructors", () => {
        const shader = generateTextureLookup(ShaderLanguage.WGSL);

        expect(shader).toContain("var cosAngle: f32 = cos(uniforms.textureInfo.y);");
        expect(shader).toContain("var sinAngle: f32 = sin(uniforms.textureInfo.y);");
        expect(shader).toContain("var uvScale: vec2f = vec2f(uniforms.textureInfo2.z, uniforms.textureInfo2.w);");
        expect(shader).toContain("var offset: vec2f = vec2f(uniforms.textureInfo2.x, uniforms.textureInfo2.y);");
        expect(shader.match(/mat2x2f\(/g)).toHaveLength(3);
        expect(shader.match(/uniforms\.textureInfo\.[yzw]/g)).toHaveLength(6);
        expect(shader.match(/uniforms\.textureInfo2\.[xyzw]/g)).toHaveLength(4);
        expect(shader).not.toContain("mat2f(");
        expect(shader).not.toMatch(/\bfloat (?:cosAngle|sinAngle)\b/);
    });

    it("preserves GLSL declarations, uniform references, and matrix constructors", () => {
        const shader = generateTextureLookup(ShaderLanguage.GLSL);

        expect(shader).toContain("float cosAngle = cos(textureInfo.y);");
        expect(shader).toContain("float sinAngle = sin(textureInfo.y);");
        expect(shader).toContain("vec2 uvScale = vec2(textureInfo2.z, textureInfo2.w);");
        expect(shader).toContain("vec2 offset = vec2(textureInfo2.x, textureInfo2.y);");
        expect(shader.match(/mat2\(/g)).toHaveLength(3);
        expect(shader).not.toContain("uniforms.textureInfo");
        expect(shader).not.toContain("mat2x2f(");
    });
});
