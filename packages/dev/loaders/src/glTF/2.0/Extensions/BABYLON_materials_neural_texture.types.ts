import { type ITextureInfo } from "babylonjs-gltf2interface";

/** glTF texture slots that the experimental neural codec can replace. */
export type NeuralTextureSlot =
    | "baseColorTexture"
    | "normalTexture"
    | "occlusionTexture"
    | "metallicRoughnessTexture"
    | "emissiveTexture"
    | "KHR_materials_pbrSpecularGlossiness.diffuseTexture"
    | "KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture";

/** Codec identifiers understood by the loader. Other identifiers fall back to the placeholder textures. */
export type NeuralTextureCodec = "babylon-ntc-v1" | "babylon-ntc-v2" | "babylon-ntc-v4";

/**
 * Network output channels for each material property group. A group is either the explicit list of output
 * indices (always the form of babylon-ntc-v1) or, for babylon-ntc-v2 and babylon-ntc-v4, a [startChannel, componentCount] pair.
 */
export type NeuralTextureOutputs = Partial<Record<"baseColor" | "normal" | "occlusion" | "roughness" | "metallic" | "emissive" | "diffuse" | "specular" | "glossiness", number[]>>;

/** One latent grid of a babylon-ntc-v4 payload. */
export interface INeuralTextureV4Grid {
    /** Level-0 size of the grid. */
    resolution: [number, number];
    /** Latent channels of every cell. */
    channels: number;
    /** Bits per latent channel: 2 or 4. */
    bits: 2 | 4;
    /** Grid 0 is "concat2x2" (the four neighbouring cells are concatenated), grid 1 is "bilinear". */
    sampling: "concat2x2" | "bilinear";
    /** Indices into latentTextures of the RGBA8 atlas images holding the packed cells. */
    textures: number[];
}

/** One logical output channel of a babylon-ntc-v4 payload: a network output with its activation, or a constant. */
export type NeuralTextureV4Channel = { net: number; activation: "none" | "sigmoid" } | { const: number };

/** JSON payload for the experimental BABYLON_materials_neural_texture extension. */
export interface IBabylonMaterialsNeuralTexture {
    /** Extension version. */
    version: 1;
    /** Codec identifier. babylon-ntc-v1 is fixed to 9 outputs; babylon-ntc-v2 and babylon-ntc-v4 have a variable number of outputs. */
    codec: NeuralTextureCodec;
    /** Decoded image width and height. */
    resolution: [number, number];
    /** High latent grid dimensions (babylon-ntc-v1 and v2). */
    hiResolution?: [number, number];
    /** Low latent grid dimensions (babylon-ntc-v1 and v2). */
    loResolution?: [number, number];
    /** Channels in each latent grid (babylon-ntc-v1 and v2). */
    latentChannels?: 8;
    /** babylon-ntc-v1/v2: high RGBA, high RGBA, low RGBA, low RGBA. babylon-ntc-v4: the RGBA8 atlas images referenced by grids[].textures. */
    latentTextures: ITextureInfo[];
    /** babylon-ntc-v4: number of mip levels of the decoded textures, floor(log2(max(width, height))) + 1. */
    mipCount?: number;
    /** babylon-ntc-v4: number of latent pyramid levels. */
    levels?: number;
    /** babylon-ntc-v4: the concat2x2 grid, then the bilinear grid. */
    grids?: INeuralTextureV4Grid[];
    /**
     * babylon-ntc-v1/v2: little-endian, input-major float32 network parameters: 1856 + 33 * outputs for babylon-ntc-v2 (2153 for babylon-ntc-v1).
     * babylon-ntc-v4: little-endian float16 parameters, byteLength bytes, per layer [out][inStride] weights then the biases.
     */
    weights: { bufferView: number; componentType?: 5126; count?: number; byteLength?: number };
    /** Network architecture. */
    network: {
        inputs: number;
        hidden: number[];
        outputs: number;
        activation: "relu" | "hardgelu";
        positionalEncoding?: { frequencies?: [1, 2]; scale?: "hiResolution"; type?: "triangle"; periods?: number[] };
        weightLayout?: string;
        /** babylon-ntc-v4 */
        inputLayout?: string[];
        /** babylon-ntc-v4 */
        weightFormat?: "float16";
        /** babylon-ntc-v4 */
        layers?: Array<{ in: number; inStride: number; out: number }>;
    };
    /** babylon-ntc-v4: the logical output channels, in the canonical order. */
    channels?: NeuralTextureV4Channel[];
    /** Network output channels of each property group. */
    outputs: NeuralTextureOutputs;
    /** Only these texture slots are replaced. All material factors still apply. */
    replacedSlots: NeuralTextureSlot[];
}
declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /** Options for the experimental neural material texture extension. */
        ["BABYLON_materials_neural_texture"]: Partial<{
            /** Evaluate the network per fragment instead of decoding regular textures at load time. Default: false. Requires WebGL 2 or WebGPU. */
            decodeInShader: boolean;
            /** Allow the slower CPU decoder if GPU baking is unavailable or fails. Default: false. */
            allowCPUFallback: boolean;
            /** babylon-ntc-v4 only. Mip levels of the load-time bake: "generate" decodes level 0 and generates the others, "neural" decodes every level with the network. Default: "generate". */
            bakeMips: "generate" | "neural";
            /** babylon-ntc-v4 only. Filtering of the per-fragment decode when decodeInShader is true. Default: "bilinear". */
            runtimeFilter: "bilinear" | "nearest" | "trilinear" | "stochastic";
            /** babylon-ntc-v4 only. Bias added to the mip level that the per-fragment decode selects. Default: 0. */
            lodBias: number;
            /** babylon-ntc-v4 only. Network parameters of the per-fragment decode: RGBA16F "texture" fetches or a fp32 "uniform" buffer (falls back to the texture above the device limit). Default: "texture". */
            runtimeWeights: "texture" | "uniform";
            /** babylon-ntc-v4 only. Loop unrolling of the per-fragment network: "none", "inner" (dot products) or "full". Default: "none". */
            runtimeUnroll: "none" | "inner" | "full";
            /** babylon-ntc-v4 only. Arithmetic of the per-fragment network: "f32" or "f16" (WGSL with the shader-f16 feature, GLSL mediump). Default: "f32". */
            runtimePrecision: "f32" | "f16";
            /** Record opt-in performance.measure phase entries named neural:*. Default: false. */
            timing: boolean;
        }>;
    }
}
