import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { FollowCamera } from "../../Cameras/followCamera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";
import { Tools } from "../../Misc/tools";
import type { DeviceSourceType } from "../../DeviceInput/internalDeviceSourceManager";
import { DeviceType } from "../../DeviceInput/InputDevices/deviceEnums";

/**
 * Manage the mouse wheel inputs to control a follow camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
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

    private _wheel: (p: IWheelEvent) => void;
    private _observer: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this._connectedObserver = this.camera._deviceSourceManager!.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                this._observer = deviceSource.onInputChangedObservable.add((eventData) => {
                    if ("deltaY" in eventData) {
                        this._wheel(eventData);
                    }
                });
            }
        });

        this._disconnectedObserver = this.camera._deviceSourceManager!.onDeviceDisconnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.remove(this._observer);
                this._observer = null;
            }
        });

        this._wheel = (event) => {
            let delta = 0;

            const wheelDelta = Math.max(-1, Math.min(1, event.deltaY));
            if (this.wheelDeltaPercentage) {
                console.assert(
                    <number>(<unknown>this.axisControlRadius) + <number>(<unknown>this.axisControlHeight) + <number>(<unknown>this.axisControlRotation) <= 1,
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
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._observer) {
            this.camera._deviceSourceManager?.onDeviceConnectedObservable.remove(this._connectedObserver);
            this.camera._deviceSourceManager?.onDeviceDisconnectedObservable.remove(this._disconnectedObserver);
            const mouse = this.camera._deviceSourceManager?.getDeviceSource(DeviceType.Mouse);
            mouse?.onInputChangedObservable.remove(this._observer);
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
