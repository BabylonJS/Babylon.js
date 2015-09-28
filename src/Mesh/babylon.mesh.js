var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
            this._sideOrientation = Mesh._DEFAULTSIDE;
            this._areNormalsFrozen = false; // Will be used by ribbons mainly
            if (source) {
                // Geometry
                if (source._geometry) {
                    source._geometry.applyToMesh(this);
                }
                // Deep copy
                BABYLON.Tools.DeepCopy(source, this, ["name", "material", "skeleton", "instances"], []);
                this.id = name + "." + source.id;
                // Material
                this.material = source.material;
                if (!doNotCloneChildren) {
                    // Children
                    for (var index = 0; index < scene.meshes.length; index++) {
                        var mesh = scene.meshes[index];
                        if (mesh.parent === source) {
                            // doNotCloneChildren is always going to be False
                            var newChild = mesh.clone(name + "." + mesh.name, this, doNotCloneChildren);
                        }
                    }
                }
                // Particles
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
        Object.defineProperty(Mesh, "NO_CAP", {
            get: function () {
                return Mesh._NO_CAP;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "CAP_START", {
            get: function () {
                return Mesh._CAP_START;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "CAP_END", {
            get: function () {
                return Mesh._CAP_END;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh, "CAP_ALL", {
            get: function () {
                return Mesh._CAP_ALL;
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
                if (this.onLODLevelSelection) {
                    this.onLODLevelSelection(distanceToCamera, this, this._LODLevels[this._LODLevels.length - 1].mesh);
                }
                return this;
            }
            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];
                if (level.distance < distanceToCamera) {
                    if (level.mesh) {
                        level.mesh._preActivate();
                        level.mesh._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
                    }
                    if (this.onLODLevelSelection) {
                        this.onLODLevelSelection(distanceToCamera, this, level.mesh);
                    }
                    return level.mesh;
                }
            }
            if (this.onLODLevelSelection) {
                this.onLODLevelSelection(distanceToCamera, this, this);
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
        Mesh.prototype.getVerticesData = function (kind, copyWhenShared) {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind, copyWhenShared);
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
        Mesh.prototype.getIndices = function (copyWhenShared) {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices(copyWhenShared);
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
        Object.defineProperty(Mesh.prototype, "sideOrientation", {
            get: function () {
                return this._sideOrientation;
            },
            set: function (sideO) {
                this._sideOrientation = sideO;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Mesh.prototype, "areNormalsFrozen", {
            get: function () {
                return this._areNormalsFrozen;
            },
            enumerable: true,
            configurable: true
        });
        /**  This function affects parametric shapes on update only : ribbons, tubes, etc. It has no effect at all on other shapes */
        Mesh.prototype.freezeNormals = function () {
            this._areNormalsFrozen = true;
        };
        /**  This function affects parametric shapes on update only : ribbons, tubes, etc. It has no effect at all on other shapes */
        Mesh.prototype.unfreezeNormals = function () {
            this._areNormalsFrozen = false;
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
            // Ensure that subdivisionSize is a multiple of 3
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
        // Mesh positions update function :
        // updates the mesh positions according to the positionFunction returned values.
        // The positionFunction argument must be a javascript function accepting the mesh "positions" array as parameter.
        // This dedicated positionFunction computes new mesh positions according to the given mesh type.
        Mesh.prototype.updateMeshPositions = function (positionFunction, computeNormals) {
            if (computeNormals === void 0) { computeNormals = true; }
            var positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            positionFunction(positions);
            this.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
            if (computeNormals) {
                var indices = this.getIndices();
                var normals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                BABYLON.VertexData.ComputeNormals(positions, indices, normals);
                this.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
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
            // Draw order
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
        Mesh.prototype.render = function (subMesh, enableAlphaMode) {
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
            var callbackIndex;
            for (callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
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
            // Alpha mode
            if (enableAlphaMode) {
                engine.setAlphaMode(effectiveMaterial.alphaMode);
            }
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
                }, function () { }, scene.database, getBinaryData);
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
            var index;
            for (index = 0; index < materials.length; index++) {
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
            var index;
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }
            this.setVerticesData(BABYLON.VertexBuffer.PositionKind, temp, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());
            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }
            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            temp = [];
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).normalize().toArray(temp, index);
            }
            this.setVerticesData(BABYLON.VertexBuffer.NormalKind, temp, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
            // flip faces?
            if (transform.m[0] * transform.m[5] * transform.m[10] < 0) {
                this.flipFaces();
            }
        };
        // Will apply current transform to mesh and reset world matrix
        Mesh.prototype.bakeCurrentTransformIntoVertices = function () {
            this.bakeTransformIntoVertices(this.computeWorldMatrix(true));
            this.scaling.copyFromFloats(1, 1, 1);
            this.position.copyFromFloats(0, 0, 0);
            this.rotation.copyFromFloats(0, 0, 0);
            //only if quaternion is already set
            if (this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            this._worldMatrix = BABYLON.Matrix.Identity();
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
            BABYLON.Tools.LoadImage(url, onload, function () { }, scene.database);
        };
        Mesh.prototype.applyDisplacementMapFromBuffer = function (buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight) {
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)
                || !this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)
                || !this.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
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
            var kindIndex;
            var kind;
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
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
            // Generating unique vertices per face
            var index;
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
                // Store same normals for every vertex
                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }
            this.setIndices(indices);
            this.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals, updatableNormals);
            // Updating vertex buffers
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
        // will inverse faces orientations, and invert normals too if specified
        Mesh.prototype.flipFaces = function (flipNormals) {
            if (flipNormals === void 0) { flipNormals = false; }
            var vertex_data = BABYLON.VertexData.ExtractFromMesh(this);
            var i;
            if (flipNormals && this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                for (i = 0; i < vertex_data.normals.length; i++) {
                    vertex_data.normals[i] *= -1;
                }
            }
            var temp;
            for (i = 0; i < vertex_data.indices.length; i += 3) {
                // reassign indices
                temp = vertex_data.indices[i + 1];
                vertex_data.indices[i + 1] = vertex_data.indices[i + 2];
                vertex_data.indices[i + 2] = temp;
            }
            vertex_data.applyToMesh(this);
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
            if (simplificationType === void 0) { simplificationType = BABYLON.SimplificationType.QUADRATIC; }
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
        Mesh.CreateRibbon = function (name, options, closeArrayOrScene, closePath, offset, scene, updatable, sideOrientation, instance) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (instance === void 0) { instance = null; }
            var pathArray;
            if (closeArrayOrScene instanceof BABYLON.Scene) {
                scene = closeArrayOrScene;
                updatable = options.updatable;
                if (options.instance) {
                    pathArray = options.pathArray;
                    instance = options.instance;
                    closePath = options.closePath;
                    var closeArray = options.closeArray;
                }
            }
            else {
                pathArray = options;
                options = {
                    pathArray: pathArray,
                    closeArray: closeArrayOrScene,
                    closePath: closePath,
                    offset: offset,
                    sideOrientation: sideOrientation,
                };
            }
            if (instance) {
                // positionFunction : ribbon case
                // only pathArray and sideOrientation parameters are taken into account for positions update
                var positionFunction = function (positions) {
                    var minlg = pathArray[0].length;
                    var i = 0;
                    var ns = (instance.sideOrientation === Mesh.DOUBLESIDE) ? 2 : 1;
                    for (var si = 1; si <= ns; si++) {
                        for (var p = 0; p < pathArray.length; p++) {
                            var path = pathArray[p];
                            var l = path.length;
                            minlg = (minlg < l) ? minlg : l;
                            var j = 0;
                            while (j < minlg) {
                                positions[i] = path[j].x;
                                positions[i + 1] = path[j].y;
                                positions[i + 2] = path[j].z;
                                j++;
                                i += 3;
                            }
                            if (instance._closePath) {
                                positions[i] = path[0].x;
                                positions[i + 1] = path[0].y;
                                positions[i + 2] = path[0].z;
                                i += 3;
                            }
                        }
                    }
                };
                var positions = instance.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                positionFunction(positions);
                instance.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
                if (!(instance.areNormalsFrozen)) {
                    var indices = instance.getIndices();
                    var normals = instance.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
                    if (instance._closePath) {
                        var indexFirst = 0;
                        var indexLast = 0;
                        for (var p = 0; p < pathArray.length; p++) {
                            indexFirst = instance._idx[p] * 3;
                            if (p + 1 < pathArray.length) {
                                indexLast = (instance._idx[p + 1] - 1) * 3;
                            }
                            else {
                                indexLast = normals.length - 3;
                            }
                            normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                            normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                            normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                            normals[indexLast] = normals[indexFirst];
                            normals[indexLast + 1] = normals[indexFirst + 1];
                            normals[indexLast + 2] = normals[indexFirst + 2];
                        }
                    }
                    instance.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
                }
                return instance;
            }
            else {
                var ribbon = new Mesh(name, scene);
                ribbon.sideOrientation = sideOrientation;
                var vertexData = BABYLON.VertexData.CreateRibbon(options);
                if (closePath) {
                    ribbon._idx = vertexData._idx;
                }
                ribbon._closePath = closePath;
                vertexData.applyToMesh(ribbon, updatable);
                return ribbon;
            }
        };
        Mesh.CreateDisc = function (name, radius, tessellation, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var disc = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateDisc(radius, tessellation, sideOrientation);
            vertexData.applyToMesh(disc, updatable);
            return disc;
        };
        Mesh.CreateBox = function (name, options, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            // Check parameters
            updatable = updatable || options.updatable;
            var box = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(options, sideOrientation);
            vertexData.applyToMesh(box, updatable);
            return box;
        };
        Mesh.CreateSphere = function (name, options, diameterOrScene, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (diameterOrScene instanceof BABYLON.Scene) {
                scene = diameterOrScene;
                updatable = options.updatable;
            }
            else {
                var segments = options;
                options = {
                    segments: segments,
                    diameterX: diameterOrScene,
                    diameterY: diameterOrScene,
                    diameterZ: diameterOrScene,
                    sideOrientation: sideOrientation
                };
            }
            var sphere = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(options);
            vertexData.applyToMesh(sphere, updatable);
            return sphere;
        };
        Mesh.CreateCylinder = function (name, options, diameterTopOrScene, diameterBottom, tessellation, subdivisions, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (diameterTopOrScene instanceof BABYLON.Scene) {
                scene = diameterTopOrScene;
                updatable = options.updatable;
            }
            else {
                if (scene === undefined || !(scene instanceof BABYLON.Scene)) {
                    if (scene !== undefined) {
                        sideOrientation = updatable || Mesh.DEFAULTSIDE;
                        updatable = scene;
                    }
                    scene = subdivisions;
                    subdivisions = 1;
                }
                var height = options;
                options = {
                    height: height,
                    diameterTop: diameterTopOrScene,
                    diameterBottom: diameterBottom,
                    tessellation: tessellation,
                    subdivisions: subdivisions,
                    sideOrientation: sideOrientation
                };
            }
            var cylinder = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(options);
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
        Mesh.CreateLines = function (name, points, scene, updatable, linesInstance) {
            if (linesInstance === void 0) { linesInstance = null; }
            if (linesInstance) {
                var positionFunction = function (positions) {
                    var i = 0;
                    for (var p = 0; p < points.length; p++) {
                        positions[i] = points[p].x;
                        positions[i + 1] = points[p].y;
                        positions[i + 2] = points[p].z;
                        i += 3;
                    }
                };
                linesInstance.updateMeshPositions(positionFunction, false);
                return linesInstance;
            }
            // lines creation
            var lines = new BABYLON.LinesMesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateLines(points);
            vertexData.applyToMesh(lines, updatable);
            return lines;
        };
        // Dashed Lines
        Mesh.CreateDashedLines = function (name, points, dashSize, gapSize, dashNb, scene, updatable, linesInstance) {
            if (linesInstance === void 0) { linesInstance = null; }
            if (linesInstance) {
                var positionFunction = function (positions) {
                    var curvect = BABYLON.Vector3.Zero();
                    var nbSeg = positions.length / 6;
                    var lg = 0;
                    var nb = 0;
                    var shft = 0;
                    var dashshft = 0;
                    var curshft = 0;
                    var p = 0;
                    var i = 0;
                    var j = 0;
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        lg += curvect.length();
                    }
                    shft = lg / nbSeg;
                    dashshft = linesInstance.dashSize * shft / (linesInstance.dashSize + linesInstance.gapSize);
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        nb = Math.floor(curvect.length() / shft);
                        curvect.normalize();
                        j = 0;
                        while (j < nb && p < positions.length) {
                            curshft = shft * j;
                            positions[p] = points[i].x + curshft * curvect.x;
                            positions[p + 1] = points[i].y + curshft * curvect.y;
                            positions[p + 2] = points[i].z + curshft * curvect.z;
                            positions[p + 3] = points[i].x + (curshft + dashshft) * curvect.x;
                            positions[p + 4] = points[i].y + (curshft + dashshft) * curvect.y;
                            positions[p + 5] = points[i].z + (curshft + dashshft) * curvect.z;
                            p += 6;
                            j++;
                        }
                    }
                    while (p < positions.length) {
                        positions[p] = points[i].x;
                        positions[p + 1] = points[i].y;
                        positions[p + 2] = points[i].z;
                        p += 3;
                    }
                };
                linesInstance.updateMeshPositions(positionFunction, false);
                return linesInstance;
            }
            // dashed lines creation
            var dashedLines = new BABYLON.LinesMesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateDashedLines(points, dashSize, gapSize, dashNb);
            vertexData.applyToMesh(dashedLines, updatable);
            dashedLines.dashSize = dashSize;
            dashedLines.gapSize = gapSize;
            return dashedLines;
        };
        // Extrusion
        Mesh.ExtrudeShape = function (name, shape, path, scale, rotation, cap, scene, updatable, sideOrientation, extrudedInstance) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (extrudedInstance === void 0) { extrudedInstance = null; }
            scale = scale || 1;
            rotation = rotation || 0;
            var extruded = Mesh._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, cap, false, scene, updatable, sideOrientation, extrudedInstance);
            return extruded;
        };
        Mesh.ExtrudeShapeCustom = function (name, shape, path, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, scene, updatable, sideOrientation, extrudedInstance) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (extrudedInstance === void 0) { extrudedInstance = null; }
            var extrudedCustom = Mesh._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, true, scene, updatable, sideOrientation, extrudedInstance);
            return extrudedCustom;
        };
        Mesh._ExtrudeShapeGeneric = function (name, shape, curve, scale, rotation, scaleFunction, rotateFunction, rbCA, rbCP, cap, custom, scene, updtbl, side, instance) {
            // extrusion geometry
            var extrusionPathArray = function (shape, curve, path3D, shapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom) {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var binormals = path3D.getBinormals();
                var distances = path3D.getDistances();
                var angle = 0;
                var returnScale = function (i, distance) { return scale; };
                var returnRotation = function (i, distance) { return rotation; };
                var rotate = custom ? rotateFunction : returnRotation;
                var scl = custom ? scaleFunction : returnScale;
                var index = 0;
                for (var i = 0; i < curve.length; i++) {
                    var shapePath = new Array();
                    var angleStep = rotate(i, distances[i]);
                    var scaleRatio = scl(i, distances[i]);
                    for (var p = 0; p < shape.length; p++) {
                        var rotationMatrix = BABYLON.Matrix.RotationAxis(tangents[i], angle);
                        var planed = ((tangents[i].scale(shape[p].z)).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y)));
                        var rotated = BABYLON.Vector3.TransformCoordinates(planed, rotationMatrix).scaleInPlace(scaleRatio).add(curve[i]);
                        shapePath.push(rotated);
                    }
                    shapePaths[index] = shapePath;
                    angle += angleStep;
                    index++;
                }
                // cap
                var capPath = function (shapePath) {
                    var pointCap = Array();
                    var barycenter = BABYLON.Vector3.Zero();
                    var i;
                    for (i = 0; i < shapePath.length; i++) {
                        barycenter.addInPlace(shapePath[i]);
                    }
                    barycenter.scaleInPlace(1 / shapePath.length);
                    for (i = 0; i < shapePath.length; i++) {
                        pointCap.push(barycenter);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        shapePaths.unshift(capPath(shapePaths[0]));
                        break;
                    case Mesh.CAP_END:
                        shapePaths.push(capPath(shapePaths[shapePaths.length - 1]));
                        break;
                    case Mesh.CAP_ALL:
                        shapePaths.unshift(capPath(shapePaths[0]));
                        shapePaths.push(capPath(shapePaths[shapePaths.length - 1]));
                        break;
                    default:
                        break;
                }
                return shapePaths;
            };
            var path3D;
            var pathArray;
            if (instance) {
                path3D = (instance.path3D).update(curve);
                pathArray = extrusionPathArray(shape, curve, instance.path3D, instance.pathArray, scale, rotation, scaleFunction, rotateFunction, instance.cap, custom);
                instance = Mesh.CreateRibbon(null, pathArray, null, null, null, null, null, null, instance);
                return instance;
            }
            // extruded shape creation
            path3D = new BABYLON.Path3D(curve);
            var newShapePaths = new Array();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
            var extrudedGeneric = Mesh.CreateRibbon(name, pathArray, rbCA, rbCP, 0, scene, updtbl, side);
            extrudedGeneric.pathArray = pathArray;
            extrudedGeneric.path3D = path3D;
            extrudedGeneric.cap = cap;
            return extrudedGeneric;
        };
        // Lathe
        Mesh.CreateLathe = function (name, shape, radius, tessellation, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            radius = radius || 1;
            tessellation = tessellation || radius * 60;
            var pi2 = Math.PI * 2;
            var shapeLathe = new Array();
            // first rotatable point
            var i = 0;
            while (shape[i].x === 0) {
                i++;
            }
            var pt = shape[i];
            for (i = 0; i < shape.length; i++) {
                shapeLathe.push(shape[i].subtract(pt));
            }
            // circle path
            var step = pi2 / tessellation;
            var rotated;
            var path = new Array();
            ;
            for (i = 0; i < tessellation; i++) {
                rotated = new BABYLON.Vector3(Math.cos(i * step) * radius, 0, Math.sin(i * step) * radius);
                path.push(rotated);
            }
            path.push(path[0]);
            // extrusion
            var scaleFunction = function () { return 1; };
            var rotateFunction = function () { return 0; };
            var lathe = Mesh.ExtrudeShapeCustom(name, shapeLathe, path, scaleFunction, rotateFunction, true, false, Mesh.NO_CAP, scene, updatable, sideOrientation);
            return lathe;
        };
        Mesh.CreatePlane = function (name, options, scene, updatable, sideOrientation) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            var plane = new Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(options, sideOrientation);
            vertexData.applyToMesh(plane, updatable || options.updatable);
            return plane;
        };
        Mesh.CreateGround = function (name, options, heightOrScene, subdivisions, scene, updatable) {
            if (heightOrScene instanceof BABYLON.Scene) {
                scene = heightOrScene;
                updatable = options.updatable;
            }
            else {
                var width = options;
                options = {
                    width: width,
                    height: heightOrScene,
                    subdivisions: subdivisions
                };
            }
            var ground = new BABYLON.GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = options.subdivisions || 1;
            var vertexData = BABYLON.VertexData.CreateGround(options);
            vertexData.applyToMesh(ground, updatable || options.updatable);
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
            BABYLON.Tools.LoadImage(url, onload, function () { }, scene.database);
            return ground;
        };
        Mesh.CreateTube = function (name, path, radius, tessellation, radiusFunction, cap, scene, updatable, sideOrientation, tubeInstance) {
            if (sideOrientation === void 0) { sideOrientation = Mesh.DEFAULTSIDE; }
            if (tubeInstance === void 0) { tubeInstance = null; }
            // tube geometry
            var tubePathArray = function (path, path3D, circlePaths, radius, tessellation, radiusFunction, cap) {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var distances = path3D.getDistances();
                var pi2 = Math.PI * 2;
                var step = pi2 / tessellation;
                var returnRadius = function (i, distance) { return radius; };
                var radiusFunctionFinal = radiusFunction || returnRadius;
                var circlePath;
                var rad;
                var normal;
                var rotated;
                var rotationMatrix;
                var index = 0;
                for (var i = 0; i < path.length; i++) {
                    rad = radiusFunctionFinal(i, distances[i]); // current radius
                    circlePath = Array(); // current circle array
                    normal = normals[i]; // current normal
                    for (var t = 0; t < tessellation; t++) {
                        rotationMatrix = BABYLON.Matrix.RotationAxis(tangents[i], step * t);
                        rotated = BABYLON.Vector3.TransformCoordinates(normal, rotationMatrix).scaleInPlace(rad).add(path[i]);
                        circlePath.push(rotated);
                    }
                    circlePaths[index] = circlePath;
                    index++;
                }
                // cap
                var capPath = function (nbPoints, pathIndex) {
                    var pointCap = Array();
                    for (var i = 0; i < nbPoints; i++) {
                        pointCap.push(path[pathIndex]);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        circlePaths.unshift(capPath(tessellation + 1, 0));
                        break;
                    case Mesh.CAP_END:
                        circlePaths.push(capPath(tessellation + 1, path.length - 1));
                        break;
                    case Mesh.CAP_ALL:
                        circlePaths.unshift(capPath(tessellation + 1, 0));
                        circlePaths.push(capPath(tessellation + 1, path.length - 1));
                        break;
                    default:
                        break;
                }
                return circlePaths;
            };
            var path3D;
            var pathArray;
            if (tubeInstance) {
                path3D = (tubeInstance.path3D).update(path);
                pathArray = tubePathArray(path, path3D, tubeInstance.pathArray, radius, tubeInstance.tessellation, radiusFunction, tubeInstance.cap);
                tubeInstance = Mesh.CreateRibbon(null, pathArray, null, null, null, null, null, null, tubeInstance);
                return tubeInstance;
            }
            // tube creation
            path3D = new BABYLON.Path3D(path);
            var newPathArray = new Array();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap);
            var tube = Mesh.CreateRibbon(name, pathArray, false, true, 0, scene, updatable, sideOrientation);
            tube.pathArray = pathArray;
            tube.path3D = path3D;
            tube.tessellation = tessellation;
            tube.cap = cap;
            return tube;
        };
        // Decals
        Mesh.CreateDecal = function (name, sourceMesh, position, normal, size, angle) {
            if (angle === void 0) { angle = 0; }
            var indices = sourceMesh.getIndices();
            var positions = sourceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var normals = sourceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            // Getting correct rotation
            if (!normal) {
                var target = new BABYLON.Vector3(0, 0, 1);
                var camera = sourceMesh.getScene().activeCamera;
                var cameraWorldTarget = BABYLON.Vector3.TransformCoordinates(target, camera.getWorldMatrix());
                normal = camera.globalPosition.subtract(cameraWorldTarget);
            }
            var yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
            var len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
            var pitch = Math.atan2(normal.y, len);
            // Matrix
            var decalWorldMatrix = BABYLON.Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(BABYLON.Matrix.Translation(position.x, position.y, position.z));
            var inverseDecalWorldMatrix = BABYLON.Matrix.Invert(decalWorldMatrix);
            var meshWorldMatrix = sourceMesh.getWorldMatrix();
            var transformMatrix = meshWorldMatrix.multiply(inverseDecalWorldMatrix);
            var vertexData = new BABYLON.VertexData();
            vertexData.indices = [];
            vertexData.positions = [];
            vertexData.normals = [];
            vertexData.uvs = [];
            var currentVertexDataIndex = 0;
            var extractDecalVector3 = function (indexId) {
                var vertexId = indices[indexId];
                var result = new BABYLON.PositionNormalVertex();
                result.position = new BABYLON.Vector3(positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2]);
                // Send vector to decal local world
                result.position = BABYLON.Vector3.TransformCoordinates(result.position, transformMatrix);
                // Get normal
                result.normal = new BABYLON.Vector3(normals[vertexId * 3], normals[vertexId * 3 + 1], normals[vertexId * 3 + 2]);
                return result;
            }; // Inspired by https://github.com/mrdoob/three.js/blob/eee231960882f6f3b6113405f524956145148146/examples/js/geometries/DecalGeometry.js
            var clip = function (vertices, axis) {
                if (vertices.length === 0) {
                    return vertices;
                }
                var clipSize = 0.5 * Math.abs(BABYLON.Vector3.Dot(size, axis));
                var clipVertices = function (v0, v1) {
                    var clipFactor = BABYLON.Vector3.GetClipFactor(v0.position, v1.position, axis, clipSize);
                    return new BABYLON.PositionNormalVertex(BABYLON.Vector3.Lerp(v0.position, v1.position, clipFactor), BABYLON.Vector3.Lerp(v0.normal, v1.normal, clipFactor));
                };
                var result = new Array();
                for (var index = 0; index < vertices.length; index += 3) {
                    var v1Out;
                    var v2Out;
                    var v3Out;
                    var total = 0;
                    var nV1, nV2, nV3, nV4;
                    var d1 = BABYLON.Vector3.Dot(vertices[index].position, axis) - clipSize;
                    var d2 = BABYLON.Vector3.Dot(vertices[index + 1].position, axis) - clipSize;
                    var d3 = BABYLON.Vector3.Dot(vertices[index + 2].position, axis) - clipSize;
                    v1Out = d1 > 0;
                    v2Out = d2 > 0;
                    v3Out = d3 > 0;
                    total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);
                    switch (total) {
                        case 0:
                            result.push(vertices[index]);
                            result.push(vertices[index + 1]);
                            result.push(vertices[index + 2]);
                            break;
                        case 1:
                            if (v1Out) {
                                nV1 = vertices[index + 1];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index], nV1);
                                nV4 = clipVertices(vertices[index], nV2);
                            }
                            if (v2Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index + 1], nV1);
                                nV4 = clipVertices(vertices[index + 1], nV2);
                                result.push(nV3);
                                result.push(nV2.clone());
                                result.push(nV1.clone());
                                result.push(nV2.clone());
                                result.push(nV3.clone());
                                result.push(nV4);
                                break;
                            }
                            if (v3Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 1];
                                nV3 = clipVertices(vertices[index + 2], nV1);
                                nV4 = clipVertices(vertices[index + 2], nV2);
                            }
                            result.push(nV1.clone());
                            result.push(nV2.clone());
                            result.push(nV3);
                            result.push(nV4);
                            result.push(nV3.clone());
                            result.push(nV2.clone());
                            break;
                        case 2:
                            if (!v1Out) {
                                nV1 = vertices[index].clone();
                                nV2 = clipVertices(nV1, vertices[index + 1]);
                                nV3 = clipVertices(nV1, vertices[index + 2]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v2Out) {
                                nV1 = vertices[index + 1].clone();
                                nV2 = clipVertices(nV1, vertices[index + 2]);
                                nV3 = clipVertices(nV1, vertices[index]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v3Out) {
                                nV1 = vertices[index + 2].clone();
                                nV2 = clipVertices(nV1, vertices[index]);
                                nV3 = clipVertices(nV1, vertices[index + 1]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            break;
                        case 3:
                            break;
                    }
                }
                return result;
            };
            for (var index = 0; index < indices.length; index += 3) {
                var faceVertices = new Array();
                faceVertices.push(extractDecalVector3(index));
                faceVertices.push(extractDecalVector3(index + 1));
                faceVertices.push(extractDecalVector3(index + 2));
                // Clip
                faceVertices = clip(faceVertices, new BABYLON.Vector3(1, 0, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(-1, 0, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 1, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, -1, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 0, 1));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 0, -1));
                if (faceVertices.length === 0) {
                    continue;
                }
                // Add UVs and get back to world
                for (var vIndex = 0; vIndex < faceVertices.length; vIndex++) {
                    var vertex = faceVertices[vIndex];
                    vertexData.indices.push(currentVertexDataIndex);
                    vertex.position.toArray(vertexData.positions, currentVertexDataIndex * 3);
                    vertex.normal.toArray(vertexData.normals, currentVertexDataIndex * 3);
                    vertexData.uvs.push(0.5 + vertex.position.x / size.x);
                    vertexData.uvs.push(0.5 + vertex.position.y / size.y);
                    currentVertexDataIndex++;
                }
            }
            // Return mesh
            var decal = new Mesh(name, sourceMesh.getScene());
            vertexData.applyToMesh(decal);
            decal.position = position.clone();
            decal.rotation = new BABYLON.Vector3(pitch, yaw, angle);
            return decal;
        };
        // Skeletons
        /**
         * Update the vertex buffers by applying transformation from the bones
         * @param {skeleton} skeleton to apply
         */
        Mesh.prototype.applySkeleton = function (skeleton) {
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                return this;
            }
            var source;
            if (!this._sourcePositions) {
                source = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                this._sourcePositions = new Float32Array(source);
                if (!this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable()) {
                    this.setVerticesData(BABYLON.VertexBuffer.PositionKind, source, true);
                }
            }
            if (!this._sourceNormals) {
                source = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                this._sourceNormals = new Float32Array(source);
                if (!this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable()) {
                    this.setVerticesData(BABYLON.VertexBuffer.NormalKind, source, true);
                }
            }
            var positionsData = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var normalsData = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var matricesIndicesData = this.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind);
            var matricesWeightsData = this.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
            var skeletonMatrices = skeleton.getTransformMatrices();
            var tempVector3 = BABYLON.Vector3.Zero();
            var finalMatrix = new BABYLON.Matrix();
            var tempMatrix = new BABYLON.Matrix();
            for (var index = 0; index < positionsData.length; index += 3) {
                var index4 = (index / 3) * 4;
                var matricesWeight0 = matricesWeightsData[index4];
                var matricesWeight1 = matricesWeightsData[index4 + 1];
                var matricesWeight2 = matricesWeightsData[index4 + 2];
                var matricesWeight3 = matricesWeightsData[index4 + 3];
                if (matricesWeight0 > 0) {
                    BABYLON.Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4] * 16, matricesWeight0, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }
                if (matricesWeight1 > 0) {
                    BABYLON.Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 1] * 16, matricesWeight1, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }
                if (matricesWeight2 > 0) {
                    BABYLON.Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 2] * 16, matricesWeight2, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }
                if (matricesWeight3 > 0) {
                    BABYLON.Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 3] * 16, matricesWeight3, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }
                BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(this._sourcePositions[index], this._sourcePositions[index + 1], this._sourcePositions[index + 2], finalMatrix, tempVector3);
                tempVector3.toArray(positionsData, index);
                BABYLON.Vector3.TransformNormalFromFloatsToRef(this._sourceNormals[index], this._sourceNormals[index + 1], this._sourceNormals[index + 2], finalMatrix, tempVector3);
                tempVector3.toArray(normalsData, index);
                finalMatrix.reset();
            }
            this.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positionsData);
            this.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normalsData);
            return this;
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
        /**
         * Merge the array of meshes into a single mesh for performance reasons.
         * @param {Array<Mesh>} meshes - The vertices source.  They should all be of the same material.  Entries can empty
         * @param {boolean} disposeSource - When true (default), dispose of the vertices from the source meshes
         * @param {boolean} allow32BitsIndices - When the sum of the vertices > 64k, this must be set to true.
         * @param {Mesh} meshSubclass - When set, vertices inserted into this Mesh.  Meshes can then be merged into a Mesh sub-class.
         */
        Mesh.MergeMeshes = function (meshes, disposeSource, allow32BitsIndices, meshSubclass) {
            if (disposeSource === void 0) { disposeSource = true; }
            var index;
            if (!allow32BitsIndices) {
                var totalVertices = 0;
                // Counting vertices
                for (index = 0; index < meshes.length; index++) {
                    if (meshes[index]) {
                        totalVertices += meshes[index].getTotalVertices();
                        if (totalVertices > 65536) {
                            BABYLON.Tools.Warn("Cannot merge meshes because resulting mesh will have more than 65536 vertices. Please use allow32BitsIndices = true to use 32 bits indices");
                            return null;
                        }
                    }
                }
            }
            // Merge
            var vertexData;
            var otherVertexData;
            var source;
            for (index = 0; index < meshes.length; index++) {
                if (meshes[index]) {
                    meshes[index].computeWorldMatrix(true);
                    otherVertexData = BABYLON.VertexData.ExtractFromMesh(meshes[index], true);
                    otherVertexData.transform(meshes[index].getWorldMatrix());
                    if (vertexData) {
                        vertexData.merge(otherVertexData);
                    }
                    else {
                        vertexData = otherVertexData;
                        source = meshes[index];
                    }
                }
            }
            if (!meshSubclass) {
                meshSubclass = new Mesh(source.name + "_merged", source.getScene());
            }
            vertexData.applyToMesh(meshSubclass);
            // Setting properties
            meshSubclass.material = source.material;
            meshSubclass.checkCollisions = source.checkCollisions;
            // Cleaning
            if (disposeSource) {
                for (index = 0; index < meshes.length; index++) {
                    if (meshes[index]) {
                        meshes[index].dispose();
                    }
                }
            }
            return meshSubclass;
        };
        // Consts
        Mesh._FRONTSIDE = 0;
        Mesh._BACKSIDE = 1;
        Mesh._DOUBLESIDE = 2;
        Mesh._DEFAULTSIDE = 0;
        Mesh._NO_CAP = 0;
        Mesh._CAP_START = 1;
        Mesh._CAP_END = 2;
        Mesh._CAP_ALL = 3;
        return Mesh;
    })(BABYLON.AbstractMesh);
    BABYLON.Mesh = Mesh;
})(BABYLON || (BABYLON = {}));
