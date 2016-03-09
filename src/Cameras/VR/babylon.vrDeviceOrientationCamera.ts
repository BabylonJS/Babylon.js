module BABYLON {
    export class VRDeviceOrientationFreeCamera extends FreeCamera {        

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true) {
            super(name, position, scene);

            var metrics = VRCameraMetrics.GetDefault();
            metrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: metrics });

            this.inputs.addVRDeviceOrientation();
        }


        public getTypeName(): string {
            return "VRDeviceOrientationFreeCamera";
        }
    }
}