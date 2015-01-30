var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var SSAORenderingPipeline = (function (_super) {
        __extends(SSAORenderingPipeline, _super);
        function SSAORenderingPipeline(name, scene, ratio) {
            var _this = this;
            if (ratio === void 0) { ratio = 1.0; }
            _super.call(this, scene.getEngine(), name);
            // Members
            this.SSAOOriginalSceneColorEffect = "SSAOOriginalSceneColorEffect";
            this.SSAORenderEffect = "SSAORenderEffect";
            this.SSAOBlurHRenderEffect = "SSAOBlurHRenderEffect";
            this.SSAOBlurVRenderEffect = "SSAOBlurVRenderEffect";
            this.SSAOCombineRenderEffect = "SSAOCombineRenderEffect";
            this._scene = null;
            this._depthTexture = null;
            this._randomTexture = null;
            this._originalColorPostProcess = null;
            this._ssaoPostProcess = null;
            this._blurHPostProcess = null;
            this._blurVPostProcess = null;
            this._ssaoCombinePostProcess = null;
            this._firstUpdate = true;
            this._scene = scene;
            // Set up assets
            this._createRandomTexture();
            this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            this._originalColorPostProcess = new BABYLON.PassPostProcess("SSAOOriginalSceneColor", 1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOPostProcess(ratio);
            this._blurHPostProcess = new BABYLON.BlurPostProcess("SSAOBlur", new BABYLON.Vector2(1.0, 0.0), 1.0, ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._blurVPostProcess = new BABYLON.BlurPostProcess("SSAOBlur", new BABYLON.Vector2(0.0, 1.0), 1.0, ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOCombinePostProcess();
            // Set up pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOOriginalSceneColorEffect, function () {
                return _this._originalColorPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAORenderEffect, function () {
                return _this._ssaoPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurHRenderEffect, function () {
                return _this._blurHPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurVRenderEffect, function () {
                return _this._blurVPostProcess;
            }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), this.SSAOCombineRenderEffect, function () {
                return _this._ssaoCombinePostProcess;
            }, true));
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
        }
        // Public Methods
        SSAORenderingPipeline.prototype.getBlurHPostProcess = function () {
            return this._blurHPostProcess;
        };
        SSAORenderingPipeline.prototype.getBlurVPostProcess = function () {
            return this._blurVPostProcess;
        };
        // Private Methods
        SSAORenderingPipeline.prototype._createSSAOPostProcess = function (ratio) {
            var _this = this;
            var sampleSphere = [
                0.5381,
                0.1856,
                -0.4319,
                0.1379,
                0.2486,
                0.4430,
                0.3371,
                0.5679,
                -0.0057,
                -0.6999,
                -0.0451,
                -0.0019,
                0.0689,
                -0.1598,
                -0.8547,
                0.0560,
                0.0069,
                -0.1843,
                -0.0146,
                0.1402,
                0.0762,
                0.0100,
                -0.1924,
                -0.0344,
                -0.3577,
                -0.5301,
                -0.4358,
                -0.3169,
                0.1063,
                0.0158,
                0.0103,
                -0.5869,
                0.0046,
                -0.0897,
                -0.4940,
                0.3287,
                0.7119,
                -0.0154,
                -0.0918,
                -0.0533,
                0.0596,
                -0.5411,
                0.0352,
                -0.0631,
                0.5460,
                -0.4776,
                0.2847,
                -0.0271
            ];
            this._ssaoPostProcess = new BABYLON.PostProcess("ssao", "ssao", ["sampleSphere"], ["randomSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._ssaoPostProcess.onApply = function (effect) {
                if (_this._firstUpdate === true) {
                    effect.setArray3("sampleSphere", sampleSphere);
                    _this._firstUpdate = false;
                }
                effect.setTexture("textureSampler", _this._depthTexture);
                effect.setTexture("randomSampler", _this._randomTexture);
            };
            return this._ssaoPostProcess;
        };
        SSAORenderingPipeline.prototype._createSSAOCombinePostProcess = function () {
            var _this = this;
            this._ssaoCombinePostProcess = new BABYLON.PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"], 1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._ssaoCombinePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("originalColor", _this._originalColorPostProcess);
            };
            return this._ssaoCombinePostProcess;
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
            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    var randVector = BABYLON.Vector3.Zero();
                    randVector.x = Math.floor(rand(0.0, 1.0) * 255);
                    randVector.y = Math.floor(rand(0.0, 1.0) * 255);
                    randVector.z = Math.floor(rand(0.0, 1.0) * 255);
                    context.fillStyle = 'rgb(' + randVector.x + ', ' + randVector.y + ', ' + randVector.z + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._randomTexture.update(false);
        };
        return SSAORenderingPipeline;
    })(BABYLON.PostProcessRenderPipeline);
    BABYLON.SSAORenderingPipeline = SSAORenderingPipeline;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.ssaoRenderingPipeline.js.map