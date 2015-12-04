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
        return Bone;
    })(BABYLON.Node);
    BABYLON.Bone = Bone;
})(BABYLON || (BABYLON = {}));
