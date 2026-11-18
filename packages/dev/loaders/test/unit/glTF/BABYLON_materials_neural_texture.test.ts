import { describe, it, expect, vi } from "vitest";
import { type IBabylonMaterialsNeuralTexture } from "loaders/glTF/2.0/Extensions/BABYLON_materials_neural_texture.types";
import { BABYLON_materials_neural_texture as NeuralExtension } from "loaders/glTF/2.0/Extensions/BABYLON_materials_neural_texture.pure";
import { type GLTFLoader } from "loaders/glTF/2.0/glTFLoader.pure";
import { DecodeNeuralTextureAsync, ValidateNeuralTexture } from "loaders/glTF/2.0/Extensions/neuralTextureDecoder";
import { NeuralTextureMaterialPlugin } from "loaders/glTF/2.0/Extensions/neuralTextureMaterialPlugin";
import { BakeNeuralTextureAsync } from "loaders/glTF/2.0/Extensions/neuralTextureBaker";
import { PackNeuralTextureWeights } from "loaders/glTF/2.0/Extensions/neuralTextureShaders";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AssetContainer } from "core/assetContainer";
import { Observable } from "core/Misc/observable";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import * as NeuralBaker from "loaders/glTF/2.0/Extensions/neuralTextureBaker";
import * as NeuralDecoder from "loaders/glTF/2.0/Extensions/neuralTextureDecoder";
import { ShaderStore } from "core/Engines/shaderStore";
import { pbrPixelShader as PBRGLSL } from "core/Shaders/pbr.fragment";
import { pbrPixelShaderWGSL as PBRWGSL } from "core/ShadersWGSL/pbr.fragment";

function Payload(): IBabylonMaterialsNeuralTexture {
    return {
        version: 1,
        codec: "babylon-ntc-v1",
        resolution: [2, 1],
        hiResolution: [2, 1],
        loResolution: [1, 1],
        latentChannels: 8,
        latentTextures: [0, 1, 2, 3].map((index) => ({ index })),
        weights: { bufferView: 0, componentType: 5126, count: 2153 },
        network: {
            inputs: 24,
            hidden: [32, 32],
            outputs: 9,
            activation: "relu",
            positionalEncoding: { frequencies: [1, 2], scale: "hiResolution" },
            weightLayout: "W0[in][out],b0,W1,b1,W2,b2 float32",
        },
        outputs: { baseColor: [0, 1, 2, 3], normal: [4, 5], occlusion: [6], roughness: [7], metallic: [8] },
        replacedSlots: ["baseColorTexture", "normalTexture", "occlusionTexture", "metallicRoughnessTexture"],
    };
}

describe("BABYLON_materials_neural_texture", () => {
    it("never bakes, runs CPU inference or reads latents in explicit shader mode, including unsupported engines", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const bake = vi.spyOn(NeuralBaker, "BakeNeuralTextureAsync");
        const decode = vi.spyOn(NeuralDecoder, "DecodeNeuralTextureAsync");
        try {
            const payload = Payload();
            const latents = payload.latentTextures.map((_, index) => {
                const [width, height] = index < 2 ? payload.hiResolution : payload.loResolution;
                return { getSize: () => ({ width, height }), updateSamplingMode: vi.fn(), readPixels: vi.fn() };
            });
            const loader = {
                babylonScene: scene,
                parent: {
                    extensionOptions: { BABYLON_materials_neural_texture: { decodeInShader: true, allowCPUFallback: true } },
                    onTextureLoadedObservable: new Observable<BaseTexture>(),
                },
                gltf: { bufferViews: [{ index: 0 }] },
                isExtensionUsed: () => true,
                loadTextureInfoAsync: vi.fn(async (_context: string, info: { index: number }) => latents[info.index]),
                loadBufferViewAsync: async () => new Uint8Array(2153 * 4),
                loadMaterialPropertiesAsync: async () => {},
                loadMaterialAlphaProperties: vi.fn(),
            } as unknown as GLTFLoader;
            const source = { index: 0, extensions: { BABYLON_materials_neural_texture: payload } };
            const material = new PBRMaterial("neural", scene);
            const initialTextures = scene.textures.slice();
            await expect(new NeuralExtension(loader).loadMaterialPropertiesAsync("/materials/0", source, material)).rejects.toThrow("Shader decoding requires");
            expect(loader.loadTextureInfoAsync).not.toHaveBeenCalled();
            Object.defineProperty(engine, "supportsUniformBuffers", { configurable: true, get: () => true });
            await new NeuralExtension(loader).loadMaterialPropertiesAsync("/materials/0", source, material);
            expect(material.pluginManager!.getPlugin("BABYLON_materials_neural_texture")).toBeTruthy();
            expect(bake).not.toHaveBeenCalled();
            expect(decode).not.toHaveBeenCalled();
            expect(latents.every((latent) => !latent.readPixels.mock.calls.length)).toBe(true);
            expect(scene.textures).toEqual(initialTextures);
        } finally {
            bake.mockRestore();
            decode.mockRestore();
            scene.dispose();
            engine.dispose();
        }
    });

    it("requires explicit CPU fallback and reports generated textures for asset-container ownership", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const container = new AssetContainer(scene);
        try {
            const payload = Payload();
            const weights = new Float32Array(2153);
            const latents = payload.latentTextures.map((_, index) => {
                const [width, height] = index < 2 ? payload.hiResolution : payload.loResolution;
                return {
                    getSize: () => ({ width, height }),
                    updateSamplingMode: vi.fn(),
                    readPixels: vi.fn(async () => new Uint8Array(width * height * 4)),
                };
            });
            const loaded: BaseTexture[] = [];
            const observable = new Observable<BaseTexture>();
            observable.add((texture) => loaded.push(texture));
            const options: { allowCPUFallback?: boolean } = { allowCPUFallback: true };
            const parent = { extensionOptions: { BABYLON_materials_neural_texture: options }, onTextureLoadedObservable: observable };
            const loader = {
                babylonScene: scene,
                _assetContainer: container,
                parent,
                gltf: { bufferViews: [{ index: 0 }] },
                isExtensionUsed: () => true,
                loadTextureInfoAsync: async (_context: string, info: { index: number }) => latents[info.index],
                loadBufferViewAsync: async () => new Uint8Array(weights.buffer),
                loadMaterialPropertiesAsync: async () => {},
                loadMaterialAlphaProperties: vi.fn(),
            } as unknown as GLTFLoader;
            const material = new PBRMaterial("neural", scene);
            const source = { index: 0, extensions: { BABYLON_materials_neural_texture: payload } };
            await new NeuralExtension(loader).loadMaterialPropertiesAsync("/materials/0", source, material);
            expect(loaded).toEqual([material.albedoTexture, material.bumpTexture, material.ambientTexture]);
            expect(material.metallicTexture).toBe(material.ambientTexture);
            for (const texture of loaded) {
                expect(texture._parentContainer).toBe(container);
                expect(scene.textures).not.toContain(texture);
            }
            delete options.allowCPUFallback;
            for (const latent of latents) {
                latent.readPixels.mockClear();
            }
            const strict = new NeuralExtension(loader);
            expect(strict.allowCPUFallback).toBe(false);
            await expect(strict.loadMaterialPropertiesAsync("/materials/0", source, material)).rejects.toThrow("GPU baking is unavailable");
            expect(latents.every((latent) => !latent.readPixels.mock.calls.length)).toBe(true);
            for (const texture of loaded) {
                texture.dispose();
            }
        } finally {
            container.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("packs input-major output groups and biases without leaking padding into the nine outputs", () => {
        const weights = Float32Array.from({ length: 2153 }, (_, index) => index + 1);
        const packed = PackNeuralTextureWeights(weights);
        expect(packed.slice(0, 1856)).toEqual(weights.slice(0, 1856));
        expect(Array.from(packed.slice(1856, 1868))).toEqual([...weights.slice(1856, 1865), 0, 0, 0]);
        expect(Array.from(packed.slice(2228, 2240))).toEqual([...weights.slice(2135, 2144), 0, 0, 0]);
        expect(Array.from(packed.slice(2240))).toEqual([...weights.slice(2144), 0, 0, 0]);
    });

    it("reports unavailable GPU baking without CPU inference, and honors cancellation before allocating textures", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const extension = Payload();
            const weights = new Float32Array(2153);
            expect(await BakeNeuralTextureAsync(scene, extension, [], weights)).toBeNull();
            await expect(BakeNeuralTextureAsync(scene, extension, [], weights, null, () => true)).rejects.toThrow("cancelled");
            expect(scene.textures).toHaveLength(0);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("decodes input-major weights, latent alpha, reconstructed normals and ORM packing", async () => {
        const extension = Payload();
        const weights = new Float32Array(2153);
        weights[3 * 32] = 1;
        weights[800] = 1;
        weights[1856] = 1;
        weights.set([0, 0.25, 0.75, 1, 0.5, 0.5, 0.2, 0.6, 0.9], 2144);
        const grids = [{ data: new Uint8Array([0, 0, 0, 64, 0, 0, 0, 192]), width: 2, height: 1 }, ...[0, 1, 2].map(() => ({ data: new Uint8Array(4), width: 1, height: 1 }))];
        const decoded = await DecodeNeuralTextureAsync(extension, grids, weights);
        expect(Array.from(decoded.baseColor!)).toEqual([64, 64, 191, 255, 192, 64, 191, 255]);
        expect(Array.from(decoded.normal!.slice(0, 4))).toEqual([128, 128, 255, 255]);
        expect(Array.from(decoded.orm!.slice(0, 4))).toEqual([51, 153, 229, 255]);
    });

    it("samples repeat-wrapped bilinear texel centers and only allocates replaced slots", async () => {
        const extension = Payload();
        extension.resolution = [4, 1];
        extension.replacedSlots = ["baseColorTexture"];
        const weights = new Float32Array(2153);
        weights[0] = weights[800] = weights[1856] = 1;
        const grids = [{ data: new Uint8Array([0, 0, 0, 0, 255, 0, 0, 0]), width: 2, height: 1 }, ...[0, 1, 2].map(() => ({ data: new Uint8Array(4), width: 1, height: 1 }))];
        const decoded = await DecodeNeuralTextureAsync(extension, grids, weights);
        expect([0, 4, 8, 12].map((index) => decoded.baseColor![index])).toEqual([64, 64, 191, 191]);
        expect(decoded.normal).toBeUndefined();
        expect(decoded.orm).toBeUndefined();
    });

    it("honors positional encoding, ReLU, output channel mapping and cancellation", async () => {
        const extension = Payload();
        extension.hiResolution = [1, 1];
        extension.outputs.baseColor = [1, 0, 2, 3];
        const weights = new Float32Array(2153);
        weights[16 * 32] = 1;
        weights[800] = weights[1856] = 1;
        const grids = [0, 1, 2, 3].map(() => ({ data: new Uint8Array(4), width: 1, height: 1 }));
        const decoded = await DecodeNeuralTextureAsync(extension, grids, weights);
        expect(decoded.baseColor![1]).toBe(255);
        expect(decoded.baseColor![5]).toBe(0);
        await expect(DecodeNeuralTextureAsync(extension, grids, weights, () => true)).rejects.toThrow("cancelled");
    });

    it("accepts partial normal/occlusion payloads without replacing base color", async () => {
        const extension = Payload();
        extension.outputs = { normal: [4, 5], occlusion: [6] };
        extension.replacedSlots = ["normalTexture", "occlusionTexture"];
        expect(() => ValidateNeuralTexture("partial", extension)).not.toThrow();
        const grids = [0, 1, 2, 3].map(() => ({ data: new Uint8Array(4), width: 1, height: 1 }));
        const weights = new Float32Array(2153);
        weights.set([0, 0, 0, 0, 0.5, 0.5, 0.75, 0, 0], 2144);
        const decoded = await DecodeNeuralTextureAsync(extension, grids, weights);
        expect(decoded.baseColor).toBeUndefined();
        expect(Array.from(decoded.normal!.slice(0, 4))).toEqual([128, 128, 255, 255]);
        expect(Array.from(decoded.orm!.slice(0, 4))).toEqual([191, 255, 255, 255]);
        delete extension.outputs.normal;
        expect(() => ValidateNeuralTexture("partial", extension)).toThrow("Unsupported");
    });

    it("rejects malformed or unknown bitstreams", () => {
        const extension = Payload();
        expect(() => ValidateNeuralTexture("test", extension)).not.toThrow();
        extension.network.hidden[0] = 16 as 32;
        expect(() => ValidateNeuralTexture("test", extension)).toThrow("Unsupported");
        extension.network.hidden[0] = 32;
        extension.resolution[0] = -1;
        expect(() => ValidateNeuralTexture("test", extension)).toThrow("Unsupported");
    });

    it("redirects all selected PBR sample forms without losing nested UVs, offsets, swizzles or terminators", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const extension = Payload();
            extension.replacedSlots = ["normalTexture", "occlusionTexture"];
            const material = new PBRMaterial("neural", scene);
            const plugin = new NeuralTextureMaterialPlugin(material, extension, [], new Float32Array(2153));
            for (const language of [ShaderLanguage.GLSL, ShaderLanguage.WGSL]) {
                const code = plugin.getCustomCode("fragment", language)!;
                expect(code.CUSTOM_FRAGMENT_MAIN_BEGIN).toContain("decodeNeural(neuralCachedUV)");
                expect(code.CUSTOM_FRAGMENT_DEFINITIONS).toContain("decodeNeural(");
                const wgsl = language === ShaderLanguage.WGSL;
                const uv = "texCoord + offset(vec2(0.25, 0.5))";
                const sampler = (name: string) => `${name}Sampler, ${wgsl ? `${name}SamplerSampler, ` : ""}${uv}`;
                const direct = wgsl ? "textureSample" : "texture2D";
                let source = `TEXRD(${sampler("bump")}).xyz;\n${direct}(${sampler("bump")}).w;\nTEXRD(${sampler("ambient")}).rgb;\nTEXRD(${sampler("albedo")});\nTEXRD(${sampler("reflectivity")});`;
                for (const [key, replacement] of Object.entries(code)) {
                    if (key.startsWith("!")) {
                        // The plugin manager appends a newline to each injection.
                        source = source.replace(new RegExp(key.slice(1), "g"), replacement + "\n");
                    }
                }
                expect(source).toContain(`sampleNeuralbump(\n${uv}).xyz;`);
                expect(source).toContain(`sampleNeuralbump(\n${uv}).w;`);
                expect(source).toContain(`sampleNeuralambient(\n${uv}).rgb;`);
                expect(source).toContain(`TEXRD(${sampler("albedo")});`);
                expect(source).toContain(`TEXRD(${sampler("reflectivity")});`);
            }
            expect(plugin.getCustomCode("vertex")).toBeNull();
            expect(material.pluginManager!.getPlugin(plugin.name)).toBe(plugin);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("covers every core sampler read in PBR and its shared normal/parallax/debug includes on both APIs", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const plugin = new NeuralTextureMaterialPlugin(new PBRMaterial("neural", scene), Payload(), [], new Float32Array(2153));
            for (const language of [ShaderLanguage.GLSL, ShaderLanguage.WGSL]) {
                const store = ShaderStore.GetIncludesShadersStore(language);
                let source = [
                    language === ShaderLanguage.GLSL ? PBRGLSL.shader : PBRWGSL.shader,
                    ...["bumpFragment", "bumpFragmentFunctions", "pbrDebug"].map((include) => store[include]),
                ].join("\n");
                for (const [key, replacement] of Object.entries(plugin.getCustomCode("fragment", language)!)) {
                    if (key.startsWith("!")) {
                        source = source.replace(new RegExp(key.slice(1), "g"), replacement);
                    }
                }
                expect(source).not.toMatch(/(?:TEXRD|texture2D|textureSample)\s*\(\s*(?:albedo|ambient|reflectivity|bump)Sampler\s*,/);
                for (const sampler of ["albedo", "ambient", "reflectivity", "bump"]) {
                    expect(source).toContain(`sampleNeural${sampler}(`);
                }
                expect(source).toMatch(/currSampledHeight\s*=\s*sampleNeuralbump\(/);
                expect(source).toContain("perturbNormal(");
            }
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
