module BABYLON {
    export class FreeCameraMouseInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        @serialize()
        public buttons = [0, 1, 2];

        @serialize()
        public angularSensibility = 2000.0;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _onMouseMove: Nullable<(e: MouseEvent) => any>;
        private _observer: Nullable<Observer<PointerInfo>>;

        private previousPosition: Nullable<{ x: number, y: number }> = null;

        constructor(public touchEnabled = true) {
        }           

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var engine = this.camera.getEngine();

            if (!this._pointerInput) {
                this._pointerInput = (p, s) => {
                    var evt = <PointerEvent>p.event;

                    if (engine.isInVRExclusivePointerMode) {
                        return;
                    }

                    if (!this.touchEnabled && evt.pointerType === "touch") {
                        return;
                    }

                    if(p.type !== PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1){
                        return;
                    }

                    if (p.type === PointerEventTypes.POINTERDOWN && evt.srcElement) {
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
                    else if (p.type === PointerEventTypes.POINTERUP && evt.srcElement) {
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
                        if (!this.previousPosition || engine.isPointerLock) {
                            return;
                        }

                        var offsetX = evt.clientX - this.previousPosition.x;
                        var offsetY = evt.clientY - this.previousPosition.y;

                        if (this.camera.getScene().useRightHandedSystem) {
                            this.camera.cameraRotation.y -= offsetX / this.angularSensibility;
                        } else {
                            this.camera.cameraRotation.y += offsetX / this.angularSensibility;
                        }

                        this.camera.cameraRotation.x += offsetY / this.angularSensibility;

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

            this._onMouseMove = evt => {
                if (!engine.isPointerLock) {
                    return;
                }

                if (engine.isInVRExclusivePointerMode) {
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

                this.previousPosition = null;

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
            element.addEventListener("mousemove", this._onMouseMove, false);

        }

        detachControl(element: HTMLElement) {
            if (this._observer && element) {
                this.camera.getScene().onPointerObservable.remove(this._observer);

                if (this._onMouseMove) {
                    element.removeEventListener("mousemove", this._onMouseMove);
                }

                this._observer = null;
                this._onMouseMove = null;
                this.previousPosition = null;
            }
        }

        getClassName(): string {
            return "FreeCameraMouseInput";
        }

        getSimpleName() {
            return "mouse";
        }      
    }

    (<any>CameraInputTypes)["FreeCameraMouseInput"] = FreeCameraMouseInput;
}
