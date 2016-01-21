module BABYLON {
    export class Skeleton {
        public bones = new Array<Bone>();

        private _scene: Scene;
        private _isDirty = true;
        private _transformMatrices: Float32Array;
        private _animatables: IAnimatable[];
        private _identity = Matrix.Identity();

        private _ranges: { [name: string]: AnimationRange; } = {};

        constructor(public name: string, public id: string, scene: Scene) {
            this.bones = [];

            this._scene = scene;

            scene.skeletons.push(this);

            this.prepare();
            //make sure it will recalculate the matrix next time prepare is called.
            this._isDirty = true;
        }

        // Members
        public getTransformMatrices(): Float32Array {
            return this._transformMatrices;
        }

        public getScene(): Scene {
            return this._scene;
        }

        // Methods
        public createAnimationRange(name: string, from: number, to: number): void {
            // check name not already in use
            if (!this._ranges[name]) {
                this._ranges[name] = new AnimationRange(name, from, to);
                for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                    if (this.bones[i].animations[0]) {
                        this.bones[i].animations[0].createRange(name, from, to);
                    }
                }
            }
        }

        public deleteAnimationRange(name: string, deleteFrames = true): void {
            for (var i = 0, nBones = this.bones.length; i < nBones; i++) {
                if (this.bones[i].animations[0]) {
                    this.bones[i].animations[0].deleteRange(name, deleteFrames);
                }
            }
            this._ranges[name] = undefined; // said much faster than 'delete this._range[name]' 
        }

        public getAnimationRange(name: string): AnimationRange {
            return this._ranges[name];
        }

        /** 
         *  note: This is not for a complete retargeting, only between very similar skeleton's with only possible bone length differences
         */
        public copyAnimationRange(source: Skeleton, name: string, rescaleAsRequired = false): boolean {
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
                } else {
                    BABYLON.Tools.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
                    ret = false;
                }
            }
            // do not call createAnimationRange(), since it also is done to bones, which was already done
            var range = source.getAnimationRange(name);
            this._ranges[name] = new AnimationRange(name, range.from + frameOffset, range.to + frameOffset);
            return ret;
        }

        public returnToRest(): void {
            for (var index = 0; index < this.bones.length; index++) {
                this.bones[index].returnToRest();
            }
        }

        private _getHighestAnimationFrame(): number {
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
        }

        public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): void {
            var range = this.getAnimationRange(name);

            if (!range) {
                return null;
            }

            this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        }

        public _markAsDirty(): void {
            this._isDirty = true;
        }

        public prepare(): void {
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
                } else {
                    bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
                }

                bone.getInvertedAbsoluteTransform().multiplyToArray(bone.getWorldMatrix(), this._transformMatrices, index * 16);
            }

            this._identity.copyToArray(this._transformMatrices, this.bones.length * 16);

            this._isDirty = false;

            this._scene._activeBones += this.bones.length;
        }

        public getAnimatables(): IAnimatable[] {
            if (!this._animatables || this._animatables.length !== this.bones.length) {
                this._animatables = [];

                for (var index = 0; index < this.bones.length; index++) {
                    this._animatables.push(this.bones[index]);
                }
            }

            return this._animatables;
        }

        public clone(name: string, id: string): Skeleton {
            var result = new Skeleton(name, id || name, this._scene);

            for (var index = 0; index < this.bones.length; index++) {
                var source = this.bones[index];
                var parentBone = null;

                if (source.getParent()) {
                    var parentIndex = this.bones.indexOf(source.getParent());
                    parentBone = result.bones[parentIndex];
                }

                var bone = new Bone(source.name, result, parentBone, source.getBaseMatrix().clone(), source.getRestPose().clone());
                Tools.DeepCopy(source.animations, bone.animations);
            }

            return result;
        }

        public dispose() {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this.getScene().removeSkeleton(this);
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            serializationObject.id = this.id;

            serializationObject.bones = [];

            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];

                var serializedBone: any = {
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
                    var range: any = {};
                    range.name = name;
                    range.from = this._ranges[name].from;
                    range.to = this._ranges[name].to;
                    serializationObject.ranges.push(range);
                }
            }
            return serializationObject;
        }

        public static Parse(parsedSkeleton: any, scene: Scene): Skeleton {
            var skeleton = new Skeleton(parsedSkeleton.name, parsedSkeleton.id, scene);

            for (var index = 0; index < parsedSkeleton.bones.length; index++) {
                var parsedBone = parsedSkeleton.bones[index];

                var parentBone = null;
                if (parsedBone.parentBoneIndex > -1) {
                    parentBone = skeleton.bones[parsedBone.parentBoneIndex];
                }
                var rest : Matrix = parsedBone.rest ? Matrix.FromArray(parsedBone.rest) : null;
                var bone = new Bone(parsedBone.name, skeleton, parentBone, Matrix.FromArray(parsedBone.matrix), rest);

                if (parsedBone.length) {
                    bone.length = parsedBone.length;
                }

                if (parsedBone.animation) {
                    bone.animations.push(Animation.Parse(parsedBone.animation));
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
        }
    }
}

