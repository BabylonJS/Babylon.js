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
    
})();