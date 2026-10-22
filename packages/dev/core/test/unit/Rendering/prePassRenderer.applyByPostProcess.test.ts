import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { type PostProcess } from "core/PostProcesses/postProcess";
import { type PrePassRenderer } from "core/Rendering/prePassRenderer";
import { Scene } from "core/scene";
import "core/Rendering/prePassRendererSceneComponent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createPostProcess(className: string, usesPrePass: boolean): PostProcess {
    return {
        setPrePassRenderer: () => usesPrePass,
        getClassName: () => className,
        restoreDefaultInputTexture: () => {},
        dispose: () => {},
    } as unknown as PostProcess;
}

describe("PrePassRenderer and imageProcessingConfiguration.applyByPostProcess", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let prePassRenderer: PrePassRenderer;

    const setupOutput = () => (prePassRenderer as unknown as { _setupOutputForThisPass: (rt: unknown) => void })._setupOutputForThisPass(prePassRenderer.defaultRT);

    beforeEach(() => {
        engine = new NullEngine();
        engine.getCaps().drawBuffersExtension = true;
        scene = new Scene(engine);
        camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.activeCamera = camera;
        prePassRenderer = scene.enablePrePassRenderer()!;
        // Enabling the prepass would allocate multi render target textures, which NullEngine cannot do.
        vi.spyOn(prePassRenderer.defaultRT, "updateCount").mockImplementation(() => {});
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("should keep the value set by the application when a prepass effect is enabled", () => {
        scene.imageProcessingConfiguration.applyByPostProcess = true;
        camera._postProcesses.push(createPostProcess("CustomToneMapping", false), createPostProcess("PrePassEffect", true));

        prePassRenderer.update();
        expect(prePassRenderer.enabled).toBe(true);
        expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(true);

        setupOutput();
        expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(true);
    });

    it("should not turn the flag on when the application left it off", () => {
        camera._postProcesses.push(createPostProcess("PrePassEffect", true));

        prePassRenderer.update();
        setupOutput();
        expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(false);
    });

    it("should turn the flag on while an image processing post process is in the camera chain and off once it is removed", () => {
        for (const applicationValue of [true, false]) {
            scene.imageProcessingConfiguration.applyByPostProcess = applicationValue;
            camera._postProcesses.push(createPostProcess("PrePassEffect", true), createPostProcess("ImageProcessingPostProcess", false));

            prePassRenderer.markAsDirty();
            prePassRenderer.update();
            expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(true);

            camera._postProcesses.length = 0;
            prePassRenderer.markAsDirty();
            prePassRenderer.update();
            setupOutput();
            expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(false);
        }
    });

    it("should restore the value set by the application once a composition pass is no longer needed", () => {
        vi.spyOn(prePassRenderer.defaultRT, "_createCompositionEffect").mockImplementation(() => {});
        const effect = prePassRenderer.addEffectConfiguration({ name: "composition", texturesRequired: [], enabled: true, needsImageProcessing: true });

        for (const applicationValue of [true, false]) {
            scene.imageProcessingConfiguration.applyByPostProcess = applicationValue;
            effect.enabled = true;
            setupOutput();
            expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(true);

            effect.enabled = false;
            setupOutput();
            expect(scene.imageProcessingConfiguration.applyByPostProcess).toBe(applicationValue);
        }
    });
});
