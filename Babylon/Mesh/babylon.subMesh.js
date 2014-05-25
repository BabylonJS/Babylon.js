var BABYLON;
(function (BABYLON) {
    var SubMesh = (function () {
        function SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh) {
            this.materialIndex = materialIndex;
            this.verticesStart = verticesStart;
            this.verticesCount = verticesCount;
            this.indexStart = indexStart;
            this.indexCount = indexCount;
            this._renderId = 0;
            this._mesh = mesh;
            this._renderingMesh = renderingMesh || mesh;
            mesh.subMeshes.push(this);

            this.refreshBoundingInfo();
        }
        SubMesh.prototype.getBoundingInfo = function () {
            return this._boundingInfo;
        };

        SubMesh.prototype.getMesh = function () {
            return this._mesh;
        };

        SubMesh.prototype.getRenderingMesh = function () {
            return this._renderingMesh;
        };

        SubMesh.prototype.getMaterial = function () {
            var rootMaterial = this._renderingMesh.material;

            if (rootMaterial && rootMaterial instanceof BABYLON.MultiMaterial) {
                var multiMaterial = rootMaterial;
                return multiMaterial.getSubMaterial(this.materialIndex);
            }

            if (!rootMaterial) {
                return this._mesh.getScene().defaultMaterial;
            }

            return rootMaterial;
        };

        // Methods
        SubMesh.prototype.refreshBoundingInfo = function () {
            var data = this._renderingMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (!data) {
                this._boundingInfo = this._mesh._boundingInfo;
                return;
            }

            var extend = BABYLON.Tools.ExtractMinAndMax(data, this.verticesStart, this.verticesCount);
            this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
        };

        SubMesh.prototype._checkCollision = function (collider) {
            return this._boundingInfo._checkCollision(collider);
        };

        SubMesh.prototype.updateBoundingInfo = function (world) {
            if (!this._boundingInfo) {
                this.refreshBoundingInfo();
            }
            this._boundingInfo._update(world);
        };

        SubMesh.prototype.isInFrustum = function (frustumPlanes) {
            return this._boundingInfo.isInFrustum(frustumPlanes);
        };

        SubMesh.prototype.render = function () {
            this._renderingMesh.render(this);
        };

        SubMesh.prototype.getLinesIndexBuffer = function (indices, engine) {
            if (!this._linesIndexBuffer) {
                var linesIndices = [];

                for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                    linesIndices.push(indices[index], indices[index + 1], indices[index + 1], indices[index + 2], indices[index + 2], indices[index]);
                }

                this._linesIndexBuffer = engine.createIndexBuffer(linesIndices);
                this.linesIndexCount = linesIndices.length;
            }
            return this._linesIndexBuffer;
        };

        SubMesh.prototype.canIntersects = function (ray) {
            return ray.intersectsBox(this._boundingInfo.boundingBox);
        };

        SubMesh.prototype.intersects = function (ray, positions, indices, fastCheck) {
            var intersectInfo = null;

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
        };

        // Clone
        SubMesh.prototype.clone = function (newMesh, newRenderingMesh) {
            return new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh);
        };

        // Dispose
        SubMesh.prototype.dispose = function () {
            if (this._linesIndexBuffer) {
                this._mesh.getScene().getEngine()._releaseBuffer(this._linesIndexBuffer);
                this._linesIndexBuffer = null;
            }

            // Remove from mesh
            var index = this._mesh.subMeshes.indexOf(this);
            this._mesh.subMeshes.splice(index, 1);
        };

        // Statics
        SubMesh.CreateFromIndices = function (materialIndex, startIndex, indexCount, mesh, renderingMesh) {
            var minVertexIndex = Number.MAX_VALUE;
            var maxVertexIndex = -Number.MAX_VALUE;

            renderingMesh = renderingMesh || mesh;
            var indices = renderingMesh.getIndices();

            for (var index = startIndex; index < startIndex + indexCount; index++) {
                var vertexIndex = indices[index];

                if (vertexIndex < minVertexIndex)
                    minVertexIndex = vertexIndex;
                else if (vertexIndex > maxVertexIndex)
                    maxVertexIndex = vertexIndex;
            }

            return new BABYLON.SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex, startIndex, indexCount, mesh, renderingMesh);
        };
        return SubMesh;
    })();
    BABYLON.SubMesh = SubMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.subMesh.js.map
