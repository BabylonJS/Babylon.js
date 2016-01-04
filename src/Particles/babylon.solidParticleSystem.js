var BABYLON;
(function (BABYLON) {
    var SolidParticleSystem = (function () {
        function SolidParticleSystem(name, scene, options) {
            // public members  
            this.particles = new Array();
            this.nbParticles = 0;
            this.billboard = false;
            this.counter = 0;
            this.vars = {};
            this._positions = new Array();
            this._indices = new Array();
            this._normals = new Array();
            this._colors = new Array();
            this._uvs = new Array();
            this._index = 0; // indices index
            this._updatable = true;
            this._pickable = false;
            this._alwaysVisible = false;
            this._shapeCounter = 0;
            this._copy = new BABYLON.SolidParticle(null, null, null, null, null);
            this._color = new BABYLON.Color4(0, 0, 0, 0);
            this._computeParticleColor = true;
            this._computeParticleTexture = true;
            this._computeParticleRotation = true;
            this._computeParticleVertex = false;
            this._cam_axisZ = BABYLON.Vector3.Zero();
            this._cam_axisY = BABYLON.Vector3.Zero();
            this._cam_axisX = BABYLON.Vector3.Zero();
            this._axisX = BABYLON.Axis.X;
            this._axisY = BABYLON.Axis.Y;
            this._axisZ = BABYLON.Axis.Z;
            this._fakeCamPos = BABYLON.Vector3.Zero();
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
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
            this._pickable = options ? options.isPickable : false;
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
        // build the SPS mesh : returns the mesh
        SolidParticleSystem.prototype.buildMesh = function () {
            if (this.nbParticles === 0) {
                var triangle = BABYLON.MeshBuilder.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
            }
            this._positions32 = new Float32Array(this._positions);
            this._uvs32 = new Float32Array(this._uvs);
            this._colors32 = new Float32Array(this._colors);
            BABYLON.VertexData.ComputeNormals(this._positions32, this._indices, this._normals);
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
        //reset copy
        SolidParticleSystem.prototype._resetCopy = function () {
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
        };
        // _meshBuilder : inserts the shape model in the global SPS mesh
        SolidParticleSystem.prototype._meshBuilder = function (p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, idx, idxInShape, options) {
            var i;
            var u = 0;
            var c = 0;
            this._resetCopy();
            if (options && options.positionFunction) {
                options.positionFunction(this._copy, idx, idxInShape);
            }
            if (this._copy.quaternion) {
                this._quaternion.x = this._copy.quaternion.x;
                this._quaternion.y = this._copy.quaternion.y;
                this._quaternion.z = this._copy.quaternion.z;
                this._quaternion.w = this._copy.quaternion.w;
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
                this._vertex.x *= this._copy.scale.x;
                this._vertex.y *= this._copy.scale.y;
                this._vertex.z *= this._copy.scale.z;
                BABYLON.Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                positions.push(this._copy.position.x + this._rotated.x, this._copy.position.y + this._rotated.y, this._copy.position.z + this._rotated.z);
                if (meshUV) {
                    uvs.push((this._copy.uvs.z - this._copy.uvs.x) * meshUV[u] + this._copy.uvs.x, (this._copy.uvs.w - this._copy.uvs.y) * meshUV[u + 1] + this._copy.uvs.y);
                    u += 2;
                }
                if (this._copy.color) {
                    this._color = this._copy.color;
                }
                else if (meshCol && meshCol[c]) {
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
        SolidParticleSystem.prototype._addParticle = function (idx, idxpos, model, shapeId, idxInShape) {
            this.particles.push(new BABYLON.SolidParticle(idx, idxpos, model, shapeId, idxInShape));
        };
        // add solid particles from a shape model in the particles array
        SolidParticleSystem.prototype.addShape = function (mesh, nb, options) {
            var meshPos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);
            var posfunc = options ? options.positionFunction : null;
            var vtxfunc = options ? options.vertexFunction : null;
            var modelShape = new BABYLON.ModelShape(this._shapeCounter, shape, shapeUV, posfunc, vtxfunc);
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
            return this._shapeCounter;
        };
        // rebuilds a particle back to its just built status : if needed, recomputes the custom positions and vertices
        SolidParticleSystem.prototype._rebuildParticle = function (particle) {
            this._resetCopy();
            if (particle._model._positionFunction) {
                particle._model._positionFunction(this._copy, particle.idx, particle.idxInShape);
            }
            if (this._copy.quaternion) {
                this._quaternion.x = this._copy.quaternion.x;
                this._quaternion.y = this._copy.quaternion.y;
                this._quaternion.z = this._copy.quaternion.z;
                this._quaternion.w = this._copy.quaternion.w;
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
                this._vertex.x *= this._copy.scale.x;
                this._vertex.y *= this._copy.scale.y;
                this._vertex.z *= this._copy.scale.z;
                BABYLON.Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
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
        };
        // rebuilds the whole mesh and updates the VBO : custom positions and vertices are recomputed if needed
        SolidParticleSystem.prototype.rebuildMesh = function () {
            for (var p = 0; p < this.particles.length; p++) {
                this._rebuildParticle(this.particles[p]);
            }
            this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._positions32, false, false);
        };
        // sets all the particles : updates the VBO
        SolidParticleSystem.prototype.setParticles = function (start, end, update) {
            if (start === void 0) { start = 0; }
            if (end === void 0) { end = this.nbParticles - 1; }
            if (update === void 0) { update = true; }
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
                BABYLON.Vector3.TransformCoordinatesToRef(this._camera.globalPosition, this._invertMatrix, this._fakeCamPos);
                // set two orthogonal vectors (_cam_axisX and and _cam_axisY) to the cam-mesh axis (_cam_axisZ)
                (this._fakeCamPos).subtractToRef(this.mesh.position, this._cam_axisZ);
                BABYLON.Vector3.CrossToRef(this._cam_axisZ, this._axisX, this._cam_axisY);
                BABYLON.Vector3.CrossToRef(this._cam_axisZ, this._cam_axisY, this._cam_axisX);
                this._cam_axisY.normalize();
                this._cam_axisX.normalize();
                this._cam_axisZ.normalize();
            }
            BABYLON.Matrix.IdentityToRef(this._rotMatrix);
            var idx = 0;
            var index = 0;
            var colidx = 0;
            var colorIndex = 0;
            var uvidx = 0;
            var uvIndex = 0;
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
                    }
                    else {
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
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, this._colors32, false, false);
                }
                if (this._computeParticleTexture) {
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, this._uvs32, false, false);
                }
                this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._positions32, false, false);
                if (!this.mesh.areNormalsFrozen) {
                    if (this._computeParticleVertex || this.billboard) {
                        // recompute the normals only if the particles can be morphed, update then the normal reference array
                        BABYLON.VertexData.ComputeNormals(this._positions32, this._indices, this._normals32);
                        for (var i = 0; i < this._normals32.length; i++) {
                            this._fixedNormal32[i] = this._normals32[i];
                        }
                    }
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this._normals32, false, false);
                }
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
        // dispose the SPS
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
        // Visibilty helpers
        SolidParticleSystem.prototype.refreshVisibleSize = function () {
            this.mesh.refreshBoundingInfo();
        };
        Object.defineProperty(SolidParticleSystem.prototype, "isAlwaysVisible", {
            // getter and setter
            get: function () {
                return this._alwaysVisible;
            },
            set: function (val) {
                this._alwaysVisible = val;
                this.mesh.alwaysSelectAsActiveMesh = val;
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
            set: function (val) {
                this._computeParticleVertex = val;
            },
            enumerable: true,
            configurable: true
        });
        // =======================================================================
        // Particle behavior logic
        // these following methods may be overwritten by the user to fit his needs
        // init : sets all particles first values and calls updateParticle to set them in space
        // can be overwritten by the user
        SolidParticleSystem.prototype.initParticles = function () {
        };
        // recycles a particle : can by overwritten by the user
        SolidParticleSystem.prototype.recycleParticle = function (particle) {
            return particle;
        };
        // updates a particle : can be overwritten by the user
        // will be called on each particle by setParticles() :
        // ex : just set a particle position or velocity and recycle conditions
        SolidParticleSystem.prototype.updateParticle = function (particle) {
            return particle;
        };
        // updates a vertex of a particle : can be overwritten by the user
        // will be called on each vertex particle by setParticles() :
        // particle : the current particle
        // vertex : the current index of the current particle
        // pt : the index of the current vertex in the particle shape
        // ex : just set a vertex particle position
        SolidParticleSystem.prototype.updateParticleVertex = function (particle, vertex, pt) {
            return vertex;
        };
        // will be called before any other treatment by setParticles()
        SolidParticleSystem.prototype.beforeUpdateParticles = function (start, stop, update) {
        };
        // will be called after all setParticles() treatments
        SolidParticleSystem.prototype.afterUpdateParticles = function (start, stop, update) {
        };
        return SolidParticleSystem;
    })();
    BABYLON.SolidParticleSystem = SolidParticleSystem;
})(BABYLON || (BABYLON = {}));
