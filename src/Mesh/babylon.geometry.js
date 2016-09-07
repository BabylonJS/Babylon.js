var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Geometry = (function () {
        function Geometry(id, scene, vertexData, updatable, mesh) {
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this._totalVertices = 0;
            this._isDisposed = false;
            this.id = id;
            this._engine = scene.getEngine();
            this._meshes = [];
            this._scene = scene;
            //Init vertex buffer cache
            this._vertexBuffers = {};
            this._indices = [];
            // vertexData
            if (vertexData) {
                this.setAllVerticesData(vertexData, updatable);
            }
            else {
                this._totalVertices = 0;
                this._indices = [];
            }
            // applyToMesh
            if (mesh) {
                if (mesh instanceof BABYLON.LinesMesh) {
                    this.boundingBias = new BABYLON.Vector2(0, mesh.intersectionThreshold);
                    this.updateExtend();
                }
                this.applyToMesh(mesh);
                mesh.computeWorldMatrix(true);
            }
        }
        Object.defineProperty(Geometry.prototype, "boundingBias", {
            /**
             *  The Bias Vector to apply on the bounding elements (box/sphere), the max extend is computed as v += v * bias.x + bias.y, the min is computed as v -= v * bias.x + bias.y
             * @returns The Bias Vector
             */
            get: function () {
                return this._boundingBias;
            },
            set: function (value) {
                if (this._boundingBias && this._boundingBias.equals(value)) {
                    return;
                }
                this._boundingBias = value.clone();
                this.updateBoundingInfo(true, null);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "extend", {
            get: function () {
                return this._extend;
            },
            enumerable: true,
            configurable: true
        });
        Geometry.prototype.getScene = function () {
            return this._scene;
        };
        Geometry.prototype.getEngine = function () {
            return this._engine;
        };
        Geometry.prototype.isReady = function () {
            return this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADED || this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NONE;
        };
        Geometry.prototype.setAllVerticesData = function (vertexData, updatable) {
            vertexData.applyToGeometry(this, updatable);
            this.notifyUpdate();
        };
        Geometry.prototype.setVerticesData = function (kind, data, updatable, stride) {
            var buffer = new BABYLON.VertexBuffer(this._engine, data, kind, updatable, this._meshes.length === 0, stride);
            this.setVerticesBuffer(buffer);
        };
        Geometry.prototype.setVerticesBuffer = function (buffer) {
            var kind = buffer.getKind();
            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose();
            }
            this._vertexBuffers[kind] = buffer;
            if (kind === BABYLON.VertexBuffer.PositionKind) {
                var data = buffer.getData();
                var stride = buffer.getStrideSize();
                this._totalVertices = data.length / stride;
                this.updateExtend(data, stride);
                var meshes = this._meshes;
                var numOfMeshes = meshes.length;
                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    mesh._boundingInfo = new BABYLON.BoundingInfo(this._extend.minimum, this._extend.maximum);
                    mesh._createGlobalSubMesh();
                    mesh.computeWorldMatrix(true);
                }
            }
            this.notifyUpdate(kind);
        };
        Geometry.prototype.updateVerticesDataDirectly = function (kind, data, offset) {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return;
            }
            vertexBuffer.updateDirectly(data, offset);
            this.notifyUpdate(kind);
        };
        Geometry.prototype.updateVerticesData = function (kind, data, updateExtends) {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return;
            }
            vertexBuffer.update(data);
            if (kind === BABYLON.VertexBuffer.PositionKind) {
                var stride = vertexBuffer.getStrideSize();
                this._totalVertices = data.length / stride;
                this.updateBoundingInfo(updateExtends, data);
            }
            this.notifyUpdate(kind);
        };
        Geometry.prototype.updateBoundingInfo = function (updateExtends, data) {
            if (updateExtends) {
                this.updateExtend(data);
            }
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;
            for (var index = 0; index < numOfMeshes; index++) {
                var mesh = meshes[index];
                mesh._resetPointsArrayCache();
                if (updateExtends) {
                    mesh._boundingInfo = new BABYLON.BoundingInfo(this._extend.minimum, this._extend.maximum);
                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];
                        subMesh.refreshBoundingInfo();
                    }
                }
            }
        };
        Geometry.prototype.getTotalVertices = function () {
            if (!this.isReady()) {
                return 0;
            }
            return this._totalVertices;
        };
        Geometry.prototype.getVerticesData = function (kind, copyWhenShared) {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return null;
            }
            var orig = vertexBuffer.getData();
            if (!copyWhenShared || this._meshes.length === 1) {
                return orig;
            }
            else {
                var len = orig.length;
                var copy = [];
                for (var i = 0; i < len; i++) {
                    copy.push(orig[i]);
                }
                return copy;
            }
        };
        Geometry.prototype.getVertexBuffer = function (kind) {
            if (!this.isReady()) {
                return null;
            }
            return this._vertexBuffers[kind];
        };
        Geometry.prototype.getVertexBuffers = function () {
            if (!this.isReady()) {
                return null;
            }
            return this._vertexBuffers;
        };
        Geometry.prototype.isVerticesDataPresent = function (kind) {
            if (!this._vertexBuffers) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._vertexBuffers[kind] !== undefined;
        };
        Geometry.prototype.getVerticesDataKinds = function () {
            var result = [];
            var kind;
            if (!this._vertexBuffers && this._delayInfo) {
                for (kind in this._delayInfo) {
                    result.push(kind);
                }
            }
            else {
                for (kind in this._vertexBuffers) {
                    result.push(kind);
                }
            }
            return result;
        };
        Geometry.prototype.setIndices = function (indices, totalVertices) {
            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }
            this._indices = indices;
            if (this._meshes.length !== 0 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }
            if (totalVertices !== undefined) {
                this._totalVertices = totalVertices;
            }
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;
            for (var index = 0; index < numOfMeshes; index++) {
                meshes[index]._createGlobalSubMesh();
            }
            this.notifyUpdate();
        };
        Geometry.prototype.getTotalIndices = function () {
            if (!this.isReady()) {
                return 0;
            }
            return this._indices.length;
        };
        Geometry.prototype.getIndices = function (copyWhenShared) {
            if (!this.isReady()) {
                return null;
            }
            var orig = this._indices;
            if (!copyWhenShared || this._meshes.length === 1) {
                return orig;
            }
            else {
                var len = orig.length;
                var copy = [];
                for (var i = 0; i < len; i++) {
                    copy.push(orig[i]);
                }
                return copy;
            }
        };
        Geometry.prototype.getIndexBuffer = function () {
            if (!this.isReady()) {
                return null;
            }
            return this._indexBuffer;
        };
        Geometry.prototype.releaseForMesh = function (mesh, shouldDispose) {
            var meshes = this._meshes;
            var index = meshes.indexOf(mesh);
            if (index === -1) {
                return;
            }
            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }
            if (this._indexBuffer && this._engine._releaseBuffer(this._indexBuffer)) {
                this._indexBuffer = null;
            }
            meshes.splice(index, 1);
            mesh._geometry = null;
            if (meshes.length === 0 && shouldDispose) {
                this.dispose();
            }
        };
        Geometry.prototype.applyToMesh = function (mesh) {
            if (mesh._geometry === this) {
                return;
            }
            var previousGeometry = mesh._geometry;
            if (previousGeometry) {
                previousGeometry.releaseForMesh(mesh);
            }
            var meshes = this._meshes;
            // must be done before setting vertexBuffers because of mesh._createGlobalSubMesh()
            mesh._geometry = this;
            this._scene.pushGeometry(this);
            meshes.push(mesh);
            if (this.isReady()) {
                this._applyToMesh(mesh);
            }
            else {
                mesh._boundingInfo = this._boundingInfo;
            }
        };
        Geometry.prototype.updateExtend = function (data, stride) {
            if (data === void 0) { data = null; }
            if (!data) {
                data = this._vertexBuffers[BABYLON.VertexBuffer.PositionKind].getData();
            }
            this._extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices, this.boundingBias, stride);
        };
        Geometry.prototype._applyToMesh = function (mesh) {
            var numOfMeshes = this._meshes.length;
            // vertexBuffers
            for (var kind in this._vertexBuffers) {
                if (numOfMeshes === 1) {
                    this._vertexBuffers[kind].create();
                }
                this._vertexBuffers[kind].getBuffer().references = numOfMeshes;
                if (kind === BABYLON.VertexBuffer.PositionKind) {
                    mesh._resetPointsArrayCache();
                    if (!this._extend) {
                        this.updateExtend(this._vertexBuffers[kind].getData());
                    }
                    mesh._boundingInfo = new BABYLON.BoundingInfo(this._extend.minimum, this._extend.maximum);
                    mesh._createGlobalSubMesh();
                    //bounding info was just created again, world matrix should be applied again.
                    mesh._updateBoundingInfo();
                }
            }
            // indexBuffer
            if (numOfMeshes === 1 && this._indices && this._indices.length > 0) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }
            if (this._indexBuffer) {
                this._indexBuffer.references = numOfMeshes;
            }
        };
        Geometry.prototype.notifyUpdate = function (kind) {
            if (this.onGeometryUpdated) {
                this.onGeometryUpdated(this, kind);
            }
        };
        Geometry.prototype.load = function (scene, onLoaded) {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return;
            }
            if (this.isReady()) {
                if (onLoaded) {
                    onLoaded();
                }
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;
            this._queueLoad(scene, onLoaded);
        };
        Geometry.prototype._queueLoad = function (scene, onLoaded) {
            var _this = this;
            scene._addPendingData(this);
            BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                _this._delayLoadingFunction(JSON.parse(data), _this);
                _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                _this._delayInfo = [];
                scene._removePendingData(_this);
                var meshes = _this._meshes;
                var numOfMeshes = meshes.length;
                for (var index = 0; index < numOfMeshes; index++) {
                    _this._applyToMesh(meshes[index]);
                }
                if (onLoaded) {
                    onLoaded();
                }
            }, function () { }, scene.database);
        };
        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         */
        Geometry.prototype.toLeftHanded = function () {
            // Flip faces
            var tIndices = this.getIndices(false);
            if (tIndices != null && tIndices.length > 0) {
                for (var i = 0; i < tIndices.length; i += 3) {
                    var tTemp = tIndices[i + 0];
                    tIndices[i + 0] = tIndices[i + 2];
                    tIndices[i + 2] = tTemp;
                }
                this.setIndices(tIndices);
            }
            // Negate position.z
            var tPositions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind, false);
            if (tPositions != null && tPositions.length > 0) {
                for (var i = 0; i < tPositions.length; i += 3) {
                    tPositions[i + 2] = -tPositions[i + 2];
                }
                this.setVerticesData(BABYLON.VertexBuffer.PositionKind, tPositions, false);
            }
            // Negate normal.z
            var tNormals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind, false);
            if (tNormals != null && tNormals.length > 0) {
                for (var i = 0; i < tNormals.length; i += 3) {
                    tNormals[i + 2] = -tNormals[i + 2];
                }
                this.setVerticesData(BABYLON.VertexBuffer.NormalKind, tNormals, false);
            }
        };
        Geometry.prototype.isDisposed = function () {
            return this._isDisposed;
        };
        Geometry.prototype.dispose = function () {
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;
            var index;
            for (index = 0; index < numOfMeshes; index++) {
                this.releaseForMesh(meshes[index]);
            }
            this._meshes = [];
            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }
            this._vertexBuffers = {};
            this._totalVertices = 0;
            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }
            this._indexBuffer = null;
            this._indices = [];
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.delayLoadingFile = null;
            this._delayLoadingFunction = null;
            this._delayInfo = [];
            this._boundingInfo = null;
            this._scene.removeGeometry(this);
            this._isDisposed = true;
        };
        Geometry.prototype.copy = function (id) {
            var vertexData = new BABYLON.VertexData();
            vertexData.indices = [];
            var indices = this.getIndices();
            for (var index = 0; index < indices.length; index++) {
                vertexData.indices.push(indices[index]);
            }
            var updatable = false;
            var stopChecking = false;
            var kind;
            for (kind in this._vertexBuffers) {
                // using slice() to make a copy of the array and not just reference it
                var data = this.getVerticesData(kind);
                if (data instanceof Float32Array) {
                    vertexData.set(new Float32Array(data), kind);
                }
                else {
                    vertexData.set(data.slice(0), kind);
                }
                if (!stopChecking) {
                    updatable = this.getVertexBuffer(kind).isUpdatable();
                    stopChecking = !updatable;
                }
            }
            var geometry = new Geometry(id, this._scene, vertexData, updatable, null);
            geometry.delayLoadState = this.delayLoadState;
            geometry.delayLoadingFile = this.delayLoadingFile;
            geometry._delayLoadingFunction = this._delayLoadingFunction;
            for (kind in this._delayInfo) {
                geometry._delayInfo = geometry._delayInfo || [];
                geometry._delayInfo.push(kind);
            }
            // Bounding info
            geometry._boundingInfo = new BABYLON.BoundingInfo(this._extend.minimum, this._extend.maximum);
            return geometry;
        };
        Geometry.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.id = this.id;
            if (BABYLON.Tags.HasTags(this)) {
                serializationObject.tags = BABYLON.Tags.GetTags(this);
            }
            return serializationObject;
        };
        Geometry.prototype.serializeVerticeData = function () {
            var serializationObject = this.serialize();
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                serializationObject.positions = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                serializationObject.normals = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                serializationObject.uvs = this.getVerticesData(BABYLON.VertexBuffer.UVKind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                serializationObject.uvs2 = this.getVerticesData(BABYLON.VertexBuffer.UV2Kind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UV3Kind)) {
                serializationObject.uvs3 = this.getVerticesData(BABYLON.VertexBuffer.UV3Kind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UV4Kind)) {
                serializationObject.uvs4 = this.getVerticesData(BABYLON.VertexBuffer.UV4Kind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UV5Kind)) {
                serializationObject.uvs5 = this.getVerticesData(BABYLON.VertexBuffer.UV5Kind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.UV6Kind)) {
                serializationObject.uvs6 = this.getVerticesData(BABYLON.VertexBuffer.UV6Kind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                serializationObject.colors = this.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind)) {
                serializationObject.matricesIndices = this.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind);
                serializationObject.matricesIndices._isExpanded = true;
            }
            if (this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                serializationObject.matricesWeights = this.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
            }
            serializationObject.indices = this.getIndices();
            return serializationObject;
        };
        // Statics
        Geometry.ExtractFromMesh = function (mesh, id) {
            var geometry = mesh._geometry;
            if (!geometry) {
                return null;
            }
            return geometry.copy(id);
        };
        /**
         * You should now use Tools.RandomId(), this method is still here for legacy reasons.
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        Geometry.RandomId = function () {
            return BABYLON.Tools.RandomId();
        };
        Geometry.ImportGeometry = function (parsedGeometry, mesh) {
            var scene = mesh.getScene();
            // Geometry
            var geometryId = parsedGeometry.geometryId;
            if (geometryId) {
                var geometry = scene.getGeometryByID(geometryId);
                if (geometry) {
                    geometry.applyToMesh(mesh);
                }
            }
            else if (parsedGeometry instanceof ArrayBuffer) {
                var binaryInfo = mesh._binaryInfo;
                if (binaryInfo.positionsAttrDesc && binaryInfo.positionsAttrDesc.count > 0) {
                    var positionsData = new Float32Array(parsedGeometry, binaryInfo.positionsAttrDesc.offset, binaryInfo.positionsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positionsData, false);
                }
                if (binaryInfo.normalsAttrDesc && binaryInfo.normalsAttrDesc.count > 0) {
                    var normalsData = new Float32Array(parsedGeometry, binaryInfo.normalsAttrDesc.offset, binaryInfo.normalsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normalsData, false);
                }
                if (binaryInfo.uvsAttrDesc && binaryInfo.uvsAttrDesc.count > 0) {
                    var uvsData = new Float32Array(parsedGeometry, binaryInfo.uvsAttrDesc.offset, binaryInfo.uvsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvsData, false);
                }
                if (binaryInfo.uvs2AttrDesc && binaryInfo.uvs2AttrDesc.count > 0) {
                    var uvs2Data = new Float32Array(parsedGeometry, binaryInfo.uvs2AttrDesc.offset, binaryInfo.uvs2AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs2Data, false);
                }
                if (binaryInfo.uvs3AttrDesc && binaryInfo.uvs3AttrDesc.count > 0) {
                    var uvs3Data = new Float32Array(parsedGeometry, binaryInfo.uvs3AttrDesc.offset, binaryInfo.uvs3AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV3Kind, uvs3Data, false);
                }
                if (binaryInfo.uvs4AttrDesc && binaryInfo.uvs4AttrDesc.count > 0) {
                    var uvs4Data = new Float32Array(parsedGeometry, binaryInfo.uvs4AttrDesc.offset, binaryInfo.uvs4AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV4Kind, uvs4Data, false);
                }
                if (binaryInfo.uvs5AttrDesc && binaryInfo.uvs5AttrDesc.count > 0) {
                    var uvs5Data = new Float32Array(parsedGeometry, binaryInfo.uvs5AttrDesc.offset, binaryInfo.uvs5AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV5Kind, uvs5Data, false);
                }
                if (binaryInfo.uvs6AttrDesc && binaryInfo.uvs6AttrDesc.count > 0) {
                    var uvs6Data = new Float32Array(parsedGeometry, binaryInfo.uvs6AttrDesc.offset, binaryInfo.uvs6AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV6Kind, uvs6Data, false);
                }
                if (binaryInfo.colorsAttrDesc && binaryInfo.colorsAttrDesc.count > 0) {
                    var colorsData = new Float32Array(parsedGeometry, binaryInfo.colorsAttrDesc.offset, binaryInfo.colorsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colorsData, false, binaryInfo.colorsAttrDesc.stride);
                }
                if (binaryInfo.matricesIndicesAttrDesc && binaryInfo.matricesIndicesAttrDesc.count > 0) {
                    var matricesIndicesData = new Int32Array(parsedGeometry, binaryInfo.matricesIndicesAttrDesc.offset, binaryInfo.matricesIndicesAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, matricesIndicesData, false);
                }
                if (binaryInfo.matricesWeightsAttrDesc && binaryInfo.matricesWeightsAttrDesc.count > 0) {
                    var matricesWeightsData = new Float32Array(parsedGeometry, binaryInfo.matricesWeightsAttrDesc.offset, binaryInfo.matricesWeightsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, matricesWeightsData, false);
                }
                if (binaryInfo.indicesAttrDesc && binaryInfo.indicesAttrDesc.count > 0) {
                    var indicesData = new Int32Array(parsedGeometry, binaryInfo.indicesAttrDesc.offset, binaryInfo.indicesAttrDesc.count);
                    mesh.setIndices(indicesData);
                }
                if (binaryInfo.subMeshesAttrDesc && binaryInfo.subMeshesAttrDesc.count > 0) {
                    var subMeshesData = new Int32Array(parsedGeometry, binaryInfo.subMeshesAttrDesc.offset, binaryInfo.subMeshesAttrDesc.count * 5);
                    mesh.subMeshes = [];
                    for (var i = 0; i < binaryInfo.subMeshesAttrDesc.count; i++) {
                        var materialIndex = subMeshesData[(i * 5) + 0];
                        var verticesStart = subMeshesData[(i * 5) + 1];
                        var verticesCount = subMeshesData[(i * 5) + 2];
                        var indexStart = subMeshesData[(i * 5) + 3];
                        var indexCount = subMeshesData[(i * 5) + 4];
                        var subMesh = new BABYLON.SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh);
                    }
                }
            }
            else if (parsedGeometry.positions && parsedGeometry.normals && parsedGeometry.indices) {
                mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, parsedGeometry.positions, false);
                mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, parsedGeometry.normals, false);
                if (parsedGeometry.uvs) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, parsedGeometry.uvs, false);
                }
                if (parsedGeometry.uvs2) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, parsedGeometry.uvs2, false);
                }
                if (parsedGeometry.uvs3) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV3Kind, parsedGeometry.uvs3, false);
                }
                if (parsedGeometry.uvs4) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV4Kind, parsedGeometry.uvs4, false);
                }
                if (parsedGeometry.uvs5) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV5Kind, parsedGeometry.uvs5, false);
                }
                if (parsedGeometry.uvs6) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV6Kind, parsedGeometry.uvs6, false);
                }
                if (parsedGeometry.colors) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, BABYLON.Color4.CheckColors4(parsedGeometry.colors, parsedGeometry.positions.length / 3), false);
                }
                if (parsedGeometry.matricesIndices) {
                    if (!parsedGeometry.matricesIndices._isExpanded) {
                        var floatIndices = [];
                        for (var i = 0; i < parsedGeometry.matricesIndices.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndices[i];
                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, floatIndices, false);
                    }
                    else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, parsedGeometry.matricesIndices, false);
                    }
                }
                if (parsedGeometry.matricesIndicesExtra) {
                    if (!parsedGeometry.matricesIndicesExtra._isExpanded) {
                        var floatIndices = [];
                        for (var i = 0; i < parsedGeometry.matricesIndicesExtra.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndicesExtra[i];
                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, floatIndices, false);
                    }
                    else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, parsedGeometry.matricesIndicesExtra, false);
                    }
                }
                if (parsedGeometry.matricesWeights) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, parsedGeometry.matricesWeights, false);
                }
                if (parsedGeometry.matricesWeightsExtra) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsExtraKind, parsedGeometry.matricesWeightsExtra, false);
                }
                mesh.setIndices(parsedGeometry.indices);
            }
            // SubMeshes
            if (parsedGeometry.subMeshes) {
                mesh.subMeshes = [];
                for (var subIndex = 0; subIndex < parsedGeometry.subMeshes.length; subIndex++) {
                    var parsedSubMesh = parsedGeometry.subMeshes[subIndex];
                    var subMesh = new BABYLON.SubMesh(parsedSubMesh.materialIndex, parsedSubMesh.verticesStart, parsedSubMesh.verticesCount, parsedSubMesh.indexStart, parsedSubMesh.indexCount, mesh);
                }
            }
            // Flat shading
            if (mesh._shouldGenerateFlatShading) {
                mesh.convertToFlatShadedMesh();
                delete mesh._shouldGenerateFlatShading;
            }
            // Update
            mesh.computeWorldMatrix(true);
            // Octree
            if (scene['_selectionOctree']) {
                scene['_selectionOctree'].addMesh(mesh);
            }
        };
        Geometry.Parse = function (parsedVertexData, scene, rootUrl) {
            if (scene.getGeometryByID(parsedVertexData.id)) {
                return null; // null since geometry could be something else than a box...
            }
            var geometry = new Geometry(parsedVertexData.id, scene);
            BABYLON.Tags.AddTagsTo(geometry, parsedVertexData.tags);
            if (parsedVertexData.delayLoadingFile) {
                geometry.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                geometry.delayLoadingFile = rootUrl + parsedVertexData.delayLoadingFile;
                geometry._boundingInfo = new BABYLON.BoundingInfo(BABYLON.Vector3.FromArray(parsedVertexData.boundingBoxMinimum), BABYLON.Vector3.FromArray(parsedVertexData.boundingBoxMaximum));
                geometry._delayInfo = [];
                if (parsedVertexData.hasUVs) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UVKind);
                }
                if (parsedVertexData.hasUVs2) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (parsedVertexData.hasUVs3) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV3Kind);
                }
                if (parsedVertexData.hasUVs4) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV4Kind);
                }
                if (parsedVertexData.hasUVs5) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV5Kind);
                }
                if (parsedVertexData.hasUVs6) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV6Kind);
                }
                if (parsedVertexData.hasColors) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.ColorKind);
                }
                if (parsedVertexData.hasMatricesIndices) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                }
                if (parsedVertexData.hasMatricesWeights) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                }
                geometry._delayLoadingFunction = BABYLON.VertexData.ImportVertexData;
            }
            else {
                BABYLON.VertexData.ImportVertexData(parsedVertexData, geometry);
            }
            scene.pushGeometry(geometry, true);
            return geometry;
        };
        return Geometry;
    }());
    BABYLON.Geometry = Geometry;
    /////// Primitives //////////////////////////////////////////////
    var Geometry;
    (function (Geometry) {
        var Primitives;
        (function (Primitives) {
            /// Abstract class
            var _Primitive = (function (_super) {
                __extends(_Primitive, _super);
                function _Primitive(id, scene, _canBeRegenerated, mesh) {
                    _super.call(this, id, scene, null, false, mesh); // updatable = false to be sure not to update vertices
                    this._canBeRegenerated = _canBeRegenerated;
                    this._beingRegenerated = true;
                    this.regenerate();
                    this._beingRegenerated = false;
                }
                _Primitive.prototype.canBeRegenerated = function () {
                    return this._canBeRegenerated;
                };
                _Primitive.prototype.regenerate = function () {
                    if (!this._canBeRegenerated) {
                        return;
                    }
                    this._beingRegenerated = true;
                    this.setAllVerticesData(this._regenerateVertexData(), false);
                    this._beingRegenerated = false;
                };
                _Primitive.prototype.asNewGeometry = function (id) {
                    return _super.prototype.copy.call(this, id);
                };
                // overrides
                _Primitive.prototype.setAllVerticesData = function (vertexData, updatable) {
                    if (!this._beingRegenerated) {
                        return;
                    }
                    _super.prototype.setAllVerticesData.call(this, vertexData, false);
                };
                _Primitive.prototype.setVerticesData = function (kind, data, updatable) {
                    if (!this._beingRegenerated) {
                        return;
                    }
                    _super.prototype.setVerticesData.call(this, kind, data, false);
                };
                // to override
                // protected
                _Primitive.prototype._regenerateVertexData = function () {
                    throw new Error("Abstract method");
                };
                _Primitive.prototype.copy = function (id) {
                    throw new Error("Must be overriden in sub-classes.");
                };
                _Primitive.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.canBeRegenerated = this.canBeRegenerated();
                    return serializationObject;
                };
                return _Primitive;
            }(Geometry));
            Primitives._Primitive = _Primitive;
            var Ribbon = (function (_super) {
                __extends(Ribbon, _super);
                // Members
                function Ribbon(id, scene, pathArray, closeArray, closePath, offset, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.pathArray = pathArray;
                    this.closeArray = closeArray;
                    this.closePath = closePath;
                    this.offset = offset;
                    this.side = side;
                }
                Ribbon.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateRibbon({ pathArray: this.pathArray, closeArray: this.closeArray, closePath: this.closePath, offset: this.offset, sideOrientation: this.side });
                };
                Ribbon.prototype.copy = function (id) {
                    return new Ribbon(id, this.getScene(), this.pathArray, this.closeArray, this.closePath, this.offset, this.canBeRegenerated(), null, this.side);
                };
                return Ribbon;
            }(_Primitive));
            Primitives.Ribbon = Ribbon;
            var Box = (function (_super) {
                __extends(Box, _super);
                // Members
                function Box(id, scene, size, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.size = size;
                    this.side = side;
                }
                Box.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateBox({ size: this.size, sideOrientation: this.side });
                };
                Box.prototype.copy = function (id) {
                    return new Box(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
                };
                Box.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.size = this.size;
                    return serializationObject;
                };
                Box.Parse = function (parsedBox, scene) {
                    if (scene.getGeometryByID(parsedBox.id)) {
                        return null; // null since geometry could be something else than a box...
                    }
                    var box = new Geometry.Primitives.Box(parsedBox.id, scene, parsedBox.size, parsedBox.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(box, parsedBox.tags);
                    scene.pushGeometry(box, true);
                    return box;
                };
                return Box;
            }(_Primitive));
            Primitives.Box = Box;
            var Sphere = (function (_super) {
                __extends(Sphere, _super);
                function Sphere(id, scene, segments, diameter, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.segments = segments;
                    this.diameter = diameter;
                    this.side = side;
                }
                Sphere.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateSphere({ segments: this.segments, diameter: this.diameter, sideOrientation: this.side });
                };
                Sphere.prototype.copy = function (id) {
                    return new Sphere(id, this.getScene(), this.segments, this.diameter, this.canBeRegenerated(), null, this.side);
                };
                Sphere.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.segments = this.segments;
                    serializationObject.diameter = this.diameter;
                    return serializationObject;
                };
                Sphere.Parse = function (parsedSphere, scene) {
                    if (scene.getGeometryByID(parsedSphere.id)) {
                        return null; // null since geometry could be something else than a sphere...
                    }
                    var sphere = new Geometry.Primitives.Sphere(parsedSphere.id, scene, parsedSphere.segments, parsedSphere.diameter, parsedSphere.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(sphere, parsedSphere.tags);
                    scene.pushGeometry(sphere, true);
                    return sphere;
                };
                return Sphere;
            }(_Primitive));
            Primitives.Sphere = Sphere;
            var Disc = (function (_super) {
                __extends(Disc, _super);
                // Members
                function Disc(id, scene, radius, tessellation, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.radius = radius;
                    this.tessellation = tessellation;
                    this.side = side;
                }
                Disc.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateDisc({ radius: this.radius, tessellation: this.tessellation, sideOrientation: this.side });
                };
                Disc.prototype.copy = function (id) {
                    return new Disc(id, this.getScene(), this.radius, this.tessellation, this.canBeRegenerated(), null, this.side);
                };
                return Disc;
            }(_Primitive));
            Primitives.Disc = Disc;
            var Cylinder = (function (_super) {
                __extends(Cylinder, _super);
                function Cylinder(id, scene, height, diameterTop, diameterBottom, tessellation, subdivisions, canBeRegenerated, mesh, side) {
                    if (subdivisions === void 0) { subdivisions = 1; }
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.height = height;
                    this.diameterTop = diameterTop;
                    this.diameterBottom = diameterBottom;
                    this.tessellation = tessellation;
                    this.subdivisions = subdivisions;
                    this.side = side;
                }
                Cylinder.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateCylinder({ height: this.height, diameterTop: this.diameterTop, diameterBottom: this.diameterBottom, tessellation: this.tessellation, subdivisions: this.subdivisions, sideOrientation: this.side });
                };
                Cylinder.prototype.copy = function (id) {
                    return new Cylinder(id, this.getScene(), this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.subdivisions, this.canBeRegenerated(), null, this.side);
                };
                Cylinder.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.height = this.height;
                    serializationObject.diameterTop = this.diameterTop;
                    serializationObject.diameterBottom = this.diameterBottom;
                    serializationObject.tessellation = this.tessellation;
                    return serializationObject;
                };
                Cylinder.Parse = function (parsedCylinder, scene) {
                    if (scene.getGeometryByID(parsedCylinder.id)) {
                        return null; // null since geometry could be something else than a cylinder...
                    }
                    var cylinder = new Geometry.Primitives.Cylinder(parsedCylinder.id, scene, parsedCylinder.height, parsedCylinder.diameterTop, parsedCylinder.diameterBottom, parsedCylinder.tessellation, parsedCylinder.subdivisions, parsedCylinder.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(cylinder, parsedCylinder.tags);
                    scene.pushGeometry(cylinder, true);
                    return cylinder;
                };
                return Cylinder;
            }(_Primitive));
            Primitives.Cylinder = Cylinder;
            var Torus = (function (_super) {
                __extends(Torus, _super);
                function Torus(id, scene, diameter, thickness, tessellation, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.diameter = diameter;
                    this.thickness = thickness;
                    this.tessellation = tessellation;
                    this.side = side;
                }
                Torus.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateTorus({ diameter: this.diameter, thickness: this.thickness, tessellation: this.tessellation, sideOrientation: this.side });
                };
                Torus.prototype.copy = function (id) {
                    return new Torus(id, this.getScene(), this.diameter, this.thickness, this.tessellation, this.canBeRegenerated(), null, this.side);
                };
                Torus.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.diameter = this.diameter;
                    serializationObject.thickness = this.thickness;
                    serializationObject.tessellation = this.tessellation;
                    return serializationObject;
                };
                Torus.Parse = function (parsedTorus, scene) {
                    if (scene.getGeometryByID(parsedTorus.id)) {
                        return null; // null since geometry could be something else than a torus...
                    }
                    var torus = new Geometry.Primitives.Torus(parsedTorus.id, scene, parsedTorus.diameter, parsedTorus.thickness, parsedTorus.tessellation, parsedTorus.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(torus, parsedTorus.tags);
                    scene.pushGeometry(torus, true);
                    return torus;
                };
                return Torus;
            }(_Primitive));
            Primitives.Torus = Torus;
            var Ground = (function (_super) {
                __extends(Ground, _super);
                function Ground(id, scene, width, height, subdivisions, canBeRegenerated, mesh) {
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.width = width;
                    this.height = height;
                    this.subdivisions = subdivisions;
                }
                Ground.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateGround({ width: this.width, height: this.height, subdivisions: this.subdivisions });
                };
                Ground.prototype.copy = function (id) {
                    return new Ground(id, this.getScene(), this.width, this.height, this.subdivisions, this.canBeRegenerated(), null);
                };
                Ground.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.width = this.width;
                    serializationObject.height = this.height;
                    serializationObject.subdivisions = this.subdivisions;
                    return serializationObject;
                };
                Ground.Parse = function (parsedGround, scene) {
                    if (scene.getGeometryByID(parsedGround.id)) {
                        return null; // null since geometry could be something else than a ground...
                    }
                    var ground = new Geometry.Primitives.Ground(parsedGround.id, scene, parsedGround.width, parsedGround.height, parsedGround.subdivisions, parsedGround.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(ground, parsedGround.tags);
                    scene.pushGeometry(ground, true);
                    return ground;
                };
                return Ground;
            }(_Primitive));
            Primitives.Ground = Ground;
            var TiledGround = (function (_super) {
                __extends(TiledGround, _super);
                function TiledGround(id, scene, xmin, zmin, xmax, zmax, subdivisions, precision, canBeRegenerated, mesh) {
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.xmin = xmin;
                    this.zmin = zmin;
                    this.xmax = xmax;
                    this.zmax = zmax;
                    this.subdivisions = subdivisions;
                    this.precision = precision;
                }
                TiledGround.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateTiledGround({ xmin: this.xmin, zmin: this.zmin, xmax: this.xmax, zmax: this.zmax, subdivisions: this.subdivisions, precision: this.precision });
                };
                TiledGround.prototype.copy = function (id) {
                    return new TiledGround(id, this.getScene(), this.xmin, this.zmin, this.xmax, this.zmax, this.subdivisions, this.precision, this.canBeRegenerated(), null);
                };
                return TiledGround;
            }(_Primitive));
            Primitives.TiledGround = TiledGround;
            var Plane = (function (_super) {
                __extends(Plane, _super);
                function Plane(id, scene, size, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.size = size;
                    this.side = side;
                }
                Plane.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreatePlane({ size: this.size, sideOrientation: this.side });
                };
                Plane.prototype.copy = function (id) {
                    return new Plane(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
                };
                Plane.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.size = this.size;
                    return serializationObject;
                };
                Plane.Parse = function (parsedPlane, scene) {
                    if (scene.getGeometryByID(parsedPlane.id)) {
                        return null; // null since geometry could be something else than a ground...
                    }
                    var plane = new Geometry.Primitives.Plane(parsedPlane.id, scene, parsedPlane.size, parsedPlane.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(plane, parsedPlane.tags);
                    scene.pushGeometry(plane, true);
                    return plane;
                };
                return Plane;
            }(_Primitive));
            Primitives.Plane = Plane;
            var TorusKnot = (function (_super) {
                __extends(TorusKnot, _super);
                function TorusKnot(id, scene, radius, tube, radialSegments, tubularSegments, p, q, canBeRegenerated, mesh, side) {
                    if (side === void 0) { side = BABYLON.Mesh.DEFAULTSIDE; }
                    _super.call(this, id, scene, canBeRegenerated, mesh);
                    this.radius = radius;
                    this.tube = tube;
                    this.radialSegments = radialSegments;
                    this.tubularSegments = tubularSegments;
                    this.p = p;
                    this.q = q;
                    this.side = side;
                }
                TorusKnot.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateTorusKnot({ radius: this.radius, tube: this.tube, radialSegments: this.radialSegments, tubularSegments: this.tubularSegments, p: this.p, q: this.q, sideOrientation: this.side });
                };
                TorusKnot.prototype.copy = function (id) {
                    return new TorusKnot(id, this.getScene(), this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.canBeRegenerated(), null, this.side);
                };
                TorusKnot.prototype.serialize = function () {
                    var serializationObject = _super.prototype.serialize.call(this);
                    serializationObject.radius = this.radius;
                    serializationObject.tube = this.tube;
                    serializationObject.radialSegments = this.radialSegments;
                    serializationObject.tubularSegments = this.tubularSegments;
                    serializationObject.p = this.p;
                    serializationObject.q = this.q;
                    return serializationObject;
                };
                ;
                TorusKnot.Parse = function (parsedTorusKnot, scene) {
                    if (scene.getGeometryByID(parsedTorusKnot.id)) {
                        return null; // null since geometry could be something else than a ground...
                    }
                    var torusKnot = new Geometry.Primitives.TorusKnot(parsedTorusKnot.id, scene, parsedTorusKnot.radius, parsedTorusKnot.tube, parsedTorusKnot.radialSegments, parsedTorusKnot.tubularSegments, parsedTorusKnot.p, parsedTorusKnot.q, parsedTorusKnot.canBeRegenerated, null);
                    BABYLON.Tags.AddTagsTo(torusKnot, parsedTorusKnot.tags);
                    scene.pushGeometry(torusKnot, true);
                    return torusKnot;
                };
                return TorusKnot;
            }(_Primitive));
            Primitives.TorusKnot = TorusKnot;
        })(Primitives = Geometry.Primitives || (Geometry.Primitives = {}));
    })(Geometry = BABYLON.Geometry || (BABYLON.Geometry = {}));
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.geometry.js.map