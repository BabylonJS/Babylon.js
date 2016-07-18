declare var HMDVRDevice;
declare var PositionSensorVRDevice;

module BABYLON {
    export class WebVRFreeCamera extends FreeCamera {
        public _hmdDevice = null;
        public _sensorDevice = null;
        private _cacheState = null;
        public _vrEnabled = false;

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault()) {
            super(name, position, scene);

            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });

            this._getWebVRDevices = this._getWebVRDevices.bind(this);

            this.rotationQuaternion = new Quaternion();
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

        public _checkInputs(): void {
            if (this._vrEnabled) {
                this._cacheState = this._sensorDevice.getState();
                this.rotationQuaternion.copyFrom(this._cacheState.orientation);
                //Flip in XY plane
                this.rotationQuaternion.z *= -1;
                this.rotationQuaternion.w *= -1;
            }

            super._checkInputs();
        }

        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            super.attachControl(element, noPreventDefault);

            noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;

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

        public requestVRFullscreen(requestPointerlock: boolean) {
            if (!this._hmdDevice) return;
            this.getEngine().switchFullscreen(requestPointerlock, { vrDisplay: this._hmdDevice })
        }

        public getTypeName(): string {
            return "WebVRFreeCamera";
        }
    }
}

