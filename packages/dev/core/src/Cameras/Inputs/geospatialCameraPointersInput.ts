import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
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
 * Middle mouse button: tilt globe
 * Right mouse button: tilt globe
 *
 */
export class GeospatialCameraPointersInput extends OrbitCameraPointersInput {
    public camera: GeospatialCamera;

    private _initialPinchSquaredDistance: number = 0;
    private _pinchCentroid: Nullable<PointerTouch> = null;

    public override getClassName(): string {
        return "GeospatialCameraPointersInput";
    }

    public override onButtonDown(evt: IPointerEvent): void {
        this.camera.movement.activeInput = true;
        const scene = this.camera.getScene();
        switch (evt.button) {
            case 0: // Left button - drag/pan globe under cursor
                this.camera.movement.startDrag(scene.pointerX, scene.pointerY);
                break;
            default:
                break;
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
     * Zooms towards the centroid (midpoint between the two fingers).
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     */
    protected override _computePinchZoom(previousPinchSquaredDistance: number, pinchSquaredDistance: number): void {
        // Calculate zoom distance based on pinch delta
        const previousDistance = Math.sqrt(previousPinchSquaredDistance);
        const currentDistance = Math.sqrt(pinchSquaredDistance);
        const pinchDelta = currentDistance - previousDistance;

        // Try to zoom towards centroid if we have it
        if (this._pinchCentroid) {
            const scene = this.camera.getScene();
            const engine = scene.getEngine();
            const canvasRect = engine.getInputElementClientRect();

            if (canvasRect) {
                // Convert centroid from clientX/Y to canvas-relative coordinates (same as scene.pointerX/Y)
                const canvasX = this._pinchCentroid.x - canvasRect.left;
                const canvasY = this._pinchCentroid.y - canvasRect.top;

                // Pick at centroid
                const pickResult = scene.pick(canvasX, canvasY, this.camera.movement.pickPredicate);
                if (pickResult?.pickedPoint) {
                    // Scale zoom by distance to picked point
                    const distanceToPoint = this.camera.position.subtract(pickResult.pickedPoint).length();
                    const zoomDistance = pinchDelta * distanceToPoint * 0.005;
                    const clampedZoom = this.camera.limits.clampZoomDistance(zoomDistance, this.camera.radius, distanceToPoint);
                    this.camera.zoomToPoint(pickResult.pickedPoint, clampedZoom);
                    return;
                }
            }
        }

        // Fallback: scale zoom by camera radius along lookat vector
        const zoomDistance = pinchDelta * this.camera.radius * 0.005;
        const clampedZoom = this.camera.limits.clampZoomDistance(zoomDistance, this.camera.radius);
        this.camera.zoomAlongLookAt(clampedZoom);
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
        const pickResult = this.camera._scene.pick(this.camera._scene.pointerX, this.camera._scene.pointerY, this.camera.movement.pickPredicate);
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
        // Store centroid for use in _computePinchZoom (it's already calculated by parent)
        this._pinchCentroid = multiTouchPanPosition;

        // Reset on gesture end
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            this._initialPinchSquaredDistance = 0;
            this._pinchCentroid = null;
            super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
            return;
        }

        // Track initial distance at gesture start for cumulative threshold detection
        if (this._initialPinchSquaredDistance === 0 && pinchSquaredDistance !== 0) {
            this._initialPinchSquaredDistance = pinchSquaredDistance;
        }

        // Use cumulative delta from gesture start for threshold detection (more forgiving than frame-to-frame)
        const cumulativeDelta = Math.abs(Math.sqrt(pinchSquaredDistance) - Math.sqrt(this._initialPinchSquaredDistance));
        this._shouldStartPinchZoom = this._twoFingerActivityCount < 20 && cumulativeDelta > this.camera.limits.pinchToPanMax;

        super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
    }

    public override onButtonUp(_evt: IPointerEvent): void {
        this.camera.movement.stopDrag();
        this.camera.movement.activeInput = false;
        this._initialPinchSquaredDistance = 0;
        this._pinchCentroid = null;
        super.onButtonUp(_evt);
    }

    public override onLostFocus(): void {
        this._initialPinchSquaredDistance = 0;
        this._pinchCentroid = null;
        super.onLostFocus();
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        this.camera.movement.rotationAccumulatedPixels.y -= deltaX; // yaw - looking side to side
        this.camera.movement.rotationAccumulatedPixels.x -= deltaY; // pitch - look up towards sky / down towards ground
    }
}
