"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.PostProcessRenderPipeline = function PostProcessRenderPipeline(engine, name) {
		this._engine = engine;

		this._name = name;

		this._renderEffects = [];
		this._renderEffectsPasses = [];

		this._cameras = [];
	};

	BABYLON.PostProcessRenderPipeline.prototype.addEffect = function (renderEffect) {
		this._renderEffects[renderEffect._name] = renderEffect;
	};

	BABYLON.PostProcessRenderPipeline.prototype.enableEffect = function (renderEffectName, cameras) {
	    cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		var renderEffects = this._renderEffects[renderEffectName];

		if (!renderEffects) {
			return;
		}

		renderEffects.enable(cameras);
	};

	BABYLON.PostProcessRenderPipeline.prototype.disableEffect = function (renderEffectName, cameras) {
	    cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		var renderEffects = this._renderEffects[renderEffectName];

		if (!renderEffects) {
			return;
		}

		renderEffects.disable(cameras);
	};

	BABYLON.PostProcessRenderPipeline.prototype.attachCameras = function (cameras, unique) {
		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);
		
		var indicesToDelete = [];

		for (var i = 0; i < cameras.length; i++) {
			if (this._cameras.indexOf(cameras[i]) == -1) {
				this._cameras.push(cameras[i]);
			}
			else if(unique) {
				indicesToDelete.push(i);
			}
		}

		for (var i = 0; i < indicesToDelete.length; i++) {
			cameras.splice(indicesToDelete[i], 1);
		}

		for(var renderEffectName in this._renderEffects) {
			this._renderEffects[renderEffectName].attachCameras(cameras);
		}
	};

	BABYLON.PostProcessRenderPipeline.prototype.detachCameras = function (cameras) {
		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		for (var renderEffectName in this._renderEffects) {
			this._renderEffects[renderEffectName].detachCameras(cameras);
		}

		for (var i = 0; i < cameras.length; i++) {
			this._cameras.splice(this._cameras.indexOf(cameras[i]), 1);
		}
	};

	BABYLON.PostProcessRenderPipeline.prototype.enableDisplayOnlyPass = function (passName, cameras) {
		cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		var pass = null;

		for (var renderEffectName in this._renderEffects) {
			pass = this._renderEffects[renderEffectName].getPass(passName);

			if (pass != null) {
				break;
			}
		}

		if (pass == null) {
			return;
		}
		
		for (var renderEffectName in this._renderEffects) {
			this._renderEffects[renderEffectName].disable(cameras);
		}
		
		pass._name = BABYLON.PostProcessRenderPipeline.PASS_SAMPLER_NAME;
		
		for (var i = 0; i < cameras.length; i++) {
		    this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new BABYLON.RenderEffect(this._engine, BABYLON.PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0);
			this._renderEffectsPasses[cameras[i].name].emptyPasses();
			this._renderEffectsPasses[cameras[i].name].addPass(pass);
			this._renderEffectsPasses[cameras[i].name].attachCameras(cameras[i]);
		}
	};

	BABYLON.PostProcessRenderPipeline.prototype.disableDisplayOnlyPass = function (cameras) {
	    cameras = BABYLON.Tools.MakeArray(cameras || this._cameras);

		for (var i = 0; i < cameras.length; i++) {
		    this._renderEffectsPasses[cameras[i].name] = this._renderEffectsPasses[cameras[i].name] || new BABYLON.RenderEffect(this._engine, BABYLON.PostProcessRenderPipeline.PASS_EFFECT_NAME, "BABYLON.DisplayPassPostProcess", 1.0);
		    this._renderEffectsPasses[cameras[i].name].disable(cameras[i]);
		}

		for (var renderEffectName in this._renderEffects) {
			this._renderEffects[renderEffectName].enable(cameras);
		}
	};

	BABYLON.PostProcessRenderPipeline.prototype._update = function () {
		for (var renderEffectName in this._renderEffects) {
			this._renderEffects[renderEffectName]._update();
		}

		for(var i = 0; i < this._cameras.length; i++) {
			if (this._renderEffectsPasses[this._cameras[i]]) {
				this._renderEffectsPasses[this._cameras[i]]._update();
			}
		}
	};

	BABYLON.PostProcessRenderPipeline.PASS_EFFECT_NAME = "passEffect";
	BABYLON.PostProcessRenderPipeline.PASS_SAMPLER_NAME = "passSampler";
})();