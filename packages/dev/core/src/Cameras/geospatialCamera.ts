import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Scalar, TmpVectors } from "../Maths";
import { Camera } from "./camera";
import { Ray } from "../Culling";

/**
 * @experimental
 * This camera's movements are limited to a camera orbiting a globe, and as the API evolves it will introduce conversions between cartesian coordinates and true lat/long/alt
 *
 * Please note this is marked as experimental and the API (including the constructor!) will change until we remove that flag
 *
 */
export class GeospatialCamera extends Camera {
    // The point on the globe that the pitch/tilt rotations are centered around
    public pitchPoint: Vector3;

    // Changed by the inputs, reset on every frame
    public _perFrameTranslation: Vector3;
    public _perFrameRotation: Vector3;

    // Temp vars
    private _tempNormal: Vector3;
    private _tempRotationAxis: Vector3;
    private _tempRotationMatrix: Matrix;
    private _tempPickingRay: Ray;
    private _tempPosition: Vector3 = new Vector3(0, 0, 0);

    private _viewMatrix: Matrix;
    private _lookAtVector: Vector3;

    private _isViewMatrixDirty: boolean;

    public override inputs: GeospatialCameraInputsManager;

    // Minimum distance the camera must be from the globe's surface. Will be configurable in future
    private _minHeight: number = 1;

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
        this._resetToDefault();
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel();
    }

    private _resetToDefault(): void {
        this._perFrameRotation = Vector3.Zero();
        this._perFrameTranslation = Vector3.Zero();
        this._tempPosition = Vector3.Zero();
        this._tempRotationAxis = Vector3.Right(); // starting axis used to calculate pitch rotation matrix
        this._tempRotationMatrix = Matrix.Identity();
        this._tempNormal = Vector3.Zero();

        // Rotation calculation vars
        this._tempPickingRay = new Ray(this.position, this._lookAtVector);
        const firstPick = this._scene.pickWithRay(this._tempPickingRay); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection;
        this.pitchPoint = firstPick?.pickedPoint || Vector3.Zero();
        this.pitchPoint.normalizeToRef(this._tempNormal);

        // View matrix calculation vars
        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = this.position.negate().normalize(); // Lookat vector of the camera
        this._viewMatrix = Matrix.Identity();
        this._isViewMatrixDirty = true;
    }

    /** @internal */
    public override _getViewMatrix() {
        if (!this._isViewMatrixDirty) {
            return this._viewMatrix;
        }
        this._isViewMatrixDirty = false;

        // Ensure vectors are normalized
        this.upVector.normalize();
        this._lookAtVector.normalize();

        // Calculate view matrix with camera position and target
        this.position.addToRef(this._lookAtVector, this._tempPosition);
        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this.position, this._tempPosition, this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(this.position, this._tempPosition, this.upVector, this._viewMatrix);
        }

        return this._viewMatrix;
    }

    /** @internal */
    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
    }

    /**
     * Move the camera forward/back along the current look vector.
     * @param distance positive = move forward (in direction of vector), negative = move backward
     */
    public zoomAlongLook(distance: number): void {
        this._tempPickingRay.origin.copyFrom(this.position);
        this._tempPickingRay.direction.copyFrom(this._lookAtVector);
        const pickResult = this._scene.pickWithRay(this._tempPickingRay);
        if (pickResult?.distance != undefined && pickResult.distance > distance + this._minHeight) {
            this._moveCameraAlongVectorByDistance(this._lookAtVector, distance);
        }
    }

    public zoomToCursor(distance: number): void {
        const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        if (pickResult.ray && pickResult.distance > distance + this._minHeight) {
            this._moveCameraAlongVectorByDistance(pickResult.ray.direction, distance);
        }
    }

    private _moveCameraAlongVectorByDistance(vector: Vector3, distance: number) {
        vector.scaleAndAddToRef(distance, this._tempPosition);
        this._applyRotationCorrectionAndSetPos(this._tempPosition);
    }

    /**
     * Applies rotation correction to the camera by calculating a changeOfBasis matrix from the camera's current position to the new position
     * and transforming the lookAt and up vectors by that matrix before updating the camera position and marking the view matrix as dirty
     * @param newPos The camera's desired position, before correction is applied
     */
    private _applyRotationCorrectionAndSetPos(newPos: Vector3): void {
        // Compute changeOfBasis between current camera position and new position
        ComputeChangeOfBasisToRef(this.position, newPos, this._tempRotationMatrix);

        // Apply rotation correction to lookat/up vectors
        Vector3.TransformNormalToRef(this._lookAtVector, this._tempRotationMatrix, this._lookAtVector);
        Vector3.TransformNormalToRef(this.upVector, this._tempRotationMatrix, this.upVector);

        // Apply position change and mark viewMatrix as dirty
        this.position.copyFrom(newPos);
        this._isViewMatrixDirty = true;
    }
    /**
     * When the geocentric normal has any translation change (due to dragging), we must ensure the camera remains orbiting around the world origin
     * We thus need to perform 2 correction steps
     * 1. Translation correction that keeps the camera at the same radius as before the drag
     * 2. Rotation correction that keeps the camera facing the globe (so that as we pan, the globe stays centered on screen)
     */
    private _applyTranslation() {
        // Store pending position (without any corrections applied)
        this.position.addToRef(this._perFrameTranslation, this._tempPosition);

        // 1. Calculate the height correction to keep camera at the same radius when applying translation
        const tempPositionScaled = TmpVectors.Vector3[2];
        const offset = TmpVectors.Vector3[3];
        this._tempPosition.normalizeToRef(tempPositionScaled).scaleInPlace(this.position.length()); // what would tempPosition be if it were scaled to same radius as before
        this._tempPosition.subtractToRef(tempPositionScaled, offset); // find offset between tempPosition and the tempScaledPosition
        this._tempPosition.subtractInPlace(offset); // reduce tempPosition by that offset

        // 2. Calculate the rotation correction to keep camera facing globe
        this._applyRotationCorrectionAndSetPos(this._tempPosition);
    }

    private _applyRotation(): void {
        // Normalize key vectors
        this.pitchPoint.normalizeToRef(this._tempNormal);
        this.upVector.normalize();
        this._lookAtVector.normalize();

        const pitchRotationMatrix = Matrix.Identity();
        const yawRotationMatrix = Matrix.Identity();
        // First apply pitch
        if (this._perFrameRotation.x !== 0) {
            // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
            Vector3.CrossToRef(this.upVector, this._tempNormal, this._tempRotationAxis);

            // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
            if (this._tempRotationAxis.lengthSquared() <= Epsilon) {
                Vector3.CrossToRef(this._lookAtVector, this._tempNormal, this._tempRotationAxis);
            }

            const pitchSign = Math.sign(Vector3.Dot(this._tempNormal, this.upVector)); // If negative, camera is upside down
            // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
            const currentPitch = pitchSign * Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this._tempNormal), -1, 1));
            const newPitch = Scalar.Clamp(currentPitch + this._perFrameRotation.x, 0, 0.5 * Math.PI - Epsilon);
            // Build rotation matrix around normalized axis
            Matrix.RotationAxisToRef(this._tempRotationAxis.normalize(), newPitch - currentPitch, pitchRotationMatrix);
        }

        // Then apply yaw
        if (this._perFrameRotation.y !== 0) {
            Matrix.RotationAxisToRef(this._tempNormal, this._perFrameRotation.y, yawRotationMatrix); // this axis changes if we aren't using center of screen for tilt
        }
        pitchRotationMatrix.multiplyToRef(yawRotationMatrix, this._tempRotationMatrix);

        // Offset camera to be (position-pitchPoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then add back the pitchPoint offset
        this.position.subtractInPlace(this.pitchPoint);

        Vector3.TransformCoordinatesToRef(this.position, this._tempRotationMatrix, this.position);
        Vector3.TransformNormalToRef(this.upVector, this._tempRotationMatrix, this.upVector);
        Vector3.TransformNormalToRef(this._lookAtVector, this._tempRotationMatrix, this._lookAtVector);

        this.position.addInPlace(this.pitchPoint);
    }

    /** @internal */
    public override _checkInputs(): void {
        this.inputs.checkInputs();
        if (this._perFrameTranslation.lengthSquared() > 0) {
            this._applyTranslation();
            this._perFrameTranslation.setAll(0);
            this._isViewMatrixDirty = true;
        }
        if (this._perFrameRotation.lengthSquared() > 0) {
            this._applyRotation();
            this._perFrameRotation.setAll(0);
            this._isViewMatrixDirty = true;
        }
        super._checkInputs();
    }

    public override attachControl(noPreventDefault?: boolean): void {
        this.inputs.attachElement(noPreventDefault);
    }

    public override detachControl(): void {
        this.inputs.detachElement();
    }
}

// Helper to build east/north/up basis vectors at a world position
function ComputeLocalBasisToRefs(worldPos: Vector3, refEast: Vector3, refNorth: Vector3, refUp: Vector3) {
    // up = normalized position (geocentric normal)
    refUp.copyFrom(worldPos).normalize();

    // east = normalize(up × worldUp)
    // (cross product of up with world Y gives east except at poles)
    const worldUp = Vector3.Up(); // (0,1,0)
    Vector3.CrossToRef(refUp, worldUp, refEast);

    // at poles, cross with worldForward instead
    if (refEast.lengthSquared() < Epsilon) {
        Vector3.CrossToRef(refUp, Vector3.Forward(), refEast);
    }
    refEast.normalize();

    // north = up × east (completes right-handed basis)
    Vector3.CrossToRef(refUp, refEast, refNorth);
    refNorth.normalize();
}

/**
 * Calculates changeOfBasis matrix from currentPos to newPos and stores it in ref
 * @param currentPos
 * @param newPos
 * @param ref
 * @returns The changeOfBasis matrix from currentPos to newPos
 */
function ComputeChangeOfBasisToRef(currentPos: Vector3, newPos: Vector3, ref: Matrix): Matrix {
    const currentBasis = TmpVectors.Matrix[5];
    const newBasis = TmpVectors.Matrix[6];
    const inverse = TmpVectors.Matrix[7];
    const east = TmpVectors.Vector3[3];
    const north = TmpVectors.Vector3[4];
    const up = TmpVectors.Vector3[5];

    ComputeLocalBasisToRefs(currentPos, east, north, up);
    Matrix.FromXYZAxesToRef(east, north, up, currentBasis);

    ComputeLocalBasisToRefs(newPos, east, north, up);
    Matrix.FromXYZAxesToRef(east, north, up, newBasis);

    // Change of basis matrix = basis2 * basis1.inverse()
    // (since orthonormal, inverse = transpose)
    currentBasis.transposeToRef(inverse).multiplyToRef(newBasis, ref);
    //    newBasis.multiplyToRef(inverse, ref);

    return ref;
}
