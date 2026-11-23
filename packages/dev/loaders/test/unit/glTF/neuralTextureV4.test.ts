import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync } from "fs";
import { inflateSync } from "zlib";
import { join } from "path";
import { type IBabylonMaterialsNeuralTexture } from "loaders/glTF/2.0/Extensions/BABYLON_materials_neural_texture.types";
import { BABYLON_materials_neural_texture as NeuralExtension } from "loaders/glTF/2.0/Extensions/BABYLON_materials_neural_texture.pure";
import { type GLTFLoader } from "loaders/glTF/2.0/glTFLoader.pure";
import { ResolveNeuralTexture } from "loaders/glTF/2.0/Extensions/neuralTextureDecoder";
import {
    DecodeNeuralV4Async,
    ExpandNeuralV4Weights,
    GetNeuralV4AtlasOrigin,
    GetNeuralV4ConstantGroup,
    GetNeuralV4Layout,
    GetNeuralV4LevelOf,
    GetNeuralV4LevelSize,
    GetNeuralV4MipSize,
    GetNeuralV4RowOffsets,
    HalfToFloat,
    NeuralV4Decoder,
    PackNeuralV4WeightTexture,
    ParseNeuralV4Weights,
    UnpackNeuralV4Latents,
    type INeuralV4Atlas,
} from "loaders/glTF/2.0/Extensions/neuralTextureV4";
import { GetNeuralV4RuntimeShader, GetNeuralV4BakeShader, type NeuralTextureRuntimeFilter } from "loaders/glTF/2.0/Extensions/neuralTextureV4Shaders";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Observable } from "core/Misc/observable";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";

const AssetRoot = join(__dirname, "assets", "neural-v4");
const Cases = ["synth_s", "synth_xs2b", "synth_m_rect", "synth_const"];

interface IGolden {
    extension: IBabylonMaterialsNeuralTexture;
    weights: Uint8Array;
    atlases: INeuralV4Atlas[];
}

// Minimal 8-bit RGBA PNG decoder: enough for the lossless latent atlases.
function DecodePng(png: Uint8Array): INeuralV4Atlas {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    expect([png[24], png[25]]).toEqual([8, 6]);
    const parts: Uint8Array[] = [];
    for (let offset = 8; offset < png.length;) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
        if (type === "IDAT") {
            parts.push(png.subarray(offset + 8, offset + 8 + length));
        }
        offset += 12 + length;
    }
    const raw = inflateSync(Buffer.concat(parts));
    const stride = width * 4;
    const data = new Uint8Array(stride * height);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        for (let x = 0; x < stride; x++) {
            const value = raw[y * (stride + 1) + 1 + x];
            const left = x >= 4 ? data[y * stride + x - 4] : 0;
            const up = y > 0 ? data[(y - 1) * stride + x] : 0;
            const upLeft = x >= 4 && y > 0 ? data[(y - 1) * stride + x - 4] : 0;
            let predictor = 0;
            if (filter === 1) {
                predictor = left;
            } else if (filter === 2) {
                predictor = up;
            } else if (filter === 3) {
                predictor = (left + up) >> 1;
            } else if (filter === 4) {
                const p = left + up - upLeft;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - up);
                const pc = Math.abs(p - upLeft);
                predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
            }
            data[y * stride + x] = (value + predictor) & 255;
        }
    }
    return { data, width, height };
}

function LoadGolden(name: string): IGolden {
    const glb = readFileSync(join(AssetRoot, name, "case.glb"));
    const jsonLength = glb.readUInt32LE(12);
    const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8"));
    const bin = glb.subarray(20 + jsonLength + 8);
    const slice = (index: number) => {
        const view = json.bufferViews[index];
        return new Uint8Array(bin.buffer, bin.byteOffset + (view.byteOffset ?? 0), view.byteLength);
    };
    const extension = json.materials[0].extensions.BABYLON_materials_neural_texture as IBabylonMaterialsNeuralTexture;
    const atlases = extension.latentTextures.map((info) => DecodePng(slice(json.images[json.textures[info.index].source].bufferView)));
    return { extension, weights: slice(extension.weights.bufferView), atlases };
}

function Extension(overrides: Partial<IBabylonMaterialsNeuralTexture> = {}): IBabylonMaterialsNeuralTexture {
    return { ...JSON.parse(JSON.stringify(LoadGolden("synth_xs2b").extension)), ...overrides };
}

describe("babylon-ntc-v4 geometry", () => {
    it("follows the specification for level selection, level sizes and atlas origins", () => {
        expect([0, 1, 2, 3, 4, 5, 6, 7].map((m) => GetNeuralV4LevelOf(m, 3))).toEqual([0, 0, 0, 0, 1, 1, 2, 2]);
        const grid = { width: 32, height: 16 };
        expect(GetNeuralV4LevelSize(grid, 2)).toEqual([2, 1]);
        expect(GetNeuralV4AtlasOrigin(grid, 0)).toEqual([0, 0]);
        expect(GetNeuralV4AtlasOrigin(grid, 1)).toEqual([32, 0]);
        expect(GetNeuralV4AtlasOrigin(grid, 2)).toEqual([32, 4]);
        expect(GetNeuralV4MipSize({ width: 64, height: 32 }, 3)).toEqual([8, 4]);
        expect(GetNeuralV4RowOffsets([{ out: 64 }, { out: 64 }, { out: 17 }])).toEqual([0, 64, 128]);
    });

    it("converts binary16 exactly", () => {
        expect(HalfToFloat(0x3c00)).toBe(1);
        expect(HalfToFloat(0xc000)).toBe(-2);
        expect(HalfToFloat(0x0001)).toBe(2 ** -24);
        expect(HalfToFloat(0x7bff)).toBe(65504);
        expect(HalfToFloat(0x0000)).toBe(0);
    });
});

describe.each(Cases)("babylon-ntc-v4 golden %s", (name) => {
    const golden = LoadGolden(name);
    const resolved = ResolveNeuralTexture("/materials/0", golden.extension);
    const layout = GetNeuralV4Layout(golden.extension).layout!;

    it("validates", () => {
        expect(layout).toBeTruthy();
        expect(resolved.outputs).toBeTruthy();
    });

    it("unpacks the latent atlases to the reference values", () => {
        for (let g = 0; g < 2; g++) {
            for (let level = 0; level < layout.levels; level++) {
                const reference = readFileSync(join(AssetRoot, name, `latents_g${g}_lv${level}.u8`));
                expect(Buffer.from(UnpackNeuralV4Latents(layout, golden.atlases, g, level))).toEqual(reference);
            }
        }
    });

    it("decodes like the CPU reference within 1e-5", () => {
        const network = ExpandNeuralV4Weights(layout, ParseNeuralV4Weights(layout, golden.weights));
        const decoder = new NeuralV4Decoder(layout, golden.atlases, network);
        const channelCount = layout.channels.length;
        const out = new Float32Array(channelCount);
        let checked = 0;
        for (let m = 0; m < layout.mipCount; m++) {
            const file = join(AssetRoot, name, `ref_m${m}.f32`);
            if (!existsSync(file)) {
                continue;
            }
            const bytes = readFileSync(file);
            const reference = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
            const [w, h] = GetNeuralV4MipSize(layout, m);
            expect(reference.length).toBe(w * h * channelCount);
            let worst = 0;
            for (let j = 0; j < h; j++) {
                for (let i = 0; i < w; i++) {
                    decoder.decode(m, i, j, out);
                    for (let n = 0; n < channelCount; n++) {
                        worst = Math.max(worst, Math.abs(out[n] - reference[(j * w + i) * channelCount + n]));
                    }
                }
            }
            expect(worst).toBeLessThanOrEqual(1e-5);
            checked++;
        }
        expect(checked).toBeGreaterThan(2);
    });

    it("packs the weights texture row by row", () => {
        const half = ParseNeuralV4Weights(layout, golden.weights);
        const packed = PackNeuralV4WeightTexture(layout, half);
        layout.layers.forEach((layer, l) => {
            for (const o of [0, layer.out - 1]) {
                const row = (packed.rowOffsets[l] + o) * packed.width * 4;
                expect(Array.from(packed.data.subarray(row, row + layer.inStride))).toEqual(
                    Array.from(half.subarray(layer.weightOffset + o * layer.inStride, layer.weightOffset + (o + 1) * layer.inStride))
                );
                expect(packed.data[row + layer.inStride]).toBe(half[layer.biasOffset + o]);
            }
        });
    });

    it("decodes mip 0 groups on the CPU like the per-texel decode", async () => {
        const network = ExpandNeuralV4Weights(layout, ParseNeuralV4Weights(layout, golden.weights));
        const outputs = resolved.outputs;
        const groups = (["baseColor", "normal", "orm", "emissive", "diffuse", "specGloss"] as const).filter((group) => {
            const constant = GetNeuralV4ConstantGroup(layout, outputs, group);
            return !constant && outputs[group === "orm" ? "occlusion" : group === "specGloss" ? "specular" : group];
        });
        const decoded = await DecodeNeuralV4Async(layout, outputs, [...groups], golden.atlases, network);
        for (const group of groups) {
            expect(decoded[group]!.length).toBe(layout.width * layout.height * 4);
        }
    });
});

describe("babylon-ntc-v4 constants and shaders", () => {
    it("bakes fully constant groups without the network", () => {
        const golden = LoadGolden("synth_const");
        const layout = GetNeuralV4Layout(golden.extension).layout!;
        const outputs = ResolveNeuralTexture("/materials/0", golden.extension).outputs;
        expect(GetNeuralV4ConstantGroup(layout, outputs, "baseColor")).toBeNull();
    });

    it.each(["bilinear", "nearest", "trilinear", "stochastic"] as NeuralTextureRuntimeFilter[])("generates GLSL and WGSL for the %s filter", (filter) => {
        const golden = LoadGolden("synth_s");
        const layout = GetNeuralV4Layout(golden.extension).layout!;
        const outputs = ResolveNeuralTexture("/materials/0", golden.extension).outputs;
        for (const language of [ShaderLanguage.GLSL, ShaderLanguage.WGSL]) {
            const shader = GetNeuralV4RuntimeShader(layout, outputs, language, filter);
            expect(shader.main).toContain("neural");
            expect(shader.definitions).toContain("neuralLatent3");
            expect(shader.definitions).not.toContain("neuralLatent4");
            const bake = GetNeuralV4BakeShader(layout, outputs, language, [["neuralBaseColor", 0]]);
            expect(bake).toContain("neuralDecodeTexel");
        }
    });
});

describe("babylon-ntc-v4 validation", () => {
    const invalid: Array<[string, (e: IBabylonMaterialsNeuralTexture) => void]> = [
        ["a wrong mipCount", (e) => (e.mipCount = 3)],
        ["a wrong level count", (e) => (e.levels = 5)],
        ["a non multiple of 8 resolution", (e) => (e.resolution = [60, 64])],
        ["a wrong weight byte length", (e) => (e.weights = { ...e.weights, byteLength: 12 })],
        ["a duplicated latent image", (e) => (e.grids![1].textures[0] = e.grids![0].textures[0])],
        ["a wrong input count", (e) => (e.network.inputs += 1)],
        ["a non fp16 weight format", (e) => (e.network.weightFormat = "float32")],
        ["a constant outside [0, 1]", (e) => (e.channels![0] = { const: 2 })],
        ["an unordered net index", (e) => (e.channels![0] = { net: 3, activation: "none" })],
        ["too few channels", (e) => (e.channels = [])],
        ["a bad grid bit depth", (e) => (e.grids![0].bits = 3 as never)],
        ["a wrong sampling", (e) => (e.grids![0].sampling = "bilinear" as never)],
    ];

    it.each(invalid)("rejects %s", (_name, mutate) => {
        const extension = Extension();
        mutate(extension);
        expect(GetNeuralV4Layout(extension).layout).toBeUndefined();
        expect(() => ResolveNeuralTexture("/materials/0", extension)).toThrow("babylon-ntc-v4");
    });

    it("rejects non-finite fp16 weights", () => {
        const golden = LoadGolden("synth_xs2b");
        const layout = GetNeuralV4Layout(golden.extension).layout!;
        const bytes = golden.weights.slice();
        bytes[1] = 0x7c;
        bytes[0] = 0;
        expect(() => ParseNeuralV4Weights(layout, bytes)).toThrow("Non-finite");
        expect(() => ParseNeuralV4Weights(layout, bytes.subarray(2))).toThrow("bytes");
    });

    it("falls back to the core textures without throwing for an invalid payload", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        try {
            const payload = Extension();
            payload.mipCount = 3;
            const loader = {
                babylonScene: scene,
                parent: { extensionOptions: { BABYLON_materials_neural_texture: {} }, onTextureLoadedObservable: new Observable<BaseTexture>() },
                gltf: { bufferViews: [{ index: 0 }] },
                isExtensionUsed: () => true,
                loadTextureInfoAsync: vi.fn(),
                loadBufferViewAsync: vi.fn(),
                loadMaterialPropertiesAsync: vi.fn(async () => {}),
                loadMaterialAlphaProperties: vi.fn(),
            };
            const material = new PBRMaterial("neural", scene);
            const source = { index: 0, extensions: { BABYLON_materials_neural_texture: payload } };
            await new NeuralExtension(loader as unknown as GLTFLoader).loadMaterialPropertiesAsync("/materials/0", source, material);
            expect(loader.loadMaterialPropertiesAsync).toHaveBeenCalledTimes(1);
            expect(loader.loadTextureInfoAsync).not.toHaveBeenCalled();
            expect(material.pluginManager?.getPlugin("BABYLON_materials_neural_texture")).toBeFalsy();
        } finally {
            warn.mockRestore();
            scene.dispose();
            engine.dispose();
        }
    });
});
