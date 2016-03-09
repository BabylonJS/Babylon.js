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
            //-- 2016-03-08 properties for backward compatibility for inputs
            //deprecated
            get: function () {
                BABYLON.Tools.Warn("Warning: angularSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.angularSensibility instead.");
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    return gamepad.angularSensibility;
            },
            //deprecated
            set: function (value) {
                BABYLON.Tools.Warn("Warning: angularSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.angularSensibility instead.");
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    gamepad.angularSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DeviceOrientationCamera.prototype, "moveSensibility", {
            //deprecated
            get: function () {
                BABYLON.Tools.Warn("Warning: moveSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.moveSensibility instead.");
                var gamepad = this.inputs.attached["deviceOrientation"];
                if (gamepad)
                    return gamepad.moveSensibility;
            },
            //deprecated
            set: function (value) {
                BABYLON.Tools.Warn("Warning: moveSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.moveSensibility instead.");
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
