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
         * 
         * @param name 
         * @param position 
         * @param scene 
         * @param compensateDistortion 
         * @param vrCameraMetrics 
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
