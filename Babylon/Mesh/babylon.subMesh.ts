module BABYLON {
    export class SubMesh {
        public linesIndexCount: number;

        private _mesh: Mesh;
        private _boundingInfo: BoundingInfo;
        private _linesIndexBuffer: WebGLBuffer;
        public _lastColliderWorldVertices: Vector3[];
        public _trianglePlanes: Plane[];
        public _lastColliderTransformMatrix: Matrix;

        constructor(public materialIndex: number, public verticesStart: number, public verticesCount: number, public indexStart, public indexCount: number, mesh: Mesh) {
            this._mesh = mesh;
            mesh.subMeshes.push(this);

            this.refreshBoundingInfo();
        }

        public getBoundingInfo(): BoundingInfo {
            return this._boundingInfo;
        }

        public getMesh(): Mesh {
            return this._mesh;
        }

        public getMaterial(): Material {
            var rootMaterial = this._mesh.material;

            if (rootMaterial && rootMaterial.getSubMaterial) {
                return rootMaterial.getSubMaterial(this.materialIndex);
            }

            if (!rootMaterial) {
                return this._mesh.getScene().defaultMaterial;
            }

            return rootMaterial;
        }

        // Methods
        public refreshBoundingInfo(): void {
            var data = this._mesh.getVerticesData(VertexBuffer.PositionKind);

            if (!data) {
                this._boundingInfo = this._mesh._boundingInfo;
                return;
            }

            var extend = BABYLON.Tools.ExtractMinAndMax(data, this.verticesStart, this.verticesCount);
            this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
        }

        public _checkCollision(collider: Collider): boolean {
            return this._boundingInfo._checkCollision(collider);
        }

        public updateBoundingInfo(world: Matrix): void {
            if (!this._boundingInfo) {
                this.refreshBoundingInfo();
            }
            this._boundingInfo._update(world);
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo.isInFrustum(frustumPlanes);
        }

        public render(): void {
            this._mesh.render(this);
        }

        public getLinesIndexBuffer(indices: number[], engine): WebGLBuffer {
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
            return ray.intersectsBox(this._boundingInfo.boundingBox);
        }

        public intersects(ray: Ray, positions: Vector3[], indices: number[], fastCheck?: boolean): IntersectionInfo {
            var intersectInfo: IntersectionInfo = null;

            // Triangles test
            for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                var p0 = positions[indices[index]];
                var p1 = positions[indices[index + 1]];
                var p2 = positions[indices[index + 2]];

                var currentIntersectInfo = ray.intersectsTriangle(p0, p1, p2);

                if (currentIntersectInfo) {
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

        // Clone    
        public clone(newMesh: Mesh): SubMesh {
            return new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh);
        }

        // Statics
        public static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: Mesh): SubMesh {
            var minVertexIndex = Number.MAX_VALUE;
            var maxVertexIndex = -Number.MAX_VALUE;

            var indices = mesh.getIndices();

            for (var index = startIndex; index < startIndex + indexCount; index++) {
                var vertexIndex = indices[index];

                if (vertexIndex < minVertexIndex)
                    minVertexIndex = vertexIndex;
                else if (vertexIndex > maxVertexIndex)
                    maxVertexIndex = vertexIndex;
            }

            return new BABYLON.SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex, startIndex, indexCount, mesh);
        }
    }
}