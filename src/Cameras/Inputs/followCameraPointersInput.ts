import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { FollowCamera } from "../../Cameras/followCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraPointersInput } from "../../Cameras/Inputs/BaseCameraPointersInput";
import { PointerTouch } from "../../Events/pointerEvents";

/**
 * Manage the pointers inputs to control an follow camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FollowCameraPointersInput extends BaseCameraPointersInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FollowCamera;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FollowCameraPointersInput";
    }

    /**
     * Defines the pointer angular sensibility along the X axis or how fast is
     * the camera rotating.
     * A negative number will reverse the axis direction.
     */
    @serialize()
    public angularSensibilityX = 1;

    /**
     * Defines the pointer angular sensibility along the Y axis or how fast is
     * the camera rotating.
     * A negative number will reverse the axis direction.
     */
    @serialize()
    public angularSensibilityY = 1;

    /**
     * Defines the pointer pinch precision or how fast is the camera zooming.
     * A negative number will reverse the axis direction.
     */
    @serialize()
    public pinchPrecision = 10000.0;

    /**
     * pinchDeltaPercentage will be used instead of pinchPrecision if different
     * from 0.
     * It defines the percentage of current camera.radius to use as delta when
     * pinch zoom is used.
     */
    @serialize()
    public pinchDeltaPercentage = 0;

    /**
     * Pointer X axis controls zoom. (X axis modifies camera.radius value.)
     */
    @serialize()
    public axisXControlRadius: boolean = false;

    /**
     * Pointer X axis controls height. (X axis modifies camera.heightOffset value.)
     */
    @serialize()
    public axisXControlHeight: boolean = false;

    /**
     * Pointer X axis controls angle. (X axis modifies camera.rotationOffset value.)
     */
    @serialize()
    public axisXControlRotation: boolean = true;

    /**
     * Pointer Y axis controls zoom. (Y axis modifies camera.radius value.)
     */
    @serialize()
    public axisYControlRadius: boolean = false;

    /**
     * Pointer Y axis controls height. (Y axis modifies camera.heightOffset value.)
     */
    @serialize()
    public axisYControlHeight: boolean = true;

    /**
     * Pointer Y axis controls angle. (Y axis modifies camera.rotationOffset value.)
     */
    @serialize()
    public axisYControlRotation: boolean = false;

    /**
     * Pinch controls zoom. (Pinch modifies camera.radius value.)
     */
    @serialize()
    public axisPinchControlRadius: boolean = true;

    /**
     * Pinch controls height. (Pinch modifies camera.heightOffset value.)
     */
    @serialize()
    public axisPinchControlHeight: boolean = false;

    /**
     * Pinch controls angle. (Pinch modifies camera.rotationOffset value.)
     */
    @serialize()
    public axisPinchControlRotation: boolean = false;

    /**
     * Log error messages if basic misconfiguration has occurred.
     */
    public warningEnable: boolean = true;

    protected onTouch(pointA: Nullable<PointerTouch>,
                      offsetX: number,
                      offsetY: number): void
    {
        this._warning();

        if (this.axisXControlRotation) {
            this.camera.rotationOffset += offsetX / this.angularSensibilityX;
        } else if (this.axisYControlRotation) {
            this.camera.rotationOffset += offsetY / this.angularSensibilityX;
        }

        if (this.axisXControlHeight) {
            this.camera.heightOffset += offsetX / this.angularSensibilityY;
        } else if (this.axisYControlHeight) {
            this.camera.heightOffset += offsetY / this.angularSensibilityY;
        }

        if (this.axisXControlRadius) {
            this.camera.radius -= offsetX / this.angularSensibilityY;
        } else if (this.axisYControlRadius) {
            this.camera.radius -= offsetY / this.angularSensibilityY;
        }
    }

    protected onMultiTouch(pointA: Nullable<PointerTouch>,
                           pointB: Nullable<PointerTouch>,
                           previousPinchSquaredDistance: number,
                           pinchSquaredDistance: number,
                           previousMultiTouchPanPosition: Nullable<PointerTouch>,
                           multiTouchPanPosition: Nullable<PointerTouch>): void
    {
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
        var pinchDelta =
            (pinchSquaredDistance - previousPinchSquaredDistance) /
            (this.pinchPrecision * (this.angularSensibilityX + this.angularSensibilityY) / 2);

        if (this.pinchDeltaPercentage) {
            pinchDelta *= 0.01 * this.pinchDeltaPercentage;
            if (this.axisPinchControlRotation) {
                this.camera.rotationOffset += pinchDelta * this.camera.rotationOffset;
            }
            if (this.axisPinchControlHeight) {
                this.camera.heightOffset += pinchDelta * this.camera.heightOffset;
            }
            if (this.axisPinchControlRadius) {
                this.camera.radius -= pinchDelta * this.camera.radius;
            }
        } else {
            if (this.axisPinchControlRotation) {
                this.camera.rotationOffset += pinchDelta;
            }

            if (this.axisPinchControlHeight) {
                this.camera.heightOffset += pinchDelta;
            }

            if (this.axisPinchControlRadius) {
                this.camera.radius -= pinchDelta;
            }
        }
    }

    /* Check for obvious misconfiguration. */
    private _warningCounter: number = 0;
    private _warning(): void {
        if (!this.warningEnable || this._warningCounter++ % 100 !== 0) {
            return;
        }
        let warn = "It probably only makes sense to control ONE camera " +
                   "property with each pointer axis. Set 'warningEnable = false' " +
                   "if you are sure. Currently enabled: ";

        console.assert((<number>(<unknown>this.axisXControlRotation) +
                        <number>(<unknown>this.axisXControlHeight) +
                        <number>(<unknown>this.axisXControlRadius)) <= 1,
                       warn +
                       "axisXControlRotation: " + this.axisXControlRotation +
                       ", axisXControlHeight: " + this.axisXControlHeight +
                       ", axisXControlRadius: " + this.axisXControlRadius);
        console.assert((<number>(<unknown>this.axisYControlRotation) +
                        <number>(<unknown>this.axisYControlHeight) +
                        <number>(<unknown>this.axisYControlRadius)) <= 1,
                       warn +
                       "axisYControlRotation: " + this.axisYControlRotation +
                       ", axisYControlHeight: " + this.axisYControlHeight +
                       ", axisYControlRadius: " + this.axisYControlRadius);
        console.assert((<number>(<unknown>this.axisPinchControlRotation) +
                        <number>(<unknown>this.axisPinchControlHeight) +
                        <number>(<unknown>this.axisPinchControlRadius)) <= 1,
                       warn +
                       "axisPinchControlRotation: " + this.axisPinchControlRotation +
                       ", axisPinchControlHeight: " + this.axisPinchControlHeight +
                       ", axisPinchControlRadius: " + this.axisPinchControlRadius);
    }
}
(<any>CameraInputTypes)["FollowCameraPointersInput"] = FollowCameraPointersInput;
