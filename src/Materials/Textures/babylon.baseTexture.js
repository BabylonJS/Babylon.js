var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var BaseTexture = (function () {
        function BaseTexture(scene) {
            this.hasAlpha = false;
            this.getAlphaFromRGB = false;
            this.level = 1;
            this.coordinatesIndex = 0;
            this.coordinatesMode = BABYLON.Texture.EXPLICIT_MODE;
            this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            this.anisotropicFilteringLevel = 4;
            this.isCube = false;
            this.isRenderTarget = false;
            this.animations = new Array();
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
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
            if (!this.isReady() || !this._texture)
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
        BaseTexture.prototype.clone = function () {
            return null;
        };
        BaseTexture.prototype.releaseInternalTexture = function () {
            if (this._texture) {
                this._scene.getEngine().releaseInternalTexture(this._texture);
                delete this._texture;
            }
        };
        BaseTexture.prototype.dispose = function () {
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            var index = this._scene.textures.indexOf(this);
            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }
            if (this._texture === undefined) {
                return;
            }
            // Release
            this.releaseInternalTexture();
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        BaseTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            // Animations
            BABYLON.Animation.AppendSerializedAnimations(this, serializationObject);
            return serializationObject;
        };
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "name", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "hasAlpha", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "getAlphaFromRGB", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "level", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "coordinatesIndex", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "coordinatesMode", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "wrapU", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "wrapV", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "anisotropicFilteringLevel", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "isCube", void 0);
        __decorate([
            BABYLON.serialize()
        ], BaseTexture.prototype, "isRenderTarget", void 0);
        return BaseTexture;
    }());
    BABYLON.BaseTexture = BaseTexture;
})(BABYLON || (BABYLON = {}));
