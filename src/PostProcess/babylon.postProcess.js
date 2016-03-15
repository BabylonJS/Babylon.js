var BABYLON;
(function (BABYLON) {
    var PostProcess = (function () {
        function PostProcess(name, fragmentUrl, parameters, samplers, ratio, camera, samplingMode, engine, reusable, defines, textureType) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE; }
            if (textureType === void 0) { textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            this.name = name;
            this.width = -1;
            this.height = -1;
            this._reusable = false;
            this._textures = new BABYLON.SmartArray(2);
            this._currentRenderTextureInd = 0;
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();
            }
            else {
                this._engine = engine;
            }
            this._renderRatio = ratio;
            this.renderTargetSamplingMode = samplingMode ? samplingMode : BABYLON.Texture.NEAREST_SAMPLINGMODE;
            this._reusable = reusable || false;
            this._textureType = textureType;
            this._samplers = samplers || [];
            this._samplers.push("textureSampler");
            this._fragmentUrl = fragmentUrl;
            this._parameters = parameters || [];
            this.updateEffect(defines);
        }
        PostProcess.prototype.updateEffect = function (defines) {
            this._effect = this._engine.createEffect({ vertex: "postprocess", fragment: this._fragmentUrl }, ["position"], this._parameters, this._samplers, defines !== undefined ? defines : "");
        };
        PostProcess.prototype.isReusable = function () {
            return this._reusable;
        };
        PostProcess.prototype.activate = function (camera, sourceTexture) {
            camera = camera || this._camera;
            var scene = camera.getScene();
            var maxSize = camera.getEngine().getCaps().maxTextureSize;
            var desiredWidth = ((sourceTexture ? sourceTexture._width : this._engine.getRenderingCanvas().width) * this._renderRatio) | 0;
            var desiredHeight = ((sourceTexture ? sourceTexture._height : this._engine.getRenderingCanvas().height) * this._renderRatio) | 0;
            desiredWidth = this._renderRatio.width || BABYLON.Tools.GetExponentOfTwo(desiredWidth, maxSize);
            desiredHeight = this._renderRatio.height || BABYLON.Tools.GetExponentOfTwo(desiredHeight, maxSize);
            if (this.width !== desiredWidth || this.height !== desiredHeight) {
                if (this._textures.length > 0) {
                    for (var i = 0; i < this._textures.length; i++) {
                        this._engine._releaseTexture(this._textures.data[i]);
                    }
                    this._textures.reset();
                }
                this.width = desiredWidth;
                this.height = desiredHeight;
                this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode, type: this._textureType }));
                if (this._reusable) {
                    this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode, type: this._textureType }));
                }
                if (this.onSizeChanged) {
                    this.onSizeChanged();
                }
            }
            this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd]);
            if (this.onActivate) {
                this.onActivate(camera);
            }
            // Clear
            if (this.clearColor) {
                this._engine.clear(this.clearColor, true, true);
            }
            else {
                this._engine.clear(scene.clearColor, scene.autoClear || scene.forceWireframe, true);
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
            if (this.onApply) {
                this.onApply(this._effect);
            }
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
            if (index === camera._postProcessesTakenIndices[0] && camera._postProcessesTakenIndices.length > 0) {
                this._camera._postProcesses[camera._postProcessesTakenIndices[0]].width = -1; // invalidate frameBuffer to hint the postprocess to create a depth buffer
            }
        };
        return PostProcess;
    })();
    BABYLON.PostProcess = PostProcess;
})(BABYLON || (BABYLON = {}));
