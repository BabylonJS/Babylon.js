module BABYLON {
    /**
     * Base class for submeshes
     */
    export class BaseSubMesh {
        /** @hidden */
        public _materialDefines: Nullable<MaterialDefines>;
        /** @hidden */
        public _materialEffect: Nullable<Effect>;

        /**
         * Gets associated effect
         */
        public get effect(): Nullable<Effect> {
            return this._materialEffect;
        }

        /**
         * Sets associated effect (effect used to render this submesh)
         * @param effect defines the effect to associate with
         * @param defines defines the set of defines used to compile this effect
         */
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

    /**
     * Defines a subdivision inside a mesh
     */
    export class SubMesh extends BaseSubMesh implements ICullable {
        /** @hidden */
        public _linesIndexCount: number;
        private _mesh: AbstractMesh;
        private _renderingMesh: Mesh;
        private _boundingInfo: BoundingInfo;
        private _linesIndexBuffer: Nullable<WebGLBuffer>;
        /** @hidden */
        public _lastColliderWorldVertices: Nullable<Vector3[]>;
        /** @hidden */
        public _trianglePlanes: Plane[];
        /** @hidden */
        public _lastColliderTransformMatrix: Matrix;

        /** @hidden */
        public _renderId = 0;
        /** @hidden */
        public _alphaIndex: number;
        /** @hidden */
        public _distanceToCamera: number;
        /** @hidden */
        public _id: number;

        private _currentMaterial: Nullable<Material>;

        /**
         * Add a new submesh to a mesh
         * @param materialIndex defines the material index to use
         * @param verticesStart defines vertex index start
         * @param verticesCount defines vertices count
         * @param indexStart defines index start
         * @param indexCount defines indices count
         * @param mesh defines the parent mesh
         * @param renderingMesh defines an optional rendering mesh
         * @param createBoundingBox defines if bounding box should be created for this submesh
         * @returns the new submesh
         */
        public static AddToMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox: boolean = true): SubMesh {
            return new SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh, createBoundingBox);
        }

        /**
         * Creates a new submesh
         * @param materialIndex defines the material index to use
         * @param verticesStart defines vertex index start
         * @param verticesCount defines vertices count
         * @param indexStart defines index start
         * @param indexCount defines indices count
         * @param mesh defines the parent mesh
         * @param renderingMesh defines an optional rendering mesh
         * @param createBoundingBox defines if bounding box should be created for this submesh
         */
        constructor(
            /** the material index to use */
            public materialIndex: number,
            /** vertex index start */
            public verticesStart: number,
            /** vertices count */
            public verticesCount: number,
            /** index start */
            public indexStart: number,
            /** indices count */
            public indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox: boolean = true) {
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

        /**
         * Returns true if this submesh covers the entire parent mesh
         * @ignorenaming
         */
        public get IsGlobal(): boolean {
            return (this.verticesStart === 0 && this.verticesCount === this._mesh.getTotalVertices());
        }

        /**
         * Returns the submesh BoudingInfo object
         * @returns current bounding info (or mesh's one if the submesh is global)
         */
        public getBoundingInfo(): BoundingInfo {
            if (this.IsGlobal) {
                return this._mesh.getBoundingInfo();
            }

            return this._boundingInfo;
        }

        /**
         * Sets the submesh BoundingInfo
         * @param boundingInfo defines the new bounding info to use
         * @returns the SubMesh
         */
        public setBoundingInfo(boundingInfo: BoundingInfo): SubMesh {
            this._boundingInfo = boundingInfo;
            return this;
        }

        /**
         * Returns the mesh of the current submesh
         * @return the parent mesh
         */
        public getMesh(): AbstractMesh {
            return this._mesh;
        }

        /**
         * Returns the rendering mesh of the submesh
         * @returns the rendering mesh (could be different from parent mesh)
         */
        public getRenderingMesh(): Mesh {
            return this._renderingMesh;
        }

        /**
         * Returns the submesh material
         * @returns null or the current material
         */
        public getMaterial(): Nullable<Material> {
            var rootMaterial = this._renderingMesh.material;

            if (rootMaterial === null || rootMaterial === undefined) {
                return this._mesh.getScene().defaultMaterial;
            } else if ((<MultiMaterial>rootMaterial).getSubMaterial) {
                var multiMaterial = <MultiMaterial>rootMaterial;
                var effectiveMaterial = multiMaterial.getSubMaterial(this.materialIndex);

                if (this._currentMaterial !== effectiveMaterial) {
                    this._currentMaterial = effectiveMaterial;
                    this._materialDefines = null;
                }

                return effectiveMaterial;
            }

            return rootMaterial;
        }

        // Methods

        /**
         * Sets a new updated BoundingInfo object to the submesh
         * @returns the SubMesh
         */
        public refreshBoundingInfo(): SubMesh {
            this._lastColliderWorldVertices = null;

            if (this.IsGlobal || !this._renderingMesh || !this._renderingMesh.geometry) {
                return this;
            }
            var data = this._renderingMesh.getVerticesData(VertexBuffer.PositionKind);

            if (!data) {
                this._boundingInfo = this._mesh.getBoundingInfo();
                return this;
            }

            var indices = <IndicesArray>this._renderingMesh.getIndices();
            var extend: { minimum: Vector3, maximum: Vector3 };

            //is this the only submesh?
            if (this.indexStart === 0 && this.indexCount === indices.length) {
                let boundingInfo = this._renderingMesh.getBoundingInfo();

                //the rendering mesh's bounding info can be used, it is the standard submesh for all indices.
                extend = { minimum: boundingInfo.minimum.clone(), maximum: boundingInfo.maximum.clone() };
            } else {
                extend = Tools.ExtractMinAndMaxIndexed(data, indices, this.indexStart, this.indexCount, this._renderingMesh.geometry.boundingBias);
            }

            const extraWorldExtent = this._renderingMesh.geometry ? this._renderingMesh.geometry._boundingWorldExtraExtent : undefined;

            if (this._boundingInfo) {
                this._boundingInfo.reConstruct(extend.minimum, extend.maximum, undefined, extraWorldExtent);
            }
            else {
                this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum, undefined, extraWorldExtent);
            }
            return this;
        }

        /** @hidden */
        public _checkCollision(collider: Collider): boolean {
            let boundingInfo = this.getBoundingInfo();

            return boundingInfo._checkCollision(collider);
        }

        /**
         * Updates the submesh BoundingInfo
         * @param world defines the world matrix to use to update the bounding info
         * @returns the submesh
         */
        public updateBoundingInfo(world: Matrix): SubMesh {
            let boundingInfo = this.getBoundingInfo();

            if (!boundingInfo) {
                this.refreshBoundingInfo();
                boundingInfo = this.getBoundingInfo();
            }
            (<BoundingInfo>boundingInfo).update(world);
            return this;
        }

        /**
         * True is the submesh bounding box intersects the frustum defined by the passed array of planes.
         * @param frustumPlanes defines the frustum planes
         * @returns true if the submesh is intersecting with the frustum
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            let boundingInfo = this.getBoundingInfo();

            if (!boundingInfo) {
                return false;
            }
            return boundingInfo.isInFrustum(frustumPlanes, this._mesh.cullingStrategy);
        }

        /**
         * True is the submesh bounding box is completely inside the frustum defined by the passed array of planes
         * @param frustumPlanes defines the frustum planes
         * @returns true if the submesh is inside the frustum
         */
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            let boundingInfo = this.getBoundingInfo();

            if (!boundingInfo) {
                return false;
            }
            return boundingInfo.isCompletelyInFrustum(frustumPlanes);
        }

        /**
         * Renders the submesh
         * @param enableAlphaMode defines if alpha needs to be used
         * @returns the submesh
         */
        public render(enableAlphaMode: boolean): SubMesh {
            this._renderingMesh.render(this, enableAlphaMode);
            return this;
        }

        /**
         * @hidden
         */
        public _getLinesIndexBuffer(indices: IndicesArray, engine: Engine): WebGLBuffer {
            if (!this._linesIndexBuffer) {
                var linesIndices = [];

                for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    linesIndices.push(indices[index], indices[index + 1],
                        indices[index + 1], indices[index + 2],
                        indices[index + 2], indices[index]);
                }

                this._linesIndexBuffer = engine.createIndexBuffer(linesIndices);
                this._linesIndexCount = linesIndices.length;
            }
            return this._linesIndexBuffer;
        }

        /**
         * Checks if the submesh intersects with a ray
         * @param ray defines the ray to test
         * @returns true is the passed ray intersects the submesh bounding box
         */
        public canIntersects(ray: Ray): boolean {
            let boundingInfo = this.getBoundingInfo();

            if (!boundingInfo) {
                return false;
            }
            return ray.intersectsBox(boundingInfo.boundingBox);
        }

        /**
         * Intersects current submesh with a ray
         * @param ray defines the ray to test
         * @param positions defines mesh's positions array
         * @param indices defines mesh's indices array
         * @param fastCheck defines if only bounding info should be used
         * @returns intersection info or null if no intersection
         */
        public intersects(ray: Ray, positions: Vector3[], indices: IndicesArray, fastCheck?: boolean): Nullable<IntersectionInfo> {
            const material = this.getMaterial();
            if (!material) {
                return null;
            }

            switch (material.fillMode) {
                case Material.PointListDrawMode:
                case Material.LineListDrawMode:
                case Material.LineLoopDrawMode:
                case Material.LineStripDrawMode:
                case Material.TriangleFanDrawMode:
                case Material.TriangleStripDrawMode:
                    return null;
            }

            // LineMesh first as it's also a Mesh...
            if (LinesMesh) {
                const mesh = this._mesh instanceof InstancedMesh ? (<InstancedMesh>this._mesh).sourceMesh : this._mesh;
                if (mesh instanceof LinesMesh) {
                    const linesMesh = <LinesMesh>mesh;
                    return this._intersectLines(ray, positions, indices, linesMesh.intersectionThreshold, fastCheck);
                }
            }

            return this._intersectTriangles(ray, positions, indices, fastCheck);
        }

        /** @hidden */
        private _intersectLines(ray: Ray, positions: Vector3[], indices: IndicesArray, intersectionThreshold: number, fastCheck?: boolean): Nullable<IntersectionInfo> {
            var intersectInfo: Nullable<IntersectionInfo> = null;

            // Line test
            for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 2) {
                var p0 = positions[indices[index]];
                var p1 = positions[indices[index + 1]];

                var length = ray.intersectionSegment(p0, p1, intersectionThreshold);
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
            return intersectInfo;
        }

        /** @hidden */
        private _intersectTriangles(ray: Ray, positions: Vector3[], indices: IndicesArray, fastCheck?: boolean): Nullable<IntersectionInfo> {
            var intersectInfo: Nullable<IntersectionInfo> = null;
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
            return intersectInfo;
        }

        /** @hidden */
        public _rebuild(): void {
            if (this._linesIndexBuffer) {
                this._linesIndexBuffer = null;
            }
        }

        // Clone
        /**
         * Creates a new submesh from the passed mesh
         * @param newMesh defines the new hosting mesh
         * @param newRenderingMesh defines an optional rendering mesh
         * @returns the new submesh
         */
        public clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh {
            var result = new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh, false);

            if (!this.IsGlobal) {
                let boundingInfo = this.getBoundingInfo();

                if (!boundingInfo) {
                    return result;
                }

                result._boundingInfo = new BoundingInfo(boundingInfo.minimum, boundingInfo.maximum, undefined, boundingInfo.extraWorldExtent);
            }

            return result;
        }

        // Dispose

        /**
         * Release associated resources
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
         * Creates a new submesh from indices data
         * @param materialIndex the index of the main mesh material
         * @param startIndex the index where to start the copy in the mesh indices array
         * @param indexCount the number of indices to copy then from the startIndex
         * @param mesh the main mesh to create the submesh from
         * @param renderingMesh the optional rendering mesh
         * @returns a new submesh
         */
        public static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh {
            var minVertexIndex = Number.MAX_VALUE;
            var maxVertexIndex = -Number.MAX_VALUE;

            renderingMesh = (<Mesh>(renderingMesh || <Mesh>mesh));
            var indices = <IndicesArray>renderingMesh.getIndices();

            for (var index = startIndex; index < startIndex + indexCount; index++) {
                var vertexIndex = indices[index];

                if (vertexIndex < minVertexIndex) {
                    minVertexIndex = vertexIndex;
                }
                if (vertexIndex > maxVertexIndex) {
                    maxVertexIndex = vertexIndex;
                }
            }

            return new SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex + 1, startIndex, indexCount, mesh, renderingMesh);
        }
    }
}
