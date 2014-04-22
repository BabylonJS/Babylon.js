var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var HemisphericLight = (function (_super) {
        __extends(HemisphericLight, _super);
        //ANY
        function HemisphericLight(name, direction, scene) {
            _super.call(this, name, scene);
            this.direction = direction;
            this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        }
        //ANY
        HemisphericLight.prototype.getShadowGenerator = function () {
            return null;
        };

        //ANY
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
        return HemisphericLight;
    })(BABYLON.Light);
    BABYLON.HemisphericLight = HemisphericLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.hemisphericLight.js.map
