import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting uses frozen projection clipping planes instead of camera properties", async ({ page }) => {
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
            throw new Error("Frozen-projection coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 1);
        const camera = new B.FreeCamera("camera", B.Vector3.Zero(), scene);
        camera.minZ = 1;
        camera.maxZ = 5;
        const projection = B.Matrix.Identity();
        B.Matrix.PerspectiveFovLHToRef(camera.fov, 1, 0.1, 20, projection, true, true);
        camera.freezeProjectionMatrix(projection);
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.alwaysSelectAsActiveMesh = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.3, 0.2, 0.1]);
        new Uint8Array(data).set([255, 255, 255, 255, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        mesh.pointSplattingRenderScale = 1;
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
        const samples = [];
        for (const depth of [0.5, 10, 25]) {
            mesh.pointSplattingRenderMode = false;
            mesh.position.z = depth;
            for (let frame = 0; frame < 30; frame++) {
                await render();
            }
            const classic = await sample();
            mesh.pointSplattingRenderMode = true;
            const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
            for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
                await render();
            }
            if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
                throw new Error(`Frozen-projection point accumulation did not become ready at depth ${depth}.`);
            }
            const point = await sample();
            samples.push({ depth, classic, point, usesPoint: controller.handlesCurrentPass });
        }
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return samples;
    });
    for (const sample of result) {
        expect(sample.usesPoint).toBe(true);
        if (sample.depth < 20) {
            expect(sample.classic).toBeGreaterThan(80);
            expect(sample.point).toBeGreaterThan(80);
        } else {
            expect(sample.classic).toBe(0);
            expect(sample.point).toBe(0);
        }
    }
});
