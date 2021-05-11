import { Ray } from "../../Culling";
import { Matrix, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes";
import { Nullable } from "../../types";
import { Behavior } from "../behavior";

/**
 * A behavior that allows a transform node to stick to a surface position/orientation
 */
export class SurfaceMagnetismBehavior implements Behavior<Mesh> {
    private _attachedMesh: Nullable<Mesh>;
    private _attachPointLocalOffset: Vector3;

    /**
     * Distance offset from the hit point to place the target at, along the hit normal.
     */
    public hitNormalOffset: number = 0.1;

    /**
     * Name of the behavior
     */
    public get name(): string {
        return "SurfaceMagnetism";
    }

    /**
     * Spatial mapping meshes to collide with
     */
    public meshes: Mesh[];

    /**
     * Function called when the behavior needs to be initialized (after attaching it to a target)
     */
    public init(): void {}

    /**
     * Attaches the behavior to a transform node
     * @param target defines the target where the behavior is attached to
     */
    public attach(target: Mesh): void {
        this._attachedMesh = target;
        this.updateAttachPoint();
    }

    /**
     * Detaches the behavior
     */
    public detach(): void {
        this._attachedMesh = null;
    }

    /**
     * Collide the attached mesh with meshes of spatial mapping
     * @param ray The ray to collide meshes with
     */
    public collide(ray: Ray) : Nullable<Vector3> {
        if (!this._attachedMesh) {
            return null;
        }

        const pickingInfo = ray.intersectsMeshes(this.meshes);
        if (pickingInfo[0] && pickingInfo[0].hit) {
            const pickedNormal = pickingInfo[0].getNormal(true, true);
            const pickedPoint = pickingInfo[0].pickedPoint;

            if (!pickedNormal || !pickedPoint) {
                return null;
            }
            pickedNormal.normalize();

            const worldTarget = TmpVectors.Vector3[0];
            worldTarget.copyFrom(pickedNormal);
            worldTarget.scaleInPlace(this.hitNormalOffset);
            worldTarget.addInPlace(pickedPoint);

            const worldOffset = TmpVectors.Vector3[1];
            Vector3.TransformNormalToRef(this._attachPointLocalOffset, this._attachedMesh.getWorldMatrix(), worldOffset);

            if (this._attachedMesh.parent) {
                TmpVectors.Matrix[0].copyFrom(this._attachedMesh.parent.getWorldMatrix()).invert();
                Vector3.TransformNormalToRef(worldOffset, TmpVectors.Matrix[0], worldOffset);
            }

            // this._attachedMesh.position.copyFrom(worldTarget).subtractInPlace(worldOffset);
            return worldTarget.subtractInPlace(worldOffset);
        }

        return null;
    }

    /**
     * Updates the attach point with the current geometry extents of the attached mesh
     */
    public updateAttachPoint() {
        this._attachPointLocalOffset = this._getAttachPointOffset();
    }

    private _getAttachPointOffset(): Vector3 {
        if (!this._attachedMesh) {
            return Vector3.Zero();
        }

        const boundingMinMax = this._attachedMesh.getHierarchyBoundingVectors();
        const center = boundingMinMax.max.add(boundingMinMax.min).scaleInPlace(0.5);
        // We max the z coordinate because we want the attach point to be on the back of the mesh
        center.z = boundingMinMax.max.z;
        const centerOffset = Vector3.TransformCoordinates(center, Matrix.Invert(this._attachedMesh.getWorldMatrix()));

        return centerOffset;
    }
}
