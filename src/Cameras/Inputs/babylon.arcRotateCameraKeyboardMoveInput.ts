module BABYLON {
    export class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;
        private _keys = new Array<number>();
        
        @serialize()
        public keysUp = [38];

        @serialize()
        public keysDown = [40];

        @serialize()
        public keysLeft = [37];

        @serialize()
        public keysRight = [39];

        @serialize()
        public keysReset = [220];

        @serialize()
        public panningSensibility: number = 50.0;

        @serialize()
        public zoomingSensibility: number = 25.0;

        @serialize()
        public useAltToZoom: boolean = true;

        private _ctrlPressed: boolean;
        private _altPressed: boolean;
        private _onCanvasBlurObserver: Nullable<Observer<Engine>>;
        private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
        private _engine: Engine;
        private _scene: Scene;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            if (this._onCanvasBlurObserver) {
                return;
            }
            
            this._scene = this.camera.getScene();
            this._engine = this._scene.getEngine();

            this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(()=>{
                this._keys = [];
            });

            this._onKeyboardObserver = this._scene.onKeyboardObservable.add(info => {
                let evt = info.event;

                if (info.type === KeyboardEventTypes.KEYDOWN) {
                    this._ctrlPressed = evt.ctrlKey;
                    this._altPressed = evt.altKey;

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
                }
                else {
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
                }
            });    
        }

        public detachControl(element: HTMLElement) {
            if (this._scene) {
                if (this._onKeyboardObserver) {
                    this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
                }
                if (this._onCanvasBlurObserver) {
                    this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
                }
                this._onKeyboardObserver = null;
                this._onCanvasBlurObserver = null;
            }

            this._keys = [];
        }

        public checkInputs() {
            if (this._onKeyboardObserver){
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
                        }
                        else if (this._altPressed && this.useAltToZoom) {
                            camera.inertialRadiusOffset += 1 / this.zoomingSensibility;
                        }
                        else {
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
                        }
                        else if (this._altPressed && this.useAltToZoom) {
                            camera.inertialRadiusOffset -= 1 / this.zoomingSensibility;
                        }
                        else {
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
    
    (<any>CameraInputTypes)["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
}