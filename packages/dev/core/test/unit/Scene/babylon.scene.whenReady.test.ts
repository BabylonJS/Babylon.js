import { NullEngine } from "core/Engines/nullEngine";
import { PrecisionDate } from "core/Misc/precisionDate";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Scene.executeWhenReady and whenReadyAsync poll isReady(). The tests check what an app can observe: how late the ready
 * notification is, how the number of checks evolves while the scene stays busy, and that the timeout and disposal are honoured.
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
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("resolves whenReadyAsync shortly after the scene becomes ready", async () => {
        readyAfter(150);

        let resolved = false;
        void scene.whenReadyAsync().then(() => (resolved = true));

        await vi.advanceTimersByTimeAsync(149);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(31);
        expect(resolved).toBe(true);
    });

    it("runs the callbacks of every executeWhenReady call once and stops checking", () => {
        readyAfter(40);
        const first = vi.fn();
        const second = vi.fn();

        scene.executeWhenReady(first);
        scene.executeWhenReady(second);
        vi.advanceTimersByTime(200);
        const checksWhenReady = checks;
        vi.advanceTimersByTime(1000);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(checks).toBe(checksWhenReady);
    });

    it("checks a scene that stays busy less and less often as the wait gets longer", () => {
        readyAfter(Infinity);
        scene.onReadyTimeoutDuration = 0;
        scene.executeWhenReady(() => {});

        vi.advanceTimersByTime(1000);
        const checksInFirstSecond = checks;
        vi.advanceTimersByTime(1000);
        const checksInSecondSecond = checks - checksInFirstSecond;
        vi.advanceTimersByTime(1000);
        const checksInThirdSecond = checks - checksInFirstSecond - checksInSecondSecond;

        expect(checksInSecondSecond).toBeLessThan(checksInFirstSecond);
        expect(checksInThirdSecond).toBeLessThanOrEqual(checksInSecondSecond);
    });

    it("keeps checking a scene that becomes ready late", async () => {
        readyAfter(3050);

        let resolved = false;
        void scene.whenReadyAsync().then(() => (resolved = true));

        await vi.advanceTimersByTimeAsync(3049);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(150);
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

    it("reports a scene that becomes ready just before the deadline as ready, not as timed out", () => {
        scene.onReadyTimeoutDuration = 105;
        readyAfter(104);
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);
        const onReady = vi.fn();

        scene.executeWhenReady(onReady);
        vi.advanceTimersByTime(105);

        expect(onReady).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(300);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it("checks readiness before the timeout when the timer is delivered after the deadline", () => {
        // a timer that fires late, like a busy main thread: the clock jumps past the deadline before the retry runs
        let now = 1000;
        vi.spyOn(PrecisionDate, "Now", "get").mockImplementation(() => now);
        scene.onReadyTimeoutDuration = 105;
        let ready = false;
        scene.addIsReadyCheck({ isReady: () => ready });
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);
        const onReady = vi.fn();

        scene.executeWhenReady(onReady);
        ready = true;
        now = 1112;
        vi.runOnlyPendingTimers();

        expect(onReady).toHaveBeenCalledTimes(1);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it("runs no check and no callback after the scene is disposed", () => {
        scene.onReadyTimeoutDuration = 105;
        readyAfter(Infinity);
        const onReady = vi.fn();
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);

        scene.executeWhenReady(onReady);
        vi.advanceTimersByTime(98);
        scene.dispose();
        const checksAtDispose = checks;
        const timersAtDispose = vi.getTimerCount();
        vi.advanceTimersByTime(1000);

        expect(timersAtDispose).toBe(0);
        expect(checks).toBe(checksAtDispose);
        expect(onReady).not.toHaveBeenCalled();
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it("reports a wait that started before a long load shortly after the load has finished", async () => {
        // the loading screen of AppendSceneAsync starts waiting before the data is requested
        const loading = {};
        scene.addPendingData(loading);
        scene.executeWhenReady(() => {});
        await vi.advanceTimersByTimeAsync(2000);

        // the app waits for the scene once its own load is done, and shaders need a few more milliseconds
        scene.removePendingData(loading);
        readyAfter(40);
        let resolved = false;
        void scene.whenReadyAsync().then(() => (resolved = true));

        await vi.advanceTimersByTimeAsync(39);
        expect(resolved).toBe(false);

        await vi.advanceTimersByTimeAsync(31);
        expect(resolved).toBe(true);
    });

    it("does not extend the timeout when the load finishes", () => {
        scene.onReadyTimeoutDuration = 3000;
        readyAfter(Infinity);
        const loading = {};
        scene.addPendingData(loading);
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);

        scene.executeWhenReady(() => {});
        vi.advanceTimersByTime(2000);
        scene.removePendingData(loading);
        vi.advanceTimersByTime(1100);

        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it("keeps a single retry timer when data is loaded and removed from a ready callback", () => {
        let busy = false;
        scene.addIsReadyCheck({ isReady: () => !busy });
        readyAfter(30);

        scene.executeWhenReady(() => {
            // a new load starts and ends while the ready notification is being delivered, then the scene gets busy again
            const loading = {};
            scene.addPendingData(loading);
            scene.removePendingData(loading);
            busy = true;
        });
        vi.advanceTimersByTime(35);

        // the next wait must be the only one polling
        scene.executeWhenReady(() => {});
        expect(vi.getTimerCount()).toBe(1);
    });

    it("keeps a single retry timer when a readiness check removes the last pending data", () => {
        const loading = {};
        scene.addPendingData(loading);
        let armed = false;
        scene.addIsReadyCheck({
            isReady: () => {
                if (armed) {
                    armed = false;
                    scene.removePendingData(loading);
                }
                return false;
            },
        });

        scene.executeWhenReady(() => {});
        armed = true;
        vi.advanceTimersByTime(20);

        expect(armed).toBe(false);
        expect(vi.getTimerCount()).toBe(1);
    });
});
