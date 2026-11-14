import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { Color3, Color4 } from "core/Maths/math.color";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader";
import { OpenPBRMaterialLoadingAdapter } from "loaders/glTF/2.0/openpbrMaterialLoadingAdapter";
import "core/Materials/colorCurves";

// The texture processor renders on the GPU, which NullEngine can't do. Replace the async passes
// with stubs that return a fresh output texture, matching the real (non-pass-through) contract.
// The stubs also fail if any input texture has already been disposed. Passes with only constant
// operands run on the CPU, so those are delegated to the real implementation.
vi.mock("core/Materials/Textures/textureProcessor", async (importOriginal) => {
    const actual = await importOriginal<typeof import("core/Materials/Textures/textureProcessor")>();
    const makeResult = async (name: string, ...args: any[]) => {
        const scene = args.find((arg) => arg instanceof Scene) as Scene;
        for (const arg of args) {
            if (arg?.texture && !scene.textures.includes(arg.texture)) {
                throw new Error(`${name}: input texture "${arg.texture.name}" was already disposed`);
            }
        }
        const texture = new Texture(null, scene);
        texture.name = name;
        return { texture, dispose: () => texture.dispose() };
    };
    return {
        ...actual,
        InvertTextureAsync: vi.fn(makeResult),
        ExtractChannelAsync: vi.fn(makeResult),
        ExtractMaxChannelAsync: vi.fn(makeResult),
        LerpTexturesAsync: vi.fn(makeResult),
        MultiplyTexturesAsync: vi.fn(async (name: string, a: any, b: any, ...rest: any[]) =>
            a.texture || b.texture ? await makeResult(name, a, b, ...rest) : await actual.MultiplyTexturesAsync(name, a, b, ...(rest as [any]))
        ),
        MultiScatterToSingleScatterAlbedoAsync: vi.fn(async (name: string, input: any, ...rest: any[]) =>
            input.texture ? await makeResult(name, input, ...rest) : await actual.MultiScatterToSingleScatterAlbedoAsync(name, input, ...(rest as [any]))
        ),
    };
});

describe("OpenPBRMaterialLoadingAdapter.finalizeAsync texture disposal", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loader: GLTFLoader;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        loader = new GLTFLoader({} as any);
        loader._pbrMaterialImpls.set("openpbr", { materialClass: OpenPBRMaterial, adapterClass: OpenPBRMaterialLoadingAdapter });
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function createSpecGlossAdapter(name: string): { material: OpenPBRMaterial; adapter: OpenPBRMaterialLoadingAdapter; diffuse: Texture; specular: Texture } {
        const material = new OpenPBRMaterial(name, scene);
        const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
        adapter.configureSpecularGlossiness();
        const diffuse = new Texture(null, scene);
        const specular = new Texture(null, scene);
        adapter.baseColorTexture = diffuse;
        adapter.specularColorTexture = specular;
        return { material, adapter, diffuse, specular };
    }

    const isDisposed = (texture: Texture) => !scene.textures.includes(texture);

    it("disposes replaced spec-gloss textures that are no longer referenced", async () => {
        const { material, adapter, diffuse, specular } = createSpecGlossAdapter("mat");

        await adapter.finalizeAsync(loader);

        expect(material.baseColorTexture).not.toBe(diffuse);
        expect(material.specularColorTexture).toBeNull();
        expect(isDisposed(diffuse)).toBe(true);
        expect(isDisposed(specular)).toBe(true);
    });

    it("keeps a replaced texture that is still referenced by another slot on the same material", async () => {
        const { material, adapter, diffuse } = createSpecGlossAdapter("mat");
        material.transmissionColorTexture = diffuse;

        await adapter.finalizeAsync(loader);

        expect(material.baseColorTexture).not.toBe(diffuse);
        expect(material.transmissionColorTexture).toBe(diffuse);
        expect(isDisposed(diffuse)).toBe(false);
    });

    it("keeps a replaced texture that is still referenced by another loaded material", async () => {
        const { adapter, diffuse } = createSpecGlossAdapter("mat");
        const otherMaterial = new OpenPBRMaterial("other", scene);
        loader._getOrCreateMaterialAdapter(otherMaterial);
        otherMaterial.baseColorTexture = diffuse;

        await adapter.finalizeAsync(loader);

        expect(otherMaterial.baseColorTexture).toBe(diffuse);
        expect(isDisposed(diffuse)).toBe(false);
    });

    function createVolumetricTransmissionAdapter(): { material: OpenPBRMaterial; adapter: OpenPBRMaterialLoadingAdapter } {
        const material = new OpenPBRMaterial("mat", scene);
        const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
        adapter.configureTransmission();
        adapter.transmissionWeight = 1.0;
        adapter.configureVolume();
        adapter.transmissionDepth = 1.0;
        adapter.baseColorTexture = new Texture(null, scene);
        return { material, adapter };
    }

    it("keeps authored coat inputs on independent coordinates for shader-side conversion", async () => {
        const { material, adapter } = createVolumetricTransmissionAdapter();
        // A packed coat texture (weight in R, roughness in G) shared between two slots.
        const packedCoat = new Texture(null, scene);
        packedCoat.name = "packedCoat";
        const coatColor = new Texture(null, scene);
        const coatNormal = new Texture(null, scene);
        adapter.coatWeightTexture = packedCoat;
        adapter.coatRoughnessTexture = packedCoat;
        adapter.coatColorTexture = coatColor;
        material.geometryCoatNormalTexture = coatNormal;
        packedCoat.coordinatesIndex = 1;
        packedCoat.uOffset = 0.25;
        adapter.coatWeight = 0.4;
        adapter.coatRoughness = 0.6;

        await adapter.finalizeAsync(loader);

        expect(material._gltfTransmissionSurfaceToCoat).toBe(true);
        expect(material.coatWeightTexture).toBe(packedCoat);
        expect(material.coatRoughnessTexture).toBe(packedCoat);
        expect(material.coatColorTexture).toBe(coatColor);
        expect(material.geometryCoatNormalTexture).toBe(coatNormal);
        expect(material.coatWeight).toBe(0.4);
        expect(material.coatRoughness).toBe(0.6);
        expect(packedCoat.coordinatesIndex).toBe(1);
        expect(packedCoat.uOffset).toBe(0.25);
        expect(isDisposed(packedCoat)).toBe(false);
        expect(isDisposed(coatColor)).toBe(false);
        expect(isDisposed(coatNormal)).toBe(false);
    });

    it("keeps authored coat textures shared with another slot", async () => {
        const { material, adapter } = createVolumetricTransmissionAdapter();
        const coatColor = new Texture(null, scene);
        adapter.coatColorTexture = coatColor;
        material.fuzzColorTexture = coatColor;

        await adapter.finalizeAsync(loader);

        expect(material.coatColorTexture).toBe(coatColor);
        expect(isDisposed(coatColor)).toBe(false);
    });

    it("keeps diffuse surface tint separate from volumetric subsurface color", async () => {
        const { material, adapter } = createVolumetricTransmissionAdapter();
        adapter.configureSubsurface();
        adapter.configureVolume();
        adapter.subsurfaceWeight = 0.75;
        const volumeColor = new Color3(0.2, 0.3, 0.4);
        adapter.subsurfaceColor = volumeColor;
        adapter.diffuseTransmissionTint = new Color3(0.8, 0.6, 0.4);
        const tint = new Texture(null, scene);
        tint.coordinatesIndex = 1;
        adapter.diffuseTransmissionTintTexture = tint;

        await adapter.finalizeAsync(loader);

        expect(material._gltfDiffuseTransmissionSurfaceToCoat).toBe(true);
        expect(material._gltfDiffuseTransmissionColor).toBe(adapter.diffuseTransmissionTint);
        expect(material._gltfDiffuseTransmissionColorTexture).toBe(tint);
        expect(material.subsurfaceColor).toBe(volumeColor);
        expect(material.getActiveTextures()).toContain(tint);
        expect(isDisposed(tint)).toBe(false);
    });

    it("preserves surface conversion modes and tint through cloning and scene serialization", async () => {
        const { material, adapter } = createVolumetricTransmissionAdapter();
        adapter.configureSubsurface();
        adapter.configureVolume();
        adapter.subsurfaceWeight = 0.5;
        adapter.diffuseTransmissionTint = new Color3(0.2, 0.4, 0.6);
        adapter.coatRoughnessTexture = new Texture(null, scene);
        adapter.coatRoughnessTexture.name = "packedCoat";
        await adapter.finalizeAsync(loader);

        const clone = material.clone("clone");
        const parsed = OpenPBRMaterial.Parse(material.serialize(), scene, "");
        for (const copy of [clone, parsed]) {
            expect(copy._gltfTransmissionSurfaceToCoat).toBe(true);
            expect(copy._gltfDiffuseTransmissionSurfaceToCoat).toBe(true);
            expect(copy._gltfDiffuseTransmissionColor.asArray()).toEqual([0.2, 0.4, 0.6]);
            expect(copy.coatWeight).toBe(material.coatWeight);
            expect(copy._useCoatRoughnessFromGreenChannel).toBe(true);
        }
    });

    describe("thin-walled scatter staging", () => {
        it("preserves unstaged subsurface settings configured by user code", async () => {
            const material = new OpenPBRMaterial("mat", scene);
            const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
            // Simulates an onMaterialLoadedObservable handler on a material without KHR_materials_scatter.
            material.geometryThinWalled = 1;
            material.subsurfaceWeight = 1;
            material.transmissionWeight = 0;

            await adapter.finalizeAsync(loader);

            expect(material.subsurfaceWeight).toBe(1);
            expect(material.transmissionWeight).toBe(0);
        });

        it("converts staged thin-walled scatter strength into transmission and subsurface weights", async () => {
            const material = new OpenPBRMaterial("mat", scene);
            const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
            adapter.configureTransmission();
            adapter.transmissionWeight = 1;
            adapter.configureSubsurface();
            adapter.thinWalledScatterStrengthFactor = 0.5;

            await adapter.finalizeAsync(loader);

            // transW = T*(1-S) = 0.5; ssW = T*S/(1-transW) = 1.
            expect(material.transmissionWeight).toBeCloseTo(0.5);
            expect(material.subsurfaceWeight).toBeCloseTo(1);
            expect(adapter.thinWalledScatterStrengthFactor).toBeNull();
        });
    });

    // The scattering coefficient is derived from -log(attenuationColor), which is infinite for a zero
    // channel. The adapter clamps attenuationColor to 1e-7 so the coefficients stay finite.
    describe("volumetric scatter with a zero attenuation color channel", () => {
        function createVolumetricScatterAdapter(): { material: OpenPBRMaterial; adapter: OpenPBRMaterialLoadingAdapter } {
            const material = new OpenPBRMaterial("mat", scene);
            const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
            adapter.configureTransmission();
            adapter.transmissionWeight = 1;
            adapter.configureVolume();
            adapter.transmissionDepth = 1;
            adapter.transmissionColor = new Color3(0, 0.5, 1);
            adapter.transmissionScatter = new Color3(0.5, 0.5, 0.5);
            adapter.volumetricScatterStrengthFactor = 1;
            return { material, adapter };
        }

        // extinctionCoefficient * depth for attenuationColor (0, 0.5, 1) and depth 1.
        const expectedExtinction = [0, 0.5, 1].map((c) => -Math.log(Math.max(c, 1e-7)));

        const expectCoefficients = (color: Color3, expected: number[]) => {
            const actual = color.asArray();
            for (let i = 0; i < 3; i++) {
                expect(Number.isFinite(actual[i])).toBe(true);
                expect(actual[i]).toBeCloseTo(expected[i], 5);
            }
        };

        it("produces finite constant scatter coefficients", async () => {
            const { material, adapter } = createVolumetricScatterAdapter();

            await adapter.finalizeAsync(loader);

            const processor = await vi.importActual<typeof import("core/Materials/Textures/textureProcessor")>("core/Materials/Textures/textureProcessor");
            const singleScatter = await processor.MultiScatterToSingleScatterAlbedoAsync(
                "expected",
                processor.CreateFactorOperand(new Color4(0.5, 0.5, 0.5, 1)),
                scene,
                material.transmissionScatterAnisotropy
            );
            const albedo = singleScatter.factor!;
            expect(material.transmissionScatterTexture).toBeNull();
            expectCoefficients(material.transmissionScatter, [expectedExtinction[0] * albedo.r, expectedExtinction[1] * albedo.g, expectedExtinction[2] * albedo.b]);
        });

        it("produces finite textured scatter coefficients", async () => {
            const { material, adapter } = createVolumetricScatterAdapter();
            adapter.transmissionScatterTexture = new Texture(null, scene);

            await adapter.finalizeAsync(loader);

            // The single-scatter albedo is baked into the texture, leaving extinction * depth in the factor.
            expect(material.transmissionScatterTexture).not.toBeNull();
            expectCoefficients(material.transmissionScatter, expectedExtinction);
        });
    });

    // KHR_materials_scatter's zero endpoints must give zero single-scatter albedo, and therefore a zero scattering
    // coefficient, at any anisotropy. The multi-scatter fit leaves s slightly below 1 at zero, so with anisotropy 1 an
    // unguarded (1 - s^2) / (1 - aniso * s^2) would give full albedo instead.
    describe("volumetric scatter zero endpoints", () => {
        const cases = [
            { label: "zero scatter strength", strength: 0, color: new Color3(0.5, 0.5, 0.5) },
            { label: "black multiscatter color", strength: 1, color: new Color3(0, 0, 0) },
        ];
        for (const { label, strength, color } of cases) {
            for (const anisotropy of [0, 1]) {
                it(`gives zero transmission scatter for ${label} (anisotropy ${anisotropy})`, async () => {
                    const material = new OpenPBRMaterial("mat", scene);
                    const adapter = loader._getOrCreateMaterialAdapter(material) as OpenPBRMaterialLoadingAdapter;
                    adapter.configureTransmission();
                    adapter.transmissionWeight = 1;
                    adapter.configureVolume();
                    adapter.transmissionDepth = 1;
                    adapter.transmissionColor = new Color3(0.5, 0.5, 0.5);
                    adapter.transmissionScatter = color;
                    adapter.transmissionScatterAnisotropy = anisotropy;
                    adapter.volumetricScatterStrengthFactor = strength;

                    await adapter.finalizeAsync(loader);

                    expect(material.transmissionScatterTexture).toBeNull();
                    expect(material.transmissionScatter.asArray()).toEqual([0, 0, 0]);
                });
            }
        }
    });
});
