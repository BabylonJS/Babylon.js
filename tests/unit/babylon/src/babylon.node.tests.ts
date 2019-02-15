/**
 * Describes the test suite.
 */
describe('Babylon Node', () => {
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

    describe('#Node', () => {
        it('dispose', () => {
            const scene = new BABYLON.Scene(subject);
            const node = new BABYLON.Node("node", scene);
            const transformNode = new BABYLON.TransformNode("transformNode", scene);
            transformNode.parent = node;
            const mesh = new BABYLON.Mesh("node2", scene);
            mesh.parent = node;
            mesh.material = new BABYLON.PBRMaterial("material", scene)

            node.dispose();

            expect(node.isDisposed(), "node.isDisposed").to.be.true;
            expect(transformNode.isDisposed(), "transformNode.isDisposed").to.be.true;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.true;

            expect(scene.materials, "scene.materials").to.have.lengthOf(1);
        });

        it('dispose with doNotRecurse', () => {
            const scene = new BABYLON.Scene(subject);
            const node = new BABYLON.Node("node", scene);
            const transformNode = new BABYLON.TransformNode("transformNode", scene);
            transformNode.parent = node;
            const mesh = new BABYLON.Mesh("node2", scene);
            mesh.parent = node;
            mesh.material = new BABYLON.PBRMaterial("material", scene)

            node.dispose(true);

            expect(node.isDisposed(), "node.isDisposed").to.be.true;
            expect(transformNode.isDisposed(), "transformNode.isDisposed").to.be.false;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.false;

            expect(scene.materials, "scene.materials").to.have.lengthOf(1);
        });

        it('dispose with disposeMaterialAndTextures', () => {
            const scene = new BABYLON.Scene(subject);
            const transformNode = new BABYLON.TransformNode("transformNode", scene);
            const mesh = new BABYLON.Mesh("mesh", scene);
            mesh.parent = transformNode;
            mesh.material = new BABYLON.PBRMaterial("material", scene)

            transformNode.dispose(false, true);

            expect(transformNode.isDisposed(), "node.isDisposed").to.be.true;
            expect(mesh.isDisposed(), "mesh.isDisposed").to.be.true;

            expect(scene.meshes, "scene.meshes").to.be.empty;
            expect(scene.materials, "scene.materials").to.be.empty;
        });
    });
});