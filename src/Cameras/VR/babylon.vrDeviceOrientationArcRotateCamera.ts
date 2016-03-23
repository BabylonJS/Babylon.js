module BABYLON {
    export class VRDeviceOrientationArcRotateCamera extends ArcRotateCamera {        

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene, compensateDistortion = true) {
            super(name, alpha, beta, radius, target, scene);

            var metrics = VRCameraMetrics.GetDefault();
            metrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: metrics });

            this.inputs.addVRDeviceOrientation();
        }


        public getTypeName(): string {
            return "VRDeviceOrientationArcRotateCamera";
        }
    }
}