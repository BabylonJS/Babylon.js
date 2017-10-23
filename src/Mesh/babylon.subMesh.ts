module BABYLON {
    export class BaseSubMesh {
        public _materialDefines: Nullable<MaterialDefines>;
        public _materialEffect: Nullable<Effect>;

        public get effect(): Nullable<Effect> {
            return this._materialEffect;
        }       

        public setEffect(effect: Nullable<Effect>, defines: Nullable<MaterialDefines> = null) {
            if (this._materialEffect === effect) {
                if (!effect) {
                    this._materialDefines = null;
                }
                return;
            }
            this._materialDefines = defines;
            this._materialEffect = effect;
        }         
    }

    export class SubMesh extends BaseSubMesh implements ICullable {
        public linesIndexCount: number;

        private _mesh: AbstractMesh;
        private _renderingMesh: Mesh;
        private _boundingInfo: Nullable<BoundingInfo>;
        private _linesIndexBuffer: Nullable<WebGLBuffer>;
        public _lastColliderWorldVertices: Nullable<Vector3[]>;
        public _trianglePlanes: Plane[];
        public _lastColliderTransformMatrix: Matrix;

        public _renderId = 0;
        public _alphaIndex: number;
        public _distanceToCamera: number;
        public _id: number;

        private _currentMaterial: Material;

        public static AddToMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox: boolean = true): SubMesh {
            return new SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh, createBoundingBox);
        }

        constructor(public materialIndex: number, public verticesStart: number, public verticesCount: number, public indexStart: number, public indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox: boolean = true) {
            super();
            this._mesh = mesh;
            this._renderingMesh = renderingMesh || <Mesh>mesh;
            mesh.subMeshes.push(this);

            this._trianglePlanes = [];

            this._id = mesh.subMeshes.length - 1;

            if (createBoundingBox) {
                this.refreshBoundingInfo();
                mesh.computeWorldMatrix(true);
            }
        }

        public get IsGlobal(): boolean {
            return (this.verticesStart === 0 && this.verticesCount == this._mesh.getTotalVertices());
        }

        /**
         * Returns the submesh BoudingInfo object.  
         */
        public getBoundingInfo(): Nullable<BoundingInfo> {
            if (this.IsGlobal) {
                return this._mesh.getBoundingInfo();
            }

            return this._boundingInfo;
        }

        /**
         * Sets the submesh BoundingInfo.  
         * Return the SubMesh.  
         */
        public setBoundingInfo(boundingInfo: BoundingInfo): SubMesh {
            this._boundingInfo = boundingInfo;
            return this;
        }

        /** 
         * Returns the mesh of the current submesh.  
         */
        public getMesh(): AbstractMesh {
            return this._mesh;
        }

        /**
         * Returns the rendering mesh of the submesh.  
         */
        public getRenderingMesh(): Mesh {
            return this._renderingMesh;
        }

        /**
         * Returns the submesh material.  
         */
        public getMaterial(): Material {
            var rootMaterial = this._renderingMesh.material;

            if (rootMaterial && (<MultiMaterial>rootMaterial).getSubMaterial) {
                var multiMaterial = <MultiMaterial>rootMaterial;
                var effectiveMaterial = multiMaterial.getSubMaterial(this.materialIndex);

                if (this._currentMaterial !== effectiveMaterial) {
                    this._currentMaterial = effectiveMaterial;
                    this._materialDefines = null;
                }

                return effectiveMaterial;
            }

            if (!rootMaterial) {
                return this._mesh.getScene().defaultMaterial;
            }

            return rootMaterial;
        }

        // Methods
        /**
         * Sets a new updated BoundingInfo object to the submesh.  
         * Returns the SubMesh.  
         */
        public refreshBoundingInfo(): SubMesh {
            this._lastColliderWorldVertices = null;

            if (this.IsGlobal) {
                return this;
            }
            var data = this._renderingMesh.getVerticesData(VertexBuffer.PositionKind);

            if (!data) {
                this._boundingInfo = this._mesh._boundingInfo;
                return this;
            }

            var indices = this._renderingMesh.getIndices();
            var extend: { minimum: Vector3, maximum: Vector3 };

            //is this the only submesh?
            if (this.indexStart === 0 && this.indexCount === indices.length) {
                let boundingInfo = this._renderingMesh.getBoundingInfo();

                if (!boundingInfo) {
                    return this;
                }

                //the rendering mesh's bounding info can be used, it is the standard submesh for all indices.
                extend = { minimum: boundingInfo.minimum.clone(), maximum: boundingInfo.maximum.clone() };
            } else {
                extend = Tools.ExtractMinAndMaxIndexed(data, indices, this.indexStart, this.indexCount, this._renderingMesh.geometry.boundingBias);
            }
            this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
            return this;
        }

        public _checkCollision(collider: Collider): boolean {
            let boundingInfo = this._renderingMesh.getBoundingInfo();

            if (!boundingInfo) {
                return false;
            }

            return boundingInfo._checkCollision(collider);
        }

        /**
         * Updates the submesh BoundingInfo.  
         * Returns the Submesh.  
         */
        public updateBoundingInfo(world: Matrix): SubMesh {
            let boundingInfo = this.getBoundingInfo();

            if (!boundingInfo) {
                this.refreshBoundingInfo();
            }
            (<BoundingInfo>boundingInfo).update(world);
            return this;
        }

        /**
         * True is the submesh bounding box intersects the frustum defined by the passed array of planes.  
         * Boolean returned.  
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            let boundingInfo = this.getBoundingInfo();
            
            if (!boundingInfo) {
                return false;
            }            
            return boundingInfo.isInFrustum(frustumPlanes);
        }

        /**
         * True is the submesh bounding box is completely inside the frustum defined by the passed array of planes.  
         * Boolean returned.  
         */        
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            let boundingInfo = this.getBoundingInfo();
            
            if (!boundingInfo) {
                return false;
            }                  
            return boundingInfo.isCompletelyInFrustum(frustumPlanes);
        }

        /**
         * Renders the submesh.  
         * Returns it.  
         */
        public render(enableAlphaMode: boolean): SubMesh {
            this._renderingMesh.render(this, enableAlphaMode);
            return this;
        }

        /**
         * Returns a new Index Buffer.  
         * Type returned : WebGLBuffer.  
         */
        public getLinesIndexBuffer(indices: IndicesArray, engine: Engine): WebGLBuffer {
            if (!this._linesIndexBuffer) {
                var linesIndices = [];

                for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    linesIndices.push(indices[index], indices[index + 1],
                        indices[index + 1], indices[index + 2],
                        indices[index + 2], indices[index]);
                }

                this._linesIndexBuffer = engine.createIndexBuffer(linesIndices);
                this.linesIndexCount = linesIndices.length;
            }
            return this._linesIndexBuffer;
        }

        /**
         * True is the passed Ray intersects the submesh bounding box.  
         * Boolean returned.  
         */
        public canIntersects(ray: Ray): boolean {
            let boundingInfo = this.getBoundingInfo();
            
            if (!boundingInfo) {
                return false;
            }            
            return ray.intersectsBox(boundingInfo.boundingBox);
        }

        /**
         * Returns an object IntersectionInfo.  
         */
        public intersects(ray: Ray, positions: Vector3[], indices: IndicesArray, fastCheck?: boolean): Nullable<IntersectionInfo> {
            var intersectInfo: Nullable<IntersectionInfo> = null;

            // LineMesh first as it's also a Mesh...
            if (this._mesh instanceof LinesMesh) {
                var lineMesh = <LinesMesh>this._mesh;

                // Line test
                for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 2) {
                    var p0 = positions[indices[index]];
                    var p1 = positions[indices[index + 1]];

                    var length = ray.intersectionSegment(p0, p1, lineMesh.intersectionThreshold);
                    if (length < 0) {
                        continue;
                    }

                    if (fastCheck || !intersectInfo || length < intersectInfo.distance) {
                        intersectInfo = new IntersectionInfo(null, null, length);

                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }
            else {
                // Triangles test
                for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    var p0 = positions[indices[index]];
                    var p1 = positions[indices[index + 1]];
                    var p2 = positions[indices[index + 2]];

                    var currentIntersectInfo = ray.intersectsTriangle(p0, p1, p2);

                    if (currentIntersectInfo) {
                        if (currentIntersectInfo.distance < 0) {
                            continue;
                        }

                        if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                            intersectInfo = currentIntersectInfo;
                            intersectInfo.faceId = index / 3;

                            if (fastCheck) {
                                break;
                            }
                        }
                    }
                }
            }

            return intersectInfo;
        }

        public _rebuild(): void {
            if (this._linesIndexBuffer) {
                this._linesIndexBuffer = null;
            }
        }

        // Clone    
        /**
         * Creates a new Submesh from the passed Mesh.  
         */
        public clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh {
            var result = new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh, false);

            if (!this.IsGlobal) {
                let boundingInfo = this.getBoundingInfo();
                
                if (!boundingInfo) {
                    return result;
                }   

                result._boundingInfo = new BoundingInfo(boundingInfo.minimum, boundingInfo.maximum);
            }

            return result;
        }

        // Dispose
        /**
         * Disposes the Submesh.  
         * Returns nothing.  
         */
        public dispose(): void {
            if (this._linesIndexBuffer) {
                this._mesh.getScene().getEngine()._releaseBuffer(this._linesIndexBuffer);
                this._linesIndexBuffer = null;
            }

            // Remove from mesh
            var index = this._mesh.subMeshes.indexOf(this);
            this._mesh.subMeshes.splice(index, 1);
        }

        // Statics
        /**
         * Creates a new Submesh from the passed parameters : 
         * - materialIndex (integer) : the index of the main mesh material.  
         * - startIndex (integer) : the index where to start the copy in the mesh indices array.  
         * - indexCount (integer) : the number of indices to copy then from the startIndex.  
         * - mesh (Mesh) : the main mesh to create the submesh from.  
         * - renderingMesh (optional Mesh) : rendering mesh.  
         */
        public static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh {
            var minVertexIndex = Number.MAX_VALUE;
            var maxVertexIndex = -Number.MAX_VALUE;

            renderingMesh = (<Mesh>(renderingMesh || <Mesh>mesh));
            var indices = renderingMesh.getIndices();

            for (var index = startIndex; index < startIndex + indexCount; index++) {
                var vertexIndex = indices[index];

                if (vertexIndex < minVertexIndex)
                    minVertexIndex = vertexIndex;
                if (vertexIndex > maxVertexIndex)
                    maxVertexIndex = vertexIndex;
            }

            return new SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex + 1, startIndex, indexCount, mesh, renderingMesh);
        }
    }
}
