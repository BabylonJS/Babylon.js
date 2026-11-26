import { expect, test, type Page } from "@playwright/test";
import { getGlobalConfig, evaluateInitEngine, evaluateDisposeEngine } from "@tools/test-tools";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";

// releaseEffects() flushes the effect cache while effects, the clear quad and recorded snapshot bundles can still use their GPU resources.
// These tests render, call releaseEffects(), keep rendering long enough for the deferred buffer destruction to run, and check that the
// rendering is unchanged and that WebGPU reports no validation error (a destroyed buffer in a submitted bundle is one).
// readPixels() returns the raw bytes of the swap chain, which are BGRA on a bgra8unorm canvas: the checked pixels are green on a blue
// background, so the expected bytes are the same for both canvas formats.

type ReleaseEffectsResult = {
    before: number[];
    after: number[];
    gpuErrors: string[];
};

const initPageAsync = async (page: Page) => {
    await page.goto(getGlobalConfig().baseUrl + "/empty.html", { waitUntil: "load" });
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => !!window.BABYLON?.WebGPUEngine);
    await page.evaluate(evaluateInitEngine, { engineName: "webgpu" });
};

const expectSameColor = (actual: number[], expected: number[]) => {
    for (let channel = 0; channel < 4; channel++) {
        expect(Math.abs(actual[channel] - expected[channel]), `channel ${channel}`).toBeLessThanOrEqual(2);
    }
};

test("WebGPU scissored clear still renders after releaseEffects", async ({ page }) => {
    await initPageAsync(page);

    try {
        const result: ReleaseEffectsResult = await page.evaluate(async () => {
            const engine = window.engine as WebGPUEngine;

            const gpuErrors: string[] = [];
            engine._device.addEventListener("uncapturederror", (event) => gpuErrors.push((event as GPUUncapturedErrorEvent).error.message));

            // render bundles are only used for the clear quad when the compatibility mode is off
            engine.compatibilityMode = false;

            const scene = new window.BABYLON.Scene(engine);
            scene.clearColor = new window.BABYLON.Color4(0, 0, 1, 1);
            new window.BABYLON.FreeCamera("camera", new window.BABYLON.Vector3(0, 0, -5), scene);

            const width = engine.getRenderWidth();
            const height = engine.getRenderHeight();
            scene.onAfterRenderObservable.add(() => {
                // a scissored clear is done with the clear quad (and its left-over uniform buffer)
                engine.enableScissor(width / 4, height / 4, width / 2, height / 2);
                engine.clear(new window.BABYLON.Color4(0, 1, 0, 1), true, true);
                engine.disableScissor();
            });

            let waiters: { frames: number; resolve: () => void }[] = [];
            engine.runRenderLoop(() => {
                scene.render();
                waiters = waiters.filter((waiter) => --waiter.frames > 0 || (waiter.resolve(), false));
            });
            const renderFramesAsync = async (frames: number) => await new Promise<void>((resolve) => waiters.push({ frames, resolve }));
            // reads the center pixel of the next rendered frame, once the scene has been rendered into the swap chain texture
            const readCenterAsync = async () =>
                await new Promise<number[]>((resolve, reject) => {
                    scene.onAfterRenderObservable.addOnce(() => {
                        engine.readPixels(engine.getRenderWidth() >> 1, engine.getRenderHeight() >> 1, 1, 1).then((data) => resolve(Array.from(data as Uint8Array)), reject);
                    });
                });

            await renderFramesAsync(5);
            const before = await readCenterAsync();

            engine.releaseEffects();
            await renderFramesAsync(10);
            const after = await readCenterAsync();

            engine.stopRenderLoop();
            await engine._device.queue.onSubmittedWorkDone();

            return { before, after, gpuErrors };
        });

        expectSameColor(result.before, [0, 255, 0, 255]);
        expectSameColor(result.after, [0, 255, 0, 255]);
        expect(result.gpuErrors).toEqual([]);
    } finally {
        await page.evaluate(evaluateDisposeEngine);
    }
});

for (const reuseDraws of [false, true]) {
    test(`WebGPU snapshot rendering still renders after releaseEffects (snapshotRenderingReuseDraws = ${reuseDraws})`, async ({ page }) => {
        await initPageAsync(page);

        try {
            const result: ReleaseEffectsResult = await page.evaluate(async (reuseDraws) => {
                const BABYLON = window.BABYLON;
                const engine = window.engine as WebGPUEngine;

                const gpuErrors: string[] = [];
                engine._device.addEventListener("uncapturederror", (event) => gpuErrors.push((event as GPUUncapturedErrorEvent).error.message));

                const scene = new BABYLON.Scene(engine);
                scene.clearColor = new BABYLON.Color4(0, 0, 1, 1);
                new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -5), scene);

                // "tint" is not part of the Scene/Mesh uniform buffers, so it lives in the left-over uniform buffer of the effect
                BABYLON.ShaderStore.ShadersStoreWGSL["releaseEffectsTintVertexShader"] = `
                    attribute position: vec3f;
                    uniform worldViewProjection: mat4x4f;
                    @vertex
                    fn main(input: VertexInputs) -> FragmentInputs {
                        vertexOutputs.position = uniforms.worldViewProjection * vec4f(vertexInputs.position, 1.0);
                    }`;
                BABYLON.ShaderStore.ShadersStoreWGSL["releaseEffectsTintFragmentShader"] = `
                    uniform tint: vec4f;
                    @fragment
                    fn main(input: FragmentInputs) -> FragmentOutputs {
                        fragmentOutputs.color = uniforms.tint;
                    }`;
                const box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
                const material = new BABYLON.ShaderMaterial(
                    "tint",
                    scene,
                    { vertex: "releaseEffectsTint", fragment: "releaseEffectsTint" },
                    { attributes: ["position"], uniforms: ["worldViewProjection", "tint"], shaderLanguage: BABYLON.ShaderLanguage.WGSL }
                );
                material.setColor4("tint", new BABYLON.Color4(0, 1, 0, 1));
                box.material = material;

                let waiters: { frames: number; resolve: () => void }[] = [];
                engine.runRenderLoop(() => {
                    scene.render();
                    waiters = waiters.filter((waiter) => --waiter.frames > 0 || (waiter.resolve(), false));
                });
                const renderFramesAsync = async (frames: number) => await new Promise<void>((resolve) => waiters.push({ frames, resolve }));
                // reads the center pixel of the next rendered frame, once the scene has been rendered into the swap chain texture
                const readCenterAsync = async () =>
                    await new Promise<number[]>((resolve, reject) => {
                        scene.onAfterRenderObservable.addOnce(() => {
                            engine.readPixels(engine.getRenderWidth() >> 1, engine.getRenderHeight() >> 1, 1, 1).then((data) => resolve(Array.from(data as Uint8Array)), reject);
                        });
                    });

                await scene.whenReadyAsync();
                await renderFramesAsync(5);

                // record the bundles, then play them back
                engine.snapshotRenderingReuseDraws = reuseDraws;
                engine.snapshotRenderingMode = BABYLON.Constants.SNAPSHOTRENDERING_STANDARD;
                engine.snapshotRendering = true;
                await renderFramesAsync(5);
                const before = await readCenterAsync();

                engine.releaseEffects();
                await renderFramesAsync(30);
                const after = await readCenterAsync();

                engine.stopRenderLoop();
                await engine._device.queue.onSubmittedWorkDone();

                return { before, after, gpuErrors };
            }, reuseDraws);

            expectSameColor(result.before, [0, 255, 0, 255]);
            expectSameColor(result.after, [0, 255, 0, 255]);
            expect(result.gpuErrors).toEqual([]);
        } finally {
            await page.evaluate(evaluateDisposeEngine);
        }
    });
}
