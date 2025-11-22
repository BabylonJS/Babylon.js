import { serialize, serializeAsVector3, serializeAsMeshReference } from "../Misc/decorators";
import type { Nullable } from "../types";
import { Camera } from "./camera";
import type { Scene } from "../scene";
import { Quaternion, Matrix, Vector3, Vector2, TmpVectors } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import { Axis } from "../Maths/math.axis";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Node } from "../node";

Node.AddNodeConstructor("TargetCamera", (name, scene) => {
    return () => new TargetCamera(name, Vector3.Zero(), scene);
});

// Temporary cache variables to avoid allocations.
const TmpMatrix = Matrix.Zero();
const TmpQuaternion = Quaternion.Identity();

/**
 * A target camera takes a mesh or position as a target and continues to look at it while it moves.
 * This is the base of the follow, arc rotate cameras and Free camera
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
 */
export class TargetCamera extends Camera {
    private static _RigCamTransformMatrix = new Matrix();
    private static _TargetTransformMatrix = new Matrix();
    private static _TargetFocalPoint = new Vector3();

    /**
     * Define the current direction the camera is moving to
     */
    public cameraDirection = new Vector3(0, 0, 0);
    /**
     * Define the current rotation the camera is rotating to
     */
    public cameraRotation = new Vector2(0, 0);

    /**
     * When set, the up vector of the camera will be updated by the rotation of the camera
     */
    @serialize()
    public updateUpVectorFromRotation = false;

    /**
     * Define the current rotation of the camera
     */
    @serializeAsVector3()
    public rotation: Vector3;

    /**
     * Define the current rotation of the camera as a quaternion to prevent Gimbal lock
     */
    public rotationQuaternion: Nullable<Quaternion>;

    /**
     * Define the current speed of the camera
     */
    @serialize()
    public speed = 2.0;

    /**
     * Add constraint to the camera to prevent it to move freely in all directions and
     * around all axis.
     */
    public noRotationConstraint = false;

    /**
     * Reverses mouselook direction to 'natural' panning as opposed to traditional direct
     * panning
     */
    public invertRotation = false;

    /**
     * Speed multiplier for inverse camera panning
     */
    public inverseRotationSpeed = 0.2;

    /**
     * @internal
     * @experimental
     * Can be used to change clamping behavior for inertia. Hook into onBeforeRenderObservable to change the value per-frame
     */
    public _panningEpsilon = Epsilon;
    /**
     * @internal
     * @experimental
     * Can be used to change clamping behavior for inertia. Hook into onBeforeRenderObservable to change the value per-frame
     */
    public _rotationEpsilon = Epsilon;

    /**
     * Define the current target of the camera as an object or a position.
     * Please note that locking a target will disable panning.
     */
    @serializeAsMeshReference("lockedTargetId")
    public lockedTarget: any = null;

    protected readonly _currentTarget = Vector3.Zero();
    protected _initialFocalDistance = 1;
    protected readonly _viewMatrix = Matrix.Zero();

    /** @internal */
    public readonly _cameraTransformMatrix = Matrix.Zero();
    /** @internal */
    public readonly _cameraRotationMatrix = Matrix.Zero();

    protected readonly _referencePoint: Vector3;
    protected readonly _transformedReferencePoint = Vector3.Zero();

    protected readonly _deferredPositionUpdate = new Vector3();
    protected readonly _deferredRotationQuaternionUpdate = new Quaternion();
    protected readonly _deferredRotationUpdate = new Vector3();
    protected _deferredUpdated = false;
    protected _deferOnly: boolean = false;

    /** @internal */
    public _reset: () => void;

    /**
     * Instantiates a target camera that takes a mesh or position as a target and continues to look at it while it moves.
     * This is the base of the follow, arc rotate cameras and Free camera
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
     * @param name Defines the name of the camera in the scene
     * @param position Defines the start position of the camera in the scene
     * @param scene Defines the scene the camera belongs to
     * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
     */
    constructor(name: string, position: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, position, scene, setActiveOnSceneIfNoneActive);

        this._referencePoint = Vector3.Forward(this.getScene().useRightHandedSystem);

        // Set the y component of the rotation to Math.PI in right-handed system for backwards compatibility.
        this.rotation = new Vector3(0, this.getScene().useRightHandedSystem ? Math.PI : 0, 0);
    }

    /**
     * Gets the position in front of the camera at a given distance.
     * @param distance The distance from the camera we want the position to be
     * @returns the position
     */
    public getFrontPosition(distance: number): Vector3 {
        this.getWorldMatrix();
        const worldForward = TmpVectors.Vector3[0];
        const localForward = TmpVectors.Vector3[1];
        localForward.set(0, 0, this._scene.useRightHandedSystem ? -1.0 : 1.0);
        this.getDirectionToRef(localForward, worldForward);
        worldForward.scaleInPlace(distance);
        return this.globalPosition.add(worldForward);
    }

    /** @internal */
    public _getLockedTargetPosition(): Nullable<Vector3> {
        if (!this.lockedTarget) {
            return null;
        }

        if (this.lockedTarget.absolutePosition) {
            const lockedTarget = this.lockedTarget as AbstractMesh;
            const m = lockedTarget.computeWorldMatrix();
            // in some cases the absolute position resets externally, but doesn't update since the matrix is cached.
            m.getTranslationToRef(lockedTarget.absolutePosition);
        }

        return this.lockedTarget.absolutePosition || this.lockedTarget;
    }

    private _storedPosition: Vector3;
    private _storedRotation: Vector3;
    private _storedRotationQuaternion: Nullable<Quaternion>;

    /**
     * Store current camera state of the camera (fov, position, rotation, etc..)
     * @returns the camera
     */
    public override storeState(): Camera {
        this._storedPosition = this.position.clone();
        this._storedRotation = this.rotation.clone();
        if (this.rotationQuaternion) {
            this._storedRotationQuaternion = this.rotationQuaternion.clone();
        }

        return super.storeState();
    }

    /**
     * Restored camera state. You must call storeState() first
     * @returns whether it was successful or not
     * @internal
     */
    public override _restoreStateValues(): boolean {
        if (!super._restoreStateValues()) {
            return false;
        }

        this.position = this._storedPosition.clone();
        this.rotation = this._storedRotation.clone();

        if (this.rotationQuaternion && this._storedRotationQuaternion) {
            this.rotationQuaternion = this._storedRotationQuaternion.clone();
        }

        this.cameraDirection.copyFromFloats(0, 0, 0);
        this.cameraRotation.copyFromFloats(0, 0);

        return true;
    }

    /** @internal */
    public override _initCache() {
        super._initCache();
        this._cache.lockedTarget = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.rotation = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.rotationQuaternion = new Quaternion(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    }

    /**
     * @internal
     */
    public override _updateCache(ignoreParentClass?: boolean): void {
        if (!ignoreParentClass) {
            super._updateCache();
        }

        const lockedTargetPosition = this._getLockedTargetPosition();
        if (!lockedTargetPosition) {
            this._cache.lockedTarget = null;
        } else {
            if (!this._cache.lockedTarget) {
                this._cache.lockedTarget = lockedTargetPosition.clone();
            } else {
                this._cache.lockedTarget.copyFrom(lockedTargetPosition);
            }
        }

        this._cache.rotation.copyFrom(this.rotation);
        if (this.rotationQuaternion) {
            this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
        }
    }

    // Synchronized
    /** @internal */
    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix()) {
            return false;
        }

        const lockedTargetPosition = this._getLockedTargetPosition();

        return (
            (this._cache.lockedTarget ? this._cache.lockedTarget.equals(lockedTargetPosition) : !lockedTargetPosition) &&
            (this.rotationQuaternion ? this.rotationQuaternion.equals(this._cache.rotationQuaternion) : this._cache.rotation.equals(this.rotation))
        );
    }

    // Methods
    /** @internal */
    public _computeLocalCameraSpeed(): number {
        const engine = this.getEngine();
        return this.speed * Math.sqrt(engine.getDeltaTime() / (engine.getFps() * 100.0));
    }

    // Target

    /**
     * Defines the target the camera should look at.
     * @param target Defines the new target as a Vector
     */
    public setTarget(target: Vector3): void {
        this.upVector.normalize();

        this._initialFocalDistance = target.subtract(this.position).length();

        if (this.position.z === target.z) {
            this.position.z += Epsilon;
        }

        this._referencePoint.normalize().scaleInPlace(this._initialFocalDistance);

        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this.position, target, Vector3.UpReadOnly, TmpMatrix);
        } else {
            Matrix.LookAtLHToRef(this.position, target, Vector3.UpReadOnly, TmpMatrix);
        }
        TmpMatrix.invert();

        const rotationQuaternion = this.rotationQuaternion || TmpQuaternion;
        Quaternion.FromRotationMatrixToRef(TmpMatrix, rotationQuaternion);

        rotationQuaternion.toEulerAnglesToRef(this.rotation);

        // Explicitly set z to 0 to match previous behavior.
        this.rotation.z = 0;
    }

    /**
     * Defines the target point of the camera.
     * The camera looks towards it form the radius distance.
     */
    public get target(): Vector3 {
        return this.getTarget();
    }
    public set target(value: Vector3) {
        this.setTarget(value);
    }

    /**
     * Return the current target position of the camera. This value is expressed in local space.
     * @returns the target position
     */
    public getTarget(): Vector3 {
        return this._currentTarget;
    }

    /** @internal */
    public _decideIfNeedsToMove(): boolean {
        return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
    }

    /** @internal */
    public _updatePosition(): void {
        if (this.parent) {
            this.parent.getWorldMatrix().invertToRef(TmpVectors.Matrix[0]);
            Vector3.TransformNormalToRef(this.cameraDirection, TmpVectors.Matrix[0], TmpVectors.Vector3[0]);
            this._deferredPositionUpdate.addInPlace(TmpVectors.Vector3[0]);
            if (!this._deferOnly) {
                this.position.copyFrom(this._deferredPositionUpdate);
            } else {
                this._deferredUpdated = true;
            }
            return;
        }
        this._deferredPositionUpdate.addInPlace(this.cameraDirection);
        if (!this._deferOnly) {
            this.position.copyFrom(this._deferredPositionUpdate);
        } else {
            this._deferredUpdated = true;
        }
    }

    /** @internal */
    public override _checkInputs(): void {
        const directionMultiplier = this.invertRotation ? -this.inverseRotationSpeed : 1.0;
        const needToMove = this._decideIfNeedsToMove();
        const needToRotate = this.cameraRotation.x || this.cameraRotation.y;

        this._deferredUpdated = false;
        this._deferredRotationUpdate.copyFrom(this.rotation);
        this._deferredPositionUpdate.copyFrom(this.position);
        if (this.rotationQuaternion) {
            this._deferredRotationQuaternionUpdate.copyFrom(this.rotationQuaternion);
        }

        // Move
        if (needToMove) {
            this._updatePosition();
        }

        // Rotate
        if (needToRotate) {
            //rotate, if quaternion is set and rotation was used
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toEulerAnglesToRef(this._deferredRotationUpdate);
            }

            this._deferredRotationUpdate.x += this.cameraRotation.x * directionMultiplier;
            this._deferredRotationUpdate.y += this.cameraRotation.y * directionMultiplier;

            // Apply constraints
            if (!this.noRotationConstraint) {
                const limit = 1.570796;

                if (this._deferredRotationUpdate.x > limit) {
                    this._deferredRotationUpdate.x = limit;
                }
                if (this._deferredRotationUpdate.x < -limit) {
                    this._deferredRotationUpdate.x = -limit;
                }
            }

            if (!this._deferOnly) {
                this.rotation.copyFrom(this._deferredRotationUpdate);
            } else {
                this._deferredUpdated = true;
            }

            //rotate, if quaternion is set and rotation was used
            if (this.rotationQuaternion) {
                const len = this._deferredRotationUpdate.lengthSquared();
                if (len) {
                    Quaternion.RotationYawPitchRollToRef(
                        this._deferredRotationUpdate.y,
                        this._deferredRotationUpdate.x,
                        this._deferredRotationUpdate.z,
                        this._deferredRotationQuaternionUpdate
                    );
                    if (!this._deferOnly) {
                        this.rotationQuaternion.copyFrom(this._deferredRotationQuaternionUpdate);
                    } else {
                        this._deferredUpdated = true;
                    }
                }
            }
        }

        const inertialPanningLimit = this.speed * this._panningEpsilon;
        const inertialRotationLimit = this.speed * this._rotationEpsilon;
        // Inertia
        if (needToMove) {
            if (Math.abs(this.cameraDirection.x) < inertialPanningLimit) {
                this.cameraDirection.x = 0;
            }

            if (Math.abs(this.cameraDirection.y) < inertialPanningLimit) {
                this.cameraDirection.y = 0;
            }

            if (Math.abs(this.cameraDirection.z) < inertialPanningLimit) {
                this.cameraDirection.z = 0;
            }

            this.cameraDirection.scaleInPlace(this.inertia);
        }
        if (needToRotate) {
            if (Math.abs(this.cameraRotation.x) < inertialRotationLimit) {
                this.cameraRotation.x = 0;
            }

            if (Math.abs(this.cameraRotation.y) < inertialRotationLimit) {
                this.cameraRotation.y = 0;
            }
            this.cameraRotation.scaleInPlace(this.inertia);
        }

        super._checkInputs();
    }

    protected _updateCameraRotationMatrix() {
        if (this.rotationQuaternion) {
            this.rotationQuaternion.toRotationMatrix(this._cameraRotationMatrix);
        } else {
            Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);
        }
    }

    /**
     * Update the up vector to apply the rotation of the camera (So if you changed the camera rotation.z this will let you update the up vector as well)
     * @returns the current camera
     */
    private _rotateUpVectorWithCameraRotationMatrix(): TargetCamera {
        Vector3.TransformNormalToRef(Vector3.UpReadOnly, this._cameraRotationMatrix, this.upVector);
        return this;
    }

    private _cachedRotationZ = 0;
    private _cachedQuaternionRotationZ = 0;
    /** @internal */
    public override _getViewMatrix(): Matrix {
        if (this.lockedTarget) {
            this.setTarget(this._getLockedTargetPosition()!);
        }

        // Compute
        this._updateCameraRotationMatrix();

        // Apply the changed rotation to the upVector
        if (this.rotationQuaternion && this._cachedQuaternionRotationZ != this.rotationQuaternion.z) {
            this._rotateUpVectorWithCameraRotationMatrix();
            this._cachedQuaternionRotationZ = this.rotationQuaternion.z;
        } else if (this._cachedRotationZ !== this.rotation.z) {
            this._rotateUpVectorWithCameraRotationMatrix();
            this._cachedRotationZ = this.rotation.z;
        }

        Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

        // Computing target and final matrix
        this.position.addToRef(this._transformedReferencePoint, this._currentTarget);
        if (this.updateUpVectorFromRotation) {
            if (this.rotationQuaternion) {
                Axis.Y.rotateByQuaternionToRef(this.rotationQuaternion, this.upVector);
            } else {
                Quaternion.FromEulerVectorToRef(this.rotation, TmpQuaternion);
                Axis.Y.rotateByQuaternionToRef(TmpQuaternion, this.upVector);
            }
        }
        this._computeViewMatrix(this.position, this._currentTarget, this.upVector);
        return this._viewMatrix;
    }

    protected _computeViewMatrix(position: Vector3, target: Vector3, up: Vector3): void {
        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(position, target, up, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(position, target, up, this._viewMatrix);
        }

        if (this.parent) {
            const parentWorldMatrix = this.parent.getWorldMatrix();
            this._viewMatrix.invert();
            this._viewMatrix.multiplyToRef(parentWorldMatrix, this._viewMatrix);
            this._viewMatrix.invert();

            this._markSyncedWithParent();
        }
    }

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override createRigCamera(name: string, cameraIndex: number): Nullable<Camera> {
        if (this.cameraRigMode !== Camera.RIG_MODE_NONE) {
            const rigCamera = new TargetCamera(name, this.position.clone(), this.getScene());
            rigCamera.isRigCamera = true;
            rigCamera.rigParent = this;
            if (this.cameraRigMode === Camera.RIG_MODE_VR) {
                if (!this.rotationQuaternion) {
                    this.rotationQuaternion = new Quaternion();
                }
                rigCamera._cameraRigParams = {};
                rigCamera.rotationQuaternion = new Quaternion();
            }

            rigCamera.mode = this.mode;
            rigCamera.orthoLeft = this.orthoLeft;
            rigCamera.orthoRight = this.orthoRight;
            rigCamera.orthoTop = this.orthoTop;
            rigCamera.orthoBottom = this.orthoBottom;

            return rigCamera;
        }
        return null;
    }

    /**
     * @internal
     */
    public override _updateRigCameras() {
        const camLeft = <TargetCamera>this._rigCameras[0];
        const camRight = <TargetCamera>this._rigCameras[1];

        this.computeWorldMatrix();

        switch (this.cameraRigMode) {
            case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
            case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
            case Camera.RIG_MODE_STEREOSCOPIC_INTERLACED: {
                //provisionnaly using _cameraRigParams.stereoHalfAngle instead of calculations based on _cameraRigParams.interaxialDistance:
                const leftSign = this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED ? 1 : -1;
                const rightSign = this.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED ? -1 : 1;
                this._getRigCamPositionAndTarget(this._cameraRigParams.stereoHalfAngle * leftSign, camLeft);
                this._getRigCamPositionAndTarget(this._cameraRigParams.stereoHalfAngle * rightSign, camRight);
                break;
            }
            case Camera.RIG_MODE_VR:
                if (camLeft.rotationQuaternion && camRight.rotationQuaternion && this.rotationQuaternion) {
                    camLeft.rotationQuaternion.copyFrom(this.rotationQuaternion);
                    camRight.rotationQuaternion.copyFrom(this.rotationQuaternion);
                } else {
                    camLeft.rotation.copyFrom(this.rotation);
                    camRight.rotation.copyFrom(this.rotation);
                }
                camLeft.position.copyFrom(this.position);
                camRight.position.copyFrom(this.position);

                break;
        }
        super._updateRigCameras();
    }

    private _getRigCamPositionAndTarget(halfSpace: number, rigCamera: TargetCamera) {
        const target = this.getTarget();
        target.subtractToRef(this.position, TargetCamera._TargetFocalPoint);

        TargetCamera._TargetFocalPoint.normalize().scaleInPlace(this._initialFocalDistance);
        const newFocalTarget = TargetCamera._TargetFocalPoint.addInPlace(this.position);

        Matrix.TranslationToRef(-newFocalTarget.x, -newFocalTarget.y, -newFocalTarget.z, TargetCamera._TargetTransformMatrix);
        TargetCamera._TargetTransformMatrix.multiplyToRef(Matrix.RotationAxis(rigCamera.upVector, halfSpace), TargetCamera._RigCamTransformMatrix);
        Matrix.TranslationToRef(newFocalTarget.x, newFocalTarget.y, newFocalTarget.z, TargetCamera._TargetTransformMatrix);

        TargetCamera._RigCamTransformMatrix.multiplyToRef(TargetCamera._TargetTransformMatrix, TargetCamera._RigCamTransformMatrix);

        Vector3.TransformCoordinatesToRef(this.position, TargetCamera._RigCamTransformMatrix, rigCamera.position);
        rigCamera.setTarget(newFocalTarget);
    }

    /**
     * Gets the current object class name.
     * @returns the class name
     */
    public override getClassName(): string {
        return "TargetCamera";
    }
}
