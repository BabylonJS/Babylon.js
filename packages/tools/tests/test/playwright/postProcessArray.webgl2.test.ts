import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { type Effect } from "core/Materials/effect";

for (const useCameraPostProcesses of [false, true]) {
    test(`post-processes preserve both array slices (${useCameraPostProcesses ? "camera" : "RTT"} chain)`, async ({ page }) => {
        await page.goto(`${getGlobalConfig().baseUrl}/empty.html`, { waitUntil: "commit" });
        await page.waitForFunction(() => window.BABYLON?.Engine !== undefined);
        const pixels = await page.evaluate(async (useCameraPostProcesses) => {
            const B = window.BABYLON;
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl2")!;
            const engine = new B.Engine(gl, false);
            try {
                const scene = new B.Scene(engine);
                const camera = new B.FreeCamera("camera", B.Vector3.Zero(), scene);
                const target = new B.RenderTargetTexture("array", { width: 8, height: 8, layers: 2 }, scene, false);
                target.renderList = [];
                const colors = [new B.Color4(1, 0, 0, 1), new B.Color4(0, 1, 0, 1)];
                target.onBeforeRenderObservable.add((slice) => {
                    target.clearColor = colors[slice];
                });
                const pass = new B.PassPostProcess("copy", 1, useCameraPostProcesses ? camera : null, undefined, engine);
                if (!useCameraPostProcesses) {
                    target.addPostProcess(pass);
                }
                const effect = pass.getEffect() ?? (await new Promise<Effect>((resolve) => pass.onEffectCreatedObservable.addOnce(resolve)));
                await effect.whenCompiledAsync();
                target.render(useCameraPostProcesses);

                // Read the actual attachments independently of the engine's framebuffer binding cache.
                const fb = gl.createFramebuffer();
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fb);
                try {
                    return colors.map((_, slice) => {
                        gl.framebufferTextureLayer(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target.getInternalTexture()!._hardwareTexture!.underlyingResource, 0, slice);
                        if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                            throw new Error(`Incomplete read framebuffer for slice ${slice}`);
                        }
                        const rgba = new Uint8Array(4);
                        gl.readPixels(4, 4, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
                        return Array.from(rgba);
                    });
                } finally {
                    gl.deleteFramebuffer(fb);
                }
            } finally {
                engine.dispose();
            }
        }, useCameraPostProcesses);
        expect(pixels).toEqual([
            [255, 0, 0, 255],
            [0, 255, 0, 255],
        ]);
    });
}
