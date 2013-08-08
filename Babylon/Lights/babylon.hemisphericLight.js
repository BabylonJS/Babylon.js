var BABYLON = BABYLON || {};

(function () {
    BABYLON.HemisphericLight = function (name, direction, scene) {
        this.name = name;
        this.id = name;
        this.direction = direction;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);
        this._scene = scene;

        scene.lights.push(this);

        // Animations
        this.animations = [];
    };
    
    BABYLON.HemisphericLight.prototype = Object.create(BABYLON.Light.prototype);
    
    BABYLON.HemisphericLight.prototype.getShadowGenerator = function () {
        return null;
    };
})();