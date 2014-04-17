"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.PostProcessRenderPipelineManager = function PostProcessRenderPipelineManager() {
		this._renderPipelines = [];
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.addPipeline = function(renderPipeline) {
		this._renderPipelines[renderPipeline._name] = renderPipeline;
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.update = function () {
		for (var renderPipelineName in this._renderPipelines) {
			this._renderPipelines[renderPipelineName]._update();
		}
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.attachCamerasToRenderPipeline = function (renderPipelineName, cameras, unique) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.attachCameras(cameras, unique);
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.detachCamerasFromRenderPipeline = function (renderPipelineName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.detachCameras(cameras);
	};


	BABYLON.PostProcessRenderPipelineManager.prototype.enableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.enableEffect(renderEffectName, cameras);
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.disableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.disableEffect(renderEffectName, cameras);
	};


	BABYLON.PostProcessRenderPipelineManager.prototype.enableDisplayOnlyPassInPipeline = function (renderPipelineName, passName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.enableDisplayOnlyPass(passName, cameras);
	};

	BABYLON.PostProcessRenderPipelineManager.prototype.disableDisplayOnlyPassInPipeline = function (renderPipelineName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.disableDisplayOnlyPass(cameras);
	};
})();