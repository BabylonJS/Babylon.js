import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

for (const mode of ["engine", "scene"]) {
    test(`WebGPU point splatting preserves ${mode}-level floating-origin color and depth`, async ({ page }) => {
        const config = getGlobalConfig();
        await page.goto(config.baseUrl + "/empty.html", { timeout: 0 });
        await page.waitForSelector("#babylon-canvas");
        await page.waitForFunction(() => window.BABYLON?.Tools);
        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName: "webgpu",
            useLargeWorldRendering: mode === "engine",
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: "false",
            baseUrl: config.baseUrl,
        });
        const result = await page.evaluate(async (mode) => {
            const B = window.BABYLON;
            const engine = window.engine;
            if (!(engine instanceof B.WebGPUEngine)) {
                throw new Error("Floating-origin coverage requires WebGPU.");
            }
            engine.setSize(128, 128);
            const scene = new B.Scene(engine, { useFloatingOrigin: mode === "scene" });
            scene.clearColor = new B.Color4(0, 0, 0, 1);
            const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
            camera.setTarget(B.Vector3.Zero());
            const depthMap = scene.enableDepthRenderer(camera, false, true).getDepthMap();
            const mesh = new B.GaussianSplattingMesh("splat", null, scene);
            mesh.disableDepthSort = true;
            const data = new ArrayBuffer(32);
            new Float32Array(data).set([0, 0, 0, 0.2, 0.12, 0.08]);
            new Uint8Array(data).set([255, 255, 255, 255, 255, 128, 128, 128], 24);
            mesh.updateData(data, undefined, { flipY: false });
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
                let brightest = 0;
                let sum = 0;
                for (let index = 1; index < pixels.byteLength; index += 4) {
                    brightest = Math.max(brightest, pixels[index]);
                    sum += pixels[index];
                }
                const depth = await depthMap.readPixels();
                if (!(depth instanceof Float32Array)) {
                    throw new Error("Depth target must return floating-point pixels.");
                }
                const stride = depth.length / (depthMap.getRenderWidth() * depthMap.getRenderHeight());
                let minimumDepth = 1;
                let depthPixels = 0;
                for (let index = 0; index < depth.length; index += stride) {
                    minimumDepth = Math.min(minimumDepth, depth[index]);
                    if (depth[index] < 0.99) {
                        depthPixels++;
                    }
                }
                return { brightest, sum, minimumDepth, depthPixels };
            };
            await scene.whenReadyAsync();
            for (let frame = 0; frame < 30; frame++) {
                await render();
            }
            const classic = await sample();
            mesh.pointSplattingRenderScale = 1;
            mesh.pointSplattingRenderMode = true;
            mesh.pointSplattingDepthRenderMode = true;
            for (let frame = 0; frame < 30; frame++) {
                await render();
            }
            const enabled = await sample();
            const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
            const colorUsesPoint = controller.handlesCurrentPass;
            engine.currentRenderPassId = depthMap.renderPassId;
            const depthUsesPoint = controller.handlesCurrentPass;
            const floatingOrigin = scene.floatingOriginMode;
            await engine["_device"].queue.onSubmittedWorkDone();
            scene.dispose();
            engine.dispose();
            window.engine = null;
            return { classic, enabled, colorUsesPoint, depthUsesPoint, floatingOrigin };
        }, mode);
        expect(result.floatingOrigin).toBe(true);
        expect(result.classic.brightest).toBeGreaterThan(20);
        expect(result.classic.depthPixels).toBeGreaterThan(0);
        expect(result.classic.minimumDepth).toBeLessThan(0.99);
        expect(result.enabled).toEqual(result.classic);
        expect(result.colorUsesPoint).toBe(false);
        expect(result.depthUsesPoint).toBe(false);
    });
}
