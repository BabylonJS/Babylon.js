var BABYLON = BABYLON || {};

(function () {    
    BABYLON.CubeTexture = function (rootUrl, scene) {
        this._scene = scene;
        this._scene.textures.push(this);
        
        this.name = rootUrl;
        this.hasAlpha = false;
        this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;

        this._texture = this._getFromCache(rootUrl);
        
        if (!this._texture) {
            this._texture = scene.getEngine().createCubeTexture(rootUrl, scene);
        }
        
        this.isCube = true;

        this._textureMatrix = BABYLON.Matrix.Identity();
    };

    BABYLON.CubeTexture.prototype = Object.create(BABYLON.BaseTexture.prototype);

    BABYLON.CubeTexture.prototype._computeReflectionTextureMatrix = function() {
        return this._textureMatrix;
    };
})();