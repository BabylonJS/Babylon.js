import { type Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { type ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { OrbitCameraPointersInput } from "../../Cameras/Inputs/orbitCameraPointersInput";
import { type PointerTouch } from "../../Events/pointerEvents";
import { type IPointerEvent } from "../../Events/deviceInputEvents";
import { type InputMapEntry } from "../cameraInteractions";

/**
 * Manage the pointers inputs to control an arc rotate camera.
 * Uses the inputMap on the movement class to determine which button maps to which interaction.
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

    /** Cached resolved inputMap entry for the current pointer gesture */
    private _activeEntry: InputMapEntry | null = null;

    /**
     * Move camera from multi touch panning positions.
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    protected override _computeMultiTouchPanning(previousMultiTouchPanPosition: Nullable<PointerTouch>, multiTouchPanPosition: Nullable<PointerTouch>): void {
        if (previousMultiTouchPanPosition && multiTouchPanPosition) {
            const moveDeltaX = multiTouchPanPosition.x - previousMultiTouchPanPosition.x;
            const moveDeltaY = multiTouchPanPosition.y - previousMultiTouchPanPosition.y;
            // Multi-touch pan is a gesture (no button), so consult the default pointer→pan entry for an
            // explicit `sensitivity` override. When unset, fall back to the legacy `panningSensibility`
            // (treating panningSensibility=0 as "panning disabled" for backward compatibility).
            const panEntry = this.camera.movement.input.getEntry("pointer", "pan");
            const panScale = panEntry?.sensitivity ?? (this.panningSensibility !== 0 ? 1 / this.panningSensibility : 0);
            if (panScale !== 0) {
                this.camera.movement.activeInput = true;
                this.camera.movement.panAccumulatedPixels.x += -moveDeltaX * panScale;
                this.camera.movement.panAccumulatedPixels.y += moveDeltaY * panScale;
            }
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
            const delta = (pinchSquaredDistance - previousPinchSquaredDistance) * 0.001 * radius * this.pinchDeltaPercentage;
            this.camera.movement.activeInput = true;
            this.camera.movement.zoomAccumulatedPixels += delta;
        } else {
            const delta =
                (pinchSquaredDistance - previousPinchSquaredDistance) /
                ((this.pinchPrecision * (this.pinchInwards ? 1 : -1) * (this.angularSensibilityX + this.angularSensibilityY)) / 2);
            this.camera.movement.activeInput = true;
            this.camera.movement.zoomAccumulatedPixels += delta;
        }
    }

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * @param point current touch point
     * @param offsetX offset on X
     * @param offsetY offset on Y
     */
    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        // In pointer-lock mode, mouse movement rotates the camera even without a button held.
        // This matches legacy behavior where pointer-lock mouse deltas always drove rotation.
        const entry = this._activeEntry ?? (this.camera.getEngine().isPointerLock ? this.camera.movement.input.resolveInteraction("pointer", { button: 0, modifiers: {} }) : null);
        if (entry) {
            // Per-pixel scale. The inputMap entry's `sensitivity` takes precedence so consumers can
            // tune feel declaratively (and so we can phase out the legacy sensibility properties).
            // When `sensitivity` is unset, fall back to the legacy properties for backward compat.
            // For rotate, a single `sensitivity` value applies to both axes; the legacy fallback
            // preserves separate X/Y tuning via `angularSensibilityX/Y`.
            if (entry.interaction === "pan") {
                const panScale = entry.sensitivity ?? (this.panningSensibility !== 0 ? 1 / this.panningSensibility : 0);
                if (panScale !== 0) {
                    this.camera.movement.activeInput = true;
                    this.camera.movement.panAccumulatedPixels.x += -offsetX * panScale;
                    this.camera.movement.panAccumulatedPixels.y += offsetY * panScale;
                }
            } else if (entry.interaction === "rotate") {
                const rotateScaleX = entry.sensitivity ?? 1 / this.angularSensibilityX;
                const rotateScaleY = entry.sensitivity ?? 1 / this.angularSensibilityY;
                this.camera.movement.activeInput = true;
                this.camera.movement.rotationAccumulatedPixels.x += -offsetX * rotateScaleX;
                this.camera.movement.rotationAccumulatedPixels.y += -offsetY * rotateScaleY;
            }
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
        this._activeEntry = this.camera.movement.input.resolveInteraction("pointer", {
            button: evt.button,
            modifiers: { ctrl: evt.ctrlKey, alt: evt.altKey, shift: evt.shiftKey },
        });
        super.onButtonDown(evt);
    }

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * @param _evt Defines the event to track
     */
    public override onButtonUp(_evt: IPointerEvent): void {
        this._activeEntry = null;
        super.onButtonUp(_evt);
    }

    /**
     * Called when window becomes inactive.
     */
    public override onLostFocus(): void {
        this._activeEntry = null;
        super.onLostFocus();
    }
}
(<any>CameraInputTypes)["ArcRotateCameraPointersInput"] = ArcRotateCameraPointersInput;
