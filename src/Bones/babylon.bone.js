var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Bone = (function (_super) {
        __extends(Bone, _super);
        function Bone(name, skeleton, parentBone, matrix, restPose) {
            _super.call(this, name, skeleton.getScene());
            this.name = name;
            this.children = new Array();
            this.animations = new Array();
            this._worldTransform = new BABYLON.Matrix();
            this._absoluteTransform = new BABYLON.Matrix();
            this._invertedAbsoluteTransform = new BABYLON.Matrix();
            this._scaleMatrix = BABYLON.Matrix.Identity();
            this._scaleVector = new BABYLON.Vector3(1, 1, 1);
            this._skeleton = skeleton;
            this._matrix = matrix;
            this._baseMatrix = matrix;
            this._restPose = restPose ? restPose : matrix.clone();
            skeleton.bones.push(this);
            if (parentBone) {
                this._parent = parentBone;
                parentBone.children.push(this);
            }
            else {
                this._parent = null;
            }
            this._updateDifferenceMatrix();
        }
        // Members
        Bone.prototype.getParent = function () {
            return this._parent;
        };
        Bone.prototype.getLocalMatrix = function () {
            return this._matrix;
        };
        Bone.prototype.getBaseMatrix = function () {
            return this._baseMatrix;
        };
        Bone.prototype.getRestPose = function () {
            return this._restPose;
        };
        Bone.prototype.returnToRest = function () {
            this.updateMatrix(this._restPose.clone());
        };
        Bone.prototype.getWorldMatrix = function () {
            return this._worldTransform;
        };
        Bone.prototype.getInvertedAbsoluteTransform = function () {
            return this._invertedAbsoluteTransform;
        };
        Bone.prototype.getAbsoluteTransform = function () {
            return this._absoluteTransform;
        };
        // Methods
        Bone.prototype.updateMatrix = function (matrix, updateDifferenceMatrix) {
            if (updateDifferenceMatrix === void 0) { updateDifferenceMatrix = true; }
            this._baseMatrix = matrix.clone();
            this._matrix = matrix.clone();
            this._skeleton._markAsDirty();
            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
        };
        Bone.prototype._updateDifferenceMatrix = function (rootMatrix) {
            if (!rootMatrix) {
                rootMatrix = this._baseMatrix;
            }
            if (this._parent) {
                rootMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(rootMatrix);
            }
            this._absoluteTransform.invertToRef(this._invertedAbsoluteTransform);
            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._updateDifferenceMatrix();
            }
        };
        Bone.prototype.markAsDirty = function () {
            this._currentRenderId++;
            this._skeleton._markAsDirty();
        };
        Bone.prototype.copyAnimationRange = function (source, rangeName, frameOffset, rescaleAsRequired, skelDimensionsRatio) {
            if (rescaleAsRequired === void 0) { rescaleAsRequired = false; }
            if (skelDimensionsRatio === void 0) { skelDimensionsRatio = null; }
            // all animation may be coming from a library skeleton, so may need to create animation
            if (this.animations.length === 0) {
                this.animations.push(new BABYLON.Animation(this.name, "_matrix", source.animations[0].framePerSecond, BABYLON.Animation.ANIMATIONTYPE_MATRIX, 0));
                this.animations[0].setKeys([]);
            }
            // get animation info / verify there is such a range from the source bone
            var sourceRange = source.animations[0].getRange(rangeName);
            if (!sourceRange) {
                return false;
            }
            var from = sourceRange.from;
            var to = sourceRange.to;
            var sourceKeys = source.animations[0].getKeys();
            // rescaling prep
            var sourceBoneLength = source.length;
            var sourceParent = source.getParent();
            var parent = this.getParent();
            var parentScalingReqd = rescaleAsRequired && sourceParent && sourceBoneLength && this.length && sourceBoneLength !== this.length;
            var parentRatio = parentScalingReqd ? parent.length / sourceParent.length : null;
            var dimensionsScalingReqd = rescaleAsRequired && !parent && skelDimensionsRatio && (skelDimensionsRatio.x !== 1 || skelDimensionsRatio.y !== 1 || skelDimensionsRatio.z !== 1);
            var destKeys = this.animations[0].getKeys();
            // loop vars declaration
            var orig;
            var origTranslation;
            var mat;
            for (var key = 0, nKeys = sourceKeys.length; key < nKeys; key++) {
                orig = sourceKeys[key];
                if (orig.frame >= from && orig.frame <= to) {
                    if (rescaleAsRequired) {
                        mat = orig.value.clone();
                        // scale based on parent ratio, when bone has parent
                        if (parentScalingReqd) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.scaleInPlace(parentRatio));
                        }
                        else if (dimensionsScalingReqd) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.multiplyInPlace(skelDimensionsRatio));
                        }
                        else {
                            mat = orig.value;
                        }
                    }
                    else {
                        mat = orig.value;
                    }
                    destKeys.push({ frame: orig.frame + frameOffset, value: mat });
                }
            }
            this.animations[0].createRange(rangeName, from + frameOffset, to + frameOffset);
            return true;
        };
        Bone.prototype.setScale = function (x, y, z, scaleChildren) {
            if (scaleChildren === void 0) { scaleChildren = false; }
            this.scale(x / this._scaleVector.x, y / this._scaleVector.y, z / this._scaleVector.z, scaleChildren);
        };
        Bone.prototype.scale = function (x, y, z, scaleChildren) {
            if (scaleChildren === void 0) { scaleChildren = false; }
            var locMat = this.getLocalMatrix();
            var origLocMat = BABYLON.Tmp.Matrix[0];
            origLocMat.copyFrom(locMat);
            var origLocMatInv = BABYLON.Tmp.Matrix[1];
            origLocMatInv.copyFrom(origLocMat);
            origLocMatInv.invert();
            var scaleMat = BABYLON.Tmp.Matrix[2];
            BABYLON.Matrix.FromValuesToRef(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1, scaleMat);
            this._scaleMatrix.multiplyToRef(scaleMat, this._scaleMatrix);
            this._scaleVector.x *= x;
            this._scaleVector.y *= y;
            this._scaleVector.z *= z;
            locMat.multiplyToRef(origLocMatInv, locMat);
            locMat.multiplyToRef(scaleMat, locMat);
            locMat.multiplyToRef(origLocMat, locMat);
            var parent = this.getParent();
            if (parent) {
                locMat.multiplyToRef(parent.getAbsoluteTransform(), this.getAbsoluteTransform());
            }
            else {
                this.getAbsoluteTransform().copyFrom(locMat);
            }
            var len = this.children.length;
            for (var i = 0; i < len; i++) {
                var parentAbsMat = this.children[i]._parent.getAbsoluteTransform();
                this.children[i].getLocalMatrix().multiplyToRef(parentAbsMat, this.children[i].getAbsoluteTransform());
            }
            scaleMat.invert();
            if (this.children[0]) {
                var child = this.children[0];
                var cm = child.getLocalMatrix();
                cm.multiplyToRef(scaleMat, cm);
                var lm = child.getLocalMatrix();
                lm.m[12] *= x;
                lm.m[13] *= y;
                lm.m[14] *= z;
            }
            if (scaleChildren) {
                for (var i = 0; i < len; i++) {
                    this.children[i].scale(x, y, z, scaleChildren);
                }
            }
            this.markAsDirty();
        };
        Bone.prototype.setYawPitchRoll = function (yaw, pitch, roll, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var rotMat = BABYLON.Tmp.Matrix[0];
            BABYLON.Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            var rotMatInv = BABYLON.Tmp.Matrix[1];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        Bone.prototype.rotate = function (axis, amount, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var rmat = BABYLON.Tmp.Matrix[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            BABYLON.Matrix.RotationAxisToRef(axis, amount, rmat);
            this._rotateWithMatrix(rmat, space, mesh);
        };
        Bone.prototype.setAxisAngle = function (axis, angle, space, mesh) {
            var rotMat = BABYLON.Tmp.Matrix[0];
            BABYLON.Matrix.RotationAxisToRef(axis, angle, rotMat);
            var rotMatInv = BABYLON.Tmp.Matrix[1];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        Bone.prototype._rotateWithMatrix = function (rmat, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = BABYLON.Tmp.Matrix[3];
            var parentScaleInv = BABYLON.Tmp.Matrix[4];
            if (parent) {
                if (space == BABYLON.Space.WORLD) {
                    if (mesh) {
                        parentScale.copyFrom(mesh.getWorldMatrix());
                        parent.getAbsoluteTransform().multiplyToRef(parentScale, parentScale);
                    }
                    else {
                        parentScale.copyFrom(parent.getAbsoluteTransform());
                    }
                }
                else {
                    parentScale = parent._scaleMatrix;
                }
                parentScaleInv.copyFrom(parentScale);
                parentScaleInv.invert();
                lmat.multiplyToRef(parentScale, lmat);
                lmat.multiplyToRef(rmat, lmat);
                lmat.multiplyToRef(parentScaleInv, lmat);
            }
            else {
                if (space == BABYLON.Space.WORLD && mesh) {
                    parentScale.copyFrom(mesh.getWorldMatrix());
                    parentScaleInv.copyFrom(parentScale);
                    parentScaleInv.invert();
                    lmat.multiplyToRef(parentScale, lmat);
                    lmat.multiplyToRef(rmat, lmat);
                    lmat.multiplyToRef(parentScaleInv, lmat);
                }
                else {
                    lmat.multiplyToRef(rmat, lmat);
                }
            }
            lmat.m[12] = lx;
            lmat.m[13] = ly;
            lmat.m[14] = lz;
            if (parent) {
                var parentAbsMat = this._parent.getAbsoluteTransform();
                lmat.multiplyToRef(parentAbsMat, this.getAbsoluteTransform());
            }
            else {
                this.getAbsoluteTransform().copyFrom(lmat);
            }
            var len = this.children.length;
            for (var i = 0; i < len; i++) {
                var parentAbsMat = this.children[i]._parent.getAbsoluteTransform();
                this.children[i].getLocalMatrix().multiplyToRef(parentAbsMat, this.children[i].getAbsoluteTransform());
            }
            this.markAsDirty();
        };
        Bone.prototype._getNegativeRotationToRef = function (rotMatInv, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            if (space == BABYLON.Space.WORLD) {
                rotMatInv.copyFrom(this.getAbsoluteTransform());
                if (mesh) {
                    rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
                }
                rotMatInv.invert();
                var scaleMatrix = BABYLON.Tmp.Matrix[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                scaleMatrix.m[0] *= -1;
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }
            else {
                rotMatInv.copyFrom(this.getLocalMatrix());
                rotMatInv.invert();
                var scaleMatrix = BABYLON.Tmp.Matrix[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                if (this._parent) {
                    var pscaleMatrix = BABYLON.Tmp.Matrix[3];
                    pscaleMatrix.copyFrom(this._parent._scaleMatrix);
                    pscaleMatrix.invert();
                    pscaleMatrix.multiplyToRef(rotMatInv, rotMatInv);
                }
                else {
                    scaleMatrix.m[0] *= -1;
                }
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }
        };
        Bone.prototype.getScale = function () {
            return this._scaleVector.clone();
        };
        Bone.prototype.getScaleToRef = function (result) {
            result.copyFrom(this._scaleVector);
        };
        Bone.prototype.getAbsolutePosition = function (mesh) {
            if (mesh === void 0) { mesh = null; }
            var pos = BABYLON.Vector3.Zero();
            this.getAbsolutePositionToRef(mesh, pos);
            return pos;
        };
        Bone.prototype.getAbsolutePositionToRef = function (mesh, result) {
            if (mesh === void 0) { mesh = null; }
            this._skeleton.computeAbsoluteTransforms();
            var tmat = BABYLON.Tmp.Matrix[0];
            if (mesh) {
                tmat.copyFrom(this.getAbsoluteTransform());
                tmat.multiplyToRef(mesh.getWorldMatrix(), tmat);
            }
            else {
                tmat = this.getAbsoluteTransform();
            }
            result.x = tmat.m[12];
            result.y = tmat.m[13];
            result.z = tmat.m[14];
        };
        Bone.prototype.computeAbsoluteTransforms = function () {
            if (this._parent) {
                this._matrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(this._matrix);
            }
            var children = this.children;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                children[i].computeAbsoluteTransforms();
            }
        };
        return Bone;
    }(BABYLON.Node));
    BABYLON.Bone = Bone;
})(BABYLON || (BABYLON = {}));
