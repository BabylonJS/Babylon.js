import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point depth preserves full-resolution pixel metrics with a half-resolution post-process", async ({ page }) => {
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
            throw new Error("Depth target coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const postProcess = new B.PassPostProcess("half", 0.5, camera);
        const depth = scene.enableDepthRenderer(camera, false, true);
        const depthMap = depth.getDepthMap();
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
        const countDepth = async () => {
            const pixels = await depthMap.readPixels();
            if (!(pixels instanceof Float32Array)) {
                throw new Error("Depth target must return floating-point pixels.");
            }
            let occupied = 0;
            for (let index = 0; index < pixels.length; index += 4) {
                if (pixels[index] < 0.99) {
                    occupied++;
                }
            }
            return occupied;
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const classic = await countDepth();
        depthMap.resize(64);
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const halfClassic = await countDepth();
        depthMap.resize(128);
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingDepthRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        for (
            let frame = 0;
            frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_depthBlit"]?.isReady(controller["_depthBlitMesh"]!));
            frame++
        ) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point depth did not become ready.");
        }
        const point = await countDepth();
        const depthWidth = controller["_computedWidth"];
        const depthHeight = controller["_computedHeight"];
        mesh.pointSplattingRenderMode = true;
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const both = await countDepth();
        const colorWidth = controller["_computedWidth"];
        const postWidth = postProcess.width;
        const postHeight = postProcess.height;
        const mapWidth = depthMap.getRenderWidth();
        const mapHeight = depthMap.getRenderHeight();
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { classic, halfClassic, point, both, depthWidth, depthHeight, colorWidth, postWidth, postHeight, mapWidth, mapHeight };
    });
    expect(result.postWidth).toBe(64);
    expect(result.postHeight).toBe(64);
    expect(result.mapWidth).toBe(128);
    expect(result.mapHeight).toBe(128);
    expect(result.depthWidth).toBe(128);
    expect(result.depthHeight).toBe(128);
    expect(result.colorWidth).toBe(64);
    expect(result.classic).toBeGreaterThan(0);
    expect(result.halfClassic).toBe(0);
    expect(result.point).toBeGreaterThan(0);
    expect(result.both).toBeGreaterThan(0);
});
