declare var HMDVRDevice;
declare var PositionSensorVRDevice;

module BABYLON {
    export class WebVRCamera extends BABYLON.OculusCamera {
        public _hmdDevice = null;
        public _sensorDevice = null;
        public _cacheState = null;
        public _cacheQuaternion = new BABYLON.Quaternion();
        public _cacheRotation = BABYLON.Vector3.Zero();
        public _vrEnabled = false;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this._getWebVRDevices = this._getWebVRDevices.bind(this);
        }

        private _getWebVRDevices(devices: Array<any>): void {
            var size = devices.length;
            var i = 0;

            // Reset devices.
            this._sensorDevice = null;
            this._hmdDevice = null;

            // Search for a HmdDevice.
            while (i < size && this._hmdDevice === null) {
                if (devices[i] instanceof HMDVRDevice) {
                    this._hmdDevice = devices[i];
                }
                i++;
            }

            i = 0;

            while (i < size && this._sensorDevice === null) {
                if (devices[i] instanceof PositionSensorVRDevice && (!this._hmdDevice || devices[i].hardwareUnitId === this._hmdDevice.hardwareUnitId)) {
                    this._sensorDevice = devices[i];
                }
                i++;
            }

            this._vrEnabled = this._sensorDevice && this._hmdDevice ? true : false;
        }

        public _update(): void {
            if (this._vrEnabled) {
                this._cacheState = this._sensorDevice.getState();
                this._cacheQuaternion.copyFromFloats(this._cacheState.orientation.x, this._cacheState.orientation.y, this._cacheState.orientation.z, this._cacheState.orientation.w);
                this._cacheQuaternion.toEulerAnglesToRef(this._cacheRotation);

                this.rotation.x = -this._cacheRotation.z;
                this.rotation.y = -this._cacheRotation.y;
                this.rotation.z = this._cacheRotation.x;
            }

            super._update();
        }

        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            super.attachControl(element, noPreventDefault);

            if (navigator.getVRDevices) {
                navigator.getVRDevices().then(this._getWebVRDevices);
            }
            else if (navigator.mozGetVRDevices) {
                navigator.mozGetVRDevices(this._getWebVRDevices);
            }
        }

        public detachControl(element: HTMLElement): void {
            super.detachControl(element);
            this._vrEnabled = false;
        }
    }
}