import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point color commits same-sized reloads for classic ShadowGenerator passes", async ({ page }) => {
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
            throw new Error("Shadow atlas reload coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
        const scene = new B.Scene(engine);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const light = new B.DirectionalLight("light", new B.Vector3(0, 0, 1), scene);
        light.position.set(0, 0, -3);
        light.shadowFrustumSize = 4;
        light.shadowMinZ = 0.1;
        light.shadowMaxZ = 10;
        const shadows = new B.ShadowGenerator(128, light, true);
        shadows.transparencyShadow = true;
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        const makeData = (x: number, opacity: number) => {
            const data = new ArrayBuffer(32);
            new Float32Array(data).set([x, 0, 0, 0.2, 0.2, 0.2]);
            new Uint8Array(data).set([255, 255, 255, opacity, 255, 128, 128, 128], 24);
            return data;
        };
        mesh.updateData(makeData(0, 255), undefined, { flipY: false });
        shadows.addShadowCaster(mesh);
        let shadowDraws = 0;
        shadows.onBeforeShadowMapRenderMeshObservable.add(() => shadowDraws++);
        const render = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 600 && (!mesh._isDepthSortSettled || !mesh.geometry || !shadows.isReady(mesh.subMeshes[0], true, true)); frame++) {
            await render();
        }
        if (!mesh._isDepthSortSettled || !mesh.geometry) {
            throw new Error("Initial classic splat sorting did not settle.");
        }
        const readShadowAtlas = async () => {
            const positions = await mesh.centersTexture!.readPixels();
            const colors = await mesh.colorsTexture!.readPixels();
            if (!(positions instanceof Float32Array) || !(colors instanceof Uint8Array)) {
                throw new Error("Classic shadow atlas readback must return float positions and byte colors.");
            }
            return { x: positions[0], opacity: colors[3] };
        };
        await render();
        const original = await readShadowAtlas();
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point color did not become ready.");
        }
        const centers = mesh.centersTexture;
        const previousSortRequest = mesh["_sortRequestId"];
        let classicColorPasses = 0;
        mesh.onBeforeRenderObservable.add(() => {
            if (engine.currentRenderPassId === camera.renderPassId && !controller.handlesCurrentPass) {
                classicColorPasses++;
            }
        });
        mesh.updateData(makeData(1, 255), undefined, { flipY: false });
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const moved = await readShadowAtlas();
        mesh.updateData(makeData(1, 0), undefined, { flipY: false });
        for (let frame = 0; frame < 3; frame++) {
            await render();
        }
        const transparent = await readShadowAtlas();
        const atlasReused = centers === mesh.centersTexture;
        const pendingUpload = mesh["_delayedTextureUpdate"] !== null;
        const depthSortingEnabled = !mesh.disableDepthSort;
        const hasDepthRenderer = !!scene._depthRenderer && Object.keys(scene._depthRenderer).length > 0;
        const sortRequests = mesh["_sortRequestId"] - previousSortRequest;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { original, moved, transparent, atlasReused, pendingUpload, depthSortingEnabled, sortRequests, classicColorPasses, hasDepthRenderer, shadowDraws };
    });
    expect(result.original).toEqual({ x: 0, opacity: 255 });
    expect(result.moved).toEqual({ x: 1, opacity: 255 });
    expect(result.transparent).toEqual({ x: 1, opacity: 0 });
    expect(result.shadowDraws).toBeGreaterThan(30);
    expect(result.atlasReused).toBe(true);
    expect(result.pendingUpload).toBe(false);
    expect(result.depthSortingEnabled).toBe(true);
    expect(result.sortRequests).toBe(0);
    expect(result.classicColorPasses).toBe(0);
    expect(result.hasDepthRenderer).toBe(false);
});
