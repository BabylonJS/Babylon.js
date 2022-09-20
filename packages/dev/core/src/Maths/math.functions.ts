import type { FloatArray, Nullable, IndicesArray } from "../types";
import type { Vector2 } from "./math.vector";
import { Vector3 } from "./math.vector";
import { nativeOverride } from "../Misc/decorators";

// This helper class is only here so we can apply the nativeOverride decorator to functions.
class MathHelpers {
    @nativeOverride.filter((...[positions, indices]: Parameters<typeof MathHelpers.extractMinAndMaxIndexed>) => !Array.isArray(positions) && !Array.isArray(indices))
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static extractMinAndMaxIndexed(positions: FloatArray, indices: IndicesArray, indexStart: number, indexCount: number, minimum: Vector3, maximum: Vector3): void {
        for (let index = indexStart; index < indexStart + indexCount; index++) {
            const offset = indices[index] * 3;
            const x = positions[offset];
            const y = positions[offset + 1];
            const z = positions[offset + 2];
            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);
        }
    }

    @nativeOverride.filter((...[positions]: Parameters<typeof MathHelpers.extractMinAndMax>) => !Array.isArray(positions))
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static extractMinAndMax(positions: FloatArray, start: number, count: number, stride: number, minimum: Vector3, maximum: Vector3): void {
        for (let index = start, offset = start * stride; index < start + count; index++, offset += stride) {
            const x = positions[offset];
            const y = positions[offset + 1];
            const z = positions[offset + 2];
            minimum.minimizeInPlaceFromFloats(x, y, z);
            maximum.maximizeInPlaceFromFloats(x, y, z);
        }
    }
}

/**
 * Extracts minimum and maximum values from a list of indexed positions
 * @param positions defines the positions to use
 * @param indices defines the indices to the positions
 * @param indexStart defines the start index
 * @param indexCount defines the end index
 * @param bias defines bias value to add to the result
 * @returns minimum and maximum values
 */
export function extractMinAndMaxIndexed(
    positions: FloatArray,
    indices: IndicesArray,
    indexStart: number,
    indexCount: number,
    bias: Nullable<Vector2> = null
): { minimum: Vector3; maximum: Vector3 } {
    const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    MathHelpers.extractMinAndMaxIndexed(positions, indices, indexStart, indexCount, minimum, maximum);

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
        maximum: maximum,
    };
}

/**
 * Extracts minimum and maximum values from a list of positions
 * @param positions defines the positions to use
 * @param start defines the start index in the positions array
 * @param count defines the number of positions to handle
 * @param bias defines bias value to add to the result
 * @param stride defines the stride size to use (distance between two positions in the positions array)
 * @returns minimum and maximum values
 */
export function extractMinAndMax(positions: FloatArray, start: number, count: number, bias: Nullable<Vector2> = null, stride?: number): { minimum: Vector3; maximum: Vector3 } {
    const minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    if (!stride) {
        stride = 3;
    }

    MathHelpers.extractMinAndMax(positions, start, count, stride, minimum, maximum);

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
        maximum: maximum,
    };
}
