import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Vector3, Quaternion, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Observer } from "../../Misc/observable";
import { PivotTools } from "../../Misc/pivotTools";
import { BaseSixDofDragBehavior } from "./baseSixDofDragBehavior";
/**
 * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
 */
export class SixDofDragBehavior extends BaseSixDofDragBehavior {
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
    protected _targetPosition = new Vector3(0, 0, 0);
    protected _targetOrientation = new Quaternion();
    protected _startingPosition = new Vector3(0, 0, 0);
    protected _startingOrientation = new Quaternion();

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
     * Should the object rotate towards the camera when we start dragging it
     */
    public faceCameraOnDragStart = true;

    /**
     * Attaches the six DoF drag behavior
     * @param ownerNode The mesh that will be dragged around once attached
     */
    public attach(ownerNode: Mesh): void {
        super.attach(ownerNode);

        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            var pickedMesh = this._draggedMesh;
            if (this.dragging && this._moving && pickedMesh) {
                // Slowly move mesh to avoid jitter
                PivotTools._RemoveAndStorePivotPoint(pickedMesh);

                if (this.ancestorToDrag) {
                    const delta = this._targetPosition.subtract(this.ancestorToDrag.absolutePosition).scale(this.dragDeltaRatio);
                    if (this.ancestorToDrag.parent) {
                        Vector3.TransformNormalToRef(delta, Matrix.Invert(this.ancestorToDrag.parent.getWorldMatrix()), delta);
                    }
                    this.ancestorToDrag.position.addInPlace(delta);
                } else {
                    pickedMesh.position.addInPlace(this._targetPosition.subtract(pickedMesh.position).scale(this.dragDeltaRatio));
                }

                var oldParent = this.ancestorToDrag ? this.ancestorToDrag.parent : this._ownerNode.parent;

                // Only rotate the mesh if it's parent has uniform scaling
                if (!oldParent || ((oldParent as Mesh).scaling && !(oldParent as Mesh).scaling.isNonUniformWithinEpsilon(0.001))) {
                    if (this.ancestorToDrag) {
                        this.ancestorToDrag.setParent(null);
                        Quaternion.SlerpToRef(this.ancestorToDrag.rotationQuaternion!, this._targetOrientation, this.dragDeltaRatio, this.ancestorToDrag.rotationQuaternion!);
                        this.ancestorToDrag.setParent(oldParent);
                    } else {
                        this._ownerNode.setParent(null);
                        Quaternion.SlerpToRef(this._ownerNode.rotationQuaternion!, this._targetOrientation, this.dragDeltaRatio, this._ownerNode.rotationQuaternion!);
                        this._ownerNode.setParent(oldParent);
                    }
                }

                PivotTools._RestorePivotPoint(pickedMesh);

                this.onDragObservable.notifyObservers();
            }
        });
    }

    protected _targetDragStart(worldPosition: Vector3, worldRotation: Quaternion) {
        const referenceMesh = this.ancestorToDrag ? this.ancestorToDrag : this._ownerNode;
        const oldParent = referenceMesh.parent;

        if (!referenceMesh.rotationQuaternion) {
            referenceMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(referenceMesh.rotation.y, referenceMesh.rotation.x, referenceMesh.rotation.z);
        }
        referenceMesh.setParent(null);
        this._targetPosition.copyFrom(referenceMesh.absolutePosition);
        this._targetOrientation.copyFrom(referenceMesh.rotationQuaternion!);
        this._startingPosition.copyFrom(this._targetPosition);
        this._startingOrientation.copyFrom(this._targetOrientation);

        if (this.faceCameraOnDragStart && this._scene.activeCamera) {
            const toCamera = this._scene.activeCamera.position.subtract(this._ownerNode.getAbsolutePivotPoint()).normalize();
            const quat = Quaternion.FromLookDirectionLH(toCamera, new Vector3(0, 1, 0));
            quat.normalize();
            this._targetOrientation.copyFrom(quat);
        }

        referenceMesh.setParent(oldParent);
    }

    protected _targetUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion) {
        this._targetPosition.copyFrom(this._startingPosition).addInPlace(worldDeltaPosition);
        if (this._ownerNode.parent && !this.ancestorToDrag) {
            Vector3.TransformCoordinatesToRef(this._targetPosition, Matrix.Invert(this._ownerNode.parent.getWorldMatrix()), this._targetPosition);
        }

        if (this.rotateDraggedObject) {
            // Convert change in rotation to only y axis rotation
            Quaternion.RotationYawPitchRollToRef(worldDeltaRotation.toEulerAngles("xyz").y, 0, 0, TmpVectors.Quaternion[0]);
            TmpVectors.Quaternion[0].multiplyToRef(this._startingOrientation, this._targetOrientation);
        }
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
