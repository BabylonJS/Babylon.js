var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var AnaglyphFreeCamera = (function (_super) {
        __extends(AnaglyphFreeCamera, _super);
        function AnaglyphFreeCamera(name, position, interaxialDistance, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphFreeCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "AnaglyphFreeCamera";
            return serializationObject;
        };
        return AnaglyphFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.AnaglyphFreeCamera = AnaglyphFreeCamera;
    var AnaglyphArcRotateCamera = (function (_super) {
        __extends(AnaglyphArcRotateCamera, _super);
        function AnaglyphArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphArcRotateCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "AnaglyphArcRotateCamera";
            return serializationObject;
        };
        return AnaglyphArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.AnaglyphArcRotateCamera = AnaglyphArcRotateCamera;
    var AnaglyphGamepadCamera = (function (_super) {
        __extends(AnaglyphGamepadCamera, _super);
        function AnaglyphGamepadCamera(name, position, interaxialDistance, scene) {
            _super.call(this, name, position, scene);
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphGamepadCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "AnaglyphGamepadCamera";
            return serializationObject;
        };
        return AnaglyphGamepadCamera;
    })(BABYLON.GamepadCamera);
    BABYLON.AnaglyphGamepadCamera = AnaglyphGamepadCamera;
    var StereoscopicFreeCamera = (function (_super) {
        __extends(StereoscopicFreeCamera, _super);
        function StereoscopicFreeCamera(name, position, interaxialDistance, isSideBySide, scene) {
            _super.call(this, name, position, scene);
            this.setCameraRigMode(isSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicFreeCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "StereoscopicFreeCamera";
            return serializationObject;
        };
        return StereoscopicFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.StereoscopicFreeCamera = StereoscopicFreeCamera;
    var StereoscopicArcRotateCamera = (function (_super) {
        __extends(StereoscopicArcRotateCamera, _super);
        function StereoscopicArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, isSideBySide, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.setCameraRigMode(isSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicArcRotateCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "StereoscopicArcRotateCamera";
            return serializationObject;
        };
        return StereoscopicArcRotateCamera;
    })(BABYLON.ArcRotateCamera);
    BABYLON.StereoscopicArcRotateCamera = StereoscopicArcRotateCamera;
    var StereoscopicGamepadCamera = (function (_super) {
        __extends(StereoscopicGamepadCamera, _super);
        function StereoscopicGamepadCamera(name, position, interaxialDistance, isSideBySide, scene) {
            _super.call(this, name, position, scene);
            this.setCameraRigMode(isSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicGamepadCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "StereoscopicGamepadCamera";
            return serializationObject;
        };
        return StereoscopicGamepadCamera;
    })(BABYLON.GamepadCamera);
    BABYLON.StereoscopicGamepadCamera = StereoscopicGamepadCamera;
})(BABYLON || (BABYLON = {}));
