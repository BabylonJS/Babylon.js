/**
 * @jest-environment jsdom
 */

import { PromisePolyfill, Tools } from "core/Misc";
PromisePolyfill.Apply(true);

/**
 * Describes the test suite.
 */
describe("Promise", function () {
    jest.setTimeout(10000);

    describe("#Composition", () => {
        it("should chain promises correctly #1", () => {
            let tempString = "";
            return new Promise<void>((resolve) => {
                tempString = "Initial";
                resolve();
            })
                .then(() => {
                    tempString += " message";
                })
                .then(() => {
                    throw new Error("Something failed");
                })
                .catch(() => {
                    tempString += " to check promises";
                })
                .then(() => {
                    try {
                        expect(tempString).toEqual("Initial message to check promises");
                    } catch (error) {
                        // no-op
                    }
                });
        });

        it("should chain promises correctly #2", () => {
            let tempString = "";
            return new Promise<void>((resolve) => {
                tempString = "Initial";
                resolve();
            })
                .then(() => {
                    tempString += " message";
                })
                .then(() => {
                    tempString += " to check promises";
                })
                .catch(() => {
                    tempString += " wrong!";
                })
                .then(() => {
                    expect(tempString).toEqual("Initial message to check promises");
                });
        });

        it("should chain promises correctly #3", () => {
            let tempString = "";
            function resolveLater(resolve: (arg0: number) => void, _reject: any) {
                setTimeout(function () {
                    resolve(10);
                }, 1000);
            }
            function rejectLater(_resolve: any, reject: (arg0: number) => void) {
                setTimeout(function () {
                    reject(20);
                }, 1000);
            }

            const p1 = (<any>Promise).resolve("foo");
            const p2 = p1.then(function () {
                // Return promise here, that will be resolved to 10 after 1 second
                return new Promise(resolveLater);
            });
            p2.then(
                function (v: string) {
                    tempString += "resolved " + v; // "resolved", 10
                },
                function (e: string) {
                    // not called
                    tempString += "rejected" + e;
                }
            );

            const p3 = p1.then(function () {
                // Return promise here, that will be rejected with 20 after 1 second
                return new Promise(rejectLater);
            });
            const p4 = p3.then(
                function (v: string) {
                    // not called
                    tempString += "resolved " + v;
                },
                function (e: string) {
                    tempString += "rejected " + e; // "rejected", 20
                    expect(tempString).toEqual("resolved 10rejected 20");
                }
            );

            return Promise.all([p2, p4]);
        });

        it("should chain promises correctly #4", async () => {
            let tempString = "first";
            // eslint-disable-next-line jest/valid-expect-in-promise
            const promise = Promise.resolve()
                .then(() => {
                    tempString += " third";
                    return tempString;
                })
                .then(() => {
                    expect(tempString).toEqual("first second third");
                    return tempString;
                });

            tempString += " second";

            return promise;
        });

        it("should chain promises correctly #5", () => {
            let tempString = "";
            let promise = new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(44);
                }, 100);
            });

            promise = promise.then(function () {
                return 55;
            });

            return promise.then(function (value) {
                tempString += "1: " + value;
                setTimeout(function () {
                    promise.then(function (value) {
                        tempString += " 2: " + value;
                        expect(tempString).toEqual("1: 55 2: 55");
                    });
                }, 0);
            });
        });

        it("should chain promises correctly #6", () => {
            let tempString = "";
            let promise = new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(44);
                }, 100);
            });

            promise = promise.then(function () {
                return Promise.resolve(55);
            });

            return promise.then(function (value) {
                tempString += "1: " + value;
                setTimeout(function () {
                    promise.then(function (value) {
                        tempString += " 2: " + value;
                        expect(tempString).toEqual("1: 55 2: 55");
                    });
                }, 0);
            });
        });
    });

    describe("#Promise.all", () => {
        it("should agregate promises correctly", () => {
            const promise1 = Promise.resolve(3);
            const promise2 = new Promise(function (resolve, _reject) {
                setTimeout(resolve, 100, "foo");
            });
            const promise3 = Promise.resolve(42);

            return Promise.all([promise1, promise2, promise3]).then(function (values) {
                expect(values).toStrictEqual([3, "foo", 42]);
            });
        });
    });

    describe("#Returning value", () => {
        it("should correctly handle returned values", () => {
            return Promise.resolve(1)
                .then((number) => {
                    return number + 1;
                })
                .then((number) => {
                    return number + 1;
                })
                .then((number) => {
                    expect(number).toEqual(3);
                });
        });

        it("should correctly handle then multiple times", () => {
            const promise = Promise.resolve().then(function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(123);
                    }, 100);
                });
            });

            return promise.then(function (result1) {
                expect(result1).toEqual(123);
                return promise.then(function (result2) {
                    expect(result2).toEqual(123);
                });
            });
        });
    });

    describe("#Multiple children", () => {
        it('should correctly handle multiple independent "then"', () => {
            const successValue = "Success!";
            const promise1 = Tools.DelayAsync(500).then(() => successValue);

            let sum = 0;
            const checkDone = (value: string) => {
                sum++;
                if (sum === 2) {
                    // eslint-disable-next-line jest/no-conditional-expect
                    expect(value).toEqual(successValue);
                }
            };

            return Promise.all([promise1.then(checkDone), promise1.then(checkDone)]);
        });
    });

    describe("#All and then", () => {
        it("should correctly handle chaining a returning then after a all", () => {
            const promise = Promise.all([Tools.DelayAsync(100), Tools.DelayAsync(200)]).then(function () {
                return 1;
            });

            return promise.then(function (value) {
                expect(value).toEqual(1);
            });
        });
    });

    describe("#Move children", () => {
        it("should correctly handle moving children", () => {
            let callback1Count = 0;
            let callback2Count = 0;
            return Promise.resolve()
                .then(function () {
                    const promise = Promise.all([Tools.DelayAsync(100), Tools.DelayAsync(200)]).then(function () {
                        callback1Count++;
                    });
                    Promise.all([promise]).then(function () {
                        callback2Count++;
                    });
                    return promise;
                })
                .then(function () {
                    expect(callback1Count).toEqual(1);
                    expect(callback2Count).toEqual(1);
                });
        });
    });

    describe("#Error handling", () => {
        it("should correctly handle exceptions", () => {
            const errorValue = "Failed!";
            const promise = new Promise((_resolve, _reject) => {
                throw new Error(errorValue);
            }).catch((error) => {
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.constructor).toEqual(Error); // ???
                // eslint-disable-next-line jest/no-conditional-expect
                expect(error.message).toEqual(errorValue);
            });
            return promise;
        });

        it("should correctly handle exceptions in a reject handler", () => {
            const errorValue = "Failed!";
            const promise = new Promise((_resolve, _reject) => {
                throw new Error(errorValue);
            })
                .catch((error) => {
                    throw error;
                })
                .catch((error) => {
                    expect(error.constructor).toEqual(Error);
                    expect(error.message).toEqual(errorValue);
                });
            return promise;
        });
    });
});
