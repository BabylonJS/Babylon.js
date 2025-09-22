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
    public pitchPoint: Vector3;
    // Changed by the inputs, reset on every frame
    public _perFrameTranslation: Vector3;
    public _perFrameRotation: Vector3;

    // Temp vars
    private _eastTemp: Vector3;
    private _northTemp: Vector3;
    private _upTemp: Vector3;
    private _basisMatrix: Matrix;
    private _pitchRotationAxis: Vector3;
    private _geocentricNormalOfPitchPoint: Vector3;
    private _rotationMatrix: Matrix;

    private _pickingRay: Ray;
    protected _viewMatrix: Matrix;
    protected _lookAtVector: Vector3;

    private _isViewMatrixDirty: boolean;

    public override inputs: GeospatialCameraInputsManager;

    // Minimum distance the camera must be from the globe's surface. Will be configurable in future
    private minHeight: number = 1;

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
        this._resetToDefault();
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel();
    }

    private _resetToDefault(): void {
        this.pitchPoint = new Vector3(0, 0, 0); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection;
        this._lookAtVector = Vector3.Zero().subtractInPlace(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this._geocentricNormalOfPitchPoint = this.pitchPoint.normalizeToNew();
        this._perFrameRotation = Vector3.Zero();
        this._perFrameTranslation = Vector3.Zero();

        this._pitchRotationAxis = new Vector3(1, 0, 0); // starting axis used to calculate pitch rotation matrix
        this._eastTemp = Vector3.Zero();
        this._northTemp = Vector3.Zero();
        this._upTemp = Vector3.Zero();
        this._rotationMatrix = Matrix.Identity();
        this._basisMatrix = Matrix.Identity();
        ComputeLocalBasisToRefs(this.position, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, this._basisMatrix);

        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = this.position.negate().normalize(); // Lookat vector of the camera
        this._viewMatrix = Matrix.Identity();
        this._pickingRay = new Ray(this.position, this._lookAtVector);
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

        // Calculate view matrix with actual position to maintain correct perspective
        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this.position, this.position.add(this._lookAtVector), this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(this.position, this.position.add(this._lookAtVector), this.upVector, this._viewMatrix);
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
        this._pickingRay.origin.copyFrom(this.position);
        this._pickingRay.direction.copyFrom(this._lookAtVector);
        const pickResult = this._scene.pickWithRay(this._pickingRay);
        if (pickResult?.distance != undefined && pickResult.distance > distance + this.minHeight) {
            this._moveCameraAlongVectorByDistance(this._lookAtVector, distance);
        }
    }

    public zoomToCursor(distance: number): void {
        const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        if (pickResult.ray && pickResult.distance > distance + this.minHeight) {
            this._moveCameraAlongVectorByDistance(pickResult.ray.direction, distance);
        }
    }

    private _moveCameraAlongVectorByDistance(vector: Vector3, distance: number) {
        const newPos = TmpVectors.Vector3[6];
        this.position.addToRef(vector.scaleToRef(distance, newPos), newPos);
        this._applyRotationCorrection(newPos);
    }

    /**
     * Applies rotation correction to the camera by calculating a changeOfBasis matrix from the camera's current position to the new position
     * and transforming the lookAt and up vectors by that matrix before updating the camera position and marking the view matrix as dirty
     * @param newPos The camera's desired position which will be used to compute a change of basis matrix to keep the camera oriented correctly
     */
    private _applyRotationCorrection(newPos: Vector3): void {
        // Recompute _basisMatrix based on current camera position
        ComputeLocalBasisToRefs(this.position, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, this._basisMatrix);
        // Calculate basis matrix off of the new position, then apply changeOfBasis to lookAt/up vectors
        const newBasis = TmpVectors.Matrix[6];
        const changeOfBasis = TmpVectors.Matrix[7];

        ComputeLocalBasisToRefs(newPos, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, newBasis);

        // Change of basis matrix = basis2 * basis1.inverse()
        // (since orthonormal, inverse = transpose)
        this._basisMatrix.transposeToRef(changeOfBasis).multiplyToRef(newBasis, changeOfBasis);

        // Apply to vectors
        Vector3.TransformNormalToRef(this._lookAtVector, changeOfBasis, this._lookAtVector);
        Vector3.TransformNormalToRef(this.upVector, changeOfBasis, this.upVector);

        // Apply position change and mark viewMatrix as dirty
        this.position.copyFrom(newPos);
        this._isViewMatrixDirty = true
    }
    /**
     * When the geocentric normal has any translation change (due to dragging), we must ensure the camera remains orbiting around the world origin
     * We thus need to perform 2 correction steps
     * 1. Translation correction that keeps the camera at the same radius as before the drag
     * 2. Rotation correction that keeps the camera facing the globe (so that as we pan, the globe stays centered on screen)
     */
    private _applyTranslation() {
        const newPos = TmpVectors.Vector3[1]; // This will store all of the newPosition calculations and be applied
        this.position.addToRef(this._perFrameTranslation, newPos);

        // 1. Calculate the height correction to keep camera at the same radius when applying translation
        // Determine what camera pos would be if we applied localTranslation, scale that by the cameraRadius, and apply that delta to localTranslation.
        const posDelta = TmpVectors.Vector3[2];
        newPos.normalizeToRef(posDelta).scaleInPlace(this.position.length()); // what would newPos be if it were scaled to same radius as before
        posDelta.subtractInPlace(newPos); // calculate height correction
        newPos.addInPlace(posDelta); // add height correction to newPos

        // 2. Calculate the rotation correction to keep camera facing earth
        this._applyRotationCorrection(newPos);
    }

    private _applyRotation(): void {
        // Normalize key vectors
        this._geocentricNormalOfPitchPoint = this.pitchPoint.normalizeToNew();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        const pitchRotationMatrix = Matrix.Identity();
        const yawRotationMatrix = Matrix.Identity();
        // First apply pitch
        if (this._perFrameRotation.x !== 0) {
            // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
            Vector3.CrossToRef(this.upVector, this._geocentricNormalOfPitchPoint, this._pitchRotationAxis);

            // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
            if (this._pitchRotationAxis.lengthSquared() <= Epsilon) {
                Vector3.CrossToRef(this._lookAtVector, this._geocentricNormalOfPitchPoint, this._pitchRotationAxis);
            }

            const pitchSign = Math.sign(Vector3.Dot(this._geocentricNormalOfPitchPoint, this.upVector)); // If negative, camera is upside down
            // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
            const currentPitch = pitchSign * Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this._geocentricNormalOfPitchPoint), -1, 1));
            const newPitch = Scalar.Clamp(currentPitch + this._perFrameRotation.x, 0, 0.5 * Math.PI - Epsilon);
            // Build rotation matrix around normalized axis
            this._pitchRotationAxis.normalize();
            Matrix.RotationAxisToRef(this._pitchRotationAxis, newPitch - currentPitch, pitchRotationMatrix);
        }

        // Then apply yaw
        if (this._perFrameRotation.y !== 0) {
            Matrix.RotationAxisToRef(this._geocentricNormalOfPitchPoint, this._perFrameRotation.y, yawRotationMatrix); // this axis changes if we aren't using center of screen for tilt
        }
        pitchRotationMatrix.multiplyToRef(yawRotationMatrix, this._rotationMatrix);

        // Offset camera to be (position-pitchPoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then add back the pitchPoint offset
        this.position.subtractInPlace(this.pitchPoint);

        Vector3.TransformCoordinatesToRef(this.position, this._rotationMatrix, this.position);
        Vector3.TransformNormalToRef(this.upVector, this._rotationMatrix, this.upVector);
        Vector3.TransformNormalToRef(this._lookAtVector, this._rotationMatrix, this._lookAtVector);

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

    public override dispose(): void {
        this.inputs.clear();
        super.dispose();
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