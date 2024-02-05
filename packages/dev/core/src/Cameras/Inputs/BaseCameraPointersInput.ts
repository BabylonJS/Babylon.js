/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { EventState, Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import type { Camera } from "../../Cameras/camera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { PointerInfo, PointerTouch } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { IPointerEvent } from "../../Events/deviceInputEvents";

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

        this._pointerInput = (p) => {
            const evt = <IPointerEvent>p.event;
            const isTouch = evt.pointerType === "touch";

            if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                return;
            }

            const srcElement = <HTMLElement>evt.target;

            this._altKey = evt.altKey;
            this._ctrlKey = evt.ctrlKey;
            this._metaKey = evt.metaKey;
            this._shiftKey = evt.shiftKey;
            this._buttonsPressed = evt.buttons;

            if (engine.isPointerLock) {
                const offsetX = evt.movementX;
                const offsetY = evt.movementY;

                this.onTouch(null, offsetX, offsetY);
                this._pointA = null;
                this._pointB = null;
            } else if (p.type !== PointerEventTypes.POINTERDOWN && isTouch && this._pointA?.pointerId !== evt.pointerId && this._pointB?.pointerId !== evt.pointerId) {
                return; // If we get a non-down event for a touch that we're not tracking, ignore it
            } else if (p.type === PointerEventTypes.POINTERDOWN && (this._currentActiveButton === -1 || isTouch)) {
                try {
                    srcElement?.setPointerCapture(evt.pointerId);
                } catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }

                if (this._pointA === null) {
                    this._pointA = {
                        x: evt.clientX,
                        y: evt.clientY,
                        pointerId: evt.pointerId,
                        type: evt.pointerType,
                    };
                } else if (this._pointB === null) {
                    this._pointB = {
                        x: evt.clientX,
                        y: evt.clientY,
                        pointerId: evt.pointerId,
                        type: evt.pointerType,
                    };
                } else {
                    return; // We are already tracking two pointers so ignore this one
                }

                if (this._currentActiveButton === -1 && !isTouch) {
                    this._currentActiveButton = evt.button;
                }
                this.onButtonDown(evt);

                if (!noPreventDefault) {
                    evt.preventDefault();
                    element && element.focus();
                }
            } else if (p.type === PointerEventTypes.POINTERDOUBLETAP) {
                this.onDoubleTap(evt.pointerType);
            } else if (p.type === PointerEventTypes.POINTERUP && (this._currentActiveButton === evt.button || isTouch)) {
                try {
                    srcElement?.releasePointerCapture(evt.pointerId);
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
                    if (this._pointB && this._pointA && this._pointA.pointerId == evt.pointerId) {
                        this._pointA = this._pointB;
                        this._pointB = null;
                    } else if (this._pointA && this._pointB && this._pointB.pointerId == evt.pointerId) {
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
                this.onButtonUp(evt);

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            } else if (p.type === PointerEventTypes.POINTERMOVE) {
                if (!noPreventDefault) {
                    evt.preventDefault();
                }

                // One button down
                if (this._pointA && this._pointB === null) {
                    const offsetX = evt.clientX - this._pointA.x;
                    const offsetY = evt.clientY - this._pointA.y;
                    this.onTouch(this._pointA, offsetX, offsetY);

                    this._pointA.x = evt.clientX;
                    this._pointA.y = evt.clientY;
                }
                // Two buttons down: pinch
                else if (this._pointA && this._pointB) {
                    const ed = this._pointA.pointerId === evt.pointerId ? this._pointA : this._pointB;
                    ed.x = evt.clientX;
                    ed.y = evt.clientY;
                    const distX = this._pointA.x - this._pointB.x;
                    const distY = this._pointA.y - this._pointB.y;
                    const pinchSquaredDistance = distX * distX + distY * distY;
                    const multiTouchPanPosition = {
                        x: (this._pointA.x + this._pointB.x) / 2,
                        y: (this._pointA.y + this._pointB.y) / 2,
                        pointerId: evt.pointerId,
                        type: p.type,
                    };

                    this.onMultiTouch(this._pointA, this._pointB, previousPinchSquaredDistance, pinchSquaredDistance, previousMultiTouchPanPosition, multiTouchPanPosition);

                    previousMultiTouchPanPosition = multiTouchPanPosition;
                    previousPinchSquaredDistance = pinchSquaredDistance;
                }
            }
        };

        this._observer = this.camera
            .getScene()
            ._inputManager._addCameraPointerObserver(
                this._pointerInput,
                PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE | PointerEventTypes.POINTERDOUBLETAP
            );

        this._onLostFocus = () => {
            this._pointA = this._pointB = null;
            previousPinchSquaredDistance = 0;
            previousMultiTouchPanPosition = null;
            this.onLostFocus();
        };

        this._contextMenuBind = (evt: Event) => this.onContextMenu(evt as PointerEvent);

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

        if (this._observer) {
            this.camera.getScene()._inputManager._removeCameraPointerObserver(this._observer);
            this._observer = null;

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
     * @param type type of event
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDoubleTap(type: string) {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * Override this method to provide functionality.
     * @param point The current position of the pointer
     * @param offsetX The offsetX of the pointer when the event occurred
     * @param offsetY The offsetY of the pointer when the event occurred
     */
    public onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {}

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * Override this method to provide functionality.
     * @param _pointA First point in the pair
     * @param _pointB Second point in the pair
     * @param previousPinchSquaredDistance Sqr Distance between the points the last time this event was fired (by this input)
     * @param pinchSquaredDistance Sqr Distance between the points this time
     * @param previousMultiTouchPanPosition Previous center point between the points
     * @param multiTouchPanPosition Current center point between the points
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
     * @param evt the event to be handled
     */
    public onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     * Override this method to provide functionality.
     * @param _evt Defines the event to track
     */
    public onButtonDown(_evt: IPointerEvent): void {}

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * Override this method to provide functionality.
     * @param _evt Defines the event to track
     */
    public onButtonUp(_evt: IPointerEvent): void {}

    /**
     * Called when window becomes inactive.
     * Override this method to provide functionality.
     */
    public onLostFocus(): void {}

    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;
    private _pointA: Nullable<PointerTouch>;
    private _pointB: Nullable<PointerTouch>;
}
