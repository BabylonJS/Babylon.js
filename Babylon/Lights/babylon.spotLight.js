"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.SpotLight = function (name, position, direction, angle, exponent, scene) {
        BABYLON.Light.call(this, name, scene);
        
        this.position = position;
        this.direction = direction;
        this.angle = angle;
        this.exponent = exponent;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
    };
    
    BABYLON.SpotLight.prototype = Object.create(BABYLON.Light.prototype);
    
    // Methods
    BABYLON.SpotLight.prototype.transferToEffect = function (effect, positionUniformName, directionUniformName) {
        var normalizeDirection;
        
        if (this.parent && this.parent.getWorldMatrix) {
            if (!this._transformedDirection) {
                this._transformedDirection = BABYLON.Vector3.Zero();
            }
            if (!this._transformedPosition) {
                this._transformedPosition = BABYLON.Vector3.Zero();
            }
            
            var parentWorldMatrix = this.parent.getWorldMatrix();

            BABYLON.Vector3.TransformCoordinatesToRef(this.position, parentWorldMatrix, this._transformedPosition);
            BABYLON.Vector3.TransformNormalToRef(this.direction, parentWorldMatrix, this._transformedDirection);

            effect.setFloat4(positionUniformName, this._transformedPosition.x, this._transformedPosition.y, this._transformedPosition.z, this.exponent);
            normalizeDirection = BABYLON.Vector3.Normalize(this._transformedDirection);
        } else {
            effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, this.exponent);
            normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
        }

        effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(this.angle * 0.5));
    };

    BABYLON.SpotLight.prototype._getWorldMatrix = function () {
        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }

        BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

        return this._worldMatrix;
    };
})();