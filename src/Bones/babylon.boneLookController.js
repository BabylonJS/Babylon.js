var BABYLON;
(function (BABYLON) {
    var BoneLookController = (function () {
        function BoneLookController(mesh, bone, target, adjustYaw, adjustPitch, adjustRoll) {
            if (adjustYaw === void 0) { adjustYaw = 0; }
            if (adjustPitch === void 0) { adjustPitch = 0; }
            if (adjustRoll === void 0) { adjustRoll = 0; }
            this.upAxis = BABYLON.Vector3.Up();
            this.adjustYaw = 0;
            this.adjustPitch = 0;
            this.adjustRoll = 0;
            this._tmpVec1 = BABYLON.Vector3.Zero();
            this._tmpVec2 = BABYLON.Vector3.Zero();
            this._tmpVec3 = BABYLON.Vector3.Zero();
            this._tmpVec4 = BABYLON.Vector3.Zero();
            this._tmpMat1 = BABYLON.Matrix.Identity();
            this._tmpMat2 = BABYLON.Matrix.Identity();
            this.mesh = mesh;
            this.bone = bone;
            this.target = target;
            this.adjustYaw = adjustYaw;
            this.adjustPitch = adjustPitch;
            this.adjustRoll = adjustRoll;
        }
        BoneLookController.prototype.update = function () {
            var bone = this.bone;
            var target = this.target;
            var bonePos = this._tmpVec1;
            var zaxis = this._tmpVec2;
            var xaxis = this._tmpVec3;
            var yaxis = this._tmpVec4;
            var mat1 = this._tmpMat1;
            var mat2 = this._tmpMat2;
            bone.getAbsolutePositionToRef(this.mesh, bonePos);
            target.subtractToRef(bonePos, zaxis);
            zaxis.normalize();
            BABYLON.Vector3.CrossToRef(this.upAxis, zaxis, xaxis);
            xaxis.normalize();
            BABYLON.Vector3.CrossToRef(zaxis, xaxis, yaxis);
            yaxis.normalize();
            BABYLON.Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);
            if (this.adjustYaw || this.adjustPitch || this.adjustRoll) {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.adjustYaw, this.adjustPitch, this.adjustRoll, mat2);
                mat2.multiplyToRef(mat1, mat1);
            }
            this.bone.setRotationMatrix(mat1, BABYLON.Space.WORLD, this.mesh);
        };
        return BoneLookController;
    }());
    BABYLON.BoneLookController = BoneLookController;
})(BABYLON || (BABYLON = {}));
