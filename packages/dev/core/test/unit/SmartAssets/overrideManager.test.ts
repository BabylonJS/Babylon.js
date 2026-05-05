import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import {
    type IOverrideEntry,
    type OverrideManager,
    type SmartAssetManager,
    AddOverride,
    ApplyOverridesForKey,
    ClearOverrides,
    CreateOverrideManager,
    CreateSmartAssetManager,
    DeserializeAndApplyOverrides,
    DisposeOverrideManager,
    DisposeSmartAssetManager,
    GetOverrides,
    LinkOverrideManagerSmartAssets,
    LoadSmartAssetAsync,
    ReloadSmartAssetAsync,
    RemoveOverride,
    SerializeOverrides,
} from "core/SmartAssets/index";

// Mock LoadAssetContainerAsync
const mockAddAllToScene = vi.fn();
const mockRemoveAllFromScene = vi.fn();
const mockDispose = vi.fn();

// Store scene reference for mock containers to populate
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
    let sam: SmartAssetManager;
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
        sam = CreateSmartAssetManager(scene);
        overrides = CreateOverrideManager(scene);
        LinkOverrideManagerSmartAssets(overrides, sam);
        vi.clearAllMocks();
    });

    afterEach(() => {
        DisposeOverrideManager(overrides);
        DisposeSmartAssetManager(sam);
        scene.dispose();
        engine.dispose();
        _currentScene = null;
    });

    // ── CRUD Tests ──

    describe("addOverride", () => {
        it("should store an override entry", () => {
            const entry: IOverrideEntry = {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            };

            AddOverride(overrides, entry);

            const all = GetOverrides(overrides);
            expect(all.length).toBe(1);
            expect(all[0]).toEqual(entry);
        });

        it("should replace existing override for same target+property", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.8,
            });

            const all = GetOverrides(overrides);
            expect(all.length).toBe(1);
            expect(all[0].value).toBe(0.8);
        });

        it("should allow multiple overrides on different properties", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "roughness",
                value: 0.9,
            });

            expect(GetOverrides(overrides).length).toBe(2);
        });
    });

    describe("removeOverride", () => {
        it("should remove an override", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            const removed = RemoveOverride(overrides, "chair", "materials", "WoodMaterial", "alpha");

            expect(removed).toBe(true);
            expect(GetOverrides(overrides).length).toBe(0);
        });

        it("should return false for non-existent override", () => {
            const removed = RemoveOverride(overrides, "chair", "materials", "WoodMaterial", "alpha");
            expect(removed).toBe(false);
        });
    });

    describe("getOverrides", () => {
        it("should filter by key", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "table",
                targetType: "materials",
                targetName: "MetalMaterial",
                propertyPath: "roughness",
                value: 0.3,
            });

            const chairOverrides = GetOverrides(overrides, "chair");
            expect(chairOverrides.length).toBe(1);
            expect(chairOverrides[0].key).toBe("chair");
        });

        it("should return all when no key filter", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "table",
                targetType: "materials",
                targetName: "MetalMaterial",
                propertyPath: "roughness",
                value: 0.3,
            });

            expect(GetOverrides(overrides).length).toBe(2);
        });
    });

    describe("clearOverrides", () => {
        it("should remove all overrides", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "M1",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "table",
                targetType: "materials",
                targetName: "M2",
                propertyPath: "alpha",
                value: 0.3,
            });

            ClearOverrides(overrides);
            expect(GetOverrides(overrides).length).toBe(0);
        });
    });

    // ── Application Tests ──

    describe("applyOverridesForKey", () => {
        it("should apply scalar override to a loaded material", async () => {
            await LoadSmartAssetAsync(sam, "chair", "models/chair.glb");

            // The mock container adds a material named "Material1" to the scene
            const material = scene.materials.find((m) => m.name === "Material1");
            expect(material).toBeDefined();

            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "Material1",
                propertyPath: "alpha",
                value: 0.7,
            });

            expect((material as any).alpha).toBe(0.7);
        });

        it("should apply boolean override", async () => {
            await LoadSmartAssetAsync(sam, "chair", "models/chair.glb");

            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "Material1",
                propertyPath: "wireframe",
                value: true,
            });

            const material = scene.materials.find((m) => m.name === "Material1");
            expect((material as any).wireframe).toBe(true);
        });

        it("should scope same-named targets to the owning smart asset key", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            const firstContainer = createMockContainer(["FirstMesh"], ["SharedMaterial"]);
            const secondContainer = createMockContainer(["SecondMesh"], ["SharedMaterial"]);
            vi.mocked(LoadAssetContainerAsync)
                .mockResolvedValueOnce(firstContainer as any)
                .mockResolvedValueOnce(secondContainer as any);

            await LoadSmartAssetAsync(sam, "first", "first.glb");
            await LoadSmartAssetAsync(sam, "second", "second.glb");

            AddOverride(overrides, {
                key: "second",
                targetType: "materials",
                targetName: "SharedMaterial",
                propertyPath: "alpha",
                value: 0.25,
            });

            expect(firstContainer.materials[0].alpha).toBe(1);
            expect(secondContainer.materials[0].alpha).toBe(0.25);
        });
    });

    describe("scene-level overrides", () => {
        it("should apply override to the scene object", () => {
            AddOverride(overrides, {
                key: "",
                targetType: "scene",
                targetName: "",
                propertyPath: "fogDensity",
                value: 0.5,
            });

            expect(scene.fogDensity).toBe(0.5);
        });
    });

    // ── Serialization Tests ──

    describe("serialization", () => {
        it("should serialize overrides to JSON-compatible array", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            AddOverride(overrides, {
                key: "",
                targetType: "scene",
                targetName: "",
                propertyPath: "fogDensity",
                value: 0.1,
            });

            const serialized = SerializeOverrides(overrides);

            expect(serialized.length).toBe(2);
            expect(serialized[0].key).toBe("chair");
            expect(serialized[0].value).toBe(0.5);
            expect(serialized[1].targetType).toBe("scene");
        });

        it("should deserialize and apply overrides", () => {
            const data = [
                {
                    key: "",
                    targetType: "scene" as const,
                    targetName: "",
                    propertyPath: "fogDensity",
                    value: 0.3,
                },
            ];

            DeserializeAndApplyOverrides(overrides, data);

            expect(GetOverrides(overrides).length).toBe(1);
            expect(scene.fogDensity).toBe(0.3);
        });

        it("should round-trip serialize → deserialize", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            const serialized = SerializeOverrides(overrides);
            ClearOverrides(overrides);
            DeserializeAndApplyOverrides(overrides, serialized);

            expect(GetOverrides(overrides).length).toBe(1);
            expect(GetOverrides(overrides)[0].value).toBe(0.5);
        });
    });

    // ── Integration Tests ──

    describe("SmartAssetManager integration", () => {
        it("should link with SmartAssetManager", () => {
            // Already linked in beforeEach — verify by checking the manager calls applyOverridesForKey on reload
            expect(overrides.scene).toBe(scene);
        });

        it("should be called by SmartAssetManager on reload", async () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "Material1",
                propertyPath: "alpha",
                value: 0.7,
            });

            await LoadSmartAssetAsync(sam, "chair", "models/chair.glb");

            const material = scene.materials.find((m) => m.name === "Material1");
            expect((material as any).alpha).toBe(0.7);
            (material as any).alpha = 1;

            await ReloadSmartAssetAsync(sam, "chair");

            const reloadedMaterial = scene.materials.find((m) => m.name === "Material1");
            expect((reloadedMaterial as any).alpha).toBe(0.7);
        });
    });

    // ── Dispose Tests ──

    describe("dispose", () => {
        it("should clear all state", () => {
            AddOverride(overrides, {
                key: "chair",
                targetType: "materials",
                targetName: "M1",
                propertyPath: "alpha",
                value: 0.5,
            });

            DisposeOverrideManager(overrides);

            expect(GetOverrides(overrides).length).toBe(0);
        });
    });
});
