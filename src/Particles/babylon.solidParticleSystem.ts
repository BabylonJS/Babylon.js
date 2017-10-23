module BABYLON {
    
        /**
        * Full documentation here : http://doc.babylonjs.com/overviews/Solid_Particle_System
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
            private _depthSort: boolean = false;
            private _shapeCounter: number = 0;
            private _copy: SolidParticle = new SolidParticle(null, null, null, null, null, null, null);
            private _shape: Vector3[];
            private _shapeUV: number[];
            private _color: Color4 = new Color4(0, 0, 0, 0);
            private _computeParticleColor: boolean = true;
            private _computeParticleTexture: boolean = true;
            private _computeParticleRotation: boolean = true;
            private _computeParticleVertex: boolean = false;
            private _computeBoundingBox: boolean = false;
            private _depthSortParticles: boolean = true;
            private _cam_axisZ: Vector3 = Vector3.Zero();
            private _cam_axisY: Vector3 = Vector3.Zero();
            private _cam_axisX: Vector3 = Vector3.Zero();
            private _axisZ: Vector3 = Axis.Z;
            private _camera: TargetCamera;
            private _particle: SolidParticle;
            private _camDir: Vector3 = Vector3.Zero();
            private _camInvertedPosition: Vector3 = Vector3.Zero();
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
            private _mustUnrotateFixedNormals = false;
            private _minimum: Vector3 = Tmp.Vector3[0];
            private _maximum: Vector3 = Tmp.Vector3[1];
            private _minBbox: Vector3 = Tmp.Vector3[4];
            private _maxBbox: Vector3 = Tmp.Vector3[5];
            private _particlesIntersect: boolean = false;
            private _depthSortFunction: (p1: DepthSortedParticle, p2: DepthSortedParticle) => number = 
                function(p1, p2) {
                    return (p2.sqDistance - p1.sqDistance);
                };
            private _depthSortedIndices: IndicesArray;
            private _needs32Bits: boolean = false;
            public _bSphereOnly: boolean = false;
            public _bSphereRadiusFactor: number = 1.0;
    
    
            /**
            * Creates a SPS (Solid Particle System) object.
            * `name` (String) is the SPS name, this will be the underlying mesh name.  
            * `scene` (Scene) is the scene in which the SPS is added.  
            * `updatable` (optional boolean, default true) : if the SPS must be updatable or immutable.  
            * `isPickable` (optional boolean, default false) : if the solid particles must be pickable.  
            * `enableDepthSort` (optional boolean, default false) : if the solid particles must be sorted in the geometry according to their distance to the camera.  
            * `particleIntersection` (optional boolean, default false) : if the solid particle intersections must be computed.    
            * `boundingSphereOnly` (optional boolean, default false) : if the particle intersection must be computed only with the bounding sphere (no bounding box computation, so faster).  
            * `bSphereRadiusFactor` (optional float, default 1.0) : a number to multiply the boundind sphere radius by in order to reduce it for instance. 
            *  Example : bSphereRadiusFactor = 1.0 / Math.sqrt(3.0) => the bounding sphere exactly matches a spherical mesh.  
            */
            constructor(name: string, scene: Scene, options?: { updatable?: boolean; isPickable?: boolean; enableDepthSort?: boolean; particleIntersection?: boolean; boundingSphereOnly?: boolean; bSphereRadiusFactor?: number }) {
                this.name = name;
                this._scene = scene || Engine.LastCreatedScene;
                this._camera = <TargetCamera>scene.activeCamera;
                this._pickable = options ? options.isPickable : false;
                this._depthSort = options ? options.enableDepthSort : false;
                this._particlesIntersect = options ? options.particleIntersection : false;
                this._bSphereOnly= options ? options.boundingSphereOnly : false;
                this._bSphereRadiusFactor = (options && options.bSphereRadiusFactor) ? options.bSphereRadiusFactor : 1.0;
                if (options && options.updatable) {
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
                if (this.recomputeNormals) {
                    VertexData.ComputeNormals(this._positions32, this._indices, this._normals);
                }
                this._normals32 = new Float32Array(this._normals);
                this._fixedNormal32 = new Float32Array(this._normals);
                if (this._mustUnrotateFixedNormals) {  // the particles could be created already rotated in the mesh with a positionFunction
                    this._unrotateFixedNormals();
                }
                var vertexData = new VertexData();
                if (this._depthSort) {
                    this._depthSortedIndices = (this._needs32Bits) ? new Uint32Array(this._indices) : new Uint16Array(this._indices);
                    vertexData.indices = this._depthSortedIndices;
                }
                else {
                    vertexData.indices = this._indices;
                }
                vertexData.set(this._positions32, VertexBuffer.PositionKind);
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
            * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.  
            * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
            * Thus the particles generated from `digest()` have their property `position` set yet.  
            * `mesh` ( Mesh ) is the mesh to be digested  
            * `facetNb` (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
            * `delta` (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
            * `number` (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
            */
            public digest(mesh: Mesh, options?: { facetNb?: number; number?: number; delta?: number }): SolidParticleSystem {
                var size: number = (options && options.facetNb) || 1;
                var number: number = (options && options.number);
                var delta: number = (options && options.delta) || 0;
                var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
                var meshInd = mesh.getIndices();
                var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
                var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);
                var meshNor = mesh.getVerticesData(VertexBuffer.NormalKind);
    
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
                var barycenter: Vector3 = Tmp.Vector3[0];
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
                for (var p = 0; p < this.particles.length; p++) {
                    this._particle = this.particles[p];
                    this._shape = this._particle._model._shape;
                    if (this._particle.rotationQuaternion) {
                        this._quaternion.copyFrom(this._particle.rotationQuaternion);
                    } 
                    else {
                        this._yaw = this._particle.rotation.y;
                        this._pitch = this._particle.rotation.x;
                        this._roll = this._particle.rotation.z;
                        this._quaternionRotationYPR();
                    }
                    this._quaternionToRotationMatrix();
                    this._rotMatrix.invertToRef(this._invertMatrix);
    
                    for (var pt = 0; pt < this._shape.length; pt++) {
                        idx = index + pt * 3;
                        Vector3.TransformNormalFromFloatsToRef(this._normals32[idx], this._normals32[idx + 1], this._normals32[idx + 2], this._invertMatrix, this._normal);
                        this._fixedNormal32[idx] = this._normal.x;
                        this._fixedNormal32[idx + 1] = this._normal.y;
                        this._fixedNormal32[idx + 2] = this._normal.z;
                    }
                    index = idx + 3;
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
                this._copy.rotationQuaternion = null;
                this._copy.scaling.x = 1.0;
                this._copy.scaling.y = 1.0;
                this._copy.scaling.z = 1.0;
                this._copy.uvs.x = 0;
                this._copy.uvs.y = 0;
                this._copy.uvs.z = 1.0;
                this._copy.uvs.w = 1.0;
                this._copy.color = null;
            }
    
            // _meshBuilder : inserts the shape model in the global SPS mesh
            private _meshBuilder(p: number, shape: Vector3[], positions: number[], meshInd: IndicesArray, indices: number[], meshUV: number[]|Float32Array, uvs: number[], meshCol: number[]|Float32Array, colors: number[], meshNor: number[]|Float32Array, normals: number[], idx: number, idxInShape: number, options: any): SolidParticle {
                var i;
                var u = 0;
                var c = 0;
                var n = 0;
    
                this._resetCopy();
                if (options && options.positionFunction) {        // call to custom positionFunction
                    options.positionFunction(this._copy, idx, idxInShape);
                    this._mustUnrotateFixedNormals = true;
                }
    
                if (this._copy.rotationQuaternion) {
                    this._quaternion.copyFrom(this._copy.rotationQuaternion);
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
    
                    this._vertex.x *= this._copy.scaling.x;
                    this._vertex.y *= this._copy.scaling.y;
                    this._vertex.z *= this._copy.scaling.z;
    
                    Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                    positions.push(this._copy.position.x + this._rotated.x, this._copy.position.y + this._rotated.y, this._copy.position.z + this._rotated.z);
                    if (meshUV) {
                        uvs.push((this._copy.uvs.z - this._copy.uvs.x) * meshUV[u] + this._copy.uvs.x, (this._copy.uvs.w - this._copy.uvs.y) * meshUV[u + 1] + this._copy.uvs.y);
                        u += 2;
                    }
    
                    if (this._copy.color) {
                        this._color = this._copy.color;
                    } else if (meshCol && meshCol[c] !== undefined) {
                        this._color.r = meshCol[c];
                        this._color.g = meshCol[c + 1];
                        this._color.b = meshCol[c + 2];
                        this._color.a = meshCol[c + 3];
                    } else {
                        this._color.r = 1.0;
                        this._color.g = 1.0;
                        this._color.b = 1.0;
                        this._color.a = 1.0;
                    }
                    colors.push(this._color.r, this._color.g, this._color.b, this._color.a);
                    c += 4;
    
                    if (!this.recomputeNormals && meshNor) {
                        this._normal.x = meshNor[n];
                        this._normal.y = meshNor[n + 1];
                        this._normal.z = meshNor[n + 2];
                        Vector3.TransformNormalToRef(this._normal, this._rotMatrix, this._normal);
                        normals.push(this._normal.x, this._normal.y, this._normal.z);
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
    
                return this._copy;
            }
    
            // returns a shape array from positions array
            private _posToShape(positions: number[]|Float32Array): Vector3[] {
                var shape = [];
                for (var i = 0; i < positions.length; i += 3) {
                    shape.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
                }
                return shape;
            }
    
            // returns a shapeUV array from a Vector4 uvs
            private _uvsToShapeUV(uvs: number[]|Float32Array): number[] {
                var shapeUV = [];
                if (uvs) {
                    for (var i = 0; i < uvs.length; i++)
                        shapeUV.push(uvs[i]);
                }
                return shapeUV;
            }
    
            // adds a new particle object in the particles array
            private _addParticle(idx: number, idxpos: number, idxind: number, model: ModelShape, shapeId: number, idxInShape: number, bInfo?: BoundingInfo): SolidParticle {
                var sp = new SolidParticle(idx, idxpos, idxind, model, shapeId, idxInShape, this, bInfo);
                this.particles.push(sp);
                return sp;
            }
    
            /**
            * Adds some particles to the SPS from the model shape. Returns the shape id.   
            * Please read the doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#create-an-immutable-sps
            * `mesh` is any Mesh object that will be used as a model for the solid particles.
            * `nb` (positive integer) the number of particles to be created from this model
            * `positionFunction` is an optional javascript function to called for each particle on SPS creation. 
            * `vertexFunction` is an optional javascript function to called for each vertex of each particle on SPS creation
            */
            public addShape(mesh: Mesh, nb: number, options?: { positionFunction?: any; vertexFunction?: any }): number {
                var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
                var meshInd = mesh.getIndices();
                var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
                var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);
                var meshNor = mesh.getVerticesData(VertexBuffer.NormalKind);
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
                        if (currentCopy.rotationQuaternion) {
                            sp.rotationQuaternion.copyFrom(currentCopy.rotationQuaternion);
                        }
                        if (currentCopy.color) {
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
                if (particle._model._positionFunction) {        // recall to stored custom positionFunction
                    particle._model._positionFunction(this._copy, particle.idx, particle.idxInShape);
                }
    
                if (this._copy.rotationQuaternion) {
                    this._quaternion.copyFrom(this._copy.rotationQuaternion);
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
    
                    this._vertex.x *= this._copy.scaling.x;
                    this._vertex.y *= this._copy.scaling.y;
                    this._vertex.z *= this._copy.scaling.z;
    
                    Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
    
                    this._positions32[particle._pos + pt * 3] = this._copy.position.x + this._rotated.x;
                    this._positions32[particle._pos + pt * 3 + 1] = this._copy.position.y + this._rotated.y;
                    this._positions32[particle._pos + pt * 3 + 2] = this._copy.position.z + this._rotated.z;
                }
                particle.position.x = 0.0;
                particle.position.y = 0.0;
                particle.position.z = 0.0;
                particle.rotation.x = 0.0;
                particle.rotation.y = 0.0;
                particle.rotation.z = 0.0;
                particle.rotationQuaternion = null;
                particle.scaling.x = 1.0;
                particle.scaling.y = 1.0;
                particle.scaling.z = 1.0;
            }
    
            /**
            * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.  
            * Returns the SPS.  
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
            * Returns the SPS.  
            */
            public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): SolidParticleSystem {
                if (!this._updatable) {
                    return this;
                }
    
                // custom beforeUpdate
                this.beforeUpdateParticles(start, end, update);
    
                this._cam_axisX.x = 1.0;
                this._cam_axisX.y = 0.0;
                this._cam_axisX.z = 0.0;
    
                this._cam_axisY.x = 0.0;
                this._cam_axisY.y = 1.0;
                this._cam_axisY.z = 0.0;
    
                this._cam_axisZ.x = 0.0;
                this._cam_axisZ.y = 0.0;
                this._cam_axisZ.z = 1.0;
    
                // cases when the World Matrix is to be computed first
                if (this.billboard || this._depthSort) {
                    this.mesh.computeWorldMatrix(true);
                    this.mesh._worldMatrix.invertToRef(this._invertMatrix);
                }
                // if the particles will always face the camera
                if (this.billboard) {
                    // compute the camera position and un-rotate it by the current mesh rotation
                    this._camera.getDirectionToRef(this._axisZ, this._camDir);
                    Vector3.TransformNormalToRef(this._camDir, this._invertMatrix, this._cam_axisZ);                  
                    this._cam_axisZ.normalize();
                    // same for camera up vector extracted from the cam view matrix
                    var view = this._camera.getViewMatrix(true);
                    Vector3.TransformNormalFromFloatsToRef(view.m[1], view.m[5], view.m[9], this._invertMatrix, this._cam_axisY);
                    Vector3.CrossToRef(this._cam_axisY, this._cam_axisZ, this._cam_axisX);
                    this._cam_axisY.normalize();
                    this._cam_axisX.normalize();
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
                        Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this._minimum);
                        Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this._maximum);
                    }
                    else {      // only some particles are updated, then use the current existing BBox basis. Note : it can only increase.
                        this._minimum.copyFrom(this.mesh._boundingInfo.boundingBox.minimum);
                        this._maximum.copyFrom(this.mesh._boundingInfo.boundingBox.maximum);
                    }
                }
    
                // particle loop
                index = this.particles[start]._pos;
                var vpos = (index / 3)|0;
                colorIndex = vpos * 4;
                uvIndex = vpos * 2;
                for (var p = start; p <= end; p++) {
                    this._particle = this.particles[p];
                    this._shape = this._particle._model._shape;
                    this._shapeUV = this._particle._model._shapeUV;
    
                    // call to custom user function to update the particle properties
                    this.updateParticle(this._particle);

                    // camera-particle distance for depth sorting
                    if (this._depthSort && this._depthSortParticles) {
                        var dsp = this.depthSortedParticles[p];
                        dsp.ind = this._particle._ind;
                        dsp.indicesLength = this._particle._model._indicesLength;
                        dsp.sqDistance = Vector3.DistanceSquared(this._particle.position, this._camInvertedPosition);
                    }

                    // skip the computations for inactive or already invisible particles
                    if (!this._particle.alive || (this._particle._stillInvisible && !this._particle.isVisible)) {
                        // increment indexes for the next particle
                        pt = this._shape.length;
                        index += pt * 3;
                        colorIndex += pt * 4;
                        uvIndex += pt * 2;
                        continue;
                    }
    
                    if (this._particle.isVisible) {
                        this._particle._stillInvisible = false; // un-mark permanent invisibility
    
                        // particle rotation matrix
                        if (this.billboard) {
                            this._particle.rotation.x = 0.0;
                            this._particle.rotation.y = 0.0;
                        }
                        if (this._computeParticleRotation || this.billboard) {
                            if (this._particle.rotationQuaternion) {
                                this._quaternion.copyFrom(this._particle.rotationQuaternion);
                            } else {
                                this._yaw = this._particle.rotation.y;
                                this._pitch = this._particle.rotation.x;
                                this._roll = this._particle.rotation.z;
                                this._quaternionRotationYPR();
                            }
                            this._quaternionToRotationMatrix();
                        }
       
                        // particle vertex loop
                        for (pt = 0; pt < this._shape.length; pt++) {
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
                            this._vertex.x *= this._particle.scaling.x;
                            this._vertex.y *= this._particle.scaling.y;
                            this._vertex.z *= this._particle.scaling.z;
    
                            this._rotated.x = this._vertex.x * this._rotMatrix.m[0] + this._vertex.y * this._rotMatrix.m[4] + this._vertex.z * this._rotMatrix.m[8];
                            this._rotated.y = this._vertex.x * this._rotMatrix.m[1] + this._vertex.y * this._rotMatrix.m[5] + this._vertex.z * this._rotMatrix.m[9];
                            this._rotated.z = this._vertex.x * this._rotMatrix.m[2] + this._vertex.y * this._rotMatrix.m[6] + this._vertex.z * this._rotMatrix.m[10];
    
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
    
                            // normals : if the particles can't be morphed then just rotate the normals, what is much more faster than ComputeNormals()
                            if (!this._computeParticleVertex) {
                                this._normal.x = this._fixedNormal32[idx];
                                this._normal.y = this._fixedNormal32[idx + 1];
                                this._normal.z = this._fixedNormal32[idx + 2];
    
                                this._rotated.x = this._normal.x * this._rotMatrix.m[0] + this._normal.y * this._rotMatrix.m[4] + this._normal.z * this._rotMatrix.m[8];
                                this._rotated.y = this._normal.x * this._rotMatrix.m[1] + this._normal.y * this._rotMatrix.m[5] + this._normal.z * this._rotMatrix.m[9];
                                this._rotated.z = this._normal.x * this._rotMatrix.m[2] + this._normal.y * this._rotMatrix.m[6] + this._normal.z * this._rotMatrix.m[10];
    
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
                    } 
                    // particle just set invisible : scaled to zero and positioned at the origin
                    else {
                        this._particle._stillInvisible = true;      // mark the particle as invisible
                        for (pt = 0; pt < this._shape.length; pt++) {
                            idx = index + pt * 3;
                            colidx = colorIndex + pt * 4;
                            uvidx = uvIndex + pt * 2;
    
                            this._positions32[idx] = 0.0;
                            this._positions32[idx + 1] = 0.0;
                            this._positions32[idx + 2] = 0.0; 
                            this._normals32[idx] = 0.0;
                            this._normals32[idx + 1] = 0.0;
                            this._normals32[idx + 2] = 0.0;
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
                    }
                    
                    // if the particle intersections must be computed : update the bbInfo
                    if (this._particlesIntersect) {
                        var bInfo = this._particle._boundingInfo;
                        var bBox = bInfo.boundingBox;
                        var bSphere = bInfo.boundingSphere;                   
                        if (!this._bSphereOnly) {
                            // place, scale and rotate the particle bbox within the SPS local system, then update it
                            for (var b = 0; b < bBox.vectors.length; b++) {
                                this._vertex.x = this._particle._modelBoundingInfo.boundingBox.vectors[b].x * this._particle.scaling.x;
                                this._vertex.y = this._particle._modelBoundingInfo.boundingBox.vectors[b].y * this._particle.scaling.y;
                                this._vertex.z = this._particle._modelBoundingInfo.boundingBox.vectors[b].z * this._particle.scaling.z;
                                this._rotated.x = this._vertex.x * this._rotMatrix.m[0] + this._vertex.y * this._rotMatrix.m[4] + this._vertex.z * this._rotMatrix.m[8];
                                this._rotated.y = this._vertex.x * this._rotMatrix.m[1] + this._vertex.y * this._rotMatrix.m[5] + this._vertex.z * this._rotMatrix.m[9];
                                this._rotated.z = this._vertex.x * this._rotMatrix.m[2] + this._vertex.y * this._rotMatrix.m[6] + this._vertex.z * this._rotMatrix.m[10];
                                bBox.vectors[b].x = this._particle.position.x + this._cam_axisX.x * this._rotated.x + this._cam_axisY.x * this._rotated.y + this._cam_axisZ.x * this._rotated.z;
                                bBox.vectors[b].y = this._particle.position.y + this._cam_axisX.y * this._rotated.x + this._cam_axisY.y * this._rotated.y + this._cam_axisZ.y * this._rotated.z;
                                bBox.vectors[b].z = this._particle.position.z + this._cam_axisX.z * this._rotated.x + this._cam_axisY.z * this._rotated.y + this._cam_axisZ.z * this._rotated.z;
                            }
                            bBox._update(this.mesh._worldMatrix);
                        }
                        // place and scale the particle bouding sphere in the SPS local system, then update it
                        this._minBbox.x = this._particle._modelBoundingInfo.minimum.x * this._particle.scaling.x;
                        this._minBbox.y = this._particle._modelBoundingInfo.minimum.y * this._particle.scaling.y;
                        this._minBbox.z = this._particle._modelBoundingInfo.minimum.z * this._particle.scaling.z;
                        this._maxBbox.x = this._particle._modelBoundingInfo.maximum.x * this._particle.scaling.x;
                        this._maxBbox.y = this._particle._modelBoundingInfo.maximum.y * this._particle.scaling.y;
                        this._maxBbox.z = this._particle._modelBoundingInfo.maximum.z * this._particle.scaling.z;
                        bSphere.center.x = this._particle.position.x + (this._minBbox.x + this._maxBbox.x) * 0.5;
                        bSphere.center.y = this._particle.position.y + (this._minBbox.y + this._maxBbox.y) * 0.5;
                        bSphere.center.z = this._particle.position.z + (this._minBbox.z + this._maxBbox.z) * 0.5;
                        bSphere.radius = this._bSphereRadiusFactor * 0.5 * Math.sqrt((this._maxBbox.x - this._minBbox.x) * (this._maxBbox.x - this._minBbox.x) + (this._maxBbox.y - this._minBbox.y) * (this._maxBbox.y - this._minBbox.y) + (this._maxBbox.z - this._minBbox.z) * (this._maxBbox.z - this._minBbox.z));
                        bSphere._update(this.mesh._worldMatrix);
                    }
    
                    // increment indexes for the next particle
                    index = idx + 3;
                    colorIndex = colidx + 4;
                    uvIndex = uvidx + 2;
                }
    
                // if the VBO must be updated
                if (update) {
                    if (this._computeParticleColor) {
                        this.mesh.updateVerticesData(VertexBuffer.ColorKind, this._colors32, false, false);
                    }
                    if (this._computeParticleTexture) {
                        this.mesh.updateVerticesData(VertexBuffer.UVKind, this._uvs32, false, false);
                    }
                    this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions32, false, false);
                    if (!this.mesh.areNormalsFrozen || this.mesh.isFacetDataEnabled) {
                        if (this._computeParticleVertex || this.mesh.isFacetDataEnabled) {
                            // recompute the normals only if the particles can be morphed, update then also the normal reference array _fixedNormal32[]
                            var params = this.mesh.isFacetDataEnabled ? this.mesh.getFacetDataParameters() : null;
                            VertexData.ComputeNormals(this._positions32, this._indices, this._normals32, params);
                            for (var i = 0; i < this._normals32.length; i++) {
                                this._fixedNormal32[i] = this._normals32[i];
                            }                       
                        }
                        if (!this.mesh.areNormalsFrozen) {
                            this.mesh.updateVerticesData(VertexBuffer.NormalKind, this._normals32, false, false);
                        }
                    }
                    if (this._depthSort && this._depthSortParticles) {
                        this.depthSortedParticles.sort(this._depthSortFunction);
                        var dspl = this.depthSortedParticles.length;
                        var sorted = 0;
                        var lind = 0;
                        var sind = 0;
                        var sid = 0;
                        for (sorted = 0; sorted < dspl; sorted++) {
                            lind = this.depthSortedParticles[sorted].indicesLength;
                            sind = this.depthSortedParticles[sorted].ind;
                            for (var i = 0; i < lind; i++) {
                                this._depthSortedIndices[sid] = this._indices[sind + i];
                                sid++;
                            }
                        }
                        this.mesh.updateIndices(this._depthSortedIndices);
                    }
                }
                if (this._computeBoundingBox) {
                    this.mesh._boundingInfo = new BoundingInfo(this._minimum, this._maximum);
                    this.mesh._boundingInfo.update(this.mesh._worldMatrix);
                }
                this.afterUpdateParticles(start, end, update);
                return this;
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
                this._quaternion.x = this._cosYaw * this._sinPitch * this._cosRoll + this._sinYaw * this._cosPitch * this._sinRoll;
                this._quaternion.y = this._sinYaw * this._cosPitch * this._cosRoll - this._cosYaw * this._sinPitch * this._sinRoll;
                this._quaternion.z = this._cosYaw * this._cosPitch * this._sinRoll - this._sinYaw * this._sinPitch * this._cosRoll;
                this._quaternion.w = this._cosYaw * this._cosPitch * this._cosRoll + this._sinYaw * this._sinPitch * this._sinRoll;
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
            * Disposes the SPS.  
            * Returns nothing.  
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
            * Visibilty helper : Recomputes the visible size according to the mesh bounding box
            * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility   
            * Returns the SPS.  
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
    
    
            // getter and setter
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
                this.mesh.getBoundingInfo().isLocked = val;
            }
    
            public get isVisibilityBoxLocked(): boolean {
                return this._isVisibilityBoxLocked;
            }
    
            // Optimizer setters
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
            /**
            * Tells to `setParticles()` to compute the particle textures or not.
            * Default value : true. The SPS is faster when it's set to false.
            * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
            */
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
            */
            public recycleParticle(particle: SolidParticle): SolidParticle {
                return particle;
            }
    
            /**
            * Updates a particle : this function should  be overwritten by the user.
            * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
            * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
            * ex : just set a particle position or velocity and recycle conditions
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
            * ex : just set a vertex particle position
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