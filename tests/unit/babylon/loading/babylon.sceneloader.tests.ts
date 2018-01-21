/**
 * Describes the test suite.
 */
describe('Babylon SceneLoader', () => {
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

    describe('#AssetContainer', () => {
        it('should be loaded from BoomBox GLTF', (done) => {
            var scene = new BABYLON.Scene(subject);
            BABYLON.SceneLoader.LoadAssetContainer("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene, function (container) {
                expect(container.meshes.length).to.eq(2);
                done();
            });
        });
        it('should be adding and removing objects from scene', () => {
            // Create a scene with some assets
            var scene = new BABYLON.Scene(subject);
            var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
            var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

            // Move all the assets from the scene into a container
            var container = new BABYLON.AssetContainer(scene);
            var keepAssets = new BABYLON.KeepAssets();
            keepAssets.cameras.push(camera)
            container.moveAllFromScene(keepAssets)
            expect(scene.cameras.length).to.eq(1)
            expect(scene.meshes.length).to.eq(0)
            expect(scene.lights.length).to.eq(0)
            expect(container.cameras.length).to.eq(0)
            expect(container.meshes.length).to.eq(2)
            expect(container.lights.length).to.eq(1)

            // Add them back and then remove again
            container.addAllToScene();
            expect(scene.cameras.length).to.eq(1)
            expect(scene.meshes.length).to.eq(2)
            expect(scene.lights.length).to.eq(1)
            container.removeAllFromScene();
            expect(scene.cameras.length).to.eq(1)
            expect(scene.meshes.length).to.eq(0)
            expect(scene.lights.length).to.eq(0)
        });
    });
});