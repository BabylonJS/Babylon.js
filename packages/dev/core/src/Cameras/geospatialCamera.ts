import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Vector3, Matrix, TmpVectors, Quaternion } from "../Maths/math.vector";
import type { Vector2 } from "../Maths/math.vector";
import { Epsilon } from "../Maths/math.constants";
import { Camera } from "./camera";
import { serialize, serializeAsVector3 } from "../Misc/decorators";
import type { Scene } from "../scene";
import type { MeshPredicate } from "../Culling/ray.core";
import type { DeepImmutable } from "../types";
import { GeospatialLimits } from "./Limits/geospatialLimits";
import { ClampCenterFromPolesInPlace, ComputeLocalBasisToRefs, GeospatialCameraMovement } from "./geospatialCameraMovement";
import type { IVector3Like } from "../Maths/math.like";
import { Vector3CopyToRef, Vector3Distance, Vector3Dot, Vector3SubtractToRef } from "../Maths/math.vector.functions";
import { Clamp, NormalizeRadians } from "../Maths/math.scalar.functions";
import type { AllowedAnimValue } from "../Behaviors/Cameras/interpolatingBehavior";
import { InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import type { Collider } from "../Collisions/collider";
import type { EasingFunction } from "../Animations/easing";
import type { Animation } from "../Animations/animation";
import { RegisterClass } from "../Misc/typeStore";

export type GeospatialCameraOptions = {
    /**
     * Radius of the planet being orbited
     */
    planetRadius: number;
    /**
     * If supplied, will be used by the movement class when picking the globe. Can later update camera.movement.pickPredicate directly
     */
    pickPredicate?: MeshPredicate;
};

/**
 * Camera equipped to orbit a spherical planet centered at world origin
 */
export class GeospatialCamera extends Camera {
    override inputs: GeospatialCameraInputsManager;

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

    // Collision properties
    private _collider?: Collider;
    private _collisionVelocity: Vector3 = new Vector3();
    /** Public option to customize the collision offset applied each frame - vs the one calculated using internal CollisionCoordinator */
    public perFrameCollisionOffset: Vector3 = new Vector3();
    /** Enable or disable collision checking for this camera. Default is false. */
    @serialize()
    public checkCollisions: boolean = false;

    constructor(name: string, scene: Scene, options: GeospatialCameraOptions) {
        super(name, new Vector3(), scene);

        this._limits = new GeospatialLimits(options.planetRadius);
        this._resetToDefault(this._limits);

        this._flyingBehavior = new InterpolatingBehavior();
        this.addBehavior(this._flyingBehavior);

        this.movement = new GeospatialCameraMovement(scene, this._limits, this.position, this.center, this._lookAtVector, options.pickPredicate, this._flyingBehavior);

        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel().addKeyboard();
    }

    @serializeAsVector3()
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

    @serialize()
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

    @serialize()
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

    @serialize()
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
        const effectivePitchMax = limits.getEffectivePitchMax(this._radius);
        this._pitch = Clamp(this._pitch, limits.pitchMin, effectivePitchMax);
        this._radius = Clamp(this._radius, limits.radiusMin, limits.radiusMax);
        ClampCenterFromPolesInPlace(this._center);
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

        // Compute lookAt from yaw/pitch
        ComputeLookAtFromYawPitchToRef(this._yaw, this._pitch, this._center, this._scene.useRightHandedSystem, this._lookAtVector);

        // Build an orthonormal up aligned with geocentric Up
        // When looking straight down (pitch ≈ 0), lookAt is parallel to Up, so use the horizontal direction as the camera's up.
        const right = TmpVectors.Vector3[10];
        Vector3.CrossToRef(this._tempUp, this._lookAtVector, right);
        if (right.lengthSquared() < Epsilon) {
            // Looking straight down (or up) - use quaternion rotation to compute horiz
            // Must use -yaw * yawScale to match ComputeLookAtFromYawPitchToRef formula
            const horiz = TmpVectors.Vector3[11];
            const yawScale = this._scene.useRightHandedSystem ? 1 : -1;
            const yawQuat = TmpVectors.Quaternion[1];
            Quaternion.RotationAxisToRef(this._tempUp, -this._yaw * yawScale, yawQuat);
            this._tempNorth.rotateByQuaternionToRef(yawQuat, horiz);
            // right = cross(horiz, lookAt)
            Vector3.CrossToRef(horiz, this._lookAtVector, right);
        }
        right.normalize();

        // up = normalize(cross(look, right))
        Vector3.CrossToRef(this._lookAtVector, right, this.upVector);
        this.upVector.normalize();

        // Position = center - look * radius  (preserve unit look)
        this._tempVect.copyFrom(this._lookAtVector).scaleInPlace(-this._radius);
        this._tempPosition.copyFrom(this._center).addInPlace(this._tempVect);

        // Recalculate collisionOffset to be applied later when viewMatrix is calculated (allowing camera users to modify the value in afterCheckInputsObservable)
        if (this.checkCollisions) {
            this.perFrameCollisionOffset = this._getCollisionOffset(this._tempPosition);
        }

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

        // For yaw, use shortest path to target.
        const deltaYaw = targetYaw !== undefined ? NormalizeRadians(NormalizeRadians(targetYaw) - this._yaw) : 0;
        this._flyToTargets.set("yaw", deltaYaw === 0 ? undefined : this._yaw + deltaYaw);
        this._flyToTargets.set("pitch", targetPitch != undefined ? NormalizeRadians(targetPitch) : undefined);
        this._flyToTargets.set("radius", targetRadius);
        this._flyToTargets.set("center", targetCenter?.clone());

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

        // For yaw, use shortest path to target.
        const deltaYaw = targetYaw !== undefined ? NormalizeRadians(NormalizeRadians(targetYaw) - this._yaw) : 0;
        this._flyToTargets.set("yaw", deltaYaw === 0 ? undefined : this._yaw + deltaYaw);
        this._flyToTargets.set("pitch", targetPitch !== undefined ? NormalizeRadians(targetPitch) : undefined);
        this._flyToTargets.set("radius", targetRadius);
        this._flyToTargets.set("center", targetCenter?.clone());

        let overrideAnimationFunction;
        if (targetCenter !== undefined && !targetCenter.equals(this.center)) {
            // Animate center directly with custom interpolation
            overrideAnimationFunction = (key: string, animation: Animation): void => {
                if (key === "center") {
                    // Override the Vector3 interpolation to use SLERP + hop
                    animation.vector3InterpolateFunction = (startValue, endValue, gradient) => {
                        // gradient is the eased value (0 to 1) after easing function is applied

                        // Slerp between start and end
                        const newCenter = Vector3.SlerpToRef(startValue, endValue, gradient, this._tempCenter);

                        // Apply parabolic hop if requested
                        if (centerHopScale && centerHopScale > 0) {
                            // Parabolic formula: peaks at t=0.5, returns to 0 at gradient=0 and gradient=1
                            // if hopPeakT = .5 the denominator would be hopPeakT * hopPeakT - hopPeakT, which = -.25
                            const hopPeakOffset = centerHopScale * Vector3Distance(startValue, endValue);
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
     * Helper function to move camera towards a given point by `distanceScale` of the current camera-to-destination distance (by default 50%).
     * @param destination point to move towards
     * @param distanceScale value between 0 and 1, % of distance to move
     * @param durationMs duration of flight, default 1s
     * @param easingFn optional easing function for flight interpolation of properties
     * @param centerHopScale If supplied, will define the parabolic hop height scale for center animation to create a "bounce" effect
     */
    public async flyToPointAsync(destination: Vector3, distanceScale: number = 0.5, durationMs: number = 1000, easingFn?: EasingFunction, centerHopScale?: number) {
        // Move by a fraction of the camera-to-destination distance
        const zoomDistance = Vector3Distance(this.position, destination) * distanceScale;
        const newRadius = this._getCenterAndRadiusFromZoomToPoint(destination, zoomDistance, this._tempCenter);
        await this.flyToAsync(undefined, undefined, newRadius, this._tempCenter, durationMs, easingFn, centerHopScale);
        !this.isDisposed && this._recalculateCenter(false, true /** force */);
    }

    private _limits: GeospatialLimits;
    public get limits(): GeospatialLimits {
        return this._limits;
    }

    private _resetToDefault(limits: GeospatialLimits): void {
        // Camera configuration vars
        const restingAltitude = limits.radiusMax !== Infinity ? limits.radiusMax : limits.planetRadius * 4;
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

        // Apply the same offset to both position and center to preserve orbital relationship
        // This keeps yaw/pitch/radius intact - just lifts the whole "rig"
        this._position.addInPlace(this.perFrameCollisionOffset);
        this._center.addInPlace(this.perFrameCollisionOffset);

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

    private _getCenterAndRadiusFromZoomToPoint(targetPoint: DeepImmutable<IVector3Like>, distance: number, newCenterResult: Vector3): number {
        const directionToTarget = Vector3SubtractToRef(targetPoint, this._position, TmpVectors.Vector3[0]);
        const distanceToTarget = directionToTarget.length();

        // Don't zoom past the min radius limit.
        if (distanceToTarget < this.limits.radiusMin) {
            newCenterResult.copyFrom(this._center);
            const requestedRadius = this._radius - distance;
            const newRadius = Clamp(requestedRadius, this.limits.radiusMin, this.limits.radiusMax);
            return newRadius;
        }

        // Move the camera position towards targetPoint by distanceToTarget
        directionToTarget.scaleInPlace(distance / distanceToTarget);
        const newPosition = this._position.addToRef(directionToTarget, TmpVectors.Vector3[1]);

        // Project the movement onto the look vector to derive the new center/radius.
        const projectedDistance = Vector3Dot(directionToTarget, this._lookAtVector);
        const newRadius = this._radius - projectedDistance;
        const newRadiusClamped = Clamp(newRadius, this.limits.radiusMin, this.limits.radiusMax);
        newCenterResult.copyFrom(newPosition).addInPlace(this._lookAtVector.scale(newRadiusClamped));

        return newRadiusClamped;
    }

    /**
     * Apply zoom by moving the camera toward/away from a target point.
     */
    private _applyZoom() {
        let zoomDelta = this.movement.zoomDeltaCurrentFrame;
        const pickedPoint = this.movement.computedPerFrameZoomPickPoint;

        // Clamp zoom delta to limits before applying
        zoomDelta = this._clampZoomDelta(zoomDelta, pickedPoint);

        if (Math.abs(zoomDelta) < Epsilon) {
            return;
        }
        if (pickedPoint) {
            // Zoom toward the picked point under cursor
            this.zoomToPoint(pickedPoint, zoomDelta);
        } else {
            // Zoom along lookAt vector (fallback when no surface under cursor)
            this.zoomAlongLookAt(zoomDelta);
        }
    }

    private _clampZoomDelta(zoomDelta: number, pickedPoint?: Vector3): number {
        if (Math.abs(zoomDelta) < Epsilon) {
            return 0;
        }

        const distanceToTarget = pickedPoint ? Vector3Distance(this._position, pickedPoint) : undefined;
        return this.limits.clampZoomDistance(zoomDelta, this._radius, distanceToTarget);
    }

    public zoomToPoint(targetPoint: DeepImmutable<IVector3Like>, distance: number) {
        const newRadius = this._getCenterAndRadiusFromZoomToPoint(targetPoint, distance, this._tempCenter);
        // Apply the new orientation
        this._setOrientation(this._yaw, this._pitch, newRadius, this._tempCenter);
    }

    public zoomAlongLookAt(distance: number) {
        // Clamp radius to limits
        const requestedRadius = this._radius - distance;
        const newRadius = Clamp(requestedRadius, this.limits.radiusMin, this.limits.radiusMax);

        // Simply change radius without moving center
        this._setOrientation(this._yaw, this._pitch, newRadius, this._center);
    }

    override _checkInputs(): void {
        this.inputs.checkInputs();
        this.perFrameCollisionOffset.setAll(0);

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

    private _recalculateCenter(isCenterMoving: boolean, forceRecalculate: boolean = false): void {
        const shouldRecalculateCenterAfterMove = this._wasCenterMovingLastFrame && !isCenterMoving;
        this._wasCenterMovingLastFrame = isCenterMoving;

        // Wait until movement impacting center is complete to avoid wasted raycasting
        if (shouldRecalculateCenterAfterMove || forceRecalculate) {
            const newCenter = this.movement.pickAlongVector(this._lookAtVector);
            if (newCenter?.pickedPoint) {
                // Direction from new center to origin
                const centerToOrigin = TmpVectors.Vector3[4];
                centerToOrigin.copyFrom(newCenter.pickedPoint).negateInPlace().normalize();

                // Check if this direction aligns with camera's lookAt vector
                const dotProduct = Vector3Dot(this._lookAtVector, centerToOrigin);

                // Only update if the center is looking toward the origin (dot product > 0) to avoid a center on the opposite side of globe
                if (dotProduct > 0) {
                    // Compute the new radius as distance from camera position to new center
                    const newRadius = Vector3Distance(this._position, newCenter.pickedPoint);

                    // Only update if the new center is in front of the camera
                    if (newRadius > Epsilon) {
                        // Compute yaw/pitch that correspond to current lookAt at new center
                        const yawPitch = TmpVectors.Vector2[0];
                        ComputeYawPitchFromLookAtToRef(this._lookAtVector, newCenter.pickedPoint, this._scene.useRightHandedSystem, this._yaw, yawPitch);

                        // Call _setOrientation with the computed yaw/pitch and new center
                        this._setOrientation(yawPitch.x, yawPitch.y, newRadius, newCenter.pickedPoint);
                    }
                }
            }
        }
    }

    /**
     * Allows extended classes to override how collision offset is calculated
     * @param newPosition
     * @returns
     */
    protected _getCollisionOffset(newPosition: Vector3): Vector3 {
        const collisionOffset = TmpVectors.Vector3[6].setAll(0);
        if (!this.checkCollisions || !this._scene.collisionsEnabled) {
            return collisionOffset;
        }

        const coordinator = this.getScene().collisionCoordinator;
        if (!coordinator) {
            return collisionOffset;
        }

        if (!this._collider) {
            this._collider = coordinator.createCollider();
        }
        this._collider._radius.setAll(this.limits.radiusMin);

        // Calculate velocity from old position to new position
        newPosition.subtractToRef(this._position, this._collisionVelocity);

        // Get the collision-adjusted position
        const adjustedPosition = coordinator.getNewPosition(this._position, this._collisionVelocity, this._collider, 3, null, () => {}, this.uniqueId);

        // Calculate the collision offset (how much the position was pushed)
        adjustedPosition.subtractToRef(newPosition, collisionOffset);

        return collisionOffset;
    }

    override attachControl(noPreventDefault?: boolean): void {
        this.inputs.attachElement(noPreventDefault);
    }

    override detachControl(): void {
        this.inputs.detachElement();
    }

    /**
     * Gets the class name of the camera.
     * @returns the class name
     */
    public override getClassName(): string {
        return "GeospatialCamera";
    }
}

// Register Class Name
RegisterClass("BABYLON.GeospatialCamera", GeospatialCamera);

/**
 * Compute the lookAt direction vector from yaw and pitch angles at a given center point.
 * This is the forward formula used by GeospatialCamera._setOrientation.
 * @param yaw - The yaw angle in radians (0 = north, π/2 = east)
 * @param pitch - The pitch angle in radians (0 = looking at planet center, π/2 = looking at horizon)
 * @param center - The center point on the globe
 * @param useRightHandedSystem - Whether the scene uses a right-handed coordinate system
 * @param result - The vector to store the result in
 * @returns The normalized lookAt direction vector (same as result)
 */
export function ComputeLookAtFromYawPitchToRef(yaw: number, pitch: number, center: Vector3, useRightHandedSystem: boolean, result: Vector3): Vector3 {
    const east = TmpVectors.Vector3[0];
    const north = TmpVectors.Vector3[1];
    const up = TmpVectors.Vector3[2];
    ComputeLocalBasisToRefs(center, east, north, up);

    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);

    // Use quaternion rotation to compute horiz = rotate(north, up, -yaw * yawScale)
    // Negating the angle produces: horiz = North*cos(yaw) + East*sin(yaw)
    const yawScale = useRightHandedSystem ? 1 : -1;
    const yawQuat = TmpVectors.Quaternion[0];
    Quaternion.RotationAxisToRef(up, -yaw * yawScale, yawQuat);

    const horiz = TmpVectors.Vector3[3];
    north.rotateByQuaternionToRef(yawQuat, horiz);

    // lookAt = horiz * sinPitch - up * cosPitch
    const t2 = TmpVectors.Vector3[4];
    result.copyFrom(horiz).scaleInPlace(sinPitch).addInPlace(t2.copyFrom(up).scaleInPlace(-cosPitch));
    return result.normalize();
}

/**
 * Given a lookAt direction and center, compute the yaw and pitch angles that would produce that lookAt.
 * This is the inverse of ComputeLookAtFromYawPitchToRef.
 * @param lookAt - The normalized lookAt direction vector
 * @param center - The center point on the globe
 * @param useRightHandedSystem - Whether the scene uses a right-handed coordinate system
 * @param currentYaw - The current yaw value to use as fallback when pitch is near 0 (looking straight down/up)
 * @param result - The Vector2 to store the result in (x = yaw, y = pitch)
 * @returns The result Vector2
 */
export function ComputeYawPitchFromLookAtToRef(lookAt: Vector3, center: Vector3, useRightHandedSystem: boolean, currentYaw: number, result: Vector2): Vector2 {
    // Compute local basis at center
    const east = TmpVectors.Vector3[6];
    const north = TmpVectors.Vector3[7];
    const up = TmpVectors.Vector3[8];
    ComputeLocalBasisToRefs(center, east, north, up);

    // lookAt = horiz*sinPitch - up*cosPitch
    // where horiz = rotate(north, up, yaw * yawScale) via quaternion
    //
    // The vertical component of lookAt (along up) gives us cosPitch:
    // lookAt · up = -cosPitch
    const lookDotUp = Vector3Dot(lookAt, up);
    const cosPitch = -lookDotUp;

    // Clamp cosPitch to valid range to avoid NaN from acos
    const clampedCosPitch = Clamp(cosPitch, -1, 1);
    const pitch = Math.acos(clampedCosPitch);

    // The horizontal component gives us yaw
    // lookHorizontal = lookAt + up*cosPitch = horiz*sinPitch
    const lookHorizontal = TmpVectors.Vector3[9];
    const scaledUp = TmpVectors.Vector3[10];
    scaledUp.copyFrom(up).scaleInPlace(cosPitch);
    lookHorizontal.copyFrom(lookAt).addInPlace(scaledUp);

    const sinPitch = Math.sin(pitch);
    if (Math.abs(sinPitch) < Epsilon) {
        // Looking straight down or up, yaw is undefined - keep current
        result.x = currentYaw;
        result.y = pitch;
        return result;
    }

    // horiz = lookHorizontal / sinPitch
    const horiz = lookHorizontal.scaleInPlace(1 / sinPitch);

    // From the forward formula: horiz = North*cos(yaw) + East*sin(yaw)
    // So: cosYaw = horiz · north, sinYaw = horiz · east
    const cosYaw = Vector3Dot(horiz, north);
    const sinYaw = Vector3Dot(horiz, east);

    const yawScale = useRightHandedSystem ? 1 : -1;
    result.x = Math.atan2(sinYaw, cosYaw) * yawScale;
    result.y = pitch;
    return result;
}
