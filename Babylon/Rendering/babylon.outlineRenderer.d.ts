declare module BABYLON {
    class OutlineRenderer {
        private _scene;
        private _effect;
        private _cachedDefines;
        constructor(scene: Scene);
        public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay?: boolean): void;
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean;
    }
}
