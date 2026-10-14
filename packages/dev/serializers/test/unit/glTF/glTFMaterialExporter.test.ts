import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { PBRMetallicRoughnessMaterial } from "core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Color3 } from "core/Maths/math.color";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";

import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import { type IKHRMaterialsTransmission, type IKHRTextureTransform, type IMaterial } from "babylonjs-gltf2interface";
import { CreateTestScene, CreateTriangleGltf, ExportGltfAsync, RoundTripGltfAsync } from "./glTFTestUtils";

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

    // https://forum.babylonjs.com/t/nullengine-glb-export-with-textures-workaround/62541 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17952)
    // https://forum.babylonjs.com/t/glb-export-broken-under-nullengine-in-v9-root-cause-and-fix/63231 (fixed by https://github.com/BabylonJS/Babylon.js/pull/18357)
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

    async function roundTripMaterial(material: IMaterial): Promise<IMaterial> {
        const name = `material${materialCount++}`;
        const source = CreateTriangleGltf();
        source.materials[0] = { name, ...material };
        source.extensionsUsed = Object.keys(material.extensions ?? {});
        const gltf = await RoundTripGltfAsync(testScene.scene, source);
        const exported = gltf.materials.find((m) => m.name === name);
        if (!exported) {
            throw new Error(`Expected exported material ${name}`);
        }
        return exported;
    }

    function createCachedTexture(name: string): Texture {
        const texture = new Texture(name, testScene.scene, { buffer: OnePixelRedPng, mimeType: "image/png" });
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            throw new Error("Expected an internal texture");
        }
        internalTexture._buffer = OnePixelRedPng;
        return texture;
    }

    // https://forum.babylonjs.com/t/broken-textures-after-glb-export/60756 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17237)
    it("exports finite metallic-roughness factors from black specular-glossiness", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMaterial("specGloss", testScene.scene);
        material.metallic = null;
        material.roughness = null;
        material.albedoColor = new Color3(0.5, 0.25, 0.75);
        material.reflectivityColor = Color3.Black();
        material.microSurface = 0.6;
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const pbr = gltf.materials[0].pbrMetallicRoughness;
        if (!pbr?.baseColorFactor) {
            throw new Error("Expected metallic-roughness factors");
        }
        const factors = [...pbr.baseColorFactor, pbr.metallicFactor ?? 1, pbr.roughnessFactor ?? 1];
        expect(factors.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
    });

    // https://forum.babylonjs.com/t/sandbox-the-khr-texture-transform-property-of-gltfexport-cannot-be-exported/55425 (fixed by https://github.com/BabylonJS/Babylon.js/pull/16015 and https://github.com/BabylonJS/Babylon.js/pull/16199)
    // https://forum.babylonjs.com/t/glb-export-uv-mapping-not-saving/36140 (fixed by https://github.com/BabylonJS/Babylon.js/pull/13305)
    it("exports KHR_texture_transform with scaling and a non-origin rotation center", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMaterial("material", testScene.scene);
        material.metallic = 0;
        material.roughness = 1;
        const texture = createCachedTexture("baseColor.png");
        texture.uOffset = 0.1;
        texture.vOffset = 0.2;
        texture.uScale = 2;
        texture.vScale = 3;
        texture.uRotationCenter = 0.5;
        texture.vRotationCenter = 0.25;
        texture.wAng = Math.PI / 2;
        material.albedoTexture = texture;
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const extension = gltf.materials[0].pbrMetallicRoughness?.baseColorTexture?.extensions?.KHR_texture_transform as IKHRTextureTransform | undefined;
        if (!extension?.offset || !extension.scale || extension.rotation === undefined) {
            throw new Error("Expected KHR_texture_transform values");
        }
        expect(extension.offset[0]).toBeCloseTo(1.85);
        expect(extension.offset[1]).toBeCloseTo(-0.05);
        expect(extension.scale).toEqual([2, 3]);
        expect(extension.rotation).toBeCloseTo(-Math.PI / 2);
    });

    // https://forum.babylonjs.com/t/gltf2export-glbasync-missing-uv-scale-on-ambienttexture/39900 (fixed by https://github.com/BabylonJS/Babylon.js/pull/13746)
    it("exports KHR_texture_transform for ambient textures", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMaterial("material", testScene.scene);
        material.metallic = 0;
        material.roughness = 1;
        const texture = createCachedTexture("ambient.png");
        texture.uScale = 0.25;
        texture.vScale = 0.5;
        material.ambientTexture = texture;
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const extension = gltf.materials[0].occlusionTexture?.extensions?.KHR_texture_transform as IKHRTextureTransform | undefined;

        expect(extension?.scale).toEqual([0.25, 0.5]);
    });

    // https://forum.babylonjs.com/t/gltf-export-lost-transmission-texture/53315 (fixed by https://github.com/BabylonJS/Babylon.js/pull/15559)
    it("exports KHR_materials_transmission textures", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMaterial("material", testScene.scene);
        material.metallic = 0;
        material.roughness = 1;
        material.subSurface.isRefractionEnabled = true;
        material.subSurface.refractionIntensity = 0.7;
        material.subSurface.useGltfStyleTextures = true;
        material.subSurface.refractionIntensityTexture = createCachedTexture("transmission.png");
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const extension = gltf.materials[0].extensions?.KHR_materials_transmission as IKHRMaterialsTransmission | undefined;

        expect(extension?.transmissionFactor).toBeCloseTo(0.7);
        expect(extension?.transmissionTexture?.index).toBeDefined();
    });

    // https://forum.babylonjs.com/t/gltf-material-emissivestrength-is-not-exported-though-imported/37971 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17205)
    it("exports emissiveIntensity through KHR_materials_emissive_strength", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMaterial("material", testScene.scene);
        material.metallic = 0;
        material.roughness = 1;
        material.emissiveColor = new Color3(0.25, 0.5, 1);
        material.emissiveIntensity = 3;
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const exported = gltf.materials[0];
        const extension = exported.extensions?.KHR_materials_emissive_strength;
        if (!extension || typeof extension !== "object") {
            throw new Error("Expected KHR_materials_emissive_strength");
        }

        expect(exported.emissiveFactor).toEqual([0.25, 0.5, 1]);
        expect(extension.emissiveStrength).toBeCloseTo(3);
    });

    // https://forum.babylonjs.com/t/the-gltf2exported-glb-doesnt-contain-the-assigned-pbrmetallicroughnessmaterial-in-newer-versions/59353 (fixed by https://github.com/BabylonJS/Babylon.js/pull/16857)
    it("exports PBRMetallicRoughnessMaterial", async () => {
        const box = CreateBox("box", {}, testScene.scene);
        const material = new PBRMetallicRoughnessMaterial("metalRough", testScene.scene);
        material.baseColor = new Color3(0.2, 0.4, 0.6);
        material.metallic = 0.3;
        material.roughness = 0.7;
        box.material = material;

        const gltf = await ExportGltfAsync(testScene.scene);
        const exported = gltf.materials[0];

        expect(exported.name).toBe("metalRough");
        expect(exported.pbrMetallicRoughness?.baseColorFactor).toEqual([0.2, 0.4, 0.6, 1]);
        expect(exported.pbrMetallicRoughness?.metallicFactor).toBeCloseTo(0.3);
        expect(exported.pbrMetallicRoughness?.roughnessFactor).toBeCloseTo(0.7);
    });

    it("round trips metallic-roughness factors, emissive and double-sidedness", async () => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [0.25, 0.5, 0.75, 1], metallicFactor: 0.6, roughnessFactor: 0.4 },
            emissiveFactor: [0.1, 0.2, 0.3],
            doubleSided: true,
        });

        const pbr = material.pbrMetallicRoughness;
        if (!pbr?.baseColorFactor || pbr.metallicFactor === undefined || pbr.roughnessFactor === undefined) {
            throw new Error("Expected metallic-roughness material factors");
        }
        expect(pbr.baseColorFactor).toEqual([0.25, 0.5, 0.75, 1]);
        expect(pbr.metallicFactor).toBeCloseTo(0.6);
        expect(pbr.roughnessFactor).toBeCloseTo(0.4);
        expect(material.emissiveFactor).toEqual([0.1, 0.2, 0.3]);
        expect(material.doubleSided).toBe(true);
    });

    it("round trips the alpha modes", async () => {
        const blend = await roundTripMaterial({ alphaMode: "BLEND" as IMaterial["alphaMode"], pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 0.5] } });
        const mask = await roundTripMaterial({ alphaMode: "MASK" as IMaterial["alphaMode"], alphaCutoff: 0.3, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } });
        const opaque = await roundTripMaterial({ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } });

        expect(blend.alphaMode).toBe("BLEND");
        const blendBaseColor = blend.pbrMetallicRoughness?.baseColorFactor;
        if (!blendBaseColor || mask.alphaCutoff === undefined) {
            throw new Error("Expected alpha material factors");
        }
        expect(blendBaseColor[3]).toBeCloseTo(0.5);
        expect(mask.alphaMode).toBe("MASK");
        expect(mask.alphaCutoff).toBeCloseTo(0.3);
        expect(opaque.alphaMode ?? "OPAQUE").toBe("OPAQUE");
    });

    const extensions: Record<string, Record<string, number | number[]>> = {
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

    // https://forum.babylonjs.com/t/anisotropic-values-not-saved-when-exporting-glb-from-sandbox/29944 is covered by the KHR_materials_anisotropy case.
    it.each(Object.keys(extensions))("round trips %s", async (name) => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 },
            emissiveFactor: [1, 1, 1],
            ...(name === "KHR_materials_volume"
                ? { extensions: { KHR_materials_transmission: { transmissionFactor: 1 }, [name]: extensions[name] } }
                : { extensions: { [name]: extensions[name] } }),
        });

        const round = (value: unknown) => {
            const values = Array.isArray(value) ? value : [value];
            if (!values.every((item): item is number => typeof item === "number")) {
                throw new Error("Expected numeric material extension values");
            }
            return values.map((item) => Math.round(item * 1e4) / 1e4);
        };
        const expected = Object.fromEntries(Object.entries(extensions[name]).map(([key, value]) => [key, round(value)]));
        const outputExtensions = material.extensions;
        const extension = outputExtensions?.[name];
        if (!extension || typeof extension !== "object") {
            throw new Error(`Expected exported ${name} extension`);
        }
        const actual = Object.fromEntries(Object.keys(expected).map((key) => [key, round(extension[key])]));
        expect(actual).toEqual(expected);
    });

    it("round trips unlit materials", async () => {
        const material = await roundTripMaterial({
            pbrMetallicRoughness: { baseColorFactor: [0.2, 0.4, 0.6, 1] },
            extensions: { KHR_materials_unlit: {} },
        });

        if (!material.extensions?.KHR_materials_unlit || !material.pbrMetallicRoughness?.baseColorFactor) {
            throw new Error("Expected unlit material properties");
        }
        expect(material.pbrMetallicRoughness.baseColorFactor).toEqual([0.2, 0.4, 0.6, 1]);
    });
});
