var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Geometry = (function () {
        function Geometry(id, scene, vertexData, updatable, mesh) {
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this._totalVertices = 0;
            this._indices = [];
            this.id = id;
            this._engine = scene.getEngine();
            this._meshes = [];
            this._scene = scene;

            // vertexData
            if (vertexData) {
                this.setAllVerticesData(vertexData, updatable);
            } else {
                this._totalVertices = 0;
                this._indices = [];
            }

            // applyToMesh
            if (mesh) {
                this.applyToMesh(mesh);
            }
        }
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
        };

        Geometry.prototype.setVerticesData = function (kind, data, updatable) {
            this._vertexBuffers = this._vertexBuffers || {};

            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose();
            }

            this._vertexBuffers[kind] = new BABYLON.VertexBuffer(this._engine, data, kind, updatable, this._meshes.length === 0);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                var stride = this._vertexBuffers[kind].getStrideSize();

                this._totalVertices = data.length / stride;

                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
                    mesh._createGlobalSubMesh();
                    mesh.computeWorldMatrix(true);
                }
            }
        };

        Geometry.prototype.updateVerticesData = function (kind, data, updateExtends) {
            var vertexBuffer = this.getVertexBuffer(kind);

            if (!vertexBuffer) {
                return;
            }

            vertexBuffer.update(data);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                var extend;

                if (updateExtends) {
                    var stride = vertexBuffer.getStrideSize();
                    this._totalVertices = data.length / stride;
                    extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
                }

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    if (updateExtends) {
                        mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
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

        Geometry.prototype.getVerticesData = function (kind) {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return null;
            }
            return vertexBuffer.getData();
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
            if (!this._vertexBuffers && this._delayInfo) {
                for (var kind in this._delayInfo) {
                    result.push(kind);
                }
            } else {
                for (kind in this._vertexBuffers) {
                    result.push(kind);
                }
            }

            return result;
        };

        Geometry.prototype.setIndices = function (indices) {
            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }

            this._indices = indices;
            if (this._meshes.length !== 0 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }

            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                meshes[index]._createGlobalSubMesh();
            }
        };

        Geometry.prototype.getTotalIndices = function () {
            if (!this.isReady()) {
                return 0;
            }
            return this._indices.length;
        };

        Geometry.prototype.getIndices = function () {
            if (!this.isReady()) {
                return null;
            }
            return this._indices;
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

            if (meshes.length == 0 && shouldDispose) {
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
            } else {
                mesh._boundingInfo = this._boundingInfo;
            }
        };

        Geometry.prototype._applyToMesh = function (mesh) {
            var numOfMeshes = this._meshes.length;

            for (var kind in this._vertexBuffers) {
                if (numOfMeshes === 1) {
                    this._vertexBuffers[kind].create();
                }
                this._vertexBuffers[kind]._buffer.references = numOfMeshes;

                if (kind === BABYLON.VertexBuffer.PositionKind) {
                    mesh._resetPointsArrayCache();

                    var extend = BABYLON.Tools.ExtractMinAndMax(this._vertexBuffers[kind].getData(), 0, this._totalVertices);
                    mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

                    mesh._createGlobalSubMesh();
                }
            }

            // indexBuffer
            if (numOfMeshes === 1 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }
            if (this._indexBuffer) {
                this._indexBuffer.references = numOfMeshes;
            }
        };

        Geometry.prototype.load = function (scene, onLoaded) {
            var _this = this;
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
            }, function () {
            }, scene.database);
        };

        Geometry.prototype.dispose = function () {
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                this.releaseForMesh(meshes[index]);
            }
            this._meshes = [];

            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }
            this._vertexBuffers = [];
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

            this._boundingInfo = null; // todo: .dispose()

            var geometries = this._scene.getGeometries();
            index = geometries.indexOf(this);

            if (index > -1) {
                geometries.splice(index, 1);
            }
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

            for (var kind in this._vertexBuffers) {
                vertexData.set(this.getVerticesData(kind), kind);

                if (!stopChecking) {
                    updatable = this.getVertexBuffer(kind).isUpdatable();
                    stopChecking = !updatable;
                }
            }

            var geometry = new BABYLON.Geometry(id, this._scene, vertexData, updatable, null);

            geometry.delayLoadState = this.delayLoadState;
            geometry.delayLoadingFile = this.delayLoadingFile;
            geometry._delayLoadingFunction = this._delayLoadingFunction;

            for (kind in this._delayInfo) {
                geometry._delayInfo = geometry._delayInfo || [];
                geometry._delayInfo.push(kind);
            }

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            geometry._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            return geometry;
        };

        // Statics
        Geometry.ExtractFromMesh = function (mesh, id) {
            var geometry = mesh._geometry;

            if (!geometry) {
                return null;
            }

            return geometry.copy(id);
        };

        // from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
        // be aware Math.random() could cause collisions
        Geometry.RandomId = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return Geometry;
    })();
    BABYLON.Geometry = Geometry;

    (function (Geometry) {
        /////// Primitives //////////////////////////////////////////////
        (function (Primitives) {
            /// Abstract class
            var _Primitive = (function (_super) {
                __extends(_Primitive, _super);
                function _Primitive(id, scene, vertexData, canBeRegenerated, mesh) {
                    this._beingRegenerated = true;
                    this._canBeRegenerated = canBeRegenerated;
                    _super.call(this, id, scene, vertexData, false, mesh); // updatable = false to be sure not to update vertices
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
                return _Primitive;
            })(Geometry);
            Primitives._Primitive = _Primitive;

            var Box = (function (_super) {
                __extends(Box, _super);
                function Box(id, scene, size, canBeRegenerated, mesh) {
                    this.size = size;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Box.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateBox(this.size);
                };

                Box.prototype.copy = function (id) {
                    return new Box(id, this.getScene(), this.size, this.canBeRegenerated(), null);
                };
                return Box;
            })(_Primitive);
            Primitives.Box = Box;

            var Sphere = (function (_super) {
                __extends(Sphere, _super);
                function Sphere(id, scene, segments, diameter, canBeRegenerated, mesh) {
                    this.segments = segments;
                    this.diameter = diameter;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Sphere.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateSphere(this.segments, this.diameter);
                };

                Sphere.prototype.copy = function (id) {
                    return new Sphere(id, this.getScene(), this.segments, this.diameter, this.canBeRegenerated(), null);
                };
                return Sphere;
            })(_Primitive);
            Primitives.Sphere = Sphere;

            var Cylinder = (function (_super) {
                __extends(Cylinder, _super);
                function Cylinder(id, scene, height, diameterTop, diameterBottom, tessellation, canBeRegenerated, mesh) {
                    this.height = height;
                    this.diameterTop = diameterTop;
                    this.diameterBottom = diameterBottom;
                    this.tessellation = tessellation;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Cylinder.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateCylinder(this.height, this.diameterTop, this.diameterBottom, this.tessellation);
                };

                Cylinder.prototype.copy = function (id) {
                    return new Cylinder(id, this.getScene(), this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.canBeRegenerated(), null);
                };
                return Cylinder;
            })(_Primitive);
            Primitives.Cylinder = Cylinder;

            var Torus = (function (_super) {
                __extends(Torus, _super);
                function Torus(id, scene, diameter, thickness, tessellation, canBeRegenerated, mesh) {
                    this.diameter = diameter;
                    this.thickness = thickness;
                    this.tessellation = tessellation;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Torus.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateTorus(this.diameter, this.thickness, this.tessellation);
                };

                Torus.prototype.copy = function (id) {
                    return new Torus(id, this.getScene(), this.diameter, this.thickness, this.tessellation, this.canBeRegenerated(), null);
                };
                return Torus;
            })(_Primitive);
            Primitives.Torus = Torus;

            var Ground = (function (_super) {
                __extends(Ground, _super);
                function Ground(id, scene, width, height, subdivisions, canBeRegenerated, mesh) {
                    this.width = width;
                    this.height = height;
                    this.subdivisions = subdivisions;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Ground.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateGround(this.width, this.height, this.subdivisions);
                };

                Ground.prototype.copy = function (id) {
                    return new Ground(id, this.getScene(), this.width, this.height, this.subdivisions, this.canBeRegenerated(), null);
                };
                return Ground;
            })(_Primitive);
            Primitives.Ground = Ground;

            var Plane = (function (_super) {
                __extends(Plane, _super);
                function Plane(id, scene, size, canBeRegenerated, mesh) {
                    this.size = size;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                Plane.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreatePlane(this.size);
                };

                Plane.prototype.copy = function (id) {
                    return new Plane(id, this.getScene(), this.size, this.canBeRegenerated(), null);
                };
                return Plane;
            })(_Primitive);
            Primitives.Plane = Plane;

            var TorusKnot = (function (_super) {
                __extends(TorusKnot, _super);
                function TorusKnot(id, scene, radius, tube, radialSegments, tubularSegments, p, q, canBeRegenerated, mesh) {
                    this.radius = radius;
                    this.tube = tube;
                    this.radialSegments = radialSegments;
                    this.tubularSegments = tubularSegments;
                    this.p = p;
                    this.q = q;

                    _super.call(this, id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
                }
                TorusKnot.prototype._regenerateVertexData = function () {
                    return BABYLON.VertexData.CreateTorusKnot(this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q);
                };

                TorusKnot.prototype.copy = function (id) {
                    return new TorusKnot(id, this.getScene(), this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.canBeRegenerated(), null);
                };
                return TorusKnot;
            })(_Primitive);
            Primitives.TorusKnot = TorusKnot;
        })(Geometry.Primitives || (Geometry.Primitives = {}));
        var Primitives = Geometry.Primitives;
    })(BABYLON.Geometry || (BABYLON.Geometry = {}));
    var Geometry = BABYLON.Geometry;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.geometry.js.map
