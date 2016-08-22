module BABYLON {
    export class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable {
        // Public members
        public originalPostProcess: PostProcess;
        public downSampleX4PostProcess: PostProcess = null;
        public brightPassPostProcess: PostProcess = null;
        public gaussianBlurHPostProcesses: PostProcess[] = [];
        public gaussianBlurVPostProcesses: PostProcess[] = [];
        public textureAdderPostProcess: PostProcess = null;
        public depthOfFieldSourcePostProcess: PostProcess = null;
        public depthOfFieldPostProcess: PostProcess = null;

        public brightThreshold: number = 1.0;
        
        public gaussianCoefficient: number = 0.25;
        public gaussianMean: number = 1.0;
        public gaussianStandardDeviation: number = 1.0;

        public exposure: number = 1.0;
        public lensTexture: Texture = null;

        public depthOfFieldDistance: number = 10.0;

        // Private members
        private _scene: Scene;
        
        private _depthRenderer: DepthRenderer = null;

        // Getters and setters
        private _blurEnabled: boolean = true;
        private _depthOfFieldEnabled: boolean = false;

        public set BlurEnabled(enabled: boolean) {
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
        }

        public get BlurEnabled(): boolean {
            return this._blurEnabled;
        }

        public set DepthOfFieldEnabled(enabled: boolean) {
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
        }

        public get DepthOfFieldEnabled(): boolean {
            return this._depthOfFieldEnabled;
        }

        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.PostProcess} originalPostProcess - the custom original color post-process. Must be "reusable". Can be null.
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: number, originalPostProcess: PostProcess = null, cameras?: Camera[]) {
            super(scene.getEngine(), name);

            // Initialize
            this._scene = scene;

            // Create pass post-processe
            if (!originalPostProcess) {
                this.originalPostProcess = new PostProcess("HDRPass", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_FLOAT);
            }
            else {
                this.originalPostProcess = originalPostProcess;
            }

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", () => { return this.originalPostProcess; }, true));

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
            this.depthOfFieldSourcePostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfFieldSource", () => { return this.depthOfFieldSourcePostProcess; }, true));

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

        // Down Sample X4 Post-Processs
        private _createDownSampleX4PostProcess(scene: Scene, ratio: number): void {
            var downSampleX4Offsets = new Array<number>(32);
            this.downSampleX4PostProcess = new PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", Engine.TEXTURETYPE_UNSIGNED_INT);

            this.downSampleX4PostProcess.onApply = (effect: Effect) => {
                var id = 0;
                for (var i = -2; i < 2; i++) {
                    for (var j = -2; j < 2; j++) {
                        downSampleX4Offsets[id] = (i + 0.5) * (1.0 / this.downSampleX4PostProcess.width);
                        downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / this.downSampleX4PostProcess.height);
                        id += 2;
                    }
                }

                effect.setArray2("dsOffsets", downSampleX4Offsets);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", () => { return this.downSampleX4PostProcess; }, true));
        }

        // Brightpass Post-Process
        private _createBrightPassPostProcess(scene: Scene, ratio: number): void {
            var brightOffsets = new Array<number>(8);
            this.brightPassPostProcess = new PostProcess("HDRBrightPass", "standard", ["dsOffsets", "brightThreshold"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS", Engine.TEXTURETYPE_UNSIGNED_INT);

            this.brightPassPostProcess.onApply = (effect: Effect) => {
                var sU = (1.0 / this.brightPassPostProcess.width);
                var sV = (1.0 / this.brightPassPostProcess.height);

                brightOffsets[0] = -0.5 * sU;
                brightOffsets[1] = 0.5 * sV;
                brightOffsets[2] = 0.5 * sU;
                brightOffsets[3] = 0.5 * sV;
                brightOffsets[4] = -0.5 * sU;
                brightOffsets[5] = -0.5 * sV;
                brightOffsets[6] = 0.5 * sU;
                brightOffsets[7] = -0.5 * sV;
                
                effect.setArray2("dsOffsets", brightOffsets);
                effect.setFloat("brightThreshold", this.brightThreshold);
            }

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass", () => { return this.brightPassPostProcess; }, true));
        }

        // Create gaussian blur H&V post-processes
        private _createGaussianBlurPostProcesses(scene: Scene, ratio: number, indice: number): void {
            var blurOffsets = new Array<number>(9);
            var blurWeights = new Array<number>(9);
            var uniforms: string[] = ["blurOffsets", "blurWeights"];

            var callback = (height: boolean) => {
                return (effect: Effect) => {
                    // Weights
                    var x: number = 0.0;

                    for (var i = 0; i < 9; i++) {
                        x = (i - 4.0) / 4.0;
                        blurWeights[i] =
                            this.gaussianCoefficient
                            * (1.0 / Math.sqrt(2.0 * Math.PI * this.gaussianStandardDeviation))
                            * Math.exp((-((x - this.gaussianMean) * (x - this.gaussianMean))) / (2.0 * this.gaussianStandardDeviation * this.gaussianStandardDeviation));
                    }
                    
                    var lastOutputDimensions: any = {
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
            var gaussianBlurHPostProcess = new PostProcess("HDRGaussianBlurH" + ratio, "standard", uniforms, [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_H", Engine.TEXTURETYPE_UNSIGNED_INT);
            gaussianBlurHPostProcess.onApply = callback(false);

            // Create vertical gaussian blur post-process
            var gaussianBlurVPostProcess = new PostProcess("HDRGaussianBlurV" + ratio, "standard", uniforms, [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_V", Engine.TEXTURETYPE_UNSIGNED_INT);
            gaussianBlurVPostProcess.onApply = callback(true);

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurH" + indice, () => { return gaussianBlurHPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurV" + indice, () => { return gaussianBlurVPostProcess; }, true));

            // Finish
            this.gaussianBlurHPostProcesses.push(gaussianBlurHPostProcess);
            this.gaussianBlurVPostProcesses.push(gaussianBlurVPostProcess);
        }

        // Create texture adder post-process
        private _createTextureAdderPostProcess(scene: Scene, ratio: number): void {
            var lastGaussianBlurPostProcess = this.gaussianBlurVPostProcesses[3];

            this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define TEXTURE_ADDER", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.originalPostProcess);
                effect.setTexture("lensSampler", this.lensTexture);

                effect.setFloat("exposure", this.exposure);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => { return this.textureAdderPostProcess; }, true));
        }

        // Create depth-of-field post-process
        private _createDepthOfFieldPostProcess(scene: Scene, ratio: number): void {
            this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.depthOfFieldSourcePostProcess);
                effect.setTexture("depthSampler", this._depthRenderer.getDepthMap());

                effect.setFloat("distance", this.depthOfFieldDistance);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", () => { return this.depthOfFieldPostProcess; }, true));
        }
    }
}
