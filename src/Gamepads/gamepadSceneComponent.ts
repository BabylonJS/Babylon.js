import { Nullable } from "../types";
import { Scene } from "../scene";
import { SceneComponentConstants, ISceneComponent } from "../sceneComponent";
import { GamepadManager } from "./gamepadManager";

import { FreeCameraInputsManager } from "../Cameras/freeCameraInputsManager";
import { FreeCameraGamepadInput } from "../Cameras/Inputs/freeCameraGamepadInput";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager";
import { ArcRotateCameraGamepadInput } from "../Cameras/Inputs/arcRotateCameraGamepadInput";

declare module "../scene" {
    export interface Scene {
        /** @hidden */
        _gamepadManager: Nullable<GamepadManager>;

        /**
         * Gets the gamepad manager associated with the scene
         * @see https://doc.babylonjs.com/how_to/how_to_use_gamepads
         */
        gamepadManager: GamepadManager;
    }
}

Object.defineProperty(Scene.prototype, "gamepadManager", {
    get: function(this: Scene) {
        if (!this._gamepadManager) {
            this._gamepadManager = new GamepadManager(this);
            let component = this._getComponent(SceneComponentConstants.NAME_GAMEPAD) as GamepadSystemSceneComponent;
            if (!component) {
                component = new GamepadSystemSceneComponent(this);
                this._addComponent(component);
            }
        }

        return this._gamepadManager;
    },
    enumerable: true,
    configurable: true
});

declare module "../Cameras/freeCameraInputsManager" {
    /**
     * Interface representing a free camera inputs manager
     */
    export interface FreeCameraInputsManager {
        /**
         * Adds gamepad input support to the FreeCameraInputsManager.
         * @returns the FreeCameraInputsManager
         */
        addGamepad(): FreeCameraInputsManager;
    }
}

/**
 * Adds a gamepad to the free camera inputs manager
 */
FreeCameraInputsManager.prototype.addGamepad = function(): FreeCameraInputsManager {
    this.add(new FreeCameraGamepadInput());
    return this;
};

declare module "../Cameras/arcRotateCameraInputsManager" {
    /**
     * Interface representing an arc rotate camera inputs manager
     */
    export interface ArcRotateCameraInputsManager {
        /**
         * Adds gamepad input support to the ArcRotateCamera InputManager.
         * @returns the camera inputs manager
         */
        addGamepad(): ArcRotateCameraInputsManager;
    }
}

/**
 * Adds a gamepad to the arc rotate camera inputs manager
 */
ArcRotateCameraInputsManager.prototype.addGamepad = function(): ArcRotateCameraInputsManager {
    this.add(new ArcRotateCameraGamepadInput());
    return this;
};

/**
  * Defines the gamepad scene component responsible to manage gamepads in a given scene
  */
export class GamepadSystemSceneComponent implements ISceneComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_GAMEPAD;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._beforeCameraUpdateStage.registerStep(SceneComponentConstants.STEP_BEFORECAMERAUPDATE_GAMEPAD, this, this._beforeCameraUpdate);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for gamepads
    }

    /**
     * Disposes the component and the associated ressources
     */
    public dispose(): void {
        let gamepadManager = this.scene._gamepadManager;
        if (gamepadManager) {
            gamepadManager.dispose();
            this.scene._gamepadManager = null;
        }
    }

    private _beforeCameraUpdate(): void {
        let gamepadManager = this.scene._gamepadManager;

        if (gamepadManager && gamepadManager._isMonitoring) {
            gamepadManager._checkGamepadsStatus();
        }
    }
}
