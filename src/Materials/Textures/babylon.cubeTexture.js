var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var CubeTexture = (function (_super) {
        __extends(CubeTexture, _super);
        function CubeTexture(rootUrl, scene, extensions, noMipmap, files) {
            _super.call(this, scene);
            this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;
            this.name = rootUrl;
            this.url = rootUrl;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            if (!rootUrl && !files) {
                return;
            }
            this._texture = this._getFromCache(rootUrl, noMipmap);
            if (!files) {
                if (!extensions) {
                    extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
                }
                files = [];
                for (var index = 0; index < extensions.length; index++) {
                    files.push(rootUrl + extensions[index]);
                }
                this._extensions = extensions;
            }
            this._files = files;
            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, files, noMipmap);
                }
                else {
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
            this.isCube = true;
            this._textureMatrix = BABYLON.Matrix.Identity();
        }
        CubeTexture.CreateFromImages = function (files, scene, noMipmap) {
            return new CubeTexture("", scene, null, noMipmap, files);
        };
        // Methods
        CubeTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);
            if (!this._texture) {
                this._texture = this.getScene().getEngine().createCubeTexture(this.url, this.getScene(), this._extensions);
            }
        };
        CubeTexture.prototype.getReflectionTextureMatrix = function () {
            return this._textureMatrix;
        };
        CubeTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = BABYLON.SerializationHelper.Parse(function () {
                return new BABYLON.CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions);
            }, parsedTexture, scene);
            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];
                    texture.animations.push(BABYLON.Animation.Parse(parsedAnimation));
                }
            }
            return texture;
        };
        CubeTexture.prototype.clone = function () {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () {
                return new CubeTexture(_this.url, _this.getScene(), _this._extensions, _this._noMipmap, _this._files);
            }, this);
        };
        return CubeTexture;
    }(BABYLON.BaseTexture));
    BABYLON.CubeTexture = CubeTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.cubeTexture.js.map