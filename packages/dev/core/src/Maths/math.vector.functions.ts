import { Clamp } from "./math.scalar.functions";
import type { DeepImmutable } from "../types";
import type { IVector2Like, IVector3Like } from "./math.like";
import { Quaternion, Vector3 } from "./math.vector";
import type { Vector4 } from "./math.vector";

/**
 * Creates a string representation of the IVector2Like
 * @param vector defines the IVector2Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector2Like coordinates.
 */
export function Vector2ToFixed(vector: IVector2Like, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)}}`;
}

/**
 * Computes the dot product of two IVector3Like objects.
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the dot product
 */
export function Vector3Dot<T extends IVector3Like, U extends IVector3Like>(a: DeepImmutable<T>, b: DeepImmutable<U>) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Sets the given floats into the result.
 * @param x defines the x coordinate
 * @param y defines the y coordinate
 * @param z defines the z coordinate
 * @param result defines the target vector
 * @returns the result vector
 */
export function Vector3FromFloatsToRef<T extends IVector3Like>(x: number, y: number, z: number, result: T): T {
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
}

/**
 * Stores the scaled values of a vector into the result.
 * @param a defines the source vector
 * @param scale defines the scale factor
 * @param result defines the target vector
 * @returns the scaled vector
 */
export function Vector3ScaleToRef<T extends IVector3Like, ResultT extends IVector3Like>(a: DeepImmutable<T>, scale: number, result: ResultT): ResultT {
    result.x = a.x * scale;
    result.y = a.y * scale;
    result.z = a.z * scale;
    return result;
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
export function GetQuaternionFromDirections<T extends Vector3>(a: DeepImmutable<T>, b: DeepImmutable<T>): Quaternion {
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
export function GetQuaternionFromDirectionsToRef<T extends Vector3, ResultT extends Quaternion>(a: DeepImmutable<T>, b: DeepImmutable<T>, result: ResultT): ResultT {
    const axis = Vector3.Cross(a, b);
    const angle = Math.acos(Clamp(Vector3Dot(a, b), -1, 1));
    Quaternion.RotationAxisToRef(axis, angle, result);
    return result;
}
