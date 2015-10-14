module BABYLON {

    export class SolidParticleSystem implements IDisposable {
        // public members  
        public particles: SolidParticle[] = [];
        public nbParticles:number = 0;
        public billboard: boolean = false;
        public counter: number = 0;
        public name: string;
        public mesh: Mesh;
        
        // private members
        private _scene: Scene;
        private _positions: number[] = [];
        private _indices: number[] = [];
        private _normals: number[] = [];
        private _colors: number[] = [];
        private _uvs: number[] = [];
        private _index: number = 0;  // indices index
        private _shapeCounter: number = 0;
        private _useParticleColor: boolean = true;
        private _useParticleTexture: boolean = true;
        private _useParticleRotation: boolean = true;
        private _useParticleVertex: boolean = false;
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
        private _invertedMatrix: Matrix = new Matrix();
        private _rotated: Vector3 = Vector3.Zero();
        private _quaternion: Quaternion = new Quaternion();
        private _vertex: Vector3 = Vector3.Zero();
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

        constructor(name: string, scene: Scene) {
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
        }

        // build the SPS mesh : returns the mesh
        public buildMesh(): Mesh {
            if (this.nbParticles == 0) {
                //this.addTriangles(1, 1);
            }
            VertexData.ComputeNormals(this._positions, this._indices, this._normals);
            var vertexData = new VertexData();
            vertexData.positions = this._positions;
            vertexData.indices = this._indices;
            vertexData.normals = this._normals;
            if (this._uvs) {
                vertexData.uvs = this._uvs;
            }
            if (this._colors) {
                vertexData.colors = this._colors;
            }
            var mesh = new Mesh(name, this._scene);
            vertexData.applyToMesh(mesh, true);
            this.mesh = mesh;
            return mesh;
        }


        // adds a new particle object in the particles array
        private _addParticle(p: number, idxpos: number, shape: Vector3[], shapeUV: number[], shapeId: number): void {
            this.particles.push(new SolidParticle(p, idxpos, shape, shapeUV, shapeId));
        }

        // add solid particles from a shape model in the particles array
        public addShape(mesh: Mesh, nb: number): number {
            var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);
            // shape and shapeUV
            var posToShape = (positions) => {
                var shape = [];
                for (var i = 0; i < positions.length; i += 3) {
                    shape.push(new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]));
                }
                return shape;
            };
            var uvsToShapeUV = (uvs) => {
                var shapeUV = [];
                if (uvs) {
                        shapeUV.push(uvs.x, uvs.y, uvs.z, uvs.w);
                }
                return shapeUV;
            };
            var shape = posToShape(meshPos);
            var shapeUV = uvsToShapeUV(meshUV);
            // builder
            var meshBuilder = (p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors) => { 
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
                        colors.push(meshCol[c], meshCol[c + 1], meshCol[c + 2], meshCol[c + 3]);
                        c += 4;
                    } else {
                        colors.push(1,1,1,1);
                    }
                }
                for (i = 0; i < meshInd.length; i++) {
                    indices.push(p + meshInd[i]);
                }
            };
            // particles
            for (var i = 0; i < nb; i++) {
                meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors);
                this._addParticle(this.nbParticles + i, this._positions.length, shape, shapeUV, this._shapeCounter);
                this._index += shape.length;
            }
            this.nbParticles += nb;
            this._shapeCounter ++;
            return this._shapeCounter;
        }

        // resets a particle back to its just built status
        public resetParticle(particle: SolidParticle): void {
            for (var pt = 0; pt < particle._shape.length; pt++) {
                this._positions[particle._pos + pt * 3] = particle._shape[pt].x;      
                this._positions[particle._pos + pt * 3 + 1] = particle._shape[pt].y;
                this._positions[particle._pos + pt * 3 + 2] = particle._shape[pt].z;
            }
        }

        // sets all the particles
        public setParticles(): void {
            // custom beforeUpdate
            this.beforeUpdateParticles();

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
            if (this.billboard)  {    
                // compute a fake camera position : un-rotate the camera position by the current mesh rotation
                this._yaw = this.mesh.rotation.y;
                this._pitch = this.mesh.rotation.x;
                this._roll = this.mesh.rotation.z;
                this._quaternionRotationYPR();
                this._quaternionToRotationMatrix();    
                this._rotMatrix.invertToRef(this._invertedMatrix);
                Vector3.TransformCoordinatesToRef(this._camera.globalPosition, this._invertedMatrix, this._fakeCamPos);

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

            // particle loop
            for (var p = 0; p < this.nbParticles; p++) { 
                this._particle = this.particles[p];

                // call to custom user function to update the particle properties
                this.updateParticle(this._particle); 

                // particle rotation matrix
                if (this.billboard) {
                    this._particle.rotation.x = 0.0;
                    this._particle.rotation.y = 0.0;
                }
                if (this._useParticleRotation) {
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

                for (var pt = 0; pt < this._particle._shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;

                    this._vertex.x = this._particle._shape[pt].x;
                    this._vertex.y = this._particle._shape[pt].y;
                    this._vertex.z = this._particle._shape[pt].z;

                    if (this._useParticleVertex) {
                        this.updateParticleVertex(this._particle, this._vertex, pt);
                    }

                    Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);

                    this._positions[idx]     = this._particle.position.x + this._cam_axisX.x * this._rotated.x * this._particle.scale.x + this._cam_axisY.x * this._rotated.y * this._particle.scale.y + this._cam_axisZ.x * this._rotated.z * this._particle.scale.z;      
                    this._positions[idx + 1] = this._particle.position.y + this._cam_axisX.y * this._rotated.x * this._particle.scale.x + this._cam_axisY.y * this._rotated.y * this._particle.scale.y + this._cam_axisZ.y * this._rotated.z * this._particle.scale.z; 
                    this._positions[idx + 2] = this._particle.position.z + this._cam_axisX.z * this._rotated.x * this._particle.scale.x + this._cam_axisY.z * this._rotated.y * this._particle.scale.y + this._cam_axisZ.z * this._rotated.z * this._particle.scale.z; 

                    if (this._useParticleColor) {
                        this._colors[colidx] = this._particle.color.r;
                        this._colors[colidx + 1] = this._particle.color.g;
                        this._colors[colidx + 2] = this._particle.color.b;
                        this._colors[colidx + 3] = this._particle.color.a;
                    }

                    if (this._useParticleTexture) {
                        this._uvs[uvidx] = this._particle._shapeUV[pt * 2] * (this._particle.uvs.z - this._particle.uvs.x) + this._particle.uvs.x;
                        this._uvs[uvidx + 1] = this._particle._shapeUV[pt * 2 + 1] * (this._particle.uvs.w - this._particle.uvs.y) + this._particle.uvs.y;
                    }
                }
                index = idx + 3;
                colorIndex = colidx + 4;
                uvIndex = uvidx + 2;
            }

            if (this._useParticleColor) {
                this.mesh.updateVerticesData(VertexBuffer.ColorKind, this._colors, false, false);
            }
            if (this._useParticleTexture) {
                this.mesh.updateVerticesData(VertexBuffer.UVKind, this._uvs, false, false);
            }
            this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions, false, false);
            if (!this.mesh.areNormalsFrozen) {
                var indices = this.mesh.getIndices();
                VertexData.ComputeNormals(this._positions, this._indices, this._normals);
                this.mesh.updateVerticesData(VertexBuffer.NormalKind, this._normals, false, false);
            }
            this.afterUpdateParticles();
        }
        // internal implementation of BJS Quaternion.RotationYawPitchRollToRef() with memory reuse
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

        // internal implemenation of BJS toRotationMatric() with memory reuse
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
            this._rotMatrix.m[15] = 1.0
        }

        // dispose the SPS
        public dispose(): void {
            this.mesh.dispose();
            this.mesh = null;
            this.particles.length = 0;
            this.nbParticles = null;
            this.billboard = null;
            this.counter = null;
            this._scene = null;
            this._positions.length = 0;
            this._indices.length = 0;
            this._normals.length = 0;
            this._colors.length = 0;
            this._uvs.length = 0;
            this._index = null;
            this._shapeCounter = null;
            this._useParticleColor = null;
            this._useParticleTexture = null;
            this._useParticleRotation = null;
            this._useParticleVertex = null;
            this._cam_axisZ = null;
            this._cam_axisY = null;
            this._cam_axisX = null;
            this._axisX = null;
            this._axisY = null;
            this._axisZ = null;
            this._camera = null;
            this._fakeCamPos = null;
            this._rotMatrix = null;
            this._invertedMatrix = null;
            this._rotated = null;
            this._quaternion = null;
            this._vertex = null;
            this._yaw = null;
            this._pitch = null;
            this._roll = null;
            this._halfroll = null;
            this._halfpitch = null;
            this._halfyaw = null;
            this._sinRoll = null;
            this._cosRoll = null;
            this._sinPitch = null;
            this._cosPitch = null;
            this._sinYaw = null;
            this._cosYaw = null;   
        }

        // Optimizers
        public enableParticleRotation(): void {
            this._useParticleRotation = true;
        }

        public disableParticleRotation(): void {
            this._useParticleRotation = false;
        }

        public enableParticleColor(): void {
            this._useParticleColor = true;
        }
        public disableParticleColor(): void {
            this._useParticleColor = false;
        }

        public enableParticleTexture(): void {
            this._useParticleTexture = true;
        } 

        public disableParticleTexture(): void {
            this._useParticleTexture = false;
        } 

        public enableParticleVertex(): void {
            this._useParticleVertex = true;
        } 

        public disableParticleVertex(): void {
            this._useParticleVertex = false;
        }

        // =======================================================================
        // Particle behavior logic
        // these following methods may be overwritten by the user to fit his needs


        // init : sets all particles first values and calls updateParticle to set them in space
        // can be overwritten by the user
        public initParticles(): void {    
        }

        // recycles a particle : can by overwritten by the user
        public recycleParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        // updates a particle : can be overwritten by the user
        // will be called on each particle by setParticles() :
        // ex : just set a particle position or velocity and recycle conditions
        public updateParticle (particle: SolidParticle): SolidParticle {
            return particle;
        }

        // updates a vertex of a particle : can be overwritten by the user
        // will be called on each vertex particle by setParticles() :
        // ex : just set a vertex particle position
        public updateParticleVertex(particle: SolidParticle, vertex: Vector3, i: number): Vector3 {
            return vertex;
        }

        // will be called before any other treatment by setParticles()
        public beforeUpdateParticles(): void {
        }

        // will be called after all setParticles() treatments
        public afterUpdateParticles(): void {
        }
    }
}