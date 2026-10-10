import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting falls back for additive blending and dynamic blend changes", async ({ page }) => {
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
            throw new Error("Point-splatting blend coverage requires WebGPU.");
        }
        engine.setSize(64, 64);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(1, 1, 1, 1);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.4, 0.4, 0.4]);
        new Uint8Array(data).set([0, 0, 0, 128, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        const material = mesh.material!;
        material.alphaMode = B.Constants.ALPHA_ADD;
        const render = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        };
        const sample = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            const pixels = await engine.readPixels(0, 0, 64, 64);
            return pixels[(32 * 64 + 32) * 4];
        };
        await scene.whenReadyAsync();
        const classicAdd = await sample();
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const pointAdd = await sample();
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const additiveUsesPoint = controller.handlesCurrentPass;
        material.alphaMode = B.Constants.ALPHA_COMBINE;
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
            await render();
        }
        for (let frame = 0; frame < 600 && !controller["_blit"]?.isReady(controller["_blitMesh"]!); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)) {
            throw new Error("Point-splatting color compositor did not become ready.");
        }
        const pointCombine = await sample();
        const combineUsesPoint = controller.handlesCurrentPass;
        material.alphaMode = B.Constants.ALPHA_ADD;
        const changedAdd = await sample();
        const changedUsesPoint = controller.handlesCurrentPass;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { classicAdd, pointAdd, pointCombine, changedAdd, additiveUsesPoint, combineUsesPoint, changedUsesPoint };
    });
    expect(result.classicAdd).toBe(255);
    expect(result.pointAdd).toBe(255);
    expect(result.changedAdd).toBe(255);
    expect(result.pointCombine).toBeLessThan(200);
    expect(result.additiveUsesPoint).toBe(false);
    expect(result.combineUsesPoint).toBe(true);
    expect(result.changedUsesPoint).toBe(false);
});
