module BABYLON {

    export class SolidParticle {
        public idx: number = 0;                         // particle global index
        public color = new Color4(1.0, 1.0, 1.0, 1.0);  // color
        public position = Vector3.Zero();               // position
        public rotation = Vector3.Zero();               // rotation
        public rotationQuaternion: Quaternion;          // quaternion, will overwrite rotation
        public scaling = new Vector3(1.0, 1.0, 1.0);    // scaling
        public uvs = new Vector4(0.0, 0.0, 1.0, 1.0);   // uvs
        public velocity = Vector3.Zero();               // velocity
        public alive = true;                            // alive
        public isVisible = true;                        // visibility
        public _pos: number = 0;                        // index of this particle in the global "positions" array
        public _model: ModelShape;                      // model shape reference
        public shapeId: number = 0;                     // model shape id
        public idxInShape: number = 0;                  // index of the particle in its shape id
        public _modelBoundingInfo: BoundingInfo;        // reference to the shape model BoundingInfo object
        public _boundingInfo: BoundingInfo;             // particle BoundingInfo

        constructor(particleIndex: number, positionIndex: number, model: ModelShape, shapeId: number, idxInShape: number, modelBoundingInfo?: BoundingInfo) {
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._model = model;
            this.shapeId = shapeId;
            this.idxInShape = idxInShape;
            if (modelBoundingInfo) {
                this._modelBoundingInfo = modelBoundingInfo;
                this._boundingInfo = new BoundingInfo(modelBoundingInfo.minimum, modelBoundingInfo.maximum);
            }
        }

        //legacy support, changed scale to scaling
        public get scale(): Vector3 {
            return this.scaling;
        }

        public set scale(scale: Vector3) {
            this.scaling = scale;
        }

        //legacy support, changed quaternion to rotationQuaternion
        public get quaternion(): Quaternion {
            return this.rotationQuaternion;
        }

        public set quaternion(q: Quaternion) {
            this.rotationQuaternion = q;
        }

        public intersectsMesh(target: Mesh | SolidParticle): boolean {
            if (!(this.isVisible && target.isVisible)) {
                return false;       // only visible particle and target can intersect
            }
            if (!this._boundingInfo || !target._boundingInfo) {
                return false;
            }
            return this._boundingInfo.intersects(target._boundingInfo, false);
        }
    }

    export class ModelShape {
        public shapeID: number;
        public _shape: Vector3[];
        public _shapeUV: number[];
        public _positionFunction: (particle: SolidParticle, i: number, s: number) => void;
        public _vertexFunction: (particle: SolidParticle, vertex: Vector3, i: number) => void;

        constructor(id: number, shape: Vector3[], shapeUV: number[], posFunction: (particle: SolidParticle, i: number, s: number) => void, vtxFunction: (particle: SolidParticle, vertex: Vector3, i: number) => void) {
            this.shapeID = id;
            this._shape = shape;
            this._shapeUV = shapeUV;
            this._positionFunction = posFunction;
            this._vertexFunction = vtxFunction;
        }
    }
}


