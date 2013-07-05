var BABYLON = BABYLON || {};

(function () {
    BABYLON.SpotLight = function (name, position, direction, angle, exponent, scene) {
        this.name = name;
        this.id = name;
        this.position = position;
        this.direction = direction;
        this.angle = angle;
        this.exponent = exponent;
        this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        this._scene = scene;

        scene.lights.push(this);

        // Animations
        this.animations = [];
    };
    
    BABYLON.SpotLight.prototype = Object.create(BABYLON.Light.prototype);
})();