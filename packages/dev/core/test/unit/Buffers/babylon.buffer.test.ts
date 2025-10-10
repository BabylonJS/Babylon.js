import { GetTypedArrayData, VertexBuffer } from "core/Buffers";
import { Constants, Engine, NullEngine } from "core/Engines";
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

    describe("GetTypedArrayData", () => {
        it("errors if type is invalid", () => {
            expect(() => GetTypedArrayData(new ArrayBuffer(1), 1, Constants.FLOAT + 1, 0, 1, 1)).toThrow();
        });
        it("errors if requested data is out of range", () => {
            // Missing byte at the end. Should never happen in practice, but just in case.
            const vb = {
                data: new Uint8Array([0, 1, 2]),
                size: 2,
                type: Constants.UNSIGNED_BYTE,
                byteOffset: 0,
                byteStride: 2,
                normalized: false,
                totalVertices: 2,
            };
            // Interleaved + offset, missing byte at the end
            const vb2 = {
                data: new Uint8Array([0, 1, 2, 3, 4]),
                size: 2,
                type: Constants.UNSIGNED_BYTE,
                byteOffset: 1,
                byteStride: 3,
                normalized: false,
                totalVertices: 2,
            };
            expect(() => GetTypedArrayData(vb.data, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices)).toThrow();
            expect(() => GetTypedArrayData(vb2.data, vb2.size, vb2.type, vb2.byteOffset, vb2.byteStride, vb2.totalVertices)).toThrow();
        });
        it("errors if number[] byteStride or byteOffset is not 4-byte aligned", () => {
            const vb = {
                data: [0, 1, 2],
                size: 1,
                type: Constants.UNSIGNED_BYTE,
                normalized: false,
                totalVertices: 2,
            };
            expect(() => GetTypedArrayData([1, 2, 3], vb.size, vb.type, 0, 2, vb.totalVertices)).toThrow();
            expect(() => GetTypedArrayData(vb.data, vb.size, vb.type, 2, 4, vb.totalVertices)).toThrow();
        });
        it("copies when data is an array", () => {
            const data = [0, 1, 2];
            const typedData = GetTypedArrayData(data, 1, Constants.FLOAT, 0, 4, 3);
            expect(typedData.length).toEqual(3);
            expect(data.every((value, index) => value === typedData[index])).toBeTruthy();
            expect(typedData instanceof Float32Array).toBeTruthy();
        });
        it("copies when data is interleaved", () => {
            const vb = {
                data: new Uint8Array([0, 1, 2]),
                size: 1,
                type: Constants.UNSIGNED_BYTE,
                byteOffset: 0,
                byteStride: 2,
                normalized: false,
                totalVertices: 2,
            };
            const typedArray = GetTypedArrayData(vb.data, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);
            expect(typedArray.length).toEqual(2);
            expect(vb.data[0] === typedArray[0]).toBeTruthy();
            expect(vb.data[2] === typedArray[1]).toBeTruthy();
            expect(typedArray.buffer !== vb.data.buffer).toBeTruthy();
        });
        it("copies when adjusted offset is not aligned", () => {
            // Final result should be last 4 bytes, treated as 2 unsigned shorts
            const vb = {
                bytes: new Uint8Array([0, 1, 2, 3, 4]),
                size: 1,
                type: Constants.UNSIGNED_SHORT,
                byteOffset: 1,
                byteStride: 2,
                normalized: false,
                totalVertices: 2,
            };
            // Final result should be last 2 bytes, treated as 1 unsigned short
            const vb2 = {
                bytes: new Uint8Array(vb.bytes.buffer, 1, 4),
                size: 1,
                type: Constants.UNSIGNED_SHORT,
                byteOffset: 2,
                byteStride: 2,
                normalized: false,
                totalVertices: 1,
            };
            const typedArray = GetTypedArrayData(vb.bytes, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);
            const typedArray2 = GetTypedArrayData(vb2.bytes, vb2.size, vb2.type, vb2.byteOffset, vb2.byteStride, vb2.totalVertices);

            expect(typedArray.length).toEqual(2);
            expect(typedArray.buffer !== vb.bytes.buffer).toBeTruthy();
            expect(typedArray instanceof Uint16Array).toBeTruthy();
            expect(typedArray[0]).toEqual((vb.bytes[2] << 8) | vb.bytes[1]);
            expect(typedArray[1]).toEqual((vb.bytes[4] << 8) | vb.bytes[3]);

            expect(typedArray2.length).toEqual(1);
            expect(typedArray2.buffer !== vb2.bytes.buffer).toBeTruthy();
            expect(typedArray instanceof Uint16Array).toBeTruthy();
            expect(typedArray2[0]).toEqual((vb.bytes[4] << 8) | vb.bytes[3]);
        });
        it("does not copy if data is aligned and non-interleaved", () => {
            const vb = {
                data: new Int16Array([-32768, 32767]),
                size: 1,
                type: Constants.SHORT,
                byteOffset: 0,
                byteStride: 2,
                normalized: false,
                totalVertices: 2,
            };
            const typedArray = GetTypedArrayData(vb.data, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);
            expect(typedArray.length).toEqual(2);
            expect(typedArray.every((value, index) => value === vb.data[index])).toBeTruthy();
            expect(typedArray.buffer === vb.data.buffer).toBeTruthy();
        });
        it("preserves float values (within 2 digits)", () => {
            const vb = {
                array: [0.0, 1.234567, 123456.7], // Stored at higher precision than 32-bit float
                size: 1,
                type: Constants.FLOAT,
                byteOffset: 0,
                byteStride: 4,
                normalized: false,
                totalVertices: 3,
            };
            const vbData = Float32Array.from(vb.array);

            const typedArray = GetTypedArrayData(vb.array, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);
            const typedArray2 = GetTypedArrayData(vbData, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);

            expect(typedArray.length).toEqual(3);
            expect(typedArray[0]).toBeCloseTo(vb.array[0]);
            expect(typedArray[1]).toBeCloseTo(vb.array[1]);
            expect(typedArray[2]).toBeCloseTo(vb.array[2]);
            expect(typedArray instanceof Float32Array).toBeTruthy();

            expect(typedArray2.length).toEqual(3);
            expect(typedArray2[0]).toBeCloseTo(vb.array[0]);
            expect(typedArray2[1]).toBeCloseTo(vb.array[1]);
            expect(typedArray2[2]).toBeCloseTo(vb.array[2]);
            expect(typedArray2 instanceof Float32Array).toBeTruthy();
            expect(typedArray2.buffer === vbData.buffer).toBeTruthy();
        });
        it("converts elements of number[] to smaller data type", () => {
            const vb = {
                array: [1, 2, 3, 4],
                size: 1,
                type: Constants.UNSIGNED_BYTE,
                byteOffset: 4,
                byteStride: 4,
                normalized: false,
                totalVertices: 3,
            };

            const typedArray = GetTypedArrayData(vb.array, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);

            expect(typedArray.length).toEqual(3);
            expect(typedArray[0]).toEqual(vb.array[1]);
            expect(typedArray[1]).toEqual(vb.array[2]);
            expect(typedArray[2]).toEqual(vb.array[3]);
            expect(typedArray instanceof Uint8Array).toBeTruthy();
        });
        it("enumerates number[] as 4-byte-aligned data", () => {
            const vb = {
                array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                size: 1,
                type: Constants.FLOAT,
                byteOffset: 0,
                byteStride: 4 * 4,
                normalized: false,
                totalVertices: 3,
            };

            const typedArray = GetTypedArrayData(vb.array, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);

            expect(typedArray.length).toEqual(3);
            expect(typedArray[0]).toEqual(vb.array[0]);
            expect(typedArray[1]).toEqual(vb.array[4]);
            expect(typedArray[2]).toEqual(vb.array[8]);
            expect(typedArray instanceof Float32Array).toBeTruthy();
        });
        it("preserves normalized values in interleaved data", () => {
            const vb = {
                data: new Uint8Array([0, 102, 0, 153, 0, 204]),
                size: 1,
                type: Constants.UNSIGNED_BYTE,
                byteOffset: 1,
                byteStride: 2,
                normalized: true,
                totalVertices: 3,
            };

            const result = GetTypedArrayData(vb.data, vb.size, vb.type, vb.byteOffset, vb.byteStride, vb.totalVertices);
            const expected = new Uint8Array([102, 153, 204]);
            expect(result).toStrictEqual(expected);
        });
    });
});
