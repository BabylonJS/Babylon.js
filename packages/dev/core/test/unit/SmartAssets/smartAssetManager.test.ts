import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { SmartAssetManager } from "core/SmartAssets/index";
import { FileToolsOptions } from "core/Misc/fileTools";
import type { ISmartAssetLoadedEvent, ISmartAssetUrlChangedEvent, ISmartAssetErrorEvent, ISmartAssetUnloadedEvent } from "core/SmartAssets/index";

// Mock LoadAssetContainerAsync
const mockAddAllToScene = vi.fn();
const mockRemoveAllFromScene = vi.fn();
const mockDispose = vi.fn();

function createMockContainer(meshNames: string[] = ["Mesh1"], materialNames: string[] = ["Material1"]) {
    return {
        meshes: meshNames.map((name) => ({ name })),
        materials: materialNames.map((name) => ({ name })),
        textures: [] as { name: string }[],
        animationGroups: [] as { name: string }[],
        lights: [] as { name: string }[],
        cameras: [] as { name: string }[],
        addAllToScene: mockAddAllToScene,
        removeAllFromScene: mockRemoveAllFromScene,
        dispose: mockDispose,
    };
}

vi.mock("core/Loading/sceneLoader", () => ({
    LoadAssetContainerAsync: vi.fn(() => Promise.resolve(createMockContainer())),
}));

describe("SmartAssetManager", () => {
    let engine: NullEngine;
    let scene: Scene;
    let manager: SmartAssetManager;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        manager = new SmartAssetManager(scene);
        vi.clearAllMocks();
    });

    afterEach(() => {
        manager.dispose();
        scene.dispose();
        engine.dispose();
    });

    // ── Registry Tests ──

    describe("register", () => {
        it("should register a key and make it resolvable", () => {
            manager.register("chair", "models/chair.glb");
            expect(manager.resolve("chair")).toBe("models/chair.glb");
        });

        it("should return all registered entries", () => {
            manager.register("chair", "chair.glb");
            manager.register("table", "table.glb");
            manager.register("lamp", "lamp.glb");
            expect(manager.getAll().size).toBe(3);
        });

        it("should overwrite URL on re-register", () => {
            manager.register("chair", "chair_v1.glb");
            manager.register("chair", "chair_v2.glb");
            expect(manager.resolve("chair")).toBe("chair_v2.glb");
        });

        it("should return undefined for unregistered key", () => {
            expect(manager.resolve("nonexistent")).toBeUndefined();
        });
    });

    // ── Scene Attachment Tests ──

    describe("scene attachment", () => {
        it("should be discoverable via GetFromScene", () => {
            const found = SmartAssetManager.GetFromScene(scene);
            expect(found).toBe(manager);
        });

        it("should return undefined after dispose", () => {
            manager.dispose();
            expect(SmartAssetManager.GetFromScene(scene)).toBeUndefined();
        });

        it("should support separate managers on separate scenes", () => {
            const scene2 = new Scene(engine);
            const manager2 = new SmartAssetManager(scene2);

            expect(SmartAssetManager.GetFromScene(scene)).toBe(manager);
            expect(SmartAssetManager.GetFromScene(scene2)).toBe(manager2);

            manager2.dispose();
            scene2.dispose();
        });

        it("should keep asset protocol resolution alive when managers are disposed out of order", () => {
            const scene2 = new Scene(engine);
            const manager2 = new SmartAssetManager(scene2);

            manager.register("first", "first.glb");
            manager2.register("second", "second.glb");

            expect(FileToolsOptions.PreprocessUrl("asset://first")).toBe("first.glb");
            expect(FileToolsOptions.PreprocessUrl("asset://second")).toBe("second.glb");

            manager.dispose();

            expect(FileToolsOptions.PreprocessUrl("asset://second")).toBe("second.glb");

            manager2.dispose();

            scene2.dispose();
        });
    });

    // ── OnInstanceCreated Tests ──

    describe("OnInstanceCreated", () => {
        it("should call static OnInstanceCreated on construction", () => {
            const callback = vi.fn();
            SmartAssetManager.OnInstanceCreated = callback;

            const scene2 = new Scene(engine);
            const manager2 = new SmartAssetManager(scene2);

            expect(callback).toHaveBeenCalledWith(manager2);

            SmartAssetManager.OnInstanceCreated = null;
            manager2.dispose();
            scene2.dispose();
        });
    });

    // ── Remove Tests ──

    describe("remove", () => {
        it("should remove a registered key", async () => {
            manager.register("chair", "chair.glb");
            await manager.remove("chair");
            expect(manager.resolve("chair")).toBeUndefined();
        });

        it("should be a no-op for unregistered key", async () => {
            await expect(manager.remove("nonexistent")).resolves.toBeUndefined();
        });
    });

    // ── Loading Tests ──

    describe("loadAsync", () => {
        it("should load an asset and return the container", async () => {
            const container = await manager.loadAsync("chair", "models/chair.glb");

            expect(container).toBeDefined();
            expect(mockAddAllToScene).toHaveBeenCalled();
        });

        it("should auto-register when URL is provided", async () => {
            await manager.loadAsync("chair", "models/chair.glb");
            expect(manager.resolve("chair")).toBe("models/chair.glb");
        });

        it("should return existing container if already loaded", async () => {
            const container1 = await manager.loadAsync("chair", "models/chair.glb");
            const container2 = await manager.loadAsync("chair");
            expect(container1).toBe(container2);
        });

        it("should throw for unregistered key without URL", async () => {
            await expect(manager.loadAsync("nonexistent")).rejects.toThrow(/not registered/);
        });

        it("should fire onAssetLoadedObservable", async () => {
            const events: ISmartAssetLoadedEvent[] = [];
            manager.onAssetLoadedObservable.add((e) => events.push(e));

            await manager.loadAsync("chair", "models/chair.glb");

            expect(events.length).toBe(1);
            expect(events[0].key).toBe("chair");
        });
    });

    // ── loadAllAsync Tests ──

    describe("loadAllAsync", () => {
        it("should load all registered assets concurrently", async () => {
            manager.register("a", "a.glb");
            manager.register("b", "b.glb");
            manager.register("c", "c.glb");

            const containers = await manager.loadAllAsync();
            expect(containers.length).toBe(3);
        });
    });

    // ── Unload Tests ──

    describe("unloadAsync", () => {
        it("should unload a loaded asset", async () => {
            await manager.loadAsync("chair", "models/chair.glb");
            await manager.unloadAsync("chair");

            expect(mockRemoveAllFromScene).toHaveBeenCalled();
            expect(mockDispose).toHaveBeenCalled();
        });

        it("should fire onAssetUnloadedObservable", async () => {
            const events: ISmartAssetUnloadedEvent[] = [];
            manager.onAssetUnloadedObservable.add((e) => events.push(e));

            await manager.loadAsync("chair", "models/chair.glb");
            await manager.unloadAsync("chair");

            expect(events.length).toBe(1);
            expect(events[0].key).toBe("chair");
        });

        it("should keep the key registered after unload", async () => {
            await manager.loadAsync("chair", "models/chair.glb");
            await manager.unloadAsync("chair");
            expect(manager.resolve("chair")).toBe("models/chair.glb");
        });
    });

    // ── URL Swap Tests ──

    describe("setUrl", () => {
        it("should fire onUrlChangedObservable", async () => {
            const events: ISmartAssetUrlChangedEvent[] = [];
            manager.onUrlChangedObservable.add((e) => events.push(e));

            manager.register("chair", "chair_v1.glb");
            await manager.setUrl("chair", "chair_v2.glb");

            expect(events.length).toBe(1);
            expect(events[0].oldUrl).toBe("chair_v1.glb");
            expect(events[0].newUrl).toBe("chair_v2.glb");
        });

        it("should update the resolved URL", async () => {
            manager.register("chair", "chair_v1.glb");
            await manager.setUrl("chair", "chair_v2.glb");
            expect(manager.resolve("chair")).toBe("chair_v2.glb");
        });
    });

    // ── Provenance Tests ──

    describe("provenance", () => {
        it("should track provenance after loading", async () => {
            await manager.loadAsync("chair", "models/chair.glb");

            const prov = manager.getProvenance("chair");
            expect(prov).toBeDefined();
            expect(prov!.key).toBe("chair");
            expect(prov!.meshNames).toContain("Mesh1");
            expect(prov!.materialNames).toContain("Material1");
        });

        it("should return undefined for unloaded key", () => {
            manager.register("chair", "models/chair.glb");
            expect(manager.getProvenance("chair")).toBeUndefined();
        });

        it("should support findKeyForObject", async () => {
            const container = await manager.loadAsync("chair", "models/chair.glb");
            const mesh = container.meshes[0];
            expect(manager.findKeyForObject(mesh as any)).toBe("chair");
        });
    });

    // ── Error / Missing Asset Tests ──

    describe("error handling", () => {
        it("should fire onAssetErrorObservable on load failure", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            const errors: ISmartAssetErrorEvent[] = [];
            manager.onAssetErrorObservable.add((e) => errors.push(e));

            await expect(manager.loadAsync("missing", "missing.glb")).rejects.toThrow("404");

            expect(errors.length).toBeGreaterThanOrEqual(1);
            expect(errors[0].key).toBe("missing");
        });

        it("should call onAssetNotFound and retry with returned URL", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync)
                .mockRejectedValueOnce(new Error("404"))
                .mockResolvedValueOnce(createMockContainer() as any);

            manager.onAssetNotFound = vi.fn(async () => "fallback.glb");

            const container = await manager.loadAsync("missing", "missing.glb");

            expect(manager.onAssetNotFound).toHaveBeenCalledWith("missing", "missing.glb");
            expect(container).toBeDefined();
        });

        it("should skip asset when onAssetNotFound returns null", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            manager.onAssetNotFound = vi.fn(async () => null);

            await expect(manager.loadAsync("missing", "missing.glb")).rejects.toThrow("404");
        });
    });

    // ── Serialization Tests ──

    describe("serialization", () => {
        it("should serialize the registry", () => {
            manager.register("chair", "chair.glb");
            manager.register("table", "table.glb");

            const serialized = manager.serializeAssetMap();
            expect(serialized.version).toBe(1);
            expect(serialized.assets["chair"].url).toBe("chair.glb");
            expect(serialized.assets["table"].url).toBe("table.glb");
        });
    });
});
