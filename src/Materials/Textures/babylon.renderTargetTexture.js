var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var RenderTargetTexture = (function (_super) {
        __extends(RenderTargetTexture, _super);
        function RenderTargetTexture(name, size, scene, generateMipMaps, doNotChangeAspectRatio, type, isCube) {
            if (doNotChangeAspectRatio === void 0) { doNotChangeAspectRatio = true; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (isCube === void 0) { isCube = false; }
            _super.call(this, null, scene, !generateMipMaps);
            this.isCube = isCube;
            this.renderList = new Array();
            this.renderParticles = true;
            this.renderSprites = false;
            this.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
            this._currentRefreshId = -1;
            this._refreshRate = 1;
            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;
            if (isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(size, { generateMipMaps: generateMipMaps });
                this.coordinatesMode = BABYLON.Texture.INVCUBIC_MODE;
                this._textureMatrix = BABYLON.Matrix.Identity();
            }
            else {
                this._texture = scene.getEngine().createRenderTargetTexture(size, { generateMipMaps: generateMipMaps, type: type });
            }
            // Rendering groups
            this._renderingManager = new BABYLON.RenderingManager(scene);
        }
        Object.defineProperty(RenderTargetTexture, "REFRESHRATE_RENDER_ONCE", {
            get: function () {
                return RenderTargetTexture._REFRESHRATE_RENDER_ONCE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderTargetTexture, "REFRESHRATE_RENDER_ONEVERYFRAME", {
            get: function () {
                return RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYFRAME;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderTargetTexture, "REFRESHRATE_RENDER_ONEVERYTWOFRAMES", {
            get: function () {
                return RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYTWOFRAMES;
            },
            enumerable: true,
            configurable: true
        });
        RenderTargetTexture.prototype.resetRefreshCounter = function () {
            this._currentRefreshId = -1;
        };
        Object.defineProperty(RenderTargetTexture.prototype, "refreshRate", {
            get: function () {
                return this._refreshRate;
            },
            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            set: function (value) {
                this._refreshRate = value;
                this.resetRefreshCounter();
            },
            enumerable: true,
            configurable: true
        });
        RenderTargetTexture.prototype._shouldRender = function () {
            if (this._currentRefreshId === -1) {
                this._currentRefreshId = 1;
                return true;
            }
            if (this.refreshRate === this._currentRefreshId) {
                this._currentRefreshId = 1;
                return true;
            }
            this._currentRefreshId++;
            return false;
        };
        RenderTargetTexture.prototype.isReady = function () {
            if (!this.getScene().renderTargetsEnabled) {
                return false;
            }
            return _super.prototype.isReady.call(this);
        };
        RenderTargetTexture.prototype.getRenderSize = function () {
            return this._size;
        };
        Object.defineProperty(RenderTargetTexture.prototype, "canRescale", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        RenderTargetTexture.prototype.scale = function (ratio) {
            var newSize = this._size * ratio;
            this.resize(newSize, this._generateMipMaps);
        };
        RenderTargetTexture.prototype.getReflectionTextureMatrix = function () {
            if (this.isCube) {
                return this._textureMatrix;
            }
            return _super.prototype.getReflectionTextureMatrix.call(this);
        };
        RenderTargetTexture.prototype.resize = function (size, generateMipMaps) {
            this.releaseInternalTexture();
            if (this.isCube) {
                this._texture = this.getScene().getEngine().createRenderTargetCubeTexture(size);
            }
            else {
                this._texture = this.getScene().getEngine().createRenderTargetTexture(size, generateMipMaps);
            }
        };
        RenderTargetTexture.prototype.render = function (useCameraPostProcess, dumpForDebug) {
            var scene = this.getScene();
            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(true));
            }
            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    this.renderList.push(scene.getMeshByID(id));
                }
                delete this._waitingRenderList;
            }
            if (this.renderList && this.renderList.length === 0) {
                return;
            }
            // Prepare renderingManager
            this._renderingManager.reset();
            var currentRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
            for (var meshIndex = 0; meshIndex < currentRenderList.length; meshIndex++) {
                var mesh = currentRenderList[meshIndex];
                if (mesh) {
                    if (!mesh.isReady()) {
                        // Reset _currentRefreshId
                        this.resetRefreshCounter();
                        continue;
                    }
                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && ((mesh.layerMask & scene.activeCamera.layerMask) !== 0)) {
                        mesh._activate(scene.getRenderId());
                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices += subMesh.indexCount;
                            this._renderingManager.dispatch(subMesh);
                        }
                    }
                }
            }
            if (this.isCube) {
                for (var face = 0; face < 6; face++) {
                    this.renderToTarget(face, currentRenderList, useCameraPostProcess, dumpForDebug);
                    scene.incrementRenderId();
                }
            }
            else {
                this.renderToTarget(0, currentRenderList, useCameraPostProcess, dumpForDebug);
            }
            if (this.onAfterUnbind) {
                this.onAfterUnbind();
            }
            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
            }
            scene.resetCachedMaterial();
        };
        RenderTargetTexture.prototype.renderToTarget = function (faceIndex, currentRenderList, useCameraPostProcess, dumpForDebug) {
            var scene = this.getScene();
            var engine = scene.getEngine();
            // Bind
            if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                if (this.isCube) {
                    engine.bindFramebuffer(this._texture, faceIndex);
                }
                else {
                    engine.bindFramebuffer(this._texture);
                }
            }
            if (this.onBeforeRender) {
                this.onBeforeRender(faceIndex);
            }
            // Clear
            if (this.onClear) {
                this.onClear(engine);
            }
            else {
                engine.clear(scene.clearColor, true, true);
            }
            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);
            if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._texture, faceIndex);
            }
            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
            if (this.onAfterRender) {
                this.onAfterRender(faceIndex);
            }
            // Dump ?
            if (dumpForDebug) {
                BABYLON.Tools.DumpFramebuffer(this._size, this._size, engine);
            }
            // Unbind
            if (!this.isCube || faceIndex === 5) {
                if (this.isCube) {
                    if (faceIndex === 5) {
                        engine.generateMipMapsForCubemap(this._texture);
                    }
                }
                engine.unBindFramebuffer(this._texture, this.isCube);
            }
        };
        RenderTargetTexture.prototype.clone = function () {
            var textureSize = this.getSize();
            var newTexture = new RenderTargetTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            newTexture.renderList = this.renderList.slice(0);
            return newTexture;
        };
        RenderTargetTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.renderTargetSize = this.getRenderSize();
            serializationObject.renderList = [];
            for (var index = 0; index < this.renderList.length; index++) {
                serializationObject.renderList.push(this.renderList[index].id);
            }
            return serializationObject;
        };
        RenderTargetTexture._REFRESHRATE_RENDER_ONCE = 0;
        RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYFRAME = 1;
        RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYTWOFRAMES = 2;
        return RenderTargetTexture;
    })(BABYLON.Texture);
    BABYLON.RenderTargetTexture = RenderTargetTexture;
})(BABYLON || (BABYLON = {}));
