var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var FollowCamera = (function (_super) {
        __extends(FollowCamera, _super);
        function FollowCamera(name, position, scene, target) {
            _super.call(this, name, position, scene);
            this.radius = 12;
            this.rotationOffset = 0;
            this.heightOffset = 4;
            this.cameraAcceleration = 0.05;
            this.maxCameraSpeed = 20;
            this.target = target;
        }
        FollowCamera.prototype.getRadians = function (degrees) {
            return degrees * Math.PI / 180;
        };
        FollowCamera.prototype.follow = function (cameraTarget) {
            if (!cameraTarget)
                return;
            var yRotation;
            if (cameraTarget.rotationQuaternion) {
                var rotMatrix = new BABYLON.Matrix();
                cameraTarget.rotationQuaternion.toRotationMatrix(rotMatrix);
                yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);
            }
            else {
                yRotation = cameraTarget.rotation.y;
            }
            var radians = this.getRadians(this.rotationOffset) + yRotation;
            var targetX = cameraTarget.position.x + Math.sin(radians) * this.radius;
            var targetZ = cameraTarget.position.z + Math.cos(radians) * this.radius;
            var dx = targetX - this.position.x;
            var dy = (cameraTarget.position.y + this.heightOffset) - this.position.y;
            var dz = (targetZ) - this.position.z;
            var vx = dx * this.cameraAcceleration * 2; //this is set to .05
            var vy = dy * this.cameraAcceleration;
            var vz = dz * this.cameraAcceleration * 2;
            if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
                vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }
            if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
                vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }
            if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
                vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
            }
            this.position = new BABYLON.Vector3(this.position.x + vx, this.position.y + vy, this.position.z + vz);
            this.setTarget(cameraTarget.position);
        };
        FollowCamera.prototype._checkInputs = function () {
            _super.prototype._checkInputs.call(this);
            this.follow(this.target);
        };
        FollowCamera.prototype.getTypeName = function () {
            return "FollowCamera";
        };
        __decorate([
            BABYLON.serialize()
        ], FollowCamera.prototype, "radius", void 0);
        __decorate([
            BABYLON.serialize()
        ], FollowCamera.prototype, "rotationOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], FollowCamera.prototype, "heightOffset", void 0);
        __decorate([
            BABYLON.serialize()
        ], FollowCamera.prototype, "cameraAcceleration", void 0);
        __decorate([
            BABYLON.serialize()
        ], FollowCamera.prototype, "maxCameraSpeed", void 0);
        __decorate([
            BABYLON.serializeAsMeshReference("lockedTargetId")
        ], FollowCamera.prototype, "target", void 0);
        return FollowCamera;
    })(BABYLON.TargetCamera);
    BABYLON.FollowCamera = FollowCamera;
    var ArcFollowCamera = (function (_super) {
        __extends(ArcFollowCamera, _super);
        function ArcFollowCamera(name, alpha, beta, radius, target, scene) {
            _super.call(this, name, BABYLON.Vector3.Zero(), scene);
            this.alpha = alpha;
            this.beta = beta;
            this.radius = radius;
            this.target = target;
            this._cartesianCoordinates = BABYLON.Vector3.Zero();
            this.follow();
        }
        ArcFollowCamera.prototype.follow = function () {
            this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
            this._cartesianCoordinates.y = this.radius * Math.sin(this.beta);
            this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);
            this.position = this.target.position.add(this._cartesianCoordinates);
            this.setTarget(this.target.position);
        };
        ArcFollowCamera.prototype._checkInputs = function () {
            _super.prototype._checkInputs.call(this);
            this.follow();
        };
        ArcFollowCamera.prototype.getTypeName = function () {
            return "ArcFollowCamera";
        };
        return ArcFollowCamera;
    })(BABYLON.TargetCamera);
    BABYLON.ArcFollowCamera = ArcFollowCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.followCamera.js.map