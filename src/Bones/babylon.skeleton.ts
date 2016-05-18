module BABYLON {
    export class Skeleton {
        public bones = new Array<Bone>();

        public needInitialSkinMatrix = false;

        private _scene: Scene;
        private _isDirty = true;
        private _transformMatrices: Float32Array;
        private _meshesWithPoseMatrix = new Array<AbstractMesh>();
        private _animatables: IAnimatable[];
        private _identity = Matrix.Identity();

        private _ranges: { [name: string]: AnimationRange; } = {};

        constructor(public name: string, public id: string, scene: Scene) {
            this.bones = [];

            this._scene = scene;

            scene.skeletons.push(this);

            //make sure it will recalculate the matrix next time prepare is called.
            this._isDirty = true;
        }

        // Members
        public getTransformMatrices(mesh: AbstractMesh): Float32Array {
            if (this.needInitialSkinMatrix && mesh._bonesTransformMatrices) {
                return mesh._bonesTransformMatrices;
            }
            return this._transformMatrices;
        }

        public getScene(): Scene {
            return this._scene;
        }

        // Methods

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails? : boolean) : string {
            var ret = `Name: ${this.name}, nBones: ${this.bones.length}`;
            ret += `, nAnimationRanges: ${this._ranges ? Object.keys(this._ranges).length : "none"}`;
            if (fullDetails) {
                ret += ", Ranges: {"; 
                let first = true;
                for (let name in this._ranges) {
                    if (first) {
                        ret += ", ";
                        first = false; 
                    }
                    ret += name; 
                }
                ret += "}";
            }
            return ret;
        } 

        /**
        * Get bone's index searching by name
        * @param {string} name is bone's name to search for
        * @return {number} Indice of the bone. Returns -1 if not found
        */
        public getBoneIndexByName(name: string): number {
            for (var boneIndex = 0, cache = this.bones.length; boneIndex < cache; boneIndex++) {
                if (this.bones[boneIndex].name === name) {
                    return boneIndex;
                }
            }
            return -1;
        }
        
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
         *  Returns as an Array, all AnimationRanges defined on this skeleton
         */
        public getAnimationRanges(): AnimationRange[] {
            var animationRanges :  AnimationRange[] = [];
            var name : string;
            var i: number = 0;
            for (name in this._ranges){
                animationRanges[i] = this._ranges[name];
                i++;
            }
            return animationRanges;
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
            var nBones: number;
            var i: number;
            for (i = 0, nBones = sourceBones.length; i < nBones; i++) {
                boneDict[sourceBones[i].name] = sourceBones[i];
            }

            if (this.bones.length !== sourceBones.length){
                Tools.Warn(`copyAnimationRange: this rig has ${this.bones.length} bones, while source as ${sourceBones.length}`);
                ret = false;
            }
            
            for (i = 0, nBones = this.bones.length; i < nBones; i++) {
                var boneName = this.bones[i].name;
                var sourceBone = boneDict[boneName];
                if (sourceBone) {
                    ret = ret && this.bones[i].copyAnimationRange(sourceBone, name, frameOffset, rescaleAsRequired);
                } else {
                    Tools.Warn("copyAnimationRange: not same rig, missing source bone " + boneName);
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

        public beginAnimation(name: string, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable {
            var range = this.getAnimationRange(name);

            if (!range) {
                return null;
            }

            return this._scene.beginAnimation(this, range.from, range.to, loop, speedRatio, onAnimationEnd);
        }

        public _markAsDirty(): void {
            this._isDirty = true;
        }

        public _registerMeshWithPoseMatrix(mesh: AbstractMesh): void {
            this._meshesWithPoseMatrix.push(mesh);
        }

        public _unregisterMeshWithPoseMatrix(mesh: AbstractMesh): void {
            var index = this._meshesWithPoseMatrix.indexOf(mesh);

            if (index > -1) {
                this._meshesWithPoseMatrix.splice(index, 1);
            }
        }

        public _computeTransformMatrices(targetMatrix: Float32Array, initialSkinMatrix: Matrix): void {
            for (var index = 0; index < this.bones.length; index++) {
                var bone = this.bones[index];
                var parentBone = bone.getParent();

                if (parentBone) {
                    bone.getLocalMatrix().multiplyToRef(parentBone.getWorldMatrix(), bone.getWorldMatrix());
                } else {
                    if (initialSkinMatrix) {
                        bone.getLocalMatrix().multiplyToRef(initialSkinMatrix, bone.getWorldMatrix());
                    } else {
                        bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
                    }
                }

                bone.getInvertedAbsoluteTransform().multiplyToArray(bone.getWorldMatrix(), targetMatrix, index * 16);
            }

            this._identity.copyToArray(targetMatrix, this.bones.length * 16);
        }

        public prepare(): void {
            if (!this._isDirty) {
                return;
            }

            if (this.needInitialSkinMatrix) {
                for (var index = 0; index < this._meshesWithPoseMatrix.length; index++) {
                    var mesh = this._meshesWithPoseMatrix[index];

                    if (!mesh._bonesTransformMatrices || mesh._bonesTransformMatrices.length !== 16 * (this.bones.length + 1)) {
                        mesh._bonesTransformMatrices = new Float32Array(16 * (this.bones.length + 1));
                    }

                    var poseMatrix = mesh.getPoseMatrix();

                    // Prepare bones
                    for (var boneIndex = 0; boneIndex < this.bones.length; boneIndex++) {
                        var bone = this.bones[boneIndex];

                        if (!bone.getParent()) {
                            var matrix = bone.getBaseMatrix();
                            matrix.multiplyToRef(poseMatrix, Tmp.Matrix[0]);
                            bone._updateDifferenceMatrix(Tmp.Matrix[0]);
                        }
                    }

                    this._computeTransformMatrices(mesh._bonesTransformMatrices, poseMatrix);
                }
            } else {
                if (!this._transformMatrices || this._transformMatrices.length !== 16 * (this.bones.length + 1)) {
                    this._transformMatrices = new Float32Array(16 * (this.bones.length + 1));
                }

                this._computeTransformMatrices(this._transformMatrices, null);
            }

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

            result.needInitialSkinMatrix = this.needInitialSkinMatrix;

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

            if (this._ranges) {
                result._ranges = {};
                for (var rangeName in this._ranges) {
                    result._ranges[rangeName] = this._ranges[rangeName].clone();
                }
            }

            this._isDirty = true;

            return result;
        }

        public enableBlending(blendingSpeed = 0.01) {
            this.bones.forEach((bone) => {
                bone.animations.forEach((animation: Animation) => {
                    animation.enableBlending = true;
                    animation.blendingSpeed = blendingSpeed;
                });
            });
        }

        public dispose() {
            this._meshesWithPoseMatrix = [];

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

            serializationObject.needInitialSkinMatrix = this.needInitialSkinMatrix;

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

            skeleton.needInitialSkinMatrix = parsedSkeleton.needInitialSkinMatrix;

            let index: number;
            for (index = 0; index < parsedSkeleton.bones.length; index++) {
                var parsedBone = parsedSkeleton.bones[index];

                var parentBone = null;
                if (parsedBone.parentBoneIndex > -1) {
                    parentBone = skeleton.bones[parsedBone.parentBoneIndex];
                }
                var rest: Matrix = parsedBone.rest ? Matrix.FromArray(parsedBone.rest) : null;
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
                for (index = 0; index < parsedSkeleton.ranges.length; index++) {
                    var data = parsedSkeleton.ranges[index];
                    skeleton.createAnimationRange(data.name, data.from, data.to);
                }
            }
            return skeleton;
        }
    }
}
