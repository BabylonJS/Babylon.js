import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Material, MultiMaterial, StandardMaterial } from "core/Materials";
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

        it("should looking for material first before looking for multiMaterial", () => {
            const materialX = new StandardMaterial("materialX", scene);
            const multiMaterial = new MultiMaterial("multiMaterial", scene);

            expect(scene.getMaterialByUniqueID(materialX.uniqueId, true)).toBe(materialX);
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

        it("should looking for material first before looking for multiMaterial", () => {
            const materialX = new StandardMaterial("materialX", scene);

            expect(scene.getMaterialById(materialX.id, true)).toBe(materialX);

            const multiMaterial = new MultiMaterial("materialX", scene);

            expect(scene.getMaterialById(multiMaterial.id, true)).toBe(materialX);
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

        it("should looking for material first before looking for multiMaterial", () => {
            const materialX = new StandardMaterial("materialX", scene);
            const multiMaterial = new MultiMaterial("materialX", scene);

            expect(scene.getMaterialByName("materialX", true)).toBe(materialX);
        });

        it("should not to return the material that was renamed after creation", () => {
            const materialX = new StandardMaterial("materialX", scene);

            materialX.name = "materialY";

            expect(scene.getMaterialByName("materialX")).toBeNull();
        });
    });

    describe("getLastMaterialById", () => {
        it("should return the last material with the given id", () => {
            const materialX1 = new StandardMaterial("materialX", scene);
            const materialX2 = new StandardMaterial("materialX", scene);

            expect(scene.getLastMaterialById("000")).toBeNull();
            expect(scene.getLastMaterialById("materialX")).toBe(materialX2);
        });

        it("should return multiMaterial that added to default scene", () => {
            const multiMaterial1 = new MultiMaterial("multiMaterial", scene);
            const multiMaterial2 = new MultiMaterial("multiMaterial", scene);

            expect(scene.getLastMaterialById(multiMaterial1.id)).toBeNull();
            expect(scene.getLastMaterialById(multiMaterial1.id, true)).toBe(multiMaterial2);
        });

        it("should looking for material first before looking for multiMaterial", () => {
            const materialX1 = new StandardMaterial("materialX", scene);
            const materialX2 = new StandardMaterial("materialX", scene);

            expect(scene.getLastMaterialById("materialX", true)).toBe(materialX2);

            new MultiMaterial("materialX", scene);
            new MultiMaterial("materialX", scene);

            expect(scene.getLastMaterialById("materialX", true)).toBe(materialX2);
        });
    });

    describe("markAllMaterialsAsDirty", () => {
        it("should mark all materials as dirty", () => {
            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);

            const materialXSpy = jest.spyOn(materialX, "markAsDirty");
            const materialYSpy = jest.spyOn(materialY, "markAsDirty");

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);

            expect(materialXSpy).toHaveBeenCalledWith(Material.TextureDirtyFlag);
            expect(materialYSpy).toHaveBeenCalledWith(Material.TextureDirtyFlag);

            scene.markAllMaterialsAsDirty(Material.AllDirtyFlag);

            expect(materialXSpy).toHaveBeenCalledWith(Material.AllDirtyFlag);
            expect(materialYSpy).toHaveBeenCalledWith(Material.AllDirtyFlag);
        });

        it("should mark as dirty only materials limited by predicate", () => {
            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);

            const materialXSpy = jest.spyOn(materialX, "markAsDirty");
            const materialYSpy = jest.spyOn(materialY, "markAsDirty");

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag, (material) => material.name === "materialX");

            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialXSpy).toHaveBeenCalledWith(Material.TextureDirtyFlag);
            expect(materialYSpy).not.toHaveBeenCalled();

            scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag, (material) => material.name === "000");

            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialYSpy).not.toHaveBeenCalled();
        });
    });

    describe("freezeMaterials", () => {
        it("should call freeze on the all scene materials and dont touch other", () => {
            const secondaryScene = new Scene(subject);
            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);
            const materialZ = new StandardMaterial("materialZ", secondaryScene);

            const materialXSpy = jest.spyOn(materialX, "freeze");
            const materialYSpy = jest.spyOn(materialY, "freeze");
            const materialZSpy = jest.spyOn(materialZ, "freeze");

            scene.freezeMaterials();

            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialYSpy).toBeCalledTimes(1);
            expect(materialZSpy).toBeCalledTimes(0);
        });

        it("should don't touch multimaterials", () => {
            const secondaryScene = new Scene(subject);

            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);
            const materialZ = new StandardMaterial("materialZ", secondaryScene);

            const multiMaterial = new MultiMaterial("multiMaterial", scene);
            multiMaterial.subMaterials.push(materialX);
            multiMaterial.subMaterials.push(materialY);
            multiMaterial.subMaterials.push(materialZ);

            const multiMaterialSpy = jest.spyOn(multiMaterial, "freeze");
            const materialXSpy = jest.spyOn(materialX, "freeze");
            const materialYSpy = jest.spyOn(materialY, "freeze");
            const materialZSpy = jest.spyOn(materialZ, "freeze");

            scene.freezeMaterials();

            expect(multiMaterialSpy).toBeCalledTimes(0);
            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialYSpy).toBeCalledTimes(1);
            expect(materialZSpy).toBeCalledTimes(0);
        });
    });

    describe("unfreezeMaterials", () => {
        it("should call unfreeze on the all scene materials and dont touch other", () => {
            const secondaryScene = new Scene(subject);
            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);
            const materialZ = new StandardMaterial("materialZ", secondaryScene);

            const materialXSpy = jest.spyOn(materialX, "unfreeze");
            const materialYSpy = jest.spyOn(materialY, "unfreeze");
            const materialZSpy = jest.spyOn(materialZ, "unfreeze");

            scene.unfreezeMaterials();

            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialYSpy).toBeCalledTimes(1);
            expect(materialZSpy).toBeCalledTimes(0);
        });

        it("should don't touch multimaterials", () => {
            const secondaryScene = new Scene(subject);

            const materialX = new StandardMaterial("materialX", scene);
            const materialY = new StandardMaterial("materialY", scene);
            const materialZ = new StandardMaterial("materialZ", secondaryScene);

            const multiMaterial = new MultiMaterial("multiMaterial", scene);
            multiMaterial.subMaterials.push(materialX);
            multiMaterial.subMaterials.push(materialY);
            multiMaterial.subMaterials.push(materialZ);

            const multiMaterialSpy = jest.spyOn(multiMaterial, "unfreeze");
            const materialXSpy = jest.spyOn(materialX, "unfreeze");
            const materialYSpy = jest.spyOn(materialY, "unfreeze");
            const materialZSpy = jest.spyOn(materialZ, "unfreeze");

            scene.unfreezeMaterials();

            expect(multiMaterialSpy).toBeCalledTimes(0);
            expect(materialXSpy).toBeCalledTimes(1);
            expect(materialYSpy).toBeCalledTimes(1);
            expect(materialZSpy).toBeCalledTimes(0);
        });
    });
});
