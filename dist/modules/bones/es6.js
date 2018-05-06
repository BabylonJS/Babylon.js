var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


import * as BABYLON from 'babylonjs/core/es6';

var BABYLON;
(function (BABYLON) {
    var Bone = /** @class */ (function (_super) {
        __extends(Bone, _super);
        function Bone(name, skeleton, parentBone, localMatrix, restPose, baseMatrix, index) {
            if (parentBone === void 0) { parentBone = null; }
            if (localMatrix === void 0) { localMatrix = null; }
            if (restPose === void 0) { restPose = null; }
            if (baseMatrix === void 0) { baseMatrix = null; }
            if (index === void 0) { index = null; }
            var _this = _super.call(this, name, skeleton.getScene()) || this;
            _this.name = name;
            _this.children = new Array();
            _this.animations = new Array();
            // Set this value to map this bone to a different index in the transform matrices.
            // Set this value to -1 to exclude the bone from the transform matrices.
            _this._index = null;
            _this._worldTransform = new BABYLON.Matrix();
            _this._absoluteTransform = new BABYLON.Matrix();
            _this._invertedAbsoluteTransform = new BABYLON.Matrix();
            _this._scaleMatrix = BABYLON.Matrix.Identity();
            _this._scaleVector = BABYLON.Vector3.One();
            _this._negateScaleChildren = BABYLON.Vector3.One();
            _this._scalingDeterminant = 1;
            _this._skeleton = skeleton;
            _this._localMatrix = localMatrix ? localMatrix : BABYLON.Matrix.Identity();
            _this._restPose = restPose ? restPose : _this._localMatrix.clone();
            _this._baseMatrix = baseMatrix ? baseMatrix : _this._localMatrix.clone();
            _this._index = index;
            skeleton.bones.push(_this);
            _this.setParent(parentBone, false);
            _this._updateDifferenceMatrix();
            return _this;
        }
        Object.defineProperty(Bone.prototype, "_matrix", {
            get: function () {
                return this._localMatrix;
            },
            set: function (val) {
                if (this._localMatrix) {
                    this._localMatrix.copyFrom(val);
                }
                else {
                    this._localMatrix = val;
                }
            },
            enumerable: true,
            configurable: true
        });
        // Members
        Bone.prototype.getSkeleton = function () {
            return this._skeleton;
        };
        Bone.prototype.getParent = function () {
            return this._parent;
        };
        Bone.prototype.setParent = function (parent, updateDifferenceMatrix) {
            if (updateDifferenceMatrix === void 0) { updateDifferenceMatrix = true; }
            if (this._parent === parent) {
                return;
            }
            if (this._parent) {
                var index = this._parent.children.indexOf(this);
                if (index !== -1) {
                    this._parent.children.splice(index, 1);
                }
            }
            this._parent = parent;
            if (this._parent) {
                this._parent.children.push(this);
            }
            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
        };
        Bone.prototype.getLocalMatrix = function () {
            return this._localMatrix;
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
        Object.defineProperty(Bone.prototype, "position", {
            // Properties (matches AbstractMesh properties)
            get: function () {
                return this.getPosition();
            },
            set: function (newPosition) {
                this.setPosition(newPosition);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "rotation", {
            get: function () {
                return this.getRotation();
            },
            set: function (newRotation) {
                this.setRotation(newRotation);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "rotationQuaternion", {
            get: function () {
                return this.getRotationQuaternion();
            },
            set: function (newRotation) {
                this.setRotationQuaternion(newRotation);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Bone.prototype, "scaling", {
            get: function () {
                return this.getScale();
            },
            set: function (newScaling) {
                this.setScale(newScaling.x, newScaling.y, newScaling.z);
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        Bone.prototype.updateMatrix = function (matrix, updateDifferenceMatrix) {
            if (updateDifferenceMatrix === void 0) { updateDifferenceMatrix = true; }
            this._baseMatrix = matrix.clone();
            this._localMatrix = matrix.clone();
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
            this._scalingDeterminant = (this._absoluteTransform.determinant() < 0 ? -1 : 1);
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
            var parentRatio = parentScalingReqd && parent && sourceParent ? parent.length / sourceParent.length : 1;
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
                            // scale based on skeleton dimension ratio when root bone, and value is passed
                        }
                        else if (dimensionsScalingReqd && skelDimensionsRatio) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.multiplyInPlace(skelDimensionsRatio));
                            // use original when root bone, and no data for skelDimensionsRatio
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
        /**
         * Translate the bone in local or world space.
         * @param vec The amount to translate the bone.
         * @param space The space that the translation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.translate = function (vec, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var lm = this.getLocalMatrix();
            if (space == BABYLON.Space.LOCAL) {
                lm.m[12] += vec.x;
                lm.m[13] += vec.y;
                lm.m[14] += vec.z;
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                var tvec = Bone._tmpVecs[0];
                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    }
                    else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }
                tmat.m[12] = 0;
                tmat.m[13] = 0;
                tmat.m[14] = 0;
                tmat.invert();
                BABYLON.Vector3.TransformCoordinatesToRef(vec, tmat, tvec);
                lm.m[12] += tvec.x;
                lm.m[13] += tvec.y;
                lm.m[14] += tvec.z;
            }
            this.markAsDirty();
        };
        /**
         * Set the postion of the bone in local or world space.
         * @param position The position to set the bone.
         * @param space The space that the position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setPosition = function (position, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var lm = this.getLocalMatrix();
            if (space == BABYLON.Space.LOCAL) {
                lm.m[12] = position.x;
                lm.m[13] = position.y;
                lm.m[14] = position.z;
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                var vec = Bone._tmpVecs[0];
                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    }
                    else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }
                tmat.invert();
                BABYLON.Vector3.TransformCoordinatesToRef(position, tmat, vec);
                lm.m[12] = vec.x;
                lm.m[13] = vec.y;
                lm.m[14] = vec.z;
            }
            this.markAsDirty();
        };
        /**
         * Set the absolute postion of the bone (world space).
         * @param position The position to set the bone.
         * @param mesh The mesh that this bone is attached to.
         */
        Bone.prototype.setAbsolutePosition = function (position, mesh) {
            this.setPosition(position, BABYLON.Space.WORLD, mesh);
        };
        /**
         * Set the scale of the bone on the x, y and z axes.
         * @param x The scale of the bone on the x axis.
         * @param x The scale of the bone on the y axis.
         * @param z The scale of the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        Bone.prototype.setScale = function (x, y, z, scaleChildren) {
            if (scaleChildren === void 0) { scaleChildren = false; }
            if (this.animations[0] && !this.animations[0].hasRunningRuntimeAnimations) {
                if (!scaleChildren) {
                    this._negateScaleChildren.x = 1 / x;
                    this._negateScaleChildren.y = 1 / y;
                    this._negateScaleChildren.z = 1 / z;
                }
                this._syncScaleVector();
            }
            this.scale(x / this._scaleVector.x, y / this._scaleVector.y, z / this._scaleVector.z, scaleChildren);
        };
        /**
         * Scale the bone on the x, y and z axes.
         * @param x The amount to scale the bone on the x axis.
         * @param x The amount to scale the bone on the y axis.
         * @param z The amount to scale the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        Bone.prototype.scale = function (x, y, z, scaleChildren) {
            if (scaleChildren === void 0) { scaleChildren = false; }
            var locMat = this.getLocalMatrix();
            var origLocMat = Bone._tmpMats[0];
            origLocMat.copyFrom(locMat);
            var origLocMatInv = Bone._tmpMats[1];
            origLocMatInv.copyFrom(origLocMat);
            origLocMatInv.invert();
            var scaleMat = Bone._tmpMats[2];
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
            scaleMat.invert();
            for (var i = 0; i < len; i++) {
                var child = this.children[i];
                var cm = child.getLocalMatrix();
                cm.multiplyToRef(scaleMat, cm);
                var lm = child.getLocalMatrix();
                lm.m[12] *= x;
                lm.m[13] *= y;
                lm.m[14] *= z;
            }
            this.computeAbsoluteTransforms();
            if (scaleChildren) {
                for (var i = 0; i < len; i++) {
                    this.children[i].scale(x, y, z, scaleChildren);
                }
            }
            this.markAsDirty();
        };
        /**
         * Set the yaw, pitch, and roll of the bone in local or world space.
         * @param yaw The rotation of the bone on the y axis.
         * @param pitch The rotation of the bone on the x axis.
         * @param roll The rotation of the bone on the z axis.
         * @param space The space that the axes of rotation are in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setYawPitchRoll = function (yaw, pitch, roll, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var rotMat = Bone._tmpMats[0];
            BABYLON.Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            var rotMatInv = Bone._tmpMats[1];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Rotate the bone on an axis in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param amount The amount to rotate the bone.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.rotate = function (axis, amount, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var rmat = Bone._tmpMats[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            BABYLON.Matrix.RotationAxisToRef(axis, amount, rmat);
            this._rotateWithMatrix(rmat, space, mesh);
        };
        /**
         * Set the rotation of the bone to a particular axis angle in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param angle The angle that the bone should be rotated to.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setAxisAngle = function (axis, angle, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var rotMat = Bone._tmpMats[0];
            BABYLON.Matrix.RotationAxisToRef(axis, angle, rotMat);
            var rotMatInv = Bone._tmpMats[1];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Set the euler rotation of the bone in local of world space.
         * @param rotation The euler rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setRotation = function (rotation, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            this.setYawPitchRoll(rotation.y, rotation.x, rotation.z, space, mesh);
        };
        /**
         * Set the quaternion rotation of the bone in local of world space.
         * @param quat The quaternion rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setRotationQuaternion = function (quat, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var rotMatInv = Bone._tmpMats[0];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            var rotMat = Bone._tmpMats[1];
            BABYLON.Matrix.FromQuaternionToRef(quat, rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);
        };
        /**
         * Set the rotation matrix of the bone in local of world space.
         * @param rotMat The rotation matrix that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        Bone.prototype.setRotationMatrix = function (rotMat, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var rotMatInv = Bone._tmpMats[0];
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            var rotMat2 = Bone._tmpMats[1];
            rotMat2.copyFrom(rotMat);
            rotMatInv.multiplyToRef(rotMat, rotMat2);
            this._rotateWithMatrix(rotMat2, space, mesh);
        };
        Bone.prototype._rotateWithMatrix = function (rmat, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = Bone._tmpMats[3];
            var parentScaleInv = Bone._tmpMats[4];
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
            this.computeAbsoluteTransforms();
            this.markAsDirty();
        };
        Bone.prototype._getNegativeRotationToRef = function (rotMatInv, space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (space == BABYLON.Space.WORLD) {
                var scaleMatrix = Bone._tmpMats[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                rotMatInv.copyFrom(this.getAbsoluteTransform());
                if (mesh) {
                    rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
                    var meshScale = Bone._tmpMats[3];
                    BABYLON.Matrix.ScalingToRef(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z, meshScale);
                    scaleMatrix.multiplyToRef(meshScale, scaleMatrix);
                }
                rotMatInv.invert();
                scaleMatrix.m[0] *= this._scalingDeterminant;
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }
            else {
                rotMatInv.copyFrom(this.getLocalMatrix());
                rotMatInv.invert();
                var scaleMatrix = Bone._tmpMats[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                if (this._parent) {
                    var pscaleMatrix = Bone._tmpMats[3];
                    pscaleMatrix.copyFrom(this._parent._scaleMatrix);
                    pscaleMatrix.invert();
                    pscaleMatrix.multiplyToRef(rotMatInv, rotMatInv);
                }
                else {
                    scaleMatrix.m[0] *= this._scalingDeterminant;
                }
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }
        };
        /**
         * Get the scale of the bone
         * @returns the scale of the bone
         */
        Bone.prototype.getScale = function () {
            return this._scaleVector.clone();
        };
        /**
         * Copy the scale of the bone to a vector3.
         * @param result The vector3 to copy the scale to
         */
        Bone.prototype.getScaleToRef = function (result) {
            result.copyFrom(this._scaleVector);
        };
        /**
         * Get the position of the bone in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The position of the bone
         */
        Bone.prototype.getPosition = function (space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var pos = BABYLON.Vector3.Zero();
            this.getPositionToRef(space, mesh, pos);
            return pos;
        };
        /**
         * Copy the position of the bone to a vector3 in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 to copy the position to.
         */
        Bone.prototype.getPositionToRef = function (space, mesh, result) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (space == BABYLON.Space.LOCAL) {
                var lm = this.getLocalMatrix();
                result.x = lm.m[12];
                result.y = lm.m[13];
                result.z = lm.m[14];
            }
            else {
                var wm = null;
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh) {
                    wm = mesh.getWorldMatrix();
                }
                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                if (mesh && wm) {
                    tmat.copyFrom(this.getAbsoluteTransform());
                    tmat.multiplyToRef(wm, tmat);
                }
                else {
                    tmat = this.getAbsoluteTransform();
                }
                result.x = tmat.m[12];
                result.y = tmat.m[13];
                result.z = tmat.m[14];
            }
        };
        /**
         * Get the absolute position of the bone (world space).
         * @param mesh The mesh that this bone is attached to.
         * @returns The absolute position of the bone
         */
        Bone.prototype.getAbsolutePosition = function (mesh) {
            if (mesh === void 0) { mesh = null; }
            var pos = BABYLON.Vector3.Zero();
            this.getPositionToRef(BABYLON.Space.WORLD, mesh, pos);
            return pos;
        };
        /**
         * Copy the absolute position of the bone (world space) to the result param.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 to copy the absolute position to.
         */
        Bone.prototype.getAbsolutePositionToRef = function (mesh, result) {
            this.getPositionToRef(BABYLON.Space.WORLD, mesh, result);
        };
        /**
         * Compute the absolute transforms of this bone and its children.
         */
        Bone.prototype.computeAbsoluteTransforms = function () {
            if (this._parent) {
                this._localMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(this._localMatrix);
                var poseMatrix = this._skeleton.getPoseMatrix();
                if (poseMatrix) {
                    this._absoluteTransform.multiplyToRef(poseMatrix, this._absoluteTransform);
                }
            }
            var children = this.children;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                children[i].computeAbsoluteTransforms();
            }
        };
        Bone.prototype._syncScaleVector = function () {
            var lm = this.getLocalMatrix();
            var xsq = (lm.m[0] * lm.m[0] + lm.m[1] * lm.m[1] + lm.m[2] * lm.m[2]);
            var ysq = (lm.m[4] * lm.m[4] + lm.m[5] * lm.m[5] + lm.m[6] * lm.m[6]);
            var zsq = (lm.m[8] * lm.m[8] + lm.m[9] * lm.m[9] + lm.m[10] * lm.m[10]);
            var xs = lm.m[0] * lm.m[1] * lm.m[2] * lm.m[3] < 0 ? -1 : 1;
            var ys = lm.m[4] * lm.m[5] * lm.m[6] * lm.m[7] < 0 ? -1 : 1;
            var zs = lm.m[8] * lm.m[9] * lm.m[10] * lm.m[11] < 0 ? -1 : 1;
            this._scaleVector.x = xs * Math.sqrt(xsq);
            this._scaleVector.y = ys * Math.sqrt(ysq);
            this._scaleVector.z = zs * Math.sqrt(zsq);
            if (this._parent) {
                this._scaleVector.x /= this._parent._negateScaleChildren.x;
                this._scaleVector.y /= this._parent._negateScaleChildren.y;
                this._scaleVector.z /= this._parent._negateScaleChildren.z;
            }
            BABYLON.Matrix.FromValuesToRef(this._scaleVector.x, 0, 0, 0, 0, this._scaleVector.y, 0, 0, 0, 0, this._scaleVector.z, 0, 0, 0, 0, 1, this._scaleMatrix);
        };
        /**
         * Get the world direction from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @returns The world direction
         */
        Bone.prototype.getDirection = function (localAxis, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = BABYLON.Vector3.Zero();
            this.getDirectionToRef(localAxis, mesh, result);
            return result;
        };
        /**
         * Copy the world direction to a vector3 from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world direction will be copied to.
         */
        Bone.prototype.getDirectionToRef = function (localAxis, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var mat = Bone._tmpMats[0];
            mat.copyFrom(this.getAbsoluteTransform());
            if (mesh && wm) {
                mat.multiplyToRef(wm, mat);
            }
            BABYLON.Vector3.TransformNormalToRef(localAxis, mat, result);
            result.normalize();
        };
        /**
         * Get the euler rotation of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The euler rotation
         */
        Bone.prototype.getRotation = function (space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var result = BABYLON.Vector3.Zero();
            this.getRotationToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 that the rotation should be copied to.
         */
        Bone.prototype.getRotationToRef = function (space, mesh, result) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var quat = Bone._tmpQuat;
            this.getRotationQuaternionToRef(space, mesh, quat);
            quat.toEulerAnglesToRef(result);
        };
        /**
         * Get the quaternion rotation of the bone in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The quaternion rotation
         */
        Bone.prototype.getRotationQuaternion = function (space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            var result = BABYLON.Quaternion.Identity();
            this.getRotationQuaternionToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        Bone.prototype.getRotationQuaternionToRef = function (space, mesh, result) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (mesh === void 0) { mesh = null; }
            if (space == BABYLON.Space.LOCAL) {
                this.getLocalMatrix().decompose(Bone._tmpVecs[0], result, Bone._tmpVecs[1]);
            }
            else {
                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();
                if (mesh) {
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }
                else {
                    mat.copyFrom(amat);
                }
                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;
                mat.decompose(Bone._tmpVecs[0], result, Bone._tmpVecs[1]);
            }
        };
        /**
         * Get the rotation matrix of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The rotation matrix
         */
        Bone.prototype.getRotationMatrix = function (space, mesh) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            var result = BABYLON.Matrix.Identity();
            this.getRotationMatrixToRef(space, mesh, result);
            return result;
        };
        /**
         * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        Bone.prototype.getRotationMatrixToRef = function (space, mesh, result) {
            if (space === void 0) { space = BABYLON.Space.LOCAL; }
            if (space == BABYLON.Space.LOCAL) {
                this.getLocalMatrix().getRotationMatrixToRef(result);
            }
            else {
                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();
                if (mesh) {
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }
                else {
                    mat.copyFrom(amat);
                }
                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;
                mat.getRotationMatrixToRef(result);
            }
        };
        /**
         * Get the world position of a point that is in the local space of the bone.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @returns The world position
         */
        Bone.prototype.getAbsolutePositionFromLocal = function (position, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = BABYLON.Vector3.Zero();
            this.getAbsolutePositionFromLocalToRef(position, mesh, result);
            return result;
        };
        /**
         * Get the world position of a point that is in the local space of the bone and copy it to the result param.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world position should be copied to.
         */
        Bone.prototype.getAbsolutePositionFromLocalToRef = function (position, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var tmat = Bone._tmpMats[0];
            if (mesh && wm) {
                tmat.copyFrom(this.getAbsoluteTransform());
                tmat.multiplyToRef(wm, tmat);
            }
            else {
                tmat = this.getAbsoluteTransform();
            }
            BABYLON.Vector3.TransformCoordinatesToRef(position, tmat, result);
        };
        /**
         * Get the local position of a point that is in world space.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @returns The local position
         */
        Bone.prototype.getLocalPositionFromAbsolute = function (position, mesh) {
            if (mesh === void 0) { mesh = null; }
            var result = BABYLON.Vector3.Zero();
            this.getLocalPositionFromAbsoluteToRef(position, mesh, result);
            return result;
        };
        /**
         * Get the local position of a point that is in world space and copy it to the result param.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the local position should be copied to.
         */
        Bone.prototype.getLocalPositionFromAbsoluteToRef = function (position, mesh, result) {
            if (mesh === void 0) { mesh = null; }
            var wm = null;
            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if (mesh) {
                wm = mesh.getWorldMatrix();
            }
            this._skeleton.computeAbsoluteTransforms();
            var tmat = Bone._tmpMats[0];
            tmat.copyFrom(this.getAbsoluteTransform());
            if (mesh && wm) {
                tmat.multiplyToRef(wm, tmat);
            }
            tmat.invert();
            BABYLON.Vector3.TransformCoordinatesToRef(position, tmat, result);
        };
        Bone._tmpVecs = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
        Bone._tmpQuat = BABYLON.Quaternion.Identity();
        Bone._tmpMats = [BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity()];
        return Bone;
    }(BABYLON.Node));
    BABYLON.Bone = Bone;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.bone.js.map

var BABYLON;
(function (BABYLON) {
    var BoneIKController = /** @class */ (function () {
        function BoneIKController(mesh, bone, options) {
            this.targetPosition = BABYLON.Vector3.Zero();
            this.poleTargetPosition = BABYLON.Vector3.Zero();
            this.poleTargetLocalOffset = BABYLON.Vector3.Zero();
            this.poleAngle = 0;
            this.slerpAmount = 1;
            this._bone1Quat = BABYLON.Quaternion.Identity();
            this._bone1Mat = BABYLON.Matrix.Identity();
            this._bone2Ang = Math.PI;
            this._maxAngle = Math.PI;
            this._rightHandedSystem = false;
            this._bendAxis = BABYLON.Vector3.Right();
            this._slerping = false;
            this._adjustRoll = 0;
            this._bone2 = bone;
            this._bone1 = bone.getParent();
            if (!this._bone1) {
                return;
            }
            this.mesh = mesh;
            var bonePos = bone.getPosition();
            if (bone.getAbsoluteTransform().determinant() > 0) {
                this._rightHandedSystem = true;
                this._bendAxis.x = 0;
                this._bendAxis.y = 0;
                this._bendAxis.z = -1;
                if (bonePos.x > bonePos.y && bonePos.x > bonePos.z) {
                    this._adjustRoll = Math.PI * .5;
                    this._bendAxis.z = 1;
                }
            }
            if (this._bone1.length) {
                var boneScale1 = this._bone1.getScale();
                var boneScale2 = this._bone2.getScale();
                this._bone1Length = this._bone1.length * boneScale1.y * this.mesh.scaling.y;
                this._bone2Length = this._bone2.length * boneScale2.y * this.mesh.scaling.y;
            }
            else if (this._bone1.children[0]) {
                mesh.computeWorldMatrix(true);
                var pos1 = this._bone2.children[0].getAbsolutePosition(mesh);
                var pos2 = this._bone2.getAbsolutePosition(mesh);
                var pos3 = this._bone1.getAbsolutePosition(mesh);
                this._bone1Length = BABYLON.Vector3.Distance(pos1, pos2);
                this._bone2Length = BABYLON.Vector3.Distance(pos2, pos3);
            }
            this._bone1.getRotationMatrixToRef(BABYLON.Space.WORLD, mesh, this._bone1Mat);
            this.maxAngle = Math.PI;
            if (options) {
                if (options.targetMesh) {
                    this.targetMesh = options.targetMesh;
                    this.targetMesh.computeWorldMatrix(true);
                }
                if (options.poleTargetMesh) {
                    this.poleTargetMesh = options.poleTargetMesh;
                    this.poleTargetMesh.computeWorldMatrix(true);
                }
                else if (options.poleTargetBone) {
                    this.poleTargetBone = options.poleTargetBone;
                }
                else if (this._bone1.getParent()) {
                    this.poleTargetBone = this._bone1.getParent();
                }
                if (options.poleTargetLocalOffset) {
                    this.poleTargetLocalOffset.copyFrom(options.poleTargetLocalOffset);
                }
                if (options.poleAngle) {
                    this.poleAngle = options.poleAngle;
                }
                if (options.bendAxis) {
                    this._bendAxis.copyFrom(options.bendAxis);
                }
                if (options.maxAngle) {
                    this.maxAngle = options.maxAngle;
                }
                if (options.slerpAmount) {
                    this.slerpAmount = options.slerpAmount;
                }
            }
        }
        Object.defineProperty(BoneIKController.prototype, "maxAngle", {
            get: function () {
                return this._maxAngle;
            },
            set: function (value) {
                this._setMaxAngle(value);
            },
            enumerable: true,
            configurable: true
        });
        BoneIKController.prototype._setMaxAngle = function (ang) {
            if (ang < 0) {
                ang = 0;
            }
            if (ang > Math.PI || ang == undefined) {
                ang = Math.PI;
            }
            this._maxAngle = ang;
            var a = this._bone1Length;
            var b = this._bone2Length;
            this._maxReach = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(ang));
        };
        BoneIKController.prototype.update = function () {
            var bone1 = this._bone1;
            if (!bone1) {
                return;
            }
            var target = this.targetPosition;
            var poleTarget = this.poleTargetPosition;
            var mat1 = BoneIKController._tmpMats[0];
            var mat2 = BoneIKController._tmpMats[1];
            if (this.targetMesh) {
                target.copyFrom(this.targetMesh.getAbsolutePosition());
            }
            if (this.poleTargetBone) {
                this.poleTargetBone.getAbsolutePositionFromLocalToRef(this.poleTargetLocalOffset, this.mesh, poleTarget);
            }
            else if (this.poleTargetMesh) {
                BABYLON.Vector3.TransformCoordinatesToRef(this.poleTargetLocalOffset, this.poleTargetMesh.getWorldMatrix(), poleTarget);
            }
            var bonePos = BoneIKController._tmpVecs[0];
            var zaxis = BoneIKController._tmpVecs[1];
            var xaxis = BoneIKController._tmpVecs[2];
            var yaxis = BoneIKController._tmpVecs[3];
            var upAxis = BoneIKController._tmpVecs[4];
            var _tmpQuat = BoneIKController._tmpQuat;
            bone1.getAbsolutePositionToRef(this.mesh, bonePos);
            poleTarget.subtractToRef(bonePos, upAxis);
            if (upAxis.x == 0 && upAxis.y == 0 && upAxis.z == 0) {
                upAxis.y = 1;
            }
            else {
                upAxis.normalize();
            }
            target.subtractToRef(bonePos, yaxis);
            yaxis.normalize();
            BABYLON.Vector3.CrossToRef(yaxis, upAxis, zaxis);
            zaxis.normalize();
            BABYLON.Vector3.CrossToRef(yaxis, zaxis, xaxis);
            xaxis.normalize();
            BABYLON.Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, mat1);
            var a = this._bone1Length;
            var b = this._bone2Length;
            var c = BABYLON.Vector3.Distance(bonePos, target);
            if (this._maxReach > 0) {
                c = Math.min(this._maxReach, c);
            }
            var acosa = (b * b + c * c - a * a) / (2 * b * c);
            var acosb = (c * c + a * a - b * b) / (2 * c * a);
            if (acosa > 1) {
                acosa = 1;
            }
            if (acosb > 1) {
                acosb = 1;
            }
            if (acosa < -1) {
                acosa = -1;
            }
            if (acosb < -1) {
                acosb = -1;
            }
            var angA = Math.acos(acosa);
            var angB = Math.acos(acosb);
            var angC = -angA - angB;
            if (this._rightHandedSystem) {
                BABYLON.Matrix.RotationYawPitchRollToRef(0, 0, this._adjustRoll, mat2);
                mat2.multiplyToRef(mat1, mat1);
                BABYLON.Matrix.RotationAxisToRef(this._bendAxis, angB, mat2);
                mat2.multiplyToRef(mat1, mat1);
            }
            else {
                var _tmpVec = BoneIKController._tmpVecs[5];
                _tmpVec.copyFrom(this._bendAxis);
                _tmpVec.x *= -1;
                BABYLON.Matrix.RotationAxisToRef(_tmpVec, -angB, mat2);
                mat2.multiplyToRef(mat1, mat1);
            }
            if (this.poleAngle) {
                BABYLON.Matrix.RotationAxisToRef(yaxis, this.poleAngle, mat2);
                mat1.multiplyToRef(mat2, mat1);
            }
            if (this._bone1) {
                if (this.slerpAmount < 1) {
                    if (!this._slerping) {
                        BABYLON.Quaternion.FromRotationMatrixToRef(this._bone1Mat, this._bone1Quat);
                    }
                    BABYLON.Quaternion.FromRotationMatrixToRef(mat1, _tmpQuat);
                    BABYLON.Quaternion.SlerpToRef(this._bone1Quat, _tmpQuat, this.slerpAmount, this._bone1Quat);
                    angC = this._bone2Ang * (1.0 - this.slerpAmount) + angC * this.slerpAmount;
                    this._bone1.setRotationQuaternion(this._bone1Quat, BABYLON.Space.WORLD, this.mesh);
                    this._slerping = true;
                }
                else {
                    this._bone1.setRotationMatrix(mat1, BABYLON.Space.WORLD, this.mesh);
                    this._bone1Mat.copyFrom(mat1);
                    this._slerping = false;
                }
            }
            this._bone2.setAxisAngle(this._bendAxis, angC, BABYLON.Space.LOCAL);
            this._bone2Ang = angC;
        };
        BoneIKController._tmpVecs = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
        BoneIKController._tmpQuat = BABYLON.Quaternion.Identity();
        BoneIKController._tmpMats = [BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity()];
        return BoneIKController;
    }());
    BABYLON.BoneIKController = BoneIKController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.boneIKController.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var BoneLookController = /** @class */ (function () {
        /**
         * Create a BoneLookController
         * @param mesh the mesh that the bone belongs to
         * @param bone the bone that will be looking to the target
         * @param target the target Vector3 to look at
         * @param settings optional settings:
         * - maxYaw: the maximum angle the bone will yaw to
         * - minYaw: the minimum angle the bone will yaw to
         * - maxPitch: the maximum angle the bone will pitch to
         * - minPitch: the minimum angle the bone will yaw to
         * - slerpAmount: set the between 0 and 1 to make the bone slerp to the target.
         * - upAxis: the up axis of the coordinate system
         * - upAxisSpace: the space that the up axis is in - BABYLON.Space.BONE, BABYLON.Space.LOCAL (default), or BABYLON.Space.WORLD.
         * - yawAxis: set yawAxis if the bone does not yaw on the y axis
         * - pitchAxis: set pitchAxis if the bone does not pitch on the x axis
         * - adjustYaw: used to make an adjustment to the yaw of the bone
         * - adjustPitch: used to make an adjustment to the pitch of the bone
         * - adjustRoll: used to make an adjustment to the roll of the bone
         **/
        function BoneLookController(mesh, bone, target, options) {
            /**
             * The up axis of the coordinate system that is used when the bone is rotated.
             */
            this.upAxis = BABYLON.Vector3.Up();
            /**
             * The space that the up axis is in - BABYLON.Space.BONE, BABYLON.Space.LOCAL (default), or BABYLON.Space.WORLD.
             */
            this.upAxisSpace = BABYLON.Space.LOCAL;
            /**
             * Used to make an adjustment to the yaw of the bone.
             */
            this.adjustYaw = 0;
            /**
             * Used to make an adjustment to the pitch of the bone.
             */
            this.adjustPitch = 0;
            /**
             * Used to make an adjustment to the roll of the bone.
             */
            this.adjustRoll = 0;
            /**
             * The amount to slerp (spherical linear interpolation) to the target.  Set this to a value between 0 and 1 (a value of 1 disables slerp).
             */
            this.slerpAmount = 1;
            this._boneQuat = BABYLON.Quaternion.Identity();
            this._slerping = false;
            this._firstFrameSkipped = false;
            this._fowardAxis = BABYLON.Vector3.Forward();
            this.mesh = mesh;
            this.bone = bone;
            this.target = target;
            if (options) {
                if (options.adjustYaw) {
                    this.adjustYaw = options.adjustYaw;
                }
                if (options.adjustPitch) {
                    this.adjustPitch = options.adjustPitch;
                }
                if (options.adjustRoll) {
                    this.adjustRoll = options.adjustRoll;
                }
                if (options.maxYaw != null) {
                    this.maxYaw = options.maxYaw;
                }
                else {
                    this.maxYaw = Math.PI;
                }
                if (options.minYaw != null) {
                    this.minYaw = options.minYaw;
                }
                else {
                    this.minYaw = -Math.PI;
                }
                if (options.maxPitch != null) {
                    this.maxPitch = options.maxPitch;
                }
                else {
                    this.maxPitch = Math.PI;
                }
                if (options.minPitch != null) {
                    this.minPitch = options.minPitch;
                }
                else {
                    this.minPitch = -Math.PI;
                }
                if (options.slerpAmount != null) {
                    this.slerpAmount = options.slerpAmount;
                }
                if (options.upAxis != null) {
                    this.upAxis = options.upAxis;
                }
                if (options.upAxisSpace != null) {
                    this.upAxisSpace = options.upAxisSpace;
                }
                if (options.yawAxis != null || options.pitchAxis != null) {
                    var newYawAxis = BABYLON.Axis.Y;
                    var newPitchAxis = BABYLON.Axis.X;
                    if (options.yawAxis != null) {
                        newYawAxis = options.yawAxis.clone();
                        newYawAxis.normalize();
                    }
                    if (options.pitchAxis != null) {
                        newPitchAxis = options.pitchAxis.clone();
                        newPitchAxis.normalize();
                    }
                    var newRollAxis = BABYLON.Vector3.Cross(newPitchAxis, newYawAxis);
                    this._transformYawPitch = BABYLON.Matrix.Identity();
                    BABYLON.Matrix.FromXYZAxesToRef(newPitchAxis, newYawAxis, newRollAxis, this._transformYawPitch);
                    this._transformYawPitchInv = this._transformYawPitch.clone();
                    this._transformYawPitch.invert();
                }
            }
            if (!bone.getParent() && this.upAxisSpace == BABYLON.Space.BONE) {
                this.upAxisSpace = BABYLON.Space.LOCAL;
            }
        }
        Object.defineProperty(BoneLookController.prototype, "minYaw", {
            /**
             * Get/set the minimum yaw angle that the bone can look to.
             */
            get: function () {
                return this._minYaw;
            },
            set: function (value) {
                this._minYaw = value;
                this._minYawSin = Math.sin(value);
                this._minYawCos = Math.cos(value);
                if (this._maxYaw != null) {
                    this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * .5 + this._minYaw;
                    this._yawRange = this._maxYaw - this._minYaw;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoneLookController.prototype, "maxYaw", {
            /**
             * Get/set the maximum yaw angle that the bone can look to.
             */
            get: function () {
                return this._maxYaw;
            },
            set: function (value) {
                this._maxYaw = value;
                this._maxYawSin = Math.sin(value);
                this._maxYawCos = Math.cos(value);
                if (this._minYaw != null) {
                    this._midYawConstraint = this._getAngleDiff(this._minYaw, this._maxYaw) * .5 + this._minYaw;
                    this._yawRange = this._maxYaw - this._minYaw;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoneLookController.prototype, "minPitch", {
            /**
             * Get/set the minimum pitch angle that the bone can look to.
             */
            get: function () {
                return this._minPitch;
            },
            set: function (value) {
                this._minPitch = value;
                this._minPitchTan = Math.tan(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoneLookController.prototype, "maxPitch", {
            /**
             * Get/set the maximum pitch angle that the bone can look to.
             */
            get: function () {
                return this._maxPitch;
            },
            set: function (value) {
                this._maxPitch = value;
                this._maxPitchTan = Math.tan(value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Update the bone to look at the target.  This should be called before the scene is rendered (use scene.registerBeforeRender()).
         */
        BoneLookController.prototype.update = function () {
            //skip the first frame when slerping so that the mesh rotation is correct
            if (this.slerpAmount < 1 && !this._firstFrameSkipped) {
                this._firstFrameSkipped = true;
                return;
            }
            var bone = this.bone;
            var bonePos = BoneLookController._tmpVecs[0];
            bone.getAbsolutePositionToRef(this.mesh, bonePos);
            var target = this.target;
            var _tmpMat1 = BoneLookController._tmpMats[0];
            var _tmpMat2 = BoneLookController._tmpMats[1];
            var mesh = this.mesh;
            var parentBone = bone.getParent();
            var upAxis = BoneLookController._tmpVecs[1];
            upAxis.copyFrom(this.upAxis);
            if (this.upAxisSpace == BABYLON.Space.BONE && parentBone) {
                if (this._transformYawPitch) {
                    BABYLON.Vector3.TransformCoordinatesToRef(upAxis, this._transformYawPitchInv, upAxis);
                }
                parentBone.getDirectionToRef(upAxis, this.mesh, upAxis);
            }
            else if (this.upAxisSpace == BABYLON.Space.LOCAL) {
                mesh.getDirectionToRef(upAxis, upAxis);
                if (mesh.scaling.x != 1 || mesh.scaling.y != 1 || mesh.scaling.z != 1) {
                    upAxis.normalize();
                }
            }
            var checkYaw = false;
            var checkPitch = false;
            if (this._maxYaw != Math.PI || this._minYaw != -Math.PI) {
                checkYaw = true;
            }
            if (this._maxPitch != Math.PI || this._minPitch != -Math.PI) {
                checkPitch = true;
            }
            if (checkYaw || checkPitch) {
                var spaceMat = BoneLookController._tmpMats[2];
                var spaceMatInv = BoneLookController._tmpMats[3];
                if (this.upAxisSpace == BABYLON.Space.BONE && upAxis.y == 1 && parentBone) {
                    parentBone.getRotationMatrixToRef(BABYLON.Space.WORLD, this.mesh, spaceMat);
                }
                else if (this.upAxisSpace == BABYLON.Space.LOCAL && upAxis.y == 1 && !parentBone) {
                    spaceMat.copyFrom(mesh.getWorldMatrix());
                }
                else {
                    var forwardAxis = BoneLookController._tmpVecs[2];
                    forwardAxis.copyFrom(this._fowardAxis);
                    if (this._transformYawPitch) {
                        BABYLON.Vector3.TransformCoordinatesToRef(forwardAxis, this._transformYawPitchInv, forwardAxis);
                    }
                    if (parentBone) {
                        parentBone.getDirectionToRef(forwardAxis, this.mesh, forwardAxis);
                    }
                    else {
                        mesh.getDirectionToRef(forwardAxis, forwardAxis);
                    }
                    var rightAxis = BABYLON.Vector3.Cross(upAxis, forwardAxis);
                    rightAxis.normalize();
                    var forwardAxis = BABYLON.Vector3.Cross(rightAxis, upAxis);
                    BABYLON.Matrix.FromXYZAxesToRef(rightAxis, upAxis, forwardAxis, spaceMat);
                }
                spaceMat.invertToRef(spaceMatInv);
                var xzlen = null;
                if (checkPitch) {
                    var localTarget = BoneLookController._tmpVecs[3];
                    target.subtractToRef(bonePos, localTarget);
                    BABYLON.Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);
                    xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                    var pitch = Math.atan2(localTarget.y, xzlen);
                    var newPitch = pitch;
                    if (pitch > this._maxPitch) {
                        localTarget.y = this._maxPitchTan * xzlen;
                        newPitch = this._maxPitch;
                    }
                    else if (pitch < this._minPitch) {
                        localTarget.y = this._minPitchTan * xzlen;
                        newPitch = this._minPitch;
                    }
                    if (pitch != newPitch) {
                        BABYLON.Vector3.TransformCoordinatesToRef(localTarget, spaceMat, localTarget);
                        localTarget.addInPlace(bonePos);
                        target = localTarget;
                    }
                }
                if (checkYaw) {
                    var localTarget = BoneLookController._tmpVecs[4];
                    target.subtractToRef(bonePos, localTarget);
                    BABYLON.Vector3.TransformCoordinatesToRef(localTarget, spaceMatInv, localTarget);
                    var yaw = Math.atan2(localTarget.x, localTarget.z);
                    var newYaw = yaw;
                    if (yaw > this._maxYaw || yaw < this._minYaw) {
                        if (xzlen == null) {
                            xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                        }
                        if (this._yawRange > Math.PI) {
                            if (this._isAngleBetween(yaw, this._maxYaw, this._midYawConstraint)) {
                                localTarget.z = this._maxYawCos * xzlen;
                                localTarget.x = this._maxYawSin * xzlen;
                                newYaw = this._maxYaw;
                            }
                            else if (this._isAngleBetween(yaw, this._midYawConstraint, this._minYaw)) {
                                localTarget.z = this._minYawCos * xzlen;
                                localTarget.x = this._minYawSin * xzlen;
                                newYaw = this._minYaw;
                            }
                        }
                        else {
                            if (yaw > this._maxYaw) {
                                localTarget.z = this._maxYawCos * xzlen;
                                localTarget.x = this._maxYawSin * xzlen;
                                newYaw = this._maxYaw;
                            }
                            else if (yaw < this._minYaw) {
                                localTarget.z = this._minYawCos * xzlen;
                                localTarget.x = this._minYawSin * xzlen;
                                newYaw = this._minYaw;
                            }
                        }
                    }
                    if (this._slerping && this._yawRange > Math.PI) {
                        //are we going to be crossing into the min/max region?
                        var boneFwd = BoneLookController._tmpVecs[8];
                        boneFwd.copyFrom(BABYLON.Axis.Z);
                        if (this._transformYawPitch) {
                            BABYLON.Vector3.TransformCoordinatesToRef(boneFwd, this._transformYawPitchInv, boneFwd);
                        }
                        var boneRotMat = BoneLookController._tmpMats[4];
                        this._boneQuat.toRotationMatrix(boneRotMat);
                        this.mesh.getWorldMatrix().multiplyToRef(boneRotMat, boneRotMat);
                        BABYLON.Vector3.TransformCoordinatesToRef(boneFwd, boneRotMat, boneFwd);
                        BABYLON.Vector3.TransformCoordinatesToRef(boneFwd, spaceMatInv, boneFwd);
                        var boneYaw = Math.atan2(boneFwd.x, boneFwd.z);
                        var angBtwTar = this._getAngleBetween(boneYaw, yaw);
                        var angBtwMidYaw = this._getAngleBetween(boneYaw, this._midYawConstraint);
                        if (angBtwTar > angBtwMidYaw) {
                            if (xzlen == null) {
                                xzlen = Math.sqrt(localTarget.x * localTarget.x + localTarget.z * localTarget.z);
                            }
                            var angBtwMax = this._getAngleBetween(boneYaw, this._maxYaw);
                            var angBtwMin = this._getAngleBetween(boneYaw, this._minYaw);
                            if (angBtwMin < angBtwMax) {
                                newYaw = boneYaw + Math.PI * .75;
                                localTarget.z = Math.cos(newYaw) * xzlen;
                                localTarget.x = Math.sin(newYaw) * xzlen;
                            }
                            else {
                                newYaw = boneYaw - Math.PI * .75;
                                localTarget.z = Math.cos(newYaw) * xzlen;
                                localTarget.x = Math.sin(newYaw) * xzlen;
                            }
                        }
                    }
                    if (yaw != newYaw) {
                        BABYLON.Vector3.TransformCoordinatesToRef(localTarget, spaceMat, localTarget);
                        localTarget.addInPlace(bonePos);
                        target = localTarget;
                    }
                }
            }
            var zaxis = BoneLookController._tmpVecs[5];
            var xaxis = BoneLookController._tmpVecs[6];
            var yaxis = BoneLookController._tmpVecs[7];
            var _tmpQuat = BoneLookController._tmpQuat;
            target.subtractToRef(bonePos, zaxis);
            zaxis.normalize();
            BABYLON.Vector3.CrossToRef(upAxis, zaxis, xaxis);
            xaxis.normalize();
            BABYLON.Vector3.CrossToRef(zaxis, xaxis, yaxis);
            yaxis.normalize();
            BABYLON.Matrix.FromXYZAxesToRef(xaxis, yaxis, zaxis, _tmpMat1);
            if (xaxis.x === 0 && xaxis.y === 0 && xaxis.z === 0) {
                return;
            }
            if (yaxis.x === 0 && yaxis.y === 0 && yaxis.z === 0) {
                return;
            }
            if (zaxis.x === 0 && zaxis.y === 0 && zaxis.z === 0) {
                return;
            }
            if (this.adjustYaw || this.adjustPitch || this.adjustRoll) {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.adjustYaw, this.adjustPitch, this.adjustRoll, _tmpMat2);
                _tmpMat2.multiplyToRef(_tmpMat1, _tmpMat1);
            }
            if (this.slerpAmount < 1) {
                if (!this._slerping) {
                    this.bone.getRotationQuaternionToRef(BABYLON.Space.WORLD, this.mesh, this._boneQuat);
                }
                if (this._transformYawPitch) {
                    this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
                }
                BABYLON.Quaternion.FromRotationMatrixToRef(_tmpMat1, _tmpQuat);
                BABYLON.Quaternion.SlerpToRef(this._boneQuat, _tmpQuat, this.slerpAmount, this._boneQuat);
                this.bone.setRotationQuaternion(this._boneQuat, BABYLON.Space.WORLD, this.mesh);
                this._slerping = true;
            }
            else {
                if (this._transformYawPitch) {
                    this._transformYawPitch.multiplyToRef(_tmpMat1, _tmpMat1);
                }
                this.bone.setRotationMatrix(_tmpMat1, BABYLON.Space.WORLD, this.mesh);
                this._slerping = false;
            }
        };
        BoneLookController.prototype._getAngleDiff = function (ang1, ang2) {
            var angDiff = ang2 - ang1;
            angDiff %= Math.PI * 2;
            if (angDiff > Math.PI) {
                angDiff -= Math.PI * 2;
            }
            else if (angDiff < -Math.PI) {
                angDiff += Math.PI * 2;
            }
            return angDiff;
        };
        BoneLookController.prototype._getAngleBetween = function (ang1, ang2) {
            ang1 %= (2 * Math.PI);
            ang1 = (ang1 < 0) ? ang1 + (2 * Math.PI) : ang1;
            ang2 %= (2 * Math.PI);
            ang2 = (ang2 < 0) ? ang2 + (2 * Math.PI) : ang2;
            var ab = 0;
            if (ang1 < ang2) {
                ab = ang2 - ang1;
            }
            else {
                ab = ang1 - ang2;
            }
            if (ab > Math.PI) {
                ab = Math.PI * 2 - ab;
            }
            return ab;
        };
        BoneLookController.prototype._isAngleBetween = function (ang, ang1, ang2) {
            ang %= (2 * Math.PI);
            ang = (ang < 0) ? ang + (2 * Math.PI) : ang;
            ang1 %= (2 * Math.PI);
            ang1 = (ang1 < 0) ? ang1 + (2 * Math.PI) : ang1;
            ang2 %= (2 * Math.PI);
            ang2 = (ang2 < 0) ? ang2 + (2 * Math.PI) : ang2;
            if (ang1 < ang2) {
                if (ang > ang1 && ang < ang2) {
                    return true;
                }
            }
            else {
                if (ang > ang2 && ang < ang1) {
                    return true;
                }
            }
            return false;
        };
        BoneLookController._tmpVecs = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
        BoneLookController._tmpQuat = BABYLON.Quaternion.Identity();
        BoneLookController._tmpMats = [BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity(), BABYLON.Matrix.Identity()];
        return BoneLookController;
    }());
    BABYLON.BoneLookController = BoneLookController;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.boneLookController.js.map

var BABYLON;
(function (BABYLON) {
    var Skeleton = /** @class */ (function () {
        function Skeleton(name, id, scene) {
            this.name = name;
            this.id = id;
            this.bones = new Array();
            this.needInitialSkinMatrix = false;
            this._isDirty = true;
            this._meshesWithPoseMatrix = new Array();
            this._identity = BABYLON.Matrix.Identity();
            this._ranges = {};
            this._lastAbsoluteTransformsUpdateId = -1;
            // Events
            /**
             * An event triggered before computing the skeleton's matrices
             * @type {BABYLON.Observable}
             */
            this.onBeforeComputeObservable = new BABYLON.Observable();
            this.bones = [];
            this._scene = scene || BABYLON.Engine.LastCreatedScene;
            scene.skeletons.push(this);
            //make sure it will recalculate the matrix next time prepare is called.
            this._isDirty = true;
        }
        // Members
        Skeleton.prototype.getTransformMatrices = function (mesh) {
            if (this.needInitialSkinMatrix && mesh._bonesTransformMatrices) {
                return mesh._bonesTransformMatrices;
            }
            if (!this._transformMatrices) {
                this.prepare();
            }
            return this._transformMatrices;
        };
        Skeleton.prototype.getScene = function () {
            return this._scene;
        };
        // Methods
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        Skeleton.prototype.toString = function (fullDetails) {
            var ret = "Name: " + this.name + ", nBones: " + this.bones.length;
            ret += ", nAnimationRanges: " + (this._ranges ? Object.keys(this._ranges).length : "none");
            if (fullDetails) {
                ret += ", Ranges: {";
                var first = true;
                for (var name_1 in this._ranges) {
                    if (first) {
                        ret += ", ";
                        first = false;
                    }
                    ret += name_1;
                }
                ret += "}";
            }
            return ret;
        };
        /**
        * Get bone's index searching by name
        * @param {string} name is bone's name to search for
        * @return {number} Indice of the bone. Returns -1 if not found
        */
        Skeleton.prototype.getBoneIndexByName = function (name) {
            for (var boneIndex = 0, cache = this.bones.length; boneIndex < cache; boneIndex++) {
                if (this.bones[boneIndex].name === name) {
                    return boneIndex;
                }
            }
            return -1;
        };
        Skeleton.prototype.createAnimationRange = function (name, from, to) {
            // check name not already in use
            if (!this._ranges[name]) {
                this._ranges[name] = new BABYLON.AnimationRange(name, from, to);
                for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                    if (this.bones[i].animations[0]) {
                        this.bones[i].animations[0].createRange(name, from, to);
                    }
                }
            }
        };
        Skeleton.prototype.deleteAnimationRange = function (name, deleteFrames) {
            if (deleteFrames === void 0) { deleteFrames = true; }
            for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                if (this.bones[i].animations[0]) {
                    this.bones[i].animations[0].deleteRange(name, deleteFrames);
                }
            }
            this._ranges[name] = null; // said much faster than 'delete this._range[name]' 
        };
        Skeleton.prototype.getAnimationRange = function (name) {
            return this._ranges[name];
        };
        /**
         *  Returns as an Array, all AnimationRanges defined on this skeleton
         */
        Skeleton.prototype.getAnimationRanges = function () {
            var animationRanges = [];
            var name;
            var i = 0;
            for (name in this._ranges) {
                animationRanges[i] = this._ranges[name];
                i++;
            }
            return animationRanges;
        };
        /**
         *  note: This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
         */
        Skeleton.prototype.copyAnimationRange = function (source, name, rescaleAsRequired) {
            if (rescaleAsRequired === void 0) { rescaleAsRequired = false; }
            if (this._ranges[name] || !source.getAnimationRange(name)) {
                return false;
            }
            var ret = true;
            var frameOffset = this._getHighestAnimationFrame() + 1;
            // make a dictionary of source skeleton's bones, so exact same order or doublely nested loop is not required
            var boneDict = {};
            var sourceBones = source.bones;
            var nBones;
            var i;
            for (i = 0, nBones = sourceBones.length; i < nBones; i++) {
                boneDict[sourceBones[i].name] = sourceBones[i];
            }
            if (this.bones.length !== sourceBones.length) {
                BABYLON.Tools.Warn("copyAnimationRange: this rig has " + this.bones.length + " bones, while source as " + sourceBones.length);
                ret = false;
            }
            var skelDimensionsRatio = (rescaleAsRequired && this.dimensionsAtRest && source.dimensionsAtRest) ? this.dimensionsAtRest.divide(source.dimensionsAtRest) : null;
            for (i = 0, nBones = this.bones.length; i < nBones; i++) {
                var boneName = this.bones[i].name;
                var sourceBone = boneDict[boneName];
                if (sourceBone) {
                    ret = ret && this.bones[i].copyAnimationRange(sourceBone, name, frameOffset, rescaleAsRequired, skelDimensionsRatio);
                }
                else {
                    BABYLON.Tools.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
                    ret = false;
                }
            }
            // do not call createAnimationRange(), since it also is done to bones, which was already done
            var range = source.getAnimationRange(name);
            if (range) {
                this._ranges[name] = new BABYLON.AnimationRange(name, range.from + frameOffset, range.to + frameOffset);
            }
            return ret;
        };
        Skeleton.prototype.returnToRest = function () {
            for (var index = 0; index < this.bones.length; index++) {
                this.bones[index].returnToRest();
            }
        };
        Skeleton.prototype._getHighestAnimationFrame = function () {
            var ret = 0;
            for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                if (this.bones[i].animations[0]) {
                    var highest = this.bones[i].animations[0].getHighestFrame();
                    if (ret < highest) {
                        ret = highest;
                    }
                }
            }
            return ret;
        };
        Skeleton.prototype.beginAnimation = function (name, loop, speedRatio, onAnimationEnd) {
            var range = this.getAnimationRange(name);
            if (!range) {
                return null;
            }
            return this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        };
        Skeleton.prototype._markAsDirty = function () {
            this._isDirty = true;
        };
        Skeleton.prototype._registerMeshWithPoseMatrix = function (mesh) {
            this._meshesWithPoseMatrix.push(mesh);
        };
        Skeleton.prototype._unregisterMeshWithPoseMatrix = function (mesh) {
            var index = this._meshesWithPoseMatrix.indexOf(mesh);
            if (index > -1) {
                this._meshesWithPoseMatrix.splice(index, 1);
            }
        };
        Skeleton.prototype._computeTransformMatrices = function (targetMatrix, initialSkinMatrix) {
            this.onBeforeComputeObservable.notifyObservers(this);
            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];
                var parentBone = bone.getParent();
                if (parentBone) {
                    bone.getLocalMatrix().multiplyToRef(parentBone.getWorldMatrix(), bone.getWorldMatrix());
                }
                else {
                    if (initialSkinMatrix) {
                        bone.getLocalMatrix().multiplyToRef(initialSkinMatrix, bone.getWorldMatrix());
                    }
                    else {
                        bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
                    }
                }
                if (bone._index !== -1) {
                    var mappedIndex = bone._index === null ? index : bone._index;
                    bone.getInvertedAbsoluteTransform().multiplyToArray(bone.getWorldMatrix(), targetMatrix, mappedIndex * 16);
                }
            }
            this._identity.copyToArray(targetMatrix, this.bones.length * 16);
        };
        Skeleton.prototype.prepare = function () {
            if (!this._isDirty) {
                return;
            }
            if (this.needInitialSkinMatrix) {
                for (var index = 0; index < this._meshesWithPoseMatrix.length; index++) {
                    var mesh = this._meshesWithPoseMatrix[index];
                    var poseMatrix = mesh.getPoseMatrix();
                    if (!mesh._bonesTransformMatrices || mesh._bonesTransformMatrices.length !== 16 * (this.bones.length + 1)) {
                        mesh._bonesTransformMatrices = new Float32Array(16 * (this.bones.length + 1));
                    }
                    if (this._synchronizedWithMesh !== mesh) {
                        this._synchronizedWithMesh = mesh;
                        // Prepare bones
                        for (var boneIndex = 0; boneIndex < this.bones.length; boneIndex++) {
                            var bone = this.bones[boneIndex];
                            if (!bone.getParent()) {
                                var matrix = bone.getBaseMatrix();
                                matrix.multiplyToRef(poseMatrix, BABYLON.Tmp.Matrix[1]);
                                bone._updateDifferenceMatrix(BABYLON.Tmp.Matrix[1]);
                            }
                        }
                    }
                    this._computeTransformMatrices(mesh._bonesTransformMatrices, poseMatrix);
                }
            }
            else {
                if (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) {
                    this._transformMatrices = new Float32Array(16 * (this.bones.length + 1));
                }
                this._computeTransformMatrices(this._transformMatrices, null);
            }
            this._isDirty = false;
            this._scene._activeBones.addCount(this.bones.length, false);
        };
        Skeleton.prototype.getAnimatables = function () {
            if (!this._animatables || this._animatables.length !== this.bones.length) {
                this._animatables = [];
                for (var index = 0; index < this.bones.length; index++) {
                    this._animatables.push(this.bones[index]);
                }
            }
            return this._animatables;
        };
        Skeleton.prototype.clone = function (name, id) {
            var result = new Skeleton(name, id || name, this._scene);
            result.needInitialSkinMatrix = this.needInitialSkinMatrix;
            for (var index = 0; index < this.bones.length; index++) {
                var source = this.bones[index];
                var parentBone = null;
                var parent_1 = source.getParent();
                if (parent_1) {
                    var parentIndex = this.bones.indexOf(parent_1);
                    parentBone = result.bones[parentIndex];
                }
                var bone = new BABYLON.Bone(source.name, result, parentBone, source.getBaseMatrix().clone(), source.getRestPose().clone());
                BABYLON.Tools.DeepCopy(source.animations, bone.animations);
            }
            if (this._ranges) {
                result._ranges = {};
                for (var rangeName in this._ranges) {
                    var range = this._ranges[rangeName];
                    if (range) {
                        result._ranges[rangeName] = range.clone();
                    }
                }
            }
            this._isDirty = true;
            return result;
        };
        Skeleton.prototype.enableBlending = function (blendingSpeed) {
            if (blendingSpeed === void 0) { blendingSpeed = 0.01; }
            this.bones.forEach(function (bone) {
                bone.animations.forEach(function (animation) {
                    animation.enableBlending = true;
                    animation.blendingSpeed = blendingSpeed;
                });
            });
        };
        Skeleton.prototype.dispose = function () {
            this._meshesWithPoseMatrix = [];
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            this.getScene().removeSkeleton(this);
        };
        Skeleton.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.dimensionsAtRest = this.dimensionsAtRest;
            serializationObject.bones = [];
            serializationObject.needInitialSkinMatrix = this.needInitialSkinMatrix;
            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];
                var parent_2 = bone.getParent();
                var serializedBone = {
                    parentBoneIndex: parent_2 ? this.bones.indexOf(parent_2) : -1,
                    name: bone.name,
                    matrix: bone.getBaseMatrix().toArray(),
                    rest: bone.getRestPose().toArray()
                };
                serializationObject.bones.push(serializedBone);
                if (bone.length) {
                    serializedBone.length = bone.length;
                }
                if (bone.animations && bone.animations.length > 0) {
                    serializedBone.animation = bone.animations[0].serialize();
                }
                serializationObject.ranges = [];
                for (var name in this._ranges) {
                    var source = this._ranges[name];
                    if (!source) {
                        continue;
                    }
                    var range = {};
                    range.name = name;
                    range.from = source.from;
                    range.to = source.to;
                    serializationObject.ranges.push(range);
                }
            }
            return serializationObject;
        };
        Skeleton.Parse = function (parsedSkeleton, scene) {
            var skeleton = new Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);
            if (parsedSkeleton.dimensionsAtRest) {
                skeleton.dimensionsAtRest = BABYLON.Vector3.FromArray(parsedSkeleton.dimensionsAtRest);
            }
            skeleton.needInitialSkinMatrix = parsedSkeleton.needInitialSkinMatrix;
            var index;
            for (index = 0; index < parsedSkeleton.bones.length; index++) {
                var parsedBone = parsedSkeleton.bones[index];
                var parentBone = null;
                if (parsedBone.parentBoneIndex > -1) {
                    parentBone = skeleton.bones[parsedBone.parentBoneIndex];
                }
                var rest = parsedBone.rest ? BABYLON.Matrix.FromArray(parsedBone.rest) : null;
                var bone = new BABYLON.Bone(parsedBone.name, skeleton, parentBone, BABYLON.Matrix.FromArray(parsedBone.matrix), rest);
                if (parsedBone.length) {
                    bone.length = parsedBone.length;
                }
                if (parsedBone.animation) {
                    bone.animations.push(BABYLON.Animation.Parse(parsedBone.animation));
                }
            }
            // placed after bones, so createAnimationRange can cascade down
            if (parsedSkeleton.ranges) {
                for (index = 0; index < parsedSkeleton.ranges.length; index++) {
                    var data = parsedSkeleton.ranges[index];
                    skeleton.createAnimationRange(data.name, data.from, data.to);
                }
            }
            return skeleton;
        };
        Skeleton.prototype.computeAbsoluteTransforms = function (forceUpdate) {
            if (forceUpdate === void 0) { forceUpdate = false; }
            var renderId = this._scene.getRenderId();
            if (this._lastAbsoluteTransformsUpdateId != renderId || forceUpdate) {
                this.bones[0].computeAbsoluteTransforms();
                this._lastAbsoluteTransformsUpdateId = renderId;
            }
        };
        Skeleton.prototype.getPoseMatrix = function () {
            var poseMatrix = null;
            if (this._meshesWithPoseMatrix.length > 0) {
                poseMatrix = this._meshesWithPoseMatrix[0].getPoseMatrix();
            }
            return poseMatrix;
        };
        Skeleton.prototype.sortBones = function () {
            var bones = new Array();
            var visited = new Array(this.bones.length);
            for (var index = 0; index < this.bones.length; index++) {
                this._sortBones(index, bones, visited);
            }
            this.bones = bones;
        };
        Skeleton.prototype._sortBones = function (index, bones, visited) {
            if (visited[index]) {
                return;
            }
            visited[index] = true;
            var bone = this.bones[index];
            if (bone._index === undefined) {
                bone._index = index;
            }
            var parentBone = bone.getParent();
            if (parentBone) {
                this._sortBones(this.bones.indexOf(parentBone), bones, visited);
            }
            bones.push(bone);
        };
        return Skeleton;
    }());
    BABYLON.Skeleton = Skeleton;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.skeleton.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var Bone = BABYLON.Bone;
var BoneIKController = BABYLON.BoneIKController;
var BoneLookController = BABYLON.BoneLookController;
var Skeleton = BABYLON.Skeleton;

export { Bone,BoneIKController,BoneLookController,Skeleton };