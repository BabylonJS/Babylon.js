module BABYLON {
    export class PostProcessRenderPass {
        private _enabled: boolean = true;
        private _renderList: Mesh[];
        private _renderTexture: RenderTargetTexture;
        private _scene: Scene;
        private _refCount: number = 0;

        // private
        public _name: string;

        constructor(scene: Scene, name: string, size: number, renderList: Mesh[], beforeRender: () => void, afterRender: () => void) {
            this._name = name;

            this._renderTexture = new RenderTargetTexture(name, size, scene);
            this.setRenderList(renderList);

            this._renderTexture.onBeforeRender = beforeRender;
            this._renderTexture.onAfterRender = afterRender;

            this._scene = scene;

            this._renderList = renderList;
        }

        // private
        public _incRefCount(): number {
            if (this._refCount === 0) {
                this._scene.customRenderTargets.push(this._renderTexture);
            }

            return ++this._refCount;
        }

        public _decRefCount(): number {
            this._refCount--;

            if (this._refCount <= 0) {
                this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(this._renderTexture), 1);
            }

            return this._refCount;
        }

        public _update(): void {
            this.setRenderList(this._renderList);
        }

        // public

        public setRenderList(renderList: Mesh[]): void {
            this._renderTexture.renderList = renderList;
        }

        public getRenderTexture(): RenderTargetTexture {
            return this._renderTexture;
        }
    }
}