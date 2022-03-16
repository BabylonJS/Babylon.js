/**
 * Describes the test suite.
 */
describe('Babylon Node', function () {
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
    describe('#Node', function () {
        it('dispose', function () {
            var scene = new BABYLON.Scene(subject);
            var node = new BABYLON.Node("node", scene);
            var transformNode = new BABYLON.TransformNode("transformNode", scene);
            transformNode.parent = node;
            var mesh = new BABYLON.Mesh("node2", scene);
            mesh.parent = node;
            mesh.material = new BABYLON.PBRMaterial("material", scene);
            node.dispose();
            expect(node.isDisposed(), "node.isDisposed").to.be.true;
            expect(transformNode.isDisposed(), "transformNode.isDisposed").to.be.true;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.true;
            expect(scene.materials, "scene.materials").to.have.lengthOf(1);
        });
        it('dispose with doNotRecurse', function () {
            var scene = new BABYLON.Scene(subject);
            var node = new BABYLON.Node("node", scene);
            var transformNode = new BABYLON.TransformNode("transformNode", scene);
            transformNode.parent = node;
            var mesh = new BABYLON.Mesh("node2", scene);
            mesh.parent = node;
            mesh.material = new BABYLON.PBRMaterial("material", scene);
            node.dispose(true);
            expect(node.isDisposed(), "node.isDisposed").to.be.true;
            expect(transformNode.isDisposed(), "transformNode.isDisposed").to.be.false;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.false;
            expect(scene.materials, "scene.materials").to.have.lengthOf(1);
        });
        it('dispose with disposeMaterialAndTextures', function () {
            var scene = new BABYLON.Scene(subject);
            var transformNode = new BABYLON.TransformNode("transformNode", scene);
            var mesh = new BABYLON.Mesh("mesh", scene);
            mesh.parent = transformNode;
            mesh.material = new BABYLON.PBRMaterial("material", scene);
            transformNode.dispose(false, true);
            expect(transformNode.isDisposed(), "node.isDisposed").to.be.true;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.true;
            expect(scene.meshes, "scene.meshes").to.be.empty;
            expect(scene.materials, "scene.materials").to.be.empty;
        });
    });
});
