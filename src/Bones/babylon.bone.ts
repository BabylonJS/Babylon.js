module BABYLON {
    export class Bone extends Node {
        public children = new Array<Bone>();
        public animations = new Array<Animation>();
        public length: number; 

        private _skeleton: Skeleton;
        private _matrix: Matrix;
        private _baseMatrix: Matrix;
        private _worldTransform = new Matrix();
        private _absoluteTransform = new Matrix();
        private _invertedAbsoluteTransform = new Matrix();
        private _parent: Bone;

        constructor(public name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix) {
            super(name, skeleton.getScene());
            this._skeleton = skeleton;
            this._matrix = matrix;
            this._baseMatrix = matrix;

            skeleton.bones.push(this);

            if (parentBone) {
                this._parent = parentBone;
                parentBone.children.push(this);
            } else {
                this._parent = null;
            }

            this._updateDifferenceMatrix();
        }

        // Members
        public getParent():Bone {
            return this._parent;
        }

        public getLocalMatrix():Matrix {
            return this._matrix;
        }

        public getBaseMatrix(): Matrix {
            return this._baseMatrix;
        }

        public getWorldMatrix(): Matrix {
            return this._worldTransform;
        }

        public getInvertedAbsoluteTransform(): Matrix {
            return this._invertedAbsoluteTransform;
        }

        public getAbsoluteMatrix(): Matrix {
            var matrix = this._matrix.clone();
            var parent = this._parent;

            while (parent) {
                matrix = matrix.multiply(parent.getLocalMatrix());
                parent = parent.getParent();
            }

            return matrix;
        }

        // Methods
        public updateMatrix(matrix: Matrix): void {
            this._matrix = matrix;
            this._skeleton._markAsDirty();

            this._updateDifferenceMatrix();
        }

        private _updateDifferenceMatrix(): void {
            if (this._parent) {
                this._matrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            } else {
                this._absoluteTransform.copyFrom(this._matrix);
            }

            this._absoluteTransform.invertToRef(this._invertedAbsoluteTransform);

            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._updateDifferenceMatrix();
            }
        }

        public markAsDirty(): void {
            this._currentRenderId++;
            this._skeleton._markAsDirty();
        }
    }
} 