var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var _InstancesBatch = (function () {
        function _InstancesBatch() {
            this.mustReturn = false;
            this.visibleInstances = new Array();
            this.renderSelf = new Array();
        }
        return _InstancesBatch;
    })();
    BABYLON._InstancesBatch = _InstancesBatch;

    var Mesh = (function (_super) {
        __extends(Mesh, _super);
        function Mesh(name, scene) {
            _super.call(this, name, scene);
            // Members
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.instances = new Array();
            this._onBeforeRenderCallbacks = new Array();
            this._onAfterRenderCallbacks = new Array();
            this._visibleInstances = {};
            this._renderIdForInstances = new Array();
            this._batchCache = new _InstancesBatch();
            this._instancesBufferSize = 32 * 16 * 4;
        }
        Mesh.prototype.getTotalVertices = function () {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        };

        Mesh.prototype.getVerticesData = function (kind) {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind);
        };

        Mesh.prototype.getVertexBuffer = function (kind) {
            if (!this._geometry) {
                return undefined;
            }
            return this._geometry.getVertexBuffer(kind);
        };

        Mesh.prototype.isVerticesDataPresent = function (kind) {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        };

        Mesh.prototype.getVerticesDataKinds = function () {
            if (!this._geometry) {
                var result = [];
                if (this._delayInfo) {
                    for (var kind in this._delayInfo) {
                        result.push(kind);
                    }
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        };

        Mesh.prototype.getTotalIndices = function () {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        };

        Mesh.prototype.getIndices = function () {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices();
        };

        Mesh.prototype.isReady = function () {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            return _super.prototype.isReady.call(this);
        };

        Mesh.prototype.isDisposed = function () {
            return this._isDisposed;
        };

        // Methods
        Mesh.prototype._preActivate = function () {
            var sceneRenderId = this.getScene().getRenderId();
            if (this._preActivateId == sceneRenderId) {
                return;
            }

            this._preActivateId = sceneRenderId;
            this._visibleInstances = null;
        };

        Mesh.prototype._registerInstanceForRenderId = function (instance, renderId) {
            if (!this._visibleInstances) {
                this._visibleInstances = {};
                this._visibleInstances.defaultRenderId = renderId;
                this._visibleInstances.selfDefaultRenderId = this._renderId;
            }

            if (!this._visibleInstances[renderId]) {
                this._visibleInstances[renderId] = new Array();
            }

            this._visibleInstances[renderId].push(instance);
        };

        Mesh.prototype.refreshBoundingInfo = function () {
            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (data) {
                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this.getTotalVertices());
                this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
            }

            if (this.subMeshes) {
                for (var index = 0; index < this.subMeshes.length; index++) {
                    this.subMeshes[index].refreshBoundingInfo();
                }
            }

            this._updateBoundingInfo();
        };

        Mesh.prototype._createGlobalSubMesh = function () {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            this.releaseSubMeshes();
            return new BABYLON.SubMesh(0, 0, totalVertices, 0, this.getTotalIndices(), this);
        };

        Mesh.prototype.subdivide = function (count) {
            if (count < 1) {
                return;
            }

            var totalIndices = this.getTotalIndices();
            var subdivisionSize = (totalIndices / count) | 0;
            var offset = 0;

            while (subdivisionSize % 3 != 0) {
                subdivisionSize++;
            }

            this.releaseSubMeshes();
            for (var index = 0; index < count; index++) {
                if (offset >= totalIndices) {
                    break;
                }

                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }

            this.synchronizeInstances();
        };

        Mesh.prototype.setVerticesData = function (kind, data, updatable) {
            if (kind instanceof Array) {
                var temp = data;
                data = kind;
                kind = temp;

                BABYLON.Tools.Warn("Deprecated usage of setVerticesData detected (since v1.12). Current signature is setVerticesData(kind, data, updatable).");
            }

            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene, vertexData, updatable, this);
            } else {
                this._geometry.setVerticesData(kind, data, updatable);
            }
        };

        Mesh.prototype.updateVerticesData = function (kind, data, updateExtends, makeItUnique) {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            } else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        };

        Mesh.prototype.makeGeometryUnique = function () {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(BABYLON.Geometry.RandomId());
            geometry.applyToMesh(this);
        };

        Mesh.prototype.setIndices = function (indices) {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene, vertexData, false, this);
            } else {
                this._geometry.setIndices(indices);
            }
        };

        Mesh.prototype._bind = function (subMesh, effect, wireframe) {
            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind = this._geometry.getIndexBuffer();

            if (wireframe) {
                indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
            }

            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);
        };

        Mesh.prototype._draw = function (subMesh, useTriangles, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount, instancesCount);
        };

        Mesh.prototype._fullDraw = function (subMesh, useTriangles, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount, instancesCount);
        };

        Mesh.prototype.registerBeforeRender = function (func) {
            this._onBeforeRenderCallbacks.push(func);
        };

        Mesh.prototype.unregisterBeforeRender = function (func) {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        };

        Mesh.prototype.registerAfterRender = function (func) {
            this._onAfterRenderCallbacks.push(func);
        };

        Mesh.prototype.unregisterAfterRender = function (func) {
            var index = this._onAfterRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onAfterRenderCallbacks.splice(index, 1);
            }
        };

        Mesh.prototype._getInstancesRenderList = function (subMeshId) {
            var scene = this.getScene();
            this._batchCache.mustReturn = false;
            this._batchCache.renderSelf[subMeshId] = this.isEnabled() && this.isVisible;
            this._batchCache.visibleInstances[subMeshId] = null;

            if (this._visibleInstances) {
                var currentRenderId = scene.getRenderId();
                this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[currentRenderId];
                var selfRenderId = this._renderId;

                if (!this._batchCache.visibleInstances[subMeshId] && this._visibleInstances.defaultRenderId) {
                    this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[this._visibleInstances.defaultRenderId];
                    currentRenderId = this._visibleInstances.defaultRenderId;
                    selfRenderId = this._visibleInstances.selfDefaultRenderId;
                }

                if (this._batchCache.visibleInstances[subMeshId] && this._batchCache.visibleInstances[subMeshId].length) {
                    if (this._renderIdForInstances[subMeshId] === currentRenderId) {
                        this._batchCache.mustReturn = true;
                        return this._batchCache;
                    }

                    if (currentRenderId !== selfRenderId) {
                        this._batchCache.renderSelf[subMeshId] = false;
                    }
                }
                this._renderIdForInstances[subMeshId] = currentRenderId;
            }

            return this._batchCache;
        };

        Mesh.prototype._renderWithInstances = function (subMesh, wireFrame, batch, effect, engine) {
            var matricesCount = this.instances.length + 1;
            var bufferSize = matricesCount * 16 * 4;

            while (this._instancesBufferSize < bufferSize) {
                this._instancesBufferSize *= 2;
            }

            if (!this._worldMatricesInstancesBuffer || this._worldMatricesInstancesBuffer.capacity < this._instancesBufferSize) {
                if (this._worldMatricesInstancesBuffer) {
                    engine.deleteInstancesBuffer(this._worldMatricesInstancesBuffer);
                }

                this._worldMatricesInstancesBuffer = engine.createInstancesBuffer(this._instancesBufferSize);
                this._worldMatricesInstancesArray = new Float32Array(this._instancesBufferSize / 4);
            }

            var offset = 0;
            var instancesCount = 0;

            var world = this.getWorldMatrix();
            if (batch.renderSelf[subMesh._id]) {
                world.copyToArray(this._worldMatricesInstancesArray, offset);
                offset += 16;
                instancesCount++;
            }

            var visibleInstances = batch.visibleInstances[subMesh._id];

            if (visibleInstances) {
                for (var instanceIndex = 0; instanceIndex < visibleInstances.length; instanceIndex++) {
                    var instance = visibleInstances[instanceIndex];
                    instance.getWorldMatrix().copyToArray(this._worldMatricesInstancesArray, offset);
                    offset += 16;
                    instancesCount++;
                }
            }

            var offsetLocation0 = effect.getAttributeLocationByName("world0");
            var offsetLocation1 = effect.getAttributeLocationByName("world1");
            var offsetLocation2 = effect.getAttributeLocationByName("world2");
            var offsetLocation3 = effect.getAttributeLocationByName("world3");

            var offsetLocations = [offsetLocation0, offsetLocation1, offsetLocation2, offsetLocation3];

            engine.updateAndBindInstancesBuffer(this._worldMatricesInstancesBuffer, this._worldMatricesInstancesArray, offsetLocations);

            this._draw(subMesh, !wireFrame, instancesCount);

            engine.unBindInstancesBuffer(this._worldMatricesInstancesBuffer, offsetLocations);
        };

        Mesh.prototype.render = function (subMesh) {
            var scene = this.getScene();

            // Managing instances
            var batch = this._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            // Checking geometry state
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            var engine = scene.getEngine();
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this, hardwareInstancedRendering)) {
                return;
            }

            // Outline - step 1
            var savedDepthWrite = engine.getDepthWrite();
            if (this.renderOutline) {
                engine.setDepthWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
            }

            effectiveMaterial._preBind();
            var effect = effectiveMaterial.getEffect();

            // Bind
            var wireFrame = engine.forceWireframe || effectiveMaterial.wireframe;
            this._bind(subMesh, effect, wireFrame);

            var world = this.getWorldMatrix();
            effectiveMaterial.bind(world, this);

            // Instances rendering
            if (hardwareInstancedRendering) {
                this._renderWithInstances(subMesh, wireFrame, batch, effect, engine);
            } else {
                if (batch.renderSelf[subMesh._id]) {
                    // Draw
                    this._draw(subMesh, !wireFrame);
                }

                if (batch.visibleInstances[subMesh._id]) {
                    for (var instanceIndex = 0; instanceIndex < batch.visibleInstances[subMesh._id].length; instanceIndex++) {
                        var instance = batch.visibleInstances[subMesh._id][instanceIndex];

                        // World
                        world = instance.getWorldMatrix();
                        effectiveMaterial.bindOnlyWorldMatrix(world);

                        // Draw
                        this._draw(subMesh, !wireFrame);
                    }
                }
            }

            // Unbind
            effectiveMaterial.unbind();

            // Outline - step 2
            if (this.renderOutline && savedDepthWrite) {
                engine.setDepthWrite(true);
                engine.setColorWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
                engine.setColorWrite(true);
            }

            for (callbackIndex = 0; callbackIndex < this._onAfterRenderCallbacks.length; callbackIndex++) {
                this._onAfterRenderCallbacks[callbackIndex]();
            }
        };

        Mesh.prototype.getEmittedParticleSystems = function () {
            var results = new Array();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }

            return results;
        };

        Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
            var results = new Array();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (descendants.indexOf(particleSystem.emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        };

        Mesh.prototype.getChildren = function () {
            var results = [];
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];
                if (mesh.parent == this) {
                    results.push(mesh);
                }
            }

            return results;
        };

        Mesh.prototype._checkDelayState = function () {
            var _this = this;
            var that = this;
            var scene = this.getScene();

            if (this._geometry) {
                this._geometry.load(scene);
            } else if (that.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;

                scene._addPendingData(that);

                BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                    _this._delayLoadingFunction(JSON.parse(data), _this);
                    _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(_this);
                }, function () {
                }, scene.database);
            }
        };

        Mesh.prototype.isInFrustum = function (frustumPlanes) {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (!_super.prototype.isInFrustum.call(this, frustumPlanes)) {
                return false;
            }

            this._checkDelayState();

            return true;
        };

        Mesh.prototype.setMaterialByID = function (id) {
            var materials = this.getScene().materials;
            for (var index = 0; index < materials.length; index++) {
                if (materials[index].id == id) {
                    this.material = materials[index];
                    return;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id == id) {
                    this.material = multiMaterials[index];
                    return;
                }
            }
        };

        Mesh.prototype.getAnimatables = function () {
            var results = [];

            if (this.material) {
                results.push(this.material);
            }

            return results;
        };

        // Geometry
        Mesh.prototype.bakeTransformIntoVertices = function (transform) {
            // Position
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                return;
            }

            this._resetPointsArrayCache();

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var temp = [];
            for (var index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(BABYLON.VertexBuffer.PositionKind, temp, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(BABYLON.VertexBuffer.NormalKind, temp, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
        };

        // Cache
        Mesh.prototype._resetPointsArrayCache = function () {
            this._positions = null;
        };

        Mesh.prototype._generatePointsArray = function () {
            if (this._positions)
                return true;

            this._positions = [];

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (!data) {
                return false;
            }

            for (var index = 0; index < data.length; index += 3) {
                this._positions.push(BABYLON.Vector3.FromArray(data, index));
            }

            return true;
        };

        // Clone
        Mesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
            var result = new BABYLON.Mesh(name, this.getScene());

            // Geometry
            this._geometry.applyToMesh(result);

            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], []);

            // Material
            result.material = this.material;

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent == this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            for (index = 0; index < this.getScene().particleSystems.length; index++) {
                var system = this.getScene().particleSystems[index];

                if (system.emitter == this) {
                    system.clone(system.name, result);
                }
            }

            result.computeWorldMatrix(true);

            return result;
        };

        // Dispose
        Mesh.prototype.dispose = function (doNotRecurse) {
            if (this._geometry) {
                this._geometry.releaseForMesh(this, true);
            }

            // Instances
            if (this._worldMatricesInstancesBuffer) {
                this.getEngine().deleteInstancesBuffer(this._worldMatricesInstancesBuffer);
                this._worldMatricesInstancesBuffer = null;
            }

            while (this.instances.length) {
                this.instances[0].dispose();
            }

            _super.prototype.dispose.call(this, doNotRecurse);
        };

        // Geometric tools
        Mesh.prototype.applyDisplacementMap = function (url, minHeight, maxHeight) {
            var _this = this;
            var scene = this.getScene();

            var onload = function (img) {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;

                _this.applyDisplacementMapFromBuffer(buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight);
            };

            BABYLON.Tools.LoadImage(url, onload, function () {
            }, scene.database);
        };

        Mesh.prototype.applyDisplacementMapFromBuffer = function (buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight) {
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind) || !this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind) || !this.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                BABYLON.Tools.Warn("Cannot call applyDisplacementMap: Given mesh is not complete. Position, Normal or UV are missing");
                return;
            }

            var positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var normals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var uvs = this.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var position = BABYLON.Vector3.Zero();
            var normal = BABYLON.Vector3.Zero();
            var uv = BABYLON.Vector2.Zero();

            for (var index = 0; index < positions.length; index += 3) {
                BABYLON.Vector3.FromArrayToRef(positions, index, position);
                BABYLON.Vector3.FromArrayToRef(normals, index, normal);
                BABYLON.Vector2.FromArrayToRef(uvs, (index / 3) * 2, uv);

                // Compute height
                var u = ((Math.abs(uv.x) * heightMapWidth) % heightMapWidth) | 0;
                var v = ((Math.abs(uv.y) * heightMapHeight) % heightMapHeight) | 0;

                var pos = (u + v * heightMapWidth) * 4;
                var r = buffer[pos] / 255.0;
                var g = buffer[pos + 1] / 255.0;
                var b = buffer[pos + 2] / 255.0;

                var gradient = r * 0.3 + g * 0.59 + b * 0.11;

                normal.normalize();
                normal.scaleInPlace(minHeight + (maxHeight - minHeight) * gradient);
                position = position.add(normal);

                position.toArray(positions, index);
            }

            BABYLON.VertexData.ComputeNormals(positions, this.getIndices(), normals);

            this.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            this.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
        };

        Mesh.prototype.convertToFlatShadedMesh = function () {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>
            var kinds = this.getVerticesDataKinds();
            var vbs = [];
            var data = [];
            var newdata = [];
            var updatableNormals = false;
            for (var kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                var kind = kinds[kindIndex];
                var vertexBuffer = this.getVertexBuffer(kind);

                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();
            var totalIndices = this.getTotalIndices();

            for (index = 0; index < totalIndices; index++) {
                var vertexIndex = indices[index];

                for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                    kind = kinds[kindIndex];
                    var stride = vbs[kind].getStrideSize();

                    for (var offset = 0; offset < stride; offset++) {
                        newdata[kind].push(data[kind][vertexIndex * stride + offset]);
                    }
                }
            }

            // Updating faces & normal
            var normals = [];
            var positions = newdata[BABYLON.VertexBuffer.PositionKind];
            for (var index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;

                var p1 = BABYLON.Vector3.FromArray(positions, index * 3);
                var p2 = BABYLON.Vector3.FromArray(positions, (index + 1) * 3);
                var p3 = BABYLON.Vector3.FromArray(positions, (index + 2) * 3);

                var p1p2 = p1.subtract(p2);
                var p3p2 = p3.subtract(p2);

                var normal = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));

                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }

            this.setIndices(indices);
            this.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, updatableNormals);

            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(kind, newdata[kind], vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.releaseSubMeshes();
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                var subMesh = new BABYLON.SubMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }

            this.synchronizeInstances();
        };

        // Instances
        Mesh.prototype.createInstance = function (name) {
            return new BABYLON.InstancedMesh(name, this);
        };

        Mesh.prototype.synchronizeInstances = function () {
            for (var instanceIndex = 0; instanceIndex < this.instances.length; instanceIndex++) {
                var instance = this.instances[instanceIndex];
                instance._syncSubMeshes();
            }
        };

        // Statics
        Mesh.CreateBox = function (name, size, scene, updatable) {
            var box = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(size);

            vertexData.applyToMesh(box, updatable);

            return box;
        };

        Mesh.CreateSphere = function (name, segments, diameter, scene, updatable) {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(segments, diameter);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        };

        // Cylinder and cone (Code inspired by SharpDX.org)
        Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, subdivisions, scene, updatable) {
            // subdivisions is a new parameter, we need to support old signature
            if (scene === undefined || !(scene instanceof BABYLON.Scene)) {
                if (scene !== undefined) {
                    updatable = scene;
                }
                scene = subdivisions;
                subdivisions = 1;
            }

            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation, subdivisions);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        };

        // Torus  (Code from SharpDX.org)
        Mesh.CreateTorus = function (name, diameter, thickness, tessellation, scene, updatable) {
            var torus = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(diameter, thickness, tessellation);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        };

        Mesh.CreateTorusKnot = function (name, radius, tube, radialSegments, tubularSegments, p, q, scene, updatable) {
            var torusKnot = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        };

        // Lines
        Mesh.CreateLines = function (name, points, scene, updatable) {
            var lines = new BABYLON.LinesMesh(name, scene, updatable);

            var vertexData = BABYLON.VertexData.CreateLines(points);

            vertexData.applyToMesh(lines, updatable);

            return lines;
        };

        // Plane & ground
        Mesh.CreatePlane = function (name, size, scene, updatable) {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        };

        Mesh.CreateGround = function (name, width, height, subdivisions, scene, updatable) {
            var ground = new BABYLON.GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = subdivisions;

            var vertexData = BABYLON.VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

            ground._setReady(true);

            return ground;
        };

        Mesh.CreateTiledGround = function (name, xmin, zmin, xmax, zmax, subdivisions, precision, scene, updatable) {
            var tiledGround = new BABYLON.Mesh(name, scene);

            var vertexData = BABYLON.VertexData.CreateTiledGround(xmin, zmin, xmax, zmax, subdivisions, precision);

            vertexData.applyToMesh(tiledGround, updatable);

            return tiledGround;
        };

        Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
            var ground = new BABYLON.GroundMesh(name, scene);
            ground._subdivisions = subdivisions;

            ground._setReady(false);

            var onload = function (img) {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                var vertexData = BABYLON.VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);

                vertexData.applyToMesh(ground, updatable);

                ground._setReady(true);
            };

            BABYLON.Tools.LoadImage(url, onload, function () {
            }, scene.database);

            return ground;
        };

        // Tools
        Mesh.MinMax = function (meshes) {
            var minVector = null;
            var maxVector = null;
            for (var i in meshes) {
                var mesh = meshes[i];
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                if (!minVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                    continue;
                }
                minVector.MinimizeInPlace(boundingBox.minimumWorld);
                maxVector.MaximizeInPlace(boundingBox.maximumWorld);
            }

            return {
                min: minVector,
                max: maxVector
            };
        };

        Mesh.Center = function (meshesOrMinMaxVector) {
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
            return BABYLON.Vector3.Center(minMaxVector.min, minMaxVector.max);
        };
        return Mesh;
    })(BABYLON.AbstractMesh);
    BABYLON.Mesh = Mesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mesh.js.map
