"use strict";

var BABYLON = BABYLON || {};

(function () {    
    BABYLON.CubeTexture = function (rootUrl, scene, extensions, noMipmap) {
        this._scene = scene;
        this._scene.textures.push(this);
        
        this.name = rootUrl;
        this.url = rootUrl;
        this._noMipmap = noMipmap;
        this.hasAlpha = false;
        this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;

        this._texture = this._getFromCache(rootUrl, noMipmap);

        if (!extensions) {
            extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
        }

        this._extensions = extensions;
        
        if (!this._texture) {
            if (!scene.useDelayedTextureLoading) {
                this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, extensions, noMipmap);
            } else {
                this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
            }            
        }
        
        this.isCube = true;

        this._textureMatrix = BABYLON.Matrix.Identity();
    };

    BABYLON.CubeTexture.prototype = Object.create(BABYLON.BaseTexture.prototype);

    // Methods
    BABYLON.CubeTexture.prototype.delayLoad = function () {
        if (this.delayLoadState != BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
            return;
        }

        this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap);

        if (!this._texture) {
            this._texture = this._scene.getEngine().createCubeTexture(this.url, this._scene, this._extensions);
        }
    };

    BABYLON.CubeTexture.prototype._computeReflectionTextureMatrix = function() {
        return this._textureMatrix;
    };
})();