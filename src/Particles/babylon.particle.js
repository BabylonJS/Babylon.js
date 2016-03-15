var BABYLON;
(function (BABYLON) {
    var Particle = (function () {
        function Particle() {
            this.position = BABYLON.Vector3.Zero();
            this.direction = BABYLON.Vector3.Zero();
            this.color = new BABYLON.Color4(0, 0, 0, 0);
            this.colorStep = new BABYLON.Color4(0, 0, 0, 0);
            this.lifeTime = 1.0;
            this.age = 0;
            this.size = 0;
            this.angle = 0;
            this.angularSpeed = 0;
        }
        Particle.prototype.copyTo = function (other) {
            other.position.copyFrom(this.position);
            other.direction.copyFrom(this.direction);
            other.color.copyFrom(this.color);
            other.colorStep.copyFrom(this.colorStep);
            other.lifeTime = this.lifeTime;
            other.age = this.age;
            other.size = this.size;
            other.angle = this.angle;
            other.angularSpeed = this.angularSpeed;
        };
        return Particle;
    })();
    BABYLON.Particle = Particle;
})(BABYLON || (BABYLON = {}));
