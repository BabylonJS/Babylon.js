/** This file must only contain pure code and pure imports */

import { type Nullable } from "../types";
import { Scene } from "../scene.pure";
import { SceneComponentConstants } from "../sceneComponent";
import type { ISceneComponent } from "../sceneComponent";
import { FreeCameraGamepadInput } from "../Cameras/Inputs/freeCameraGamepadInput";
import { ArcRotateCameraGamepadInput } from "../Cameras/Inputs/arcRotateCameraGamepadInput";
import { GamepadManager } from "./gamepadManager";
import { FreeCameraInputsManager } from "../Cameras/freeCameraInputsManager";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager";



declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _gamepadManager: Nullable<GamepadManager>;

        /**
         * Gets the gamepad manager associated with the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/input/gamepads
         */
        gamepadManager: GamepadManager;
    }
}

declare module "../Cameras/freeCameraInputsManager" {
    /**
     * Interface representing a free camera inputs manager
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface FreeCameraInputsManager {
        /**
         * Adds gamepad input support to the FreeCameraInputsManager.
         * @returns the FreeCameraInputsManager
         */
        addGamepad(): FreeCameraInputsManager;
    }
}

declare module "../Cameras/arcRotateCameraInputsManager" {
    /**
     * Interface representing an arc rotate camera inputs manager
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ArcRotateCameraInputsManager {
        /**
         * Adds gamepad input support to the ArcRotateCamera InputManager.
         * @returns the camera inputs manager
         */
        addGamepad(): ArcRotateCameraInputsManager;
    }
}

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


let _registered = false;
export function registerGamepadSceneComponent(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
