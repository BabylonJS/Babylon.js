declare module BABYLON {
    class VRDeviceOrientationCamera extends OculusCamera {
        public _alpha: number;
        public _beta: number;
        public _gamma: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
    }
}
