import { expect, test } from "@playwright/test";
import { evaluateDisposeEngine, evaluateInitEngine, getGlobalConfig } from "@tools/test-tools";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";

test("WebGPU replays a render-target snapshot after the main pass grows its instance buffer", async ({ page }) => {
    await page.goto(`${getGlobalConfig().baseUrl}/empty.html`, { waitUntil: "load" });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => !!window.BABYLON?.WebGPUEngine);
    await page.evaluate(evaluateInitEngine, { engineName: "webgpu" });

    try {
        const result = await page.evaluate(async () => {
            const BABYLON = window.BABYLON;
            const engine = window.engine as WebGPUEngine;
            engine.compatibilityMode = false;
            const scene = new BABYLON.Scene(engine);
            new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -5), scene);
            new BABYLON.HemisphericLight("light", BABYLON.Vector3.Up(), scene);

            const mesh = BABYLON.MeshBuilder.CreateBox("source", { size: 0.4 }, scene);
            mesh.material = new BABYLON.StandardMaterial("material", scene);
            mesh.registerInstancedBuffer("color", 4);
            mesh.instancedBuffers.color = new BABYLON.Color4(0, 1, 0, 1);
            const first = mesh.createInstance("first");
            first.position.x = 0.5;

            const target = new BABYLON.RenderTargetTexture("small batch", 64, scene);
            target.renderList = [mesh, first];
            scene.customRenderTargets.push(target);

            const frameAsync = async () => {
                engine._device.pushErrorScope("validation");
                engine.beginFrame();
                scene.render();
                engine.endFrame();
                const error = await engine._device.popErrorScope();
                return error?.message ?? null;
            };

            await scene.whenReadyAsync();
            const warmup = await frameAsync();
            for (let i = 0; i < 32; i++) {
                const instance = mesh.createInstance(`main-only-${i}`);
                instance.position.set((i % 8) * 0.2 - 0.8, Math.floor(i / 8) * 0.2 - 0.4, 0);
            }

            // The target records a small batch first; only the main pass needs more capacity.
            engine.snapshotRenderingMode = BABYLON.Constants.SNAPSHOTRENDERING_STANDARD;
            engine.snapshotRendering = true;
            const recording = await frameAsync();
            const playback = [await frameAsync(), await frameAsync()];
            return { warmup, recording, playback };
        });

        expect(result).toEqual({ warmup: null, recording: null, playback: [null, null] });
    } finally {
        await page.evaluate(evaluateDisposeEngine);
    }
});
