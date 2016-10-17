var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VRDeviceOrientationFreeCamera = (function (_super) {
        __extends(VRDeviceOrientationFreeCamera, _super);
        function VRDeviceOrientationFreeCamera(name, position, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            _super.call(this, name, position, scene);
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
        }
        VRDeviceOrientationFreeCamera.prototype.getTypeName = function () {
            return "VRDeviceOrientationFreeCamera";
        };
        return VRDeviceOrientationFreeCamera;
    }(BABYLON.DeviceOrientationCamera));
    BABYLON.VRDeviceOrientationFreeCamera = VRDeviceOrientationFreeCamera;
    var VRDeviceOrientationArcRotateCamera = (function (_super) {
        __extends(VRDeviceOrientationArcRotateCamera, _super);
        function VRDeviceOrientationArcRotateCamera(name, alpha, beta, radius, target, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            _super.call(this, name, alpha, beta, radius, target, scene);
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
            this.inputs.addVRDeviceOrientation();
        }
        VRDeviceOrientationArcRotateCamera.prototype.getTypeName = function () {
            return "VRDeviceOrientationArcRotateCamera";
        };
        return VRDeviceOrientationArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.VRDeviceOrientationArcRotateCamera = VRDeviceOrientationArcRotateCamera;
})(BABYLON || (BABYLON = {}));
