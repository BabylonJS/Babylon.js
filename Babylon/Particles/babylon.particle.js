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
        return Particle;
    })();
    BABYLON.Particle = Particle;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.particle.js.map
