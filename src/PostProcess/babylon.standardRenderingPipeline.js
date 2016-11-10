var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var StandardRenderingPipeline = (function (_super) {
        __extends(StandardRenderingPipeline, _super);
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.PostProcess} originalPostProcess - the custom original color post-process. Must be "reusable". Can be null.
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function StandardRenderingPipeline(name, scene, ratio, originalPostProcess, cameras) {
            var _this = this;
            if (originalPostProcess === void 0) { originalPostProcess = null; }
            _super.call(this, scene.getEngine(), name);
            this.downSampleX4PostProcess = null;
            this.brightPassPostProcess = null;
            this.gaussianBlurHPostProcesses = [];
            this.gaussianBlurVPostProcesses = [];
            this.textureAdderPostProcess = null;
            this.textureAdderFinalPostProcess = null;
            this.lensFlarePostProcess = null;
            this.lensFlareComposePostProcess = null;
            this.depthOfFieldPostProcess = null;
            // Values
            this.brightThreshold = 1.0;
            this.blurWidth = 2.0;
            this.gaussianCoefficient = 0.25;
            this.gaussianMean = 1.0;
            this.gaussianStandardDeviation = 1.0;
            this.exposure = 1.0;
            this.lensTexture = null;
            this.lensColorTexture = null;
            this.lensFlareStrength = 20.0;
            this.lensFlareGhostDispersal = 1.4;
            this.lensFlareHaloWidth = 0.7;
            this.lensFlareDistortionStrength = 16.0;
            this.lensStarTexture = null;
            this.lensFlareDirtTexture = null;
            this.depthOfFieldDistance = 10.0;
            // IAnimatable
            this.animations = [];
            this._depthRenderer = null;
            // Getters and setters
            this._depthOfFieldEnabled = true;
            this._lensFlareEnabled = true;
            // Initialize
            this._scene = scene;
            // Create pass post-processe
            if (!originalPostProcess) {
                this.originalPostProcess = new BABYLON.PostProcess("HDRPass", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_FLOAT);
            }
            else {
                this.originalPostProcess = originalPostProcess;
            }
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", function () { return _this.originalPostProcess; }, true));
            // Create down sample X4 post-process
            this._createDownSampleX4PostProcess(scene, ratio / 2);
            // Create bright pass post-process
            this._createBrightPassPostProcess(scene, ratio / 2);
            // Create gaussian blur post-processes (down sampling blurs)
            this._createGaussianBlurPostProcesses(scene, ratio / 2, 0);
            this._createGaussianBlurPostProcesses(scene, ratio / 4, 1);
            this._createGaussianBlurPostProcesses(scene, ratio / 8, 2);
            this._createGaussianBlurPostProcesses(scene, ratio / 16, 3);
            // Create texture adder post-process
            this._createTextureAdderPostProcess(scene, ratio);
            // Create depth-of-field source post-process
            this.textureAdderFinalPostProcess = new BABYLON.PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfFieldSource", function () { return _this.textureAdderFinalPostProcess; }, true));
            // Create lens flare post-process
            this._createLensFlarePostProcess(scene, ratio);
            // Create gaussian blur used by depth-of-field
            this._createGaussianBlurPostProcesses(scene, ratio / 2, 5);
            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
            // Deactivate
            this.LensFlareEnabled = false;
            this.DepthOfFieldEnabled = false;
        }
        Object.defineProperty(StandardRenderingPipeline.prototype, "DepthOfFieldEnabled", {
            get: function () {
                return this._depthOfFieldEnabled;
            },
            set: function (enabled) {
                var blurIndex = this.gaussianBlurHPostProcesses.length - 1;
                if (enabled && !this._depthOfFieldEnabled) {
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                    this._depthRenderer = this._scene.enableDepthRenderer();
                }
                else if (!enabled && this._depthOfFieldEnabled) {
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                }
                this._depthOfFieldEnabled = enabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "LensFlareEnabled", {
            get: function () {
                return this._lensFlareEnabled;
            },
            set: function (enabled) {
                var blurIndex = this.gaussianBlurHPostProcesses.length - 2;
                if (enabled && !this._lensFlareEnabled) {
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlare", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlareShift", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlareCompose", this._scene.cameras);
                }
                else if (!enabled && this._lensFlareEnabled) {
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlare", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareShift", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareCompose", this._scene.cameras);
                }
                this._lensFlareEnabled = enabled;
            },
            enumerable: true,
            configurable: true
        });
        // Down Sample X4 Post-Processs
        StandardRenderingPipeline.prototype._createDownSampleX4PostProcess = function (scene, ratio) {
            var _this = this;
            var downSampleX4Offsets = new Array(32);
            this.downSampleX4PostProcess = new BABYLON.PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.downSampleX4PostProcess.onApply = function (effect) {
                var id = 0;
                for (var i = -2; i < 2; i++) {
                    for (var j = -2; j < 2; j++) {
                        downSampleX4Offsets[id] = (i + 0.5) * (1.0 / _this.downSampleX4PostProcess.width);
                        downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / _this.downSampleX4PostProcess.height);
                        id += 2;
                    }
                }
                effect.setArray2("dsOffsets", downSampleX4Offsets);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", function () { return _this.downSampleX4PostProcess; }, true));
        };
        // Brightpass Post-Process
        StandardRenderingPipeline.prototype._createBrightPassPostProcess = function (scene, ratio) {
            var _this = this;
            var brightOffsets = new Array(8);
            this.brightPassPostProcess = new BABYLON.PostProcess("HDRBrightPass", "standard", ["dsOffsets", "brightThreshold"], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.brightPassPostProcess.onApply = function (effect) {
                var sU = (1.0 / _this.brightPassPostProcess.width);
                var sV = (1.0 / _this.brightPassPostProcess.height);
                brightOffsets[0] = -0.5 * sU;
                brightOffsets[1] = 0.5 * sV;
                brightOffsets[2] = 0.5 * sU;
                brightOffsets[3] = 0.5 * sV;
                brightOffsets[4] = -0.5 * sU;
                brightOffsets[5] = -0.5 * sV;
                brightOffsets[6] = 0.5 * sU;
                brightOffsets[7] = -0.5 * sV;
                effect.setArray2("dsOffsets", brightOffsets);
                effect.setFloat("brightThreshold", _this.brightThreshold);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass", function () { return _this.brightPassPostProcess; }, true));
        };
        // Create gaussian blur H&V post-processes
        StandardRenderingPipeline.prototype._createGaussianBlurPostProcesses = function (scene, ratio, indice) {
            var _this = this;
            var blurOffsets = new Array(9);
            var blurWeights = new Array(9);
            var uniforms = ["blurOffsets", "blurWeights", "blurWidth"];
            var callback = function (height) {
                return function (effect) {
                    // Weights
                    var x = 0.0;
                    for (var i = 0; i < 9; i++) {
                        x = (i - 4.0) / 4.0;
                        blurWeights[i] =
                            _this.gaussianCoefficient
                                * (1.0 / Math.sqrt(2.0 * Math.PI * _this.gaussianStandardDeviation))
                                * Math.exp((-((x - _this.gaussianMean) * (x - _this.gaussianMean))) / (2.0 * _this.gaussianStandardDeviation * _this.gaussianStandardDeviation));
                    }
                    var lastOutputDimensions = {
                        width: scene.getEngine().getRenderWidth(),
                        height: scene.getEngine().getRenderHeight()
                    };
                    for (var i = 0; i < 9; i++) {
                        var value = (i - 4.0) * (1.0 / (height === true ? lastOutputDimensions.height : lastOutputDimensions.width));
                        blurOffsets[i] = value;
                    }
                    effect.setArray("blurOffsets", blurOffsets);
                    effect.setArray("blurWeights", blurWeights);
                    effect.setFloat("blurWidth", _this.blurWidth);
                };
            };
            // Create horizontal gaussian blur post-processes
            var gaussianBlurHPostProcess = new BABYLON.PostProcess("HDRGaussianBlurH" + ratio, "standard", uniforms, [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_H", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            gaussianBlurHPostProcess.onApply = callback(false);
            // Create vertical gaussian blur post-process
            var gaussianBlurVPostProcess = new BABYLON.PostProcess("HDRGaussianBlurV" + ratio, "standard", uniforms, [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_V", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            gaussianBlurVPostProcess.onApply = callback(true);
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurH" + indice, function () { return gaussianBlurHPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurV" + indice, function () { return gaussianBlurVPostProcess; }, true));
            // Finish
            this.gaussianBlurHPostProcesses.push(gaussianBlurHPostProcess);
            this.gaussianBlurVPostProcesses.push(gaussianBlurVPostProcess);
        };
        // Create texture adder post-process
        StandardRenderingPipeline.prototype._createTextureAdderPostProcess = function (scene, ratio) {
            var _this = this;
            var lastGaussianBlurPostProcess = this.gaussianBlurVPostProcesses[3];
            this.textureAdderPostProcess = new BABYLON.PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this.originalPostProcess);
                effect.setTexture("lensSampler", _this.lensTexture);
                effect.setFloat("exposure", _this.exposure);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", function () { return _this.textureAdderPostProcess; }, true));
        };
        // Create lens flare post-process
        StandardRenderingPipeline.prototype._createLensFlarePostProcess = function (scene, ratio) {
            var _this = this;
            this.lensFlarePostProcess = new BABYLON.PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define LENS_FLARE", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", function () { return _this.lensFlarePostProcess; }, false));
            this._createGaussianBlurPostProcesses(scene, ratio / 4, 4);
            this.lensFlareComposePostProcess = new BABYLON.PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", function () { return _this.lensFlareComposePostProcess; }, false));
            var resolution = new BABYLON.Vector2(0, 0);
            // Lens flare
            this.lensFlarePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("textureSampler", _this.gaussianBlurHPostProcesses[0]);
                effect.setTexture("lensColorSampler", _this.lensColorTexture);
                effect.setFloat("strength", _this.lensFlareStrength);
                effect.setFloat("ghostDispersal", _this.lensFlareGhostDispersal);
                effect.setFloat("haloWidth", _this.lensFlareHaloWidth);
                // Shift
                resolution.x = _this.lensFlarePostProcess.width;
                resolution.y = _this.lensFlarePostProcess.height;
                effect.setVector2("resolution", resolution);
                effect.setFloat("distortionStrength", _this.lensFlareDistortionStrength);
            };
            // Compose
            var scaleBias1 = BABYLON.Matrix.FromValues(2.0, 0.0, -1.0, 0.0, 0.0, 2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
            var scaleBias2 = BABYLON.Matrix.FromValues(0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
            this.lensFlareComposePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this.textureAdderFinalPostProcess);
                effect.setTexture("lensDirtSampler", _this.lensFlareDirtTexture);
                effect.setTexture("lensStarSampler", _this.lensStarTexture);
                // Lens start rotation matrix
                var camerax = _this._scene.activeCamera.getViewMatrix().getRow(0);
                var cameraz = _this._scene.activeCamera.getViewMatrix().getRow(2);
                var camRot = BABYLON.Vector3.Dot(camerax.toVector3(), new BABYLON.Vector3(1.0, 0.0, 0.0)) + BABYLON.Vector3.Dot(cameraz.toVector3(), new BABYLON.Vector3(0.0, 0.0, 1.0));
                camRot *= 4.0;
                var starRotation = BABYLON.Matrix.FromValues(Math.cos(camRot) * 0.5, -Math.sin(camRot), 0.0, 0.0, Math.sin(camRot), Math.cos(camRot) * 0.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
                var lensStarMatrix = scaleBias2.multiply(starRotation).multiply(scaleBias1);
                effect.setMatrix("lensStarMatrix", lensStarMatrix);
            };
        };
        // Create depth-of-field post-process
        StandardRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (scene, ratio) {
            var _this = this;
            this.depthOfFieldPostProcess = new BABYLON.PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this.textureAdderFinalPostProcess);
                effect.setTexture("depthSampler", _this._depthRenderer.getDepthMap());
                effect.setFloat("distance", _this.depthOfFieldDistance);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", function () { return _this.depthOfFieldPostProcess; }, true));
        };
        // Dispose
        StandardRenderingPipeline.prototype.dispose = function () {
            for (var i = 0; i < this._scene.cameras.length; i++) {
                var camera = this._scene.cameras[i];
                this.originalPostProcess.dispose(camera);
                this.downSampleX4PostProcess.dispose(camera);
                this.brightPassPostProcess.dispose(camera);
                this.textureAdderPostProcess.dispose(camera);
                for (var j = 0; j < this.gaussianBlurHPostProcesses.length; j++) {
                    this.gaussianBlurHPostProcesses[j].dispose(camera);
                }
                for (var j = 0; j < this.gaussianBlurVPostProcesses.length; j++) {
                    this.gaussianBlurVPostProcesses[j].dispose(camera);
                }
                this.textureAdderFinalPostProcess.dispose(camera);
                this.lensFlarePostProcess.dispose(camera);
                this.lensFlareComposePostProcess.dispose(camera);
                this.depthOfFieldPostProcess.dispose(camera);
            }
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            _super.prototype.dispose.call(this);
        };
        return StandardRenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.StandardRenderingPipeline = StandardRenderingPipeline;
})(BABYLON || (BABYLON = {}));
