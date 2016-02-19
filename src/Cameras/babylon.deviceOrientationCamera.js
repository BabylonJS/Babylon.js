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
        function DeviceOrientationCamera(name, position, scene) {
            var _this = this;
            _super.call(this, name, position, scene);
            this._offsetX = null;
            this._offsetY = null;
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
            this.angularSensibility = 10000.0;
            this.moveSensibility = 50.0;
            window.addEventListener("resize", function () {
                _this._initialOrientationGamma = null;
            }, false);
        }
        DeviceOrientationCamera.prototype.attachControl = function (canvas, noPreventDefault) {
            var _this = this;
            if (this._attachedCanvas) {
                return;
            }
            this._attachedCanvas = canvas;
            if (!this._orientationChanged) {
                this._orientationChanged = function (evt) {
                    if (!_this._initialOrientationGamma) {
                        _this._initialOrientationGamma = evt.gamma;
                        _this._initialOrientationBeta = evt.beta;
                    }
                    _this._orientationGamma = evt.gamma;
                    _this._orientationBeta = evt.beta;
                    _this._offsetY = (_this._initialOrientationBeta - _this._orientationBeta);
                    _this._offsetX = (_this._initialOrientationGamma - _this._orientationGamma);
                };
            }
            window.addEventListener("deviceorientation", this._orientationChanged);
        };
        DeviceOrientationCamera.prototype.detachControl = function (canvas) {
            if (this._attachedCanvas !== canvas) {
                return;
            }
            window.removeEventListener("deviceorientation", this._orientationChanged);
            this._attachedCanvas = null;
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
        };
        DeviceOrientationCamera.prototype._checkInputs = function () {
            if (!this._offsetX) {
                return;
            }
            this.cameraRotation.y -= this._offsetX / this.angularSensibility;
            var speed = this._computeLocalCameraSpeed();
            var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
            this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
            _super.prototype._checkInputs.call(this);
        };
        DeviceOrientationCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "DeviceOrientationCamera";
            return serializationObject;
        };
        return DeviceOrientationCamera;
    })(BABYLON.FreeCamera);
    BABYLON.DeviceOrientationCamera = DeviceOrientationCamera;
})(BABYLON || (BABYLON = {}));
