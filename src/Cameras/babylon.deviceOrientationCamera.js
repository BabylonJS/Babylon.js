var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var DeviceOrientationCamera = (function (_super) {
        __extends(DeviceOrientationCamera, _super);
        //-- end properties for backward compatibility for inputs
        function DeviceOrientationCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addDeviceOrientation();
        }
        Object.defineProperty(DeviceOrientationCamera.prototype, "angularSensibility", {
            //-- Begin properties for backward compatibility for inputs
            get: function () {
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    return gamepad.angularSensibility;
            },
            set: function (value) {
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    gamepad.angularSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeviceOrientationCamera.prototype, "moveSensibility", {
            get: function () {
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    return gamepad.moveSensibility;
            },
            set: function (value) {
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    gamepad.moveSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        DeviceOrientationCamera.prototype.getTypeName = function () {
            return "DeviceOrientationCamera";
        };
        return DeviceOrientationCamera;
    })(BABYLON.FreeCamera);
    BABYLON.DeviceOrientationCamera = DeviceOrientationCamera;
})(BABYLON || (BABYLON = {}));
