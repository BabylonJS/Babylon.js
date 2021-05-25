import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Vector3, Quaternion, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Observer } from "../../Misc/observable";
import { PivotTools } from "../../Misc/pivotTools";
import { BaseSixDofDragBehavior } from "./baseSixDofDragBehavior";
import { TransformNode } from "../../Meshes/transformNode";
/**
 * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
 */
export class SixDofDragBehavior extends BaseSixDofDragBehavior {
    private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
    private _virtualTransformNode: TransformNode;

    protected _targetPosition = new Vector3(0, 0, 0);
    protected _targetOrientation = new Quaternion();
    protected _targetScaling = new Vector3(1, 1, 1);
    protected _startingPosition = new Vector3(0, 0, 0);
    protected _startingOrientation = new Quaternion();
    protected _startingScaling = new Vector3(1, 1, 1);

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
    public faceCameraOnDragStart = false;

    /**
     * Attaches the six DoF drag behavior
     * @param ownerNode The mesh that will be dragged around once attached
     */
    public attach(ownerNode: Mesh): void {
        super.attach(ownerNode);
        this._virtualTransformNode = new TransformNode("virtual_sixDof", BaseSixDofDragBehavior._virtualScene);
        this._virtualTransformNode.rotationQuaternion = Quaternion.Identity();

        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            var pickedMesh = this._draggedMesh;
            if (this.currentDraggingPointerIds.length === 1 && this._moving && pickedMesh) {
                // Slowly move mesh to avoid jitter
                PivotTools._RemoveAndStorePivotPoint(pickedMesh);

                if (this.ancestorToDrag) {
                    const delta = this._targetPosition.subtract(this.ancestorToDrag.absolutePosition).scale(this.dragDeltaRatio);
                    if (this.ancestorToDrag.parent) {
                        Vector3.TransformNormalToRef(delta, Matrix.Invert(this.ancestorToDrag.parent.getWorldMatrix()), delta);
                    }
                    this.ancestorToDrag.position.addInPlace(delta);
                    this.onDragObservable.notifyObservers({ position: this.ancestorToDrag.absolutePosition });
                } else {
                    pickedMesh.position.addInPlace(this._targetPosition.subtract(pickedMesh.position).scale(this.dragDeltaRatio));
                    this.onDragObservable.notifyObservers({ position: pickedMesh.absolutePosition });
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
            }
        });
    }

    private _onePointerPositionUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion) {
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

    private _twoPointersPositionUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion, pointerId: number) {
        const arrayIndex = this.currentDraggingPointerIds.indexOf(pointerId);
        const pivotPointer = this.currentDraggingPointerIds[(arrayIndex + 1) % 2];
        const pivotPosition = this._virtualMeshesInfo[pivotPointer].dragMesh.absolutePosition;

        const previousPosition = this._virtualMeshesInfo[pointerId].lastDragPosition;
        const newPosition = this._virtualMeshesInfo[pointerId].dragMesh.absolutePosition;

        const previousVector = TmpVectors.Vector3[0];
        const newVector = TmpVectors.Vector3[1];
        previousPosition.subtractToRef(pivotPosition, previousVector);
        newPosition.subtractToRef(pivotPosition, newVector);
        const scalingDelta = newVector.length() / previousVector.length();
        this._virtualTransformNode.rotateAround(
            this._virtualMeshesInfo[pivotPointer].dragMesh.absolutePosition,
            Vector3.UpReadOnly,
            Vector3.GetAngleBetweenVectorsOnPlane(previousVector.normalize(), newVector.normalize(), Vector3.UpReadOnly)
        );

        this._virtualTransformNode.scaling.scaleInPlace(scalingDelta);

        // TODO interpolate
        const referenceMesh = this.ancestorToDrag ? this.ancestorToDrag : this._ownerNode;
        const oldParent = referenceMesh.parent;
        referenceMesh.setParent(null);
        PivotTools._RemoveAndStorePivotPoint(referenceMesh);

        referenceMesh.position.copyFrom(this._virtualTransformNode.position);
        referenceMesh.rotationQuaternion!.copyFrom(this._virtualTransformNode.rotationQuaternion!);
        referenceMesh.scaling.copyFrom(this._virtualTransformNode.scaling);

        PivotTools._RestorePivotPoint(referenceMesh);
        referenceMesh.setParent(oldParent);
    }

    protected _targetDragStart(worldPosition: Vector3, worldRotation: Quaternion, pointerId: number) {
        const pointerCount = this.currentDraggingPointerIds.length;
        const referenceMesh = this.ancestorToDrag ? this.ancestorToDrag : this._ownerNode;
        const oldParent = referenceMesh.parent;

        if (!referenceMesh.rotationQuaternion) {
            referenceMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(referenceMesh.rotation.y, referenceMesh.rotation.x, referenceMesh.rotation.z);
        }
        referenceMesh.setParent(null);
        PivotTools._RemoveAndStorePivotPoint(referenceMesh);

        this._targetPosition.copyFrom(referenceMesh.absolutePosition);
        this._targetOrientation.copyFrom(referenceMesh.rotationQuaternion!);
        this._targetScaling.copyFrom(referenceMesh.scaling);
        if (this.faceCameraOnDragStart && this._scene.activeCamera && pointerCount === 1) {
            const toCamera = this._scene.activeCamera.position.subtract(this._ownerNode.getAbsolutePivotPoint()).normalize();
            const quat = Quaternion.FromLookDirectionLH(toCamera, new Vector3(0, 1, 0));
            quat.normalize();
            this._targetOrientation.copyFrom(quat);
        }
        this._startingPosition.copyFrom(this._targetPosition);
        this._startingOrientation.copyFrom(this._targetOrientation);
        this._startingScaling.copyFrom(this._targetScaling);

        if (pointerCount === 2) {
            this._virtualTransformNode.position.copyFrom(referenceMesh.absolutePosition);
            this._virtualTransformNode.scaling.copyFrom(referenceMesh.absoluteScaling);
            this._virtualTransformNode.rotationQuaternion!.copyFrom(referenceMesh.absoluteRotationQuaternion);
        }

        PivotTools._RestorePivotPoint(referenceMesh);
        referenceMesh.setParent(oldParent);
    }

    protected _targetUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion, pointerId: number) {
        if (this.currentDraggingPointerIds.length === 1) {
            this._onePointerPositionUpdated(worldDeltaPosition, worldDeltaRotation);
        } else if (this.currentDraggingPointerIds.length === 2) {
            this._twoPointersPositionUpdated(worldDeltaPosition, worldDeltaRotation, pointerId);
        }
    }

    protected _targetDragEnd(pointerId: number) {}

    /**
     *  Detaches the behavior from the mesh
     */
    public detach(): void {
        super.detach();

        if (this._ownerNode) {
            this._ownerNode.getScene().onBeforeRenderObservable.remove(this._sceneRenderObserver);
        }

        this._virtualTransformNode.dispose();
    }
}
