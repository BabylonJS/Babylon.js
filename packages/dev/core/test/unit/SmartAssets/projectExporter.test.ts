import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { SmartAssetManager, OverrideManager } from "core/SmartAssets/index";
import { exportProjectAsync } from "core/SmartAssets/projectExporter";

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
        removeAllFromScene: vi.fn(),
        dispose: mockDispose,
    };
}

vi.mock("core/Loading/sceneLoader", () => ({
    LoadAssetContainerAsync: vi.fn(() => Promise.resolve(createMockContainer())),
}));

describe("ProjectExporter", () => {
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

    describe("exportProjectAsync - babylon format", () => {
        it("should export scene to .babylon format", async () => {
            // Set a scene-level override to verify it's applied
            overrides.addOverride({
                key: "",
                targetType: "scene",
                targetName: "",
                propertyPath: "fogDensity",
                value: 0.5,
            });

            const result = await exportProjectAsync(scene, sam, overrides, {
                format: "babylon",
                fileName: "test-scene",
            });

            expect(result.extension).toBe(".babylon");
            expect(result.fileName).toBe("test-scene.babylon");
            expect(typeof result.data).toBe("string");

            // Parse and verify the output is valid JSON
            const parsed = JSON.parse(result.data as string);
            expect(parsed).toBeDefined();
        });

        it("should use default filename when none provided", async () => {
            const result = await exportProjectAsync(scene, sam, overrides, {
                format: "babylon",
            });

            expect(result.fileName).toBe("export.babylon");
        });

        it("should apply all overrides before export", async () => {
            const spy = vi.spyOn(overrides, "applyAllOverrides");

            await exportProjectAsync(scene, sam, overrides, { format: "babylon" });

            expect(spy).toHaveBeenCalled();
        });

        it("should strip SmartAsset metadata from output", async () => {
            const result = await exportProjectAsync(scene, sam, overrides, { format: "babylon" });
            const parsed = JSON.parse(result.data as string);

            // Should not contain any SmartAsset references
            const json = JSON.stringify(parsed);
            expect(json).not.toContain("smartAssetManager");
        });
    });

    describe("exportProjectAsync - glb format", () => {
        it("should throw a helpful error when serializers package is not available", async () => {
            await expect(
                exportProjectAsync(scene, sam, overrides, { format: "glb" })
            ).rejects.toThrow(/requires @babylonjs\/serializers/);
        });
    });

    describe("exportProjectAsync - invalid format", () => {
        it("should throw for unsupported format", async () => {
            await expect(
                exportProjectAsync(scene, sam, overrides, { format: "obj" as any })
            ).rejects.toThrow(/Unsupported format/);
        });
    });
});
