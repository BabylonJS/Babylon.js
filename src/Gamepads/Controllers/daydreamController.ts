import { Logger } from "../../Misc/logger";
import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SceneLoader } from "../../Loading/sceneLoader";

import { GamepadButtonChanges } from "../../Gamepads/gamepad";
import { WebVRController } from "./webVRController";
import { PoseEnabledControllerType, ExtendedGamepadButton, PoseEnabledControllerHelper } from "./poseEnabledController";

/**
 * Google Daydream controller
 */
export class DaydreamController extends WebVRController {
    /**
     * Base Url for the controller model.
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/generic/';

    /**
     * File name for the controller model.
     */
    public static MODEL_FILENAME: string = 'generic.babylon';

    /**
     * Gamepad Id prefix used to identify Daydream Controller.
     */
    public static readonly GAMEPAD_ID_PREFIX: string = 'Daydream'; // id is 'Daydream Controller'

    /**
     * Creates a new DaydreamController from a gamepad
     * @param vrGamepad the gamepad that the controller should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
        this.controllerType = PoseEnabledControllerType.DAYDREAM;
    }

    /**
     * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
     * @param scene scene in which to add meshes
     * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
     */
    public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
        SceneLoader.ImportMesh("", DaydreamController.MODEL_BASE_URL, DaydreamController.MODEL_FILENAME, scene, (newMeshes) => {
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
        // Daydream controller only has 1 GamepadButton (on the trackpad).
        if (buttonIdx === 0) {
            let observable = this.onTriggerStateChangedObservable;
            if (observable) {
                observable.notifyObservers(state);
            }
        } else {
            // If the app or home buttons are ever made available
            Logger.Warn(`Unrecognized Daydream button index: ${buttonIdx}`);
        }
    }
}

PoseEnabledControllerHelper._ControllerFactories.push({
    canCreate: (gamepadInfo) => {
        return gamepadInfo.id.indexOf(DaydreamController.GAMEPAD_ID_PREFIX) === 0;
    },
    create: (gamepadInfo) => {
        return new DaydreamController(gamepadInfo);
    }
});