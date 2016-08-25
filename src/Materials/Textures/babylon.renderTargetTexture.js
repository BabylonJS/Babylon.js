var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var RenderTargetTexture = (function (_super) {
        __extends(RenderTargetTexture, _super);
        function RenderTargetTexture(name, size, scene, generateMipMaps, doNotChangeAspectRatio, type, isCube, samplingMode, generateDepthBuffer, generateStencilBuffer) {
            if (doNotChangeAspectRatio === void 0) { doNotChangeAspectRatio = true; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (isCube === void 0) { isCube = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (generateDepthBuffer === void 0) { generateDepthBuffer = true; }
            if (generateStencilBuffer === void 0) { generateStencilBuffer = false; }
            _super.call(this, null, scene, !generateMipMaps);
            this.isCube = isCube;
            /**
            * Use this list to define the list of mesh you want to render.
            */
            this.renderList = new Array();
            this.renderParticles = true;
            this.renderSprites = false;
            this.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
            // Events
            /**
            * An event triggered when the texture is unbind.
            * @type {BABYLON.Observable}
            */
            this.onAfterUnbindObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering the texture
            * @type {BABYLON.Observable}
            */
            this.onBeforeRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering the texture
            * @type {BABYLON.Observable}
            */
            this.onAfterRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after the texture clear
            * @type {BABYLON.Observable}
            */
            this.onClearObservable = new BABYLON.Observable();
            this._currentRefreshId = -1;
            this._refreshRate = 1;
            this.name = name;
            this.isRenderTarget = true;
            this._size = size;
            this._generateMipMaps = generateMipMaps;
            this._doNotChangeAspectRatio = doNotChangeAspectRatio;
            if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            }
            if (isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(size, {
                    generateMipMaps: generateMipMaps,
                    samplingMode: samplingMode,
                    generateDepthBuffer: generateDepthBuffer,
                    generateStencilBuffer: generateStencilBuffer
                });
                this.coordinatesMode = BABYLON.Texture.INVCUBIC_MODE;
                this._textureMatrix = BABYLON.Matrix.Identity();
            }
            else {
                this._texture = scene.getEngine().createRenderTargetTexture(size, {
                    generateMipMaps: generateMipMaps,
                    type: type,
                    samplingMode: samplingMode,
                    generateDepthBuffer: generateDepthBuffer,
                    generateStencilBuffer: generateStencilBuffer
                });
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
        Object.defineProperty(RenderTargetTexture.prototype, "onAfterUnbind", {
            set: function (callback) {
                if (this._onAfterUnbindObserver) {
                    this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver);
                }
                this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderTargetTexture.prototype, "onBeforeRender", {
            set: function (callback) {
                if (this._onBeforeRenderObserver) {
                    this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                }
                this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderTargetTexture.prototype, "onAfterRender", {
            set: function (callback) {
                if (this._onAfterRenderObserver) {
                    this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
                }
                this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderTargetTexture.prototype, "onClear", {
            set: function (callback) {
                if (this._onClearObserver) {
                    this.onClearObservable.remove(this._onClearObserver);
                }
                this._onClearObserver = this.onClearObservable.add(callback);
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
            if (this.useCameraPostProcesses !== undefined) {
                useCameraPostProcess = this.useCameraPostProcesses;
            }
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
            // Is predicate defined?
            if (this.renderListPredicate) {
                this.renderList.splice(0); // Clear previous renderList
                var sceneMeshes = this.getScene().meshes;
                for (var index = 0; index < sceneMeshes.length; index++) {
                    var mesh = sceneMeshes[index];
                    if (this.renderListPredicate(mesh)) {
                        this.renderList.push(mesh);
                    }
                }
            }
            if (this.renderList && this.renderList.length === 0) {
                return;
            }
            // Prepare renderingManager
            this._renderingManager.reset();
            var currentRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
            var currentRenderListLength = this.renderList ? this.renderList.length : scene.getActiveMeshes().length;
            var sceneRenderId = scene.getRenderId();
            for (var meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
                var mesh = currentRenderList[meshIndex];
                if (mesh) {
                    if (!mesh.isReady()) {
                        // Reset _currentRefreshId
                        this.resetRefreshCounter();
                        continue;
                    }
                    mesh._preActivateForIntermediateRendering(sceneRenderId);
                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && ((mesh.layerMask & scene.activeCamera.layerMask) !== 0)) {
                        mesh._activate(sceneRenderId);
                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices.addCount(subMesh.indexCount, false);
                            this._renderingManager.dispatch(subMesh);
                        }
                    }
                }
            }
            if (this.isCube) {
                for (var face = 0; face < 6; face++) {
                    this.renderToTarget(face, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
                    scene.incrementRenderId();
                    scene.resetCachedMaterial();
                }
            }
            else {
                this.renderToTarget(0, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug);
            }
            this.onAfterUnbindObservable.notifyObservers(this);
            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
            }
            scene.resetCachedMaterial();
        };
        RenderTargetTexture.prototype.renderToTarget = function (faceIndex, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug) {
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
            this.onBeforeRenderObservable.notifyObservers(faceIndex);
            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            }
            else {
                engine.clear(scene.clearColor, true, true, true);
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
            this.onAfterRenderObservable.notifyObservers(faceIndex);
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
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        RenderTargetTexture.prototype.setRenderingOrder = function (renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn) {
            if (opaqueSortCompareFn === void 0) { opaqueSortCompareFn = null; }
            if (alphaTestSortCompareFn === void 0) { alphaTestSortCompareFn = null; }
            if (transparentSortCompareFn === void 0) { transparentSortCompareFn = null; }
            this._renderingManager.setRenderingOrder(renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn);
        };
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        RenderTargetTexture.prototype.setRenderingAutoClearDepthStencil = function (renderingGroupId, autoClearDepthStencil) {
            this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
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
