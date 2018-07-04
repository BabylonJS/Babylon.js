module BABYLON {
    Node.AddNodeConstructor("VRDeviceOrientationGamepadCamera", (name, scene) => {
        return () => new VRDeviceOrientationGamepadCamera(name, Vector3.Zero(), scene);
    });

    export class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene, compensateDistortion, vrCameraMetrics);
            
            this.inputs.addGamepad();
        }

        public getClassName(): string {
            return "VRDeviceOrientationGamepadCamera";
        }
    }
}
