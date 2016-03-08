var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VRDeviceOrientationFreeCamera = (function (_super) {
        __extends(VRDeviceOrientationFreeCamera, _super);
        function VRDeviceOrientationFreeCamera(name, position, scene, compensateDistortion) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            _super.call(this, name, position, scene);
            var metrics = BABYLON.VRCameraMetrics.GetDefault();
            metrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: metrics });
            this.inputs.addVRDeviceOrientation();
        }
        VRDeviceOrientationFreeCamera.prototype.getTypeName = function () {
            return "VRDeviceOrientationFreeCamera";
        };
        return VRDeviceOrientationFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.VRDeviceOrientationFreeCamera = VRDeviceOrientationFreeCamera;
})(BABYLON || (BABYLON = {}));
