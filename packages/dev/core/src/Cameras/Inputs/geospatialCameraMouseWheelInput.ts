import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "./BaseCameraMouseWheelInput";

/**
 * @experimental
 * Manage the mouse wheel inputs to control a geospatial camera. As this feature is experimental the API will evolve
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
        this.camera.movement.zoomAccumulatedPixels = this._wheelDeltaY;
        super.checkInputs();
    }
}

(<any>CameraInputTypes)["GeospatialCameraMouseWheelInput"] = GeospatialCameraMouseWheelInput;
