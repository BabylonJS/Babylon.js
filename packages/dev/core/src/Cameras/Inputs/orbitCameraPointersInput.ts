import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { PointerTouch } from "../../Events/pointerEvents";
import type { IPointerEvent } from "../../Events/deviceInputEvents";
import { BaseCameraPointersInput } from "./BaseCameraPointersInput";

/**
 * Used by both arcrotatecamera and geospatialcamera, OrbitCameraPointersInputs handle pinchToZoom and multiTouchPanning
 * as though you are orbiting around a target point
 */
export abstract class OrbitCameraPointersInput extends BaseCameraPointersInput {
    /**
     * Defines whether zoom (2 fingers pinch) is enabled through multitouch
     */
    @serialize()
    public pinchZoom: boolean = true;

    /**
     * Defines whether panning (2 fingers swipe) is enabled through multitouch.
     */
    @serialize()
    public multiTouchPanning: boolean = true;

    /**
     * Defines whether panning is enabled for both pan (2 fingers swipe) and
     * zoom (pinch) through multitouch.
     */
    @serialize()
    public multiTouchPanAndZoom: boolean = true;

    protected _isPinching: boolean = false;
    protected _twoFingerActivityCount: number = 0;
    protected _shouldStartPinchZoom: boolean = false;

    protected _computePinchZoom(_previousPinchSquaredDistance: number, _pinchSquaredDistance: number): void {}

    protected _computeMultiTouchPanning(_previousMultiTouchPanPosition: Nullable<PointerTouch>, _multiTouchPanPosition: Nullable<PointerTouch>): void {}

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * Override this method to provide functionality.
     * @param _pointA First point in the pair
     * @param _pointB Second point in the pair
     * @param previousPinchSquaredDistance Sqr Distance between the points the last time this event was fired (by this input)
     * @param pinchSquaredDistance Sqr Distance between the points this time
     * @param previousMultiTouchPanPosition Previous center point between the points
     * @param multiTouchPanPosition Current center point between the points
     */
    public override onMultiTouch(
        _pointA: Nullable<PointerTouch>,
        _pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        if (previousPinchSquaredDistance === 0 && previousMultiTouchPanPosition === null) {
            // First time this method is called for new pinch.
            // Next time this is called there will be a
            // previousPinchSquaredDistance and pinchSquaredDistance to compare.
            return;
        }
        if (pinchSquaredDistance === 0 && multiTouchPanPosition === null) {
            // Last time this method is called at the end of a pinch.
            return;
        }

        // Zoom and panning enabled together
        if (this.multiTouchPanAndZoom) {
            this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
            this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);

            // Zoom and panning enabled but only one at a time
        } else if (this.multiTouchPanning && this.pinchZoom) {
            this._twoFingerActivityCount++;

            if (this._isPinching || this._shouldStartPinchZoom) {
                // Since pinch has not been active long, assume we intend to zoom.
                this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);

                // Since we are pinching, remain pinching on next iteration.
                this._isPinching = true;
            } else {
                // Pause between pinch starting and moving implies not a zoom event. Pan instead.
                this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);
            }

            // Panning enabled, zoom disabled
        } else if (this.multiTouchPanning) {
            this._computeMultiTouchPanning(previousMultiTouchPanPosition, multiTouchPanPosition);

            // Zoom enabled, panning disabled
        } else if (this.pinchZoom) {
            this._computePinchZoom(previousPinchSquaredDistance, pinchSquaredDistance);
        }
    }

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * @param _evt Defines the event to track
     */
    public override onButtonUp(_evt: IPointerEvent): void {
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
    }

    /**
     * Called when window becomes inactive.
     */
    public override onLostFocus(): void {
        this._twoFingerActivityCount = 0;
        this._isPinching = false;
    }
}
