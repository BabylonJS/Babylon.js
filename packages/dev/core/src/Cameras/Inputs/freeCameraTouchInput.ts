import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { FreeCamera } from "../../Cameras/freeCamera";
import { PointerEventTypes } from "../../Events/pointerEvents";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Tools } from "../../Misc/tools";
import type { IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";
import type { DeviceSourceType } from "../../DeviceInput/internalDeviceSourceManager";
import { DeviceType } from "../../DeviceInput/InputDevices/deviceEnums";
import { Logger } from "../../Misc/logger";
import { GestureRecognizer } from "../../DeviceInput/gestureRecognizer";
/**
 * Manage the touch inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraTouchInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Defines the touch sensibility for rotation.
     * The lower the faster.
     */
    @serialize()
    public touchAngularSensibility: number = 200000.0;

    /**
     * Defines the touch sensibility for move.
     * The lower the faster.
     */
    @serialize()
    public touchMoveSensibility: number = 250.0;

    /**
     * Swap touch actions so that one touch is used for rotation and multiple for movement
     */
    public singleFingerRotate: boolean = false;

    private _offsetX: Nullable<number> = null;
    private _offsetY: Nullable<number> = null;

    private _pointerPressed = new Array<number>();
    private _pointerInput: (p: IPointerEvent, type: PointerEventTypes) => void;
    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;
    private _mouseObserver: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _touchObservers: Array<Nullable<Observer<IPointerEvent>>>;
    private _isSafari: boolean;

    /**
     * Manage the touch inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     * @param allowMouse Defines if mouse events can be treated as touch events
     */
    constructor(
        /**
         * Define if mouse events can be treated as touch events
         */
        public allowMouse = false
    ) {
        this._isSafari = Tools.IsSafari();
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        const deviceSourceManager = this.camera._deviceSourceManager;
        // If the user tries to attach this control without having general camera controls active, warn and return.
        if (!deviceSourceManager) {
            Logger.Warn("Cannot attach control to camera.  Camera controls not present");
            return;
        }

        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        let previousPosition: Nullable<{ x: number; y: number }> = null;

        this._connectedObserver = deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                this._mouseObserver = deviceSource.onInputChangedObservable.add((eventData) => {
                    const type = GestureRecognizer.DeterminePointerEventType(deviceSource, eventData);
                    const pointerEventData = eventData as IPointerEvent;

                    if ((type & PointerEventTypes.POINTERMOVE) !== 0) {
                        this._pointerInput(pointerEventData, PointerEventTypes.POINTERMOVE);
                    }
                    if ((type & PointerEventTypes.POINTERDOWN) !== 0) {
                        this._pointerInput(pointerEventData, PointerEventTypes.POINTERDOWN);
                    }
                    if ((type & PointerEventTypes.POINTERUP) !== 0) {
                        this._pointerInput(pointerEventData, PointerEventTypes.POINTERUP);
                    }
                });
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                this._touchObservers[deviceSource.deviceSlot] = deviceSource.onInputChangedObservable.add((eventData) => {
                    const type = GestureRecognizer.DeterminePointerEventType(deviceSource, eventData);

                    if ((type & PointerEventTypes.POINTERMOVE) !== 0) {
                        this._pointerInput(eventData, PointerEventTypes.POINTERMOVE);
                    }
                    if ((type & PointerEventTypes.POINTERDOWN) !== 0) {
                        this._pointerInput(eventData, PointerEventTypes.POINTERDOWN);
                    }
                    if ((type & PointerEventTypes.POINTERUP) !== 0) {
                        this._pointerInput(eventData, PointerEventTypes.POINTERUP);
                    }
                });
            }
        });

        this._disconnectedObserver = deviceSourceManager.onDeviceDisconnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.remove(this._mouseObserver);
                this._mouseObserver = null;
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.remove(this._touchObservers[deviceSource.deviceSlot]);
                this._touchObservers[deviceSource.deviceSlot] = null;
            }
        });

        if (this._pointerInput === undefined) {
            this._onLostFocus = () => {
                this._offsetX = null;
                this._offsetY = null;
            };

            this._pointerInput = (p, t) => {
                const evt = p;

                const isMouseEvent = evt.pointerType === "mouse" || (this._isSafari && typeof evt.pointerType === "undefined");

                if (!this.allowMouse && isMouseEvent) {
                    return;
                }

                if (t === PointerEventTypes.POINTERDOWN) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    this._pointerPressed.push(evt.pointerId);

                    if (this._pointerPressed.length !== 1) {
                        return;
                    }

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };
                } else if (t === PointerEventTypes.POINTERUP) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    const index: number = this._pointerPressed.indexOf(evt.pointerId);

                    if (index === -1) {
                        return;
                    }
                    this._pointerPressed.splice(index, 1);

                    if (index != 0) {
                        return;
                    }
                    previousPosition = null;
                    this._offsetX = null;
                    this._offsetY = null;
                } else if (t === PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    if (!previousPosition) {
                        return;
                    }

                    const index: number = this._pointerPressed.indexOf(evt.pointerId);

                    if (index != 0) {
                        return;
                    }

                    this._offsetX = evt.clientX - previousPosition.x;
                    this._offsetY = -(evt.clientY - previousPosition.y);
                }
            };
        }

        if (this._onLostFocus) {
            const engine = this.camera.getEngine();
            const element = engine.getInputElement();
            element && element.addEventListener("blur", this._onLostFocus);
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._connectedObserver || this._disconnectedObserver) {
            const deviceSourceManager = this.camera._deviceSourceManager;
            if (deviceSourceManager) {
                deviceSourceManager.onDeviceConnectedObservable.remove(this._connectedObserver);
                deviceSourceManager.onDeviceDisconnectedObservable.remove(this._disconnectedObserver);
                const mouse = deviceSourceManager.getDeviceSource(DeviceType.Mouse);
                const touches = deviceSourceManager.getDeviceSources(DeviceType.Touch);

                mouse?.onInputChangedObservable.remove(this._mouseObserver);
                touches?.forEach((touch) => {
                    touch.onInputChangedObservable.remove(this._touchObservers[touch.deviceSlot]);
                });
            }

            if (this._onLostFocus) {
                const engine = this.camera.getEngine();
                const element = engine.getInputElement();
                element && element.removeEventListener("blur", this._onLostFocus);
                this._onLostFocus = null;
            }
            this._pointerPressed.length = 0;
            this._offsetX = null;
            this._offsetY = null;
        }
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this._offsetX === null || this._offsetY === null) {
            return;
        }
        if (this._offsetX === 0 && this._offsetY === 0) {
            return;
        }

        const camera = this.camera;
        camera.cameraRotation.y = this._offsetX / this.touchAngularSensibility;

        const rotateCamera = (this.singleFingerRotate && this._pointerPressed.length === 1) || (!this.singleFingerRotate && this._pointerPressed.length > 1);

        if (rotateCamera) {
            camera.cameraRotation.x = -this._offsetY / this.touchAngularSensibility;
        } else {
            const speed = camera._computeLocalCameraSpeed();
            const direction = new Vector3(0, 0, this.touchMoveSensibility !== 0 ? (speed * this._offsetY) / this.touchMoveSensibility : 0);

            Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
            camera.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraTouchInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "touch";
    }
}

(<any>CameraInputTypes)["FreeCameraTouchInput"] = FreeCameraTouchInput;
