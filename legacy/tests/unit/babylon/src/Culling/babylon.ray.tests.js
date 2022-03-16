/**
 * Describes the test suite.
 */
describe('Babylon Ray', function () {
    var subject;
    this.timeout(10000);
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
     * Ray tests.
     */
    describe('#ray', function () {
        it('pickWithRay', function () {
            var scene = new BABYLON.Scene(subject);
            var vertexData = new BABYLON.VertexData();
            vertexData.indices = [0, 1, 2];
            vertexData.positions = [
                0, 0, 0,
                1, 0, 0,
                0, 1, 0,
            ];
            vertexData.normals = [
                0, 0, -1,
                1, 0, -1,
                0, 1, -1,
            ];
            var mesh = new BABYLON.Mesh("triangle", scene);
            var geometry = new BABYLON.Geometry("triangle", scene, vertexData);
            geometry.applyToMesh(mesh);
            var direction = BABYLON.Vector3.Forward();
            for (var _i = 0, _a = vertexData.indices; _i < _a.length; _i++) {
                var index = _a[_i];
                var position = BABYLON.Vector3.FromArray(vertexData.positions, index * 3);
                var normal = BABYLON.Vector3.FromArray(vertexData.normals, index * 3).normalize();
                var origin_1 = new BABYLON.Vector3(position.x, position.y, position.z - 1);
                var ray = new BABYLON.Ray(origin_1, direction);
                var hit = scene.pickWithRay(ray);
                expect(hit.hit, "[".concat(index, "] hit.hit")).to.be.true;
                expect(BABYLON.Vector3.DistanceSquared(hit.pickedPoint, position), "[".concat(index, "] hit.pickedPoint")).to.equal(0);
                expect(BABYLON.Vector3.DistanceSquared(hit.getNormal(), normal), "[".concat(index, "] hit.getNormal()")).to.equal(0);
            }
        });
    });
});
