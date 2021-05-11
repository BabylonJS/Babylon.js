import { PickingInfo } from "../../Collisions";
import { PointerEventTypes, PointerInfo } from "../../Events/pointerEvents";
import { Matrix, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { AbstractMesh } from "../../Meshes";
import { Mesh } from "../../Meshes/mesh";
import { Observer } from "../../Misc/observable";
import { UtilityLayerRenderer } from "../../Rendering";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Behavior } from "../behavior";

/**
 * A behavior that allows a transform node to stick to a surface position/orientation
 */
export class SurfaceMagnetismBehavior implements Behavior<Mesh> {
    private _scene: Scene;
    private _attachedMesh: Nullable<Mesh>;
    private _attachPointLocalOffset: Vector3;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _utilityLayer: UtilityLayerRenderer;

    /**
     * Distance offset from the hit point to place the target at, along the hit normal.
     */
    public hitNormalOffset: number = 0;

    /**
     * Name of the behavior
     */
    public get name(): string {
        return "SurfaceMagnetism";
    }

    /**
     * Spatial mapping meshes to collide with
     */
    public meshes: AbstractMesh[];

    /**
     * Function called when the behavior needs to be initialized (after attaching it to a target)
     */
    public init(): void {}

    /**
     * Attaches the behavior to a transform node
     * @param target defines the target where the behavior is attached to
     */
    public attach(target: Mesh, scene?: Scene, utilityLayer?: UtilityLayerRenderer): void {
        this._attachedMesh = target;
        this._scene = scene || target.getScene();
        this.updateAttachPoint();
        if (utilityLayer) {
            this._utilityLayer = utilityLayer;
            utilityLayer.pickingEnabled = false;
        }
        this._addObservables();
    }
    
    /**
     * Detaches the behavior
     */
    public detach(): void {
        this._attachedMesh = null;
        this._removeObservables();
        this._utilityLayer.pickingEnabled = true;
    }

    /**
     * Collide the attached mesh with meshes of spatial mapping
     * @param ray The ray to collide meshes with
     */
    public collide(pickingInfo: PickingInfo): Nullable<Vector3> {
        if (!this._attachedMesh) {
            return null;
        }

        if (pickingInfo && pickingInfo.hit) {
            const pickedNormal = pickingInfo.getNormal(true, true);
            const pickedPoint = pickingInfo.pickedPoint;

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

    private _addObservables() {
        const pickPredicate = (mesh: AbstractMesh) => {
            return this.meshes.indexOf(mesh) !== -1;
        };

        this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type == PointerEventTypes.POINTERMOVE) {
                if (
                    this._attachedMesh &&
                    pointerInfo.pickInfo &&
                    pointerInfo.pickInfo.hit &&
                    pointerInfo.pickInfo.pickedMesh &&
                    pointerInfo.pickInfo.ray &&
                    pickPredicate(pointerInfo.pickInfo.pickedMesh)
                ) {
                    const pos = this.collide(pointerInfo.pickInfo);
                    if (pos) {
                        this._attachedMesh.position.copyFrom(pos);
                    }
                }
            }

            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                // Release the mesh
                this.detach();
            }
        });
    }

    private _removeObservables() {
        this._scene.onPointerObservable.remove(this._pointerObserver);
        this._pointerObserver = null;
    }
}
