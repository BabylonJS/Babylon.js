var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * Creates an instance based on a source mesh.
     */
    var InstancedMesh = (function (_super) {
        __extends(InstancedMesh, _super);
        function InstancedMesh(name, source) {
            _super.call(this, name, source.getScene());
            source.instances.push(this);
            this._sourceMesh = source;
            this.position.copyFrom(source.position);
            this.rotation.copyFrom(source.rotation);
            this.scaling.copyFrom(source.scaling);
            if (source.rotationQuaternion) {
                this.rotationQuaternion = source.rotationQuaternion.clone();
            }
            this.infiniteDistance = source.infiniteDistance;
            this.setPivotMatrix(source.getPivotMatrix());
            this.refreshBoundingInfo();
            this._syncSubMeshes();
        }
        Object.defineProperty(InstancedMesh.prototype, "receiveShadows", {
            // Methods
            get: function () {
                return this._sourceMesh.receiveShadows;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstancedMesh.prototype, "material", {
            get: function () {
                return this._sourceMesh.material;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstancedMesh.prototype, "visibility", {
            get: function () {
                return this._sourceMesh.visibility;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstancedMesh.prototype, "skeleton", {
            get: function () {
                return this._sourceMesh.skeleton;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(InstancedMesh.prototype, "renderingGroupId", {
            get: function () {
                return this._sourceMesh.renderingGroupId;
            },
            enumerable: true,
            configurable: true
        });
        InstancedMesh.prototype.getTotalVertices = function () {
            return this._sourceMesh.getTotalVertices();
        };
        Object.defineProperty(InstancedMesh.prototype, "sourceMesh", {
            get: function () {
                return this._sourceMesh;
            },
            enumerable: true,
            configurable: true
        });
        InstancedMesh.prototype.getVerticesData = function (kind, copyWhenShared) {
            return this._sourceMesh.getVerticesData(kind, copyWhenShared);
        };
        InstancedMesh.prototype.isVerticesDataPresent = function (kind) {
            return this._sourceMesh.isVerticesDataPresent(kind);
        };
        InstancedMesh.prototype.getIndices = function () {
            return this._sourceMesh.getIndices();
        };
        Object.defineProperty(InstancedMesh.prototype, "_positions", {
            get: function () {
                return this._sourceMesh._positions;
            },
            enumerable: true,
            configurable: true
        });
        InstancedMesh.prototype.refreshBoundingInfo = function () {
            var meshBB = this._sourceMesh.getBoundingInfo();
            this._boundingInfo = new BABYLON.BoundingInfo(meshBB.minimum.clone(), meshBB.maximum.clone());
            this._updateBoundingInfo();
        };
        InstancedMesh.prototype._preActivate = function () {
            if (this._currentLOD) {
                this._currentLOD._preActivate();
            }
        };
        InstancedMesh.prototype._activate = function (renderId) {
            if (this._currentLOD) {
                this._currentLOD._registerInstanceForRenderId(this, renderId);
            }
        };
        InstancedMesh.prototype.getLOD = function (camera) {
            this._currentLOD = this.sourceMesh.getLOD(this.getScene().activeCamera, this.getBoundingInfo().boundingSphere);
            if (this._currentLOD === this.sourceMesh) {
                return this;
            }
            return this._currentLOD;
        };
        InstancedMesh.prototype._syncSubMeshes = function () {
            this.releaseSubMeshes();
            if (this._sourceMesh.subMeshes) {
                for (var index = 0; index < this._sourceMesh.subMeshes.length; index++) {
                    this._sourceMesh.subMeshes[index].clone(this, this._sourceMesh);
                }
            }
        };
        InstancedMesh.prototype._generatePointsArray = function () {
            return this._sourceMesh._generatePointsArray();
        };
        // Clone
        InstancedMesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
            var result = this._sourceMesh.createInstance(name);
            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "subMeshes"], []);
            // Bounding info
            this.refreshBoundingInfo();
            // Parent
            if (newParent) {
                result.parent = newParent;
            }
            if (!doNotCloneChildren) {
                // Children
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];
                    if (mesh.parent === this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }
            result.computeWorldMatrix(true);
            return result;
        };
        // Dispoe
        InstancedMesh.prototype.dispose = function (doNotRecurse) {
            // Remove from mesh
            var index = this._sourceMesh.instances.indexOf(this);
            this._sourceMesh.instances.splice(index, 1);
            _super.prototype.dispose.call(this, doNotRecurse);
        };
        return InstancedMesh;
    }(BABYLON.AbstractMesh));
    BABYLON.InstancedMesh = InstancedMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.instancedMesh.js.map