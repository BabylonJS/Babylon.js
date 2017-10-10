module BABYLON {
    export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

        private _wheel: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;

        @serialize()
        public wheelPrecision = 3.0;

        /**
         * wheelPrecisionPercentage will be used instead of whellPrecision if different from 0. 
         * It defines the percentage of current camera.radius to use as delta when wheel is used.
         */
        @serialize()
        public wheelPrecisionPercentage = 0;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            this._wheel = (p, s) => {
                //sanity check - this should be a PointerWheel event.
                if (p.type !== PointerEventTypes.POINTERWHEEL) return;
                var event = <MouseWheelEvent>p.event;
                var delta = 0;

                if (event.wheelDelta) {
                    delta = this.wheelPrecisionPercentage ? (event.wheelDelta * 0.01) * this.camera.radius * this.wheelPrecisionPercentage : event.wheelDelta / (this.wheelPrecision * 40);
                } else if (event.detail) {
                    delta = -event.detail / this.wheelPrecision;
                }

                if (delta)
                    this.camera.inertialRadiusOffset += delta;

                if (event.preventDefault) {
                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                }
            };

            this._observer = this.camera.getScene().onPointerObservable.add(this._wheel, PointerEventTypes.POINTERWHEEL);
        }

        public detachControl(element: HTMLElement) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;
                this._wheel = null;
            }
        }

        getClassName(): string {
            return "ArcRotateCameraMouseWheelInput";
        }

        getSimpleName() {
            return "mousewheel";
        }
    }

    CameraInputTypes["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
}
