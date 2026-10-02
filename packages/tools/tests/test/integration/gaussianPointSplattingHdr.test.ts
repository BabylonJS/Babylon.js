import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves evaluated SH radiance above one", async ({ page }) => {
    const config = getGlobalConfig();
    await page.goto(config.baseUrl + "/empty.html", { timeout: 0 });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => window.BABYLON);
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgpu",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl: config.baseUrl,
    });
    const radiance = await page.evaluate(async () => {
        const engine = window.engine;
        if (!(engine instanceof window.BABYLON.WebGPUEngine)) {
            throw new Error("HDR point-splatting coverage requires WebGPU.");
        }
        engine.setSize(64, 64);
        const scene = new window.BABYLON.Scene(engine);
        const camera = new window.BABYLON.FreeCamera("camera", new window.BABYLON.Vector3(0, 0, -3), scene);
        camera.setTarget(window.BABYLON.Vector3.Zero());
        const mesh = new window.BABYLON.GaussianSplattingMesh("hdr", null, scene);
        mesh.disableDepthSort = true;
        const data = new ArrayBuffer(32);
        new Float32Array(data).set([0, 0, 0, 0.4, 0.4, 0.4]);
        new Uint8Array(data).set([255, 255, 255, 255, 255, 128, 128, 128], 24);
        mesh.updateData(data, [new Uint8Array(16).fill(255)], { flipY: false }, undefined, 1);
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128; frame++) {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
        const renderer = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const buffer = renderer["_renderer"]?.accumBuffer;
        if (!buffer || (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point-splatting accumulation did not become ready.");
        }
        const bytes = await buffer.read((32 * 64 + 32) * 16, 16, undefined, true);
        const values = Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 4));
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return values;
    });
    for (const channel of radiance.slice(0, 3)) {
        expect(channel).toBeGreaterThan(1.2);
        expect(channel).toBeLessThan(1.7);
    }
});
