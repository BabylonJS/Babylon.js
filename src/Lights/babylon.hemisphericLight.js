var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var HemisphericLight = (function (_super) {
        __extends(HemisphericLight, _super);
        function HemisphericLight(name, direction, scene) {
            _super.call(this, name, scene);
            this.groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);
            this.direction = direction;
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
        HemisphericLight.prototype.getTypeID = function () {
            return 3;
        };
        __decorate([
            BABYLON.serializeAsColor3()
        ], HemisphericLight.prototype, "groundColor", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], HemisphericLight.prototype, "direction", void 0);
        return HemisphericLight;
    }(BABYLON.Light));
    BABYLON.HemisphericLight = HemisphericLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.hemisphericLight.js.map