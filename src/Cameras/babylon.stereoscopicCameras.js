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
        AnaglyphFreeCamera.prototype.getTypeName = function () {
            return "AnaglyphFreeCamera";
        };
        return AnaglyphFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.AnaglyphFreeCamera = AnaglyphFreeCamera;
    var AnaglyphArcRotateCamera = (function (_super) {
        __extends(AnaglyphArcRotateCamera, _super);
        function AnaglyphArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphArcRotateCamera.prototype.getTypeName = function () {
            return "AnaglyphArcRotateCamera";
        };
        return AnaglyphArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.AnaglyphArcRotateCamera = AnaglyphArcRotateCamera;
    var AnaglyphGamepadCamera = (function (_super) {
        __extends(AnaglyphGamepadCamera, _super);
        function AnaglyphGamepadCamera(name, position, interaxialDistance, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphGamepadCamera.prototype.getTypeName = function () {
            return "AnaglyphGamepadCamera";
        };
        return AnaglyphGamepadCamera;
    }(BABYLON.GamepadCamera));
    BABYLON.AnaglyphGamepadCamera = AnaglyphGamepadCamera;
    var AnaglyphUniversalCamera = (function (_super) {
        __extends(AnaglyphUniversalCamera, _super);
        function AnaglyphUniversalCamera(name, position, interaxialDistance, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH, { interaxialDistance: interaxialDistance });
        }
        AnaglyphUniversalCamera.prototype.getTypeName = function () {
            return "AnaglyphUniversalCamera";
        };
        return AnaglyphUniversalCamera;
    }(BABYLON.UniversalCamera));
    BABYLON.AnaglyphUniversalCamera = AnaglyphUniversalCamera;
    var StereoscopicFreeCamera = (function (_super) {
        __extends(StereoscopicFreeCamera, _super);
        function StereoscopicFreeCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicFreeCamera.prototype.getTypeName = function () {
            return "StereoscopicFreeCamera";
        };
        return StereoscopicFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.StereoscopicFreeCamera = StereoscopicFreeCamera;
    var StereoscopicArcRotateCamera = (function (_super) {
        __extends(StereoscopicArcRotateCamera, _super);
        function StereoscopicArcRotateCamera(name, alpha, beta, radius, target, interaxialDistance, isStereoscopicSideBySide, scene) {
            _super.call(this, name, alpha, beta, radius, target, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicArcRotateCamera.prototype.getTypeName = function () {
            return "StereoscopicArcRotateCamera";
        };
        return StereoscopicArcRotateCamera;
    }(BABYLON.ArcRotateCamera));
    BABYLON.StereoscopicArcRotateCamera = StereoscopicArcRotateCamera;
    var StereoscopicGamepadCamera = (function (_super) {
        __extends(StereoscopicGamepadCamera, _super);
        function StereoscopicGamepadCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicGamepadCamera.prototype.getTypeName = function () {
            return "StereoscopicGamepadCamera";
        };
        return StereoscopicGamepadCamera;
    }(BABYLON.GamepadCamera));
    BABYLON.StereoscopicGamepadCamera = StereoscopicGamepadCamera;
    var StereoscopicUniversalCamera = (function (_super) {
        __extends(StereoscopicUniversalCamera, _super);
        function StereoscopicUniversalCamera(name, position, interaxialDistance, isStereoscopicSideBySide, scene) {
            _super.call(this, name, position, scene);
            this.interaxialDistance = interaxialDistance;
            this.isStereoscopicSideBySide = isStereoscopicSideBySide;
            this.setCameraRigMode(isStereoscopicSideBySide ? BABYLON.Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL : BABYLON.Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER, { interaxialDistance: interaxialDistance });
        }
        StereoscopicUniversalCamera.prototype.getTypeName = function () {
            return "StereoscopicUniversalCamera";
        };
        return StereoscopicUniversalCamera;
    }(BABYLON.UniversalCamera));
    BABYLON.StereoscopicUniversalCamera = StereoscopicUniversalCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.stereoscopicCameras.js.map