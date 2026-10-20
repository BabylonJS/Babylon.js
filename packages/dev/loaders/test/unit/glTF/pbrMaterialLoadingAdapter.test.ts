import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader";
import { PBRMaterialLoadingAdapter } from "loaders/glTF/2.0/pbrMaterialLoadingAdapter";
import { ImportMeshAsync } from "core/Loading";
import "loaders/glTF";

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

    function createTransmissiveAdapter(name: string): { material: PBRMaterial; adapter: PBRMaterialLoadingAdapter } {
        const result = createAdapter(name);
        result.adapter.configureTransmission();
        result.adapter.transmissionWeight = 1;
        return result;
    }

    it("applies staged scatter strength and color textures to the translucency slots", async () => {
        const { material, adapter } = createTransmissiveAdapter("mat");
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
        const { material, adapter } = createTransmissiveAdapter("mat");
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
        const { material, adapter } = createTransmissiveAdapter("mat");
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

    it("keeps volumetric scatter inert and preserves diffuse transmission when there is no transmission", async () => {
        const { material, adapter } = createAdapter("mat");
        const strength = new Texture(null, scene);
        const color = new Texture(null, scene);
        const diffuseTransmission = new Texture(null, scene);
        adapter.configureSubsurface();
        adapter.subsurfaceWeight = 0.4;
        adapter.subsurfaceWeightTexture = diffuseTransmission;
        adapter.volumetricScatterStrengthFactor = 1;
        adapter.volumetricScatterStrengthTexture = strength;
        adapter.transmissionScatterTexture = color;

        await adapter.finalizeAsync(loader);

        expect(adapter.subsurfaceWeight).toBe(0.4);
        expect(material.subSurface.translucencyIntensityTexture).toBe(diffuseTransmission);
        expect(material.subSurface.translucencyColorTexture).toBeNull();
        expect(isDisposed(strength)).toBe(true);
        expect(isDisposed(color)).toBe(true);
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

    // Thin-walled KHR_materials_scatter turns a fraction S of the transmission T into diffuse transmission:
    // refraction becomes T * (1 - S) and translucency (which applies to the surface left over by refraction)
    // becomes T * S / (1 - T * (1 - S)).
    describe("thin-walled scatter", () => {
        function createThinWalledAdapter(transmission: number, scatterStrength: number): { material: PBRMaterial; adapter: PBRMaterialLoadingAdapter } {
            const { material, adapter } = createAdapter("mat");
            adapter.configureTransmission();
            adapter.transmissionWeight = transmission;
            adapter.configureSubsurface();
            adapter.thinWalledScatterStrengthFactor = scatterStrength;
            return { material, adapter };
        }

        it.each([
            { t: 0.25, s: 0.5, refraction: 0.125, translucency: 0.125 / 0.875 },
            { t: 1, s: 0, refraction: 1, translucency: 0 },
            { t: 1, s: 1, refraction: 0, translucency: 1 },
            { t: 0.25, s: 1, refraction: 0, translucency: 0.25 },
        ])("converts T=$t, S=$s to refraction $refraction and translucency $translucency", async ({ t, s, refraction, translucency }) => {
            const { material, adapter } = createThinWalledAdapter(t, s);

            // Nothing is converted until finalization.
            expect(adapter.transmissionWeight).toBe(t);
            expect(adapter.subsurfaceWeight).toBe(0);

            await adapter.finalizeAsync(loader);

            expect(adapter.transmissionWeight).toBeCloseTo(refraction, 6);
            expect(adapter.subsurfaceWeight).toBeCloseTo(translucency, 6);
            expect(material.subSurface.refractionIntensityTexture).toBeNull();
            expect(material.subSurface.translucencyIntensityTexture).toBeNull();
        });

        it("keeps independently configured diffuse transmission when there is no transmission to convert", async () => {
            const { adapter } = createAdapter("mat");
            adapter.configureSubsurface();
            adapter.subsurfaceWeight = 0.4;
            adapter.thinWalledScatterStrengthFactor = 0.5;

            await adapter.finalizeAsync(loader);

            expect(adapter.transmissionWeight).toBe(0);
            expect(adapter.subsurfaceWeight).toBe(0.4);
        });
    });

    it("does not change the transmission weight when the subsurface weight is set", () => {
        const { adapter } = createAdapter("mat");
        adapter.configureTransmission();
        adapter.transmissionWeight = 0.6;
        adapter.configureSubsurface();
        adapter.subsurfaceWeight = 0.3;

        expect(adapter.transmissionWeight).toBe(0.6);
        expect(adapter.subsurfaceWeight).toBe(0.3);
    });

    /**
     * Imports a single-triangle glTF whose only material uses transmission and volume plus the given scatter extension.
     * @param name The material name
     * @param scatterExtensionName The scatter extension to add to the material
     * @param scatterExtension The scatter extension's properties
     * @param transmissionFactor The KHR_materials_transmission factor
     * @returns The imported PBR material
     */
    async function importVolumeScatterMaterialAsync(name: string, scatterExtensionName: string, scatterExtension: object, transmissionFactor = 1): Promise<PBRMaterial> {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(positions.buffer)));
        const gltf = {
            asset: { version: "2.0" },
            extensionsUsed: ["KHR_materials_transmission", "KHR_materials_volume", scatterExtensionName],
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ mesh: 0 }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
            materials: [
                {
                    name,
                    extensions: {
                        KHR_materials_transmission: { transmissionFactor },
                        KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 2, attenuationColor: [0.9, 0.6, 0.3] },
                        [scatterExtensionName]: scatterExtension,
                    },
                },
            ],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
            bufferViews: [{ buffer: 0, byteLength: 36 }],
            buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${base64}` }],
        };

        await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene);

        const material = scene.materials.find((m) => m.name === name) as PBRMaterial;
        expect(material).toBeInstanceOf(PBRMaterial);
        return material;
    }

    // KHR_materials_scatter stages the multiscatter color through the transmissionScatter setter, which must
    // write the separate translucency color rather than the volume attenuation tint. A zero scatter strength
    // leaves nothing for finalizeAsync to convert, so the attenuation must be unchanged once loading completes.
    it("preserves the volume attenuation when importing volumetric KHR_materials_scatter with zero scatter strength", async () => {
        const material = await importVolumeScatterMaterialAsync("volumetricScatter", "KHR_materials_scatter", {
            multiscatterColorFactor: [0.2, 0.4, 0.8],
            scatterStrengthFactor: 0,
        });

        const tint = material.subSurface.tintColor;
        expect(tint.r).toBeCloseTo(0.9, 5);
        expect(tint.g).toBeCloseTo(0.6, 5);
        expect(tint.b).toBeCloseTo(0.3, 5);
        expect(material.subSurface.tintColorAtDistance).toBeCloseTo(2, 5);
        const scatter = material.subSurface.translucencyColor!;
        expect(scatter).not.toBe(tint);
        expect(scatter.r).toBeCloseTo(0.2, 5);
        expect(scatter.g).toBeCloseTo(0.4, 5);
        expect(scatter.b).toBeCloseTo(0.8, 5);
    });

    // KHR_materials_scatter only redistributes transmitted light, so it must have no visible effect on a
    // dielectric without transmission, even at full scatter strength.
    it("keeps volumetric KHR_materials_scatter inert when transmissionFactor is zero", async () => {
        const material = await importVolumeScatterMaterialAsync(
            "opaqueScatter",
            "KHR_materials_scatter",
            {
                multiscatterColorFactor: [0.2, 0.4, 0.8],
                scatterStrengthFactor: 1,
            },
            0
        );

        expect(material.subSurface.isRefractionEnabled).toBe(false);
        expect(material.subSurface.isTranslucencyEnabled).toBe(false);
    });

    // The legacy KHR_materials_volume_scatter loader writes the scattering coefficient in place through the
    // transmissionScatter getter. That must not alias (and overwrite) the attenuation color.
    it("preserves attenuationColor when importing KHR_materials_volume_scatter", async () => {
        const material = await importVolumeScatterMaterialAsync("legacyScatter", "KHR_materials_volume_scatter", {
            multiscatterColorFactor: [0.5, 0.5, 0.5],
            scatterAnisotropy: 0,
        });
        const tint = material.subSurface.tintColor;
        expect(tint.r).toBeCloseTo(0.9, 5);
        expect(tint.g).toBeCloseTo(0.6, 5);
        expect(tint.b).toBeCloseTo(0.3, 5);
        const scatter = material.subSurface.translucencyColor!;
        expect(scatter).not.toBe(tint);
        // Scattering coefficient * depth = -log(attenuationColor) * singleScatterAlbedo, which is non-zero here.
        expect(scatter.r).toBeGreaterThan(0);
        expect(scatter.r).not.toBeCloseTo(0.9, 2);
    });
});
