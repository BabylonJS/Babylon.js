var BABYLON = BABYLON || {};

(function () {
    BABYLON.SubMesh = function (materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh) {
        this._mesh = mesh;
        mesh.subMeshes.push(this);
        this.materialIndex = materialIndex;
        this.verticesStart = verticesStart;
        this.verticesCount = verticesCount;
        this.indexStart = indexStart;
        this.indexCount = indexCount;
        
        var extend = BABYLON.Tools.ExtractMinAndMax(this._mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind), verticesStart, verticesCount);
        this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
    };
    
    //Properties
    BABYLON.SubMesh.prototype.getBoundingInfo = function() {
        return this._boundingInfo;
    };
    
    BABYLON.SubMesh.prototype.getMesh = function () {
        return this._mesh;
    };

    BABYLON.SubMesh.prototype.getMaterial = function () {
        var rootMaterial = this._mesh.material;
        
        if (rootMaterial && rootMaterial.getSubMaterial) {
            return rootMaterial.getSubMaterial(this.materialIndex);
        }
        
        if (!rootMaterial) {
            return this._mesh._scene.defaultMaterial;
        }

        return rootMaterial;
    };

    // Methods
    BABYLON.SubMesh.prototype._checkCollision = function (collider) {
        return this._boundingInfo._checkCollision(collider);
    };
    
    BABYLON.SubMesh.prototype.updateBoundingInfo = function(world, scale) {
        this._boundingInfo._update(world, scale);
    };
    
    BABYLON.SubMesh.prototype.isInFrustrum = function (frustumPlanes) {
        return this._boundingInfo.isInFrustrum(frustumPlanes);
    };
    
    BABYLON.SubMesh.prototype.render = function() {
        this._mesh.render(this);
    };

    BABYLON.SubMesh.prototype.getLinesIndexBuffer = function(indices, engine) {
        if (!this._linesIndexBuffer) {
            var linesIndices = [];

            for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
                linesIndices.push(  indices[index], indices[index + 1],
                                    indices[index + 1], indices[index + 2],
                                    indices[index + 2], indices[index]);
            }

            this._linesIndexBuffer = engine.createIndexBuffer(linesIndices);
            this.linesIndexCount = linesIndices.length;
        }
        return this._linesIndexBuffer;
    };

    BABYLON.SubMesh.prototype.canIntersects = function(ray) {
        return ray.intersectsBox(this._boundingInfo.boundingBox);
    };

    BABYLON.SubMesh.prototype.intersects = function (ray, positions, indices) {
        var distance = Number.MAX_VALUE;
        
        // Triangles test
        for (var index = this.indexStart; index < this.indexStart + this.indexCount; index += 3) {
            var p0 = positions[indices[index]];
            var p1 = positions[indices[index + 1]];
            var p2 = positions[indices[index + 2]];

            var result = ray.intersectsTriangle(p0, p1, p2);

            if (result.hit) {
                if (result.distance < distance && result.distance >= 0) {
                    distance = result.distance;
                }
            }
        }
        
        if (distance >= 0)
            return { hit: true, distance: distance };

        return { hit: false, distance: 0 };
    };

    // Clone    
    BABYLON.SubMesh.prototype.clone = function(newMesh) {
        return new BABYLON.SubMesh(this.materialIndex, this.verticesStart, this.verticesCount, this.indexStart, this.indexCount, newMesh);
    };
    
    // Statics
    BABYLON.SubMesh.CreateFromIndices = function(materialIndex, startIndex, indexCount, mesh) {
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
    };
})();