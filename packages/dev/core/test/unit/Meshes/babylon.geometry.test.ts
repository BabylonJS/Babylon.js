import { VertexBuffer } from "core/Buffers";
import { Engine, NullEngine } from "core/Engines";
import { Geometry } from "core/Meshes";
import { Scene } from "core/scene";
import { Buffer } from "core/Buffers/buffer";

/**
 * Describes the test suite.
 */
describe("Babylon Geometry", () => {
    let subject: Engine;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("#Geometry get vertices data", () => {
        it("vec3 float color tightly packed", () => {
            const scene = new Scene(subject);
            const data = new Float32Array([0.4, 0.4, 0.4, 0.6, 0.6, 0.6, 0.8, 0.8, 0.8, 1, 1, 1]);
            const buffer = new Buffer(subject, data, false);
            const vertexBuffer = new VertexBuffer(subject, buffer, VertexBuffer.ColorKind, false, undefined, undefined, undefined, undefined, 3);

            const geometry = new Geometry("geometry1", scene);
            geometry.setVerticesBuffer(vertexBuffer);
            geometry.setIndices([0, 1, 2, 3], 4);

            const result = geometry.getVerticesData(VertexBuffer.ColorKind);
            expect(result).toStrictEqual(data);
        });

        it("vec3 unsigned byte normalized color with offset of 3 and byte stride of 4", () => {
            const scene = new Scene(subject);
            const data = new Uint8Array([0, 0, 0, 102, 102, 102, 0, 153, 153, 153, 0, 204, 204, 204, 0, 255, 255, 255, 0]);
            const buffer = new Buffer(subject, data, false, 4, undefined, undefined, true);
            const vertexBuffer = new VertexBuffer(subject, buffer, VertexBuffer.ColorKind, false, undefined, undefined, false, 3, 3, VertexBuffer.UNSIGNED_BYTE, true, true);

            const geometry = new Geometry("geometry1", scene);
            geometry.setVerticesBuffer(vertexBuffer);
            geometry.setIndices([0, 1, 2, 3], 4);

            const result = geometry.getVerticesData(VertexBuffer.ColorKind);
            expect(result).toBeInstanceOf(Float32Array);
            const expectedResult = new Float32Array([0.4, 0.4, 0.4, 0.6, 0.6, 0.6, 0.8, 0.8, 0.8, 1, 1, 1]);
            for (let i = 0; i < data.length; i++) {
                expect(result![i]).toStrictEqual(expectedResult[i]);
            }
        });
    });

    describe("#Geometry copy", () => {
        it("vec3 float position interleaved with vec2 float uv", () => {
            const scene = new Scene(subject);
            const geometry = new Geometry("original", scene);
            geometry.setIndices([0, 1], 2);

            const data = new Float32Array([
                // Vertex 0: position (0, 1, 2) + UV (0.6, 0.7)
                0.0, 1.0, 2.0, 0.6, 0.7,
                // Vertex 1: position (3, 4, 5) + UV (0.8, 0.9)
                3.0, 4.0, 5.0, 0.8, 0.9,
            ]);

            geometry.setVerticesBuffer(new VertexBuffer(subject, data, VertexBuffer.PositionKind, { size: 3, stride: 5, offset: 0 }));
            geometry.setVerticesBuffer(new VertexBuffer(subject, data, VertexBuffer.UVKind, { size: 2, stride: 5, offset: 3 }));

            const copy = geometry.copy("copy");

            // Verify separate buffers with identical values
            [VertexBuffer.PositionKind, VertexBuffer.UVKind].forEach((kind) => {
                expect(copy.getVertexBuffer(kind)?.getBuffer()?.uniqueId).not.toBe(geometry.getVertexBuffer(kind)?.getBuffer()?.uniqueId);
                expect(copy.getVerticesData(kind)).toStrictEqual(geometry.getVerticesData(kind));
            });
        });
    });
});
