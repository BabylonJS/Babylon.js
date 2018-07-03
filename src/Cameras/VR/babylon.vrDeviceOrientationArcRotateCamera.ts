module BABYLON {
    Node.AddNodeConstructor("VRDeviceOrientationFreeCamera", (name, scene) => {
        return () => new VRDeviceOrientationArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
    });

    export class VRDeviceOrientationArcRotateCamera extends ArcRotateCamera {

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, alpha, beta, radius, target, scene);

            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });

            this.inputs.addVRDeviceOrientation();
        }

        public getClassName(): string {
            return "VRDeviceOrientationArcRotateCamera";
        }
    }
}
