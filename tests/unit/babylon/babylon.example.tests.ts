/**
 * Describes the test suite.
 */
describe('Example', function() {
    /**
     * Sets the timeout of all the tests to 10 seconds.
     * Note the JavaScript function syntax in the describe callback.
     * See https://mochajs.org/#arrow-functions
     */
    this.timeout(10000);

    /**
     * Loads the dependencies.
     */
    before(function(done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function() {
                // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    /**
     * This test highlights different ways of using asserts from chai so that you can chose the syntax
     * you prefer between should, expect, and assert.
     */
    describe('#ExponentOfTwo', () => {
        it('should be expoent of two', () => {
            var result: boolean = BABYLON.Tools.IsExponentOfTwo(2);
            expect(result).to.be.true;

            result = BABYLON.Tools.IsExponentOfTwo(4);
            result.should.be.true;

            result = BABYLON.Tools.IsExponentOfTwo(8);
            assert.isTrue(result);
        });

        it('should not be exponent of two', () => {
            var result: boolean = BABYLON.Tools.IsExponentOfTwo(3);
            expect(result).to.be.false;

            result = BABYLON.Tools.IsExponentOfTwo(6);
            result.should.be.false;

            result = BABYLON.Tools.IsExponentOfTwo(12);
            assert.isFalse(result);
        });
    });

    /**
     * This test shows how to return an asynchronous operation with promises.
     */
    describe('#Promise', () => {
        it('delay', () => {
            return BABYLON.Tools.DelayAsync(100);
        });
    });
});