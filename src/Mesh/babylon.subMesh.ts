module BABYLON {
    export class SubMesh {
        public linesIndexCount: number;

        private _mesh: AbstractMesh;
        private _renderingMesh: Mesh;
        private _boundingInfo: BoundingInfo;
        private _linesIndexBuffer: WebGLBuffer;
        public _lastColliderWorldVertices: Vector3[];
        public _trianglePlanes: Plane[];
        public _lastColliderTransformMatrix: Matrix;

        public _renderId = 0;
        public _alphaIndex: number;
        public _distanceToCamera: number;
        public _id: number;

        constructor(public materialIndex: number, public verticesStart: number, public verticesCount: number, public indexStart, public indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox: boolean = true) {
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

        public getBoundingInfo(): BoundingInfo {
            if (this.IsGlobal) {
                return this._mesh.getBoundingInfo();
            }

            return this._boundingInfo;
        }

        public getMesh(): AbstractMesh {
            return this._mesh;
        }

        public getRenderingMesh(): Mesh {
            return this._renderingMesh;
        }

        public getMaterial(): Material {
            var rootMaterial = this._renderingMesh.material;

            if (rootMaterial && rootMaterial instanceof MultiMaterial) {
                var multiMaterial = <MultiMaterial>rootMaterial;
                return multiMaterial.getSubMaterial(this.materialIndex);
            }

            if (!rootMaterial) {
                return this._mesh.getScene().defaultMaterial;
            }

            return rootMaterial;
        }

        // Methods
        public refreshBoundingInfo(): void {
            this._lastColliderWorldVertices = null;

            if (this.IsGlobal) {
                return;
            }
            var data = this._renderingMesh.getVerticesData(VertexBuffer.PositionKind);

            if (!data) {
                this._boundingInfo = this._mesh._boundingInfo;
                return;
            }

            var indices = this._renderingMesh.getIndices();
            var extend: { minimum: Vector3, maximum: Vector3 };

            //is this the only submesh?
            if (this.indexStart === 0 && this.indexCount === indices.length) {
                //the rendering mesh's bounding info can be used, it is the standard submesh for all indices.
                extend = { minimum: this._renderingMesh.getBoundingInfo().minimum.clone(), maximum: this._renderingMesh.getBoundingInfo().maximum.clone() };
            } else {
                extend = Tools.ExtractMinAndMaxIndexed(data, indices, this.indexStart, this.indexCount, this._renderingMesh.geometry.boundingBias);
            }
            this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
        }

        public _checkCollision(collider: Collider): boolean {
            return this.getBoundingInfo()._checkCollision(collider);
        }

        public updateBoundingInfo(world: Matrix): void {
            if (!this.getBoundingInfo()) {
                this.refreshBoundingInfo();
            }
            this.getBoundingInfo().update(world);
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return this.getBoundingInfo().isInFrustum(frustumPlanes);
        }

        public render(enableAlphaMode: boolean): void {
            this._renderingMesh.render(this, enableAlphaMode);
        }

        public getLinesIndexBuffer(indices: number[] | Int32Array, engine: Engine): WebGLBuffer {
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

        public canIntersects(ray: Ray): boolean {
            return ray.intersectsBox(this.getBoundingInfo().boundingBox);
        }

        public intersects(ray: Ray, positions: Vector3[], indices: number[] | Int32Array, fastCheck?: boolean): IntersectionInfo {
            var intersectInfo: IntersectionInfo = null;

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

        // Clone    
        public clone(newMesh: AbstractMesh, newRenderingMesh?: Mesh): SubMesh {
            var result = new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh, false);

            if (!this.IsGlobal) {
                result._boundingInfo = new BoundingInfo(this.getBoundingInfo().minimum, this.getBoundingInfo().maximum);
            }

            return result;
        }

        // Dispose
        public dispose() {
            if (this._linesIndexBuffer) {
                this._mesh.getScene().getEngine()._releaseBuffer(this._linesIndexBuffer);
                this._linesIndexBuffer = null;
            }

            // Remove from mesh
            var index = this._mesh.subMeshes.indexOf(this);
            this._mesh.subMeshes.splice(index, 1);
        }

        // Statics
        public static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh): SubMesh {
            var minVertexIndex = Number.MAX_VALUE;
            var maxVertexIndex = -Number.MAX_VALUE;

            renderingMesh = renderingMesh || <Mesh>mesh;
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

