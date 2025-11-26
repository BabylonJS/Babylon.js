import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PickingInfo } from "../../Collisions/pickingInfo";
import type { IPointerEvent } from "../../Events/deviceInputEvents";
import type { PointerTouch } from "../../Events/pointerEvents";
import type { Nullable } from "../../types";
import { OrbitCameraPointersInput } from "./orbitCameraPointersInput";

/**
 * @experimental
 * Geospatial camera inputs can simulate dragging the globe around or tilting the camera around some point on the globe
 * This class will update the GeospatialCameraMovement class's movementDeltaCurrentFrame, and the camera is responsible for using these updates to calculate viewMatrix appropriately
 *
 * As of right now, the camera correction logic (to keep the camera geospatially oriented around the globe) is happening within the camera class when calculating viewmatrix
 * As this is experimental, it is possible we move that correction step to live within the input class (to enable non-corrected translations in the future), say if we want to allow the camera to move outside of the globe's orbit
 *
 * Left mouse button: drag globe
 * Middle mouse button: tilt globe around cursor location
 * Right mouse button: tilt globe around center of screen
 *
 */
export class GeospatialCameraPointersInput extends OrbitCameraPointersInput {
    public camera: GeospatialCamera;

    public override getClassName(): string {
        return "GeospatialCameraPointersInput";
    }

    public override onButtonDown(evt: IPointerEvent): void {
        this.camera.movement.activeInput = true;
        const scene = this.camera.getScene();
        let pickResult: Nullable<PickingInfo>;
        switch (evt.button) {
            case 0: // Left button - drag/pan globe under cursor
                this.camera.movement.startDrag(scene.pointerX, scene.pointerY);
                break;
            case 1: // Middle button - tilt camera around cursor
                pickResult = scene.pick(scene.pointerX, scene.pointerY, this.camera.pickPredicate);
                pickResult.pickedPoint && (this.camera.movement.alternateRotationPt = pickResult.pickedPoint);
                break;
            case 2: // Right button - tilt camera around center of screen, already the default
                this.camera.movement.alternateRotationPt = this.camera.center;
                break;
            default:
                return;
        }
    }

    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        // Single finger touch (no button property) or left button (button 0) = drag
        const button = point?.button ?? 0; // Default to button 0 (drag) if undefined
        const scene = this.camera.getScene();
        switch (button) {
            case 0: // Left button / single touch - drag/pan globe under cursor
                this.camera.movement.handleDrag(scene.pointerX, scene.pointerY);
                break;
            case 1: // Middle button - tilt camera
            case 2: // Right button - tilt camera
                this._handleTilt(offsetX, offsetY);
                break;
        }
    }

    /**
     * Move camera from multitouch (pinch) zoom distances.
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     */
    protected override _computePinchZoom(previousPinchSquaredDistance: number, pinchSquaredDistance: number): void {
        this.camera.radius = (this.camera.radius * Math.sqrt(previousPinchSquaredDistance)) / Math.sqrt(pinchSquaredDistance);
    }

    /**
     * Move camera from multi touch panning positions.
     * In geospatialcamera, multi touch panning tilts the globe (whereas single touch will pan/drag it)
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    protected override _computeMultiTouchPanning(previousMultiTouchPanPosition: Nullable<PointerTouch>, multiTouchPanPosition: Nullable<PointerTouch>): void {
        if (previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            this._handleTilt(moveDeltaX, moveDeltaY);
        }
    }

    public override onDoubleTap(type: string): void {
        const pickResult = this.camera._scene.pick(this.camera._scene.pointerX, this.camera._scene.pointerY, this.camera.pickPredicate);
        if (pickResult.pickedPoint) {
            void this.camera.flyToPointAsync(pickResult.pickedPoint);
        }
    }

    public override onMultiTouch(
        pointA: Nullable<PointerTouch>,
        pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        this._shouldStartPinchZoom =
            this._twoFingerActivityCount < 20 && Math.abs(Math.sqrt(pinchSquaredDistance) - Math.sqrt(previousPinchSquaredDistance)) > this.camera.limits.pinchToPanMax;
        super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
    }

    public override onButtonUp(_evt: IPointerEvent): void {
        this.camera.movement.stopDrag();
        this.camera.movement.alternateRotationPt = undefined;
        this.camera.movement.activeInput = false;
        super.onButtonUp(_evt);
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        this.camera.movement.rotationAccumulatedPixels.y -= deltaX; // yaw - looking side to side
        this.camera.movement.rotationAccumulatedPixels.x -= deltaY; // pitch - look up towards sky / down towards ground
    }
}
