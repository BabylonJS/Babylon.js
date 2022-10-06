/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import type { Camera } from "../../Cameras/camera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { PointerTouch } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { IPointerEvent, IWheelEvent } from "../../Events/deviceInputEvents";
import type { DeviceSourceType } from "../../DeviceInput/internalDeviceSourceManager";
import { DeviceType } from "../../DeviceInput/InputDevices/deviceEnums";
import { Logger } from "../../Misc/logger";
import { GestureRecognizer } from "core/DeviceInput/gestureRecognizer";

/**
 * Base class for Camera Pointer Inputs.
 * See FollowCameraPointersInput in src/Cameras/Inputs/followCameraPointersInput.ts
 * for example usage.
 */
export abstract class BaseCameraPointersInput implements ICameraInput<Camera> {
    /**
     * Defines the camera the input is attached to.
     */
    public abstract camera: Camera;

    /**
     * Whether keyboard modifier keys are pressed at time of last mouse event.
     */
    protected _altKey: boolean;
    protected _ctrlKey: boolean;
    protected _metaKey: boolean;
    protected _shiftKey: boolean;

    /**
     * Which mouse buttons were pressed at time of last mouse event.
     * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
     */
    protected _buttonsPressed: number;

    private _currentActiveButton: number = -1;
    private _contextMenuBind: EventListener;

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];

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
        const engine = this.camera.getEngine();
        const element = engine.getInputElement();
        let previousPinchSquaredDistance = 0;
        let previousMultiTouchPanPosition: Nullable<PointerTouch> = null;

        this._pointA = null;
        this._pointB = null;

        this._altKey = false;
        this._ctrlKey = false;
        this._metaKey = false;
        this._shiftKey = false;
        this._buttonsPressed = 0;

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
                    if ((type & PointerEventTypes.POINTERDOUBLETAP) !== 0) {
                        this._pointerInput(pointerEventData, PointerEventTypes.POINTERDOUBLETAP);
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

        this._disconnectedObserver = this.camera._deviceSourceManager!.onDeviceDisconnectedObservable.add((deviceSource) => {
            if (deviceSource.deviceType === DeviceType.Mouse) {
                deviceSource.onInputChangedObservable.remove(this._mouseObserver);
                this._mouseObserver = null;
            } else if (deviceSource.deviceType === DeviceType.Touch) {
                deviceSource.onInputChangedObservable.remove(this._touchObservers[deviceSource.deviceSlot]);
                this._touchObservers[deviceSource.deviceSlot] = null;
            }
        });

        this._pointerInput = (eventData, type) => {
            const isTouch = eventData.pointerType === "touch";

            if (engine.isInVRExclusivePointerMode) {
                return;
            }

            if (type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(eventData.button) === -1) {
                return;
            }

            const srcElement = <HTMLElement>eventData.target;

            this._altKey = eventData.altKey;
            this._ctrlKey = eventData.ctrlKey;
            this._metaKey = eventData.metaKey;
            this._shiftKey = eventData.shiftKey;
            this._buttonsPressed = eventData.buttons;

            if (engine.isPointerLock) {
                const offsetX = eventData.movementX;
                const offsetY = eventData.movementY;

                this.onTouch(null, offsetX, offsetY);
                this._pointA = null;
                this._pointB = null;
            } else if (type === PointerEventTypes.POINTERDOWN && (this._currentActiveButton === -1 || isTouch)) {
                try {
                    srcElement?.setPointerCapture(eventData.pointerId);
                } catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }

                if (this._pointA === null) {
                    this._pointA = {
                        x: eventData.clientX,
                        y: eventData.clientY,
                        pointerId: eventData.pointerId,
                        type: eventData.pointerType,
                    };
                } else if (this._pointB === null) {
                    this._pointB = {
                        x: eventData.clientX,
                        y: eventData.clientY,
                        pointerId: eventData.pointerId,
                        type: eventData.pointerType,
                    };
                }

                if (this._currentActiveButton === -1 && !isTouch) {
                    this._currentActiveButton = eventData.button;
                }
                this.onButtonDown(eventData);

                if (!noPreventDefault) {
                    eventData.preventDefault();
                    element && element.focus();
                }
            } else if (type === PointerEventTypes.POINTERDOUBLETAP) {
                this.onDoubleTap(eventData.pointerType);
            } else if (type === PointerEventTypes.POINTERUP && (this._currentActiveButton === eventData.button || isTouch)) {
                try {
                    srcElement?.releasePointerCapture(eventData.pointerId);
                } catch (e) {
                    //Nothing to do with the error.
                }

                if (!isTouch) {
                    this._pointB = null; // Mouse and pen are mono pointer
                }

                //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
                //but emptying completely pointers collection is required to fix a bug on iPhone :
                //when changing orientation while pinching camera,
                //one pointer stay pressed forever if we don't release all pointers
                //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                if (engine._badOS) {
                    this._pointA = this._pointB = null;
                } else {
                    //only remove the impacted pointer in case of multitouch allowing on most
                    //platforms switching from rotate to zoom and pan seamlessly.
                    if (this._pointB && this._pointA && this._pointA.pointerId == eventData.pointerId) {
                        this._pointA = this._pointB;
                        this._pointB = null;
                    } else if (this._pointA && this._pointB && this._pointB.pointerId == eventData.pointerId) {
                        this._pointB = null;
                    } else {
                        this._pointA = this._pointB = null;
                    }
                }

                if (previousPinchSquaredDistance !== 0 || previousMultiTouchPanPosition) {
                    // Previous pinch data is populated but a button has been lifted
                    // so pinch has ended.
                    this.onMultiTouch(
                        this._pointA,
                        this._pointB,
                        previousPinchSquaredDistance,
                        0, // pinchSquaredDistance
                        previousMultiTouchPanPosition,
                        null // multiTouchPanPosition
                    );
                    previousPinchSquaredDistance = 0;
                    previousMultiTouchPanPosition = null;
                }

                this._currentActiveButton = -1;
                this.onButtonUp(eventData);

                if (!noPreventDefault) {
                    eventData.preventDefault();
                }
            } else if (type === PointerEventTypes.POINTERMOVE) {
                if (!noPreventDefault) {
                    eventData.preventDefault();
                }

                // One button down
                if (this._pointA && this._pointB === null) {
                    const offsetX = eventData.clientX - this._pointA.x;
                    const offsetY = eventData.clientY - this._pointA.y;
                    this.onTouch(this._pointA, offsetX, offsetY);

                    this._pointA.x = eventData.clientX;
                    this._pointA.y = eventData.clientY;
                }
                // Two buttons down: pinch
                else if (this._pointA && this._pointB) {
                    const ed = this._pointA.pointerId === eventData.pointerId ? this._pointA : this._pointB;
                    ed.x = eventData.clientX;
                    ed.y = eventData.clientY;
                    const distX = this._pointA.x - this._pointB.x;
                    const distY = this._pointA.y - this._pointB.y;
                    const pinchSquaredDistance = distX * distX + distY * distY;
                    const multiTouchPanPosition = {
                        x: (this._pointA.x + this._pointB.x) / 2,
                        y: (this._pointA.y + this._pointB.y) / 2,
                        pointerId: eventData.pointerId,
                        type: eventData.type,
                    };

                    this.onMultiTouch(this._pointA, this._pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);

                    previousMultiTouchPanPosition = multiTouchPanPosition;
                    previousPinchSquaredDistance = pinchSquaredDistance;
                }
            }
        };

        this._onLostFocus = () => {
            this._pointA = this._pointB = null;
            previousPinchSquaredDistance = 0;
            previousMultiTouchPanPosition = null;
            this.onLostFocus();
        };

        this._contextMenuBind = this.onContextMenu.bind(this);

        element && element.addEventListener("contextmenu", this._contextMenuBind, false);

        const hostWindow = this.camera.getScene().getEngine().getHostWindow();

        if (hostWindow) {
            Tools.RegisterTopRootEvents(hostWindow, [{ name: "blur", handler: this._onLostFocus }]);
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._onLostFocus) {
            const hostWindow = this.camera.getScene().getEngine().getHostWindow();
            if (hostWindow) {
                Tools.UnregisterTopRootEvents(hostWindow, [{ name: "blur", handler: this._onLostFocus }]);
            }
        }

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

            if (this._contextMenuBind) {
                const inputElement = this.camera.getScene().getEngine().getInputElement();
                inputElement && inputElement.removeEventListener("contextmenu", this._contextMenuBind);
            }

            this._onLostFocus = null;
        }

        this._altKey = false;
        this._ctrlKey = false;
        this._metaKey = false;
        this._shiftKey = false;
        this._buttonsPressed = 0;
        this._currentActiveButton = -1;
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "BaseCameraPointersInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "pointers";
    }

    /**
     * Called on pointer POINTERDOUBLETAP event.
     * Override this method to provide functionality on POINTERDOUBLETAP event.
     * @param type
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDoubleTap(type: string) {}

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * Override this method to provide functionality.
     * @param point
     * @param offsetX
     * @param offsetY
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {}

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * Override this method to provide functionality.
     * @param _pointA
     * @param _pointB
     * @param previousPinchSquaredDistance
     * @param pinchSquaredDistance
     * @param previousMultiTouchPanPosition
     * @param multiTouchPanPosition
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMultiTouch(
        _pointA: Nullable<PointerTouch>,
        _pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {}

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     * @param evt
     */
    public onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     * Override this method to provide functionality.
     * @param evt
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onButtonDown(evt: IPointerEvent): void {}

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * Override this method to provide functionality.
     * @param evt
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onButtonUp(evt: IPointerEvent): void {}

    /**
     * Called when window becomes inactive.
     * Override this method to provide functionality.
     */
    public onLostFocus(): void {}

    private _pointerInput: (eventData: IPointerEvent, type: PointerEventTypes) => void;
    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _mouseObserver: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _touchObservers: Array<Nullable<Observer<IPointerEvent>>> = [];
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;
    private _pointA: Nullable<PointerTouch>;
    private _pointB: Nullable<PointerTouch>;
}
