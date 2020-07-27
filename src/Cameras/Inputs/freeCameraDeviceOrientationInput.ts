import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { Quaternion } from "../../Maths/math.vector";
import { Tools } from "../../Misc/tools";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager";
import { Observable } from '../../Misc/observable';

// Module augmentation to abstract orientation inputs from camera.
declare module "../../Cameras/freeCameraInputsManager" {
    export interface FreeCameraInputsManager {
        /**
         * @hidden
         */
        _deviceOrientationInput: Nullable<FreeCameraDeviceOrientationInput>;
        /**
         * Add orientation input support to the input manager.
         * @returns the current input manager
         */
        addDeviceOrientation(): FreeCameraInputsManager;
    }
}

/**
 * Add orientation input support to the input manager.
 * @returns the current input manager
 */
FreeCameraInputsManager.prototype.addDeviceOrientation = function(): FreeCameraInputsManager {
    if (!this._deviceOrientationInput) {
        this._deviceOrientationInput = new FreeCameraDeviceOrientationInput();
        this.add(this._deviceOrientationInput);
    }

    return this;
};

/**
 * Takes information about the orientation of the device as reported by the deviceorientation event to orient the camera.
 * Screen rotation is taken into account.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraDeviceOrientationInput implements ICameraInput<FreeCamera> {
    private _camera: FreeCamera;

    private _screenOrientationAngle: number = 0;

    private _constantTranform: Quaternion;
    private _screenQuaternion: Quaternion = new Quaternion();

    private _alpha: number = 0;
    private _beta: number = 0;
    private _gamma: number = 0;

    /**
     * Can be used to detect if a device orientation sensor is available on a device
     * @param timeout amount of time in milliseconds to wait for a response from the sensor (default: infinite)
     * @returns a promise that will resolve on orientation change
     */
    public static WaitForOrientationChangeAsync(timeout?: number) {
        return new Promise((res, rej) => {
            var gotValue = false;
            var eventHandler = () => {
                window.removeEventListener("deviceorientation", eventHandler);
                gotValue = true;
                res();
            };

            // If timeout is populated reject the promise
            if (timeout) {
                setTimeout(() => {
                    if (!gotValue) {
                        window.removeEventListener("deviceorientation", eventHandler);
                        rej("WaitForOrientationChangeAsync timed out");
                    }
                }, timeout);
            }

            if (typeof(DeviceOrientationEvent) !== "undefined" && typeof (<any>DeviceOrientationEvent).requestPermission === 'function') {
                (<any>DeviceOrientationEvent).requestPermission()
                    .then((response: string) => {
                        if (response == 'granted') {
                            window.addEventListener("deviceorientation", eventHandler);
                        } else {
                            Tools.Warn("Permission not granted.");
                        }
                    })
                    .catch((error: any) => {
                        Tools.Error(error);
                    });
            } else {
                window.addEventListener("deviceorientation", eventHandler);
            }
        });
    }

    /**
     * @hidden
     */
    public _onDeviceOrientationChangedObservable = new Observable<void>();
    /**
     * Instantiates a new input
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    constructor() {
        this._constantTranform = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        this._orientationChanged();
    }

    /**
     * Define the camera controlled by the input.
     */
    public get camera(): FreeCamera {
        return this._camera;
    }

    public set camera(camera: FreeCamera) {
        this._camera = camera;
        if (this._camera != null && !this._camera.rotationQuaternion) {
            this._camera.rotationQuaternion = new Quaternion();
        }
        if (this._camera) {
            this._camera.onDisposeObservable.add(() => {
                this._onDeviceOrientationChangedObservable.clear();
            });
        }
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {

        let hostWindow = this.camera.getScene().getEngine().getHostWindow();

        if (hostWindow) {

            const eventHandler = () => {
                hostWindow!.addEventListener("orientationchange", this._orientationChanged);
                hostWindow!.addEventListener("deviceorientation", this._deviceOrientation);
                //In certain cases, the attach control is called AFTER orientation was changed,
                //So this is needed.
                this._orientationChanged();
            };
            if (typeof(DeviceOrientationEvent) !== "undefined" && typeof (<any>DeviceOrientationEvent).requestPermission === 'function') {
                (<any>DeviceOrientationEvent).requestPermission()
                    .then((response: string) => {
                        if (response === 'granted') {
                            eventHandler();
                        } else {
                            Tools.Warn("Permission not granted.");
                        }
                    })
                    .catch((error: any) => {
                        Tools.Error(error);
                    });
            } else {
                eventHandler();
            }
        }
    }

    private _orientationChanged = () => {
        this._screenOrientationAngle = (<any>window.orientation !== undefined ? +<any>window.orientation : ((<any>window.screen).orientation && ((<any>window.screen).orientation)['angle'] ? ((<any>window.screen).orientation).angle : 0));
        this._screenOrientationAngle = -Tools.ToRadians(this._screenOrientationAngle / 2);
        this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
    }

    private _deviceOrientation = (evt: DeviceOrientationEvent) => {
        this._alpha = evt.alpha !== null ? evt.alpha : 0;
        this._beta = evt.beta !== null ? evt.beta : 0;
        this._gamma = evt.gamma !== null ? evt.gamma : 0;
        if (evt.alpha !== null) {
            this._onDeviceOrientationChangedObservable.notifyObservers();
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        window.removeEventListener("orientationchange", this._orientationChanged);
        window.removeEventListener("deviceorientation", this._deviceOrientation);
        this._alpha = 0;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        //if no device orientation provided, don't update the rotation.
        //Only testing against alpha under the assumption thatnorientation will never be so exact when set.
        if (!this._alpha) { return; }
        Quaternion.RotationYawPitchRollToRef(Tools.ToRadians(this._alpha), Tools.ToRadians(this._beta), -Tools.ToRadians(this._gamma), this.camera.rotationQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
        this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform);
        //Mirror on XY Plane
        this._camera.rotationQuaternion.z *= -1;
        this._camera.rotationQuaternion.w *= -1;
    }

    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraDeviceOrientationInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "deviceOrientation";
    }
}

(<any>CameraInputTypes)["FreeCameraDeviceOrientationInput"] = FreeCameraDeviceOrientationInput;
