import { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import { Observer } from "../../Misc/observable";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FlyCamera } from "../../Cameras/flyCamera";
import { PointerInfo, PointerEventTypes } from "../../Events/pointerEvents";
import { Scene } from "../../scene";
import { Quaternion } from "../../Maths/math.vector";
import { Axis } from '../../Maths/math.axis';
/**
 * Listen to mouse events to control the camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FlyCameraMouseInput implements ICameraInput<FlyCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FlyCamera;

    /**
     * Defines if touch is enabled. (Default is true.)
     */
    public touchEnabled: boolean;

    /**
     * Defines the buttons associated with the input to handle camera rotation.
     */
    @serialize()
    public buttons = [0, 1, 2];

    /**
     * Assign buttons for Yaw control.
     */
    public buttonsYaw: number[] = [-1, 0, 1];

    /**
    * Assign buttons for Pitch control.
    */
    public buttonsPitch: number[] = [-1, 0, 1];

    /**
    * Assign buttons for Roll control.
    */
    public buttonsRoll: number[] = [2];

    /**
     * Detect if any button is being pressed while mouse is moved.
     * -1 = Mouse locked.
     * 0 = Left button.
     * 1 = Middle Button.
     * 2 = Right Button.
     */
    public activeButton: number = -1;

    /**
     * Defines the pointer's angular sensibility, to control the camera rotation speed.
     * Higher values reduce its sensitivity.
     */
    @serialize()
    public angularSensibility = 1000.0;

    private _mousemoveCallback: (e: MouseEvent) => void;
    private _observer: Nullable<Observer<PointerInfo>>;
    private _rollObserver: Nullable<Observer<Scene>>;
    private previousPosition: Nullable<{ x: number, y: number }> = null;
    private noPreventDefault: boolean | undefined;
    private element: HTMLElement;

    /**
     * Listen to mouse events to control the camera.
     * @param touchEnabled Define if touch is enabled. (Default is true.)
     * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    constructor(touchEnabled = true) {
    }

    /**
     * Attach the mouse control to the HTML DOM element.
     * @param element Defines the element that listens to the input events.
     * @param noPreventDefault Defines whether events caught by the controls should call preventdefault().
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        this.element = element;
        this.noPreventDefault = noPreventDefault;

        this._observer = this.camera.getScene().onPointerObservable.add(
            (p: any, s: any) => {
                this._pointerInput(p, s);
            },
            PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE
        );

        // Correct Roll by rate, if enabled.
        this._rollObserver = this.camera.getScene().onBeforeRenderObservable.add(
            () => {
                if (this.camera.rollCorrect) {
                    this.camera.restoreRoll(this.camera.rollCorrect);
                }
            }
        );

        // Helper function to keep 'this'.
        this._mousemoveCallback = (e: any) => {
            this._onMouseMove(e);
        };
        element.addEventListener("mousemove", this._mousemoveCallback, false);
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);

            this.camera.getScene().onBeforeRenderObservable.remove(this._rollObserver);

            if (this._mousemoveCallback) {
                element.removeEventListener("mousemove", this._mousemoveCallback);
            }

            this._observer = null;
            this._rollObserver = null;
            this.previousPosition = null;
            this.noPreventDefault = undefined;
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name.
     */
    public getClassName(): string {
        return "FlyCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input's friendly name.
     */
    public getSimpleName(): string {
        return "mouse";
    }

    // Track mouse movement, when the pointer is not locked.
    private _pointerInput(p: any, s: any): void {
        var e = <PointerEvent>p.event;

        let camera = this.camera;
        let engine = camera.getEngine();

        if (engine.isInVRExclusivePointerMode) {
            return;
        }

        if (!this.touchEnabled && e.pointerType === "touch") {
            return;
        }

        // Mouse is moved but an unknown mouse button is pressed.
        if (p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(e.button) === -1) {
            return;
        }

        var srcElement = <HTMLElement>(e.srcElement || e.target);

        // Mouse down.
        if (p.type === PointerEventTypes.POINTERDOWN && srcElement) {
            try {
                srcElement.setPointerCapture(e.pointerId);
            } catch (e) {
                // Nothing to do with the error. Execution continues.
            }

            this.previousPosition = {
                x: e.clientX,
                y: e.clientY
            };

            this.activeButton = e.button;

            if (!this.noPreventDefault) {
                e.preventDefault();
                this.element.focus();
            }
        } else
            // Mouse up.
            if (p.type === PointerEventTypes.POINTERUP && srcElement) {
                try {
                    srcElement.releasePointerCapture(e.pointerId);
                } catch (e) {
                    // Nothing to do with the error. Execution continues.
                }

                this.activeButton = -1;

                this.previousPosition = null;
                if (!this.noPreventDefault) {
                    e.preventDefault();
                }
            } else
                // Mouse move.
                if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!this.previousPosition || engine.isPointerLock) {
                        return;
                    }

                    var offsetX = e.clientX - this.previousPosition.x;
                    var offsetY = e.clientY - this.previousPosition.y;

                    this.rotateCamera(offsetX, offsetY);

                    this.previousPosition = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    if (!this.noPreventDefault) {
                        e.preventDefault();
                    }
                }
    }

    // Track mouse movement, when pointer is locked.
    private _onMouseMove(e: any): void {
        let camera = this.camera;
        let engine = camera.getEngine();

        if (!engine.isPointerLock || engine.isInVRExclusivePointerMode) {
            return;
        }

        var offsetX = e.movementX || e.mozMovementX || e.webkitMovementX || e.msMovementX || 0;
        var offsetY = e.movementY || e.mozMovementY || e.webkitMovementY || e.msMovementY || 0;

        this.rotateCamera(offsetX, offsetY);

        this.previousPosition = null;

        if (!this.noPreventDefault) {
            e.preventDefault();
        }
    }

    /**
     * Rotate camera by mouse offset.
     */
    private rotateCamera(offsetX: number, offsetY: number): void {
        let camera = this.camera;
        let scene = this.camera.getScene();

        if (scene.useRightHandedSystem) {
            offsetX *= -1;
        }

        if (camera.parent && camera.parent._getWorldMatrixDeterminant() < 0) {
            offsetX *= -1;
        }

        var x = offsetX / this.angularSensibility;
        var y = offsetY / this.angularSensibility;

        // Initialize to current rotation.
        var currentRotation = Quaternion.RotationYawPitchRoll(
            camera.rotation.y,
            camera.rotation.x,
            camera.rotation.z
        );
        var rotationChange: Quaternion;

        // Pitch.
        if (this.buttonsPitch.some((v) => { return v === this.activeButton; })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.X, y);
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }

        // Yaw.
        if (this.buttonsYaw.some((v) => { return v === this.activeButton; })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Y, x);
            // Apply Yaw to quaternion.
            currentRotation.multiplyInPlace(rotationChange);

            // Add Roll, if banked turning is enabled, within Roll limit.
            let limit = (camera.bankedTurnLimit) + camera._trackRoll; // Defaults to 90° plus manual roll.
            if (camera.bankedTurn && -limit < camera.rotation.z && camera.rotation.z < limit) {
                let bankingDelta = camera.bankedTurnMultiplier * -x;
                // Apply change in Radians to vector Angle.
                rotationChange = Quaternion.RotationAxis(Axis.Z, bankingDelta);
                // Apply Yaw to quaternion.
                currentRotation.multiplyInPlace(rotationChange);
            }
        }

        // Roll.
        if (this.buttonsRoll.some((v) => { return v === this.activeButton; })) {
            // Apply change in Radians to vector Angle.
            rotationChange = Quaternion.RotationAxis(Axis.Z, -x);
            // Track Rolling.
            camera._trackRoll -= x;
            // Apply Pitch to quaternion.
            currentRotation.multiplyInPlace(rotationChange);
        }

        // Apply rotationQuaternion to Euler camera.rotation.
        currentRotation.toEulerAnglesToRef(camera.rotation);
    }
}

(<any>CameraInputTypes)["FlyCameraMouseInput"] = FlyCameraMouseInput;
