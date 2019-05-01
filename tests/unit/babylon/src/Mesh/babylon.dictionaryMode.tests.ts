/**
 * Describes the test suite.
 */
describe('Babylon Mesh', () => {
    let subject: BABYLON.Engine;

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
     * Create a new engine subject before each test.
     */
    beforeEach(function() {
        subject = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
    });

    describe('#Mesh dictionary mode threshold', () => {
        it('No more than 128 own properties on a mesh', () => {
            const scene = new BABYLON.Scene(subject);
            const mesh = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

            var count = 0;
            for (var prop in mesh) {
                if (mesh.hasOwnProperty(prop)) {
                    count++;
                }
            }

            expect(count).to.lessThan(128);
        });
    });
});