import { serialize } from "../../Misc/decorators";
import { Observer, EventState } from "../../Misc/observable";
import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Matrix, Vector3 } from "../../Maths/math.vector";
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
     * The higher the faster.
     */
    @serialize()
    public touchAngularSensibility: number = 200000.0;

    /**
     * Defines the touch sensibility for move.
     * The higher the faster.
     */
    @serialize()
    public touchMoveSensibility: number = 250.0;

    private _offsetX: Nullable<number> = null;
    private _offsetY: Nullable<number> = null;

    private _pointerPressed = new Array<number>();
    private _pointerInput: (p: PointerInfo, s: EventState) => void;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _onLostFocus: Nullable<(e: FocusEvent) => any>;

    /**
     * Manage the touch inputs to control the movement of a free camera.
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     * @param allowMouse Defines if mouse events can be treated as touch events
     */
    constructor(
        /**
         * Define if mouse events can be treated as touch events
         */
        public allowMouse = false) {
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        var previousPosition: Nullable<{ x: number, y: number }> = null;

        if (this._pointerInput === undefined) {
            this._onLostFocus = () => {
                this._offsetX = null;
                this._offsetY = null;
            };

            this._pointerInput = (p) => {
                var evt = <PointerEvent>p.event;

                let isMouseEvent = evt instanceof MouseEvent;
                if (!this.allowMouse && (evt.pointerType === "mouse" || isMouseEvent)) {
                    return;
                }

                if (p.type === PointerEventTypes.POINTERDOWN) {

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    this._pointerPressed.push(evt.pointerId);

                    if (this._pointerPressed.length !== 1) {
                        return;
                    }

                    previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                }

                else if (p.type === PointerEventTypes.POINTERUP) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    var index: number = this._pointerPressed.indexOf(evt.pointerId);

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
                }

                else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    if (!previousPosition) {
                        return;
                    }

                    var index: number = this._pointerPressed.indexOf(evt.pointerId);

                    if (index != 0) {
                        return;
                    }

                    this._offsetX = evt.clientX - previousPosition.x;
                    this._offsetY = -(evt.clientY - previousPosition.y);
                }
            };
        }

        this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);

        if (this._onLostFocus) {
            element.addEventListener("blur", this._onLostFocus);
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._pointerInput && element) {
            if (this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
            }

            if (this._onLostFocus) {
                element.removeEventListener("blur", this._onLostFocus);
                this._onLostFocus = null;
            }
            this._pointerPressed = [];
            this._offsetX = null;
            this._offsetY = null;
        }
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this._offsetX && this._offsetY) {
            var camera = this.camera;
            camera.cameraRotation.y += this._offsetX / this.touchAngularSensibility;

            if (this._pointerPressed.length > 1) {
                camera.cameraRotation.x += -this._offsetY / this.touchAngularSensibility;
            } else {
                var speed = camera._computeLocalCameraSpeed();
                var direction = new Vector3(0, 0, speed * this._offsetY / this.touchMoveSensibility);

                Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
                camera.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
            }
        }
    }

    /**
     * Gets the class name of the current intput.
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
