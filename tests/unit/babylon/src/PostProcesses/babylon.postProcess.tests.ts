/**
 * Describes the test suite.
 */
describe('Babylon Scene Loader', function() {
    let subject: BABYLON.Engine;

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

    /**
     * Integration tests for post processes.
     */
    describe('#postProcesses', () => {
        it('Add default pipeline', () => {
            const scene = new BABYLON.Scene(subject);
            var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 100, new BABYLON.Vector3(0, 0, 0), scene);

            // Set caps so that HDR will be set when creating default pipeline
            var caps = subject.getCaps();
            caps.textureFloatRender = true;

            var promise = new Promise<void>((res, rej) => {
                scene.whenReadyAsync().then(() => {
                    let createShaderProgramSpy = sinon.spy(subject, "createShaderProgram");
                    var defaultPipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
                    // wait for all shaders to be compiled if needed
                    setTimeout(() => {
                        expect(createShaderProgramSpy.callCount, "number of shaders compiled").to.equal(1); // Image process shader is compiled by default
                        createShaderProgramSpy.restore();
                        caps.textureFloatRender = false;
                        res();
                    }, 500);
                });
            });
            return promise;
        });
    });
});
