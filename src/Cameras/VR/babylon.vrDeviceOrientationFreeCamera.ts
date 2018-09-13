module BABYLON {
    Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
        return () => new VRDeviceOrientationFreeCamera(name, Vector3.Zero(), scene);
    });

    /**
     * Camera used to simulate VR rendering (based on FreeCamera)
     * @see http://doc.babylonjs.com/babylon101/cameras#vr-device-orientation-cameras
     */
    export class VRDeviceOrientationFreeCamera extends DeviceOrientationCamera {

        /**
         * 
         * @param name 
         * @param position 
         * @param scene 
         * @param compensateDistortion 
         * @param vrCameraMetrics 
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
}
