import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves dynamic source and scene raster fill modes", async ({ page }) => {
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
            throw new Error("Fill-mode coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
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
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        mesh.pointSplattingDepthRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
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
            return { brightest, sum };
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point color did not become ready.");
        }
        const normal = await sample();
        const modes = [];
        for (const kind of ["material wireframe", "material points", "scene wireframe", "scene points", "mesh override"]) {
            const setEnabled = (enabled: boolean) => {
                if (kind === "material wireframe") {
                    mesh.material!.wireframe = enabled;
                } else if (kind === "material points") {
                    mesh.material!.pointsCloud = enabled;
                } else if (kind === "scene wireframe") {
                    scene.forceWireframe = enabled;
                } else if (kind === "scene points") {
                    scene.forcePointsCloud = enabled;
                } else {
                    mesh.overrideRenderingFillMode = enabled ? B.Material.WireFrameFillMode : null;
                }
            };
            mesh.pointSplattingRenderMode = false;
            setEnabled(true);
            await scene.whenReadyAsync();
            for (let frame = 0; frame < 10; frame++) {
                await render();
            }
            const classic = await sample();
            mesh.pointSplattingRenderMode = true;
            for (let frame = 0; frame < 10; frame++) {
                await render();
            }
            const enabled = await sample();
            const colorUsesPoint = controller.handlesCurrentPass;
            engine.currentRenderPassId = depthMap.renderPassId;
            const depthUsesPoint = controller.handlesCurrentPass;
            engine.currentRenderPassId = camera.renderPassId;
            setEnabled(false);
            for (let frame = 0; frame < 10; frame++) {
                await render();
            }
            const restored = await sample();
            const restoredUsesPoint = controller.handlesCurrentPass;
            engine.currentRenderPassId = depthMap.renderPassId;
            const restoredDepthUsesPoint = controller.handlesCurrentPass;
            engine.currentRenderPassId = camera.renderPassId;
            modes.push({ kind, classic, enabled, restored, colorUsesPoint, depthUsesPoint, restoredUsesPoint, restoredDepthUsesPoint });
        }
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { normal, modes };
    });
    expect(result.normal.brightest).toBeGreaterThan(20);
    for (const mode of result.modes) {
        expect(mode.enabled, mode.kind).toEqual(mode.classic);
        expect(mode.colorUsesPoint, mode.kind).toBe(false);
        expect(mode.depthUsesPoint, mode.kind).toBe(!mode.kind.startsWith("scene"));
        expect(mode.restored.brightest, mode.kind).toBeGreaterThan(20);
        expect(mode.restoredUsesPoint, mode.kind).toBe(true);
        expect(mode.restoredDepthUsesPoint, mode.kind).toBe(true);
    }
});
