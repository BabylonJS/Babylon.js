module BABYLON {
    export class FreeCameraTouchInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        private _offsetX: Nullable<number> = null;
        private _offsetY: Nullable<number> = null;
        private _pointerCount: number = 0;
        private _pointerPressed = new Array<number>();
        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Nullable<Observer<PointerInfo>>;
        private _onLostFocus: Nullable<(e: FocusEvent) => any>;

        @serialize()
        public touchAngularSensibility: number = 200000.0;

        @serialize()
        public touchMoveSensibility: number = 250.0;

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var previousPosition: Nullable<{x: number, y: number}> = null;

            if (this._pointerInput === undefined) {
                this._onLostFocus = (evt) => {
                    this._offsetX = null;
                    this._offsetY = null;
                }

                this._pointerInput = (p, s) => {
                    var evt = <PointerEvent>p.event;

                    if (evt.pointerType === "mouse") {
                        return;
                    }

                    if (p.type === PointerEventTypes.POINTERDOWN) {

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }

                        this._pointerPressed.push(evt.pointerId);

                        if (this._pointerPressed.length !== 1) {
                            return;
                        }

                        previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY
                        };
                    }

                    else if (p.type === PointerEventTypes.POINTERUP) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }

                        var index: number = this._pointerPressed.indexOf(evt.pointerId);

                        if (index === -1) {
                            return;
                        }
                        this._pointerPressed.splice(index, 1);

                        if (index != 0) {
                            return;
                        }
                        previousPosition = null;
                        this._offsetX = null;
                        this._offsetY = null;
                    }

                    else if (p.type === PointerEventTypes.POINTERMOVE) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }

                        if (!previousPosition) {
                            return;
                        }

                        var index: number = this._pointerPressed.indexOf(evt.pointerId);

                        if (index != 0) {
                            return;
                        }

                        this._offsetX = evt.clientX - previousPosition.x;
                        this._offsetY = -(evt.clientY - previousPosition.y);
                    }
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);

            if (this._onLostFocus) {
                element.addEventListener("blur", this._onLostFocus);
            }
        }

        detachControl(element: Nullable<HTMLElement>) {
            if (this._pointerInput && element) {
                if (this._observer) {
                    this.camera.getScene().onPointerObservable.remove(this._observer);
                    this._observer = null;
                }

                if (this._onLostFocus) {
                    element.removeEventListener("blur", this._onLostFocus);
                    this._onLostFocus = null;
                }
                this._pointerPressed = [];
                this._offsetX = null;
                this._offsetY = null;
                this._pointerCount = 0;
            }
        }

        checkInputs() {
            if (this._offsetX && this._offsetY) {
                var camera = this.camera;
                camera.cameraRotation.y += this._offsetX / this.touchAngularSensibility;

                if (this._pointerPressed.length > 1) {
                    camera.cameraRotation.x += -this._offsetY / this.touchAngularSensibility;
                } else {
                    var speed = camera._computeLocalCameraSpeed();
                    var direction = new Vector3(0, 0, speed * this._offsetY / this.touchMoveSensibility);

                    Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
                    camera.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
                }
            }
        }

        getClassName(): string {
            return "FreeCameraTouchInput";
        }

        getSimpleName() {
            return "touch";
        }
    }

    (<any>CameraInputTypes)["FreeCameraTouchInput"] = FreeCameraTouchInput;
}
