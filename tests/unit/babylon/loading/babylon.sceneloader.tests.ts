/**
 * Describes the test suite.
 */
describe('Babylon Tools', () => {
    var subject : BABYLON.Engine;

    /**
     * Loads the dependencies.
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .load(function () {
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
    describe('#GLTF', () => {
        it('should load BoomBox GLTF', (done) => {
            mocha.timeout(10000);

            var scene = new BABYLON.Scene(subject);
            BABYLON.SceneLoader.Append("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene, function () {

                scene.meshes.length.should.be.equal(2);
                scene.materials.length.should.be.equal(1);
                scene.multiMaterials.length.should.be.equal(0);

                done();
            });
        });
    });
});