"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.RenderPass = function (scene, name, size, renderList, beforeRender, afterRender) {
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

	BABYLON.RenderPass.prototype.incRefCount = function () {
	    if (this._refCount == 0) {
	        this._scene.customRenderTargets.push(this._renderTexture);
	    }

	    this._refCount++;
	};

	BABYLON.RenderPass.prototype.decRefCount = function () {
	    this._refCount--;

	    if (this._refCount <= 0) {
	        this._scene.customRenderTargets.splice(this._scene.customRenderTargets.indexOf(this._renderTexture), 1);
	    }
	};

	BABYLON.RenderPass.prototype.setRenderList = function (renderList) {
		this._renderTexture.renderList = renderList;
	};

	BABYLON.RenderPass.prototype.getRenderTexture = function () {
		return this._renderTexture;
	};

	BABYLON.RenderPass.prototype._update = function () {
		this.setRenderList(this._renderList);
	};
})();