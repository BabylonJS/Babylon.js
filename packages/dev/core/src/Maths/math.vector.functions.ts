import { Clamp } from "./math.scalar.functions";
import type { DeepImmutable } from "../types";
import type { IQuaternionLike, IVector2Like, IVector3Like, IVector4Like } from "./math.like";
import { Quaternion, Vector3 } from "./math.vector";

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
export function Vector3Dot(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Computes the squared length of the IVector3Like
 * @param vector the vector to measure
 * @returns the squared length of the vector
 */
export function Vector3LengthSquared(vector: DeepImmutable<IVector3Like>): number {
    return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
}

/**
 * Computes the length of the IVector3Like
 * @param vector the vector to measure
 * @returns the length of the vector
 */
export function Vector3Length(vector: DeepImmutable<IVector3Like>): number {
    return Math.sqrt(Vector3LengthSquared(vector));
}

/**
 * Computes the squared distance between the IVector3Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the squared distance
 */
export function Vector3DistanceSquared(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    const x = b.x - a.x;
    const y = b.y - a.y;
    const z = b.z - a.z;
    return x * x + y * y + z * z;
}

/**
 * Computes the distance between the IVector3Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the distance
 */
export function Vector3Distance(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    return Math.sqrt(Vector3DistanceSquared(a, b));
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
export function Vector3ScaleToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, scale: number, result: T): T {
    result.x = a.x * scale;
    result.y = a.y * scale;
    result.z = a.z * scale;
    return result;
}

/**
 * Scales the current vector values in place by a factor
 * @param vector defines the vector to scale
 * @param scale defines the scale factor
 * @returns the input scaled vector
 */
export function Vector3ScaleInPlace<T extends IVector3Like>(vector: T, scale: number): T {
    vector.x *= scale;
    vector.y *= scale;
    vector.z *= scale;
    return vector;
}

/**
 * Creates a string representation of the IVector3Like
 * @param vector defines the IVector3Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector3Like coordinates.
 */
export function Vector3ToFixed(vector: DeepImmutable<IVector3Like>, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)}}`;
}

/**
 * Computes the dot product of two IVector4Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the dot product
 */
export function Vector4Dot(a: DeepImmutable<IVector4Like>, b: DeepImmutable<IVector4Like>): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

/**
 * Creates a string representation of the IVector4Like
 * @param vector defines the IVector4Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector4Like coordinates.
 */
export function Vector4ToFixed(vector: DeepImmutable<IVector4Like>, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)} W: ${vector.w.toFixed(decimalCount)}}`;
}

/**
 * Returns the angle in radians between two quaternions
 * @param q1 defines the first quaternion
 * @param q2 defines the second quaternion
 * @returns the angle in radians between the two quaternions
 */
export function GetAngleBetweenQuaternions(q1: DeepImmutable<IQuaternionLike>, q2: DeepImmutable<IQuaternionLike>): number {
    return Math.acos(Clamp(Vector4Dot(q1, q2))) * 2;
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
