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
            this._texture = scene.getEngine().createCubeTexture(rootUrl);
        }
        
        this.isCube = true;
    };

    BABYLON.CubeTexture.prototype = Object.create(BABYLON.BaseTexture.prototype);
})();