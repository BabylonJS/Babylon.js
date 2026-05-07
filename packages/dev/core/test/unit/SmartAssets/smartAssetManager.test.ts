import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import {
    type SmartAssetManager,
    AddSmartAssetManagerCreatedObserver,
    CreateSmartAssetManager,
    DisposeSmartAssetManager,
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetOrCreateSmartAssetManager,
    GetSmartAssetManagerFromScene,
    LoadAllSmartAssetsAsync,
    LoadSmartAssetAsync,
    RegisterSmartAsset,
    RemoveSmartAssetAsync,
    ResolveSmartAsset,
    SerializeSmartAssetManagerMap,
    UnloadSmartAssetAsync,
} from "core/SmartAssets/smartAssetManager";
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

        it("should throw when CreateSmartAssetManager is called on a scene that already has one", () => {
            // Guards against duplicate-creation foot-gun: a second CreateSmartAssetManager
            // call would otherwise overwrite scene.metadata and leak the original manager
            // (whose onDisposeObservable observer would later delete the new manager's
            // metadata back-reference when the scene is disposed).
            expect(() => CreateSmartAssetManager(scene)).toThrow(/already exists/);
        });

        it("should overwrite URL on re-register", () => {
            RegisterSmartAsset(manager, "chair", "chair_v1.glb");
            RegisterSmartAsset(manager, "chair", "chair_v2.glb");
            expect(ResolveSmartAsset(manager, "chair")).toBe("chair_v2.glb");
        });

        it("should revoke managed blob URLs when replacing and removing them", async () => {
            const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

            RegisterSmartAsset(manager, "local", "blob:smart-asset-v1");
            RegisterSmartAsset(manager, "local", "blob:smart-asset-v2");
            await RemoveSmartAssetAsync(manager, "local");

            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-v1");
            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-v2");

            revokeObjectUrlSpy.mockRestore();
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
            const observer = AddSmartAssetManagerCreatedObserver(callback);
            const scene2 = new Scene(engine);

            const manager2 = GetOrCreateSmartAssetManager(scene2);
            const manager2Again = GetOrCreateSmartAssetManager(scene2);

            expect(manager2Again).toBe(manager2);
            expect(GetSmartAssetManagerFromScene(scene2)).toBe(manager2);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(manager2);

            observer?.remove();
            DisposeSmartAssetManager(manager2);
            scene2.dispose();
        });
    });

    // ── OnInstanceCreated Tests ──

    describe("OnInstanceCreated", () => {
        it("should call static OnInstanceCreated on construction", () => {
            const callback = vi.fn();
            const observer = AddSmartAssetManagerCreatedObserver(callback);

            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);

            expect(callback).toHaveBeenCalledWith(manager2);

            observer?.remove();
            DisposeSmartAssetManager(manager2);
            scene2.dispose();
        });
    });

    // ── Auto-disposal on scene disposal ──

    describe("scene disposal", () => {
        it("should auto-dispose the manager when its scene is disposed", () => {
            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);
            RegisterSmartAsset(manager2, "chair", "chair.glb");

            expect(GetSmartAssetManagerFromScene(scene2)).toBe(manager2);

            scene2.dispose();

            // After scene disposal the manager is fully torn down. The metadata
            // entry is removed and a second explicit dispose is a safe no-op.
            expect(GetSmartAssetManagerFromScene(scene2)).toBeUndefined();
            expect(() => DisposeSmartAssetManager(manager2)).not.toThrow();
        });

        it("should be safe to explicitly dispose before the scene is disposed", () => {
            const scene2 = new Scene(engine);
            const manager2 = CreateSmartAssetManager(scene2);

            DisposeSmartAssetManager(manager2);
            // Scene disposal should not re-run cleanup or throw.
            expect(() => scene2.dispose()).not.toThrow();
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

        it("should notify when a smart asset is loaded", async () => {
            RegisterSmartAsset(manager, "chair", "models/chair.glb");
            const onChanged = vi.fn();
            manager.onChangedObservable.add(onChanged);

            await LoadSmartAssetAsync(manager, "chair");

            expect(onChanged).toHaveBeenCalledTimes(1);
        });

        it("should load a smart asset directly from a scene", async () => {
            const callback = vi.fn();
            const observer = AddSmartAssetManagerCreatedObserver(callback);
            const scene2 = new Scene(engine);

            const container = await LoadSmartAssetAsync(scene2, "chair", "models/chair.glb");

            const manager2 = GetSmartAssetManagerFromScene(scene2);
            expect(container).toBeDefined();
            expect(manager2).toBeDefined();
            expect(ResolveSmartAsset(scene2, "chair")).toBe("models/chair.glb");
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(manager2);

            observer?.remove();
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

        it("should notify when a smart asset is unloaded", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            const onChanged = vi.fn();
            manager.onChangedObservable.add(onChanged);

            await UnloadSmartAssetAsync(manager, "chair");

            expect(onChanged).toHaveBeenCalledTimes(1);
        });

        it("should keep the key registered after unload", async () => {
            await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(manager, "chair");
            expect(ResolveSmartAsset(manager, "chair")).toBe("models/chair.glb");
        });
    });

    // ── Object Tracking Tests ──

    describe("object tracking", () => {
        it("should support findKeyForObject", async () => {
            const container = await LoadSmartAssetAsync(manager, "chair", "models/chair.glb");
            const mesh = container.meshes[0];
            expect(FindSmartAssetKeyForObject(manager, mesh as any)).toBe("chair");
        });
    });

    // ── Error / Missing Asset Tests ──

    describe("error handling", () => {
        it("should throw on load failure", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            await expect(LoadSmartAssetAsync(manager, "missing", "missing.glb")).rejects.toThrow("404");
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

        it("should throw the fallback load error when retry fails", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("initial 404")).mockRejectedValueOnce(new Error("fallback 404"));

            manager.onAssetNotFound = vi.fn(async () => "fallback.glb");

            await expect(LoadSmartAssetAsync(manager, "missing", "missing.glb")).rejects.toThrow("fallback 404");
        });

        it("should revoke internally-created blob URLs when removing a smart asset", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync)
                .mockRejectedValueOnce(new Error("404"))
                .mockResolvedValueOnce(createMockContainer() as any);
            const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:smart-asset-fallback");
            const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

            manager.onAssetNotFound = vi.fn(async () => new File(["fallback"], "fallback.obj"));

            await LoadSmartAssetAsync(manager, "missing", "missing.glb");
            await RemoveSmartAssetAsync(manager, "missing");

            expect(createObjectUrlSpy).toHaveBeenCalled();
            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-fallback");

            createObjectUrlSpy.mockRestore();
            revokeObjectUrlSpy.mockRestore();
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
