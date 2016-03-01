var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var AnaglyphFreeCamera = (function (_super) {
        __extends(AnaglyphFreeCamera, _super);
        function AnaglyphFreeCamera(name, position, eyeSpace, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(BABYLON.Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
        return AnaglyphFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.AnaglyphFreeCamera = AnaglyphFreeCamera;
    var AnaglyphArcRotateCamera = (function (_super) {
        __extends(AnaglyphArcRotateCamera, _super);
        function AnaglyphArcRotateCamera(name, alpha, beta, radius, target, eyeSpace, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.setSubCameraMode(BABYLON.Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
        return AnaglyphArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.AnaglyphArcRotateCamera = AnaglyphArcRotateCamera;
    var AnaglyphGamepadCamera = (function (_super) {
        __extends(AnaglyphGamepadCamera, _super);
        function AnaglyphGamepadCamera(name, position, eyeSpace, scene) {
            _super.call(this, name, position, scene);
            this.setSubCameraMode(BABYLON.Camera.SUB_CAMERA_MODE_ANAGLYPH, eyeSpace);
        }
        return AnaglyphGamepadCamera;
    })(BABYLON.GamepadCamera);
    BABYLON.AnaglyphGamepadCamera = AnaglyphGamepadCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.anaglyphCamera.js.map