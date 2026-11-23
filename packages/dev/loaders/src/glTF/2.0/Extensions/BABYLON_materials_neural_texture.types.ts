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
export type NeuralTextureCodec = "babylon-ntc-v1" | "babylon-ntc-v2";

/**
 * Network output channels for each material property group. A group is either the explicit list of output
 * indices (always the form of babylon-ntc-v1) or, for babylon-ntc-v2, a [startChannel, componentCount] pair.
 */
export type NeuralTextureOutputs = Partial<Record<"baseColor" | "normal" | "occlusion" | "roughness" | "metallic" | "emissive" | "diffuse" | "specular" | "glossiness", number[]>>;

/** JSON payload for the experimental BABYLON_materials_neural_texture extension. */
export interface IBabylonMaterialsNeuralTexture {
    /** Extension version. */
    version: 1;
    /** Codec identifier. babylon-ntc-v1 is fixed to 9 outputs; babylon-ntc-v2 has a variable number of outputs. */
    codec: NeuralTextureCodec;
    /** Decoded image width and height. */
    resolution: [number, number];
    /** High latent grid dimensions. */
    hiResolution: [number, number];
    /** Low latent grid dimensions. */
    loResolution: [number, number];
    /** Channels in each latent grid. */
    latentChannels?: 8;
    /** High RGBA, high RGBA, low RGBA, low RGBA, in that order. */
    latentTextures: ITextureInfo[];
    /** Little-endian, input-major float32 network parameters: 1856 + 33 * outputs for babylon-ntc-v2 (2153 for babylon-ntc-v1). */
    weights: { bufferView: number; componentType: 5126; count: number };
    /** Network architecture. */
    network: {
        inputs: 24;
        hidden: [32, 32];
        outputs: number;
        activation: "relu";
        positionalEncoding?: { frequencies: [1, 2]; scale: "hiResolution" };
        weightLayout?: string;
    };
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
            /** Record opt-in performance.measure phase entries named neural:*. Default: false. */
            timing: boolean;
        }>;
    }
}
