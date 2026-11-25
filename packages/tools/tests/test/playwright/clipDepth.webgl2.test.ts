import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { type Color3 } from "core/Maths/math.color";

test("preserves distant reversed-Z depth ordering after WebGL2 context restoration", async ({ page }) => {
    await page.goto(`${getGlobalConfig().baseUrl}/empty.html`, { waitUntil: "commit" });
    await page.waitForFunction(() => window.BABYLON?.Engine !== undefined);

    const result = await page.evaluate(async () => {
        const BABYLON = window.BABYLON;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2");
        const contextLoss = gl?.getExtension("WEBGL_lose_context");
        if (gl === null || gl.getExtension("EXT_clip_control") === null || contextLoss == null) {
            return { skipped: "Requires WebGL2 with EXT_clip_control and WEBGL_lose_context." };
        }

        const engine = new BABYLON.Engine(canvas, false, { useNDCHalfZRange: true });
        try {
            engine.useReverseDepthBuffer = true;
            const scene = new BABYLON.Scene(engine);
            const camera = new BABYLON.FreeCamera("camera", BABYLON.Vector3.Zero(), scene);
            camera.minZ = 1;
            camera.maxZ = 0;

            const size = 16;
            const target = new BABYLON.RenderTargetTexture("target", size, scene, { generateDepthBuffer: false });
            const depthFormat = BABYLON.Constants.TEXTUREFORMAT_DEPTH32_FLOAT;
            target.createDepthStencilTexture(0, false, false, 1, depthFormat);

            const nearDistance = 100_000_000;
            const createPlane = (name: string, distance: number, color: Color3) => {
                const plane = BABYLON.MeshBuilder.CreatePlane(name, { size: nearDistance }, scene);
                plane.position.z = distance;
                const material = new BABYLON.StandardMaterial(name, scene);
                material.disableLighting = true;
                material.emissiveColor = color;
                material.backFaceCulling = false;
                plane.material = material;
                return plane;
            };
            const nearPlane = createPlane("near", nearDistance, BABYLON.Color3.Green());
            const farPlane = createPlane("far", nearDistance + 64, BABYLON.Color3.Red());

            // Draw the far plane last so equal depths would let it overwrite the near plane.
            target.setRenderingOrder(0, (a, b) => a.getMesh().position.z - b.getMesh().position.z);

            const renderCenterPixel = async () => {
                target.render();
                const pixel = new Uint8Array(4);
                await target.readPixels(0, 0, pixel, true, false, size / 2, size / 2, 1, 1);
                return Array.from(pixel);
            };

            const renderDepthOrdering = async () => {
                await scene.whenReadyAsync();
                target.renderList = [farPlane];
                const farOnly = await renderCenterPixel();
                target.renderList = [nearPlane, farPlane];
                return {
                    farOnly,
                    overlap: await renderCenterPixel(),
                    floatDepthAttached: target.depthStencilTexture?.format === depthFormat,
                };
            };

            const beforeRestoration = await renderDepthOrdering();
            const lost = new Promise<void>((resolve) => engine.onContextLostObservable.addOnce(() => resolve()));
            const restored = new Promise<void>((resolve) => engine.onContextRestoredObservable.addOnce(() => resolve()));
            contextLoss.loseContext();
            await lost;
            // The browser must finish dispatching webglcontextlost before restoration is allowed.
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            contextLoss.restoreContext();
            await restored;

            return {
                beforeRestoration,
                afterRestoration: await renderDepthOrdering(),
            };
        } finally {
            engine.dispose();
        }
    });

    test.skip(result.skipped !== undefined, result.skipped);
    const expected = {
        farOnly: [255, 0, 0, 255],
        overlap: [0, 255, 0, 255],
        floatDepthAttached: true,
    };
    expect(result.beforeRestoration, "depth ordering before context loss").toEqual(expected);
    expect(result.afterRestoration, "depth ordering after context restoration").toEqual(expected);
});
