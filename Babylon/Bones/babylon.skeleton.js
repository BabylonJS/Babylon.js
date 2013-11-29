"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.Skeleton = function (name, id, scene) {
        this.id = id;
        this.name = name;
        this.bones = [];

        this._scene = scene;

        scene.skeletons.push(this);

        this._isDirty = true;
    };
        
    // Members
    BABYLON.Skeleton.prototype.getTransformMatrices = function () {       
        return this._transformMatrices;
    };

    // Methods
    BABYLON.Skeleton.prototype._markAsDirty = function() {
        this._isDirty = true;
    };

    BABYLON.Skeleton.prototype.prepare = function() {
        if (!this._isDirty) {
            return;
        }

        if (!this._transformMatrices || this._transformMatrices.length !== 16 * this.bones.length) {
            this._transformMatrices = new BABYLON.MatrixType(16 * this.bones.length);
        }

        for (var index = 0; index < this.bones.length; index++) {
            var bone = this.bones[index];
            var parentBone = bone.getParent();

            if (parentBone) {
                bone._matrix.multiplyToRef(parentBone._worldTransform, bone._worldTransform);
            } else {
                bone._worldTransform.copyFrom(bone._matrix);
            }

            bone._invertedAbsoluteTransform.multiplyToArray(bone._worldTransform, this._transformMatrices, index * 16);
        }

        this._isDirty = false;
    };
    
    BABYLON.Skeleton.prototype.getAnimatables = function () {
        if (!this._animatables || this._animatables.length != this.bones.length) {
            this._animatables = [];
            
            for (var index = 0; index < this.bones.length; index++) {
                this._animatables.push(this.bones[index]);
            }
        }

        return this._animatables;
    };

    BABYLON.Skeleton.prototype.clone = function(name, id) {
        var result = new BABYLON.Skeleton(name, id || name, this._scene);

        for (var index = 0; index < this.bones.length; index++) {
            var source = this.bones[index];
            var parentBone = null;
            
            if (source.getParent()) {
                var parentIndex = this.bones.indexOf(source.getParent());
                parentBone = result.bones[parentIndex];
            }

            var bone = new BABYLON.Bone(source.name, result, parentBone, source._baseMatrix);
            BABYLON.Tools.DeepCopy(source.animations, bone.animations);
        }

        return result;
    };
})();