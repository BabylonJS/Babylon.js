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
            this.depthOfFieldSourcePostProcess = null;
            this.depthOfFieldPostProcess = null;
            this.brightThreshold = 1.0;
            this.gaussianCoefficient = 0.25;
            this.gaussianMean = 1.0;
            this.gaussianStandardDeviation = 1.0;
            this.exposure = 1.0;
            this.lensTexture = null;
            this.depthOfFieldDistance = 10.0;
            this._depthRenderer = null;
            // Getters and setters
            this._blurEnabled = true;
            this._depthOfFieldEnabled = false;
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
            this.depthOfFieldSourcePostProcess = new BABYLON.PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfFieldSource", function () { return _this.depthOfFieldSourcePostProcess; }, true));
            // Create gaussian blur used by depth-of-field
            this._createGaussianBlurPostProcesses(scene, ratio / 2, 4);
            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfFieldSource", cameras);
            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH4", cameras);
            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV4", cameras);
            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfField", cameras);
        }
        Object.defineProperty(StandardRenderingPipeline.prototype, "BlurEnabled", {
            get: function () {
                return this._blurEnabled;
            },
            set: function (enabled) {
                if (enabled && !this._blurEnabled || !enabled && this._blurEnabled) {
                    for (var i = 0; i < this.gaussianBlurHPostProcesses.length - 1; i++) {
                        if (enabled) {
                            this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + i, this._scene.cameras);
                            this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + i, this._scene.cameras);
                        }
                        else {
                            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + i, this._scene.cameras);
                            this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + i, this._scene.cameras);
                        }
                    }
                }
                this._blurEnabled = enabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "DepthOfFieldEnabled", {
            get: function () {
                return this._depthOfFieldEnabled;
            },
            set: function (enabled) {
                if (enabled && !this._depthOfFieldEnabled) {
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRDepthOfFieldSource", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH4", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV4", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                    this._depthRenderer = this._scene.enableDepthRenderer();
                }
                else if (!enabled && this._depthOfFieldEnabled) {
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfFieldSource", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH4", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV4", this._scene.cameras);
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                }
                this._depthOfFieldEnabled = enabled;
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
            var uniforms = ["blurOffsets", "blurWeights"];
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
            this.textureAdderPostProcess = new BABYLON.PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define TEXTURE_ADDER", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this.originalPostProcess);
                effect.setTexture("lensSampler", _this.lensTexture);
                effect.setFloat("exposure", _this.exposure);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", function () { return _this.textureAdderPostProcess; }, true));
        };
        // Create depth-of-field post-process
        StandardRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (scene, ratio) {
            var _this = this;
            this.depthOfFieldPostProcess = new BABYLON.PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this.depthOfFieldSourcePostProcess);
                effect.setTexture("depthSampler", _this._depthRenderer.getDepthMap());
                effect.setFloat("distance", _this.depthOfFieldDistance);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", function () { return _this.depthOfFieldPostProcess; }, true));
        };
        return StandardRenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.StandardRenderingPipeline = StandardRenderingPipeline;
})(BABYLON || (BABYLON = {}));
