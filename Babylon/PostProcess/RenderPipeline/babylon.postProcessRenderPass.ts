module BABYLON {
    export class PostProcessRenderPass {
        private _enabled = true;
        private _renderList: Mesh[];
        private _renderTexture: RenderTargetTexture;
        private _scene: Scene;
        private _refCount = 0;

        constructor(scene: Scene, public name: string, size: number, renderList: Mesh[], beforeRender: () => void, afterRender: () => void) {

            this._renderTexture = new RenderTargetTexture(name, size, scene);
            this.setRenderList(renderList);

            this._renderTexture.onBeforeRender = beforeRender;
            this._renderTexture.onAfterRender = afterRender;

            this._scene = scene;
        }

        public incRefCount(): number {
            if (this._refCount == 0) {
                this._scene.customRenderTargets.push(this._renderTexture);
            }

            return ++this._refCount;
        }

        public decRefCount(): number {
            this._refCount--;

            if (this._refCount <= 0) {
                this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(this._renderTexture), 1);
            }

            return this._refCount;
        }

        public setRenderList(renderList: Mesh[]): void {
            this._renderTexture.renderList = renderList;
        }

        public getRenderTexture(): RenderTargetTexture {
            return this._renderTexture;
        }

        public _update(): void {
            this.setRenderList(this._renderList);
        }
    }
}