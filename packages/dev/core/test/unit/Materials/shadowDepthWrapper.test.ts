import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ShaderStore } from "core/Engines/shaderStore";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShadowDepthWrapper, type IIOptionShadowDepthMaterial } from "core/Materials/shadowDepthWrapper";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import "core/ShadersWGSL/default.vertex";
import "core/ShadersWGSL/pbr.vertex";
import "core/ShadersWGSL/openpbr.vertex";
import "core/ShadersWGSL/shadowMap.vertex";
import "core/ShadersWGSL/shadowMap.fragment";
import "core/ShadersWGSL/ShadersInclude/shadowMapFragmentSoftTransparentShadow";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";

describe("ShadowDepthWrapper normal bias", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    async function createDepthEffect(vertexSource: string, shaderLanguage = ShaderLanguage.WGSL, options?: IIOptionShadowDepthMaterial) {
        const mesh = CreateBox("box", {}, scene);
        const material = new ShaderMaterial(
            "base",
            scene,
            {
                vertexSource,
                fragmentSource:
                    shaderLanguage === ShaderLanguage.WGSL
                        ? "@fragment fn main(input: FragmentInputs) -> FragmentOutputs { fragmentOutputs.color = vec4f(1.0); }"
                        : "void main() { gl_FragColor = vec4(1.0); }",
            },
            { attributes: ["position", "normal"], uniforms: [], shaderLanguage }
        );
        mesh.material = material;
        const wrapper = (material.shadowDepthWrapper = new ShadowDepthWrapper(material, scene, options));
        const subMesh = mesh.subMeshes[0];
        await vi.waitFor(() => expect(material.isReadyForSubMesh(mesh, subMesh)).toBe(true));

        const generator = vi.mockObject(ShadowGenerator.prototype);
        const defines = ["#define SM_NORMALBIAS 1", "#define SM_DIRECTIONINLIGHTDATA 1", "#define SM_USEDISTANCE 0", "#define SM_FLOAT 1"];
        await vi.waitFor(() => expect(wrapper.isReadyForSubMesh(subMesh, defines, generator, false, 0)).toBe(true));
        return wrapper.getEffect(subMesh, generator, 0)!.effect!.vertexSourceCodeBeforeMigration;
    }

    it.each(["default", "pbr", "openpbr"])("uses the world-normal varying for the WGSL %s shader", async (name) => {
        const code = await createDepthEffect(ShaderStore.ShadersStoreWGSL[`${name}VertexShader`]);

        expect(code).toMatch(/dot\(vertexOutputs\.vNormalW,\s*worldLightDirSM\)/);
        expect(code).toMatch(/worldPos\.xyz\s*-\s*vertexOutputs\.vNormalW\s*\*\s*normalBiasSM/);
        expect(code).not.toMatch(/dot\(vNormalW,/);
    });

    it("preserves explicit normal remaps without mutating the caller's options", async () => {
        const remappedVariables = ["vNormalW", "customNormal"];
        const code = await createDepthEffect(ShaderStore.ShadersStoreWGSL["pbrVertexShader"], ShaderLanguage.WGSL, { remappedVariables });

        expect(code).toMatch(/dot\(customNormal,\s*worldLightDirSM\)/);
        expect(code).not.toContain("vertexOutputs.customNormal");
        expect(remappedVariables).toEqual(["vNormalW", "customNormal"]);
    });

    it("adds the default normal remap alongside a world-position remap", async () => {
        const remappedVariables = ["worldPos", "customWorldPos"];
        const code = await createDepthEffect(ShaderStore.ShadersStoreWGSL["pbrVertexShader"], ShaderLanguage.WGSL, { remappedVariables });

        expect(code).toMatch(/dot\(vertexOutputs\.vNormalW,\s*worldLightDirSM\)/);
        expect(code).toMatch(/customWorldPos\.xyz\s*-\s*vertexOutputs\.vNormalW\s*\*\s*normalBiasSM/);
        expect(remappedVariables).toEqual(["worldPos", "customWorldPos"]);
    });

    it("does not inject normal bias when code injection is disabled", async () => {
        const code = await createDepthEffect(ShaderStore.ShadersStoreWGSL["pbrVertexShader"], ShaderLanguage.WGSL, { doNotInjectCode: true });

        expect(code).toContain("#define CUSTOM_VERTEX_UPDATE_WORLDPOS");
        expect(code).not.toContain("ndlSM");
    });

    it("keeps local normals in custom WGSL shaders", async () => {
        const vertexSource = `
@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    var worldPos = vec4f(0.0, 0.0, 0.0, 1.0);
    var vNormalW = vec3f(0.0, 1.0, 0.0);
#define SHADOWDEPTH_NORMALBIAS
    vertexOutputs.position = worldPos;
}`;
        const code = await createDepthEffect(vertexSource);

        expect(code).toMatch(/dot\(vNormalW,\s*worldLightDirSM\)/);
        expect(code).not.toContain("vertexOutputs.vNormalW");
    });

    it.each(["var", "let", "const", "var<function>"])("keeps a %s normal when its output varying is assigned after the bias hook", async (declaration) => {
        const code = await createDepthEffect(`
varying vNormalW: vec3f;
@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    var worldPos = vec4f(0.0, 0.0, 0.0, 1.0);
    ${declaration} vNormalW = vec3f(0.0, 1.0, 0.0);
#define SHADOWDEPTH_NORMALBIAS
    vertexOutputs.vNormalW = vNormalW;
    vertexOutputs.position = worldPos;
}`);

        expect(code).toMatch(/dot\(vNormalW,\s*worldLightDirSM\)/);
        expect(code).toMatch(/worldPos\.xyz\s*-\s*vNormalW\s*\*\s*normalBiasSM/);
        expect(code).not.toMatch(/dot\(vertexOutputs\.vNormalW,/);
    });

    it("does not remap GLSL normals", async () => {
        const code = await createDepthEffect(
            `varying vec3 vNormalW;
void main() {
    vec4 worldPos = vec4(0.0, 0.0, 0.0, 1.0);
    vNormalW = vec3(0.0, 1.0, 0.0);
#define CUSTOM_VERTEX_UPDATE_WORLDPOS
    gl_Position = worldPos;
}`,
            ShaderLanguage.GLSL
        );

        expect(code).toMatch(/dot\(vNormalW,\s*worldLightDirSM\)/);
        expect(code).not.toContain("vertexOutputs.vNormalW");
    });
});
