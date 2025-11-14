import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import { Scalar } from "../Maths/math.scalar";
import { Camera } from "./camera";
import type { Scene } from "../scene";
import type { MeshPredicate, Ray } from "../Culling/ray.core";
import { GeospatialCameraMovement } from "./geospatialCameraMovement";
import { GeospatialLimits } from "./Limits/geospatialLimits";

type CameraOptions = {
    planetRadius: number; // Radius of the planet
};

/**
 * @experimental
 * This camera's movements are limited to a camera orbiting a globe, and as the API evolves it will introduce conversions between cartesian coordinates and true lat/long/alt
 *
 * Please note this is marked as experimental and the API (including the constructor!) will change until we remove that flag
 *
 * Still TODO:
 * - Pitch/yaw limits, input speeds
 * - ZoomToPoint
 * - Conversion between lat/long/alt and cartesian coordinates
 */
export class GeospatialCamera extends Camera {
    override inputs: GeospatialCameraInputsManager;

    /** If supplied, will be used when picking the globe */
    public pickPredicate?: MeshPredicate;

    public movement: GeospatialCameraMovement;

    // Temp vars
    private _tempGeocentricNormal: Vector3 = new Vector3();
    private _tempRotationAxis: Vector3 = new Vector3();
    private _tempRotationMatrix: Matrix = new Matrix();
    private _tempPosition: Vector3 = new Vector3();

    private _viewMatrix: Matrix = Matrix.Identity();
    private _isViewMatrixDirty: boolean;
    private _lookAtVector: Vector3 = new Vector3();

    /** The point around which the camera will geocentrically rotate. Uses center (pt we are anchored to) if no alternateRotationPt is defined */
    private get _geocentricRotationPt(): Vector3 {
        return this.movement.alternateRotationPt ?? this.center;
    }

    constructor(name: string, scene: Scene, options: CameraOptions, pickPredicate?: MeshPredicate) {
        super(name, new Vector3(), scene);

        this._limits = new GeospatialLimits(options.planetRadius);
        this._resetToDefault();

        this.movement = new GeospatialCameraMovement(scene, this._limits, this.position, this.center, this._lookAtVector, pickPredicate);

        this.pickPredicate = pickPredicate;
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel();
    }

    private _limits: GeospatialLimits;
    public get limits(): GeospatialLimits {
        return this._limits;
    }

    /** The point on the globe that we are anchoring around*/
    private _center = Vector3.Zero();
    public get center(): Vector3 {
        return this._position.addToRef(this._lookAtVector, this._center);
    }

    private _resetToDefault(): void {
        // Camera configuration vars
        const maxCameraRadius = this._limits.altitudeMax !== undefined ? this._limits.planetRadius + this._limits.altitudeMax : undefined;
        const restingAltitude = maxCameraRadius ?? this._limits.planetRadius * 4;
        this.position.copyFromFloats(restingAltitude, 0, 0);

        // View matrix calculation vars
        this._center.subtractToRef(this._position, this._lookAtVector).normalize();
        this.upVector = Vector3.Up();
        this._isViewMatrixDirty = true;
    }

    /** @internal */
    override _getViewMatrix() {
        if (!this._isViewMatrixDirty) {
            return this._viewMatrix;
        }
        this._isViewMatrixDirty = false;

        // Ensure vectors are normalized
        this.upVector.normalize();
        this._lookAtVector.normalize();

        // Calculate view matrix with camera position and target
        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this.position, this._center, this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(this.position, this._center, this.upVector, this._viewMatrix);
        }

        return this._viewMatrix;
    }

    /** @internal */
    override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
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
    private _applyGeocentricTranslation() {
        // Store pending position (without any corrections applied)
        this.position.addToRef(this.movement.panDeltaCurrentFrame, this._tempPosition);

        // 1. Calculate the altitude correction to keep camera at the same radius when applying translation
        const tempPositionScaled = TmpVectors.Vector3[2];
        const offset = TmpVectors.Vector3[3];
        this._tempPosition.normalizeToRef(tempPositionScaled).scaleInPlace(this.position.length()); // what would tempPosition be if it were scaled to same radius as before
        this._tempPosition.subtractToRef(tempPositionScaled, offset); // find offset between tempPosition and the tempScaledPosition
        this._tempPosition.subtractInPlace(offset); // reduce tempPosition by that offset

        // 2. Calculate the rotation correction to keep camera facing globe
        this._applyRotationCorrectionAndSetPos(this._tempPosition);
    }

    /**
     * This rotation keeps the camera oriented towards the globe as it orbits around it. This is different from cameraCentricRotation which is when the camera rotates around its own axis
     */
    private _applyGeocentricRotation(): void {
        // Normalize key vectors
        this._geocentricRotationPt.normalizeToRef(this._tempGeocentricNormal);
        this.upVector.normalize();
        this._lookAtVector.normalize();

        const pitchRotationMatrix = Matrix.Identity();
        const yawRotationMatrix = Matrix.Identity();
        // First apply pitch
        if (this.movement.rotationDeltaCurrentFrame.x !== 0) {
            // Compute a rotation axis that is perpendicular to both the upVector and the geocentricNormalOfPitchPoint
            Vector3.CrossToRef(this.upVector, this._tempGeocentricNormal, this._tempRotationAxis);

            // If upVector and geocentricNormalOfPitchPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfPitchPoint)
            if (this._tempRotationAxis.lengthSquared() <= Epsilon) {
                Vector3.CrossToRef(this._lookAtVector, this._tempGeocentricNormal, this._tempRotationAxis);
            }

            const pitchSign = Math.sign(Vector3.Dot(this._tempGeocentricNormal, this.upVector)); // If negative, camera is upside down
            // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
            const currentPitch = pitchSign * Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this._tempGeocentricNormal), -1, 1));
            const newPitch = Scalar.Clamp(currentPitch + this.movement.rotationDeltaCurrentFrame.x, 0, 0.5 * Math.PI - Epsilon);
            // Build rotation matrix around normalized axis
            Matrix.RotationAxisToRef(this._tempRotationAxis.normalize(), newPitch - currentPitch, pitchRotationMatrix);
        }

        // Then apply yaw
        if (this.movement.rotationDeltaCurrentFrame.y !== 0) {
            Matrix.RotationAxisToRef(this._tempGeocentricNormal, this.movement.rotationDeltaCurrentFrame.y, yawRotationMatrix); // this axis changes if we aren't using center of screen for tilt
        }
        pitchRotationMatrix.multiplyToRef(yawRotationMatrix, this._tempRotationMatrix);

        // Offset camera to be (position-pitchPoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then add back the pitchPoint offset
        this.position.subtractInPlace(this._geocentricRotationPt);

        Vector3.TransformCoordinatesToRef(this.position, this._tempRotationMatrix, this.position);
        Vector3.TransformNormalToRef(this.upVector, this._tempRotationMatrix, this.upVector);
        Vector3.TransformNormalToRef(this._lookAtVector, this._tempRotationMatrix, this._lookAtVector);

        this.position.addInPlace(this._geocentricRotationPt);
    }

    private _applyZoom() {
        this._moveCameraAlongVectorByDistance(this.movement.computedPerFrameZoomVector, this.movement.zoomDeltaCurrentFrame);
    }

    private _moveCameraAlongVectorByDistance(vector: Vector3, distance: number) {
        if (distance) {
            vector.scaleAndAddToRef(distance, this._tempPosition);
            this._applyRotationCorrectionAndSetPos(this._tempPosition);
        }
    }

    override _checkInputs(): void {
        this.inputs.checkInputs();

        // Let movement class handle all per-frame logic
        this.movement.computeCurrentFrameDeltas();

        if (this.movement.panDeltaCurrentFrame.lengthSquared() > 0) {
            this._applyGeocentricTranslation();
            this._isViewMatrixDirty = true;
        }
        if (this.movement.rotationDeltaCurrentFrame.lengthSquared() > 0) {
            this._applyGeocentricRotation();
            this._isViewMatrixDirty = true;
        }

        if (Math.abs(this.movement.zoomDeltaCurrentFrame) > Epsilon) {
            this._applyZoom();
            this._isViewMatrixDirty = true;
        }

        super._checkInputs();
    }

    override attachControl(noPreventDefault?: boolean): void {
        this.inputs.attachElement(noPreventDefault);
    }

    override detachControl(): void {
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

    return ref;
}
