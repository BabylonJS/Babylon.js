import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU incompatible per-pass part states preserve point color convergence", async ({ page }) => {
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
            throw new Error("Per-pass accumulation coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 1);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const depth = scene.enableDepthRenderer(camera, false, true);
        const depthMap = depth.getDepthMap();
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.2, 0.12, 0.08]);
        new Uint8Array(data).set([255, 255, 255, 128, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        mesh.pointSplattingDepthRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        let depthX = 0;
        let depthFallbacks = 0;
        let pointDepthPasses = 0;
        mesh.onBeforeRenderObservable.add(() => {
            const depthPass = engine.currentRenderPassId === depthMap.renderPassId;
            mesh.position.x = depthPass ? depthX : 1;
            if (depthPass) {
                if (controller.handlesCurrentPass) {
                    pointDepthPasses++;
                } else {
                    depthFallbacks++;
                }
            }
        });
        const render = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point color did not become ready.");
        }
        const renderer = controller["_renderer"]!;
        const accumulation = renderer.accumBuffer;
        const hiZ = renderer["_hiZ"];
        const readSamples = async () => {
            const bytes = await renderer["_accumCount"]!.read((64 * 128 + 64) * 4, 4, undefined, true);
            return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0] & 0xffff;
        };
        const initialSamples = await readSamples();
        const generation = mesh.pointSplattingProgress!.accumulationVersion;
        const initialFrames = mesh.pointSplattingProgress!.renderedFrameCount;
        depthFallbacks = 0;
        pointDepthPasses = 0;
        const generations: number[] = [];
        for (let frame = 0; frame < 30; frame++) {
            await render();
            generations.push(mesh.pointSplattingProgress!.accumulationVersion);
        }
        const finalSamples = await readSamples();
        const frameIncrease = mesh.pointSplattingProgress!.renderedFrameCount - initialFrames;
        const buffersReused = accumulation === renderer.accumBuffer && hiZ === renderer["_hiZ"];
        const fallbacks = depthFallbacks;
        const incompatiblePointDepth = pointDepthPasses;
        engine.beginFrame();
        scene.render();
        engine.endFrame();
        const color = await engine.readPixels(0, 0, 128, 128);
        let visibleColor = 0;
        for (let index = 1; index < color.byteLength; index += 4) {
            visibleColor = Math.max(visibleColor, color[index]);
        }
        const pixels = await depthMap.readPixels();
        if (!(pixels instanceof Float32Array)) {
            throw new Error("Depth target must return floating-point pixels.");
        }
        const depthWidth = depthMap.getRenderWidth();
        const depthHeight = depthMap.getRenderHeight();
        const depthStride = pixels.length / (depthWidth * depthHeight);
        const depthAtOrigin = pixels[(Math.floor(depthHeight / 2) * depthWidth + Math.floor(depthWidth / 2)) * depthStride];
        depthX = 1;
        const previousDepthPasses = pointDepthPasses;
        for (let frame = 0; frame < 3; frame++) {
            await render();
        }
        const matchedPointDepth = pointDepthPasses - previousDepthPasses;
        const matchedGeneration = mesh.pointSplattingProgress!.accumulationVersion;
        mesh.pointSplattingRenderMode = false;
        depthX = 0;
        const beforeDepthOnly = pointDepthPasses;
        for (let frame = 0; frame < 3; frame++) {
            await render();
        }
        const depthOnlyPasses = pointDepthPasses - beforeDepthOnly;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return {
            generation,
            generations,
            initialSamples,
            finalSamples,
            frameIncrease,
            buffersReused,
            fallbacks,
            incompatiblePointDepth,
            visibleColor,
            depthAtOrigin,
            matchedPointDepth,
            matchedGeneration,
            depthOnlyPasses,
        };
    });
    expect(result.generations).toEqual(new Array(30).fill(result.generation));
    expect(result.initialSamples).toBeGreaterThan(1);
    expect(result.finalSamples - result.initialSamples).toBe(30);
    expect(result.frameIncrease).toBe(30);
    expect(result.buffersReused).toBe(true);
    expect(result.fallbacks).toBe(30);
    expect(result.incompatiblePointDepth).toBe(0);
    expect(result.visibleColor).toBeGreaterThan(20);
    expect(result.visibleColor).toBeLessThan(240);
    expect(result.depthAtOrigin).toBeLessThan(0.99);
    expect(result.matchedPointDepth).toBe(3);
    expect(result.matchedGeneration).toBe(result.generation);
    expect(result.depthOnlyPasses).toBe(3);
});
