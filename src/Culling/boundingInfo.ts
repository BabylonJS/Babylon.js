import { DeepImmutable } from "../types";
import { ArrayTools } from "../Misc/arrayTools";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Constants } from "../Engines/constants";
import { BoundingBox } from "./boundingBox";
import { BoundingSphere } from "./boundingSphere";
import { Plane } from '../Maths/math.plane';

declare type Collider = import("../Collisions/collider").Collider;

const _result0 = { min: 0, max: 0 };
const _result1 = { min: 0, max: 0 };
const computeBoxExtents = (axis: DeepImmutable<Vector3>, box: DeepImmutable<BoundingBox>, result: { min: number, max: number }) => {
    const p = Vector3.Dot(box.centerWorld, axis);

    const r0 = Math.abs(Vector3.Dot(box.directions[0], axis)) * box.extendSize.x;
    const r1 = Math.abs(Vector3.Dot(box.directions[1], axis)) * box.extendSize.y;
    const r2 = Math.abs(Vector3.Dot(box.directions[2], axis)) * box.extendSize.z;

    const r = r0 + r1 + r2;
    result.min = p - r;
    result.max = p + r;
};

const axisOverlap = (axis: DeepImmutable<Vector3>, box0: DeepImmutable<BoundingBox>, box1: DeepImmutable<BoundingBox>): boolean => {
    computeBoxExtents(axis, box0, _result0);
    computeBoxExtents(axis, box1, _result1);
    return !(_result0.min > _result1.max || _result1.min > _result0.max);
};

/**
 * Interface for cullable objects
 * @see https://doc.babylonjs.com/babylon101/materials#back-face-culling
 */
export interface ICullable {
    /**
     * Checks if the object or part of the object is in the frustum
     * @param frustumPlanes Camera near/planes
     * @returns true if the object is in frustum otherwise false
     */
    isInFrustum(frustumPlanes: Plane[]): boolean;
    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * Unlike isInFrustum this checks the full bounding box
     * @param frustumPlanes Camera near/planes
     * @returns true if the object is in frustum otherwise false
     */
    isCompletelyInFrustum(frustumPlanes: Plane[]): boolean;
}

/**
 * Info for a bounding data of a mesh
 */
export class BoundingInfo implements ICullable {
    /**
     * Bounding box for the mesh
     */
    public readonly boundingBox: BoundingBox;
    /**
     * Bounding sphere for the mesh
     */
    public readonly boundingSphere: BoundingSphere;

    private _isLocked = false;

    private static readonly TmpVector3 = ArrayTools.BuildArray(2, Vector3.Zero);

    /**
     * Constructs bounding info
     * @param minimum min vector of the bounding box/sphere
     * @param maximum max vector of the bounding box/sphere
     * @param worldMatrix defines the new world matrix
     */
    constructor(minimum: DeepImmutable<Vector3>, maximum: DeepImmutable<Vector3>, worldMatrix?: DeepImmutable<Matrix>) {
        this.boundingBox = new BoundingBox(minimum, maximum, worldMatrix);
        this.boundingSphere = new BoundingSphere(minimum, maximum, worldMatrix);
    }

    /**
     * Recreates the entire bounding info from scratch as if we call the constructor in place
     * @param min defines the new minimum vector (in local space)
     * @param max defines the new maximum vector (in local space)
     * @param worldMatrix defines the new world matrix
     */
    public reConstruct(min: DeepImmutable<Vector3>, max: DeepImmutable<Vector3>, worldMatrix?: DeepImmutable<Matrix>) {
        this.boundingBox.reConstruct(min, max, worldMatrix);
        this.boundingSphere.reConstruct(min, max, worldMatrix);
    }

    /**
     * min vector of the bounding box/sphere
     */
    public get minimum(): Vector3 {
        return this.boundingBox.minimum;
    }

    /**
     * max vector of the bounding box/sphere
     */
    public get maximum(): Vector3 {
        return this.boundingBox.maximum;
    }

    /**
     * If the info is locked and won't be updated to avoid perf overhead
     */
    public get isLocked(): boolean {
        return this._isLocked;
    }

    public set isLocked(value: boolean) {
        this._isLocked = value;
    }

    // Methods
    /**
     * Updates the bounding sphere and box
     * @param world world matrix to be used to update
     */
    public update(world: DeepImmutable<Matrix>) {
        if (this._isLocked) {
            return;
        }
        this.boundingBox._update(world);
        this.boundingSphere._update(world);
    }

    /**
     * Recreate the bounding info to be centered around a specific point given a specific extend.
     * @param center New center of the bounding info
     * @param extend New extend of the bounding info
     * @returns the current bounding info
     */
    public centerOn(center: DeepImmutable<Vector3>, extend: DeepImmutable<Vector3>): BoundingInfo {

        const minimum = BoundingInfo.TmpVector3[0].copyFrom(center).subtractInPlace(extend);
        const maximum = BoundingInfo.TmpVector3[1].copyFrom(center).addInPlace(extend);

        this.boundingBox.reConstruct(minimum, maximum, this.boundingBox.getWorldMatrix());
        this.boundingSphere.reConstruct(minimum, maximum, this.boundingBox.getWorldMatrix());

        return this;
    }

    /**
     * Grows the bounding info to include the given point.
     * @param point The point that will be included in the current bounding info
     * @returns the current bounding info
     */
    public encapsulate(point: Vector3): BoundingInfo {
        const minimum = Vector3.Minimize(this.minimum, point);
        const maximum = Vector3.Maximize(this.maximum, point);
        this.reConstruct(minimum, maximum, this.boundingBox.getWorldMatrix());

        return this;
    }

    /**
     * Grows the bounding info to encapsulate the given bounding info.
     * @param toEncapsulate The bounding info that will be encapsulated in the current bounding info
     * @returns the current bounding info
     */
    public encapsulateBoundingInfo(toEncapsulate: BoundingInfo): BoundingInfo {
        this.encapsulate(toEncapsulate.boundingBox.centerWorld.subtract(toEncapsulate.boundingBox.extendSizeWorld));
        this.encapsulate(toEncapsulate.boundingBox.centerWorld.add(toEncapsulate.boundingBox.extendSizeWorld));

        return this;
    }

    /**
     * Scale the current bounding info by applying a scale factor
     * @param factor defines the scale factor to apply
     * @returns the current bounding info
     */
    public scale(factor: number): BoundingInfo {
        this.boundingBox.scale(factor);
        this.boundingSphere.scale(factor);

        return this;
    }

    /**
     * Returns `true` if the bounding info is within the frustum defined by the passed array of planes.
     * @param frustumPlanes defines the frustum to test
     * @param strategy defines the strategy to use for the culling (default is BABYLON.AbstractMesh.CULLINGSTRATEGY_STANDARD)
     * @returns true if the bounding info is in the frustum planes
     */
    public isInFrustum(frustumPlanes: Array<DeepImmutable<Plane>>, strategy: number = Constants.MESHES_CULLINGSTRATEGY_STANDARD): boolean {
        let inclusionTest = (strategy === Constants.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION || strategy === Constants.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY);
        if (inclusionTest) {
            if (this.boundingSphere.isCenterInFrustum(frustumPlanes)) {
                return true;
            }
        }

        if (!this.boundingSphere.isInFrustum(frustumPlanes)) {
            return false;
        }

        let bSphereOnlyTest = (strategy === Constants.MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY || strategy === Constants.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY);
        if (bSphereOnlyTest) {
            return true;
        }

        return this.boundingBox.isInFrustum(frustumPlanes);
    }

    /**
     * Gets the world distance between the min and max points of the bounding box
     */
    public get diagonalLength(): number {
        const boundingBox = this.boundingBox;
        const diag = boundingBox.maximumWorld.subtractToRef(boundingBox.minimumWorld, BoundingInfo.TmpVector3[0]);
        return diag.length();
    }

    /**
     * Checks if a cullable object (mesh...) is in the camera frustum
     * Unlike isInFrustum this checks the full bounding box
     * @param frustumPlanes Camera near/planes
     * @returns true if the object is in frustum otherwise false
     */
    public isCompletelyInFrustum(frustumPlanes: Array<DeepImmutable<Plane>>): boolean {
        return this.boundingBox.isCompletelyInFrustum(frustumPlanes);
    }
    /** @hidden */
    public _checkCollision(collider: Collider): boolean {
        return collider._canDoCollision(this.boundingSphere.centerWorld, this.boundingSphere.radiusWorld, this.boundingBox.minimumWorld, this.boundingBox.maximumWorld);
    }

    /**
     * Checks if a point is inside the bounding box and bounding sphere or the mesh
     * @see https://doc.babylonjs.com/babylon101/intersect_collisions_-_mesh
     * @param point the point to check intersection with
     * @returns if the point intersects
     */
    public intersectsPoint(point: DeepImmutable<Vector3>): boolean {
        if (!this.boundingSphere.centerWorld) {
            return false;
        }

        if (!this.boundingSphere.intersectsPoint(point)) {
            return false;
        }

        if (!this.boundingBox.intersectsPoint(point)) {
            return false;
        }

        return true;
    }

    /**
     * Checks if another bounding info intersects the bounding box and bounding sphere or the mesh
     * @see https://doc.babylonjs.com/babylon101/intersect_collisions_-_mesh
     * @param boundingInfo the bounding info to check intersection with
     * @param precise if the intersection should be done using OBB
     * @returns if the bounding info intersects
     */
    public intersects(boundingInfo: DeepImmutable<BoundingInfo>, precise: boolean): boolean {
        if (!BoundingSphere.Intersects(this.boundingSphere, boundingInfo.boundingSphere)) {
            return false;
        }

        if (!BoundingBox.Intersects(this.boundingBox, boundingInfo.boundingBox)) {
            return false;
        }

        if (!precise) {
            return true;
        }

        var box0 = this.boundingBox;
        var box1 = boundingInfo.boundingBox;

        if (!axisOverlap(box0.directions[0], box0, box1)) { return false; }
        if (!axisOverlap(box0.directions[1], box0, box1)) { return false; }
        if (!axisOverlap(box0.directions[2], box0, box1)) { return false; }
        if (!axisOverlap(box1.directions[0], box0, box1)) { return false; }
        if (!axisOverlap(box1.directions[1], box0, box1)) { return false; }
        if (!axisOverlap(box1.directions[2], box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[0]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[1]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[0], box1.directions[2]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[0]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[1]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[1], box1.directions[2]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[0]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[1]), box0, box1)) { return false; }
        if (!axisOverlap(Vector3.Cross(box0.directions[2], box1.directions[2]), box0, box1)) { return false; }

        return true;
    }
}
