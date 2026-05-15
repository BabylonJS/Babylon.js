import { CameraMovement } from "./cameraMovement";
import { Epsilon } from "../Maths/math.constants";
import { type GeospatialLimits } from "./Limits/geospatialLimits";
import { Matrix, TmpVectors, Vector3 } from "../Maths/math.vector";
import { type MeshPredicate } from "../Culling/ray.core";
import { Plane } from "../Maths/math.plane";
import { Ray } from "../Culling/ray";
import { type Scene } from "../scene";
import { Vector3Distance } from "../Maths/math.vector.functions";
import { Clamp } from "../Maths/math.scalar.functions";
import { type PickingInfo } from "../Collisions/pickingInfo";
import { type Nullable } from "../types";
import { type InterpolatingBehavior } from "../Behaviors/Cameras/interpolatingBehavior";
import { type GeospatialCamera } from "./geospatialCamera";
import { type InputMapEntry, InputMapper } from "./inputMapper";

// ── Geospatial handler types ────────────────────────────────────────

/**
 * Handler for geospatial pan (globe drag) interactions.
 * Pan uses screen coordinates and needs a lifecycle (start/update/stop) because
 * it establishes a drag plane on the globe surface to anchor the cursor.
 */
export type GeospatialPanHandler = {
    /** Begin a pan gesture at screen position */
    start(screenX: number, screenY: number): void;
    /** Continue panning to new screen position */
    update(screenX: number, screenY: number): void;
    /** End the pan gesture */
    stop(): void;
};

/**
 * Handler shape for geospatial camera interactions.
 * Property names are the canonical interaction type strings used in inputMap entries.
 * Single-method handlers are plain functions; multi-method handlers (pan) are objects.
 */
export type GeospatialHandlers = {
    /** Handler for pan (globe drag) interactions — object because it needs start/update/stop lifecycle */
    pan: GeospatialPanHandler;
    /** Handler for rotate (tilt) interactions — accepts yaw (horizontal) and pitch (vertical) deltas */
    rotate: (yaw: number, pitch: number) => void;
    /** Handler for zoom interactions — accepts delta and whether to zoom toward cursor */
    zoom: (delta: number, toCursor: boolean) => void;
};

/** Interaction type string for geospatial camera, derived from handler property names */
export type GeospatialInteraction = keyof GeospatialHandlers;

/**
 * Geospatial-specific camera movement system that extends the base movement with
 * raycasting and altitude-aware zoom constraints.
 *
 * This class encapsulates geospatial camera movement logic:
 * - Dragging in a way which keeps cursor anchored to globe
 * - Latitude-based pan speed dampening
 * - Zoom speed scaling based on distance to center
 * - Raycasting to determine zoom constraints based on terrain/globe
 * - Altitude-based zoom clamping
 * - Zoom direction calculation (towards cursor vs along look vector)
 */
export class GeospatialCameraMovement extends CameraMovement {
    /** Predicate function to determine which meshes to pick against (e.g., globe mesh) */
    public pickPredicate?: MeshPredicate;

    /**
     * World-space picked point under the cursor, computed each frame that zoom input is active.
     * Used to determine the zoom direction when `zoomToCursor` is true.
     * Undefined when there is no active zoom or the pick misses the globe.
     */
    public computedPerFrameZoomPickPoint?: Vector3;

    /**
     * When true, zooming moves toward the point under the cursor.
     * When false, zooming moves along the camera's look vector.
     */
    public zoomToCursor: boolean = true;

    /** Input system that maps physical inputs to interactions and dispatches to handlers. */
    public readonly input: InputMapper<GeospatialHandlers>;

    private _tempPickingRay: Ray;

    private _hitPointRadius?: number = undefined;
    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _dragPlaneOriginPointEcef: Vector3 = Vector3.Zero();
    private _dragPlaneHitPointLocal: Vector3 = Vector3.Zero();
    private _previousDragPlaneHitPointLocal: Vector3 = Vector3.Zero();

    constructor(
        scene: Scene,
        /** Geospatial bounds (min/max latitude, longitude, altitude, etc.) used to clamp camera motion. */
        public limits: GeospatialLimits,
        cameraPosition: Vector3,
        private _cameraCenter: Vector3,
        private _cameraLookAt: Vector3,
        pickPredicate?: MeshPredicate,
        behavior?: InterpolatingBehavior<GeospatialCamera>
    ) {
        super(scene, cameraPosition, behavior);
        this.pickPredicate = pickPredicate;
        this._tempPickingRay = Ray.Zero();
        this.panInertia = 0;
        this.rotationInertia = 0;
        this.rotationXSpeed = Math.PI / 500; // Move 1/500th of a half circle per pixel
        this.rotationYSpeed = Math.PI / 500; // Move 1/500th of a half circle per pixel
        this.zoomSpeed = 2; // Base zoom speed; actual speed is scaled based on altitude

        this.input = new InputMapper<GeospatialHandlers>(
            {
                pan: {
                    start: (screenX: number, screenY: number) => {
                        this.startDrag(screenX, screenY);
                    },
                    update: (screenX: number, screenY: number) => {
                        this.handleDrag(screenX, screenY);
                    },
                    stop: () => {
                        this.stopDrag();
                    },
                },
                rotate: (yaw: number, pitch: number) => {
                    this.rotationAccumulatedPixels.y += yaw;
                    this.rotationAccumulatedPixels.x += pitch;
                },
                zoom: (delta: number, toCursor: boolean) => {
                    this.handleZoom(delta, toCursor);
                },
            },
            () => this._createDefaultInputMap()
        );
    }

    private _createDefaultInputMap(): InputMapEntry<GeospatialInteraction>[] {
        return [
            { source: "pointer", button: 0, interaction: "pan" },
            { source: "pointer", button: 1, interaction: "rotate" },
            { source: "pointer", button: 2, interaction: "rotate" },
            { source: "wheel", interaction: "zoom" },
            { source: "keyboard", key: [187, 107, 189, 109], interaction: "zoom", sensitivity: 1.0 }, // +/-/numpad+/numpad-
            { source: "keyboard", modifiers: { ctrl: true }, interaction: "rotate", sensitivity: 1.0 },
            { source: "keyboard", modifiers: { alt: true }, interaction: "rotate", sensitivity: 1.0 },
            { source: "keyboard", interaction: "pan", sensitivity: 1.0 },
        ];
    }

    /**
     * Function to calculate the up vector from a given point.
     * Can be overridden to support non-spherical planets or custom up vector logic.
     * Defaults to using the geocentric normal.
     * @param point The point from which to calculate the up vector (e.g., camera position)
     * @param result The vector to store the calculated up vector
     * @returns The calculated up vector
     */
    public calculateUpVectorFromPointToRef = (point: Vector3, result: Vector3): Vector3 => {
        return point.normalizeToRef(result);
    };

    /**
     * Begins a drag (pan) gesture by picking the globe at the given screen position
     * and establishing a drag plane for subsequent updates.
     * @param pointerX - Screen X coordinate of the pointer
     * @param pointerY - Screen Y coordinate of the pointer
     */
    public startDrag(pointerX: number, pointerY: number) {
        const pickResult = this._scene.pick(pointerX, pointerY, this.pickPredicate);
        if (pickResult.pickedPoint && pickResult.ray) {
            // Store radius from earth center to pickedPoint, used when calculating drag plane
            this._hitPointRadius = pickResult.pickedPoint.length();

            this._recalculateDragPlaneHitPoint(this._hitPointRadius, pickResult.ray, TmpVectors.Matrix[0]);
            this._previousDragPlaneHitPointLocal.copyFrom(this._dragPlaneHitPointLocal);
        } else {
            this._hitPointRadius = undefined; // can't drag without a hit on the globe
        }
    }

    /**
     * Ends the current drag gesture, releasing the drag plane.
     */
    public stopDrag() {
        this._hitPointRadius = undefined;
    }

    /**
     * The previous drag plane hit point in local space is stored to compute the movement delta.
     * As the drag movement occurs, we will continuously recalculate this point. The delta between the previous and current hit points is the delta we will apply to the camera's localtranslation
     * @param hitPointRadius The distance between the world origin (center of globe) and the initial drag hit point
     * @param ray The ray from the camera to the new cursor location
     * @param localToEcefResult The matrix to convert from local to ECEF space
     */
    private _recalculateDragPlaneHitPoint(hitPointRadius: number, ray: Ray, localToEcefResult: Matrix): void {
        // Use the camera's geocentric normal to find the dragPlaneOriginPoint which lives at hitPointRadius along the camera's geocentric normal
        this._cameraPosition.scaleToRef(hitPointRadius / Math.max(0.00001, this._cameraPosition.length()), this._dragPlaneOriginPointEcef);

        // The dragPlaneOffsetVector will later be recalculated when drag occurs, and the delta between the offset vectors will be applied to localTranslation
        ComputeLocalBasisToRefs(
            this._dragPlaneOriginPointEcef,
            TmpVectors.Vector3[0],
            TmpVectors.Vector3[1],
            this._dragPlaneNormal,
            this._scene.useRightHandedSystem,
            this.calculateUpVectorFromPointToRef
        );
        const localToEcef = Matrix.FromXYZAxesToRef(TmpVectors.Vector3[0], TmpVectors.Vector3[1], this._dragPlaneNormal, localToEcefResult);
        localToEcef.setTranslationFromFloats(this._dragPlaneOriginPointEcef.x, this._dragPlaneOriginPointEcef.y, this._dragPlaneOriginPointEcef.z);
        const ecefToLocal = localToEcef.invertToRef(TmpVectors.Matrix[1]);

        // Now create a plane at that point, perpendicular to _dragPlaneNormal.
        Plane.FromPositionAndNormalToRef(this._dragPlaneOriginPointEcef, this._dragPlaneNormal, this._dragPlane);

        // Lastly, find the _dragPlaneHitPoint where the ray intersects the _dragPlane.
        if (IntersectRayWithPlaneToRef(ray, this._dragPlane, this._dragPlaneHitPointLocal)) {
            // If hit, convert the drag plane hit point into the local space.
            Vector3.TransformCoordinatesToRef(this._dragPlaneHitPointLocal, ecefToLocal, this._dragPlaneHitPointLocal);
        }
    }

    /**
     * Updates the drag gesture by recalculating the intersection with the drag plane
     * and accumulating the resulting pan delta.
     * @param pointerX - Current screen X coordinate
     * @param pointerY - Current screen Y coordinate
     */
    public handleDrag(pointerX: number, pointerY: number) {
        const scene = this._scene;
        if (!this._hitPointRadius || !scene.activeCamera) {
            return;
        }

        scene.createPickingRayToRef(pointerX, pointerY, null, this._tempPickingRay, scene.activeCamera);

        const localToEcef = TmpVectors.Matrix[0];
        this._recalculateDragPlaneHitPoint(this._hitPointRadius, this._tempPickingRay, localToEcef);

        const delta = this._dragPlaneHitPointLocal.subtractToRef(this._previousDragPlaneHitPointLocal, TmpVectors.Vector3[6]);

        // When the camera is pitched nearly parallel to the drag plane, ray-plane intersection
        // can produce enormous deltas. Clamp the delta to avoid massive jumps.
        const maxDragDelta = this._hitPointRadius * 0.1; // Max 10% of hit radius per frame
        const deltaLength = delta.length();
        if (deltaLength > maxDragDelta) {
            delta.scaleInPlace(maxDragDelta / deltaLength);
        }

        this._previousDragPlaneHitPointLocal.copyFrom(this._dragPlaneHitPointLocal);

        Vector3.TransformNormalToRef(delta, localToEcef, delta);
        this._dragPlaneOriginPointEcef.addInPlace(delta);

        this.panAccumulatedPixels.subtractInPlace(delta);
    }

    /**
     * Consumes the per-frame accumulated pan/rotate/zoom deltas and applies them to the camera state,
     * with geospatial-specific dampening (e.g. slower panning near the poles, parallax-based pan compensation).
     * Called once per frame by the scene's render loop via `_checkInputs`.
     * @override
     */
    public override computeCurrentFrameDeltas(): void {
        const cameraCenter = this._cameraCenter;

        // Slows down panning near the poles
        if (this.panAccumulatedPixels.lengthSquared() > Epsilon) {
            const centerRadius = cameraCenter.length(); // distance from planet origin to camera center
            const currentRadius = this._cameraPosition.length();
            // Dampen the pan speed based on latitude (slower near poles)
            const upAtCenter = TmpVectors.Vector3[7];
            this.calculateUpVectorFromPointToRef(cameraCenter, upAtCenter);
            // Latitude is derived from the Z component of the up vector (ECEF convention: Z = polar axis)
            const sineOfSphericalLat = upAtCenter.z;
            const cosOfSphericalLat = Math.sqrt(1 - Math.min(1, sineOfSphericalLat * sineOfSphericalLat));
            const latitudeDampening = Math.sqrt(Math.abs(cosOfSphericalLat)); // sqrt here reduces effect near equator

            // Reduce the dampening effect near surface (so that at ground level, pan speed is not affected by latitude)
            const height = Math.max(currentRadius - centerRadius, Epsilon);
            const latitudeDampeningScale = Math.max(1, centerRadius / height);

            this._panSpeedMultiplier = Clamp(latitudeDampeningScale * latitudeDampening, 0, 1);
        } else {
            this._panSpeedMultiplier = 1;
        }

        // If a pan drag or active rotation is occurring, stop zooming.
        let zoomTargetDistance: number | undefined;
        if (this.isDragging || this.rotationAccumulatedPixels.lengthSquared() > Epsilon) {
            this._zoomSpeedMultiplier = 0;
            this._zoomVelocity = 0;
        } else {
            zoomTargetDistance = this.computedPerFrameZoomPickPoint ? Vector3Distance(this._cameraPosition, this.computedPerFrameZoomPickPoint) : undefined;

            // Scales zoom movement speed based on camera distance to zoom target.
            this._zoomSpeedMultiplier = (zoomTargetDistance ?? Vector3Distance(this._cameraPosition, cameraCenter)) * 0.01;
        }

        super.computeCurrentFrameDeltas();
    }

    /**
     * Returns true when a drag gesture is active (between startDrag and stopDrag).
     */
    public get isDragging() {
        return this._hitPointRadius !== undefined;
    }

    /**
     * Accumulates a zoom delta and determines the zoom target point via raycasting.
     * @param zoomDelta - Signed zoom amount (positive = zoom in, negative = zoom out)
     * @param toCursor - When true, zoom toward the point under the cursor; when false, zoom along the look vector
     */
    public handleZoom(zoomDelta: number, toCursor: boolean) {
        if (zoomDelta !== 0) {
            this.zoomAccumulatedPixels += zoomDelta;

            const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY, this.pickPredicate);

            if (toCursor && pickResult.hit && pickResult.pickedPoint && pickResult.ray && this.zoomToCursor) {
                this.computedPerFrameZoomPickPoint = pickResult.pickedPoint;
            } else {
                // If no hit under cursor or explicitly told not to zoom to cursor, zoom along lookVector instead
                const lookPickResult = this.pickAlongVector(this._cameraLookAt);
                this.computedPerFrameZoomPickPoint = lookPickResult?.pickedPoint ?? undefined;
            }
        }
    }

    /**
     * Casts a ray from the camera position along the given direction and returns the pick result.
     * @param vector - World-space direction to cast along
     * @returns The pick result, or null if no hit
     */
    public pickAlongVector(vector: Vector3): Nullable<PickingInfo> {
        this._tempPickingRay.origin.copyFrom(this._cameraPosition);
        this._tempPickingRay.direction.copyFrom(vector);
        return this._scene.pickWithRay(this._tempPickingRay, this.pickPredicate);
    }
}
/** @internal */
export function ClampCenterFromPolesInPlace(center: Vector3) {
    const sineOfSphericalLatitudeLimit = 0.998749218; // ~90 degrees
    const centerMagnitude = center.length(); // distance from planet origin
    if (centerMagnitude > Epsilon) {
        const sineSphericalLat = centerMagnitude === 0 ? 0 : center.z / centerMagnitude;
        if (Math.abs(sineSphericalLat) > sineOfSphericalLatitudeLimit) {
            // Clamp the spherical latitude (and derive longitude)
            const sineOfClampedSphericalLat = Clamp(sineSphericalLat, -sineOfSphericalLatitudeLimit, sineOfSphericalLatitudeLimit);
            const cosineOfClampedSphericalLat = Math.sqrt(1 - sineOfClampedSphericalLat * sineOfClampedSphericalLat);
            const longitude = Math.atan2(center.y, center.x);

            // Spherical to Cartesian
            const newX = centerMagnitude * Math.cos(longitude) * cosineOfClampedSphericalLat;
            const newY = centerMagnitude * Math.sin(longitude) * cosineOfClampedSphericalLat;
            const newZ = centerMagnitude * sineOfClampedSphericalLat;

            center.set(newX, newY, newZ);
        }
    }
    return center;
}

function IntersectRayWithPlaneToRef(ray: Ray, plane: Plane, ref: Vector3): boolean {
    // Distance along the ray to the plane; null if no hit
    const dist = ray.intersectsPlane(plane);

    if (dist !== null && dist >= 0) {
        ray.origin.addToRef(ray.direction.scaleToRef(dist, TmpVectors.Vector3[0]), ref);
        return true;
    }

    return false;
}

/**
 * Helper to build east/north/up basis vectors at a world position.
 * Cross product order is swapped based on handedness so that the east vector
 * encodes the coordinate-system convention, removing the need for a separate yawScale.
 * @param worldPos - The position on the globe
 * @param refEast - Receives the east direction
 * @param refNorth - Receives the north direction
 * @param refUp - Receives the up (outward) direction
 * @param useRightHandedSystem - Whether the scene uses a right-handed coordinate system (default: false)
 * @param calculateUpVectorFromPointToRef - Optional function to calculate the up vector from a point. If supplied, this function will be used instead of assuming a spherical geocentric normal, allowing support for non-spherical planets or custom up vector logic.
 * @internal
 */
export function ComputeLocalBasisToRefs(
    worldPos: Vector3,
    refEast: Vector3,
    refNorth: Vector3,
    refUp: Vector3,
    useRightHandedSystem: boolean = false,
    calculateUpVectorFromPointToRef?: (point: Vector3, result: Vector3) => Vector3
): void {
    if (calculateUpVectorFromPointToRef) {
        calculateUpVectorFromPointToRef(worldPos, refUp);
    } else {
        // up = normalized position (geocentric normal)
        refUp.copyFrom(worldPos).normalize();
    }

    // east – cross product order determines handedness
    const worldNorth = Vector3.LeftHandedForwardReadOnly; // (0,0,1)
    if (useRightHandedSystem) {
        Vector3.CrossToRef(worldNorth, refUp, refEast);
    } else {
        Vector3.CrossToRef(refUp, worldNorth, refEast);
    }

    // at poles, cross with worldRight instead
    if (refEast.lengthSquared() < Epsilon) {
        if (useRightHandedSystem) {
            Vector3.CrossToRef(Vector3.Right(), refUp, refEast);
        } else {
            Vector3.CrossToRef(refUp, Vector3.Right(), refEast);
        }
    }
    refEast.normalize();

    // north – completes the basis (cross order also swapped for handedness)
    if (useRightHandedSystem) {
        Vector3.CrossToRef(refUp, refEast, refNorth);
    } else {
        Vector3.CrossToRef(refEast, refUp, refNorth);
    }
    refNorth.normalize();
}
