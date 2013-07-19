var BABYLON = BABYLON || {};

(function () {
    BABYLON.DynamicTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;

        this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

        this._texture = scene.getEngine().createDynamicTexture(size, generateMipMaps);
        var textureSize = this.getSize();

        this._canvas = document.createElement("canvas");
        this._canvas.width = textureSize.width;
        this._canvas.height = textureSize.height;
        this._context = this._canvas.getContext("2d");
    };

    BABYLON.DynamicTexture.prototype = Object.create(BABYLON.Texture.prototype);
    
    // Methods
    BABYLON.DynamicTexture.prototype.getContext = function() {
        return this._context;
    };
    
    BABYLON.DynamicTexture.prototype.update = function () {
        this._scene.getEngine().updateDynamicTexture(this._texture, this._canvas);
    };
})();
