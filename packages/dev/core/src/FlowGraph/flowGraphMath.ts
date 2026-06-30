import { type IQuaternionLike } from "../Maths/math.like";
import { Clamp } from "../Maths/math.scalar.functions";
import { Matrix, Quaternion, Vector2, Vector3 } from "../Maths/math.vector.pure";
import { Vector3Dot, Vector4Dot } from "../Maths/math.vector.functions";
import { type DeepImmutable } from "../types";

// *** NOTE ***
// These functions should ideally go in math.vector.functions.ts, but they require math.vector.ts to
// be imported which is big. To avoid the larger bundle size, they are kept inside flow graph for now.

/**
 * Implementation-defined threshold used by the KHR_interactivity slerp/quatFromUpForward operations
 * to detect near-zero lengths and (anti)parallel vectors.
 */
const SlerpEpsilon = 1e-6;

/**
 * Returns a unit vector perpendicular to the provided vector.
 * @param v the input vector (does not need to be unit length)
 * @returns a unit vector perpendicular to `v`
 */
function GetAnyPerpendicularVector(v: DeepImmutable<Vector3>): Vector3 {
    const absX = Math.abs(v.x);
    const absY = Math.abs(v.y);
    const absZ = Math.abs(v.z);
    // Cross with whichever cardinal axis is least aligned with `v` to avoid a degenerate cross product.
    let other: Vector3;
    if (absX <= absY && absX <= absZ) {
        other = new Vector3(1, 0, 0);
    } else if (absY <= absZ) {
        other = new Vector3(0, 1, 0);
    } else {
        other = new Vector3(0, 0, 1);
    }
    return Vector3.Cross(v, other).normalize();
}

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

/**
 * Spherical linear interpolation between two 2D vectors, as defined by the KHR_interactivity
 * `math/slerp` operation. NaN and infinity values are propagated through the arithmetic.
 * @param a the first vector
 * @param b the second vector
 * @param c the (unclamped) interpolation coefficient
 * @returns the interpolated 2D vector
 */
export function GetVector2Slerp(a: DeepImmutable<Vector2>, b: DeepImmutable<Vector2>, c: number): Vector2 {
    const lengthA = Math.sqrt(a.x * a.x + a.y * a.y);
    const lengthB = Math.sqrt(b.x * b.x + b.y * b.y);
    // If either vector is (close to) zero length the rotation is undefined; fall back to a linear interpolation.
    if (lengthA < SlerpEpsilon || lengthB < SlerpEpsilon) {
        return new Vector2((1 - c) * a.x + c * b.x, (1 - c) * a.y + c * b.y);
    }
    const aHatX = a.x / lengthA;
    const aHatY = a.y / lengthA;
    const bHatX = b.x / lengthB;
    const bHatY = b.y / lengthB;
    let theta = Math.acos(Clamp(aHatX * bHatX + aHatY * bHatY, -1, 1));
    if (aHatX * bHatY - aHatY * bHatX < 0) {
        theta = -theta;
    }
    const length = (1 - c) * lengthA + c * lengthB;
    const cosCTheta = Math.cos(c * theta);
    const sinCTheta = Math.sin(c * theta);
    return new Vector2((aHatX * cosCTheta - aHatY * sinCTheta) * length, (aHatX * sinCTheta + aHatY * cosCTheta) * length);
}

/**
 * Spherical linear interpolation between two 3D vectors, as defined by the KHR_interactivity
 * `math/slerp` operation. NaN and infinity values are propagated through the arithmetic.
 * @param a the first vector
 * @param b the second vector
 * @param c the (unclamped) interpolation coefficient
 * @returns the interpolated 3D vector
 */
export function GetVector3Slerp(a: DeepImmutable<Vector3>, b: DeepImmutable<Vector3>, c: number): Vector3 {
    const lengthA = a.length();
    const lengthB = b.length();
    const lerp = () => new Vector3((1 - c) * a.x + c * b.x, (1 - c) * a.y + c * b.y, (1 - c) * a.z + c * b.z);
    // If either vector is (close to) zero length the rotation is undefined; fall back to a linear interpolation.
    if (lengthA < SlerpEpsilon || lengthB < SlerpEpsilon) {
        return lerp();
    }
    const aHat = new Vector3(a.x / lengthA, a.y / lengthA, a.z / lengthA);
    const bHat = new Vector3(b.x / lengthB, b.y / lengthB, b.z / lengthB);
    const dot = Vector3Dot(aHat, bHat);
    // Parallel vectors share a direction; a linear interpolation already produces the correct result.
    if (dot > 1 - SlerpEpsilon) {
        return lerp();
    }
    let rotationAxis: Vector3;
    if (dot < -1 + SlerpEpsilon) {
        // Anti-parallel vectors: any axis perpendicular to aHat is a valid rotation axis.
        rotationAxis = GetAnyPerpendicularVector(aHat);
    } else {
        rotationAxis = Vector3.Cross(aHat, bHat).normalize();
    }
    const angle = c * Math.acos(Clamp(dot, -1, 1));
    const rotation = Quaternion.RotationAxis(rotationAxis, angle);
    const length = (1 - c) * lengthA + c * lengthB;
    return aHat.applyRotationQuaternion(rotation).scaleInPlace(length);
}

/**
 * Creates a quaternion from the specified up and forward directions, as defined by the
 * KHR_interactivity `math/quatFromUpForward` operation. Both inputs are assumed to be unit length.
 * @param up the up direction
 * @param forward the forward direction
 * @returns the rotation quaternion
 */
export function GetQuaternionFromUpForward(up: DeepImmutable<Vector3>, forward: DeepImmutable<Vector3>): Quaternion {
    const r = new Vector3(forward.x, forward.y, forward.z);
    let s = Vector3.Cross(up, r);
    if (s.lengthSquared() < SlerpEpsilon * SlerpEpsilon) {
        // up and forward are colinear; pick any unit vector perpendicular to forward.
        s = GetAnyPerpendicularVector(r);
    } else {
        s.normalize();
    }
    const t = Vector3.Cross(r, s);
    // Build the rotation matrix with columns s, t and r (Babylon matrices are column-major) and convert it.
    const matrix = Matrix.FromValues(s.x, s.y, s.z, 0, t.x, t.y, t.z, 0, r.x, r.y, r.z, 0, 0, 0, 0, 1);
    return Quaternion.FromRotationMatrix(matrix);
}
