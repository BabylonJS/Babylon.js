"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.HemisphericLight = function (name, direction, scene) {
        BABYLON.Light.call(this, name, scene);
        
        this.direction = direction;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    };
    
    BABYLON.HemisphericLight.prototype = Object.create(BABYLON.Light.prototype);
    
    // Properties
    BABYLON.HemisphericLight.prototype.getShadowGenerator = function () {
        return null;
    };
    
    // Methods
    BABYLON.HemisphericLight.prototype._getWorldMatrix = function () {
        if (!this._worldMatrix) {
            this._worldMatrix = BABYLON.Matrix.Identity();
        }

        return this._worldMatrix;
    };

    BABYLON.HemisphericLight.prototype.transferToEffect = function (effect, directionUniformName, groundColorUniformName) {
        var normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
        effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
        effect.setColor3(groundColorUniformName, this.groundColor.scale(this.intensity));
    };
})();