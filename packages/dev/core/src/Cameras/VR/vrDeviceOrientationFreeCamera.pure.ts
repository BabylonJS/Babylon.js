/** This file must only contain pure code and pure imports */

import { Camera } from "../../Cameras/camera.pure";
import { DeviceOrientationCamera } from "../../Cameras/deviceOrientationCamera.pure";
import { VRCameraMetrics } from "./vrCameraMetrics";
import { type Scene } from "../../scene.pure";
import { Vector3 } from "../../Maths/math.vector.pure";
import { _SetVrRigMode } from "../RigModes/vrRigMode";
import { Node } from "../../node";

/**
 * Camera used to simulate VR rendering (based on FreeCamera)
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#vr-device-orientation-cameras
 */
export class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {
    /**
     * Creates a new VRDeviceOrientationFreeCamera
     * @param name defines camera name
     * @param position defines the start position of the camera
     * @param scene defines the scene the camera belongs to
     * @param compensateDistortion defines if the camera needs to compensate the lens distortion
     * @param vrCameraMetrics defines the vr metrics associated to the camera
     */
    constructor(name: string, position: Vector3, scene?: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
        super(name, position, scene);

        vrCameraMetrics.compensateDistortion = compensateDistortion;
        this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
    }

    /**
     * Gets camera class name
     * @returns VRDeviceOrientationFreeCamera
     */
    public override getClassName(): string {
        return "VRDeviceOrientationFreeCamera";
    }

    protected override _setRigMode = (rigParams: any) => _SetVrRigMode(this, rigParams);
}

let _registered = false;
export function registerVrDeviceOrientationFreeCamera(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
        return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
    });
}
