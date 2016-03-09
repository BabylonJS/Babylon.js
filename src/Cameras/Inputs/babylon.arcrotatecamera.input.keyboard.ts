module BABYLON {
    export class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        private _keys = [];
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;
        
        @serialize()
        public keysUp = [38];

        @serialize()
        public keysDown = [40];

        @serialize()
        public keysLeft = [37];

        @serialize()
        public keysRight = [39];

        public attachCamera(camera: ArcRotateCamera) {
            this.camera = camera;

            this._onKeyDown = evt => {
                if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    var index = this._keys.indexOf(evt.keyCode);

                    if (index === -1) {
                        this._keys.push(evt.keyCode);
                    }

                    if (evt.preventDefault) {
                        if (!camera._noPreventDefault) {
                            evt.preventDefault();
                        }
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

                    if (evt.preventDefault) {
                        if (!camera._noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };

            this._onLostFocus = () => {
                this._keys = [];
            };

            Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detach() {
            Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp },
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public checkInputs() {
            var camera = this.camera;

            for (var index = 0; index < this._keys.length; index++) {
                var keyCode = this._keys[index];
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    camera.inertialAlphaOffset -= 0.01;
                } else if (this.keysUp.indexOf(keyCode) !== -1) {
                    camera.inertialBetaOffset -= 0.01;
                } else if (this.keysRight.indexOf(keyCode) !== -1) {
                    camera.inertialAlphaOffset += 0.01;
                } else if (this.keysDown.indexOf(keyCode) !== -1) {
                    camera.inertialBetaOffset += 0.01;
                }
            }
        }

        getTypeName(): string {
            return "ArcRotateCameraKeyboardMoveInput";
        }
        
        getSimpleName(){
            return "keyboard";
        }
    }
    
    CameraInputTypes["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
}