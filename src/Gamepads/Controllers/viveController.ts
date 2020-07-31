import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SceneLoader } from "../../Loading/sceneLoader";
import { WebVRController } from "./webVRController";
import { PoseEnabledControllerType, ExtendedGamepadButton, PoseEnabledControllerHelper } from "./poseEnabledController";
import { GamepadButtonChanges } from "../../Gamepads/gamepad";
import { Observable } from '../../Misc/observable';

/**
 * Vive Controller
 */
export class ViveController extends WebVRController {
    /**
     * Base Url for the controller model.
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/vive/';
    /**
     * File name for the controller model.
     */
    public static MODEL_FILENAME: string = 'wand.babylon';

    /**
     * Creates a new ViveController from a gamepad
     * @param vrGamepad the gamepad that the controller should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
        this.controllerType = PoseEnabledControllerType.VIVE;
        this._invertLeftStickY = true;
    }

    /**
     * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
     * @param scene scene in which to add meshes
     * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
     */
    public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
        SceneLoader.ImportMesh("", ViveController.MODEL_BASE_URL, ViveController.MODEL_FILENAME, scene, (newMeshes) => {
            /*
            Parent Mesh name: ViveWand
            - body
            - r_gripper
            - l_gripper
            - menu_button
            - system_button
            - trackpad
            - trigger
            - LED
            */
            this._defaultModel = newMeshes[1];
            this.attachToMesh(this._defaultModel);
            if (meshLoaded) {
                meshLoaded(this._defaultModel);
            }
        });
    }

    /**
     * Fired when the left button on this controller is modified
     */
    public get onLeftButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onMainButtonStateChangedObservable;
    }

    /**
     * Fired when the right button on this controller is modified
     */
    public get onRightButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onMainButtonStateChangedObservable;
    }

    /**
     * Fired when the menu button on this controller is modified
     */
    public get onMenuButtonStateChangedObservable(): Observable<ExtendedGamepadButton> {
        return this.onSecondaryButtonStateChangedObservable;
    }

    /**
     * Called once for each button that changed state since the last frame
     * Vive mapping:
     * 0: touchpad
     * 1: trigger
     * 2: left AND right buttons
     * 3: menu button
     * @param buttonIdx Which button index changed
     * @param state New state of the button
     * @param changes Which properties on the state changed since last frame
     */
    protected _handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
        let notifyObject = state; //{ state: state, changes: changes };
        switch (buttonIdx) {
            case 0:
                this.onPadStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 1: // index trigger
                if (this._defaultModel) {
                    (<AbstractMesh>(this._defaultModel.getChildren()[6])).rotation.x = -notifyObject.value * 0.15;
                }
                this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 2:  // left AND right button
                this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 3:
                if (this._defaultModel) {
                    if (notifyObject.pressed) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = -0.001;
                    }
                    else {
                        (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = 0;
                    }
                }
                this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                return;
        }
    }
}

PoseEnabledControllerHelper._ControllerFactories.push({
    canCreate: (gamepadInfo) => {
        return gamepadInfo.id.toLowerCase().indexOf('openvr') !== -1;
    },
    create: (gamepadInfo) => {
        return new ViveController(gamepadInfo);
    }
});