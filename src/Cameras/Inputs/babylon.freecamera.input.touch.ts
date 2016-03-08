module BABYLON {
    export class FreeCameraTouchInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        private _offsetX: number = null;
        private _offsetY: number = null;
        private _pointerCount: number = 0;
        private _pointerPressed = [];
        private _attachedElement: HTMLElement;
        private _onPointerDown: (e: PointerEvent) => any;
        private _onPointerUp: (e: PointerEvent) => any;
        private _onPointerMove: (e: PointerEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;

        @serialize()
        public touchAngularSensibility: number = 200000.0;

        @serialize()
        public touchMoveSensibility: number = 250.0;

        attachCamera(camera: FreeCamera) {
            this.camera = camera;
        }
        
        attachElement(element: HTMLElement, noPreventDefault?: boolean) {
            var previousPosition;

            if (this._attachedElement) {
                return;
            }

            this._attachedElement = element;

            if (this._onPointerDown === undefined) {
                this._onLostFocus = (evt) => {
                    this._offsetX = null;
                    this._offsetY = null;
                }
                
                this._onPointerDown = (evt) => {

                    if (evt.pointerType === "mouse") {
                        return;
                    }

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
                };

                this._onPointerUp = (evt) => {

                    if (evt.pointerType === "mouse") {
                        return;
                    }

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
                };

                this._onPointerMove = (evt) => {

                    if (evt.pointerType === "mouse") {
                        return;
                    }

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
                };


            }
            element.addEventListener("blur", this._onLostFocus);
            element.addEventListener("pointerdown", this._onPointerDown);
            element.addEventListener("pointerup", this._onPointerUp);
            element.addEventListener("pointerout", this._onPointerUp);
            element.addEventListener("pointermove", this._onPointerMove);
        }

        detachElement(element: HTMLElement) {
            if (this._attachedElement !== element) {
                return;
            }

            element.removeEventListener("blur", this._onLostFocus);
            element.removeEventListener("pointerdown", this._onPointerDown);
            element.removeEventListener("pointerup", this._onPointerUp);
            element.removeEventListener("pointerout", this._onPointerUp);
            element.removeEventListener("pointermove", this._onPointerMove);
            this._attachedElement = null;
        }

        checkInputs() {
            if (this._offsetX) {
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

        detach() {
            if (this._attachedElement) {
                this.detachElement(this._attachedElement);
            }
        }

        getTypeName(): string {
            return "freecamera.touch";
        }
    }
    
    CameraInputTypes["freecamera.touch"] = FreeCameraTouchInput;
}