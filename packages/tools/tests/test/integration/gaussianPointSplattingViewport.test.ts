import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves minPixelSize at a half-size camera viewport", async ({ page }) => {
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
            throw new Error("Point-splatting viewport coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 1);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.1, 0.06, 0.04]);
        new Uint8Array(data).set([255, 255, 255, 255, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        const material = mesh.material as import("core/Materials/GaussianSplatting/gaussianSplattingMaterial").GaussianSplattingMaterial;
        material.minPixelSize = 20;
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
            const pixels = await engine.readPixels(0, 0, 128, 128);
            let maximum = 0;
            for (let index = 0; index < pixels.byteLength; index += 4) {
                maximum = Math.max(maximum, pixels[index]);
            }
            return maximum;
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const fullClassic = await sample();
        camera.viewport = new B.Viewport(0.25, 0.25, 0.5, 0.5);
        const halfClassic = await sample();
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const halfPoint = await sample();
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const halfUsesPoint = controller.handlesCurrentPass;
        camera.viewport = new B.Viewport(0, 0, 1, 1);
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
            await render();
        }
        for (let frame = 0; frame < 600 && !controller["_blit"]?.isReady(controller["_blitMesh"]!); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)) {
            throw new Error("Full-viewport point compositor did not become ready.");
        }
        const fullPoint = await sample();
        const fullUsesPoint = controller.handlesCurrentPass;
        camera.viewport = new B.Viewport(0.25, 0.25, 0.5, 0.5);
        const changedHalf = await sample();
        const changedUsesPoint = controller.handlesCurrentPass;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { fullClassic, halfClassic, halfPoint, fullPoint, changedHalf, halfUsesPoint, fullUsesPoint, changedUsesPoint };
    });
    expect(result.fullClassic).toBeGreaterThan(80);
    expect(result.halfClassic).toBe(0);
    expect(result.halfPoint).toBe(0);
    expect(result.changedHalf).toBe(0);
    expect(result.fullPoint).toBeGreaterThan(80);
    expect(result.halfUsesPoint).toBe(false);
    expect(result.fullUsesPoint).toBe(true);
    expect(result.changedUsesPoint).toBe(false);
});
