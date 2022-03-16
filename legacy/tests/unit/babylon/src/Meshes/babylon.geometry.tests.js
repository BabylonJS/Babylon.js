/**
 * Describes the test suite.
 */
describe('Babylon Geometry', function () {
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
    describe('#Geometry get vertices data', function () {
        it('vec3 float color tightly packed', function () {
            var scene = new BABYLON.Scene(subject);
            var data = new Float32Array([0.4, 0.4, 0.4, 0.6, 0.6, 0.6, 0.8, 0.8, 0.8, 1, 1, 1]);
            var buffer = new BABYLON.Buffer(subject, data, false);
            var vertexBuffer = new BABYLON.VertexBuffer(subject, buffer, BABYLON.VertexBuffer.ColorKind, undefined, undefined, undefined, undefined, undefined, 3);
            var geometry = new BABYLON.Geometry("geometry1", scene);
            geometry.setVerticesBuffer(vertexBuffer);
            geometry.setIndices([0, 1, 2, 3], 4);
            var result = geometry.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            expect(result).to.equal(data);
        });
        it('vec3 unsigned byte normalized color with offset of 3 and byte stride of 4', function () {
            var scene = new BABYLON.Scene(subject);
            var data = new Uint8Array([0, 0, 0, 102, 102, 102, 0, 153, 153, 153, 0, 204, 204, 204, 0, 255, 255, 255, 0]);
            var buffer = new BABYLON.Buffer(subject, data, false, 4, undefined, undefined, true);
            var vertexBuffer = new BABYLON.VertexBuffer(subject, buffer, BABYLON.VertexBuffer.ColorKind, undefined, undefined, undefined, false, 3, 3, BABYLON.VertexBuffer.UNSIGNED_BYTE, true, true);
            var geometry = new BABYLON.Geometry("geometry1", scene);
            geometry.setVerticesBuffer(vertexBuffer);
            geometry.setIndices([0, 1, 2, 3], 4);
            var result = geometry.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            expect(result).to.be.a('float32array');
            var expectedResult = new Float32Array([0.4, 0.4, 0.4, 0.6, 0.6, 0.6, 0.8, 0.8, 0.8, 1, 1, 1]);
            for (var i = 0; i < data.length; i++) {
                expect(result[i]).to.be.equal(expectedResult[i]);
            }
        });
    });
});
