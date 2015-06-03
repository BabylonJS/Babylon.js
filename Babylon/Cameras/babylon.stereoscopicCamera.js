var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var StereoscopicFreeCamera = (function (_super) {
        __extends(StereoscopicFreeCamera, _super);
        function StereoscopicFreeCamera(name, position, eyeSpace, isVertical, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
        return StereoscopicFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.StereoscopicFreeCamera = StereoscopicFreeCamera;
    var StereoscopicArcRotateCamera = (function (_super) {
        __extends(StereoscopicArcRotateCamera, _super);
        function StereoscopicArcRotateCamera(name, alpha, beta, radius, target, eyeSpace, isVertical, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
        return StereoscopicArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.StereoscopicArcRotateCamera = StereoscopicArcRotateCamera;
    var StereoscopicGamepadCamera = (function (_super) {
        __extends(StereoscopicGamepadCamera, _super);
        function StereoscopicGamepadCamera(name, position, eyeSpace, isVertical, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(isVertical ? BABYLON.Camera.SUB_CAMERA_MODE_VERTICAL_STEREOSCOPIC : BABYLON.Camera.SUB_CAMERA_MODE_HORIZONTAL_STEREOSCOPIC, eyeSpace);
        }
        return StereoscopicGamepadCamera;
    })(BABYLON.GamepadCamera);
    BABYLON.StereoscopicGamepadCamera = StereoscopicGamepadCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.stereoscopicCamera.js.map