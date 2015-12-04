// BABYLON.JS Chromatic Aberration GLSL Shader
// Author: Olivier Guyot
// Separates very slightly R, G and B colors on the edges of the screen
// Inspired by Francois Tarlier & Martins Upitis
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
         *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
         *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
         *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
         *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
         *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
         *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
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
            this._dofDistance = parameters.dof_focus_distance !== undefined ? parameters.dof_focus_distance : -1;
            this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
            this._dofDarken = parameters.dof_darken ? parameters.dof_darken : 0;
            this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
            this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;
            // Create effects
            this._createChromaticAberrationPostProcess(ratio);
            this._createHighlightsPostProcess(ratio);
            this._createDepthOfFieldPostProcess(ratio / 4);
            // Set up pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.LensChromaticAberrationEffect, function () { return _this._chromaticAberrationPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.HighlightsEnhancingEffect, function () { return _this._highlightsPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.LensDepthOfFieldEffect, function () { return _this._depthOfFieldPostProcess; }, true));
            if (this._highlightsGain === -1) {
                this._disableEffect(this.HighlightsEnhancingEffect, null);
            }
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
        }
        // public methods (self explanatory)
        LensRenderingPipeline.prototype.setEdgeBlur = function (amount) { this._edgeBlur = amount; };
        LensRenderingPipeline.prototype.disableEdgeBlur = function () { this._edgeBlur = 0; };
        LensRenderingPipeline.prototype.setGrainAmount = function (amount) { this._grainAmount = amount; };
        LensRenderingPipeline.prototype.disableGrain = function () { this._grainAmount = 0; };
        LensRenderingPipeline.prototype.setChromaticAberration = function (amount) { this._chromaticAberration = amount; };
        LensRenderingPipeline.prototype.disableChromaticAberration = function () { this._chromaticAberration = 0; };
        LensRenderingPipeline.prototype.setEdgeDistortion = function (amount) { this._distortion = amount; };
        LensRenderingPipeline.prototype.disableEdgeDistortion = function () { this._distortion = 0; };
        LensRenderingPipeline.prototype.setFocusDistance = function (amount) { this._dofDistance = amount; };
        LensRenderingPipeline.prototype.disableDepthOfField = function () { this._dofDistance = -1; };
        LensRenderingPipeline.prototype.setAperture = function (amount) { this._dofAperture = amount; };
        LensRenderingPipeline.prototype.setDarkenOutOfFocus = function (amount) { this._dofDarken = amount; };
        LensRenderingPipeline.prototype.enablePentagonBokeh = function () {
            this._highlightsPostProcess.updateEffect("#define PENTAGON\n");
        };
        LensRenderingPipeline.prototype.disablePentagonBokeh = function () {
            this._highlightsPostProcess.updateEffect();
        };
        LensRenderingPipeline.prototype.enableNoiseBlur = function () { this._blurNoise = true; };
        LensRenderingPipeline.prototype.disableNoiseBlur = function () { this._blurNoise = false; };
        LensRenderingPipeline.prototype.setHighlightsGain = function (amount) {
            this._highlightsGain = amount;
        };
        LensRenderingPipeline.prototype.setHighlightsThreshold = function (amount) {
            if (this._highlightsGain === -1) {
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
            this._chromaticAberrationPostProcess = new BABYLON.PostProcess("LensChromaticAberration", "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height"], // uniforms
            [], // samplers
            ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._chromaticAberrationPostProcess.onApply = function (effect) {
                effect.setFloat('chromatic_aberration', _this._chromaticAberration);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
            };
        };
        // highlights enhancing
        LensRenderingPipeline.prototype._createHighlightsPostProcess = function (ratio) {
            var _this = this;
            this._highlightsPostProcess = new BABYLON.PostProcess("LensHighlights", "lensHighlights", ["gain", "threshold", "screen_width", "screen_height"], // uniforms
            [], // samplers
            ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, this._dofPentagon ? "#define PENTAGON\n" : "");
            this._highlightsPostProcess.onApply = function (effect) {
                effect.setFloat('gain', _this._highlightsGain);
                effect.setFloat('threshold', _this._highlightsThreshold);
                effect.setTextureFromPostProcess("textureSampler", _this._chromaticAberrationPostProcess);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
            };
        };
        // colors shifting and distortion
        LensRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (ratio) {
            var _this = this;
            this._depthOfFieldPostProcess = new BABYLON.PostProcess("LensDepthOfField", "depthOfField", [
                "grain_amount", "blur_noise", "screen_width", "screen_height", "distortion", "dof_enabled",
                "screen_distance", "aperture", "darken", "edge_blur", "highlights", "near", "far"
            ], ["depthSampler", "grainSampler", "highlightsSampler"], ratio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._depthOfFieldPostProcess.onApply = function (effect) {
                effect.setTexture("depthSampler", _this._depthTexture);
                effect.setTexture("grainSampler", _this._grainTexture);
                effect.setTextureFromPostProcess("textureSampler", _this._highlightsPostProcess);
                effect.setTextureFromPostProcess("highlightsSampler", _this._depthOfFieldPostProcess);
                effect.setFloat('grain_amount', _this._grainAmount);
                effect.setBool('blur_noise', _this._blurNoise);
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderingCanvas().height);
                effect.setFloat('distortion', _this._distortion);
                effect.setBool('dof_enabled', (_this._dofDistance !== -1));
                effect.setFloat('screen_distance', 1.0 / (0.1 - 1.0 / _this._dofDistance));
                effect.setFloat('aperture', _this._dofAperture);
                effect.setFloat('darken', _this._dofDarken);
                effect.setFloat('edge_blur', _this._edgeBlur);
                effect.setBool('highlights', (_this._highlightsGain !== -1));
                effect.setFloat('near', _this._scene.activeCamera.minZ);
                effect.setFloat('far', _this._scene.activeCamera.maxZ);
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
