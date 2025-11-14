import { Clamp } from "./math.scalar.functions";
import type { DeepImmutable } from "../types";
import type { IQuaternionLike, IVector2Like, IVector3Like, IVector4Like } from "./math.like";

/**
 * Creates a string representation of the IVector2Like
 * @param vector defines the IVector2Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector2Like coordinates.
 */
export function Vector2ToFixed(vector: DeepImmutable<IVector2Like>, decimalCount: number): string {
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
 * Computes the squared length of a vector from its individual components
 * @param x the x component of the vector to measure
 * @param y the y component of the vector to measure
 * @param z the z component of the vector to measure
 * @returns the squared length of the vector
 */
export function Vector3LengthSquaredFromFloats(x: number, y: number, z: number): number {
    return x * x + y * y + z * z;
}

/**
 * Computes the squared length of the IVector3Like
 * @param vector the vector to measure
 * @returns the squared length of the vector
 */
export function Vector3LengthSquared(vector: DeepImmutable<IVector3Like>): number {
    return Vector3LengthSquaredFromFloats(vector.x, vector.y, vector.z);
}

/**
 * Computes the length of a vector from its individual components
 * @param x the x component of the vector to measure
 * @param y the y component of the vector to measure
 * @param z the z component of the vector to measure
 * @returns the length of the vector
 */
export function Vector3LengthFromFloats(x: number, y: number, z: number): number {
    return Math.sqrt(Vector3LengthSquaredFromFloats(x, y, z));
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
 * @param result defines the result vector
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
 * @param result defines the result vector
 * @returns the scaled vector
 */
export function Vector3ScaleToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, scale: number, result: T): T {
    result.x = a.x * scale;
    result.y = a.y * scale;
    result.z = a.z * scale;
    return result;
}

/**
 * Scales the current vector values in place by a factor.
 * @param vector defines the vector to scale
 * @param scale defines the scale factor
 * @returns the scaled vector
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
 * Creates a rotation quaternion from an axis and an angle
 * @param axis defines the axis to use
 * @param angle defines the angle (in radians) to use
 * @param result defines the target quaternion
 * @returns the target quaternion
 */
export function QuaternionRotationAxisFromFloatsToRef<T extends IQuaternionLike>(axisX: number, axisY: number, axisZ: number, angle: number, result: T): T {
    result._w = Math.cos(angle / 2);
    const sinByLength = Math.sin(angle / 2) / Vector3LengthFromFloats(axisX, axisY, axisZ);
    result._x = axisX * sinByLength;
    result._y = axisY * sinByLength;
    result._z = axisZ * sinByLength;
    result._isDirty = true;
    return result;
}

/**
 * Creates a rotation quaternion from an axis and an angle
 * @param axis defines the axis to use
 * @param angle defines the angle (in radians) to use
 * @param result defines the target quaternion
 * @returns the target quaternion
 */
export function QuaternionRotationAxisToRef<T extends IQuaternionLike>(axis: DeepImmutable<IVector3Like>, angle: number, result: T): T {
    return QuaternionRotationAxisFromFloatsToRef(axis.x, axis.y, axis.z, angle, result);
}

/**
 * Creates a quaternion from two direction vectors
 * @param a defines the first direction vector
 * @param b defines the second direction vector
 * @param result defines the target quaternion
 * @returns the target quaternion
 */
export function GetQuaternionFromDirectionsToRef<T extends IVector3Like, ResultT extends IQuaternionLike>(a: DeepImmutable<T>, b: DeepImmutable<T>, result: ResultT): ResultT {
    // Compute cross product
    const axisX = a.y * b.z - a.z * b.y;
    const axisY = a.z * b.x - a.x * b.z;
    const axisZ = a.x * b.y - a.y * b.x;

    const angle = Math.acos(Clamp(Vector3Dot(a, b), -1, 1));

    QuaternionRotationAxisFromFloatsToRef(axisX, axisY, axisZ, angle, result);
    return result;
}
