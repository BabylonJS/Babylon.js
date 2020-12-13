import { Nullable } from '../../types';
import { FreeCamera } from '../../Cameras/freeCamera';
import { CameraInputTypes } from '../../Cameras/cameraInputsManager';
import { BaseCameraMouseWheelInput } from '../../Cameras/Inputs/BaseCameraMouseWheelInput';
import { BaseTranslation } from '../Translations/BaseTranslation';


/**
 * Manage the mouse wheel inputs to control a free camera.
 * @see https://doc.babylonjs.com/how_to/customizing_camera_inputs
 */
export class FreeCameraMouseWheelInputDemo extends BaseCameraMouseWheelInput {

    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return 'FreeCameraMouseWheelInputDemo';
    }

    public attachControl(noPreventDefault?: boolean): void {
        super.attachControl(noPreventDefault);

        // Set default mouse wheel actions.
        this.wheelXAction = this.camera.getTranslation('freeCameraMoveRelative_X');
        this.wheelYAction = this.camera.getTranslation('freeCameraMoveRelative_Y');
    }

    /**
     * Called for each rendered frame.
     */
    public checkInputs(): void {
        if (this._wheelDeltaX === 0 &&
                this._wheelDeltaY === 0 &&
                this._wheelDeltaZ == 0) {
            return;
        }

        if (this._wheelDeltaX !== 0 && this.wheelXAction !== null) {
            this.wheelXAction.updateCamera(this._wheelDeltaX);
        }
        if (this._wheelDeltaY !== 0 && this.wheelYAction !== null) {
            this.wheelYAction.updateCamera(this._wheelDeltaY);
        }
        if (this._wheelDeltaZ !== 0 && this.wheelZAction !== null) {
            this.wheelZAction.updateCamera(this._wheelDeltaZ);
        }

        // Call the base class implementation to handle observers and do cleanup.
        super.checkInputs();
    }

    /**
     * Action to attach to Mouse Wheel X axis.
     */
    public wheelXAction: Nullable<BaseTranslation> = null;
    /**
     * Action to attach to Mouse Wheel Y axis.
     */
    public wheelYAction: Nullable<BaseTranslation> = null;
    /**
     * Action to attach to Mouse Wheel Z axis.
     */
    public wheelZAction: Nullable<BaseTranslation> = null;
}

(<any>CameraInputTypes)['FreeCameraMouseWheelInputDemo'] = FreeCameraMouseWheelInputDemo;
