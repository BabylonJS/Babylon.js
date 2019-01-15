import { FreeCamera } from "./freeCamera";
import { CameraInputsManager } from "./cameraInputsManager";
import { FreeCameraKeyboardMoveInput } from "../Cameras/Inputs/freeCameraKeyboardMoveInput";
import { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import { FreeCameraTouchInput } from "../Cameras/Inputs/freeCameraTouchInput";

/**
 * Default Inputs manager for the FreeCamera.
 * It groups all the default supported inputs for ease of use.
 * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraInputsManager extends CameraInputsManager<FreeCamera> {
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
        this.add(new FreeCameraMouseInput(touchEnabled));
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
}
