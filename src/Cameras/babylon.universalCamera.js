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
        //-- end properties for backward compatibility for inputs
        function UniversalCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addGamepad();
        }
        Object.defineProperty(UniversalCamera.prototype, "gamepadAngularSensibility", {
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
        Object.defineProperty(UniversalCamera.prototype, "gamepadMoveSensibility", {
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
        UniversalCamera.prototype.getTypeName = function () {
            return "UniversalCamera";
        };
        return UniversalCamera;
    }(BABYLON.TouchCamera));
    BABYLON.UniversalCamera = UniversalCamera;
})(BABYLON || (BABYLON = {}));
