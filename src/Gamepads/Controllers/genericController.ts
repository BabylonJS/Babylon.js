import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SceneLoader } from "../../Loading/sceneLoader";

import { WebVRController } from "./webVRController";
import { ExtendedGamepadButton, PoseEnabledControllerHelper } from "./poseEnabledController";
import { GamepadButtonChanges } from "../../Gamepads/gamepad";

/**
 * Generic Controller
 */
export class GenericController extends WebVRController {
    /**
     * Base Url for the controller model.
     */
    public static readonly MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/generic/';
    /**
     * File name for the controller model.
     */
    public static readonly MODEL_FILENAME: string = 'generic.babylon';

    /**
     * Creates a new GenericController from a gamepad
     * @param vrGamepad the gamepad that the controller should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
    }

    /**
     * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
     * @param scene scene in which to add meshes
     * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
     */
    public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
        SceneLoader.ImportMesh("", GenericController.MODEL_BASE_URL, GenericController.MODEL_FILENAME, scene, (newMeshes) => {
            this._defaultModel = newMeshes[1];
            this.attachToMesh(this._defaultModel);
            if (meshLoaded) {
                meshLoaded(this._defaultModel);
            }
        });
    }

    /**
     * Called once for each button that changed state since the last frame
     * @param buttonIdx Which button index changed
     * @param state New state of the button
     * @param changes Which properties on the state changed since last frame
     */
    protected _handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
        console.log("Button id: " + buttonIdx + "state: ");
        console.dir(state);
    }
}

PoseEnabledControllerHelper._DefaultControllerFactory = (gamepadInfo: any) => new GenericController(gamepadInfo);
