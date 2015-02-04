module BABYLON {
    export class SSAORenderingPipeline extends PostProcessRenderPipeline {
        // Members
        public SSAOOriginalSceneColorEffect: string = "SSAOOriginalSceneColorEffect";
        public SSAORenderEffect: string = "SSAORenderEffect";
        public SSAOBlurHRenderEffect: string = "SSAOBlurHRenderEffect";
        public SSAOBlurVRenderEffect: string = "SSAOBlurVRenderEffect";
        public SSAOCombineRenderEffect: string = "SSAOCombineRenderEffect";

        private _scene: Scene;
        private _depthTexture: RenderTargetTexture;
        private _randomTexture: DynamicTexture;

        private _originalColorPostProcess: PassPostProcess;
        private _ssaoPostProcess: PostProcess;
        private _blurHPostProcess: BlurPostProcess;
        private _blurVPostProcess: BlurPostProcess;
        private _ssaoCombinePostProcess: PostProcess;

        private _firstUpdate: boolean = true;

        constructor(name: string, scene: Scene, ratio: number = 1.0, cameras?: Camera[]) {
            super(scene.getEngine(), name);

            this._scene = scene;

            // Set up assets
            this._createRandomTexture();
            this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"

            this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOPostProcess(ratio);
            this._blurHPostProcess = new BlurPostProcess("SSAOBlurH", new Vector2(2.0, 0.0), 1.3, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._blurVPostProcess = new BlurPostProcess("SSAOBlurV", new Vector2(0.0, 2.0), 1.3, ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOCombinePostProcess();

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
        public getBlurHPostProcess(): BlurPostProcess {
            return this._blurHPostProcess;
        }

        public getBlurVPostProcess(): BlurPostProcess {
            return this._blurVPostProcess;
        }

        public dispose(): void {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

            this._originalColorPostProcess = undefined;
            this._ssaoPostProcess = undefined;
            this._blurHPostProcess = undefined;
            this._blurVPostProcess = undefined;
            this._ssaoCombinePostProcess = undefined;

            this._randomTexture.dispose();
        }

        // Private Methods
        private _createSSAOPostProcess(ratio: number): void {
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
            var samplesFactor = 1.0 / 16.0;

            this._ssaoPostProcess = new PostProcess("ssao", "ssao", ["sampleSphere", "samplesFactor", "randTextureTiles"],
                                                    ["randomSampler"],
                                                    ratio, null, Texture.BILINEAR_SAMPLINGMODE,
                                                    this._scene.getEngine(), false);

            this._ssaoPostProcess.onApply = (effect: Effect) => {
                if (this._firstUpdate) {
                    effect.setArray3("sampleSphere", sampleSphere);
                    effect.setFloat("samplesFactor", samplesFactor);
                    effect.setFloat("randTextureTiles", 4.0 / ratio);
                    this._firstUpdate = false;
                }

                effect.setTexture("textureSampler", this._depthTexture);
                effect.setTexture("randomSampler", this._randomTexture);
            };
        }

        private _createSSAOCombinePostProcess(): void {
            this._ssaoCombinePostProcess = new PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"],
                                                           1.0, null, Texture.BILINEAR_SAMPLINGMODE,
                                                           this._scene.getEngine(), false);

            this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("originalColor", this._originalColorPostProcess);
            };
        }

        private _createRandomTexture(): void {
            var size = 512;

            this._randomTexture = new DynamicTexture("SSAORandomTexture", size, this._scene, false, Texture.BILINEAR_SAMPLINGMODE);
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            var context = this._randomTexture.getContext();

            var rand = (min, max) => {
                return Math.random() * (max - min) + min;
            }

            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    var randVector = Vector3.Zero();

                    randVector.x = Math.floor(rand(0.0, 1.0) * 255);
                    randVector.y = Math.floor(rand(0.0, 1.0) * 255);
                    randVector.z = Math.floor(rand(0.0, 1.0) * 255);

                    context.fillStyle = 'rgb(' + randVector.x + ', ' + randVector.y + ', ' + randVector.z + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }
            this._randomTexture.update(false);
        }
    }
}