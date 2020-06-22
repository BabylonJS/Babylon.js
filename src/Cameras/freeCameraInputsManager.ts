import { FreeCamera } from "./freeCamera";
import { CameraInputsManager } from "./cameraInputsManager";
import { FreeCameraKeyboardMoveInput } from "../Cameras/Inputs/freeCameraKeyboardMoveInput";
import { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import { FreeCameraTouchInput } from "../Cameras/Inputs/freeCameraTouchInput";
import { Nullable } from '../types';

/**
 * Default Inputs manager for the FreeCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
    /**
     * @hidden
     */
    public _mouseInput: Nullable<FreeCameraMouseInput> = null;
    /**
     * Instantiates a new FreeCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera: FreeCamera) {
        super(camera);
    }

    /**
     * Add keyboard input support to the input manager.
     * @returns the current input manager
     */
    addKeyboard(): FreeCameraInputsManager {
        this.add(new FreeCameraKeyboardMoveInput());
        return this;
    }

    /**
     * Add mouse input support to the input manager.
     * @param touchEnabled if the FreeCameraMouseInput should support touch (default: true)
     * @returns the current input manager
     */
    addMouse(touchEnabled = true): FreeCameraInputsManager {
        if (!this._mouseInput) {
            this._mouseInput = new FreeCameraMouseInput(touchEnabled);
            this.add(this._mouseInput);
        }
        return this;
    }

    /**
     * Removes the mouse input support from the manager
     * @returns the current input manager
     */
    removeMouse(): FreeCameraInputsManager {
        if (this._mouseInput) {
            this.remove(this._mouseInput);
        }
        return this;
    }

    /**
     * Add touch input support to the input manager.
     * @returns the current input manager
     */
    addTouch(): FreeCameraInputsManager {
        this.add(new FreeCameraTouchInput());
        return this;
    }

    /**
     * Remove all attached input methods from a camera
     */
    public clear(): void {
        super.clear();
        this._mouseInput = null;
    }
}
