module BABYLON {
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

    export class VRDeviceOrientationGamepadCamera extends VRDeviceOrientationFreeCamera {

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene, compensateDistortion, vrCameraMetrics);
            
            this.inputs.addGamepad();
        }

        public getClassName(): string {
            return "VRDeviceOrientationGamepadCamera";
        }
    }

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
