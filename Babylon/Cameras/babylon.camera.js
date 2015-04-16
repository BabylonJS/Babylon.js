var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Camera = (function (_super) {
        __extends(Camera, _super);
        function Camera(name, position, scene) {
            _super.call(this, name, scene);
            this.position = position;
            // Members
            this.upVector = BABYLON.Vector3.Up();
            this.orthoLeft = null;
            this.orthoRight = null;
            this.orthoBottom = null;
            this.orthoTop = null;
            this.fov = 0.8;
            this.minZ = 1.0;
            this.maxZ = 10000.0;
            this.inertia = 0.9;
            this.mode = Camera.PERSPECTIVE_CAMERA;
            this.isIntermediate = false;
            this.viewport = new BABYLON.Viewport(0, 0, 1.0, 1.0);
            this.subCameras = [];
            this.layerMask = 0xFFFFFFFF;
            this.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
            this._computedViewMatrix = BABYLON.Matrix.Identity();
            this._projectionMatrix = new BABYLON.Matrix();
            this._postProcesses = new Array();
            this._postProcessesTakenIndices = [];
            this._activeMeshes = new BABYLON.SmartArray(256);
            this._globalPosition = BABYLON.Vector3.Zero();
            scene.addCamera(this);
            if (!scene.activeCamera) {
                scene.activeCamera = this;
            }
        }
        Object.defineProperty(Camera, "PERSPECTIVE_CAMERA", {
            get: function () {
                return Camera._PERSPECTIVE_CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "ORTHOGRAPHIC_CAMERA", {
            get: function () {
                return Camera._ORTHOGRAPHIC_CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "FOVMODE_VERTICAL_FIXED", {
            get: function () {
                return Camera._FOVMODE_VERTICAL_FIXED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera, "FOVMODE_HORIZONTAL_FIXED", {
            get: function () {
                return Camera._FOVMODE_HORIZONTAL_FIXED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "globalPosition", {
            get: function () {
                return this._globalPosition;
            },
            enumerable: true,
            configurable: true
        });
        Camera.prototype.getActiveMeshes = function () {
            return this._activeMeshes;
        };
        Camera.prototype.isActiveMesh = function (mesh) {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        };
        //Cache
        Camera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.position = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.upVector = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this._cache.mode = undefined;
            this._cache.minZ = undefined;
            this._cache.maxZ = undefined;
            this._cache.fov = undefined;
            this._cache.aspectRatio = undefined;
            this._cache.orthoLeft = undefined;
            this._cache.orthoRight = undefined;
            this._cache.orthoBottom = undefined;
            this._cache.orthoTop = undefined;
            this._cache.renderWidth = undefined;
            this._cache.renderHeight = undefined;
        };
        Camera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            var engine = this.getEngine();
            this._cache.position.copyFrom(this.position);
            this._cache.upVector.copyFrom(this.upVector);
            this._cache.mode = this.mode;
            this._cache.minZ = this.minZ;
            this._cache.maxZ = this.maxZ;
            this._cache.fov = this.fov;
            this._cache.aspectRatio = engine.getAspectRatio(this);
            this._cache.orthoLeft = this.orthoLeft;
            this._cache.orthoRight = this.orthoRight;
            this._cache.orthoBottom = this.orthoBottom;
            this._cache.orthoTop = this.orthoTop;
            this._cache.renderWidth = engine.getRenderWidth();
            this._cache.renderHeight = engine.getRenderHeight();
        };
        Camera.prototype._updateFromScene = function () {
            this.updateCache();
            this._update();
        };
        // Synchronized
        Camera.prototype.isSynchronizedWithParent = function () {
            return false;
        };
        Camera.prototype._isSynchronized = function () {
            return this._isSynchronizedViewMatrix() && this._isSynchronizedProjectionMatrix();
        };
        Camera.prototype._isSynchronizedViewMatrix = function () {
            if (!_super.prototype._isSynchronized.call(this))
                return false;
            return this._cache.position.equals(this.position) && this._cache.upVector.equals(this.upVector) && this.isSynchronizedWithParent();
        };
        Camera.prototype._isSynchronizedProjectionMatrix = function () {
            var check = this._cache.mode === this.mode && this._cache.minZ === this.minZ && this._cache.maxZ === this.maxZ;
            if (!check) {
                return false;
            }
            var engine = this.getEngine();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                check = this._cache.fov === this.fov && this._cache.aspectRatio === engine.getAspectRatio(this);
            }
            else {
                check = this._cache.orthoLeft === this.orthoLeft && this._cache.orthoRight === this.orthoRight && this._cache.orthoBottom === this.orthoBottom && this._cache.orthoTop === this.orthoTop && this._cache.renderWidth === engine.getRenderWidth() && this._cache.renderHeight === engine.getRenderHeight();
            }
            return check;
        };
        // Controls
        Camera.prototype.attachControl = function (element) {
        };
        Camera.prototype.detachControl = function (element) {
        };
        Camera.prototype._update = function () {
        };
        Camera.prototype.attachPostProcess = function (postProcess, insertAt) {
            if (insertAt === void 0) { insertAt = null; }
            if (!postProcess.isReusable() && this._postProcesses.indexOf(postProcess) > -1) {
                BABYLON.Tools.Error("You're trying to reuse a post process not defined as reusable.");
                return 0;
            }
            if (insertAt == null || insertAt < 0) {
                this._postProcesses.push(postProcess);
                this._postProcessesTakenIndices.push(this._postProcesses.length - 1);
                return this._postProcesses.length - 1;
            }
            var add = 0;
            if (this._postProcesses[insertAt]) {
                var start = this._postProcesses.length - 1;
                for (var i = start; i >= insertAt + 1; --i) {
                    this._postProcesses[i + 1] = this._postProcesses[i];
                }
                add = 1;
            }
            for (i = 0; i < this._postProcessesTakenIndices.length; ++i) {
                if (this._postProcessesTakenIndices[i] < insertAt) {
                    continue;
                }
                start = this._postProcessesTakenIndices.length - 1;
                for (var j = start; j >= i; --j) {
                    this._postProcessesTakenIndices[j + 1] = this._postProcessesTakenIndices[j] + add;
                }
                this._postProcessesTakenIndices[i] = insertAt;
                break;
            }
            if (!add && this._postProcessesTakenIndices.indexOf(insertAt) == -1) {
                this._postProcessesTakenIndices.push(insertAt);
            }
            var result = insertAt + add;
            this._postProcesses[result] = postProcess;
            return result;
        };
        Camera.prototype.detachPostProcess = function (postProcess, atIndices) {
            if (atIndices === void 0) { atIndices = null; }
            var result = [];
            if (!atIndices) {
                var length = this._postProcesses.length;
                for (var i = 0; i < length; i++) {
                    if (this._postProcesses[i] !== postProcess) {
                        continue;
                    }
                    delete this._postProcesses[i];
                    var index = this._postProcessesTakenIndices.indexOf(i);
                    this._postProcessesTakenIndices.splice(index, 1);
                }
            }
            else {
                atIndices = (atIndices instanceof Array) ? atIndices : [atIndices];
                for (i = 0; i < atIndices.length; i++) {
                    var foundPostProcess = this._postProcesses[atIndices[i]];
                    if (foundPostProcess !== postProcess) {
                        result.push(i);
                        continue;
                    }
                    delete this._postProcesses[atIndices[i]];
                    index = this._postProcessesTakenIndices.indexOf(atIndices[i]);
                    this._postProcessesTakenIndices.splice(index, 1);
                }
            }
            return result;
        };
        Camera.prototype.getWorldMatrix = function () {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            var viewMatrix = this.getViewMatrix();
            viewMatrix.invertToRef(this._worldMatrix);
            return this._worldMatrix;
        };
        Camera.prototype._getViewMatrix = function () {
            return BABYLON.Matrix.Identity();
        };
        Camera.prototype.getViewMatrix = function () {
            this._computedViewMatrix = this._computeViewMatrix();
            if (!this.parent || !this.parent.getWorldMatrix || this.isSynchronized()) {
                this._globalPosition.copyFrom(this.position);
                return this._computedViewMatrix;
            }
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }
            this._computedViewMatrix.invertToRef(this._worldMatrix);
            this._worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._computedViewMatrix);
            this._globalPosition.copyFromFloats(this._computedViewMatrix.m[12], this._computedViewMatrix.m[13], this._computedViewMatrix.m[14]);
            this._computedViewMatrix.invert();
            this._currentRenderId = this.getScene().getRenderId();
            return this._computedViewMatrix;
        };
        Camera.prototype._computeViewMatrix = function (force) {
            if (!force && this._isSynchronizedViewMatrix()) {
                return this._computedViewMatrix;
            }
            this._computedViewMatrix = this._getViewMatrix();
            this._currentRenderId = this.getScene().getRenderId();
            return this._computedViewMatrix;
        };
        Camera.prototype.getProjectionMatrix = function (force) {
            if (!force && this._isSynchronizedProjectionMatrix()) {
                return this._projectionMatrix;
            }
            var engine = this.getEngine();
            if (this.mode === Camera.PERSPECTIVE_CAMERA) {
                if (this.minZ <= 0) {
                    this.minZ = 0.1;
                }
                BABYLON.Matrix.PerspectiveFovLHToRef(this.fov, engine.getAspectRatio(this), this.minZ, this.maxZ, this._projectionMatrix, this.fovMode);
                return this._projectionMatrix;
            }
            var halfWidth = engine.getRenderWidth() / 2.0;
            var halfHeight = engine.getRenderHeight() / 2.0;
            BABYLON.Matrix.OrthoOffCenterLHToRef(this.orthoLeft || -halfWidth, this.orthoRight || halfWidth, this.orthoBottom || -halfHeight, this.orthoTop || halfHeight, this.minZ, this.maxZ, this._projectionMatrix);
            return this._projectionMatrix;
        };
        Camera.prototype.dispose = function () {
            // Remove from scene
            this.getScene().removeCamera(this);
            for (var i = 0; i < this._postProcessesTakenIndices.length; ++i) {
                this._postProcesses[this._postProcessesTakenIndices[i]].dispose(this);
            }
        };
        // Statics
        Camera._PERSPECTIVE_CAMERA = 0;
        Camera._ORTHOGRAPHIC_CAMERA = 1;
        Camera._FOVMODE_VERTICAL_FIXED = 0;
        Camera._FOVMODE_HORIZONTAL_FIXED = 1;
        return Camera;
    })(BABYLON.Node);
    BABYLON.Camera = Camera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.camera.js.map