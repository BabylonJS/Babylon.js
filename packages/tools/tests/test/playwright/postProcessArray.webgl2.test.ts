import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { type Effect } from "core/Materials/effect";

test("Scene.render isolates camera pre-pass inputs and preserves the last drawable output", async ({ page }) => {
    await page.goto(`${getGlobalConfig().baseUrl}/empty.html`, { waitUntil: "commit" });
    await page.waitForFunction(() => window.BABYLON?.Engine !== undefined);
    const result = await page.evaluate(async () => {
        const B = window.BABYLON;
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 8;
        const engine = new B.Engine(canvas.getContext("webgl2")!, false);
        try {
            const scene = new B.Scene(engine);
            scene.clearColor = new B.Color4(0, 0, 0, 1);
            const cameras = ["left", "right"].map((name) => new B.FreeCamera(name, B.Vector3.Zero(), scene));
            const notifications: string[] = [];
            const passes = cameras.map((camera) => {
                const output = new B.RenderTargetTexture(camera.name, { width: 16, height: 8 }, scene, false);
                camera.outputRenderTarget = output;
                output.clearColor = new B.Color4(0, 1, 1, 1);
                output.onClearObservable.add(() => {
                    notifications.push(engine._currentRenderTarget === output.renderTarget ? camera.name : "wrong target");
                    engine.clear(new B.Color4(0, 0, 1, 1), true, true, true);
                });
                const pass = new B.PassPostProcess("copy", 1, camera);
                pass._prePassEffectConfiguration = { name: "camera normals", enabled: false, texturesRequired: [B.Constants.PREPASS_NORMAL_TEXTURE_TYPE] };
                return pass;
            });
            const prepass = scene.enablePrePassRenderer()!;
            let drawLeft = true;
            scene.onBeforeDrawPhaseObservable.add(() => {
                const left = scene.activeCamera === cameras[0];
                if (left && !drawLeft) {
                    return;
                }
                engine.scissorClear(left ? 0 : 8, 0, 8, 8, left ? new B.Color4(1, 0, 0, 1) : new B.Color4(0, 1, 0, 1));
            });
            for (const pass of passes) {
                const effect = pass.getEffect() ?? (await new Promise<Effect>((resolve) => pass.onEffectCreatedObservable.addOnce(resolve)));
                await effect.whenCompiledAsync();
            }
            const read = async () =>
                Promise.all(
                    cameras.map(async (camera) => {
                        const bytes = (await camera.outputRenderTarget!.readPixels()) as Uint8Array;
                        return [4, 12].map((x) => Array.from(bytes.subarray(4 * (16 * 4 + x), 4 * (16 * 4 + x) + 3)));
                    })
                );
            // Exercise the ordinary single camera first, then two cameras sharing the default MRT.
            scene.activeCamera = cameras[0];
            scene.render();
            if (!prepass?.enabled) {
                throw new Error("Expected both cameras to use the shared pre-pass");
            }
            const single = notifications.splice(0);
            scene.activeCameras = cameras;
            scene.render();
            const pair = notifications.splice(0);
            const before = await read();
            // Simulate an asynchronously compiling replacement on the second camera only.
            const effectWrapper = passes[1]["_effectWrapper"];
            const isReady = effectWrapper.isReady;
            effectWrapper.isReady = () => false;
            scene.render();
            const after = await read();
            effectWrapper.isReady = isReady;
            for (const camera of cameras) {
                camera.outputRenderTarget = null;
            }
            const drawCanvas = () => {
                scene.render();
                const gl = canvas.getContext("webgl2")!;
                return [4, 12].map((x) => {
                    const bytes = new Uint8Array(4);
                    gl.readPixels(x, 4, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
                    return Array.from(bytes.subarray(0, 3));
                });
            };
            const accumulated = drawCanvas();
            drawLeft = false;
            return { single, pair, pending: notifications, before, after, accumulated, nextFrame: drawCanvas() };
        } finally {
            engine.dispose();
        }
    });
    expect.soft(result.single).toEqual(["left"]);
    expect.soft(result.pair).toEqual(["left", "right"]);
    expect.soft(result.pending).toEqual(["left"]);
    expect.soft(result.before).toEqual([
        [
            [255, 0, 0],
            [0, 255, 255],
        ],
        [
            [0, 255, 255],
            [0, 255, 0],
        ],
    ]);
    expect(result.after).toEqual(result.before);
    expect.soft(result.accumulated).toEqual([
        [255, 0, 0],
        [0, 255, 0],
    ]);
    expect(result.nextFrame).toEqual([
        [0, 0, 0],
        [0, 255, 0],
    ]);
});

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
