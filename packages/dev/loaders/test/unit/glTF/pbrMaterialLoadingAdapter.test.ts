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

    // The legacy KHR_materials_volume_scatter loader writes the scattering coefficient in place through the
    // transmissionScatter getter. That must not alias (and overwrite) the attenuation color.
    it("preserves attenuationColor when importing KHR_materials_volume_scatter", async () => {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(positions.buffer)));
        const gltf = {
            asset: { version: "2.0" },
            extensionsUsed: ["KHR_materials_transmission", "KHR_materials_volume", "KHR_materials_volume_scatter"],
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ mesh: 0 }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
            materials: [
                {
                    name: "legacyScatter",
                    extensions: {
                        KHR_materials_transmission: { transmissionFactor: 1 },
                        KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 2, attenuationColor: [0.9, 0.6, 0.3] },
                        KHR_materials_volume_scatter: { multiscatterColorFactor: [0.5, 0.5, 0.5], scatterAnisotropy: 0 },
                    },
                },
            ],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
            bufferViews: [{ buffer: 0, byteLength: 36 }],
            buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${base64}` }],
        };

        await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene);

        const material = scene.materials.find((m) => m.name === "legacyScatter") as PBRMaterial;
        expect(material).toBeInstanceOf(PBRMaterial);
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
