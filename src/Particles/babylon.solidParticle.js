var BABYLON;
(function (BABYLON) {
    var SolidParticle = (function () {
        function SolidParticle(particleIndex, positionIndex, model, shapeId, idxInShape) {
            this.color = new BABYLON.Color4(1, 1, 1, 1); // color
            this.position = BABYLON.Vector3.Zero(); // position
            this.rotation = BABYLON.Vector3.Zero(); // rotation
            this.scale = new BABYLON.Vector3(1, 1, 1); // scale
            this.uvs = new BABYLON.Vector4(0, 0, 1, 1); // uvs
            this.velocity = BABYLON.Vector3.Zero(); // velocity
            this.alive = true; // alive
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._model = model;
            this.shapeId = shapeId;
            this.idxInShape = idxInShape;
        }
        return SolidParticle;
    }());
    BABYLON.SolidParticle = SolidParticle;
    var ModelShape = (function () {
        function ModelShape(id, shape, shapeUV, posFunction, vtxFunction) {
            this.shapeID = id;
            this._shape = shape;
            this._shapeUV = shapeUV;
            this._positionFunction = posFunction;
            this._vertexFunction = vtxFunction;
        }
        return ModelShape;
    }());
    BABYLON.ModelShape = ModelShape;
})(BABYLON || (BABYLON = {}));
