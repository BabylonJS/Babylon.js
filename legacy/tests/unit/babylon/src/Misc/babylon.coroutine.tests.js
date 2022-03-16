var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/**
 * Describes the test suite.
 */
describe('Babylon.Coroutine', function () {
    var _this = this;
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
    describe('#synchronous coroutines', function () {
        it('should be able to run a void returning coroutine synchronously', function () {
            var result = false;
            BABYLON.runCoroutineSync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            result = true;
                            return [2 /*return*/];
                    }
                });
            }());
            expect(result).to.equal(true);
        });
        it('should be able to run a value returning coroutine synchronously', function () {
            var result = BABYLON.runCoroutineSync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, 42];
                    }
                });
            }());
            expect(result).to.equal(42);
        });
        it('should be able to observe an exception thrown from a synchronous coroutine', function () {
            var threwError = false;
            try {
                BABYLON.runCoroutineSync(function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/];
                            case 1:
                                _a.sent();
                                throw new Error();
                        }
                    });
                }());
            }
            catch (_a) {
                threwError = true;
            }
            expect(threwError).to.equal(true);
        });
        it('should be able to cancel a synchronous coroutine', function () {
            var wasCancelled = false;
            try {
                var abortController_1 = new AbortController();
                BABYLON.runCoroutineSync(function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/];
                            case 1:
                                _a.sent();
                                abortController_1.abort();
                                return [4 /*yield*/];
                            case 2:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }(), abortController_1.signal);
            }
            catch (_a) {
                wasCancelled = true;
            }
            expect(wasCancelled).to.equal(true);
        });
        it('should be able to make a synchronous function from a coroutine', function () {
            var syncFunction = BABYLON.makeSyncFunction(function (value) {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, value];
                    }
                });
            });
            var result = syncFunction(42);
            expect(result).to.equal(42);
        });
    });
    describe('#asynchronous coroutines', function () {
        it('should be able to run a void returning coroutine asynchronously', function () {
            var result = false;
            BABYLON.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            result = true;
                            return [2 /*return*/];
                    }
                });
            }(), BABYLON.inlineScheduler).then(function () {
                expect(result).to.equal(true);
            });
        });
        it('should be able to run a value returning coroutine asynchronously', function () {
            BABYLON.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, 42];
                    }
                });
            }(), BABYLON.inlineScheduler).then(function (result) {
                expect(result).to.equal(42);
            });
        });
        it('should be able to run a promise yielding void returning coroutine asynchronously', function () {
            var result = false;
            BABYLON.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.resolve()];
                        case 1:
                            _a.sent();
                            result = true;
                            return [2 /*return*/];
                    }
                });
            }(), BABYLON.inlineScheduler).then(function () {
                expect(result).to.equal(true);
            });
        });
        it('should be able to run a promise yielding value returning coroutine asynchronously', function () {
            BABYLON.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Promise.resolve()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, 42];
                    }
                });
            }(), BABYLON.inlineScheduler).then(function (result) {
                expect(result).to.equal(42);
            });
        });
        it('should be able to observe an exception thrown from an asynchronous coroutine', function () { return __awaiter(_this, void 0, void 0, function () {
            var threwError, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        threwError = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, BABYLON.runCoroutineAsync(function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/];
                                        case 1:
                                            _a.sent();
                                            throw new Error();
                                    }
                                });
                            }(), BABYLON.inlineScheduler)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        threwError = true;
                        return [3 /*break*/, 4];
                    case 4:
                        expect(threwError).to.equal(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should be able to cancel an asynchronous coroutine', function () { return __awaiter(_this, void 0, void 0, function () {
            var wasCancelled, abortController_2, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        wasCancelled = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        abortController_2 = new AbortController();
                        return [4 /*yield*/, BABYLON.runCoroutineAsync(function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/];
                                        case 1:
                                            _a.sent();
                                            abortController_2.abort();
                                            return [4 /*yield*/];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }(), BABYLON.inlineScheduler, abortController_2.signal)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        wasCancelled = true;
                        return [3 /*break*/, 4];
                    case 4:
                        expect(wasCancelled).to.equal(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should be able to make an asynchronous function from a coroutine', function () { return __awaiter(_this, void 0, void 0, function () {
            var asyncFunction, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        asyncFunction = BABYLON.makeAsyncFunction(function (value) {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Promise.resolve()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, value];
                                }
                            });
                        }, BABYLON.inlineScheduler);
                        return [4 /*yield*/, asyncFunction(42)];
                    case 1:
                        result = _a.sent();
                        expect(result).to.equal(42);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("#observable coroutines", function () {
        it("should be able to run multiple coroutines in parallel", function () {
            var observable = new BABYLON.Observable();
            var count1 = 0;
            var count2 = 0;
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count1 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count2 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.notifyObservers();
            expect(count1).to.equal(3);
            expect(count2).to.equal(2);
        });
        it("should be able to cancel all coroutines", function () {
            var observable = new BABYLON.Observable();
            var count1 = 0;
            var count2 = 0;
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count1 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count2 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            observable.notifyObservers();
            expect(count1).to.equal(2);
            expect(count2).to.equal(1);
        });
        it("should be able to cancel current coroutines then proceed with more", function () {
            var observable = new BABYLON.Observable();
            var count1 = 0;
            var count2 = 0;
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count1 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.cancelAllCoroutines();
            expect(count1).to.equal(1);
            observable.runCoroutineAsync(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!true) return [3 /*break*/, 2];
                            count2 += 1;
                            return [4 /*yield*/];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 0];
                        case 2: return [2 /*return*/];
                    }
                });
            }());
            observable.notifyObservers();
            observable.notifyObservers();
            expect(count1).to.equal(1);
            expect(count2).to.equal(2);
        });
    });
});
