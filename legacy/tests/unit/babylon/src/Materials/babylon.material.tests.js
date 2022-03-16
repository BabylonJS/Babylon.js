/**
 * Describes the test suite.
 */
describe('Babylon Material', function () {
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
    });
    describe('#PBRMaterial', function () {
        it('forceCompilation of a single material', function () {
            var scene = new BABYLON.Scene(subject);
            var mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            var material = new BABYLON.PBRMaterial("material", scene);
            return material.forceCompilationAsync(mesh);
        });
        it('forceCompilation of already compiled material', function () {
            var scene = new BABYLON.Scene(subject);
            var mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            var material = new BABYLON.PBRMaterial("material", scene);
            material.albedoTexture = new BABYLON.Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            return material.forceCompilationAsync(mesh).then(function () {
                return material.forceCompilationAsync(mesh);
            });
        });
        it('forceCompilation of same material in parallel', function () {
            var scene = new BABYLON.Scene(subject);
            var mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            var material = new BABYLON.PBRMaterial("material", scene);
            material.albedoTexture = new BABYLON.Texture("/Playground/scenes/BoomBox/BoomBox_baseColor.png", scene);
            return Promise.all([
                material.forceCompilationAsync(mesh),
                material.forceCompilationAsync(mesh)
            ]);
        });
    });
});
