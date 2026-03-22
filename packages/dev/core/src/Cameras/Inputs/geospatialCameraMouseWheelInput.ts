import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import { BaseCameraMouseWheelInput } from "./BaseCameraMouseWheelInput";
import type { GeospatialCameraPointersInput } from "./geospatialCameraPointersInput";

/**
 * Manage the mouse wheel inputs to control a geospatial camera.
 */
export class GeospatialCameraMouseWheelInput extends BaseCameraMouseWheelInput {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: GeospatialCamera;

    /** When false, wheel zoom is blocked while a pointer rotation button is active. */
    public allowZoomWhilePointerRotating: boolean = false;

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public override getClassName(): string {
        return "GeospatialCameraMouseWheelInput";
    }

    public override checkInputs(): void {
        if (this.allowZoomWhilePointerRotating || !(this.camera.inputs.attached["pointers"] as GeospatialCameraPointersInput | undefined)?.isRotating) {
            this.camera.movement.handleZoom(this._wheelDeltaY, true);
        }

        super.checkInputs();
    }
}

(<any>CameraInputTypes)["GeospatialCameraMouseWheelInput"] = GeospatialCameraMouseWheelInput;
