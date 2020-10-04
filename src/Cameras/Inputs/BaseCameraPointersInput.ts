import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { EventState, Observable, Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { Camera } from "../../Cameras/camera";
import { ICameraInput } from "../../Cameras/cameraInputsManager";
import { PointerInfo, PointerEventTypes, PointerTouch } from "../../Events/pointerEvents";

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

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        var engine = this.camera.getEngine();
        var previousPinchSquaredDistance = 0;
        var previousMultiTouchPanPosition: Nullable<PointerTouch> = null;

        this._pointA = null;
        this._pointB = null;

        this._altKey = false;
        this._ctrlKey = false;
        this._metaKey = false;
        this._shiftKey = false;
        this._buttonsPressed = 0;

        this._pointerInput = (p, s) => {
            var evt = <PointerEvent>p.event;
            let isTouch = evt.pointerType === "touch";

            if (engine.isInVRExclusivePointerMode) {
                return;
            }

            if (p.type !== PointerEventTypes.POINTERMOVE &&
                this.buttons.indexOf(evt.button) === -1) {
                return;
            }

            let srcElement = <HTMLElement>(evt.srcElement || evt.target);

            this._altKey = evt.altKey;
            this._ctrlKey = evt.ctrlKey;
            this._metaKey = evt.metaKey;
            this._shiftKey = evt.shiftKey;
            this._buttonsPressed = evt.buttons;

            if (engine.isPointerLock) {
                var offsetX = evt.movementX ||
                              evt.mozMovementX ||
                              evt.webkitMovementX ||
                              evt.msMovementX ||
                              0;
                var offsetY = evt.movementY ||
                              evt.mozMovementY ||
                              evt.webkitMovementY ||
                              evt.msMovementY ||
                              0;

                // TODO: Do we want to coalesce these events so only one is
                // added per render frame? Seek advice from reviewer on how
                // engine.isPointerLock is used.
                let event: _Event = [_EventType.TouchEvent, [null, offsetX, offsetY]];
                this._allEvents.push(event);
                this._pointA = null;
                this._pointB = null;
            } else if (p.type === PointerEventTypes.POINTERDOWN && srcElement) {
                try {
                    srcElement.setPointerCapture(evt.pointerId);
                } catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }

                if (this._pointA === null) {
                    this._pointA = {x: evt.clientX,
                              y: evt.clientY,
                              pointerId: evt.pointerId,
                              type: evt.pointerType };
                } else if (this._pointB === null) {
                    this._pointB = {x: evt.clientX,
                              y: evt.clientY,
                              pointerId: evt.pointerId,
                              type: evt.pointerType };
                }

                const event: _Event = [_EventType.ButtonDownEvent, <_ButtonDownEvent>evt];
                this._allEvents.push(event);

                if (!noPreventDefault) {
                    evt.preventDefault();
                    element.focus();
                }
            } else if (p.type === PointerEventTypes.POINTERDOUBLETAP) {
                const event: _Event =
                    [_EventType.DoubleTapEvent, <_DoubleTapEvent>evt.pointerType];
                this._allEvents.push(event);
            } else if (p.type === PointerEventTypes.POINTERUP && srcElement) {
                try {
                    srcElement.releasePointerCapture(evt.pointerId);
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
                    } else if (this._pointA && this._pointB &&
                               this._pointB.pointerId == evt.pointerId) {
                        this._pointB = null;
                    } else {
                        this._pointA = this._pointB = null;
                    }
                }

                if (previousPinchSquaredDistance !== 0 || previousMultiTouchPanPosition) {
                    // Previous pinch data is populated but a button has been lifted
                    // so pinch has ended.
                    const event: _Event = [_EventType.MultiTouchEvent,
                        [ this._pointA,
                            this._pointB,
                            previousPinchSquaredDistance,
                            0,  // pinchSquaredDistance
                            previousMultiTouchPanPosition,
                            null  // multiTouchPanPosition
                        ]]
                    this._allEvents.push(event);
                    previousPinchSquaredDistance = 0;
                    previousMultiTouchPanPosition = null;
                }

                const event: _Event = [_EventType.ButtonUpEvent, <_ButtonUpEvent>evt];
                this._allEvents.push(event);

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            } else if (p.type === PointerEventTypes.POINTERMOVE) {
                if (!noPreventDefault) {
                    evt.preventDefault();
                }

                // One button down
                if (this._pointA && this._pointB === null) {
                    var offsetX = evt.clientX - this._pointA.x;
                    var offsetY = evt.clientY - this._pointA.y;
                    let event: _Event =
                        [_EventType.TouchEvent, [this._pointA, offsetX, offsetY]];
                    this._allEvents.push(event);

                    this._pointA.x = evt.clientX;
                    this._pointA.y = evt.clientY;
                }
                // Two buttons down: pinch
                else if (this._pointA && this._pointB) {
                    var ed = (this._pointA.pointerId === evt.pointerId) ?
                             this._pointA : this._pointB;
                    ed.x = evt.clientX;
                    ed.y = evt.clientY;
                    var distX = this._pointA.x - this._pointB.x;
                    var distY = this._pointA.y - this._pointB.y;
                    var pinchSquaredDistance = (distX * distX) + (distY * distY);
                    var multiTouchPanPosition = {x: (this._pointA.x + this._pointB.x) / 2,
                                                 y: (this._pointA.y + this._pointB.y) / 2,
                                                 pointerId: evt.pointerId,
                                                 type: p.type};

                    const event: _Event = [_EventType.MultiTouchEvent,
                        [ this._pointA,
                            this._pointB,
                            previousPinchSquaredDistance,
                            pinchSquaredDistance,
                            previousMultiTouchPanPosition,
                            multiTouchPanPosition
                        ]]
                    this._allEvents.push(event);

                    previousMultiTouchPanPosition = multiTouchPanPosition;
                    previousPinchSquaredDistance = pinchSquaredDistance;
                }
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(
            this._pointerInput,
            PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP |
            PointerEventTypes.POINTERMOVE);

        this._onLostFocus = () => {
            this._pointA = this._pointB = null;
            previousPinchSquaredDistance = 0;
            previousMultiTouchPanPosition = null;
            this.onLostFocus();
        };

        element.addEventListener("contextmenu",
            <EventListener>this.onContextMenu.bind(this), false);

        let hostWindow = this.camera.getScene().getEngine().getHostWindow();

        if (hostWindow) {
            Tools.RegisterTopRootEvents(hostWindow, [
                { name: "blur", handler: this._onLostFocus }
            ]);
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._onLostFocus) {
            let hostWindow = this.camera.getScene().getEngine().getHostWindow();
            if (hostWindow) {
                Tools.UnregisterTopRootEvents(hostWindow, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        }

        if (element && this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;

            if (this.onContextMenu) {
                element.removeEventListener("contextmenu", <EventListener>this.onContextMenu);
            }

            this._onLostFocus = null;
        }

        this._altKey = false;
        this._ctrlKey = false;
        this._metaKey = false;
        this._shiftKey = false;
        this._buttonsPressed = 0;

        if(this.onDoubleTapObservable) {
            this.onDoubleTapObservable.clear();
        }
        if(this.onButtonUpObservable) {
            this.onButtonUpObservable.clear();
        }
        if(this.onButtonDownObservable) {
            this.onButtonDownObservable.clear();
        }
        if(this.onTouchObservable) {
            this.onTouchObservable.clear();
        }
        if(this.onMultiTouchObservable) {
            this.onMultiTouchObservable.clear();
        }
    }

    /**
     * Called for each rendered frame.
     * This is in the render path so work done here should have been simplified
     * as much as practical. Ie: Do as much in this._pointerInput(...) as
     * possible.
     */
    public checkInputs(): void {
        while(this._allEvents.length > 0) {
            const [eventName, event] = <_Event>(this._allEvents.shift());

            // A previous iteration of this code called the event handlers from
            // within this._pointerInput.
            // Now we call them from here we face the challenge of maintaining
            // the order of the events across event types.
            // Eg: A user clicking the mouse twice needs to cause
            // onButtonDown(...), onButtonUp(...), onButtonDown(...), onButtonUp(...)
            // to be called in that exact order.
            // Storing the events of different types in a list gives us the
            // problem of knowing what type of event it is when we process the
            // list.
            // This is the reason for the _EventType enum value in these events.
            //
            // TODO: Seek advice from reviewer that i'm not missing a way to
            // check types at runtime in Typescript.
            switch(eventName) {
                case _EventType.DoubleTapEvent:
                    this.onDoubleTap(<string>event);
                    this.onDoubleTapObservable.notifyObservers({event: <string>event});
                    break;
                case _EventType.ButtonUpEvent:
                    this.onButtonUp(<_ButtonUpEvent>event);
                    this.onButtonUpObservable.notifyObservers({event: <PointerEvent>event});
                    break;
                case _EventType.ButtonDownEvent:
                    this.onButtonDown(<_ButtonDownEvent>event);
                    this.onButtonDownObservable.notifyObservers({event: <PointerEvent>event});
                    break;
                case _EventType.TouchEvent:
                    this.onTouch(...<_TouchEvent>event);
                    this.onTouchObservable.notifyObservers({
                        point: (<_TouchEvent>event)[0],
                        deltaX: (<_TouchEvent>event)[1],
                        deltaY: (<_TouchEvent>event)[2]
                    });
                    break;
                case _EventType.MultiTouchEvent:
                    this.onMultiTouch(...<_MultiTouchEvent>event);
                    this.onMultiTouchObservable.notifyObservers({
                        pointA: (<_MultiTouchEvent>event)[0],
                        pointB: (<_MultiTouchEvent>event)[1],
                        previousPinchSquaredDistance: (<_MultiTouchEvent>event)[2],
                        pinchSquaredDistance: (<_MultiTouchEvent>event)[3],
                        previousMultiTouchPanPosition: (<_MultiTouchEvent>event)[4],
                        multiTouchPanPosition: (<_MultiTouchEvent>event)[5]
                    });
            }
        }
    }

    /**
    * Observable for when a double tap event occurs.
    */
    public onDoubleTapObservable = new Observable<{event: string}>();

    /**
    * Observable for when a button up event occurs.
    */
    public onButtonUpObservable = new Observable<{event: PointerEvent}>();

    /**
    * Observable for when a button down event occurs.
    */
    public onButtonDownObservable = new Observable<{event: PointerEvent}>();

    /**
     * Observable for pointer drag event.
     */
    public onTouchObservable = new Observable<{
        point: Nullable<PointerTouch>, deltaX: number, deltaY: number
    }>();

    /**
     * Observable for multi touch event.
     */
    public onMultiTouchObservable = new Observable<{
        pointA: Nullable<PointerTouch>,
        pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    }>();

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
     */
    //private _onDoubleTapEvents: string[] = [];
    protected onDoubleTap(type: string) {
    }

    /**
     * Called on pointer POINTERMOVE event if only a single touch is active.
     * Override this method to provide functionality.
     */
    protected onTouch(point: Nullable<PointerTouch>,
                      offsetX: number,
                      offsetY: number): void {
    }

    /**
     * Called on pointer POINTERMOVE event if multiple touches are active.
     * Override this method to provide functionality.
     */
    protected onMultiTouch(pointA: Nullable<PointerTouch>,
                           pointB: Nullable<PointerTouch>,
                           previousPinchSquaredDistance: number,
                           pinchSquaredDistance: number,
                           previousMultiTouchPanPosition: Nullable<PointerTouch>,
                           multiTouchPanPosition: Nullable<PointerTouch>): void {
    }

    /**
     * Called each time a new POINTERDOWN event occurs. Ie, for each button
     * press.
     * Override this method to provide functionality.
     */
    protected onButtonDown(evt: PointerEvent): void {
    }

    /**
     * Called each time a new POINTERUP event occurs. Ie, for each button
     * release.
     * Override this method to provide functionality.
     */
    protected onButtonUp(evt: PointerEvent): void {
    }

    /**
     * Called when window becomes inactive.
     * Override this method to provide functionality.
     */
    protected onLostFocus(): void {
    }

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     */
    protected onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * This is the queue of events that feeds checkInputs().
     * See the comment in that function for a description.
     */
    private _allEvents: _Event[] = [];

    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;
    private _pointA: Nullable<PointerTouch>;
    private _pointB: Nullable<PointerTouch>;
}

/**
 * The following types are for various event types in the queue that feeds
 * BaseCameraPointersInput.checkInputs().
 */
type _TouchEvent = [Nullable<PointerTouch>, number, number];
type _MultiTouchEvent = [
        Nullable<PointerTouch>,
        Nullable<PointerTouch>,
        number,
        number,
        Nullable<PointerTouch>,
        Nullable<PointerTouch> ];
type _DoubleTapEvent = string;
type _ButtonDownEvent = PointerEvent;
type _ButtonUpEvent = PointerEvent;
type _Event = [
    _EventType,
    (_TouchEvent | _MultiTouchEvent | _DoubleTapEvent | _ButtonDownEvent | _ButtonUpEvent)
];

enum _EventType {
    TouchEvent,
    MultiTouchEvent,
    DoubleTapEvent,
    ButtonDownEvent,
    ButtonUpEvent
}
