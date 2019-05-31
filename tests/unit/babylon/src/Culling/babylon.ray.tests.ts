/**
 * Describes the test suite.
 */
describe('Babylon Ray', function() {
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

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });

    /**
     * Ray tests.
     */
    describe('#ray', () => {
        it('pickWithRay', () => {
            const scene = new BABYLON.Scene(subject);

            const vertexData = new BABYLON.VertexData();
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

            const mesh = new BABYLON.Mesh("triangle", scene);

            const geometry = new BABYLON.Geometry("triangle", scene, vertexData);
            geometry.applyToMesh(mesh);

            const direction = BABYLON.Vector3.Forward();
            for (const index of vertexData.indices) {
                const position = BABYLON.Vector3.FromArray(vertexData.positions, index * 3);
                const normal = BABYLON.Vector3.FromArray(vertexData.normals, index * 3).normalize();
                const origin = new BABYLON.Vector3(position.x, position.y, position.z - 1);
                const ray = new BABYLON.Ray(origin, direction);
                const hit = scene.pickWithRay(ray);
                expect(hit.hit, `[${index}] hit.hit`).to.be.true;
                expect(BABYLON.Vector3.DistanceSquared(hit.pickedPoint, position), `[${index}] hit.pickedPoint`).to.equal(0);
                expect(BABYLON.Vector3.DistanceSquared(hit.getNormal(), normal), `[${index}] hit.getNormal()`).to.equal(0);
            }
        });
    });
});
