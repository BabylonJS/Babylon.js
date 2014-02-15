"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.RenderTargetTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;
        this._size = size;
        this._generateMipMaps = generateMipMaps;

        this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);

        // Render list
        this.renderList = [];

        // Rendering groups
        this._renderingManager = new BABYLON.RenderingManager(scene);
    };

    BABYLON.RenderTargetTexture.prototype = Object.create(BABYLON.Texture.prototype);

    // Members        
    BABYLON.RenderTargetTexture.prototype.renderParticles = true;
    BABYLON.RenderTargetTexture.prototype.renderSprites = false;
    BABYLON.RenderTargetTexture.prototype.isRenderTarget = true;
    BABYLON.RenderTargetTexture.prototype.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;

    // Methods  
    BABYLON.RenderTargetTexture.prototype.onBeforeRender = null;
    BABYLON.RenderTargetTexture.prototype.onAfterRender = null;

    BABYLON.RenderTargetTexture.prototype.resize = function (size, generateMipMaps) {
        this.releaseInternalTexture();
        this._texture = this._scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
    };

    BABYLON.RenderTargetTexture.prototype.render = function () {

        if (this.onBeforeRender) {
            this.onBeforeRender();
        }

        var scene = this._scene;
        var engine = scene.getEngine();

        if (this._waitingRenderList) {
            this.renderList = [];
            for (var index = 0; index < this._waitingRenderList.length; index++) {
                var id = this._waitingRenderList[index];
                this.renderList.push(this._scene.getMeshByID(id));
            }

            delete this._waitingRenderList;
        }

        if (!this.renderList || this.renderList.length == 0) {
            if (this.onAfterRender) {
                this.onAfterRender();
            }
            return;
        }

        // Bind
        engine.bindFramebuffer(this._texture);

        // Clear
        engine.clear(scene.clearColor, true, true);

        this._renderingManager.reset();

        for (var meshIndex = 0; meshIndex < this.renderList.length; meshIndex++) {
            var mesh = this.renderList[meshIndex];

            if (mesh && mesh.isEnabled() && mesh.isVisible) {
                for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                    var subMesh = mesh.subMeshes[subIndex];
                    scene._activeVertices += subMesh.verticesCount;
                    this._renderingManager.dispatch(subMesh);
                }
            }
        }

        // Render
        this._renderingManager.render(this.customRenderFunction, this.renderList, this.renderParticles, this.renderSprites);

        // Unbind
        engine.unBindFramebuffer(this._texture);

        if (this.onAfterRender) {
            this.onAfterRender();
        }
    };

    BABYLON.RenderTargetTexture.prototype.clone = function () {
        var textureSize = this.getSize();
        var newTexture = new BABYLON.RenderTargetTexture(this.name, textureSize.width, this._scene, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;
        newTexture.renderList = this.renderList.slice(0);

        return newTexture;
    };

})();