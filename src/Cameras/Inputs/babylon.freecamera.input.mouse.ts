module BABYLON {
    export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        @serialize()
        public buttons = [0, 1, 2];

        @serialize()
        public angularSensibility = 2000.0;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;

        constructor(public touchEnabled = true) {
        }

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var engine = this.camera.getEngine();

            if (!this._pointerInput) {
                var isPointerDown = false;
                this._pointerInput = (p, s) => {
                    var evt = <PointerEvent>p.event;

                    if (!this.touchEnabled && evt.pointerType === "touch") {
                        return;
                    }

                    if(p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1){
                        return;
                    }

                    if (p.type === PointerEventTypes.POINTERDOWN) {
                        try {
                            evt.srcElement.setPointerCapture(evt.pointerId);
                        } catch (e) {
                            //Nothing to do with the error. Execution will continue.
                        }

                        isPointerDown = true;

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

                        isPointerDown = false;

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }

                    else if (p.type === PointerEventTypes.POINTERMOVE) {
                        if (!isPointerDown && !engine.isPointerLock) {
                            return;
                        }

                        var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                        var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                        if (this.camera.getScene().useRightHandedSystem) {
                            this.camera.cameraRotation.y -= offsetX / this.angularSensibility;
                        } else {
                            this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                        }
                        this.camera.cameraRotation.x += offsetY / this.angularSensibility;

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
