module BABYLON {
    export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        @serialize()
        public angularSensibility = 2000.0;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;

        private previousPosition: { x: number, y: number };

        constructor(public touchEnabled = true) {
        }

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            if (!this._pointerInput) {
                var camera = this.camera;
                var engine = this.camera.getEngine();
                this._pointerInput = (p, s) => {
                    var evt = <PointerEvent>p.event;

                    if (!this.touchEnabled && evt.pointerType === "touch") {
                        return;
                    }

                    if (p.type === PointerEventTypes.POINTERDOWN) {
                        try {
                            evt.srcElement.setPointerCapture(evt.pointerId);
                        } catch (e) {
                            //Nothing to do with the error. Execution will continue.
                        }

                        this.previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                            element.focus();
                        }
                    }
                    else if (p.type === PointerEventTypes.POINTERUP) {
                        try {
                            evt.srcElement.releasePointerCapture(evt.pointerId);
                        } catch (e) {
                            //Nothing to do with the error.
                        }

                        this.previousPosition = null;
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }

                    else if (p.type === PointerEventTypes.POINTERMOVE) {
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

                        if (this.camera.getScene().useRightHandedSystem) {
                            camera.cameraRotation.y -= offsetX / this.angularSensibility;
                        } else {
                            camera.cameraRotation.y += offsetX / this.angularSensibility;                            
                        }
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

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
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
