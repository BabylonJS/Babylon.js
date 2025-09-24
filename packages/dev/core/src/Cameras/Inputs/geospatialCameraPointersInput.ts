import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PickingInfo } from "../../Collisions";
import type { Ray } from "../../Culling";
import type { IPointerEvent } from "../../Events";
import type { PointerTouch } from "../../Events/pointerEvents";
import { Plane } from "../../Maths/math.plane";
import { TmpVectors, Vector3 } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import { BaseCameraPointersInput } from "./BaseCameraPointersInput";

/**
 * @experimental
 * Geospatial camera inputs can simulate dragging the globe around or tilting the camera around some point on the globe
 * The input will update the camera's localTranslation or localRotation values, and the camera is responsible for using these updates to calculate viewMatrix appropriately
 *
 * As of right now, the camera correction logic (to keep the camera geospatially oriented around the globe) is happening within the camera class when calculating viewmatrix
 * As this is experimental, it is possible we move that correction step to live within the input class (to enable non-corrected translations in the future), say if we want to allow the camera to move outside of the globe's orbit
 *
 * Left mouse button: drag globe
 * Middle mouse button: tilt globe around cursor location
 * Right mouse button: tilt globe around center of screen
 *
 */
export class GeospatialCameraPointersInput extends BaseCameraPointersInput {
    public camera: GeospatialCamera;

    /**
     * Mouse sensitivity for rotation (lower = more sensitive)
     */
    public angularSensibility = 200.0;

    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _dragPlaneOriginPoint: Vector3 = Vector3.Zero();
    private _dragPlaneHitPoint: Vector3 = Vector3.Zero();
    private _dragPlaneOffsetVector: Vector3 = Vector3.Zero();

    private _hitPointRadius?: number; // Distance between world origin (center of globe) and the hitPoint (where initial drag started)

    public override getClassName(): string {
        return "GeospatialCameraPointersInput";
    }

    public override onButtonDown(evt: IPointerEvent): void {
        const scene = this.camera.getScene();
        let pickResult: Nullable<PickingInfo>;
        switch (evt.button) {
            case 0: // Left button - drag/pan globe under cursor
                pickResult = scene.pick(scene.pointerX, scene.pointerY, this.camera.pickPredicate);
                if (pickResult.pickedPoint && pickResult.ray) {
                    // Store radius from earth center to pickedPoint, used when calculating drag plane
                    this._hitPointRadius = pickResult.pickedPoint.length();

                    // The dragPlaneOffsetVector will later be recalculated when drag occurs, and the delta between the offset vectors will be applied to localTranslation
                    this._recalculateDragPlaneOffsetVectorToRef(this._hitPointRadius, pickResult.ray, this._dragPlaneOffsetVector);
                } else {
                    this._hitPointRadius = undefined; // can't drag without a hit on the globe
                }
                break;
            case 1: // Middle button - tilt camera around cursor
                pickResult = scene.pick(scene.pointerX, scene.pointerY, this.camera.pickPredicate);
                pickResult.pickedPoint && (this.camera._alternateRotationPt = pickResult.pickedPoint);
                break;
            case 2: // Right button - tilt camera around center of screen, already the default
                this.camera._alternateRotationPt = this.camera.center;
                break;
            default:
                return;
        }
    }

    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        switch (point?.button) {
            case 0: // Left button - drag/pan globe under cursor
                this._hitPointRadius !== undefined && this._handleDrag(this._hitPointRadius);
                break;
            case 1: // Middle button - tilt camera around cursor
            case 2: // Right button - tilt camera
                this._handleTilt(offsetX, offsetY);
                break;
        }
    }

    public override onButtonUp(_evt: IPointerEvent): void {
        this._hitPointRadius = undefined;
        this.camera._alternateRotationPt = null;
    }

    /**
     * The DragPlaneOffsetVector represents the vector between the dragPlane hit point and the dragPlane origin point.
     * As the drag movement occurs, we will continuously recalculate this vector. The delta between the offsetVectors is the delta we will apply to the camera's localtranslation
     * @param hitPointRadius The distance between the world origin (center of globe) and the initial drag hit point
     * @param ray The ray from the camera to the new cursor location
     * @param ref The offset vector between the drag plane's hitPoint and originPoint
     */
    private _recalculateDragPlaneOffsetVectorToRef(hitPointRadius: number, ray: Ray, ref: Vector3) {
        // Use the camera's geocentric normal to find the dragPlaneOriginPoint which lives at hitPointRadius along the camera's geocentric normal
        this.camera.position.normalizeToRef(this._dragPlaneNormal);
        this._dragPlaneNormal.scaleToRef(hitPointRadius, this._dragPlaneOriginPoint);

        // Now create a plane at that point, perpendicular to the camera's geocentric normal
        Plane.FromPositionAndNormalToRef(this._dragPlaneOriginPoint, this._dragPlaneNormal, this._dragPlane);

        // Lastly, find the _dragPlaneHitPoint where the ray intersects the _dragPlane
        IntersectRayWithPlaneToRef(ray, this._dragPlane, this._dragPlaneHitPoint);

        // Store the new offset between the drag plane's hitPoint and originPoint
        this._dragPlaneHitPoint.subtractToRef(this._dragPlaneOriginPoint, ref);
    }

    private _handleDrag(hitPointRadius: number): void {
        const scene = this.camera.getScene();
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        if (pickResult.ray) {
            const newDragPlaneOffsetVector = TmpVectors.Vector3[5];
            this._recalculateDragPlaneOffsetVectorToRef(hitPointRadius, pickResult.ray, newDragPlaneOffsetVector);
            const delta = TmpVectors.Vector3[6];
            newDragPlaneOffsetVector.subtractToRef(this._dragPlaneOffsetVector, delta);

            this._dragPlaneOffsetVector.copyFrom(newDragPlaneOffsetVector);

            this.camera._perFrameGeocentricTranslation.subtractInPlace(delta); // ???
        }
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        this.camera._perFrameGeocentricRotation.y += -deltaX / this.angularSensibility; // yaw - looking side to side
        this.camera._perFrameGeocentricRotation.x += -deltaY / this.angularSensibility; // pitch - look up towards sky / down towards ground
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
