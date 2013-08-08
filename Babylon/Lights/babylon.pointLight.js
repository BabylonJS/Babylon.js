var BABYLON = BABYLON || {};

(function () {
    BABYLON.PointLight = function (name, position, scene) {
        this.name = name;
        this.id = name;
        this.position = position;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        this._scene = scene;

        scene.lights.push(this);

        // Animations
        this.animations = [];
    };
    
    BABYLON.PointLight.prototype = Object.create(BABYLON.Light.prototype);
    
    BABYLON.PointLight.prototype.getShadowGenerator = function () {
        return null;
    };
})();