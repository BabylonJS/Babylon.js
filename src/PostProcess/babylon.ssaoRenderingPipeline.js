var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var SSAORenderingPipeline = (function (_super) {
        __extends(SSAORenderingPipeline, _super);
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function SSAORenderingPipeline(name, scene, ratio, cameras) {
            var _this = this;
            _super.call(this, scene.getEngine(), name);
            // Members
            /**
            * The PassPostProcess id in the pipeline that contains the original scene color
            * @type {string}
            */
            this.SSAOOriginalSceneColorEffect = "SSAOOriginalSceneColorEffect";
            /**
            * The SSAO PostProcess id in the pipeline
            * @type {string}
            */
            this.SSAORenderEffect = "SSAORenderEffect";
            /**
            * The horizontal blur PostProcess id in the pipeline
            * @type {string}
            */
            this.SSAOBlurHRenderEffect = "SSAOBlurHRenderEffect";
            /**
            * The vertical blur PostProcess id in the pipeline
            * @type {string}
            */
            this.SSAOBlurVRenderEffect = "SSAOBlurVRenderEffect";
            /**
            * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
            * @type {string}
            */
            this.SSAOCombineRenderEffect = "SSAOCombineRenderEffect";
            /**
            * The output strength of the SSAO post-process. Default value is 1.0.
            * @type {number}
            */
            this.totalStrength = 1.0;
            /**
            * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
            * @type {number}
            */
            this.radius = 0.0001;
            /**
            * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
            * Must not be equal to fallOff and superior to fallOff.
            * Default value is 0.975
            * @type {number}
            */
            this.area = 0.0075;
            /**
            * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
            * Must not be equal to area and inferior to area.
            * Default value is 0.0
            * @type {number}
            */
            this.fallOff = 0.000001;
            /**
            * The base color of the SSAO post-process
            * The final result is "base + ssao" between [0, 1]
            * @type {number}
            */
            this.base = 0.5;
            this._firstUpdate = true;
            this._scene = scene;
            // Set up assets
            this._createRandomTexture();
            this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            var ssaoRatio = ratio.ssaoRatio || ratio;
            var combineRatio = ratio.combineRatio || ratio;
            this._originalColorPostProcess = new BABYLON.PassPostProcess("SSAOOriginalSceneColor", combineRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOPostProcess(ssaoRatio);
            this._blurHPostProcess = new BABYLON.BlurPostProcess("SSAOBlurH", new BABYLON.Vector2(1.0, 0.0), 2.0, ssaoRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._blurVPostProcess = new BABYLON.BlurPostProcess("SSAOBlurV", new BABYLON.Vector2(0.0, 1.0), 2.0, ssaoRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOCombinePostProcess(combineRatio);
            // Set up pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOOriginalSceneColorEffect, function () { return _this._originalColorPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAORenderEffect, function () { return _this._ssaoPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurHRenderEffect, function () { return _this._blurHPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurVRenderEffect, function () { return _this._blurVPostProcess; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOCombineRenderEffect, function () { return _this._ssaoCombinePostProcess; }, true));
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras)
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
        // Public Methods
        /**
         * Returns the horizontal blur PostProcess
         * @return {BABYLON.BlurPostProcess} The horizontal blur post-process
         */
        SSAORenderingPipeline.prototype.getBlurHPostProcess = function () {
            return this._blurHPostProcess;
        };
        /**
         * Returns the vertical blur PostProcess
         * @return {BABYLON.BlurPostProcess} The vertical blur post-process
         */
        SSAORenderingPipeline.prototype.getBlurVPostProcess = function () {
            return this._blurVPostProcess;
        };
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        SSAORenderingPipeline.prototype.dispose = function (disableDepthRender) {
            if (disableDepthRender === void 0) { disableDepthRender = false; }
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            this._originalColorPostProcess = undefined;
            this._ssaoPostProcess = undefined;
            this._blurHPostProcess = undefined;
            this._blurVPostProcess = undefined;
            this._ssaoCombinePostProcess = undefined;
            this._randomTexture.dispose();
            if (disableDepthRender)
                this._scene.disableDepthRenderer();
        };
        // Private Methods
        SSAORenderingPipeline.prototype._createSSAOPostProcess = function (ratio) {
            var _this = this;
            var numSamples = 16;
            var sampleSphere = [
                0.5381, 0.1856, -0.4319,
                0.1379, 0.2486, 0.4430,
                0.3371, 0.5679, -0.0057,
                -0.6999, -0.0451, -0.0019,
                0.0689, -0.1598, -0.8547,
                0.0560, 0.0069, -0.1843,
                -0.0146, 0.1402, 0.0762,
                0.0100, -0.1924, -0.0344,
                -0.3577, -0.5301, -0.4358,
                -0.3169, 0.1063, 0.0158,
                0.0103, -0.5869, 0.0046,
                -0.0897, -0.4940, 0.3287,
                0.7119, -0.0154, -0.0918,
                -0.0533, 0.0596, -0.5411,
                0.0352, -0.0631, 0.5460,
                -0.4776, 0.2847, -0.0271
            ];
            var samplesFactor = 1.0 / numSamples;
            this._ssaoPostProcess = new BABYLON.PostProcess("ssao", "ssao", [
                "sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius",
                "area", "fallOff", "base"
            ], ["randomSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define SAMPLES " + numSamples);
            this._ssaoPostProcess.onApply = function (effect) {
                if (_this._firstUpdate) {
                    effect.setArray3("sampleSphere", sampleSphere);
                    effect.setFloat("samplesFactor", samplesFactor);
                    effect.setFloat("randTextureTiles", 4.0);
                    _this._firstUpdate = false;
                }
                effect.setFloat("totalStrength", _this.totalStrength);
                effect.setFloat("radius", _this.radius);
                effect.setFloat("area", _this.area);
                effect.setFloat("fallOff", _this.fallOff);
                effect.setFloat("base", _this.base);
                effect.setTexture("textureSampler", _this._depthTexture);
                effect.setTexture("randomSampler", _this._randomTexture);
            };
        };
        SSAORenderingPipeline.prototype._createSSAOCombinePostProcess = function (ratio) {
            var _this = this;
            this._ssaoCombinePostProcess = new BABYLON.PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._ssaoCombinePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("originalColor", _this._originalColorPostProcess);
            };
        };
        SSAORenderingPipeline.prototype._createRandomTexture = function () {
            var size = 512;
            this._randomTexture = new BABYLON.DynamicTexture("SSAORandomTexture", size, this._scene, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
            this._randomTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            var context = this._randomTexture.getContext();
            var rand = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            var randVector = BABYLON.Vector3.Zero();
            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    randVector.x = Math.floor(rand(-1.0, 1.0) * 255);
                    randVector.y = Math.floor(rand(-1.0, 1.0) * 255);
                    randVector.z = Math.floor(rand(-1.0, 1.0) * 255);
                    context.fillStyle = 'rgb(' + randVector.x + ', ' + randVector.y + ', ' + randVector.z + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._randomTexture.update(false);
        };
        return SSAORenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.SSAORenderingPipeline = SSAORenderingPipeline;
})(BABYLON || (BABYLON = {}));
