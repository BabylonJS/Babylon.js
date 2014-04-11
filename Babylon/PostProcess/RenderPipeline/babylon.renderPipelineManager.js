"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.RenderPipelineManager = function RenderPipelineManager() {
		this._renderPipelines = [];
	};

	BABYLON.RenderPipelineManager.prototype.addPipeline = function(renderPipeline) {
		this._renderPipelines[renderPipeline._name] = renderPipeline;
	};

	BABYLON.RenderPipelineManager.prototype.update = function () {
		for (var renderPipelineName in this._renderPipelines) {
			this._renderPipelines[renderPipelineName]._update();
		}
	};

	BABYLON.RenderPipelineManager.prototype.attachCamerasToRenderPipeline = function (renderPipelineName, cameras, unique) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.attachCameras(cameras, unique);
	};

	BABYLON.RenderPipelineManager.prototype.detachCamerasFromRenderPipeline = function (renderPipelineName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.detachCameras(cameras);
	};


	BABYLON.RenderPipelineManager.prototype.enableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.enableEffect(renderEffectName, cameras);
	};

	BABYLON.RenderPipelineManager.prototype.disableEffectInPipeline = function (renderPipelineName, renderEffectName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.disableEffect(renderEffectName, cameras);
	};


	BABYLON.RenderPipelineManager.prototype.enableDisplayOnlyPassInPipeline = function (renderPipelineName, passName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.enableDisplayOnlyPass(passName, cameras);
	};

	BABYLON.RenderPipelineManager.prototype.disableDisplayOnlyPassInPipeline = function (renderPipelineName, cameras) {
		var renderPipeline = this._renderPipelines[renderPipelineName];

		if (!renderPipeline) {
			return;
		}

		renderPipeline.disableDisplayOnlyPass(cameras);
	};
})();