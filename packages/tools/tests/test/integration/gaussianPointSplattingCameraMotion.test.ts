import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

for (const downscaled of [false, true]) {
    test(`WebGPU camera motion shares ${downscaled ? "downscaled" : "full-resolution"} point depth and color without classic draws or sorting`, async ({ page }) => {
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
        const result = await page.evaluate(async (useDownscale) => {
            const B = window.BABYLON;
            const engine = window.engine;
            if (!(engine instanceof B.WebGPUEngine)) {
                throw new Error("Camera-motion coverage requires WebGPU.");
            }
            engine.setSize(useDownscale ? 626 : 128, useDownscale ? 471 : 128);
            const scene = new B.Scene(engine);
            const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
            camera.setTarget(B.Vector3.Zero());
            const depthMap = scene.enableDepthRenderer(camera, false, true).getDepthMap();
            if (useDownscale) {
                new B.PassPostProcess("colorDownscale", 0.8, camera, B.Texture.NEAREST_SAMPLINGMODE, engine);
                depthMap.resize({ width: 500, height: 376 });
            }
            const mesh = new B.GaussianSplattingMesh("splat", null, scene);
            const data = new ArrayBuffer(17 * 32);
            for (let splat = 0; splat < 17; splat++) {
                new Float32Array(data, splat * 32, 6).set([((splat % 5) - 2) * 0.1, (Math.floor(splat / 5) - 1) * 0.1, 0, 0.08, 0.08, 0.08]);
                new Uint8Array(data, splat * 32 + 24, 8).set([255, 255, 255, 128, 255, 128, 128, 128]);
            }
            mesh.updateData(data, undefined, { flipY: false });
            const render = async () => {
                engine.beginFrame();
                scene.render();
                engine.endFrame();
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            };
            await scene.whenReadyAsync();
            for (let frame = 0; frame < 600 && !mesh._isDepthSortSettled; frame++) {
                await render();
            }
            if (!mesh._isDepthSortSettled) {
                throw new Error("Initial classic sorting did not settle.");
            }
            mesh.pointSplattingRenderScale = 1;
            mesh.pointSplattingRenderMode = true;
            mesh.pointSplattingDepthRenderMode = true;
            const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
            for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
                await render();
            }
            if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
                throw new Error("Point rendering did not become ready.");
            }
            const renderer = controller["_renderer"]!;
            const gaussianBuffers = [renderer["_means"], renderer["_cov3d"], renderer["_colorOpacity"], renderer["_sh"]];
            let pointDepth = 0;
            let classicDepth = 0;
            let computeRuns = 0;
            let customDepth = false;
            let customColor = false;
            const customProjection = B.Matrix.PerspectiveFovLH(camera.fov, 0.8, camera.minZ, camera.maxZ, true);
            mesh.onBeforeRenderObservable.add(() => {
                const depthPass = engine.currentRenderPassId === depthMap.renderPassId;
                if ((depthPass && customDepth) || (!depthPass && customColor)) {
                    scene.setTransformMatrix(camera.getViewMatrix(), customProjection);
                }
                if (depthPass && controller.handlesCurrentPass) {
                    pointDepth++;
                }
            });
            const originalDraw = mesh["_drawColorPass"];
            mesh["_drawColorPass"] = (...args) => {
                if (controller["_getCurrentDepthRenderer"]()) {
                    classicDepth++;
                }
                return originalDraw.call(mesh, ...args);
            };
            const originalCompute = controller["_runCompute"];
            controller["_runCompute"] = () => {
                computeRuns++;
                originalCompute.call(controller);
            };
            const readSamples = async () => {
                const width = renderer.outputWidth;
                const height = renderer.outputHeight;
                const bytes = await renderer["_accumCount"]!.read((Math.floor(height / 2) * width + Math.floor(width / 2)) * 4, 4, undefined, true);
                return new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0] & 0xffff;
            };
            const measure = async (moving: boolean) => {
                pointDepth = 0;
                classicDepth = 0;
                computeRuns = 0;
                const sortStart = mesh["_sortRequestId"];
                const generation = renderer.accumulationVersion;
                const initialSamples = await readSamples();
                for (let frame = 0; frame < 30; frame++) {
                    if (moving) {
                        camera.position.x += 0.01;
                        camera.setTarget(B.Vector3.Zero());
                        camera.fov += 0.0005;
                    }
                    await render();
                }
                return {
                    pointDepth,
                    classicDepth,
                    computeRuns,
                    sortRequests: mesh["_sortRequestId"] - sortStart,
                    generationIncrease: renderer.accumulationVersion - generation,
                    sampleIncrease: (await readSamples()) - initialSamples,
                };
            };
            const moving = await measure(true);
            const stopped = await measure(false);
            customDepth = true;
            const incompatibleDepth = await measure(true);
            customDepth = false;
            customColor = true;
            for (let frame = 0; frame < 3; frame++) {
                await render();
            }
            const incompatibleColor = await measure(false);
            const currentBuffers = [renderer["_means"], renderer["_cov3d"], renderer["_colorOpacity"], renderer["_sh"]];
            const buffersReused = currentBuffers.every((buffer, index) => buffer === gaussianBuffers[index]);
            await engine["_device"].queue.onSubmittedWorkDone();
            scene.dispose();
            engine.dispose();
            window.engine = null;
            return { moving, stopped, incompatibleDepth, incompatibleColor, buffersReused };
        }, downscaled);
        expect(result.moving).toMatchObject({ pointDepth: 30, classicDepth: 0, computeRuns: 30, sortRequests: 0, generationIncrease: 30 });
        expect(result.stopped).toEqual({ pointDepth: 30, classicDepth: 0, computeRuns: 30, sortRequests: 0, generationIncrease: 0, sampleIncrease: 30 });
        expect(result.incompatibleDepth).toMatchObject({ pointDepth: 0, classicDepth: 30, computeRuns: 30, generationIncrease: 30 });
        expect(result.incompatibleColor).toMatchObject({ pointDepth: 0, classicDepth: 30, computeRuns: 30, generationIncrease: 0, sampleIncrease: 30 });
        expect(result.buffersReused).toBe(true);
    });
}
