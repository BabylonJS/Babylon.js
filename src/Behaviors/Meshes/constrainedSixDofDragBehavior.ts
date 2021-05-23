import { Quaternion, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import { PivotTools } from "../../Misc/pivotTools";
import { Observer } from "../../Misc/observable";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { BaseSixDofDragBehavior } from "./baseSixDofDragBehavior";
/**
 * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
 *
 */
export class ConstrainedSixDofDragBehavior extends BaseSixDofDragBehavior {
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
    private _projectedPosition: Vector3 = new Vector3();
    private _origin: Vector3 = new Vector3();
    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "ConstrainedSixDofDrag";
    }

    /**
     * Normal of the drag plane
     */
    public dragPlaneNormal: Vector3 = Vector3.Right();

    /**
     * Attaches the scale behavior the passed in mesh
     * @param ownerNode The mesh that will be scaled around once attached
     */
    public attach(ownerNode: Mesh): void {
        super.attach(ownerNode);

        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            var draggedMesh = this._draggedMesh;
            if (this.dragging && this._moving && draggedMesh) {
                // PivotTools._RemoveAndStorePivotPoint(draggedMesh);

                this.onDragObservable.notifyObservers({ position: this._projectedPosition });
                // PivotTools._RestorePivotPoint(draggedMesh);
            }
        });
    }

    protected _targetDragStart(worldPosition: Vector3, worldRotation: Quaternion) {
        this._origin.copyFrom(worldPosition);
    }

    protected _targetUpdated(worldPosition: Vector3, worldRotation: Quaternion) {
        // Project current position on plane
        const toOrigin = TmpVectors.Vector3[0];
        toOrigin.copyFrom(worldPosition).subtractInPlace(this._origin);

        Vector3.TransformCoordinatesToRef(this.dragPlaneNormal, this._ownerNode.getWorldMatrix().getRotationMatrix(), TmpVectors.Vector3[1]);
        TmpVectors.Vector3[1].scaleInPlace(Vector3.Dot(toOrigin, this.dragPlaneNormal));
        toOrigin.subtractToRef(TmpVectors.Vector3[1], this._projectedPosition);
        // TO FIX
        console.log(toOrigin);
        this._projectedPosition.addInPlace(this._origin);
    }

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        super.detach();

        if (this._ownerNode) {
            this._ownerNode.getScene().onBeforeRenderObservable.remove(this._sceneRenderObserver);
        }
    }
}
