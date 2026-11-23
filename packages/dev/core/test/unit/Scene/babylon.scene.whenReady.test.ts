import { NullEngine } from "core/Engines/nullEngine";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
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
        // generous absolute bound: a backed-off interval of 32 ms would traverse a large scene about three times as often as intended
        expect(checksInThirdSecond).toBeLessThanOrEqual(15);
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

    it("treats a scene that is still unready at the deadline as timed out, even if it gets ready right after", () => {
        scene.onReadyTimeoutDuration = 105;
        readyAfter(106);
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);
        const onReady = vi.fn();

        scene.executeWhenReady(onReady);
        vi.advanceTimersByTime(300);

        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(onReady).not.toHaveBeenCalled();
    });

    it("does not keep pushing the next check back while short loads keep finishing", () => {
        const loading = {};
        scene.addPendingData(loading);
        let ready = false;
        scene.addIsReadyCheck({ isReady: () => ready });
        const onReady = vi.fn();
        scene.executeWhenReady(onReady);
        vi.advanceTimersByTime(2000);
        scene.removePendingData(loading);

        // the scene becomes ready while loads finish every 10 ms, which is more often than the 16 ms fast interval
        ready = true;
        for (let i = 0; i < 4; i++) {
            vi.advanceTimersByTime(10);
            const shortLoad = {};
            scene.addPendingData(shortLoad);
            scene.removePendingData(shortLoad);
        }

        expect(onReady).toHaveBeenCalledTimes(1);
    });

    it("serves a wait with the ordinary check without waiting for the render targets of a later strict wait", () => {
        // the default loading screen wait does not check render targets, a later strict wait joins the poll that is already running
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        // still busy at the first check, so that the default wait is pending when the strict one joins
        readyAfter(50);
        const defaultWait = vi.fn();
        const strictWait = vi.fn();
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);

        scene.executeWhenReady(defaultWait);
        scene.executeWhenReady(strictWait, true);
        vi.advanceTimersByTime(48);

        expect(defaultWait).not.toHaveBeenCalled();

        vi.advanceTimersByTime(20);

        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(strictWait).not.toHaveBeenCalled();

        // the render targets are still polled for the strict wait, and only then it is served
        vi.advanceTimersByTime(200);
        expect(strictWait).not.toHaveBeenCalled();
        renderTargetReady = true;
        vi.advanceTimersByTime(110);

        expect(strictWait).toHaveBeenCalledTimes(1);
        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(onTimeout).not.toHaveBeenCalled();
        scene.customRenderTargets.length = 0;
    });

    it("lets removeCallback on onReadyObservable cancel a strict wait", () => {
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        const strictWait = vi.fn();
        const observer = vi.fn();
        scene.onReadyObservable.addOnce(observer);

        scene.executeWhenReady(strictWait, true);
        expect(scene.onReadyObservable.removeCallback(strictWait)).toBe(true);
        vi.advanceTimersByTime(100);
        renderTargetReady = true;
        vi.advanceTimersByTime(200);

        expect(observer).toHaveBeenCalledTimes(1);
        expect(strictWait).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
        scene.customRenderTargets.length = 0;
    });

    it("notifies an observer added to onReadyObservable once, with the strict wait it shares the render targets check with", () => {
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        const permanent = vi.fn();
        const defaultWait = vi.fn();
        const strictWait = vi.fn();
        scene.onReadyObservable.add(permanent);

        scene.executeWhenReady(strictWait, true);
        scene.executeWhenReady(defaultWait);
        vi.advanceTimersByTime(100);
        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(permanent).not.toHaveBeenCalled();
        expect(strictWait).not.toHaveBeenCalled();

        renderTargetReady = true;
        vi.advanceTimersByTime(200);

        expect(permanent).toHaveBeenCalledTimes(1);
        expect(strictWait).toHaveBeenCalledTimes(1);
        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
        scene.customRenderTargets.length = 0;
    });

    it("calls the observers in the order they were added when no wait asked for the render targets", () => {
        const order: string[] = [];
        scene.onReadyObservable.add(() => order.push("direct"));
        scene.onReadyObservable.add(() => order.push("direct first"), -1, true);

        scene.executeWhenReady(() => order.push("wait"));

        expect(order).toEqual(["direct first", "direct", "wait"]);
    });

    it("calls a waiter once when its callback registers another wait on a scene that is ready", () => {
        let calls = 0;
        scene.executeWhenReady(() => {
            calls++;
            if (calls < 5) {
                scene.executeWhenReady(() => {});
            }
        });

        expect(calls).toBe(1);
    });

    it("does not call the waiters that follow a callback which disposes the scene", () => {
        const after = vi.fn();
        readyAfter(50);
        scene.executeWhenReady(() => scene.dispose());
        scene.executeWhenReady(after);
        vi.advanceTimersByTime(100);

        expect(after).not.toHaveBeenCalled();
    });

    it("calls an observer added to onReadyObservable with its scope and lets it skip the observers after it", () => {
        const owner = {
            calls: 0,
            onReady() {
                this.calls++;
            },
        };
        const skipped = vi.fn();
        scene.onReadyObservable.add(owner.onReady, -1, false, owner);
        scene.onReadyObservable.add((_, state) => (state.skipNextObservers = true));
        scene.onReadyObservable.add(skipped);
        scene.executeWhenReady(vi.fn());

        expect(owner.calls).toBe(1);
        expect(skipped).not.toHaveBeenCalled();
        // The observers are taken out of the list on the next tick, and no readiness check is left scheduled
        vi.advanceTimersByTime(200);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("still times out a strict wait on its render targets after the ordinary wait was served", () => {
        scene.onReadyTimeoutDuration = 500;
        readyAfter(50);
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        const defaultWait = vi.fn();
        const strictWait = vi.fn();
        const onTimeout = vi.fn();
        scene.onReadyTimeoutObservable.add(onTimeout);

        scene.executeWhenReady(defaultWait);
        scene.executeWhenReady(strictWait, true);
        vi.advanceTimersByTime(1000);

        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(strictWait).not.toHaveBeenCalled();
        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);

        // the strict wait that timed out is gone: a later wait does not run it
        renderTargetReady = true;
        scene.executeWhenReady(() => {});
        vi.advanceTimersByTime(100);

        expect(strictWait).not.toHaveBeenCalled();
        scene.customRenderTargets.length = 0;
    });

    it("keeps a strict wait that joins during an ordinary check pending until the render targets are checked", () => {
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        const defaultWait = vi.fn();
        const strictWait = vi.fn();
        // the scene gets ready at 30 ms, and a check joins a strict wait once while that check runs, after the check has skipped the render targets
        const readyTime = performance.now() + 30;
        let joined = false;
        scene.addIsReadyCheck({
            isReady: () => {
                if (performance.now() < readyTime) {
                    return false;
                }
                if (!joined) {
                    joined = true;
                    scene.executeWhenReady(strictWait, true);
                }
                return true;
            },
        });

        scene.executeWhenReady(defaultWait);
        vi.advanceTimersByTime(100);

        expect(joined).toBe(true);
        expect(defaultWait).toHaveBeenCalledTimes(1);
        expect(strictWait).not.toHaveBeenCalled();

        renderTargetReady = true;
        vi.advanceTimersByTime(20);

        expect(strictWait).toHaveBeenCalledTimes(1);
        scene.customRenderTargets.length = 0;
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

    it("wakes a backed-off wait up when a long load finishes right after one of its checks", async () => {
        // the loading screen of AppendSceneAsync starts waiting before the data is requested, and its last check before the load ends was at 2008 ms, the next one is due at 2108 ms
        const loading = {};
        scene.addPendingData(loading);
        scene.executeWhenReady(() => {});
        await vi.advanceTimersByTimeAsync(2030);

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
