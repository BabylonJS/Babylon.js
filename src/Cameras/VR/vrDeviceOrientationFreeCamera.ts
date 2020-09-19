import { Camera } from "../../Cameras/camera";
import { DeviceOrientationCamera } from "../../Cameras/deviceOrientationCamera";
import { VRCameraMetrics } from "./vrCameraMetrics";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Node } from "../../node";

// Side effect import to define the stereoscopic mode.
import "../RigModes/vrRigMode";

Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
    return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
});

/**
 * Camera used to simulate VR rendering (based on FreeCamera)
 * @see https://doc.babylonjs.com/babylon101/cameras#vr-device-orientation-cameras
 */
export class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {

    /**
     * Creates a new VRDeviceOrientationFreeCamera
     * @param name defines camera name
     * @param position defines the start position of the camera
     * @param scene defines the scene the camera belongs to
     * @param compensateDistortion defines if the camera needs to compensate the lens distorsion
     * @param vrCameraMetrics defines the vr metrics associated to the camera
     */
    constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
        super(name, position, scene);

        vrCameraMetrics.compensateDistortion = compensateDistortion;
        this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
    }

    /**
     * Gets camera class name
     * @returns VRDeviceOrientationFreeCamera
     */
    public getClassName(): string {
        return "VRDeviceOrientationFreeCamera";
    }
}
