import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Scene.executeWhenReady and whenReadyAsync poll isReady(). They retry every 16 ms at first, so a scene whose materials and effects become
 * ready a moment after they were created is reported ready within a frame, and every 100 ms once the wait has lasted a second.
 */
describe("Scene readiness polling", () => {
    let engine: NullEngine;
    let scene: Scene;
    let checks: number;

    // becomes ready after the given time, like effects whose shaders are still compiling when they are first checked
    const readyAfter = (ms: number) => {
        const readyTime = performance.now() + ms;
        scene.addIsReadyCheck({
            isReady: () => {
                checks++;
                return performance.now() >= readyTime;
            },
        });
    };

    beforeEach(() => {
        vi.useFakeTimers();
        engine = new NullEngine();
        scene = new Scene(engine);
        checks = 0;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.useRealTimers();
    });

    it("resolves whenReadyAsync within a frame of the scene becoming ready", async () => {
        readyAfter(150);

        let resolved = false;
        void scene.whenReadyAsync().then(() => (resolved = true));

        await vi.advanceTimersByTimeAsync(149);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(17);
        expect(resolved).toBe(true);
    });

    it("runs the callbacks of every executeWhenReady call once, without extra checks", () => {
        readyAfter(40);
        const first = vi.fn();
        const second = vi.fn();

        scene.executeWhenReady(first);
        scene.executeWhenReady(second);
        vi.advanceTimersByTime(60);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(checks).toBeLessThanOrEqual(4);
    });

    it("does not check a scene that stays busy more than once per frame, then more than once per 100 ms", () => {
        readyAfter(Infinity);
        scene.executeWhenReady(() => {});

        vi.advanceTimersByTime(1000);
        expect(checks).toBeLessThanOrEqual(64);

        const checksAfterFirstSecond = checks;
        vi.advanceTimersByTime(1000);
        expect(checks - checksAfterFirstSecond).toBeLessThanOrEqual(10);
    });

    it("keeps checking a scene that becomes ready late, within 100 ms of it becoming ready", async () => {
        readyAfter(3050);

        let resolved = false;
        void scene.whenReadyAsync().then(() => (resolved = true));

        await vi.advanceTimersByTimeAsync(3049);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(100);
        expect(resolved).toBe(true);
    });

    it("still notifies onReadyTimeoutObservable when the scene does not get ready in time", () => {
        readyAfter(Infinity);
        scene.onReadyTimeoutDuration = 500;
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);
        const onReady = vi.fn();

        scene.executeWhenReady(onReady);
        vi.advanceTimersByTime(1000);

        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(onReady).not.toHaveBeenCalled();
    });

    it("stops checking once the scene is disposed", () => {
        readyAfter(Infinity);
        scene.executeWhenReady(() => {});

        vi.advanceTimersByTime(50);
        scene.dispose();
        const checksAtDispose = checks;
        vi.advanceTimersByTime(1000);

        expect(checks).toBeLessThanOrEqual(checksAtDispose + 1);
    });
});
