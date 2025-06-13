import type { DeepImmutable } from "../types";
import { Clamp } from "./math.scalar.functions";
import type { Vector2, Vector4 } from "./math.vector";
import { Quaternion, Vector3 } from "./math.vector";

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
 * Returns the angle in radians between two quaternions
 * @param q1 defines the first quaternion
 * @param q2 defines the second quaternion
 * @returns the angle in radians between the two quaternions
 */
export function GetAngleBetweenQuaternions(q1: DeepImmutable<Quaternion>, q2: DeepImmutable<Quaternion>): number {
    return Math.acos(Clamp(Quaternion.Dot(q1, q2))) * 2;
}

/**
 * Creates a quaternion from two direction vectors
 * @param a defines the first direction vector
 * @param b defines the second direction vector
 * @returns the target quaternion
 */
export function GetQuaternionFromDirections<T extends Vector3>(a: T, b: T): Quaternion {
    const result = new Quaternion();
    GetQuaternionFromDirectionsToRef(a, b, result);
    return result;
}

/**
 * Creates a quaternion from two direction vectors
 * @param a defines the first direction vector
 * @param b defines the second direction vector
 * @param result defines the target quaternion
 * @returns the target quaternion
 */
export function GetQuaternionFromDirectionsToRef<T extends Vector3, ResultT extends Quaternion>(a: T, b: T, result: ResultT): ResultT {
    const axis = Vector3.Cross(a, b);
    const angle = Math.acos(Clamp(Vector3.Dot(a, b), -1, 1));
    Quaternion.RotationAxisToRef(axis, angle, result);
    return result;
}
