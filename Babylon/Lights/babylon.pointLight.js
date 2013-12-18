"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PointLight = function (name, position, scene) {
        BABYLON.Light.call(this, name, scene);
        
        this.position = position;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
    };
    
    BABYLON.PointLight.prototype = Object.create(BABYLON.Light.prototype);
    
    // Methods
    BABYLON.PointLight.prototype.transferToEffect = function (effect, positionUniformName) {
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

    BABYLON.PointLight.prototype.getShadowGenerator = function () {
        return null;
    };
    
    BABYLON.PointLight.prototype._getWorldMatrix = function () {
        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }

        BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

        return this._worldMatrix;
    };
})();