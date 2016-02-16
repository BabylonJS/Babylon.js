var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var DirectionalLight = (function (_super) {
        __extends(DirectionalLight, _super);
        function DirectionalLight(name, direction, scene) {
            _super.call(this, name, scene);
            this.direction = direction;
            this.shadowOrthoScale = 0.5;
            this.autoUpdateExtends = true;
            // Cache
            this._orthoLeft = Number.MAX_VALUE;
            this._orthoRight = Number.MIN_VALUE;
            this._orthoTop = Number.MIN_VALUE;
            this._orthoBottom = Number.MAX_VALUE;
            this.position = direction.scale(-1);
        }
        DirectionalLight.prototype.getAbsolutePosition = function () {
            return this.transformedPosition ? this.transformedPosition : this.position;
        };
        DirectionalLight.prototype.setDirectionToTarget = function (target) {
            this.direction = BABYLON.Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        };
        DirectionalLight.prototype.setShadowProjectionMatrix = function (matrix, viewMatrix, renderList) {
            var activeCamera = this.getScene().activeCamera;
            // Check extends
            if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
                var tempVector3 = BABYLON.Vector3.Zero();
                this._orthoLeft = Number.MAX_VALUE;
                this._orthoRight = Number.MIN_VALUE;
                this._orthoTop = Number.MIN_VALUE;
                this._orthoBottom = Number.MAX_VALUE;
                for (var meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                    var mesh = renderList[meshIndex];
                    if (!mesh) {
                        continue;
                    }
                    var boundingInfo = mesh.getBoundingInfo();
                    if (!boundingInfo) {
                        continue;
                    }
                    var boundingBox = boundingInfo.boundingBox;
                    for (var index = 0; index < boundingBox.vectorsWorld.length; index++) {
                        BABYLON.Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);
                        if (tempVector3.x < this._orthoLeft)
                            this._orthoLeft = tempVector3.x;
                        if (tempVector3.y < this._orthoBottom)
                            this._orthoBottom = tempVector3.y;
                        if (tempVector3.x > this._orthoRight)
                            this._orthoRight = tempVector3.x;
                        if (tempVector3.y > this._orthoTop)
                            this._orthoTop = tempVector3.y;
                    }
                }
            }
            var xOffset = this._orthoRight - this._orthoLeft;
            var yOffset = this._orthoTop - this._orthoBottom;
            BABYLON.Matrix.OrthoOffCenterLHToRef(this._orthoLeft - xOffset * this.shadowOrthoScale, this._orthoRight + xOffset * this.shadowOrthoScale, this._orthoBottom - yOffset * this.shadowOrthoScale, this._orthoTop + yOffset * this.shadowOrthoScale, -activeCamera.maxZ, activeCamera.maxZ, matrix);
        };
        DirectionalLight.prototype.supportsVSM = function () {
            return true;
        };
        DirectionalLight.prototype.needRefreshPerFrame = function () {
            return true;
        };
        DirectionalLight.prototype.needCube = function () {
            return false;
        };
        DirectionalLight.prototype.getShadowDirection = function (faceIndex) {
            return this.direction;
        };
        DirectionalLight.prototype.computeTransformedPosition = function () {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = BABYLON.Vector3.Zero();
                }
                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
                return true;
            }
            return false;
        };
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
        DirectionalLight.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = 1;
            serializationObject.position = this.position.asArray();
            serializationObject.direction = this.direction.asArray();
            return serializationObject;
        };
        return DirectionalLight;
    })(BABYLON.Light);
    BABYLON.DirectionalLight = DirectionalLight;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.directionalLight.js.map