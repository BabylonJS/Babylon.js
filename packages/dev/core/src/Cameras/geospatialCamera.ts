import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Vector3, Matrix, TmpVectors } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import { Camera } from "./camera";
import type { Scene } from "../scene";
import type { MeshPredicate } from "../Culling/ray.core";
import type { DeepImmutable } from "../types";
import { GeospatialLimits } from "./Limits/geospatialLimits";
import { ClampCenterFromPolesInPlace, ComputeLocalBasisToRefs, GeospatialCameraMovement } from "./geospatialCameraMovement";
import type { IVector3Like } from "../Maths/math.like";
import { Vector3CopyToRef, Vector3Distance, Vector3Dot } from "../Maths/math.vector.functions";
import { Clamp, NormalizeRadians } from "../Maths/math.scalar.functions";
import type { AllowedAnimValue } from "../Behaviors/Cameras/interpolatingBehavior";
import { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import type { EasingFunction } from "../Animations/easing";
import type { Animation } from "../Animations/animation";

type CameraOptions = {
    planetRadius: number; // Radius of the planet
};

/**
 * @experimental
 * This camera's movements are limited to a camera orbiting a globe, and as the API evolves it will introduce conversions between cartesian coordinates and true lat/long/alt
 *
 * Please note this is marked as experimental and the API (including the constructor!) will change until we remove that flag
 */
export class GeospatialCamera extends Camera {
    override inputs: GeospatialCameraInputsManager;

    /** If supplied, will be used when picking the globe */
    public pickPredicate?: MeshPredicate;

    /** Movement controller that turns input pixelDeltas into currentFrameDeltas used by camera*/
    public readonly movement: GeospatialCameraMovement;

    // Temp vars
    private _tempPosition: Vector3 = new Vector3();
    private _tempCenter: Vector3 = new Vector3();

    private _viewMatrix = new Matrix();
    private _isViewMatrixDirty: boolean;
    private _lookAtVector: Vector3 = new Vector3();

    /** Behavior used for smooth flying animations */
    private _flyingBehavior: InterpolatingBehavior<GeospatialCamera>;
    private _flyToTargets: Map<keyof GeospatialCamera, AllowedAnimValue> = new Map();

    constructor(name: string, scene: Scene, options: CameraOptions, pickPredicate?: MeshPredicate) {
        super(name, new Vector3(), scene);

        this._limits = new GeospatialLimits(options.planetRadius);
        this._resetToDefault(this._limits);

        this._flyingBehavior = new InterpolatingBehavior();
        this.addBehavior(this._flyingBehavior);

        this.movement = new GeospatialCameraMovement(scene, this._limits, this.position, this.center, this._lookAtVector, pickPredicate, this._flyingBehavior);

        this.pickPredicate = pickPredicate;
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel().addKeyboard();
    }

    private _center: Vector3 = new Vector3();
    /** The point on the globe that we are anchoring around. If no alternate rotation point is supplied, this will represent the center of screen*/
    public get center(): Vector3 {
        return this._center;
    }

    /**
     * Sets the camera position to orbit around a new center point
     * @param center The world position (ECEF) to orbit around
     */
    public set center(center: IVector3Like) {
        this._center.copyFromFloats(center.x, center.y, center.z);
        this._setOrientation(this._yaw, this._pitch, this._radius, this._center);
    }

    private _yaw: number = 0;
    /**
     * Gets the camera's yaw (rotation around the geocentric normal) in radians
     */
    public get yaw(): number {
        return this._yaw;
    }

    /**
     * Sets the camera's yaw (rotation around the geocentric normal). Will wrap value to [-π, π)
     * @param yaw The desired yaw angle in radians (0 = north, π/2 = east)
     */
    public set yaw(yaw: number) {
        yaw !== this._yaw && this._setOrientation(yaw, this.pitch, this.radius, this.center);
    }

    private _pitch: number = 0;

    /**
     * Gets the camera's pitch (angle from looking straight at globe)
     * Pitch is measured from looking straight down at planet center:
     * - zero pitch = looking straight at planet center (down)
     * - positive pitch = tilting up away from planet
     * - π/2 pitch = looking at horizon (perpendicular to geocentric normal)
     */
    public get pitch(): number {
        return this._pitch;
    }

    /**
     * Sets the camera's pitch (angle from looking straight at globe). Will wrap value to [-π, π)
     * @param pitch The desired pitch angle in radians (0 = looking at planet center, π/2 = looking at horizon)
     */
    public set pitch(pitch: number) {
        pitch !== this._pitch && this._setOrientation(this.yaw, pitch, this.radius, this.center);
    }

    private _radius: number = 0;
    public get radius(): number {
        return this._radius;
    }

    /**
     * Sets the camera's distance from the current center point
     * @param radius The desired radius
     */
    public set radius(radius: number) {
        radius !== this._radius && this._setOrientation(this.yaw, this.pitch, radius, this.center);
    }

    protected _checkLimits() {
        const limits = this.limits;
        this._yaw = Clamp(this._yaw, limits.yawMin, limits.yawMax);
        this._pitch = Clamp(this._pitch, limits.pitchMin, limits.pitchMax);
        this._radius = Clamp(this._radius, limits.radiusMin, limits.radiusMax);
        this._center = ClampCenterFromPolesInPlace(this._center);
    }

    private _tempVect = new Vector3();
    private _tempEast = new Vector3();
    private _tempNorth = new Vector3();
    private _tempUp = new Vector3();

    private _setOrientation(yaw: number, pitch: number, radius: number, center: DeepImmutable<IVector3Like>): void {
        // Wrap yaw and pitch to [-π, π)
        this._yaw = NormalizeRadians(yaw);
        this._pitch = NormalizeRadians(pitch);
        this._radius = radius;

        Vector3CopyToRef(center, this._center);

        // Clamp to limits
        this._checkLimits();

        // Refresh local basis at center (treat these as read-only for the whole call)
        ComputeLocalBasisToRefs(this._center, this._tempEast, this._tempNorth, this._tempUp);

        // Trig
        const yawScale = this._scene.useRightHandedSystem ? 1 : -1;
        const cosYaw = Math.cos(this._yaw * yawScale);
        const sinYaw = Math.sin(this._yaw * yawScale);
        const sinPitch = Math.sin(this._pitch); // horizontal weight
        const cosPitch = Math.cos(this._pitch); // vertical weight (toward center)

        // Temps
        const horiz = TmpVectors.Vector3[0];
        const t1 = TmpVectors.Vector3[1];
        const t2 = TmpVectors.Vector3[2];
        const right = TmpVectors.Vector3[3];

        // horizontalDirection = North*cosYaw + East*sinYaw  (avoids mutating _temp basis vectors)
        horiz.copyFrom(this._tempNorth).scaleInPlace(cosYaw).addInPlace(t1.copyFrom(this._tempEast).scaleInPlace(sinYaw));

        // look = horiz*sinPitch - Up*cosPitch
        this._lookAtVector.copyFrom(horiz).scaleInPlace(sinPitch).addInPlace(t2.copyFrom(this._tempUp).scaleInPlace(-cosPitch)).normalize(); // keep it unit

        // Build an orthonormal up aligned with geocentric Up
        // right = normalize(cross(upRef, look))
        Vector3.CrossToRef(this._tempUp, this._lookAtVector, right);

        // up = normalize(cross(look, right))
        Vector3.CrossToRef(this._lookAtVector, right, this.upVector);

        // Position = center - look * radius  (preserve unit look)
        this._tempVect.copyFrom(this._lookAtVector).scaleInPlace(-this._radius);
        this._tempPosition.copyFrom(this._center).addInPlace(this._tempVect);

        this._position.copyFrom(this._tempPosition);

        this._isViewMatrixDirty = true;
    }

    /**
     * If camera is actively in flight, will update the target properties and use up the remaining duration from original flyTo call
     *
     * To start a new flyTo curve entirely, call into flyToAsync again (it will stop the inflight animation)
     * @param targetYaw
     * @param targetPitch
     * @param targetRadius
     * @param targetCenter
     */
    public updateFlyToDestination(targetYaw?: number, targetPitch?: number, targetRadius?: number, targetCenter?: Vector3): void {
        this._flyToTargets.clear();

        this._flyToTargets.set("yaw", targetYaw != undefined ? NormalizeRadians(targetYaw) : undefined);
        this._flyToTargets.set("pitch", targetPitch != undefined ? NormalizeRadians(targetPitch) : undefined);
        this._flyToTargets.set("radius", targetRadius);
        this._flyToTargets.set("center", targetCenter);

        this._flyingBehavior.updateProperties(this._flyToTargets);
    }

    /**
     * Animate camera towards passed in property values. If undefined, will use current value
     * @param targetYaw
     * @param targetPitch
     * @param targetRadius
     * @param targetCenter
     * @param flightDurationMs
     * @param easingFunction
     * @param centerHopScale If supplied, will define the parabolic hop height scale for center animation to create a "bounce" effect
     * @returns Promise that will return when the animation is complete (or interuppted by pointer input)
     */
    public async flyToAsync(
        targetYaw?: number,
        targetPitch?: number,
        targetRadius?: number,
        targetCenter?: Vector3,
        flightDurationMs: number = 1000,
        easingFunction?: EasingFunction,
        centerHopScale?: number
    ): Promise<void> {
        this._flyToTargets.clear();

        this._flyToTargets.set("yaw", targetYaw !== undefined ? NormalizeRadians(targetYaw) : undefined);
        this._flyToTargets.set("pitch", targetPitch !== undefined ? NormalizeRadians(targetPitch) : undefined);
        this._flyToTargets.set("radius", targetRadius);
        this._flyToTargets.set("center", targetCenter);

        let overrideAnimationFunction;
        if (targetCenter !== undefined && !targetCenter.equals(this.center)) {
            // Animate center directly with custom interpolation
            const start = this.center.clone();
            const end = targetCenter.clone();

            overrideAnimationFunction = (key: string, animation: Animation): void => {
                if (key === "center") {
                    // Override the Vector3 interpolation to use SLERP + hop
                    animation.vector3InterpolateFunction = (startValue, endValue, gradient) => {
                        // gradient is the eased value (0 to 1) after easing function is applied

                        // Slerp between start and end
                        const newCenter = Vector3.SlerpToRef(start, end, gradient, this._tempCenter);

                        // Apply parabolic hop if requested
                        if (centerHopScale && centerHopScale > 0) {
                            // Parabolic formula: peaks at t=0.5, returns to 0 at gradient=0 and gradient=1
                            // if hopPeakT = .5 the denominator would be hopPeakT * hopPeakT - hopPeakT, which = -.25
                            const hopPeakOffset = centerHopScale * Vector3Distance(start, end);
                            const hopOffset = hopPeakOffset * Clamp((gradient * gradient - gradient) / -0.25);
                            // Scale the center outward (away from origin)
                            newCenter.scaleInPlace(1 + hopOffset / newCenter.length());
                        }

                        return newCenter;
                    };
                }
            };
        }

        return await this._flyingBehavior.animatePropertiesAsync(this._flyToTargets, flightDurationMs, easingFunction, overrideAnimationFunction);
    }

    /**
     * Helper function to move camera towards a given point by radiusScale% of radius (by default 50%)
     * @param destination point to move towards
     * @param radiusScale value between 0 and 1, % of radius to move
     * @param durationMs duration of flight, default 1s
     * @param easingFn optional easing function for flight interpolation of properties
     * @param overshootRadiusScale optional scale to apply to the current radius to achieve a 'hop' animation
     */
    public async flyToPointAsync(destination: Vector3, radiusScale: number = 0.5, durationMs: number = 1000, easingFn?: EasingFunction, overshootRadiusScale?: number) {
        // Zoom to radiusScale% of radius towards the given destination point
        const zoomDistance = this.radius * radiusScale;
        const newRadius = this._getCenterAndRadiusFromZoomToPoint(destination, zoomDistance, this._tempCenter);
        await this.flyToAsync(undefined, undefined, newRadius, this._tempCenter, durationMs, easingFn, overshootRadiusScale);
    }

    private _limits: GeospatialLimits;
    public get limits(): GeospatialLimits {
        return this._limits;
    }

    private _resetToDefault(limits: GeospatialLimits): void {
        // Camera configuration vars
        const maxCameraRadius = limits.altitudeMax !== undefined ? limits.planetRadius + limits.altitudeMax : undefined;
        const restingAltitude = maxCameraRadius ?? limits.planetRadius * 4;
        this.position.copyFromFloats(restingAltitude, 0, 0);
        this._center.copyFromFloats(limits.planetRadius, 0, 0);
        this._radius = Vector3.Distance(this.position, this.center);

        // Temp vars
        this._tempPosition = new Vector3();

        // View matrix calculation vars
        this._viewMatrix = Matrix.Identity();
        this._center.subtractToRef(this._position, this._lookAtVector).normalize(); // Lookat vector of the camera
        this.upVector = Vector3.Up(); // Up vector of the camera (does work for -X look at)
        this._isViewMatrixDirty = true;

        this._setOrientation(this._yaw, this._pitch, this._radius, this._center);
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

        // Calculate view matrix with camera position and center
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

    private _applyGeocentricTranslation() {
        // Store pending position (without any corrections applied)
        this.center.addToRef(this.movement.panDeltaCurrentFrame, this._tempPosition);

        if (!this.movement.isInterpolating) {
            // Calculate the position correction to keep camera at the same radius when applying translation
            this._tempPosition.normalize().scaleInPlace(this.center.length());
        }
        // Set center which will call _setOrientation
        this.center = this._tempPosition;
    }

    /**
     * This rotation keeps the camera oriented towards the globe as it orbits around it. This is different from cameraCentricRotation which is when the camera rotates around its own axis
     */
    private _applyGeocentricRotation(): void {
        const rotationDeltaCurrentFrame = this.movement.rotationDeltaCurrentFrame;
        if (rotationDeltaCurrentFrame.x !== 0 || rotationDeltaCurrentFrame.y !== 0) {
            const pitch = rotationDeltaCurrentFrame.x !== 0 ? Clamp(this._pitch + rotationDeltaCurrentFrame.x, 0, 0.5 * Math.PI - Epsilon) : this._pitch;
            const yaw = rotationDeltaCurrentFrame.y !== 0 ? this._yaw + rotationDeltaCurrentFrame.y : this._yaw;

            this._setOrientation(yaw, pitch, this._radius, this._center);
        }
    }

    private _getCenterAndRadiusFromZoomToPoint(targetPoint: Vector3, distance: number, newCenter: Vector3): number {
        // Clamp new radius to limits
        const requestedRadius = this._radius - distance;
        const newRadius = Clamp(requestedRadius, this.limits.radiusMin, this.limits.radiusMax);
        const actualDistance = this._radius - newRadius;
        const actualRatio = actualDistance / this._radius;

        // Direction from current center to target point
        const directionToTarget = TmpVectors.Vector3[0];
        targetPoint.subtractToRef(this._center, directionToTarget);

        // Move center toward target by the ratio amount
        const centerOffset = TmpVectors.Vector3[1];
        directionToTarget.scaleToRef(actualRatio, centerOffset);

        // Calculate new center
        this._center.addToRef(centerOffset, newCenter);

        // Preserve center altitude (distance from planet origin)
        const currentCenterRadius = this._center.length();
        const newCenterRadius = newCenter.length();
        if (newCenterRadius > Epsilon) {
            newCenter.scaleInPlace(currentCenterRadius / newCenterRadius);
        }

        return newRadius;
    }

    /**
     * Apply zoom by moving the camera toward/away from a target point.
     */
    private _applyZoom() {
        const zoomDelta = this.movement.zoomDeltaCurrentFrame;
        const pickedPoint = this.movement.computedPerFrameZoomPickPoint;

        if (pickedPoint) {
            // Zoom toward the picked point under cursor
            this._zoomToPoint(pickedPoint, zoomDelta);
        } else {
            // Zoom along lookAt vector (fallback when no surface under cursor)
            this._zoomAlongLookAt(zoomDelta);
        }
    }

    private _zoomToPoint(targetPoint: Vector3, distance: number) {
        const newRadius = this._getCenterAndRadiusFromZoomToPoint(targetPoint, distance, this._tempCenter);
        // Apply the new orientation
        this._setOrientation(this._yaw, this._pitch, newRadius, this._tempCenter);
    }

    private _zoomAlongLookAt(distance: number) {
        // Clamp radius to limits
        const requestedRadius = this._radius - distance;
        const newRadius = Clamp(requestedRadius, this.limits.radiusMin, this.limits.radiusMax);

        // Simply change radius without moving center
        this._setOrientation(this._yaw, this._pitch, newRadius, this._center);
    }

    override _checkInputs(): void {
        this.inputs.checkInputs();

        // Let movement class handle all per-frame logic
        this.movement.computeCurrentFrameDeltas();

        let isCenterMoving = false;
        if (this.movement.panDeltaCurrentFrame.lengthSquared() > 0) {
            this._applyGeocentricTranslation();
            // After a drag, recalculate the center point to ensure it's still on the surface.
            isCenterMoving = true;
        }
        if (this.movement.rotationDeltaCurrentFrame.lengthSquared() > 0) {
            this._applyGeocentricRotation();
        }

        if (Math.abs(this.movement.zoomDeltaCurrentFrame) > Epsilon) {
            this._applyZoom();
            isCenterMoving = true;
        }

        // After a movement impacting center or radius, recalculate the center point to ensure it's still on the surface.
        this._recalculateCenter(isCenterMoving);

        super._checkInputs();
    }

    private _wasCenterMovingLastFrame = false;

    private _recalculateCenter(isCenterMoving: boolean) {
        const shouldRecalculateCenterAfterMove = this._wasCenterMovingLastFrame && !isCenterMoving;
        this._wasCenterMovingLastFrame = isCenterMoving;

        // Wait until movement impacting center is complete to avoid wasted raycasting
        if (shouldRecalculateCenterAfterMove) {
            const newCenter = this.movement.pickAlongVector(this._lookAtVector);
            if (newCenter?.pickedPoint) {
                // Direction from new center to origin
                const centerToOrigin = TmpVectors.Vector3[4];
                centerToOrigin.copyFrom(newCenter.pickedPoint).negateInPlace().normalize();

                // Check if this direction aligns with camera's lookAt vector
                const dotProduct = Vector3Dot(this._lookAtVector, centerToOrigin);

                // Only update if the center is looking toward the origin (dot product > 0) to avoid a center on the opposite side of globe
                if (dotProduct > 0) {
                    const newRadius = Vector3Distance(this.position, newCenter.pickedPoint);
                    this._setOrientation(this._yaw, this._pitch, newRadius, newCenter.pickedPoint);
                }
            }
        }
    }

    override attachControl(noPreventDefault?: boolean): void {
        this.inputs.attachElement(noPreventDefault);
    }

    override detachControl(): void {
        this.inputs.detachElement();
    }
}
