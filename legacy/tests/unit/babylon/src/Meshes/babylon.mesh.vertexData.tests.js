/**
 * Describes the test suite.
 */
describe('Babylon Mesh Vertex Data', function () {
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
    describe('#Mesh Vertex Data Merge', function () {
        it('should be able to merge data', function () {
            var foo = new BABYLON.VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0, 0, 1];
            var bar = new BABYLON.VertexData();
            bar.positions = [0, 0, 1];
            bar.normals = [0, 1, 0];
            var merged = foo.merge(bar);
            expect(merged.positions).to.eql([0, 0, 0, 0, 0, 1]);
            expect(merged.normals).to.eql([0, 0, 1, 0, 1, 0]);
        });
        it('should not be able to merge data that are not valid', function () {
            var foo = new BABYLON.VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0];
            var bar = new BABYLON.VertexData();
            bar.positions = [0, 0, 1];
            bar.normals = [0];
            expect(function () {
                foo.merge(bar);
            }).to.throw(Error);
        });
        it('should not be able to merge data with different attributes', function () {
            var foo = new BABYLON.VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0, 0, 1];
            var bar = new BABYLON.VertexData();
            bar.positions = [0, 0, 1];
            expect(function () {
                foo.merge(bar);
            }).to.throw(Error);
        });
    });
});
