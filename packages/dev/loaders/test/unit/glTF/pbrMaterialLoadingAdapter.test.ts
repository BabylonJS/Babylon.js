import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader";
import { PBRMaterialLoadingAdapter } from "loaders/glTF/2.0/pbrMaterialLoadingAdapter";

describe("PBRMaterialLoadingAdapter.finalizeAsync volumetric scatter", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loader: GLTFLoader;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        loader = new GLTFLoader({} as any);
        loader._pbrMaterialImpls.set("pbr", { materialClass: PBRMaterial, adapterClass: PBRMaterialLoadingAdapter });
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    function createAdapter(name: string): { material: PBRMaterial; adapter: PBRMaterialLoadingAdapter } {
        const material = new PBRMaterial(name, scene);
        const adapter = loader._getOrCreateMaterialAdapter(material) as PBRMaterialLoadingAdapter;
        return { material, adapter };
    }

    const isDisposed = (texture: Texture) => !scene.textures.includes(texture);

    it("applies staged scatter strength and color textures to the translucency slots", async () => {
        const { material, adapter } = createAdapter("mat");
        const strength = new Texture(null, scene);
        const color = new Texture(null, scene);
        adapter.volumetricScatterStrengthFactor = 0.5;
        adapter.volumetricScatterStrengthTexture = strength;
        adapter.transmissionScatterTexture = color;

        expect(material.subSurface.translucencyIntensityTexture).toBeNull();
        expect(material.subSurface.translucencyColorTexture).toBeNull();

        await adapter.finalizeAsync(loader);

        expect(material.subSurface.isTranslucencyEnabled).toBe(true);
        expect(material.subSurface.translucencyIntensity).toBe(0.5);
        expect(material.subSurface.translucencyIntensityTexture).toBe(strength);
        expect(material.subSurface.translucencyColorTexture).toBe(color);
        expect(adapter.volumetricScatterStrengthTexture).toBeNull();
        expect(adapter.transmissionScatterTexture).toBeNull();
    });

    it("replaces diffuse transmission textures that finished loading after the scatter textures", async () => {
        const { material, adapter } = createAdapter("mat");
        const strength = new Texture(null, scene);
        const color = new Texture(null, scene);
        const diffuseTransmission = new Texture(null, scene);
        const diffuseTransmissionTint = new Texture(null, scene);
        adapter.volumetricScatterStrengthFactor = 0.5;
        adapter.volumetricScatterStrengthTexture = strength;
        adapter.transmissionScatterTexture = color;
        adapter.subsurfaceWeightTexture = diffuseTransmission;
        adapter.diffuseTransmissionTintTexture = diffuseTransmissionTint;

        await adapter.finalizeAsync(loader);

        expect(material.subSurface.translucencyIntensityTexture).toBe(strength);
        expect(material.subSurface.translucencyColorTexture).toBe(color);
        expect(isDisposed(diffuseTransmission)).toBe(true);
        expect(isDisposed(diffuseTransmissionTint)).toBe(true);
    });

    it("keeps a replaced texture that is still referenced by another loaded material", async () => {
        const { material, adapter } = createAdapter("mat");
        const { material: other } = createAdapter("other");
        const strength = new Texture(null, scene);
        const shared = new Texture(null, scene);
        other.albedoTexture = shared;
        adapter.volumetricScatterStrengthFactor = 0.5;
        adapter.volumetricScatterStrengthTexture = strength;
        adapter.subsurfaceWeightTexture = shared;

        await adapter.finalizeAsync(loader);

        expect(material.subSurface.translucencyIntensityTexture).toBe(strength);
        expect(isDisposed(shared)).toBe(false);
    });

    it("leaves translucency textures untouched when no volumetric scatter was staged", async () => {
        const { material, adapter } = createAdapter("mat");
        const diffuseTransmission = new Texture(null, scene);
        adapter.subsurfaceWeightTexture = diffuseTransmission;

        await adapter.finalizeAsync(loader);

        expect(material.subSurface.translucencyIntensityTexture).toBe(diffuseTransmission);
        expect(isDisposed(diffuseTransmission)).toBe(false);
    });

    describe("subsurface color texture", () => {
        it("applies the subsurface color texture to translucencyColorTexture, replacing the diffuse transmission tint texture", async () => {
            const { material, adapter } = createAdapter("mat");
            const scatterColor = new Texture(null, scene);
            const diffuseTransmissionTint = new Texture(null, scene);
            adapter.thinWalledScatterStrengthFactor = 0.5;
            adapter.subsurfaceColorTexture = scatterColor;
            adapter.diffuseTransmissionTintTexture = diffuseTransmissionTint;

            await adapter.finalizeAsync(loader);

            expect(material.subSurface.translucencyColorTexture).toBe(scatterColor);
            expect(isDisposed(diffuseTransmissionTint)).toBe(true);
            expect(adapter.subsurfaceColorTexture).toBeNull();
        });

        it("keeps a texture staged as both the transmission scatter and subsurface color texture", async () => {
            const { material, adapter } = createAdapter("mat");
            const scatterColor = new Texture(null, scene);
            adapter.transmissionScatterTexture = scatterColor;
            adapter.subsurfaceColorTexture = scatterColor;

            await adapter.finalizeAsync(loader);

            expect(material.subSurface.translucencyColorTexture).toBe(scatterColor);
            expect(isDisposed(scatterColor)).toBe(false);
        });
    });
});
