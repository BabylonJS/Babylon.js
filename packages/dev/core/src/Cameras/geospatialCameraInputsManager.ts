import { CameraInputsManager } from "./cameraInputsManager";
import type { GeospatialCamera } from "./geospatialCamera";
import { GeospatialCameraPointersInput } from "./Inputs/geospatialCameraPointersInput";
import { GeospatialCameraMouseWheelInput } from "./Inputs/geospatialCameraMouseWheelInput";
import { GeospatialCameraKeyboardInput } from "./Inputs/geospatialCameraKeyboardInput";

/**
 * Default Inputs manager for the GeospatialCamera.
 * It groups all the default supported inputs for ease of use.
 */
export class GeospatialCameraInputsManager extends CameraInputsManager<GeospatialCamera> {
    /**
     * Instantiates a new GeospatialCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera: GeospatialCamera) {
        super(camera);
    }

    /**
     * Add mouse input support to the input manager
     * @returns the current input manager
     */
    public addMouse(): GeospatialCameraInputsManager {
        this.add(new GeospatialCameraPointersInput());
        return this;
    }

    /**
     * Add mouse wheel input support to the input manager
     * @returns the current input manager
     */
    public addMouseWheel(): GeospatialCameraInputsManager {
        this.add(new GeospatialCameraMouseWheelInput());
        return this;
    }

    /**
     * Add mouse wheel input support to the input manager
     * @returns the current input manager
     */
    public addKeyboard(): GeospatialCameraInputsManager {
        this.add(new GeospatialCameraKeyboardInput());
        return this;
    }
}
