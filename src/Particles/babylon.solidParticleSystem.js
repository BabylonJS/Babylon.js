var BABYLON;
(function (BABYLON) {
    var SolidParticleSystem = (function () {
        function SolidParticleSystem(name, scene) {
            // public members  
            this.particles = new Array();
            this.nbParticles = 0;
            this.billboard = false;
            this.counter = 0;
            this._positions = new Array();
            this._indices = new Array();
            this._normals = new Array();
            this._colors = new Array();
            this._uvs = new Array();
            this._index = 0; // indices index
            this._shapeCounter = 0;
            this._setParticleColor = true;
            this._setParticleTexture = true;
            this._setParticleRotation = true;
            this._setParticleVertex = false;
            this._cam_axisZ = BABYLON.Vector3.Zero();
            this._cam_axisY = BABYLON.Vector3.Zero();
            this._cam_axisX = BABYLON.Vector3.Zero();
            this._axisX = BABYLON.Axis.X;
            this._axisY = BABYLON.Axis.Y;
            this._axisZ = BABYLON.Axis.Z;
            this._fakeCamPos = BABYLON.Vector3.Zero();
            this._rotMatrix = new BABYLON.Matrix();
            this._invertedMatrix = new BABYLON.Matrix();
            this._rotated = BABYLON.Vector3.Zero();
            this._quaternion = new BABYLON.Quaternion();
            this._vertex = BABYLON.Vector3.Zero();
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
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
        }
        // build the SPS mesh : returns the mesh
        SolidParticleSystem.prototype.buildMesh = function () {
            if (this.nbParticles === 0) {
                var triangle = BABYLON.Mesh.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
            }
            BABYLON.VertexData.ComputeNormals(this._positions, this._indices, this._normals);
            var vertexData = new BABYLON.VertexData();
            vertexData.positions = this._positions;
            vertexData.indices = this._indices;
            vertexData.normals = this._normals;
            if (this._uvs) {
                vertexData.uvs = this._uvs;
            }
            if (this._colors) {
                vertexData.colors = this._colors;
            }
            var mesh = new BABYLON.Mesh(name, this._scene);
            vertexData.applyToMesh(mesh, true);
            this.mesh = mesh;
            return mesh;
        };
        // _meshBuilder : inserts the shape model in the global SPS mesh
        SolidParticleSystem.prototype._meshBuilder = function (p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors) {
            var i;
            var u = 0;
            var c = 0;
            for (i = 0; i < shape.length; i++) {
                positions.push(shape[i].x, shape[i].y, shape[i].z);
                if (meshUV) {
                    uvs.push(meshUV[u], meshUV[u + 1]);
                    u += 2;
                }
                if (meshCol) {
                    colors.push(meshCol[c] || 1, meshCol[c + 1] || 1, meshCol[c + 2] || 1, meshCol[c + 3] || 1);
                    c += 4;
                }
                else {
                    colors.push(1, 1, 1, 1);
                }
            }
            for (i = 0; i < meshInd.length; i++) {
                indices.push(p + meshInd[i]);
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
        // adds a new particle object in the particles array and double links the particle (next/previous)
        SolidParticleSystem.prototype._addParticle = function (p, idxpos, shape, shapeUV, shapeId) {
            this._particle = new BABYLON.SolidParticle(p, idxpos, shape, shapeUV, shapeId);
            this.particles.push(this._particle);
            this._particle.previous = this._previousParticle;
            if (this._previousParticle) {
                this._previousParticle.next = this._particle;
            }
            this._previousParticle = this._particle;
        };
        // add solid particles from a shape model in the particles array
        SolidParticleSystem.prototype.addShape = function (mesh, nb) {
            var meshPos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);
            // particles
            for (var i = 0; i < nb; i++) {
                this._meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors);
                this._addParticle(this.nbParticles + i, this._positions.length, shape, shapeUV, this._shapeCounter);
                this._index += shape.length;
            }
            this.nbParticles += nb;
            this._shapeCounter++;
            return this._shapeCounter;
        };
        // resets a particle back to its just built status
        SolidParticleSystem.prototype.resetParticle = function (particle) {
            for (var pt = 0; pt < particle._shape.length; pt++) {
                this._positions[particle._pos + pt * 3] = particle._shape[pt].x;
                this._positions[particle._pos + pt * 3 + 1] = particle._shape[pt].y;
                this._positions[particle._pos + pt * 3 + 2] = particle._shape[pt].z;
            }
        };
        // sets all the particles
        SolidParticleSystem.prototype.setParticles = function (start, end, update) {
            if (start === void 0) { start = 0; }
            if (end === void 0) { end = this.nbParticles - 1; }
            if (update === void 0) { update = true; }
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
                this._rotMatrix.invertToRef(this._invertedMatrix);
                BABYLON.Vector3.TransformCoordinatesToRef(this._camera.globalPosition, this._invertedMatrix, this._fakeCamPos);
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
            for (var p = start; p <= end; p++) {
                this._particle = this.particles[p];
                // call to custom user function to update the particle properties
                this.updateParticle(this._particle);
                // particle rotation matrix
                if (this.billboard) {
                    this._particle.rotation.x = 0.0;
                    this._particle.rotation.y = 0.0;
                }
                if (this._setParticleRotation) {
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
                for (var pt = 0; pt < this._particle._shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;
                    this._vertex.x = this._particle._shape[pt].x;
                    this._vertex.y = this._particle._shape[pt].y;
                    this._vertex.z = this._particle._shape[pt].z;
                    if (this._setParticleVertex) {
                        this.updateParticleVertex(this._particle, this._vertex, pt);
                    }
                    BABYLON.Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                    this._positions[idx] = this._particle.position.x + this._cam_axisX.x * this._rotated.x * this._particle.scale.x + this._cam_axisY.x * this._rotated.y * this._particle.scale.y + this._cam_axisZ.x * this._rotated.z * this._particle.scale.z;
                    this._positions[idx + 1] = this._particle.position.y + this._cam_axisX.y * this._rotated.x * this._particle.scale.x + this._cam_axisY.y * this._rotated.y * this._particle.scale.y + this._cam_axisZ.y * this._rotated.z * this._particle.scale.z;
                    this._positions[idx + 2] = this._particle.position.z + this._cam_axisX.z * this._rotated.x * this._particle.scale.x + this._cam_axisY.z * this._rotated.y * this._particle.scale.y + this._cam_axisZ.z * this._rotated.z * this._particle.scale.z;
                    if (this._setParticleColor) {
                        this._colors[colidx] = this._particle.color.r;
                        this._colors[colidx + 1] = this._particle.color.g;
                        this._colors[colidx + 2] = this._particle.color.b;
                        this._colors[colidx + 3] = this._particle.color.a;
                    }
                    if (this._setParticleTexture) {
                        this._uvs[uvidx] = this._particle._shapeUV[pt * 2] * (this._particle.uvs.z - this._particle.uvs.x) + this._particle.uvs.x;
                        this._uvs[uvidx + 1] = this._particle._shapeUV[pt * 2 + 1] * (this._particle.uvs.w - this._particle.uvs.y) + this._particle.uvs.y;
                    }
                }
                index = idx + 3;
                colorIndex = colidx + 4;
                uvIndex = uvidx + 2;
            }
            if (update) {
                if (this._setParticleColor) {
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.ColorKind, this._colors, false, false);
                }
                if (this._setParticleTexture) {
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, this._uvs, false, false);
                }
                this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._positions, false, false);
                if (!this.mesh.areNormalsFrozen) {
                    BABYLON.VertexData.ComputeNormals(this._positions, this._indices, this._normals);
                    this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, this._normals, false, false);
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
        };
        Object.defineProperty(SolidParticleSystem.prototype, "setParticleRotation", {
            // getters
            get: function () {
                return this._setParticleRotation;
            },
            // Optimizer setters
            set: function (val) {
                this._setParticleRotation = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "setParticleColor", {
            get: function () {
                return this._setParticleColor;
            },
            set: function (val) {
                this._setParticleColor = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "setParticleTexture", {
            get: function () {
                return this._setParticleTexture;
            },
            set: function (val) {
                this._setParticleTexture = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SolidParticleSystem.prototype, "setParticleVertex", {
            get: function () {
                return this._setParticleVertex;
            },
            set: function (val) {
                this._setParticleVertex = val;
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
        // ex : just set a vertex particle position
        SolidParticleSystem.prototype.updateParticleVertex = function (particle, vertex, i) {
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
