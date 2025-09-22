import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import { TmpVectors, Vector2, Vector3 } from "../../Maths/math.vector";
import { Ray } from "../../Culling";
import { Plane } from "../../Maths/math.plane";
import type { Scene } from "../../scene";
import type { PickingInfo } from "../../Collisions";

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
 * TODO: Add configurable pitch/zoom limits
 */
export class GeospatialCameraPointersInput implements ICameraInput<GeospatialCamera> {
    public camera: GeospatialCamera;

    /**
     * Mouse sensitivity for rotation (lower = more sensitive)
     */
    public angularSensibility = 200.0;

    /**
     * Mouse button to use for camera control
     * 0 = left, 1 = middle, 2 = right
     */
    public buttons = [0, 1, 2];

    private _observer: Nullable<Observer<PointerInfo>>;
    private _previousPosition: Nullable<Vector2> = null;
    private _isDragging = false;
    private _button: number = -1;

    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _dragPlaneOriginPoint: Vector3 = Vector3.Zero();
    private _dragPlaneHitPoint: Vector3 = Vector3.Zero();
    private _dragPlaneOffsetVector: Vector3 = Vector3.Zero();
    private _mouseDownRay: Ray = new Ray(this._dragPlaneHitPoint, this._dragPlaneOriginPoint, 0);

    private _hitPointRadius: number;

    public attachControl(noPreventDefault?: boolean): void {
        const scene = this.camera.getScene();

        this._observer = scene.onPointerObservable.add((pointerInfo) => {
            const evt = pointerInfo.event as PointerEvent;

            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (this.buttons.includes(evt.button)) {
                        let pickResult: Nullable<PickingInfo>;
                        // Determine rayOrigin based off of mouse input. If left click or middle click, use pointer position to cast ray
                        if (evt.button == 0 || evt.button == 1) {
                            pickResult = scene.pick(scene.pointerX, scene.pointerY);
                        } else {
                            // Right mouse button we want to tilt around screen center, so cast ray into screen center
                            const engine = scene.getEngine();
                            const width = engine.getRenderWidth();
                            const height = engine.getRenderHeight();
                            pickResult = scene.pick(width / 2, height / 2);
                        }
                        pickResult.ray && (this._mouseDownRay = pickResult.ray.clone());

                        if (pickResult.pickedPoint) {
                            this._isDragging = true;

                            if (evt.button == 0) {
                                // drag
                                // If left click, calculate radius from earth center to hitpoint to be used when calculating dragPlanes
                                this._hitPointRadius = pickResult.pickedPoint.length();

                                // This will later be recalculated when drag occurs, and the delta between these offset vectors is what will be applied to localTranslation
                                this._recalculateDragPlaneOffsetVectorToRef(this._dragPlaneOffsetVector);
                            } else {
                                // tilt
                                this.camera.pitchPoint.copyFrom(pickResult.pickedPoint);
                            }
                        } else {
                            this._isDragging = false;
                        }

                        this._button = evt.button;
                        this._previousPosition = new Vector2(evt.clientX, evt.clientY);
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    break;

                case PointerEventTypes.POINTERUP:
                    this._isDragging = false;
                    this._previousPosition = null;
                    this._button = -1;
                    break;

                case PointerEventTypes.POINTERMOVE:
                    if (this._isDragging && this._previousPosition) {
                        const currentPosition = new Vector2(evt.clientX, evt.clientY);
                        const deltaX = currentPosition.x - this._previousPosition.x;
                        const deltaY = currentPosition.y - this._previousPosition.y;

                        switch (this._button) {
                            case 0: // Left button - drag/pan globe under cursor
                                this._handleDrag(scene);
                                break;
                            case 1: // Middle button - tilt camera around cursor
                                this._handleTilt(deltaX, deltaY);
                                break;
                            case 2: // Right button - tilt camera
                                this._handleTilt(deltaX, deltaY);
                                break;
                        }

                        this._previousPosition = currentPosition;

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    break;
            }
        });
    }

    /**
     * The DragPlaneOffsetVector represents the vector between the dragPlane hit point and the dragPlane origin point.
     * As the drag movement occurs, we will continuously recalculate this vector. The delta between the offsetVectors is the delta we will apply to the camera's localtranslation
     * @param ref The offset vector between the drag plane's hitPoint and originPoint
     */
    private _recalculateDragPlaneOffsetVectorToRef(ref: Vector3) {
        // Use the camera's geocentric normal to find the dragPlaneOriginPoint which lives at hitPointRadius along the camera's geocentric normal
        this.camera.position.normalizeToRef(this._dragPlaneNormal);
        this._dragPlaneNormal.scaleToRef(this._hitPointRadius, this._dragPlaneOriginPoint);

        // Now create a plane at that point, perpendicular to the camera's geocentric normal
        Plane.FromPositionAndNormalToRef(this._dragPlaneOriginPoint, this._dragPlaneNormal, this._dragPlane);

        // Lastly, find the _dragPlaneHitPoint where the _mouseDownRay intersects the _dragPlane
        IntersectRayWithPlaneToRef(this._mouseDownRay, this._dragPlane, this._dragPlaneHitPoint);

        // Store the new offset between the drag plane's hitPoint and originPoint
        this._dragPlaneHitPoint.subtractToRef(this._dragPlaneOriginPoint, ref);
    }

    private _handleDrag(scene: Scene): void {
        // With new cursor location, identify where a ray from camera would intersect with the new drag plane, store in _mouseDownRay
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        pickResult.ray && (this._mouseDownRay = pickResult.ray.clone());

        const newDragPlaneOffsetVector = TmpVectors.Vector3[5];
        this._recalculateDragPlaneOffsetVectorToRef(newDragPlaneOffsetVector);
        const delta = TmpVectors.Vector3[6];
        newDragPlaneOffsetVector.subtractToRef(this._dragPlaneOffsetVector, delta);
        this.camera._perFrameTranslation.subtractInPlace(delta);
        this._dragPlaneOffsetVector.copyFrom(newDragPlaneOffsetVector);
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        // Just rotate the view without moving
        this.camera._perFrameRotation.y += -deltaX / this.angularSensibility; // yaw
        this.camera._perFrameRotation.x += -deltaY / this.angularSensibility; // pitch - dragging up look towards sky
    }

    public detachControl(): void {
        if (this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
        }

        this._isDragging = false;
        this._previousPosition = null;
        this._button = -1;
    }

    public getClassName(): string {
        return "GeospatialCameraMouseInput";
    }

    public getSimpleName(): string {
        return "mouse";
    }

    public checkInputs(): void {
        // Mouse input is event-based, no per-frame updates needed
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