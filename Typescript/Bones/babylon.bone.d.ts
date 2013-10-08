/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Bone {
        name: string;
        _skeleton: Skeleton;
        _matrix: Matrix;
        _baseMatrix: Matrix;
        _worldTransform: Matrix;
        _absoluteTransform: Matrix;
        _invertedAbsoluteTransform: Matrix;
        children: Bone[];
        animation: Animation[];

        constructor(name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix);

        getParent(): Bone;
        getLocalMatrix: Matrix;
        getAbsoluteMatrix: Matrix;
        _updateDifferenceMatrix(): void ;
        updateMatrix(matrix: Matrix): void;
        markAsDirty(): void;
    }
}