import type { DeepImmutable } from "../types";
import { Vector3, Matrix } from "./math.vector";

/**
 * Represents a plane by the equation ax + by + cz + d = 0
 */
export class Plane {
    private static _TmpMatrix = Matrix.Identity();

    /**
     * Normal of the plane (a,b,c)
     */
    public normal: Vector3;
    /**
     * d component of the plane
     */
    public d: number;
    /**
     * Creates a Plane object according to the given floats a, b, c, d and the plane equation : ax + by + cz + d = 0
     * @param a a component of the plane
     * @param b b component of the plane
     * @param c c component of the plane
     * @param d d component of the plane
     */
    constructor(a: number, b: number, c: number, d: number) {
        this.normal = new Vector3(a, b, c);
        this.d = d;
    }

    /**
     * @returns the plane coordinates as a new array of 4 elements [a, b, c, d].
     */
    public asArray(): number[] {
        return [this.normal.x, this.normal.y, this.normal.z, this.d];
    }

    // Methods
    /**
     * @returns a new plane copied from the current Plane.
     */
    public clone(): Plane {
        return new Plane(this.normal.x, this.normal.y, this.normal.z, this.d);
    }
    /**
     * @returns the string "Plane".
     */
    public getClassName(): string {
        return "Plane";
    }
    /**
     * @returns the Plane hash code.
     */
    public getHashCode(): number {
        let hash = this.normal.getHashCode();
        hash = (hash * 397) ^ (this.d | 0);
        return hash;
    }
    /**
     * Normalize the current Plane in place.
     * @returns the updated Plane.
     */
    public normalize(): Plane {
        const norm = Math.sqrt(this.normal.x * this.normal.x + this.normal.y * this.normal.y + this.normal.z * this.normal.z);
        let magnitude = 0.0;

        if (norm !== 0) {
            magnitude = 1.0 / norm;
        }
        this.normal.x *= magnitude;
        this.normal.y *= magnitude;
        this.normal.z *= magnitude;
        this.d *= magnitude;
        return this;
    }
    /**
     * Applies a transformation the plane and returns the result
     * @param transformation the transformation matrix to be applied to the plane
     * @returns a new Plane as the result of the transformation of the current Plane by the given matrix.
     */
    public transform(transformation: DeepImmutable<Matrix>): Plane {
        const invertedMatrix = Plane._TmpMatrix;
        transformation.invertToRef(invertedMatrix);
        const m = invertedMatrix.m;
        const x = this.normal.x;
        const y = this.normal.y;
        const z = this.normal.z;
        const d = this.d;

        const normalX = x * m[0] + y * m[1] + z * m[2] + d * m[3];
        const normalY = x * m[4] + y * m[5] + z * m[6] + d * m[7];
        const normalZ = x * m[8] + y * m[9] + z * m[10] + d * m[11];
        const finalD = x * m[12] + y * m[13] + z * m[14] + d * m[15];

        return new Plane(normalX, normalY, normalZ, finalD);
    }

    /**
     * Compute the dot product between the point and the plane normal
     * @param point point to calculate the dot product with
     * @returns the dot product (float) of the point coordinates and the plane normal.
     */
    public dotCoordinate(point: DeepImmutable<Vector3>): number {
        return this.normal.x * point.x + this.normal.y * point.y + this.normal.z * point.z + this.d;
    }

    /**
     * Updates the current Plane from the plane defined by the three given points.
     * @param point1 one of the points used to construct the plane
     * @param point2 one of the points used to construct the plane
     * @param point3 one of the points used to construct the plane
     * @returns the updated Plane.
     */
    public copyFromPoints(point1: DeepImmutable<Vector3>, point2: DeepImmutable<Vector3>, point3: DeepImmutable<Vector3>): Plane {
        const x1 = point2.x - point1.x;
        const y1 = point2.y - point1.y;
        const z1 = point2.z - point1.z;
        const x2 = point3.x - point1.x;
        const y2 = point3.y - point1.y;
        const z2 = point3.z - point1.z;
        const yz = y1 * z2 - z1 * y2;
        const xz = z1 * x2 - x1 * z2;
        const xy = x1 * y2 - y1 * x2;
        const pyth = Math.sqrt(yz * yz + xz * xz + xy * xy);
        let invPyth;

        if (pyth !== 0) {
            invPyth = 1.0 / pyth;
        } else {
            invPyth = 0.0;
        }

        this.normal.x = yz * invPyth;
        this.normal.y = xz * invPyth;
        this.normal.z = xy * invPyth;
        this.d = -(this.normal.x * point1.x + this.normal.y * point1.y + this.normal.z * point1.z);

        return this;
    }

    /**
     * Checks if the plane is facing a given direction (meaning if the plane's normal is pointing in the opposite direction of the given vector).
     * Note that for this function to work as expected you should make sure that:
     *   - direction and the plane normal are normalized
     *   - epsilon is a number just bigger than -1, something like -0.99 for eg
     * @param direction the direction to check if the plane is facing
     * @param epsilon value the dot product is compared against (returns true if dot <= epsilon)
     * @returns True if the plane is facing the given direction
     */
    public isFrontFacingTo(direction: DeepImmutable<Vector3>, epsilon: number): boolean {
        const dot = Vector3.Dot(this.normal, direction);
        return dot <= epsilon;
    }

    /**
     * Calculates the distance to a point
     * @param point point to calculate distance to
     * @returns the signed distance (float) from the given point to the Plane.
     */
    public signedDistanceTo(point: DeepImmutable<Vector3>): number {
        return Vector3.Dot(point, this.normal) + this.d;
    }

    // Statics
    /**
     * Creates a plane from an  array
     * @param array the array to create a plane from
     * @returns a new Plane from the given array.
     */
    static FromArray(array: DeepImmutable<ArrayLike<number>>): Plane {
        return new Plane(array[0], array[1], array[2], array[3]);
    }
    /**
     * Creates a plane from three points
     * @param point1 point used to create the plane
     * @param point2 point used to create the plane
     * @param point3 point used to create the plane
     * @returns a new Plane defined by the three given points.
     */
    static FromPoints(point1: DeepImmutable<Vector3>, point2: DeepImmutable<Vector3>, point3: DeepImmutable<Vector3>): Plane {
        const result = new Plane(0.0, 0.0, 0.0, 0.0);
        result.copyFromPoints(point1, point2, point3);
        return result;
    }
    /**
     * Creates a plane from an origin point and a normal
     * @param origin origin of the plane to be constructed
     * @param normal normal of the plane to be constructed
     * @returns a new Plane the normal vector to this plane at the given origin point.
     */
    static FromPositionAndNormal(origin: DeepImmutable<Vector3>, normal: Vector3): Plane {
        const plane = new Plane(0.0, 0.0, 0.0, 0.0);
        return this.FromPositionAndNormalToRef(origin, normal, plane);
    }

    /**
     * Updates the given Plane "result" from an origin point and a normal.
     * @param origin origin of the plane to be constructed
     * @param normal the normalized normals of the plane to be constructed
     * @param result defines the Plane where to store the result
     * @returns result input
     */
    static FromPositionAndNormalToRef<T extends Plane>(origin: DeepImmutable<Vector3>, normal: DeepImmutable<Vector3>, result: T): T {
        result.normal.copyFrom(normal);
        result.normal.normalize();
        result.d = -origin.dot(result.normal);
        return result;
    }

    /**
     * Calculates the distance from a plane and a point
     * @param origin origin of the plane to be constructed
     * @param normal normal of the plane to be constructed
     * @param point point to calculate distance to
     * @returns the signed distance between the plane defined by the normal vector at the "origin"" point and the given other point.
     */
    static SignedDistanceToPlaneFromPositionAndNormal(origin: DeepImmutable<Vector3>, normal: DeepImmutable<Vector3>, point: DeepImmutable<Vector3>): number {
        const d = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
        return Vector3.Dot(point, normal) + d;
    }
}
