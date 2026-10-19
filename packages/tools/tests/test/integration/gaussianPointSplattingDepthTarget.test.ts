import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU mismatched point targets preserve depth pixel metrics and translucent color convergence", async ({ page }) => {
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
        material.minPixelSize = 0;
        material.alpha = 0.5;
        mesh.pointSplattingRenderMode = true;
        let depthFallbacks = 0;
        let pointDepthPasses = 0;
        mesh.onBeforeRenderObservable.add(() => {
            if (engine.currentRenderPassId === depthMap.renderPassId) {
                if (controller.handlesCurrentPass) {
                    pointDepthPasses++;
                } else {
                    depthFallbacks++;
                }
            }
        });
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const renderer = controller["_renderer"]!;
        const accumulation = renderer.accumBuffer;
        const hiZ = renderer["_hiZ"];
        const hiZUniform = renderer["_hiZBuildParams"][0];
        const readSampleCount = async () => {
            const bytes = await renderer["_accumCount"]!.read((32 * 64 + 32) * 4, 4, undefined, true);
            // Resolve packs the accumulation generation above the 16-bit sample count.
            return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0] & 0xffff;
        };
        const initialSamples = await readSampleCount();
        const initialGeneration = mesh.pointSplattingProgress!.accumulationVersion;
        const initialFrames = mesh.pointSplattingProgress!.renderedFrameCount;
        const generations: number[] = [];
        for (let frame = 0; frame < 30; frame++) {
            await render();
            generations.push(mesh.pointSplattingProgress!.accumulationVersion);
        }
        const finalSamples = await readSampleCount();
        const finalFrames = mesh.pointSplattingProgress!.renderedFrameCount;
        const buffersReused = accumulation === renderer.accumBuffer && hiZ === renderer["_hiZ"] && hiZUniform === renderer["_hiZBuildParams"][0];
        engine.beginFrame();
        scene.render();
        engine.endFrame();
        const colorPixels = await engine.readPixels(0, 0, 128, 128);
        let visibleColor = 0;
        for (let index = 0; index < colorPixels.byteLength; index += 4) {
            visibleColor = Math.max(visibleColor, colorPixels[index]);
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
        return {
            classic,
            halfClassic,
            point,
            both,
            depthWidth,
            depthHeight,
            colorWidth,
            postWidth,
            postHeight,
            mapWidth,
            mapHeight,
            depthFallbacks,
            pointDepthPasses,
            initialSamples,
            finalSamples,
            initialGeneration,
            generations,
            initialFrames,
            finalFrames,
            buffersReused,
            visibleColor,
        };
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
    expect(result.depthFallbacks).toBeGreaterThanOrEqual(60);
    expect(result.pointDepthPasses).toBe(0);
    expect(result.generations).toEqual(new Array(30).fill(result.initialGeneration));
    expect(result.initialSamples).toBeGreaterThan(1);
    expect(result.finalSamples - result.initialSamples).toBe(30);
    expect(result.finalFrames - result.initialFrames).toBe(30);
    expect(result.buffersReused).toBe(true);
    expect(result.visibleColor).toBeGreaterThan(20);
    expect(result.visibleColor).toBeLessThan(240);
});
