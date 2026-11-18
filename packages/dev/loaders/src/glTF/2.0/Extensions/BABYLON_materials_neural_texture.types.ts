import { type ITextureInfo } from "babylonjs-gltf2interface";

/** Core glTF texture slots supported by the experimental neural codec. */
export type NeuralTextureSlot = "baseColorTexture" | "normalTexture" | "occlusionTexture" | "metallicRoughnessTexture";

/** JSON payload for the experimental BABYLON_materials_neural_texture extension. */
export interface IBabylonMaterialsNeuralTexture {
    /** Bitstream version. */
    version: 1;
    /** Codec identifier. */
    codec: "babylon-ntc-v1";
    /** Decoded image width and height. */
    resolution: [number, number];
    /** High latent grid dimensions. */
    hiResolution: [number, number];
    /** Low latent grid dimensions. */
    loResolution: [number, number];
    /** Channels in each latent grid. */
    latentChannels: 8;
    /** High RGBA, high RGBA, low RGBA, low RGBA, in that order. */
    latentTextures: ITextureInfo[];
    /** Little-endian, input-major float32 network parameters. */
    weights: { bufferView: number; componentType: 5126; count: 2153 };
    /** Network architecture. */
    network: {
        inputs: 24;
        hidden: [32, 32];
        outputs: 9;
        activation: "relu";
        positionalEncoding: { frequencies: [1, 2]; scale: "hiResolution" };
        weightLayout: "W0[in][out],b0,W1,b1,W2,b2 float32";
    };
    /** Indices into the network output vector. */
    outputs: Partial<{ baseColor: [number, number, number, number]; normal: [number, number]; occlusion: [number]; roughness: [number]; metallic: [number] }>;
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
