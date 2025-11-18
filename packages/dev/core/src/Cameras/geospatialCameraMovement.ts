import { CameraMovement } from "./cameraMovement";
import { Epsilon } from "../Maths/math.constants";
import type { GeospatialLimits } from "./Limits/geospatialLimits";
import { Matrix, TmpVectors, Vector3 } from "../Maths/math.vector";
import type { MeshPredicate } from "../Culling/ray.core";
import { Plane } from "../Maths/math.plane";
import { Ray } from "../Culling/ray";
import type { Scene } from "../scene";
import { Vector3Distance } from "../Maths/math.vector.functions";
import type { PickingInfo } from "../Collisions/pickingInfo";
import type { Nullable } from "../types";

/**
 * @experimental
 * This class is subject to change as the geospatial camera evolves.
 *
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
    public computedPerFrameZoomVector: Vector3 = new Vector3();

    public zoomToCursor: boolean = true;

    /**
     * Enables rotation around a specific point, instead of default rotation around center
     * @internal
     */
    public alternateRotationPt?: Vector3;

    private _tempPickingRay: Ray;
    private _storedZoomPickDistance: number | undefined;

    private _hitPointRadius?: number = undefined;
    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _dragPlaneOriginPointEcef: Vector3 = Vector3.Zero();
    private _dragPlaneHitPointLocal: Vector3 = Vector3.Zero();
    private _previousDragPlaneHitPointLocal: Vector3 = Vector3.Zero();

    constructor(
        scene: Scene,
        public limits: GeospatialLimits,
        cameraPosition: Vector3,
        private _cameraCenter: Vector3,
        private _cameraLookAt: Vector3,
        pickPredicate?: MeshPredicate
    ) {
        super(scene, cameraPosition);
        this.computedPerFrameZoomVector.copyFrom(this._cameraLookAt);
        this.pickPredicate = pickPredicate;
        this._tempPickingRay = new Ray(this._cameraPosition, this._cameraLookAt);
        this.panInertia = 0;
        this.rotationInertia = 0;
        this.rotationXSpeed = Math.PI / 500; // Move 1/500th of a half circle per pixel
        this.rotationYSpeed = Math.PI / 500; // Move 1/500th of a half circle per pixel
    }

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
        this._cameraPosition.normalizeToRef(this._dragPlaneNormal);
        this._dragPlaneNormal.scaleToRef(hitPointRadius, this._dragPlaneOriginPointEcef);

        // The dragPlaneOffsetVector will later be recalculated when drag occurs, and the delta between the offset vectors will be applied to localTranslation
        ComputeLocalBasisToRefs(this._dragPlaneOriginPointEcef, TmpVectors.Vector3[0], TmpVectors.Vector3[1], TmpVectors.Vector3[2]);
        const localToEcef = Matrix.FromXYZAxesToRef(TmpVectors.Vector3[0], TmpVectors.Vector3[1], TmpVectors.Vector3[2], localToEcefResult);
        localToEcef.setTranslationFromFloats(this._dragPlaneOriginPointEcef.x, this._dragPlaneOriginPointEcef.y, this._dragPlaneOriginPointEcef.z);
        const ecefToLocal = localToEcef.invertToRef(TmpVectors.Matrix[1]);

        // Now create a plane at that point, perpendicular to the camera's geocentric normal
        Plane.FromPositionAndNormalToRef(this._dragPlaneOriginPointEcef, this._dragPlaneNormal, this._dragPlane);

        // Lastly, find the _dragPlaneHitPoint where the ray intersects the _dragPlane.
        if (IntersectRayWithPlaneToRef(ray, this._dragPlane, this._dragPlaneHitPointLocal)) {
            // If hit, convert the drag plane hit point into the local space.
            Vector3.TransformCoordinatesToRef(this._dragPlaneHitPointLocal, ecefToLocal, this._dragPlaneHitPointLocal);
        }
    }

    public handleDrag(pointerX: number, pointerY: number) {
        if (this._hitPointRadius) {
            const pickResult = this._scene.pick(pointerX, pointerY);
            if (pickResult.ray) {
                const localToEcef = TmpVectors.Matrix[0];
                this._recalculateDragPlaneHitPoint(this._hitPointRadius, pickResult.ray, localToEcef);

                const delta = this._dragPlaneHitPointLocal.subtractToRef(this._previousDragPlaneHitPointLocal, TmpVectors.Vector3[6]);
                this._previousDragPlaneHitPointLocal.copyFrom(this._dragPlaneHitPointLocal);

                Vector3.TransformNormalToRef(delta, localToEcef, delta);
                this._dragPlaneOriginPointEcef.addInPlace(delta);

                this.panAccumulatedPixels.subtractInPlace(delta);
            }
        }
    }

    /** @override */
    public override computeCurrentFrameDeltas(): void {
        const cameraCenter = this._cameraCenter;

        // If a pan drag is occurring, stop zooming.
        const isDragging = this._hitPointRadius !== undefined;
        if (isDragging) {
            this._zoomSpeedMultiplier = 0;
            this._zoomVelocity = 0;
        } else {
            // Scales zoom movement speed based on camera distance to origin (so long as no active pan is occurring)
            this._zoomSpeedMultiplier = Vector3Distance(this._cameraPosition, cameraCenter) * 0.01;
        }

        // Before zero-ing out pixel deltas, capture if we have any active zoom in this frame (compared to zoom from inertia)
        const activeZoom = Math.abs(this.zoomAccumulatedPixels) > 0;
        super.computeCurrentFrameDeltas();

        this._handleZoom(activeZoom);
    }

    private _handleZoom(activeZoom: boolean) {
        if (Math.abs(this.zoomDeltaCurrentFrame) > Epsilon) {
            let pickDistance: number | undefined;

            if (!activeZoom) {
                // During inertia, use the previously stored pick distance
                // TODO fix this to work with raycasting
                pickDistance = this._storedZoomPickDistance;
            } else {
                // Active zoom - pick and store the distance
                const pickResult = this._scene.pick(this._scene.pointerX, this._scene.pointerY, this.pickPredicate);

                if (pickResult.hit && pickResult.pickedPoint && pickResult.ray && this.zoomToCursor) {
                    // Store both the zoom direction and the pick distance for use during inertia
                    pickResult.ray.direction.normalizeToRef(this.computedPerFrameZoomVector);
                    pickDistance = pickResult.distance;
                    this._storedZoomPickDistance = pickDistance;
                } else {
                    // If no hit under cursor, zoom along lookVector instead
                    this._cameraLookAt.normalizeToRef(this.computedPerFrameZoomVector);
                    const lookPickResult = this.pickAlongVector(this.computedPerFrameZoomVector);
                    pickDistance = lookPickResult?.distance;
                    this._storedZoomPickDistance = pickDistance;
                }
            }

            // Clamp distance based on limits and update center
            this._clampZoomDistance(this.zoomDeltaCurrentFrame, pickDistance);
        }
    }

    private _clampZoomDistance(requestedDistance: number, pickResultDistance: number | undefined): number {
        // If pickResult is defined
        if (requestedDistance > 0) {
            if (pickResultDistance !== undefined) {
                // If there is a pick, allow movement up to pick - minAltitude
                if (pickResultDistance - this.limits.altitudeMin < 0) {
                    this.zoomDeltaCurrentFrame = 0;
                }
                this.zoomDeltaCurrentFrame = Math.min(requestedDistance, pickResultDistance - this.limits.altitudeMin);
            } else {
                this.zoomDeltaCurrentFrame = requestedDistance;
            }
        }

        if (requestedDistance < 0) {
            const maxZoomOut = this.limits.radiusMax ? this.limits.radiusMax - this._cameraPosition.length() : Number.POSITIVE_INFINITY;
            this.zoomDeltaCurrentFrame = Math.max(requestedDistance, -maxZoomOut);
        }

        return this.zoomDeltaCurrentFrame;
    }

    public pickAlongVector(vector: Vector3): Nullable<PickingInfo> {
        this._tempPickingRay.origin.copyFrom(this._cameraPosition);
        this._tempPickingRay.direction.copyFrom(vector);
        return this._scene.pickWithRay(this._tempPickingRay, this.pickPredicate);
    }
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
 * @internal
 */
export function ComputeLocalBasisToRefs(worldPos: Vector3, refEast: Vector3, refNorth: Vector3, refUp: Vector3) {
    // up = normalized position (geocentric normal)
    refUp.copyFrom(worldPos).normalize();

    // east = normalize(worldNorth × up)
    // (cross product of Earth rotation axis with up gives east except near poles)
    const worldNorth = Vector3.LeftHandedForwardReadOnly; // (0,0,1)
    Vector3.CrossToRef(worldNorth, refUp, refEast);

    // at poles, cross with worldRight instead
    if (refEast.lengthSquared() < Epsilon) {
        Vector3.CrossToRef(Vector3.Right(), refUp, refEast);
    }
    refEast.normalize();

    // north = up × east (completes right-handed basis)
    Vector3.CrossToRef(refUp, refEast, refNorth);
    refNorth.normalize();
}
