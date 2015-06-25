var BABYLON;
(function (BABYLON) {
    var Skeleton = (function () {
        function Skeleton(name, id, scene) {
            this.name = name;
            this.id = id;
            this.bones = new Array();
            this._isDirty = true;
            this._identity = BABYLON.Matrix.Identity();
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
        return Skeleton;
    })();
    BABYLON.Skeleton = Skeleton;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.skeleton.js.map