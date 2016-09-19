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
    var PointLight = (function (_super) {
        __extends(PointLight, _super);
        function PointLight(name, position, scene) {
            _super.call(this, name, scene);
            this.position = position;
        }
        PointLight.prototype.getAbsolutePosition = function () {
            return this.transformedPosition ? this.transformedPosition : this.position;
        };
        PointLight.prototype.computeTransformedPosition = function () {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
                return true;
            }
            return false;
        };
        PointLight.prototype.transferToEffect = function (effect, positionUniformName) {
            if (this.parent && this.parent.getWorldMatrix) {
                this.computeTransformedPosition();
                effect.setFloat4(positionUniformName, this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, 0);
                return;
            }
            if (this.getScene().useRightHandedSystem) {
                effect.setFloat4(positionUniformName, -this.position.x, -this.position.y, -this.position.z, 0);
            }
            else {
                effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, 0);
            }
        };
        PointLight.prototype.needCube = function () {
            return true;
        };
        PointLight.prototype.supportsVSM = function () {
            return false;
        };
        PointLight.prototype.needRefreshPerFrame = function () {
            return false;
        };
        PointLight.prototype.getShadowDirection = function (faceIndex) {
            switch (faceIndex) {
                case 0:
                    return new BABYLON.Vector3(1, 0, 0);
                case 1:
                    return new BABYLON.Vector3(-1, 0, 0);
                case 2:
                    return new BABYLON.Vector3(0, -1, 0);
                case 3:
                    return new BABYLON.Vector3(0, 1, 0);
                case 4:
                    return new BABYLON.Vector3(0, 0, 1);
                case 5:
                    return new BABYLON.Vector3(0, 0, -1);
            }
            return BABYLON.Vector3.Zero();
        };
        PointLight.prototype.setShadowProjectionMatrix = function (matrix, viewMatrix, renderList) {
            var activeCamera = this.getScene().activeCamera;
            BABYLON.Matrix.PerspectiveFovLHToRef(Math.PI / 2, 1.0, activeCamera.minZ, activeCamera.maxZ, matrix);
        };
        PointLight.prototype._getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);
            return this._worldMatrix;
        };
        PointLight.prototype.getTypeID = function () {
            return 0;
        };
        __decorate([
            BABYLON.serializeAsVector3()
        ], PointLight.prototype, "position", void 0);
        return PointLight;
    }(BABYLON.Light));
    BABYLON.PointLight = PointLight;
})(BABYLON || (BABYLON = {}));
