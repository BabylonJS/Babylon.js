import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "./BaseCameraMouseWheelInput";

/**
 * Manage the mouse wheel inputs to control a geospatial camera.
 */
export class GeospatialCameraMouseWheelInput extends BaseCameraMouseWheelInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: GeospatialCamera;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public override getClassName(): string {
        return "GeospatialCameraMouseWheelInput";
    }

    public override checkInputs(): void {
        this.camera.movement.handleZoom(this._wheelDeltaY, true);
        super.checkInputs();
    }
}

(<any>CameraInputTypes)["GeospatialCameraMouseWheelInput"] = GeospatialCameraMouseWheelInput;
