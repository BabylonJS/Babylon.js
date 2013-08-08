var BABYLON = BABYLON || {};

(function () {
    BABYLON.DirectionalLight = function (name, direction, scene) {
        this.name = name;
        this.id = name;
        this.position = direction.scale(-1);
        this.direction = direction;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        this._scene = scene;

        scene.lights.push(this);
        
        // Animations
        this.animations = [];
    };
    
    BABYLON.DirectionalLight.prototype = Object.create(BABYLON.Light.prototype);
})();