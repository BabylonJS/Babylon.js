import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { SmartAssetManager, OverrideManager } from "core/SmartAssets/index";
import { SerializeProject, DeserializeProject, LoadProjectAsync } from "core/SmartAssets/projectSerializer";

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

vi.mock("core/Loading/sceneLoader", () => ({
    LoadAssetContainerAsync: vi.fn(() => Promise.resolve(createMockContainer())),
}));

describe("ProjectSerializer", () => {
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
        sam = new SmartAssetManager(scene);
        overrides = new OverrideManager(scene);
        overrides.linkSmartAssetManager(sam);
        vi.clearAllMocks();
    });

    afterEach(() => {
        overrides.dispose();
        sam.dispose();
        scene.dispose();
        engine.dispose();
        _currentScene = null;
    });

    // ── Serialization Tests ──

    describe("serializeProject", () => {
        it("should produce a valid project document with assets and overrides", async () => {
            sam.register("chair", "models/chair.glb");
            sam.register("table", "models/table.glb");

            overrides.addOverride({
                key: "",
                targetType: "scene",
                targetName: "",
                propertyPath: "fogDensity",
                value: 0.2,
            });

            const project = SerializeProject(sam, overrides);

            expect(project.version).toBe(1);
            expect(project.assets["chair"].url).toBe("models/chair.glb");
            expect(project.assets["table"].url).toBe("models/table.glb");
            expect(project.overrides.length).toBe(1);
            expect(project.overrides[0].propertyPath).toBe("fogDensity");
        });

        it("should produce empty overrides array when no overrides exist", () => {
            sam.register("chair", "chair.glb");

            const project = SerializeProject(sam, overrides);

            expect(project.overrides).toEqual([]);
        });

        it("should produce empty assets when no assets registered", () => {
            const project = SerializeProject(sam, overrides);

            expect(Object.keys(project.assets).length).toBe(0);
            expect(project.overrides).toEqual([]);
        });
    });

    // ── Deserialization / Validation Tests ──

    describe("deserializeProject", () => {
        it("should validate a correct project document", () => {
            const doc = {
                version: 1,
                assets: {
                    chair: { url: "chair.glb" },
                },
                overrides: [
                    {
                        key: "chair",
                        targetType: "materials",
                        targetName: "Wood",
                        propertyPath: "alpha",
                        value: 0.5,
                    },
                ],
            };

            const result = DeserializeProject(doc);
            expect(result.version).toBe(1);
            expect(result.assets["chair"].url).toBe("chair.glb");
            expect(result.overrides.length).toBe(1);
        });

        it("should throw on invalid version", () => {
            expect(() => DeserializeProject({ version: 99, assets: {}, overrides: [] })).toThrow(/Unsupported project version/);
        });

        it("should throw when overrides is not an array", () => {
            expect(() => DeserializeProject({ version: 1, assets: {}, overrides: "bad" })).toThrow(/must be an array/);
        });

        it("should throw on null input", () => {
            expect(() => DeserializeProject(null)).toThrow(/expected an object/);
        });
    });

    // ── Round-Trip Tests ──

    describe("round-trip", () => {
        it("should produce identical output on serialize → deserialize → serialize", async () => {
            sam.register("chair", "chair.glb");
            sam.register("table", "table.glb");

            overrides.addOverride({
                key: "chair",
                targetType: "materials",
                targetName: "WoodMaterial",
                propertyPath: "alpha",
                value: 0.5,
            });

            overrides.addOverride({
                key: "",
                targetType: "scene",
                targetName: "",
                propertyPath: "fogDensity",
                value: 0.1,
            });

            const serialized1 = SerializeProject(sam, overrides);
            const json = JSON.stringify(serialized1);
            const parsed = JSON.parse(json);
            const deserialized = DeserializeProject(parsed);

            // Verify structure survived round-trip
            expect(deserialized.version).toBe(1);
            expect(Object.keys(deserialized.assets).length).toBe(2);
            expect(deserialized.overrides.length).toBe(2);
            expect(deserialized.overrides[0].value).toBe(0.5);
            expect(deserialized.overrides[1].value).toBe(0.1);
        });
    });

    // ── loadProjectAsync Tests ──

    describe("loadProjectAsync", () => {
        it("should load assets and apply overrides from a project object", async () => {
            const projectDoc = {
                version: 1 as const,
                assets: {
                    chair: { url: "chair.glb" },
                },
                overrides: [
                    {
                        key: "" as const,
                        targetType: "scene" as const,
                        targetName: "",
                        propertyPath: "fogDensity",
                        value: 0.4,
                    },
                ],
            };

            await LoadProjectAsync(projectDoc, sam, overrides);

            // Asset should be registered and loaded
            expect(sam.resolve("chair")).toBe("chair.glb");
            expect(sam.getProvenance("chair")).toBeDefined();

            // Override should be applied
            expect(scene.fogDensity).toBe(0.4);
            expect(overrides.getOverrides().length).toBe(1);
        });

        it("should work with empty overrides", async () => {
            const projectDoc = {
                version: 1 as const,
                assets: {
                    table: { url: "table.glb" },
                },
                overrides: [],
            };

            await LoadProjectAsync(projectDoc, sam, overrides);

            expect(sam.resolve("table")).toBe("table.glb");
            expect(overrides.getOverrides().length).toBe(0);
        });
    });
});
