var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPipelineManager = (function () {
        function PostProcessRenderPipelineManager() {
            this._renderPipelines = {};
        }
        PostProcessRenderPipelineManager.prototype.addPipeline = function (renderPipeline) {
            this._renderPipelines[renderPipeline._name] = renderPipeline;
        };
        PostProcessRenderPipelineManager.prototype.attachCamerasToRenderPipeline = function (renderPipelineName, cameras, unique) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._attachCameras(cameras, unique);
        };
        PostProcessRenderPipelineManager.prototype.detachCamerasFromRenderPipeline = function (renderPipelineName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._detachCameras(cameras);
        };
        PostProcessRenderPipelineManager.prototype.enableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._enableEffect(renderEffectName, cameras);
        };
        PostProcessRenderPipelineManager.prototype.disableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._disableEffect(renderEffectName, cameras);
        };
        PostProcessRenderPipelineManager.prototype.enableDisplayOnlyPassInPipeline = function (renderPipelineName, passName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._enableDisplayOnlyPass(passName, cameras);
        };
        PostProcessRenderPipelineManager.prototype.disableDisplayOnlyPassInPipeline = function (renderPipelineName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];
            if (!renderPipeline) {
                return;
            }
            renderPipeline._disableDisplayOnlyPass(cameras);
        };
        PostProcessRenderPipelineManager.prototype.update = function () {
            for (var renderPipelineName in this._renderPipelines) {
                var pipeline = this._renderPipelines[renderPipelineName];
                if (!pipeline.isSupported) {
                    pipeline.dispose();
                    delete this._renderPipelines[renderPipelineName];
                }
                else {
                    pipeline._update();
                }
            }
        };
        return PostProcessRenderPipelineManager;
    })();
    BABYLON.PostProcessRenderPipelineManager = PostProcessRenderPipelineManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessRenderPipelineManager.js.map