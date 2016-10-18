var BABYLON;
(function (BABYLON) {
    var SolidParticle = (function () {
        /**
         * Creates a Solid Particle object.
         * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
         * `particleIndex` (integer) is the particle index in the Solid Particle System pool. It's also the particle identifier.
         * `positionIndex` (integer) is the starting index of the particle vertices in the SPS "positions" array.
         *  `model` (ModelShape) is a reference to the model shape on what the particle is designed.
         * `shapeId` (integer) is the model shape identifier in the SPS.
         * `idxInShape` (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
         * `modelBoundingInfo` is the reference to the model BoundingInfo used for intersection computations.
         */
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
            /**
             * legacy support, changed scale to scaling
             */
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
            /**
             * legacy support, changed quaternion to rotationQuaternion
             */
            get: function () {
                return this.rotationQuaternion;
            },
            set: function (q) {
                this.rotationQuaternion = q;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
         * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
         * `target` is the object (solid particle or mesh) what the intersection is computed against.
         */
        SolidParticle.prototype.intersectsMesh = function (target) {
            if (!this._boundingInfo || !target._boundingInfo) {
                return false;
            }
            return this._boundingInfo.intersects(target._boundingInfo, false);
        };
        return SolidParticle;
    }());
    BABYLON.SolidParticle = SolidParticle;
    var ModelShape = (function () {
        /**
         * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
         * SPS internal tool, don't use it manually.
         */
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
