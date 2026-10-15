import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves opaque transparency and dynamic alpha blending transitions", async ({ page }) => {
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
            throw new Error("Transparency mode coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 1);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.2, 0.12, 0.08]);
        new Uint8Array(data).set([255, 255, 255, 128, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        const material = mesh.material!;
        material.transparencyMode = B.Material.MATERIAL_OPAQUE;
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
            return pixels[(64 * 128 + 64) * 4 + 1];
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const classicOpaque = await sample();
        material.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
        const classicBlend = await sample();
        material.transparencyMode = B.Material.MATERIAL_OPAQUE;
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const pointOpaque = await sample();
        const opaqueUsesPoint = controller.handlesCurrentPass;
        material.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)) {
            throw new Error("Alpha-blended point color did not become ready.");
        }
        const pointBlend = await sample();
        const blendUsesPoint = controller.handlesCurrentPass;
        material.transparencyMode = B.Material.MATERIAL_OPAQUE;
        const changedOpaque = await sample();
        const changedOpaqueUsesPoint = controller.handlesCurrentPass;
        material.transparencyMode = B.Material.MATERIAL_ALPHATEST;
        const alphaTest = await sample();
        const alphaTestUsesPoint = controller.handlesCurrentPass;
        material.transparencyMode = B.Material.MATERIAL_ALPHATESTANDBLEND;
        const alphaTestBlendUsesPoint = controller.handlesCurrentPass;
        material.transparencyMode = B.Material.MATERIAL_ALPHABLEND;
        const restoredBlend = await sample();
        const restoredUsesPoint = controller.handlesCurrentPass;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return {
            classicOpaque,
            classicBlend,
            pointOpaque,
            pointBlend,
            changedOpaque,
            alphaTest,
            restoredBlend,
            opaqueUsesPoint,
            blendUsesPoint,
            changedOpaqueUsesPoint,
            alphaTestUsesPoint,
            alphaTestBlendUsesPoint,
            restoredUsesPoint,
        };
    });
    expect(result.classicOpaque).toBeGreaterThan(240);
    expect(result.pointOpaque).toBe(result.classicOpaque);
    expect(result.changedOpaque).toBe(result.classicOpaque);
    expect(result.alphaTest).toBe(result.classicOpaque);
    expect(result.classicBlend).toBeGreaterThan(80);
    expect(result.classicBlend).toBeLessThan(180);
    expect(result.pointBlend).toBeGreaterThan(80);
    expect(result.pointBlend).toBeLessThan(180);
    expect(Math.abs(result.pointBlend - result.classicBlend)).toBeLessThan(40);
    expect(result.restoredBlend).toBeGreaterThan(80);
    expect(result.restoredBlend).toBeLessThan(180);
    expect(result.opaqueUsesPoint).toBe(false);
    expect(result.blendUsesPoint).toBe(true);
    expect(result.changedOpaqueUsesPoint).toBe(false);
    expect(result.alphaTestUsesPoint).toBe(false);
    expect(result.alphaTestBlendUsesPoint).toBe(false);
    expect(result.restoredUsesPoint).toBe(true);
});
