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
    var SpotLight = (function (_super) {
        __extends(SpotLight, _super);
        function SpotLight(name, position, direction, angle, exponent, scene) {
            _super.call(this, name, scene);
            this.position = position;
            this.direction = direction;
            this.angle = angle;
            this.exponent = exponent;
        }
        SpotLight.prototype.getAbsolutePosition = function () {
            return this.transformedPosition ? this.transformedPosition : this.position;
        };
        SpotLight.prototype.setShadowProjectionMatrix = function (matrix, viewMatrix, renderList) {
            var activeCamera = this.getScene().activeCamera;
            BABYLON.Matrix.PerspectiveFovLHToRef(this.angle, 1.0, activeCamera.minZ, activeCamera.maxZ, matrix);
        };
        SpotLight.prototype.needCube = function () {
            return false;
        };
        SpotLight.prototype.supportsVSM = function () {
            return true;
        };
        SpotLight.prototype.needRefreshPerFrame = function () {
            return false;
        };
        SpotLight.prototype.getShadowDirection = function (faceIndex) {
            return this.direction;
        };
        SpotLight.prototype.setDirectionToTarget = function (target) {
            this.direction = BABYLON.Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        };
        SpotLight.prototype.computeTransformedPosition = function () {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
                return true;
            }
            return false;
        };
        SpotLight.prototype.transferToEffect = function (effect, positionUniformName, directionUniformName) {
            var normalizeDirection;
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = BABYLON.Vector3.Zero();
                }
                this.computeTransformedPosition();
                BABYLON.Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(positionUniformName, this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, this.exponent);
                normalizeDirection = BABYLON.Vector3.Normalize(this._transformedDirection);
            }
            else {
                effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, this.exponent);
                normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
            }
            effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(this.angle * 0.5));
        };
        SpotLight.prototype._getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);
            return this._worldMatrix;
        };
        SpotLight.prototype.getTypeID = function () {
            return 2;
        };
        __decorate([
            BABYLON.serializeAsVector3()
        ], SpotLight.prototype, "position", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], SpotLight.prototype, "direction", void 0);
        __decorate([
            BABYLON.serialize()
        ], SpotLight.prototype, "angle", void 0);
        __decorate([
            BABYLON.serialize()
        ], SpotLight.prototype, "exponent", void 0);
        return SpotLight;
    })(BABYLON.Light);
    BABYLON.SpotLight = SpotLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.spotLight.js.map