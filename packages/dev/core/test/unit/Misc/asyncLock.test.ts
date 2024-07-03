import { AsyncLock } from "core/Misc/asyncLock";
import { Deferred } from "core/Misc/deferred";
import { Nullable } from "core/types";

async function whenJSFrames(count: number): Promise<void> {
    for (let i = 0; i < count - 1; i++) {
        await undefined;
    }
}

describe("AsyncLock", () => {
    it("no contention - synchronous", async () => {
        const asyncLock = new AsyncLock();

        const result = await asyncLock.lockAsync(() => {
            return 42;
        });

        expect(result).toBe(42);
    });

    it("no contention - asynchronous", async () => {
        const asyncLock = new AsyncLock();

        const result = await asyncLock.lockAsync(async () => {
            await Promise.resolve();
            return 42;
        });

        expect(result).toBe(42);
    });

    it("basic func throws error", async () => {
        const asyncLock = new AsyncLock();

        const expectedError = new Error("Test error");
        let actualError: Nullable<unknown> = null;
        try {
            await asyncLock.lockAsync(() => {
                throw expectedError;
            });
        } catch (e: unknown) {
            actualError = e;
        }

        expect(actualError).toBe(expectedError);
    });

    it("basic sequencing", async () => {
        const asyncLock = new AsyncLock();
        const operation1Started = new Deferred<void>();
        const operation1Completed = new Deferred<void>();
        let operation1LockAcquired = false;
        let operation2LockAcquired = false;

        asyncLock.lockAsync(() => {
            operation1LockAcquired = true;
            operation1Started.resolve();
            return operation1Completed.promise;
        });

        asyncLock.lockAsync(() => {
            operation2LockAcquired = true;
        });

        expect(operation1LockAcquired).toBe(false);
        expect(operation2LockAcquired).toBe(false);

        await whenJSFrames(5);

        expect(operation2LockAcquired).toBe(false);
        expect(operation1LockAcquired).toBe(true);

        await whenJSFrames(5);

        expect(operation2LockAcquired).toBe(false);

        operation1Completed.resolve();
        await operation1Completed.promise;

        await whenJSFrames(5);

        expect(operation2LockAcquired).toBe(true);
    });

    it("basic cancellation", async () => {
        const asyncLock = new AsyncLock();
        let operation1LockAcquired = false;
        const abortController = new AbortController();

        const promise = asyncLock.lockAsync(() => {
            operation1LockAcquired = true;
        }, abortController.signal);

        const expectedAbortReason = "Aborting operation before it starts.";
        abortController.abort(expectedAbortReason);

        let actualAbortReason: Nullable<string> = null;
        try {
            await promise;
        } catch (e: unknown) {
            actualAbortReason = String(e);
        }

        expect(operation1LockAcquired).toBe(false);
        expect(actualAbortReason).toBe(expectedAbortReason);
    });

    it("lock acquired after cancellation", async () => {
        const asyncLock = new AsyncLock();
        const abortController = new AbortController();

        const operation1Promise = asyncLock.lockAsync(() => 42, abortController.signal);
        const operation2Promise = asyncLock.lockAsync(() => 43);

        const expectedAbortReason = "Aborting operation before it starts.";
        abortController.abort(expectedAbortReason);

        let actualAbortReason: Nullable<string> = null;
        try {
            await operation1Promise;
        } catch (e: unknown) {
            actualAbortReason = String(e);
        }

        expect(actualAbortReason).toBe(expectedAbortReason);

        expect(await operation2Promise).toBe(43);
    });

    it("basic lock many", async () => {
        const asyncLock1 = new AsyncLock();
        const asyncLock2 = new AsyncLock();

        const operation1Completed = new Deferred<void>();
        const operation2Completed = new Deferred<void>();
        let lockAcquired = false;

        asyncLock1.lockAsync(() => {
            return operation1Completed.promise;
        });

        asyncLock2.lockAsync(() => {
            return operation2Completed.promise;
        });

        const promise = AsyncLock.LockAsync(() => {
            lockAcquired = true;
            return 42;
        }, [asyncLock1, asyncLock2]);

        await whenJSFrames(5);
        expect(lockAcquired).toBe(false);
        operation1Completed.resolve();
        await whenJSFrames(5);
        expect(lockAcquired).toBe(false);
        operation2Completed.resolve();
        await whenJSFrames(5);
        expect(lockAcquired).toBe(true);

        expect(await promise).toBe(42);
    });

    it("lock many func throws error", async () => {
        const asyncLock1 = new AsyncLock();
        const asyncLock2 = new AsyncLock();

        asyncLock1.lockAsync(() => {});
        asyncLock2.lockAsync(() => {});

        const expectedError = new Error("Test error");
        let actualError: Nullable<unknown> = null;
        try {
            await AsyncLock.LockAsync(() => {
                throw expectedError;
            }, [asyncLock1, asyncLock2]);
        } catch (e: unknown) {
            actualError = e;
        }

        expect(actualError).toBe(expectedError);
    });

    it("lock many basic cancellation", async () => {
        const asyncLock1 = new AsyncLock();
        const asyncLock2 = new AsyncLock();
        const abortController = new AbortController();

        asyncLock1.lockAsync(() => {});
        asyncLock2.lockAsync(() => {});

        let lockAcquired = false;
        const promise = AsyncLock.LockAsync(
            () => {
                lockAcquired = true;
            },
            [asyncLock1, asyncLock2],
            abortController.signal
        );

        const expectedAbortReason = "Aborting operation before it starts.";
        abortController.abort(expectedAbortReason);

        expect(lockAcquired).toBe(false);
        let actualAbortReason: Nullable<string> = null;
        try {
            await promise;
        } catch (e: unknown) {
            actualAbortReason = String(e);
        }

        expect(lockAcquired).toBe(false);
        expect(actualAbortReason).toBe(expectedAbortReason);
    });

    it("lock many acquired after cancellation", async () => {
        const asyncLock1 = new AsyncLock();
        const asyncLock2 = new AsyncLock();
        const abortController = new AbortController();

        asyncLock1.lockAsync(() => {}, abortController.signal);
        asyncLock2.lockAsync(() => {}, abortController.signal);

        let lockAcquired = false;
        AsyncLock.LockAsync(() => {
            lockAcquired = true;
        }, [asyncLock1, asyncLock2]);

        expect(lockAcquired).toBe(false);
        abortController.abort();
        await whenJSFrames(5);
        expect(lockAcquired).toBe(true);
    });
});
