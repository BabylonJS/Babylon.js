/**
 * Describes the test suite.
 */
describe('Babylon.Promise', function () {
    var subject: BABYLON.Engine;

    this.timeout(10000);

    /**
     * Loads the dependencies.
     */
    before(function (done) {
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .load(function () {
                // Force apply promise polyfill for consistent behavior between PhantomJS, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
    });

    describe('#Composition', () => {
        it('should chain promises correctly #1', (done) => {
            var tempString = "";
            var p1 = new Promise((resolve, reject) => {
                tempString = "Initial";
                resolve();
            }).then(() => {
                tempString += " message";
            }).then(() => {
                throw new Error('Something failed');
            }).catch(() => {
                tempString += " to check promises";
            }).then(() => {
                expect(tempString).to.eq("Initial message to check promises");
                done();
            });
        });
    });

    describe('#Composition', () => {
        it('should chain promises correctly #2', (done) => {
            var tempString = "";
            var p1 = new Promise((resolve, reject) => {
                tempString = "Initial";
                resolve();
            }).then(() => {
                tempString += " message";
            }).then(() => {
                tempString += " to check promises";
            }).catch(() => {
                tempString += " wrong!";
            }).then(() => {
                expect(tempString).to.eq("Initial message to check promises");
                done();
            });
        });
    });

    describe('#Delayed', () => {
        it('should chain promises correctly #3', (done) => {
            var tempString = "";
            function resolveLater(resolve, reject) {
                setTimeout(function () {
                    resolve(10);
                }, 1000);
            }
            function rejectLater(resolve, reject) {
                setTimeout(function () {
                    reject(20);
                }, 1000);
            }

            var p1 = (<any>Promise).resolve('foo');
            var p2 = p1.then(function () {
                // Return promise here, that will be resolved to 10 after 1 second
                return new Promise(resolveLater);
            });
            p2.then(function (v) {
                tempString += 'resolved ' + v;  // "resolved", 10
            }, function (e) {
                // not called
                tempString += 'rejected' + e;
            });

            var p3 = p1.then(function () {
                // Return promise here, that will be rejected with 20 after 1 second
                return new Promise(rejectLater);
            });
            p3.then(function (v) {
                // not called
                tempString += 'resolved ' + v;
            }, function (e) {
                tempString += 'rejected ' + e; // "rejected", 20
                expect(tempString).to.eq("resolved 10rejected 20");
                done();
            });
        });
    });

    describe('#Promise.all', () => {
        it('should agregate promises correctly', (done) => {
            var promise1 = Promise.resolve(3);
            var promise2 = new Promise(function (resolve, reject) {
                setTimeout(resolve, 100, 'foo');
            });
            var promise3 = Promise.resolve(42);

            Promise.all([promise1, promise2, promise3]).then(function (values) {
                values.should.deep.equal([3, "foo", 42]);
                done();
            });
        });
    });

    describe('#Returning value', () => {
        it('should correctly handle returned values', (done) => {
            Promise.resolve(1)
                .then(number => { return number + 1; })
                .then(number => { return number + 1; })
                .then(number => {
                    number.should.be.equal(3);
                    done();
                });
        });
    });

    describe('#Multiple children', () => {
        it('should correctly handle multiple independent "then"', (done) => {
            var successValue = 'Success!';
            var promise1 = BABYLON.Tools.DelayAsync(500).then(() => successValue);

            var sum = 0;
            promise1.then(function (value) {
                sum++;
                if (sum === 2) {
                    expect(value).to.equal(successValue);
                    done();
                }
            });

            promise1.then(function (value) {
                sum++;
                if (sum === 2) {
                    expect(value).to.equal(successValue);
                    done();
                }
            });
        });
    });

    describe('#All and then', () => {
        it('should correctly handle chaining a returning then after a all', (done) => {
            var promise = Promise.all([BABYLON.Tools.DelayAsync(100), BABYLON.Tools.DelayAsync(200)]).then(function () {
                return 1;
            });

            promise.then(function (value) {
                expect(value).to.equal(1);
                done();
            });
        });
    });

    describe('#Move children', () => {
        it('should correctly handle moving children', (done) => {
            var callback1Count = 0;
            var callback2Count = 0;
            Promise.resolve().then(function () {
                var promise = Promise.all([BABYLON.Tools.DelayAsync(100), BABYLON.Tools.DelayAsync(200)]).then(function () {
                    callback1Count++;
                });
                Promise.all([promise]).then(function () {
                    callback2Count++;
                });
                return promise;
            }).then(function () {
                expect(callback1Count).to.equal(1);
                expect(callback2Count).to.equal(1);
                done();
            });
        });
    });

    describe('#Error handling', () => {
        it('should correctly handle exceptions', (done) => {
            var errorValue = 'Failed!';
            var promise = new Promise((resolve, reject) => {
                throw new Error(errorValue);
            }).catch(error => {
                expect(error.constructor).to.equal(Error);
                expect(error.message).to.equal(errorValue);
                done();
            });
        });
    });
});