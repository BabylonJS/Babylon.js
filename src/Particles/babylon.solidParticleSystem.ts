module BABYLON {
    /**
     * The SPS is a single updatable mesh. The solid particles are simply separate parts or faces fo this big mesh.
     *As it is just a mesh, the SPS has all the same properties than any other BJS mesh : not more, not less. It can be scaled, rotated, translated, enlighted, textured, moved, etc.

     * The SPS is also a particle system. It provides some methods to manage the particles.
     * However it is behavior agnostic. This means it has no emitter, no particle physics, no particle recycler. You have to implement your own behavior.
     *
     * Full documentation here : http://doc.babylonjs.com/overviews/Solid_Particle_System
     */
    export class SolidParticleSystem implements IDisposable {
        /**
         *  The SPS array of Solid Particle objects. Just access each particle as with any classic array.
         *  Example : var p = SPS.particles[i];
         */
        public particles: SolidParticle[] = new Array<SolidParticle>();
        /**
         * The SPS total number of particles. Read only. Use SPS.counter instead if you need to set your own value.
         */
        public nbParticles: number = 0;
        /**
         * If the particles must ever face the camera (default false). Useful for planar particles.
         */
        public billboard: boolean = false;
        /**
         * Recompute normals when adding a shape
         */
        public recomputeNormals: boolean = true;
        /**
         * This a counter ofr your own usage. It's not set by any SPS functions.
         */
        public counter: number = 0;
        /**
         * The SPS name. This name is also given to the underlying mesh.
         */
        public name: string;
        /**
         * The SPS mesh. It's a standard BJS Mesh, so all the methods from the Mesh class are avalaible.
         */
        public mesh: Mesh;
        /**
         * This empty object is intended to store some SPS specific or temporary values in order to lower the Garbage Collector activity.
         * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#garbage-collector-concerns
         */
        public vars: any = {};
        /**
         * This array is populated when the SPS is set as 'pickable'.
         * Each key of this array is a `faceId` value that you can get from a pickResult object.
         * Each element of this array is an object `{idx: int, faceId: int}`.
         * `idx` is the picked particle index in the `SPS.particles` array
         * `faceId` is the picked face index counted within this particle.
         * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#pickable-particles
         */
        public pickedParticles: { idx: number; faceId: number }[];
        /**
         * This array is populated when `enableDepthSort` is set to true.
         * Each element of this array is an instance of the class DepthSortedParticle.
         */
        public depthSortedParticles: DepthSortedParticle[];

        /**
         * If the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster). (Internal use only)
         * @hidden
         */
        public _bSphereOnly: boolean = false;
        /**
         * A number to multiply the boundind sphere radius by in order to reduce it for instance. (Internal use only)
         * @hidden
         */
        public _bSphereRadiusFactor: number = 1.0;

        private _scene: Scene;
        private _positions: number[] = new Array<number>();
        private _indices: number[] = new Array<number>();
        private _normals: number[] = new Array<number>();
        private _colors: number[] = new Array<number>();
        private _uvs: number[] = new Array<number>();
        private _indices32: IndicesArray;           // used as depth sorted array if depth sort enabled, else used as typed indices
        private _positions32: Float32Array;         // updated positions for the VBO
        private _normals32: Float32Array;           // updated normals for the VBO
        private _fixedNormal32: Float32Array;       // initial normal references
        private _colors32: Float32Array;
        private _uvs32: Float32Array;
        private _index: number = 0;  // indices index
        private _updatable: boolean = true;
        private _pickable: boolean = false;
        private _isVisibilityBoxLocked = false;
        private _alwaysVisible: boolean = false;
        private _depthSort: boolean = false;
        private _shapeCounter: number = 0;
        private _copy: SolidParticle = new SolidParticle(0, 0, 0, null, 0, 0, this);
        private _color: Color4 = new Color4(0, 0, 0, 0);
        private _computeParticleColor: boolean = true;
        private _computeParticleTexture: boolean = true;
        private _computeParticleRotation: boolean = true;
        private _computeParticleVertex: boolean = false;
        private _computeBoundingBox: boolean = false;
        private _depthSortParticles: boolean = true;
        private static _cam_axisX = Vector3.Zero();
        private static _cam_axisY = Vector3.Zero();
        private static _cam_axisZ = Vector3.Zero();
        private _axisZ: Vector3 = Axis.Z;
        private _camera: TargetCamera;
        private _camDir: Vector3 = Vector3.Zero();
        private _camInvertedPosition: Vector3 = Vector3.Zero();
        private _rotMatrix: Matrix = new Matrix();
        private _invertMatrix: Matrix = new Matrix();
        private static _rotated: Vector3 = Vector3.Zero();
        private _quaternion: Quaternion = new Quaternion();
        private static _vertex: Vector3 = Vector3.Zero();
        private _mustUnrotateFixedNormals = false;
        private static _minimum: Vector3 = Vector3.Zero();
        private static _maximum: Vector3 = Vector3.Zero();
        private _particlesIntersect: boolean = false;
        private _depthSortFunction: (p1: DepthSortedParticle, p2: DepthSortedParticle) => number =
            function(p1, p2) {
                return (p2.sqDistance - p1.sqDistance);
            };
        private _needs32Bits: boolean = false;
        private _pivotBackTranslation: Vector3 = Vector3.Zero();
        private _scaledPivot: Vector3 = Vector3.Zero();

        /**
         * Creates a SPS (Solid Particle System) object.
         * @param name (String) is the SPS name, this will be the underlying mesh name.
         * @param scene (Scene) is the scene in which the SPS is added.
         * @param updatable (optional boolean, default true) : if the SPS must be updatable or immutable.
         * @param isPickable (optional boolean, default false) : if the solid particles must be pickable.
         * @param enableDepthSort (optional boolean, default false) : if the solid particles must be sorted in the geometry according to their distance to the camera.
         * @param particleIntersection (optional boolean, default false) : if the solid particle intersections must be computed.
         * @param boundingSphereOnly (optional boolean, default false) : if the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster).
         * @param bSphereRadiusFactor (optional float, default 1.0) : a number to multiply the boundind sphere radius by in order to reduce it for instance.
         * @example bSphereRadiusFactor = 1.0 / Math.sqrt(3.0) => the bounding sphere exactly matches a spherical mesh.
         */
        constructor(name: string, scene: Scene, options?: { updatable?: boolean; isPickable?: boolean; enableDepthSort?: boolean; particleIntersection?: boolean; boundingSphereOnly?: boolean; bSphereRadiusFactor?: number }) {
            this.name = name;
            this._scene = scene || Engine.LastCreatedScene;
            this._camera = <TargetCamera>scene.activeCamera;
            this._pickable = options ? <boolean>options.isPickable : false;
            this._depthSort = options ? <boolean>options.enableDepthSort : false;
            this._particlesIntersect = options ? <boolean>options.particleIntersection : false;
            this._bSphereOnly = options ? <boolean>options.boundingSphereOnly : false;
            this._bSphereRadiusFactor = (options && options.bSphereRadiusFactor) ? options.bSphereRadiusFactor : 1.0;
            if (options && options.updatable !== undefined) {
                this._updatable = options.updatable;
            } else {
                this._updatable = true;
            }
            if (this._pickable) {
                this.pickedParticles = [];
            }
            if (this._depthSort) {
                this.depthSortedParticles = [];
            }
        }

        /**
         * Builds the SPS underlying mesh. Returns a standard Mesh.
         * If no model shape was added to the SPS, the returned mesh is just a single triangular plane.
         * @returns the created mesh
         */
        public buildMesh(): Mesh {
            if (this.nbParticles === 0) {
                var triangle = MeshBuilder.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
            }
            this._indices32 = (this._needs32Bits) ? new Uint32Array(this._indices) : new Uint16Array(this._indices);
            this._positions32 = new Float32Array(this._positions);
            this._uvs32 = new Float32Array(this._uvs);
            this._colors32 = new Float32Array(this._colors);
            if (this.recomputeNormals) {
                VertexData.ComputeNormals(this._positions32, this._indices32, this._normals);
            }
            this._normals32 = new Float32Array(this._normals);
            this._fixedNormal32 = new Float32Array(this._normals);
            if (this._mustUnrotateFixedNormals) {  // the particles could be created already rotated in the mesh with a positionFunction
                this._unrotateFixedNormals();
            }

            var vertexData = new VertexData();
            vertexData.indices = (this._depthSort) ? this._indices : this._indices32;
            vertexData.set(this._positions32, VertexBuffer.PositionKind);
            vertexData.set(this._normals32, VertexBuffer.NormalKind);

            if (this._uvs32.length > 0) {
                vertexData.set(this._uvs32, VertexBuffer.UVKind);
            }
            if (this._colors32.length > 0) {
                vertexData.set(this._colors32, VertexBuffer.ColorKind);
            }
            var mesh = new Mesh(this.name, this._scene);
            vertexData.applyToMesh(mesh, this._updatable);
            this.mesh = mesh;
            this.mesh.isPickable = this._pickable;

            // free memory
            if (!this._depthSort) {
                (<any>this._indices) = null;
            }
            (<any>this._positions) = null;
            (<any>this._normals) = null;
            (<any>this._uvs) = null;
            (<any>this._colors) = null;

            if (!this._updatable) {
                this.particles.length = 0;
            }

            return mesh;
        }

        /**
         * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.
         * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
         * Thus the particles generated from `digest()` have their property `position` set yet.
         * @param mesh ( Mesh ) is the mesh to be digested
         * @param options {facetNb} (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
         * {delta} (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
         * {number} (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
         * @returns the current SPS
         */
        public digest(mesh: Mesh, options?: { facetNb?: number; number?: number; delta?: number }): SolidParticleSystem {
            var size: number = (options && options.facetNb) || 1;
            var number: number = (options && options.number) || 0;
            var delta: number = (options && options.delta) || 0;
            var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = <IndicesArray>mesh.getIndices();
            var meshUV = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);
            var meshNor = <FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind);

            var f: number = 0;                              // facet counter
            var totalFacets: number = meshInd.length / 3;   // a facet is a triangle, so 3 indices
            // compute size from number
            if (number) {
                number = (number > totalFacets) ? totalFacets : number;
                size = Math.round(totalFacets / number);
                delta = 0;
            } else {
                size = (size > totalFacets) ? totalFacets : size;
            }

            var facetPos: number[] = [];      // submesh positions
            var facetInd: number[] = [];      // submesh indices
            var facetUV: number[] = [];       // submesh UV
            var facetCol: number[] = [];      // submesh colors
            var barycenter: Vector3 = Vector3.Zero();
            var sizeO: number = size;

            while (f < totalFacets) {
                size = sizeO + Math.floor((1 + delta) * Math.random());
                if (f > totalFacets - size) {
                    size = totalFacets - f;
                }
                // reset temp arrays
                facetPos.length = 0;
                facetInd.length = 0;
                facetUV.length = 0;
                facetCol.length = 0;

                // iterate over "size" facets
                var fi: number = 0;
                for (var j = f * 3; j < (f + size) * 3; j++) {
                    facetInd.push(fi);
                    var i: number = meshInd[j];
                    facetPos.push(meshPos[i * 3], meshPos[i * 3 + 1], meshPos[i * 3 + 2]);
                    if (meshUV) {
                        facetUV.push(meshUV[i * 2], meshUV[i * 2 + 1]);
                    }
                    if (meshCol) {
                        facetCol.push(meshCol[i * 4], meshCol[i * 4 + 1], meshCol[i * 4 + 2], meshCol[i * 4 + 3]);
                    }
                    fi++;
                }

                // create a model shape for each single particle
                var idx: number = this.nbParticles;
                var shape: Vector3[] = this._posToShape(facetPos);
                var shapeUV: number[] = this._uvsToShapeUV(facetUV);

                // compute the barycenter of the shape
                var v: number;
                for (v = 0; v < shape.length; v++) {
                    barycenter.addInPlace(shape[v]);
                }
                barycenter.scaleInPlace(1 / shape.length);

                // shift the shape from its barycenter to the origin
                for (v = 0; v < shape.length; v++) {
                    shape[v].subtractInPlace(barycenter);
                }
                var bInfo;
                if (this._particlesIntersect) {
                    bInfo = new BoundingInfo(barycenter, barycenter);
                }
                var modelShape = new ModelShape(this._shapeCounter, shape, size * 3, shapeUV, null, null);

                // add the particle in the SPS
                var currentPos = this._positions.length;
                var currentInd = this._indices.length;
                this._meshBuilder(this._index, shape, this._positions, facetInd, this._indices, facetUV, this._uvs, facetCol, this._colors, meshNor, this._normals, idx, 0, null);
                this._addParticle(idx, currentPos, currentInd, modelShape, this._shapeCounter, 0, bInfo);
                // initialize the particle position
                this.particles[this.nbParticles].position.addInPlace(barycenter);

                this._index += shape.length;
                idx++;
                this.nbParticles++;
                this._shapeCounter++;
                f += size;
            }
            return this;
        }

        // unrotate the fixed normals in case the mesh was built with pre-rotated particles, ex : use of positionFunction in addShape()
        private _unrotateFixedNormals() {
            var index = 0;
            var idx = 0;
            const tmpNormal = SolidParticleSystem._vertex;
            for (var p = 0; p < this.particles.length; p++) {
                const particle = this.particles[p];
                const shape = particle._model._shape;
                if (particle.rotationQuaternion) {
                    this._quaternion.copyFrom(particle.rotationQuaternion);
                }
                else {
                    const rotation = particle.rotation;
                    this._quaternionRotationYPR(rotation.y, rotation.x, rotation.z);
                }
                this._quaternionToRotationMatrix();
                this._rotMatrix.invertToRef(this._invertMatrix);

                for (var pt = 0; pt < shape.length; pt++) {
                    idx = index + pt * 3;
                    Vector3.TransformNormalFromFloatsToRef(this._normals32[idx], this._normals32[idx + 1], this._normals32[idx + 2], this._invertMatrix, tmpNormal);
                    tmpNormal.toArray(this._fixedNormal32, idx);
                }
                index = idx + 3;
            }
        }

        //reset copy
        private _resetCopy() {
            const copy = this._copy;
            copy.position.setAll(0);
            copy.rotation.setAll(0);
            copy.rotationQuaternion = null;
            copy.scaling.setAll(1);
            copy.uvs.copyFromFloats(0.0, 0.0, 1.0, 1.0);
            copy.color = null;
            copy.translateFromPivot = false;
        }

        // _meshBuilder : inserts the shape model in the global SPS mesh
        private _meshBuilder(p: number, shape: Vector3[], positions: number[], meshInd: IndicesArray, indices: number[], meshUV: number[] | Float32Array, uvs: number[], meshCol: number[] | Float32Array, colors: number[], meshNor: number[] | Float32Array, normals: number[], idx: number, idxInShape: number, options: any): SolidParticle {
            var i;
            var u = 0;
            var c = 0;
            var n = 0;

            this._resetCopy();
            const copy = this._copy;
            if (options && options.positionFunction) {        // call to custom positionFunction
                options.positionFunction(copy, idx, idxInShape);
                this._mustUnrotateFixedNormals = true;
            }

            if (copy.rotationQuaternion) {
                this._quaternion.copyFrom(copy.rotationQuaternion);
            } else {
                const rotation = copy.rotation;
                this._quaternionRotationYPR(rotation.y, rotation.x, rotation.z);
            }
            this._quaternionToRotationMatrix();

            copy.pivot.multiplyToRef(copy.scaling, this._scaledPivot)

            if (copy.translateFromPivot) {
                this._pivotBackTranslation.copyFromFloats(0.0, 0.0, 0.0);
            }
            else {
                this._pivotBackTranslation.copyFrom(this._scaledPivot);
            }

            const tmpVertex = SolidParticleSystem._vertex;
            const tmpRotated = SolidParticleSystem._rotated;
            for (i = 0; i < shape.length; i++) {
                tmpVertex.copyFrom(shape[i]);
                if (options && options.vertexFunction) {
                    options.vertexFunction(copy, tmpVertex, i);
                }

                tmpVertex.multiplyInPlace(copy.scaling).subtractInPlace(this._scaledPivot);
                Vector3.TransformCoordinatesToRef(tmpVertex, this._rotMatrix, tmpRotated);
                tmpRotated.addInPlace(this._pivotBackTranslation).addInPlace(copy.position);
                positions.push(tmpRotated.x, tmpRotated.y, tmpRotated.z);
                if (meshUV) {
                    const copyUvs = copy.uvs;
                    uvs.push((copyUvs.z - copyUvs.x) * meshUV[u] + copyUvs.x, (copyUvs.w - copyUvs.y) * meshUV[u + 1] + copyUvs.y);
                    u += 2;
                }

                if (copy.color) {
                    this._color = copy.color;
                } else {
                    const color = this._color;
                    if (meshCol && meshCol[c] !== undefined) {
                        color.r = meshCol[c];
                        color.g = meshCol[c + 1];
                        color.b = meshCol[c + 2];
                        color.a = meshCol[c + 3];
                    } else {
                        color.r = 1.0;
                        color.g = 1.0;
                        color.b = 1.0;
                        color.a = 1.0;
                    }
                }
                colors.push(this._color.r, this._color.g, this._color.b, this._color.a);
                c += 4;

                if (!this.recomputeNormals && meshNor) {
                    tmpVertex.x = meshNor[n];
                    tmpVertex.y = meshNor[n + 1];
                    tmpVertex.z = meshNor[n + 2];
                    Vector3.TransformNormalToRef(tmpVertex, this._rotMatrix, tmpVertex);
                    normals.push(tmpVertex.x, tmpVertex.y, tmpVertex.z);
                    n += 3;
                }

            }

            for (i = 0; i < meshInd.length; i++) {
                var current_ind = p + meshInd[i];
                indices.push(current_ind);
                if (current_ind > 65535) {
                    this._needs32Bits = true;
                }
            }

            if (this._pickable) {
                var nbfaces = meshInd.length / 3;
                for (i = 0; i < nbfaces; i++) {
                    this.pickedParticles.push({ idx: idx, faceId: i });
                }
            }

            if (this._depthSort) {
                this.depthSortedParticles.push(new DepthSortedParticle());
            }

            return copy;
        }

        // returns a shape array from positions array
        private _posToShape(positions: number[] | Float32Array): Vector3[] {
            var shape = [];
            for (var i = 0; i < positions.length; i += 3) {
                shape.push(Vector3.FromArray(positions, i));
            }
            return shape;
        }

        // returns a shapeUV array from a Vector4 uvs
        private _uvsToShapeUV(uvs: number[] | Float32Array): number[] {
            var shapeUV = [];
            if (uvs) {
                for (var i = 0; i < uvs.length; i++) {
                    shapeUV.push(uvs[i]);
                }
            }
            return shapeUV;
        }

        // adds a new particle object in the particles array
        private _addParticle(idx: number, idxpos: number, idxind: number, model: ModelShape, shapeId: number, idxInShape: number, bInfo: Nullable<BoundingInfo> = null): SolidParticle {
            var sp = new SolidParticle(idx, idxpos, idxind, model, shapeId, idxInShape, this, bInfo);
            this.particles.push(sp);
            return sp;
        }

        /**
         * Adds some particles to the SPS from the model shape. Returns the shape id.
         * Please read the doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#create-an-immutable-sps
         * @param mesh is any Mesh object that will be used as a model for the solid particles.
         * @param nb (positive integer) the number of particles to be created from this model
         * @param options {positionFunction} is an optional javascript function to called for each particle on SPS creation.
         * {vertexFunction} is an optional javascript function to called for each vertex of each particle on SPS creation
         * @returns the number of shapes in the system
         */
        public addShape(mesh: Mesh, nb: number, options?: { positionFunction?: any; vertexFunction?: any }): number {
            var meshPos = <FloatArray>mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = <IndicesArray>mesh.getIndices();
            var meshUV = <FloatArray>mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = <FloatArray>mesh.getVerticesData(VertexBuffer.ColorKind);
            var meshNor = <FloatArray>mesh.getVerticesData(VertexBuffer.NormalKind);
            var bbInfo;
            if (this._particlesIntersect) {
                bbInfo = mesh.getBoundingInfo();
            }

            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);

            var posfunc = options ? options.positionFunction : null;
            var vtxfunc = options ? options.vertexFunction : null;

            var modelShape = new ModelShape(this._shapeCounter, shape, meshInd.length, shapeUV, posfunc, vtxfunc);

            // particles
            var sp;
            var currentCopy;
            var idx = this.nbParticles;
            for (var i = 0; i < nb; i++) {
                var currentPos = this._positions.length;
                var currentInd = this._indices.length;
                currentCopy = this._meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors, meshNor, this._normals, idx, i, options);
                if (this._updatable) {
                    sp = this._addParticle(idx, currentPos, currentInd, modelShape, this._shapeCounter, i, bbInfo);
                    sp.position.copyFrom(currentCopy.position);
                    sp.rotation.copyFrom(currentCopy.rotation);
                    if (currentCopy.rotationQuaternion && sp.rotationQuaternion) {
                        sp.rotationQuaternion.copyFrom(currentCopy.rotationQuaternion);
                    }
                    if (currentCopy.color && sp.color) {
                        sp.color.copyFrom(currentCopy.color);
                    }
                    sp.scaling.copyFrom(currentCopy.scaling);
                    sp.uvs.copyFrom(currentCopy.uvs);
                }
                this._index += shape.length;
                idx++;
            }
            this.nbParticles += nb;
            this._shapeCounter++;
            return this._shapeCounter - 1;
        }

        // rebuilds a particle back to its just built status : if needed, recomputes the custom positions and vertices
        private _rebuildParticle(particle: SolidParticle): void {
            this._resetCopy();
            const copy = this._copy;
            if (particle._model._positionFunction) {        // recall to stored custom positionFunction
                particle._model._positionFunction(copy, particle.idx, particle.idxInShape);
            }

            if (copy.rotationQuaternion) {
                this._quaternion.copyFrom(copy.rotationQuaternion);
            } else {
                const rotation = copy.rotation
                this._quaternionRotationYPR(rotation.y, rotation.x, rotation.z);
            }
            this._quaternionToRotationMatrix();

            particle.pivot.multiplyToRef(particle.scaling, this._scaledPivot);

            if (copy.translateFromPivot) {
                this._pivotBackTranslation.copyFromFloats(0.0, 0.0, 0.0);
            }
            else {
                this._pivotBackTranslation.copyFrom(this._scaledPivot);
            }

            const shape = particle._model._shape;
            const tmpVertex = SolidParticleSystem._vertex;
            const tmpRotated = SolidParticleSystem._rotated;
            for (var pt = 0; pt < shape.length; pt++) {
                tmpVertex.copyFrom(shape[pt]);
                if (particle._model._vertexFunction) {
                    particle._model._vertexFunction(copy, tmpVertex, pt); // recall to stored vertexFunction
                }

                tmpVertex.multiplyInPlace(copy.scaling).subtractInPlace(this._scaledPivot);
                Vector3.TransformCoordinatesToRef(tmpVertex, this._rotMatrix, tmpRotated);
                tmpRotated.addInPlace(this._pivotBackTranslation).addInPlace(copy.position).toArray(this._positions32, particle._pos + pt * 3);
            }
            particle.position.setAll(0.0);
            particle.rotation.setAll(0.0);
            particle.rotationQuaternion = null;
            particle.scaling.setAll(1.0);
            particle.uvs.setAll(0.0);
            particle.pivot.setAll(0.0);
            particle.translateFromPivot = false;
            particle.parentId = null;
        }

        /**
         * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
         * @returns the SPS.
         */
        public rebuildMesh(): SolidParticleSystem {
            for (var p = 0; p < this.particles.length; p++) {
                this._rebuildParticle(this.particles[p]);
            }
            this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions32, false, false);
            return this;
        }

        /**
         *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
         *  This method calls `updateParticle()` for each particle of the SPS.
         *  For an animated SPS, it is usually called within the render loop.
         * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
         * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
         * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
         * @returns the SPS.
         */
        public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): SolidParticleSystem {
            if (!this._updatable) {
                return this;
            }

            // custom beforeUpdate
            this.beforeUpdateParticles(start, end, update);

            const camAxisX = SolidParticleSystem._cam_axisX.copyFromFloats(1.0, 0.0, 0.0);
            const camAxisY = SolidParticleSystem._cam_axisY.copyFromFloats(0.0, 1.0, 0.0);
            const camAxisZ = SolidParticleSystem._cam_axisZ.copyFromFloats(0.0, 0.0, 1.0);
            const minimum = SolidParticleSystem._minimum;
            const maximum = SolidParticleSystem._maximum;

            // cases when the World Matrix is to be computed first
            if (this.billboard || this._depthSort) {
                this.mesh.computeWorldMatrix(true);
                this.mesh._worldMatrix.invertToRef(this._invertMatrix);
            }
            // if the particles will always face the camera
            if (this.billboard) {
                // compute the camera position and un-rotate it by the current mesh rotation
                this._camera.getDirectionToRef(this._axisZ, this._camDir);
                Vector3.TransformNormalToRef(this._camDir, this._invertMatrix, camAxisZ);
                camAxisZ.normalize();
                // same for camera up vector extracted from the cam view matrix
                var view = this._camera.getViewMatrix(true);
                Vector3.TransformNormalFromFloatsToRef(view.m[1], view.m[5], view.m[9], this._invertMatrix, camAxisY);
                Vector3.CrossToRef(camAxisY, camAxisZ, camAxisX);
                camAxisY.normalize();
                camAxisX.normalize();
            }

            // if depthSort, compute the camera global position in the mesh local system
            if (this._depthSort) {
                Vector3.TransformCoordinatesToRef(this._camera.globalPosition, this._invertMatrix, this._camInvertedPosition); // then un-rotate the camera
            }

            Matrix.IdentityToRef(this._rotMatrix);
            var idx = 0;            // current position index in the global array positions32
            var index = 0;          // position start index in the global array positions32 of the current particle
            var colidx = 0;         // current color index in the global array colors32
            var colorIndex = 0;     // color start index in the global array colors32 of the current particle
            var uvidx = 0;          // current uv index in the global array uvs32
            var uvIndex = 0;        // uv start index in the global array uvs32 of the current particle
            var pt = 0;             // current index in the particle model shape

            if (this.mesh.isFacetDataEnabled) {
                this._computeBoundingBox = true;
            }

            end = (end >= this.nbParticles) ? this.nbParticles - 1 : end;
            if (this._computeBoundingBox) {
                if (start == 0 && end == this.nbParticles - 1) {        // all the particles are updated, then recompute the BBox from scratch
                    minimum.setAll(Number.MAX_VALUE);
                    maximum.setAll(-Number.MAX_VALUE);
                }
                else {      // only some particles are updated, then use the current existing BBox basis. Note : it can only increase.
                    const boundingInfo = this.mesh._boundingInfo
                    if (boundingInfo) {
                        minimum.copyFrom(boundingInfo.minimum);
                        maximum.copyFrom(boundingInfo.maximum);
                    }
                    else {
                        minimum.setAll(Number.MAX_VALUE);
                        maximum.setAll(-Number.MAX_VALUE);
                    }
                }
            }

            // particle loop
            index = this.particles[start]._pos;
            var vpos = (index / 3) | 0;
            colorIndex = vpos * 4;
            uvIndex = vpos * 2;

            const rotMatrixValues = this._rotMatrix.m;
            const scaledPivot = this._scaledPivot;
            const pivotBackTranslation = this._pivotBackTranslation;
            const tmpVertex = SolidParticleSystem._vertex;
            const mesh = this.mesh;
            const colors32 = this._colors32;
            const positions32 = this._positions32;
            const normals32 = this._normals32;
            const uvs32 = this._uvs32;
            const indices32 = this._indices32;
            const indices = this._indices;
            const fixedNormal32 = this._fixedNormal32;
            

            for (var p = start; p <= end; p++) {
                const particle = this.particles[p];
                const shape = particle._model._shape;
                const shapeUV = particle._model._shapeUV;
                
                const rotationMatrix = particle._rotationMatrix;
                const position = particle.position;
                const rotation = particle.rotation;
                const globalPosition = particle._globalPosition;
                const scaling = particle.scaling;

                // call to custom user function to update the particle properties
                this.updateParticle(particle);

                // camera-particle distance for depth sorting
                if (this._depthSort && this._depthSortParticles) {
                    var dsp = this.depthSortedParticles[p];
                    dsp.ind = particle._ind;
                    dsp.indicesLength = particle._model._indicesLength;
                    dsp.sqDistance = Vector3.DistanceSquared(particle.position, this._camInvertedPosition);
                }

                // skip the computations for inactive or already invisible particles
                if (!particle.alive || (particle._stillInvisible && !particle.isVisible)) {
                    // increment indexes for the next particle
                    pt = shape.length;
                    index += pt * 3;
                    colorIndex += pt * 4;
                    uvIndex += pt * 2;
                    continue;
                }

                if (particle.isVisible) {
                    particle._stillInvisible = false; // un-mark permanent invisibility

                    particle.pivot.multiplyToRef(scaling, scaledPivot);

                    // particle rotation matrix
                    if (this.billboard) {
                        rotation.x = 0.0;
                        rotation.y = 0.0;
                    }
                    if (this._computeParticleRotation || this.billboard) {
                        if (particle.rotationQuaternion) {
                            this._quaternion.copyFrom(particle.rotationQuaternion);
                        } else {
                            this._quaternionRotationYPR(rotation.y, rotation.x, rotation.z);
                        }
                        this._quaternionToRotationMatrix();
                    }

                    const particleHasParent = (particle.parentId !== null);
                    if (particleHasParent) {
                        const parent = this.particles[particle.parentId!];
                        const parentRotMatrix = parent._rotationMatrix
                        const parentGlobalPosition = parent._globalPosition;

                        const rotatedY = position.x * parentRotMatrix[1] + position.y * parentRotMatrix[4] + position.z * parentRotMatrix[7];
                        const rotatedX = position.x * parentRotMatrix[0] + position.y * parentRotMatrix[3] + position.z * parentRotMatrix[6];
                        const rotatedZ = position.x * parentRotMatrix[2] + position.y * parentRotMatrix[5] + position.z * parentRotMatrix[8];

                        globalPosition.x = parentGlobalPosition.x + rotatedX;
                        globalPosition.y = parentGlobalPosition.y + rotatedY;
                        globalPosition.z = parentGlobalPosition.z + rotatedZ;

                        if (this._computeParticleRotation || this.billboard) {
                            rotationMatrix[0] = rotMatrixValues[0] * parentRotMatrix[0] + rotMatrixValues[1] * parentRotMatrix[3] + rotMatrixValues[2] * parentRotMatrix[6];
                            rotationMatrix[1] = rotMatrixValues[0] * parentRotMatrix[1] + rotMatrixValues[1] * parentRotMatrix[4] + rotMatrixValues[2] * parentRotMatrix[7];
                            rotationMatrix[2] = rotMatrixValues[0] * parentRotMatrix[2] + rotMatrixValues[1] * parentRotMatrix[5] + rotMatrixValues[2] * parentRotMatrix[8];
                            rotationMatrix[3] = rotMatrixValues[4] * parentRotMatrix[0] + rotMatrixValues[5] * parentRotMatrix[3] + rotMatrixValues[6] * parentRotMatrix[6];
                            rotationMatrix[4] = rotMatrixValues[4] * parentRotMatrix[1] + rotMatrixValues[5] * parentRotMatrix[4] + rotMatrixValues[6] * parentRotMatrix[7];
                            rotationMatrix[5] = rotMatrixValues[4] * parentRotMatrix[2] + rotMatrixValues[5] * parentRotMatrix[5] + rotMatrixValues[6] * parentRotMatrix[8];
                            rotationMatrix[6] = rotMatrixValues[8] * parentRotMatrix[0] + rotMatrixValues[9] * parentRotMatrix[3] + rotMatrixValues[10] * parentRotMatrix[6];
                            rotationMatrix[7] = rotMatrixValues[8] * parentRotMatrix[1] + rotMatrixValues[9] * parentRotMatrix[4] + rotMatrixValues[10] * parentRotMatrix[7];
                            rotationMatrix[8] = rotMatrixValues[8] * parentRotMatrix[2] + rotMatrixValues[9] * parentRotMatrix[5] + rotMatrixValues[10] * parentRotMatrix[8];
                        }
                    }
                    else {
                        globalPosition.x = position.x;
                        globalPosition.y = position.y;
                        globalPosition.z = position.z;

                        if (this._computeParticleRotation || this.billboard) {
                            rotationMatrix[0] = rotMatrixValues[0];
                            rotationMatrix[1] = rotMatrixValues[1];
                            rotationMatrix[2] = rotMatrixValues[2];
                            rotationMatrix[3] = rotMatrixValues[4];
                            rotationMatrix[4] = rotMatrixValues[5];
                            rotationMatrix[5] = rotMatrixValues[6];
                            rotationMatrix[6] = rotMatrixValues[8];
                            rotationMatrix[7] = rotMatrixValues[9];
                            rotationMatrix[8] = rotMatrixValues[10];
                        }
                    }

                    if (particle.translateFromPivot) {
                        this._pivotBackTranslation.setAll(0.0);
                    }
                    else {
                        this._pivotBackTranslation.copyFrom(scaledPivot);
                    }
                    // particle vertex loop
                    for (pt = 0; pt < shape.length; pt++) {
                        idx = index + pt * 3;
                        colidx = colorIndex + pt * 4;
                        uvidx = uvIndex + pt * 2;

                        tmpVertex.copyFrom(shape[pt]);
                        if (this._computeParticleVertex) {
                            this.updateParticleVertex(particle, tmpVertex, pt);
                        }
                        
                        // positions
                        const vertexX = tmpVertex.x * scaling.x - scaledPivot.x;
                        const vertexY = tmpVertex.y * scaling.y - scaledPivot.y;
                        const vertexZ = tmpVertex.z * scaling.z - scaledPivot.z;

                        let rotatedX = vertexX * rotationMatrix[0] + vertexY * rotationMatrix[3] + vertexZ * rotationMatrix[6];
                        let rotatedY = vertexX * rotationMatrix[1] + vertexY * rotationMatrix[4] + vertexZ * rotationMatrix[7];
                        let rotatedZ = vertexX * rotationMatrix[2] + vertexY * rotationMatrix[5] + vertexZ * rotationMatrix[8];

                        rotatedX += pivotBackTranslation.x;
                        rotatedY += pivotBackTranslation.y;
                        rotatedZ += pivotBackTranslation.z;

                        positions32[idx] = globalPosition.x + camAxisX.x * rotatedX + camAxisY.x * rotatedY + camAxisZ.x * rotatedZ;
                        positions32[idx + 1] = globalPosition.y + camAxisX.y * rotatedX + camAxisY.y * rotatedY + camAxisZ.y * rotatedZ;
                        positions32[idx + 2] = globalPosition.z + camAxisX.z * rotatedX + camAxisY.z * rotatedY + camAxisZ.z * rotatedZ;

                        if (this._computeBoundingBox) {
                            minimum.minimizeInPlaceFromFloats(positions32[idx], positions32[idx+1], positions32[idx+1]);
                            maximum.maximizeInPlaceFromFloats(positions32[idx], positions32[idx+1], positions32[idx+1]);
                        }

                        // normals : if the particles can't be morphed then just rotate the normals, what is much more faster than ComputeNormals()
                        if (!this._computeParticleVertex) {
                            const normalx = fixedNormal32[idx];
                            const normaly = fixedNormal32[idx + 1];
                            const normalz = fixedNormal32[idx + 2];

                            const rotatedx = normalx * rotationMatrix[0] + normaly * rotationMatrix[3] + normalz * rotationMatrix[6];
                            const rotatedy = normalx * rotationMatrix[1] + normaly * rotationMatrix[4] + normalz * rotationMatrix[7];
                            const rotatedz = normalx * rotationMatrix[2] + normaly * rotationMatrix[5] + normalz * rotationMatrix[8];

                            normals32[idx] = camAxisX.x * rotatedx + camAxisY.x * rotatedy + camAxisZ.x * rotatedz;
                            normals32[idx + 1] = camAxisX.y * rotatedx + camAxisY.y * rotatedy + camAxisZ.y * rotatedz;
                            normals32[idx + 2] = camAxisX.z * rotatedx + camAxisY.z * rotatedy + camAxisZ.z * rotatedz;
                        }

                        if (this._computeParticleColor && particle.color) {
                            const color = particle.color;
                            const colors32 = this._colors32;
                            colors32[colidx] = color.r;
                            colors32[colidx + 1] = color.g;
                            colors32[colidx + 2] = color.b;
                            colors32[colidx + 3] = color.a;
                        }

                        if (this._computeParticleTexture) {
                            const uvs = particle.uvs;
                            uvs32[uvidx] = shapeUV[pt * 2] * (uvs.z - uvs.x) + uvs.x;
                            uvs32[uvidx + 1] = shapeUV[pt * 2 + 1] * (uvs.w - uvs.y) + uvs.y;
                        }
                    }
                }
                // particle just set invisible : scaled to zero and positioned at the origin
                else {
                    particle._stillInvisible = true;      // mark the particle as invisible
                    for (pt = 0; pt < shape.length; pt++) {
                        idx = index + pt * 3;
                        colidx = colorIndex + pt * 4;
                        uvidx = uvIndex + pt * 2;

                        positions32[idx] = 0.0;
                        positions32[idx + 1] = 0.0;
                        positions32[idx + 2] = 0.0;
                        normals32[idx] = 0.0;
                        normals32[idx + 1] = 0.0;
                        normals32[idx + 2] = 0.0;
                        if (this._computeParticleColor && particle.color) {
                            const color = particle.color;
                            colors32[colidx] = color.r;
                            colors32[colidx + 1] = color.g;
                            colors32[colidx + 2] = color.b;
                            colors32[colidx + 3] = color.a;
                        }
                        if (this._computeParticleTexture) {
                            const uvs = particle.uvs;
                            uvs32[uvidx] = shapeUV[pt * 2] * (uvs.z - uvs.x) + uvs.x;
                            uvs32[uvidx + 1] = shapeUV[pt * 2 + 1] * (uvs.w - uvs.y) + uvs.y;
                        }
                    }
                }

                // if the particle intersections must be computed : update the bbInfo
                if (this._particlesIntersect) {
                    const bInfo = particle._boundingInfo;
                    const bBox = bInfo.boundingBox;
                    const bSphere = bInfo.boundingSphere;
                    const modelBoundingInfo = particle._modelBoundingInfo;
                    if (!this._bSphereOnly) {
                        // place, scale and rotate the particle bbox within the SPS local system, then update it
                        const modelBoundingInfoVectors = modelBoundingInfo.boundingBox.vectors;
                        const min = Tmp.Vector3[0];
                        const max = Tmp.Vector3[1];
                        min.setAll(Number.MAX_VALUE);
                        max.setAll(-Number.MAX_VALUE);
                        for (var b = 0; b < 8; b++) {
                            const vertexX = modelBoundingInfoVectors[b].x * scaling.x;
                            const vertexY = modelBoundingInfoVectors[b].y * scaling.y;
                            const vertexZ = modelBoundingInfoVectors[b].z * scaling.z;
                            const rotatedX = vertexX * rotationMatrix[0] + vertexY * rotationMatrix[3] + vertexZ * rotationMatrix[6];
                            const rotatedY = vertexX * rotationMatrix[1] + vertexY * rotationMatrix[4] + vertexZ * rotationMatrix[7];
                            const rotatedZ = vertexX * rotationMatrix[2] + vertexY * rotationMatrix[5] + vertexZ * rotationMatrix[8];
                            const x = position.x + camAxisX.x * rotatedX + camAxisY.x * rotatedY + camAxisZ.x * rotatedZ;
                            const y = position.y + camAxisX.y * rotatedX + camAxisY.y * rotatedY + camAxisZ.y * rotatedZ;
                            const z = position.z + camAxisX.z * rotatedX + camAxisY.z * rotatedY + camAxisZ.z * rotatedZ;
                            min.minimizeInPlaceFromFloats(x, y, z);
                            max.maximizeInPlaceFromFloats(x, y, z);
                        }

                        bBox.reConstruct(min, max, mesh._worldMatrix);
                    }
                    // place and scale the particle bouding sphere in the SPS local system, then update it
                    const minBbox = modelBoundingInfo.minimum.multiplyToRef(scaling, Tmp.Vector3[0]);
                    const maxBbox = modelBoundingInfo.maximum.multiplyToRef(scaling, Tmp.Vector3[1]);

                    const center = maxBbox.addToRef(minBbox, Tmp.Vector3[2]).scaleInPlace(0.5);
                    const halfDiag  = maxBbox.subtractToRef(minBbox, Tmp.Vector3[3]).scaleInPlace(0.5 * this._bSphereRadiusFactor);
                    const sphereMinBbox = center.subtractToRef(halfDiag, Tmp.Vector3[4]);
                    const sphereMaxBbox = center.addToRef(halfDiag, Tmp.Vector3[5]);
                    bSphere.reConstruct(sphereMinBbox, sphereMaxBbox, mesh._worldMatrix);
                }

                // increment indexes for the next particle
                index = idx + 3;
                colorIndex = colidx + 4;
                uvIndex = uvidx + 2;
            }

            // if the VBO must be updated
            if (update) {
                if (this._computeParticleColor) {
                    mesh.updateVerticesData(VertexBuffer.ColorKind, colors32, false, false);
                }
                if (this._computeParticleTexture) {
                    mesh.updateVerticesData(VertexBuffer.UVKind, uvs32, false, false);
                }
                mesh.updateVerticesData(VertexBuffer.PositionKind, positions32, false, false);
                if (!mesh.areNormalsFrozen || mesh.isFacetDataEnabled) {
                    if (this._computeParticleVertex || mesh.isFacetDataEnabled) {
                        // recompute the normals only if the particles can be morphed, update then also the normal reference array _fixedNormal32[]
                        var params = mesh.isFacetDataEnabled ? mesh.getFacetDataParameters() : null;
                        VertexData.ComputeNormals(positions32, indices32, normals32, params);
                        for (var i = 0; i < normals32.length; i++) {
                            fixedNormal32[i] = normals32[i];
                        }
                    }
                    if (!mesh.areNormalsFrozen) {
                        mesh.updateVerticesData(VertexBuffer.NormalKind, normals32, false, false);
                    }
                }
                if (this._depthSort && this._depthSortParticles) {
                    const depthSortedParticles = this.depthSortedParticles;
                    depthSortedParticles.sort(this._depthSortFunction);
                    var dspl = depthSortedParticles.length;
                    var sorted = 0;
                    var lind = 0;
                    var sind = 0;
                    var sid = 0;
                    for (sorted = 0; sorted < dspl; sorted++) {
                        lind = depthSortedParticles[sorted].indicesLength;
                        sind = depthSortedParticles[sorted].ind;
                        for (var i = 0; i < lind; i++) {
                            indices32[sid] = indices[sind + i];
                            sid++;
                        }
                    }
                    mesh.updateIndices(indices32);
                }
            }
            if (this._computeBoundingBox) {
                if (mesh._boundingInfo) {
                    mesh._boundingInfo.reConstruct(minimum, maximum, mesh._worldMatrix);
                }
                else {
                    mesh._boundingInfo = new BoundingInfo(minimum, maximum, mesh._worldMatrix);
                }
            }
            this.afterUpdateParticles(start, end, update);
            return this;
        }

        private _quaternionRotationYPR(yaw:number, pitch:number, roll:number): void {
            const halfroll = roll * 0.5;
            const halfpitch = pitch * 0.5;
            const halfyaw = yaw * 0.5;
            const sinRoll = Math.sin(halfroll);
            const cosRoll = Math.cos(halfroll);
            const sinPitch = Math.sin(halfpitch);
            const cosPitch = Math.cos(halfpitch);
            const sinYaw = Math.sin(halfyaw);
            const cosYaw = Math.cos(halfyaw);
            this._quaternion.x = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
            this._quaternion.y = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
            this._quaternion.z = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
            this._quaternion.w = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
        }

        private _quaternionToRotationMatrix(): void {
            const rotMatrixValues = this._rotMatrix.m;
            const x = this._quaternion.x, y = this._quaternion.y, z = this._quaternion.z, w = this._quaternion.w;
            rotMatrixValues[0] = 1.0 - (2.0 * (y * y + z * z));
            rotMatrixValues[1] = 2.0 * (x * y + z * w);
            rotMatrixValues[2] = 2.0 * (z * x - y * w);
            rotMatrixValues[3] = 0;
            rotMatrixValues[4] = 2.0 * (x * y - z * w);
            rotMatrixValues[5] = 1.0 - (2.0 * (z * z + x * x));
            rotMatrixValues[6] = 2.0 * (y * z + x * w);
            rotMatrixValues[7] = 0;
            rotMatrixValues[8] = 2.0 * (z * x + y * w);
            rotMatrixValues[9] = 2.0 * (y * z - x * w);
            rotMatrixValues[10] = 1.0 - (2.0 * (y * y + x * x));
            rotMatrixValues[11] = 0;
            rotMatrixValues[12] = 0;
            rotMatrixValues[13] = 0;
            rotMatrixValues[14] = 0;
            rotMatrixValues[15] = 1.0;
        }

        /**
        * Disposes the SPS.
        */
        public dispose(): void {
            this.mesh.dispose();
            this.vars = null;
            // drop references to internal big arrays for the GC
            (<any>this._positions) = null;
            (<any>this._indices) = null;
            (<any>this._normals) = null;
            (<any>this._uvs) = null;
            (<any>this._colors) = null;
            (<any>this._indices32) = null;
            (<any>this._positions32) = null;
            (<any>this._normals32) = null;
            (<any>this._fixedNormal32) = null;
            (<any>this._uvs32) = null;
            (<any>this._colors32) = null;
            (<any>this.pickedParticles) = null;
        }

        /**
         * Visibilty helper : Recomputes the visible size according to the mesh bounding box
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         * @returns the SPS.
         */
        public refreshVisibleSize(): SolidParticleSystem {
            if (!this._isVisibilityBoxLocked) {
                this.mesh.refreshBoundingInfo();
            }
            return this;
        }

        /**
         * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
         * @param size the size (float) of the visibility box
         * note : this doesn't lock the SPS mesh bounding box.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         */
        public setVisibilityBox(size: number): void {
            var vis = size / 2;
            this.mesh._boundingInfo = new BoundingInfo(new Vector3(-vis, -vis, -vis), new Vector3(vis, vis, vis));
        }

        /**
         * Gets whether the SPS as always visible or not
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         */
        public get isAlwaysVisible(): boolean {
            return this._alwaysVisible;
        }

        /**
         * Sets the SPS as always visible or not
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         */
        public set isAlwaysVisible(val: boolean) {
            this._alwaysVisible = val;
            this.mesh.alwaysSelectAsActiveMesh = val;
        }

        /**
         * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         */
        public set isVisibilityBoxLocked(val: boolean) {
            this._isVisibilityBoxLocked = val;

            let boundingInfo = this.mesh.getBoundingInfo();

            boundingInfo.isLocked = val;
        }

        /**
         * Gets if the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
         */
        public get isVisibilityBoxLocked(): boolean {
            return this._isVisibilityBoxLocked;
        }

        /**
         * Tells to `setParticles()` to compute the particle rotations or not.
         * Default value : true. The SPS is faster when it's set to false.
         * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
         */
        public set computeParticleRotation(val: boolean) {
            this._computeParticleRotation = val;
        }
        /**
         * Tells to `setParticles()` to compute the particle colors or not.
         * Default value : true. The SPS is faster when it's set to false.
         * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
         */
        public set computeParticleColor(val: boolean) {
            this._computeParticleColor = val;
        }

        public set computeParticleTexture(val: boolean) {
            this._computeParticleTexture = val;
        }
        /**
         * Tells to `setParticles()` to call the vertex function for each vertex of each particle, or not.
         * Default value : false. The SPS is faster when it's set to false.
         * Note : the particle custom vertex positions aren't stored values.
         */
        public set computeParticleVertex(val: boolean) {
            this._computeParticleVertex = val;
        }
        /**
         * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
         */
        public set computeBoundingBox(val: boolean) {
            this._computeBoundingBox = val;
        }
        /**
         * Tells to `setParticles()` to sort or not the distance between each particle and the camera.
         * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
         * Default : `true`
         */
        public set depthSortParticles(val: boolean) {
            this._depthSortParticles = val;
        }

        /**
         * Gets if `setParticles()` computes the particle rotations or not.
         * Default value : true. The SPS is faster when it's set to false.
         * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
         */
        public get computeParticleRotation(): boolean {
            return this._computeParticleRotation;
        }
        /**
         * Gets if `setParticles()` computes the particle colors or not.
         * Default value : true. The SPS is faster when it's set to false.
         * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
         */
        public get computeParticleColor(): boolean {
            return this._computeParticleColor;
        }
        /**
         * Gets if `setParticles()` computes the particle textures or not.
         * Default value : true. The SPS is faster when it's set to false.
         * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
         */
        public get computeParticleTexture(): boolean {
            return this._computeParticleTexture;
        }
        /**
         * Gets if `setParticles()` calls the vertex function for each vertex of each particle, or not.
         * Default value : false. The SPS is faster when it's set to false.
         * Note : the particle custom vertex positions aren't stored values.
         */
        public get computeParticleVertex(): boolean {
            return this._computeParticleVertex;
        }
        /**
         * Gets if `setParticles()` computes or not the mesh bounding box when computing the particle positions.
         */
        public get computeBoundingBox(): boolean {
            return this._computeBoundingBox;
        }
        /**
         * Gets if `setParticles()` sorts or not the distance between each particle and the camera.
         * Skipped when `enableDepthSort` is set to `false` (default) at construction time.
         * Default : `true`
         */
        public get depthSortParticles(): boolean {
            return this._depthSortParticles;
        }

        // =======================================================================
        // Particle behavior logic
        // these following methods may be overwritten by the user to fit his needs

        /**
         * This function does nothing. It may be overwritten to set all the particle first values.
         * The SPS doesn't call this function, you may have to call it by your own.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
         */
        public initParticles(): void {
        }

        /**
         * This function does nothing. It may be overwritten to recycle a particle.
         * The SPS doesn't call this function, you may have to call it by your own.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
         * @param particle The particle to recycle
         * @returns the recycled particle
         */
        public recycleParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        /**
         * Updates a particle : this function should  be overwritten by the user.
         * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
         * @example : just set a particle position or velocity and recycle conditions
         * @param particle The particle to update
         * @returns the updated particle
         */
        public updateParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        /**
         * Updates a vertex of a particle : it can be overwritten by the user.
         * This will be called on each vertex particle by `setParticles()` if `computeParticleVertex` is set to true only.
         * @param particle the current particle
         * @param vertex the current index of the current particle
         * @param pt the index of the current vertex in the particle shape
         * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#update-each-particle-shape
         * @example : just set a vertex particle position
         * @returns the updated vertex
         */
        public updateParticleVertex(particle: SolidParticle, vertex: Vector3, pt: number): Vector3 {
            return vertex;
        }

        /**
         * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
         * This does nothing and may be overwritten by the user.
         * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
         * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
         * @param update the boolean update value actually passed to setParticles()
         */
        public beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void {
        }
        /**
         * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
         * This will be passed three parameters.
         * This does nothing and may be overwritten by the user.
         * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
         * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
         * @param update the boolean update value actually passed to setParticles()
         */
        public afterUpdateParticles(start?: number, stop?: number, update?: boolean): void {
        }
    }
}