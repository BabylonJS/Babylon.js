module BABYLON {
    /**
     * Manage the device orientation inputs (gyroscope) to control an arc rotate camera.
     * @see http://doc.babylonjs.com/how_to/customizing_camera_inputs
     */
    export class ArcRotateCameraVRDeviceOrientationInput implements ICameraInput<ArcRotateCamera> {
        /**
         * Defines the camera the input is attached to.
         */
        public camera: ArcRotateCamera;

        /**
         * Defines a correction factor applied on the alpha value retrieved from the orientation events.
         */
        public alphaCorrection = 1;

        /**
         * Defines a correction factor applied on the gamma value retrieved from the orientation events.
         */
        public gammaCorrection = 1;

        private _alpha = 0;
        private _gamma = 0;
        private _dirty = false;

        private _deviceOrientationHandler: () => void;

        /**
         * Instantiate a new ArcRotateCameraVRDeviceOrientationInput.
         */
        constructor() {
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }

        /**
         * Attach the input controls to a specific dom element to get the input from.
         * @param element Defines the element the controls should be listened from
         * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
         */
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            this.camera.attachControl(element, noPreventDefault);
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        /** @hidden */
        public _onOrientationEvent(evt: DeviceOrientationEvent): void {
            if (evt.alpha !== null) {
                this._alpha = (+evt.alpha | 0) * this.alphaCorrection;
            }

            if (evt.gamma !== null) {
                this._gamma = (+evt.gamma | 0) * this.gammaCorrection;
            }
            this._dirty = true;
        }

        /**
         * Update the current camera state depending on the inputs that have been used this frame.
         * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
         */
        public checkInputs(): void {
            if (this._dirty) {
                this._dirty = false;

                if (this._gamma < 0) {
                    this._gamma = 180 + this._gamma;
                }

                this.camera.alpha = (-this._alpha / 180.0 * Math.PI) % Math.PI * 2;
                this.camera.beta = (this._gamma / 180.0 * Math.PI);
            }
        }

        /**
         * Detach the current controls from the specified dom element.
         * @param element Defines the element to stop listening the inputs from
         */
        public detachControl(element: Nullable<HTMLElement>): void {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        /**
         * Gets the class name of the current intput.
         * @returns the class name
         */
        public getClassName(): string {
            return "ArcRotateCameraVRDeviceOrientationInput";
        }

        /**
         * Get the friendly name associated with the input class.
         * @returns the input friendly name
         */
        public getSimpleName(): string {
            return "VRDeviceOrientation";
        }
    }

    (<any>CameraInputTypes)["ArcRotateCameraVRDeviceOrientationInput"] = ArcRotateCameraVRDeviceOrientationInput;
}
