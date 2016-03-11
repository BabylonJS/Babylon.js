var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FreeCameraGamepadInput = (function () {
        function FreeCameraGamepadInput() {
            this.gamepadAngularSensibility = 200;
            this.gamepadMoveSensibility = 40;
        }
        FreeCameraGamepadInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            this._gamepads = new BABYLON.Gamepads(function (gamepad) { _this._onNewGameConnected(gamepad); });
        };
        FreeCameraGamepadInput.prototype.detachControl = function (element) {
            this._gamepads.dispose();
            this.gamepad = null;
        };
        FreeCameraGamepadInput.prototype.checkInputs = function () {
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
                var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(camera.rotation.y, camera.rotation.x, 0);
                var speed = camera._computeLocalCameraSpeed() * 50.0;
                var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(LSValues.x * speed, 0, -LSValues.y * speed), cameraTransform);
                camera.cameraDirection = camera.cameraDirection.add(deltaTransform);
                camera.cameraRotation = camera.cameraRotation.add(new BABYLON.Vector2(RSValues.y, RSValues.x));
            }
        };
        FreeCameraGamepadInput.prototype._onNewGameConnected = function (gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this.gamepad = gamepad;
            }
        };
        FreeCameraGamepadInput.prototype.getTypeName = function () {
            return "FreeCameraGamepadInput";
        };
        FreeCameraGamepadInput.prototype.getSimpleName = function () {
            return "gamepad";
        };
        __decorate([
            BABYLON.serialize()
        ], FreeCameraGamepadInput.prototype, "gamepadAngularSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], FreeCameraGamepadInput.prototype, "gamepadMoveSensibility", void 0);
        return FreeCameraGamepadInput;
    })();
    BABYLON.FreeCameraGamepadInput = FreeCameraGamepadInput;
    BABYLON.CameraInputTypes["FreeCameraGamepadInput"] = FreeCameraGamepadInput;
})(BABYLON || (BABYLON = {}));
