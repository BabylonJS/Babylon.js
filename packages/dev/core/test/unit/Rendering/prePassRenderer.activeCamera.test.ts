import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { type PostProcess } from "core/PostProcesses/postProcess";
import { type PrePassRenderer } from "core/Rendering/prePassRenderer";
import { Scene } from "core/scene";
import "core/Rendering/prePassRendererSceneComponent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("PrePassRenderer active camera changes", () => {
    let engine: NullEngine;
    let scene: Scene;
    let cam1: FreeCamera;
    let cam2: FreeCamera;
    let prePassRenderer: PrePassRenderer;

    beforeEach(() => {
        engine = new NullEngine();
        engine.getCaps().drawBuffersExtension = true;
        scene = new Scene(engine);
        cam1 = new FreeCamera("cam1", Vector3.Zero(), scene);
        cam2 = new FreeCamera("cam2", Vector3.Zero(), scene);
        cam2._postProcesses.push({
            setPrePassRenderer: () => true,
            getClassName: () => "PrePassTestPostProcess",
            dispose: () => {},
        } as PostProcess);
        scene.activeCamera = cam1;
        prePassRenderer = scene.enablePrePassRenderer()!;
        // NullEngine cannot allocate the GPU attachments used when prepass becomes enabled.
        vi.spyOn(prePassRenderer.defaultRT, "updateCount").mockImplementation(() => {});
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("should recompute prepass requirements when the active camera changes", () => {
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(false);

        scene.activeCamera = cam2;
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(true);

        scene.activeCamera = cam1;
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(false);
    });

    it("should recompute prepass requirements when the active cameras change", () => {
        scene.activeCameras = [cam1];
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(false);

        scene.activeCameras.splice(0, 1, cam2);
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(true);

        scene.activeCameras.splice(0, 1, cam1);
        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(false);
    });

    it("should remove both camera observers when disposed", () => {
        const markAsDirty = vi.spyOn(prePassRenderer, "markAsDirty");
        scene.activeCameras = [cam1];
        scene.activeCamera = cam2;
        scene.activeCameras.push(cam2);
        expect(markAsDirty).toHaveBeenCalledTimes(2);

        prePassRenderer.dispose();
        markAsDirty.mockClear();
        expect(scene.onActiveCameraChanged.hasObservers()).toBe(false);
        expect(scene.onActiveCamerasChanged.hasObservers()).toBe(false);

        scene.activeCamera = cam1;
        scene.activeCameras.pop();
        expect(markAsDirty).not.toHaveBeenCalled();
    });
});
