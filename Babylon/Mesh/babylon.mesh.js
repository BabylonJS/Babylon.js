var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Mesh = (function (_super) {
        __extends(Mesh, _super);
        function Mesh(name, scene) {
            _super.call(this, name, scene);
            // Members
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.instances = new Array();
            this._onBeforeRenderCallbacks = [];
            this._visibleInstances = {};
            this._renderIdForInstances = -1;
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
            var subdivisionSize = totalIndices / count;
            var offset = 0;

            this.releaseSubMeshes();
            for (var index = 0; index < count; index++) {
                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }

            this.synchronizeInstances();
        };

        Mesh.prototype.setVerticesData = function (data, kind, updatable) {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, updatable, this);
            } else {
                this._geometry.setVerticesData(data, kind, updatable);
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

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, false, this);
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

        Mesh.prototype._draw = function (subMesh, useTriangles) {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
        };

        Mesh.prototype.bindAndDraw = function (subMesh, effect, wireframe) {
            this._bind(subMesh, effect, wireframe);

            this._draw(subMesh, !wireframe);
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

        Mesh.prototype.render = function (subMesh) {
            var renderSelf = true;
            var scene = this.getScene();

            // Managing instances
            if (this._visibleInstances) {
                var currentRenderId = scene.getRenderId();
                var visibleInstances = this._visibleInstances[currentRenderId];
                var selfRenderId = this._renderId;

                if (!visibleInstances && this._visibleInstances.defaultRenderId) {
                    visibleInstances = this._visibleInstances[this._visibleInstances.defaultRenderId];
                    currentRenderId = this._visibleInstances.defaultRenderId;
                    selfRenderId = this._visibleInstances.selfDefaultRenderId;
                }

                if (visibleInstances && visibleInstances.length) {
                    if (this._renderIdForInstances === currentRenderId) {
                        return;
                    }

                    if (currentRenderId !== selfRenderId) {
                        renderSelf = false;
                    }
                }
                this._renderIdForInstances = currentRenderId;
            }

            // Checking geometry state
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
                return;
            }

            var engine = scene.getEngine();
            var effect = effectiveMaterial.getEffect();

            // Bind
            var wireFrame = engine.forceWireframe || effectiveMaterial.wireframe;
            this._bind(subMesh, effect, wireFrame);
            effectiveMaterial._preBind();

            if (renderSelf) {
                // World
                var world = this.getWorldMatrix();
                effectiveMaterial.bind(world, this);

                // Draw
                this._draw(subMesh, !wireFrame);
            }

            if (visibleInstances) {
                for (var instanceIndex = 0; instanceIndex < visibleInstances.length; instanceIndex++) {
                    var instance = visibleInstances[instanceIndex];

                    // World
                    world = instance.getWorldMatrix();
                    effectiveMaterial.bind(world, this);

                    // Draw
                    this._draw(subMesh, !wireFrame);
                }
            }

            // Unbind
            effectiveMaterial.unbind();
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

            this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
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

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

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
                this._geometry.releaseForMesh(this);
            }

            while (this.instances.length) {
                this.instances[0].dispose();
            }

            _super.prototype.dispose.call(this, doNotRecurse);
        };

        // Geometric tools
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
            this.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatableNormals);

            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(newdata[kind], kind, vbs[kind].isUpdatable());
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
        Mesh.CreateCylinder = function (name, height, diameterTop, diameterBottom, tessellation, scene, updatable) {
            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation);

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

        // Plane & ground
        Mesh.CreatePlane = function (name, size, scene, updatable) {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        };

        Mesh.CreateGround = function (name, width, height, subdivisions, scene, updatable) {
            var ground = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

            return ground;
        };

        Mesh.CreateGroundFromHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
            var ground = new BABYLON.Mesh(name, scene);

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

                ground._isReady = true;
            };

            BABYLON.Tools.LoadImage(url, onload, function () {
            }, scene.database);

            ground._isReady = false;

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
