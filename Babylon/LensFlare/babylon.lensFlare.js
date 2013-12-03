"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.LensFlare = function (size, position, color, imgUrl, system) {
        this.color = color || new BABYLON.Color3(1, 1, 1);
        this.position = position;
        this.size = size;
        this.texture = imgUrl ? new BABYLON.Texture(imgUrl, system.getScene(), true) : null;
        this._system = system;
        
        system.lensFlares.push(this);
    };
    
    // Properties
    BABYLON.LensFlare.prototype.position = 0;
    BABYLON.LensFlare.prototype.size = 1.0;
    BABYLON.LensFlare.prototype.texture = null;
    
    // Methods
    BABYLON.LensFlare.prototype.dispose = function() {
        if (this.texture) {
            this.texture.dispose();
        }
        
        // Remove from scene
        var index = this._system.lensFlares.indexOf(this);
        this._system.lensFlares.splice(index, 1);
    };
    
})();