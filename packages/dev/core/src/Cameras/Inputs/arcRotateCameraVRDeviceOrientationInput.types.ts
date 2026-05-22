export {};

// Module augmentation to abstract orientation inputs from camera.
declare module "../../Cameras/arcRotateCameraInputsManager.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ArcRotateCameraInputsManager {
        /**
         * Add orientation input support to the input manager.
         * @returns the current input manager
         */
        addVRDeviceOrientation(): ArcRotateCameraInputsManager;
    }
}
