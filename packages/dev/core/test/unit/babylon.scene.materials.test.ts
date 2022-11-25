import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { MultiMaterial, StandardMaterial } from "core/Materials";
import { Scene } from "core/scene";

describe("Scene Materials", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(subject);
    });

    describe("getMaterialByUniqueID", () => {
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

    describe("getMaterialById", () => {
        it("should return the material with the given id", () => {
            const materialX = new StandardMaterial("materialX", scene);

            expect(scene.getMaterialById("000")).toBeNull();
            expect(scene.getMaterialById(materialX.id)).toBe(materialX);
        });

        it("should return material that added to default scene", () => {
            const materialX = new StandardMaterial("materialX");

            expect(scene.getMaterialById(materialX.id)).toBe(materialX);
        });

        it("should return null if the material with the given id does not exist in the current scene", () => {
            const secondaryScene = new Scene(subject);
            const materialX = new StandardMaterial("materialX", secondaryScene);

            expect(scene.getMaterialById(materialX.id)).toBeNull();
        });

        it("should return multiMaterial that added to default scene", () => {
            const multiMaterial = new MultiMaterial("multiMaterial", scene);

            expect(scene.getMaterialById(multiMaterial.id)).toBeNull();
            expect(scene.getMaterialById(multiMaterial.id, true)).toBe(multiMaterial);
        });
    });

    describe("getMaterialByName", () => {
        it("should return the material with the given name", () => {
            const materialX = new StandardMaterial("materialX", scene);

            expect(scene.getMaterialByName("materialX")).toBe(materialX);
        });

        it("should return material that added to default scene", () => {
            const materialX = new StandardMaterial("materialX");

            expect(scene.getMaterialByName(materialX.name)).toBe(materialX);
        });

        it("should return null if the material with the given name does not exist in the current scene", () => {
            const secondaryScene = new Scene(subject);
            const materialX = new StandardMaterial("materialX", secondaryScene);

            expect(scene.getMaterialByName(materialX.name)).toBeNull();
        });

        it("should return multiMaterial that added to default scene", () => {
            const multiMaterial = new MultiMaterial("multiMaterial", scene);

            expect(scene.getMaterialByName(multiMaterial.name)).toBeNull();
            expect(scene.getMaterialByName(multiMaterial.name, true)).toBe(multiMaterial);
        });
    });
});
