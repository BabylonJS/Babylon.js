import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { EventState, Observer } from "../../Misc/observable";
import type { FollowCamera } from "../../Cameras/followCamera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { IWheelEvent } from "../../Events/deviceInputEvents";
import { Tools } from "../../Misc/tools";
import { Logger } from "core/Misc/logger";

/**
 * Manage the mouse wheel inputs to control a follow camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FollowCameraMouseWheelInput implements ICameraInput<FollowCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FollowCamera;

    /**
     * Moue wheel controls zoom. (Mouse wheel modifies camera.radius value.)
     */
    @serialize()
    public axisControlRadius: boolean = true;

    /**
     * Moue wheel controls height. (Mouse wheel modifies camera.heightOffset value.)
     */
    @serialize()
    public axisControlHeight: boolean = false;

    /**
     * Moue wheel controls angle. (Mouse wheel modifies camera.rotationOffset value.)
     */
    @serialize()
    public axisControlRotation: boolean = false;

    /**
     * Gets or Set the mouse wheel precision or how fast is the camera moves in
     * relation to mouseWheel events.
     */
    @serialize()
    public wheelPrecision = 3.0;

    /**
     * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when wheel is used.
     */
    @serialize()
    public wheelDeltaPercentage = 0;

    private _wheel: Nullable<(p: PointerInfo, s: EventState) => void>;
    private _observer: Nullable<Observer<PointerInfo>>;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._wheel = (p) => {
            // sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) {
                return;
            }
            const event = <IWheelEvent>p.event;
            let delta = 0;

            const wheelDelta = Math.max(-1, Math.min(1, event.deltaY));
            if (this.wheelDeltaPercentage) {
                if (+this.axisControlRadius + +this.axisControlHeight + +this.axisControlRotation) {
                    Logger.Warn(
                        "wheelDeltaPercentage only usable when mouse wheel " +
                            "controls ONE axis. " +
                            "Currently enabled: " +
                            "axisControlRadius: " +
                            this.axisControlRadius +
                            ", axisControlHeightOffset: " +
                            this.axisControlHeight +
                            ", axisControlRotationOffset: " +
                            this.axisControlRotation
                    );
                }

                if (this.axisControlRadius) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.radius;
                } else if (this.axisControlHeight) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.heightOffset;
                } else if (this.axisControlRotation) {
                    delta = wheelDelta * 0.01 * this.wheelDeltaPercentage * this.camera.rotationOffset;
                }
            } else {
                delta = wheelDelta * this.wheelPrecision;
            }

            if (delta) {
                if (this.axisControlRadius) {
                    this.camera.radius += delta;
                } else if (this.axisControlHeight) {
                    this.camera.heightOffset -= delta;
                } else if (this.axisControlRotation) {
                    this.camera.rotationOffset -= delta;
                }
            }

            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };

        this._observer = this.camera.getScene()._inputManager._addCameraPointerObserver(this._wheel, PointerEventTypes.POINTERWHEEL);
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
            this._observer = null;
            this._wheel = null;
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraMouseWheelInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mousewheel";
    }
}

(<any>CameraInputTypes)["FollowCameraMouseWheelInput"] = FollowCameraMouseWheelInput;
