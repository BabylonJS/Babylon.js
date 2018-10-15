

function runTests(testType, BABYLON, GUI, INSPECTOR) {

    console.log("running tests");

    describe(testType + ' module tests', function () {

        it("should have the dependencies loaded", function () {
            assert.isDefined(BABYLON, "BABYLON should be defined");
            assert.isDefined(GUI, "GUI should be defined");
            assert.isDefined(INSPECTOR, "INSPECTOR should be defined");
            // GLTF2 has migrated to BABYLON
            // assert.isDefined(BABYLON.GLTF2, "BABYLON.GLTF2 should be defined");
        })

        var subject;

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
        describe('#GLTF', function () {
            it('should load BoomBox GLTF', function (done) {
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
}