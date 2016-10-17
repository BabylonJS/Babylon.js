var BABYLON;
(function (BABYLON) {
    var SolidParticle = (function () {
        function SolidParticle(particleIndex, positionIndex, model, shapeId, idxInShape, modelBoundingInfo) {
            this.idx = 0; // particle global index
            this.color = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0); // color
            this.position = BABYLON.Vector3.Zero(); // position
            this.rotation = BABYLON.Vector3.Zero(); // rotation
            this.scaling = new BABYLON.Vector3(1.0, 1.0, 1.0); // scaling
            this.uvs = new BABYLON.Vector4(0.0, 0.0, 1.0, 1.0); // uvs
            this.velocity = BABYLON.Vector3.Zero(); // velocity
            this.alive = true; // alive
            this.isVisible = true; // visibility
            this._pos = 0; // index of this particle in the global "positions" array
            this.shapeId = 0; // model shape id
            this.idxInShape = 0; // index of the particle in its shape id
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._model = model;
            this.shapeId = shapeId;
            this.idxInShape = idxInShape;
            if (modelBoundingInfo) {
                this._modelBoundingInfo = modelBoundingInfo;
                this._boundingInfo = new BABYLON.BoundingInfo(modelBoundingInfo.minimum, modelBoundingInfo.maximum);
            }
        }
        Object.defineProperty(SolidParticle.prototype, "scale", {
            //legacy support, changed scale to scaling
            get: function () {
                return this.scaling;
            },
            set: function (scale) {
                this.scaling = scale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticle.prototype, "quaternion", {
            //legacy support, changed quaternion to rotationQuaternion
            get: function () {
                return this.rotationQuaternion;
            },
            set: function (q) {
                this.rotationQuaternion = q;
            },
            enumerable: true,
            configurable: true
        });
        SolidParticle.prototype.intersectsMesh = function (target) {
            if (!(this.isVisible && target.isVisible)) {
                return false; // only visible particle and target can intersect
            }
            if (!this._boundingInfo || !target._boundingInfo) {
                return false;
            }
            return this._boundingInfo.intersects(target._boundingInfo, false);
        };
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
