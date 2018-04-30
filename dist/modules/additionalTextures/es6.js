var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


import * as BABYLON from 'babylonjs/core/es6';

var BABYLON;
(function (BABYLON) {
    var CubeTexture = /** @class */ (function (_super) {
        __extends(CubeTexture, _super);
        function CubeTexture(rootUrl, scene, extensions, noMipmap, files, onLoad, onError, format, prefiltered, forcedExtension) {
            if (extensions === void 0) { extensions = null; }
            if (noMipmap === void 0) { noMipmap = false; }
            if (files === void 0) { files = null; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            if (format === void 0) { format = BABYLON.Engine.TEXTUREFORMAT_RGBA; }
            if (prefiltered === void 0) { prefiltered = false; }
            if (forcedExtension === void 0) { forcedExtension = null; }
            var _this = _super.call(this, scene) || this;
            _this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;
            _this.name = rootUrl;
            _this.url = rootUrl;
            _this._noMipmap = noMipmap;
            _this.hasAlpha = false;
            _this._format = format;
            _this._prefiltered = prefiltered;
            _this.isCube = true;
            _this._textureMatrix = BABYLON.Matrix.Identity();
            if (prefiltered) {
                _this.gammaSpace = false;
            }
            if (!rootUrl && !files) {
                return _this;
            }
            _this._texture = _this._getFromCache(rootUrl, noMipmap);
            var lastDot = rootUrl.lastIndexOf(".");
            var extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");
            var isDDS = (extension === ".dds");
            if (!files) {
                if (!isDDS && !extensions) {
                    extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
                }
                files = [];
                if (extensions) {
                    for (var index = 0; index < extensions.length; index++) {
                        files.push(rootUrl + extensions[index]);
                    }
                }
            }
            _this._files = files;
            if (!_this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    if (prefiltered) {
                        _this._texture = scene.getEngine().createPrefilteredCubeTexture(rootUrl, scene, _this.lodGenerationScale, _this.lodGenerationOffset, onLoad, onError, format, forcedExtension);
                    }
                    else {
                        _this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, files, noMipmap, onLoad, onError, _this._format, forcedExtension);
                    }
                }
                else {
                    _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
            else if (onLoad) {
                if (_this._texture.isReady) {
                    BABYLON.Tools.SetImmediate(function () { return onLoad(); });
                }
                else {
                    _this._texture.onLoadedObservable.add(onLoad);
                }
            }
            return _this;
        }
        CubeTexture.CreateFromImages = function (files, scene, noMipmap) {
            return new CubeTexture("", scene, null, noMipmap, files);
        };
        CubeTexture.CreateFromPrefilteredData = function (url, scene, forcedExtension) {
            if (forcedExtension === void 0) { forcedExtension = null; }
            return new CubeTexture(url, scene, null, false, null, null, null, undefined, true, forcedExtension);
        };
        // Methods
        CubeTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);
            if (!this._texture) {
                if (this._prefiltered) {
                    this._texture = scene.getEngine().createPrefilteredCubeTexture(this.url, scene, this.lodGenerationScale, this.lodGenerationOffset, undefined, undefined, this._format);
                }
                else {
                    this._texture = scene.getEngine().createCubeTexture(this.url, scene, this._files, this._noMipmap, undefined, undefined, this._format);
                }
            }
        };
        CubeTexture.prototype.getReflectionTextureMatrix = function () {
            return this._textureMatrix;
        };
        CubeTexture.prototype.setReflectionTextureMatrix = function (value) {
            this._textureMatrix = value;
        };
        CubeTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = BABYLON.SerializationHelper.Parse(function () {
                return new CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions);
            }, parsedTexture, scene);
            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];
                    texture.animations.push(BABYLON.Animation.Parse(parsedAnimation));
                }
            }
            return texture;
        };
        CubeTexture.prototype.clone = function () {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () {
                var scene = _this.getScene();
                if (!scene) {
                    return _this;
                }
                return new CubeTexture(_this.url, scene, _this._extensions, _this._noMipmap, _this._files);
            }, this);
        };
        return CubeTexture;
    }(BABYLON.BaseTexture));
    BABYLON.CubeTexture = CubeTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.cubeTexture.js.map


var BABYLON;
(function (BABYLON) {
    var RenderTargetTexture = /** @class */ (function (_super) {
        __extends(RenderTargetTexture, _super);
        function RenderTargetTexture(name, size, scene, generateMipMaps, doNotChangeAspectRatio, type, isCube, samplingMode, generateDepthBuffer, generateStencilBuffer, isMulti) {
            if (doNotChangeAspectRatio === void 0) { doNotChangeAspectRatio = true; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (isCube === void 0) { isCube = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (generateDepthBuffer === void 0) { generateDepthBuffer = true; }
            if (generateStencilBuffer === void 0) { generateStencilBuffer = false; }
            if (isMulti === void 0) { isMulti = false; }
            var _this = _super.call(this, null, scene, !generateMipMaps) || this;
            _this.isCube = isCube;
            /**
            * Use this list to define the list of mesh you want to render.
            */
            _this.renderList = new Array();
            _this.renderParticles = true;
            _this.renderSprites = false;
            _this.coordinatesMode = BABYLON.Texture.PROJECTION_MODE;
            _this.ignoreCameraViewport = false;
            // Events
            /**
            * An event triggered when the texture is unbind.
            * @type {BABYLON.Observable}
            */
            _this.onBeforeBindObservable = new BABYLON.Observable();
            /**
            * An event triggered when the texture is unbind.
            * @type {BABYLON.Observable}
            */
            _this.onAfterUnbindObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering the texture
            * @type {BABYLON.Observable}
            */
            _this.onBeforeRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering the texture
            * @type {BABYLON.Observable}
            */
            _this.onAfterRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after the texture clear
            * @type {BABYLON.Observable}
            */
            _this.onClearObservable = new BABYLON.Observable();
            _this._currentRefreshId = -1;
            _this._refreshRate = 1;
            _this._samples = 1;
            scene = _this.getScene();
            if (!scene) {
                return _this;
            }
            _this._engine = scene.getEngine();
            _this.name = name;
            _this.isRenderTarget = true;
            _this._initialSizeParameter = size;
            _this._processSizeParameter(size);
            _this._resizeObserver = _this.getScene().getEngine().onResizeObservable.add(function () {
            });
            _this._generateMipMaps = generateMipMaps ? true : false;
            _this._doNotChangeAspectRatio = doNotChangeAspectRatio;
            // Rendering groups
            _this._renderingManager = new BABYLON.RenderingManager(scene);
            if (isMulti) {
                return _this;
            }
            _this._renderTargetOptions = {
                generateMipMaps: generateMipMaps,
                type: type,
                samplingMode: samplingMode,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer
            };
            if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            }
            if (isCube) {
                _this._texture = scene.getEngine().createRenderTargetCubeTexture(_this.getRenderSize(), _this._renderTargetOptions);
                _this.coordinatesMode = BABYLON.Texture.INVCUBIC_MODE;
                _this._textureMatrix = BABYLON.Matrix.Identity();
            }
            else {
                _this._texture = scene.getEngine().createRenderTargetTexture(_this._size, _this._renderTargetOptions);
            }
            return _this;
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
        Object.defineProperty(RenderTargetTexture.prototype, "renderTargetOptions", {
            get: function () {
                return this._renderTargetOptions;
            },
            enumerable: true,
            configurable: true
        });
        RenderTargetTexture.prototype._onRatioRescale = function () {
            if (this._sizeRatio) {
                this.resize(this._initialSizeParameter);
            }
        };
        RenderTargetTexture.prototype._processSizeParameter = function (size) {
            if (size.ratio) {
                this._sizeRatio = size.ratio;
                this._size = {
                    width: this._bestReflectionRenderTargetDimension(this._engine.getRenderWidth(), this._sizeRatio),
                    height: this._bestReflectionRenderTargetDimension(this._engine.getRenderHeight(), this._sizeRatio)
                };
            }
            else {
                this._size = size;
            }
        };
        Object.defineProperty(RenderTargetTexture.prototype, "samples", {
            get: function () {
                return this._samples;
            },
            set: function (value) {
                if (this._samples === value) {
                    return;
                }
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                this._samples = scene.getEngine().updateRenderTargetTextureSampleCount(this._texture, value);
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
        RenderTargetTexture.prototype.addPostProcess = function (postProcess) {
            if (!this._postProcessManager) {
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                this._postProcessManager = new BABYLON.PostProcessManager(scene);
                this._postProcesses = new Array();
            }
            this._postProcesses.push(postProcess);
            this._postProcesses[0].autoClear = false;
        };
        RenderTargetTexture.prototype.clearPostProcesses = function (dispose) {
            if (!this._postProcesses) {
                return;
            }
            if (dispose) {
                for (var _i = 0, _a = this._postProcesses; _i < _a.length; _i++) {
                    var postProcess = _a[_i];
                    postProcess.dispose();
                }
            }
            this._postProcesses = [];
        };
        RenderTargetTexture.prototype.removePostProcess = function (postProcess) {
            if (!this._postProcesses) {
                return;
            }
            var index = this._postProcesses.indexOf(postProcess);
            if (index === -1) {
                return;
            }
            this._postProcesses.splice(index, 1);
            if (this._postProcesses.length > 0) {
                this._postProcesses[0].autoClear = false;
            }
        };
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
        RenderTargetTexture.prototype.getRenderSize = function () {
            if (this._size.width) {
                return this._size.width;
            }
            return this._size;
        };
        RenderTargetTexture.prototype.getRenderWidth = function () {
            if (this._size.width) {
                return this._size.width;
            }
            return this._size;
        };
        RenderTargetTexture.prototype.getRenderHeight = function () {
            if (this._size.width) {
                return this._size.height;
            }
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
            var newSize = this.getRenderSize() * ratio;
            this.resize(newSize);
        };
        RenderTargetTexture.prototype.getReflectionTextureMatrix = function () {
            if (this.isCube) {
                return this._textureMatrix;
            }
            return _super.prototype.getReflectionTextureMatrix.call(this);
        };
        RenderTargetTexture.prototype.resize = function (size) {
            this.releaseInternalTexture();
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            this._processSizeParameter(size);
            if (this.isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions);
            }
            else {
                this._texture = scene.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions);
            }
        };
        RenderTargetTexture.prototype.render = function (useCameraPostProcess, dumpForDebug) {
            if (useCameraPostProcess === void 0) { useCameraPostProcess = false; }
            if (dumpForDebug === void 0) { dumpForDebug = false; }
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            var engine = scene.getEngine();
            if (this.useCameraPostProcesses !== undefined) {
                useCameraPostProcess = this.useCameraPostProcesses;
            }
            if (this._waitingRenderList) {
                this.renderList = [];
                for (var index = 0; index < this._waitingRenderList.length; index++) {
                    var id = this._waitingRenderList[index];
                    var mesh_1 = scene.getMeshByID(id);
                    if (mesh_1) {
                        this.renderList.push(mesh_1);
                    }
                }
                delete this._waitingRenderList;
            }
            // Is predicate defined?
            if (this.renderListPredicate) {
                if (this.renderList) {
                    this.renderList.splice(0); // Clear previous renderList
                }
                else {
                    this.renderList = [];
                }
                var scene = this.getScene();
                if (!scene) {
                    return;
                }
                var sceneMeshes = scene.meshes;
                for (var index = 0; index < sceneMeshes.length; index++) {
                    var mesh = sceneMeshes[index];
                    if (this.renderListPredicate(mesh)) {
                        this.renderList.push(mesh);
                    }
                }
            }
            this.onBeforeBindObservable.notifyObservers(this);
            // Set custom projection.
            // Needs to be before binding to prevent changing the aspect ratio.
            var camera;
            if (this.activeCamera) {
                camera = this.activeCamera;
                engine.setViewport(this.activeCamera.viewport, this.getRenderWidth(), this.getRenderHeight());
                if (this.activeCamera !== scene.activeCamera) {
                    scene.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(true));
                }
            }
            else {
                camera = scene.activeCamera;
                if (camera) {
                    engine.setViewport(camera.viewport, this.getRenderWidth(), this.getRenderHeight());
                }
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
                    var isMasked = void 0;
                    if (!this.renderList && camera) {
                        isMasked = ((mesh.layerMask & camera.layerMask) === 0);
                    }
                    else {
                        isMasked = false;
                    }
                    if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && !isMasked) {
                        mesh._activate(sceneRenderId);
                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            scene._activeIndices.addCount(subMesh.indexCount, false);
                            this._renderingManager.dispatch(subMesh, mesh);
                        }
                    }
                }
            }
            for (var particleIndex = 0; particleIndex < scene.particleSystems.length; particleIndex++) {
                var particleSystem = scene.particleSystems[particleIndex];
                var emitter = particleSystem.emitter;
                if (!particleSystem.isStarted() || !emitter || !emitter.position || !emitter.isEnabled()) {
                    continue;
                }
                if (currentRenderList.indexOf(emitter) >= 0) {
                    this._renderingManager.dispatchParticles(particleSystem);
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
            if (scene.activeCamera) {
                if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                    scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
                }
                engine.setViewport(scene.activeCamera.viewport);
            }
            scene.resetCachedMaterial();
        };
        RenderTargetTexture.prototype._bestReflectionRenderTargetDimension = function (renderDimension, scale) {
            var minimum = 128;
            var x = renderDimension * scale;
            var curved = BABYLON.Tools.NearestPOT(x + (minimum * minimum / (minimum + x)));
            // Ensure we don't exceed the render dimension (while staying POT)
            return Math.min(BABYLON.Tools.FloorPOT(renderDimension), curved);
        };
        RenderTargetTexture.prototype.unbindFrameBuffer = function (engine, faceIndex) {
            var _this = this;
            if (!this._texture) {
                return;
            }
            engine.unBindFramebuffer(this._texture, this.isCube, function () {
                _this.onAfterRenderObservable.notifyObservers(faceIndex);
            });
        };
        RenderTargetTexture.prototype.renderToTarget = function (faceIndex, currentRenderList, currentRenderListLength, useCameraPostProcess, dumpForDebug) {
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            var engine = scene.getEngine();
            if (!this._texture) {
                return;
            }
            // Bind
            if (this._postProcessManager) {
                this._postProcessManager._prepareFrame(this._texture, this._postProcesses);
            }
            else if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
                if (this._texture) {
                    engine.bindFramebuffer(this._texture, this.isCube ? faceIndex : undefined, undefined, undefined, this.ignoreCameraViewport);
                }
            }
            this.onBeforeRenderObservable.notifyObservers(faceIndex);
            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            }
            else {
                engine.clear(this.clearColor || scene.clearColor, true, true, true);
            }
            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);
            if (this._postProcessManager) {
                this._postProcessManager._finalizeFrame(false, this._texture, faceIndex, this._postProcesses, this.ignoreCameraViewport);
            }
            else if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._texture, faceIndex);
            }
            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
            // Dump ?
            if (dumpForDebug) {
                BABYLON.Tools.DumpFramebuffer(this.getRenderWidth(), this.getRenderHeight(), engine);
            }
            // Unbind
            if (!this.isCube || faceIndex === 5) {
                if (this.isCube) {
                    if (faceIndex === 5) {
                        engine.generateMipMapsForCubemap(this._texture);
                    }
                }
                this.unbindFrameBuffer(engine, faceIndex);
            }
            else {
                this.onAfterRenderObservable.notifyObservers(faceIndex);
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
            var newTexture = new RenderTargetTexture(this.name, textureSize.width, this.getScene(), this._renderTargetOptions.generateMipMaps, this._doNotChangeAspectRatio, this._renderTargetOptions.type, this.isCube, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer, this._renderTargetOptions.generateStencilBuffer);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // RenderTarget Texture
            newTexture.coordinatesMode = this.coordinatesMode;
            if (this.renderList) {
                newTexture.renderList = this.renderList.slice(0);
            }
            return newTexture;
        };
        RenderTargetTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.renderTargetSize = this.getRenderSize();
            serializationObject.renderList = [];
            if (this.renderList) {
                for (var index = 0; index < this.renderList.length; index++) {
                    serializationObject.renderList.push(this.renderList[index].id);
                }
            }
            return serializationObject;
        };
        // This will remove the attached framebuffer objects. The texture will not be able to be used as render target anymore
        RenderTargetTexture.prototype.disposeFramebufferObjects = function () {
            var objBuffer = this.getInternalTexture();
            var scene = this.getScene();
            if (objBuffer && scene) {
                scene.getEngine()._releaseFramebufferObjects(objBuffer);
            }
        };
        RenderTargetTexture.prototype.dispose = function () {
            if (this._postProcessManager) {
                this._postProcessManager.dispose();
                this._postProcessManager = null;
            }
            this.clearPostProcesses(true);
            if (this._resizeObserver) {
                this.getScene().getEngine().onResizeObservable.remove(this._resizeObserver);
                this._resizeObserver = null;
            }
            this.renderList = null;
            // Remove from custom render targets
            var scene = this.getScene();
            if (!scene) {
                return;
            }
            var index = scene.customRenderTargets.indexOf(this);
            if (index >= 0) {
                scene.customRenderTargets.splice(index, 1);
            }
            for (var _i = 0, _a = scene.cameras; _i < _a.length; _i++) {
                var camera = _a[_i];
                index = camera.customRenderTargets.indexOf(this);
                if (index >= 0) {
                    camera.customRenderTargets.splice(index, 1);
                }
            }
            _super.prototype.dispose.call(this);
        };
        RenderTargetTexture.prototype._rebuild = function () {
            if (this.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE) {
                this.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            }
            if (this._postProcessManager) {
                this._postProcessManager._rebuild();
            }
        };
        RenderTargetTexture._REFRESHRATE_RENDER_ONCE = 0;
        RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYFRAME = 1;
        RenderTargetTexture._REFRESHRATE_RENDER_ONEVERYTWOFRAMES = 2;
        return RenderTargetTexture;
    }(BABYLON.Texture));
    BABYLON.RenderTargetTexture = RenderTargetTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.renderTargetTexture.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";


var BABYLON;
(function (BABYLON) {
    ;
    var MultiRenderTarget = /** @class */ (function (_super) {
        __extends(MultiRenderTarget, _super);
        function MultiRenderTarget(name, size, count, scene, options) {
            var _this = this;
            var generateMipMaps = options && options.generateMipMaps ? options.generateMipMaps : false;
            var generateDepthTexture = options && options.generateDepthTexture ? options.generateDepthTexture : false;
            var doNotChangeAspectRatio = !options || options.doNotChangeAspectRatio === undefined ? true : options.doNotChangeAspectRatio;
            _this = _super.call(this, name, size, scene, generateMipMaps, doNotChangeAspectRatio) || this;
            _this._engine = scene.getEngine();
            if (!_this.isSupported) {
                _this.dispose();
                return;
            }
            var types = [];
            var samplingModes = [];
            for (var i = 0; i < count; i++) {
                if (options && options.types && options.types[i] !== undefined) {
                    types.push(options.types[i]);
                }
                else {
                    types.push(options && options.defaultType ? options.defaultType : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
                }
                if (options && options.samplingModes && options.samplingModes[i] !== undefined) {
                    samplingModes.push(options.samplingModes[i]);
                }
                else {
                    samplingModes.push(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
                }
            }
            var generateDepthBuffer = !options || options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            var generateStencilBuffer = !options || options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;
            _this._size = size;
            _this._multiRenderTargetOptions = {
                samplingModes: samplingModes,
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer,
                generateDepthTexture: generateDepthTexture,
                types: types,
                textureCount: count
            };
            _this._createInternalTextures();
            _this._createTextures();
            return _this;
        }
        Object.defineProperty(MultiRenderTarget.prototype, "isSupported", {
            get: function () {
                return this._engine.webGLVersion > 1 || this._engine.getCaps().drawBuffersExtension;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MultiRenderTarget.prototype, "textures", {
            get: function () {
                return this._textures;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MultiRenderTarget.prototype, "depthTexture", {
            get: function () {
                return this._textures[this._textures.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MultiRenderTarget.prototype, "wrapU", {
            set: function (wrap) {
                if (this._textures) {
                    for (var i = 0; i < this._textures.length; i++) {
                        this._textures[i].wrapU = wrap;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MultiRenderTarget.prototype, "wrapV", {
            set: function (wrap) {
                if (this._textures) {
                    for (var i = 0; i < this._textures.length; i++) {
                        this._textures[i].wrapV = wrap;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        MultiRenderTarget.prototype._rebuild = function () {
            this.releaseInternalTextures();
            this._createInternalTextures();
            for (var i = 0; i < this._internalTextures.length; i++) {
                var texture = this._textures[i];
                texture._texture = this._internalTextures[i];
            }
            // Keeps references to frame buffer and stencil/depth buffer
            this._texture = this._internalTextures[0];
        };
        MultiRenderTarget.prototype._createInternalTextures = function () {
            this._internalTextures = this._engine.createMultipleRenderTarget(this._size, this._multiRenderTargetOptions);
        };
        MultiRenderTarget.prototype._createTextures = function () {
            this._textures = [];
            for (var i = 0; i < this._internalTextures.length; i++) {
                var texture = new BABYLON.Texture(null, this.getScene());
                texture._texture = this._internalTextures[i];
                this._textures.push(texture);
            }
            // Keeps references to frame buffer and stencil/depth buffer
            this._texture = this._internalTextures[0];
        };
        Object.defineProperty(MultiRenderTarget.prototype, "samples", {
            get: function () {
                return this._samples;
            },
            set: function (value) {
                if (this._samples === value) {
                    return;
                }
                this._samples = this._engine.updateMultipleRenderTargetTextureSampleCount(this._internalTextures, value);
            },
            enumerable: true,
            configurable: true
        });
        MultiRenderTarget.prototype.resize = function (size) {
            this.releaseInternalTextures();
            this._internalTextures = this._engine.createMultipleRenderTarget(size, this._multiRenderTargetOptions);
            this._createInternalTextures();
        };
        MultiRenderTarget.prototype.unbindFrameBuffer = function (engine, faceIndex) {
            var _this = this;
            engine.unBindMultiColorAttachmentFramebuffer(this._internalTextures, this.isCube, function () {
                _this.onAfterRenderObservable.notifyObservers(faceIndex);
            });
        };
        MultiRenderTarget.prototype.dispose = function () {
            this.releaseInternalTextures();
            _super.prototype.dispose.call(this);
        };
        MultiRenderTarget.prototype.releaseInternalTextures = function () {
            if (!this._internalTextures) {
                return;
            }
            for (var i = this._internalTextures.length - 1; i >= 0; i--) {
                if (this._internalTextures[i] !== undefined) {
                    this._internalTextures[i].dispose();
                    this._internalTextures.splice(i, 1);
                }
            }
        };
        return MultiRenderTarget;
    }(BABYLON.RenderTargetTexture));
    BABYLON.MultiRenderTarget = MultiRenderTarget;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.multiRenderTarget.js.map


var BABYLON;
(function (BABYLON) {
    var MirrorTexture = /** @class */ (function (_super) {
        __extends(MirrorTexture, _super);
        function MirrorTexture(name, size, scene, generateMipMaps, type, samplingMode, generateDepthBuffer) {
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            if (generateDepthBuffer === void 0) { generateDepthBuffer = true; }
            var _this = _super.call(this, name, size, scene, generateMipMaps, true, type, false, samplingMode, generateDepthBuffer) || this;
            _this.mirrorPlane = new BABYLON.Plane(0, 1, 0, 1);
            _this._transformMatrix = BABYLON.Matrix.Zero();
            _this._mirrorMatrix = BABYLON.Matrix.Zero();
            _this._adaptiveBlurKernel = 0;
            _this._blurKernelX = 0;
            _this._blurKernelY = 0;
            _this._blurRatio = 1.0;
            _this.ignoreCameraViewport = true;
            _this.onBeforeRenderObservable.add(function () {
                BABYLON.Matrix.ReflectionToRef(_this.mirrorPlane, _this._mirrorMatrix);
                _this._savedViewMatrix = scene.getViewMatrix();
                _this._mirrorMatrix.multiplyToRef(_this._savedViewMatrix, _this._transformMatrix);
                scene.setTransformMatrix(_this._transformMatrix, scene.getProjectionMatrix());
                scene.clipPlane = _this.mirrorPlane;
                scene.getEngine().cullBackFaces = false;
                scene._mirroredCameraPosition = BABYLON.Vector3.TransformCoordinates(scene.activeCamera.globalPosition, _this._mirrorMatrix);
            });
            _this.onAfterRenderObservable.add(function () {
                scene.setTransformMatrix(_this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;
                delete scene.clipPlane;
            });
            return _this;
        }
        Object.defineProperty(MirrorTexture.prototype, "blurRatio", {
            get: function () {
                return this._blurRatio;
            },
            set: function (value) {
                if (this._blurRatio === value) {
                    return;
                }
                this._blurRatio = value;
                this._preparePostProcesses();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MirrorTexture.prototype, "adaptiveBlurKernel", {
            set: function (value) {
                this._adaptiveBlurKernel = value;
                this._autoComputeBlurKernel();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MirrorTexture.prototype, "blurKernel", {
            set: function (value) {
                this.blurKernelX = value;
                this.blurKernelY = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MirrorTexture.prototype, "blurKernelX", {
            get: function () {
                return this._blurKernelX;
            },
            set: function (value) {
                if (this._blurKernelX === value) {
                    return;
                }
                this._blurKernelX = value;
                this._preparePostProcesses();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MirrorTexture.prototype, "blurKernelY", {
            get: function () {
                return this._blurKernelY;
            },
            set: function (value) {
                if (this._blurKernelY === value) {
                    return;
                }
                this._blurKernelY = value;
                this._preparePostProcesses();
            },
            enumerable: true,
            configurable: true
        });
        MirrorTexture.prototype._autoComputeBlurKernel = function () {
            var engine = this.getScene().getEngine();
            var dw = this.getRenderWidth() / engine.getRenderWidth();
            var dh = this.getRenderHeight() / engine.getRenderHeight();
            this.blurKernelX = this._adaptiveBlurKernel * dw;
            this.blurKernelY = this._adaptiveBlurKernel * dh;
        };
        MirrorTexture.prototype._onRatioRescale = function () {
            if (this._sizeRatio) {
                this.resize(this._initialSizeParameter);
                if (!this._adaptiveBlurKernel) {
                    this._preparePostProcesses();
                }
            }
            if (this._adaptiveBlurKernel) {
                this._autoComputeBlurKernel();
            }
        };
        MirrorTexture.prototype._preparePostProcesses = function () {
            this.clearPostProcesses(true);
            if (this._blurKernelX && this._blurKernelY) {
                var engine = this.getScene().getEngine();
                var textureType = engine.getCaps().textureFloatRender ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_HALF_FLOAT;
                this._blurX = new BABYLON.BlurPostProcess("horizontal blur", new BABYLON.Vector2(1.0, 0), this._blurKernelX, this._blurRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
                this._blurX.autoClear = false;
                if (this._blurRatio === 1 && this.samples < 2 && this._texture) {
                    this._blurX.outputTexture = this._texture;
                }
                else {
                    this._blurX.alwaysForcePOT = true;
                }
                this._blurY = new BABYLON.BlurPostProcess("vertical blur", new BABYLON.Vector2(0, 1.0), this._blurKernelY, this._blurRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
                this._blurY.autoClear = false;
                this._blurY.alwaysForcePOT = this._blurRatio !== 1;
                this.addPostProcess(this._blurX);
                this.addPostProcess(this._blurY);
            }
            else {
                if (this._blurY) {
                    this.removePostProcess(this._blurY);
                    this._blurY.dispose();
                    this._blurY = null;
                }
                if (this._blurX) {
                    this.removePostProcess(this._blurX);
                    this._blurX.dispose();
                    this._blurX = null;
                }
            }
        };
        MirrorTexture.prototype.clone = function () {
            var scene = this.getScene();
            if (!scene) {
                return this;
            }
            var textureSize = this.getSize();
            var newTexture = new MirrorTexture(this.name, textureSize.width, scene, this._renderTargetOptions.generateMipMaps, this._renderTargetOptions.type, this._renderTargetOptions.samplingMode, this._renderTargetOptions.generateDepthBuffer);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // Mirror Texture
            newTexture.mirrorPlane = this.mirrorPlane.clone();
            if (this.renderList) {
                newTexture.renderList = this.renderList.slice(0);
            }
            return newTexture;
        };
        MirrorTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.mirrorPlane = this.mirrorPlane.asArray();
            return serializationObject;
        };
        return MirrorTexture;
    }(BABYLON.RenderTargetTexture));
    BABYLON.MirrorTexture = MirrorTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.mirrorTexture.js.map


var BABYLON;
(function (BABYLON) {
    /**
    * Creates a refraction texture used by refraction channel of the standard material.
    * @param name the texture name
    * @param size size of the underlying texture
    * @param scene root scene
    */
    var RefractionTexture = /** @class */ (function (_super) {
        __extends(RefractionTexture, _super);
        function RefractionTexture(name, size, scene, generateMipMaps) {
            var _this = _super.call(this, name, size, scene, generateMipMaps, true) || this;
            _this.refractionPlane = new BABYLON.Plane(0, 1, 0, 1);
            _this.depth = 2.0;
            _this.onBeforeRenderObservable.add(function () {
                scene.clipPlane = _this.refractionPlane;
            });
            _this.onAfterRenderObservable.add(function () {
                delete scene.clipPlane;
            });
            return _this;
        }
        RefractionTexture.prototype.clone = function () {
            var scene = this.getScene();
            if (!scene) {
                return this;
            }
            var textureSize = this.getSize();
            var newTexture = new RefractionTexture(this.name, textureSize.width, scene, this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // Refraction Texture
            newTexture.refractionPlane = this.refractionPlane.clone();
            if (this.renderList) {
                newTexture.renderList = this.renderList.slice(0);
            }
            newTexture.depth = this.depth;
            return newTexture;
        };
        RefractionTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.mirrorPlane = this.refractionPlane.asArray();
            serializationObject.depth = this.depth;
            return serializationObject;
        };
        return RefractionTexture;
    }(BABYLON.RenderTargetTexture));
    BABYLON.RefractionTexture = RefractionTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.refractionTexture.js.map


var BABYLON;
(function (BABYLON) {
    var DynamicTexture = /** @class */ (function (_super) {
        __extends(DynamicTexture, _super);
        function DynamicTexture(name, options, scene, generateMipMaps, samplingMode, format) {
            if (scene === void 0) { scene = null; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (format === void 0) { format = BABYLON.Engine.TEXTUREFORMAT_RGBA; }
            var _this = _super.call(this, null, scene, !generateMipMaps, undefined, samplingMode, undefined, undefined, undefined, undefined, format) || this;
            _this.name = name;
            _this._engine = _this.getScene().getEngine();
            _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this._generateMipMaps = generateMipMaps;
            if (options.getContext) {
                _this._canvas = options;
                _this._texture = _this._engine.createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
            }
            else {
                _this._canvas = document.createElement("canvas");
                if (options.width) {
                    _this._texture = _this._engine.createDynamicTexture(options.width, options.height, generateMipMaps, samplingMode);
                }
                else {
                    _this._texture = _this._engine.createDynamicTexture(options, options, generateMipMaps, samplingMode);
                }
            }
            var textureSize = _this.getSize();
            _this._canvas.width = textureSize.width;
            _this._canvas.height = textureSize.height;
            _this._context = _this._canvas.getContext("2d");
            return _this;
        }
        Object.defineProperty(DynamicTexture.prototype, "canRescale", {
            get: function () {
                return true;
            },
            enumerable: true,
            configurable: true
        });
        DynamicTexture.prototype._recreate = function (textureSize) {
            this._canvas.width = textureSize.width;
            this._canvas.height = textureSize.height;
            this.releaseInternalTexture();
            this._texture = this._engine.createDynamicTexture(textureSize.width, textureSize.height, this._generateMipMaps, this._samplingMode);
        };
        DynamicTexture.prototype.scale = function (ratio) {
            var textureSize = this.getSize();
            textureSize.width *= ratio;
            textureSize.height *= ratio;
            this._recreate(textureSize);
        };
        DynamicTexture.prototype.scaleTo = function (width, height) {
            var textureSize = this.getSize();
            textureSize.width = width;
            textureSize.height = height;
            this._recreate(textureSize);
        };
        DynamicTexture.prototype.getContext = function () {
            return this._context;
        };
        DynamicTexture.prototype.clear = function () {
            var size = this.getSize();
            this._context.fillRect(0, 0, size.width, size.height);
        };
        DynamicTexture.prototype.update = function (invertY) {
            this._engine.updateDynamicTexture(this._texture, this._canvas, invertY === undefined ? true : invertY, undefined, this._format || undefined);
        };
        DynamicTexture.prototype.drawText = function (text, x, y, font, color, clearColor, invertY, update) {
            if (update === void 0) { update = true; }
            var size = this.getSize();
            if (clearColor) {
                this._context.fillStyle = clearColor;
                this._context.fillRect(0, 0, size.width, size.height);
            }
            this._context.font = font;
            if (x === null || x === undefined) {
                var textSize = this._context.measureText(text);
                x = (size.width - textSize.width) / 2;
            }
            if (y === null || y === undefined) {
                var fontSize = parseInt((font.replace(/\D/g, '')));
                ;
                y = (size.height / 2) + (fontSize / 3.65);
            }
            this._context.fillStyle = color;
            this._context.fillText(text, x, y);
            if (update) {
                this.update(invertY);
            }
        };
        DynamicTexture.prototype.clone = function () {
            var scene = this.getScene();
            if (!scene) {
                return this;
            }
            var textureSize = this.getSize();
            var newTexture = new DynamicTexture(this.name, textureSize, scene, this._generateMipMaps);
            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;
            // Dynamic Texture
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;
            return newTexture;
        };
        DynamicTexture.prototype._rebuild = function () {
            this.update();
        };
        return DynamicTexture;
    }(BABYLON.Texture));
    BABYLON.DynamicTexture = DynamicTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.dynamicTexture.js.map


var BABYLON;
(function (BABYLON) {
    var VideoTexture = /** @class */ (function (_super) {
        __extends(VideoTexture, _super);
        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/tutorials/01._Advanced_Texturing
         * @param {Array} urlsOrVideo can be used to provide an array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         */
        function VideoTexture(name, urlsOrVideo, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = false; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            var _this = _super.call(this, null, scene, !generateMipMaps, invertY) || this;
            _this._autoLaunch = true;
            var urls = null;
            _this.name = name;
            if (urlsOrVideo instanceof HTMLVideoElement) {
                _this.video = urlsOrVideo;
            }
            else {
                urls = urlsOrVideo;
                _this.video = document.createElement("video");
                _this.video.autoplay = false;
                _this.video.loop = true;
                BABYLON.Tools.SetCorsBehavior(urls, _this.video);
            }
            _this._engine = _this.getScene().getEngine();
            _this._generateMipMaps = generateMipMaps;
            _this._samplingMode = samplingMode;
            if (!_this._engine.needPOTTextures || (BABYLON.Tools.IsExponentOfTwo(_this.video.videoWidth) && BABYLON.Tools.IsExponentOfTwo(_this.video.videoHeight))) {
                _this.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                _this.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            }
            else {
                _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                _this._generateMipMaps = false;
            }
            if (urls) {
                _this.video.addEventListener("canplay", function () {
                    if (_this._texture === undefined) {
                        _this._createTexture();
                    }
                });
                urls.forEach(function (url) {
                    var source = document.createElement("source");
                    source.src = url;
                    _this.video.appendChild(source);
                });
            }
            else {
                _this._createTexture();
            }
            _this._lastUpdate = BABYLON.Tools.Now;
            return _this;
        }
        VideoTexture.prototype.__setTextureReady = function () {
            if (this._texture) {
                this._texture.isReady = true;
            }
        };
        VideoTexture.prototype._createTexture = function () {
            this._texture = this._engine.createDynamicTexture(this.video.videoWidth, this.video.videoHeight, this._generateMipMaps, this._samplingMode);
            if (this._autoLaunch) {
                this._autoLaunch = false;
                this.video.play();
            }
            this._setTextureReady = this.__setTextureReady.bind(this);
            this.video.addEventListener("playing", this._setTextureReady);
        };
        VideoTexture.prototype._rebuild = function () {
            this.update();
        };
        VideoTexture.prototype.update = function () {
            var now = BABYLON.Tools.Now;
            if (now - this._lastUpdate < 15 || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
                return false;
            }
            this._lastUpdate = now;
            this._engine.updateVideoTexture(this._texture, this.video, this._invertY);
            return true;
        };
        VideoTexture.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.video.removeEventListener("playing", this._setTextureReady);
        };
        VideoTexture.CreateFromWebCam = function (scene, onReady, constraints) {
            var video = document.createElement("video");
            var constraintsDeviceId;
            if (constraints && constraints.deviceId) {
                constraintsDeviceId = {
                    exact: constraints.deviceId
                };
            }
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            if (navigator.getUserMedia) {
                navigator.getUserMedia({
                    video: {
                        deviceId: constraintsDeviceId,
                        width: {
                            min: (constraints && constraints.minWidth) || 256,
                            max: (constraints && constraints.maxWidth) || 640
                        },
                        height: {
                            min: (constraints && constraints.minHeight) || 256,
                            max: (constraints && constraints.maxHeight) || 480
                        }
                    }
                }, function (stream) {
                    if (video.mozSrcObject !== undefined) {
                        video.mozSrcObject = stream;
                    }
                    else {
                        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                    }
                    video.play();
                    if (onReady) {
                        onReady(new VideoTexture("video", video, scene, true, true));
                    }
                }, function (e) {
                    BABYLON.Tools.Error(e.name);
                });
            }
        };
        return VideoTexture;
    }(BABYLON.Texture));
    BABYLON.VideoTexture = VideoTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.videoTexture.js.map


var BABYLON;
(function (BABYLON) {
    var RawTexture = /** @class */ (function (_super) {
        __extends(RawTexture, _super);
        function RawTexture(data, width, height, format, scene, generateMipMaps, invertY, samplingMode, type) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            var _this = _super.call(this, null, scene, !generateMipMaps, invertY) || this;
            _this.format = format;
            _this._engine = scene.getEngine();
            _this._texture = scene.getEngine().createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, null, type);
            _this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            _this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            return _this;
        }
        RawTexture.prototype.update = function (data) {
            this._engine.updateRawTexture(this._texture, data, this._texture.format, this._texture.invertY, undefined, this._texture.type);
        };
        // Statics
        RawTexture.CreateLuminanceTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_LUMINANCE, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateLuminanceAlphaTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_LUMINANCE_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateAlphaTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateRGBTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode, type) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_RGB, scene, generateMipMaps, invertY, samplingMode, type);
        };
        RawTexture.CreateRGBATexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode, type) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_RGBA, scene, generateMipMaps, invertY, samplingMode, type);
        };
        return RawTexture;
    }(BABYLON.Texture));
    BABYLON.RawTexture = RawTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.rawTexture.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var CubeTexture = BABYLON.CubeTexture;
var RenderTargetTexture = BABYLON.RenderTargetTexture;
var MultiRenderTarget = BABYLON.MultiRenderTarget;
var MirrorTexture = BABYLON.MirrorTexture;
var RefractionTexture = BABYLON.RefractionTexture;
var DynamicTexture = BABYLON.DynamicTexture;
var VideoTexture = BABYLON.VideoTexture;
var RawTexture = BABYLON.RawTexture;

export { CubeTexture,RenderTargetTexture,MultiRenderTarget,MirrorTexture,RefractionTexture,DynamicTexture,VideoTexture,RawTexture };