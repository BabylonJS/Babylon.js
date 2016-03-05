module BABYLON {       
    export class ComposableCameraGamepadInput implements IComposableCameraInput {
        camera : ComposableCamera;
        
        public gamepad: Gamepad;
        private _gamepads: Gamepads;

        @serialize()
        public gamepadAngularSensibility = 200;

        @serialize()
        public gamepadMoveSensibility = 40;
        
        constructor(){
            this._gamepads = new Gamepads((gamepad: Gamepad) => { this._onNewGameConnected(gamepad); });
        }
        
        attachCamera(camera : ComposableCamera){
            this.camera = camera;
        }
        
        detach(){
            
        }
        
        checkInputs(){
            if (this.gamepad) {
                var camera = this.camera;
                var LSValues = this.gamepad.leftStick;
                var normalizedLX = LSValues.x / this.gamepadMoveSensibility;
                var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
                LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;

                var RSValues = this.gamepad.rightStick;
                var normalizedRX = RSValues.x / this.gamepadAngularSensibility;
                var normalizedRY = RSValues.y / this.gamepadAngularSensibility;
                RSValues.x = Math.abs(normalizedRX) > 0.001 ? 0 + normalizedRX : 0;
                RSValues.y = Math.abs(normalizedRY) > 0.001 ? 0 + normalizedRY : 0;

                var cameraTransform = Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);

                var speed = camera._computeLocalCameraSpeed() * 50.0;
                var deltaTransform = Vector3.TransformCoordinates(new Vector3(LSValues.x * speed, 0, -LSValues.y * speed), cameraTransform);
                camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
                camera.cameraRotation = camera.cameraRotation.add(new Vector2(RSValues.y, RSValues.x));
            }
        }
        
        private _onNewGameConnected(gamepad: Gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this.gamepad = gamepad;
            }
        }
        
        getTypeName(): string{
            return "gamepad";
        }
    }
}