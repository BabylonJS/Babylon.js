import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { Gamepad } from "../../Gamepads/gamepad";
/**
 * Manage the gamepad inputs to control an arc rotate camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraGamepadInput implements ICameraInput<ArcRotateCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * Defines the gamepad the input is gathering event from.
     */
    public gamepad: Nullable<Gamepad>;

    /**
     * Defines the gamepad rotation sensibility.
     * This is the threshold from when rotation starts to be accounted for to prevent jittering.
     */
    @serialize()
    public gamepadRotationSensibility = 80;

    /**
     * Defines the gamepad move sensibility.
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

    private _onGamepadConnectedObserver: Nullable<Observer<Gamepad>>;
    private _onGamepadDisconnectedObserver: Nullable<Observer<Gamepad>>;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     */
    public attachControl(): void {
        const manager = this.camera.getScene().gamepadManager;
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
        // if no xbox controller was found, but there are gamepad controllers, take the first one
        if (!this.gamepad && manager.gamepads.length) {
            this.gamepad = manager.gamepads[0];
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
        this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
        this.gamepad = null;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this.gamepad) {
            const camera = this.camera;
            const rsValues = this.gamepad.rightStick;

            if (rsValues) {
                if (rsValues.x != 0) {
                    const normalizedRX = rsValues.x / this.gamepadRotationSensibility;
                    if (normalizedRX != 0 && Math.abs(normalizedRX) > 0.005) {
                        camera.inertialAlphaOffset += normalizedRX;
                    }
                }

                if (rsValues.y != 0) {
                    const normalizedRY = (rsValues.y / this.gamepadRotationSensibility) * this._yAxisScale;
                    if (normalizedRY != 0 && Math.abs(normalizedRY) > 0.005) {
                        camera.inertialBetaOffset += normalizedRY;
                    }
                }
            }

            const lsValues = this.gamepad.leftStick;
            if (lsValues && lsValues.y != 0) {
                const normalizedLY = lsValues.y / this.gamepadMoveSensibility;
                if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                    this.camera.inertialRadiusOffset -= normalizedLY;
                }
            }
        }
    }

    /**
     * Gets the class name of the current intput.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraGamepadInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "gamepad";
    }
}

(<any>CameraInputTypes)["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
