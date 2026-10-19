import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

for (const restoreEnabled of [false, true]) {
    test(`WebGPU point splatting allocates Hi-Z only when enabled and restores culling ${restoreEnabled ? "on" : "off"}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error" || /validation.*error|WebGPU.*(?:error|invalid)/i.test(message.text())) {
                errors.push(message.text());
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
        const result = await page.evaluate(async (restoreEnabled) => {
            const B = window.BABYLON;
            const engine = window.engine;
            if (!(engine instanceof B.WebGPUEngine)) {
                throw new Error("Hi-Z coverage requires WebGPU.");
            }
            engine.setSize(128, 96);
            const scene = new B.Scene(engine);
            scene.clearColor = new B.Color4(0, 0, 0, 1);
            const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
            camera.setTarget(B.Vector3.Zero());
            const mesh = new B.GaussianSplattingMesh("splat", null, scene);
            mesh.disableDepthSort = true;
            const data = new ArrayBuffer(32);
            new Float32Array(data).set([0, 0, 0, 0.2, 0.12, 0.08]);
            new Uint8Array(data).set([255, 0, 0, 255, 255, 128, 128, 128], 24);
            mesh.updateData(data, undefined, { flipY: false });
            await scene.whenReadyAsync();
            mesh.pointSplattingRenderScale = 1;
            mesh.pointSplattingRenderMode = true;
            const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
            const render = async () => {
                engine.beginFrame();
                scene.render();
                engine.endFrame();
                await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            };
            const advance = async () => {
                const before = mesh.pointSplattingProgress?.renderedFrameCount ?? 0;
                for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < before + 16; frame++) {
                    await render();
                }
                if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < before + 16) {
                    throw new Error("Point rendering did not advance.");
                }
            };
            const snapshots: { enabled: boolean; bytes: number; expectedBytes: number; levels: number; params: number; untouched: boolean; hasSamples: boolean }[] = [];
            const snapshot = async () => {
                const renderer = controller["_renderer"]!;
                const buffer = renderer["_hiZ"]!;
                const bytes = buffer.getBuffer().capacity;
                const values = new Float32Array(bytes / 4);
                await buffer.read(0, bytes, values, true);
                let expectedBytes = 4;
                const enabled = mesh.pointSplattingOcclusionCulling;
                if (enabled) {
                    expectedBytes = 0;
                    for (let level = 0; level <= Math.floor(Math.log2(Math.max(renderer["_width"], renderer["_height"]))); level++) {
                        expectedBytes += Math.max(1, renderer["_width"] >> level) * Math.max(1, renderer["_height"] >> level) * 4;
                    }
                }
                snapshots.push({
                    enabled,
                    bytes,
                    expectedBytes,
                    levels: renderer["_hiZLevels"].length,
                    params: renderer["_hiZBuildParams"].length,
                    untouched: values.length === 1 && values[0] === Math.fround(1e30),
                    hasSamples: values.some((value) => value > 0 && value < Math.fround(1e30)),
                });
            };
            await advance();
            await snapshot();
            const inert = controller["_renderer"]!["_hiZ"];
            mesh.pointSplattingOcclusionCulling = true;
            await advance();
            await snapshot();
            const pyramid = controller["_renderer"]!["_hiZ"];
            engine.setSize(65, 49);
            await advance();
            await snapshot();
            const resizedPyramid = controller["_renderer"]!["_hiZ"];
            mesh.pointSplattingOcclusionCulling = false;
            await advance();
            await snapshot();
            const disabled = controller["_renderer"]!["_hiZ"];
            engine.setSize(97, 73);
            await advance();
            await snapshot();
            const inertReusedOnResize = disabled === controller["_renderer"]!["_hiZ"];
            mesh.pointSplattingOcclusionCulling = true;
            await advance();
            await snapshot();
            mesh.pointSplattingOcclusionCulling = restoreEnabled;
            await advance();
            const beforeRestore = controller["_renderer"];
            await engine["_device"].queue.onSubmittedWorkDone();
            engine.onContextRestoredObservable.notifyObservers(engine);
            await advance();
            await snapshot();
            const restored = beforeRestore !== controller["_renderer"];
            const recreated = controller["_renderer"]!["_hiZ"] !== disabled;
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            const pixels = await engine.readPixels(0, 0, 97, 73);
            const redChannel = engine["_colorFormat"].startsWith("bgra") ? 2 : 0;
            let red = 0;
            for (let index = 0; index < pixels.byteLength; index += 4) {
                red = Math.max(red, pixels[index + redChannel]);
            }
            await engine["_device"].queue.onSubmittedWorkDone();
            scene.dispose();
            engine.dispose();
            window.engine = null;
            return {
                snapshots,
                pyramidAllocated: pyramid !== inert,
                pyramidResized: pyramid !== resizedPyramid,
                inertReusedOnResize,
                restored,
                recreated,
                red,
            };
        }, restoreEnabled);
        for (const snapshot of result.snapshots) {
            expect(snapshot.bytes).toBe(snapshot.expectedBytes);
            if (snapshot.enabled) {
                expect(snapshot.levels).toBeGreaterThan(1);
                expect(snapshot.params).toBe(snapshot.levels - 1);
                expect(snapshot.hasSamples).toBe(true);
            } else {
                expect(snapshot.bytes).toBe(4);
                expect(snapshot.levels).toBe(0);
                expect(snapshot.params).toBe(0);
                expect(snapshot.untouched).toBe(true);
            }
        }
        expect(result.pyramidAllocated).toBe(true);
        expect(result.pyramidResized).toBe(true);
        expect(result.inertReusedOnResize).toBe(true);
        expect(result.restored).toBe(true);
        expect(result.recreated).toBe(true);
        expect(result.red).toBeGreaterThan(20);
        expect(errors).toEqual([]);
    });
}
