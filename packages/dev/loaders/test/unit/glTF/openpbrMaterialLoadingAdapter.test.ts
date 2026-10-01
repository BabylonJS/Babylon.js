import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader";
import { OpenPBRMaterialLoadingAdapter } from "loaders/glTF/2.0/openpbrMaterialLoadingAdapter";

// The texture processor renders on the GPU, which NullEngine can't do. Replace the async passes
// with stubs that return a fresh output texture, matching the real (non-pass-through) contract.
// The stubs also fail if any input texture has already been disposed.
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
        MultiplyTexturesAsync: vi.fn(makeResult),
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

    it("disposes replaced coat textures only after they are no longer needed as inputs", async () => {
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

        await adapter.finalizeAsync(loader);

        expect(material.coatWeightTexture).toBeNull();
        expect(material.coatRoughnessTexture).not.toBe(packedCoat);
        expect(material.coatColorTexture).not.toBe(coatColor);
        expect(material.geometryCoatNormalTexture).not.toBe(coatNormal);
        expect(isDisposed(packedCoat)).toBe(true);
        expect(isDisposed(coatColor)).toBe(true);
        expect(isDisposed(coatNormal)).toBe(true);
    });

    it("keeps a replaced coat texture that is still referenced by another slot", async () => {
        const { material, adapter } = createVolumetricTransmissionAdapter();
        const coatColor = new Texture(null, scene);
        adapter.coatColorTexture = coatColor;
        material.fuzzColorTexture = coatColor;

        await adapter.finalizeAsync(loader);

        expect(material.coatColorTexture).not.toBe(coatColor);
        expect(isDisposed(coatColor)).toBe(false);
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
});
