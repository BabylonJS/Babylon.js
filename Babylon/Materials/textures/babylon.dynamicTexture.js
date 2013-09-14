var BABYLON = BABYLON || {};

(function () {
    BABYLON.DynamicTexture = function (name, size, scene, generateMipMaps) {
        this._scene = scene;
        this._scene.textures.push(this);

        this.name = name;

        this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

        this._generateMipMaps = generateMipMaps;

        this._texture = scene.getEngine().createDynamicTexture(size, generateMipMaps);
        var textureSize = this.getSize();

        this._canvas = document.createElement("canvas");
        this._canvas.width = textureSize.width;
        this._canvas.height = textureSize.height;
        this._context = this._canvas.getContext("2d");
    };

    BABYLON.DynamicTexture.prototype = Object.create(BABYLON.Texture.prototype);

    // Methods
    BABYLON.DynamicTexture.prototype.getContext = function () {
        return this._context;
    };

    BABYLON.DynamicTexture.prototype.update = function (invertY) {
        this._scene.getEngine().updateDynamicTexture(this._texture, this._canvas, invertY === undefined ? true : invertY);
    };

    BABYLON.DynamicTexture.prototype.drawText = function (text, x, y, font, color, clearColor, invertY) {
        var size = this.getSize();
        if (clearColor) {
            this._context.fillStyle = clearColor;
            this._context.fillRect(0, 0, size.width, size.height);
        }
        
        this._context.font = font;
        if (x === null) {
            var textSize = this._context.measureText(text);
            x = (size.width - textSize.width) / 2;
        }

        this._context.fillStyle = color;
        this._context.fillText(text, x, y);

        this.update(invertY);
    };
    
    BABYLON.DynamicTexture.prototype.clone = function () {
        var textureSize = this.getSize();
        var newTexture = new BABYLON.DynamicTexture(this.name, textureSize.width, this._scene, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Dynamic Texture
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;

        return newTexture;
    };
})();
