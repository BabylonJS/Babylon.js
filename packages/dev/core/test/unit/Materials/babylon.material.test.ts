import { Engine, NullEngine } from "core/Engines";
import { BackgroundMaterial, PBRMaterial, StandardMaterial, Texture } from "core/Materials";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Describes the test suite.
 */
describe("Babylon Material", function () {
    let subject: Engine;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("#PBRMaterial", () => {
        it("forceCompilation of a single material", async () => {
            const scene = new Scene(subject);
            const mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            const material = new PBRMaterial("material", scene);
            expect(await material.forceCompilationAsync(mesh)).toBeUndefined();
        });
        it("forceCompilation of already compiled material", async () => {
            const scene = new Scene(subject);
            const mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            const material = new PBRMaterial("material", scene);
            material.albedoTexture = new Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            expect(
                await material.forceCompilationAsync(mesh).then(() => {
                    return material.forceCompilationAsync(mesh);
                })
            ).toBeUndefined();
        });
        it("forceCompilation of same material in parallel", async () => {
            const scene = new Scene(subject);
            const mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            const material = new PBRMaterial("material", scene);
            material.albedoTexture = new Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            expect(await Promise.all([material.forceCompilationAsync(mesh), material.forceCompilationAsync(mesh)])).toHaveLength(2);
        });
        it("Clone PBR material with and without cloning repeated textures", () => {
            const scene = new Scene(subject);
            const baseMaterial = new PBRMaterial("material", scene);
            const texture = new Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            baseMaterial.albedoTexture = texture;
            baseMaterial.opacityTexture = texture;
            const repeatCloneMaterial = baseMaterial.clone("repeatClonedMaterial", false);
            expect(Object.is(repeatCloneMaterial.albedoTexture, repeatCloneMaterial.opacityTexture)).toBe(false);

            const noRepeatCloneMaterial = baseMaterial.clone("noRepeatClonedMaterial", true);
            expect(Object.is(noRepeatCloneMaterial.albedoTexture, noRepeatCloneMaterial.opacityTexture)).toBe(true);
        });

        it("uses the surface index of refraction as the default volume index", () => {
            const scene = new Scene(subject);
            const material = new PBRMaterial("material", scene);

            expect(material.subSurface.volumeIndexOfRefraction).toBe(1.5);

            material.subSurface.indexOfRefraction = 1.3;
            expect(material.subSurface.volumeIndexOfRefraction).toBe(1.3);

            material.subSurface.volumeIndexOfRefraction = 1.1;
            expect(material.subSurface.volumeIndexOfRefraction).toBe(1.1);

            material.subSurface.volumeIndexOfRefraction = 0;
            expect(material.subSurface.volumeIndexOfRefraction).toBe(1.3);
        });

        it("Clone Standard material with and without cloning repeated textures", () => {
            const scene = new Scene(subject);
            const baseMaterial = new StandardMaterial("material", scene);
            const texture = new Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            baseMaterial.diffuseTexture = texture;
            baseMaterial.opacityTexture = texture;
            const repeatCloneMaterial = baseMaterial.clone("repeatClonedMaterial", false);
            expect(Object.is(repeatCloneMaterial.diffuseTexture, repeatCloneMaterial.opacityTexture)).toBe(false);

            const noRepeatCloneMaterial = baseMaterial.clone("noRepeatClonedMaterial", true);
            expect(Object.is(noRepeatCloneMaterial.diffuseTexture, noRepeatCloneMaterial.opacityTexture)).toBe(true);
        });

        it("updates primary colors when changing background material highlight level", () => {
            const scene = new Scene(subject);
            const material = new BackgroundMaterial("material", scene);
            const computePrimaryColorsSpy = vi.spyOn(material as any, "_computePrimaryColors");

            expect(material.primaryColor.r).toBe(1);

            material.primaryColorHighlightLevel = 0.5;

            expect(computePrimaryColorsSpy).toHaveBeenCalledTimes(1);
        });
    });
});
