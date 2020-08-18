import { Observer, EventState, Observable } from "../../Misc/observable";
import { serialize } from "../../Misc/decorators";
import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
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

    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _onMouseMove: Nullable<(e: MouseEvent) => any>;
    private _observer: Nullable<Observer<PointerInfo>>;
    private previousPosition: Nullable<{ x: number, y: number }> = null;

    /**
     * Observable for when a pointer move event occurs containing the move offset
     */
    public onPointerMovedObservable = new Observable<{ offsetX: number, offsetY: number }>();
    /**
     * @hidden
     * If the camera should be rotated automatically based on pointer movement
     */
    public _allowCameraRotation = true;
    /**
     * Manage the mouse inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     * @param touchEnabled Defines if touch is enabled or not
     */
    constructor(
        /**
         * Define if touch is enabled in the mouse input
         */
        public touchEnabled = true) {
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        var engine = this.camera.getEngine();

        if (!this._pointerInput) {
            this._pointerInput = (p) => {
                var evt = <PointerEvent>p.event;

                if (engine.isInVRExclusivePointerMode) {
                    return;
                }

                if (!this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }

                if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

                let srcElement = <HTMLElement>(evt.srcElement || evt.target);

                if (p.type === PointerEventTypes.POINTERDOWN && srcElement) {
                    try {
                        srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }

                    this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                }
                else if (p.type === PointerEventTypes.POINTERUP && srcElement) {
                    try {
                        srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }

                    this.previousPosition = null;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }

                else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!this.previousPosition || engine.isPointerLock) {
                        return;
                    }

                    var offsetX = evt.clientX - this.previousPosition.x;
                    var offsetY = evt.clientY - this.previousPosition.y;
                    if (this.camera.getScene().useRightHandedSystem) { offsetX *= -1; }
                    if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) { offsetX *= -1; }

                    if (this._allowCameraRotation) {
                        this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                        this.camera.cameraRotation.x += offsetY / this.angularSensibility;
                    }
                    this.onPointerMovedObservable.notifyObservers({offsetX: offsetX, offsetY: offsetY});

                    this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };

                    if (!noPreventDefault) {
                        evt.preventDefault();
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

            var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
            if (this.camera.getScene().useRightHandedSystem) { offsetX *= -1; }
            if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) { offsetX *= -1; }
            this.camera.cameraRotation.y += offsetX / this.angularSensibility;

            var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
            this.camera.cameraRotation.x += offsetY / this.angularSensibility;

            this.previousPosition = null;

            if (!noPreventDefault) {
                evt.preventDefault();
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
        element.addEventListener("mousemove", this._onMouseMove, false);

        element.addEventListener("contextmenu",
            <EventListener>this.onContextMenu.bind(this), false);
    }

    /**
     * Called on JS contextmenu event.
     * Override this method to provide functionality.
     */
    protected onContextMenu(evt: PointerEvent): void {
        evt.preventDefault();
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);

            if (this._onMouseMove) {
                element.removeEventListener("mousemove", this._onMouseMove);
            }

            if (this.onContextMenu) {
                element.removeEventListener("contextmenu", <EventListener>this.onContextMenu);
            }

            if (this.onPointerMovedObservable) {
                this.onPointerMovedObservable.clear();
            }

            this._observer = null;
            this._onMouseMove = null;
            this.previousPosition = null;
        }
    }

    /**
     * Gets the class name of the current intput.
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
