module BABYLON {
    export class ArcRotateCameraGamepadInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

        public gamepad: Nullable<Gamepad>;
        private _onGamepadConnectedObserver : Nullable<Observer<Gamepad>>;
        private _onGamepadDisconnectedObserver : Nullable<Observer<Gamepad>>;

        @serialize()
        public gamepadRotationSensibility = 80;

        @serialize()
        public gamepadMoveSensibility = 40;

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            let manager = this.camera.getScene().gamepadManager;
            this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add((gamepad) => {
                if (gamepad.type !== Gamepad.POSE_ENABLED) {
                    // prioritize XBOX gamepads.
                    if (!this.gamepad || gamepad.type === Gamepad.XBOX) {
                        this.gamepad = gamepad;
                    }
                }
            });  

            this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add((gamepad)=> {
                if (this.gamepad === gamepad) {
                    this.gamepad = null;
                }
            });            
            
            this.gamepad = manager.getGamepadByType(Gamepad.XBOX);
        }

        detachControl(element: Nullable<HTMLElement>) {
            this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);            
            this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
            this.gamepad = null;
        }

        checkInputs() {
            if (this.gamepad) {
                var camera = this.camera;
                var RSValues = this.gamepad.rightStick;

                if (RSValues) {
                    if (RSValues.x != 0) {
                        var normalizedRX = RSValues.x / this.gamepadRotationSensibility;
                        if (normalizedRX != 0 && Math.abs(normalizedRX) > 0.005) {
                            camera.inertialAlphaOffset += normalizedRX;
                        }
                    }

                    if (RSValues.y != 0) {
                        var normalizedRY = RSValues.y / this.gamepadRotationSensibility;
                        if (normalizedRY != 0 && Math.abs(normalizedRY) > 0.005) {
                            camera.inertialBetaOffset += normalizedRY;
                        }
                    }
                }

                var LSValues = this.gamepad.leftStick;
                if (LSValues && LSValues.y != 0) {
                    var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                    if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                        this.camera.inertialRadiusOffset -= normalizedLY;
                    }
                }

            }
        }

        getClassName(): string {
            return "ArcRotateCameraGamepadInput";
        }

        getSimpleName() {
            return "gamepad";
        }        
    }

    (<any>CameraInputTypes)["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
}
