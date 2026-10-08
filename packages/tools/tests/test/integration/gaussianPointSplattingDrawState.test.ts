import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves stencil and dynamic color draw state", async ({ page }) => {
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
    const samples = await page.evaluate(async () => {
        const B = window.BABYLON;
        const engine = window.engine;
        if (!(engine instanceof B.WebGPUEngine)) {
            throw new Error("Point-splatting draw-state coverage requires WebGPU.");
        }
        engine.setSize(64, 64);
        const scene = new B.Scene(engine);
        scene.clearColor = new B.Color4(0, 0, 0, 1);
        const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -3), scene);
        camera.setTarget(B.Vector3.Zero());
        const mask = B.MeshBuilder.CreatePlane("stencil mask", { width: 3, height: 6 }, scene);
        mask.position.set(-1.5, 0, -1);
        const maskMaterial = new B.StandardMaterial("mask", scene);
        maskMaterial.disableColorWrite = true;
        maskMaterial.disableDepthWrite = true;
        maskMaterial.backFaceCulling = false;
        maskMaterial.stencil.enabled = true;
        maskMaterial.stencil.func = B.Constants.ALWAYS;
        maskMaterial.stencil.funcRef = 1;
        mask.material = maskMaterial;
        const mesh = new B.GaussianSplattingMesh("splat", null, scene);
        mesh.disableDepthSort = true;
        mesh.renderingGroupId = 1;
        scene.setRenderingAutoClearDepthStencil(1, false);
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.8, 0.8, 0.8]);
        new Uint8Array(data).set([255, 255, 255, 255, 255, 128, 128, 128], 24);
        mesh.updateData(data, undefined, { flipY: false });
        const material = mesh.material!;
        material.stencil.enabled = true;
        material.stencil.func = B.Constants.EQUAL;
        material.stencil.funcRef = 1;
        material.stencil.opStencilDepthPass = B.Constants.KEEP;
        material.stencil.mask = 0;
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const render = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        };
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point-splatting accumulation did not become ready.");
        }
        await scene.whenReadyAsync();
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        for (let frame = 0; frame < 600 && !controller["_blit"]?.isReady(controller["_blitMesh"]!); frame++) {
            await render();
        }
        if (!controller["_blit"]?.isReady(controller["_blitMesh"]!)) {
            throw new Error("Point-splatting color compositor did not become ready.");
        }
        const sample = async () => {
            await render();
            const pixels = await engine.readPixels(0, 0, 64, 64);
            return [pixels[(32 * 64 + 24) * 4], pixels[(32 * 64 + 40) * 4]];
        };
        const masked = await sample();
        material.stencil.funcRef = 0;
        const inverted = await sample();
        material.stencil.enabled = false;
        material.disableColorWrite = true;
        const noColor = await sample();
        material.disableColorWrite = false;
        material.depthFunction = B.Constants.NEVER;
        const noDepth = await sample();
        material.depthFunction = B.Constants.ALWAYS;
        const restored = await sample();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { masked, inverted, noColor, noDepth, restored };
    });
    expect(samples.masked[0]).toBeGreaterThan(80);
    expect(samples.masked[1]).toBe(0);
    expect(samples.inverted[0]).toBe(0);
    expect(samples.inverted[1]).toBeGreaterThan(80);
    expect(samples.noColor).toEqual([0, 0]);
    expect(samples.noDepth).toEqual([0, 0]);
    for (const value of samples.restored) {
        expect(value).toBeGreaterThan(80);
    }
});
