export {};

// Module augmentation to abstract virtual joystick from camera.
declare module "../../Cameras/freeCameraInputsManager.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface FreeCameraInputsManager {
        /**
         * Add virtual joystick input support to the input manager.
         * @returns the current input manager
         */
        addVirtualJoystick(): FreeCameraInputsManager;
    }
}
