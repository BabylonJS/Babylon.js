﻿module BABYLON {
    export class Skeleton {
        public bones = new Array<Bone>();

        private _scene: Scene;
        private _isDirty = true;
        private _transformMatrices: Float32Array;
        private _animatables: IAnimatable[];
        private _identity = Matrix.Identity();

        constructor(public name: string, public id: string, scene: Scene) {
            this.bones = [];

            this._scene = scene;

            scene.skeletons.push(this);

            this.prepare();
            //make sure it will recalculate the matrix next time prepare is called.
            this._isDirty = true;
        }

        // Members
        public getTransformMatrices() {
            return this._transformMatrices;
        }

        // Methods
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

                var bone = new Bone(source.name, result, parentBone, source.getBaseMatrix());
                Tools.DeepCopy(source.animations, bone.animations);
            }

            return result;
        }
    }
}