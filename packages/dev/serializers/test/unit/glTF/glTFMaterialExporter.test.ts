import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";

import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import { CreateTestScene, CreateTriangleGltf, RoundTripGltfAsync, type GltfJson } from "./glTFTestUtils";

// Minimal 1x1 red PNG — lets us assert a known buffer flows through the
// export pipeline without needing any real image decoding at test time.
const OnePixelRedPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00,
    0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x82, 0x5c, 0x17, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe("glTF Exporter - NullEngine / cached texture path", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loadScriptSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);

        loadScriptSpy = vi.spyOn(Tools, "LoadScriptAsync").mockImplementation(async () => {
            throw new Error("Tools.LoadScriptAsync must not be called in a Node.js environment.");
        });
    });

    afterEach(() => {
        loadScriptSpy.mockRestore();
        scene.dispose();
        engine.dispose();
    });

    // Creates a PBRMaterial in metallic workflow (metallic + roughness are set
    // to non-null values) with an albedo texture whose internal buffer holds
    // known bytes. metallic/roughness must be non-null for isMetallicWorkflow()
    // to return true; otherwise the exporter follows the SpecGloss conversion
    // path, which always requires GPU readback.
    function buildTexturedBox(): { texture: Texture } {
        const box = CreateBox("box", { size: 1 }, scene);
        const material = new PBRMaterial("mat", scene);
        const texture = new Texture("red.png", scene);
        material.albedoTexture = texture;
        material.metallic = 0;
        material.roughness = 1;
        box.material = material;
        return { texture };
    }

    it("exports GLB with invertY=true (default) using cached Uint8Array buffer, without GPU fallback", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        // NullEngine marks createTexture output as InternalTextureSource.Url,
        // which is required by GetCachedImageAsync before reading the buffer.
        expect(internal.source).toBe(InternalTextureSource.Url);
        // invertY defaults to true for URL-loaded textures — this is the exact
        // condition that was (incorrectly) blocking the cached path before the fix.
        expect(internal.invertY).toBe(true);
        internal._buffer = OnePixelRedPng;
        (texture as any)._mimeType = "image/png";

        // Under NullEngine there is no GPU context. If the exporter falls back
        // to GetTextureDataAsync (the GPU readback path) it will throw with
        // "Failed to read pixels from texture". The test passing is therefore
        // an implicit assertion that the cached path was taken.
        const result = await GLTF2Export.GLBAsync(scene, "output");
        expect(result.glTFFiles["output.glb"]).toBeDefined();
    });

    it("exports GLB with a Blob cached on the internal texture buffer", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        internal._buffer = new Blob([OnePixelRedPng], { type: "image/png" });

        const result = await GLTF2Export.GLBAsync(scene, "output");
        expect(result.glTFFiles["output.glb"]).toBeDefined();
    });

    it("falls back to Tools.LoadFileAsync(url) when no buffer is cached, still avoiding GPU readback", async () => {
        const loadFileSpy = vi.spyOn(Tools, "LoadFileAsync").mockImplementation(async () => OnePixelRedPng.buffer.slice(0) as ArrayBuffer);

        try {
            const { texture } = buildTexturedBox();
            const internal = texture.getInternalTexture()!;
            internal._buffer = null;
            internal.url = "/assets/red.png";

            const result = await GLTF2Export.GLBAsync(scene, "output");

            expect(result.glTFFiles["output.glb"]).toBeDefined();
            expect(loadFileSpy).toHaveBeenCalledWith("/assets/red.png");
        } finally {
            loadFileSpy.mockRestore();
        }
    });
});

describe("glTF Exporter - material properties", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    let materialCount = 0;

    async function roundTripMaterial(material: GltfJson): Promise<GltfJson> {
        const name = `material${materialCount++}`;
        const source = CreateTriangleGltf();
        source.materials[0] = { name, ...material };
        source.extensionsUsed = Object.keys(material.extensions ?? {});
        const gltf = await RoundTripGltfAsync(testScene.scene, source);
        return gltf.materials.find((m: GltfJson) => m.name === name);
    }

    it("round trips metallic-roughness factors, emissive and double-sidedness", async () => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [0.25, 0.5, 0.75, 1], metallicFactor: 0.6, roughnessFactor: 0.4 },
            emissiveFactor: [0.1, 0.2, 0.3],
            doubleSided: true,
        });

        expect(material.pbrMetallicRoughness.baseColorFactor).toEqual([0.25, 0.5, 0.75, 1]);
        expect(material.pbrMetallicRoughness.metallicFactor).toBeCloseTo(0.6);
        expect(material.pbrMetallicRoughness.roughnessFactor).toBeCloseTo(0.4);
        expect(material.emissiveFactor).toEqual([0.1, 0.2, 0.3]);
        expect(material.doubleSided).toBe(true);
    });

    it("round trips the alpha modes", async () => {
        const blend = await roundTripMaterial({ alphaMode: "BLEND", pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 0.5] } });
        const mask = await roundTripMaterial({ alphaMode: "MASK", alphaCutoff: 0.3, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } });
        const opaque = await roundTripMaterial({ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } });

        expect(blend.alphaMode).toBe("BLEND");
        expect(blend.pbrMetallicRoughness.baseColorFactor[3]).toBeCloseTo(0.5);
        expect(mask.alphaMode).toBe("MASK");
        expect(mask.alphaCutoff).toBeCloseTo(0.3);
        expect(opaque.alphaMode ?? "OPAQUE").toBe("OPAQUE");
    });

    const extensions: Record<string, GltfJson> = {
        KHR_materials_ior: { ior: 1.8 },
        KHR_materials_emissive_strength: { emissiveStrength: 4 },
        KHR_materials_transmission: { transmissionFactor: 0.7 },
        KHR_materials_volume: { thicknessFactor: 0.5, attenuationDistance: 2, attenuationColor: [0.5, 0.6, 0.7] },
        KHR_materials_specular: { specularFactor: 0.4, specularColorFactor: [0.9, 0.8, 0.7] },
        KHR_materials_sheen: { sheenColorFactor: [0.3, 0.4, 0.5], sheenRoughnessFactor: 0.6 },
        KHR_materials_iridescence: { iridescenceFactor: 0.8, iridescenceIor: 1.4, iridescenceThicknessMinimum: 120, iridescenceThicknessMaximum: 450 },
        KHR_materials_anisotropy: { anisotropyStrength: 0.5, anisotropyRotation: 0.25 },
        KHR_materials_clearcoat: { clearcoatFactor: 0.5, clearcoatRoughnessFactor: 0.3 },
    };

    it.each(Object.keys(extensions))("round trips %s", async (name) => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 },
            emissiveFactor: [1, 1, 1],
            ...(name === "KHR_materials_volume"
                ? { extensions: { KHR_materials_transmission: { transmissionFactor: 1 }, [name]: extensions[name] } }
                : { extensions: { [name]: extensions[name] } }),
        });

        const round = (value: unknown) => [value].flat().map((v) => Math.round((v as number) * 1e4) / 1e4);
        const expected = Object.fromEntries(Object.entries(extensions[name]).map(([key, value]) => [key, round(value)]));
        const actual = Object.fromEntries(Object.keys(expected).map((key) => [key, round(material.extensions[name][key])]));
        expect(actual).toEqual(expected);
    });

    it("round trips unlit materials", async () => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [0.2, 0.4, 0.6, 1] },
            extensions: { KHR_materials_unlit: {} },
        });

        expect(material.extensions.KHR_materials_unlit).toBeDefined();
        expect(material.pbrMetallicRoughness.baseColorFactor).toEqual([0.2, 0.4, 0.6, 1]);
    });
});
