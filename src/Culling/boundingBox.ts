import { DeepImmutable } from "../types";
import { ArrayTools } from "../Misc/arrayTools";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { BoundingSphere } from "../Culling/boundingSphere";

import { ICullable } from "./boundingInfo";
import { Epsilon } from '../Maths/math.constants';
import { Plane } from '../Maths/math.plane';

/**
 * Class used to store bounding box information
 */
export class BoundingBox implements ICullable {
    /**
     * Gets the 8 vectors representing the bounding box in local space
     */
    public readonly vectors: Vector3[] = ArrayTools.BuildArray(8, Vector3.Zero);
    /**
     * Gets the center of the bounding box in local space
     */
    public readonly center: Vector3 = Vector3.Zero();
    /**
     * Gets the center of the bounding box in world space
     */
    public readonly centerWorld: Vector3 = Vector3.Zero();
    /**
     * Gets the extend size in local space
     */
    public readonly extendSize: Vector3 = Vector3.Zero();
    /**
     * Gets the extend size in world space
     */
    public readonly extendSizeWorld: Vector3 = Vector3.Zero();
    /**
     * Gets the OBB (object bounding box) directions
     */
    public readonly directions: Vector3[] = ArrayTools.BuildArray(3, Vector3.Zero);
    /**
     * Gets the 8 vectors representing the bounding box in world space
     */
    public readonly vectorsWorld: Vector3[] = ArrayTools.BuildArray(8, Vector3.Zero);
    /**
     * Gets the minimum vector in world space
     */
    public readonly minimumWorld: Vector3 = Vector3.Zero();
    /**
     * Gets the maximum vector in world space
     */
    public readonly maximumWorld: Vector3 = Vector3.Zero();
    /**
     * Gets the minimum vector in local space
     */
    public readonly minimum: Vector3 = Vector3.Zero();
    /**
     * Gets the maximum vector in local space
     */
    public readonly maximum: Vector3 = Vector3.Zero();

    private _worldMatrix: DeepImmutable<Matrix>;
    private static readonly TmpVector3 = ArrayTools.BuildArray(3, Vector3.Zero);

    /**
     * @hidden
     */
    public _tag: number;

    /**
     * Creates a new bounding box
     * @param min defines the minimum vector (in local space)
     * @param max defines the maximum vector (in local space)
     * @param worldMatrix defines the new world matrix
     */
    constructor(min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>, worldMatrix?: DeepImmutable<Matrix>) {
        this.reConstruct(min, max, worldMatrix);
    }

    // Methods

    /**
     * Recreates the entire bounding box from scratch as if we call the constructor in place
     * @param min defines the new minimum vector (in local space)
     * @param max defines the new maximum vector (in local space)
     * @param worldMatrix defines the new world matrix
     */
    public reConstruct(min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>, worldMatrix?: DeepImmutable<Matrix>) {
        const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
        const vectors = this.vectors;

        this.minimum.copyFromFloats(minX, minY, minZ);
        this.maximum.copyFromFloats(maxX, maxY, maxZ);
        vectors[0].copyFromFloats(minX, minY, minZ);
        vectors[1].copyFromFloats(maxX, maxY, maxZ);
        vectors[2].copyFromFloats(maxX, minY, minZ);
        vectors[3].copyFromFloats(minX, maxY, minZ);
        vectors[4].copyFromFloats(minX, minY, maxZ);
        vectors[5].copyFromFloats(maxX, maxY, minZ);
        vectors[6].copyFromFloats(minX, maxY, maxZ);
        vectors[7].copyFromFloats(maxX, minY, maxZ);

        // OBB
        max.addToRef(min, this.center).scaleInPlace(0.5);
        max.subtractToRef(min, this.extendSize).scaleInPlace(0.5);

        this._worldMatrix = worldMatrix || Matrix.IdentityReadOnly;

        this._update(this._worldMatrix);
    }

    /**
     * Scale the current bounding box by applying a scale factor
     * @param factor defines the scale factor to apply
     * @returns the current bounding box
     */
    public scale(factor: number): BoundingBox {
        const tmpVectors = BoundingBox.TmpVector3;
        const diff = this.maximum.subtractToRef(this.minimum, tmpVectors[0]);
        const len = diff.length();
        diff.normalizeFromLength(len);
        const distance = len * factor;
        const newRadius = diff.scaleInPlace(distance * 0.5);

        const min = this.center.subtractToRef(newRadius, tmpVectors[1]);
        const max = this.center.addToRef(newRadius, tmpVectors[2]);

        this.reConstruct(min, max, this._worldMatrix);

        return this;
    }

    /**
     * Gets the world matrix of the bounding box
     * @returns a matrix
     */
    public getWorldMatrix(): DeepImmutable<Matrix> {
        return this._worldMatrix;
    }

    /** @hidden */
    public _update(world: DeepImmutable<Matrix>): void {
        const minWorld = this.minimumWorld;
        const maxWorld = this.maximumWorld;
        const directions = this.directions;
        const vectorsWorld = this.vectorsWorld;
        const vectors = this.vectors;

        if (!world.isIdentity()) {
            minWorld.setAll(Number.MAX_VALUE);
            maxWorld.setAll(-Number.MAX_VALUE);

            for (let index = 0; index < 8; ++index) {
                const v = vectorsWorld[index];
                Vector3.TransformCoordinatesToRef(vectors[index], world, v);
                minWorld.minimizeInPlace(v);
                maxWorld.maximizeInPlace(v);
            }

            // Extend
            maxWorld.subtractToRef(minWorld, this.extendSizeWorld).scaleInPlace(0.5);
            maxWorld.addToRef(minWorld, this.centerWorld).scaleInPlace(0.5);
        }
        else {
            minWorld.copyFrom(this.minimum);
            maxWorld.copyFrom(this.maximum);
            for (let index = 0; index < 8; ++index) {
                vectorsWorld[index].copyFrom(vectors[index]);
            }

            // Extend
            this.extendSizeWorld.copyFrom(this.extendSize);
            this.centerWorld.copyFrom(this.center);
        }

        Vector3.FromArrayToRef(world.m, 0, directions[0]);
        Vector3.FromArrayToRef(world.m, 4, directions[1]);
        Vector3.FromArrayToRef(world.m, 8, directions[2]);

        this._worldMatrix = world;
    }

    /**
     * Tests if the bounding box is intersecting the frustum planes
     * @param frustumPlanes defines the frustum planes to test
     * @returns true if there is an intersection
     */
    public isInFrustum(frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
        return BoundingBox.IsInFrustum(this.vectorsWorld, frustumPlanes);
    }

    /**
     * Tests if the bounding box is entirely inside the frustum planes
     * @param frustumPlanes defines the frustum planes to test
     * @returns true if there is an inclusion
     */
    public isCompletelyInFrustum(frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
        return BoundingBox.IsCompletelyInFrustum(this.vectorsWorld, frustumPlanes);
    }

    /**
     * Tests if a point is inside the bounding box
     * @param point defines the point to test
     * @returns true if the point is inside the bounding box
     */
    public intersectsPoint(point: DeepImmutable<Vector3>): boolean {
        const min = this.minimumWorld;
        const max = this.maximumWorld;
        const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
        const pointX = point.x, pointY = point.y, pointZ = point.z;
        var delta = -Epsilon;

        if (maxX - pointX < delta || delta > pointX - minX) {
            return false;
        }

        if (maxY - pointY < delta || delta > pointY - minY) {
            return false;
        }

        if (maxZ - pointZ < delta || delta > pointZ - minZ) {
            return false;
        }

        return true;
    }

    /**
     * Tests if the bounding box intersects with a bounding sphere
     * @param sphere defines the sphere to test
     * @returns true if there is an intersection
     */
    public intersectsSphere(sphere: DeepImmutable<BoundingSphere>): boolean {
        return BoundingBox.IntersectsSphere(this.minimumWorld, this.maximumWorld, sphere.centerWorld, sphere.radiusWorld);
    }

    /**
     * Tests if the bounding box intersects with a box defined by a min and max vectors
     * @param min defines the min vector to use
     * @param max defines the max vector to use
     * @returns true if there is an intersection
     */
    public intersectsMinMax(min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>): boolean {
        const myMin = this.minimumWorld;
        const myMax = this.maximumWorld;
        const myMinX = myMin.x, myMinY = myMin.y, myMinZ = myMin.z, myMaxX = myMax.x, myMaxY = myMax.y, myMaxZ = myMax.z;
        const minX = min.x, minY = min.y, minZ = min.z, maxX = max.x, maxY = max.y, maxZ = max.z;
        if (myMaxX < minX || myMinX > maxX) {
            return false;
        }

        if (myMaxY < minY || myMinY > maxY) {
            return false;
        }

        if (myMaxZ < minZ || myMinZ > maxZ) {
            return false;
        }

        return true;
    }

    // Statics

    /**
     * Tests if two bounding boxes are intersections
     * @param box0 defines the first box to test
     * @param box1 defines the second box to test
     * @returns true if there is an intersection
     */
    public static Intersects(box0: DeepImmutable<BoundingBox>, box1: DeepImmutable<BoundingBox>): boolean {
        return box0.intersectsMinMax(box1.minimumWorld, box1.maximumWorld);
    }

    /**
     * Tests if a bounding box defines by a min/max vectors intersects a sphere
     * @param minPoint defines the minimum vector of the bounding box
     * @param maxPoint defines the maximum vector of the bounding box
     * @param sphereCenter defines the sphere center
     * @param sphereRadius defines the sphere radius
     * @returns true if there is an intersection
     */
    public static IntersectsSphere(minPoint: DeepImmutable<Vector3>, maxPoint: DeepImmutable<Vector3>, sphereCenter: DeepImmutable<Vector3>, sphereRadius: number): boolean {
        const vector = BoundingBox.TmpVector3[0];
        Vector3.ClampToRef(sphereCenter, minPoint, maxPoint, vector);
        var num = Vector3.DistanceSquared(sphereCenter, vector);
        return (num <= (sphereRadius * sphereRadius));
    }

    /**
     * Tests if a bounding box defined with 8 vectors is entirely inside frustum planes
     * @param boundingVectors defines an array of 8 vectors representing a bounding box
     * @param frustumPlanes defines the frustum planes to test
     * @return true if there is an inclusion
     */
    public static IsCompletelyInFrustum(boundingVectors: Array<DeepImmutable<Vector3>>, frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
        for (var p = 0; p < 6; ++p) {
            const frustumPlane = frustumPlanes[p];
            for (var i = 0; i < 8; ++i) {
                if (frustumPlane.dotCoordinate(boundingVectors[i]) < 0) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Tests if a bounding box defined with 8 vectors intersects frustum planes
     * @param boundingVectors defines an array of 8 vectors representing a bounding box
     * @param frustumPlanes defines the frustum planes to test
     * @return true if there is an intersection
     */
    public static IsInFrustum(boundingVectors: Array<DeepImmutable<Vector3>>, frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
        for (var p = 0; p < 6; ++p) {
            let canReturnFalse = true;
            const frustumPlane = frustumPlanes[p];
            for (var i = 0; i < 8; ++i) {
                if (frustumPlane.dotCoordinate(boundingVectors[i]) >= 0) {
                    canReturnFalse = false;
                    break;
                }
            }
            if (canReturnFalse) {
                return false;
            }
        }
        return true;
    }
}
