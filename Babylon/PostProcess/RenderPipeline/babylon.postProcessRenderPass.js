"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.PostProcessRenderPass = function PostProcessRenderPass(scene, name, size, renderList, beforeRender, afterRender) {
		this._name = name;
		this._enabled = true;

		this._renderList = renderList;

		this._renderTexture = new BABYLON.RenderTargetTexture(name, size, scene);
		this.setRenderList(renderList);

		this._renderTexture.onBeforeRender = beforeRender;
		this._renderTexture.onAfterRender = afterRender;

		this._scene = scene;

		this._refCount = 0;
	};

	BABYLON.PostProcessRenderPass.prototype.incRefCount = function () {
	    if (this._refCount == 0) {
	        this._scene.customRenderTargets.push(this._renderTexture);
	    }

	    this._refCount++;
	};

	BABYLON.PostProcessRenderPass.prototype.decRefCount = function () {
	    this._refCount--;

	    if (this._refCount <= 0) {
	        this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(this._renderTexture), 1);
	    }
	};

	BABYLON.PostProcessRenderPass.prototype.setRenderList = function (renderList) {
		this._renderTexture.renderList = renderList;
	};

	BABYLON.PostProcessRenderPass.prototype.getRenderTexture = function () {
		return this._renderTexture;
	};

	BABYLON.PostProcessRenderPass.prototype._update = function () {
		this.setRenderList(this._renderList);
	};
})();