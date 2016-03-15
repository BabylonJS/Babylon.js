var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
    * Creates a refraction texture used by refraction channel of the standard material.
    * @param name the texture name
    * @param size size of the underlying texture
    * @param scene root scene
    */
    var RefractionTexture = (function (_super) {
        __extends(RefractionTexture, _super);
        function RefractionTexture(name, size, scene, generateMipMaps) {
            var _this = this;
            _super.call(this, name, size, scene, generateMipMaps, true);
            this.refractionPlane = new BABYLON.Plane(0, 1, 0, 1);
            this.depth = 2.0;
            this.onBeforeRender = function () {
                scene.clipPlane = _this.refractionPlane;
            };
            this.onAfterRender = function () {
                delete scene.clipPlane;
            };
        }
        RefractionTexture.prototype.clone = function () {
            var textureSize = this.getSize();
            var newTexture = new RefractionTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // Refraction Texture
            newTexture.refractionPlane = this.refractionPlane.clone();
            newTexture.renderList = this.renderList.slice(0);
            newTexture.depth = this.depth;
            return newTexture;
        };
        RefractionTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.mirrorPlane = this.refractionPlane.asArray();
            serializationObject.depth = this.depth;
            return serializationObject;
        };
        return RefractionTexture;
    })(BABYLON.RenderTargetTexture);
    BABYLON.RefractionTexture = RefractionTexture;
})(BABYLON || (BABYLON = {}));
