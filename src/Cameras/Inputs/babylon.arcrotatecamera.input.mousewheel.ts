module BABYLON {
    export class ArcRotateCameraMouseWheelInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        
        private _wheel: (e: MouseWheelEvent) => void;

        @serialize()
        public wheelPrecision = 3.0;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
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
                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                }
            };
            element.addEventListener('mousewheel', this._wheel, false);
            element.addEventListener('DOMMouseScroll', this._wheel, false);
        }

        public detachControl(element: HTMLElement) {
            if (this._wheel && element){
                element.removeEventListener('mousewheel', this._wheel);
                element.removeEventListener('DOMMouseScroll', this._wheel);
                this._wheel = null;
            }
        }

        getTypeName(): string {
            return "ArcRotateCameraMouseWheelInput";
        }
        
        getSimpleName(){
            return "mousewheel";
        }
    }
    
    CameraInputTypes["ArcRotateCameraMouseWheelInput"] = ArcRotateCameraMouseWheelInput;
}