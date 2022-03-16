import { Engine, NullEngine } from "core/Engines";
import { PBRMaterial, Texture } from "core/Materials";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

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
    });
});
