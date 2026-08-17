import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalState } from "../../src/globalState";
import { ParseCameraUrlValue, type CameraNumericUrlParameter } from "../../src/tools/cameraUrlConfig";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("GlobalState camera preset URL override", () => {
    it("preserves numeric overrides through textures and applies them after the preset decision on every model load", () => {
        const globalState = new GlobalState({ version: "test", bundles: [] });
        const engine = new NullEngine();
        const textureScene = new Scene(engine);
        const urlModelScene = new Scene(engine);
        const urlCamera = new ArcRotateCamera("url camera", 0, 0, 10, Vector3.Zero(), urlModelScene);
        const reloadedModelScene = new Scene(engine);
        const defaultReloadedCamera = new ArcRotateCamera("reloaded camera", 0, 0, 10, Vector3.Zero(), reloadedModelScene);
        const presetCamera = new ArcRotateCamera("preset camera", 0, 0, 10, Vector3.Zero(), reloadedModelScene);
        const applyActivePreset = vi.spyOn(globalState.cameraPresetManager, "applyActivePreset").mockImplementation((scene) => {
            scene.activeCamera = presetCamera;
            return presetCamera;
        });

        urlModelScene.activeCamera = urlCamera;
        urlCamera.minZ = 1;
        urlCamera.lowerRadiusLimit = 5;
        reloadedModelScene.activeCamera = defaultReloadedCamera;
        presetCamera.minZ = 2;
        presetCamera.lowerRadiusLimit = 6;
        globalState.setCameraUrlNumericOverrides({ minZ: 0.01 });
        globalState.setCameraUrlNumericOverrides({ lowerRadiusLimit: 0 });
        globalState.suppressCameraPresetForNextModelLoad();

        expect(globalState.applyCameraConfigurationForLoad(textureScene, "texture")).toBeNull();
        expect(applyActivePreset).not.toHaveBeenCalled();

        expect(globalState.applyCameraConfigurationForLoad(urlModelScene, "scene")).toBeNull();
        expect(urlCamera.minZ).toBe(0.01);
        expect(urlCamera.lowerRadiusLimit).toBe(0);
        expect(applyActivePreset).not.toHaveBeenCalled();

        expect(globalState.applyCameraConfigurationForLoad(reloadedModelScene, "scene")).toBe(presetCamera);
        expect(applyActivePreset).toHaveBeenCalledOnce();
        expect(applyActivePreset).toHaveBeenCalledWith(reloadedModelScene);
        expect(reloadedModelScene.activeCamera).toBe(presetCamera);
        expect(presetCamera.minZ).toBe(0.01);
        expect(presetCamera.lowerRadiusLimit).toBe(0);

        engine.dispose();
    });

    it("applies minZ to a non-ArcRotate active camera and ignores lowerRadiusLimit", () => {
        const globalState = new GlobalState({ version: "test", bundles: [] });
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("embedded camera", Vector3.Zero(), scene) as FreeCamera & { lowerRadiusLimit?: number };

        scene.activeCamera = camera;
        camera.minZ = 1;
        camera.lowerRadiusLimit = 7;
        globalState.setCameraUrlNumericOverrides({ minZ: 0.25, lowerRadiusLimit: 0 });
        globalState.suppressCameraPresetForNextModelLoad();

        globalState.applyCameraConfigurationForLoad(scene, "scene");

        expect(camera.minZ).toBe(0.25);
        expect(camera.lowerRadiusLimit).toBe(7);

        engine.dispose();
    });

    it("keeps existing camera and cameraPosition URL suppression when no numeric values are present", () => {
        const globalState = new GlobalState({ version: "test", bundles: [] });
        const applyActivePreset = vi.spyOn(globalState.cameraPresetManager, "applyActivePreset").mockReturnValue(null);
        const urlModelScene = {} as Scene;
        const ordinaryModelScene = {} as Scene;

        globalState.suppressCameraPresetForNextModelLoad();

        expect(globalState.applyCameraConfigurationForLoad(urlModelScene, "scene")).toBeNull();
        expect(applyActivePreset).not.toHaveBeenCalled();

        expect(globalState.applyCameraConfigurationForLoad(ordinaryModelScene, "scene")).toBeNull();
        expect(applyActivePreset).toHaveBeenCalledOnce();
        expect(applyActivePreset).toHaveBeenCalledWith(ordinaryModelScene);
    });
});

describe("ParseCameraUrlValue", () => {
    it.each([
        ["cameraMinZ", undefined],
        ["cameraMinZ", ""],
        ["cameraMinZ", " "],
        ["cameraMinZ", "NaN"],
        ["cameraMinZ", "Infinity"],
        ["cameraMinZ", "-Infinity"],
        ["cameraMinZ", "0"],
        ["cameraMinZ", "-1"],
        ["cameraLowerRadiusLimit", undefined],
        ["cameraLowerRadiusLimit", ""],
        ["cameraLowerRadiusLimit", "NaN"],
        ["cameraLowerRadiusLimit", "Infinity"],
        ["cameraLowerRadiusLimit", "-Infinity"],
        ["cameraLowerRadiusLimit", "-0.01"],
    ] as const)("rejects invalid %s value %s and logs a warning", (parameterName, value) => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        expect(ParseCameraUrlValue(parameterName, value)).toBeUndefined();
        expect(warn).toHaveBeenCalledOnce();
        expect(warn.mock.calls[0][0]).toContain(parameterName);
        expect(warn.mock.calls[0][0]).toContain(`"${value ?? ""}"`);
    });

    it.each([
        ["cameraMinZ", "0.01", 0.01],
        ["cameraMinZ", "100", 100],
        ["cameraLowerRadiusLimit", "0", 0],
        ["cameraLowerRadiusLimit", "12.5", 12.5],
    ] satisfies [CameraNumericUrlParameter, string, number][])("accepts valid %s value %s", (parameterName, value, expected) => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        expect(ParseCameraUrlValue(parameterName, value)).toBe(expected);
        expect(warn).not.toHaveBeenCalled();
    });
});
