import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianPointSplattingRenderer } from "core/Meshes/GaussianSplatting/gaussianPointSplattingRenderer.pure";
import { Scene } from "core/scene";
import { describe, expect, it, onTestFinished, vi } from "vitest";

describe("Point-splatting dependency loading", () => {
    it("falls back after a rejected shader import and retries when re-enabled", async () => {
        vi.resetModules();
        vi.doMock("core/ShadersWGSL/gpsPreprocess.compute", () => {
            throw new Error("shader chunk unavailable");
        });
        onTestFinished(() => {
            vi.doUnmock("core/ShadersWGSL/gpsPreprocess.compute");
            vi.resetModules();
        });
        const { GaussianPointSplattingController } = await import("core/Meshes/GaussianSplatting/gaussianPointSplattingController.pure");
        const { ShaderStore } = await import("core/Engines/shaderStore");
        const { Logger } = await import("core/Misc/logger");
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        const controller = new GaussianPointSplattingController(mesh);
        const renderer = Object.create(GaussianPointSplattingRenderer.prototype) as GaussianPointSplattingRenderer;
        vi.spyOn(renderer, "supportsWorkload").mockReturnValue(true);
        const error = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        onTestFinished(() => {
            error.mockRestore();
            controller["_renderer"] = null;
            controller.dispose();
            scene.dispose();
            engine.dispose();
        });
        controller["_renderer"] = renderer;
        controller["_colorMode"] = true;
        controller["_ensureCompute"]();
        await vi.waitFor(() => expect(controller["_computeActive"]).toBe(false));
        expect(error).toHaveBeenCalledWith(expect.stringContaining("failed to load point-splatting shaders"));
        engine.currentRenderPassId = camera.renderPassId;
        expect(controller.drawColorPass(true)).toBe(false);

        vi.doUnmock("core/ShadersWGSL/gpsPreprocess.compute");
        controller["_ensureCompute"]();
        await vi.waitFor(() => expect(controller["_computeActive"]).toBe(true));
        await vi.waitFor(() => expect(ShaderStore.ShadersStoreWGSL.gpsPreprocessComputeShader).toBeDefined());
    });
});
