import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Quaternion, Vector3 } from "core/Maths/math.vector";

import { CreateCaptureState, HandleCapturedPropertyChange, RecordEntityPropertyOverride } from "../../src/services/overrideCapture";
import { AddOverride, ApplyAllOverrides, DisposeOverrideManager, GetOverrideManager, GetOverrides } from "shared-ui-components/projects/overrideManager";
import { type IOverrideEntry } from "shared-ui-components/projects/overrideEntry";

describe("OverrideCapture", () => {
    let engine: NullEngine;
    let scene: Scene;
    let state: ReturnType<typeof CreateCaptureState>;

    function findOverride(propertyPath: string): IOverrideEntry | undefined {
        return GetOverrides(scene).find((o) => o.propertyPath === propertyPath);
    }

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
        GetOverrideManager(scene);
        state = CreateCaptureState();
    });

    afterEach(() => {
        DisposeOverrideManager(GetOverrideManager(scene));
        scene.dispose();
        engine.dispose();
    });

    describe("rename capture", () => {
        it("records a name override keyed on the original name when a mesh is renamed", () => {
            const mesh = new Mesh("Cube", scene);
            // UI writes the new name before firing the change.
            mesh.name = "Box";
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "name", oldValue: "Cube", newValue: "Box" });

            const nameOverride = findOverride("name");
            expect(nameOverride).toBeDefined();
            expect(nameOverride?.targetType).toBe("meshes");
            expect(nameOverride?.targetName).toBe("Cube");
            expect(nameOverride?.value).toBe("Box");
        });

        it("keeps the original name across repeated renames and updates the value in place", () => {
            const mesh = new Mesh("Cube", scene);
            mesh.name = "Box";
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "name", oldValue: "Cube", newValue: "Box" });
            mesh.name = "Sphere";
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "name", oldValue: "Box", newValue: "Sphere" });

            const nameOverrides = GetOverrides(scene).filter((o) => o.propertyPath === "name");
            expect(nameOverrides.length).toBe(1);
            expect(nameOverrides[0].targetName).toBe("Cube");
            expect(nameOverrides[0].value).toBe("Sphere");
        });

        it("removes the name override when renamed back to the original name", () => {
            const mesh = new Mesh("Cube", scene);
            mesh.name = "Box";
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "name", oldValue: "Cube", newValue: "Box" });
            mesh.name = "Cube";
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "name", oldValue: "Box", newValue: "Cube" });

            expect(GetOverrides(scene).filter((o) => o.propertyPath === "name").length).toBe(0);
        });

        it("records name overrides for materials too", () => {
            const mat = new StandardMaterial("MatA", scene);
            mat.name = "MatB";
            HandleCapturedPropertyChange(scene, state, { entity: mat, propertyKey: "name", oldValue: "MatA", newValue: "MatB" });

            const nameOverride = findOverride("name");
            expect(nameOverride?.targetType).toBe("materials");
            expect(nameOverride?.targetName).toBe("MatA");
            expect(nameOverride?.value).toBe("MatB");
        });
    });

    describe("parent capture (dropdown path)", () => {
        it("records a parent override as a node reference", () => {
            const parent = new Mesh("ParentMesh", scene);
            const child = new Mesh("ChildMesh", scene);
            child.parent = parent;
            HandleCapturedPropertyChange(scene, state, { entity: child, propertyKey: "parent", oldValue: null, newValue: parent });

            const parentOverride = findOverride("parent");
            expect(parentOverride).toBeDefined();
            expect(parentOverride?.targetType).toBe("meshes");
            expect(parentOverride?.targetName).toBe("ChildMesh");
            expect(parentOverride?.value).toBe("ref:ParentMesh");
        });

        it("records a null parent override when parent is cleared", () => {
            const parent = new Mesh("ParentMesh", scene);
            const child = new Mesh("ChildMesh", scene);
            child.parent = parent;
            HandleCapturedPropertyChange(scene, state, { entity: child, propertyKey: "parent", oldValue: parent, newValue: null });

            const parentOverride = findOverride("parent");
            expect(parentOverride).toBeDefined();
            expect(parentOverride?.value).toBeNull();
        });
    });

    describe("rotation capture", () => {
        it("records a quaternion rotation override as a 4-component array", () => {
            const mesh = new Mesh("Cube", scene);
            const q = Quaternion.RotationYawPitchRoll(0.5, 0.25, 0.1);
            mesh.rotationQuaternion = q;
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "rotationQuaternion", oldValue: null, newValue: q });

            const rotOverride = findOverride("rotationQuaternion");
            expect(rotOverride).toBeDefined();
            expect(rotOverride?.value).toEqual([q.x, q.y, q.z, q.w]);
        });

        it("records an euler rotation override as a 3-component array", () => {
            const mesh = new Mesh("Cube", scene);
            const rot = new Vector3(0.1, 0.2, 0.3);
            mesh.rotation = rot;
            HandleCapturedPropertyChange(scene, state, { entity: mesh, propertyKey: "rotation", oldValue: new Vector3(0, 0, 0), newValue: rot });

            const rotOverride = findOverride("rotation");
            expect(rotOverride).toBeDefined();
            expect(rotOverride?.value).toEqual([0.1, 0.2, 0.3]);
        });
    });

    describe("RecordEntityPropertyOverride (direct, used by scene-explorer commands)", () => {
        it("records an isVisible override (eye toggle path)", () => {
            const mesh = new Mesh("Cube", scene);
            mesh.isVisible = false;
            RecordEntityPropertyOverride(scene, mesh, "isVisible", false, true);

            const override = findOverride("isVisible");
            expect(override).toBeDefined();
            expect(override?.targetType).toBe("meshes");
            expect(override?.targetName).toBe("Cube");
            expect(override?.value).toBe(false);
        });

        it("records a parent override (drag reparent path)", () => {
            const parent = new TransformNode("Root", scene);
            const child = new Mesh("Cube", scene);
            child.parent = parent;
            RecordEntityPropertyOverride(scene, child, "parent", parent, null);

            const override = findOverride("parent");
            expect(override?.value).toBe("ref:Root");
        });
    });

    describe("node reference resolution round-trip", () => {
        it("re-applies a parent node reference on reload", () => {
            const parent = new Mesh("ParentMesh", scene);
            const child = new Mesh("ChildMesh", scene);

            AddOverride(scene, {
                targetType: "meshes",
                targetName: "ChildMesh",
                targetIndex: 0,
                propertyPath: "parent",
                value: "ref:ParentMesh",
            });

            expect(child.parent).toBe(parent);

            child.parent = null;
            ApplyAllOverrides(scene);
            expect(child.parent).toBe(parent);
        });
    });
});
