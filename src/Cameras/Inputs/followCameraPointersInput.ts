import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { EventState, Observer } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { TargetCamera } from "../../Cameras/targetCamera";
import { FollowCamera } from "../../Cameras/followCamera";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { PointerInfo, PointerEventTypes, PointerTouch } from "../../Events/pointerEvents";

export class CameraPointersInputBase implements ICameraInput<TargetCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: TargetCamera;

    /**
     * Defines the buttons associated with the input to handle camera move.
     */
    @serialize()
    public buttons = [0, 1, 2];
    
    /** @hidden
     * Log debug messages from un-implemented methods.
     */
    public debug: boolean = false;

    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _MSGestureHandler: Nullable<MSGesture>;
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;
    private _element: HTMLElement;
    private _noPreventDefault: boolean;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
      this._element = element;
      this._noPreventDefault = noPreventDefault || false;
        var engine = this.camera.getEngine();
        var cacheSoloPointer: Nullable<PointerTouch>; // cache pointer object for better perf on camera rotation
        var pointA: Nullable<PointerTouch> = null;
        var pointB: Nullable<PointerTouch> = null;
        var previousPinchSquaredDistance = 0;
        var previousMultiTouchPanPosition: Nullable<PointerTouch> = null;

        this._pointerInput = (p, s) => {
            var evt = <PointerEvent>p.event;
            let isTouch = (<any>p.event).pointerType === "touch";

            if (engine.isInVRExclusivePointerMode) {
                return;
            }

            if (p.type !== PointerEventTypes.POINTERMOVE &&
                this.buttons.indexOf(evt.button) === -1) {
                return;
            }

            let srcElement = <HTMLElement>(evt.srcElement || evt.target);

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

                this.doTouch(null, offsetX, offsetY);
            } else if (p.type === PointerEventTypes.POINTERDOWN && srcElement) {
                try {
                    srcElement.setPointerCapture(evt.pointerId);
                } catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }

                cacheSoloPointer = {x: evt.clientX,
                                    y: evt.clientY,
                                    pointerId: evt.pointerId,
                                    type: evt.pointerType };
                if (pointA === null) {
                    pointA = cacheSoloPointer;
                } else if (pointB === null) {
                    pointB = cacheSoloPointer;
                }

                if (!noPreventDefault) {
                    evt.preventDefault();
                    element.focus();
                }
            } else if (p.type === PointerEventTypes.POINTERDOUBLETAP) {
                this.doDoubleTouch(evt.pointerType);
            } else if (p.type === PointerEventTypes.POINTERUP && srcElement) {
                try {
                    srcElement.releasePointerCapture(evt.pointerId);
                } catch (e) {
                    //Nothing to do with the error.
                }

                cacheSoloPointer = null;

                if (!isTouch) {
                    pointB = null; // Mouse and pen are mono pointer
                }

                //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
                //but emptying completely pointers collection is required to fix a bug on iPhone :
                //when changing orientation while pinching camera,
                //one pointer stay pressed forever if we don't release all pointers
                //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                if (engine._badOS) {
                    pointA = pointB = null;
                } else {
                    //only remove the impacted pointer in case of multitouch allowing on most
                    //platforms switching from rotate to zoom and pan seamlessly.
                    if (pointB && pointA && pointA.pointerId == evt.pointerId) {
                        pointA = pointB;
                        pointB = null;
                        cacheSoloPointer = {x: pointA.x,
                                            y: pointA.y,
                                            pointerId: pointA.pointerId,
                                            type: evt.pointerType };
                    } else if (pointA && pointB && pointB.pointerId == evt.pointerId) {
                        pointB = null;
                        cacheSoloPointer = {x: pointA.x,
                                            y: pointA.y,
                                            pointerId: pointA.pointerId,
                                            type: evt.pointerType };
                    } else {
                        pointA = pointB = null;
                    }
                }

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            } else if (p.type === PointerEventTypes.POINTERMOVE) {
                if (!noPreventDefault) {
                    evt.preventDefault();
                }

                // One button down
                if (pointA && pointB === null && cacheSoloPointer) {
                    var offsetX = evt.clientX - cacheSoloPointer.x;
                    var offsetY = evt.clientY - cacheSoloPointer.y;
                    this.doTouch(pointA, offsetX, offsetY);

                    cacheSoloPointer.x = evt.clientX;
                    cacheSoloPointer.y = evt.clientY;
                }
                // Two buttons down: pinch
                else if (pointA && pointB) {
                    var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                    ed.x = evt.clientX;
                    ed.y = evt.clientY;
                    var distX = pointA.x - pointB.x;
                    var distY = pointA.y - pointB.y;
                    var pinchSquaredDistance = (distX * distX) + (distY * distY);
                    var multiTouchPanPosition = {x: (pointA.x + pointB.x) / 2,
                                                 y: (pointA.y + pointB.y) / 2,
                                                 pointerId: evt.pointerId,
                                                 type: p.type};

                    if (previousPinchSquaredDistance === 0) {
                        previousPinchSquaredDistance = pinchSquaredDistance;
                        previousMultiTouchPanPosition = {x: (pointA.x + pointB.x) / 2,
                                                         y: (pointA.y + pointB.y) / 2,
                                                         pointerId: evt.pointerId,
                                                         type: p.type};
                        return;
                    }

                    this.doMultiTouch(
                      pointA,
                      pointB,
                      previousPinchSquaredDistance,
                      pinchSquaredDistance,
                      previousMultiTouchPanPosition,
                      multiTouchPanPosition);
                  
                    previousMultiTouchPanPosition = {x: (pointA.x + pointB.x) / 2,
                                                     y: (pointA.y + pointB.y) / 2,
                                                     pointerId: evt.pointerId,
                                                     type: p.type};
                    previousPinchSquaredDistance = pinchSquaredDistance;
                }
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(
            this._pointerInput,
            PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP |
            PointerEventTypes.POINTERMOVE);

        this._onLostFocus = () => {
            this.log("FollowCameraPointersInput._onLostFocus");
            pointA = pointB = null;
            cacheSoloPointer = null;
        };

        element.addEventListener("contextmenu", this.onContextMenu.bind(this), false);
        element.addEventListener("MSPointerDown", 
            <EventListener>this.onGestureStart.bind(this), false);
        element.addEventListener("MSGestureChange",
            <EventListener>this.onGesture.bind(this), false);

        Tools.RegisterTopRootEvents([
            { name: "blur", handler: this._onLostFocus }
        ]);
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._onLostFocus) {
            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        if (element && this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;

            if (this.onContextMenu) {
                element.removeEventListener("contextmenu", this.onContextMenu);
            }

            if (this.onGestureStart) {
                element.removeEventListener("MSPointerDown", <EventListener>this.onGestureStart);
            }

            if (this.onGesture) {
                element.removeEventListener("MSGestureChange", <EventListener>this.onGesture);
            }

            this._MSGestureHandler = null;
            this._onLostFocus = null;
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraPointersInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "pointers";
    }

    protected doDoubleTouch(type: string) {
        this.log("FollowCameraPointersBase.doDoubleTouch(", type, ")");
    }

    protected doTouch(pointA: Nullable<PointerTouch>,
                      offsetX: number,
                      offsetY: number): void
    {
        this.log("FollowCameraPointersBase.doTouch(",
                 pointA,
                 offsetX,
                 offsetY,
                 ")");
    }

    protected doMultiTouch(pointA: Nullable<PointerTouch>,
                           pointB: Nullable<PointerTouch>,
                           previousPinchSquaredDistance: number,
                           pinchSquaredDistance: number,
                           previousMultiTouchPanPosition: Nullable<PointerTouch>,
                           multiTouchPanPosition: Nullable<PointerTouch>): void {
      this.log("FollowCameraPointersBase.doMultiTouch(",
               pointA,
               pointB,
               previousPinchSquaredDistance,
               pinchSquaredDistance,
               previousMultiTouchPanPosition,
               multiTouchPanPosition,
               ")");
    }

    protected onContextMenu(evt: PointerEvent): void {
        this.log("FollowCameraPointersInput.onContextMenu");
        evt.preventDefault();
    };

    protected onGestureStart(e: PointerEvent): void {
        this.log("FollowCameraPointersInput.onGestureStart");
        if (window.MSGesture === undefined) {
            return;
        }

        if (!this._MSGestureHandler) {
            this._MSGestureHandler = new MSGesture();
            this._MSGestureHandler.target = this._element;
        }

        this._MSGestureHandler.addPointer(e.pointerId);
    };

    protected onGesture(e: PointerEvent): void {
        this.log("FollowCameraPointersInput.onGesture");

        if (e.preventDefault) {
            if (!this._noPreventDefault) {
                e.stopPropagation();
                e.preventDefault();
            }
        }
    };

    protected log(...args: any[]) {
        if(this.debug){
            console.log.apply(console, arguments);
        }
    }
}

/**
 * Manage the pointers inputs to control an follow camera.
 * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FollowCameraPointersInput extends CameraPointersInputBase {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FollowCamera;

    /**
     * Defines the pointer angular sensibility  along the X axis or how fast is the camera rotating.
     */
    @serialize()
    public angularSensibilityX = 1;

    /**
     * Defines the pointer angular sensibility along the Y axis or how fast is the camera rotating.
     */
    @serialize()
    public angularSensibilityY = 1;

    /**
     * Defines the pointer pinch precision or how fast is the camera zooming.
     */
    @serialize()
    public pinchPrecision = 10000.0;

    /**
     * pinchDeltaPercentage will be used instead of pinchPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when pinch zoom is used.
     */
    @serialize()
    public pinchDeltaPercentage = 0;
    
    protected doTouch(pointA: Nullable<PointerTouch>,
                      offsetX: number,
                      offsetY: number): void
    {
        //super.doTouch(pointA, offsetX, offsetY);
        this.camera.rotationOffset -= offsetX / this.angularSensibilityX;
        this.camera.heightOffset -= offsetY / this.angularSensibilityY;
    }

    protected doMultiTouch(pointA: Nullable<PointerTouch>,
                           pointB: Nullable<PointerTouch>,
                           previousPinchSquaredDistance: number,
                           pinchSquaredDistance: number,
                           previousMultiTouchPanPosition: Nullable<PointerTouch>,
                           multiTouchPanPosition: Nullable<PointerTouch>): void
    {
        this.camera.radius +=
            (pinchSquaredDistance - previousPinchSquaredDistance) /
            (this.pinchPrecision * (this.angularSensibilityX + this.angularSensibilityY) / 2);
    }
}
(<any>CameraInputTypes)["FollowCameraPointersInput"] = FollowCameraPointersInput;
