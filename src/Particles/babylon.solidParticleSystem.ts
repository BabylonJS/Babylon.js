module BABYLON {

    export class SolidParticleSystem implements IDisposable {
        // public members  
        public particles: SolidParticle[] = new Array<SolidParticle>();
        public nbParticles: number = 0;
        public billboard: boolean = false;
        public counter: number = 0;
        public name: string;
        public mesh: Mesh;
        
        // private members
        private _scene: Scene;
        private _positions: number[] = new Array<number>();
        private _indices: number[] = new Array<number>();
        private _normals: number[] = new Array<number>();
        private _colors: number[] = new Array<number>();
        private _uvs: number[] = new Array<number>();
        private _positions32: Float32Array;
        private _normals32: Float32Array;
        private _colors32: Float32Array;
        private _uvs32: Float32Array;
        private _index: number = 0;  // indices index
        private _shapeCounter: number = 0;
        private _copy: any = {position: Vector3.Zero(), rotation: Vector3.Zero(), scale: new Vector3(1,1,1), quaternion: null, uvs: new Vector4(0,0,1,1), colors: null};
        private _color: Color4 = new Color4(0,0,0,0);
        private _computeParticleColor: boolean = true;
        private _computeParticleTexture: boolean = true;
        private _computeParticleRotation: boolean = true;
        private _computeParticleVertex: boolean = false;
        private _cam_axisZ: Vector3 = Vector3.Zero();
        private _cam_axisY: Vector3 = Vector3.Zero();
        private _cam_axisX: Vector3 = Vector3.Zero();
        private _axisX: Vector3 = Axis.X;
        private _axisY: Vector3 = Axis.Y;
        private _axisZ: Vector3 = Axis.Z;
        private _camera: Camera;
        private _particle: SolidParticle;
        private _previousParticle: SolidParticle;
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
        public buildMesh(upgradable: boolean = true): Mesh {
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
            var mesh = new Mesh(name, this._scene);
            vertexData.applyToMesh(mesh, upgradable);
            this.mesh = mesh;

            // free memory
            this._positions = null;
            this._normals = null;
            this._uvs = null;
            this._colors = null;

            return mesh;
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
            this._copy.colors = null;
        }

        // _meshBuilder : inserts the shape model in the global SPS mesh
        private _meshBuilder(p, shape, positions, meshInd, indices, meshUV, uvs, meshCol, colors, customBuilder): void {
            var i;
            var u = 0;
            var c = 0;

            if (customBuilder) {        // call to customBuilder
                this._resetCopy();
                customBuilder(this._copy, p);
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
                this._vertex.x = shape[i].x * this._copy.scale.x;
                this._vertex.y = shape[i].y * this._copy.scale.y;
                this._vertex.z = shape[i].z * this._copy.scale.z;
                Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);
                positions.push(this._copy.position.x + this._rotated.x, this._copy.position.y + this._rotated.y, this._copy.position.z + this._rotated.z);
                if (meshUV) {
                    uvs.push((this._copy.uvs.z - this._copy.uvs.x) * meshUV[u] + this._copy.uvs.x, (this._copy.uvs.w - this._copy.uvs.y) * meshUV[u + 1] + this._copy.uvs.y);
                    u += 2;
                }

                if (this._copy.colors) {
                    this._color = this._copy.colors;
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
        public addShape(mesh: Mesh, nb: number, customBuilder?): number {
            var meshPos = mesh.getVerticesData(VertexBuffer.PositionKind);
            var meshInd = mesh.getIndices();
            var meshUV = mesh.getVerticesData(VertexBuffer.UVKind);
            var meshCol = mesh.getVerticesData(VertexBuffer.ColorKind);

            var shape = this._posToShape(meshPos);
            var shapeUV = this._uvsToShapeUV(meshUV);

            // particles
            for (var i = 0; i < nb; i++) {
                this._meshBuilder(this._index, shape, this._positions, meshInd, this._indices, meshUV, this._uvs, meshCol, this._colors, customBuilder);
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

                for (var pt = 0; pt < this._particle._shape.length; pt++) {
                    idx = index + pt * 3;
                    colidx = colorIndex + pt * 4;
                    uvidx = uvIndex + pt * 2;

                    this._vertex.x = this._particle._shape[pt].x * this._particle.scale.x;
                    this._vertex.y = this._particle._shape[pt].y * this._particle.scale.y;
                    this._vertex.z = this._particle._shape[pt].z * this._particle.scale.z;

                    if (this._computeParticleVertex) {
                        this.updateParticleVertex(this._particle, this._vertex, pt);
                    }

                    Vector3.TransformCoordinatesToRef(this._vertex, this._rotMatrix, this._rotated);

                    this._positions32[idx] = this._particle.position.x + this._cam_axisX.x * this._rotated.x + this._cam_axisY.x * this._rotated.y + this._cam_axisZ.x * this._rotated.z;
                    this._positions32[idx + 1] = this._particle.position.y + this._cam_axisX.y * this._rotated.x + this._cam_axisY.y * this._rotated.y + this._cam_axisZ.y * this._rotated.z;
                    this._positions32[idx + 2] = this._particle.position.z + this._cam_axisX.z * this._rotated.x + this._cam_axisY.z * this._rotated.y + this._cam_axisZ.z * this._rotated.z;

                    if (this._computeParticleColor) {
                        this._colors32[colidx] = this._particle.color.r;
                        this._colors32[colidx + 1] = this._particle.color.g;
                        this._colors32[colidx + 2] = this._particle.color.b;
                        this._colors32[colidx + 3] = this._particle.color.a;
                    }

                    if (this._computeParticleTexture) {
                        this._uvs32[uvidx] = this._particle._shapeUV[pt * 2] * (this._particle.uvs.z - this._particle.uvs.x) + this._particle.uvs.x;
                        this._uvs32[uvidx + 1] = this._particle._shapeUV[pt * 2 + 1] * (this._particle.uvs.w - this._particle.uvs.y) + this._particle.uvs.y;
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
                    VertexData.ComputeNormals(this._positions32, this._indices, this._normals32);
                    this.mesh.updateVerticesData(VertexBuffer.NormalKind, this._normals32, false, false);
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
        public set computeParticleRotation(val: boolean) {
            this._computeParticleRotation = val;
        }

        public set computeParticleColor(val: boolean) {
            this._computeParticleColor = val;
        }

        public set computeParticleTexture(val: boolean) {
            this._computeParticleTexture = val;
        }

        public set computeParticleVertex(val: boolean) {
            this._computeParticleVertex = val;
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
