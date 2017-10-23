module BABYLON {
    export class FreeCameraGamepadInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        public gamepad: Nullable<Gamepad>;        
        private _onGamepadConnectedObserver : Nullable<Observer<Gamepad>>;
        private _onGamepadDisconnectedObserver : Nullable<Observer<Gamepad>>;

        @serialize()
        public gamepadAngularSensibility = 200;

        @serialize()
        public gamepadMoveSensibility = 40;

        // private members
        private _cameraTransform: Matrix = Matrix.Identity();
        private _deltaTransform: Vector3 = Vector3.Zero();
        private _vector3: Vector3 = Vector3.Zero();
        private _vector2: Vector2 = Vector2.Zero();

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

        detachControl(element: HTMLElement) {
            this.camera.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
            this.camera.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);
            this.gamepad = null;
        }

        checkInputs() {
            if (this.gamepad && this.gamepad.leftStick) {
                var camera = this.camera;
                var LSValues = this.gamepad.leftStick;
                var normalizedLX = LSValues.x / this.gamepadMoveSensibility;
                var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
                LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;

                var RSValues = this.gamepad.rightStick;
                if (RSValues) {
                    var normalizedRX = RSValues.x / this.gamepadAngularSensibility;
                    var normalizedRY = RSValues.y / this.gamepadAngularSensibility;
                    RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
                    RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;
                }
                else {
                    RSValues = {x:0, y:0};
                }

                if (!camera.rotationQuaternion) {
                    Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, this._cameraTransform);
                } else {
                    camera.rotationQuaternion.toRotationMatrix(this._cameraTransform);
                }

                var speed = camera._computeLocalCameraSpeed() * 50.0;
                this._vector3.copyFromFloats(LSValues.x * speed, 0, -LSValues.y * speed);

                Vector3.TransformCoordinatesToRef(this._vector3, this._cameraTransform, this._deltaTransform);
                camera.cameraDirection.addInPlace(this._deltaTransform);
                this._vector2.copyFromFloats(RSValues.y, RSValues.x)
                camera.cameraRotation.addInPlace(this._vector2);
            }
        }

        getClassName(): string {
            return "FreeCameraGamepadInput";
        }

        getSimpleName() {
            return "gamepad";
        }
    }

    (<any>CameraInputTypes)["FreeCameraGamepadInput"] = FreeCameraGamepadInput;
}