import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { EventState, Observer } from "../../Misc/observable";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Tools } from '../../Misc/tools';
import { IWheelEvent } from "../../Events/deviceInputEvents";

/**
 * Manage the mouse wheel inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * Gets or Set the mouse wheel precision or how fast is the camera zooming.
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
        // was there a second variable defined?
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._wheel = (p, s) => {
            //sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) { return; }
            const event = <IWheelEvent>p.event;
            let delta = 0;
            let wheelDelta = 0;

            // Using the inertia percentage, calculate the value needed to move based on set wheel delta percentage
            if (this.wheelDeltaPercentage !== 0) {
                wheelDelta = (event.deltaY > 0 ? -1 : 1) * this.camera.radius * this.wheelDeltaPercentage;
                delta = wheelDelta * (this.camera.inertia === 1 ? 1 : (1 - this.camera.inertia));
            }
            // If there's no percentage set, just handle using a value that emulates Chrome
            else {
                wheelDelta = (event.deltaY > 0 ? -100 : 100);

                if (this.wheelPrecision !== 0) {
                    delta = wheelDelta / (this.wheelPrecision * 40);
                }
            }

            if (delta) {
                this.camera.inertialRadiusOffset += delta;
            }

            if (event.preventDefault) {
                if (!noPreventDefault) {
                    event.preventDefault();
                }
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(this._wheel, PointerEventTypes.POINTERWHEEL);
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void;

    /**
     * Detach the current controls from the specified dom element.
     * @param ignored defines an ignored parameter kept for backward compatibility. If you want to define the source input element, you can set engine.inputElement before calling camera.attachControl
     */
    public detachControl(ignored?: any): void {
        if (this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
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

(<any>CameraInputTypes)["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
