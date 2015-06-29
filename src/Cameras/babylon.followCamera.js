var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var FollowCamera = (function (_super) {
        __extends(FollowCamera, _super);
        function FollowCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.radius = 12;
            this.rotationOffset = 0;
            this.heightOffset = 4;
            this.cameraAcceleration = 0.05;
            this.maxCameraSpeed = 20;
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
        return FollowCamera;
    })(BABYLON.TargetCamera);
    BABYLON.FollowCamera = FollowCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.followCamera.js.map