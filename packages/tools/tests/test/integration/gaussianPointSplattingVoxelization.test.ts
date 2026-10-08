import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point-splatting updates refresh IBL voxels without a classic color pass", async ({ page }) => {
    const gpuErrors: string[] = [];
    page.on("console", (message) => {
        if (message.text().includes("WebGPU uncaptured error")) {
            gpuErrors.push(message.text());
        }
    });
    const config = getGlobalConfig();
    await page.goto(config.baseUrl + "/empty.html", { timeout: 0 });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => window.BABYLON?.Tools);
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgpu",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl: config.baseUrl,
    });
    const result = await page.evaluate(async () => {
        const B = window.BABYLON;
        const engine = window.engine;
        if (!(engine instanceof B.WebGPUEngine)) {
            throw new Error("Point-splatting voxelization coverage requires WebGPU.");
        }
        engine.setSize(64, 64);
        const scene = new B.Scene(engine);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const createData = (count: number) => {
            const data = new ArrayBuffer(count * 32);
            for (let index = 0; index < count; index++) {
                new Float32Array(data, index * 32, 6).set([index * 0.2, 0, 0, 0.4, 0.4, 0.4]);
                new Uint8Array(data, index * 32 + 24, 8).set([255, 255, 255, 255, 255, 128, 128, 128]);
            }
            return data;
        };
        engine.currentRenderPassId = camera.renderPassId;
        mesh.updateData(createData(1), undefined, { flipY: false });
        const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 8; frame++) {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await nextFrame();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 8) {
            throw new Error("Point-splatting compute did not become active.");
        }
        // Do not render the scene after constructing the pipeline: its geometry buffer would
        // introduce an unrelated classic consumer and hide the deferred-sort dependency.
        const pipeline = new B.IblShadowsRenderPipeline("ibl", scene, { resolutionExp: 3 }, []);
        const voxel = pipeline["_voxelRenderer"];
        const process = async (limit: number) => {
            let frames = 0;
            while (voxel.isVoxelizationInProgress() && frames < limit) {
                engine.beginFrame();
                voxel.processVoxelization();
                engine.endFrame();
                frames++;
                await nextFrame();
            }
            if (voxel.isVoxelizationInProgress()) {
                throw new Error(`IBL voxelization did not complete within ${limit} processing frames.`);
            }
            return frames;
        };
        pipeline.addShadowCastingMesh(mesh);
        voxel.setWorldScaleMatrix(B.Matrix.Identity());
        voxel.updateVoxelGrid([mesh], false);
        await process(600);
        engine.currentRenderPassId = camera.renderPassId;
        mesh.updateData(createData(4), undefined, { flipY: false });
        for (let frame = 0; frame < 600 && (!mesh["_forcedSortPending"] || !mesh["_canPostToWorker"]); frame++) {
            await nextFrame();
        }
        if (!mesh["_forcedSortPending"] || !mesh["_canPostToWorker"]) {
            throw new Error("Updated point data did not defer a classic sort.");
        }
        const deferredBeforeRefresh = !mesh._isDepthSortSettled;
        pipeline.updateSceneBounds();
        pipeline.updateVoxelization();
        const frames = await process(180);
        const buffer = voxel["_voxelOpacityBuffer"];
        if (!buffer) {
            throw new Error("IBL voxel opacity accumulator was not created.");
        }
        const bytes = await buffer.read(undefined, undefined, undefined, true);
        const occupied = Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)).filter((value) => value > 0).length;
        const settled = mesh._isDepthSortSettled;
        pipeline.dispose();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { frames, occupied, deferredBeforeRefresh, settled };
    });
    expect(gpuErrors).toEqual([]);
    expect(result.deferredBeforeRefresh).toBe(true);
    expect(result.frames).toBeLessThan(180);
    expect(result.occupied).toBeGreaterThan(0);
    expect(result.settled).toBe(true);
});
