/**
 * Describes the test suite.
 */
describe('Babylon.Promise', function() {
    this.timeout(10000);

    /**
     * Loads the dependencies.
     */
    before(function(done) {
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function() {
                // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    describe('#Composition', () => {
        it('should chain promises correctly #1', (done) => {
            var tempString = "";
            var p1 = new Promise<void>((resolve) => {
                tempString = "Initial";
                resolve();
            }).then(() => {
                tempString += " message";
            }).then(() => {
                throw new Error('Something failed');
            }).catch(() => {
                tempString += " to check promises";
            }).then(() => {
                try {
                    expect(tempString).to.eq("Initial message to check promises");
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });

        it('should chain promises correctly #2', (done) => {
            var tempString = "";
            var p1 = new Promise<void>((resolve) => {
                tempString = "Initial";
                resolve();
            }).then(() => {
                tempString += " message";
            }).then(() => {
                tempString += " to check promises";
            }).catch(() => {
                tempString += " wrong!";
            }).then(() => {
                try {
                    expect(tempString).to.eq("Initial message to check promises");
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });

        it('should chain promises correctly #3', (done) => {
            var tempString = "";
            function resolveLater(resolve, reject) {
                setTimeout(function() {
                    resolve(10);
                }, 1000);
            }
            function rejectLater(resolve, reject) {
                setTimeout(function() {
                    reject(20);
                }, 1000);
            }

            var p1 = (<any>Promise).resolve('foo');
            var p2 = p1.then(function() {
                // Return promise here, that will be resolved to 10 after 1 second
                return new Promise(resolveLater);
            });
            p2.then(function(v) {
                tempString += 'resolved ' + v;  // "resolved", 10
            }, function(e) {
                // not called
                tempString += 'rejected' + e;
            });

            var p3 = p1.then(function() {
                // Return promise here, that will be rejected with 20 after 1 second
                return new Promise(rejectLater);
            });
            p3.then(function(v) {
                // not called
                tempString += 'resolved ' + v;
            }, function(e) {
                tempString += 'rejected ' + e; // "rejected", 20
                try {
                    expect(tempString).to.eq("resolved 10rejected 20");
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });

        it('should chain promises correctly #4', (done) => {
            var tempString = "first";
            var promise = Promise.resolve().then(() => {
                tempString += " third";
            }).then(() => {
                try {
                    expect(tempString).to.eq("first second third");
                    done();
                }
                catch (error) {
                    done(error);
                }
            });

            tempString += " second";
        });

        it('should chain promises correctly #5', (done) => {
            var tempString = "";
            var promise = new Promise(function(resolve) {
                setTimeout(function() {
                    resolve(44);
                }, 100);
            });

            promise = promise.then(function() {
                return 55;
            });

            promise.then(function(value) {
                tempString += "1: " + value;
                setTimeout(function() {
                    promise.then(function(value) {
                        tempString += " 2: " + value;
                        try {
                            expect(tempString).to.eq("1: 55 2: 55");
                            done();
                        }
                        catch (error) {
                            done(error);
                        }
                    });
                }, 0);
            });
        });

        it('should chain promises correctly #6', (done) => {
            var tempString = "";
            var promise = new Promise(function(resolve) {
                setTimeout(function() {
                    resolve(44);
                }, 100);
            });

            promise = promise.then(function() {
                return Promise.resolve(55);
            });

            promise.then(function(value) {
                tempString += "1: " + value;
                setTimeout(function() {
                    promise.then(function(value) {
                        tempString += " 2: " + value;
                        try {
                            expect(tempString).to.eq("1: 55 2: 55");
                            done();
                        }
                        catch (error) {
                            done(error);
                        }
                    });
                }, 0);
            });
        });
    });

    describe('#Promise.all', () => {
        it('should agregate promises correctly', (done) => {
            var promise1 = Promise.resolve(3);
            var promise2 = new Promise(function(resolve, reject) {
                setTimeout(resolve, 100, 'foo');
            });
            var promise3 = Promise.resolve(42);

            Promise.all([promise1, promise2, promise3]).then(function(values) {
                try {
                    values.should.deep.equal([3, "foo", 42]);
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });
    });

    describe('#Returning value', () => {
        it('should correctly handle returned values', (done) => {
            Promise.resolve(1)
                .then(number => { return number + 1; })
                .then(number => { return number + 1; })
                .then(number => {
                    try {
                        number.should.be.equal(3);
                        done();
                    }
                    catch (error) {
                        done(error);
                    }
                });
        });

        it('should correctly handle then multiple times', (done) => {
            var promise = Promise.resolve().then(function() {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        resolve(123);
                    }, 100);
                });
            });

            promise.then(function(result1) {
                try {
                    result1.should.be.equal(123);
                }
                catch (error) {
                    done(error);
                }
                return promise.then(function(result2) {
                    try {
                        result2.should.be.equal(123);
                        done();
                    }
                    catch (error) {
                        done(error);
                    }
                });
            });
        });

    });

    describe('#Multiple children', () => {
        it('should correctly handle multiple independent "then"', (done) => {
            var successValue = 'Success!';
            var promise1 = BABYLON.Tools.DelayAsync(500).then(() => successValue);

            var sum = 0;
            var checkDone = (value: string) => {
                sum++;
                if (sum === 2) {
                    try {
                        expect(value).to.equal(successValue);
                        done();
                    }
                    catch (error) {
                        done(error);
                    }
                }
            };

            promise1.then(checkDone);
            promise1.then(checkDone);
        });
    });

    describe('#All and then', () => {
        it('should correctly handle chaining a returning then after a all', (done) => {
            var promise = Promise.all([BABYLON.Tools.DelayAsync(100), BABYLON.Tools.DelayAsync(200)]).then(function() {
                return 1;
            });

            promise.then(function(value) {
                try {
                    expect(value).to.equal(1);
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });
    });

    describe('#Move children', () => {
        it('should correctly handle moving children', (done) => {
            var callback1Count = 0;
            var callback2Count = 0;
            Promise.resolve().then(function() {
                var promise = Promise.all([BABYLON.Tools.DelayAsync(100), BABYLON.Tools.DelayAsync(200)]).then(function() {
                    callback1Count++;
                });
                Promise.all([promise]).then(function() {
                    callback2Count++;
                });
                return promise;
            }).then(function() {
                try {
                    expect(callback1Count).to.equal(1);
                    expect(callback2Count).to.equal(1);
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });
    });

    describe('#Error handling', () => {
        it('should correctly handle exceptions', (done) => {
            var errorValue = 'Failed!';
            var promise = new Promise((resolve, reject) => {
                throw new Error(errorValue);
            }).catch(error => {
                try {
                    expect(error.constructor).to.equal(Error);
                    expect(error.message).to.equal(errorValue);
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });

        it('should correctly handle exceptions in a reject handler', (done) => {
            var errorValue = 'Failed!';
            var promise = new Promise((resolve, reject) => {
                throw new Error(errorValue);
            }).catch(error => {
                throw error;
            }).catch(error => {
                try {
                    expect(error.constructor).to.equal(Error);
                    expect(error.message).to.equal(errorValue);
                    done();
                }
                catch (error) {
                    done(error);
                }
            });
        });
    });
});