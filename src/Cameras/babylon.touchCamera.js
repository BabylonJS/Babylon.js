var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var TouchCamera = (function (_super) {
        __extends(TouchCamera, _super);
        //-- end properties for backward compatibility for inputs
        function TouchCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addTouch();
        }
        Object.defineProperty(TouchCamera.prototype, "touchAngularSensibility", {
            //-- 2016-03-08 properties for backward compatibility for inputs
            //deprecated
            get: function () {
                BABYLON.Tools.Warn("Warning: touchAngularSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchAngularSensibility instead.");
                var touch = this.inputs.attached["touch"];
                if (touch)
                    return touch.touchAngularSensibility;
            },
            //deprecated
            set: function (value) {
                BABYLON.Tools.Warn("Warning: touchAngularSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchAngularSensibility instead.");
                var touch = this.inputs.attached["touch"];
                if (touch)
                    touch.touchAngularSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TouchCamera.prototype, "touchMoveSensibility", {
            //deprecated
            get: function () {
                BABYLON.Tools.Warn("Warning: touchMoveSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchMoveSensibility instead.");
                var touch = this.inputs.attached["touch"];
                if (touch)
                    return touch.touchMoveSensibility;
            },
            //deprecated
            set: function (value) {
                BABYLON.Tools.Warn("Warning: touchMoveSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchMoveSensibility instead.");
                var touch = this.inputs.attached["touch"];
                if (touch)
                    touch.touchMoveSensibility = value;
            },
            enumerable: true,
            configurable: true
        });
        TouchCamera.prototype.getTypeName = function () {
            return "TouchCamera";
        };
        return TouchCamera;
    }(BABYLON.FreeCamera));
    BABYLON.TouchCamera = TouchCamera;
})(BABYLON || (BABYLON = {}));
