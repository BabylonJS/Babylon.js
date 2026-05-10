/** This file must only contain pure code and pure imports */

import { type ArcRotateCamera } from "./arcRotateCamera.pure";
import { ArcRotateCameraPointersInput } from "../Cameras/Inputs/arcRotateCameraPointersInput";
import { ArcRotateCameraKeyboardMoveInput } from "../Cameras/Inputs/arcRotateCameraKeyboardMoveInput";
import { ArcRotateCameraMouseWheelInput } from "../Cameras/Inputs/arcRotateCameraMouseWheelInput";
import { CameraInputsManager } from "../Cameras/cameraInputsManager";

/**
 * Default Inputs manager for the ArcRotateCamera.
 * It groups all the default supported inputs for ease of use.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraInputsManager extends CameraInputsManager<ArcRotateCamera> {
    /**
     * Instantiates a new ArcRotateCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera: ArcRotateCamera) {
        super(camera);
    }

    /**
     * Add mouse wheel input support to the input manager.
     * @returns the current input manager
     */
    public addMouseWheel(): ArcRotateCameraInputsManager {
        this.add(new ArcRotateCameraMouseWheelInput());
        return this;
    }

    /**
     * Add pointers input support to the input manager.
     * @returns the current input manager
     */
    public addPointers(): ArcRotateCameraInputsManager {
        this.add(new ArcRotateCameraPointersInput());
        return this;
    }

    /**
     * Add keyboard input support to the input manager.
     * @returns the current input manager
     */
    public addKeyboard(): ArcRotateCameraInputsManager {
        this.add(new ArcRotateCameraKeyboardMoveInput());
        return this;
    }
}

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffect } from "../Misc/devTools";

ArcRotateCameraInputsManager.prototype.addVRDeviceOrientation ??= _MissingSideEffect("ArcRotateCameraInputsManager", "addVRDeviceOrientation") as any;
ArcRotateCameraInputsManager.prototype.addGamepad ??= _MissingSideEffect("ArcRotateCameraInputsManager", "addGamepad") as any;
// #endregion GENERATED_SIDE_EFFECT_STUBS
