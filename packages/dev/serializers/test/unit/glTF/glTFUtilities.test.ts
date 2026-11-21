import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Color3 } from "core/Maths/math.color";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { GLTF2Export } from "serializers/glTF/2.0";
import { Texture } from "core/Materials/Textures/texture";
import type { IGLTF } from "babylonjs-gltf2interface";
import { GetOpenPBRVolumeAttenuation, ShouldExportOpenPBRDiffuseTransmission } from "serializers/glTF/2.0/glTFUtilities";

describe("OpenPBR volume export", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: OpenPBRMaterial;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new OpenPBRMaterial("diffuse", scene);
        material.geometryThinWalled = 0;
        material.subsurfaceWeight = 0.6;
        material.subsurfaceScatterAnisotropy = 1;
        material._gltfDiffuseTransmissionSurfaceToCoat = true;
        material.transmissionColor = Color3.White();
        material.transmissionDepth = 2;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("keeps a non-absorbing diffuse volume finite", () => {
        const attenuation = GetOpenPBRVolumeAttenuation(material, true, false);
        expect(attenuation.attenuationColor).toEqual([1, 1, 1]);
        expect(Number.isFinite(attenuation.attenuationDistance)).toBe(true);
        expect(attenuation.attenuationDistance).toBeGreaterThan(0);
    });

    it("keeps unchanged imported diffuse transmission separate", () => {
        expect(ShouldExportOpenPBRDiffuseTransmission(material, true)).toBe(true);
    });

    it.each([
        [
            "color",
            (mat: OpenPBRMaterial): void => {
                mat.subsurfaceColor.set(0.2, 0.4, 0.6);
            },
        ],
        [
            "radius",
            (mat: OpenPBRMaterial): void => {
                mat.subsurfaceRadius = 0.3;
            },
        ],
        [
            "radius scale",
            (mat: OpenPBRMaterial): void => {
                mat.subsurfaceRadiusScale.set(0.2, 0.4, 0.6);
            },
        ],
        [
            "anisotropy",
            (mat: OpenPBRMaterial): void => {
                mat.subsurfaceScatterAnisotropy = 0.5;
            },
        ],
    ] as const)("uses the merged export after editing subsurface %s", async (_name, edit) => {
        edit(material);
        expect(ShouldExportOpenPBRDiffuseTransmission(material, true)).toBe(false);
        const box = CreateBox("box", {}, scene);
        box.material = material;
        const exported = await GLTF2Export.GLTFAsync(scene, "edited");
        const json: IGLTF = JSON.parse(exported.files["edited.gltf"] as string);
        const extensions = json.materials![0].extensions!;
        expect(extensions.KHR_materials_diffuse_transmission).toBeUndefined();
        expect(extensions.KHR_materials_transmission.transmissionFactor).toBeCloseTo(material.subsurfaceWeight);
        expect(extensions.KHR_materials_scatter.scatterAnisotropy).toBe(material.subsurfaceScatterAnisotropy);
        expect(extensions.KHR_materials_scatter.multiscatterColorFactor).toEqual(material.subsurfaceColor.asArray());
        expect(extensions.KHR_materials_volume.attenuationDistance).toBeCloseTo(
            material.subsurfaceRadius * Math.min(material.subsurfaceRadiusScale.r, material.subsurfaceRadiusScale.g, material.subsurfaceRadiusScale.b)
        );
    });

    it.each(["subsurfaceColorTexture", "subsurfaceRadiusScaleTexture", "subsurfaceWeightTexture"] as const)("uses the merged export after assigning %s", (property) => {
        material[property] = new Texture(null, scene);
        expect(ShouldExportOpenPBRDiffuseTransmission(material, true)).toBe(false);
    });
});
