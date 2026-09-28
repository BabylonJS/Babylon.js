import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

test("WebGL1 clears geometry-buffer MRT attachments without WebGL2 clear APIs", async ({ page }) => {
    const globalConfig = getGlobalConfig();

    await page.goto(globalConfig.baseUrl + "/empty.html", { timeout: 0 });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
    await page.waitForFunction(() => window.BABYLON);
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgl1",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl: globalConfig.baseUrl,
    });

    const result = await page.evaluate(async () => {
        const engine = window.engine!;
        const scene = new window.BABYLON.Scene(engine);
        const camera = new window.BABYLON.FreeCamera("camera", new window.BABYLON.Vector3(0, 2, -8), scene);
        const box = window.BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
        const material = new window.BABYLON.StandardMaterial("material", scene);

        camera.setTarget(window.BABYLON.Vector3.Zero());
        box.position.y = 1;
        material.diffuseColor = new window.BABYLON.Color3(1, 0, 0);
        box.material = material;

        const geometryBufferRenderer = scene.enableGeometryBufferRenderer();

        if (!geometryBufferRenderer) {
            throw new Error("GeometryBufferRenderer is unavailable.");
        }

        let shaderReady = false;
        for (let frame = 0; frame < 20 && !shaderReady; frame++) {
            scene.render();
            shaderReady = geometryBufferRenderer.isReady(box.subMeshes[0], false);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        scene.render();

        const normalTextureIndex = geometryBufferRenderer.getTextureIndex(window.BABYLON.GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
        const normalTexture = geometryBufferRenderer.getGBuffer().textures[normalTextureIndex];
        if (!normalTexture) {
            throw new Error("GeometryBufferRenderer normal texture is unavailable.");
        }
        const layer = new window.BABYLON.Layer("normalOutput", null, scene, false);
        layer.texture = normalTexture;
        layer.texture.gammaSpace = false;
        layer.alphaBlendingMode = window.BABYLON.Constants.ALPHA_DISABLE;
        scene.render();

        const pixels = (await engine.readPixels(0, 0, engine.getRenderWidth(), engine.getRenderHeight())) as Uint8Array;
        const glError = (engine as any)._gl.getError();
        const webGLVersion = engine.webGLVersion;
        let containsRenderedNormal = false;
        for (let index = 4; index < pixels.length; index += 4) {
            if (pixels[index] !== pixels[0] || pixels[index + 1] !== pixels[1] || pixels[index + 2] !== pixels[2]) {
                containsRenderedNormal = true;
                break;
            }
        }

        scene.dispose();
        engine.dispose();
        window.engine = null;

        return { containsRenderedNormal, glError, shaderReady, webGLVersion };
    });

    expect(result.webGLVersion).toBe(1);
    expect(result.shaderReady).toBe(true);
    expect(result.glError).toBe(0);
    expect(result.containsRenderedNormal).toBe(true);
});
