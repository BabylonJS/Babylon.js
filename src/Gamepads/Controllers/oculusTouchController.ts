import { Observable } from "../../Misc/observable";
import { Scene } from "../../scene";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SceneLoader } from "../../Loading/sceneLoader";
import { WebVRController } from "./webVRController";
import { PoseEnabledControllerType, ExtendedGamepadButton, PoseEnabledControllerHelper } from "./poseEnabledController";
import { GamepadButtonChanges } from "../../Gamepads/gamepad";
import { Engine } from '../../Engines/engine';
/**
 * Oculus Touch Controller
 */
export class OculusTouchController extends WebVRController {
    /**
     * Base Url for the controller model.
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/oculus/';
    /**
     * File name for the left controller model.
     */
    public static MODEL_LEFT_FILENAME: string = 'left.babylon';
    /**
     * File name for the right controller model.
     */
    public static MODEL_RIGHT_FILENAME: string = 'right.babylon';

    /**
     * Base Url for the Quest controller model.
     */
    public static QUEST_MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/oculusQuest/';

    /**
     * @hidden
     * If the controllers are running on a device that needs the updated Quest controller models
     */
    public static _IsQuest = false;

    /**
     * Fired when the secondary trigger on this controller is modified
     */
    public onSecondaryTriggerStateChangedObservable = new Observable<ExtendedGamepadButton>();

    /**
     * Fired when the thumb rest on this controller is modified
     */
    public onThumbRestChangedObservable = new Observable<ExtendedGamepadButton>();

    /**
     * Creates a new OculusTouchController from a gamepad
     * @param vrGamepad the gamepad that the controller should be created from
     */
    constructor(vrGamepad: any) {
        super(vrGamepad);
        this.controllerType = PoseEnabledControllerType.OCULUS;
    }

    /**
     * Implements abstract method on WebVRController class, loading controller meshes and calling this.attachToMesh if successful.
     * @param scene scene in which to add meshes
     * @param meshLoaded optional callback function that will be called if the mesh loads successfully.
     */
    public initControllerMesh(scene: Scene, meshLoaded?: (mesh: AbstractMesh) => void) {
        let meshName;

        // Hand
        if (this.hand === 'left') {
            meshName = OculusTouchController.MODEL_LEFT_FILENAME;
        }
        else { // Right is the default if no hand is specified
            meshName = OculusTouchController.MODEL_RIGHT_FILENAME;
        }

        SceneLoader.ImportMesh("",  OculusTouchController._IsQuest ? OculusTouchController.QUEST_MODEL_BASE_URL : OculusTouchController.MODEL_BASE_URL, meshName, scene, (newMeshes) => {
            /*
            Parent Mesh name: oculus_touch_left
            - body
            - trigger
            - thumbstick
            - grip
            - button_y
            - button_x
            - button_enter
            */

            this._defaultModel = OculusTouchController._IsQuest ? newMeshes[0] : newMeshes[1];
            this.attachToMesh(this._defaultModel);
            if (meshLoaded) {
                meshLoaded(this._defaultModel);
            }
        });
    }

    /**
     * Fired when the A button on this controller is modified
     */
    public get onAButtonStateChangedObservable() {
        if (this.hand === 'right') {
            return this.onMainButtonStateChangedObservable;
        } else {
            throw new Error('No A button on left hand');
        }
    }

    /**
     * Fired when the B button on this controller is modified
     */
    public get onBButtonStateChangedObservable() {
        if (this.hand === 'right') {
            return this.onSecondaryButtonStateChangedObservable;
        } else {
            throw new Error('No B button on left hand');
        }
    }

    /**
     * Fired when the X button on this controller is modified
     */
    public get onXButtonStateChangedObservable() {
        if (this.hand === 'left') {
            return this.onMainButtonStateChangedObservable;
        } else {
            throw new Error('No X button on right hand');
        }
    }

    /**
     * Fired when the Y button on this controller is modified
     */
    public get onYButtonStateChangedObservable() {
        if (this.hand === 'left') {
            return this.onSecondaryButtonStateChangedObservable;
        } else {
            throw new Error('No Y button on right hand');
        }
    }

    /**
      * Called once for each button that changed state since the last frame
      * 0) thumb stick (touch, press, value = pressed (0,1)). value is in this.leftStick
      * 1) index trigger (touch (?), press (only when value > 0.1), value 0 to 1)
      * 2) secondary trigger (same)
      * 3) A (right) X (left), touch, pressed = value
      * 4) B / Y
      * 5) thumb rest
      * @param buttonIdx Which button index changed
      * @param state New state of the button
      * @param changes Which properties on the state changed since last frame
      */
    protected _handleButtonChange(buttonIdx: number, state: ExtendedGamepadButton, changes: GamepadButtonChanges) {
        let notifyObject = state; //{ state: state, changes: changes };
        let triggerDirection = this.hand === 'right' ? -1 : 1;
        switch (buttonIdx) {
            case 0:
                this.onPadStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 1: // index trigger
                if (!OculusTouchController._IsQuest && this._defaultModel) {
                    (<AbstractMesh>(this._defaultModel.getChildren()[3])).rotation.x = -notifyObject.value * 0.20;
                    (<AbstractMesh>(this._defaultModel.getChildren()[3])).position.y = -notifyObject.value * 0.005;
                    (<AbstractMesh>(this._defaultModel.getChildren()[3])).position.z = -notifyObject.value * 0.005;
                }
                this.onTriggerStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 2:  // secondary trigger
                if (!OculusTouchController._IsQuest && this._defaultModel) {
                    (<AbstractMesh>(this._defaultModel.getChildren()[4])).position.x = triggerDirection * notifyObject.value * 0.0035;
                }
                this.onSecondaryTriggerStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 3:
                if (!OculusTouchController._IsQuest && this._defaultModel) {
                    if (notifyObject.pressed) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[1])).position.y = -0.001;
                    }
                    else {
                        (<AbstractMesh>(this._defaultModel.getChildren()[1])).position.y = 0;
                    }
                }
                this.onMainButtonStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 4:
                if (!OculusTouchController._IsQuest && this._defaultModel) {
                    if (notifyObject.pressed) {
                        (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = -0.001;
                    }
                    else {
                        (<AbstractMesh>(this._defaultModel.getChildren()[2])).position.y = 0;
                    }
                }
                this.onSecondaryButtonStateChangedObservable.notifyObservers(notifyObject);
                return;
            case 5:
                this.onThumbRestChangedObservable.notifyObservers(notifyObject);
                return;
        }
    }
}

PoseEnabledControllerHelper._ControllerFactories.push({
    canCreate: (gamepadInfo) => {
        // If the headset reports being an Oculus Quest, use the Quest controller models
        if (Engine.LastCreatedEngine && Engine.LastCreatedEngine._vrDisplay && Engine.LastCreatedEngine._vrDisplay.displayName === "Oculus Quest") {
            OculusTouchController._IsQuest = true;
        }
        return gamepadInfo.id.indexOf('Oculus Touch') !== -1;
    },
    create: (gamepadInfo) => {
        return new OculusTouchController(gamepadInfo);
    }
});
