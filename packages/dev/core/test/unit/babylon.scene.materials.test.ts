import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { MultiMaterial, StandardMaterial } from "core/Materials";
import { Scene } from "core/scene";

describe("Scene Materials", () => {
    let subject: Engine;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("getMaterialByUniqueID", () => {
        let scene: Scene;

        beforeEach(() => {
            scene = new Scene(subject);
        });

        it("should return the material with the given unique ID", () => {
            const materialX = new StandardMaterial("materialX", scene);

            expect(scene.getMaterialByUniqueID(materialX.uniqueId)).toBe(materialX);
        });

        it("should return material that added to default scene", () => {
            const materialX = new StandardMaterial("materialX");

            expect(scene.getMaterialByUniqueID(materialX.uniqueId)).toBe(materialX);
        });

        it("should return null if the material with the given unique ID does not exist in the current scene", () => {
            const secondaryScene = new Scene(subject);
            const materialX = new StandardMaterial("materialX", secondaryScene);

            expect(scene.getMaterialByUniqueID(materialX.uniqueId)).toBeNull();
        });

        it("should return multiMaterial that added to default scene", () => {
            const multiMaterial = new MultiMaterial("multiMaterial", scene);

            expect(scene.getMaterialByUniqueID(multiMaterial.uniqueId)).toBeNull();
            expect(scene.getMaterialByUniqueID(multiMaterial.uniqueId, true)).toBe(multiMaterial);
        });
    });
});
