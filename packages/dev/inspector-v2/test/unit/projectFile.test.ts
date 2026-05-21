import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GetAllSmartAssets, GetSmartAssetManager, RegisterSmartAsset } from "core/SmartAssets/smartAssetManager";
import { AddOverride, DisposeOverrideManager, GetOverrideManager, GetOverrides, type OverrideManager } from "../../src/projects/overrideManager";
import { DeserializeProject, LoadProjectAsync, SerializeProject } from "../../src/projects/projectFile";

// Store scene reference for mock containers to populate
let _currentScene: Scene | null = null;

const mockDispose = vi.fn();

function createMockContainer(meshNames: string[] = ["Mesh1"], materialNames: string[] = ["Material1"]) {
    const materials = materialNames.map((name) => ({ name, alpha: 1.0 }));

    return {
        meshes: meshNames.map((name) => ({ name })),
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

vi.mock("core/Loading/sceneLoader", async (importOriginal) => {
    const actual = await importOriginal<typeof import("core/Loading/sceneLoader")>();
    return {
        ...actual,
        LoadAssetContainerAsync: vi.fn(() => Promise.resolve(createMockContainer())),
    };
});

describe("ProjectSerializer", () => {
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
        // Force both managers to be created so tests can assert on a known starting state.
        GetSmartAssetManager(scene);
        overrides = GetOverrideManager(scene);
        vi.clearAllMocks();
    });

    afterEach(() => {
        DisposeOverrideManager(overrides);
        // SmartAssetManager auto-disposes when the scene is disposed.
        scene.dispose();
        engine.dispose();
        _currentScene = null;
    });

    // ── Serialization Tests ──

    describe("serializeProject", () => {
        it("should produce a valid project bundle with assets and overrides", async () => {
            RegisterSmartAsset(scene, "chair", "models/chair.glb");
            RegisterSmartAsset(scene, "table", "models/table.glb");

            AddOverride(scene, {
                targetType: "scene",
                targetName: "",
                targetIndex: 0,
                propertyPath: "fogDensity",
                value: 0.2,
            });

            const bundle = SerializeProject(scene);

            expect(bundle.project.version).toBe(2);
            expect(bundle.project.assets["chair"].url).toBe("models/chair.glb");
            expect(bundle.project.assets["table"].url).toBe("models/table.glb");
            expect(bundle.project.overrides.length).toBe(1);
            expect(bundle.project.overrides[0].propertyPath).toBe("fogDensity");
            expect(bundle.companionBabylon).toBeUndefined();
        });

        it("should produce empty overrides array when no overrides exist", () => {
            RegisterSmartAsset(scene, "chair", "chair.glb");

            const bundle = SerializeProject(scene);

            expect(bundle.project.overrides).toEqual([]);
        });

        it("should produce empty assets when no assets registered", () => {
            const bundle = SerializeProject(scene);

            expect(Object.keys(bundle.project.assets).length).toBe(0);
            expect(bundle.project.overrides).toEqual([]);
            expect(bundle.companionBabylon).toBeUndefined();
        });
    });

    // ── Deserialization / Validation Tests ──

    describe("deserializeProject", () => {
        it("should validate a correct project document", () => {
            const doc = {
                version: 2,
                assets: {
                    chair: { url: "chair.glb" },
                },
                overrides: [
                    {
                        targetType: "materials",
                        targetName: "Wood",
                        targetIndex: 0,
                        propertyPath: "alpha",
                        value: 0.5,
                    },
                ],
            };

            const result = DeserializeProject(doc);
            expect(result.version).toBe(2);
            expect(result.assets["chair"].url).toBe("chair.glb");
            expect(result.overrides.length).toBe(1);
        });

        it("should throw on invalid version", () => {
            expect(() => DeserializeProject({ version: 99, assets: {}, overrides: [] })).toThrow(/Unsupported project version/);
        });

        it("should throw when overrides is not an array", () => {
            expect(() => DeserializeProject({ version: 2, assets: {}, overrides: "bad" })).toThrow(/must be an array/);
        });

        it("should throw on null input", () => {
            expect(() => DeserializeProject(null)).toThrow(/expected an object/);
        });
    });

    // ── Round-Trip Tests ──

    describe("round-trip", () => {
        it("should produce identical output on serialize → deserialize → serialize", async () => {
            RegisterSmartAsset(scene, "chair", "chair.glb");
            RegisterSmartAsset(scene, "table", "table.glb");

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

            const bundle = SerializeProject(scene);
            const json = JSON.stringify(bundle.project);
            const parsed = JSON.parse(json);
            const deserialized = DeserializeProject(parsed);

            // Verify structure survived round-trip
            expect(deserialized.version).toBe(2);
            expect(Object.keys(deserialized.assets).length).toBe(2);
            expect(deserialized.overrides.length).toBe(2);
            expect(deserialized.overrides[0].value).toBe(0.5);
            expect(deserialized.overrides[1].value).toBe(0.1);
        });

        it("should preserve companionBindings on serialize → deserialize", () => {
            const doc = {
                version: 2 as const,
                assets: {
                    rockTex: { url: "rock.png", type: "texture" as const },
                    __project_locals__: { url: "__project_locals__.babylon" },
                },
                overrides: [],
                companionBindings: {
                    MyMat: { albedoTexture: "rockTex" },
                },
            };

            const parsed = JSON.parse(JSON.stringify(doc));
            const deserialized = DeserializeProject(parsed);

            expect(deserialized.companionBindings).toEqual({
                MyMat: { albedoTexture: "rockTex" },
            });
        });
    });

    // ── companionBindings Validation Tests ──

    describe("companionBindings validation", () => {
        it("should accept a document with no companionBindings field", () => {
            const doc = { version: 2, assets: {}, overrides: [] };
            expect(() => DeserializeProject(doc)).not.toThrow();
        });

        it("should reject a non-object companionBindings", () => {
            expect(() => DeserializeProject({ version: 2, assets: {}, overrides: [], companionBindings: "bad" })).toThrow(/companionBindings.*must be an object/);
        });

        it("should reject an array companionBindings", () => {
            expect(() => DeserializeProject({ version: 2, assets: {}, overrides: [], companionBindings: [] })).toThrow(/companionBindings.*must be an object/);
        });
    });

    // ── loadProjectAsync Tests ──

    describe("loadProjectAsync", () => {
        it("should load assets and apply overrides from a project object", async () => {
            const projectDoc = {
                version: 2 as const,
                assets: {
                    chair: { url: "chair.glb" },
                },
                overrides: [
                    {
                        targetType: "scene" as const,
                        targetName: "",
                        targetIndex: 0,
                        propertyPath: "fogDensity",
                        value: 0.4,
                    },
                ],
            };

            await LoadProjectAsync(scene, projectDoc);

            // Asset should be registered and loaded
            expect(GetAllSmartAssets(scene).get("chair")).toBe("chair.glb");

            // Override should be applied
            expect(scene.fogDensity).toBe(0.4);
            expect(GetOverrides(scene).length).toBe(1);
        });

        it("should work with empty overrides", async () => {
            const projectDoc = {
                version: 2 as const,
                assets: {
                    table: { url: "table.glb" },
                },
                overrides: [],
            };

            await LoadProjectAsync(scene, projectDoc);

            expect(GetAllSmartAssets(scene).get("table")).toBe("table.glb");
            expect(GetOverrides(scene).length).toBe(0);
        });

        it("should re-attach a SAM-tracked texture to a companion material via companionBindings", async () => {
            // Drop a fake "SAM-tracked" texture into the scene so the binding
            // application code can find it. We bypass SAM's real load path
            // (which would need a real network/decoder) by stubbing the lookup.
            const fakeTexture = { name: "rockTex", isReady: () => true, dispose: vi.fn() } as any;
            (scene.textures as any[]).push(fakeTexture);

            const samManager = await import("core/SmartAssets/smartAssetManager");
            const findKeySpy = vi.spyOn(samManager, "FindSmartAssetKeyForObject").mockImplementation((_s, obj) => (obj === fakeTexture ? "rockTex" : undefined));

            try {
                // Companion load should produce a material named "MyMat" that
                // ApplyCompanionBindings will then bind a texture to.
                const sceneLoader = await import("core/Loading/sceneLoader");
                const loadContainerMock = vi.mocked(sceneLoader.LoadAssetContainerAsync);
                loadContainerMock.mockResolvedValueOnce(createMockContainer([], ["MyMat"]) as any);

                const projectDoc = {
                    version: 2 as const,
                    assets: {
                        rockTex: { url: "rock.png", type: "texture" as const },
                        __project_locals__: { url: "__project_locals__.babylon" },
                    },
                    overrides: [],
                    companionBindings: {
                        MyMat: { albedoTexture: "rockTex" },
                    },
                };

                await LoadProjectAsync(scene, projectDoc);

                const loadedMat = scene.materials.find((m) => m.name === "MyMat") as any;
                expect(loadedMat).toBeDefined();
                expect(loadedMat.albedoTexture).toBe(fakeTexture);
            } finally {
                findKeySpy.mockRestore();
            }
        });
    });
});
