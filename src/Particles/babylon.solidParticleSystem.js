var BABYLON;
(function (BABYLON) {
    /**
    * Full documentation here : http://doc.babylonjs.com/overviews/Solid_Particle_System
    */
    var SolidParticleSystem = (function () {
        /**
        * Creates a SPS (Solid Particle System) object.
        * `name` (String) is the SPS name, this will be the underlying mesh name.
        * `scene` (Scene) is the scene in which the SPS is added.
        * `updatable` (default true) : if the SPS must be updatable or immutable.
        * `isPickable` (default false) : if the solid particles must be pickable.
        * `particleIntersection` (default false) : if the solid particle intersections must be computed
        */
        function SolidParticleSystem(name, scene, options) {
            // public members
            /**
            *  The SPS array of Solid Particle objects. Just access each particle as with any classic array.
            *  Example : var p = SPS.particles[i];
            */
            this.particles = new Array();
            /**
            * The SPS total number of particles. Read only. Use SPS.counter instead if you need to set your own value.
            */
            this.nbParticles = 0;
            /**
            * If the particles must ever face the camera (default false). Useful for planar particles.
            */
            this.billboard = false;
            /**
             * Recompute normals when adding a shape
             */
            this.recomputeNormals = true;
            /**
            * This a counter ofr your own usage. It's not set by any SPS functions.
            */
            this.counter = 0;
            /**
            * This empty object is intended to store some SPS specific or temporary values in order to lower the Garbage Collector activity.
            * Please read : http://doc.babylonjs.com/overviews/Solid_Particle_System#garbage-collector-concerns
            */
            this.vars = {};
            this._positions = new Array();
            this._indices = new Array();
            this._normals = new Array();
            this._colors = new Array();
            this._uvs = new Array();
            this._index = 0; // indices index
            this._updatable = true;
            this._pickable = false;
            this._isVisibilityBoxLocked = false;
            this._alwaysVisible = false;
            this._shapeCounter = 0;
            this._copy = new BABYLON.SolidParticle(null, null, null, null, null);
            this._color = new BABYLON.Color4(0, 0, 0, 0);
            this._computeParticleColor = true;
            this._computeParticleTexture = true;
            this._computeParticleRotation = true;
            this._computeParticleVertex = false;
            this._computeBoundingBox = false;
            this._cam_axisZ = BABYLON.Vector3.Zero();
            this._cam_axisY = BABYLON.Vector3.Zero();
            this._cam_axisX = BABYLON.Vector3.Zero();
            this._axisX = BABYLON.Axis.X;
            this._axisY = BABYLON.Axis.Y;
            this._axisZ = BABYLON.Axis.Z;
            this._camDir = BABYLON.Vector3.Zero();
            this._rotMatrix = new BABYLON.Matrix();
            this._invertMatrix = new BABYLON.Matrix();
            this._rotated = BABYLON.Vector3.Zero();
            this._quaternion = new BABYLON.Quaternion();
            this._vertex = BABYLON.Vector3.Zero();
            this._normal = BABYLON.Vector3.Zero();
            this._yaw = 0.0;
            this._pitch = 0.0;
            this._roll = 0.0;
            this._halfroll = 0.0;
            this._halfpitch = 0.0;
            this._halfyaw = 0.0;
            this._sinRoll = 0.0;
            this._cosRoll = 0.0;
            this._sinPitch = 0.0;
            this._cosPitch = 0.0;
            this._sinYaw = 0.0;
            this._cosYaw = 0.0;
            this._w = 0.0;
            this._minimum = BABYLON.Tmp.Vector3[0];
            this._maximum = BABYLON.Tmp.Vector3[1];
            this._scale = BABYLON.Tmp.Vector3[2];
            this._translation = BABYLON.Tmp.Vector3[3];
            this._particlesIntersect = false;
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
            this._pickable = options ? options.isPickable : false;
            this._particlesIntersect = options ? options.particleIntersection : false;
            if (options && options.updatable) {
                this._updatable = options.updatable;
            }
            else {
                this._updatable = true;
            }
            if (this._pickable) {
                this.pickedParticles = [];
            }
        }
        /**
        * Builds the SPS underlying mesh. Returns a standard Mesh.
        * If no model shape was added to the SPS, the returned mesh is just a single triangular plane.
        */
        SolidParticleSystem.prototype.buildMesh = function () {
            if (this.nbParticles === 0) {
                var triangle = BABYLON.MeshBuilder.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
            }
            this._positions32 = new Float32Array(this._positions);
            this._uvs32 = new Float32Array(this._uvs);
            this._colors32 = new Float32Array(this._colors);
            if (this.recomputeNormals) {
                BABYLON.VertexData.ComputeNormals(this._positions32, this._indices, this._normals);
            }
            this._normals32 = new Float32Array(this._normals);
            this._fixedNormal32 = new Float32Array(this._normals);
            var vertexData = new BABYLON.VertexData();
            vertexData.set(this._positions32, BABYLON.VertexBuffer.PositionKind);
            vertexData.indices = this._indices;
            vertexData.set(this._normals32, BABYLON.VertexBuffer.NormalKind);
            if (this._uvs32) {
                vertexData.set(this._uvs32, BABYLON.VertexBuffer.UVKind);
                ;
            }
            if (this._colors32) {
                vertexData.set(this._colors32, BABYLON.VertexBuffer.ColorKind);
            }
            var mesh = new BABYLON.Mesh(this.name, this._scene);
            vertexData.applyToMesh(mesh, this._updatable);
            this.mesh = mesh;
            this.mesh.isPickable = this._pickable;
            this._wm = this.mesh.getWorldMatrix();
            // free memory
            this._positions = null;
            this._normals = null;
            this._uvs = null;
            this._colors = null;
            if (!this._updatable) {
                this.particles.length = 0;
            }
            return mesh;
        };
        /**
        * Digests the mesh and generates as many solid particles in the system as wanted. Returns the SPS.
        * These particles will have the same geometry than the mesh parts and will be positioned at the same localisation than the mesh original places.
        * Thus the particles generated from `digest()` have their property `position` set yet.
        * `mesh` ( Mesh ) is the mesh to be digested
        * `facetNb` (optional integer, default 1) is the number of mesh facets per particle, this parameter is overriden by the parameter `number` if any
        * `delta` (optional integer, default 0) is the random extra number of facets per particle , each particle will have between `facetNb` and `facetNb + delta` facets
        * `number` (optional positive integer) is the wanted number of particles : each particle is built with `mesh_total_facets / number` facets
        */
        SolidParticleSystem.prototype.digest = function (mesh, options) {
            var size = (options && options.facetNb) || 1;
            var number = (options && options.number);
            var delta = (options && options.delta) || 0;
            var meshPos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var meshNor = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var f = 0; // facet counter
            var totalFacets = meshInd.length / 3; // a facet is a triangle, so 3 indices
            // compute size from number
            if (number) {
                number = (number > totalFacets) ? totalFacets : number;
                size = Math.round(totalFacets / number);
                delta = 0;
            }
            else {
                size = (size > totalFacets) ? totalFacets : size;
            }
            var facetPos = []; // submesh positions
            var facetInd = []; // submesh indices
            var facetUV = []; // submesh UV
            var facetCol = []; // submesh colors
            var barycenter = BABYLON.Tmp.Vector3[0];
            var rand;
            var sizeO = size;
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
                var fi = 0;
                for (var j = f * 3; j < (f + size) * 3; j++) {
                    facetInd.push(fi);
                    var i = meshInd[j];
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
                var idx = this.nbParticles;
                var shape = this._posToShape(facetPos);
                var shapeUV = this._uvsToShapeUV(facetUV);
                // compute the barycenter of the shape
                var v;
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
                    bInfo = new BABYLON.BoundingInfo(barycenter, barycenter);
                }
                var modelShape = new BABYLON.ModelShape(this._shapeCounter, shape, shapeUV, null, null);
                // add the particle in the SPS
                this._meshBuilder(this._index, shape, this._positions, facetInd, this._indices, facetUV, this._uvs, facetCol, this._colors, meshNor, this._normals, idx, 0, null);
                this._addParticle(idx, this._positions.length, modelShape, this._shapeCounter, 0, bInfo);
                // initialize the particle position
                this.particles[this.nbParticles].position.addInPlace(barycenter);
                this._index += shape.length;
                idx++;
                this.nbParticles++;
                this._shapeCounter++;
                f += size;
            }
            return this;
        };
        //reset copy
        SolidParticleSystem.prototype._resetCopy = function () {
            this._copy.position.x = 0;
            this._copy.position.y = 0;
            this._copy.position.z = 0;
            this._copy.rotation.x = 0;
            this._copy.rotation.y = 0;
            this._copy.rotation.z = 0;
            this._copy.rotationQuaternion = null;
            this._copy.scaling.x = 1;
            this._copy.scaling.y = 1;
            this._copy.scaling.z = 1;
            this._copy.uvs.x = 0;
            this._copy.uvs.y = 0;
            this._copy.uvs.z = 1;
            this._copy.uvs.w = 1;
            this._copy.color = null;
        };
        // _meshBuilder : inserts the shape model in the global SPS mesh
        SolidParticleSystem.prototype._meshBuilder = function (p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, meshNor, normals, idx, idxInShape, options) {
            var i;
            var u = 0;
            var c = 0;
            var n = 0;
            this._resetCopy();
            if (options && options.positionFunction) {
                options.positionFunction(this._copy, idx, idxInShape);
            }
            if (this._copy.rotationQuaternion) {
                this._quaternion.copyFrom(this._copy.rotationQuaternion);
            }
            else {
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
                BABYLON.Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                positions.push(this._copy.position.x + this._rotated.x, this._copy.position.y + this._rotated.y, this._copy.position.z + this._rotated.z);
                if (meshUV) {
                    uvs.push((this._copy.uvs.z - this._copy.uvs.x) * meshUV[u] + this._copy.uvs.x, (this._copy.uvs.w - this._copy.uvs.y) * meshUV[u + 1] + this._copy.uvs.y);
                    u += 2;
                }
                if (this._copy.color) {
                    this._color = this._copy.color;
                }
                else if (meshCol && meshCol[c] !== undefined) {
                    this._color.r = meshCol[c];
                    this._color.g = meshCol[c + 1];
                    this._color.b = meshCol[c + 2];
                    this._color.a = meshCol[c + 3];
                }
                else {
                    this._color.r = 1;
                    this._color.g = 1;
                    this._color.b = 1;
                    this._color.a = 1;
                }
                colors.push(this._color.r, this._color.g, this._color.b, this._color.a);
                c += 4;
                if (!this.recomputeNormals && meshNor) {
                    this._normal.x = meshNor[n];
                    this._normal.y = meshNor[n + 1];
                    this._normal.z = meshNor[n + 2];
                    BABYLON.Vector3.TransformCoordinatesToRef(this._normal, this._rotMatrix, this._normal);
                    normals.push(this._normal.x, this._normal.y, this._normal.z);
                    n += 3;
                }
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
        };
        // returns a shape array from positions array
        SolidParticleSystem.prototype._posToShape = function (positions) {
            var shape = [];
            for (var i = 0; i < positions.length; i += 3) {
                shape.push(new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]));
            }
            return shape;
        };
        // returns a shapeUV array from a Vector4 uvs
        SolidParticleSystem.prototype._uvsToShapeUV = function (uvs) {
            var shapeUV = [];
            if (uvs) {
                for (var i = 0; i < uvs.length; i++)
                    shapeUV.push(uvs[i]);
            }
            return shapeUV;
        };
        // adds a new particle object in the particles array
        SolidParticleSystem.prototype._addParticle = function (idx, idxpos, model, shapeId, idxInShape, bInfo) {
            this.particles.push(new BABYLON.SolidParticle(idx, idxpos, model, shapeId, idxInShape, bInfo));
        };
        /**
        * Adds some particles to the SPS from the model shape. Returns the shape id.
        * Please read the doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#create-an-immutable-sps
        * `mesh` is any Mesh object that will be used as a model for the solid particles.
        * `nb` (positive integer) the number of particles to be created from this model
        * `positionFunction` is an optional javascript function to called for each particle on SPS creation.
        * `vertexFunction` is an optional javascript function to called for each vertex of each particle on SPS creation
        */
        SolidParticleSystem.prototype.addShape = function (mesh, nb, options) {
            var meshPos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var meshNor = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var bbInfo;
            if (this._particlesIntersect) {
                bbInfo = mesh.getBoundingInfo();
            }
            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);
            var posfunc = options ? options.positionFunction : null;
            var vtxfunc = options ? options.vertexFunction : null;
            var modelShape = new BABYLON.ModelShape(this._shapeCounter, shape, shapeUV, posfunc, vtxfunc);
            // particles
            var idx = this.nbParticles;
            for (var i = 0; i < nb; i++) {
                this._meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors, meshNor, this._normals, idx, i, options);
                if (this._updatable) {
                    this._addParticle(idx, this._positions.length, modelShape, this._shapeCounter, i, bbInfo);
                }
                this._index += shape.length;
                idx++;
            }
            this.nbParticles += nb;
            this._shapeCounter++;
            return this._shapeCounter - 1;
        };
        // rebuilds a particle back to its just built status : if needed, recomputes the custom positions and vertices
        SolidParticleSystem.prototype._rebuildParticle = function (particle) {
            this._resetCopy();
            if (particle._model._positionFunction) {
                particle._model._positionFunction(this._copy, particle.idx, particle.idxInShape);
            }
            if (this._copy.rotationQuaternion) {
                this._quaternion.copyFrom(this._copy.rotationQuaternion);
            }
            else {
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
                BABYLON.Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
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
        };
        /**
        * Rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed.
        */
        SolidParticleSystem.prototype.rebuildMesh = function () {
            for (var p = 0; p < this.particles.length; p++) {
                this._rebuildParticle(this.particles[p]);
            }
            this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._positions32, false, false);
        };
        /**
        *  Sets all the particles : this method actually really updates the mesh according to the particle positions, rotations, colors, textures, etc.
        *  This method calls `updateParticle()` for each particle of the SPS.
        *  For an animated SPS, it is usually called within the render loop.
        * @param start The particle index in the particle array where to start to compute the particle property values _(default 0)_
        * @param end The particle index in the particle array where to stop to compute the particle property values _(default nbParticle - 1)_
        * @param update If the mesh must be finally updated on this call after all the particle computations _(default true)_
        */
        SolidParticleSystem.prototype.setParticles = function (start, end, update) {
            if (start === void 0) { start = 0; }
            if (end === void 0) { end = this.nbParticles - 1; }
            if (update === void 0) { update = true; }
            if (!this._updatable) {
                return;
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
            // if the particles will always face the camera
            if (this.billboard) {
                // compute the camera position and un-rotate it by the current mesh rotation
                if (this._wm.decompose(this._scale, this._quaternion, this._translation)) {
                    this._quaternionToRotationMatrix();
                    this._rotMatrix.invertToRef(this._invertMatrix);
                    this._camera._currentTarget.subtractToRef(this._camera.globalPosition, this._camDir);
                    BABYLON.Vector3.TransformCoordinatesToRef(this._camDir, this._invertMatrix, this._cam_axisZ);
                    this._cam_axisZ.normalize();
                    // set two orthogonal vectors (_cam_axisX and and _cam_axisY) to the rotated camDir axis (_cam_axisZ)
                    BABYLON.Vector3.CrossToRef(this._cam_axisZ, this._axisX, this._cam_axisY);
                    BABYLON.Vector3.CrossToRef(this._cam_axisY, this._cam_axisZ, this._cam_axisX);
                    this._cam_axisY.normalize();
                    this._cam_axisX.normalize();
                }
            }
            BABYLON.Matrix.IdentityToRef(this._rotMatrix);
            var idx = 0;
            var index = 0;
            var colidx = 0;
            var colorIndex = 0;
            var uvidx = 0;
            var uvIndex = 0;
            var pt = 0;
            if (this._computeBoundingBox) {
                BABYLON.Vector3.FromFloatsToRef(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, this._minimum);
                BABYLON.Vector3.FromFloatsToRef(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, this._maximum);
            }
            // particle loop
            end = (end > this.nbParticles - 1) ? this.nbParticles - 1 : end;
            for (var p = start; p <= end; p++) {
                this._particle = this.particles[p];
                this._shape = this._particle._model._shape;
                this._shapeUV = this._particle._model._shapeUV;
                // call to custom user function to update the particle properties
                this.updateParticle(this._particle);
                if (this._particle.isVisible) {
                    // particle rotation matrix
                    if (this.billboard) {
                        this._particle.rotation.x = 0.0;
                        this._particle.rotation.y = 0.0;
                    }
                    if (this._computeParticleRotation || this.billboard) {
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
                        // normals : if the particles can't be morphed then just rotate the normals, what if much more faster than ComputeNormals()
                        if (!this._computeParticleVertex) {
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
                }
                else {
                    for (pt = 0; pt < this._shape.length; pt++) {
                        idx = index + pt * 3;
                        colidx = colorIndex + pt * 4;
                        uvidx = uvIndex + pt * 2;
                        this._positions32[idx] = this._camera.position.x;
                        this._positions32[idx + 1] = this._camera.position.y;
                        this._positions32[idx + 2] = this._camera.position.z;
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
                    // place, scale and rotate the particle bbox within the SPS local system
                    for (var b = 0; b < bBox.vectors.length; b++) {
                        if (this._particle.isVisible) {
                            this._vertex.x = this._particle._modelBoundingInfo.boundingBox.vectors[b].x * this._particle.scaling.x;
                            this._vertex.y = this._particle._modelBoundingInfo.boundingBox.vectors[b].y * this._particle.scaling.y;
                            this._vertex.z = this._particle._modelBoundingInfo.boundingBox.vectors[b].z * this._particle.scaling.z;
                            this._w = (this._vertex.x * this._rotMatrix.m[3]) + (this._vertex.y * this._rotMatrix.m[7]) + (this._vertex.z * this._rotMatrix.m[11]) + this._rotMatrix.m[15];
                            this._rotated.x = ((this._vertex.x * this._rotMatrix.m[0]) + (this._vertex.y * this._rotMatrix.m[4]) + (this._vertex.z * this._rotMatrix.m[8]) + this._rotMatrix.m[12]) / this._w;
                            this._rotated.y = ((this._vertex.x * this._rotMatrix.m[1]) + (this._vertex.y * this._rotMatrix.m[5]) + (this._vertex.z * this._rotMatrix.m[9]) + this._rotMatrix.m[13]) / this._w;
                            this._rotated.z = ((this._vertex.x * this._rotMatrix.m[2]) + (this._vertex.y * this._rotMatrix.m[6]) + (this._vertex.z * this._rotMatrix.m[10]) + this._rotMatrix.m[14]) / this._w;
                            bBox.vectors[b].x = this._particle.position.x + this._cam_axisX.x * this._rotated.x + this._cam_axisY.x * this._rotated.y + this._cam_axisZ.x * this._rotated.z;
                            bBox.vectors[b].y = this._particle.position.y + this._cam_axisX.y * this._rotated.x + this._cam_axisY.y * this._rotated.y + this._cam_axisZ.y * this._rotated.z;
                            bBox.vectors[b].z = this._particle.position.z + this._cam_axisX.z * this._rotated.x + this._cam_axisY.z * this._rotated.y + this._cam_axisZ.z * this._rotated.z;
                        }
                        else {
                            bBox.vectors[b].x = this._camera.position.x;
                            bBox.vectors[b].y = this._camera.position.y;
                            bBox.vectors[b].z = this._camera.position.z;
                        }
                    }
                    // place and scale the particle bouding sphere in the SPS local system
                    if (this._particle.isVisible) {
                        this._minimum.x = this._particle._modelBoundingInfo.minimum.x * this._particle.scaling.x;
                        this._minimum.y = this._particle._modelBoundingInfo.minimum.y * this._particle.scaling.y;
                        this._minimum.z = this._particle._modelBoundingInfo.minimum.z * this._particle.scaling.z;
                        this._maximum.x = this._particle._modelBoundingInfo.maximum.x * this._particle.scaling.x;
                        this._maximum.y = this._particle._modelBoundingInfo.maximum.y * this._particle.scaling.y;
                        this._maximum.z = this._particle._modelBoundingInfo.maximum.z * this._particle.scaling.z;
                        bSphere.center.x = this._particle.position.x + (this._minimum.x + this._maximum.x) * 0.5;
                        bSphere.center.y = this._particle.position.y + (this._minimum.y + this._maximum.y) * 0.5;
                        bSphere.center.z = this._particle.position.z + (this._minimum.z + this._maximum.z) * 0.5;
                        bSphere.radius = BABYLON.Vector3.Distance(this._minimum, this._maximum) * 0.5;
                    }
                    else {
                        bSphere.center.x = this._camera.position.x;
                        bSphere.center.y = this._camera.position.x;
                        bSphere.center.z = this._camera.position.x;
                        bSphere.radius = 0.0;
                    }
                    // then update the bbox and the bsphere into the world system
                    bBox._update(this._wm);
                    bSphere._update(this._wm);
                }
                // increment indexes for the next particle
                index = idx + 3;
                colorIndex = colidx + 4;
                uvIndex = uvidx + 2;
            }
            // if the VBO must be updated
            if (update) {
                if (this._computeParticleColor) {
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, this._colors32, false, false);
                }
                if (this._computeParticleTexture) {
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, this._uvs32, false, false);
                }
                this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._positions32, false, false);
                if (!this.mesh.areNormalsFrozen) {
                    if (this._computeParticleVertex) {
                        // recompute the normals only if the particles can be morphed, update then also the normal reference array _fixedNormal32[]
                        BABYLON.VertexData.ComputeNormals(this._positions32, this._indices, this._normals32);
                        for (var i = 0; i < this._normals32.length; i++) {
                            this._fixedNormal32[i] = this._normals32[i];
                        }
                    }
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this._normals32, false, false);
                }
            }
            if (this._computeBoundingBox) {
                this.mesh._boundingInfo = new BABYLON.BoundingInfo(this._minimum, this._maximum);
                this.mesh._boundingInfo.update(this.mesh._worldMatrix);
            }
            this.afterUpdateParticles(start, end, update);
        };
        SolidParticleSystem.prototype._quaternionRotationYPR = function () {
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
        };
        SolidParticleSystem.prototype._quaternionToRotationMatrix = function () {
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
        };
        /**
        * Disposes the SPS
        */
        SolidParticleSystem.prototype.dispose = function () {
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
        };
        /**
        * Visibilty helper : Recomputes the visible size according to the mesh bounding box
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        SolidParticleSystem.prototype.refreshVisibleSize = function () {
            if (!this._isVisibilityBoxLocked) {
                this.mesh.refreshBoundingInfo();
            }
        };
        /**
        * Visibility helper : Sets the size of a visibility box, this sets the underlying mesh bounding box.
        * @param size the size (float) of the visibility box
        * note : this doesn't lock the SPS mesh bounding box.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
        */
        SolidParticleSystem.prototype.setVisibilityBox = function (size) {
            var vis = size / 2;
            this.mesh._boundingInfo = new BABYLON.BoundingInfo(new BABYLON.Vector3(-vis, -vis, -vis), new BABYLON.Vector3(vis, vis, vis));
        };
        Object.defineProperty(SolidParticleSystem.prototype, "isAlwaysVisible", {
            // getter and setter
            get: function () {
                return this._alwaysVisible;
            },
            /**
            * Sets the SPS as always visible or not
            * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
            */
            set: function (val) {
                this._alwaysVisible = val;
                this.mesh.alwaysSelectAsActiveMesh = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "isVisibilityBoxLocked", {
            get: function () {
                return this._isVisibilityBoxLocked;
            },
            /**
            * Sets the SPS visibility box as locked or not. This enables/disables the underlying mesh bounding box updates.
            * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#sps-visibility
            */
            set: function (val) {
                this._isVisibilityBoxLocked = val;
                this.mesh.getBoundingInfo().isLocked = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "computeParticleRotation", {
            // getters
            get: function () {
                return this._computeParticleRotation;
            },
            // Optimizer setters
            /**
            * Tells to `setParticles()` to compute the particle rotations or not.
            * Default value : true. The SPS is faster when it's set to false.
            * Note : the particle rotations aren't stored values, so setting `computeParticleRotation` to false will prevents the particle to rotate.
            */
            set: function (val) {
                this._computeParticleRotation = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "computeParticleColor", {
            get: function () {
                return this._computeParticleColor;
            },
            /**
            * Tells to `setParticles()` to compute the particle colors or not.
            * Default value : true. The SPS is faster when it's set to false.
            * Note : the particle colors are stored values, so setting `computeParticleColor` to false will keep yet the last colors set.
            */
            set: function (val) {
                this._computeParticleColor = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "computeParticleTexture", {
            get: function () {
                return this._computeParticleTexture;
            },
            /**
            * Tells to `setParticles()` to compute the particle textures or not.
            * Default value : true. The SPS is faster when it's set to false.
            * Note : the particle textures are stored values, so setting `computeParticleTexture` to false will keep yet the last colors set.
            */
            set: function (val) {
                this._computeParticleTexture = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "computeParticleVertex", {
            get: function () {
                return this._computeParticleVertex;
            },
            /**
            * Tells to `setParticles()` to call the vertex function for each vertex of each particle, or not.
            * Default value : false. The SPS is faster when it's set to false.
            * Note : the particle custom vertex positions aren't stored values.
            */
            set: function (val) {
                this._computeParticleVertex = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "computeBoundingBox", {
            get: function () {
                return this._computeBoundingBox;
            },
            /**
            * Tells to `setParticles()` to compute or not the mesh bounding box when computing the particle positions.
            */
            set: function (val) {
                this._computeBoundingBox = val;
            },
            enumerable: true,
            configurable: true
        });
        // =======================================================================
        // Particle behavior logic
        // these following methods may be overwritten by the user to fit his needs
        /**
        * This function does nothing. It may be overwritten to set all the particle first values.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        SolidParticleSystem.prototype.initParticles = function () {
        };
        /**
        * This function does nothing. It may be overwritten to recycle a particle.
        * The SPS doesn't call this function, you may have to call it by your own.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        */
        SolidParticleSystem.prototype.recycleParticle = function (particle) {
            return particle;
        };
        /**
        * Updates a particle : this function should  be overwritten by the user.
        * It is called on each particle by `setParticles()`. This is the place to code each particle behavior.
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#particle-management
        * ex : just set a particle position or velocity and recycle conditions
        */
        SolidParticleSystem.prototype.updateParticle = function (particle) {
            return particle;
        };
        /**
        * Updates a vertex of a particle : it can be overwritten by the user.
        * This will be called on each vertex particle by `setParticles()` if `computeParticleVertex` is set to true only.
        * @param particle the current particle
        * @param vertex the current index of the current particle
        * @param pt the index of the current vertex in the particle shape
        * doc : http://doc.babylonjs.com/overviews/Solid_Particle_System#update-each-particle-shape
        * ex : just set a vertex particle position
        */
        SolidParticleSystem.prototype.updateParticleVertex = function (particle, vertex, pt) {
            return vertex;
        };
        /**
        * This will be called before any other treatment by `setParticles()` and will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        SolidParticleSystem.prototype.beforeUpdateParticles = function (start, stop, update) {
        };
        /**
        * This will be called  by `setParticles()` after all the other treatments and just before the actual mesh update.
        * This will be passed three parameters.
        * This does nothing and may be overwritten by the user.
        * @param start the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param stop the particle index in the particle array where to stop to iterate, same than the value passed to setParticle()
        * @param update the boolean update value actually passed to setParticles()
        */
        SolidParticleSystem.prototype.afterUpdateParticles = function (start, stop, update) {
        };
        return SolidParticleSystem;
    }());
    BABYLON.SolidParticleSystem = SolidParticleSystem;
})(BABYLON || (BABYLON = {}));
