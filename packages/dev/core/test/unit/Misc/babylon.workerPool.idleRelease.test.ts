import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutoReleaseWorkerPool, type AutoReleaseWorkerPoolOptions } from "core/Misc/workerPool";

/**
 * When an AutoReleaseWorkerPool terminates an idle worker: after idleTimeElapsedBeforeRelease, and never for a time setTimeout cannot
 * hold (more than 2^31 - 1 ms, Infinity included), which setTimeout would run at once
 */
describe("AutoReleaseWorkerPool idle release", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // a pool of one worker that runs an action completing at once, so that the worker is then idle
    const runOnce = async (options?: AutoReleaseWorkerPoolOptions) => {
        const worker = { terminate: vi.fn() } as unknown as Worker;
        const create = vi.fn(async () => worker);
        const pool = options ? new AutoReleaseWorkerPool(1, create, options) : new AutoReleaseWorkerPool(1, create);
        const run = async () =>
            await new Promise<void>((resolve) =>
                pool.push((_worker, onComplete) => {
                    onComplete();
                    resolve();
                })
            );
        await run();
        return { pool, worker, create, run };
    };

    it("terminates an idle worker after the default idle time (1000 ms)", async () => {
        const { worker } = await runOnce();
        await vi.advanceTimersByTimeAsync(999);
        expect(worker.terminate).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it("keeps an idle worker for a longer idle time, and a burst within it reuses the worker", async () => {
        const { worker, create, run } = await runOnce({ idleTimeElapsedBeforeRelease: 30000 });
        await vi.advanceTimersByTimeAsync(20000);
        await run();
        expect(create).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(29999);
        expect(worker.terminate).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it("still terminates an idle worker at the longest delay setTimeout holds (2^31 - 1 ms)", async () => {
        const { worker } = await runOnce({ idleTimeElapsedBeforeRelease: 0x7fffffff });
        await vi.advanceTimersByTimeAsync(0x7fffffff - 1);
        expect(worker.terminate).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });

    it.each([Infinity, 0x80000000])("keeps an idle worker until the pool is disposed for a time setTimeout cannot hold (%s ms)", async (idleTimeElapsedBeforeRelease) => {
        const { pool, worker, create, run } = await runOnce({ idleTimeElapsedBeforeRelease });
        await vi.advanceTimersByTimeAsync(10_000_000);
        expect(worker.terminate).not.toHaveBeenCalled();
        await run();
        expect(create).toHaveBeenCalledTimes(1);
        pool.dispose();
        await vi.advanceTimersByTimeAsync(0);
        expect(worker.terminate).toHaveBeenCalledTimes(1);
    });
});
