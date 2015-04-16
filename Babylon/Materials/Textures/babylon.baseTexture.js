var BABYLON;
(function (BABYLON) {
    var BaseTexture = (function () {
        function BaseTexture(scene) {
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.hasAlpha = false;
            this.getAlphaFromRGB = false;
            this.level = 1;
            this.isCube = false;
            this.isRenderTarget = false;
            this.animations = new Array();
            this.coordinatesIndex = 0;
            this.coordinatesMode = BABYLON.Texture.EXPLICIT_MODE;
            this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.anisotropicFilteringLevel = 4;
            this._scene = scene;
            this._scene.textures.push(this);
        }
        BaseTexture.prototype.getScene = function () {
            return this._scene;
        };
        BaseTexture.prototype.getTextureMatrix = function () {
            return null;
        };
        BaseTexture.prototype.getReflectionTextureMatrix = function () {
            return null;
        };
        BaseTexture.prototype.getInternalTexture = function () {
            return this._texture;
        };
        BaseTexture.prototype.isReady = function () {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return true;
            }
            if (this._texture) {
                return this._texture.isReady;
            }
            return false;
        };
        BaseTexture.prototype.getSize = function () {
            if (this._texture._width) {
                return { width: this._texture._width, height: this._texture._height };
            }
            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }
            return { width: 0, height: 0 };
        };
        BaseTexture.prototype.getBaseSize = function () {
            if (!this.isReady())
                return { width: 0, height: 0 };
            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }
            return { width: this._texture._baseWidth, height: this._texture._baseHeight };
        };
        BaseTexture.prototype.scale = function (ratio) {
        };
        Object.defineProperty(BaseTexture.prototype, "canRescale", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        BaseTexture.prototype._removeFromCache = function (url, noMipmap) {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];
                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    texturesCache.splice(index, 1);
                    return;
                }
            }
        };
        BaseTexture.prototype._getFromCache = function (url, noMipmap, sampling) {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];
                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                        texturesCacheEntry.references++;
                        return texturesCacheEntry;
                    }
                }
            }
            return null;
        };
        BaseTexture.prototype.delayLoad = function () {
        };
        BaseTexture.prototype.releaseInternalTexture = function () {
            if (!this._texture) {
                return;
            }
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            this._texture.references--;
            // Final reference ?
            if (this._texture.references === 0) {
                var index = texturesCache.indexOf(this._texture);
                texturesCache.splice(index, 1);
                this._scene.getEngine()._releaseTexture(this._texture);
                delete this._texture;
            }
        };
        BaseTexture.prototype.clone = function () {
            return null;
        };
        BaseTexture.prototype.dispose = function () {
            // Remove from scene
            var index = this._scene.textures.indexOf(this);
            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }
            if (this._texture === undefined) {
                return;
            }
            this.releaseInternalTexture();
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        return BaseTexture;
    })();
    BABYLON.BaseTexture = BaseTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.baseTexture.js.map