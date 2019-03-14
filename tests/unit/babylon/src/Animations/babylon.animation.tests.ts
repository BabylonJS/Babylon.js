/**
 * Describes the test suite.
 */
describe('Babylon Animation', function() {
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

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });

    /**
     * Animation tests.
     */
    describe('#Animation', () => {
        it('one key', () => {
            const scene = new BABYLON.Scene(subject);
            const box = BABYLON.Mesh.CreateBox("box", 1, scene);
            scene.createDefaultCamera();
            const animation = new BABYLON.Animation("anim", "position.x", 1, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([{ frame: 0, value: 1 }]);
            box.animations.push(animation);
            scene.beginAnimation(box, 0, 0);
            scene.render();
            expect(box.position.x, "box.position.x").to.equal(1);
        });
    });
});
