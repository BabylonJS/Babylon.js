var BABYLON = BABYLON || {};

(function () {
    BABYLON.DynamicTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;

        this.wrapU = false;
        this.wrapV = false;

        this._texture = scene.getEngine().createDynamicTexture(size, generateMipMaps);
        var size = this.getSize();

        this._canvas = document.createElement("canvas");
        this._canvas.width = size.width;
        this._canvas.height = size.height;
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
