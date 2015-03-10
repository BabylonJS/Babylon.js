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
        /**
         * @constructor
         * @param {string} name - The value used by scene.getMeshByName() to do a lookup.
         * @param {Scene} scene - The scene to add this mesh to.
         * @param {Node} parent - The parent of this mesh, if it has one
         * @param {Mesh} source - An optional Mesh from which geometry is shared, cloned.
         * @param {boolean} doNotCloneChildren - When cloning, skip cloning child meshes of source, default False.
         *                  When false, achieved by calling a clone(), also passing False.
         *                  This will make creation of children, recursive.
         */
        function Mesh(name, scene, parent, source, doNotCloneChildren) {
            if (parent === void 0) { parent = null; }
            _super.call(this, name, scene);
            // Members
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.instances = new Array();
            this._LODLevels = new Array();
            this._onBeforeRenderCallbacks = new Array();
            this._onAfterRenderCallbacks = new Array();
            this._visibleInstances = {};
            this._renderIdForInstances = new Array();
            this._batchCache = new _InstancesBatch();
            this._instancesBufferSize = 32 * 16 * 4; // let's start with a maximum of 32 instances
            if (source) {
                // Geometry
                if (source._geometry) {
                    source._geometry.applyToMesh(this);
                }
                // Deep copy
                BABYLON.Tools.DeepCopy(source, this, ["name", "material", "skeleton"], []);
                // Material
                this.material = source.material;
                if (!doNotCloneChildren) {
                    for (var index = 0; index < scene.meshes.length; index++) {
                        var mesh = scene.meshes[index];
                        if (mesh.parent === source) {
                            // doNotCloneChildren is always going to be False
                            var newChild = mesh.clone(name + "." + mesh.name, this, doNotCloneChildren);
                        }
                    }
                }
                for (index = 0; index < scene.particleSystems.length; index++) {
                    var system = scene.particleSystems[index];
                    if (system.emitter === source) {
                        system.clone(system.name, this);
                    }
                }
                this.computeWorldMatrix(true);
            }
            // Parent
            if (parent !== null) {
                this.parent = parent;
            }
        }
        Object.defineProperty(Mesh, "FRONTSIDE", {
            get: function () {
                return Mesh._FRONTSIDE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "BACKSIDE", {
            get: function () {
                return Mesh._BACKSIDE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "DOUBLESIDE", {
            get: function () {
                return Mesh._DOUBLESIDE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "DEFAULTSIDE", {
            get: function () {
                return Mesh._DEFAULTSIDE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh.prototype, "hasLODLevels", {
            // Methods
            get: function () {
                return this._LODLevels.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        Mesh.prototype._sortLODLevels = function () {
            this._LODLevels.sort(function (a, b) {
                if (a.distance < b.distance) {
                    return 1;
                }
                if (a.distance > b.distance) {
                    return -1;
                }
                return 0;
            });
        };
        /**
         * Add a mesh as LOD level triggered at the given distance.
         * @param {number} distance - the distance from the center of the object to show this level
         * @param {BABYLON.Mesh} mesh - the mesh to be added as LOD level
         * @return {BABYLON.Mesh} this mesh (for chaining)
         */
        Mesh.prototype.addLODLevel = function (distance, mesh) {
            if (mesh && mesh._masterMesh) {
                BABYLON.Tools.Warn("You cannot use a mesh as LOD level twice");
                return this;
            }
            var level = new BABYLON.Internals.MeshLODLevel(distance, mesh);
            this._LODLevels.push(level);
            if (mesh) {
                mesh._masterMesh = this;
            }
            this._sortLODLevels();
            return this;
        };
        Mesh.prototype.getLODLevelAtDistance = function (distance) {
            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];
                if (level.distance === distance) {
                    return level.mesh;
                }
            }
            return null;
        };
        /**
         * Remove a mesh from the LOD array
         * @param {BABYLON.Mesh} mesh - the mesh to be removed.
         * @return {BABYLON.Mesh} this mesh (for chaining)
         */
        Mesh.prototype.removeLODLevel = function (mesh) {
            for (var index = 0; index < this._LODLevels.length; index++) {
                if (this._LODLevels[index].mesh === mesh) {
                    this._LODLevels.splice(index, 1);
                    if (mesh) {
                        mesh._masterMesh = null;
                    }
                }
            }
            this._sortLODLevels();
            return this;
        };
        Mesh.prototype.getLOD = function (camera, boundingSphere) {
            if (!this._LODLevels || this._LODLevels.length === 0) {
                return this;
            }
            var distanceToCamera = (boundingSphere ? boundingSphere : this.getBoundingInfo().boundingSphere).centerWorld.subtract(camera.position).length();
            if (this._LODLevels[this._LODLevels.length - 1].distance > distanceToCamera) {
                return this;
            }
            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];
                if (level.distance < distanceToCamera) {
                    if (level.mesh) {
                        level.mesh._preActivate();
                        level.mesh._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
                    }
                    return level.mesh;
                }
            }
            return this;
        };
        Object.defineProperty(Mesh.prototype, "geometry", {
            get: function () {
                return this._geometry;
            },
            enumerable: true,
            configurable: true
        });
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
        Object.defineProperty(Mesh.prototype, "isBlocked", {
            get: function () {
                return this._masterMesh !== null && this._masterMesh !== undefined;
            },
            enumerable: true,
            configurable: true
        });
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
            if (this._preActivateId === sceneRenderId) {
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
            while (subdivisionSize % 3 !== 0) {
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
        Mesh.prototype.setVerticesData = function (kind, data, updatable, stride) {
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
            }
            else {
                this._geometry.setVerticesData(kind, data, updatable, stride);
            }
        };
        Mesh.prototype.updateVerticesData = function (kind, data, updateExtends, makeItUnique) {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        };
        Mesh.prototype.updateVerticesDataDirectly = function (kind, data, offset, makeItUnique) {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesDataDirectly(kind, data, offset);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesDataDirectly(kind, data, offset, false);
            }
        };
        Mesh.prototype.makeGeometryUnique = function () {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(BABYLON.Geometry.RandomId());
            geometry.applyToMesh(this);
        };
        Mesh.prototype.setIndices = function (indices, totalVertices) {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.indices = indices;
                var scene = this.getScene();
                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene, vertexData, false, this);
            }
            else {
                this._geometry.setIndices(indices, totalVertices);
            }
        };
        Mesh.prototype._bind = function (subMesh, effect, fillMode) {
            var engine = this.getScene().getEngine();
            // Wireframe
            var indexToBind;
            switch (fillMode) {
                case BABYLON.Material.PointFillMode:
                    indexToBind = null;
                    break;
                case BABYLON.Material.WireFrameFillMode:
                    indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
                    break;
                default:
                case BABYLON.Material.TriangleFillMode:
                    indexToBind = this._geometry.getIndexBuffer();
                    break;
            }
            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);
        };
        Mesh.prototype._draw = function (subMesh, fillMode, instancesCount) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var engine = this.getScene().getEngine();
            switch (fillMode) {
                case BABYLON.Material.PointFillMode:
                    engine.drawPointClouds(subMesh.verticesStart, subMesh.verticesCount, instancesCount);
                    break;
                case BABYLON.Material.WireFrameFillMode:
                    engine.draw(false, 0, subMesh.linesIndexCount, instancesCount);
                    break;
                default:
                    engine.draw(true, subMesh.indexStart, subMesh.indexCount, instancesCount);
            }
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
                    currentRenderId = Math.max(this._visibleInstances.defaultRenderId, currentRenderId);
                    selfRenderId = Math.max(this._visibleInstances.selfDefaultRenderId, currentRenderId);
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
        Mesh.prototype._renderWithInstances = function (subMesh, fillMode, batch, effect, engine) {
            var visibleInstances = batch.visibleInstances[subMesh._id];
            var matricesCount = visibleInstances.length + 1;
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
            this._draw(subMesh, fillMode, instancesCount);
            engine.unBindInstancesBuffer(this._worldMatricesInstancesBuffer, offsetLocations);
        };
        Mesh.prototype._processRendering = function (subMesh, effect, fillMode, batch, hardwareInstancedRendering, onBeforeDraw) {
            var scene = this.getScene();
            var engine = scene.getEngine();
            if (hardwareInstancedRendering) {
                this._renderWithInstances(subMesh, fillMode, batch, effect, engine);
            }
            else {
                if (batch.renderSelf[subMesh._id]) {
                    // Draw
                    if (onBeforeDraw) {
                        onBeforeDraw(false, this.getWorldMatrix());
                    }
                    this._draw(subMesh, fillMode);
                }
                if (batch.visibleInstances[subMesh._id]) {
                    for (var instanceIndex = 0; instanceIndex < batch.visibleInstances[subMesh._id].length; instanceIndex++) {
                        var instance = batch.visibleInstances[subMesh._id][instanceIndex];
                        // World
                        var world = instance.getWorldMatrix();
                        if (onBeforeDraw) {
                            onBeforeDraw(true, world);
                        }
                        // Draw
                        this._draw(subMesh, fillMode);
                    }
                }
            }
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
                this._onBeforeRenderCallbacks[callbackIndex](this);
            }
            var engine = scene.getEngine();
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
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
                engine.setDepthWrite(savedDepthWrite);
            }
            effectiveMaterial._preBind();
            var effect = effectiveMaterial.getEffect();
            // Bind
            var fillMode = scene.forcePointsCloud ? BABYLON.Material.PointFillMode : (scene.forceWireframe ? BABYLON.Material.WireFrameFillMode : effectiveMaterial.fillMode);
            this._bind(subMesh, effect, fillMode);
            var world = this.getWorldMatrix();
            effectiveMaterial.bind(world, this);
            // Draw
            this._processRendering(subMesh, effect, fillMode, batch, hardwareInstancedRendering, function (isInstance, world) {
                if (isInstance) {
                    effectiveMaterial.bindOnlyWorldMatrix(world);
                }
            });
            // Unbind
            effectiveMaterial.unbind();
            // Outline - step 2
            if (this.renderOutline && savedDepthWrite) {
                engine.setDepthWrite(true);
                engine.setColorWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
                engine.setColorWrite(true);
            }
            // Overlay
            if (this.renderOverlay) {
                var currentMode = engine.getAlphaMode();
                engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                scene.getOutlineRenderer().render(subMesh, batch, true);
                engine.setAlphaMode(currentMode);
            }
            for (callbackIndex = 0; callbackIndex < this._onAfterRenderCallbacks.length; callbackIndex++) {
                this._onAfterRenderCallbacks[callbackIndex](this);
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
                if (mesh.parent === this) {
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
            }
            else if (that.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;
                scene._addPendingData(that);
                var getBinaryData = (this.delayLoadingFile.indexOf(".babylonbinarymeshdata") !== -1);
                BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                    if (data instanceof ArrayBuffer) {
                        _this._delayLoadingFunction(data, _this);
                    }
                    else {
                        _this._delayLoadingFunction(JSON.parse(data), _this);
                    }
                    _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(_this);
                }, function () {
                }, scene.database, getBinaryData);
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
                if (materials[index].id === id) {
                    this.material = materials[index];
                    return;
                }
            }
            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id === id) {
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
            if (this.skeleton) {
                results.push(this.skeleton);
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
            return new Mesh(name, this.getScene(), newParent, this, doNotCloneChildren);
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
        Mesh.prototype.applyDisplacementMap = function (url, minHeight, maxHeight, onSuccess) {
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
                //Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                _this.applyDisplacementMapFromBuffer(buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight);
                //execute success callback, if set
                if (onSuccess) {
                    onSuccess(_this);
                }
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
            for (var index = 0; index < totalIndices; index++) {
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
            for (index = 0; index < totalIndices; index += 3) {
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
        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async.
         * @param settings a collection of simplification settings.
         * @param parallelProcessing should all levels calculate parallel or one after the other.
         * @param type the type of simplification to run.
         * @param successCallback optional success callback to be called after the simplification finished processing all settings.
         */
        Mesh.prototype.simplify = function (settings, parallelProcessing, simplificationType, successCallback) {
            if (parallelProcessing === void 0) { parallelProcessing = true; }
            if (simplificationType === void 0) { simplificationType = 0 /* QUADRATIC */; }
            this.getScene().simplificationQueue.addTask({
                settings: settings,
                parallelProcessing: parallelProcessing,
                mesh: this,
                simplificationType: simplificationType,
                successCallback: successCallback
            });
        };
        /**
         * Optimization of the mesh's indices, in case a mesh has duplicated vertices.
         * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.
         * This should be used together with the simplification to avoid disappearing triangles.
         * @param successCallback an optional success callback to be called after the optimization finished.
         */
        Mesh.prototype.optimizeIndices = function (successCallback) {
            var _this = this;
            var indices = this.getIndices();
            var positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var vectorPositions = [];
            for (var pos = 0; pos < positions.length; pos = pos + 3) {
                vectorPositions.push(BABYLON.Vector3.FromArray(positions, pos));
            }
            var dupes = [];
            BABYLON.AsyncLoop.SyncAsyncForLoop(vectorPositions.length, 40, function (iteration) {
                var realPos = vectorPositions.length - 1 - iteration;
                var testedPosition = vectorPositions[realPos];
                for (var j = 0; j < realPos; ++j) {
                    var againstPosition = vectorPositions[j];
                    if (testedPosition.equals(againstPosition)) {
                        dupes[realPos] = j;
                        break;
                    }
                }
            }, function () {
                for (var i = 0; i < indices.length; ++i) {
                    indices[i] = dupes[indices[i]] || indices[i];
                }
                //indices are now reordered
                var originalSubMeshes = _this.subMeshes.slice(0);
                _this.setIndices(indices);
                _this.subMeshes = originalSubMeshes;
                if (successCallback) {
                    successCallback(_this);
                }
            });
        };
        // Statics
        Mesh.CreateRibbon = function (name, pathArray, closeArray, closePath, offset, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var ribbon = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateRibbon(pathArray, closeArray, closePath, offset, sideOrientation);
            vertexData.applyToMesh(ribbon, updatable);
            return ribbon;
        };
        Mesh.CreateBox = function (name, size, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var box = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(size, sideOrientation);
            vertexData.applyToMesh(box, updatable);
            return box;
        };
        Mesh.CreateSphere = function (name, segments, diameter, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var sphere = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(segments, diameter, sideOrientation);
            vertexData.applyToMesh(sphere, updatable);
            return sphere;
        };
        // Cylinder and cone (Code inspired by SharpDX.org)
        Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, subdivisions, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            // subdivisions is a new parameter, we need to support old signature
            if (scene === undefined || !(scene instanceof BABYLON.Scene)) {
                if (scene !== undefined) {
                    updatable = scene;
                }
                scene = subdivisions;
                subdivisions = 1;
            }
            var cylinder = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation, subdivisions);
            vertexData.applyToMesh(cylinder, updatable);
            return cylinder;
        };
        // Torus  (Code from SharpDX.org)
        Mesh.CreateTorus = function (name, diameter, thickness, tessellation, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var torus = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(diameter, thickness, tessellation, sideOrientation);
            vertexData.applyToMesh(torus, updatable);
            return torus;
        };
        Mesh.CreateTorusKnot = function (name, radius, tube, radialSegments, tubularSegments, p, q, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var torusKnot = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q, sideOrientation);
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
        // Extrusion
        Mesh.ExtrudeShape = function (name, shape, path, scale, rotation, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            scale = scale || 1;
            rotation = rotation || 0;
            var extruded = Mesh._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, false, scene, updatable, sideOrientation);
            return extruded;
        };
        Mesh.ExtrudeShapeCustom = function (name, shape, path, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var extrudedCustom = Mesh._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, true, scene, updatable, sideOrientation);
            return extrudedCustom;
        };
        Mesh._ExtrudeShapeGeneric = function (name, shape, curve, scale, rotation, scaleFunction, rotationFunction, rbCA, rbCP, custom, scene, updtbl, side) {
            var path3D = new BABYLON.Path3D(curve);
            var shapePaths = [];
            var extrudedGeneric = Mesh.CreateRibbon(name, shapePaths, rbCA, rbCP, 0, scene, updtbl, side);
            return extrudedGeneric;
        };
        // Plane & ground
        Mesh.CreatePlane = function (name, size, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var plane = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size, sideOrientation);
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
            var tiledGround = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTiledGround(xmin, zmin, xmax, zmax, subdivisions, precision);
            vertexData.applyToMesh(tiledGround, updatable);
            return tiledGround;
        };
        Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable, onReady) {
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
                // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949 
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                var vertexData = BABYLON.VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);
                vertexData.applyToMesh(ground, updatable);
                ground._setReady(true);
                //execute ready callback, if set
                if (onReady) {
                    onReady(ground);
                }
            };
            BABYLON.Tools.LoadImage(url, onload, function () {
            }, scene.database);
            return ground;
        };
        Mesh.CreateTube = function (name, path, radius, tesselation, radiusFunction, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var path3D = new BABYLON.Path3D(path);
            var tangents = path3D.getTangents();
            var normals = path3D.getNormals();
            var distances = path3D.getDistances();
            var pi2 = Math.PI * 2;
            var step = pi2 / tesselation;
            var returnRadius = function (i, distance) { return radius; };
            var radiusFunctionFinal = radiusFunction || returnRadius;
            var circlePaths = new Array();
            var circlePath;
            var rad;
            var normal;
            var rotated;
            var rotationMatrix;
            for (var i = 0; i < path.length; i++) {
                rad = radiusFunctionFinal(i, distances[i]); // current radius
                circlePath = Array(); // current circle array
                normal = normals[i]; // current normal  
                for (var ang = 0; ang < pi2; ang += step) {
                    rotationMatrix = BABYLON.Matrix.RotationAxis(tangents[i], ang);
                    rotated = BABYLON.Vector3.TransformCoordinates(normal, rotationMatrix).scaleInPlace(rad).add(path[i]);
                    circlePath.push(rotated);
                }
                circlePaths.push(circlePath);
            }
            var tube = Mesh.CreateRibbon(name, circlePaths, false, true, 0, scene, updatable, sideOrientation);
            return tube;
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
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : Mesh.MinMax(meshesOrMinMaxVector);
            return BABYLON.Vector3.Center(minMaxVector.min, minMaxVector.max);
        };
        Mesh.MergeMeshes = function (meshes, disposeSource, allow32BitsIndices) {
            if (disposeSource === void 0) { disposeSource = true; }
            var source = meshes[0];
            var material = source.material;
            var scene = source.getScene();
            if (!allow32BitsIndices) {
                var totalVertices = 0;
                for (var index = 0; index < meshes.length; index++) {
                    totalVertices += meshes[index].getTotalVertices();
                    if (totalVertices > 65536) {
                        BABYLON.Tools.Warn("Cannot merge meshes because resulting mesh will have more than 65536 vertices. Please use allow32BitsIndices = true to use 32 bits indices");
                        return null;
                    }
                }
            }
            // Merge
            var vertexData = BABYLON.VertexData.ExtractFromMesh(source);
            vertexData.transform(source.getWorldMatrix());
            for (index = 1; index < meshes.length; index++) {
                var otherVertexData = BABYLON.VertexData.ExtractFromMesh(meshes[index]);
                otherVertexData.transform(meshes[index].getWorldMatrix());
                vertexData.merge(otherVertexData);
            }
            var newMesh = new Mesh(source.name + "_merged", scene);
            vertexData.applyToMesh(newMesh);
            // Setting properties
            newMesh.material = material;
            newMesh.checkCollisions = source.checkCollisions;
            // Cleaning
            if (disposeSource) {
                for (index = 0; index < meshes.length; index++) {
                    meshes[index].dispose();
                }
            }
            return newMesh;
        };
        // Consts
        Mesh._FRONTSIDE = 0;
        Mesh._BACKSIDE = 1;
        Mesh._DOUBLESIDE = 2;
        Mesh._DEFAULTSIDE = 0;
        return Mesh;
    })(BABYLON.AbstractMesh);
    BABYLON.Mesh = Mesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.mesh.js.map