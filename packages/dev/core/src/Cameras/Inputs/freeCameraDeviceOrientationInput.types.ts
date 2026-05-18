import { type Nullable } from "../../types";
import { type FreeCameraDeviceOrientationInput } from "./freeCameraDeviceOrientationInput.pure";
// Module augmentation to abstract orientation inputs from camera.
declare module "../../Cameras/freeCameraInputsManager.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface FreeCameraInputsManager {
        /**
         * @internal
         */
        _deviceOrientationInput: Nullable<FreeCameraDeviceOrientationInput>;
        /**
         * Add orientation input support to the input manager.
         * @param smoothFactor deviceOrientation smoothing. 0: no smoothing, 1: new data ignored, 0.9 recommended for smoothing
         * @returns the current input manager
         */
        addDeviceOrientation(smoothFactor?: number): FreeCameraInputsManager;
    }
}
