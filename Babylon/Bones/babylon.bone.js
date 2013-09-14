var BABYLON = BABYLON || {};

(function () {
    BABYLON.Bone = function (name, skeleton, parentBone, matrix) {
        this.name = name;
        this._skeleton = skeleton;
        this._matrix = matrix;
        this._baseMatrix = matrix;
        this._worldTransform = new BABYLON.Matrix();
        this._absoluteTransform = new BABYLON.Matrix();
        this._invertedAbsoluteTransform = new BABYLON.Matrix();
        this.children = [];
        this.animations = [];

        skeleton.bones.push(this);
        
        if (parentBone) {
            this._parent = parentBone;
            parentBone.children.push(this);
        } else {
            this._parent = null;
        }
        
        this._updateDifferenceMatrix();
    };
        
    // Members
    BABYLON.Bone.prototype.getParent = function() {
        return this._parent;
    };
    
    BABYLON.Bone.prototype.getLocalMatrix = function () {
        return this._matrix;
    };

    BABYLON.Bone.prototype.getAbsoluteMatrix = function () {
        var matrix = this._matrix.clone();
        var parent = this._parent;

        while (parent) {
            matrix = matrix.multiply(parent.getLocalMatrix());
            parent = parent.getParent();
        }

        return matrix;
    };

    // Methods
    BABYLON.Bone.prototype.updateMatrix = function(matrix) {
        this._matrix = matrix;
        this._skeleton._markAsDirty();

        this._updateDifferenceMatrix();
    };

    BABYLON.Bone.prototype._updateDifferenceMatrix = function() {
        if (this._parent) {
            this._matrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
        } else {
            this._absoluteTransform.copyFrom(this._matrix);
        }

        this._absoluteTransform.invertToRef(this._invertedAbsoluteTransform);

        for (var index = 0; index < this.children.length; index++) {
            this.children[index]._updateDifferenceMatrix();
        }
    };

    BABYLON.Bone.prototype.markAsDirty = function() {
        this._skeleton._markAsDirty();
    };
})();