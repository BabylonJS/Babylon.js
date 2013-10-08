/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Skeleton {
        id: number;
        name: string;
        bones: Bone[];

        constructor(name: string, id: number, scene: Scene);

        getTransformMatrices(): Matrix[];
        prepare(): void;
        getAnimatables(): Animation[];
        clone(name: string, id: number): Skeleton;
    }
}