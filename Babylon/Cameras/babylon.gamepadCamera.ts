module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class GamepadCamera extends FreeCamera {
        private _gamepad: BABYLON.Gamepad;
        private _gamepads: BABYLON.Gamepads;
        public angularSensibility = 200;
        public moveSensibility = 75;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this._gamepads = new BABYLON.Gamepads((gamepad: BABYLON.Gamepad) => { this._onNewGameConnected(gamepad); });
        }

        private _onNewGameConnected(gamepad: BABYLON.Gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this._gamepad = gamepad;
            }
        }

        public _checkInputs(): void {
            if (!this._gamepad) {
                return;
            }

            var LSValues = this._gamepad.leftStick;
            var normalizedLX = LSValues.x / this.moveSensibility;
            var normalizedLY = LSValues.y / this.moveSensibility;
            LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
            LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;

            var RSValues = this._gamepad.rightStick;
            var normalizedRX = RSValues.x / this.angularSensibility;
            var normalizedRY = RSValues.y / this.angularSensibility;
            RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
            RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;;

            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);

            var speed = this._computeLocalCameraSpeed() * 50.0;
            var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(LSValues.x * speed, 0, -LSValues.y * speed), cameraTransform);
            this.cameraDirection = this.cameraDirection.add(deltaTransform);
            this.cameraRotation = this.cameraRotation.add(new BABYLON.Vector2(RSValues.y, RSValues.x));
        }

        public dispose(): void {
            this._gamepads.dispose();
            super.dispose();
        }
    }
}