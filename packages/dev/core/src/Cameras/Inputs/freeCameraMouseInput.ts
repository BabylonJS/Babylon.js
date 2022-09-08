import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import { serialize } from "../../Misc/decorators";
import type { Nullable } from "../../types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { FreeCamera } from "../../Cameras/freeCamera";
import { Tools } from "../../Misc/tools";
import type { IMouseEvent, IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";
import { DeviceType, PointerInput } from "../../DeviceInput/InputDevices/deviceEnums";
import type { DeviceSourceType } from "../../DeviceInput/internalDeviceSourceManager";
import { PointerEventTypes } from "../../Events";
/**
 * Manage the mouse inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
     */
    @serialize()
    public angularSensibility = 2000.0;

    private _pointerInput: (p: IPointerEvent, type: PointerEventTypes) => void;
    private _onMouseMove: Nullable<(e: IMouseEvent) => any>;
    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _previousPosition: Nullable<{ x: number; y: number }> = null;
    private _mouseObserver: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _touchObservers: Array<Nullable<Observer<IPointerEvent>>>;

    /**
     * Observable for when a pointer move event occurs containing the move offset
     */
    public onPointerMovedObservable = new Observable<{ offsetX: number; offsetY: number }>();
    /**
     * @hidden
     * If the camera should be rotated automatically based on pointer movement
     */
    public _allowCameraRotation = true;

    private _currentActiveButton: number = -1;

    private _contextMenuBind: () => void;

    /**
     * Manage the mouse inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     * @param touchEnabled Defines if touch is enabled or not
     */
    constructor(
        /**
         * Define if touch is enabled in the mouse input
         */
        public touchEnabled = true
    ) {
        this._touchObservers = [];
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        const engine = this.camera.getEngine();
        const element = engine.getInputElement();

        this._connectedObserver = this.camera._deviceSourceManager!.onDeviceConnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                this._mouseObserver = deviceSource.onInputChangedObservable.add((eventData) => {
                    if (!("deltaY" in eventData)) {
                        let type = PointerEventTypes.POINTERMOVE;

                        if (eventData.inputIndex !== PointerInput.Move) {
                            type = deviceSource.getInput(eventData.inputIndex) === 1 ? PointerEventTypes.POINTERDOWN : PointerEventTypes.POINTERUP;
                        }

                        this._pointerInput(eventData, type);
                    }
                });
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                this._touchObservers[deviceSource.deviceSlot] = deviceSource.onInputChangedObservable.add((eventData) => {
                    let type = PointerEventTypes.POINTERMOVE;

                    if (eventData.inputIndex !== PointerInput.Move) {
                        type = deviceSource.getInput(eventData.inputIndex) === 1 ? PointerEventTypes.POINTERDOWN : PointerEventTypes.POINTERUP;
                    }

                    this._pointerInput(eventData, type);
                });
            }
        });

        this._disconnectedObserver = this.camera._deviceSourceManager!.onDeviceDisconnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.remove(this._mouseObserver);
                this._mouseObserver = null;
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.remove(this._touchObservers[deviceSource.deviceSlot]);
                this._touchObservers[deviceSource.deviceSlot] = null;
            }
        });

        if (!this._pointerInput) {
            this._pointerInput = (p, t) => {
                const evt = p;
                const isTouch = evt.pointerType === "touch";

                if (engine.isInVRExclusivePointerMode) {
                    return;
                }

                if (!this.touchEnabled && isTouch) {
                    return;
                }

                if (t !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

                const srcElement = <HTMLElement>(evt.srcElement || evt.target);

                if (t === PointerEventTypes.POINTERDOWN && (this._currentActiveButton === -1 || isTouch)) {
                    try {
                        srcElement?.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }

                    if (this._currentActiveButton === -1) {
                        this._currentActiveButton = evt.button;
                    }

                    this._previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element && element.focus();
                    }

                    // This is required to move while pointer button is down
                    if (engine.isPointerLock && this._onMouseMove) {
                        this._onMouseMove(p);
                    }
                } else if (t === PointerEventTypes.POINTERUP && (this._currentActiveButton === evt.button || isTouch)) {
                    try {
                        srcElement?.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }
                    this._currentActiveButton = -1;

                    this._previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                } else if (t === PointerEventTypes.POINTERMOVE) {
                    if (engine.isPointerLock && this._onMouseMove) {
                        this._onMouseMove(p);
                    } else if (this._previousPosition) {
                        let offsetX = evt.clientX - this._previousPosition.x;
                        const offsetY = evt.clientY - this._previousPosition.y;
                        if (this.camera.getScene().useRightHandedSystem) {
                            offsetX *= -1;
                        }
                        if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) {
                            offsetX *= -1;
                        }

                        if (this._allowCameraRotation) {
                            this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                            this.camera.cameraRotation.x += offsetY / this.angularSensibility;
                        }
                        this.onPointerMovedObservable.notifyObservers({ offsetX: offsetX, offsetY: offsetY });

                        this._previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY,
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };
        }

        this._onMouseMove = (evt) => {
            if (!engine.isPointerLock) {
                return;
            }

            if (engine.isInVRExclusivePointerMode) {
                return;
            }

            let offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
            if (this.camera.getScene().useRightHandedSystem) {
                offsetX *= -1;
            }
            if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) {
                offsetX *= -1;
            }
            this.camera.cameraRotation.y += offsetX / this.angularSensibility;

            const offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            this.camera.cameraRotation.x += offsetY / this.angularSensibility;

            this._previousPosition = null;

            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };

        if (element) {
            this._contextMenuBind = this.onContextMenu.bind(this);
            element.addEventListener("contextmenu", this._contextMenuBind, false); // TODO: We need to figure out how to handle this for Native
        }
    }

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     * @param evt
     */
    public onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._connectedObserver || this._disconnectedObserver) {
            this.camera._deviceSourceManager?.onDeviceConnectedObservable.remove(this._connectedObserver);
            this.camera._deviceSourceManager?.onDeviceDisconnectedObservable.remove(this._disconnectedObserver);
            const mouse = this.camera._deviceSourceManager?.getDeviceSource(DeviceType.Mouse);
            const touches = this.camera._deviceSourceManager?.getDeviceSources(DeviceType.Touch);

            mouse?.onInputChangedObservable.remove(this._mouseObserver);
            touches?.forEach((touch) => {
                touch.onInputChangedObservable.remove(this._touchObservers[touch.deviceSlot]);
            });

            if (this._contextMenuBind) {
                const engine = this.camera.getEngine();
                const element = engine.getInputElement();
                element && element.removeEventListener("contextmenu", this._contextMenuBind);
            }

            if (this.onPointerMovedObservable) {
                this.onPointerMovedObservable.clear();
            }

            this._onMouseMove = null;
            this._previousPosition = null;
        }

        this._currentActiveButton = -1;
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mouse";
    }
}

(<any>CameraInputTypes)["FreeCameraMouseInput"] = FreeCameraMouseInput;
