module BABYLON {

    export class SolidParticleSystem implements IDisposable {
        // public members  
        public particles = new Array<SolidParticle>();
        public nbParticles = 0;
        public billboard = false;
        public counter = 0;
        public name: string;
        public mesh: Mesh;
        
        // private members
        private _scene: Scene;
        private _positions = new Array<number>();
        private _indices = new Array<number>();
        private _normals = new Array<number>();
        private _colors = new Array<number>();
        private _uvs = new Array<number>();
        private _index = 0;  // indices index
        private _shapeCounter = 0;
        private _setParticleColor = true;
        private _setParticleTexture = true;
        private _setParticleRotation = true;
        private _setParticleVertex = false;
        private _cam_axisZ = Vector3.Zero();
        private _cam_axisY = Vector3.Zero();
        private _cam_axisX = Vector3.Zero();
        private _axisX = Axis.X;
        private _axisY = Axis.Y;
        private _axisZ = Axis.Z;
        private _camera: Camera;
        private _particle: SolidParticle;
        private _previousParticle: SolidParticle;
        private _fakeCamPos = Vector3.Zero();
        private _rotMatrix = new Matrix();
        private _invertedMatrix = new Matrix();
        private _rotated = Vector3.Zero();
        private _quaternion = new Quaternion();
        private _vertex = Vector3.Zero();
        private _yaw = 0.0;
        private _pitch = 0.0;
        private _roll = 0.0;
        private _halfroll = 0.0;
        private _halfpitch = 0.0;
        private _halfyaw = 0.0;
        private _sinRoll = 0.0;
        private _cosRoll = 0.0;
        private _sinPitch = 0.0;
        private _cosPitch = 0.0;
        private _sinYaw = 0.0;
        private _cosYaw = 0.0;


        constructor(name: string, scene: Scene) {
            this.name = name;
            this._scene = scene;
            this._camera = scene.activeCamera;
        }

        // build the SPS mesh : returns the mesh
        public buildMesh(): Mesh {
            if (this.nbParticles === 0) {
                var triangle = Mesh.CreateDisc("", { radius: 1, tessellation: 3 }, this._scene);
                this.addShape(triangle, 1);
                triangle.dispose();
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

        // _meshBuilder : inserts the shape model in the global SPS mesh
        private _meshBuilder(p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors): void {
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
                } else {
                    colors.push(1, 1, 1, 1);
                }
            }
            for (i = 0; i < meshInd.length; i++) {
                indices.push(p + meshInd[i]);
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

        // adds a new particle object in the particles array and double links the particle (next/previous)
        private _addParticle(p: number, idxpos: number, shape: Vector3[], shapeUV: number[], shapeId: number): void {
            this._particle = new SolidParticle(p, idxpos, shape, shapeUV, shapeId);
            this.particles.push(this._particle);
            this._particle.previous = this._previousParticle;
            if (this._previousParticle) {
                this._previousParticle.next = this._particle;
            }
            this._previousParticle = this._particle;
        }

        // add solid particles from a shape model in the particles array
        public addShape(mesh: Mesh, nb: number): number {
            var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);

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
        public setParticles(start: number = 0, end: number = this.nbParticles - 1, update: boolean = true): void {
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

                    if (this._setParticleVertex) {
                        this.updateParticleVertex(this._particle, this._vertex, pt);
                    }

                    Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);

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
                    this.mesh.updateVerticesData(VertexBuffer.ColorKind, this._colors, false, false);
                }
                if (this._setParticleTexture) {
                    this.mesh.updateVerticesData(VertexBuffer.UVKind, this._uvs, false, false);
                }
                this.mesh.updateVerticesData(VertexBuffer.PositionKind, this._positions, false, false);
                if (!this.mesh.areNormalsFrozen) {
                    VertexData.ComputeNormals(this._positions, this._indices, this._normals);
                    this.mesh.updateVerticesData(VertexBuffer.NormalKind, this._normals, false, false);
                }
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

        // dispose the SPS
        public dispose(): void {
            this.mesh.dispose();
        }

        // Optimizer setters
        public set setParticleRotation(val: boolean) {
            this._setParticleRotation = val;
        }

        public set setParticleColor(val: boolean) {
            this._setParticleColor = val;
        }

        public set setParticleTexture(val: boolean) {
            this._setParticleTexture = val;
        }

        public set setParticleVertex(val: boolean) {
            this._setParticleVertex = val;
        } 

        // getters
        public get setParticleRotation(): boolean {
            return this._setParticleRotation;
        }

        public get setParticleColor(): boolean {
            return this._setParticleColor;
        }

        public get setParticleTexture(): boolean {
            return this._setParticleTexture;
        }

        public get setParticleVertex(): boolean {
            return this._setParticleVertex;
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
        public updateParticle(particle: SolidParticle): SolidParticle {
            return particle;
        }

        // updates a vertex of a particle : can be overwritten by the user
        // will be called on each vertex particle by setParticles() :
        // ex : just set a vertex particle position
        public updateParticleVertex(particle: SolidParticle, vertex: Vector3, i: number): Vector3 {
            return vertex;
        }

        // will be called before any other treatment by setParticles()
        public beforeUpdateParticles(start?: number, stop?: number, update?: boolean): void {
        }

        // will be called after all setParticles() treatments
        public afterUpdateParticles(start?: number, stop?: number, update?: boolean): void {
        }
    }
}
