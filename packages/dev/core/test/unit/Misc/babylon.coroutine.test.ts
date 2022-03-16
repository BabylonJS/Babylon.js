import { runCoroutineSync, makeSyncFunction, runCoroutineAsync, inlineScheduler, makeAsyncFunction, Observable } from "core/Misc";

/**
 * Describes the test suite.
 */
describe("Coroutine", function () {
    jest.setTimeout(10000);

    describe("#synchronous coroutines", () => {
        it("should be able to run a void returning coroutine synchronously", () => {
            let result = false;
            runCoroutineSync(
                (function* () {
                    yield;
                    result = true;
                })()
            );
            expect(result).toBe(true);
        });

        it("should be able to run a value returning coroutine synchronously", () => {
            const result = runCoroutineSync(
                (function* () {
                    yield;
                    return 42;
                })()
            );
            expect(result).toBe(42);
        });

        it("should be able to observe an exception thrown from a synchronous coroutine", () => {
            let threwError = false;
            try {
                runCoroutineSync(
                    (function* () {
                        yield;
                        throw new Error();
                    })()
                );
            } catch {
                threwError = true;
            }
            expect(threwError).toBe(true);
        });

        it("should be able to cancel a synchronous coroutine", () => {
            let wasCancelled = false;
            try {
                const abortController = new AbortController();
                runCoroutineSync(
                    (function* () {
                        yield;
                        abortController.abort();
                        yield;
                    })(),
                    abortController.signal
                );
            } catch {
                wasCancelled = true;
            }
            expect(wasCancelled).toBe(true);
        });

        it("should be able to make a synchronous function from a coroutine", () => {
            const syncFunction = makeSyncFunction(function* (value: number) {
                yield;
                return value;
            });
            const result = syncFunction(42);
            expect(result).toBe(42);
        });
    });

    describe("#asynchronous coroutines", () => {
        it("should be able to run a void returning coroutine asynchronously", async () => {
            let result = false;
            await runCoroutineAsync(
                (function* () {
                    yield;
                    result = true;
                })(),
                inlineScheduler
            );
            expect(result).toBe(true);
        });

        it("should be able to run a value returning coroutine asynchronously", async () => {
            const result = await runCoroutineAsync(
                (function* () {
                    yield;
                    return 42;
                })(),
                inlineScheduler
            );
            expect(result).toBe(42);
        });

        it("should be able to run a promise yielding void returning coroutine asynchronously", async () => {
            let result = false;
            await runCoroutineAsync(
                (function* () {
                    yield Promise.resolve();
                    result = true;
                })(),
                inlineScheduler
            );
            expect(result).toBe(true);
        });

        it("should be able to run a promise yielding value returning coroutine asynchronously", async () => {
            const result = await runCoroutineAsync(
                (function* () {
                    yield Promise.resolve();
                    return 42;
                })(),
                inlineScheduler
            );
            expect(result).toBe(42);
        });

        it("should be able to observe an exception thrown from an asynchronous coroutine", async () => {
            let threwError = false;
            try {
                await runCoroutineAsync(
                    (function* () {
                        yield;
                        throw new Error();
                    })(),
                    inlineScheduler
                );
            } catch {
                threwError = true;
            }
            expect(threwError).toBe(true);
        });

        it("should be able to cancel an asynchronous coroutine", async () => {
            let wasCancelled = false;
            try {
                const abortController = new AbortController();
                await runCoroutineAsync(
                    (function* () {
                        yield;
                        abortController.abort();
                        yield;
                    })(),
                    inlineScheduler,
                    abortController.signal
                );
            } catch {
                wasCancelled = true;
            }
            expect(wasCancelled).toBe(true);
        });

        it("should be able to make an asynchronous function from a coroutine", async () => {
            const asyncFunction = makeAsyncFunction(function* (value: number) {
                yield Promise.resolve();
                return value;
            }, inlineScheduler);
            const result = await asyncFunction(42);
            expect(result).toBe(42);
        });
    });

    describe("#observable coroutines", () => {
        it("should be able to run multiple coroutines in parallel", () => {
            const observable = new Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count1 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count2 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.notifyObservers();

            expect(count1).toEqual(3);
            expect(count2).toEqual(2);
        });

        it("should be able to cancel all coroutines", () => {
            const observable = new Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count1 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count2 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            observable.notifyObservers();

            expect(count1).toEqual(2);
            expect(count2).toEqual(1);
        });

        it("should be able to cancel current coroutines then proceed with more", () => {
            const observable = new Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count1 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            expect(count1).toEqual(1);
            observable.runCoroutineAsync(
                (function* () {
                    while (true) {
                        count2 += 1;
                        yield;
                    }
                })()
            );
            observable.notifyObservers();
            observable.notifyObservers();

            expect(count1).toEqual(1);
            expect(count2).toEqual(2);
        });
    });
});
