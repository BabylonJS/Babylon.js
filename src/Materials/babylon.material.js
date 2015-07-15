var BABYLON;
(function (BABYLON) {
    var Material = (function () {
        function Material(name, scene, doNotAdd) {
            this.name = name;
            this.checkReadyOnEveryCall = true;
            this.checkReadyOnlyOnce = false;
            this.state = "";
            this.alpha = 1.0;
            this.backFaceCulling = true;
            this.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
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
        Material.prototype._preBind = function () {
            var engine = this._scene.getEngine();
            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling, this.zOffset);
        };
        Material.prototype.bind = function (world, mesh) {
            this._scene._cachedMaterial = this;
            if (this.onBind) {
                this.onBind(this, mesh);
            }
        };
        Material.prototype.bindOnlyWorldMatrix = function (world) {
        };
        Material.prototype.unbind = function () {
        };
        Material.prototype.clone = function (name) {
            return null;
        };
        Material.prototype.dispose = function (forceDisposeEffect) {
            // Remove from scene
            var index = this._scene.materials.indexOf(this);
            this._scene.materials.splice(index, 1);
            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                this._scene.getEngine()._releaseEffect(this._effect);
                this._effect = null;
            }
            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        };
        Material._TriangleFillMode = 0;
        Material._WireFrameFillMode = 1;
        Material._PointFillMode = 2;
        return Material;
    })();
    BABYLON.Material = Material;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.material.js.map