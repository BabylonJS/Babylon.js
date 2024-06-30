import type { DataArray } from "../types";
import { VertexBuffer } from "./buffer";

/**
 * Copies the given data array to the given float array.
 * @param input the input data array
 * @param size the number of components
 * @param type the component type
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param normalized whether the data is normalized
 * @param totalVertices number of vertices in the buffer to take into account
 * @param output the output float array
 */
export function CopyFloatData(
    input: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    normalized: boolean,
    totalVertices: number,
    output: Float32Array
): void {
    const tightlyPackedByteStride = size * VertexBuffer.GetTypeByteLength(type);
    const count = totalVertices * size;

    if (output.length !== count) {
        throw new Error("Output length is not valid");
    }

    if (type !== VertexBuffer.FLOAT || byteStride !== tightlyPackedByteStride) {
        VertexBuffer.ForEach(input, byteOffset, byteStride, size, type, count, normalized, (value, index) => (output[index] = value));
        return;
    }

    if (input instanceof Array) {
        const offset = byteOffset / 4;
        output.set(input, offset);
    } else if (input instanceof ArrayBuffer) {
        const floatData = new Float32Array(input, byteOffset, count);
        output.set(floatData);
    } else {
        let offset = input.byteOffset + byteOffset;

        // Protect against bad data
        const remainder = offset % 4;
        if (remainder) {
            offset = Math.max(0, offset - remainder);
        }

        const floatData = new Float32Array(input.buffer, offset, count);
        output.set(floatData);
    }
}
