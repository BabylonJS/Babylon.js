var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var HDRRenderingPipeline = (function (_super) {
        __extends(HDRRenderingPipeline, _super);
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.PostProcess} originalPostProcess - the custom original color post-process. Must be "reusable". Can be null.
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function HDRRenderingPipeline(name, scene, ratio, originalPostProcess, cameras) {
            var _this = this;
            if (originalPostProcess === void 0) { originalPostProcess = null; }
            _super.call(this, scene.getEngine(), name);
            /**
            * Public members
            */
            // Gaussian Blur
            /**
            * Gaussian blur coefficient
            * @type {number}
            */
            this.gaussCoeff = 0.3;
            /**
            * Gaussian blur mean
            * @type {number}
            */
            this.gaussMean = 1.0;
            /**
            * Gaussian blur standard deviation
            * @type {number}
            */
            this.gaussStandDev = 0.8;
            /**
            * Gaussian blur multiplier. Multiplies the blur effect
            * @type {number}
            */
            this.gaussMultiplier = 4.0;
            // HDR
            /**
            * Exposure, controls the overall intensity of the pipeline
            * @type {number}
            */
            this.exposure = 1.0;
            /**
            * Minimum luminance that the post-process can output. Luminance is >= 0
            * @type {number}
            */
            this.minimumLuminance = 1.0;
            /**
            * Maximum luminance that the post-process can output. Must be suprerior to minimumLuminance
            * @type {number}
            */
            this.maximumLuminance = 1e20;
            /**
            * Increase rate for luminance: eye adaptation speed to dark
            * @type {number}
            */
            this.luminanceIncreaserate = 0.5;
            /**
            * Decrease rate for luminance: eye adaptation speed to bright
            * @type {number}
            */
            this.luminanceDecreaseRate = 0.5;
            // Bright pass
            /**
            * Minimum luminance needed to compute HDR
            * @type {number}
            */
            this.brightThreshold = 0.8;
            this._needUpdate = true;
            this._scene = scene;
            // Bright pass
            this._createBrightPassPostProcess(scene, ratio);
            // Down sample X4
            this._createDownSampleX4PostProcess(scene, ratio);
            // Create gaussian blur post-processes
            this._createGaussianBlurPostProcess(scene, ratio);
            // Texture adder
            this._createTextureAdderPostProcess(scene, ratio);
            // Luminance generator
            this._createLuminanceGeneratorPostProcess(scene);
            // HDR
            this._createHDRPostProcess(scene, ratio);
            // Pass postprocess
            if (originalPostProcess === null) {
                this._originalPostProcess = new BABYLON.PassPostProcess("hdr", ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            }
            else {
                this._originalPostProcess = originalPostProcess;
            }
            // Configure pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", function () { return _this._originalPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass", function () { return _this._brightPassPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", function () { return _this._downSampleX4PostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurH", function () { return _this._guassianBlurHPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurV", function () { return _this._guassianBlurVPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", function () { return _this._textureAdderPostProcess; }, true));
            var addDownSamplerPostProcess = function (id) {
                _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDownSampler" + id, function () { return _this._downSamplePostProcesses[id]; }, true));
            };
            for (var i = HDRRenderingPipeline.LUM_STEPS - 1; i >= 0; i--) {
                addDownSamplerPostProcess(i);
            }
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDR", function () { return _this._hdrPostProcess; }, true));
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
            this.update();
        }
        /**
        * Tells the pipeline to update its post-processes
        */
        HDRRenderingPipeline.prototype.update = function () {
            this._needUpdate = true;
        };
        /**
        * Returns the current calculated luminance
        */
        HDRRenderingPipeline.prototype.getCurrentLuminance = function () {
            return this._hdrCurrentLuminance;
        };
        /**
        * Returns the currently drawn luminance
        */
        HDRRenderingPipeline.prototype.getOutputLuminance = function () {
            return this._hdrOutputLuminance;
        };
        /**
        * Releases the rendering pipeline and its internal effects. Detaches pipeline from cameras
        */
        HDRRenderingPipeline.prototype.dispose = function () {
            this._originalPostProcess = undefined;
            this._brightPassPostProcess = undefined;
            this._downSampleX4PostProcess = undefined;
            this._guassianBlurHPostProcess = undefined;
            this._guassianBlurVPostProcess = undefined;
            this._textureAdderPostProcess = undefined;
            for (var i = HDRRenderingPipeline.LUM_STEPS - 1; i >= 0; i--) {
                this._downSamplePostProcesses[i] = undefined;
            }
            this._hdrPostProcess = undefined;
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
        };
        /**
        * Creates the HDR post-process and computes the luminance adaptation
        */
        HDRRenderingPipeline.prototype._createHDRPostProcess = function (scene, ratio) {
            var _this = this;
            var hdrLastLuminance = 0.0;
            this._hdrOutputLuminance = -1.0;
            this._hdrCurrentLuminance = 1.0;
            this._hdrPostProcess = new BABYLON.PostProcess("hdr", "hdr", ["exposure", "avgLuminance"], ["otherSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define HDR");
            this._hdrPostProcess.onApply = function (effect) {
                if (_this._hdrOutputLuminance < 0.0) {
                    _this._hdrOutputLuminance = _this._hdrCurrentLuminance;
                }
                else {
                    var dt = (hdrLastLuminance - (hdrLastLuminance + scene.getEngine().getDeltaTime())) / 1000.0;
                    if (_this._hdrCurrentLuminance < _this._hdrOutputLuminance + _this.luminanceDecreaseRate * dt) {
                        _this._hdrOutputLuminance += _this.luminanceDecreaseRate * dt;
                    }
                    else if (_this._hdrCurrentLuminance > _this._hdrOutputLuminance - _this.luminanceIncreaserate * dt) {
                        _this._hdrOutputLuminance -= _this.luminanceIncreaserate * dt;
                    }
                    else {
                        _this._hdrOutputLuminance = _this._hdrCurrentLuminance;
                    }
                }
                _this._hdrOutputLuminance = BABYLON.MathTools.Clamp(_this._hdrOutputLuminance, _this.minimumLuminance, _this.maximumLuminance);
                hdrLastLuminance += scene.getEngine().getDeltaTime();
                effect.setTextureFromPostProcess("textureSampler", _this._textureAdderPostProcess);
                effect.setTextureFromPostProcess("otherSampler", _this._originalPostProcess);
                effect.setFloat("exposure", _this.exposure);
                effect.setFloat("avgLuminance", _this._hdrOutputLuminance);
                _this._needUpdate = false;
            };
        };
        /**
        * Texture Adder post-process
        */
        HDRRenderingPipeline.prototype._createTextureAdderPostProcess = function (scene, ratio) {
            var _this = this;
            this._textureAdderPostProcess = new BABYLON.PostProcess("hdr", "hdr", [], ["otherSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER");
            this._textureAdderPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this._originalPostProcess);
            };
        };
        /**
        * Down sample X4 post-process
        */
        HDRRenderingPipeline.prototype._createDownSampleX4PostProcess = function (scene, ratio) {
            var _this = this;
            var downSampleX4Offsets = new Array(32);
            this._downSampleX4PostProcess = new BABYLON.PostProcess("hdr", "hdr", ["dsOffsets"], [], ratio / 4, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4");
            this._downSampleX4PostProcess.onApply = function (effect) {
                if (_this._needUpdate) {
                    var id = 0;
                    for (var i = -2; i < 2; i++) {
                        for (var j = -2; j < 2; j++) {
                            downSampleX4Offsets[id] = (i + 0.5) * (1.0 / _this._downSampleX4PostProcess.width);
                            downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / _this._downSampleX4PostProcess.height);
                            id += 2;
                        }
                    }
                }
                effect.setArray2("dsOffsets", downSampleX4Offsets);
            };
        };
        /**
        * Bright pass post-process
        */
        HDRRenderingPipeline.prototype._createBrightPassPostProcess = function (scene, ratio) {
            var _this = this;
            var brightOffsets = new Array(8);
            var brightPassCallback = function (effect) {
                if (_this._needUpdate) {
                    var sU = (1.0 / _this._brightPassPostProcess.width);
                    var sV = (1.0 / _this._brightPassPostProcess.height);
                    brightOffsets[0] = -0.5 * sU;
                    brightOffsets[1] = 0.5 * sV;
                    brightOffsets[2] = 0.5 * sU;
                    brightOffsets[3] = 0.5 * sV;
                    brightOffsets[4] = -0.5 * sU;
                    brightOffsets[5] = -0.5 * sV;
                    brightOffsets[6] = 0.5 * sU;
                    brightOffsets[7] = -0.5 * sV;
                }
                effect.setArray2("dsOffsets", brightOffsets);
                effect.setFloat("brightThreshold", _this.brightThreshold);
            };
            this._brightPassPostProcess = new BABYLON.PostProcess("hdr", "hdr", ["dsOffsets", "brightThreshold"], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS");
            this._brightPassPostProcess.onApply = brightPassCallback;
        };
        /**
        * Luminance generator. Creates the luminance post-process and down sample post-processes
        */
        HDRRenderingPipeline.prototype._createLuminanceGeneratorPostProcess = function (scene) {
            var _this = this;
            var lumSteps = HDRRenderingPipeline.LUM_STEPS;
            var luminanceOffsets = new Array(8);
            var downSampleOffsets = new Array(18);
            var halfDestPixelSize;
            this._downSamplePostProcesses = new Array(lumSteps);
            // Utils for luminance
            var luminanceUpdateSourceOffsets = function (width, height) {
                var sU = (1.0 / width);
                var sV = (1.0 / height);
                luminanceOffsets[0] = -0.5 * sU;
                luminanceOffsets[1] = 0.5 * sV;
                luminanceOffsets[2] = 0.5 * sU;
                luminanceOffsets[3] = 0.5 * sV;
                luminanceOffsets[4] = -0.5 * sU;
                luminanceOffsets[5] = -0.5 * sV;
                luminanceOffsets[6] = 0.5 * sU;
                luminanceOffsets[7] = -0.5 * sV;
            };
            var luminanceUpdateDestOffsets = function (width, height) {
                var id = 0;
                for (var x = -1; x < 2; x++) {
                    for (var y = -1; y < 2; y++) {
                        downSampleOffsets[id] = (x) / width;
                        downSampleOffsets[id + 1] = (y) / height;
                        id += 2;
                    }
                }
            };
            // Luminance callback
            var luminanceCallback = function (effect) {
                if (_this._needUpdate) {
                    luminanceUpdateSourceOffsets(_this._textureAdderPostProcess.width, _this._textureAdderPostProcess.height);
                }
                effect.setTextureFromPostProcess("textureSampler", _this._textureAdderPostProcess);
                effect.setArray2("lumOffsets", luminanceOffsets);
            };
            // Down sample callbacks
            var downSampleCallback = function (indice) {
                var i = indice;
                return function (effect) {
                    luminanceUpdateSourceOffsets(_this._downSamplePostProcesses[i].width, _this._downSamplePostProcesses[i].height);
                    luminanceUpdateDestOffsets(_this._downSamplePostProcesses[i].width, _this._downSamplePostProcesses[i].height);
                    halfDestPixelSize = 0.5 / _this._downSamplePostProcesses[i].width;
                    effect.setTextureFromPostProcess("textureSampler", _this._downSamplePostProcesses[i + 1]);
                    effect.setFloat("halfDestPixelSize", halfDestPixelSize);
                    effect.setArray2("dsOffsets", downSampleOffsets);
                };
            };
            var downSampleAfterRenderCallback = function (effect) {
                // Unpack result
                var pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                var bit_shift = new BABYLON.Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                _this._hdrCurrentLuminance = (pixel[0] * bit_shift.x + pixel[1] * bit_shift.y + pixel[2] * bit_shift.z + pixel[3] * bit_shift.w) / 100.0;
            };
            // Create luminance post-process
            var ratio = { width: Math.pow(3, lumSteps - 1), height: Math.pow(3, lumSteps - 1) };
            this._downSamplePostProcesses[lumSteps - 1] = new BABYLON.PostProcess("hdr", "hdr", ["lumOffsets"], [], ratio, null, BABYLON.Texture.NEAREST_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE_GENERATOR", BABYLON.Engine.TEXTURETYPE_FLOAT);
            this._downSamplePostProcesses[lumSteps - 1].onApply = luminanceCallback;
            // Create down sample post-processes
            for (var i = lumSteps - 2; i >= 0; i--) {
                var length = Math.pow(3, i);
                ratio = { width: length, height: length };
                var defines = "#define DOWN_SAMPLE\n";
                if (i === 0) {
                    defines += "#define FINAL_DOWN_SAMPLE\n"; // To pack the result
                }
                this._downSamplePostProcesses[i] = new BABYLON.PostProcess("hdr", "hdr", ["dsOffsets", "halfDestPixelSize"], [], ratio, null, BABYLON.Texture.NEAREST_SAMPLINGMODE, scene.getEngine(), false, defines, BABYLON.Engine.TEXTURETYPE_FLOAT);
                this._downSamplePostProcesses[i].onApply = downSampleCallback(i);
                if (i === 0) {
                    this._downSamplePostProcesses[i].onAfterRender = downSampleAfterRenderCallback;
                }
            }
        };
        /**
        * Gaussian blur post-processes. Horizontal and Vertical
        */
        HDRRenderingPipeline.prototype._createGaussianBlurPostProcess = function (scene, ratio) {
            var _this = this;
            var blurOffsetsW = new Array(9);
            var blurOffsetsH = new Array(9);
            var blurWeights = new Array(9);
            var uniforms = ["blurOffsets", "blurWeights", "multiplier"];
            // Utils for gaussian blur
            var calculateBlurOffsets = function (height) {
                var lastOutputDimensions = {
                    width: scene.getEngine().getRenderWidth(),
                    height: scene.getEngine().getRenderHeight()
                };
                for (var i = 0; i < 9; i++) {
                    var value = (i - 4.0) * (1.0 / (height === true ? lastOutputDimensions.height : lastOutputDimensions.width));
                    if (height) {
                        blurOffsetsH[i] = value;
                    }
                    else {
                        blurOffsetsW[i] = value;
                    }
                }
            };
            var calculateWeights = function () {
                var x = 0.0;
                for (var i = 0; i < 9; i++) {
                    x = (i - 4.0) / 4.0;
                    blurWeights[i] = _this.gaussCoeff * (1.0 / Math.sqrt(2.0 * Math.PI * _this.gaussStandDev)) * Math.exp((-((x - _this.gaussMean) * (x - _this.gaussMean))) / (2.0 * _this.gaussStandDev * _this.gaussStandDev));
                }
            };
            // Callback
            var gaussianBlurCallback = function (height) {
                return function (effect) {
                    if (_this._needUpdate) {
                        calculateWeights();
                        calculateBlurOffsets(height);
                    }
                    effect.setArray("blurOffsets", height ? blurOffsetsH : blurOffsetsW);
                    effect.setArray("blurWeights", blurWeights);
                    effect.setFloat("multiplier", _this.gaussMultiplier);
                };
            };
            // Create horizontal gaussian blur post-processes
            this._guassianBlurHPostProcess = new BABYLON.PostProcess("hdr", "hdr", uniforms, [], ratio / 4, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_H");
            this._guassianBlurHPostProcess.onApply = gaussianBlurCallback(false);
            // Create vertical gaussian blur post-process
            this._guassianBlurVPostProcess = new BABYLON.PostProcess("hdr", "hdr", uniforms, [], ratio / 4, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_V");
            this._guassianBlurVPostProcess.onApply = gaussianBlurCallback(true);
        };
        // Luminance generator
        HDRRenderingPipeline.LUM_STEPS = 6;
        return HDRRenderingPipeline;
    })(BABYLON.PostProcessRenderPipeline);
    BABYLON.HDRRenderingPipeline = HDRRenderingPipeline;
})(BABYLON || (BABYLON = {}));
