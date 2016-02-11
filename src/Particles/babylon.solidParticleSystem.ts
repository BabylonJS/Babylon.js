module BABYLON {

    /**
    * Full documentation here : http://doc.babylonjs.com/tutorials/Solid_Particle_System
    */
    export class SolidParticleSystem implements IDisposable {
        // public members
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
        * Please read : http://doc.babylonjs.com/tutorials/Solid_Particle_System#garbage-collector-concerns
        */
        public vars: any = {};
        /**
        * This array is populated when the SPS is set as 'pickable'.
        * Each key of this array is a faceId value that you can get from a pickResult object.
        * Each element of this array is an object {idx: int, faceId: int}.
        * idx is the picked particle index in the SPS.particles array
        * faceId is the picked face index counted within this particles
        * Please read : http://doc.babylonjs.com/tutorials/Solid_Particle_System#pickable-particles
        */
        public pickedParticles: { idx: number; faceId: number }[];

        // private members
        private _scene: Scene;
        private _positions: number[] = new Array<number>();
        private _indices: number[] = new Array<number>();
        private _normals: number[] = new Array<number>();
        private _colors: number[] = new Array<number>();
        private _uvs: number[] = new Array<number>();
        private _positions32: Float32Array;
        private _normals32: Float32Array;           // updated normals for the VBO
        private _fixedNormal32: Float32Array;       // initial normal references
        private _colors32: Float32Array;
        private _uvs32: Float32Array;
        private _index: number = 0;  // indices index
        private _updatable: boolean = true;
        private _pickable: boolean = false;
        private _isVisibilityBoxLocked = false;
        private _alwaysVisible: boolean = false;
        private _shapeCounter: number = 0;
        private _copy: SolidParticle = new SolidParticle(null, null, null, null, null);
        private _shape: Vector3[];
        private _shapeUV: number[];
        private _color: Color4 = new Color4(0, 0, 0, 0);
        private _computeParticleColor: boolean = true;
        private _computeParticleTexture: boolean = true;
        private _computeParticleRotation: boolean = true;
        private _computeParticleVertex: boolean = false;
        private _computeBoundingBox: boolean = false;
        private _cam_axisZ: Vector3 = Vector3.Zero();
        private _cam_axisY: Vector3 = Vector3.Zero();
        private _cam_axisX: Vector3 = Vector3.Zero();
        private _axisX: Vector3 = Axis.X;
        private _axisY: Vector3 = Axis.Y;
        private _axisZ: Vector3 = Axis.Z;
        private _camera: Camera;
        private _particle: SolidParticle;
        private _fakeCamPos: Vector3 = Vector3.Zero();
        private _rotMatrix: Matrix = new Matrix();
        private _invertMatrix: Matrix = new Matrix();
        private _rotated: Vector3 = Vector3.Zero();
        private _quaternion: Quaternion = new Quaternion();
        private _vertex: Vector3 = Vector3.Zero();
        private _normal: Vector3 = Vector3.Zero();
        private _yaw: number = 0.0;
        private _pitch: number = 0.0;
        private _roll: number = 0.0;
        private _halfroll: number = 0.0;
        private _halfpitch: number = 0.0;
        private _halfyaw: number = 0.0;
        private _sinRoll: number = 0.0;
        private _cosRoll: number = 0.0;
        private _sinPitch: number = 0.0;
        private _cosPitch: number = 0.0;
        private _sinYaw: number = 0.0;
        private _cosYaw: number = 0.0;
        private _w: number = 0.0;
        private _minimum: Vector3 = Tmp.Vector3[0];
        private _maximum: Vector3 = Tmp.Vector3[1];

        
        /**
        * Creates a SPS (Solid Particle System) object.
        * @param name the SPS name, this will be the underlying mesh name
        * @param scene the scene in which the SPS is added
        * @param options "updatable" (default true) : if the SPS must be updatable or immutable, "isPickable" (default false) : if the solid particles must be pickable
        */
        constructor(name: string, scene: Scene, options?: { updatable?: boolean; isPickable?: boolean }) {
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
            this._pickable = options ? options.isPickable : false;
            if (options && options.updatable) {
                this._updatable = options.updatable;
            } else {
                this._updatable = true;
            }
            if (this._pickable) {
                this.pickedParticles = [];
            }
        }

        /**
        * Builds the SPS underlying mesh. Returns a standard Mesh.
        * If no model shape was added to the SPS, the return mesh is only a single triangular plane.
        */
        public buildMesh(): Mesh {
            if (this.nbParticles === 0) {
                var triangle = MeshBuilder.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
            }
            this._positions32 = new Float32Array(this._positions);
            this._uvs32 = new Float32Array(this._uvs);
            this._colors32 = new Float32Array(this._colors);
            VertexData.ComputeNormals(this._positions32, this._indices, this._normals);
            this._normals32 = new Float32Array(this._normals);
            this._fixedNormal32 = new Float32Array(this._normals);
            var vertexData = new VertexData();
            vertexData.set(this._positions32, VertexBuffer.PositionKind);
            vertexData.indices = this._indices;
            vertexData.set(this._normals32, VertexBuffer.NormalKind);
            if (this._uvs32) {
                vertexData.set(this._uvs32, VertexBuffer.UVKind);;
            }
            if (this._colors32) {
                vertexData.set(this._colors32, VertexBuffer.ColorKind);
            }
            var mesh = new Mesh(this.name, this._scene);
            vertexData.applyToMesh(mesh, this._updatable);
            this.mesh = mesh;
            this.mesh.isPickable = this._pickable;

            // free memory
            this._positions = null;
            this._normals = null;
            this._uvs = null;
            this._colors = null;

            if (!this._updatable) {
                this.particles.length = 0;
            }

            return mesh;
        }

        /**
        * Digests the mesh and generates as many solid particles in the system as wanted.
        * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
        * Thus the particles generated from digest() have their property "positiion" yet set.
        * @param mesh the mesh to be digested
        * @param facetNb the number of mesh facets per particle (optional, default 1), this parameter is overriden by the parameter "number" if any
        * @param number the wanted number of particles : each particle is built with mesh_total_facets / number facets (optional)
        */
        public digest(mesh: Mesh, options?: { facetNb?: number; number?: number }): void {
            var size: number = (options && options.facetNb) || 1;
            var number: number = (options && options.number);
            var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);

            var f: number = 0;                              // facet counter
            var totalFacets: number = meshInd.length / 3;   // a facet is a triangle, so 3 indices
            // compute size from number
            if (number) {
                number = (number > totalFacets) ? totalFacets : number;
                size = Math.round(totalFacets / number);
            } else {
                size = (size > totalFacets) ? totalFacets : size;
            }

            var facetPos: number[] = [];      // submesh positions
            var facetInd: number[] = [];      // submesh indices
            var facetUV: number[] = [];       // submesh UV
            var facetCol: number[] = [];      // submesh colors
            var barycenter: Vector3 = Tmp.Vector3[0];

            while (f < totalFacets) {
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
                var modelShape = new ModelShape(this._shapeCounter, shape, shapeUV, null, null);

                // add the particle in the SPS
                this._meshBuilder(this._index, shape, this._positions, facetInd, this._indices, facetUV, this._uvs, facetCol, this._colors, idx, 0, null);
                this._addParticle(idx, this._positions.length, modelShape, this._shapeCounter, 0);
                // initialize the particle position
                this.particles[this.nbParticles].position.addInPlace(barycenter);

                this._index += shape.length;
                idx++;
                this.nbParticles++;
                this._shapeCounter++;
                f += size;
            }
        }

        //reset copy
        private _resetCopy() {
            this._copy.position.x = 0;
            this._copy.position.y = 0;
            this._copy.position.z = 0;
            this._copy.rotation.x = 0;
            this._copy.rotation.y = 0;
            this._copy.rotation.z = 0;
            this._copy.quaternion = null;
            this._copy.scale.x = 1;
            this._copy.scale.y = 1;
            this._copy.scale.z = 1;
            this._copy.uvs.x = 0;
            this._copy.uvs.y = 0;
            this._copy.uvs.z = 1;
            this._copy.uvs.w = 1;
            this._copy.color = null;
        }

        // _meshBuilder : inserts the shape model in the global SPS mesh
        private _meshBuilder(p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, idx, idxInShape, options): void {
            var i;
            var u = 0;
            var c = 0;

            this._resetCopy();
            if (options && options.positionFunction) {        // call to custom positionFunction
                options.positionFunction(this._copy, idx, idxInShape);
            }

            if (this._copy.quaternion) {
                this._quaternion.x = this._copy.quaternion.x;
                this._quaternion.y = this._copy.quaternion.y;
                this._quaternion.z = this._copy.quaternion.z;
                this._quaternion.w = this._copy.quaternion.w;
            } else {
                this._yaw = this._copy.rotation.y;
                this._pitch = this._copy.rotation.x;
                this._roll = this._copy.rotation.z;
                this._quaternionRotationYPR();
            }
            this._quaternionToRotationMatrix();

            for (i = 0; i < shape.length; i++) {
                this._vertex.x = shape[i].x;
                this._vertex.y = shape[i].y;
                this._vertex.z = shape[i].z;

                if (options && options.vertexFunction) {
                    options.vertexFunction(this._copy, this._vertex, i);
                }

                this._vertex.x *= this._copy.scale.x;
                this._vertex.y *= this._copy.scale.y;
                this._vertex.z *= this._copy.scale.z;

                Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                positions.push(this._copy.position.x + this._rotated.x, this._copy.position.y + this._rotated.y, this._copy.position.z + this._rotated.z);
                if (meshUV) {
                    uvs.push((this._copy.uvs.z - this._copy.uvs.x) * meshUV[u] + this._copy.uvs.x, (this._copy.uvs.w - this._copy.uvs.y) * meshUV[u + 1] + this._copy.uvs.y);
                    u += 2;
                }

                if (this._copy.color) {
                    this._color = this._copy.color;
                } else if (meshCol && meshCol[c]) {
                    this._color.r = meshCol[c];
                    this._color.g = meshCol[c + 1];
                    this._color.b = meshCol[c + 2];
                    this._color.a = meshCol[c + 3];
                } else {
                    this._color.r = 1;
                    this._color.g = 1;
                    this._color.b = 1;
                    this._color.a = 1;
                }
                colors.push(this._color.r, this._color.g, this._color.b, this._color.a);
                c += 4;

            }

            for (i = 0; i < meshInd.length; i++) {
                indices.push(p + meshInd[i]);
            }

            if (this._pickable) {
                var nbfaces = meshInd.length / 3;
                for (i = 0; i < nbfaces; i++) {
                    this.pickedParticles.push({ idx: idx, faceId: i });
                }
            }
        }

        // returns a shape array from positions array
        private _posToShape(positions): Vector3[] {
            var shape = [];
            for (var i = 0; i < positions.length; i += 3) {
                shape.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
            }
            return shape;
        }

        // returns a shapeUV array from a Vector4 uvs
        private _uvsToShapeUV(uvs): number[] {
            var shapeUV = [];
            if (uvs) {
                for (var i = 0; i < uvs.length; i++)
                    shapeUV.push(uvs[i]);
            }
            return shapeUV;
        }

        // adds a new particle object in the particles array
        private _addParticle(idx: number, idxpos: number, model: ModelShape, shapeId: number, idxInShape: number): void {
            this.particles.push(new SolidParticle(idx, idxpos, model, shapeId, idxInShape));
        }

        /**
        * Adds some particles to the SPS from the model shape.
        * Please read the doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#create-an-immutable-sps
        * @param mesh any Mesh object that will be used as a model for the solid particles.
        * @param nb the number of particles to be created from this model
        * @param options positionFunction is an optional javascript function to called for each particle on SPS creation. vertexFunction an optional javascript function to called for each vertex of each particle on SPS creation
        */
        public addShape(mesh: Mesh, nb: number, options?: { positionFunction?: any; vertexFunction?: any }): number {
            var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);

            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);

            var posfunc = options ? options.positionFunction : null;
            var vtxfunc = options ? options.vertexFunction : null;

            var modelShape = new ModelShape(this._shapeCounter, shape, shapeUV, posfunc, vtxfunc);

            // particles
            var idx = this.nbParticles;
            for (var i = 0; i < nb; i++) {
                this._meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors, idx, i, options);
                if (this._updatable) {
                    this._addParticle(idx, this._positions.length, modelShape, this._shapeCounter, i);
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
            if (particle._model._positionFunction) {        // recall to stored custom positionFunction
                particle._model._positionFunction(this._copy, particle.idx, particle.idxInShape);
            }

            if (this._copy.quaternion) {
                this._quaternion.x = this._copy.quaternion.x;
                this._quaternion.y = this._copy.quaternion.y;
                this._quaternion.z = this._copy.quaternion.z;
                this._quaternion.w = this._copy.quaternion.w;
            } else {
                this._yaw = this._copy.rotation.y;
                this._pitch = this._copy.rotation.x;
                this._roll = this._copy.rotation.z;
                this._quaternionRotationYPR();
            }
            this._quaternionToRotationMatrix();

            this._shape = particle._model._shape;
            for (var pt = 0; pt < this._shape.length; pt++) {
                this._vertex.x = this._shape[pt].x;
                this._vertex.y = this._shape[pt].y;
                this._vertex.z = this._shape[pt].z;

                if (particle._model._vertexFunction) {
                    particle._model._vertexFunction(this._copy, this._vertex, pt); // recall to stored vertexFunction
                }

                this._vertex.x *= this._copy.scale.x;
                this._vertex.y *= this._copy.scale.y;
                this._vertex.z *= this._copy.scale.z;

                Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);

                this._positions32[particle._pos + pt * 3] = this._copy.position.x + this._rotated.x;
                this._positions32[particle._pos + pt * 3 + 1] = this._copy.position.y + this._rotated.y;
                this._positions32[particle._pos + pt * 3 + 2] = this._copy.position.z + this._rotated.z;
            }
            particle.position.x = 0;
            particle.position.y = 0;
            particle.position.z = 0;
            particle.rotation.x = 0;
            particle.rotation.y = 0;
            particle.rotation.z = 0;
            particle.quaternion = null;
            particle.scale.x = 1;
            particle.scale.y = 1;
            particle.scale.z = 1;
        }

        /**
        * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
        */
        public rebuildMesh(): void {
            for (var p = 0; p < this.particles.length; p++) {
                this._rebuildParticle(this.particles[p]);
            }
            this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions32, false, false);
        }


        /**
        *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
        *  This method calls updateParticle() for each particles of the SPS.
        *  For an animated SPS, it is usually called within the render loop.
        * @param start (default 0) the particle index in the particle array where to start to compute the particle property values
        * @param end (default nbParticle - 1)  the particle index in the particle array where to stop to compute the particle property values
        * @param update (default true) if the mesh must be finally updated on this call after all the particle computations.
        */
        public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): void {
            if (!this._updatable) {
                return;
            }

            // custom beforeUpdate
            this.beforeUpdateParticles(start, end, update);

            this._cam_axisX.x = 1;
            this._cam_axisX.y = 0;
            this._cam_axisX.z = 0;

            this._cam_axisY.x = 0;
            this._cam_axisY.y = 1;
            this._cam_axisY.z = 0;

            this._cam_axisZ.x = 0;
            this._cam_axisZ.y = 0;
            this._cam_axisZ.z = 1;

            // if the particles will always face the camera
            if (this.billboard) {
                // compute a fake camera position : un-rotate the camera position by the current mesh rotation
                this._yaw = this.mesh.rotation.y;
                this._pitch = this.mesh.rotation.x;
                this._roll = this.mesh.rotation.z;
                this._quaternionRotationYPR();
                this._quaternionToRotationMatrix();
                this._rotMatrix.invertToRef(this._invertMatrix);
                Vector3.TransformCoordinatesToRef(this._camera.globalPosition, this._invertMatrix, this._fakeCamPos);

                // set two orthogonal vectors (_cam_axisX and and _cam_axisY) to the cam-mesh axis (_cam_axisZ)
                (this._fakeCamPos).subtractToRef(this.mesh.position, this._cam_axisZ);
                Vector3.CrossToRef(this._cam_axisZ, this._axisX, this._cam_axisY);
                Vector3.CrossToRef(this._cam_axisZ, this._cam_axisY, this._cam_axisX);
                this._cam_axisY.normalize();
                this._cam_axisX.normalize();
                this._cam_axisZ.normalize();
            }

            Matrix.IdentityToRef(this._rotMatrix);
            var idx = 0;
            var index = 0;
            var colidx = 0;
            var colorIndex = 0;
            var uvidx = 0;
            var uvIndex = 0;

            if (this._computeBoundingBox) {
                Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this._minimum);
                Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this._maximum);
            }

            // particle loop
            end = (end > this.nbParticles - 1) ? this.nbParticles - 1 : end;
            for (var p = start; p <= end; p++) {
                this._particle = this.particles[p];
                this._shape = this._particle._model._shape;
                this._shapeUV = this._particle._model._shapeUV;

                // call to custom user function to update the particle properties
                this.updateParticle(this._particle);

                // particle rotation matrix
                if (this.billboard) {
                    this._particle.rotation.x = 0.0;
                    this._particle.rotation.y = 0.0;
                }
                if (this._computeParticleRotation) {
                    if (this._particle.quaternion) {
                        this._quaternion.x = this._particle.quaternion.x;
                        this._quaternion.y = this._particle.quaternion.y;
                        this._quaternion.z = this._particle.quaternion.z;
                        this._quaternion.w = this._particle.quaternion.w;
                    } else {
                        this._yaw = this._particle.rotation.y;
                        this._pitch = this._particle.rotation.x;
                        this._roll = this._particle.rotation.z;
                        this._quaternionRotationYPR();
                    }
                    this._quaternionToRotationMatrix();
                }

                for (var pt = 0; pt < this._shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;

                    this._vertex.x = this._shape[pt].x;
                    this._vertex.y = this._shape[pt].y;
                    this._vertex.z = this._shape[pt].z;

                    if (this._computeParticleVertex) {
                        this.updateParticleVertex(this._particle, this._vertex, pt);
                    }

                    // positions
                    this._vertex.x *= this._particle.scale.x;
                    this._vertex.y *= this._particle.scale.y;
                    this._vertex.z *= this._particle.scale.z;

                    this._w = (this._vertex.x * this._rotMatrix.m[3]) + (this._vertex.y * this._rotMatrix.m[7]) + (this._vertex.z * this._rotMatrix.m[11]) + this._rotMatrix.m[15];
                    this._rotated.x = ((this._vertex.x * this._rotMatrix.m[0]) + (this._vertex.y * this._rotMatrix.m[4]) + (this._vertex.z * this._rotMatrix.m[8]) + this._rotMatrix.m[12]) / this._w;
                    this._rotated.y = ((this._vertex.x * this._rotMatrix.m[1]) + (this._vertex.y * this._rotMatrix.m[5]) + (this._vertex.z * this._rotMatrix.m[9]) + this._rotMatrix.m[13]) / this._w;
                    this._rotated.z = ((this._vertex.x * this._rotMatrix.m[2]) + (this._vertex.y * this._rotMatrix.m[6]) + (this._vertex.z * this._rotMatrix.m[10]) + this._rotMatrix.m[14]) / this._w;

                    this._positions32[idx] = this._particle.position.x + this._cam_axisX.x * this._rotated.x + this._cam_axisY.x * this._rotated.y + this._cam_axisZ.x * this._rotated.z;
                    this._positions32[idx + 1] = this._particle.position.y + this._cam_axisX.y * this._rotated.x + this._cam_axisY.y * this._rotated.y + this._cam_axisZ.y * this._rotated.z;
                    this._positions32[idx + 2] = this._particle.position.z + this._cam_axisX.z * this._rotated.x + this._cam_axisY.z * this._rotated.y + this._cam_axisZ.z * this._rotated.z;

                    if (this._computeBoundingBox) {
                        if (this._positions32[idx] < this._minimum.x) {
                            this._minimum.x = this._positions32[idx];
                        }
                        if (this._positions32[idx] > this._maximum.x) {
                            this._maximum.x = this._positions32[idx];
                        }
                        if (this._positions32[idx + 1] < this._minimum.y) {
                            this._minimum.y = this._positions32[idx + 1];
                        }
                        if (this._positions32[idx + 1] > this._maximum.y) {
                            this._maximum.y = this._positions32[idx + 1];
                        }
                        if (this._positions32[idx + 2] < this._minimum.z) {
                            this._minimum.z = this._positions32[idx + 2];
                        }
                        if (this._positions32[idx + 2] > this._maximum.z) {
                            this._maximum.z = this._positions32[idx + 2];
                        }
                    }

                    // normals : if the particles can't be morphed then just rotate the normals
                    if (!this._computeParticleVertex && !this.billboard) {
                        this._normal.x = this._fixedNormal32[idx];
                        this._normal.y = this._fixedNormal32[idx + 1];
                        this._normal.z = this._fixedNormal32[idx + 2];

                        this._w = (this._normal.x * this._rotMatrix.m[3]) + (this._normal.y * this._rotMatrix.m[7]) + (this._normal.z * this._rotMatrix.m[11]) + this._rotMatrix.m[15];
                        this._rotated.x = ((this._normal.x * this._rotMatrix.m[0]) + (this._normal.y * this._rotMatrix.m[4]) + (this._normal.z * this._rotMatrix.m[8]) + this._rotMatrix.m[12]) / this._w;
                        this._rotated.y = ((this._normal.x * this._rotMatrix.m[1]) + (this._normal.y * this._rotMatrix.m[5]) + (this._normal.z * this._rotMatrix.m[9]) + this._rotMatrix.m[13]) / this._w;
                        this._rotated.z = ((this._normal.x * this._rotMatrix.m[2]) + (this._normal.y * this._rotMatrix.m[6]) + (this._normal.z * this._rotMatrix.m[10]) + this._rotMatrix.m[14]) / this._w;

                        this._normals32[idx] = this._cam_axisX.x * this._rotated.x + this._cam_axisY.x * this._rotated.y + this._cam_axisZ.x * this._rotated.z;
                        this._normals32[idx + 1] = this._cam_axisX.y * this._rotated.x + this._cam_axisY.y * this._rotated.y + this._cam_axisZ.y * this._rotated.z;
                        this._normals32[idx + 2] = this._cam_axisX.z * this._rotated.x + this._cam_axisY.z * this._rotated.y + this._cam_axisZ.z * this._rotated.z;
                    }

                    if (this._computeParticleColor) {
                        this._colors32[colidx] = this._particle.color.r;
                        this._colors32[colidx + 1] = this._particle.color.g;
                        this._colors32[colidx + 2] = this._particle.color.b;
                        this._colors32[colidx + 3] = this._particle.color.a;
                    }

                    if (this._computeParticleTexture) {
                        this._uvs32[uvidx] = this._shapeUV[pt * 2] * (this._particle.uvs.z - this._particle.uvs.x) + this._particle.uvs.x;
                        this._uvs32[uvidx + 1] = this._shapeUV[pt * 2 + 1] * (this._particle.uvs.w - this._particle.uvs.y) + this._particle.uvs.y;
                    }
                }
                index = idx + 3;
                colorIndex = colidx + 4;
                uvIndex = uvidx + 2;
            }

            if (update) {
                if (this._computeParticleColor) {
                    this.mesh.updateVerticesData(VertexBuffer.ColorKind, this._colors32, false, false);
                }
                if (this._computeParticleTexture) {
                    this.mesh.updateVerticesData(VertexBuffer.UVKind, this._uvs32, false, false);
                }
                this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions32, false, false);
                if (!this.mesh.areNormalsFrozen) {
                    if (this._computeParticleVertex || this.billboard) {
                        // recompute the normals only if the particles can be morphed, update then the normal reference array
                        VertexData.ComputeNormals(this._positions32, this._indices, this._normals32);
                        for (var i = 0; i < this._normals32.length; i++) {
                            this._fixedNormal32[i] = this._normals32[i];
                        }
                    }
                    this.mesh.updateVerticesData(VertexBuffer.NormalKind, this._normals32, false, false);
                }
            }
            if (this._computeBoundingBox) {
                this.mesh._boundingInfo = new BoundingInfo(this._minimum, this._maximum);
                this.mesh._boundingInfo.update(this.mesh._worldMatrix);
            }
            this.afterUpdateParticles(start, end, update);
        }

        private _quaternionRotationYPR(): void {
            this._halfroll = this._roll * 0.5;
            this._halfpitch = this._pitch * 0.5;
            this._halfyaw = this._yaw * 0.5;
            this._sinRoll = Math.sin(this._halfroll);
            this._cosRoll = Math.cos(this._halfroll);
            this._sinPitch = Math.sin(this._halfpitch);
            this._cosPitch = Math.cos(this._halfpitch);
            this._sinYaw = Math.sin(this._halfyaw);
            this._cosYaw = Math.cos(this._halfyaw);
            this._quaternion.x = (this._cosYaw * this._sinPitch * this._cosRoll) + (this._sinYaw * this._cosPitch * this._sinRoll);
            this._quaternion.y = (this._sinYaw * this._cosPitch * this._cosRoll) - (this._cosYaw * this._sinPitch * this._sinRoll);
            this._quaternion.z = (this._cosYaw * this._cosPitch * this._sinRoll) - (this._sinYaw * this._sinPitch * this._cosRoll);
            this._quaternion.w = (this._cosYaw * this._cosPitch * this._cosRoll) + (this._sinYaw * this._sinPitch * this._sinRoll);
        }

        private _quaternionToRotationMatrix(): void {
            this._rotMatrix.m[0] = 1.0 - (2.0 * (this._quaternion.y * this._quaternion.y + this._quaternion.z * this._quaternion.z));
            this._rotMatrix.m[1] = 2.0 * (this._quaternion.x * this._quaternion.y + this._quaternion.z * this._quaternion.w);
            this._rotMatrix.m[2] = 2.0 * (this._quaternion.z * this._quaternion.x - this._quaternion.y * this._quaternion.w);
            this._rotMatrix.m[3] = 0;
            this._rotMatrix.m[4] = 2.0 * (this._quaternion.x * this._quaternion.y - this._quaternion.z * this._quaternion.w);
            this._rotMatrix.m[5] = 1.0 - (2.0 * (this._quaternion.z * this._quaternion.z + this._quaternion.x * this._quaternion.x));
            this._rotMatrix.m[6] = 2.0 * (this._quaternion.y * this._quaternion.z + this._quaternion.x * this._quaternion.w);
            this._rotMatrix.m[7] = 0;
            this._rotMatrix.m[8] = 2.0 * (this._quaternion.z * this._quaternion.x + this._quaternion.y * this._quaternion.w);
            this._rotMatrix.m[9] = 2.0 * (this._quaternion.y * this._quaternion.z - this._quaternion.x * this._quaternion.w);
            this._rotMatrix.m[10] = 1.0 - (2.0 * (this._quaternion.y * this._quaternion.y + this._quaternion.x * this._quaternion.x));
            this._rotMatrix.m[11] = 0;
            this._rotMatrix.m[12] = 0;
            this._rotMatrix.m[13] = 0;
            this._rotMatrix.m[14] = 0;
            this._rotMatrix.m[15] = 1.0;
        }

        /**
        * Disposes the SPS
        */
        public dispose(): void {
            this.mesh.dispose();
            this.vars = null;
            // drop references to internal big arrays for the GC
            this._positions = null;
            this._indices = null;
            this._normals = null;
            this._uvs = null;
            this._colors = null;
            this._positions32 = null;
            this._normals32 = null;
            this._fixedNormal32 = null;
            this._uvs32 = null;
            this._colors32 = null;
            this.pickedParticles = null;
        }

        /**
        *  Visibilty helper : Recomputes the visible size according to the mesh bounding box
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#sps-visibility
        */
        public refreshVisibleSize(): void {
            if (!this._isVisibilityBoxLocked) {
                this.mesh.refreshBoundingInfo();
            }
        }

        /** Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
        * @param size the size (float) of the visibility box
        * note : this doesn't lock the SPS mesh bounding box.
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#sps-visibility
        */
        public setVisibilityBox(size: number): void {
            var vis = size / 2;
            this.mesh._boundingInfo = new BoundingInfo(new Vector3(-vis, -vis, -vis), new Vector3(vis, vis, vis));
        }


        // getter and setter
        /**
        * True if the SPS is set as always visible
        */
        public get isAlwaysVisible(): boolean {
            return this._alwaysVisible;
        }

        /**
        * Sets the SPS as always visible or not
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#sps-visibility
        */
        public set isAlwaysVisible(val: boolean) {
            this._alwaysVisible = val;
            this.mesh.alwaysSelectAsActiveMesh = val;
        }

        /**
        * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#sps-visibility
        */
        public set isVisibilityBoxLocked(val: boolean) {
            this._isVisibilityBoxLocked = val;
            this.mesh.getBoundingInfo().isLocked = val;
        }

        /**
        * True if the SPS visibility box is locked. The underlying mesh bounding box is then not updatable any more.
        */
        public get isVisibilityBoxLocked(): boolean {
            return this._isVisibilityBoxLocked;
        }

        // Optimizer setters
        /**
        * Tells to setParticles() to compute the particle rotations or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle rotations aren't stored values, so setting computeParticleRotation to false will prevents the particle to rotate.
        */
        public set computeParticleRotation(val: boolean) {
            this._computeParticleRotation = val;
        }
        /**
        * Tells to setParticles() to compute the particle colors or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle colors are stored values, so setting computeParticleColor to false will keep yet the last colors set.
        */
        public set computeParticleColor(val: boolean) {
            this._computeParticleColor = val;
        }
        /**
        * Tells to setParticles() to compute the particle textures or not.
        * Default value : true. The SPS is faster when it's set to false.
        * Note : the particle textures are stored values, so setting computeParticleTexture to false will keep yet the last colors set.
        */
        public set computeParticleTexture(val: boolean) {
            this._computeParticleTexture = val;
        }
        /**
        * Tells to setParticles() to call the vertex function for each vertex of each particle, or not.
        * Default value : false. The SPS is faster when it's set to false.
        * Note : the particle custom vertex positions aren't stored values.
        */
        public set computeParticleVertex(val: boolean) {
            this._computeParticleVertex = val;
        }
        /**
        * Tells to setParticles() to compute or not the mesh bounding box when computing the particle positions.
        */
        public set computeBoundingBox(val: boolean) {
            this._computeBoundingBox = val;
        }

        // getters
        public get computeParticleRotation(): boolean {
            return this._computeParticleRotation;
        }

        public get computeParticleColor(): boolean {
            return this._computeParticleColor;
        }

        public get computeParticleTexture(): boolean {
            return this._computeParticleTexture;
        }

        public get computeParticleVertex(): boolean {
            return this._computeParticleVertex;
        }

        public get computeBoundingBox(): boolean {
            return this._computeBoundingBox;
        }

        // =======================================================================
        // Particle behavior logic
        // these following methods may be overwritten by the user to fit his needs


        /**
        * This function does nothing. It may be overwritten to set all the particles first values.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#particle-management
        */
        public initParticles(): void {
        }

        /**
        * This function does nothing. It may be overwritten to recycle a particle.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#particle-management
        */
        public recycleParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        /**
        * Updates a particle : this function should  be overwritten by the user.
        * It is called on each particle by setParticles(). This is the place to code each particle behavior.
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#particle-management
        * ex : just set a particle position or velocity and recycle conditions
        */
        public updateParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        /**
        * Updates a vertex of a particle : it can be overwritten by the user.
        * This will be called on each vertex particle by setParticles() if computeParticleVertex is set to true only.
        * @param particle the current particle
        * @param vertex the current index of the current particle
        * @param pt the index of the current vertex in the particle shape
        * doc : http://doc.babylonjs.com/tutorials/Solid_Particle_System#update-each-particle-shape
        * ex : just set a vertex particle position
        */
        public updateParticleVertex(particle: SolidParticle, vertex: Vector3, pt: number): Vector3 {
            return vertex;
        }

        /**
        * This will be called before any other treatment by setParticles() and will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        public beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void {
        }
        /**
        * This will be called  by setParticles() after all the other treatments and just before the actual mesh update.
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
