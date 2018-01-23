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

    /**
     * This test is more an integration test than a regular unit test but highlights how to rely
     * on the BABYLON.NullEngine in order to create complex test cases.
     */
    describe('#Composition', () => {
        it('should chain promises correctly', (done) => {
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
});