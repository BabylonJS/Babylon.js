module BABYLON {
    
        export class SolidParticle {
            public idx: number = 0;                         // particle global index
            public color = new Color4(1.0, 1.0, 1.0, 1.0);  // color
            public position = Vector3.Zero();               // position
            public rotation = Vector3.Zero();               // rotation
            public rotationQuaternion: Quaternion;          // quaternion, will overwrite rotation
            public scaling = Vector3.One();                 // scaling
            public uvs = new Vector4(0.0, 0.0, 1.0, 1.0);   // uvs
            public velocity = Vector3.Zero();               // velocity
            public alive = true;                            // alive
            public isVisible = true;                        // visibility
            public _pos: number = 0;                        // index of this particle in the global "positions" array
            public _ind: number = 0;                        // index of this particle in the global "indices" array
            public _model: ModelShape;                      // model shape reference
            public shapeId: number = 0;                     // model shape id
            public idxInShape: number = 0;                  // index of the particle in its shape id
            public _modelBoundingInfo: BoundingInfo;        // reference to the shape model BoundingInfo object
            public _boundingInfo: BoundingInfo;             // particle BoundingInfo
            public _sps: SolidParticleSystem;               // reference to the SPS what the particle belongs to
            public _stillInvisible: boolean = false;         // still set as invisible in order to skip useless computations
    
            /**
             * Creates a Solid Particle object.
             * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
             * `particleIndex` (integer) is the particle index in the Solid Particle System pool. It's also the particle identifier.  
             * `positionIndex` (integer) is the starting index of the particle vertices in the SPS "positions" array.
             * `indiceIndex` (integer) is the starting index of the particle indices in the SPS "indices" array.
             * `model` (ModelShape) is a reference to the model shape on what the particle is designed.  
             * `shapeId` (integer) is the model shape identifier in the SPS.
             * `idxInShape` (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
             * `modelBoundingInfo` is the reference to the model BoundingInfo used for intersection computations.
             */
            constructor(particleIndex: number, positionIndex: number, indiceIndex: number, model: ModelShape, shapeId: number, idxInShape: number, sps: SolidParticleSystem, modelBoundingInfo?: BoundingInfo) {
                this.idx = particleIndex;
                this._pos = positionIndex;
                this._ind = indiceIndex;
                this._model = model;
                this.shapeId = shapeId;
                this.idxInShape = idxInShape;
                this._sps = sps;
                if (modelBoundingInfo) {
                    this._modelBoundingInfo = modelBoundingInfo;
                    this._boundingInfo = new BoundingInfo(modelBoundingInfo.minimum, modelBoundingInfo.maximum);
                }
            }
    
            /**
             * legacy support, changed scale to scaling
             */
            public get scale(): Vector3 {
                return this.scaling;
            }
    
            public set scale(scale: Vector3) {
                this.scaling = scale;
            }
    
            /**
             * legacy support, changed quaternion to rotationQuaternion
             */ 
            public get quaternion(): Quaternion {
                return this.rotationQuaternion;
            }
    
            public set quaternion(q: Quaternion) {
                this.rotationQuaternion = q;
            }
    
            /**
             * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
             * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
             * `target` is the object (solid particle or mesh) what the intersection is computed against.
             */
            public intersectsMesh(target: Mesh | SolidParticle): boolean {
                if (!this._boundingInfo || !target._boundingInfo) {
                    return false;
                }
                if (this._sps._bSphereOnly) {
                    return BoundingSphere.Intersects(this._boundingInfo.boundingSphere, target._boundingInfo.boundingSphere);
                }
                return this._boundingInfo.intersects(target._boundingInfo, false);
            }
        }
    
        export class ModelShape {
            public shapeID: number;
            public _shape: Vector3[];                   // flat array of model positions
            public _shapeUV: number[];                  // flat array of model UVs
            public _indicesLength: number = 0;          // length of the shape in the model indices array
            public _positionFunction: (particle: SolidParticle, i: number, s: number) => void;
            public _vertexFunction: (particle: SolidParticle, vertex: Vector3, i: number) => void;
    
            /**
             * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
             * SPS internal tool, don't use it manually.  
             */
            constructor(id: number, shape: Vector3[], indicesLength: number, shapeUV: number[], posFunction: (particle: SolidParticle, i: number, s: number) => void, vtxFunction: (particle: SolidParticle, vertex: Vector3, i: number) => void) {
                this.shapeID = id;
                this._shape = shape;
                this._indicesLength = indicesLength;
                this._shapeUV = shapeUV;
                this._positionFunction = posFunction;
                this._vertexFunction = vtxFunction;
            }
        }
    
        export class DepthSortedParticle {
            public ind: number = 0;                      // index of the particle in the "indices" array
            public indicesLength: number = 0;            // length of the particle shape in the "indices" array
            public sqDistance: number = 0.0;             // squared distance from the particle to the camera
        }
    }
    
    
    