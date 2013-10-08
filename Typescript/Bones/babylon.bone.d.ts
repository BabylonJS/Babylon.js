/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Bone {
        name: string;
        children: Bone[];
        animation: Animation[];

        constructor(name: string, skeleton: Skeleton; parentBone: Bone, matrix: Matrix);

        getParent(): Bone;
        getLocalMatrix: Matrix;
        getAbsoluteMatrix: Matrix;
        updateMatrix(matrix: Matrix): void;
        markAsDirty(): void;
    }
}