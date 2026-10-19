import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianPointSplattingController } from "core/Meshes/GaussianSplatting/gaussianPointSplattingController";
import { _IblShadowsVoxelRenderer } from "core/Rendering/IBLShadows/iblShadowsVoxelRenderer";
import { Scene } from "core/scene";
import { describe, expect, it, onTestFinished, vi } from "vitest";

describe("IBL voxelization with deferred point-splatting sorts", () => {
    it.each([false, true])("prepares classic indices before waiting and restores the pass (worker throws: %s)", async (workerThrows) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", new Vector3(0, 0, -3), scene);
        const mesh = new GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(new ArrayBuffer(32));
        const controller = new GaussianPointSplattingController(mesh);
        mesh["_pointController"] = controller;
        controller["_colorMode"] = true;
        engine.currentRenderPassId = camera.renderPassId;
        mesh["_disableDepthSort"] = false;
        mesh["_hasRenderedOnce"] = true;
        const target = new RenderTargetTexture("voxel target", 8, scene);
        target.renderList = [mesh];
        const post = vi.fn(() => {
            expect(engine.currentRenderPassId).toBe(target.renderPassId);
            if (workerThrows) {
                throw new Error("Worker unavailable");
            }
        });
        mesh["_worker"] = { postMessage: post, terminate: vi.fn() } as Worker;
        mesh._postToWorker(true);
        expect(post).not.toHaveBeenCalled();
        expect(mesh["_forcedSortPending"]).toBe(true);
        const renderer = Object.create(_IblShadowsVoxelRenderer.prototype) as _IblShadowsVoxelRenderer;
        renderer["_engine"] = engine;
        renderer["_renderTargets"] = [target];
        renderer["_voxelizationInProgress"] = true;
        renderer["_sortSettleWaitFrames"] = 0;
        onTestFinished(() => {
            scene.dispose();
            engine.dispose();
        });
        const error = await Promise.resolve()
            .then(() => renderer.processVoxelization())
            .then(
                () => undefined,
                (error: Error) => error.message
            );
        expect(error).toBe(workerThrows ? "Worker unavailable" : undefined);
        expect(mesh["_forcedSortPending"]).toBe(false);
        expect(mesh["_canPostToWorker"]).toBe(false);
        expect(renderer["_sortSettleWaitFrames"]).toBe(workerThrows ? 0 : 1);
        expect(post).toHaveBeenCalledTimes(1);
        expect(engine.currentRenderPassId).toBe(camera.renderPassId);
    });
});
