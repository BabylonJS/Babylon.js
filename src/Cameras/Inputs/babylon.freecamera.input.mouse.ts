module BABYLON {
    export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        @serialize()
        public angularSensibility = 2000.0;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;

        private previousPosition: { x: number, y: number };

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {

            if (!this._pointerInput) {
                var camera = this.camera;
                var engine = this.camera.getEngine();
                this._pointerInput = (p, s) => {
                    var evt = <PointerEvent>p.event;
                    if (p.type === PointerEventType.PointerDown) {
                        evt.srcElement.setPointerCapture(evt.pointerId);

                        this.previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    else if (p.type === PointerEventType.PointerUp) {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                        this.previousPosition = null;
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }

                    else if (p.type === PointerEventType.PointerMove) {
                        if (!this.previousPosition && !engine.isPointerLock) {
                            return;
                        }

                        var offsetX;
                        var offsetY;

                        if (!engine.isPointerLock) {
                            offsetX = evt.clientX - this.previousPosition.x;
                            offsetY = evt.clientY - this.previousPosition.y;
                        } else {
                            offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                            offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                        }

                        camera.cameraRotation.y += offsetX / this.angularSensibility;
                        camera.cameraRotation.x += offsetY / this.angularSensibility;

                        this.previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput);
        }

        detachControl(element: HTMLElement) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;

                this.previousPosition = null;
            }
        }

        getTypeName(): string {
            return "FreeCameraMouseInput";
        }

        getSimpleName() {
            return "mouse";
        }
    }

    CameraInputTypes["FreeCameraMouseInput"] = FreeCameraMouseInput;
}
