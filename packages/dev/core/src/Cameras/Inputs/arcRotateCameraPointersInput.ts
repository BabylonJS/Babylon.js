import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { OrbitCameraPointersInput } from "../../Cameras/Inputs/orbitCameraPointersInput";
import type { PointerTouch } from "../../Events/pointerEvents";
import type { IPointerEvent } from "../../Events/deviceInputEvents";

/**
 * Manage the pointers inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraPointersInput extends OrbitCameraPointersInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * The minimum radius used for pinch, to avoid radius lock at 0
     */
    public static MinimumRadiusForPinch: number = 0.001;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public override getClassName(): string {
        return "ArcRotateCameraPointersInput";
    }

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public override buttons = [0, 1, 2];

    /**
     * Defines the pointer angular sensibility  along the X axis or how fast is
     * the camera rotating.
     */
    @serialize()
    public angularSensibilityX = 1000.0;

    /**
     * Defines the pointer angular sensibility along the Y axis or how fast is
     * the camera rotating.
     */
    @serialize()
    public angularSensibilityY = 1000.0;

    /**
     * Defines the pointer pinch precision or how fast is the camera zooming.
     */
    @serialize()
    public pinchPrecision = 12.0;

    /**
     * pinchDeltaPercentage will be used instead of pinchPrecision if different
     * from 0.
     * It defines the percentage of current camera.radius to use as delta when
     * pinch zoom is used.
     */
    @serialize()
    public pinchDeltaPercentage = 0;

    /**
     * When useNaturalPinchZoom is true, multi touch zoom will zoom in such
     * that any object in the plane at the camera's target point will scale
     * perfectly with finger motion.
     * Overrides pinchDeltaPercentage and pinchPrecision.
     */
    @serialize()
    public useNaturalPinchZoom: boolean = false;

    /**
     * Defines the pointer panning sensibility or how fast is the camera moving.
     */
    @serialize()
    public panningSensibility: number = 1000.0;

    /**
     * Revers pinch action direction.
     */
    public pinchInwards = true;

    private _isPanClick: boolean = false;

    /**
     * Move camera from multi touch panning positions.
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    protected override _computeMultiTouchPanning(previousMultiTouchPanPosition: Nullable<PointerTouch>, multiTouchPanPosition: Nullable<PointerTouch>): void {
        if (this.panningSensibility !== 0 && previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            this.camera.inertialPanningX += -moveDeltaX / this.panningSensibility;
            this.camera.inertialPanningY += moveDeltaY / this.panningSensibility;
        }
    }

    /**
     * Move camera from multitouch (pinch) zoom distances.
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     */
    protected override _computePinchZoom(previousPinchSquaredDistance: number, pinchSquaredDistance: number): void {
        const radius = this.camera.radius || ArcRotateCameraPointersInput.MinimumRadiusForPinch;
        if (this.useNaturalPinchZoom) {
            this.camera.radius = (radius * Math.sqrt(previousPinchSquaredDistance)) / Math.sqrt(pinchSquaredDistance);
        } else if (this.pinchDeltaPercentage) {
            this.camera.inertialRadiusOffset += (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 * radius * this.pinchDeltaPercentage;
        } else {
            this.camera.inertialRadiusOffset +=
                (pinchSquaredDistance - previousPinchSquaredDistance) /
                ((this.pinchPrecision * (this.pinchInwards ? 1 : -1) * (this.angularSensibilityX + this.angularSensibilityY)) / 2);
        }
    }

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * @param point current touch point
     * @param offsetX offset on X
     * @param offsetY offset on Y
     */
    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        if (this.panningSensibility !== 0 && ((this._ctrlKey && this.camera._useCtrlForPanning) || this._isPanClick)) {
            this.camera.inertialPanningX += -offsetX / this.panningSensibility;
            this.camera.inertialPanningY += offsetY / this.panningSensibility;
        } else {
            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
        }
    }

    /**
     * Called on pointer POINTERDOUBLETAP event.
     */
    public override onDoubleTap() {
        if (this.camera.useInputToRestoreState) {
            this.camera.restoreState();
        }
    }

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * @param pointA point A
     * @param pointB point B
     * @param previousPinchSquaredDistance distance between points in previous pinch
     * @param pinchSquaredDistance distance between points in current pinch
     * @param previousMultiTouchPanPosition multi-touch position in previous step
     * @param multiTouchPanPosition multi-touch position in current step
     */
    public override onMultiTouch(
        pointA: Nullable<PointerTouch>,
        pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        this._shouldStartPinchZoom =
            this._twoFingerActivityCount < 20 && Math.abs(Math.sqrt(pinchSquaredDistance) - Math.sqrt(previousPinchSquaredDistance)) > this.camera.pinchToPanMaxDistance;
        super.onMultiTouch(pointA, pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);
    }

    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     * @param evt Defines the event to track
     */
    public override onButtonDown(evt: IPointerEvent): void {
        this._isPanClick = evt.button === this.camera._panningMouseButton;
        super.onButtonDown(evt);
    }

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * @param _evt Defines the event to track
     */
    public override onButtonUp(_evt: IPointerEvent): void {
        super.onButtonUp(_evt);
    }

    /**
     * Called when window becomes inactive.
     */
    public override onLostFocus(): void {
        this._isPanClick = false;
        super.onLostFocus();
    }
}
(<any>CameraInputTypes)["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
