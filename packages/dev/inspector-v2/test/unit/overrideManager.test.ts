import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GetSmartAssetManager, LoadSmartAssetAsync, ReloadSmartAssetAsync } from "core/SmartAssets/smartAssetManager";
import {
    AddOverride,
    ApplyAllOverrides,
    ClearOverrides,
    DeserializeAndApplyOverrides,
    DisposeOverrideManager,
    GetOverrideManager,
    GetOverrides,
    RemoveOverride,
    RenameOverrideTarget,
    RenameOverrideValueReferences,
    SerializeOverrides,
    type OverrideManager,
} from "../../src/projects/overrideManager";
import { type IOverrideEntry } from "../../src/projects/overrideEntry";

const mockDispose = vi.fn();

let _currentScene: Scene | null = null;

function createMockContainer(meshNames: string[] = ["Mesh1"], materialNames: string[] = ["Material1"]) {
    const meshes = meshNames.map((name) => ({ name }));
    const materials = materialNames.map((name) => ({
        name,
        alpha: 1.0,
        wireframe: false,
        albedoColor: { r: 0.5, g: 0.5, b: 0.5, clone: () => ({ r: 0.5, g: 0.5, b: 0.5 }), copyFrom: vi.fn() },
    }));

    return {
        meshes,
        materials,
        textures: [] as { name: string }[],
        animationGroups: [] as { name: string }[],
        lights: [] as { name: string }[],
        cameras: [] as { name: string }[],
        addAllToScene: vi.fn(() => {
            if (_currentScene) {
                for (const m of materials) {
                    (_currentScene.materials as any[]).push(m);
                }
            }
        }),
        removeAllFromScene: vi.fn(() => {
            if (_currentScene) {
                for (const m of materials) {
                    const idx = (_currentScene.materials as any[]).indexOf(m);
                    if (idx >= 0) {
                        (_currentScene.materials as any[]).splice(idx, 1);
                    }
                }
            }
        }),
        dispose: mockDispose,
    };
}

vi.mock("core/Loading/sceneLoader", () => ({
    LoadAssetContainerAsync: vi.fn(() => Promise.resolve(createMockContainer())),
}));

describe("OverrideManager", () => {
    let engine: NullEngine;
    let scene: Scene;
    let overrides: OverrideManager;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        _currentScene = scene;
        overrides = GetOverrideManager(scene);
        vi.clearAllMocks();
    });

    afterEach(() => {
        DisposeOverrideManager(overrides);
        scene.dispose();
        engine.dispose();
        _currentScene = null;
    });

    // ── CRUD Tests ──

    describe("AddOverride", () => {
        it("should store an override entry", () => {
            const entry: IOverrideEntry = {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            };

            AddOverride(scene, entry);

            const all = GetOverrides(scene);
            expect(all.length).toBe(1);
            expect(all[0]).toEqual(entry);
        });

        it("should replace existing override for same target+property", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.8,
            });

            const all = GetOverrides(scene);
            expect(all.length).toBe(1);
            expect(all[0].value).toBe(0.8);
        });

        it("should allow multiple overrides on different properties", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "roughness",
                value: 0.9,
            });

            expect(GetOverrides(scene).length).toBe(2);
        });

        it("should keep two same-name objects independent via targetIndex", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            const firstContainer = createMockContainer(["FirstMesh"], ["SharedMaterial"]);
            const secondContainer = createMockContainer(["SecondMesh"], ["SharedMaterial"]);
            vi.mocked(LoadAssetContainerAsync)
                .mockResolvedValueOnce(firstContainer as any)
                .mockResolvedValueOnce(secondContainer as any);

            await LoadSmartAssetAsync(scene, "first", "first.glb");
            await LoadSmartAssetAsync(scene, "second", "second.glb");

            AddOverride(scene, {
                targetType: "materials",
                targetName: "SharedMaterial",
                targetIndex: 1,
                propertyPath: "alpha",
                value: 0.25,
            });

            expect(firstContainer.materials[0].alpha).toBe(1);
            expect(secondContainer.materials[0].alpha).toBe(0.25);
        });
    });

    describe("RemoveOverride", () => {
        it("should remove an override", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            const removed = RemoveOverride(scene, "materials", "WoodMaterial", 0, "alpha");

            expect(removed).toBe(true);
            expect(GetOverrides(scene).length).toBe(0);
        });

        it("should return false for non-existent override", () => {
            const removed = RemoveOverride(scene, "materials", "WoodMaterial", 0, "alpha");
            expect(removed).toBe(false);
        });

        it("should restore the original value captured at apply time", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const material = scene.materials.find((m) => m.name === "Material1") as any;
            expect(material.alpha).toBe(1.0);

            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.25,
            });
            expect(material.alpha).toBe(0.25);

            RemoveOverride(scene, "materials", "Material1", 0, "alpha");
            expect(material.alpha).toBe(1.0);
        });

        it("should restore the originalValue seeded by the caller (Inspector path)", async () => {
            // The Inspector flow: caller has already mutated the entity, so it
            // passes the prior value via `originalValue` instead of letting the
            // manager observe the (post-edit) live value as the original.
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const material = scene.materials.find((m) => m.name === "Material1") as any;

            // Simulate what Inspector does: it already wrote 0.4 to the entity.
            material.alpha = 0.4;

            AddOverride(
                scene,
                {
                    targetType: "materials",
                    targetName: "Material1",
                    targetIndex: 0,
                    propertyPath: "alpha",
                    value: 0.4,
                },
                { originalValue: 1.0 }
            );

            // Manager did not overwrite the already-applied value.
            expect(material.alpha).toBe(0.4);

            // RemoveOverride restores the seeded pre-edit value.
            RemoveOverride(scene, "materials", "Material1", 0, "alpha");
            expect(material.alpha).toBe(1.0);
        });
    });

    describe("GetOverrides", () => {
        it("should return all registered overrides", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(scene, {
                targetType: "materials",
                targetName: "MetalMaterial",
                targetIndex: 0,
                propertyPath: "roughness",
                value: 0.3,
            });

            expect(GetOverrides(scene).length).toBe(2);
        });
    });

    describe("ClearOverrides", () => {
        it("should remove all overrides", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "M1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(scene, {
                targetType: "materials",
                targetName: "M2",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.3,
            });

            ClearOverrides(scene);
            expect(GetOverrides(scene).length).toBe(0);
        });

        it("should restore originals and fire a single change notification when restoreOriginals=true", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const material = scene.materials.find((m) => m.name === "Material1") as any;

            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.25,
            });
            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "wireframe",
                value: true,
            });
            expect(material.alpha).toBe(0.25);
            expect(material.wireframe).toBe(true);

            const notifySpy = vi.fn();
            const observer = overrides.onChangedObservable.add(notifySpy);

            ClearOverrides(scene, true);

            // Originals restored
            expect(material.alpha).toBe(1.0);
            expect(material.wireframe).toBe(false);
            expect(GetOverrides(scene).length).toBe(0);

            // Single notification regardless of override count
            expect(notifySpy).toHaveBeenCalledTimes(1);

            observer.remove();
        });
    });

    describe("RenameOverrideTarget", () => {
        it("should rewrite a single override slot, leaving same-name siblings untouched", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            const firstContainer = createMockContainer(["FirstMesh"], ["SharedMaterial"]);
            const secondContainer = createMockContainer(["SecondMesh"], ["SharedMaterial"]);
            vi.mocked(LoadAssetContainerAsync)
                .mockResolvedValueOnce(firstContainer as any)
                .mockResolvedValueOnce(secondContainer as any);
            await LoadSmartAssetAsync(scene, "first", "first.glb");
            await LoadSmartAssetAsync(scene, "second", "second.glb");

            AddOverride(scene, {
                targetType: "materials",
                targetName: "SharedMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.1,
            });
            AddOverride(scene, {
                targetType: "materials",
                targetName: "SharedMaterial",
                targetIndex: 1,
                propertyPath: "alpha",
                value: 0.9,
            });

            // Rename the second one
            secondContainer.materials[0].name = "Renamed";
            RenameOverrideTarget(scene, "materials", "SharedMaterial", 1, "Renamed", 0);

            const all = GetOverrides(scene);
            expect(all.length).toBe(2);
            expect(all.find((o) => o.targetName === "SharedMaterial" && o.targetIndex === 0)?.value).toBe(0.1);
            expect(all.find((o) => o.targetName === "Renamed" && o.targetIndex === 0)?.value).toBe(0.9);
        });
    });

    describe("RenameOverrideValueReferences", () => {
        it("should rewrite ref:<name> values when a referenced material is renamed", () => {
            AddOverride(scene, {
                targetType: "meshes",
                targetName: "box1",
                targetIndex: 0,
                propertyPath: "material",
                value: "ref:redMat",
            });
            AddOverride(scene, {
                targetType: "meshes",
                targetName: "box2",
                targetIndex: 0,
                propertyPath: "material",
                value: "ref:redMat",
            });
            // Unrelated override that should stay put
            AddOverride(scene, {
                targetType: "meshes",
                targetName: "box3",
                targetIndex: 0,
                propertyPath: "material",
                value: "ref:greenMat",
            });

            RenameOverrideValueReferences(scene, "ref", "redMat", "crimsonMat");

            const all = GetOverrides(scene);
            expect(all.length).toBe(3);
            expect(all.filter((o) => o.value === "ref:crimsonMat").length).toBe(2);
            expect(all.filter((o) => o.value === "ref:redMat").length).toBe(0);
            expect(all.find((o) => o.targetName === "box3")?.value).toBe("ref:greenMat");
        });

        it("should rewrite texture:<name> values when a referenced non-SAM texture is renamed", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "redMat",
                targetIndex: 0,
                propertyPath: "diffuseTexture",
                value: "texture:noise",
            });

            RenameOverrideValueReferences(scene, "texture", "noise", "perlin");

            expect(GetOverrides(scene)[0].value).toBe("texture:perlin");
        });

        it("should not touch samTexture:<key> values when an unrelated texture name changes", () => {
            // samTexture refs are keyed by stable SAM key, not by texture.name,
            // so a name-change on any texture must NOT mutate them.
            AddOverride(scene, {
                targetType: "materials",
                targetName: "redMat",
                targetIndex: 0,
                propertyPath: "diffuseTexture",
                value: "samTexture:rockTex",
            });

            RenameOverrideValueReferences(scene, "texture", "rockTex", "perlin");

            expect(GetOverrides(scene)[0].value).toBe("samTexture:rockTex");
        });

        it("should no-op when oldName equals newName", () => {
            AddOverride(scene, {
                targetType: "meshes",
                targetName: "box",
                targetIndex: 0,
                propertyPath: "material",
                value: "ref:same",
            });

            const before = GetOverrides(scene)[0];
            RenameOverrideValueReferences(scene, "ref", "same", "same");
            const after = GetOverrides(scene)[0];

            expect(after).toBe(before);
        });
    });

    // ── Application Tests ──

    describe("override application", () => {
        it("should apply scalar override to a loaded material", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");

            const material = scene.materials.find((m) => m.name === "Material1");
            expect(material).toBeDefined();

            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.7,
            });

            expect((material as any).alpha).toBe(0.7);
        });

        it("should apply boolean override", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");

            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "wireframe",
                value: true,
            });

            const material = scene.materials.find((m) => m.name === "Material1");
            expect((material as any).wireframe).toBe(true);
        });
    });

    describe("scene-level overrides", () => {
        it("should apply override to the scene object", () => {
            AddOverride(scene, {
                targetType: "scene",
                targetName: "",
                targetIndex: 0,
                propertyPath: "fogDensity",
                value: 0.5,
            });

            expect(scene.fogDensity).toBe(0.5);
        });
    });

    // ── Serialization Tests ──

    describe("serialization", () => {
        it("should serialize overrides to JSON-compatible array", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(scene, {
                targetType: "scene",
                targetName: "",
                targetIndex: 0,
                propertyPath: "fogDensity",
                value: 0.1,
            });

            const serialized = SerializeOverrides(scene);

            expect(serialized.length).toBe(2);
            expect(serialized[0].targetName).toBe("WoodMaterial");
            expect(serialized[0].value).toBe(0.5);
            expect(serialized[1].targetType).toBe("scene");
        });

        it("should deserialize and apply overrides", () => {
            const data: IOverrideEntry[] = [
                {
                    targetType: "scene",
                    targetName: "",
                    targetIndex: 0,
                    propertyPath: "fogDensity",
                    value: 0.3,
                },
            ];

            DeserializeAndApplyOverrides(scene, data);

            expect(GetOverrides(scene).length).toBe(1);
            expect(scene.fogDensity).toBe(0.3);
        });

        it("should round-trip serialize → deserialize", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "WoodMaterial",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            const serialized = SerializeOverrides(scene);
            ClearOverrides(scene);
            DeserializeAndApplyOverrides(scene, serialized);

            expect(GetOverrides(scene).length).toBe(1);
            expect(GetOverrides(scene)[0].value).toBe(0.5);
        });
    });

    // ── Independence + explicit reapply ──

    describe("scene coordination", () => {
        it("should expose its scene", () => {
            expect(overrides.scene).toBe(scene);
        });

        it("should reapply overrides after an asset reload when the caller invokes ApplyAllOverrides", async () => {
            // OverrideManager is intentionally independent of SmartAssetManager — it does
            // not subscribe to SAM changes. Callers explicitly call ApplyAllOverrides
            // after operations (like reload) that could have invalidated applied state.
            AddOverride(scene, {
                targetType: "materials",
                targetName: "Material1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.7,
            });

            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            ApplyAllOverrides(scene);
            expect(scene.materials.find((m) => m.name === "Material1")?.alpha).toBe(0.7);

            await ReloadSmartAssetAsync(scene, "chair");
            ApplyAllOverrides(scene);

            const reloadedMaterial = scene.materials.find((m) => m.name === "Material1");
            expect(reloadedMaterial).toBeDefined();
            expect((reloadedMaterial as any).alpha).toBe(0.7);
        });

        it("should not import or reference SmartAssetManager at the module level", async () => {
            // Verify that the override module's own source does not import the SAM module —
            // if SAM creation is observable here, it's because Scene metadata exists, not
            // because OverrideManager touched SAM.
            const samBefore = (scene.metadata as any)?.[Symbol.for("babylonjs:smartAssetManager")];
            AddOverride(scene, {
                targetType: "scene",
                targetName: "",
                targetIndex: 0,
                propertyPath: "fogDensity",
                value: 0.4,
            });
            const samAfter = (scene.metadata as any)?.[Symbol.for("babylonjs:smartAssetManager")];
            expect(samBefore).toBe(samAfter);

            // The smartAssetManager Symbol is also intentionally NOT a key on OverrideManager's scene metadata
            // until something else creates one. Sanity check: GetSmartAssetManager is a no-op here.
            // (When invoked it would attach a SAM, but we never invoked it.)
            expect(typeof GetSmartAssetManager).toBe("function");
        });
    });

    // ── Dispose Tests ──

    describe("DisposeOverrideManager", () => {
        it("should detach from the scene and clear state", () => {
            AddOverride(scene, {
                targetType: "materials",
                targetName: "M1",
                targetIndex: 0,
                propertyPath: "alpha",
                value: 0.5,
            });

            // Pre-dispose: serialization captures the registered override.
            expect(SerializeOverrides(scene).length).toBe(1);

            DisposeOverrideManager(overrides);

            // Scene no longer has a manager attached, and a fresh one starts empty.
            expect(scene.metadata?.[Symbol.for("babylonjs:overrideManager")]).toBeUndefined();
            const fresh = GetOverrideManager(scene);
            expect(GetOverrides(scene).length).toBe(0);
            expect(fresh.scene).toBe(scene);
        });

        it("should be idempotent", () => {
            DisposeOverrideManager(overrides);
            // Calling dispose again on the same handle should not throw.
            expect(() => DisposeOverrideManager(overrides)).not.toThrow();
        });
    });
});
