var BABYLON = BABYLON || {};

(function () {
    BABYLON.Light = function (name, scene) {
        this.name = name;
        this.id = name;

        this._scene = scene;

        scene.lights.push(this);
    };
    
    // Members
    BABYLON.Light.prototype.intensity = 1.0;
    BABYLON.Light.prototype.isEnabled = true;
    
    // Properties
    BABYLON.Light.prototype.getScene = function () {
        return this._scene;
    };

    BABYLON.Light.prototype.getShadowGenerator = function() {
        return this._shadowGenerator;
    };

    // Methods
    BABYLON.Light.prototype.dispose = function () {
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
            this._shadowGenerator = null;
        }
        
        // Remove from scene
        var index = this._scene.lights.indexOf(this);
        this._scene.lights.splice(index, 1);
    };

})();