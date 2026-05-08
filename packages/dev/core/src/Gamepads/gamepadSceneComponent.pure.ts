/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import { SceneComponentConstants, type ISceneComponent } from "../sceneComponent";

import { FreeCameraGamepadInput } from "../Cameras/Inputs/freeCameraGamepadInput";
import { ArcRotateCameraGamepadInput } from "../Cameras/Inputs/arcRotateCameraGamepadInput";
import { GamepadManager } from "./gamepadManager";
import { FreeCameraInputsManager } from "../Cameras/freeCameraInputsManager.pure";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager.pure";

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
        // Nothing to do for gamepads
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for gamepads
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        const gamepadManager = this.scene._gamepadManager;
        if (gamepadManager) {
            gamepadManager.dispose();
            this.scene._gamepadManager = null;
        }
    }
}

let _Registered = false;
/**
 * Register side effects for gamepadSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterGamepadSceneComponent(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    Object.defineProperty(Scene.prototype, "gamepadManager", {
        get: function (this: Scene) {
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
        configurable: true,
    });

    /**
     * Adds a gamepad to the free camera inputs manager
     * @returns the FreeCameraInputsManager
     */
    FreeCameraInputsManager.prototype.addGamepad = function (): FreeCameraInputsManager {
        this.add(new FreeCameraGamepadInput());
        return this;
    };

    /**
     * Adds a gamepad to the arc rotate camera inputs manager
     * @returns the camera inputs manager
     */
    ArcRotateCameraInputsManager.prototype.addGamepad = function (): ArcRotateCameraInputsManager {
        this.add(new ArcRotateCameraGamepadInput());
        return this;
    };
}
