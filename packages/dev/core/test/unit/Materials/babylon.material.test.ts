import { FreeCamera } from "core/Cameras/freeCamera";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Vector3 } from "core/Maths/math.vector";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { MeshBuilder } from "core/Meshes/meshBuilder";
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
        it("binds lights for frozen materials when uniform buffers must be rebound every draw", async () => {
            subject._features.needToAlwaysBindUniformBuffers = true;

            const scene = new Scene(subject);
            new FreeCamera("camera", new Vector3(0, 0, -5), scene);
            scene.updateTransformMatrix(true);
            const mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            const material = new StandardMaterial("material", scene);
            const light = new HemisphericLight("light", Vector3.Up(), scene);
            const bindLight = vi.spyOn(light, "_bindLight");
            mesh.material = material;

            const subMesh = mesh.subMeshes[0];
            await material.forceCompilationAsync(mesh);
            expect(material.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

            material.freeze();
            material.bindForSubMesh(mesh.getWorldMatrix(), mesh, subMesh);
            bindLight.mockClear();

            material.bindForSubMesh(mesh.getWorldMatrix(), mesh, subMesh);

            expect(bindLight).toHaveBeenCalledTimes(1);

            scene.dispose();
        });

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
    });
});
