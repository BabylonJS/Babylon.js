import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting reuses stable bindings and refreshes replaced resources", async ({ page }) => {
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
            throw new Error("Binding reuse coverage requires WebGPU.");
        }
        engine.setSize(128, 128);
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
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const render = async () => {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Point rendering did not become ready.");
        }
        const renderer = controller["_renderer"]!;
        const shaders = [
            renderer["_preprocessCs"],
            renderer["_scanBlocksCs"],
            renderer["_scanSumsCs"],
            renderer["_scanAddCs"],
            renderer["_partitionCs"],
            renderer["_splatCs"],
            renderer["_resolveCs"],
        ];
        let storageCalls = 0;
        let uniformCalls = 0;
        for (const shader of shaders) {
            const storage = shader.setStorageBuffer;
            shader.setStorageBuffer = (name, buffer) => {
                storageCalls++;
                storage.call(shader, name, buffer);
            };
            const uniforms = shader.setUniformBuffer;
            shader.setUniformBuffer = (name, buffer) => {
                uniformCalls++;
                uniforms.call(shader, name, buffer);
            };
        }
        const tracked = [
            { shader: renderer["_preprocessCs"], name: "uniforms", ubo: renderer["_uniforms"] },
            { shader: renderer["_splatCs"], name: "uniforms", ubo: renderer["_uniforms"] },
            { shader: renderer["_resolveCs"], name: "params", ubo: renderer["_resolveParams"] },
        ];
        const getGroup = (shader: import("core/Compute/computeShader").ComputeShader) =>
            (shader["_context"] as import("core/Engines/WebGPU/webgpuComputeContext").WebGPUComputeContext)["_bindGroups"][0];
        let stableNativeBindings = 0;
        let retainedGroups = 0;
        let nativeBindingsCurrent = true;
        for (let frame = 0; frame < 30; frame++) {
            const previous = tracked.map((item) => ({ native: item.ubo.getBuffer(), group: getGroup(item.shader) }));
            await render();
            tracked.forEach((item, index) => {
                nativeBindingsCurrent &&= item.shader["_bindings"][item.name].buffer === item.ubo.getBuffer();
                if (item.ubo.getBuffer() === previous[index].native) {
                    stableNativeBindings++;
                    if (getGroup(item.shader) === previous[index].group) {
                        retainedGroups++;
                    }
                }
            });
        }
        const stableStorageCalls = storageCalls;
        const stableUniformCalls = uniformCalls;
        const image = renderer["_imageBuffer"];
        const accumulation = renderer.accumBuffer;
        const preprocess = renderer["_preprocessCs"];
        engine.setSize(64, 64);
        new Uint8Array(data).set([0, 255, 0, 255], 24);
        const beforeReload = mesh.pointSplattingProgress!.renderedFrameCount;
        mesh.updateData(data, [new Uint8Array(16).fill(128)], { flipY: false }, undefined, 1);
        for (let frame = 0; frame < 600 && (mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < beforeReload + 32; frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < beforeReload + 32) {
            throw new Error("Reloaded SH rendering did not become ready.");
        }
        const replacedResources = image !== renderer["_imageBuffer"] && accumulation !== renderer.accumBuffer && preprocess !== renderer["_preprocessCs"];
        const bindings = renderer["_preprocessCs"]["_bindings"];
        const updatedBindings =
            bindings.parts.object === renderer["_parts"] &&
            bindings.hiZ.object === renderer["_hiZ"] &&
            bindings.sh.object === renderer["_sh"] &&
            bindings.uniforms.object === renderer["_uniforms"] &&
            renderer["_resolveCs"]["_bindings"].accumBuffer.object === renderer.accumBuffer;
        const firstParts = renderer["_parts"];
        engine.beginFrame();
        scene.render();
        mesh.position.x = 0.2;
        scene.render();
        engine.endFrame();
        const changedPartSlot = firstParts !== renderer["_parts"] && renderer["_preprocessCs"]["_bindings"].parts.object === renderer["_parts"];
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        engine.beginFrame();
        scene.render();
        engine.endFrame();
        const pixels = await engine.readPixels(0, 0, 64, 64);
        const redChannel = engine["_colorFormat"].startsWith("bgra") ? 2 : 0;
        let red = 0;
        let green = 0;
        for (let index = 0; index < pixels.byteLength; index += 4) {
            red = Math.max(red, pixels[index + redChannel]);
            green = Math.max(green, pixels[index + 1]);
        }
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return {
            stableStorageCalls,
            stableUniformCalls,
            stableNativeBindings,
            retainedGroups,
            nativeBindingsCurrent,
            replacedResources,
            updatedBindings,
            changedPartSlot,
            red,
            green,
        };
    });
    expect(result.stableStorageCalls).toBe(0);
    expect(result.stableUniformCalls).toBe(0);
    expect(result.stableNativeBindings).toBeGreaterThan(0);
    expect(result.retainedGroups).toBe(result.stableNativeBindings);
    expect(result.nativeBindingsCurrent).toBe(true);
    expect(result.replacedResources).toBe(true);
    expect(result.updatedBindings).toBe(true);
    expect(result.changedPartSlot).toBe(true);
    expect(result.green).toBeGreaterThan(20);
    expect(result.green).toBeGreaterThan(result.red * 2);
});
