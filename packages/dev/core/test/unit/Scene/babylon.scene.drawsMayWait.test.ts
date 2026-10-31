import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Vector3 } from "core/Maths/math.vector";
import { CreateScreenshotUsingRenderTarget } from "core/Misc/screenshotTools";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Asynchronous pipeline creation (WebGPU): a mesh draw may wait for its pipeline only in a pass the scene renders again in the next
 * frames. The scene sets AbstractEngine._drawsMayWait for its cameras, the render targets of its frame and the frame graph; a render
 * target rendered once, and any render outside the scene's frame, draw every mesh in that rendering.
 */
describe("Passes whose mesh draws may wait for their pipelines", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // a render target that records, at each of its renderings, whether its draws may wait
    const target = (refreshRate: number) => {
        const rtt = new RenderTargetTexture("rtt", 32, scene);
        rtt.refreshRate = refreshRate;
        const seen: boolean[] = [];
        rtt.onBeforeRenderObservable.add(() => seen.push(engine._drawsMayWait));
        return { rtt, seen };
    };

    it("lets the draws of the scene's cameras wait, during the frame only", () => {
        const seen: boolean[] = [];
        scene.onBeforeCameraRenderObservable.add(() => seen.push(engine._drawsMayWait));
        expect(engine._drawsMayWait).toBe(false);
        scene.render();
        expect(seen).toEqual([true]);
        expect(engine._drawsMayWait).toBe(false);
    });

    it("lets the draws of a render target of the frame wait, and never those of one rendered once", () => {
        const everyFrame = target(1);
        const once = target(RenderTargetTexture.REFRESHRATE_RENDER_ONCE);
        scene.customRenderTargets.push(everyFrame.rtt, once.rtt);
        scene.render();
        scene.render();
        expect(everyFrame.seen).toEqual([true, true]);
        expect(once.seen).toEqual([false]);
        expect(engine._drawsMayWait).toBe(false);
    });

    it("never lets the draws of a render target rendered outside the scene's frame wait, nor of one rendered once inside a camera's pass", () => {
        const manual = target(1);
        manual.rtt.render();
        expect(manual.seen).toEqual([false]);

        const once = target(RenderTargetTexture.REFRESHRATE_RENDER_ONCE);
        const cameraAfter: boolean[] = [];
        scene.onBeforeCameraRenderObservable.addOnce(() => {
            once.rtt.render();
            cameraAfter.push(engine._drawsMayWait);
        });
        scene.render();
        expect(once.seen).toEqual([false]);
        // the camera's own draws may wait again after it
        expect(cameraAfter).toEqual([true]);
    });

    it("never lets the draws of a screenshot through a render target wait, though it renders the scene's frame", async () => {
        const camera = scene.activeCamera!;
        const everyFrame = target(1);
        scene.customRenderTargets.push(everyFrame.rtt);
        // the camera's pass of the screenshot: the camera draws into the screenshot's render target
        const shot: boolean[] = [];
        scene.onBeforeCameraRenderObservable.add(() => {
            if (camera.outputRenderTarget) {
                shot.push(engine._drawsMayWait);
            }
        });
        CreateScreenshotUsingRenderTarget(engine, camera, 32, () => {});
        for (let i = 0; i < 50 && shot.length === 0; i++) {
            await new Promise((ok) => setTimeout(ok, 10));
        }
        expect(shot).toEqual([false]);
        // the scene's render target rendered in that frame did not let its draws wait either
        expect(everyFrame.seen).toEqual([false]);
        expect(engine._renderingOnce).toBe(0);
        expect(engine._drawsMayWait).toBe(false);
        // the next frame of the scene lets them wait again
        scene.render();
        expect(everyFrame.seen).toEqual([false, true]);
    });
});
