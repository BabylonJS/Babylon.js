import { type Scene } from "core/scene";
import { describe, expect, it, vi } from "vitest";
import { GlobalState } from "../../src/globalState";

describe("GlobalState camera preset URL override", () => {
    it("preserves the override through texture previews and consumes it for only one model load", () => {
        const globalState = new GlobalState({ version: "test", bundles: [] });
        const applyActivePreset = vi.spyOn(globalState.cameraPresetManager, "applyActivePreset").mockReturnValue(null);
        const textureScene = {} as Scene;
        const urlModelScene = {} as Scene;
        const ordinaryModelScene = {} as Scene;

        globalState.cameraPresetOverrideFromUrl = true;

        expect(globalState.applyActiveCameraPresetForLoad(textureScene, "texture")).toBeNull();
        expect(globalState.cameraPresetOverrideFromUrl).toBe(true);
        expect(applyActivePreset).not.toHaveBeenCalled();

        expect(globalState.applyActiveCameraPresetForLoad(urlModelScene, "scene")).toBeNull();
        expect(globalState.cameraPresetOverrideFromUrl).toBe(false);
        expect(applyActivePreset).not.toHaveBeenCalled();

        expect(globalState.applyActiveCameraPresetForLoad(ordinaryModelScene, "scene")).toBeNull();
        expect(applyActivePreset).toHaveBeenCalledOnce();
        expect(applyActivePreset).toHaveBeenCalledWith(ordinaryModelScene);
    });
});
