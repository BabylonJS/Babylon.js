module BABYLON {
    export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        attachedElement: HTMLElement;

        private _wheel: (e: MouseWheelEvent) => void;

        @serialize()
        public wheelPrecision = 3.0;

        public attachCamera(camera: ArcRotateCamera) {
            this.camera = camera;
        }

        public attachElement(element: HTMLElement) {
            this.attachedElement = element;
            this._wheel = event => {
                var delta = 0;
                if (event.wheelDelta) {
                    delta = event.wheelDelta / (this.wheelPrecision * 40);
                } else if (event.detail) {
                    delta = -event.detail / this.wheelPrecision;
                }

                if (delta)
                    this.camera.inertialRadiusOffset += delta;

                if (event.preventDefault) {
                    if (!this.camera._noPreventDefault) {
                        event.preventDefault();
                    }
                }
            };
            element.addEventListener('mousewheel', this._wheel, false);
            element.addEventListener('DOMMouseScroll', this._wheel, false);
        }

        public detach() {
            this.attachedElement.removeEventListener('mousewheel', this._wheel);
            this.attachedElement.removeEventListener('DOMMouseScroll', this._wheel);
        }

        getTypeName(): string {
            return "arcrotate.mousewheel";
        }
    }
    
    CameraInputTypes["arcrotate.mousewheel"] = ArcRotateCameraMouseWheelInput;
}