module BABYLON {
    export class VRDeviceOrientationFreeCamera extends FreeCamera {

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene);

            this.rotationQuaternion = new Quaternion();

            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });

            this.inputs.addDeviceOrientation();
        }


        public getTypeName(): string {
            return "VRDeviceOrientationFreeCamera";
        }
    }

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
