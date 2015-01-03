declare module BABYLON {
    class RenderingManager {
        static MAX_RENDERINGGROUPS: number;
        private _scene;
        private _renderingGroups;
        private _depthBufferAlreadyCleaned;
        constructor(scene: Scene);
        private _renderParticles(index, activeMeshes);
        private _renderSprites(index);
        private _clearDepthBuffer();
        public render(customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>) => void, activeMeshes: AbstractMesh[], renderParticles: boolean, renderSprites: boolean): void;
        public reset(): void;
        public dispatch(subMesh: SubMesh): void;
    }
}
