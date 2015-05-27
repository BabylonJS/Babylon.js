var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var StereogramFreeCamera = (function (_super) {
        __extends(StereogramFreeCamera, _super);
        function StereogramFreeCamera(name, position, eyeSpace, isVertical, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
        return StereogramFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.StereogramFreeCamera = StereogramFreeCamera;
    var StereogramArcRotateCamera = (function (_super) {
        __extends(StereogramArcRotateCamera, _super);
        function StereogramArcRotateCamera(name, alpha, beta, radius, target, eyeSpace, isVertical, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
        return StereogramArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.StereogramArcRotateCamera = StereogramArcRotateCamera;
    var StereogramGamepadCamera = (function (_super) {
        __extends(StereogramGamepadCamera, _super);
        function StereogramGamepadCamera(name, position, eyeSpace, isVertical, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOGRAM : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOGRAM, eyeSpace);
        }
        return StereogramGamepadCamera;
    })(BABYLON.GamepadCamera);
    BABYLON.StereogramGamepadCamera = StereogramGamepadCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.stereogramCamera.js.map