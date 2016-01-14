var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Bone = (function (_super) {
        __extends(Bone, _super);
        function Bone(name, skeleton, parentBone, matrix) {
            _super.call(this, name, skeleton.getScene());
            this.name = name;
            this.children = new Array();
            this.animations = new Array();
            this._worldTransform = new BABYLON.Matrix();
            this._absoluteTransform = new BABYLON.Matrix();
            this._invertedAbsoluteTransform = new BABYLON.Matrix();
            this._skeleton = skeleton;
            this._matrix = matrix;
            this._baseMatrix = matrix;
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
        Bone.prototype.getWorldMatrix = function () {
            return this._worldTransform;
        };
        Bone.prototype.getInvertedAbsoluteTransform = function () {
            return this._invertedAbsoluteTransform;
        };
        Bone.prototype.getAbsoluteMatrix = function () {
            var matrix = this._matrix.clone();
            var parent = this._parent;
            while (parent) {
                matrix = matrix.multiply(parent.getLocalMatrix());
                parent = parent.getParent();
            }
            return matrix;
        };
        // Methods
        Bone.prototype.updateMatrix = function (matrix) {
            this._matrix = matrix;
            this._skeleton._markAsDirty();
            this._updateDifferenceMatrix();
        };
        Bone.prototype._updateDifferenceMatrix = function () {
            if (this._parent) {
                this._matrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            }
            else {
                this._absoluteTransform.copyFrom(this._matrix);
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
        Bone.prototype.copyAnimationRange = function (source, rangeName, frameOffset, rescaleAsRequired) {
            if (rescaleAsRequired === void 0) { rescaleAsRequired = false; }
            // all animation may be coming from a library skeleton, so may need to create animation
            if (this.animations.length === 0) {
                this.animations.push(new BABYLON.Animation(this.name, "_matrix", source.animations[0].framePerSecond, BABYLON.Animation.ANIMATIONTYPE_MATRIX, 0));
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
            var scalingReqd = rescaleAsRequired && sourceBoneLength && this.length && sourceBoneLength !== this.length;
            var ratio = scalingReqd ? this.length / sourceBoneLength : null;
            var destKeys = this.animations[0].getKeys();
            // loop vars declaration / initialization
            var orig;
            var origScale = scalingReqd ? BABYLON.Vector3.Zero() : null;
            var origRotation = scalingReqd ? new BABYLON.Quaternion() : null;
            var origTranslation = scalingReqd ? BABYLON.Vector3.Zero() : null;
            var mat;
            for (var key = 0, nKeys = sourceKeys.length; key < nKeys; key++) {
                orig = sourceKeys[key];
                if (orig.frame >= from && orig.frame <= to) {
                    if (scalingReqd) {
                        orig.value.decompose(origScale, origRotation, origTranslation);
                        origTranslation.scaleInPlace(ratio);
                        mat = BABYLON.Matrix.Compose(origScale, origRotation, origTranslation);
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
        return Bone;
    })(BABYLON.Node);
    BABYLON.Bone = Bone;
})(BABYLON || (BABYLON = {}));
