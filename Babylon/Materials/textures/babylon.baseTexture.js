var BABYLON = BABYLON || {};

(function () {
    BABYLON.BaseTexture = function (url, scene) {
        this._scene = scene;
        this._scene.textures.push(this);
    };

    // Members
    BABYLON.BaseTexture.prototype.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
    BABYLON.BaseTexture.prototype.hasAlpha = false;
    BABYLON.BaseTexture.prototype.hasAlpha = false;
    BABYLON.BaseTexture.prototype.level = 1;
    BABYLON.BaseTexture.prototype._texture = null;

    BABYLON.BaseTexture.prototype.onDispose = null;

    // Properties
    BABYLON.BaseTexture.prototype.getInternalTexture = function () {
        return this._texture;
    };

    BABYLON.BaseTexture.prototype.isReady = function (required) {
        if (!required && this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
            return true;
        }

        if (this._texture) {
            return this._texture.isReady;
        }

        return false;
    };

    // Methods
    BABYLON.BaseTexture.prototype.getSize = function () {
        if (this._texture._width) {
            return { width: this._texture._width, height: this._texture._height };
        }

        if (this._texture._size) {
            return { width: this._texture._size, height: this._texture._size };
        }

        return { width: 0, height: 0 };
    };

    BABYLON.BaseTexture.prototype.getBaseSize = function () {
        if (!this.isReady())
            return { width: 0, height: 0 };

        if (this._texture._size) {
            return { width: this._texture._size, height: this._texture._size };
        }

        return { width: this._texture._baseWidth, height: this._texture._baseHeight };
    };

    BABYLON.BaseTexture.prototype._getFromCache = function (url, noMipmap) {
        var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
        for (var index = 0; index < texturesCache.length; index++) {
            var texturesCacheEntry = texturesCache[index];

            if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                texturesCacheEntry.references++;
                return texturesCacheEntry;
            }
        }

        return null;
    };

    BABYLON.BaseTexture.prototype.delayLoad = function () {
    };

    BABYLON.BaseTexture.prototype.releaseInternalTexture = function () {
        if (!this._texture) {
            return;
        }
        var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
        this._texture.references--;

        // Final reference ?
        if (this._texture.references == 0) {
            var index = texturesCache.indexOf(this._texture);
            texturesCache.splice(index, 1);

            this._scene.getEngine()._releaseTexture(this._texture);

            delete this._texture;
        }
    };

    BABYLON.BaseTexture.prototype.dispose = function () {
        if (this._texture === undefined) {
            return;
        }

        this.releaseInternalTexture();

        // Remove from scene
        var index = this._scene.textures.indexOf(this);
        this._scene.textures.splice(index, 1);

        // Callback
        if (this.onDispose) {
            this.onDispose();
        }
    };
})();