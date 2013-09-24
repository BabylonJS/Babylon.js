var BABYLON = BABYLON || {};

(function () {    
    BABYLON.CubeTexture = function (rootUrl, scene) {
        this._scene = scene;
        this._scene.textures.push(this);
        
        this.name = rootUrl;
        this.url = rootUrl;
        this.hasAlpha = false;
        this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;

        this._texture = this._getFromCache(rootUrl);
        
        if (!this._texture) {
            if (!scene.useDelayedTextureLoading) {
                this._texture = scene.getEngine().createCubeTexture(rootUrl, scene);
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
        this._texture = this._getFromCache(this.url);

        if (!this._texture) {
            this._texture = this._scene.getEngine().createCubeTexture(this.url, this._scene);
        }
    };

    BABYLON.CubeTexture.prototype._computeReflectionTextureMatrix = function() {
        return this._textureMatrix;
    };
})();