var BABYLON;
(function (BABYLON) {
    var PostProcess = (function () {
        function PostProcess(name, fragmentUrl, parameters, samplers, options, camera, samplingMode, engine, reusable, defines, textureType) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE; }
            if (textureType === void 0) { textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            this.name = name;
            this.width = -1;
            this.height = -1;
            /*
                Enable Pixel Perfect mode where texture is not scaled to be power of 2.
                Can only be used on a single postprocess or on the last one of a chain.
            */
            this.enablePixelPerfectMode = false;
            this._reusable = false;
            this._textures = new BABYLON.SmartArray(2);
            this._currentRenderTextureInd = 0;
            this._scaleRatio = new BABYLON.Vector2(1, 1);
            // Events
            /**
            * An event triggered when the postprocess is activated.
            * @type {BABYLON.Observable}
            */
            this.onActivateObservable = new BABYLON.Observable();
            /**
            * An event triggered when the postprocess changes its size.
            * @type {BABYLON.Observable}
            */
            this.onSizeChangedObservable = new BABYLON.Observable();
            /**
            * An event triggered when the postprocess applies its effect.
            * @type {BABYLON.Observable}
            */
            this.onApplyObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering the postprocess
            * @type {BABYLON.Observable}
            */
            this.onBeforeRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering the postprocess
            * @type {BABYLON.Observable}
            */
            this.onAfterRenderObservable = new BABYLON.Observable();
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();
            }
            else {
                this._engine = engine;
            }
            this._options = options;
            this.renderTargetSamplingMode = samplingMode ? samplingMode : BABYLON.Texture.NEAREST_SAMPLINGMODE;
            this._reusable = reusable || false;
            this._textureType = textureType;
            this._samplers = samplers || [];
            this._samplers.push("textureSampler");
            this._fragmentUrl = fragmentUrl;
            this._parameters = parameters || [];
            this._parameters.push("scale");
            this.updateEffect(defines);
        }
        Object.defineProperty(PostProcess.prototype, "onActivate", {
            set: function (callback) {
                if (this._onActivateObserver) {
                    this.onActivateObservable.remove(this._onActivateObserver);
                }
                this._onActivateObserver = this.onActivateObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PostProcess.prototype, "onSizeChanged", {
            set: function (callback) {
                if (this._onSizeChangedObserver) {
                    this.onSizeChangedObservable.remove(this._onSizeChangedObserver);
                }
                this._onSizeChangedObserver = this.onSizeChangedObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PostProcess.prototype, "onApply", {
            set: function (callback) {
                if (this._onApplyObserver) {
                    this.onApplyObservable.remove(this._onApplyObserver);
                }
                this._onApplyObserver = this.onApplyObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PostProcess.prototype, "onBeforeRender", {
            set: function (callback) {
                if (this._onBeforeRenderObserver) {
                    this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                }
                this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PostProcess.prototype, "onAfterRender", {
            set: function (callback) {
                if (this._onAfterRenderObserver) {
                    this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
                }
                this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        PostProcess.prototype.updateEffect = function (defines) {
            this._effect = this._engine.createEffect({ vertex: "postprocess", fragment: this._fragmentUrl }, ["position"], this._parameters, this._samplers, defines !== undefined ? defines : "");
        };
        PostProcess.prototype.isReusable = function () {
            return this._reusable;
        };
        /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
        PostProcess.prototype.markTextureDirty = function () {
            this.width = -1;
        };
        PostProcess.prototype.activate = function (camera, sourceTexture) {
            camera = camera || this._camera;
            var scene = camera.getScene();
            var maxSize = camera.getEngine().getCaps().maxTextureSize;
            var requiredWidth = ((sourceTexture ? sourceTexture._width : this._engine.getRenderingCanvas().width) * this._options) | 0;
            var requiredHeight = ((sourceTexture ? sourceTexture._height : this._engine.getRenderingCanvas().height) * this._options) | 0;
            var desiredWidth = this._options.width || requiredWidth;
            var desiredHeight = this._options.height || requiredHeight;
            if (this.renderTargetSamplingMode !== BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                if (!this._options.width) {
                    desiredWidth = BABYLON.Tools.GetExponentOfTwo(desiredWidth, maxSize);
                }
                if (!this._options.height) {
                    desiredHeight = BABYLON.Tools.GetExponentOfTwo(desiredHeight, maxSize);
                }
            }
            if (this.width !== desiredWidth || this.height !== desiredHeight) {
                if (this._textures.length > 0) {
                    for (var i = 0; i < this._textures.length; i++) {
                        this._engine._releaseTexture(this._textures.data[i]);
                    }
                    this._textures.reset();
                }
                this.width = desiredWidth;
                this.height = desiredHeight;
                var textureSize = { width: this.width, height: this.height };
                var textureOptions = {
                    generateMipMaps: false,
                    generateDepthBuffer: camera._postProcesses.indexOf(this) === 0,
                    generateStencilBuffer: camera._postProcesses.indexOf(this) === 0 && this._engine.isStencilEnable,
                    samplingMode: this.renderTargetSamplingMode,
                    type: this._textureType
                };
                this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));
                if (this._reusable) {
                    this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));
                }
                this.onSizeChangedObservable.notifyObservers(this);
            }
            if (this.enablePixelPerfectMode) {
                this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
                this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd], 0, requiredWidth, requiredHeight);
            }
            else {
                this._scaleRatio.copyFromFloats(1, 1);
                this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd]);
            }
            this.onActivateObservable.notifyObservers(camera);
            // Clear
            if (this.clearColor) {
                this._engine.clear(this.clearColor, true, true, true);
            }
            else {
                this._engine.clear(scene.clearColor, scene.autoClear || scene.forceWireframe, true, true);
            }
            if (this._reusable) {
                this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
            }
        };
        Object.defineProperty(PostProcess.prototype, "isSupported", {
            get: function () {
                return this._effect.isSupported;
            },
            enumerable: true,
            configurable: true
        });
        PostProcess.prototype.apply = function () {
            // Check
            if (!this._effect.isReady())
                return null;
            // States
            this._engine.enableEffect(this._effect);
            this._engine.setState(false);
            this._engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            this._engine.setDepthBuffer(false);
            this._engine.setDepthWrite(false);
            // Texture
            this._effect._bindTexture("textureSampler", this._textures.data[this._currentRenderTextureInd]);
            // Parameters
            this._effect.setVector2("scale", this._scaleRatio);
            this.onApplyObservable.notifyObservers(this._effect);
            return this._effect;
        };
        PostProcess.prototype.dispose = function (camera) {
            camera = camera || this._camera;
            if (this._textures.length > 0) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._engine._releaseTexture(this._textures.data[i]);
                }
                this._textures.reset();
            }
            if (!camera) {
                return;
            }
            camera.detachPostProcess(this);
            var index = camera._postProcesses.indexOf(this);
            if (index === 0 && camera._postProcesses.length > 0) {
                this._camera._postProcesses[0].markTextureDirty();
            }
            this.onActivateObservable.clear();
            this.onAfterRenderObservable.clear();
            this.onApplyObservable.clear();
            this.onBeforeRenderObservable.clear();
            this.onSizeChangedObservable.clear();
        };
        return PostProcess;
    })();
    BABYLON.PostProcess = PostProcess;
})(BABYLON || (BABYLON = {}));
