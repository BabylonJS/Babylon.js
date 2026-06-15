import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InterpolatingBehavior } from "core/Behaviors/Cameras/interpolatingBehavior";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { type Nullable } from "core/types";
// Side-effect import: registers Animation.CreateAnimation / Animation.TransitionTo statics used by the behavior.
import "core/Animations/animation";
// Side-effect import: registers Scene.beginAnimation and related animatable extensions.
import "core/Animations/animatable";

function waitForCondition(condition: () => boolean, timeout: number = 5000, interval: number = 20): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkCondition = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error("Timeout waiting for condition"));
            } else {
                setTimeout(checkCondition, interval);
            }
        };
        checkCondition();
    });
}

describe("InterpolatingBehavior", () => {
    let engine: Nullable<NullEngine> = null;
    let scene: Nullable<Scene> = null;
    let camera: FreeCamera;
    let behavior: InterpolatingBehavior;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        camera = new FreeCamera("test", new Vector3(0, 0, 0), scene!);
        camera.fov = 0;
        behavior = new InterpolatingBehavior();
        behavior.attach(camera);
    });

    afterEach(() => {
        engine?.stopRenderLoop();
        behavior.detach();
        scene?.dispose();
        engine?.dispose();
    });

    describe("animatePropertiesAsync", () => {
        it("resolves immediately when nothing needs to animate", async () => {
            camera.fov = 5;
            let resolved = false;
            await behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 5]]), 1000).then(() => (resolved = true));
            expect(resolved).toBe(true);
            expect(behavior.isInterpolating).toBe(false);
        });

        it("converges to the target value and resolves when complete", async () => {
            let resolved = false;
            void behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 5]]), 200).then(() => (resolved = true));

            engine!.runRenderLoop(() => scene!.render());

            await waitForCondition(() => !behavior.isInterpolating);

            expect(camera.fov).toBeCloseTo(5, 1);
            expect(resolved).toBe(true);
        });
    });

    describe("remainingDurationMs", () => {
        it("reports the time left in the flight and shrinks as it progresses", () => {
            void behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 10]]), 1000);
            const animatable = behavior["_animatables"].get("fov");
            expect(animatable).toBeDefined();

            const fullRemaining = behavior.remainingDurationMs;
            expect(fullRemaining).toBeCloseTo(1000, -1);

            const endFrame = animatable!.getAnimations()[0].animation.getKeys().slice(-1)[0].frame;
            animatable!.goToFrame(endFrame / 2);

            expect(behavior.remainingDurationMs).toBeLessThan(fullRemaining);
            expect(behavior.remainingDurationMs).toBeGreaterThan(0);
        });

        it("is 0 when nothing is animating", () => {
            expect(behavior.remainingDurationMs).toBe(0);
        });
    });

    describe("restarting a flight mid-animation", () => {
        it("resolves the interrupted promise and eases from the camera's current value (no snap)", async () => {
            const flight = behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 10]]), 1000);

            const animatable = behavior["_animatables"].get("fov");
            expect(animatable).toBeDefined();
            const endFrame = animatable!.getAnimations()[0].animation.getKeys().slice(-1)[0].frame;

            // Jump partway through the flight so the camera is between start and goal.
            animatable!.goToFrame(endFrame / 2);
            const valueAtRestart = camera.fov;
            expect(valueAtRestart).toBeGreaterThan(0);
            expect(valueAtRestart).toBeLessThan(10);

            // Start a fresh flight to a new destination over the remaining time.
            void behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 20]]), behavior.remainingDurationMs);

            // The interrupted flight's promise resolves.
            await expect(flight).resolves.toBeUndefined();

            const newAnimatable = behavior["_animatables"].get("fov");
            expect(newAnimatable).toBeDefined();
            const newKeys = newAnimatable!.getAnimations()[0].animation.getKeys();

            // The new flight starts from the camera's CURRENT value => no positional snap.
            expect(newKeys[0].value).toBeCloseTo(valueAtRestart, 5);
            // ...and ends at the new destination.
            expect(newKeys[newKeys.length - 1].value).toBe(20);
            // The animated object is still the camera, never the destination value.
            expect(newAnimatable!.target).toBe(camera);
        });

        it("converges to the new destination after a mid-flight restart", async () => {
            void behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 10]]), 400);

            engine!.runRenderLoop(() => scene!.render());

            await waitForCondition(() => camera.fov > 1 && behavior.isInterpolating);
            void behavior.animatePropertiesAsync(new Map<keyof FreeCamera, number>([["fov", 5]]), 200);

            await waitForCondition(() => !behavior.isInterpolating);

            expect(camera.fov).toBeCloseTo(5, 1);
        });
    });
});
