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
});
