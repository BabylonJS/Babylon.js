import { VertexData } from "core/Meshes";

/**
 * Describes the test suite.
 */
describe("Babylon Mesh Vertex Data", () => {
    describe("#Mesh Vertex Data Merge", () => {
        it("should be able to merge data", () => {
            const foo = new VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0, 0, 1];

            const bar = new VertexData();
            bar.positions = [0, 0, 1];
            bar.normals = [0, 1, 0];

            const merged = foo.merge(bar);
            expect(merged.positions).toStrictEqual([0, 0, 0, 0, 0, 1]);
            expect(merged.normals).toStrictEqual([0, 0, 1, 0, 1, 0]);
        });

        it("should not be able to merge data that are not valid", () => {
            const foo = new VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0];

            const bar = new VertexData();
            bar.positions = [0, 0, 1];
            bar.normals = [0];

            expect(() => {
                foo.merge(bar);
            }).toThrowError(Error);
        });

        it("should not be able to merge data with different attributes", () => {
            const foo = new VertexData();
            foo.positions = [0, 0, 0];
            foo.normals = [0, 0, 1];

            const bar = new VertexData();
            bar.positions = [0, 0, 1];

            expect(() => {
                foo.merge(bar);
            }).toThrowError(Error);
        });
    });
});
