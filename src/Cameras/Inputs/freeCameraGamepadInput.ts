import { serialize } from "../../Misc/decorators";
import { Observer } from "../../Misc/observable";
import { Nullable } from "../../types";
import { ICameraInput, CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { FreeCamera } from "../../Cameras/freeCamera";
import { Matrix, Vector3, Vector2 } from "../../Maths/math.vector";
import { Gamepad } from "../../Gamepads/gamepad";

/**
 * Manage the gamepad inputs to control a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraGamepadInput implements ICameraInput<FreeCamera> {
    /**
     * Define the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Define the Gamepad controlling the input
     */
    public gamepad: Nullable<Gamepad>;

    /**
     * Defines the gamepad rotation sensiblity.
     * This is the threshold from when rotation starts to be accounted for to prevent jittering.
     */
    @serialize()
    public gamepadAngularSensibility = 200;

    /**
     * Defines the gamepad move sensiblity.
     * This is the threshold from when moving starts to be accounted for for to prevent jittering.
     */
    @serialize()
    public gamepadMoveSensibility = 40;

    private _yAxisScale = 1.0;

    /**
     * Gets or sets a boolean indicating that Yaxis (for right stick) should be inverted
     */
    public get invertYAxis() {
        return this._yAxisScale !== 1.0;
    }

    public set invertYAxis(value: boolean) {
        this._yAxisScale = value ? -1.0 : 1.0;
    }

    // private members
    private _onGamepadConnectedObserver: Nullable<Observer<Gamepad>>;
    private _onGamepadDisconnectedObserver: Nullable<Observer<Gamepad>>;
    private _cameraTransform: Matrix = Matrix.Identity();
    private _deltaTransform: Vector3 = Vector3.Zero();
    private _vector3: Vector3 = Vector3.Zero();
    private _vector2: Vector2 = Vector2.Zero();

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        let manager = this.camera.getScene().gamepadManager;
        this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add((gamepad) => {
            if (gamepad.type !== Gamepad.POSE_ENABLED) {
                // prioritize XBOX gamepads.
                if (!this.gamepad || gamepad.type === Gamepad.XBOX) {
                    this.gamepad = gamepad;
                }
            }
        });

        this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add((gamepad) => {
            if (this.gamepad === gamepad) {
                this.gamepad = null;
            }
        });

        this.gamepad = manager.getGamepadByType(Gamepad.XBOX);
    }

    /**
     * Detach the current controls from the specified dom element.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: Nullable<HTMLElement>): void {
        this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
        this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
        this.gamepad = null;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this.gamepad && this.gamepad.leftStick) {
            var camera = this.camera;
            var LSValues = this.gamepad.leftStick;
            var normalizedLX = LSValues.x / this.gamepadMoveSensibility;
            var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
            LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
            LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;

            var RSValues = this.gamepad.rightStick;
            if (RSValues) {
                var normalizedRX = RSValues.x / this.gamepadAngularSensibility;
                var normalizedRY = (RSValues.y / this.gamepadAngularSensibility) * this._yAxisScale;
                RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
                RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;
            }
            else {
                RSValues = { x: 0, y: 0 };
            }

            if (!camera.rotationQuaternion) {
                Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, this._cameraTransform);
            } else {
                camera.rotationQuaternion.toRotationMatrix(this._cameraTransform);
            }

            var speed = camera._computeLocalCameraSpeed() * 50.0;
            this._vector3.copyFromFloats(LSValues.x * speed, 0, -LSValues.y * speed);

            Vector3.TransformCoordinatesToRef(this._vector3, this._cameraTransform, this._deltaTransform);
            camera.cameraDirection.addInPlace(this._deltaTransform);
            this._vector2.copyFromFloats(RSValues.y, RSValues.x);
            camera.cameraRotation.addInPlace(this._vector2);
        }
    }

    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraGamepadInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "gamepad";
    }
}

(<any>CameraInputTypes)["FreeCameraGamepadInput"] = FreeCameraGamepadInput;
