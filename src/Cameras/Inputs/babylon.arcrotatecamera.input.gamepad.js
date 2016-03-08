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
            var _this = this;
            this.gamepadRotationSensibility = 80;
            this._gamepads = new BABYLON.Gamepads(function (gamepad) { _this._onNewGameConnected(gamepad); });
        }
        ArcRotateCameraGamepadInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
        };
        ArcRotateCameraGamepadInput.prototype.detach = function () {
            this._gamepads.dispose();
        };
        ArcRotateCameraGamepadInput.prototype.checkInputs = function () {
            if (this.gamepad) {
                var camera = this.camera;
                var LSValues = this.gamepad.leftStick;
                if (LSValues.x != 0) {
                    var normalizedLX = LSValues.x / this.gamepadRotationSensibility;
                    if (normalizedLX != 0 && Math.abs(normalizedLX) > 0.005) {
                        camera.inertialAlphaOffset += normalizedLX;
                    }
                }
                if (LSValues.y != 0) {
                    var normalizedLY = LSValues.y / this.gamepadRotationSensibility;
                    if (normalizedLY != 0 && Math.abs(normalizedLY) > 0.005) {
                        camera.inertialBetaOffset += normalizedLY;
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
        return ArcRotateCameraGamepadInput;
    })();
    BABYLON.ArcRotateCameraGamepadInput = ArcRotateCameraGamepadInput;
    BABYLON.CameraInputTypes["ArcRotateCameraGamepadInput"] = ArcRotateCameraGamepadInput;
})(BABYLON || (BABYLON = {}));
