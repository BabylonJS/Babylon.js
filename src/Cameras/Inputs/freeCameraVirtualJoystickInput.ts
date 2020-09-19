import { VirtualJoystick, JoystickAxis } from "../../Misc/virtualJoystick";
import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { FreeCameraInputsManager } from "../../Cameras/freeCameraInputsManager";

// Module augmentation to abstract virtual joystick from camera.
declare module "../../Cameras/freeCameraInputsManager" {
    export interface FreeCameraInputsManager {
        /**
         * Add virtual joystick input support to the input manager.
         * @returns the current input manager
         */
        addVirtualJoystick(): FreeCameraInputsManager;
    }
}

/**
* Add virtual joystick input support to the input manager.
* @returns the current input manager
*/
FreeCameraInputsManager.prototype.addVirtualJoystick = function(): FreeCameraInputsManager {
    this.add(new FreeCameraVirtualJoystickInput());
    return this;
};

/**
 * Manage the Virtual Joystick inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraVirtualJoystickInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    private _leftjoystick: VirtualJoystick;
    private _rightjoystick: VirtualJoystick;

    /**
     * Gets the left stick of the virtual joystick.
     * @returns The virtual Joystick
     */
    public getLeftJoystick(): VirtualJoystick {
        return this._leftjoystick;
    }

    /**
     * Gets the right stick of the virtual joystick.
     * @returns The virtual Joystick
     */
    public getRightJoystick(): VirtualJoystick {
        return this._rightjoystick;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs() {
        if (this._leftjoystick) {
            var camera = this.camera;
            var speed = camera._computeLocalCameraSpeed() * 50;
            var cameraTransform = Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
            var deltaTransform = Vector3.TransformCoordinates(new Vector3(this._leftjoystick.deltaPosition.x * speed, this._leftjoystick.deltaPosition.y * speed, this._leftjoystick.deltaPosition.z * speed), cameraTransform);
            camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
            camera.cameraRotation = camera.cameraRotation.addVector3(this._rightjoystick.deltaPosition);

            if (!this._leftjoystick.pressed) {
                this._leftjoystick.deltaPosition = this._leftjoystick.deltaPosition.scale(0.9);
            }
            if (!this._rightjoystick.pressed) {
                this._rightjoystick.deltaPosition = this._rightjoystick.deltaPosition.scale(0.9);
            }
        }
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        this._leftjoystick = new VirtualJoystick(true);
        this._leftjoystick.setAxisForUpDown(JoystickAxis.Z);
        this._leftjoystick.setAxisForLeftRight(JoystickAxis.X);
        this._leftjoystick.setJoystickSensibility(0.15);
        this._rightjoystick = new VirtualJoystick(false);
        this._rightjoystick.setAxisForUpDown(JoystickAxis.X);
        this._rightjoystick.setAxisForLeftRight(JoystickAxis.Y);
        this._rightjoystick.reverseUpDown = true;
        this._rightjoystick.setJoystickSensibility(0.05);
        this._rightjoystick.setJoystickColor("yellow");
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        this._leftjoystick.releaseCanvas();
        this._rightjoystick.releaseCanvas();
    }

    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraVirtualJoystickInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "virtualJoystick";
    }
}

(<any>CameraInputTypes)["FreeCameraVirtualJoystickInput"] = FreeCameraVirtualJoystickInput;
