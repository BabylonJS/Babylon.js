declare module BABYLON {
    class RenderTargetTexture extends Texture {
        public renderList: AbstractMesh[];
        public renderParticles: boolean;
        public renderSprites: boolean;
        public coordinatesMode: number;
        public onBeforeRender: () => void;
        public onAfterRender: () => void;
        public activeCamera: Camera;
        public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
        private _size;
        public _generateMipMaps: boolean;
        private _renderingManager;
        public _waitingRenderList: string[];
        private _doNotChangeAspectRatio;
        private _currentRefreshId;
        private _refreshRate;
        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, doNotChangeAspectRatio?: boolean);
        public resetRefreshCounter(): void;
        public refreshRate : number;
        public _shouldRender(): boolean;
        public isReady(): boolean;
        public getRenderSize(): number;
        public canRescale : boolean;
        public scale(ratio: number): void;
        public resize(size: any, generateMipMaps?: boolean): void;
        public render(useCameraPostProcess?: boolean): void;
        public clone(): RenderTargetTexture;
    }
}
