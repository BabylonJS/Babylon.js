import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Vector3, Quaternion, Matrix } from "../../Maths/math.vector";
import { Observer } from "../../Misc/observable";
import { PivotTools } from "../../Misc/pivotTools";
import { BaseSixDofDragBehavior } from "./baseSixDofDragBehavior";
/**
 * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
 */
export class SixDofDragBehavior extends BaseSixDofDragBehavior {
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;

    /**
     * The distance towards the target drag position to move each frame. This can be useful to avoid jitter. Set this to 1 for no delay. (Default: 0.2)
     */
    public dragDeltaRatio = 0.2;

    /**
     * If the object should rotate to face the drag origin
     */
    public rotateDraggedObject = true;

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "SixDofDrag";
    }

    /**
     * Attaches the scale behavior the passed in mesh
     * @param ownerNode The mesh that will be scaled around once attached
     */
    public attach(ownerNode: Mesh): void {
        super.attach(ownerNode);

        var tmpQuaternion = new Quaternion();
        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            var pickedMesh = this._draggedMesh;
            if (this.dragging && this._moving && pickedMesh) {
                PivotTools._RemoveAndStorePivotPoint(pickedMesh);
                // Slowly move mesh to avoid jitter
                if (this.ancestorToDrag) {
                    const delta = this._targetPosition.subtract(pickedMesh.absolutePosition).scale(this.dragDeltaRatio);

                    if (this.ancestorToDrag.parent) {
                        Vector3.TransformNormalToRef(delta, Matrix.Invert(this.ancestorToDrag.parent.getWorldMatrix()), delta);
                    }
                    this.ancestorToDrag.position.addInPlace(delta);
                } else {
                    pickedMesh.position.addInPlace(this._targetPosition.subtract(pickedMesh.position).scale(this.dragDeltaRatio));
                }

                if (this.rotateDraggedObject) {
                    // Get change in rotation
                    tmpQuaternion.copyFrom(this._startingOrientation);
                    tmpQuaternion.x = -tmpQuaternion.x;
                    tmpQuaternion.y = -tmpQuaternion.y;
                    tmpQuaternion.z = -tmpQuaternion.z;
                    this._virtualDragMesh.rotationQuaternion!.multiplyToRef(tmpQuaternion, tmpQuaternion);
                    // Convert change in rotation to only y axis rotation
                    Quaternion.RotationYawPitchRollToRef(tmpQuaternion.toEulerAngles("xyz").y, 0, 0, tmpQuaternion);
                    tmpQuaternion.multiplyToRef(this._startingOrientation, tmpQuaternion);
                    // Slowly move mesh to avoid jitter
                    var oldParent = this.ancestorToDrag ? this.ancestorToDrag.parent : pickedMesh.parent;

                    // Only rotate the mesh if it's parent has uniform scaling
                    if (!oldParent || ((oldParent as Mesh).scaling && !(oldParent as Mesh).scaling.isNonUniformWithinEpsilon(0.001))) {
                        if (this.ancestorToDrag) {
                            this.ancestorToDrag.setParent(null);
                            Quaternion.SlerpToRef(this.ancestorToDrag.rotationQuaternion!, tmpQuaternion, this.dragDeltaRatio, this.ancestorToDrag.rotationQuaternion!);
                            this.ancestorToDrag.setParent(oldParent);
                        } else {
                            pickedMesh.setParent(null);
                            Quaternion.SlerpToRef(pickedMesh.rotationQuaternion!, tmpQuaternion, this.dragDeltaRatio, pickedMesh.rotationQuaternion!);
                            pickedMesh.setParent(oldParent);
                        }
                    }
                }
                PivotTools._RestorePivotPoint(pickedMesh);

                this.onDragObservable.notifyObservers();
            }
        });
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
