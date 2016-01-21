var BABYLON;
(function (BABYLON) {
    var Skeleton = (function () {
        function Skeleton(name, id, scene) {
            this.name = name;
            this.id = id;
            this.bones = new Array();
            this._isDirty = true;
            this._identity = BABYLON.Matrix.Identity();
            this._ranges = {};
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
            this._ranges[name] = undefined; // said much faster than 'delete this._range[name]' 
        };
        Skeleton.prototype.getAnimationRange = function (name) {
            return this._ranges[name];
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
            for (var i = 0, nBones = sourceBones.length; i < nBones; i++) {
                boneDict[sourceBones[i].name] = sourceBones[i];
            }
            for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                var boneName = this.bones[i].name;
                var sourceBone = boneDict[boneName];
                if (sourceBone) {
                    ret = ret && this.bones[i].copyAnimationRange(sourceBone, name, frameOffset, rescaleAsRequired);
                }
                else {
                    BABYLON.Tools.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
                    ret = false;
                }
            }
            // do not call createAnimationRange(), since it also is done to bones, which was already done
            var range = source.getAnimationRange(name);
            this._ranges[name] = new BABYLON.AnimationRange(name, range.from + frameOffset, range.to + frameOffset);
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
                var bone = new BABYLON.Bone(source.name, result, parentBone, source.getBaseMatrix().clone(), source.getRestPose().clone());
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
        Skeleton.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.bones = [];
            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];
                var serializedBone = {
                    parentBoneIndex: bone.getParent() ? this.bones.indexOf(bone.getParent()) : -1,
                    name: bone.name,
                    matrix: bone.getLocalMatrix().toArray(),
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
                    var range = {};
                    range.name = name;
                    range.from = this._ranges[name].from;
                    range.to = this._ranges[name].to;
                    serializationObject.ranges.push(range);
                }
            }
            return serializationObject;
        };
        Skeleton.Parse = function (parsedSkeleton, scene) {
            var skeleton = new Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);
            for (var index = 0; index < parsedSkeleton.bones.length; index++) {
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
                for (var index = 0; index < parsedSkeleton.ranges.length; index++) {
                    var data = parsedSkeleton.ranges[index];
                    skeleton.createAnimationRange(data.name, data.from, data.to);
                }
            }
            return skeleton;
        };
        return Skeleton;
    })();
    BABYLON.Skeleton = Skeleton;
})(BABYLON || (BABYLON = {}));
