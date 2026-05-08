import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import {
    type SmartAssetManager,
    AddSmartAssetManagerCreatedObserver,
    DisposeSmartAssetManager,
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetSmartAssetManager,
    LoadAllSmartAssetsAsync,
    LoadSmartAssetAsync,
    RegisterSmartAsset,
    RemoveSmartAssetAsync,
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
        manager = GetSmartAssetManager(scene);
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
            RegisterSmartAsset(scene, "chair", "models/chair.glb");
            expect(GetAllSmartAssets(scene).get("chair")).toBe("models/chair.glb");
        });

        it("should return all registered entries", () => {
            RegisterSmartAsset(scene, "chair", "chair.glb");
            RegisterSmartAsset(scene, "table", "table.glb");
            RegisterSmartAsset(scene, "lamp", "lamp.glb");
            expect(GetAllSmartAssets(scene).size).toBe(3);
        });

        it("should auto-create a manager when registering with a fresh scene", () => {
            const scene2 = new Scene(engine);

            RegisterSmartAsset(scene2, "chair", "models/chair.glb");

            const manager2 = GetSmartAssetManager(scene2);
            expect(manager2).toBeDefined();
            expect(GetAllSmartAssets(scene2).get("chair")).toBe("models/chair.glb");

            scene2.dispose();
        });

        it("should overwrite URL on re-register", () => {
            RegisterSmartAsset(scene, "chair", "chair_v1.glb");
            RegisterSmartAsset(scene, "chair", "chair_v2.glb");
            expect(GetAllSmartAssets(scene).get("chair")).toBe("chair_v2.glb");
        });

        it("should revoke managed blob URLs when replacing and removing them", async () => {
            const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

            RegisterSmartAsset(scene, "local", "blob:smart-asset-v1");
            RegisterSmartAsset(scene, "local", "blob:smart-asset-v2");
            await RemoveSmartAssetAsync(scene, "local");

            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-v1");
            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-v2");

            revokeObjectUrlSpy.mockRestore();
        });

        it("should return undefined for unregistered key", () => {
            expect(GetAllSmartAssets(scene).get("nonexistent")).toBeUndefined();
        });
    });

    // ── Scene Attachment Tests ──

    describe("scene attachment", () => {
        it("should be the same instance on repeated GetSmartAssetManager calls", () => {
            expect(GetSmartAssetManager(scene)).toBe(manager);
            expect(GetSmartAssetManager(scene)).toBe(manager);
        });

        it("should detach from the scene after dispose", () => {
            DisposeSmartAssetManager(manager);
            // After dispose, getting again creates a fresh manager.
            expect(GetSmartAssetManager(scene)).not.toBe(manager);
        });

        it("should support separate managers on separate scenes", () => {
            const scene2 = new Scene(engine);
            const manager2 = GetSmartAssetManager(scene2);

            expect(GetSmartAssetManager(scene)).toBe(manager);
            expect(GetSmartAssetManager(scene2)).toBe(manager2);
            expect(manager).not.toBe(manager2);

            scene2.dispose();
        });

        it("should fire the manager-created observer exactly once per scene", () => {
            const callback = vi.fn();
            const observer = AddSmartAssetManagerCreatedObserver(callback);
            const scene2 = new Scene(engine);

            const manager2 = GetSmartAssetManager(scene2);
            const manager2Again = GetSmartAssetManager(scene2);

            expect(manager2Again).toBe(manager2);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(manager2);

            observer?.remove();
            scene2.dispose();
        });
    });

    // ── Auto-disposal on scene disposal ──

    describe("scene disposal", () => {
        it("should auto-dispose the manager when its scene is disposed", () => {
            const scene2 = new Scene(engine);
            const manager2 = GetSmartAssetManager(scene2);
            RegisterSmartAsset(scene2, "chair", "chair.glb");

            scene2.dispose();

            // After scene disposal the manager is fully torn down. A second
            // explicit dispose is a safe no-op.
            expect(() => DisposeSmartAssetManager(manager2)).not.toThrow();
        });

        it("should be safe to explicitly dispose before the scene is disposed", () => {
            const scene2 = new Scene(engine);
            const manager2 = GetSmartAssetManager(scene2);

            DisposeSmartAssetManager(manager2);
            // Scene disposal should not re-run cleanup or throw.
            expect(() => scene2.dispose()).not.toThrow();
        });
    });

    // ── Remove Tests ──

    describe("remove", () => {
        it("should remove a registered key", async () => {
            RegisterSmartAsset(scene, "chair", "chair.glb");
            await RemoveSmartAssetAsync(scene, "chair");
            expect(GetAllSmartAssets(scene).get("chair")).toBeUndefined();
        });

        it("should be a no-op for unregistered key", async () => {
            await expect(RemoveSmartAssetAsync(scene, "nonexistent")).resolves.toBeUndefined();
        });
    });

    // ── Loading Tests ──

    describe("loadAsync", () => {
        it("should load an asset and return the container", async () => {
            const container = await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");

            expect(container).toBeDefined();
            expect(mockAddAllToScene).toHaveBeenCalled();
        });

        it("should auto-register when URL is provided", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            expect(GetAllSmartAssets(scene).get("chair")).toBe("models/chair.glb");
        });

        it("should return existing container if already loaded", async () => {
            const container1 = await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const container2 = await LoadSmartAssetAsync(scene, "chair");
            expect(container1).toBe(container2);
        });

        it("should throw for unregistered key without URL", async () => {
            await expect(LoadSmartAssetAsync(scene, "nonexistent")).rejects.toThrow(/not registered/);
        });

        it("should notify when a smart asset is loaded", async () => {
            RegisterSmartAsset(scene, "chair", "models/chair.glb");
            const onChanged = vi.fn();
            manager.onChangedObservable.add(onChanged);

            await LoadSmartAssetAsync(scene, "chair");

            expect(onChanged).toHaveBeenCalledTimes(1);
        });

        it("should auto-create a manager when loading on a fresh scene", async () => {
            const callback = vi.fn();
            const observer = AddSmartAssetManagerCreatedObserver(callback);
            const scene2 = new Scene(engine);

            const container = await LoadSmartAssetAsync(scene2, "chair", "models/chair.glb");

            expect(container).toBeDefined();
            expect(GetAllSmartAssets(scene2).get("chair")).toBe("models/chair.glb");
            expect(callback).toHaveBeenCalledTimes(1);

            observer?.remove();
            scene2.dispose();
        });
    });

    // ── loadAllAsync Tests ──

    describe("loadAllAsync", () => {
        it("should load all registered assets concurrently", async () => {
            RegisterSmartAsset(scene, "a", "a.glb");
            RegisterSmartAsset(scene, "b", "b.glb");
            RegisterSmartAsset(scene, "c", "c.glb");

            const containers = await LoadAllSmartAssetsAsync(scene);
            expect(containers.length).toBe(3);
        });
    });

    // ── Unload Tests ──

    describe("unloadAsync", () => {
        it("should unload a loaded asset", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(scene, "chair");

            expect(mockRemoveAllFromScene).toHaveBeenCalled();
            expect(mockDispose).toHaveBeenCalled();
        });

        it("should notify when a smart asset is unloaded", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const onChanged = vi.fn();
            manager.onChangedObservable.add(onChanged);

            await UnloadSmartAssetAsync(scene, "chair");

            expect(onChanged).toHaveBeenCalledTimes(1);
        });

        it("should keep the key registered after unload", async () => {
            await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            await UnloadSmartAssetAsync(scene, "chair");
            expect(GetAllSmartAssets(scene).get("chair")).toBe("models/chair.glb");
        });
    });

    // ── Object Tracking Tests ──

    describe("object tracking", () => {
        it("should support findKeyForObject", async () => {
            const container = await LoadSmartAssetAsync(scene, "chair", "models/chair.glb");
            const mesh = container.meshes[0];
            expect(FindSmartAssetKeyForObject(scene, mesh as any)).toBe("chair");
        });
    });

    // ── Error / Missing Asset Tests ──

    describe("error handling", () => {
        it("should throw on load failure", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            await expect(LoadSmartAssetAsync(scene, "missing", "missing.glb")).rejects.toThrow("404");
        });

        it("should call onAssetNotFound and retry with returned URL", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync)
                .mockRejectedValueOnce(new Error("404"))
                .mockResolvedValueOnce(createMockContainer() as any);

            manager.onAssetNotFound = vi.fn(async () => "fallback.glb");

            const container = await LoadSmartAssetAsync(scene, "missing", "missing.glb");

            expect(manager.onAssetNotFound).toHaveBeenCalledWith("missing", "missing.glb");
            expect(container).toBeDefined();
        });

        it("should throw the fallback load error when retry fails", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("initial 404")).mockRejectedValueOnce(new Error("fallback 404"));

            manager.onAssetNotFound = vi.fn(async () => "fallback.glb");

            await expect(LoadSmartAssetAsync(scene, "missing", "missing.glb")).rejects.toThrow("fallback 404");
        });

        it("should revoke internally-created blob URLs when removing a smart asset", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync)
                .mockRejectedValueOnce(new Error("404"))
                .mockResolvedValueOnce(createMockContainer() as any);
            const createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:smart-asset-fallback");
            const revokeObjectUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

            manager.onAssetNotFound = vi.fn(async () => new File(["fallback"], "fallback.obj"));

            await LoadSmartAssetAsync(scene, "missing", "missing.glb");
            await RemoveSmartAssetAsync(scene, "missing");

            expect(createObjectUrlSpy).toHaveBeenCalled();
            expect(revokeObjectUrlSpy).toHaveBeenCalledWith("blob:smart-asset-fallback");

            createObjectUrlSpy.mockRestore();
            revokeObjectUrlSpy.mockRestore();
        });

        it("should skip asset when onAssetNotFound returns null", async () => {
            const { LoadAssetContainerAsync } = await import("core/Loading/sceneLoader");
            vi.mocked(LoadAssetContainerAsync).mockRejectedValueOnce(new Error("404"));

            manager.onAssetNotFound = vi.fn(async () => null);

            await expect(LoadSmartAssetAsync(scene, "missing", "missing.glb")).rejects.toThrow("404");
        });
    });

    // ── Serialization Tests ──

    describe("serialization", () => {
        it("should serialize the registry", () => {
            RegisterSmartAsset(scene, "chair", "chair.glb");
            RegisterSmartAsset(scene, "table", "table.glb");

            const serialized = SerializeSmartAssetManagerMap(scene);
            expect(serialized.version).toBe(1);
            expect(serialized.assets["chair"].url).toBe("chair.glb");
            expect(serialized.assets["table"].url).toBe("table.glb");
        });
    });
});
