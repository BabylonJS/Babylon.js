module BABYLON {
    export class SSAORenderingPipeline extends PostProcessRenderPipeline {
        // Members

        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        public SSAOOriginalSceneColorEffect: string = "SSAOOriginalSceneColorEffect";
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        public SSAORenderEffect: string = "SSAORenderEffect";
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        public SSAOBlurHRenderEffect: string = "SSAOBlurHRenderEffect";
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        public SSAOBlurVRenderEffect: string = "SSAOBlurVRenderEffect";
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        public SSAOCombineRenderEffect: string = "SSAOCombineRenderEffect";

        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        @serialize()
        public totalStrength: number = 1.0;

        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 0.0006
        * @type {number}
        */
        @serialize()
        public radius: number = 0.0001;

        /**
        * Related to fallOff, used to interpolate SSAO samples (first interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to fallOff and superior to fallOff.
        * Default value is 0.975
        * @type {number}
        */
        @serialize()
        public area: number = 0.0075;

        /**
        * Related to area, used to interpolate SSAO samples (second interpolate function input) based on the occlusion difference of each pixel
        * Must not be equal to area and inferior to area.
        * Default value is 0.0
        * @type {number}
        */
        @serialize()
        public fallOff: number = 0.000001;

        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        @serialize()
        public base: number = 0.5;

        private _scene: Scene;
        private _depthTexture: RenderTargetTexture;
        private _randomTexture: DynamicTexture;

        private _originalColorPostProcess: PassPostProcess;
        private _ssaoPostProcess: PostProcess;
        private _blurHPostProcess: PostProcess;
        private _blurVPostProcess: PostProcess;
        private _ssaoCombinePostProcess: PostProcess;

        private _firstUpdate: boolean = true;

        @serialize()
        private _ratio: any;

        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, combineRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]) {
            super(scene.getEngine(), name);

            this._scene = scene;

            // Set up assets
            this._createRandomTexture();
            this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"

            var ssaoRatio = ratio.ssaoRatio || ratio;
            var combineRatio = ratio.combineRatio || ratio;
            this._ratio = {
                ssaoRatio: ssaoRatio,
                combineRatio: combineRatio
            };

            this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", combineRatio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOPostProcess(ssaoRatio);
            this._createBlurPostProcess(ssaoRatio);
            this._createSSAOCombinePostProcess(combineRatio);

            // Set up pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOOriginalSceneColorEffect, () => { return this._originalColorPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAORenderEffect, () => { return this._ssaoPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurHRenderEffect, () => { return this._blurHPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurVRenderEffect, () => { return this._blurVPostProcess; }, true));

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOCombineRenderEffect, () => { return this._ssaoCombinePostProcess; }, true));

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
        public getBlurHPostProcess(): BlurPostProcess {
            Tools.Error("SSAORenderinPipeline.getBlurHPostProcess() is deprecated, no more blur post-process exists");
            return null;
        }

        /**
         * Returns the vertical blur PostProcess
         * @return {BABYLON.BlurPostProcess} The vertical blur post-process
         */
        public getBlurVPostProcess(): BlurPostProcess {
            Tools.Error("SSAORenderinPipeline.getBlurVPostProcess() is deprecated, no more blur post-process exists");
            return null;
        }

        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        public dispose(disableDepthRender: boolean = false): void {
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
        }

        // Private Methods
        private _createBlurPostProcess(ratio: number): void {
            /*
            var samplerOffsets = [
                -8.0, -6.0, -4.0, -2.0,
                0.0,
                2.0, 4.0, 6.0, 8.0
            ];
            */
            var samples = 16;
            var samplerOffsets = [];

            for (var i = -8; i < 8; i++) {
                samplerOffsets.push(i * 2);
            }

            this._blurHPostProcess = new PostProcess("BlurH", "ssao", ["outSize", "samplerOffsets"], ["depthSampler"], ratio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define BILATERAL_BLUR_H\n#define SAMPLES 16");
            this._blurHPostProcess.onApply = (effect: Effect) => {
                effect.setFloat("outSize", this._ssaoCombinePostProcess.width);
                effect.setTexture("depthSampler", this._depthTexture);

                if (this._firstUpdate) {
                    effect.setArray("samplerOffsets", samplerOffsets);
                }
            };

            this._blurVPostProcess = new PostProcess("BlurV", "ssao", ["outSize", "samplerOffsets"], ["depthSampler"], ratio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define SAMPLES 16");
            this._blurVPostProcess.onApply = (effect: Effect) => {
                effect.setFloat("outSize", this._ssaoCombinePostProcess.height);
                effect.setTexture("depthSampler", this._depthTexture);

                if (this._firstUpdate) {
                    effect.setArray("samplerOffsets", samplerOffsets);
                    this._firstUpdate = false;
                }
            };
        }

        private _createSSAOPostProcess(ratio: number): void {
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

            this._ssaoPostProcess = new PostProcess("ssao", "ssao",
                                                    [
                                                        "sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius",
                                                        "area", "fallOff", "base", "range", "viewport"
                                                    ],
                                                    ["randomSampler"],
                                                    ratio, null, Texture.BILINEAR_SAMPLINGMODE,
                                                    this._scene.getEngine(), false,
                                                    "#define SAMPLES " + numSamples + "\n#define SSAO");

            var viewport = new Vector2(0, 0);

            this._ssaoPostProcess.onApply = (effect: Effect) => {
                if (this._firstUpdate) {
                    effect.setArray3("sampleSphere", sampleSphere);
                    effect.setFloat("samplesFactor", samplesFactor);
                    effect.setFloat("randTextureTiles", 4.0);
                }

                effect.setFloat("totalStrength", this.totalStrength);
                effect.setFloat("radius", this.radius);
                effect.setFloat("area", this.area);
                effect.setFloat("fallOff", this.fallOff);
                effect.setFloat("base", this.base);

                effect.setTexture("textureSampler", this._depthTexture);
                effect.setTexture("randomSampler", this._randomTexture);
            };
        }

        private _createSSAOCombinePostProcess(ratio: number): void {
            this._ssaoCombinePostProcess = new PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"],
                                                           ratio, null, Texture.BILINEAR_SAMPLINGMODE,
                                                           this._scene.getEngine(), false);

            this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("originalColor", this._originalColorPostProcess);
            };
        }

        private _createRandomTexture(): void {
            var size = 512;

            this._randomTexture = new DynamicTexture("SSAORandomTexture", size, this._scene, false, Texture.TRILINEAR_SAMPLINGMODE);
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            var context = this._randomTexture.getContext();

            var rand = (min, max) => {
                return Math.random() * (max - min) + min;
            }

            var randVector = Vector3.Zero();

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
        }
    }
}