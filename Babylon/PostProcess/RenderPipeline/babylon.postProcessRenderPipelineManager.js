var BABYLON;
(function (BABYLON) {
    var PostProcessRenderPipelineManager = (function () {
        function PostProcessRenderPipelineManager() {
            this._renderPipelines = [];
        }
        PostProcessRenderPipelineManager.prototype.addPipeline = function (renderPipeline) {
            this._renderPipelines[renderPipeline._name] = renderPipeline;
        };

        PostProcessRenderPipelineManager.prototype.attachCamerasToRenderPipeline = function (renderPipelineName, cameras, unique) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.attachCameras(cameras, unique);
        };

        PostProcessRenderPipelineManager.prototype.detachCamerasFromRenderPipeline = function (renderPipelineName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.detachCameras(cameras);
        };

        PostProcessRenderPipelineManager.prototype.enableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableEffect(renderEffectName, cameras);
        };

        PostProcessRenderPipelineManager.prototype.disableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.disableEffect(renderEffectName, cameras);
        };

        PostProcessRenderPipelineManager.prototype.enableDisplayOnlyPassInPipeline = function (renderPipelineName, passName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableDisplayOnlyPass(passName, cameras);
        };

        PostProcessRenderPipelineManager.prototype.disableDisplayOnlyPassInPipeline = function (renderPipelineName, cameras) {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.disableDisplayOnlyPass(cameras);
        };

        PostProcessRenderPipelineManager.prototype.update = function () {
            for (var renderPipelineName in this._renderPipelines) {
                this._renderPipelines[renderPipelineName]._update();
            }
        };
        return PostProcessRenderPipelineManager;
    })();
    BABYLON.PostProcessRenderPipelineManager = PostProcessRenderPipelineManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.postProcessRenderPipelineManager.js.map
