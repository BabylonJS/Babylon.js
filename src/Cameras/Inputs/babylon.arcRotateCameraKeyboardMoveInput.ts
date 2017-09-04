module BABYLON {
    export class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        private _keys = [];
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onLostFocus: (e: FocusEvent) => any;
        private _onFocus: () => void;
        private _onBlur: () => void;
        
        @serialize()
        public keysUp = [38];

        @serialize()
        public keysDown = [40];

        @serialize()
        public keysLeft = [37];

        @serialize()
        public keysRight = [39];

        @serialize()
        public keysReset = [111];        

        @serialize()
        public panningSensibility: number = 50.0;        

        private _ctrlPressed: boolean;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            element.tabIndex = 1;

            this._onKeyDown = evt => {

                this._ctrlPressed = evt.ctrlKey;

                if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    this.keysReset.indexOf(evt.keyCode) !== -1) {
                    var index = this._keys.indexOf(evt.keyCode);

                    if (index === -1) {
                        this._keys.push(evt.keyCode);
                    }

                    if (evt.preventDefault) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };

            this._onKeyUp = evt => {
                
                if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1 ||
                    this.keysReset.indexOf(evt.keyCode) !== -1) {
                    var index = this._keys.indexOf(evt.keyCode);

                    if (index >= 0) {
                        this._keys.splice(index, 1);
                    }

                    if (evt.preventDefault) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                }
            };

            this._onLostFocus = () => {
                this._keys = [];
            };

            this._onFocus = () => {
                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);   
            }

            this._onBlur = () => {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
            }

            element.addEventListener("focus", this._onFocus);
            element.addEventListener("blur", this._onBlur);

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement) {
            if (element && this._onBlur) {
                this._onBlur();
                element.removeEventListener("focus", this._onFocus);
                element.removeEventListener("blur", this._onBlur);
            }

            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
            
            this._keys = [];
            this._onKeyDown = null;
            this._onKeyUp = null;
            this._onLostFocus = null;
            this._onBlur = null;
            this._onFocus = null;
        }

        public checkInputs() {
            if (this._onKeyDown){
                var camera = this.camera;

                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                            camera.inertialPanningX -= 1 / this.panningSensibility;
                        } else {
                            camera.inertialAlphaOffset -= 0.01;
                        }
                    } else if (this.keysUp.indexOf(keyCode) !== -1) {
                        if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                            camera.inertialPanningY += 1 / this.panningSensibility;
                        } else {
                            camera.inertialBetaOffset -= 0.01;
                        }
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                            camera.inertialPanningX += 1 / this.panningSensibility;
                        } else {                        
                            camera.inertialAlphaOffset += 0.01;
                        }
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                        if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                            camera.inertialPanningY -= 1 / this.panningSensibility;
                        } else {
                            camera.inertialBetaOffset += 0.01;
                        }
                    } else if (this.keysReset.indexOf(keyCode) !== -1) {
                        camera.restoreState();
                    }
                }
            }
        }

        getClassName(): string {
            return "ArcRotateCameraKeyboardMoveInput";
        }
        
        getSimpleName(){
            return "keyboard";
        }
    }
    
    CameraInputTypes["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
}