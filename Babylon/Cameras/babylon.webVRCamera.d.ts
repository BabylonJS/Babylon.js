declare var HMDVRDevice: any;
declare var PositionSensorVRDevice: any;
declare module BABYLON {
    class WebVRCamera extends OculusCamera {
        public _hmdDevice: any;
        public _sensorDevice: any;
        public _cacheState: any;
        public _cacheQuaternion: Quaternion;
        public _cacheRotation: Vector3;
        public _vrEnabled: boolean;
        constructor(name: string, position: Vector3, scene: Scene);
        private _getWebVRDevices(devices);
        public _update(): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
    }
}
