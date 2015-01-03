declare module BABYLON {
    class PostProcessRenderPass {
        private _enabled;
        private _renderList;
        private _renderTexture;
        private _scene;
        private _refCount;
        public _name: string;
        constructor(scene: Scene, name: string, size: number, renderList: Mesh[], beforeRender: () => void, afterRender: () => void);
        public _incRefCount(): number;
        public _decRefCount(): number;
        public _update(): void;
        public setRenderList(renderList: Mesh[]): void;
        public getRenderTexture(): RenderTargetTexture;
    }
}
