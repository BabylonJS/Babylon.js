import { type Nullable } from "../types";
import { type GamepadManager } from "./gamepadManager";
declare module "../scene.pure" {
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
declare module "../Cameras/freeCameraInputsManager.pure" {
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
declare module "../Cameras/arcRotateCameraInputsManager.pure" {
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
