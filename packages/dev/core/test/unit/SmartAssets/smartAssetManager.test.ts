import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import {
    type SmartAssetManager,
    type ISmartAssetLoadedEvent,
    type ISmartAssetUrlChangedEvent,
    type ISmartAssetErrorEvent,
    type ISmartAssetUnloadedEvent,
    CreateSmartAssetManager,
    DisposeSmartAssetManager,
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetOrCreateSmartAssetManager,
    GetSmartAssetManagerFromScene,
    GetSmartAssetProvenance,
    LoadAllSmartAssetsAsync,
    LoadSmartAssetAsync,
    RegisterSmartAsset,
    RemoveSmartAssetAsync,
    ResolveSmartAsset,
    SerializeSmartAssetManagerMap,
    SetSmartAssetManagerCreatedCallback,
    SetSmartAssetUrlAsync,
    UnloadSmartAssetAsync,
} from "core/SmartAssets/smartAssetManager";
import { FileToolsOptions } from "core/Misc/fileTools";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
        manager = CreateSmartAssetManager(scene);
        vi.clearAllMocks();
    });

    afterEach(() => {
        DisposeSmartAssetManager(manager);
        scene.dispose();
        engine.dispose();
    });

    // ── Registry Tests ──

    describe("register", () => {
        it("should register a key and make it resolvable", () => {
            RegisterSmartAsset(manager, "chair", "models/chair.glb");
            expect(ResolveSmartAsset(manager, "chair")).toBe("models/chair.glb");
        });

        it("should return all registered entries", () => {
            RegisterSmartAsset(manager, "chair", "chair.glb");
            RegisterSmartAsset(manager, "table", "table.glb");
            RegisterSmartAsset(manager, "lamp", "lamp.glb");
            expect(GetAllSmartAssets(manager).size).toBe(3);
        });

        it("should auto-create a manager when registering with a scene", () => {
            const scene2 = new Scene(engine);

            RegisterSmartAsset(scene2, "chair", "models/chair.glb");

            const manager2 = GetSmartAssetManagerFromScene(scene2);
            expect(manager2).toBeDefined();
            expect(ResolveSmartAsset(scene2, "chair")).toBe("models/chair.glb");
            expect(ResolveSmartAsset(manager2!, "chair")).toBe("models/chair.glb");

            DisposeSmartAssetManager(manager2!);
            scene2.dispose();
        });

        it("should overwrite URL on re-register", () => {
            RegisterSmartAsset(manager, "chair", "chair_v1.glb");
            RegisterSmartAsset(manager, "chair", "chair_v2.glb");
            expect(ResolveSmartAsset(manager, "chair")).toBe("chair_v2.glb");
        });

        it("should return undefined for unregistered key", () => {
            expect(ResolveSmartAsset(manager, "nonexistent")).toBeUndefined();
        });
    });

    // ── Scene Attachment Tests ──

    describe("scene attachment", () => {
        it("should be discoverable via GetFromScene", () => {
            const found = GetSmartAssetManagerFromScene(scene);
            expect(found).toBe(manager);
        });

        it("should return undefined after dispose", () => {
            DisposeSmartAssetManager(manager);
            expect(GetSmartAssetManagerFromScene(scene)).toBeUndefined();
        });

        it("should support separate managers on separate scenes", () => {
            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);

            expect(GetSmartAssetManagerFromScene(scene)).toBe(manager);
            expect(GetSmartAssetManagerFromScene(scene2)).toBe(manager2);

            DisposeSmartAssetManager(manager2);
            scene2.dispose();
        });

        it("should get or create a manager for a scene", () => {
            const callback = vi.fn();
            SetSmartAssetManagerCreatedCallback(callback);
            const scene2 = new Scene(engine);

            const manager2 = GetOrCreateSmartAssetManager(scene2);
            const manager2Again = GetOrCreateSmartAssetManager(scene2);

            expect(manager2Again).toBe(manager2);
            expect(GetSmartAssetManagerFromScene(scene2)).toBe(manager2);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(manager2);

            SetSmartAssetManagerCreatedCallback(null);
            DisposeSmartAssetManager(manager2);
            scene2.dispose();
        });

        it("should keep asset protocol resolution alive when managers are disposed out of order", () => {
            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);

            RegisterSmartAsset(manager, "first", "first.glb");
            RegisterSmartAsset(manager2, "second", "second.glb");

            expect(FileToolsOptions.PreprocessUrl("asset://first")).toBe("first.glb");
            expect(FileToolsOptions.PreprocessUrl("asset://second")).toBe("second.glb");

            DisposeSmartAssetManager(manager);

            expect(FileToolsOptions.PreprocessUrl("asset://second")).toBe("second.glb");

            DisposeSmartAssetManager(manager2);

            scene2.dispose();
        });
    });

    // ── OnInstanceCreated Tests ──

    describe("OnInstanceCreated", () => {
        it("should call static OnInstanceCreated on construction", () => {
            const callback = vi.fn();
            SetSmartAssetManagerCreatedCallback(callback);

            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);

            expect(callback).toHaveBeenCalledWith(manager2);

            SetSmartAssetManagerCreatedCallback(null);
            DisposeSmartAssetManager(manager2);
            scene2.dispose();
        });
    });

    // ── Remove Tests ──

    describe("remove", () => {
        it("should remove a registered key", async () => {
            RegisterSmartAsset(manager, "chair", "chair.glb");
            await RemoveSmartAssetAsync(manager, "chair");
            expect(ResolveSmartAsset(manager, "chair")).toBeUndefined();
        });

        it("should be a no-op for unregistered key", async () => {
            await expect(RemoveSmartAssetAsync(manager, "nonexistent")).resolves.toBeUndefined();
        });
    });

    // ── Loading Tests ──

    describe("loadAsync", () => {
        it("should load an asset and return the container", async () => {
            const container = await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");

            expect(container).toBeDefined();
            expect(mockAddAllToScene).toHaveBeenCalled();
        });

        it("should auto-register when URL is provided", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            expect(ResolveSmartAsset(manager, "chair")).toBe("models/chair.glb");
        });

        it("should return existing container if already loaded", async () => {
            const container1 = await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            const container2 = await LoadSmartAssetAsync(manager, "chair");
            expect(container1).toBe(container2);
        });

        it("should throw for unregistered key without URL", async () => {
            await expect(LoadSmartAssetAsync(manager, "nonexistent")).rejects.toThrow(/not registered/);
        });

        it("should fire onAssetLoadedObservable", async () => {
            const events: ISmartAssetLoadedEvent[] = [];
            manager.onAssetLoadedObservable.add((e) => events.push(e));

            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");

            expect(events.length).toBe(1);
            expect(events[0].key).toBe("chair");
        });

        it("should load a smart asset directly from a scene", async () => {
            const callback = vi.fn();
            SetSmartAssetManagerCreatedCallback(callback);
            const scene2 = new Scene(engine);

            const container = await LoadSmartAssetAsync(scene2, "chair", "models/chair.glb");

            const manager2 = GetSmartAssetManagerFromScene(scene2);
            expect(container).toBeDefined();
            expect(manager2).toBeDefined();
            expect(ResolveSmartAsset(scene2, "chair")).toBe("models/chair.glb");
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(manager2);

            SetSmartAssetManagerCreatedCallback(null);
            DisposeSmartAssetManager(manager2!);
            scene2.dispose();
        });
    });

    // ── loadAllAsync Tests ──

    describe("loadAllAsync", () => {
        it("should load all registered assets concurrently", async () => {
            RegisterSmartAsset(manager, "a", "a.glb");
            RegisterSmartAsset(manager, "b", "b.glb");
            RegisterSmartAsset(manager, "c", "c.glb");

            const containers = await LoadAllSmartAssetsAsync(manager);
            expect(containers.length).toBe(3);
        });
    });

    // ── Unload Tests ──

    describe("unloadAsync", () => {
        it("should unload a loaded asset", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(manager, "chair");

            expect(mockRemoveAllFromScene).toHaveBeenCalled();
            expect(mockDispose).toHaveBeenCalled();
        });

        it("should fire onAssetUnloadedObservable", async () => {
            const events: ISmartAssetUnloadedEvent[] = [];
            manager.onAssetUnloadedObservable.add((e) => events.push(e));

            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(manager, "chair");

            expect(events.length).toBe(1);
            expect(events[0].key).toBe("chair");
        });

        it("should keep the key registered after unload", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(manager, "chair");
            expect(ResolveSmartAsset(manager, "chair")).toBe("models/chair.glb");
        });
    });

    // ── URL Swap Tests ──

    describe("setUrl", () => {
        it("should fire onUrlChangedObservable", async () => {
            const events: ISmartAssetUrlChangedEvent[] = [];
            manager.onUrlChangedObservable.add((e) => events.push(e));

            RegisterSmartAsset(manager, "chair", "chair_v1.glb");
            await SetSmartAssetUrlAsync(manager, "chair", "chair_v2.glb");

            expect(events.length).toBe(1);
            expect(events[0].oldUrl).toBe("chair_v1.glb");
            expect(events[0].newUrl).toBe("chair_v2.glb");
        });

        it("should update the resolved URL", async () => {
            RegisterSmartAsset(manager, "chair", "chair_v1.glb");
            await SetSmartAssetUrlAsync(manager, "chair", "chair_v2.glb");
            expect(ResolveSmartAsset(manager, "chair")).toBe("chair_v2.glb");
        });
    });

    // ── Provenance Tests ──

    describe("provenance", () => {
        it("should track provenance after loading", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");

            const prov = GetSmartAssetProvenance(manager, "chair");
            expect(prov).toBeDefined();
            expect(prov!.key).toBe("chair");
            expect(prov!.meshNames).toContain("Mesh1");
            expect(prov!.materialNames).toContain("Material1");
        });

        it("should return undefined for unloaded key", () => {
            RegisterSmartAsset(manager, "chair", "models/chair.glb");
            expect(GetSmartAssetProvenance(manager, "chair")).toBeUndefined();
        });

        it("should support findKeyForObject", async () => {
            const container = await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            const mesh = container.meshes[0];
            expect(FindSmartAssetKeyForObject(manager, mesh as any)).toBe("chair");
        });
    });

    // ── Error / Missing Asset Tests ──

    describe("error handling", () => {
        it("should fire onAssetErrorObservable on load failure", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            const errors: ISmartAssetErrorEvent[] = [];
            manager.onAssetErrorObservable.add((e) => errors.push(e));

            await expect(LoadSmartAssetAsync(manager, "missing", "missing.glb")).rejects.toThrow("404");

            expect(errors.length).toBeGreaterThanOrEqual(1);
            expect(errors[0].key).toBe("missing");
        });

        it("should call onAssetNotFound and retry with returned URL", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync)
                .mockRejectedValueOnce(new Error("404"))
                .mockResolvedValueOnce(createMockContainer() as any);

            manager.onAssetNotFound = vi.fn(async () => "fallback.glb");

            const container = await LoadSmartAssetAsync(manager, "missing", "missing.glb");

            expect(manager.onAssetNotFound).toHaveBeenCalledWith("missing", "missing.glb");
            expect(container).toBeDefined();
        });

        it("should skip asset when onAssetNotFound returns null", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            manager.onAssetNotFound = vi.fn(async () => null);

            await expect(LoadSmartAssetAsync(manager, "missing", "missing.glb")).rejects.toThrow("404");
        });
    });

    // ── Serialization Tests ──

    describe("serialization", () => {
        it("should serialize the registry", () => {
            RegisterSmartAsset(manager, "chair", "chair.glb");
            RegisterSmartAsset(manager, "table", "table.glb");

            const serialized = SerializeSmartAssetManagerMap(manager);
            expect(serialized.version).toBe(1);
            expect(serialized.assets["chair"].url).toBe("chair.glb");
            expect(serialized.assets["table"].url).toBe("table.glb");
        });
    });
});
