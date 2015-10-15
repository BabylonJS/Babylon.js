var BABYLON;
(function (BABYLON) {
    var SolidParticle = (function () {
        function SolidParticle(particleIndex, positionIndex, shape, shapeUV, shapeId) {
            this.shapeId = shapeId;
            this.color = new BABYLON.Color4(1, 1, 1, 1);
            this.position = BABYLON.Vector3.Zero();
            this.rotation = BABYLON.Vector3.Zero();
            this.scale = new BABYLON.Vector3(1, 1, 1);
            this.uvs = new BABYLON.Vector4(0, 0, 1, 1);
            this.velocity = BABYLON.Vector3.Zero();
            this.alive = true;
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._shape = shape;
            this._shapeUV = shapeUV;
        }
        return SolidParticle;
    })();
    BABYLON.SolidParticle = SolidParticle;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.solidParticle.js.map