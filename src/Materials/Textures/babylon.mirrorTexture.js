var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var MirrorTexture = (function (_super) {
        __extends(MirrorTexture, _super);
        function MirrorTexture(name, size, scene, generateMipMaps) {
            var _this = this;
            _super.call(this, name, size, scene, generateMipMaps, true);
            this.mirrorPlane = new BABYLON.Plane(0, 1, 0, 1);
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._mirrorMatrix = BABYLON.Matrix.Zero();
            this.onBeforeRender = function () {
                BABYLON.Matrix.ReflectionToRef(_this.mirrorPlane, _this._mirrorMatrix);
                _this._savedViewMatrix = scene.getViewMatrix();
                _this._mirrorMatrix.multiplyToRef(_this._savedViewMatrix, _this._transformMatrix);
                scene.setTransformMatrix(_this._transformMatrix, scene.getProjectionMatrix());
                scene.clipPlane = _this.mirrorPlane;
                scene.getEngine().cullBackFaces = false;
                scene._mirroredCameraPosition = BABYLON.Vector3.TransformCoordinates(scene.activeCamera.position, _this._mirrorMatrix);
            };
            this.onAfterRender = function () {
                scene.setTransformMatrix(_this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;
                delete scene.clipPlane;
            };
        }
        MirrorTexture.prototype.clone = function () {
            var textureSize = this.getSize();
            var newTexture = new MirrorTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // Mirror Texture
            newTexture.mirrorPlane = this.mirrorPlane.clone();
            newTexture.renderList = this.renderList.slice(0);
            return newTexture;
        };
        MirrorTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.mirrorPlane = this.mirrorPlane.asArray();
            return serializationObject;
        };
        return MirrorTexture;
    })(BABYLON.RenderTargetTexture);
    BABYLON.MirrorTexture = MirrorTexture;
})(BABYLON || (BABYLON = {}));
