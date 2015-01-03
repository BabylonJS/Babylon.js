declare module BABYLON {
    class Bone {
        public name: string;
        public children: Bone[];
        public animations: Animation[];
        private _skeleton;
        private _matrix;
        private _baseMatrix;
        private _worldTransform;
        private _absoluteTransform;
        private _invertedAbsoluteTransform;
        private _parent;
        constructor(name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix);
        public getParent(): Bone;
        public getLocalMatrix(): Matrix;
        public getBaseMatrix(): Matrix;
        public getWorldMatrix(): Matrix;
        public getInvertedAbsoluteTransform(): Matrix;
        public getAbsoluteMatrix(): Matrix;
        public updateMatrix(matrix: Matrix): void;
        private _updateDifferenceMatrix();
        public markAsDirty(): void;
    }
}
