var BABYLON;
(function (BABYLON) {
    var ReflectionProbe = (function () {
        function ReflectionProbe(name, size, scene, generateMipMaps) {
            var _this = this;
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            this.name = name;
            this._viewMatrix = BABYLON.Matrix.Identity();
            this._target = BABYLON.Vector3.Zero();
            this._add = BABYLON.Vector3.Zero();
            this.invertYAxis = false;
            this.position = BABYLON.Vector3.Zero();
            this._scene = scene;
            this._scene.reflectionProbes.push(this);
            this._renderTargetTexture = new BABYLON.RenderTargetTexture(name, size, scene, generateMipMaps, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, true);
            this._renderTargetTexture.onBeforeRenderObservable.add(function (faceIndex) {
                switch (faceIndex) {
                    case 0:
                        _this._add.copyFromFloats(1, 0, 0);
                        break;
                    case 1:
                        _this._add.copyFromFloats(-1, 0, 0);
                        break;
                    case 2:
                        _this._add.copyFromFloats(0, _this.invertYAxis ? 1 : -1, 0);
                        break;
                    case 3:
                        _this._add.copyFromFloats(0, _this.invertYAxis ? -1 : 1, 0);
                        break;
                    case 4:
                        _this._add.copyFromFloats(0, 0, 1);
                        break;
                    case 5:
                        _this._add.copyFromFloats(0, 0, -1);
                        break;
                }
                if (_this._attachedMesh) {
                    _this.position.copyFrom(_this._attachedMesh.getAbsolutePosition());
                }
                _this.position.addToRef(_this._add, _this._target);
                BABYLON.Matrix.LookAtLHToRef(_this.position, _this._target, BABYLON.Vector3.Up(), _this._viewMatrix);
                scene.setTransformMatrix(_this._viewMatrix, _this._projectionMatrix);
            });
            this._renderTargetTexture.onAfterUnbindObservable.add(function () {
                scene.updateTransformMatrix(true);
            });
            this._projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(Math.PI / 2, 1, scene.activeCamera.minZ, scene.activeCamera.maxZ);
        }
        Object.defineProperty(ReflectionProbe.prototype, "refreshRate", {
            get: function () {
                return this._renderTargetTexture.refreshRate;
            },
            set: function (value) {
                this._renderTargetTexture.refreshRate = value;
            },
            enumerable: true,
            configurable: true
        });
        ReflectionProbe.prototype.getScene = function () {
            return this._scene;
        };
        Object.defineProperty(ReflectionProbe.prototype, "cubeTexture", {
            get: function () {
                return this._renderTargetTexture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ReflectionProbe.prototype, "renderList", {
            get: function () {
                return this._renderTargetTexture.renderList;
            },
            enumerable: true,
            configurable: true
        });
        ReflectionProbe.prototype.attachToMesh = function (mesh) {
            this._attachedMesh = mesh;
        };
        ReflectionProbe.prototype.dispose = function () {
            var index = this._scene.reflectionProbes.indexOf(this);
            if (index !== -1) {
                // Remove from the scene if found 
                this._scene.reflectionProbes.splice(index, 1);
            }
            if (this._renderTargetTexture) {
                this._renderTargetTexture.dispose();
                this._renderTargetTexture = null;
            }
        };
        return ReflectionProbe;
    }());
    BABYLON.ReflectionProbe = ReflectionProbe;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.reflectionProbe.js.map