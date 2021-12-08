/**
 * Describes the test suite.
 */
 describe('Babylon.Coroutine', function () {
    this.timeout(10000);

    /**
     * Loads the dependencies.
     */
    before(function (done) {
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function () {
                // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    describe('#synchronous coroutines', () => {
        it('should be able to run a void returning coroutine synchronously', () => {
            let result = false;
            BABYLON.runCoroutineSync(function* () {
                yield;
                result = true;
            }());
            expect(result).to.equal(true);
        });

        it('should be able to run a value returning coroutine synchronously', () => {
            const result = BABYLON.runCoroutineSync(function* () {
                yield;
                return 42;
            }());
            expect(result).to.equal(42);
        });

        it('should be able to observe an exception thrown from a synchronous coroutine', () => {
            let threwError = false;
            try {
                BABYLON.runCoroutineSync(function* () {
                    yield;
                    throw new Error();
                }());
            } catch {
                threwError = true;
            }
            expect(threwError).to.equal(true);
        });

        it('should be able to cancel a synchronous coroutine', () => {
            let wasCancelled = false;
            try {
                const abortController = new AbortController();
                BABYLON.runCoroutineSync(function* () {
                    yield;
                    abortController.abort();
                    yield;
                }(), abortController.signal);
            } catch {
                wasCancelled = true;
            }
            expect(wasCancelled).to.equal(true);
        });

        it('should be able to make a synchronous function from a coroutine', () => {
            const syncFunction = BABYLON.makeSyncFunction(function* (value: number) {
                yield;
                return value;
            });
            const result = syncFunction(42);
            expect(result).to.equal(42);
        });
    });

    describe('#asynchronous coroutines', () => {
        it('should be able to run a void returning coroutine asynchronously', () => {
            let result = false;
            BABYLON.runCoroutineAsync(function* () {
                yield;
                result = true;
            }(), BABYLON.inlineScheduler).then(() => {
                expect(result).to.equal(true);
            });
        });

        it('should be able to run a value returning coroutine asynchronously', () => {
            BABYLON.runCoroutineAsync(function* () {
                yield;
                return 42;
            }(), BABYLON.inlineScheduler).then(result => {
                expect(result).to.equal(42);
            });
        });

        it('should be able to run a promise yielding void returning coroutine asynchronously', () => {
            let result = false;
            BABYLON.runCoroutineAsync(function* () {
                yield Promise.resolve();
                result = true;
            }(), BABYLON.inlineScheduler).then(() => {
                expect(result).to.equal(true);
            });
        });

        it('should be able to run a promise yielding value returning coroutine asynchronously', () => {
            BABYLON.runCoroutineAsync(function* () {
                yield Promise.resolve();
                return 42;
            }(), BABYLON.inlineScheduler).then(result => {
                expect(result).to.equal(42);
            });
        });

        it('should be able to observe an exception thrown from an asynchronous coroutine', async () => {
            let threwError = false;
            try {
                await BABYLON.runCoroutineAsync(function* () {
                    yield;
                    throw new Error();
                }(), BABYLON.inlineScheduler);
            } catch {
                threwError = true;
            }
            expect(threwError).to.equal(true);
        });

        it('should be able to cancel an asynchronous coroutine', async () => {
            let wasCancelled = false;
            try {
                const abortController = new AbortController();
                await BABYLON.runCoroutineAsync(function* () {
                    yield;
                    abortController.abort();
                    yield;
                }(), BABYLON.inlineScheduler, abortController.signal);
            } catch {
                wasCancelled = true;
            }
            expect(wasCancelled).to.equal(true);
        });

        it('should be able to make an asynchronous function from a coroutine', async () => {
            const asyncFunction = BABYLON.makeAsyncFunction(function* (value: number) {
                yield Promise.resolve();
                return value;
            }, BABYLON.inlineScheduler);
            const result = await asyncFunction(42);
            expect(result).to.equal(42);
        });
    });

    describe("#observable coroutines", () => {
        it("should be able to run multiple coroutines in parallel", () => {
            const observable = new BABYLON.Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count1 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count2 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.notifyObservers();

            expect(count1).to.equal(3);
            expect(count2).to.equal(2);
        });

        it("should be able to cancel all coroutines", () => {
            const observable = new BABYLON.Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count1 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count2 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            observable.notifyObservers();
            
            expect(count1).to.equal(2);
            expect(count2).to.equal(1);
        });

        it("should be able to cancel current coroutines then proceed with more", () => {
            const observable = new BABYLON.Observable<void>();
            let count1 = 0;
            let count2 = 0;
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count1 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            expect(count1).to.equal(1);
            observable.runCoroutineAsync(function* () {
                while (true) {
                    count2 += 1;
                    yield;
                }
            }());
            observable.notifyObservers();
            observable.notifyObservers();
            
            expect(count1).to.equal(1);
            expect(count2).to.equal(2);
        });
    });
 });
 