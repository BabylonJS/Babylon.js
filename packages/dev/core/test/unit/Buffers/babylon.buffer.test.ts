import { VertexBuffer } from "core/Buffers";
import { Engine, NullEngine } from "core/Engines";
import { CreateBoxVertexData, VertexData } from "core/Meshes";

describe("VertexBuffer", () => {
    describe("instanceDivisor", () => {
        let subject: Engine;
        let boxVertexData: VertexData;

        beforeEach(function () {
            subject = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });

            boxVertexData = CreateBoxVertexData({ size: 1.0 });
        });

        it("should instanceDivisor equal to zero by default", () => {
            const vertexBuffer = new VertexBuffer(subject, boxVertexData.positions!, VertexBuffer.PositionKind, false);
            expect(vertexBuffer.instanceDivisor).toEqual(0);
        });

        it("should change instanceDivisor after setter", () => {
            const vertexBuffer = new VertexBuffer(subject, boxVertexData.positions!, VertexBuffer.PositionKind, false);

            vertexBuffer.instanceDivisor = 42;
            expect(vertexBuffer.instanceDivisor).toEqual(42);

            vertexBuffer.instanceDivisor = 146;
            expect(vertexBuffer.instanceDivisor).toEqual(146);
        });

        it("should compute the hash code after change the instanceDivisor value", () => {
            const vertexBuffer = new VertexBuffer(subject, boxVertexData.positions!, VertexBuffer.PositionKind, false);

            const initialHashCode = vertexBuffer.hashCode;

            vertexBuffer.instanceDivisor = 42;

            const newHashCode = vertexBuffer.hashCode;

            expect(initialHashCode).not.toEqual(newHashCode);
        });

        it("should not compute new hash if the instanceDivisor value did not changed but assigned", () => {
            const vertexBuffer = new VertexBuffer(subject, boxVertexData.positions!, VertexBuffer.PositionKind, false);

            vertexBuffer.instanceDivisor = 42;
            const newHashCode = vertexBuffer.hashCode;

            vertexBuffer.instanceDivisor = 100500;
            const secondNewHashCode = vertexBuffer.hashCode;

            expect(newHashCode).toEqual(secondNewHashCode);

            vertexBuffer.instanceDivisor = 0;
            const finalHashCode = vertexBuffer.hashCode;

            expect(finalHashCode).not.toEqual(secondNewHashCode);
        });

        it("should set is instanced after set the instanceDivisor value", () => {
            const vertexBuffer = new VertexBuffer(subject, boxVertexData.positions!, VertexBuffer.PositionKind, false);

            expect(vertexBuffer.getIsInstanced()).toBeFalsy();

            vertexBuffer.instanceDivisor = 42;

            expect(vertexBuffer.getIsInstanced()).toBeTruthy();

            vertexBuffer.instanceDivisor = 0;

            expect(vertexBuffer.getIsInstanced()).toBeFalsy();
        });
    });
});
