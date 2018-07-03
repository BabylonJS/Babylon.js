module BABYLON {
    Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
        return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
    });

    export class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene);

            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
        }


        public getClassName(): string {
            return "VRDeviceOrientationFreeCamera";
        }
    }
}
