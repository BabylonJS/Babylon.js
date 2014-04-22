var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var DirectionalLight = (function (_super) {
        __extends(DirectionalLight, _super);
        //ANY
        function DirectionalLight(name, direction, scene) {
            _super.call(this, name, scene);
            this.direction = direction;
            this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);

            this.position = direction.scale(-1);
        }
        DirectionalLight.prototype._computeTransformedPosition = function () {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedPosition) {
                    this._transformedPosition = BABYLON.Vector3.Zero();
                }

                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._transformedPosition);
                return true;
            }

            return false;
        };

        //ANY
        DirectionalLight.prototype.transferToEffect = function (effect, directionUniformName) {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = BABYLON.Vector3.Zero();
                }

                BABYLON.Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(directionUniformName, this._transformedDirection.x, this._transformedDirection.y, this._transformedDirection.z, 1);

                return;
            }

            effect.setFloat4(directionUniformName, this.direction.x, this.direction.y, this.direction.z, 1);
        };

        DirectionalLight.prototype._getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        };
        return DirectionalLight;
    })(BABYLON.Light);
    BABYLON.DirectionalLight = DirectionalLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.directionalLight.js.map
