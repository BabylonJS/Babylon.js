module BABYLON {
    export class FreeCameraKeyboardMoveInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;
        private _keys = [];
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;

        @serialize()
        public keysUp = [38];

        @serialize()
        public keysDown = [40];

        @serialize()
        public keysLeft = [37];

        @serialize()
        public keysRight = [39];

        attachControl(element : HTMLElement, noPreventDefault?: boolean) {
            if (!this._onKeyDown) {
                element.tabIndex = 1;

                this._onKeyDown = evt => {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index === -1) {
                            this._keys.push(evt.keyCode);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                this._onKeyUp = evt => {
                    if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                        this.keysDown.indexOf(evt.keyCode) !== -1 ||
                        this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                        this.keysRight.indexOf(evt.keyCode) !== -1) {
                        var index = this._keys.indexOf(evt.keyCode);

                        if (index >= 0) {
                            this._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                };

                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);

                Tools.RegisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
            }
        }

        detachControl(element : HTMLElement) {
            if (this._onKeyDown) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);

                Tools.UnregisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        }
        
        public checkInputs() {
            if (this._onKeyDown){
                var camera = this.camera;
                // Keyboard
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    var speed = camera._computeLocalCameraSpeed();

                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(-speed, 0, 0);
                    } else if (this.keysUp.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(0, 0, speed);
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(speed, 0, 0);
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                        camera._localDirection.copyFromFloats(0, 0, -speed);
                    }

                    if (camera.getScene().useRightHandedSystem) {
                        camera._localDirection.z *= -1;
                    }

                    camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                    Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);
                    camera.cameraDirection.addInPlace(camera._transformedDirection);
                }
            }
        }

        getTypeName(): string {
            return "FreeCameraKeyboardMoveInput";
        }

        public _onLostFocus(e: FocusEvent): void {
            this._keys = [];
        }
        
        getSimpleName(){
            return "keyboard";
        }
    }
    
    CameraInputTypes["FreeCameraKeyboardMoveInput"] = FreeCameraKeyboardMoveInput;
}