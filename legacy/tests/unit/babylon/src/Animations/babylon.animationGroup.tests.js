/**
 * Describes the test suite.
 */
describe('Babylon Animation Group', function () {
    var subject;
    /**
     * Loads the dependencies.
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function () {
            // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
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
        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });
    /**
     * Animation group tests.
     */
    describe('#AnimationGroup', function () {
        it('start and stop', function () {
            var scene = new BABYLON.Scene(subject);
            var node = new BABYLON.TransformNode("node0", scene);
            var animationGroup = new BABYLON.AnimationGroup("animationGroup0", scene);
            var length = 10;
            for (var i = 0; i < length; i++) {
                var animation = new BABYLON.Animation("animation".concat(i), "position", 1, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
                animation.setKeys([
                    {
                        frame: 0,
                        value: BABYLON.Vector3.Zero()
                    },
                    {
                        frame: 1,
                        value: BABYLON.Vector3.Zero()
                    }
                ]);
                animationGroup.addTargetedAnimation(animation, node);
            }
            animationGroup.start();
            expect(animationGroup.animatables.length, "animationGroup.animatables.length").to.equal(length);
            expect(scene.animatables.length, "scene.animatables.length").to.equal(length);
            animationGroup.stop();
            expect(animationGroup.animatables.length, "animationGroup.animatables.length").to.equal(0);
            expect(scene.animatables.length, "scene.animatables.length").to.equal(0);
        });
    });
});
