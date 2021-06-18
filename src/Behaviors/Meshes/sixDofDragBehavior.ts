import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Nullable } from "../../types";
import { Vector3, Quaternion, Matrix, TmpVectors } from "../../Maths/math.vector";
import { Observable, Observer } from "../../Misc/observable";
import { BaseSixDofDragBehavior } from "./baseSixDofDragBehavior";
import { TransformNode } from "../../Meshes/transformNode";
import { Space } from "../../Maths/math.axis";
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
     * Fires when position is updated
     */
    public onPositionChangedObservable = new Observable<{ position: Vector3 }>();

    /**
     * The distance towards the target drag position to move each frame. This can be useful to avoid jitter. Set this to 1 for no delay. (Default: 0.2)
     */
    public dragDeltaRatio = 0.2;

    /**
     * If the object should rotate to face the drag origin
     */
    public rotateDraggedObject = true;

    /**
     * If `rotateDraggedObject` is set to `true`, this parameter determines if we are only rotating around the y axis (yaw)
     */
    public rotateAroundYOnly = false;

    /**
     *  The name of the behavior
     */
    public get name(): string {
        return "SixDofDrag";
    }

    /**
     * Use this flag to update the target but not move the owner node towards the target
     */
    public disableMovement: boolean = false;

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

        // Node that will save the owner's transform
        this._virtualTransformNode = new TransformNode("virtual_sixDof", BaseSixDofDragBehavior._virtualScene);
        this._virtualTransformNode.rotationQuaternion = Quaternion.Identity();

        // On every frame move towards target scaling to avoid jitter caused by vr controllers
        this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
            if (this.currentDraggingPointerIds.length === 1 && this._moving && !this.disableMovement) {
                // 1 pointer only drags mesh
                var oldParent = ownerNode.parent;
                ownerNode.setParent(null);
                ownerNode.position.addInPlace(this._targetPosition.subtract(ownerNode.position).scale(this.dragDeltaRatio));

                this.onPositionChangedObservable.notifyObservers({ position: ownerNode.absolutePosition });

                // Only rotate the mesh if it's parent has uniform scaling
                if (!oldParent || ((oldParent as Mesh).scaling && !(oldParent as Mesh).scaling.isNonUniformWithinEpsilon(0.001))) {
                    Quaternion.SlerpToRef(ownerNode.rotationQuaternion!, this._targetOrientation, this.dragDeltaRatio, ownerNode.rotationQuaternion!);
                }

                ownerNode.setParent(oldParent);
            }
        });
    }

    private _getPositionOffsetAround(transformationLocalOrigin: Vector3, scaling: number, rotation: Quaternion): Vector3 {
        const translationMatrix = TmpVectors.Matrix[0]; // T
        const translationMatrixInv = TmpVectors.Matrix[1]; // T'
        const rotationMatrix = TmpVectors.Matrix[2]; // R
        const scaleMatrix = TmpVectors.Matrix[3]; // S
        const finalMatrix = TmpVectors.Matrix[4]; // T' x R x S x T

        Matrix.TranslationToRef(transformationLocalOrigin.x, transformationLocalOrigin.y, transformationLocalOrigin.z, translationMatrix); // T
        Matrix.TranslationToRef(-transformationLocalOrigin.x, -transformationLocalOrigin.y, -transformationLocalOrigin.z, translationMatrixInv); // T'
        Matrix.FromQuaternionToRef(rotation, rotationMatrix); // R
        Matrix.ScalingToRef(scaling, scaling, scaling, scaleMatrix);
        translationMatrixInv.multiplyToRef(rotationMatrix, finalMatrix); // T' x R
        finalMatrix.multiplyToRef(scaleMatrix, finalMatrix); // T' x R x S
        finalMatrix.multiplyToRef(translationMatrix, finalMatrix); // T' x R x S x T

        return finalMatrix.getTranslation();
    }

    private _onePointerPositionUpdated(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion) {
        let pointerDelta = TmpVectors.Vector3[0];
        pointerDelta.setAll(0);

        if (this.rotateDraggedObject) {
            if (this.rotateAroundYOnly) {
                // Convert change in rotation to only y axis rotation
                Quaternion.RotationYawPitchRollToRef(worldDeltaRotation.toEulerAngles("xyz").y, 0, 0, TmpVectors.Quaternion[0]);
            } else {
                TmpVectors.Quaternion[0].copyFrom(worldDeltaRotation);
            }
            TmpVectors.Quaternion[0].multiplyToRef(this._startingOrientation, this._targetOrientation);
        }

        this._targetPosition.copyFrom(this._startingPosition).addInPlace(worldDeltaPosition);
    }

    private _twoPointersPositionUpdated() {
        const startingPosition0 = this._virtualMeshesInfo[this.currentDraggingPointerIds[0]].startingPosition;
        const startingPosition1 = this._virtualMeshesInfo[this.currentDraggingPointerIds[1]].startingPosition;
        const startingCenter = TmpVectors.Vector3[0];
        startingPosition0.addToRef(startingPosition1, startingCenter);
        startingCenter.scaleInPlace(0.5);
        const startingVector = TmpVectors.Vector3[1];
        startingPosition1.subtractToRef(startingPosition0, startingVector);

        const currentPosition0 = this._virtualMeshesInfo[this.currentDraggingPointerIds[0]].dragMesh.absolutePosition;
        const currentPosition1 = this._virtualMeshesInfo[this.currentDraggingPointerIds[1]].dragMesh.absolutePosition;
        const currentCenter = TmpVectors.Vector3[2];
        currentPosition0.addToRef(currentPosition1, currentCenter);
        currentCenter.scaleInPlace(0.5);
        const currentVector = TmpVectors.Vector3[3];
        currentPosition1.subtractToRef(currentPosition0, currentVector);

        const scaling = currentVector.length() / startingVector.length();
        const translation = currentCenter.subtract(startingCenter);
        const rotationQuaternion = Quaternion.FromEulerAngles(
            0,
            Vector3.GetAngleBetweenVectorsOnPlane(startingVector.normalize(), currentVector.normalize(), Vector3.UpReadOnly),
            0
        );

        const oldParent = this._ownerNode.parent;
        this._ownerNode.setParent(null);

        const positionOffset = this._getPositionOffsetAround(startingCenter.subtract(this._virtualTransformNode.getAbsolutePivotPoint()), scaling, rotationQuaternion);
        this._virtualTransformNode.rotationQuaternion!.multiplyToRef(rotationQuaternion, this._ownerNode.rotationQuaternion!);
        this._virtualTransformNode.scaling.scaleToRef(scaling, this._ownerNode.scaling);
        this._virtualTransformNode.position.addToRef(translation.addInPlace(positionOffset), this._ownerNode.position);
        this.onPositionChangedObservable.notifyObservers({ position: this._ownerNode.position });

        this._ownerNode.setParent(oldParent);
    }

    protected _targetDragStart() {
        const pointerCount = this.currentDraggingPointerIds.length;
        const oldParent = this._ownerNode.parent;

        if (!this._ownerNode.rotationQuaternion) {
            this._ownerNode.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._ownerNode.rotation.y, this._ownerNode.rotation.x, this._ownerNode.rotation.z);
        }
        const worldPivot = this._ownerNode.getAbsolutePivotPoint();
        this._ownerNode.setParent(null);

        if (pointerCount === 1) {
            this._targetPosition.copyFrom(this._ownerNode.position);
            this._targetOrientation.copyFrom(this._ownerNode.rotationQuaternion);
            this._targetScaling.copyFrom(this._ownerNode.scaling);

            if (this.faceCameraOnDragStart && this._scene.activeCamera) {
                const toCamera = TmpVectors.Vector3[0];
                this._scene.activeCamera.position.subtractToRef(worldPivot, toCamera);
                toCamera.normalize();
                const quat = TmpVectors.Quaternion[0];
                if (this._scene.useRightHandedSystem) {
                    Quaternion.FromLookDirectionRHToRef(toCamera, new Vector3(0, 1, 0), quat);
                } else {
                    Quaternion.FromLookDirectionLHToRef(toCamera, new Vector3(0, 1, 0), quat);
                }
                quat.normalize();
                Quaternion.RotationYawPitchRollToRef(quat.toEulerAngles("xyz").y, 0, 0, TmpVectors.Quaternion[0]);
                this._targetOrientation.copyFrom(TmpVectors.Quaternion[0]);
            }
            this._startingPosition.copyFrom(this._targetPosition);
            this._startingOrientation.copyFrom(this._targetOrientation);
            this._startingScaling.copyFrom(this._targetScaling);
        } else if (pointerCount === 2) {
            this._virtualTransformNode.setPivotPoint(new Vector3(0, 0, 0), Space.LOCAL);
            this._virtualTransformNode.position.copyFrom(this._ownerNode.position);
            this._virtualTransformNode.scaling.copyFrom(this._ownerNode.scaling);
            this._virtualTransformNode.rotationQuaternion!.copyFrom(this._ownerNode.rotationQuaternion);
            this._virtualTransformNode.setPivotPoint(worldPivot, Space.WORLD);
            this._resetVirtualMeshesPosition();
        }

        this._ownerNode.setParent(oldParent);
    }

    protected _targetDrag(worldDeltaPosition: Vector3, worldDeltaRotation: Quaternion, pointerId: number) {
        if (this.currentDraggingPointerIds.length === 1) {
            this._onePointerPositionUpdated(worldDeltaPosition, worldDeltaRotation);
        } else if (this.currentDraggingPointerIds.length === 2) {
            this._twoPointersPositionUpdated();
        }
    }

    protected _targetDragEnd() {
        if (this.currentDraggingPointerIds.length === 1) {
            // We still have 1 active pointer, we must simulate a dragstart with a reseted position/orientation
            this._resetVirtualMeshesPosition();
            const previousFaceCameraFlag = this.faceCameraOnDragStart;
            this.faceCameraOnDragStart = false;
            this._targetDragStart();
            this.faceCameraOnDragStart = previousFaceCameraFlag;
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

        if (this._virtualTransformNode) {
            this._virtualTransformNode.dispose();
        }
    }
}
