import type { DeepImmutable } from "../types";
import type { IVector2Like, IVector3Like, IVector4Like } from "./math.like";

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

export function Vector3SubtractToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>, result: T): T {
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    result.z = a.z - b.z;
    return result;
}

export function Vector3CopyToRef<T extends IVector3Like>(source: DeepImmutable<IVector3Like>, result: T): T {
    result.x = source.x;
    result.y = source.y;
    result.z = source.z;
    return result;
}

export function Vector3LerpToRef<T extends IVector3Like>(start: DeepImmutable<IVector3Like>, end: DeepImmutable<IVector3Like>, amount: number, result: T): T {
    result.x = start.x + (end.x - start.x) * amount;
    result.y = start.y + (end.y - start.y) * amount;
    result.z = start.z + (end.z - start.z) * amount;
    return result;
}

export function Vector3NormalizeToRef<T extends IVector3Like>(vector: DeepImmutable<IVector3Like>, result: T): T {
    const len = Vector3Length(vector);
    if (len === 0) {
        result.x = 0;
        result.y = 0;
        result.z = 0;
    } else {
        result.x = vector.x / len;
        result.y = vector.y / len;
        result.z = vector.z / len;
    }
    return result;
}

/**
 * Computes the signed distance between the specified point and plane.
 * @param origin defines a point on the plane
 * @param normal defines the plane normal (assumes normalized)
 * @param point defines the point to compute the signed distance to
 * @returns the signed distance
 */
export function Vector3SignedDistanceToPlaneFromPositionAndNormal(
    origin: DeepImmutable<IVector3Like>,
    normal: DeepImmutable<IVector3Like>,
    point: DeepImmutable<IVector3Like>
): number {
    return (point.x - origin.x) * normal.x + (point.y - origin.y) * normal.y + (point.z - origin.z) * normal.z;
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
