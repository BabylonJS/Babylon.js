import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { EventState, Observer } from "../../Misc/observable";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { IWheelEvent } from "../../Events/deviceInputEvents";
import { EventConstants } from "../../Events/deviceInputEvents";
import { Tools } from "../../Misc/tools";

/**
 * Firefox uses a different scheme to report scroll distances to other
 * browsers. Rather than use complicated methods to calculate the exact
 * multiple we need to apply, let's just cheat and use a constant.
 * https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
 * https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
 */
const FfMultiplier = 40;

/**
 * @experimental
 * Manage the mouse wheel inputs to control a geospatial camera. As this is experimental the API will evolve
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class GeospatialCameraMouseWheelInput implements ICameraInput<GeospatialCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: GeospatialCamera;

    /**
     * Gets or Set the mouse wheel precision or how fast is the camera zooming.
     */
    @serialize()
    public wheelPrecision = 1.0;

    /**
     * wheelDeltaPercentage will be used instead of wheelPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when wheel is used.
     */
    @serialize()
    public wheelDeltaPercentage = 0;

    private _wheel: Nullable<(p: PointerInfo, s: EventState) => void>;
    private _observer: Nullable<Observer<PointerInfo>>;

    protected _computeDeltaFromMouseWheelDefault(mouseWheelDelta: number, radius: number) {
        let delta = 0;
        const wheelDelta = mouseWheelDelta * 0.01 * this.wheelDeltaPercentage * radius;
        if (mouseWheelDelta > 0) {
            delta = wheelDelta / (1.0 + this.wheelDeltaPercentage);
        } else {
            delta = wheelDelta * (1.0 + this.wheelDeltaPercentage);
        }
        return delta;
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._wheel = (p) => {
            //sanity check - this should be a PointerWheel event.
            if (p.type !== PointerEventTypes.POINTERWHEEL) {
                return;
            }
            const event = <IWheelEvent>p.event;
            let delta = 0;
            const platformScale = event.deltaMode === EventConstants.DOM_DELTA_LINE ? FfMultiplier : 1; // If this happens to be set to DOM_DELTA_LINE, adjust accordingly

            const wheelDelta = -(event.deltaY * platformScale);

            if (this.wheelDeltaPercentage) {
                delta = this._computeDeltaFromMouseWheelDefault(wheelDelta, this.camera.position.length());
            } else {
                delta = wheelDelta / (this.wheelPrecision * 40);
            }

            if (delta) {
                const scene = this.camera.getScene();
                const pickResult = scene.pick(scene.pointerX, scene.pointerY);
                if (pickResult) {
                    this.camera.zoomToCursor(delta);
                } else {
                    // default to zooming along look vector
                    this.camera.zoomAlongLook(delta);
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
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {}

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "GeospatialCameraMouseWheelInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mousewheel";
    }
}

(<any>CameraInputTypes)["GeospatialCameraMouseWheelInput"] = GeospatialCameraMouseWheelInput;