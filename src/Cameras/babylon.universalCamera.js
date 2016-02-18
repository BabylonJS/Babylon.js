var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var UniversalCamera = (function (_super) {
        __extends(UniversalCamera, _super);
        function UniversalCamera(name, position, scene) {
            var _this = this;
            _super.call(this, name, position, scene);
            this.gamepadAngularSensibility = 200;
            this.gamepadMoveSensibility = 40;
            this._gamepads = new BABYLON.Gamepads(function (gamepad) { _this._onNewGameConnected(gamepad); });
        }
        UniversalCamera.prototype._onNewGameConnected = function (gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this.gamepad = gamepad;
            }
        };
        UniversalCamera.prototype.attachControl = function (canvas, noPreventDefault) {
            _super.prototype.attachControl.call(this, canvas, false);
        };
        UniversalCamera.prototype.detachControl = function (canvas) {
            _super.prototype.detachControl.call(this, canvas);
        };
        UniversalCamera.prototype._checkInputs = function () {
            if (this.gamepad) {
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
                var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
                var speed = this._computeLocalCameraSpeed() * 50.0;
                var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(LSValues.x * speed, 0, -LSValues.y * speed), cameraTransform);
                this.cameraDirection = this.cameraDirection.add(deltaTransform);
                this.cameraRotation = this.cameraRotation.add(new BABYLON.Vector2(RSValues.y, RSValues.x));
            }
            _super.prototype._checkInputs.call(this);
        };
        UniversalCamera.prototype.dispose = function () {
            this._gamepads.dispose();
            _super.prototype.dispose.call(this);
        };
        UniversalCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "UniversalCamera";
            return serializationObject;
        };
        return UniversalCamera;
    })(BABYLON.TouchCamera);
    BABYLON.UniversalCamera = UniversalCamera;
})(BABYLON || (BABYLON = {}));
