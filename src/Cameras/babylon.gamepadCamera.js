var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var GamepadCamera = (function (_super) {
        __extends(GamepadCamera, _super);
        //-- end properties for backward compatibility for inputs
        function GamepadCamera(name, position, scene) {
            BABYLON.Tools.Warn("Deprecated. Please use Universal Camera instead.");
            _super.call(this, name, position, scene);
        }
        Object.defineProperty(GamepadCamera.prototype, "gamepadAngularSensibility", {
            //-- Begin properties for backward compatibility for inputs
            get: function () {
                var gamepad = this.inputs.attached["gamepad"];
                if (gamepad)
                    return gamepad.gamepadAngularSensibility;
            },
            set: function (value) {
                var gamepad = this.inputs.attached["gamepad"];
                if (gamepad)
                    gamepad.gamepadAngularSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GamepadCamera.prototype, "gamepadMoveSensibility", {
            get: function () {
                var gamepad = this.inputs.attached["gamepad"];
                if (gamepad)
                    return gamepad.gamepadMoveSensibility;
            },
            set: function (value) {
                var gamepad = this.inputs.attached["gamepad"];
                if (gamepad)
                    gamepad.gamepadMoveSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        GamepadCamera.prototype.getTypeName = function () {
            return "GamepadCamera";
        };
        return GamepadCamera;
    })(BABYLON.UniversalCamera);
    BABYLON.GamepadCamera = GamepadCamera;
})(BABYLON || (BABYLON = {}));
