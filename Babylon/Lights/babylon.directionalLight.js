"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.DirectionalLight = function (name, direction, scene) {
        BABYLON.Light.call(this, name, scene);

        this.position = direction.scale(-1);
        this.direction = direction;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
    };
    
    BABYLON.DirectionalLight.prototype = Object.create(BABYLON.Light.prototype);
    
    // Methods
    BABYLON.DirectionalLight.prototype._computeTransformedPosition = function () {
        if (this.parent && this.parent.getWorldMatrix) {
            if (!this._transformedPosition) {
                this._transformedPosition = BABYLON.Vector3.Zero();
            }

            BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._transformedPosition);
            return true;
        }

        return false;
    };

    BABYLON.DirectionalLight.prototype.transferToEffect = function (effect, directionUniformName) {
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
    
    BABYLON.DirectionalLight.prototype._getWorldMatrix = function () {
        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }

        BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

        return this._worldMatrix;
    };
})();