var BABYLON;
(function (BABYLON) {
    var Skeleton = (function () {
        function Skeleton(name, id, scene) {
            this.name = name;
            this.id = id;
            this.bones = new Array();
            this._isDirty = true;
            this._identity = BABYLON.Matrix.Identity();
            this._ranges = new Array();
            this.bones = [];
            this._scene = scene;
            scene.skeletons.push(this);
            this.prepare();
            //make sure it will recalculate the matrix next time prepare is called.
            this._isDirty = true;
        }
        // Members
        Skeleton.prototype.getTransformMatrices = function () {
            return this._transformMatrices;
        };
        Skeleton.prototype.getScene = function () {
            return this._scene;
        };
        // Methods
        Skeleton.prototype.createAnimationRange = function (name, from, to) {
            this._ranges.push(new BABYLON.AnimationRange(name, from, to));
        };
        Skeleton.prototype.deleteAnimationRange = function (name) {
            for (var index = 0; index < this._ranges.length; index++) {
                if (this._ranges[index].name === name) {
                    this._ranges.splice(index, 1);
                    return;
                }
            }
        };
        Skeleton.prototype.getAnimationRange = function (name) {
            for (var index = 0; index < this._ranges.length; index++) {
                if (this._ranges[index].name === name) {
                    return this._ranges[index];
                }
            }
            return null;
        };
        Skeleton.prototype.beginAnimation = function (name, loop, speedRatio, onAnimationEnd) {
            var range = this.getAnimationRange(name);
            if (!range) {
                return null;
            }
            this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        };
        Skeleton.prototype._markAsDirty = function () {
            this._isDirty = true;
        };
        Skeleton.prototype.prepare = function () {
            if (!this._isDirty) {
                return;
            }
            if (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) {
                this._transformMatrices = new Float32Array(16 * (this.bones.length + 1));
            }
            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];
                var parentBone = bone.getParent();
                if (parentBone) {
                    bone.getLocalMatrix().multiplyToRef(parentBone.getWorldMatrix(), bone.getWorldMatrix());
                }
                else {
                    bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
                }
                bone.getInvertedAbsoluteTransform().multiplyToArray(bone.getWorldMatrix(), this._transformMatrices, index * 16);
            }
            this._identity.copyToArray(this._transformMatrices, this.bones.length * 16);
            this._isDirty = false;
            this._scene._activeBones += this.bones.length;
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
            for (var index = 0; index < this.bones.length; index++) {
                var source = this.bones[index];
                var parentBone = null;
                if (source.getParent()) {
                    var parentIndex = this.bones.indexOf(source.getParent());
                    parentBone = result.bones[parentIndex];
                }
                var bone = new BABYLON.Bone(source.name, result, parentBone, source.getBaseMatrix());
                BABYLON.Tools.DeepCopy(source.animations, bone.animations);
            }
            return result;
        };
        Skeleton.prototype.dispose = function () {
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            this.getScene().removeSkeleton(this);
        };
        Skeleton.ParseSkeleton = function (parsedSkeleton, scene) {
            var skeleton = new BABYLON.Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);
            for (var index = 0; index < parsedSkeleton.bones.length; index++) {
                var parsedBone = parsedSkeleton.bones[index];
                var parentBone = null;
                if (parsedBone.parentBoneIndex > -1) {
                    parentBone = skeleton.bones[parsedBone.parentBoneIndex];
                }
                var bone = new BABYLON.Bone(parsedBone.name, skeleton, parentBone, BABYLON.Matrix.FromArray(parsedBone.matrix));
                if (parsedBone.animation) {
                    bone.animations.push(BABYLON.Animation.ParseAnimation(parsedBone.animation));
                }
            }
            return skeleton;
        };
        return Skeleton;
    })();
    BABYLON.Skeleton = Skeleton;
})(BABYLON || (BABYLON = {}));
