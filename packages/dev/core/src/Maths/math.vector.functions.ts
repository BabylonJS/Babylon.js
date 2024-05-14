import { DeepImmutable, FloatArray } from "core/types";
import type { Quaternion, Vector4 } from "./math.vector";
import { Vector2, Vector3, Matrix } from "./math.vector";


/**
 * Creates a string representation of the Vector2
 * @param vector defines the Vector2 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector2 coordinates.
 */
export function Vector2ToFixed(vector: Vector2, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)}}`;
}

/**
 * Creates a string representation of the Vector3
 * @param vector defines the Vector3 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector3 coordinates.
 */
export function Vector3ToFixed(vector: Vector3, decimalCount: number): string {
    return `{X: ${vector._x.toFixed(decimalCount)} Y: ${vector._y.toFixed(decimalCount)} Z: ${vector._z.toFixed(decimalCount)}}`;
}

/**
 * Creates a string representation of the Vector4
 * @param vector defines the Vector4 to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the Vector4 coordinates.
 */
export function Vector4ToFixed(vector: Vector4, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)} W: ${vector.w.toFixed(decimalCount)}}`;
}

/**
 * Creates a new Vector2 from the given Vector3, ommiting the z coordinate.
 * @returns a new Vector2 set from the given Vector3, ommiting the z coordinate.
 */
export function Vector2FromVector3(vector: Vector3): Vector2 {
    return new Vector2(vector._x, vector._y);
}

/**
 * Creates a new Vector3 that gets all its element initialized by the same scalar.
 * @param scalar 
 * @returns a new Vector3 from the given scalar.
 */
export function Vector3FromScalar(scalar: number): Vector3 {
    return new Vector3(scalar, scalar, scalar);
}
/**
 * Creates a new translation matrix that contains a translation by the specified vector.
 * @param vector The vector that contains a translation.
 * @returns a new matrix that translates by the specified vector.
 */
export function TranslationMatrixFromVector3(vector: Vector3): Matrix {
    return Matrix.Translation(vector._x, vector._y, vector._z);
}

/**
 * Creates a new translation matrix that contains a translation by the specified Vector2.
 * The z coordinate is initialized with 0.
 * @param vector 
 * @returns a new matrix containing a translations by vector.x, vector.y, 0.
 */
export function TranslationMatrixFromVector2(vector: Vector2): Matrix {
    return Matrix.Translation(vector.x, vector.y, 0);
}

/**
 * Creates a new matrix that scales all dimensions by the specified scalar.
 * @param scalar 
 * @returns a new scaling matrix that contains a scaling by the specified scalar.
 */
export function ScalingMatrixFromScalar(scalar: number): Matrix {
    return Matrix.Scaling(scalar, scalar, scalar);
}

/**
 * Writes a matrix composed by merging scale (vector3), rotation (quaternion) and translation (vector3)
 * directly to a FloatArray at the given offset.
 * Example Playground - https://playground.babylonjs.com/#AV9X17#25
 * @param scale defines the scale vector3
 * @param rotation defines the rotation quaternion
 * @param translation defines the translation vector3
 * @param array defines the array to write to
 * @param offset defines the offset in the target array where to start storing values
 */
export function ComposeMatrixToArray<T extends Matrix>(scale: DeepImmutable<Vector3>, rotation: DeepImmutable<Quaternion>, translation: DeepImmutable<Vector3>, array: FloatArray, offset: number): void {
    const x = rotation._x,
        y = rotation._y,
        z = rotation._z,
        w = rotation._w;
    const x2 = x + x,
        y2 = y + y,
        z2 = z + z;
    const xx = x * x2,
        xy = x * y2,
        xz = x * z2;
    const yy = y * y2,
        yz = y * z2,
        zz = z * z2;
    const wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    const sx = scale._x,
        sy = scale._y,
        sz = scale._z;

    array[0 + offset] = (1 - (yy + zz)) * sx;
    array[1 + offset] = (xy + wz) * sx;
    array[2 + offset] = (xz - wy) * sx;
    array[3 + offset] = 0;

    array[4 + offset] = (xy - wz) * sy;
    array[5 + offset] = (1 - (xx + zz)) * sy;
    array[6 + offset] = (yz + wx) * sy;
    array[7 + offset] = 0;

    array[8 + offset] = (xz + wy) * sz;
    array[9 + offset] = (yz - wx) * sz;
    array[10 + offset] = (1 - (xx + yy)) * sz;
    array[11 + offset] = 0;

    array[12 + offset] = translation._x;
    array[13 + offset] = translation._y;
    array[14 + offset] = translation._z;
    array[15 + offset] = 1;
}
