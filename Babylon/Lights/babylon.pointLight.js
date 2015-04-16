var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var PointLight = (function (_super) {
        __extends(PointLight, _super);
        function PointLight(name, position, scene) {
            _super.call(this, name, scene);
            this.position = position;
        }
        PointLight.prototype.getAbsolutePosition = function () {
            return this._transformedPosition ? this._transformedPosition : this.position;
        };
        PointLight.prototype.transferToEffect = function (effect, positionUniformName) {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedPosition) {
                    this._transformedPosition = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._transformedPosition);
                effect.setFloat4(positionUniformName, this._transformedPosition.x, this._transformedPosition.y, this._transformedPosition.z, 0);
                return;
            }
            effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, 0);
        };
        PointLight.prototype.getShadowGenerator = function () {
            return null;
        };
        PointLight.prototype._getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);
            return this._worldMatrix;
        };
        return PointLight;
    })(BABYLON.Light);
    BABYLON.PointLight = PointLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.pointLight.js.map