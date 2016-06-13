var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ArcRotateCameraGamepadInput = (function () {
        function ArcRotateCameraGamepadInput() {
            this.gamepadRotationSensibility = 80;
            this.gamepadMoveSensibility = 40;
        }
        ArcRotateCameraGamepadInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            this._gamepads = new BABYLON.Gamepads(function (gamepad) { _this._onNewGameConnected(gamepad); });
        };
        ArcRotateCameraGamepadInput.prototype.detachControl = function (element) {
            if (this._gamepads) {
                this._gamepads.dispose();
            }
            this.gamepad = null;
        };
        ArcRotateCameraGamepadInput.prototype.checkInputs = function () {
            if (this.gamepad) {
                var camera = this.camera;
                var RSValues = this.gamepad.rightStick;
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
                var LSValues = this.gamepad.leftStick;
                if (LSValues.y != 0) {
                    var normalizedLY = LSValues.y / this.gamepadMoveSensibility;
                    if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                        this.camera.inertialRadiusOffset -= normalizedLY;
                    }
                }
            }
        };
        ArcRotateCameraGamepadInput.prototype._onNewGameConnected = function (gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this.gamepad = gamepad;
            }
        };
        ArcRotateCameraGamepadInput.prototype.getTypeName = function () {
            return "ArcRotateCameraGamepadInput";
        };
        ArcRotateCameraGamepadInput.prototype.getSimpleName = function () {
            return "gamepad";
        };
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraGamepadInput.prototype, "gamepadRotationSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], ArcRotateCameraGamepadInput.prototype, "gamepadMoveSensibility", void 0);
        return ArcRotateCameraGamepadInput;
    })();
    BABYLON.ArcRotateCameraGamepadInput = ArcRotateCameraGamepadInput;
    BABYLON.CameraInputTypes["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
})(BABYLON || (BABYLON = {}));
