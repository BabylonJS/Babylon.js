module BABYLON {
    Node.AddNodeConstructor("VRDeviceOrientationGamepadCamera", (name, scene) => {
        return () => new VRDeviceOrientationGamepadCamera(name, Vector3.Zero(), scene);
    });

    /**
     * Camera used to simulate VR rendering (based on VRDeviceOrientationFreeCamera)
     * @see http://doc.babylonjs.com/babylon101/cameras#vr-device-orientation-cameras
     */
    export class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {

        /**
         * Creates a new VRDeviceOrientationGamepadCamera
         * @param name defines camera name
         * @param position defines the start position of the camera
         * @param scene defines the scene the camera belongs to
         * @param compensateDistortion defines if the camera needs to compensate the lens distorsion
         * @param vrCameraMetrics defines the vr metrics associated to the camera
         */
        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene, compensateDistortion, vrCameraMetrics);

            this.inputs.addGamepad();
        }

        /**
         * Gets camera class name
         * @returns VRDeviceOrientationGamepadCamera
         */
        public getClassName(): string {
            return "VRDeviceOrientationGamepadCamera";
        }
    }
}
