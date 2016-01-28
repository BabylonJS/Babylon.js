var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var HemisphericLight = (function (_super) {
        __extends(HemisphericLight, _super);
        function HemisphericLight(name, direction, scene) {
            _super.call(this, name, scene);
            this.direction = direction;
            this.groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        }
        HemisphericLight.prototype.setDirectionToTarget = function (target) {
            this.direction = BABYLON.Vector3.Normalize(target.subtract(BABYLON.Vector3.Zero()));
            return this.direction;
        };
        HemisphericLight.prototype.getShadowGenerator = function () {
            return null;
        };
        HemisphericLight.prototype.transferToEffect = function (effect, directionUniformName, groundColorUniformName) {
            var normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
            effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
            effect.setColor3(groundColorUniformName, this.groundColor.scale(this.intensity));
        };
        HemisphericLight.prototype._getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            return this._worldMatrix;
        };
        HemisphericLight.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = 3;
            serializationObject.direction = this.direction.asArray();
            serializationObject.groundColor = this.groundColor.asArray();
            return serializationObject;
        };
        return HemisphericLight;
    })(BABYLON.Light);
    BABYLON.HemisphericLight = HemisphericLight;
})(BABYLON || (BABYLON = {}));
