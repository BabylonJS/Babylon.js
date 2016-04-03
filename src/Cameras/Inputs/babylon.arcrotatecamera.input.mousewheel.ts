module BABYLON {
    export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

        private _wheel: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;

        @serialize()
        public wheelPrecision = 3.0;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            this._wheel = (p, s) => {
                //sanity check - this should be a PointerWheel event.
                if (p.type !== PointerEventTypes.POINTERWHEEL) return;
                var event = <MouseWheelEvent>p.event;
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / (this.wheelPrecision * 40);
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

        getTypeName(): string {
            return "ArcRotateCameraMouseWheelInput";
        }

        getSimpleName() {
            return "mousewheel";
        }
    }

    CameraInputTypes["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
}
