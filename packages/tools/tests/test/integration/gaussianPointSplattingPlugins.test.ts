import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGPU point splatting preserves late source-material shader plugins", async ({ page }) => {
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
            throw new Error("Material plugin coverage requires WebGPU.");
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
        const source = mesh.material as import("core/Materials/GaussianSplatting/gaussianSplattingMaterial").GaussianSplattingMaterial;
        mesh.pointSplattingRenderScale = 1;
        mesh.pointSplattingRenderMode = true;
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
        for (let frame = 0; frame < 600 && ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128 || !controller["_blit"]?.isReady(controller["_blitMesh"]!)); frame++) {
            await render();
        }
        if ((mesh.pointSplattingProgress?.renderedFrameCount ?? 0) < 128) {
            throw new Error("Built-in point color did not become ready.");
        }
        const builtin = await sample();
        const builtinUsesPoint = controller.handlesCurrentPass;
        class GreenPlugin extends B.MaterialPluginBase {
            constructor() {
                super(source, "CustomGreen", 200);
                this._enable(true);
            }
            public override isCompatible(shaderLanguage: import("core/Materials/shaderLanguage").ShaderLanguage): boolean {
                return shaderLanguage === B.ShaderLanguage.WGSL;
            }
            public override getCustomCode(shaderType: string): { [pointName: string]: string } | null {
                return shaderType === "fragment" ? { CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: "finalColor = vec4f(0.0, 1.0, 0.0, finalColor.a);" } : null;
            }
        }
        new GreenPlugin();
        const lateUsesPoint = controller.handlesCurrentPass;
        await scene.whenReadyAsync();
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        const late = await sample();
        const unchangedSourceType = source.constructor === B.GaussianSplattingMaterial && source.alphaMode === B.Constants.ALPHA_COMBINE;
        mesh.pointSplattingRenderMode = false;
        const classic = await sample();
        mesh.pointSplattingRenderMode = true;
        const reenabled = await sample();
        const reenabledUsesPoint = controller.handlesCurrentPass;
        const depth = scene.enableDepthRenderer(camera, false, true);
        mesh.pointSplattingDepthRenderMode = true;
        for (let frame = 0; frame < 30; frame++) {
            await render();
        }
        engine.currentRenderPassId = depth.getDepthMap().renderPassId;
        const depthUsesPoint = controller.handlesCurrentPass;
        engine.currentRenderPassId = camera.renderPassId;
        mesh.material = new B.GaussianSplattingMaterial("plain", scene);
        const restored = await sample();
        const restoredUsesPoint = controller.handlesCurrentPass;
        await engine["_device"].queue.onSubmittedWorkDone();
        scene.dispose();
        engine.dispose();
        window.engine = null;
        return { builtin, builtinUsesPoint, late, lateUsesPoint, classic, reenabled, reenabledUsesPoint, unchangedSourceType, depthUsesPoint, restored, restoredUsesPoint };
    });
    expect(result.builtinUsesPoint).toBe(true);
    expect(result.builtin.red).toBeGreaterThan(20);
    expect(result.builtin.green).toBe(0);
    expect(result.unchangedSourceType).toBe(true);
    expect(result.lateUsesPoint).toBe(false);
    expect(result.late.green).toBeGreaterThan(20);
    expect(result.late.red).toBe(0);
    expect(result.late).toEqual(result.classic);
    expect(result.reenabled).toEqual(result.classic);
    expect(result.reenabledUsesPoint).toBe(false);
    expect(result.depthUsesPoint).toBe(true);
    expect(result.restoredUsesPoint).toBe(true);
    expect(result.restored.red).toBeGreaterThan(20);
    expect(result.restored.green).toBe(0);
});
