var BABYLON = BABYLON || {};

(function () {
    BABYLON.Particle = function () {
        this.position = BABYLON.Vector3.Zero();
        this.direction = BABYLON.Vector3.Zero();
        this.color = new BABYLON.Color4(0, 0, 0, 0);
        this.colorStep = new BABYLON.Color4(0, 0, 0, 0);
    };    

    BABYLON.Particle.prototype.lifeTime = 1.0;
    BABYLON.Particle.prototype.age = 0;
    BABYLON.Particle.prototype.size = 0;
    BABYLON.Particle.prototype.angle = 0;
    BABYLON.Particle.prototype.angularSpeed = 0;
})();