import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves Gaussian NodeMaterial graphs and dynamic material replacement", async ({ page }) => {
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
            throw new Error("Source material coverage requires WebGPU.");
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
        const source = mesh.material;
        const graph = new B.NodeMaterial("green graph", scene, { shaderLanguage: B.ShaderLanguage.WGSL });
        B.SetToDefaultGaussianSplatting(graph);
        await new Promise<void>((resolve, reject) => {
            const built = graph.onBuildObservable.addOnce(() => {
                graph.onBuildErrorObservable.remove(failed);
                resolve();
            });
            const failed = graph.onBuildErrorObservable.addOnce((error) => {
                graph.onBuildObservable.remove(built);
                reject(new Error(error));
            });
            graph.build();
        });
        const gaussian = graph.getBlockByName("Gaussian") as import("core/Materials/Node/Blocks/GaussianSplatting/gaussianBlock").GaussianBlock;
        gaussian.splatColor.connectedPoint!.disconnectFrom(gaussian.splatColor);
        const green = new B.InputBlock("green");
        green.value = new B.Color4(0, 1, 0, 1);
        green.output.connectTo(gaussian.splatColor);
        graph.alphaMode = B.Constants.ALPHA_COMBINE;
        graph.build();
        mesh.material = graph;
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
            // Swapchain readback retains the native RGBA/BGRA channel order.
            const redChannel = engine["_colorFormat"].startsWith("bgra") ? 2 : 0;
            let red = 0;
            let green = 0;
            for (let index = 0; index < pixels.byteLength; index += 4) {
                red = Math.max(red, pixels[index + redChannel]);
                green = Math.max(green, pixels[index + 1]);
            }
            return { red, green };
        };
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const classic = await sample();
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
        const controller = mesh["_pointController"] as import("core/Meshes/GaussianSplatting/gaussianPointSplattingController").GaussianPointSplattingController;
        const enabled = await sample();
        const graphUsesPoint = controller.handlesCurrentPass;
        mesh.material = source;
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Built-in point color did not become ready.");
        }
        const builtin = await sample();
        const builtinUsesPoint = controller.handlesCurrentPass;
        mesh.material = graph;
        const replaced = await sample();
        const replacedUsesPoint = controller.handlesCurrentPass;
        mesh.material = source;
        const restored = await sample();
        const restoredUsesPoint = controller.handlesCurrentPass;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { classic, enabled, builtin, replaced, restored, graphUsesPoint, builtinUsesPoint, replacedUsesPoint, restoredUsesPoint };
    });
    expect(result.classic.green).toBeGreaterThan(20);
    expect(result.classic.red).toBe(0);
    expect(result.enabled).toEqual(result.classic);
    expect(result.replaced).toEqual(result.classic);
    expect(result.builtin.red).toBeGreaterThan(20);
    expect(result.builtin.green).toBe(0);
    expect(result.restored.red).toBeGreaterThan(20);
    expect(result.restored.green).toBe(0);
    expect(result.graphUsesPoint).toBe(false);
    expect(result.builtinUsesPoint).toBe(true);
    expect(result.replacedUsesPoint).toBe(false);
    expect(result.restoredUsesPoint).toBe(true);
});
