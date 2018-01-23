/**
 * Describes the test suite.
 */
describe('Babylon.Promise', () => {
    var subject : BABYLON.Engine;

    /**
     * Loads the dependencies.
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .load(function () {
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    /**
     * Create a nu engine subject before each test.
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
            mocha.timeout(10000);
            var tempString = "";
            var p1 = new Promise((resolve, reject) => {
                tempString = "Initial";
            
                resolve();
            })
            .then(() => {
                tempString += " message";
            })
            .then(() => {
                throw new Error('Something failed');
            })
            .catch(() => {
                tempString += " to check promises";
            })
            .then(() => {
                expect(tempString).to.eq("Initial message to check promises");
                done();
            });
        });
    });

    describe('#Composition', () => {
        it('should chain promises correctly #2', (done) => {
            mocha.timeout(10000);
            var tempString = "";
            var p1 = new Promise((resolve, reject) => {
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
                expect(tempString).to.eq("Initial message to check promises");
                done();
            });
        });
    });    

    describe('#Delayed', () => {
        it('should chain promises correctly #3', (done) => {
            mocha.timeout(10000);
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
                tempString += 'resolved '+ v;  // "resolved", 10
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
            mocha.timeout(10000);
            var promise1 = Promise.resolve(3);
            var promise2 = new Promise(function(resolve, reject) {
                setTimeout(resolve, 100, 'foo');
            });
            var promise3 = Promise.resolve(42);
        
            Promise.all([promise1, promise2, promise3]).then(function(values) {
                values.should.deep.equal([3, "foo", 42]);
                done();
            });
        });
    });   
});