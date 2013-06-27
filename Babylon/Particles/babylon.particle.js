var BABYLON = BABYLON || {};

(function () {
    BABYLON.Particle = function () {
    };
    
    BABYLON.Particle.prototype.position = null;
    BABYLON.Particle.prototype.direction = null;
    BABYLON.Particle.prototype.lifeTime = 1.0;
    BABYLON.Particle.prototype.age = 0;
    BABYLON.Particle.prototype.size = 0;
    BABYLON.Particle.prototype.angle = 0;
    BABYLON.Particle.prototype.angularSpeed = 0;
    BABYLON.Particle.prototype.color = null;
    BABYLON.Particle.prototype.colorStep = null;
})();