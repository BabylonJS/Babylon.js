var BABYLON;
(function (BABYLON) {
    var SubMesh = (function () {
        function SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh, renderingMesh, createBoundingBox) {
            if (createBoundingBox === void 0) { createBoundingBox = true; }
            this.materialIndex = materialIndex;
            this.verticesStart = verticesStart;
            this.verticesCount = verticesCount;
            this.indexStart = indexStart;
            this.indexCount = indexCount;
            this._renderId = 0;
            this._mesh = mesh;
            this._renderingMesh = renderingMesh || mesh;
            mesh.subMeshes.push(this);
            this._trianglePlanes = [];
            this._id = mesh.subMeshes.length - 1;
            if (createBoundingBox) {
                this.refreshBoundingInfo();
                mesh.computeWorldMatrix(true);
            }
        }
        Object.defineProperty(SubMesh.prototype, "IsGlobal", {
            get: function () {
                return (this.verticesStart === 0 && this.verticesCount == this._mesh.getTotalVertices());
            },
            enumerable: true,
            configurable: true
        });
        SubMesh.prototype.getBoundingInfo = function () {
            if (this.IsGlobal) {
                return this._mesh.getBoundingInfo();
            }
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
            if (this.IsGlobal) {
                return;
            }
            var data = this._renderingMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (!data) {
                this._boundingInfo = this._mesh._boundingInfo;
                return;
            }
            var indices = this._renderingMesh.getIndices();
            var extend;
            //is this the only submesh?
            if (this.indexStart === 0 && this.indexCount === indices.length) {
                //the rendering mesh's bounding info can be used, it is the standard submesh for all indices.
                extend = { minimum: this._renderingMesh.getBoundingInfo().minimum.clone(), maximum: this._renderingMesh.getBoundingInfo().maximum.clone() };
            }
            else {
                extend = BABYLON.Tools.ExtractMinAndMaxIndexed(data, indices, this.indexStart, this.indexCount);
            }
            this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
        };
        SubMesh.prototype._checkCollision = function (collider) {
            return this.getBoundingInfo()._checkCollision(collider);
        };
        SubMesh.prototype.updateBoundingInfo = function (world) {
            if (!this.getBoundingInfo()) {
                this.refreshBoundingInfo();
            }
            this.getBoundingInfo().update(world);
        };
        SubMesh.prototype.isInFrustum = function (frustumPlanes) {
            return this.getBoundingInfo().isInFrustum(frustumPlanes);
        };
        SubMesh.prototype.render = function (enableAlphaMode) {
            this._renderingMesh.render(this, enableAlphaMode);
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
            return ray.intersectsBox(this.getBoundingInfo().boundingBox);
        };
        SubMesh.prototype.intersects = function (ray, positions, indices, fastCheck) {
            var intersectInfo = null;
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
        };
        // Clone    
        SubMesh.prototype.clone = function (newMesh, newRenderingMesh) {
            var result = new SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh, newRenderingMesh, false);
            if (!this.IsGlobal) {
                result._boundingInfo = new BABYLON.BoundingInfo(this.getBoundingInfo().minimum, this.getBoundingInfo().maximum);
            }
            return result;
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
                if (vertexIndex > maxVertexIndex)
                    maxVertexIndex = vertexIndex;
            }
            return new SubMesh(materialIndex, minVertexIndex, maxVertexIndex - minVertexIndex + 1, startIndex, indexCount, mesh, renderingMesh);
        };
        return SubMesh;
    })();
    BABYLON.SubMesh = SubMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.subMesh.js.map