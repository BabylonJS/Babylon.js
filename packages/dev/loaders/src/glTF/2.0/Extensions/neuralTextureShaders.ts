import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";

/**
 * Number of vec4 in the packed weights: 25 rows of 8 groups, 33 rows of 8 groups, and 33 rows of ceil(outputs / 4) groups.
 * 563 for the 9 outputs of babylon-ntc-v1, 629 for 20 outputs.
 * @internal
 */
export function GetNeuralTexturePackedSize(outputs: number): number {
    return 25 * 8 + 33 * 8 + 33 * Math.ceil(outputs / 4);
}

/** @internal */
export function PackNeuralTextureWeights(weights: Float32Array, outputCount = 9): Float32Array {
    const packed = new Float32Array(GetNeuralTexturePackedSize(outputCount) * 4);
    let destination = 0;
    for (const [inputs, outputs, weightOffset, biasOffset] of [
        [24, 32, 0, 768],
        [32, 32, 800, 1824],
        [32, outputCount, 1856, 1856 + 32 * outputCount],
    ]) {
        const groups = Math.ceil(outputs / 4);
        for (let i = 0; i <= inputs; i++) {
            for (let group = 0; group < groups; group++) {
                for (let c = 0; c < 4; c++) {
                    const j = group * 4 + c;
                    packed[destination++] = j < outputs ? weights[i === inputs ? biasOffset + j : weightOffset + i * outputs + j] : 0;
                }
            }
        }
    }
    return packed;
}

/**
 * Shared decoder for fragment injection, fragment baking and compute baking.
 * The caller supplies the UV and packed weight expressions appropriate to its stage.
 * @internal
 */
export function GetNeuralTextureShader(
    extension: IBabylonMaterialsNeuralTexture,
    shaderLanguage: ShaderLanguage,
    uv: string,
    weights = shaderLanguage === ShaderLanguage.WGSL ? "uniforms.neuralWeights" : "neuralWeights",
    networkSize = shaderLanguage === ShaderLanguage.WGSL ? "uniforms.neuralNetworkSize" : "neuralNetworkSize",
    unroll = false
): { definitions: string; functions: string; main: string } {
    const wgsl = shaderLanguage === ShaderLanguage.WGSL;
    const vec2 = wgsl ? "vec2f" : "vec2";
    const vec4 = wgsl ? "vec4f" : "vec4";
    const variable = (name: string, value: string) => (wgsl ? `var ${name}: ${vec4} = ${value};` : `${vec4} ${name} = ${value};`);
    const sample = (index: number) => `neuralSampleBilinear(neuralLatent${index}, neuralUV)`;
    // Filtering UNORM8 textures in hardware can round interpolated values before
    // inference. FP32 bilerp matches the codec, especially near normal Z = 0.
    const functions = wgsl
        ? `
fn neuralSampleBilinear(source: texture_2d<f32>, uv: vec2f) -> vec4f {
    let size = vec2i(textureDimensions(source, 0));
    let position = fract(uv) * vec2f(size) - vec2f(0.5);
    let cell = vec2i(floor(position));
    let fraction = fract(position);
    let a = (cell + size) % size;
    let b = (cell + vec2i(1)) % size;
    return mix(mix(textureLoad(source, a, 0), textureLoad(source, vec2i(b.x, a.y), 0), fraction.x),
               mix(textureLoad(source, vec2i(a.x, b.y), 0), textureLoad(source, b, 0), fraction.x), fraction.y);
}
`
        : `
vec4 neuralSampleBilinear(sampler2D source, vec2 uv) {
    ivec2 size = textureSize(source, 0);
    vec2 position = fract(uv) * vec2(size) - vec2(0.5);
    ivec2 cell = ivec2(floor(position));
    vec2 fraction = fract(position);
    ivec2 a = (cell + size) % size;
    ivec2 b = (cell + ivec2(1)) % size;
    return mix(mix(texelFetch(source, a, 0), texelFetch(source, ivec2(b.x, a.y), 0), fraction.x),
               mix(texelFetch(source, ivec2(a.x, b.y), 0), texelFetch(source, b, 0), fraction.x), fraction.y);
}
`;
    let definitions = functions;
    let main = wgsl ? `let neuralUV = ${uv};\n` : `vec2 neuralUV = ${uv};\n`;
    for (let i = 0; i < 4; i++) {
        definitions += wgsl ? `var neuralLatent${i}: texture_2d<f32>;\nvar neuralLatent${i}Sampler: sampler;\n` : `uniform sampler2D neuralLatent${i};\n`;
        main += variable(`neuralInput${i}`, sample(i)) + "\n";
    }
    main += wgsl
        ? `let neuralPhase = fract(neuralUV * vec2f(textureDimensions(neuralLatent0, 0))) * 6.28318530718;\n`
        : `${vec2} neuralPhase = fract(neuralUV * vec2(textureSize(neuralLatent0, 0))) * 6.28318530718;\n`;
    main += variable("neuralInput4", `${vec4}(sin(neuralPhase.x), sin(neuralPhase.y), cos(neuralPhase.x), cos(neuralPhase.y))`) + "\n";
    main += variable("neuralInput5", `${vec4}(sin(2.0 * neuralPhase.x), sin(2.0 * neuralPhase.y), cos(2.0 * neuralPhase.x), cos(2.0 * neuralPhase.y))`) + "\n";
    if (!unroll) {
        main += wgsl ? "var neuralInputs: array<vec4f, 6>;\n" : "vec4 neuralInputs[6];\n";
        for (let i = 0; i < 6; i++) {
            main += `neuralInputs[${i}] = neuralInput${i};\n`;
        }
    }
    let weightOffset = 0;
    let previous = unroll ? "neuralInput" : "neuralInputs";
    let outputName = "";
    for (let layer = 0; layer < 3; layer++) {
        const inputs = layer === 0 ? 24 : 32;
        const groups = layer === 2 ? Math.ceil(extension.network.outputs / 4) : 8;
        if (unroll) {
            outputName = `neuralLayer${layer}_`;
            for (let group = 0; group < groups; group++) {
                main += variable(`${outputName}${group}`, `${weights}[${weightOffset + inputs * groups + group}]`) + "\n";
                for (let input = 0; input < inputs; input++) {
                    main += `${outputName}${group} += ${previous}${Math.floor(input / 4)}.${"xyzw"[input % 4]} * ${weights}[${weightOffset + input * groups + group}];\n`;
                }
                main += `${outputName}${group} = ${layer === 2 ? "clamp" : "max"}(${outputName}${group}, ${vec4}(0.0)${layer === 2 ? `, ${vec4}(1.0)` : ""});\n`;
            }
            weightOffset += (inputs + 1) * groups;
            previous = outputName;
            continue;
        }
        outputName = `neuralLayer${layer}`;
        main += wgsl ? `var ${outputName}: array<vec4f, ${groups}>;\n` : `vec4 ${outputName}[${groups}];\n`;
        for (let group = 0; group < groups; group++) {
            main += `${outputName}[${group}] = ${weights}[${weightOffset + inputs * groups + group}];\n`;
        }
        // A uniform bound prevents ANGLE/D3D from expanding nested constant loops
        // back into enormous shaders. Output groups stay explicit vector operations.
        const limit = `${wgsl ? "i32" : "int"}(${networkSize})${inputs === 24 ? " - 8" : ""}`;
        main += `for (${wgsl ? "var inputIndex: i32" : "int inputIndex"} = 0; inputIndex < ${limit}; inputIndex++) {\n`;
        main += `${wgsl ? "let" : "float"} neuralValue = ${previous}[inputIndex / 4][inputIndex % 4];\n`;
        for (let group = 0; group < groups; group++) {
            main += `${outputName}[${group}] += neuralValue * ${weights}[${weightOffset + group} + inputIndex * ${groups}];\n`;
        }
        main += "}\n";
        for (let group = 0; group < groups; group++) {
            main += `${outputName}[${group}] = ${layer === 2 ? "clamp" : "max"}(${outputName}[${group}], ${vec4}(0.0)${layer === 2 ? `, ${vec4}(1.0)` : ""});\n`;
        }
        weightOffset += (inputs + 1) * groups;
        previous = outputName;
    }
    const channel = (index: number) => `${outputName}${unroll ? Math.floor(index / 4) : `[${Math.floor(index / 4)}]`}.${"xyzw"[index % 4]}`;
    const outputs = extension.outputs;
    const color = (channels: number[] | undefined, fallback: string) => {
        if (!channels) {
            return `${vec4}(${fallback})`;
        }
        return `${vec4}(${channels.map(channel).join(", ")}${channels.length === 3 ? ", 1.0" : ""})`;
    };
    main += variable("neuralBaseColor", color(outputs.baseColor, "1.0")) + "\n";
    main += variable("neuralNormal", `${vec4}(${outputs.normal?.map(channel).join(", ") ?? "0.5, 0.5"}, 0.0, 1.0)`) + "\n";
    main += `neuralNormal.z = sqrt(max(0.0, 1.0 - dot(neuralNormal.xy * 2.0 - ${vec2}(1.0), neuralNormal.xy * 2.0 - ${vec2}(1.0)))) * 0.5 + 0.5;\n`;
    main +=
        variable(
            "neuralORM",
            `${vec4}(${outputs.occlusion ? channel(outputs.occlusion[0]) : "1.0"}, ${outputs.roughness ? channel(outputs.roughness[0]) : "1.0"}, ${outputs.metallic ? channel(outputs.metallic[0]) : "1.0"}, 1.0)`
        ) + "\n";
    if (outputs.emissive) {
        main += variable("neuralEmissive", color(outputs.emissive, "0.0, 0.0, 0.0, 1.0")) + "\n";
    }
    if (outputs.diffuse) {
        main += variable("neuralDiffuse", color(outputs.diffuse, "1.0")) + "\n";
    }
    if (outputs.specular) {
        main += variable("neuralSpecGloss", `${vec4}(${outputs.specular.map(channel).join(", ")}, ${outputs.glossiness ? channel(outputs.glossiness[0]) : "1.0"})`) + "\n";
    }
    return { definitions, functions, main };
}
