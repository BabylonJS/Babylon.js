module BABYLON {
    /**
     * Represents one particle of a solid particle system.
     */
    export class SolidParticle {
        /**
         * particle global index
         */
        public idx: number = 0;
        /**
         * The color of the particle
         */
        public color: Nullable<Color4> = new Color4(1.0, 1.0, 1.0, 1.0);
        /**
         * The world space position of the particle.
         */
        public position: Vector3 = Vector3.Zero();
        /**
         * The world space rotation of the particle. (Not use if rotationQuaternion is set)
         */
        public rotation: Vector3 = Vector3.Zero();
        /**
         * The world space rotation quaternion of the particle.
         */
        public rotationQuaternion: Nullable<Quaternion>;
        /**
         * The scaling of the particle.
         */
        public scaling: Vector3 = Vector3.One();
        /**
         * The uvs of the particle.
         */
        public uvs: Vector4 = new Vector4(0.0, 0.0, 1.0, 1.0);
        /**
         * The current speed of the particle.
         */
        public velocity: Vector3 = Vector3.Zero();
        /**
         * The pivot point in the particle local space.
         */
        public pivot: Vector3 = Vector3.Zero();
        /**
         * Must the particle be translated from its pivot point in its local space ?
         * In this case, the pivot point is set at the origin of the particle local space and the particle is translated.
         * Default : false
         */
        public translateFromPivot: boolean = false;
        /**
         * Is the particle active or not ?
         */
        public alive: boolean = true;
        /**
         * Is the particle visible or not ?
         */
        public isVisible: boolean = true;
        /**
         * Index of this particle in the global "positions" array (Internal use)
         * @hidden
         */
        public _pos: number = 0;
        /**
         * @hidden Index of this particle in the global "indices" array (Internal use)
         */
        public _ind: number = 0;
        /**
         * @hidden ModelShape of this particle (Internal use)
         */
        public _model: ModelShape;
        /**
         * ModelShape id of this particle
         */
        public shapeId: number = 0;
        /**
         * Index of the particle in its shape id (Internal use)
         */
        public idxInShape: number = 0;
        /**
         * @hidden Reference to the shape model BoundingInfo object (Internal use)
         */
        public _modelBoundingInfo: BoundingInfo;
        /**
         * @hidden Particle BoundingInfo object (Internal use)
         */
        public _boundingInfo: BoundingInfo;
        /**
         * @hidden Reference to the SPS what the particle belongs to (Internal use)
         */
        public _sps: SolidParticleSystem;
        /**
         * @hidden Still set as invisible in order to skip useless computations (Internal use)
         */
        public _stillInvisible: boolean = false;
        /**
         * @hidden Last computed particle rotation matrix
         */
        public _rotationMatrix: number[] = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];
        /**
         * Parent particle Id, if any.
         * Default null.
         */
        public parentId: Nullable<number> = null;
        /**
         * @hidden Internal global position in the SPS.
         */
        public _globalPosition: Vector3 = Vector3.Zero();

        /**
         * Creates a Solid Particle object.
         * Don't create particles manually, use instead the Solid Particle System internal tools like _addParticle()
         * @param particleIndex (integer) is the particle index in the Solid Particle System pool. It's also the particle identifier.
         * @param positionIndex (integer) is the starting index of the particle vertices in the SPS "positions" array.
         * @param indiceIndex (integer) is the starting index of the particle indices in the SPS "indices" array.
         * @param model (ModelShape) is a reference to the model shape on what the particle is designed.
         * @param shapeId (integer) is the model shape identifier in the SPS.
         * @param idxInShape (integer) is the index of the particle in the current model (ex: the 10th box of addShape(box, 30))
         * @param modelBoundingInfo is the reference to the model BoundingInfo used for intersection computations.
         */
        constructor(particleIndex: number, positionIndex: number, indiceIndex: number, model: Nullable<ModelShape>, shapeId: number, idxInShape: number, sps: SolidParticleSystem, modelBoundingInfo: Nullable<BoundingInfo> = null) {
            this.idx = particleIndex;
            this._pos = positionIndex;
            this._ind = indiceIndex;
            this._model = <ModelShape>model;
            this.shapeId = shapeId;
            this.idxInShape = idxInShape;
            this._sps = sps;
            if (modelBoundingInfo) {
                this._modelBoundingInfo = modelBoundingInfo;
                this._boundingInfo = new BoundingInfo(modelBoundingInfo.minimum, modelBoundingInfo.maximum);
            }
        }

        /**
         * Legacy support, changed scale to scaling
         */
        public get scale(): Vector3 {
            return this.scaling;
        }

        /**
         * Legacy support, changed scale to scaling
         */
        public set scale(scale: Vector3) {
            this.scaling = scale;
        }

        /**
         * Legacy support, changed quaternion to rotationQuaternion
         */
        public get quaternion(): Nullable<Quaternion> {
            return this.rotationQuaternion;
        }

        /**
         * Legacy support, changed quaternion to rotationQuaternion
         */
        public set quaternion(q: Nullable<Quaternion>) {
            this.rotationQuaternion = q;
        }

        /**
         * Returns a boolean. True if the particle intersects another particle or another mesh, else false.
         * The intersection is computed on the particle bounding sphere and Axis Aligned Bounding Box (AABB)
         * @param target is the object (solid particle or mesh) what the intersection is computed against.
         * @returns true if it intersects
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

        /**
         * get the rotation matrix of the particle
         * @hidden
         */
        public getRotationMatrix(m : Matrix) {
            let quaternion: Quaternion;
            if (this.rotationQuaternion) {
                quaternion = this.rotationQuaternion;
            }
            else {
                quaternion = Tmp.Quaternion[0];
                const rotation = this.rotation;
                Quaternion.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, quaternion);
            }

            quaternion.toRotationMatrix(m);
        }
    }

    /**
     * Represents the shape of the model used by one particle of a solid particle system.
     * SPS internal tool, don't use it manually.
     */
    export class ModelShape {
        /**
         * The shape id
         * @hidden
         */
        public shapeID: number;
        /**
         * flat array of model positions (internal use)
         * @hidden
         */
        public _shape: Vector3[];
        /**
         * flat array of model UVs (internal use)
         * @hidden
         */
        public _shapeUV: number[];
        /**
         * length of the shape in the model indices array (internal use)
         * @hidden
         */
        public _indicesLength: number = 0;
        /**
         * Custom position function (internal use)
         * @hidden
         */
        public _positionFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>;
        /**
         * Custom vertex function (internal use)
         * @hidden
         */
        public _vertexFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>;

        /**
         * Creates a ModelShape object. This is an internal simplified reference to a mesh used as for a model to replicate particles from by the SPS.
         * SPS internal tool, don't use it manually.
         * @hidden
         */
        constructor(id: number, shape: Vector3[], indicesLength: number, shapeUV: number[],
            posFunction: Nullable<(particle: SolidParticle, i: number, s: number) => void>, vtxFunction: Nullable<(particle: SolidParticle, vertex: Vector3, i: number) => void>) {
            this.shapeID = id;
            this._shape = shape;
            this._indicesLength = indicesLength;
            this._shapeUV = shapeUV;
            this._positionFunction = posFunction;
            this._vertexFunction = vtxFunction;
        }
    }

    /**
     * Represents a Depth Sorted Particle in the solid particle system.
     */
    export class DepthSortedParticle {
        /**
         * Index of the particle in the "indices" array
         */
        public ind: number = 0;
        /**
         * Length of the particle shape in the "indices" array
         */
        public indicesLength: number = 0;
        /**
         * Squared distance from the particle to the camera
         */
        public sqDistance: number = 0.0;
    }
}
