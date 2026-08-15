import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Camera } from "core/Cameras/camera";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { type AutoRotationBehavior } from "core/Behaviors/Cameras/autoRotationBehavior";
import { type BouncingBehavior } from "core/Behaviors/Cameras/bouncingBehavior";
import { type FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { Scene } from "core/scene";
import { describe, expect, it, vi } from "vitest";
import {
    CameraPresetManager,
    GetUniqueCameraPresetName,
    ParseCameraPresetState,
    type ICameraPresetState,
    type ICameraPresetStorageBackend,
} from "../../src/tools/cameraPresetManager";
import { IsCamera } from "../../src/tools/cameraPresetInspectorService";

class MemoryCameraPresetStorage implements ICameraPresetStorageBackend {
    public value: unknown = null;

    public read(): unknown {
        return this.value;
    }

    public write(state: ICameraPresetState): void {
        this.value = JSON.parse(JSON.stringify(state));
    }
}

class FailingCameraPresetStorage extends MemoryCameraPresetStorage {
    public override write(_state: ICameraPresetState): void {
        throw new Error("Storage unavailable");
    }
}

describe("camera preset naming", () => {
    it("uses the first available generic name for a blank name", () => {
        expect(GetUniqueCameraPresetName(["Preset 1", "preset 3"], "   ")).toBe("Preset 2");
    });

    it("compares names case-insensitively and increments numeric suffixes", () => {
        const names = ["City", "City 2", "city 3"];
        expect(GetUniqueCameraPresetName(names, " CITY ")).toBe("CITY 4");
        expect(GetUniqueCameraPresetName(names, "City 2")).toBe("City 4");
    });

    it("normalizes names without locale-sensitive casing", () => {
        const toLocaleLowerCase = vi.spyOn(String.prototype, "toLocaleLowerCase");
        try {
            expect(GetUniqueCameraPresetName(["CITY"], "city")).toBe("city 2");
            expect(toLocaleLowerCase).not.toHaveBeenCalled();
        } finally {
            toLocaleLowerCase.mockRestore();
        }
    });

    it("restarts numbering when the requested suffix cannot be incremented safely", () => {
        expect(GetUniqueCameraPresetName(["City 99999999999999999999"], "City 99999999999999999999")).toBe("City 2");
    });
});

describe("camera preset storage", () => {
    it("falls back to an empty state for payloads that are not a preset collection", () => {
        const emptyState = { version: 1, activePresetId: null, presets: [] };
        expect(ParseCameraPresetState(null)).toEqual(emptyState);
        expect(ParseCameraPresetState("not a state")).toEqual(emptyState);
        expect(ParseCameraPresetState({ version: 1, activePresetId: "orphan", presets: "not an array" })).toEqual(emptyState);
    });

    it("rejects unsupported schemas, filters malformed presets, and normalizes conflicting names", () => {
        expect(ParseCameraPresetState({ version: 2, activePresetId: "old", presets: [] })).toEqual({ version: 1, activePresetId: null, presets: [] });

        const state = ParseCameraPresetState({
            version: 1,
            activePresetId: "missing",
            presets: [
                {
                    id: "valid",
                    name: "Street",
                    cameraType: "ArcRotateCamera",
                    cameraData: { type: "ArcRotateCamera", alpha: 1 },
                    behaviors: { version: 1, useFramingBehavior: true, unexpected: true },
                },
                { id: "invalid", name: "Invalid", cameraType: "FreeCamera", cameraData: { type: "ArcRotateCamera" } },
                { id: "duplicate-name", name: "street", cameraType: "ArcRotateCamera", cameraData: { type: "ArcRotateCamera" } },
            ],
        });

        expect(state).toEqual({
            version: 1,
            activePresetId: null,
            presets: [
                {
                    id: "valid",
                    name: "Street",
                    cameraType: "ArcRotateCamera",
                    cameraData: { type: "ArcRotateCamera", alpha: 1 },
                    behaviors: { version: 1, useFramingBehavior: true },
                },
                {
                    id: "duplicate-name",
                    name: "street 2",
                    cameraType: "ArcRotateCamera",
                    cameraData: { type: "ArcRotateCamera" },
                    behaviors: undefined,
                },
            ],
        });
    });

    it("renames the reserved default option without invalidating the active preset", () => {
        const state = ParseCameraPresetState({
            version: 1,
            activePresetId: "reserved",
            presets: [
                {
                    id: "reserved",
                    name: " Default camera ",
                    cameraType: "ArcRotateCamera",
                    cameraData: { type: "ArcRotateCamera" },
                },
            ],
        });

        expect(state.activePresetId).toBe("reserved");
        expect(state.presets.map((preset) => preset.name)).toEqual(["Default camera 2"]);
    });
});

describe("camera preset Inspector predicate", () => {
    it("handles entities whose scene is unavailable", () => {
        expect(IsCamera({ getScene: () => null })).toBe(false);
        expect(IsCamera({ getScene: () => ({ cameras: [] }) })).toBe(false);
    });
});

describe("CameraPresetManager", () => {
    it("keeps storage read failures warning-only during startup", () => {
        const errors: string[] = [];
        const manager = new CameraPresetManager(
            {
                read: () => {
                    throw new Error("Unreadable storage");
                },
                write: () => {},
            },
            undefined,
            (message) => errors.push(message)
        );

        expect(manager.presets).toEqual([]);
        expect(manager.activePresetId).toBeNull();
        expect(errors).toEqual([]);
    });

    it("does not commit a saved preset when persistence fails and reports the error once", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new ArcRotateCamera("camera", 0, 0, 1, Vector3.Zero(), scene);
        const errors: string[] = [];
        const manager = new CameraPresetManager(
            new FailingCameraPresetStorage(),
            () => "failed-preset",
            (message) => errors.push(message)
        );
        let changeCount = 0;
        manager.onChanged.add(() => changeCount++);

        expect(manager.saveCamera(camera, "Failed preset")).toBeNull();
        expect(manager.presets).toEqual([]);
        expect(changeCount).toBe(0);
        expect(errors).toEqual(["Unable to persist Sandbox camera presets: Storage unavailable"]);

        scene.dispose();
        engine.dispose();
    });

    it("leaves the scene camera unchanged and reports once when persisted camera data cannot be applied", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const defaultCamera = new ArcRotateCamera("default camera", 0, 0, 1, Vector3.Zero(), scene);
        scene.activeCamera = defaultCamera;
        const errors: string[] = [];

        const storage = new MemoryCameraPresetStorage();
        storage.value = {
            version: 1,
            activePresetId: "unavailable",
            presets: [
                {
                    id: "unavailable",
                    name: "Unavailable",
                    cameraType: "ArcRotateCamera",
                    cameraData: { type: "ArcRotateCamera", name: "Unavailable" },
                },
            ],
        };

        const manager = new CameraPresetManager(storage, undefined, (message) => errors.push(message));
        const originalParse = Camera.Parse;
        Camera.Parse = (_cameraData, targetScene) => {
            new UniversalCamera("partial camera", Vector3.Zero(), targetScene);
            throw new Error("Unable to parse camera");
        };

        let result;
        try {
            result = manager.applyActivePreset(scene);
        } finally {
            Camera.Parse = originalParse;
        }

        expect(result).toBeNull();
        expect(scene.activeCamera).toBe(defaultCamera);
        expect(scene.cameras).toEqual([defaultCamera]);
        expect(errors).toEqual(['Unable to apply Sandbox camera preset "Unavailable": Unable to parse camera']);

        scene.dispose();
        engine.dispose();
    });

    it("discards the substituted camera when the saved camera type is not registered", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const defaultCamera = new ArcRotateCamera("default camera", 0, 0, 1, Vector3.Zero(), scene);
        scene.activeCamera = defaultCamera;

        const storage = new MemoryCameraPresetStorage();
        storage.value = {
            version: 1,
            activePresetId: "unregistered",
            presets: [
                {
                    id: "unregistered",
                    name: "Unregistered",
                    cameraType: "NotRegisteredCamera",
                    cameraData: { type: "NotRegisteredCamera", name: "Unregistered", position: [1, 2, 3] },
                },
            ],
        };

        const manager = new CameraPresetManager(storage);
        expect(manager.applyActivePreset(scene)).toBeNull();
        expect(scene.activeCamera).toBe(defaultCamera);
        expect(scene.cameras).toEqual([defaultCamera]);

        scene.dispose();
        engine.dispose();
    });

    it("recreates a saved camera subtype instead of applying partial data to the active camera", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const defaultCamera = new ArcRotateCamera("default camera", 0, 0, 1, Vector3.Zero(), scene);
        const universalCamera = new UniversalCamera("walkthrough", new Vector3(10, 20, 30), scene);
        universalCamera.speed = 7;
        universalCamera.keysUp = [73];
        scene.activeCamera = defaultCamera;

        const storage = new MemoryCameraPresetStorage();
        const manager = new CameraPresetManager(storage, () => "universal");
        const preset = manager.saveCamera(universalCamera, "Walkthrough")!;
        universalCamera.dispose();

        const appliedCamera = manager.activatePreset(preset.id, scene);
        expect(appliedCamera).toBeInstanceOf(UniversalCamera);
        expect(appliedCamera).not.toBe(defaultCamera);
        expect(appliedCamera?.position.asArray()).toEqual([10, 20, 30]);
        expect((appliedCamera as UniversalCamera).speed).toBe(7);
        expect((appliedCamera as UniversalCamera).keysUp).toEqual([73]);
        expect(scene.activeCamera).toBe(appliedCamera);

        scene.dispose();
        engine.dispose();
    });

    it("assigns a fresh scene uniqueId when applying serialized camera data", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const sourceCamera = new ArcRotateCamera("source", 0, 1, 5, Vector3.Zero(), scene);
        scene.activeCamera = sourceCamera;

        const manager = new CameraPresetManager(new MemoryCameraPresetStorage(), () => "collision");
        const preset = manager.saveCamera(sourceCamera, "Collision")!;
        expect(preset.cameraData.uniqueId).toBe(sourceCamera.uniqueId);

        const getUniqueId = vi.spyOn(scene, "getUniqueId");
        const previousAllowLoadingUniqueId = SerializationHelper.AllowLoadingUniqueId;
        let appliedCamera;
        try {
            SerializationHelper.AllowLoadingUniqueId = true;
            appliedCamera = manager.activatePreset(preset.id, scene);
        } finally {
            SerializationHelper.AllowLoadingUniqueId = previousAllowLoadingUniqueId;
        }

        expect(appliedCamera).not.toBeNull();
        expect(appliedCamera?.uniqueId).not.toBe(sourceCamera.uniqueId);
        expect(getUniqueId.mock.results.map((result) => result.value)).toContain(appliedCamera?.uniqueId);
        expect(new Set(scene.cameras.map((camera) => camera.uniqueId)).size).toBe(scene.cameras.length);

        scene.dispose();
        engine.dispose();
    });

    it("round-trips camera properties and behavior state without leaking replacement cameras", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const sourceCamera = new ArcRotateCamera("source", 0.75, Math.PI * 0.75, 42, new Vector3(4, 5, 6), scene);
        sourceCamera.wheelDeltaPercentage = 0.025;
        sourceCamera.minZ = 0.5;
        sourceCamera.maxZ = 5000;
        sourceCamera.useAutoRotationBehavior = true;
        sourceCamera.useBouncingBehavior = true;
        sourceCamera.useFramingBehavior = true;
        const sourceAutoRotationBehavior = sourceCamera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;
        sourceAutoRotationBehavior.idleRotationSpeed = 0.1;
        sourceAutoRotationBehavior.idleRotationWaitTime = 3000;
        sourceAutoRotationBehavior.idleRotationSpinupTime = 4000;
        sourceAutoRotationBehavior.zoomStopsAnimation = true;
        sourceAutoRotationBehavior.targetAlpha = 1.5;
        const sourceBouncingBehavior = sourceCamera.getBehaviorByName("Bouncing") as BouncingBehavior;
        sourceBouncingBehavior.transitionDuration = 600;
        sourceBouncingBehavior.lowerRadiusTransitionRange = 3;
        sourceBouncingBehavior.upperRadiusTransitionRange = -4;
        sourceBouncingBehavior.autoTransitionRange = false;
        const sourceFramingBehavior = sourceCamera.getBehaviorByName("Framing") as FramingBehavior;
        sourceFramingBehavior.mode = 1;
        sourceFramingBehavior.radiusScale = 1.2;
        sourceFramingBehavior.positionScale = 0.4;
        sourceFramingBehavior.defaultElevation = 0.25;
        sourceFramingBehavior.elevationReturnTime = -1;
        sourceFramingBehavior.elevationReturnWaitTime = 0;
        sourceFramingBehavior.zoomStopsAnimation = true;
        sourceFramingBehavior.framingTime = 0;
        sourceFramingBehavior.autoCorrectCameraLimitsAndSensibility = false;
        scene.activeCamera = sourceCamera;

        const storage = new MemoryCameraPresetStorage();
        let id = 0;
        const manager = new CameraPresetManager(storage, () => `preset-${++id}`);
        const firstPreset = manager.saveCamera(sourceCamera, "City")!;

        sourceCamera.alpha = 2;
        sourceCamera.radius = 10;
        sourceCamera.useAutoRotationBehavior = false;

        const appliedCamera = manager.activatePreset(firstPreset.id, scene) as ArcRotateCamera;
        expect(appliedCamera).not.toBe(sourceCamera);
        expect(appliedCamera.getClassName()).toBe("ArcRotateCamera");
        expect(appliedCamera.alpha).toBeCloseTo(0.75);
        expect(appliedCamera.beta).toBeCloseTo(Math.PI * 0.75);
        expect(appliedCamera.beta).toBeGreaterThan(Math.PI / 2);
        expect(appliedCamera.radius).toBeCloseTo(42);
        expect(appliedCamera.target.asArray()).toEqual([4, 5, 6]);
        expect(appliedCamera.wheelDeltaPercentage).toBeCloseTo(0.025);
        expect(appliedCamera.minZ).toBeCloseTo(0.5);
        expect(appliedCamera.maxZ).toBeCloseTo(5000);
        expect(appliedCamera.useAutoRotationBehavior).toBe(true);
        expect(appliedCamera.useBouncingBehavior).toBe(true);
        expect(appliedCamera.useFramingBehavior).toBe(true);
        const appliedAutoRotationBehavior = appliedCamera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;
        expect(appliedAutoRotationBehavior.idleRotationSpeed).toBeCloseTo(0.1);
        expect(appliedAutoRotationBehavior.idleRotationWaitTime).toBe(3000);
        expect(appliedAutoRotationBehavior.idleRotationSpinupTime).toBe(4000);
        expect(appliedAutoRotationBehavior.zoomStopsAnimation).toBe(true);
        expect(appliedAutoRotationBehavior.targetAlpha).toBeCloseTo(1.5);
        const appliedBouncingBehavior = appliedCamera.getBehaviorByName("Bouncing") as BouncingBehavior;
        expect(appliedBouncingBehavior.transitionDuration).toBe(600);
        expect(appliedBouncingBehavior.lowerRadiusTransitionRange).toBeCloseTo(3);
        expect(appliedBouncingBehavior.upperRadiusTransitionRange).toBeCloseTo(-4);
        expect(appliedBouncingBehavior.autoTransitionRange).toBe(false);
        const appliedFramingBehavior = appliedCamera.getBehaviorByName("Framing") as FramingBehavior;
        expect(appliedFramingBehavior.framingTime).toBe(0);
        expect(appliedFramingBehavior.elevationReturnTime).toBe(-1);
        expect(appliedFramingBehavior.elevationReturnWaitTime).toBe(0);
        expect(appliedFramingBehavior.defaultElevation).toBeCloseTo(0.25);
        expect(appliedFramingBehavior.autoCorrectCameraLimitsAndSensibility).toBe(false);
        scene.render();
        expect(appliedCamera.beta).toBeCloseTo(Math.PI * 0.75);
        expect(scene.cameras).toHaveLength(2);
        expect(manager.isPresetCamera(appliedCamera)).toBe(true);
        expect(manager.isPresetCamera(sourceCamera)).toBe(false);

        const secondPreset = manager.saveCamera(appliedCamera, "City")!;
        expect(secondPreset.name).toBe("City 2");
        const secondAppliedCamera = manager.activatePreset(secondPreset.id, scene);
        expect(scene.cameras).toHaveLength(2);
        expect(manager.activePresetId).toBe(secondPreset.id);
        expect(secondAppliedCamera).toBe(scene.activeCamera);

        scene.activeCamera = sourceCamera;
        manager.releasePresetCamera(scene);
        expect(scene.cameras).toEqual([sourceCamera]);

        const restoredManager = new CameraPresetManager(storage);
        expect(restoredManager.activePresetId).toBe(secondPreset.id);
        expect(restoredManager.presets.map((preset) => preset.name)).toEqual(["City", "City 2"]);

        const nextScene = new Scene(engine);
        const nextSceneDefaultCamera = new ArcRotateCamera("default camera", 0, 0, 1, Vector3.Zero(), nextScene);
        nextScene.activeCamera = nextSceneDefaultCamera;
        const restoredCamera = restoredManager.applyActivePreset(nextScene) as ArcRotateCamera;
        expect(restoredCamera).not.toBe(nextSceneDefaultCamera);
        expect(restoredCamera.alpha).toBeCloseTo(0.75);
        expect(restoredCamera.beta).toBeCloseTo(Math.PI * 0.75);
        expect(restoredCamera.radius).toBeCloseTo(42);
        expect((restoredCamera.getBehaviorByName("Framing") as FramingBehavior).elevationReturnTime).toBe(-1);
        expect(nextScene.activeCamera).toBe(restoredCamera);

        nextScene.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("restores a scene camera and persists the default selection when a preset is deactivated", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const defaultCamera = new ArcRotateCamera("default camera", 0, 1, 5, Vector3.Zero(), scene);
        const embeddedCamera = new UniversalCamera("embedded camera", new Vector3(1, 2, 3), scene);
        scene.activeCamera = defaultCamera;

        const storage = new MemoryCameraPresetStorage();
        let id = 0;
        const manager = new CameraPresetManager(storage, () => `preset-${++id}`);
        const preset = manager.saveCamera(defaultCamera, "Overview")!;
        expect(manager.saveCamera(defaultCamera, "Default camera")!.name).toBe("Default camera 2");
        const presetCamera = manager.activatePreset(preset.id, scene);

        expect(presetCamera).toBe(scene.activeCamera);
        expect(manager.activePresetId).toBe(preset.id);
        expect(manager.deactivatePreset(scene)).toBe(defaultCamera);
        expect(scene.activeCamera).toBe(defaultCamera);
        expect(scene.cameras).toEqual([defaultCamera, embeddedCamera]);
        expect(manager.activePresetId).toBeNull();
        expect((storage.value as ICameraPresetState).activePresetId).toBeNull();

        manager.activatePreset(preset.id, scene);
        expect(manager.deactivatePreset(scene, embeddedCamera)).toBe(embeddedCamera);
        expect(scene.activeCamera).toBe(embeddedCamera);
        expect(scene.cameras).toEqual([defaultCamera, embeddedCamera]);
        expect(manager.activePresetId).toBeNull();

        const restoredManager = new CameraPresetManager(storage);
        expect(restoredManager.activePresetId).toBeNull();
        expect(restoredManager.applyActivePreset(scene)).toBeNull();
        expect(scene.activeCamera).toBe(embeddedCamera);

        scene.dispose();
        engine.dispose();
    });
});
