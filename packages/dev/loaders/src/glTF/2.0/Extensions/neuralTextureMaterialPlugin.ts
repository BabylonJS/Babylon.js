import { MaterialPluginBase } from "core/Materials/materialPluginBase.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { type MaterialDefines } from "core/Materials/materialDefines";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type UniformBuffer } from "core/Materials/uniformBuffer";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralTexturePackedSize, GetNeuralTextureShader, PackNeuralTextureWeights } from "./neuralTextureShaders";
import { type NeuralTextureTiming } from "./neuralTextureTiming";

function HashString(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    }
    return hash >>> 1;
}

/** @internal */
export class NeuralTextureMaterialPlugin extends MaterialPluginBase {
    private _packedWeights: Float32Array;
    private _packedSize: number;
    private _layoutKey: number;
    private _extension: IBabylonMaterialsNeuralTexture;
    private _latents: BaseTexture[];
    private _timing?: NeuralTextureTiming;

    constructor(material: PBRMaterial, extension: IBabylonMaterialsNeuralTexture, latents: BaseTexture[], weights: Float32Array, timing?: NeuralTextureTiming) {
        super(material, "BABYLON_materials_neural_texture", 190, { NEURAL_WEIGHT_VEC4S: 0, NEURAL_LAYOUT: 0 }, false);
        this.doNotSerialize = true;
        this._extension = extension;
        this._latents = latents;
        this._timing = timing;
        this._packedWeights = PackNeuralTextureWeights(weights, extension.network.outputs);
        this._packedSize = GetNeuralTexturePackedSize(extension.network.outputs);
        // The uniform array size and the generated code depend on the network, and the compiled effect is cached by defines.
        this._layoutKey = HashString(JSON.stringify([extension.network.outputs, extension.outputs, extension.replacedSlots]));
        this._pluginManager._addPlugin(this);
        this._enable(true);
    }

    public override isCompatible(): boolean {
        return true;
    }

    public override prepareDefines(defines: MaterialDefines): void {
        defines["NEURAL_WEIGHT_VEC4S"] = this._packedSize;
        defines["NEURAL_LAYOUT"] = this._layoutKey;
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("neuralLatent0", "neuralLatent1", "neuralLatent2", "neuralLatent3");
    }

    public override getUniforms() {
        return {
            ubo: [
                { name: "neuralWeights", size: 4, type: "vec4", arraySize: this._packedSize },
                { name: "neuralNetworkSize", size: 1, type: "float" },
            ],
        };
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer): void {
        const start = this._timing ? performance.now() : 0;
        uniformBuffer.updateFloatArray("neuralWeights", this._packedWeights);
        uniformBuffer.updateFloat("neuralNetworkSize", 32);
        for (let i = 0; i < 4; i++) {
            uniformBuffer.setTexture(`neuralLatent${i}`, this._latents[i]);
        }
        this._timing?.("shaderWeightsUploadAndBind", start);
        this._timing = undefined;
    }

    public override getActiveTextures(activeTextures: BaseTexture[]): void {
        activeTextures.push(...this._latents);
    }

    public override hasTexture(texture: BaseTexture): boolean {
        return this._latents.includes(texture);
    }

    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL) {
        if (shaderType !== "fragment" || !this._extension) {
            return null;
        }
        const wgsl = shaderLanguage === ShaderLanguage.WGSL;
        const shader = GetNeuralTextureShader(this._extension, shaderLanguage, "uv");
        const outputs = this._extension.outputs;
        // Optional groups exist in the decoder only when the payload provides them.
        const optional = [outputs.emissive ? "emissive" : "", outputs.diffuse ? "diffuse" : "", outputs.specular ? "specGloss" : ""].filter(Boolean);
        const fields = ["baseColor", "normal", "orm", ...optional];
        const texelArguments = [
            "neuralBaseColor",
            "neuralNormal",
            "neuralORM",
            ...optional.map((field) => `neural${field === "specGloss" ? "SpecGloss" : field === "emissive" ? "Emissive" : "Diffuse"}`),
        ].join(", ");
        const structure = wgsl
            ? `struct NeuralTexel { ${fields.map((field) => `${field}: vec4f,`).join(" ")} };`
            : `struct NeuralTexel { ${fields.map((field) => `vec4 ${field};`).join(" ")} };`;
        const declarationsPoint = "!\\bprecision highp float;";
        const code: Record<string, string> = {
            [declarationsPoint]: wgsl ? "" : `precision highp float;\n${structure}`,
            CUSTOM_FRAGMENT_DEFINITIONS: wgsl
                ? `
${structure}
${shader.definitions}
var<private> neuralCachedUV: vec2f;
var<private> neuralCachedTexel: NeuralTexel;
fn decodeNeural(uv: vec2f) -> NeuralTexel {
${shader.main}
    return NeuralTexel(${texelArguments});
}
fn sampleNeural(uv: vec2f) -> NeuralTexel {
    if (all(uv == neuralCachedUV)) { return neuralCachedTexel; }
    return decodeNeural(uv);
}`
                : `
${shader.definitions}
vec2 neuralCachedUV;
NeuralTexel neuralCachedTexel;
NeuralTexel decodeNeural(vec2 uv) {
${shader.main}
    return NeuralTexel(${texelArguments});
}
NeuralTexel sampleNeural(vec2 uv) {
    if (all(equal(uv, neuralCachedUV))) { return neuralCachedTexel; }
    return decodeNeural(uv);
}`,
            CUSTOM_FRAGMENT_MAIN_BEGIN: `
neuralCachedUV = ${wgsl ? "fragmentInputs.vMainUV1" : "vMainUV1"};
neuralCachedTexel = decodeNeural(neuralCachedUV);`,
        };
        // The specular/glossiness workflow takes precedence over metallic/roughness for the shared samplers.
        const redirected = new Set<string>();
        for (const [slot, sampler, field] of [
            ["KHR_materials_pbrSpecularGlossiness.diffuseTexture", "albedo", "diffuse"],
            ["KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture", "reflectivity", "specGloss"],
            ["baseColorTexture", "albedo", "baseColor"],
            ["normalTexture", "bump", "normal"],
            ["occlusionTexture", "ambient", "orm"],
            ["metallicRoughnessTexture", "reflectivity", "orm"],
            ["emissiveTexture", "emissive", "emissive"],
        ] as const) {
            if (this._extension.replacedSlots.includes(slot) && !redirected.has(sampler)) {
                redirected.add(sampler);
                const sample = `sampleNeural${sampler}`;
                if (wgsl) {
                    code.CUSTOM_FRAGMENT_DEFINITIONS += `\nfn ${sample}(uv: vec2f) -> vec4f { return sampleNeural(uv).${field}; }\n`;
                } else {
                    // Bump/parallax functions precede CUSTOM_FRAGMENT_DEFINITIONS.
                    code[declarationsPoint] += `\nvec4 ${sample}(vec2 uv);\n`;
                    code.CUSTOM_FRAGMENT_DEFINITIONS += `\nvec4 ${sample}(vec2 uv) { return sampleNeural(uv).${field}; }\n`;
                }
                // MaterialPluginBase runs this after includes, only for this PBR material.
                // Replace just the call prefix: nested UV expressions, offsets, swizzles,
                // and terminators survive, including direct parallax/debug normal reads.
                const functions = wgsl ? "TEXRD|textureSample" : "TEXRD|texture2D";
                const samplerArgument = wgsl ? `\\s*${sampler}SamplerSampler\\s*,` : "";
                code[`!\\b(?:${functions})\\s*\\(\\s*${sampler}Sampler\\s*,${samplerArgument}\\s*`] = `${sample}(`;
            }
        }
        return code;
    }
}
