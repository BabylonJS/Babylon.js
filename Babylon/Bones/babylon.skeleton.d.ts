declare module BABYLON {
    class Skeleton {
        public name: string;
        public id: string;
        public bones: Bone[];
        private _scene;
        private _isDirty;
        private _transformMatrices;
        private _animatables;
        private _identity;
        constructor(name: string, id: string, scene: Scene);
        public getTransformMatrices(): Float32Array;
        public _markAsDirty(): void;
        public prepare(): void;
        public getAnimatables(): IAnimatable[];
        public clone(name: string, id: string): Skeleton;
    }
}
