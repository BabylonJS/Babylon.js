import type { IQuaternionLike } from "../Maths/math.like";
import { Clamp } from "../Maths/math.scalar.functions";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { Vector3Dot, Vector4Dot } from "../Maths/math.vector.functions";
import type { DeepImmutable } from "../types";

// *** NOTE ***
// These functions should ideally go in math.vector.functions.ts, but they require math.vector.ts to
// be imported which is big. To avoid the larger bundle size, they are kept inside flow graph for now.

/**
 * Returns the angle in radians between two quaternions
 * @param q1 defines the first quaternion
 * @param q2 defines the second quaternion
 * @returns the angle in radians between the two quaternions
 */
export function GetAngleBetweenQuaternions(q1: DeepImmutable<IQuaternionLike>, q2: DeepImmutable<IQuaternionLike>): number {
    return Math.acos(Clamp(Vector4Dot(q1, q2), -1, 1)) * 2;
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
