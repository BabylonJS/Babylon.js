import { FlyCamera } from "./flyCamera";
import { CameraInputsManager } from "./cameraInputsManager";
import { FlyCameraMouseInput } from "../Cameras/Inputs/flyCameraMouseInput";
import { FlyCameraKeyboardInput } from "../Cameras/Inputs/flyCameraKeyboardInput";

/**
 * Default Inputs manager for the FlyCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FlyCameraInputsManager extends CameraInputsManager<FlyCamera> {
    /**
     * Instantiates a new FlyCameraInputsManager.
     * @param camera Defines the camera the inputs belong to.
     */
    constructor(camera: FlyCamera) {
        super(camera);
    }

    /**
     * Add keyboard input support to the input manager.
     * @returns the new FlyCameraKeyboardMoveInput().
     */
    addKeyboard(): FlyCameraInputsManager {
        this.add(new FlyCameraKeyboardInput());
        return this;
    }

    /**
     * Add mouse input support to the input manager.
     * @param touchEnabled Enable touch screen support.
     * @returns the new FlyCameraMouseInput().
     */
    addMouse(touchEnabled = true): FlyCameraInputsManager {
        this.add(new FlyCameraMouseInput(touchEnabled));
        return this;
    }
}
