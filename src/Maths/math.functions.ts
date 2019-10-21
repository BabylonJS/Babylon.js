import { FloatArray, Nullable, IndicesArray } from '../types';
import { Vector2, Vector3 } from './math.vector';

/**
 * Extracts minimum and maximum values from a list of indexed positions
 * @param positions defines the positions to use
 * @param indices defines the indices to the positions
 * @param indexStart defines the start index
 * @param indexCount defines the end index
 * @param bias defines bias value to add to the result
 * @return minimum and maximum values
 */
export function extractMinAndMaxIndexed(positions: FloatArray, indices: IndicesArray, indexStart: number, indexCount: number, bias: Nullable<Vector2> = null): { minimum: Vector3; maximum: Vector3 } {
    var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    for (var index = indexStart; index < indexStart + indexCount; index++) {
        const offset = indices[index] * 3;
        const x = positions[offset];
        const y = positions[offset + 1];
        const z = positions[offset + 2];
        minimum.minimizeInPlaceFromFloats(x, y, z);
        maximum.maximizeInPlaceFromFloats(x, y, z);
    }

    if (bias) {
        minimum.x -= minimum.x * bias.x + bias.y;
        minimum.y -= minimum.y * bias.x + bias.y;
        minimum.z -= minimum.z * bias.x + bias.y;
        maximum.x += maximum.x * bias.x + bias.y;
        maximum.y += maximum.y * bias.x + bias.y;
        maximum.z += maximum.z * bias.x + bias.y;
    }

    return {
        minimum: minimum,
        maximum: maximum
    };
}

/**
 * Extracts minimum and maximum values from a list of positions
 * @param positions defines the positions to use
 * @param start defines the start index in the positions array
 * @param count defines the number of positions to handle
 * @param bias defines bias value to add to the result
 * @param stride defines the stride size to use (distance between two positions in the positions array)
 * @return minimum and maximum values
 */
export function extractMinAndMax(positions: FloatArray, start: number, count: number, bias: Nullable<Vector2> = null, stride?: number): { minimum: Vector3; maximum: Vector3 } {
    var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    if (!stride) {
        stride = 3;
    }

    for (var index = start, offset = start * stride; index < start + count; index++ , offset += stride) {
        const x = positions[offset];
        const y = positions[offset + 1];
        const z = positions[offset + 2];
        minimum.minimizeInPlaceFromFloats(x, y, z);
        maximum.maximizeInPlaceFromFloats(x, y, z);
    }

    if (bias) {
        minimum.x -= minimum.x * bias.x + bias.y;
        minimum.y -= minimum.y * bias.x + bias.y;
        minimum.z -= minimum.z * bias.x + bias.y;
        maximum.x += maximum.x * bias.x + bias.y;
        maximum.y += maximum.y * bias.x + bias.y;
        maximum.z += maximum.z * bias.x + bias.y;
    }

    return {
        minimum: minimum,
        maximum: maximum
    };
}
