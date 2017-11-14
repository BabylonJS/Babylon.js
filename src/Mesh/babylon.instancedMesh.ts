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

        public get material(): Nullable<Material> {
            return this._sourceMesh.material;
        }

        public get visibility(): number {
            return this._sourceMesh.visibility;
        }

        public get skeleton(): Nullable<Skeleton> {
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
        public getVerticesData(kind: string, copyWhenShared?: boolean): Nullable<FloatArray> {
            return this._sourceMesh.getVerticesData(kind, copyWhenShared);
        }

        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.  
         * The `data` are either a numeric array either a Float32Array. 
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater. 
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).  
         * Note that a new underlying VertexBuffer object is created each call. 
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed. 
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind  
         * 
         * Returns the Mesh.  
         */
        public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh {
            if (this.sourceMesh) {
               this.sourceMesh.setVerticesData(kind, data, updatable, stride);
            }
            return this.sourceMesh;
        }

        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.  
         * The `data` are either a numeric array either a Float32Array. 
         * No new underlying VertexBuffer object is created. 
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.  
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         * 
         * Returns the Mesh.  
         */
        public updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh {
            if (this.sourceMesh) {
               this.sourceMesh.updateVerticesData(kind, data, updateExtends, makeItUnique);
            }
            return this.sourceMesh;
        }

        /**
         * Sets the mesh indices.  
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh. 
         * This method creates a new index buffer each call.  
         * Returns the Mesh.  
         */
        public setIndices(indices: IndicesArray, totalVertices: Nullable<number> = null): Mesh {
            if (this.sourceMesh) {
               this.sourceMesh.setIndices(indices, totalVertices);
            }
            return this.sourceMesh;
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
        public getIndices(): Nullable<IndicesArray> {
            return this._sourceMesh.getIndices();
        }

        public get _positions(): Nullable<Vector3[]> {
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
            if (!camera) {
                return this;
            }

            let boundingInfo = this.getBoundingInfo();

            this._currentLOD = <Mesh>this.sourceMesh.getLOD(camera, boundingInfo.boundingSphere);

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
            Tools.DeepCopy(this, result, ["name", "subMeshes", "uniqueId"], []);

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