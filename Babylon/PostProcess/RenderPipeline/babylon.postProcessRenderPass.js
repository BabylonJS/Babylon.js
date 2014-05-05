var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPass = (function () {
        function PostProcessRenderPass(scene, name, size, renderList, beforeRender, afterRender) {
            this.name = name;
            this._enabled = true;
            this._refCount = 0;
            this._renderTexture = new BABYLON.RenderTargetTexture(name, size, scene);
            this.setRenderList(renderList);

            this._renderTexture.onBeforeRender = beforeRender;
            this._renderTexture.onAfterRender = afterRender;

            this._scene = scene;
        }
        PostProcessRenderPass.prototype.incRefCount = function () {
            if (this._refCount == 0) {
                this._scene.customRenderTargets.push(this._renderTexture);
            }

            return ++this._refCount;
        };

        PostProcessRenderPass.prototype.decRefCount = function () {
            this._refCount--;

            if (this._refCount <= 0) {
                this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(this._renderTexture), 1);
            }

            return this._refCount;
        };

        PostProcessRenderPass.prototype.setRenderList = function (renderList) {
            this._renderTexture.renderList = renderList;
        };

        PostProcessRenderPass.prototype.getRenderTexture = function () {
            return this._renderTexture;
        };

        PostProcessRenderPass.prototype._update = function () {
            this.setRenderList(this._renderList);
        };
        return PostProcessRenderPass;
    })();
    BABYLON.PostProcessRenderPass = PostProcessRenderPass;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessRenderPass.js.map
