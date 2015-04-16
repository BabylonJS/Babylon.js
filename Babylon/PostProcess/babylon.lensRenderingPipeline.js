var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var LensRenderingPipeline = (function (_super) {
        __extends(LensRenderingPipeline, _super);
        /**
         * @constructor
         *
         * Effect parameters are as follow:
         * {
         *      chromatic_aberration: number;       // from 0 to x (1 for realism)
         *      edge_blur: number;                  // from 0 to x (1 for realism)
         *      distortion: number;                 // from 0 to x (1 for realism)
         *      grain_amount: number;               // from 0 to 1
         *      grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
         *      dof_focus_depth: number;            // depth-of-field: focus depth; unset to disable (disabled by default)
         *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
         *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
         *      dof_gain: number;                   // depth-of-field: depthOfField gain; unset to disable (disabled by default)
         *      dof_threshold: number;              // depth-of-field: depthOfField threshold (default: 1)
         *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
         * }
         * Note: if an effect parameter is unset, effect is disabled
         *
         * @param {string} name - The rendering pipeline name
         * @param {object} parameters - An object containing all parameters (see above)
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function LensRenderingPipeline(name, parameters, scene, ratio, cameras) {
            var _this = this;
            if (ratio === void 0) { ratio = 1.0; }
            _super.call(this, scene.getEngine(), name);
            // Lens effects can be of the following:
            // - chromatic aberration (slight shift of RGB colors)
            // - blur on the edge of the lens
            // - lens distortion
            // - depth-of-field blur & highlights enhancing
            // - depth-of-field 'bokeh' effect (shapes appearing in blurred areas)
            // - grain effect (noise or custom texture)
            // Two additional texture samplers are needed:
            // - depth map (for depth-of-field)
            // - grain texture
            /**
            * The chromatic aberration PostProcess id in the pipeline
            * @type {string}
            */
            this.LensChromaticAberrationEffect = "LensChromaticAberrationEffect";
            /**
            * The highlights enhancing PostProcess id in the pipeline
            * @type {string}
            */
            this.HighlightsEnhancingEffect = "HighlightsEnhancingEffect";
            /**
            * The depth-of-field PostProcess id in the pipeline
            * @type {string}
            */
            this.LensDepthOfFieldEffect = "LensDepthOfFieldEffect";
            this._scene = scene;
            // Fetch texture samplers
            this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            if (parameters.grain_texture) {
                this._grainTexture = parameters.grain_texture;
            }
            else {
                this._createGrainTexture();
            }
            // save parameters
            this._edgeBlur = parameters.edge_blur ? parameters.edge_blur : 0;
            this._grainAmount = parameters.grain_amount ? parameters.grain_amount : 0;
            this._chromaticAberration = parameters.chromatic_aberration ? parameters.chromatic_aberration : 0;
            this._distortion = parameters.distortion ? parameters.distortion : 0;
            this._highlightsGain = parameters.dof_gain !== undefined ? parameters.dof_gain : -1;
            this._highlightsThreshold = parameters.dof_threshold ? parameters.dof_threshold : 1;
            this._dofDepth = parameters.dof_focus_depth !== undefined ? parameters.dof_focus_depth : -1;
            this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
            this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
            this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;
            // Create effects
            this._createChromaticAberrationPostProcess(ratio);
            this._createHighlightsPostProcess(ratio);
            this._createDepthOfFieldPostProcess(ratio);
            // Set up pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.LensChromaticAberrationEffect, function () {
                return _this._chromaticAberrationPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.HighlightsEnhancingEffect, function () {
                return _this._highlightsPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.LensDepthOfFieldEffect, function () {
                return _this._depthOfFieldPostProcess;
            }, true));
            if (this._highlightsGain == -1) {
                this._disableEffect(this.HighlightsEnhancingEffect, null);
            }
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
        }
        // public methods (self explanatory)
        LensRenderingPipeline.prototype.setEdgeBlur = function (amount) {
            this._edgeBlur = amount;
        };
        LensRenderingPipeline.prototype.disableEdgeBlur = function () {
            this._edgeBlur = 0;
        };
        LensRenderingPipeline.prototype.setGrainAmount = function (amount) {
            this._grainAmount = amount;
        };
        LensRenderingPipeline.prototype.disableGrain = function () {
            this._grainAmount = 0;
        };
        LensRenderingPipeline.prototype.setChromaticAberration = function (amount) {
            this._chromaticAberration = amount;
        };
        LensRenderingPipeline.prototype.disableChromaticAberration = function () {
            this._chromaticAberration = 0;
        };
        LensRenderingPipeline.prototype.setEdgeDistortion = function (amount) {
            this._distortion = amount;
        };
        LensRenderingPipeline.prototype.disableEdgeDistortion = function () {
            this._distortion = 0;
        };
        LensRenderingPipeline.prototype.setFocusDepth = function (amount) {
            this._dofDepth = amount;
        };
        LensRenderingPipeline.prototype.disableDepthOfField = function () {
            this._dofDepth = -1;
        };
        LensRenderingPipeline.prototype.setAperture = function (amount) {
            this._dofAperture = amount;
        };
        LensRenderingPipeline.prototype.enablePentagonBokeh = function () {
            this._dofPentagon = true;
        };
        LensRenderingPipeline.prototype.disablePentagonBokeh = function () {
            this._dofPentagon = false;
        };
        LensRenderingPipeline.prototype.enableNoiseBlur = function () {
            this._blurNoise = true;
        };
        LensRenderingPipeline.prototype.disableNoiseBlur = function () {
            this._blurNoise = false;
        };
        LensRenderingPipeline.prototype.setHighlightsGain = function (amount) {
            this._highlightsGain = amount;
        };
        LensRenderingPipeline.prototype.setHighlightsThreshold = function (amount) {
            if (this._highlightsGain == -1) {
                this._highlightsGain = 1.0;
            }
            this._highlightsThreshold = amount;
        };
        LensRenderingPipeline.prototype.disableHighlights = function () {
            this._highlightsGain = -1;
        };
        /**
         * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
         */
        LensRenderingPipeline.prototype.dispose = function (disableDepthRender) {
            if (disableDepthRender === void 0) { disableDepthRender = false; }
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            this._chromaticAberrationPostProcess = undefined;
            this._highlightsPostProcess = undefined;
            this._depthOfFieldPostProcess = undefined;
            this._grainTexture.dispose();
            if (disableDepthRender)
                this._scene.disableDepthRenderer();
        };
        // colors shifting and distortion
        LensRenderingPipeline.prototype._createChromaticAberrationPostProcess = function (ratio) {
            var _this = this;
            this._chromaticAberrationPostProcess = new BABYLON.PostProcess("LensChromaticAberration", "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height"], [], ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._chromaticAberrationPostProcess.onApply = function (effect) {
                effect.setFloat('chromatic_aberration', _this._chromaticAberration);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
            };
        };
        // highlights enhancing
        LensRenderingPipeline.prototype._createHighlightsPostProcess = function (ratio) {
            var _this = this;
            this._highlightsPostProcess = new BABYLON.PostProcess("LensHighlights", "lensHighlights", ["pentagon", "gain", "threshold", "screen_width", "screen_height"], [], ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._highlightsPostProcess.onApply = function (effect) {
                effect.setFloat('gain', _this._highlightsGain);
                effect.setFloat('threshold', _this._highlightsThreshold);
                effect.setBool('pentagon', _this._dofPentagon);
                effect.setTextureFromPostProcess("textureSampler", _this._chromaticAberrationPostProcess);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
            };
        };
        // colors shifting and distortion
        LensRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (ratio) {
            var _this = this;
            this._depthOfFieldPostProcess = new BABYLON.PostProcess("LensDepthOfField", "depthOfField", [
                "focus_depth",
                "aperture",
                "pentagon",
                "maxZ",
                "edge_blur",
                "chromatic_aberration",
                "distortion",
                "blur_noise",
                "grain_amount",
                "screen_width",
                "screen_height",
                "highlights"
            ], ["depthSampler", "grainSampler", "highlightsSampler"], ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._depthOfFieldPostProcess.onApply = function (effect) {
                effect.setBool('blur_noise', _this._blurNoise);
                effect.setFloat('maxZ', _this._scene.activeCamera.maxZ);
                effect.setFloat('grain_amount', _this._grainAmount);
                effect.setTexture("depthSampler", _this._depthTexture);
                effect.setTexture("grainSampler", _this._grainTexture);
                effect.setTextureFromPostProcess("textureSampler", _this._highlightsPostProcess);
                effect.setTextureFromPostProcess("highlightsSampler", _this._depthOfFieldPostProcess);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
                effect.setFloat('distortion', _this._distortion);
                effect.setFloat('focus_depth', _this._dofDepth);
                effect.setFloat('aperture', _this._dofAperture);
                effect.setFloat('edge_blur', _this._edgeBlur);
                effect.setBool('highlights', (_this._highlightsGain != -1));
            };
        };
        // creates a black and white random noise texture, 512x512
        LensRenderingPipeline.prototype._createGrainTexture = function () {
            var size = 512;
            this._grainTexture = new BABYLON.DynamicTexture("LensNoiseTexture", size, this._scene, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
            this._grainTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this._grainTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            var context = this._grainTexture.getContext();
            var rand = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            var value;
            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    value = Math.floor(rand(0.42, 0.58) * 255);
                    context.fillStyle = 'rgb(' + value + ', ' + value + ', ' + value + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._grainTexture.update(false);
        };
        return LensRenderingPipeline;
    })(BABYLON.PostProcessRenderPipeline);
    BABYLON.LensRenderingPipeline = LensRenderingPipeline;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.lensRenderingPipeline.js.map