module BABYLON {

    /**
     * Creates an instance based on a source mesh.
     */
    export class InstancedMesh extends AbstractMesh {
        private _sourceMesh: Mesh;
        private _currentLOD: Mesh;

        constructor(name: string, source: Mesh) {
            super(name, source.getScene());

            source.instances.push(this);

            this._sourceMesh = source;

            this.position.copyFrom(source.position);
            this.rotation.copyFrom(source.rotation);
            this.scaling.copyFrom(source.scaling);

            if (source.rotationQuaternion) {
                this.rotationQuaternion = source.rotationQuaternion.clone();
            }

            this.infiniteDistance = source.infiniteDistance;

            this.setPivotMatrix(source.getPivotMatrix());

            this.refreshBoundingInfo();
            this._syncSubMeshes();
        }

        /**
         * Returns the string "InstancedMesh".  
         */
        public getClassName(): string {
            return "InstancedMesh";
        }          

        // Methods
        public get receiveShadows(): boolean {
            return this._sourceMesh.receiveShadows;
        }

        public get material(): Material {
            return this._sourceMesh.material;
        }

        public get visibility(): number {
            return this._sourceMesh.visibility;
        }

        public get skeleton(): Skeleton {
            return this._sourceMesh.skeleton;
        }

        public get renderingGroupId(): number {
            return this._sourceMesh.renderingGroupId;
        }

        /**
         * Returns the total number of vertices (integer).  
         */
        public getTotalVertices(): number {
            return this._sourceMesh.getTotalVertices();
        }

        public get sourceMesh(): Mesh {
            return this._sourceMesh;
        }

        /**
         * Returns a float array or a Float32Array of the requested kind of data : positons, normals, uvs, etc.  
         */
        public getVerticesData(kind: string, copyWhenShared?: boolean): number[] | Float32Array {
            return this._sourceMesh.getVerticesData(kind, copyWhenShared);
        }

        /**
         * Boolean : True if the mesh owns the requested kind of data.
         */
        public isVerticesDataPresent(kind: string): boolean {
            return this._sourceMesh.isVerticesDataPresent(kind);
        }

        /**
         * Returns an array of indices (IndicesArray).  
         */
        public getIndices(): IndicesArray {
            return this._sourceMesh.getIndices();
        }

        public get _positions(): Vector3[] {
            return this._sourceMesh._positions;
        }

        /**
         * Sets a new updated BoundingInfo to the mesh.  
         * Returns the mesh.  
         */
        public refreshBoundingInfo(): InstancedMesh {
            var meshBB = this._sourceMesh.getBoundingInfo();

            this._boundingInfo = new BoundingInfo(meshBB.minimum.clone(), meshBB.maximum.clone());

            this._updateBoundingInfo();
            return this;
        }

        public _preActivate(): InstancedMesh {
            if (this._currentLOD) {
                this._currentLOD._preActivate();
            }
            return this;
        }

        public _activate(renderId: number): InstancedMesh {
            if (this._currentLOD) {
                this._currentLOD._registerInstanceForRenderId(this, renderId);
            }
            return this;
        }

        /**
         * Returns the current associated LOD AbstractMesh.  
         */
        public getLOD(camera: Camera): AbstractMesh {
            this._currentLOD = <Mesh>this.sourceMesh.getLOD(this.getScene().activeCamera, this.getBoundingInfo().boundingSphere);

            if (this._currentLOD === this.sourceMesh) {
                return this;
            }

            return this._currentLOD;
        }

        public _syncSubMeshes(): InstancedMesh {
            this.releaseSubMeshes();
            if (this._sourceMesh.subMeshes) {
                for (var index = 0; index < this._sourceMesh.subMeshes.length; index++) {
                    this._sourceMesh.subMeshes[index].clone(this, this._sourceMesh);
                }
            }
            return this;
        }

        public _generatePointsArray(): boolean {
            return this._sourceMesh._generatePointsArray();
        }

        /**
         * Creates a new InstancedMesh from the current mesh.  
         * - name (string) : the cloned mesh name
         * - newParent (optional Node) : the optional Node to parent the clone to.  
         * - doNotCloneChildren (optional boolean, default `false`) : if `true` the model children aren't cloned.  
         * 
         * Returns the clone.  
         */
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh {
            var result = this._sourceMesh.createInstance(name);

            // Deep copy
            Tools.DeepCopy(this, result, ["name", "subMeshes"], []);

            // Bounding info
            this.refreshBoundingInfo();

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                // Children
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent === this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            result.computeWorldMatrix(true);

            return result;
        }

        /**
         * Disposes the InstancedMesh.  
         * Returns nothing.  
         */
        public dispose(doNotRecurse?: boolean): void {

            // Remove from mesh
            var index = this._sourceMesh.instances.indexOf(this);
            this._sourceMesh.instances.splice(index, 1);

            super.dispose(doNotRecurse);
        }
    }
} 