var BABYLON;
(function (BABYLON) {
    var MaterialDefines = (function () {
        function MaterialDefines() {
        }
        MaterialDefines.prototype.isEqual = function (other) {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                if (this[prop] !== other[prop]) {
                    return false;
                }
            }
            return true;
        };
        MaterialDefines.prototype.cloneTo = function (other) {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                other[prop] = this[prop];
            }
        };
        MaterialDefines.prototype.reset = function () {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                if (typeof (this[prop]) === "number") {
                    this[prop] = 0;
                }
                else {
                    this[prop] = false;
                }
            }
        };
        MaterialDefines.prototype.toString = function () {
            var result = "";
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                if (typeof (this[prop]) === "number") {
                    result += "#define " + prop + " " + this[prop] + "\n";
                }
                else if (this[prop]) {
                    result += "#define " + prop + "\n";
                }
            }
            return result;
        };
        return MaterialDefines;
    })();
    BABYLON.MaterialDefines = MaterialDefines;
    var Material = (function () {
        function Material(name, scene, doNotAdd) {
            this.name = name;
            this.checkReadyOnEveryCall = false;
            this.checkReadyOnlyOnce = false;
            this.state = "";
            this.alpha = 1.0;
            this.backFaceCulling = true;
            this.sideOrientation = Material.CounterClockWiseSideOrientation;
            this.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            this.disableDepthWrite = false;
            this.fogEnabled = true;
            this._wasPreviouslyReady = false;
            this._fillMode = Material.TriangleFillMode;
            this.pointSize = 1.0;
            this.zOffset = 0;
            this.id = name;
            this._scene = scene;
            if (!doNotAdd) {
                scene.materials.push(this);
            }
        }
        Object.defineProperty(Material, "TriangleFillMode", {
            get: function () {
                return Material._TriangleFillMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material, "WireFrameFillMode", {
            get: function () {
                return Material._WireFrameFillMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material, "PointFillMode", {
            get: function () {
                return Material._PointFillMode;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material, "ClockWiseSideOrientation", {
            get: function () {
                return Material._ClockWiseSideOrientation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material, "CounterClockWiseSideOrientation", {
            get: function () {
                return Material._CounterClockWiseSideOrientation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "wireframe", {
            get: function () {
                return this._fillMode === Material.WireFrameFillMode;
            },
            set: function (value) {
                this._fillMode = (value ? Material.WireFrameFillMode : Material.TriangleFillMode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "pointsCloud", {
            get: function () {
                return this._fillMode === Material.PointFillMode;
            },
            set: function (value) {
                this._fillMode = (value ? Material.PointFillMode : Material.TriangleFillMode);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "fillMode", {
            get: function () {
                return this._fillMode;
            },
            set: function (value) {
                this._fillMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "isFrozen", {
            get: function () {
                return this.checkReadyOnlyOnce;
            },
            enumerable: true,
            configurable: true
        });
        Material.prototype.freeze = function () {
            this.checkReadyOnlyOnce = true;
        };
        Material.prototype.unfreeze = function () {
            this.checkReadyOnlyOnce = false;
        };
        Material.prototype.isReady = function (mesh, useInstances) {
            return true;
        };
        Material.prototype.getEffect = function () {
            return this._effect;
        };
        Material.prototype.getScene = function () {
            return this._scene;
        };
        Material.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        Material.prototype.needAlphaTesting = function () {
            return false;
        };
        Material.prototype.getAlphaTestTexture = function () {
            return null;
        };
        Material.prototype.trackCreation = function (onCompiled, onError) {
        };
        Material.prototype.markDirty = function () {
            this._wasPreviouslyReady = false;
        };
        Material.prototype._preBind = function () {
            var engine = this._scene.getEngine();
            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling, this.zOffset, false, this.sideOrientation === Material.ClockWiseSideOrientation);
        };
        Material.prototype.bind = function (world, mesh) {
            this._scene._cachedMaterial = this;
            if (this.onBind) {
                this.onBind(this, mesh);
            }
            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                this._cachedDepthWriteState = engine.getDepthWrite();
                engine.setDepthWrite(false);
            }
        };
        Material.prototype.bindOnlyWorldMatrix = function (world) {
        };
        Material.prototype.unbind = function () {
            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                engine.setDepthWrite(this._cachedDepthWriteState);
            }
        };
        Material.prototype.clone = function (name) {
            return null;
        };
        Material.prototype.getBindedMeshes = function () {
            var result = new Array();
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                if (mesh.material === this) {
                    result.push(mesh);
                }
            }
            return result;
        };
        Material.prototype.dispose = function (forceDisposeEffect) {
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            var index = this._scene.materials.indexOf(this);
            if (index >= 0) {
                this._scene.materials.splice(index, 1);
            }
            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                this._scene.getEngine()._releaseEffect(this._effect);
                this._effect = null;
            }
            // Remove from meshes
            for (index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                if (mesh.material === this) {
                    mesh.material = null;
                }
            }
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        Material.prototype.copyTo = function (other) {
            other.checkReadyOnlyOnce = this.checkReadyOnlyOnce;
            other.checkReadyOnEveryCall = this.checkReadyOnEveryCall;
            other.alpha = this.alpha;
            other.fillMode = this.fillMode;
            other.backFaceCulling = this.backFaceCulling;
            other.fogEnabled = this.fogEnabled;
            other.wireframe = this.wireframe;
            other.zOffset = this.zOffset;
            other.alphaMode = this.alphaMode;
            other.sideOrientation = this.sideOrientation;
            other.disableDepthWrite = this.disableDepthWrite;
            other.pointSize = this.pointSize;
            other.pointsCloud = this.pointsCloud;
        };
        Material.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.alpha = this.alpha;
            serializationObject.id = this.id;
            serializationObject.tags = BABYLON.Tags.GetTags(this);
            serializationObject.backFaceCulling = this.backFaceCulling;
            serializationObject.checkReadyOnlyOnce = this.checkReadyOnlyOnce;
            serializationObject.disableDepthWrite = this.disableDepthWrite;
            return serializationObject;
        };
        Material.ParseMultiMaterial = function (parsedMultiMaterial, scene) {
            var multiMaterial = new BABYLON.MultiMaterial(parsedMultiMaterial.name, scene);
            multiMaterial.id = parsedMultiMaterial.id;
            BABYLON.Tags.AddTagsTo(multiMaterial, parsedMultiMaterial.tags);
            for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                var subMatId = parsedMultiMaterial.materials[matIndex];
                if (subMatId) {
                    multiMaterial.subMaterials.push(scene.getMaterialByID(subMatId));
                }
                else {
                    multiMaterial.subMaterials.push(null);
                }
            }
            return multiMaterial;
        };
        Material.Parse = function (parsedMaterial, scene, rootUrl) {
            if (!parsedMaterial.customType) {
                return BABYLON.StandardMaterial.Parse(parsedMaterial, scene, rootUrl);
            }
            var materialType = BABYLON.Tools.Instantiate(parsedMaterial.customType);
            return materialType.Parse(parsedMaterial, scene, rootUrl);
            ;
        };
        Material._TriangleFillMode = 0;
        Material._WireFrameFillMode = 1;
        Material._PointFillMode = 2;
        Material._ClockWiseSideOrientation = 0;
        Material._CounterClockWiseSideOrientation = 1;
        return Material;
    })();
    BABYLON.Material = Material;
})(BABYLON || (BABYLON = {}));
