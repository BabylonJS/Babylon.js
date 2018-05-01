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

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};

import * as renderingPipeline from 'babylonjs/renderingPipeline/es6';
import * as depthRenderer from 'babylonjs/depthRenderer/es6';
__extends(BABYLON, depthRenderer);


var BABYLON;
(function (BABYLON) {
    var SSAORenderingPipeline = /** @class */ (function (_super) {
        __extends(SSAORenderingPipeline, _super);
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function SSAORenderingPipeline(name, scene, ratio, cameras) {
            var _this = _super.call(this, scene.getEngine(), name) || this;
            // Members
            /**
            * The PassPostProcess id in the pipeline that contains the original scene color
            * @type {string}
            */
            _this.SSAOOriginalSceneColorEffect = "SSAOOriginalSceneColorEffect";
            /**
            * The SSAO PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAORenderEffect = "SSAORenderEffect";
            /**
            * The horizontal blur PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAOBlurHRenderEffect = "SSAOBlurHRenderEffect";
            /**
            * The vertical blur PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAOBlurVRenderEffect = "SSAOBlurVRenderEffect";
            /**
            * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
            * @type {string}
            */
            _this.SSAOCombineRenderEffect = "SSAOCombineRenderEffect";
            /**
            * The output strength of the SSAO post-process. Default value is 1.0.
            * @type {number}
            */
            _this.totalStrength = 1.0;
            /**
            * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
            * @type {number}
            */
            _this.radius = 0.0001;
            /**
            * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
            * Must not be equal to fallOff and superior to fallOff.
            * Default value is 0.975
            * @type {number}
            */
            _this.area = 0.0075;
            /**
            * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
            * Must not be equal to area and inferior to area.
            * Default value is 0.0
            * @type {number}
            */
            _this.fallOff = 0.000001;
            /**
            * The base color of the SSAO post-process
            * The final result is "base + ssao" between [0, 1]
            * @type {number}
            */
            _this.base = 0.5;
            _this._firstUpdate = true;
            _this._scene = scene;
            // Set up assets
            _this._createRandomTexture();
            _this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            var ssaoRatio = ratio.ssaoRatio || ratio;
            var combineRatio = ratio.combineRatio || ratio;
            _this._originalColorPostProcess = new BABYLON.PassPostProcess("SSAOOriginalSceneColor", combineRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            _this._createSSAOPostProcess(ssaoRatio);
            _this._createBlurPostProcess(ssaoRatio);
            _this._createSSAOCombinePostProcess(combineRatio);
            // Set up pipeline
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOOriginalSceneColorEffect, function () { return _this._originalColorPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAORenderEffect, function () { return _this._ssaoPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOBlurHRenderEffect, function () { return _this._blurHPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOBlurVRenderEffect, function () { return _this._blurVPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOCombineRenderEffect, function () { return _this._ssaoCombinePostProcess; }, true));
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(_this);
            if (cameras)
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            return _this;
        }
        // Public Methods
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        SSAORenderingPipeline.prototype.dispose = function (disableDepthRender) {
            if (disableDepthRender === void 0) { disableDepthRender = false; }
            for (var i = 0; i < this._scene.cameras.length; i++) {
                var camera = this._scene.cameras[i];
                this._originalColorPostProcess.dispose(camera);
                this._ssaoPostProcess.dispose(camera);
                this._blurHPostProcess.dispose(camera);
                this._blurVPostProcess.dispose(camera);
                this._ssaoCombinePostProcess.dispose(camera);
            }
            this._randomTexture.dispose();
            if (disableDepthRender)
                this._scene.disableDepthRenderer();
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            _super.prototype.dispose.call(this);
        };
        // Private Methods
        SSAORenderingPipeline.prototype._createBlurPostProcess = function (ratio) {
            var _this = this;
            var size = 16;
            this._blurHPostProcess = new BABYLON.BlurPostProcess("BlurH", new BABYLON.Vector2(1, 0), size, ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._blurVPostProcess = new BABYLON.BlurPostProcess("BlurV", new BABYLON.Vector2(0, 1), size, ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._blurHPostProcess.onActivateObservable.add(function () {
                var dw = _this._blurHPostProcess.width / _this._scene.getEngine().getRenderWidth();
                _this._blurHPostProcess.kernel = size * dw;
            });
            this._blurVPostProcess.onActivateObservable.add(function () {
                var dw = _this._blurVPostProcess.height / _this._scene.getEngine().getRenderHeight();
                _this._blurVPostProcess.kernel = size * dw;
            });
        };
        SSAORenderingPipeline.prototype._rebuild = function () {
            this._firstUpdate = true;
            _super.prototype._rebuild.call(this);
        };
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
                "area", "fallOff", "base", "range", "viewport"
            ], ["randomSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define SAMPLES " + numSamples + "\n#define SSAO");
            this._ssaoPostProcess.onApply = function (effect) {
                if (_this._firstUpdate) {
                    effect.setArray3("sampleSphere", sampleSphere);
                    effect.setFloat("samplesFactor", samplesFactor);
                    effect.setFloat("randTextureTiles", 4.0);
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
            this._randomTexture = new BABYLON.DynamicTexture("SSAORandomTexture", size, this._scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
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
        __decorate([
            BABYLON.serialize()
        ], SSAORenderingPipeline.prototype, "totalStrength", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAORenderingPipeline.prototype, "radius", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAORenderingPipeline.prototype, "area", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAORenderingPipeline.prototype, "fallOff", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAORenderingPipeline.prototype, "base", void 0);
        return SSAORenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.SSAORenderingPipeline = SSAORenderingPipeline;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.ssaoRenderingPipeline.js.map



var BABYLON;
(function (BABYLON) {
    var SSAO2RenderingPipeline = /** @class */ (function (_super) {
        __extends(SSAO2RenderingPipeline, _super);
        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        function SSAO2RenderingPipeline(name, scene, ratio, cameras) {
            var _this = _super.call(this, scene.getEngine(), name) || this;
            // Members
            /**
            * The PassPostProcess id in the pipeline that contains the original scene color
            * @type {string}
            */
            _this.SSAOOriginalSceneColorEffect = "SSAOOriginalSceneColorEffect";
            /**
            * The SSAO PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAORenderEffect = "SSAORenderEffect";
            /**
            * The horizontal blur PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAOBlurHRenderEffect = "SSAOBlurHRenderEffect";
            /**
            * The vertical blur PostProcess id in the pipeline
            * @type {string}
            */
            _this.SSAOBlurVRenderEffect = "SSAOBlurVRenderEffect";
            /**
            * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
            * @type {string}
            */
            _this.SSAOCombineRenderEffect = "SSAOCombineRenderEffect";
            /**
            * The output strength of the SSAO post-process. Default value is 1.0.
            * @type {number}
            */
            _this.totalStrength = 1.0;
            /**
            * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
            * @type {number}
            */
            _this.maxZ = 100.0;
            /**
            * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much
            * @type {number}
            */
            _this.minZAspect = 0.2;
            /**
            * Number of samples used for the SSAO calculations. Default value is 8
            * @type {number}
            */
            _this._samples = 8;
            /**
            * Are we using bilateral blur ?
            * @type {boolean}
            */
            _this._expensiveBlur = true;
            /**
            * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
            * @type {number}
            */
            _this.radius = 2.0;
            /**
            * The base color of the SSAO post-process
            * The final result is "base + ssao" between [0, 1]
            * @type {number}
            */
            _this.base = 0.1;
            _this._firstUpdate = true;
            _this._scene = scene;
            if (!_this.isSupported) {
                BABYLON.Tools.Error("SSAO 2 needs WebGL 2 support.");
                return _this;
            }
            var ssaoRatio = ratio.ssaoRatio || ratio;
            var blurRatio = ratio.blurRatio || ratio;
            // Set up assets
            var geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            _this._createRandomTexture();
            _this._depthTexture = geometryBufferRenderer.getGBuffer().textures[0];
            _this._normalTexture = geometryBufferRenderer.getGBuffer().textures[1];
            _this._originalColorPostProcess = new BABYLON.PassPostProcess("SSAOOriginalSceneColor", 1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            _this._createSSAOPostProcess(1.0);
            _this._createBlurPostProcess(ssaoRatio, blurRatio);
            _this._createSSAOCombinePostProcess(blurRatio);
            // Set up pipeline
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOOriginalSceneColorEffect, function () { return _this._originalColorPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAORenderEffect, function () { return _this._ssaoPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOBlurHRenderEffect, function () { return _this._blurHPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOBlurVRenderEffect, function () { return _this._blurVPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.SSAOCombineRenderEffect, function () { return _this._ssaoCombinePostProcess; }, true));
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(_this);
            if (cameras)
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            return _this;
        }
        Object.defineProperty(SSAO2RenderingPipeline.prototype, "samples", {
            get: function () {
                return this._samples;
            },
            set: function (n) {
                this._ssaoPostProcess.updateEffect("#define SAMPLES " + n + "\n#define SSAO");
                this._samples = n;
                this._sampleSphere = this._generateHemisphere();
                this._firstUpdate = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SSAO2RenderingPipeline.prototype, "expensiveBlur", {
            get: function () {
                return this._expensiveBlur;
            },
            set: function (b) {
                this._blurHPostProcess.updateEffect("#define BILATERAL_BLUR\n#define BILATERAL_BLUR_H\n#define SAMPLES 16\n#define EXPENSIVE " + (b ? "1" : "0") + "\n", null, ["textureSampler", "depthSampler"]);
                this._blurVPostProcess.updateEffect("#define BILATERAL_BLUR\n#define SAMPLES 16\n#define EXPENSIVE " + (b ? "1" : "0") + "\n", null, ["textureSampler", "depthSampler"]);
                this._expensiveBlur = b;
                this._firstUpdate = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SSAO2RenderingPipeline, "IsSupported", {
            /**
            *  Support test.
            * @type {boolean}
            */
            get: function () {
                var engine = BABYLON.Engine.LastCreatedEngine;
                if (!engine) {
                    return false;
                }
                return engine.getCaps().drawBuffersExtension;
            },
            enumerable: true,
            configurable: true
        });
        // Public Methods
        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        SSAO2RenderingPipeline.prototype.dispose = function (disableGeometryBufferRenderer) {
            if (disableGeometryBufferRenderer === void 0) { disableGeometryBufferRenderer = false; }
            for (var i = 0; i < this._scene.cameras.length; i++) {
                var camera = this._scene.cameras[i];
                this._originalColorPostProcess.dispose(camera);
                this._ssaoPostProcess.dispose(camera);
                this._blurHPostProcess.dispose(camera);
                this._blurVPostProcess.dispose(camera);
                this._ssaoCombinePostProcess.dispose(camera);
            }
            this._randomTexture.dispose();
            if (disableGeometryBufferRenderer)
                this._scene.disableGeometryBufferRenderer();
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
            _super.prototype.dispose.call(this);
        };
        // Private Methods
        SSAO2RenderingPipeline.prototype._createBlurPostProcess = function (ssaoRatio, blurRatio) {
            var _this = this;
            this._samplerOffsets = [];
            var expensive = this.expensiveBlur;
            for (var i = -8; i < 8; i++) {
                this._samplerOffsets.push(i * 2 + 0.5);
            }
            this._blurHPostProcess = new BABYLON.PostProcess("BlurH", "ssao2", ["outSize", "samplerOffsets", "near", "far", "radius"], ["depthSampler"], ssaoRatio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define BILATERAL_BLUR_H\n#define SAMPLES 16\n#define EXPENSIVE " + (expensive ? "1" : "0") + "\n");
            this._blurHPostProcess.onApply = function (effect) {
                if (!_this._scene.activeCamera) {
                    return;
                }
                effect.setFloat("outSize", _this._ssaoCombinePostProcess.width > 0 ? _this._ssaoCombinePostProcess.width : _this._originalColorPostProcess.width);
                effect.setFloat("near", _this._scene.activeCamera.minZ);
                effect.setFloat("far", _this._scene.activeCamera.maxZ);
                effect.setFloat("radius", _this.radius);
                effect.setTexture("depthSampler", _this._depthTexture);
                if (_this._firstUpdate) {
                    effect.setArray("samplerOffsets", _this._samplerOffsets);
                }
            };
            this._blurVPostProcess = new BABYLON.PostProcess("BlurV", "ssao2", ["outSize", "samplerOffsets", "near", "far", "radius"], ["depthSampler"], blurRatio, null, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define BILATERAL_BLUR_V\n#define SAMPLES 16\n#define EXPENSIVE " + (expensive ? "1" : "0") + "\n");
            this._blurVPostProcess.onApply = function (effect) {
                if (!_this._scene.activeCamera) {
                    return;
                }
                effect.setFloat("outSize", _this._ssaoCombinePostProcess.height > 0 ? _this._ssaoCombinePostProcess.height : _this._originalColorPostProcess.height);
                effect.setFloat("near", _this._scene.activeCamera.minZ);
                effect.setFloat("far", _this._scene.activeCamera.maxZ);
                effect.setFloat("radius", _this.radius);
                effect.setTexture("depthSampler", _this._depthTexture);
                if (_this._firstUpdate) {
                    effect.setArray("samplerOffsets", _this._samplerOffsets);
                    _this._firstUpdate = false;
                }
            };
        };
        SSAO2RenderingPipeline.prototype._rebuild = function () {
            this._firstUpdate = true;
            _super.prototype._rebuild.call(this);
        };
        SSAO2RenderingPipeline.prototype._generateHemisphere = function () {
            var numSamples = this.samples;
            var result = [];
            var vector, scale;
            var rand = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            var i = 0;
            while (i < numSamples) {
                vector = new BABYLON.Vector3(rand(-1.0, 1.0), rand(-1.0, 1.0), rand(0.30, 1.0));
                vector.normalize();
                scale = i / numSamples;
                scale = BABYLON.Scalar.Lerp(0.1, 1.0, scale * scale);
                vector.scaleInPlace(scale);
                result.push(vector.x, vector.y, vector.z);
                i++;
            }
            return result;
        };
        SSAO2RenderingPipeline.prototype._createSSAOPostProcess = function (ratio) {
            var _this = this;
            var numSamples = this.samples;
            this._sampleSphere = this._generateHemisphere();
            this._ssaoPostProcess = new BABYLON.PostProcess("ssao2", "ssao2", [
                "sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius",
                "base", "range", "projection", "near", "far", "texelSize",
                "xViewport", "yViewport", "maxZ", "minZAspect"
            ], ["randomSampler", "normalSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define SAMPLES " + numSamples + "\n#define SSAO");
            this._ssaoPostProcess.onApply = function (effect) {
                if (_this._firstUpdate) {
                    effect.setArray3("sampleSphere", _this._sampleSphere);
                    effect.setFloat("randTextureTiles", 4.0);
                }
                if (!_this._scene.activeCamera) {
                    return;
                }
                effect.setFloat("samplesFactor", 1 / _this.samples);
                effect.setFloat("totalStrength", _this.totalStrength);
                effect.setFloat2("texelSize", 1 / _this._ssaoPostProcess.width, 1 / _this._ssaoPostProcess.height);
                effect.setFloat("radius", _this.radius);
                effect.setFloat("maxZ", _this.maxZ);
                effect.setFloat("minZAspect", _this.minZAspect);
                effect.setFloat("base", _this.base);
                effect.setFloat("near", _this._scene.activeCamera.minZ);
                effect.setFloat("far", _this._scene.activeCamera.maxZ);
                effect.setFloat("xViewport", Math.tan(_this._scene.activeCamera.fov / 2) * _this._scene.getEngine().getAspectRatio(_this._scene.activeCamera, true));
                effect.setFloat("yViewport", Math.tan(_this._scene.activeCamera.fov / 2));
                effect.setMatrix("projection", _this._scene.getProjectionMatrix());
                effect.setTexture("textureSampler", _this._depthTexture);
                effect.setTexture("normalSampler", _this._normalTexture);
                effect.setTexture("randomSampler", _this._randomTexture);
            };
        };
        SSAO2RenderingPipeline.prototype._createSSAOCombinePostProcess = function (ratio) {
            var _this = this;
            this._ssaoCombinePostProcess = new BABYLON.PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false);
            this._ssaoCombinePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("originalColor", _this._originalColorPostProcess);
            };
        };
        SSAO2RenderingPipeline.prototype._createRandomTexture = function () {
            var size = 512;
            this._randomTexture = new BABYLON.DynamicTexture("SSAORandomTexture", size, this._scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
            this._randomTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            var context = this._randomTexture.getContext();
            var rand = function (min, max) {
                return Math.random() * (max - min) + min;
            };
            var randVector = BABYLON.Vector3.Zero();
            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    randVector.x = rand(0.0, 1.0);
                    randVector.y = rand(0.0, 1.0);
                    randVector.z = 0.0;
                    randVector.normalize();
                    randVector.scaleInPlace(255);
                    randVector.x = Math.floor(randVector.x);
                    randVector.y = Math.floor(randVector.y);
                    context.fillStyle = 'rgb(' + randVector.x + ', ' + randVector.y + ', ' + randVector.z + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._randomTexture.update(false);
        };
        __decorate([
            BABYLON.serialize()
        ], SSAO2RenderingPipeline.prototype, "totalStrength", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAO2RenderingPipeline.prototype, "maxZ", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAO2RenderingPipeline.prototype, "minZAspect", void 0);
        __decorate([
            BABYLON.serialize("samples")
        ], SSAO2RenderingPipeline.prototype, "_samples", void 0);
        __decorate([
            BABYLON.serialize("expensiveBlur")
        ], SSAO2RenderingPipeline.prototype, "_expensiveBlur", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAO2RenderingPipeline.prototype, "radius", void 0);
        __decorate([
            BABYLON.serialize()
        ], SSAO2RenderingPipeline.prototype, "base", void 0);
        return SSAO2RenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.SSAO2RenderingPipeline = SSAO2RenderingPipeline;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.ssao2RenderingPipeline.js.map

// BABYLON.JS Chromatic Aberration GLSL Shader
// Author: Olivier Guyot
// Separates very slightly R, G and B colors on the edges of the screen
// Inspired by Francois Tarlier & Martins Upitis

var BABYLON;
(function (BABYLON) {
    var LensRenderingPipeline = /** @class */ (function (_super) {
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
            if (ratio === void 0) { ratio = 1.0; }
            var _this = _super.call(this, scene.getEngine(), name) || this;
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
            _this.LensChromaticAberrationEffect = "LensChromaticAberrationEffect";
            /**
            * The highlights enhancing PostProcess id in the pipeline
            * @type {string}
            */
            _this.HighlightsEnhancingEffect = "HighlightsEnhancingEffect";
            /**
            * The depth-of-field PostProcess id in the pipeline
            * @type {string}
            */
            _this.LensDepthOfFieldEffect = "LensDepthOfFieldEffect";
            _this._scene = scene;
            // Fetch texture samplers
            _this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
            if (parameters.grain_texture) {
                _this._grainTexture = parameters.grain_texture;
            }
            else {
                _this._createGrainTexture();
            }
            // save parameters
            _this._edgeBlur = parameters.edge_blur ? parameters.edge_blur : 0;
            _this._grainAmount = parameters.grain_amount ? parameters.grain_amount : 0;
            _this._chromaticAberration = parameters.chromatic_aberration ? parameters.chromatic_aberration : 0;
            _this._distortion = parameters.distortion ? parameters.distortion : 0;
            _this._highlightsGain = parameters.dof_gain !== undefined ? parameters.dof_gain : -1;
            _this._highlightsThreshold = parameters.dof_threshold ? parameters.dof_threshold : 1;
            _this._dofDistance = parameters.dof_focus_distance !== undefined ? parameters.dof_focus_distance : -1;
            _this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
            _this._dofDarken = parameters.dof_darken ? parameters.dof_darken : 0;
            _this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
            _this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;
            // Create effects
            _this._createChromaticAberrationPostProcess(ratio);
            _this._createHighlightsPostProcess(ratio);
            _this._createDepthOfFieldPostProcess(ratio / 4);
            // Set up pipeline
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.LensChromaticAberrationEffect, function () { return _this._chromaticAberrationPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.HighlightsEnhancingEffect, function () { return _this._highlightsPostProcess; }, true));
            _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), _this.LensDepthOfFieldEffect, function () { return _this._depthOfFieldPostProcess; }, true));
            if (_this._highlightsGain === -1) {
                _this._disableEffect(_this.HighlightsEnhancingEffect, null);
            }
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(_this);
            if (cameras) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }
            return _this;
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
            this._chromaticAberrationPostProcess = null;
            this._highlightsPostProcess = null;
            this._depthOfFieldPostProcess = null;
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
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
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
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
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
                effect.setFloat('screen_width', _this._scene.getEngine().getRenderWidth());
                effect.setFloat('screen_height', _this._scene.getEngine().getRenderHeight());
                effect.setFloat('distortion', _this._distortion);
                effect.setBool('dof_enabled', (_this._dofDistance !== -1));
                effect.setFloat('screen_distance', 1.0 / (0.1 - 1.0 / _this._dofDistance));
                effect.setFloat('aperture', _this._dofAperture);
                effect.setFloat('darken', _this._dofDarken);
                effect.setFloat('edge_blur', _this._edgeBlur);
                effect.setBool('highlights', (_this._highlightsGain !== -1));
                if (_this._scene.activeCamera) {
                    effect.setFloat('near', _this._scene.activeCamera.minZ);
                    effect.setFloat('far', _this._scene.activeCamera.maxZ);
                }
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
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.LensRenderingPipeline = LensRenderingPipeline;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.lensRenderingPipeline.js.map



var BABYLON;
(function (BABYLON) {
    var StandardRenderingPipeline = /** @class */ (function (_super) {
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
            if (originalPostProcess === void 0) { originalPostProcess = null; }
            var _this = _super.call(this, scene.getEngine(), name) || this;
            _this.downSampleX4PostProcess = null;
            _this.brightPassPostProcess = null;
            _this.blurHPostProcesses = [];
            _this.blurVPostProcesses = [];
            _this.textureAdderPostProcess = null;
            _this.volumetricLightPostProcess = null;
            _this.volumetricLightSmoothXPostProcess = null;
            _this.volumetricLightSmoothYPostProcess = null;
            _this.volumetricLightMergePostProces = null;
            _this.volumetricLightFinalPostProcess = null;
            _this.luminancePostProcess = null;
            _this.luminanceDownSamplePostProcesses = [];
            _this.hdrPostProcess = null;
            _this.textureAdderFinalPostProcess = null;
            _this.lensFlareFinalPostProcess = null;
            _this.hdrFinalPostProcess = null;
            _this.lensFlarePostProcess = null;
            _this.lensFlareComposePostProcess = null;
            _this.motionBlurPostProcess = null;
            _this.depthOfFieldPostProcess = null;
            // Values
            _this.brightThreshold = 1.0;
            _this.blurWidth = 512.0;
            _this.horizontalBlur = false;
            _this.exposure = 1.0;
            _this.lensTexture = null;
            _this.volumetricLightCoefficient = 0.2;
            _this.volumetricLightPower = 4.0;
            _this.volumetricLightBlurScale = 64.0;
            _this.sourceLight = null;
            _this.hdrMinimumLuminance = 1.0;
            _this.hdrDecreaseRate = 0.5;
            _this.hdrIncreaseRate = 0.5;
            _this.lensColorTexture = null;
            _this.lensFlareStrength = 20.0;
            _this.lensFlareGhostDispersal = 1.4;
            _this.lensFlareHaloWidth = 0.7;
            _this.lensFlareDistortionStrength = 16.0;
            _this.lensStarTexture = null;
            _this.lensFlareDirtTexture = null;
            _this.depthOfFieldDistance = 10.0;
            _this.depthOfFieldBlurWidth = 64.0;
            _this.motionStrength = 1.0;
            // IAnimatable
            _this.animations = [];
            _this._currentDepthOfFieldSource = null;
            _this._hdrCurrentLuminance = 1.0;
            // Getters and setters
            _this._bloomEnabled = true;
            _this._depthOfFieldEnabled = false;
            _this._vlsEnabled = false;
            _this._lensFlareEnabled = false;
            _this._hdrEnabled = false;
            _this._motionBlurEnabled = false;
            _this._motionBlurSamples = 64.0;
            _this._volumetricLightStepsCount = 50.0;
            _this._cameras = cameras || [];
            // Initialize
            _this._scene = scene;
            _this._basePostProcess = originalPostProcess;
            _this._ratio = ratio;
            // Misc
            _this._floatTextureType = scene.getEngine().getCaps().textureFloatRender ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_HALF_FLOAT;
            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(_this);
            _this._buildPipeline();
            return _this;
        }
        Object.defineProperty(StandardRenderingPipeline.prototype, "BloomEnabled", {
            get: function () {
                return this._bloomEnabled;
            },
            set: function (enabled) {
                if (this._bloomEnabled === enabled) {
                    return;
                }
                this._bloomEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "DepthOfFieldEnabled", {
            get: function () {
                return this._depthOfFieldEnabled;
            },
            set: function (enabled) {
                if (this._depthOfFieldEnabled === enabled) {
                    return;
                }
                this._depthOfFieldEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "LensFlareEnabled", {
            get: function () {
                return this._lensFlareEnabled;
            },
            set: function (enabled) {
                if (this._lensFlareEnabled === enabled) {
                    return;
                }
                this._lensFlareEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "HDREnabled", {
            get: function () {
                return this._hdrEnabled;
            },
            set: function (enabled) {
                if (this._hdrEnabled === enabled) {
                    return;
                }
                this._hdrEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "VLSEnabled", {
            get: function () {
                return this._vlsEnabled;
            },
            set: function (enabled) {
                if (this._vlsEnabled === enabled) {
                    return;
                }
                if (enabled) {
                    var geometry = this._scene.enableGeometryBufferRenderer();
                    if (!geometry) {
                        BABYLON.Tools.Warn("Geometry renderer is not supported, cannot create volumetric lights in Standard Rendering Pipeline");
                        return;
                    }
                }
                this._vlsEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "MotionBlurEnabled", {
            get: function () {
                return this._motionBlurEnabled;
            },
            set: function (enabled) {
                if (this._motionBlurEnabled === enabled) {
                    return;
                }
                this._motionBlurEnabled = enabled;
                this._buildPipeline();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "volumetricLightStepsCount", {
            get: function () {
                return this._volumetricLightStepsCount;
            },
            set: function (count) {
                if (this.volumetricLightPostProcess) {
                    this.volumetricLightPostProcess.updateEffect("#define VLS\n#define NB_STEPS " + count.toFixed(1));
                }
                this._volumetricLightStepsCount = count;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardRenderingPipeline.prototype, "motionBlurSamples", {
            get: function () {
                return this._motionBlurSamples;
            },
            set: function (samples) {
                if (this.motionBlurPostProcess) {
                    this.motionBlurPostProcess.updateEffect("#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + samples.toFixed(1));
                }
                this._motionBlurSamples = samples;
            },
            enumerable: true,
            configurable: true
        });
        StandardRenderingPipeline.prototype._buildPipeline = function () {
            var _this = this;
            var ratio = this._ratio;
            var scene = this._scene;
            this._disposePostProcesses();
            this._reset();
            // Create pass post-process
            if (!this._basePostProcess) {
                this.originalPostProcess = new BABYLON.PostProcess("HDRPass", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", this._floatTextureType);
                this.originalPostProcess.onApply = function (effect) {
                    _this._currentDepthOfFieldSource = _this.originalPostProcess;
                };
            }
            else {
                this.originalPostProcess = this._basePostProcess;
            }
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", function () { return _this.originalPostProcess; }, true));
            this._currentDepthOfFieldSource = this.originalPostProcess;
            if (this._vlsEnabled) {
                // Create volumetric light
                this._createVolumetricLightPostProcess(scene, ratio);
                // Create volumetric light final post-process
                this.volumetricLightFinalPostProcess = new BABYLON.PostProcess("HDRVLSFinal", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRVLSFinal", function () { return _this.volumetricLightFinalPostProcess; }, true));
            }
            if (this._bloomEnabled) {
                // Create down sample X4 post-process
                this._createDownSampleX4PostProcess(scene, ratio / 2);
                // Create bright pass post-process
                this._createBrightPassPostProcess(scene, ratio / 2);
                // Create gaussian blur post-processes (down sampling blurs)
                this._createBlurPostProcesses(scene, ratio / 4, 1);
                // Create texture adder post-process
                this._createTextureAdderPostProcess(scene, ratio);
                // Create depth-of-field source post-process
                this.textureAdderFinalPostProcess = new BABYLON.PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRBaseDepthOfFieldSource", function () { return _this.textureAdderFinalPostProcess; }, true));
            }
            if (this._lensFlareEnabled) {
                // Create lens flare post-process
                this._createLensFlarePostProcess(scene, ratio);
                // Create depth-of-field source post-process post lens-flare and disable it now
                this.lensFlareFinalPostProcess = new BABYLON.PostProcess("HDRPostLensFlareDepthOfFieldSource", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRPostLensFlareDepthOfFieldSource", function () { return _this.lensFlareFinalPostProcess; }, true));
            }
            if (this._hdrEnabled) {
                // Create luminance
                this._createLuminancePostProcesses(scene, this._floatTextureType);
                // Create HDR
                this._createHdrPostProcess(scene, ratio);
                // Create depth-of-field source post-process post hdr and disable it now
                this.hdrFinalPostProcess = new BABYLON.PostProcess("HDRPostHDReDepthOfFieldSource", "standard", [], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRPostHDReDepthOfFieldSource", function () { return _this.hdrFinalPostProcess; }, true));
            }
            if (this._depthOfFieldEnabled) {
                // Create gaussian blur used by depth-of-field
                this._createBlurPostProcesses(scene, ratio / 2, 3, "depthOfFieldBlurWidth");
                // Create depth-of-field post-process
                this._createDepthOfFieldPostProcess(scene, ratio);
            }
            if (this._motionBlurEnabled) {
                // Create motion blur post-process
                this._createMotionBlurPostProcess(scene, ratio);
            }
            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
            }
        };
        // Down Sample X4 Post-Processs
        StandardRenderingPipeline.prototype._createDownSampleX4PostProcess = function (scene, ratio) {
            var _this = this;
            var downSampleX4Offsets = new Array(32);
            this.downSampleX4PostProcess = new BABYLON.PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.downSampleX4PostProcess.onApply = function (effect) {
                var id = 0;
                var width = _this.downSampleX4PostProcess.width;
                var height = _this.downSampleX4PostProcess.height;
                for (var i = -2; i < 2; i++) {
                    for (var j = -2; j < 2; j++) {
                        downSampleX4Offsets[id] = (i + 0.5) * (1.0 / width);
                        downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / height);
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
        // Create blur H&V post-processes
        StandardRenderingPipeline.prototype._createBlurPostProcesses = function (scene, ratio, indice, blurWidthKey) {
            var _this = this;
            if (blurWidthKey === void 0) { blurWidthKey = "blurWidth"; }
            var engine = scene.getEngine();
            var blurX = new BABYLON.BlurPostProcess("HDRBlurH" + "_" + indice, new BABYLON.Vector2(1, 0), this[blurWidthKey], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            var blurY = new BABYLON.BlurPostProcess("HDRBlurV" + "_" + indice, new BABYLON.Vector2(0, 1), this[blurWidthKey], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            blurX.onActivateObservable.add(function () {
                var dw = blurX.width / engine.getRenderWidth();
                blurX.kernel = _this[blurWidthKey] * dw;
            });
            blurY.onActivateObservable.add(function () {
                var dw = blurY.height / engine.getRenderHeight();
                blurY.kernel = _this.horizontalBlur ? 64 * dw : _this[blurWidthKey] * dw;
            });
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRBlurH" + indice, function () { return blurX; }, true));
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRBlurV" + indice, function () { return blurY; }, true));
            this.blurHPostProcesses.push(blurX);
            this.blurVPostProcesses.push(blurY);
        };
        // Create texture adder post-process
        StandardRenderingPipeline.prototype._createTextureAdderPostProcess = function (scene, ratio) {
            var _this = this;
            this.textureAdderPostProcess = new BABYLON.PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this._vlsEnabled ? _this._currentDepthOfFieldSource : _this.originalPostProcess);
                effect.setTexture("lensSampler", _this.lensTexture);
                effect.setFloat("exposure", _this.exposure);
                _this._currentDepthOfFieldSource = _this.textureAdderFinalPostProcess;
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", function () { return _this.textureAdderPostProcess; }, true));
        };
        StandardRenderingPipeline.prototype._createVolumetricLightPostProcess = function (scene, ratio) {
            var _this = this;
            var geometryRenderer = scene.enableGeometryBufferRenderer();
            geometryRenderer.enablePosition = true;
            var geometry = geometryRenderer.getGBuffer();
            // Base post-process
            this.volumetricLightPostProcess = new BABYLON.PostProcess("HDRVLS", "standard", ["shadowViewProjection", "cameraPosition", "sunDirection", "sunColor", "scatteringCoefficient", "scatteringPower", "depthValues"], ["shadowMapSampler", "positionSampler"], ratio / 8, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLS\n#define NB_STEPS " + this._volumetricLightStepsCount.toFixed(1));
            var depthValues = BABYLON.Vector2.Zero();
            this.volumetricLightPostProcess.onApply = function (effect) {
                if (_this.sourceLight && _this.sourceLight.getShadowGenerator() && _this._scene.activeCamera) {
                    var generator = _this.sourceLight.getShadowGenerator();
                    effect.setTexture("shadowMapSampler", generator.getShadowMap());
                    effect.setTexture("positionSampler", geometry.textures[2]);
                    effect.setColor3("sunColor", _this.sourceLight.diffuse);
                    effect.setVector3("sunDirection", _this.sourceLight.getShadowDirection());
                    effect.setVector3("cameraPosition", _this._scene.activeCamera.globalPosition);
                    effect.setMatrix("shadowViewProjection", generator.getTransformMatrix());
                    effect.setFloat("scatteringCoefficient", _this.volumetricLightCoefficient);
                    effect.setFloat("scatteringPower", _this.volumetricLightPower);
                    depthValues.x = generator.getLight().getDepthMinZ(_this._scene.activeCamera);
                    depthValues.y = generator.getLight().getDepthMaxZ(_this._scene.activeCamera);
                    effect.setVector2("depthValues", depthValues);
                }
            };
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRVLS", function () { return _this.volumetricLightPostProcess; }, true));
            // Smooth
            this._createBlurPostProcesses(scene, ratio / 4, 0, "volumetricLightBlurScale");
            // Merge
            this.volumetricLightMergePostProces = new BABYLON.PostProcess("HDRVLSMerge", "standard", [], ["originalSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLSMERGE");
            this.volumetricLightMergePostProces.onApply = function (effect) {
                effect.setTextureFromPostProcess("originalSampler", _this.originalPostProcess);
                _this._currentDepthOfFieldSource = _this.volumetricLightFinalPostProcess;
            };
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRVLSMerge", function () { return _this.volumetricLightMergePostProces; }, true));
        };
        // Create luminance
        StandardRenderingPipeline.prototype._createLuminancePostProcesses = function (scene, textureType) {
            var _this = this;
            // Create luminance
            var size = Math.pow(3, StandardRenderingPipeline.LuminanceSteps);
            this.luminancePostProcess = new BABYLON.PostProcess("HDRLuminance", "standard", ["lumOffsets"], [], { width: size, height: size }, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE", textureType);
            var offsets = [];
            this.luminancePostProcess.onApply = function (effect) {
                var sU = (1.0 / _this.luminancePostProcess.width);
                var sV = (1.0 / _this.luminancePostProcess.height);
                offsets[0] = -0.5 * sU;
                offsets[1] = 0.5 * sV;
                offsets[2] = 0.5 * sU;
                offsets[3] = 0.5 * sV;
                offsets[4] = -0.5 * sU;
                offsets[5] = -0.5 * sV;
                offsets[6] = 0.5 * sU;
                offsets[7] = -0.5 * sV;
                effect.setArray2("lumOffsets", offsets);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLuminance", function () { return _this.luminancePostProcess; }, true));
            // Create down sample luminance
            for (var i = StandardRenderingPipeline.LuminanceSteps - 1; i >= 0; i--) {
                var size = Math.pow(3, i);
                var defines = "#define LUMINANCE_DOWN_SAMPLE\n";
                if (i === 0) {
                    defines += "#define FINAL_DOWN_SAMPLER";
                }
                var postProcess = new BABYLON.PostProcess("HDRLuminanceDownSample" + i, "standard", ["dsOffsets", "halfDestPixelSize"], [], { width: size, height: size }, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines, textureType);
                this.luminanceDownSamplePostProcesses.push(postProcess);
            }
            // Create callbacks and add effects
            var lastLuminance = this.luminancePostProcess;
            this.luminanceDownSamplePostProcesses.forEach(function (pp, index) {
                var downSampleOffsets = new Array(18);
                pp.onApply = function (effect) {
                    if (!lastLuminance) {
                        return;
                    }
                    var id = 0;
                    for (var x = -1; x < 2; x++) {
                        for (var y = -1; y < 2; y++) {
                            downSampleOffsets[id] = x / lastLuminance.width;
                            downSampleOffsets[id + 1] = y / lastLuminance.height;
                            id += 2;
                        }
                    }
                    effect.setArray2("dsOffsets", downSampleOffsets);
                    effect.setFloat("halfDestPixelSize", 0.5 / lastLuminance.width);
                    if (index === _this.luminanceDownSamplePostProcesses.length - 1) {
                        lastLuminance = _this.luminancePostProcess;
                    }
                    else {
                        lastLuminance = pp;
                    }
                };
                if (index === _this.luminanceDownSamplePostProcesses.length - 1) {
                    pp.onAfterRender = function (effect) {
                        var pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                        var bit_shift = new BABYLON.Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                        _this._hdrCurrentLuminance = (pixel[0] * bit_shift.x + pixel[1] * bit_shift.y + pixel[2] * bit_shift.z + pixel[3] * bit_shift.w) / 100.0;
                    };
                }
                _this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLuminanceDownSample" + index, function () { return pp; }, true));
            });
        };
        // Create HDR post-process
        StandardRenderingPipeline.prototype._createHdrPostProcess = function (scene, ratio) {
            var _this = this;
            this.hdrPostProcess = new BABYLON.PostProcess("HDR", "standard", ["averageLuminance"], ["textureAdderSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define HDR", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            var outputLiminance = 1;
            var time = 0;
            var lastTime = 0;
            this.hdrPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("textureAdderSampler", _this._currentDepthOfFieldSource);
                time += scene.getEngine().getDeltaTime();
                if (outputLiminance < 0) {
                    outputLiminance = _this._hdrCurrentLuminance;
                }
                else {
                    var dt = (lastTime - time) / 1000.0;
                    if (_this._hdrCurrentLuminance < outputLiminance + _this.hdrDecreaseRate * dt) {
                        outputLiminance += _this.hdrDecreaseRate * dt;
                    }
                    else if (_this._hdrCurrentLuminance > outputLiminance - _this.hdrIncreaseRate * dt) {
                        outputLiminance -= _this.hdrIncreaseRate * dt;
                    }
                    else {
                        outputLiminance = _this._hdrCurrentLuminance;
                    }
                }
                outputLiminance = BABYLON.Scalar.Clamp(outputLiminance, _this.hdrMinimumLuminance, 1e20);
                effect.setFloat("averageLuminance", outputLiminance);
                lastTime = time;
                _this._currentDepthOfFieldSource = _this.hdrFinalPostProcess;
            };
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDR", function () { return _this.hdrPostProcess; }, true));
        };
        // Create lens flare post-process
        StandardRenderingPipeline.prototype._createLensFlarePostProcess = function (scene, ratio) {
            var _this = this;
            this.lensFlarePostProcess = new BABYLON.PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", function () { return _this.lensFlarePostProcess; }, true));
            this._createBlurPostProcesses(scene, ratio / 4, 2);
            this.lensFlareComposePostProcess = new BABYLON.PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", function () { return _this.lensFlareComposePostProcess; }, true));
            var resolution = new BABYLON.Vector2(0, 0);
            // Lens flare
            this.lensFlarePostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("textureSampler", _this._bloomEnabled ? _this.blurHPostProcesses[0] : _this.originalPostProcess);
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
                if (!_this._scene.activeCamera) {
                    return;
                }
                effect.setTextureFromPostProcess("otherSampler", _this._currentDepthOfFieldSource);
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
                _this._currentDepthOfFieldSource = _this.lensFlareFinalPostProcess;
            };
        };
        // Create depth-of-field post-process
        StandardRenderingPipeline.prototype._createDepthOfFieldPostProcess = function (scene, ratio) {
            var _this = this;
            this.depthOfFieldPostProcess = new BABYLON.PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = function (effect) {
                effect.setTextureFromPostProcess("otherSampler", _this._currentDepthOfFieldSource);
                effect.setTexture("depthSampler", _this._getDepthTexture());
                effect.setFloat("distance", _this.depthOfFieldDistance);
            };
            // Add to pipeline
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", function () { return _this.depthOfFieldPostProcess; }, true));
        };
        // Create motion blur post-process
        StandardRenderingPipeline.prototype._createMotionBlurPostProcess = function (scene, ratio) {
            var _this = this;
            this.motionBlurPostProcess = new BABYLON.PostProcess("HDRMotionBlur", "standard", ["inverseViewProjection", "prevViewProjection", "screenSize", "motionScale", "motionStrength"], ["depthSampler"], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + this.motionBlurSamples.toFixed(1), BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            var motionScale = 0;
            var prevViewProjection = BABYLON.Matrix.Identity();
            var invViewProjection = BABYLON.Matrix.Identity();
            var viewProjection = BABYLON.Matrix.Identity();
            var screenSize = BABYLON.Vector2.Zero();
            this.motionBlurPostProcess.onApply = function (effect) {
                viewProjection = scene.getProjectionMatrix().multiply(scene.getViewMatrix());
                viewProjection.invertToRef(invViewProjection);
                effect.setMatrix("inverseViewProjection", invViewProjection);
                effect.setMatrix("prevViewProjection", prevViewProjection);
                prevViewProjection = viewProjection;
                screenSize.x = _this.motionBlurPostProcess.width;
                screenSize.y = _this.motionBlurPostProcess.height;
                effect.setVector2("screenSize", screenSize);
                motionScale = scene.getEngine().getFps() / 60.0;
                effect.setFloat("motionScale", motionScale);
                effect.setFloat("motionStrength", _this.motionStrength);
                effect.setTexture("depthSampler", _this._getDepthTexture());
            };
            this.addEffect(new BABYLON.PostProcessRenderEffect(scene.getEngine(), "HDRMotionBlur", function () { return _this.motionBlurPostProcess; }, true));
        };
        StandardRenderingPipeline.prototype._getDepthTexture = function () {
            if (this._scene.getEngine().getCaps().drawBuffersExtension) {
                var renderer = this._scene.enableGeometryBufferRenderer();
                return renderer.getGBuffer().textures[0];
            }
            return this._scene.enableDepthRenderer().getDepthMap();
        };
        StandardRenderingPipeline.prototype._disposePostProcesses = function () {
            for (var i = 0; i < this._cameras.length; i++) {
                var camera = this._cameras[i];
                if (this.originalPostProcess) {
                    this.originalPostProcess.dispose(camera);
                }
                if (this.downSampleX4PostProcess) {
                    this.downSampleX4PostProcess.dispose(camera);
                }
                if (this.brightPassPostProcess) {
                    this.brightPassPostProcess.dispose(camera);
                }
                if (this.textureAdderPostProcess) {
                    this.textureAdderPostProcess.dispose(camera);
                }
                if (this.textureAdderFinalPostProcess) {
                    this.textureAdderFinalPostProcess.dispose(camera);
                }
                if (this.volumetricLightPostProcess) {
                    this.volumetricLightPostProcess.dispose(camera);
                }
                if (this.volumetricLightSmoothXPostProcess) {
                    this.volumetricLightSmoothXPostProcess.dispose(camera);
                }
                if (this.volumetricLightSmoothYPostProcess) {
                    this.volumetricLightSmoothYPostProcess.dispose(camera);
                }
                if (this.volumetricLightMergePostProces) {
                    this.volumetricLightMergePostProces.dispose(camera);
                }
                if (this.volumetricLightFinalPostProcess) {
                    this.volumetricLightFinalPostProcess.dispose(camera);
                }
                if (this.lensFlarePostProcess) {
                    this.lensFlarePostProcess.dispose(camera);
                }
                if (this.lensFlareComposePostProcess) {
                    this.lensFlareComposePostProcess.dispose(camera);
                }
                for (var j = 0; j < this.luminanceDownSamplePostProcesses.length; j++) {
                    this.luminanceDownSamplePostProcesses[j].dispose(camera);
                }
                if (this.luminancePostProcess) {
                    this.luminancePostProcess.dispose(camera);
                }
                if (this.hdrPostProcess) {
                    this.hdrPostProcess.dispose(camera);
                }
                if (this.hdrFinalPostProcess) {
                    this.hdrFinalPostProcess.dispose(camera);
                }
                if (this.depthOfFieldPostProcess) {
                    this.depthOfFieldPostProcess.dispose(camera);
                }
                if (this.motionBlurPostProcess) {
                    this.motionBlurPostProcess.dispose(camera);
                }
                for (var j = 0; j < this.blurHPostProcesses.length; j++) {
                    this.blurHPostProcesses[j].dispose(camera);
                }
                for (var j = 0; j < this.blurVPostProcesses.length; j++) {
                    this.blurVPostProcesses[j].dispose(camera);
                }
            }
            this.originalPostProcess = null;
            this.downSampleX4PostProcess = null;
            this.brightPassPostProcess = null;
            this.textureAdderPostProcess = null;
            this.textureAdderFinalPostProcess = null;
            this.volumetricLightPostProcess = null;
            this.volumetricLightSmoothXPostProcess = null;
            this.volumetricLightSmoothYPostProcess = null;
            this.volumetricLightMergePostProces = null;
            this.volumetricLightFinalPostProcess = null;
            this.lensFlarePostProcess = null;
            this.lensFlareComposePostProcess = null;
            this.luminancePostProcess = null;
            this.hdrPostProcess = null;
            this.hdrFinalPostProcess = null;
            this.depthOfFieldPostProcess = null;
            this.motionBlurPostProcess = null;
            this.luminanceDownSamplePostProcesses = [];
            this.blurHPostProcesses = [];
            this.blurVPostProcesses = [];
        };
        // Dispose
        StandardRenderingPipeline.prototype.dispose = function () {
            this._disposePostProcesses();
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            _super.prototype.dispose.call(this);
        };
        // Serialize rendering pipeline
        StandardRenderingPipeline.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "StandardRenderingPipeline";
            return serializationObject;
        };
        /**
         * Static members
         */
        // Parse serialized pipeline
        StandardRenderingPipeline.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new StandardRenderingPipeline(source._name, scene, source._ratio); }, source, scene, rootUrl);
        };
        // Luminance steps
        StandardRenderingPipeline.LuminanceSteps = 6;
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "brightThreshold", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "blurWidth", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "horizontalBlur", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "exposure", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lensTexture")
        ], StandardRenderingPipeline.prototype, "lensTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "volumetricLightCoefficient", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "volumetricLightPower", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "volumetricLightBlurScale", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "hdrMinimumLuminance", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "hdrDecreaseRate", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "hdrIncreaseRate", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lensColorTexture")
        ], StandardRenderingPipeline.prototype, "lensColorTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "lensFlareStrength", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "lensFlareGhostDispersal", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "lensFlareHaloWidth", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "lensFlareDistortionStrength", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lensStarTexture")
        ], StandardRenderingPipeline.prototype, "lensStarTexture", void 0);
        __decorate([
            BABYLON.serializeAsTexture("lensFlareDirtTexture")
        ], StandardRenderingPipeline.prototype, "lensFlareDirtTexture", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "depthOfFieldDistance", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "depthOfFieldBlurWidth", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "motionStrength", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "_ratio", void 0);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "BloomEnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "DepthOfFieldEnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "LensFlareEnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "HDREnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "VLSEnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "MotionBlurEnabled", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "volumetricLightStepsCount", null);
        __decorate([
            BABYLON.serialize()
        ], StandardRenderingPipeline.prototype, "motionBlurSamples", null);
        return StandardRenderingPipeline;
    }(BABYLON.PostProcessRenderPipeline));
    BABYLON.StandardRenderingPipeline = StandardRenderingPipeline;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.standardRenderingPipeline.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";
BABYLON.Effect.ShadersStore['postprocessVertexShader'] = "\nattribute vec2 position;\nuniform vec2 scale;\n\nvarying vec2 vUV;\nconst vec2 madd=vec2(0.5,0.5);\nvoid main(void) { \nvUV=(position*madd+madd)*scale;\ngl_Position=vec4(position,0.0,1.0);\n}";
BABYLON.Effect.ShadersStore['passPixelShader'] = "\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nvoid main(void) \n{\ngl_FragColor=texture2D(textureSampler,vUV);\n}";
BABYLON.Effect.ShadersStore['depthVertexShader'] = "\nattribute vec3 position;\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\nuniform mat4 viewProjection;\nuniform vec2 depthValues;\n#if defined(ALPHATEST) || defined(NEED_UV)\nvarying vec2 vUV;\nuniform mat4 diffuseMatrix;\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#endif\nvarying float vDepthMetric;\nvoid main(void)\n{\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(position,1.0);\nvDepthMetric=((gl_Position.z+depthValues.x)/(depthValues.y));\n#if defined(ALPHATEST) || defined(BASIC_RENDER)\n#ifdef UV1\nvUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n#endif\n#ifdef UV2\nvUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n#endif\n#endif\n}";
BABYLON.Effect.ShadersStore['depthPixelShader'] = "#ifdef ALPHATEST\nvarying vec2 vUV;\nuniform sampler2D diffuseSampler;\n#endif\nvarying float vDepthMetric;\nvoid main(void)\n{\n#ifdef ALPHATEST\nif (texture2D(diffuseSampler,vUV).a<0.4)\ndiscard;\n#endif\ngl_FragColor=vec4(vDepthMetric,vDepthMetric*vDepthMetric,0.0,1.0);\n}";
BABYLON.Effect.ShadersStore['ssaoPixelShader'] = "\nuniform sampler2D textureSampler;\nvarying vec2 vUV;\n#ifdef SSAO\nuniform sampler2D randomSampler;\nuniform float randTextureTiles;\nuniform float samplesFactor;\nuniform vec3 sampleSphere[SAMPLES];\nuniform float totalStrength;\nuniform float radius;\nuniform float area;\nuniform float fallOff;\nuniform float base;\nvec3 normalFromDepth(float depth,vec2 coords)\n{\nvec2 offset1=vec2(0.0,radius);\nvec2 offset2=vec2(radius,0.0);\nfloat depth1=texture2D(textureSampler,coords+offset1).r;\nfloat depth2=texture2D(textureSampler,coords+offset2).r;\nvec3 p1=vec3(offset1,depth1-depth);\nvec3 p2=vec3(offset2,depth2-depth);\nvec3 normal=cross(p1,p2);\nnormal.z=-normal.z;\nreturn normalize(normal);\n}\nvoid main()\n{\nvec3 random=normalize(texture2D(randomSampler,vUV*randTextureTiles).rgb);\nfloat depth=texture2D(textureSampler,vUV).r;\nvec3 position=vec3(vUV,depth);\nvec3 normal=normalFromDepth(depth,vUV);\nfloat radiusDepth=radius/depth;\nfloat occlusion=0.0;\nvec3 ray;\nvec3 hemiRay;\nfloat occlusionDepth;\nfloat difference;\nfor (int i=0; i<SAMPLES; i++)\n{\nray=radiusDepth*reflect(sampleSphere[i],random);\nhemiRay=position+sign(dot(ray,normal))*ray;\nocclusionDepth=texture2D(textureSampler,clamp(hemiRay.xy,vec2(0.001,0.001),vec2(0.999,0.999))).r;\ndifference=depth-occlusionDepth;\nocclusion+=step(fallOff,difference)*(1.0-smoothstep(fallOff,area,difference));\n}\nfloat ao=1.0-totalStrength*occlusion*samplesFactor;\nfloat result=clamp(ao+base,0.0,1.0);\ngl_FragColor.r=result;\ngl_FragColor.g=result;\ngl_FragColor.b=result;\ngl_FragColor.a=1.0;\n}\n#endif\n";
BABYLON.Effect.ShadersStore['ssao2PixelShader'] = "\nprecision highp float;\nuniform sampler2D textureSampler;\nuniform float near;\nuniform float far;\nuniform float radius;\nvarying vec2 vUV;\nfloat perspectiveDepthToViewZ( const in float invClipZ,const in float near,const in float far ) {\nreturn ( near*far )/( ( far-near )*invClipZ-far );\n}\nfloat viewZToPerspectiveDepth( const in float viewZ,const in float near,const in float far ) {\nreturn ( near*far/viewZ+far)/( far-near );\n}\nfloat viewZToOrthographicDepth( const in float viewZ,const in float near,const in float far ) {\nreturn ( viewZ+near )/( near-far );\n}\n#ifdef SSAO\nuniform sampler2D randomSampler;\nuniform sampler2D normalSampler;\nuniform float randTextureTiles;\nuniform float samplesFactor;\nuniform vec3 sampleSphere[SAMPLES];\nuniform float totalStrength;\nuniform float base;\nuniform float xViewport;\nuniform float yViewport;\nuniform float maxZ;\nuniform float minZAspect;\nuniform vec2 texelSize;\nuniform mat4 projection;\nvoid main()\n{\nvec3 random=texture2D(randomSampler,vUV*randTextureTiles).rgb;\nfloat depth=abs(texture2D(textureSampler,vUV).r);\nvec3 normal=texture2D(normalSampler,vUV).rgb; \nfloat occlusion=0.0;\nfloat correctedRadius=min(radius,minZAspect*depth/near);\nvec3 vViewRay=vec3((vUV.x*2.0-1.0)*xViewport,(vUV.y*2.0-1.0)*yViewport,1.0);\nvec3 origin=vViewRay*depth;\nvec3 rvec=random*2.0-1.0;\nrvec.z=0.0;\nvec3 tangent=normalize(rvec-normal*dot(rvec,normal));\nvec3 bitangent=cross(normal,tangent);\nmat3 tbn=mat3(tangent,bitangent,normal);\nfloat difference;\nif (depth>maxZ) {\ngl_FragColor=vec4(1.0,1.0,1.0,1.0);\nreturn;\n}\nfor (int i=0; i<SAMPLES; ++i) {\n\nvec3 samplePosition=tbn*sampleSphere[i];\nsamplePosition=samplePosition*correctedRadius+origin;\n\nvec4 offset=vec4(samplePosition,1.0);\noffset=projection*offset;\noffset.xyz/=offset.w;\noffset.xy=offset.xy*0.5+0.5;\nif (offset.x<0.0 || offset.y<0.0 || offset.x>1.0 || offset.y>1.0) {\ncontinue;\n}\n\nfloat sampleDepth=abs(texture2D(textureSampler,offset.xy).r);\n\nfloat rangeCheck=abs(depth-sampleDepth)<correctedRadius ? 1.0 : 0.0;\ndifference=samplePosition.z-sampleDepth;\n\nocclusion+=(difference>=1e-5 ? 1.0 : 0.0)*rangeCheck;\n}\n\nfloat ao=1.0-totalStrength*occlusion*samplesFactor;\nfloat result=clamp(ao+base,0.0,1.0);\ngl_FragColor=vec4(vec3(result),1.0);\n}\n#endif\n#ifdef BILATERAL_BLUR\nuniform sampler2D depthSampler;\nuniform float outSize;\nuniform float samplerOffsets[SAMPLES];\nvec4 blur9(sampler2D image,vec2 uv,float resolution,vec2 direction) {\nvec4 color=vec4(0.0);\nvec2 off1=vec2(1.3846153846)*direction;\nvec2 off2=vec2(3.2307692308)*direction;\ncolor+=texture2D(image,uv)*0.2270270270;\ncolor+=texture2D(image,uv+(off1/resolution))*0.3162162162;\ncolor+=texture2D(image,uv-(off1/resolution))*0.3162162162;\ncolor+=texture2D(image,uv+(off2/resolution))*0.0702702703;\ncolor+=texture2D(image,uv-(off2/resolution))*0.0702702703;\nreturn color;\n}\nvec4 blur13(sampler2D image,vec2 uv,float resolution,vec2 direction) {\nvec4 color=vec4(0.0);\nvec2 off1=vec2(1.411764705882353)*direction;\nvec2 off2=vec2(3.2941176470588234)*direction;\nvec2 off3=vec2(5.176470588235294)*direction;\ncolor+=texture2D(image,uv)*0.1964825501511404;\ncolor+=texture2D(image,uv+(off1/resolution))*0.2969069646728344;\ncolor+=texture2D(image,uv-(off1/resolution))*0.2969069646728344;\ncolor+=texture2D(image,uv+(off2/resolution))*0.09447039785044732;\ncolor+=texture2D(image,uv-(off2/resolution))*0.09447039785044732;\ncolor+=texture2D(image,uv+(off3/resolution))*0.010381362401148057;\ncolor+=texture2D(image,uv-(off3/resolution))*0.010381362401148057;\nreturn color;\n}\nvec4 blur13Bilateral(sampler2D image,vec2 uv,float resolution,vec2 direction) {\nvec4 color=vec4(0.0);\nvec2 off1=vec2(1.411764705882353)*direction;\nvec2 off2=vec2(3.2941176470588234)*direction;\nvec2 off3=vec2(5.176470588235294)*direction;\nfloat compareDepth=abs(texture2D(depthSampler,uv).r);\nfloat sampleDepth;\nfloat weight;\nfloat weightSum=30.0;\ncolor+=texture2D(image,uv)*30.0;\nsampleDepth=abs(texture2D(depthSampler,uv+(off1/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv+(off1/resolution))*weight;\nsampleDepth=abs(texture2D(depthSampler,uv-(off1/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv-(off1/resolution))*weight;\nsampleDepth=abs(texture2D(depthSampler,uv+(off2/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv+(off2/resolution))*weight;\nsampleDepth=abs(texture2D(depthSampler,uv-(off2/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv-(off2/resolution))*weight;\nsampleDepth=abs(texture2D(depthSampler,uv+(off3/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv+(off3/resolution))*weight;\nsampleDepth=abs(texture2D(depthSampler,uv-(off3/resolution)).r);\nweight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30.0);\nweightSum+=weight;\ncolor+=texture2D(image,uv-(off3/resolution))*weight;\nreturn color/weightSum;\n}\nvoid main()\n{\n#if EXPENSIVE\nfloat compareDepth=abs(texture2D(depthSampler,vUV).r);\nfloat texelsize=1.0/outSize;\nfloat result=0.0;\nfloat weightSum=0.0;\nfor (int i=0; i<SAMPLES; ++i)\n{\n#ifdef BILATERAL_BLUR_H\nvec2 direction=vec2(1.0,0.0);\nvec2 sampleOffset=vec2(texelsize*samplerOffsets[i],0.0);\n#else\nvec2 direction=vec2(0.0,1.0);\nvec2 sampleOffset=vec2(0.0,texelsize*samplerOffsets[i]);\n#endif\nvec2 samplePos=vUV+sampleOffset;\nfloat sampleDepth=abs(texture2D(depthSampler,samplePos).r);\nfloat weight=clamp(1.0/( 0.003+abs(compareDepth-sampleDepth)),0.0,30000.0);\nresult+=texture2D(textureSampler,samplePos).r*weight;\nweightSum+=weight;\n}\nresult/=weightSum;\ngl_FragColor.rgb=vec3(result);\ngl_FragColor.a=1.0;\n#else\nvec4 color;\n#ifdef BILATERAL_BLUR_H\nvec2 direction=vec2(1.0,0.0);\ncolor=blur13Bilateral(textureSampler,vUV,outSize,direction);\n#else\nvec2 direction=vec2(0.0,1.0);\ncolor=blur13Bilateral(textureSampler,vUV,outSize,direction);\n#endif\ngl_FragColor.rgb=vec3(color.r);\ngl_FragColor.a=1.0;\n#endif\n}\n#endif\n";
BABYLON.Effect.ShadersStore['ssaoCombinePixelShader'] = "uniform sampler2D textureSampler;\nuniform sampler2D originalColor;\nvarying vec2 vUV;\nvoid main(void) {\nvec4 ssaoColor=texture2D(textureSampler,vUV);\nvec4 sceneColor=texture2D(originalColor,vUV);\ngl_FragColor=sceneColor*ssaoColor;\n}\n";
BABYLON.Effect.ShadersStore['chromaticAberrationPixelShader'] = "\nuniform sampler2D textureSampler; \n\nuniform float chromatic_aberration;\nuniform float screen_width;\nuniform float screen_height;\n\nvarying vec2 vUV;\nvoid main(void)\n{\nvec2 centered_screen_pos=vec2(vUV.x-0.5,vUV.y-0.5);\nfloat radius2=centered_screen_pos.x*centered_screen_pos.x\n+centered_screen_pos.y*centered_screen_pos.y;\nfloat radius=sqrt(radius2);\nvec4 original=texture2D(textureSampler,vUV);\nif (chromatic_aberration>0.0) {\n\nvec3 ref_indices=vec3(-0.3,0.0,0.3);\nfloat ref_shiftX=chromatic_aberration*radius*17.0/screen_width;\nfloat ref_shiftY=chromatic_aberration*radius*17.0/screen_height;\n\nvec2 ref_coords_r=vec2(vUV.x+ref_indices.r*ref_shiftX,vUV.y+ref_indices.r*ref_shiftY*0.5);\nvec2 ref_coords_g=vec2(vUV.x+ref_indices.g*ref_shiftX,vUV.y+ref_indices.g*ref_shiftY*0.5);\nvec2 ref_coords_b=vec2(vUV.x+ref_indices.b*ref_shiftX,vUV.y+ref_indices.b*ref_shiftY*0.5);\noriginal.r=texture2D(textureSampler,ref_coords_r).r;\noriginal.g=texture2D(textureSampler,ref_coords_g).g;\noriginal.b=texture2D(textureSampler,ref_coords_b).b;\n}\ngl_FragColor=original;\n}";
BABYLON.Effect.ShadersStore['lensHighlightsPixelShader'] = "\nuniform sampler2D textureSampler; \n\nuniform float gain;\nuniform float threshold;\nuniform float screen_width;\nuniform float screen_height;\n\nvarying vec2 vUV;\n\nvec4 highlightColor(vec4 color) {\nvec4 highlight=color;\nfloat luminance=dot(highlight.rgb,vec3(0.2125,0.7154,0.0721));\nfloat lum_threshold;\nif (threshold>1.0) { lum_threshold=0.94+0.01*threshold; }\nelse { lum_threshold=0.5+0.44*threshold; }\nluminance=clamp((luminance-lum_threshold)*(1.0/(1.0-lum_threshold)),0.0,1.0);\nhighlight*=luminance*gain;\nhighlight.a=1.0;\nreturn highlight;\n}\nvoid main(void)\n{\nvec4 original=texture2D(textureSampler,vUV);\n\nif (gain == -1.0) {\ngl_FragColor=vec4(0.0,0.0,0.0,1.0);\nreturn;\n}\nfloat w=2.0/screen_width;\nfloat h=2.0/screen_height;\nfloat weight=1.0;\n\nvec4 blurred=vec4(0.0,0.0,0.0,0.0);\n#ifdef PENTAGON\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.84*w,0.43*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.48*w,-1.29*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.61*w,1.51*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.55*w,-0.74*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.71*w,-0.52*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.94*w,1.59*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.40*w,-1.87*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.62*w,1.16*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.09*w,0.25*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.46*w,-1.71*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.08*w,2.42*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.85*w,-1.89*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.89*w,0.16*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.29*w,1.88*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.40*w,-2.81*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.54*w,2.26*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.60*w,-0.61*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.31*w,-1.30*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.83*w,2.53*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.12*w,-2.48*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.60*w,1.11*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.82*w,0.99*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.50*w,-2.81*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.85*w,3.33*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.94*w,-1.92*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(3.27*w,-0.53*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.95*w,2.48*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.23*w,-3.04*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.17*w,2.05*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.97*w,-0.04*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.25*w,-2.00*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.31*w,3.08*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.94*w,-2.59*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(3.37*w,0.64*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-3.13*w,1.93*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.03*w,-3.65*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.60*w,3.17*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-3.14*w,-1.19*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(3.00*w,-1.19*h)));\n#else\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.85*w,0.36*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.52*w,-1.14*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.46*w,1.42*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.46*w,-0.83*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.79*w,-0.42*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.11*w,1.62*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.29*w,-2.07*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.69*w,1.39*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.28*w,0.12*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.65*w,-1.69*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.08*w,2.44*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.63*w,-1.90*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.55*w,0.31*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.13*w,1.52*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.56*w,-2.61*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.38*w,2.34*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.64*w,-0.81*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.53*w,-1.21*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.06*w,2.63*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.00*w,-2.69*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.59*w,1.32*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.82*w,0.78*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.57*w,-2.50*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(0.54*w,2.93*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.39*w,-1.81*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(3.01*w,-0.28*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.04*w,2.25*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.02*w,-3.05*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.09*w,2.25*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-3.07*w,-0.25*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.44*w,-1.90*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-0.52*w,3.05*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-1.68*w,-2.61*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(3.01*w,0.79*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.76*w,1.46*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.05*w,-2.94*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(1.21*w,2.88*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(-2.84*w,-1.30*h)));\nblurred+=highlightColor(texture2D(textureSampler,vUV+vec2(2.98*w,-0.96*h)));\n#endif\nblurred/=39.0;\ngl_FragColor=blurred;\n\n}";
BABYLON.Effect.ShadersStore['depthOfFieldPixelShader'] = "\n\n\n\n\nuniform sampler2D textureSampler;\nuniform sampler2D highlightsSampler;\nuniform sampler2D depthSampler;\nuniform sampler2D grainSampler;\n\nuniform float grain_amount;\nuniform bool blur_noise;\nuniform float screen_width;\nuniform float screen_height;\nuniform float distortion;\nuniform bool dof_enabled;\n\nuniform float screen_distance; \nuniform float aperture;\nuniform float darken;\nuniform float edge_blur;\nuniform bool highlights;\n\nuniform float near;\nuniform float far;\n\nvarying vec2 vUV;\n\n#define PI 3.14159265\n#define TWOPI 6.28318530\n#define inverse_focal_length 0.1 \n\nvec2 centered_screen_pos;\nvec2 distorted_coords;\nfloat radius2;\nfloat radius;\n\nvec2 rand(vec2 co)\n{\nfloat noise1=(fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453));\nfloat noise2=(fract(sin(dot(co,vec2(12.9898,78.233)*2.0))*43758.5453));\nreturn clamp(vec2(noise1,noise2),0.0,1.0);\n}\n\nvec2 getDistortedCoords(vec2 coords) {\nif (distortion == 0.0) { return coords; }\nvec2 direction=1.0*normalize(centered_screen_pos);\nvec2 dist_coords=vec2(0.5,0.5);\ndist_coords.x=0.5+direction.x*radius2*1.0;\ndist_coords.y=0.5+direction.y*radius2*1.0;\nfloat dist_amount=clamp(distortion*0.23,0.0,1.0);\ndist_coords=mix(coords,dist_coords,dist_amount);\nreturn dist_coords;\n}\n\nfloat sampleScreen(inout vec4 color,const in vec2 offset,const in float weight) {\n\nvec2 coords=distorted_coords;\nfloat angle=rand(coords*100.0).x*TWOPI;\ncoords+=vec2(offset.x*cos(angle)-offset.y*sin(angle),offset.x*sin(angle)+offset.y*cos(angle));\ncolor+=texture2D(textureSampler,coords)*weight;\nreturn weight;\n}\n\nfloat getBlurLevel(float size) {\nreturn min(3.0,ceil(size/1.0));\n}\n\nvec4 getBlurColor(float size) {\nvec4 col=texture2D(textureSampler,distorted_coords);\nif (size == 0.0) { return col; }\n\n\nfloat blur_level=getBlurLevel(size);\nfloat w=(size/screen_width);\nfloat h=(size/screen_height);\nfloat total_weight=1.0;\nvec2 sample_coords;\ntotal_weight+=sampleScreen(col,vec2(-0.50*w,0.24*h),0.93);\ntotal_weight+=sampleScreen(col,vec2(0.30*w,-0.75*h),0.90);\ntotal_weight+=sampleScreen(col,vec2(0.36*w,0.96*h),0.87);\ntotal_weight+=sampleScreen(col,vec2(-1.08*w,-0.55*h),0.85);\ntotal_weight+=sampleScreen(col,vec2(1.33*w,-0.37*h),0.83);\ntotal_weight+=sampleScreen(col,vec2(-0.82*w,1.31*h),0.80);\ntotal_weight+=sampleScreen(col,vec2(-0.31*w,-1.67*h),0.78);\ntotal_weight+=sampleScreen(col,vec2(1.47*w,1.11*h),0.76);\ntotal_weight+=sampleScreen(col,vec2(-1.97*w,0.19*h),0.74);\ntotal_weight+=sampleScreen(col,vec2(1.42*w,-1.57*h),0.72);\nif (blur_level>1.0) {\ntotal_weight+=sampleScreen(col,vec2(0.01*w,2.25*h),0.70);\ntotal_weight+=sampleScreen(col,vec2(-1.62*w,-1.74*h),0.67);\ntotal_weight+=sampleScreen(col,vec2(2.49*w,0.20*h),0.65);\ntotal_weight+=sampleScreen(col,vec2(-2.07*w,1.61*h),0.63);\ntotal_weight+=sampleScreen(col,vec2(0.46*w,-2.70*h),0.61);\ntotal_weight+=sampleScreen(col,vec2(1.55*w,2.40*h),0.59);\ntotal_weight+=sampleScreen(col,vec2(-2.88*w,-0.75*h),0.56);\ntotal_weight+=sampleScreen(col,vec2(2.73*w,-1.44*h),0.54);\ntotal_weight+=sampleScreen(col,vec2(-1.08*w,3.02*h),0.52);\ntotal_weight+=sampleScreen(col,vec2(-1.28*w,-3.05*h),0.49);\n}\nif (blur_level>2.0) {\ntotal_weight+=sampleScreen(col,vec2(3.11*w,1.43*h),0.46);\ntotal_weight+=sampleScreen(col,vec2(-3.36*w,1.08*h),0.44);\ntotal_weight+=sampleScreen(col,vec2(1.80*w,-3.16*h),0.41);\ntotal_weight+=sampleScreen(col,vec2(0.83*w,3.65*h),0.38);\ntotal_weight+=sampleScreen(col,vec2(-3.16*w,-2.19*h),0.34);\ntotal_weight+=sampleScreen(col,vec2(3.92*w,-0.53*h),0.31);\ntotal_weight+=sampleScreen(col,vec2(-2.59*w,3.12*h),0.26);\ntotal_weight+=sampleScreen(col,vec2(-0.20*w,-4.15*h),0.22);\ntotal_weight+=sampleScreen(col,vec2(3.02*w,3.00*h),0.15);\n}\ncol/=total_weight; \n\nif (darken>0.0) {\ncol.rgb*=clamp(0.3,1.0,1.05-size*0.5*darken);\n}\n\n\n\n\nreturn col;\n}\nvoid main(void)\n{\n\ncentered_screen_pos=vec2(vUV.x-0.5,vUV.y-0.5);\nradius2=centered_screen_pos.x*centered_screen_pos.x+centered_screen_pos.y*centered_screen_pos.y;\nradius=sqrt(radius2);\ndistorted_coords=getDistortedCoords(vUV); \nvec2 texels_coords=vec2(vUV.x*screen_width,vUV.y*screen_height); \nfloat depth=texture2D(depthSampler,distorted_coords).r; \nfloat distance=near+(far-near)*depth; \nvec4 color=texture2D(textureSampler,vUV); \n\n\nfloat coc=abs(aperture*(screen_distance*(inverse_focal_length-1.0/distance)-1.0));\n\nif (dof_enabled == false || coc<0.07) { coc=0.0; }\n\nfloat edge_blur_amount=0.0;\nif (edge_blur>0.0) {\nedge_blur_amount=clamp((radius*2.0-1.0+0.15*edge_blur)*1.5,0.0,1.0)*1.3;\n}\n\nfloat blur_amount=max(edge_blur_amount,coc);\n\nif (blur_amount == 0.0) {\ngl_FragColor=texture2D(textureSampler,distorted_coords);\n}\nelse {\n\ngl_FragColor=getBlurColor(blur_amount*1.7);\n\nif (highlights) {\ngl_FragColor.rgb+=clamp(coc,0.0,1.0)*texture2D(highlightsSampler,distorted_coords).rgb;\n}\nif (blur_noise) {\n\nvec2 noise=rand(distorted_coords)*0.01*blur_amount;\nvec2 blurred_coord=vec2(distorted_coords.x+noise.x,distorted_coords.y+noise.y);\ngl_FragColor=0.04*texture2D(textureSampler,blurred_coord)+0.96*gl_FragColor;\n}\n}\n\nif (grain_amount>0.0) {\nvec4 grain_color=texture2D(grainSampler,texels_coords*0.003);\ngl_FragColor.rgb+=(-0.5+grain_color.rgb)*0.30*grain_amount;\n}\n}\n";
BABYLON.Effect.ShadersStore['standardPixelShader'] = "uniform sampler2D textureSampler;\nvarying vec2 vUV;\n#if defined(PASS_POST_PROCESS)\nvoid main(void)\n{\nvec4 color=texture2D(textureSampler,vUV);\ngl_FragColor=color;\n}\n#endif\n#if defined(DOWN_SAMPLE_X4)\nuniform vec2 dsOffsets[16];\nvoid main(void)\n{\nvec4 average=vec4(0.0,0.0,0.0,0.0);\naverage=texture2D(textureSampler,vUV+dsOffsets[0]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[1]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[2]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[3]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[4]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[5]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[6]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[7]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[8]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[9]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[10]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[11]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[12]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[13]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[14]);\naverage+=texture2D(textureSampler,vUV+dsOffsets[15]);\naverage/=16.0;\ngl_FragColor=average;\n}\n#endif\n#if defined(BRIGHT_PASS)\nuniform vec2 dsOffsets[4];\nuniform float brightThreshold;\nvoid main(void)\n{\nvec4 average=vec4(0.0,0.0,0.0,0.0);\naverage=texture2D(textureSampler,vUV+vec2(dsOffsets[0].x,dsOffsets[0].y));\naverage+=texture2D(textureSampler,vUV+vec2(dsOffsets[1].x,dsOffsets[1].y));\naverage+=texture2D(textureSampler,vUV+vec2(dsOffsets[2].x,dsOffsets[2].y));\naverage+=texture2D(textureSampler,vUV+vec2(dsOffsets[3].x,dsOffsets[3].y));\naverage*=0.25;\nfloat luminance=length(average.rgb);\nif (luminance<brightThreshold) {\naverage=vec4(0.0,0.0,0.0,1.0);\n}\ngl_FragColor=average;\n}\n#endif\n#if defined(TEXTURE_ADDER)\nuniform sampler2D otherSampler;\nuniform sampler2D lensSampler;\nuniform float exposure;\nvoid main(void)\n{\nvec3 colour=texture2D(textureSampler,vUV).rgb;\ncolour*=exposure;\nvec3 X=max(vec3(0.0,0.0,0.0),colour-0.004);\nvec3 retColor=(X*(6.2*X+0.5))/(X*(6.2*X+1.7)+0.06);\ncolour=retColor*retColor;\ncolour+=colour*texture2D(lensSampler,vUV).rgb;\nvec4 finalColor=vec4(colour.rgb,1.0)+texture2D(otherSampler,vUV);\ngl_FragColor=finalColor;\n}\n#endif\n#if defined(VLS)\n#define PI 3.1415926535897932384626433832795\nuniform mat4 shadowViewProjection;\nuniform mat4 lightWorld;\nuniform vec3 cameraPosition;\nuniform vec3 sunDirection;\nuniform vec3 sunColor;\nuniform vec2 depthValues;\nuniform float scatteringCoefficient;\nuniform float scatteringPower;\nuniform sampler2D shadowMapSampler;\nuniform sampler2D positionSampler;\nfloat computeScattering(float lightDotView)\n{\nfloat result=1.0-scatteringCoefficient*scatteringCoefficient;\nresult/=(4.0*PI*pow(1.0+scatteringCoefficient*scatteringCoefficient-(2.0*scatteringCoefficient)*lightDotView,1.5));\nreturn result;\n}\nvoid main(void)\n{\n\nvec3 worldPos=texture2D(positionSampler,vUV).rgb;\nvec3 startPosition=cameraPosition;\nvec3 rayVector=worldPos-startPosition;\nfloat rayLength=length(rayVector);\nvec3 rayDirection=rayVector/rayLength;\nfloat stepLength=rayLength/NB_STEPS;\nvec3 stepL=rayDirection*stepLength;\nvec3 currentPosition=startPosition;\nvec3 accumFog=vec3(0.0);\nfor (int i=0; i<int(NB_STEPS); i++)\n{\nvec4 worldInShadowCameraSpace=shadowViewProjection*vec4(currentPosition,1.0);\nfloat depthMetric=(worldInShadowCameraSpace.z+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depthMetric,0.0,1.0);\nworldInShadowCameraSpace.xyz/=worldInShadowCameraSpace.w;\nworldInShadowCameraSpace.xyz=0.5*worldInShadowCameraSpace.xyz+vec3(0.5);\nfloat shadowMapValue=texture2D(shadowMapSampler,worldInShadowCameraSpace.xy).r;\nif (shadowMapValue>shadowPixelDepth)\naccumFog+=sunColor*computeScattering(dot(rayDirection,sunDirection));\ncurrentPosition+=stepL;\n}\naccumFog/=NB_STEPS;\nvec3 color=accumFog*scatteringPower;\ngl_FragColor=vec4(color*exp(color) ,1.0);\n}\n#endif\n#if defined(VLSMERGE)\nuniform sampler2D originalSampler;\nvoid main(void)\n{\ngl_FragColor=texture2D(originalSampler,vUV)+texture2D(textureSampler,vUV);\n}\n#endif\n#if defined(LUMINANCE)\nuniform vec2 lumOffsets[4];\nvoid main()\n{\nfloat average=0.0;\nvec4 color=vec4(0.0);\nfloat maximum=-1e20;\nvec3 weight=vec3(0.299,0.587,0.114);\nfor (int i=0; i<4; i++)\n{\ncolor=texture2D(textureSampler,vUV+ lumOffsets[i]);\n\nfloat GreyValue=dot(color.rgb,vec3(0.33,0.33,0.33));\n\n#ifdef WEIGHTED_AVERAGE\nfloat GreyValue=dot(color.rgb,weight);\n#endif\n#ifdef BRIGHTNESS\nfloat GreyValue=max(color.r,max(color.g,color.b));\n#endif\n#ifdef HSL_COMPONENT\nfloat GreyValue=0.5*(max(color.r,max(color.g,color.b))+min(color.r,min(color.g,color.b)));\n#endif\n#ifdef MAGNITUDE\nfloat GreyValue=length(color.rgb);\n#endif\nmaximum=max(maximum,GreyValue);\naverage+=(0.25*log(1e-5+GreyValue));\n}\naverage=exp(average);\ngl_FragColor=vec4(average,maximum,0.0,1.0);\n}\n#endif\n#if defined(LUMINANCE_DOWN_SAMPLE)\nuniform vec2 dsOffsets[9];\nuniform float halfDestPixelSize;\n#ifdef FINAL_DOWN_SAMPLER\nvec4 pack(float value) {\nconst vec4 bit_shift=vec4(255.0*255.0*255.0,255.0*255.0,255.0,1.0);\nconst vec4 bit_mask=vec4(0.0,1.0/255.0,1.0/255.0,1.0/255.0);\nvec4 res=fract(value*bit_shift);\nres-=res.xxyz*bit_mask;\nreturn res;\n}\n#endif\nvoid main()\n{\nvec4 color=vec4(0.0);\nfloat average=0.0;\nfor (int i=0; i<9; i++)\n{\ncolor=texture2D(textureSampler,vUV+vec2(halfDestPixelSize,halfDestPixelSize)+dsOffsets[i]);\naverage+=color.r;\n}\naverage/=9.0;\n#ifdef FINAL_DOWN_SAMPLER\ngl_FragColor=pack(average);\n#else\ngl_FragColor=vec4(average,average,0.0,1.0);\n#endif\n}\n#endif\n#if defined(HDR)\nuniform sampler2D textureAdderSampler;\nuniform float averageLuminance;\nvoid main()\n{\nvec4 color=texture2D(textureAdderSampler,vUV);\nvec4 adjustedColor=color/averageLuminance;\ncolor=adjustedColor;\ncolor.a=1.0;\ngl_FragColor=color;\n}\n#endif\n#if defined(LENS_FLARE)\n#define GHOSTS 3\nuniform sampler2D lensColorSampler;\nuniform float strength;\nuniform float ghostDispersal;\nuniform float haloWidth;\nuniform vec2 resolution;\nuniform float distortionStrength;\nfloat hash(vec2 p)\n{\nfloat h=dot(p,vec2(127.1,311.7));\nreturn -1.0+2.0*fract(sin(h)*43758.5453123);\n}\nfloat noise(in vec2 p)\n{\nvec2 i=floor(p);\nvec2 f=fract(p);\nvec2 u=f*f*(3.0-2.0*f);\nreturn mix(mix(hash(i+vec2(0.0,0.0)),\nhash(i+vec2(1.0,0.0)),u.x),\nmix(hash(i+vec2(0.0,1.0)),\nhash(i+vec2(1.0,1.0)),u.x),u.y);\n}\nfloat fbm(vec2 p)\n{\nfloat f=0.0;\nf+=0.5000*noise(p); p*=2.02;\nf+=0.2500*noise(p); p*=2.03;\nf+=0.1250*noise(p); p*=2.01;\nf+=0.0625*noise(p); p*=2.04;\nf/=0.9375;\nreturn f;\n}\nvec3 pattern(vec2 uv)\n{\nvec2 p=-1.0+2.0*uv;\nfloat p2=dot(p,p);\nfloat f=fbm(vec2(15.0*p2))/2.0;\nfloat r=0.2+0.6*sin(12.5*length(uv-vec2(0.5)));\nfloat g=0.2+0.6*sin(20.5*length(uv-vec2(0.5)));\nfloat b=0.2+0.6*sin(17.2*length(uv-vec2(0.5)));\nreturn (1.0-f)*vec3(r,g,b);\n}\nfloat luminance(vec3 color)\n{\nreturn dot(color.rgb,vec3(0.2126,0.7152,0.0722));\n}\nvec4 textureDistorted(sampler2D tex,vec2 texcoord,vec2 direction,vec3 distortion)\n{\nreturn vec4(\ntexture2D(tex,texcoord+direction*distortion.r).r,\ntexture2D(tex,texcoord+direction*distortion.g).g,\ntexture2D(tex,texcoord+direction*distortion.b).b,\n1.0\n);\n}\nvoid main(void)\n{\nvec2 uv=-vUV+vec2(1.0);\nvec2 ghostDir=(vec2(0.5)-uv)*ghostDispersal;\nvec2 texelSize=1.0/resolution;\nvec3 distortion=vec3(-texelSize.x*distortionStrength,0.0,texelSize.x*distortionStrength);\nvec4 result=vec4(0.0);\nfloat ghostIndice=1.0;\nfor (int i=0; i<GHOSTS; ++i)\n{\nvec2 offset=fract(uv+ghostDir*ghostIndice);\nfloat weight=length(vec2(0.5)-offset)/length(vec2(0.5));\nweight=pow(1.0-weight,10.0);\nresult+=textureDistorted(textureSampler,offset,normalize(ghostDir),distortion)*weight*strength;\nghostIndice+=1.0;\n}\nvec2 haloVec=normalize(ghostDir)*haloWidth;\nfloat weight=length(vec2(0.5)-fract(uv+haloVec))/length(vec2(0.5));\nweight=pow(1.0-weight,10.0);\nresult+=textureDistorted(textureSampler,fract(uv+haloVec),normalize(ghostDir),distortion)*weight*strength;\nresult*=texture2D(lensColorSampler,vec2(length(vec2(0.5)-uv)/length(vec2(0.5))));\ngl_FragColor=result;\n}\n#endif\n#if defined(LENS_FLARE_COMPOSE)\nuniform sampler2D otherSampler;\nuniform sampler2D lensDirtSampler;\nuniform sampler2D lensStarSampler;\nuniform mat4 lensStarMatrix;\nvoid main(void)\n{\nvec2 lensFlareCoords=(lensStarMatrix*vec4(vUV,1.0,1.0)).xy;\nvec4 lensMod=texture2D(lensDirtSampler,vUV);\nlensMod+=texture2D(lensStarSampler,vUV);\nvec4 result=texture2D(textureSampler,vUV)*lensMod;\ngl_FragColor=texture2D(otherSampler,vUV)+result;\n}\n#endif\n#if defined(DEPTH_OF_FIELD)\nuniform sampler2D otherSampler;\nuniform sampler2D depthSampler;\nuniform float distance;\nvoid main(void)\n{\nvec4 sharp=texture2D(otherSampler,vUV);\nvec4 blur=texture2D(textureSampler,vUV);\nfloat dist=clamp(texture2D(depthSampler,vUV).r*distance,0.0,1.0);\nfloat factor=0.0;\nif (dist<0.05)\nfactor=1.0;\nelse if (dist<0.1)\nfactor=20.0*(0.1-dist);\nelse if (dist<0.5)\nfactor=0.0;\nelse\nfactor=2.0*(dist-0.5);\nfactor=clamp(factor,0.0,0.90);\ngl_FragColor=mix(sharp,blur,factor);\n}\n#endif\n#if defined(MOTION_BLUR)\nuniform mat4 inverseViewProjection;\nuniform mat4 prevViewProjection;\nuniform vec2 screenSize;\nuniform float motionScale;\nuniform float motionStrength;\nuniform sampler2D depthSampler;\nvoid main(void)\n{\nvec2 texelSize=1.0/screenSize;\nfloat depth=texture2D(depthSampler,vUV).r;\nvec4 cpos=vec4(vUV*2.0-1.0,depth,1.0);\ncpos=cpos*inverseViewProjection;\nvec4 ppos=cpos*prevViewProjection;\nppos.xyz/=ppos.w;\nppos.xy=ppos.xy*0.5+0.5;\nvec2 velocity=(ppos.xy-vUV)*motionScale*motionStrength;\nfloat speed=length(velocity/texelSize);\nint nSamples=int(clamp(speed,1.0,MAX_MOTION_SAMPLES));\nvec4 result=texture2D(textureSampler,vUV);\nfor (int i=1; i<int(MAX_MOTION_SAMPLES); ++i) {\nif (i>=nSamples)\nbreak;\nvec2 offset1=vUV+velocity*(float(i)/float(nSamples-1)-0.5);\nresult+=texture2D(textureSampler,offset1);\n}\ngl_FragColor=result/float(nSamples);\n}\n#endif\n";

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
var SSAORenderingPipeline = BABYLON.SSAORenderingPipeline;
var SSAO2RenderingPipeline = BABYLON.SSAO2RenderingPipeline;
var LensRenderingPipeline = BABYLON.LensRenderingPipeline;
var StandardRenderingPipeline = BABYLON.StandardRenderingPipeline;

export { SSAORenderingPipeline,SSAO2RenderingPipeline,LensRenderingPipeline,StandardRenderingPipeline };