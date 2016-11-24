module BABYLON {
    export class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        /**
        * Public members
        */
        // Post-processes
        public originalPostProcess: PostProcess;
        public downSampleX4PostProcess: PostProcess = null;
        public brightPassPostProcess: PostProcess = null;
        public gaussianBlurHPostProcesses: PostProcess[] = [];
        public gaussianBlurVPostProcesses: PostProcess[] = [];
        public textureAdderPostProcess: PostProcess = null;

        public textureAdderFinalPostProcess: PostProcess = null;

        public lensFlarePostProcess: PostProcess = null;
        public lensFlareComposePostProcess: PostProcess = null;

        public depthOfFieldPostProcess: PostProcess = null;

        // Values
        public brightThreshold: number = 1.0;

        public blurWidth: number = 2.0;
        public gaussianCoefficient: number = 0.25;
        public gaussianMean: number = 1.0;
        public gaussianStandardDeviation: number = 1.0;

        public exposure: number = 1.0;
        public lensTexture: Texture = null;

        public lensColorTexture: Texture = null;
        public lensFlareStrength: number = 20.0;
        public lensFlareGhostDispersal: number = 1.4;
        public lensFlareHaloWidth: number = 0.7;
        public lensFlareDistortionStrength: number = 16.0;
        public lensStarTexture: Texture = null;
        public lensFlareDirtTexture: Texture = null;

        public depthOfFieldDistance: number = 10.0;

        // IAnimatable
        public animations: Animation[] = [];

        /**
        * Private members
        */
        private _scene: Scene;

        private _depthRenderer: DepthRenderer = null;

        // Getters and setters
        private _depthOfFieldEnabled: boolean = true;
        private _lensFlareEnabled: boolean = true;

        public set DepthOfFieldEnabled(enabled: boolean) {
            var blurIndex = this.gaussianBlurHPostProcesses.length - 1;

            if (enabled && !this._depthOfFieldEnabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                this._depthRenderer = this._scene.enableDepthRenderer();
            }
            else if (!enabled && this._depthOfFieldEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
            }

            this._depthOfFieldEnabled = enabled;
        }

        public get DepthOfFieldEnabled(): boolean {
            return this._depthOfFieldEnabled;
        }

        public set LensFlareEnabled(enabled: boolean) {
            var blurIndex = this.gaussianBlurHPostProcesses.length - 2;

            if (enabled && !this._lensFlareEnabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlare", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlareShift", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLensFlareCompose", this._scene.cameras);
            }
            else if (!enabled && this._lensFlareEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlare", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareShift", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareCompose", this._scene.cameras);
            }

            this._lensFlareEnabled = enabled;
        }

        public get LensFlareEnabled(): boolean {
            return this._lensFlareEnabled;
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
            this.textureAdderFinalPostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfFieldSource", () => { return this.textureAdderFinalPostProcess; }, true));

            // Create lens flare post-process
            this._createLensFlarePostProcess(scene, ratio);

            // Create gaussian blur used by depth-of-field
            this._createGaussianBlurPostProcesses(scene, ratio / 2, 5);

            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);

            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }

            // Deactivate
            this.LensFlareEnabled = false;
            this.DepthOfFieldEnabled = false;
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
            var uniforms: string[] = ["blurOffsets", "blurWeights", "blurWidth"];

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
                    effect.setFloat("blurWidth", this.blurWidth);
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

            this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.originalPostProcess);
                effect.setTexture("lensSampler", this.lensTexture);

                effect.setFloat("exposure", this.exposure);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => { return this.textureAdderPostProcess; }, true));
        }

        // Create lens flare post-process
        private _createLensFlarePostProcess(scene: Scene, ratio: number): void {
            this.lensFlarePostProcess = new PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, "#define LENS_FLARE", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", () => { return this.lensFlarePostProcess; }, false));

            this._createGaussianBlurPostProcesses(scene, ratio / 4, 4);

            this.lensFlareComposePostProcess = new PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", () => { return this.lensFlareComposePostProcess; }, false));

            var resolution = new Vector2(0, 0);

            // Lens flare
            this.lensFlarePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("textureSampler", this.gaussianBlurHPostProcesses[0]);
                effect.setTexture("lensColorSampler", this.lensColorTexture);
                effect.setFloat("strength", this.lensFlareStrength);
                effect.setFloat("ghostDispersal", this.lensFlareGhostDispersal);
                effect.setFloat("haloWidth", this.lensFlareHaloWidth);

                // Shift
                resolution.x = this.lensFlarePostProcess.width;
                resolution.y = this.lensFlarePostProcess.height;
                effect.setVector2("resolution", resolution);

                effect.setFloat("distortionStrength", this.lensFlareDistortionStrength);
            };

            // Compose
            var scaleBias1 = Matrix.FromValues(
                2.0, 0.0, -1.0, 0.0,
                0.0, 2.0, -1.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );

            var scaleBias2 = Matrix.FromValues(
                0.5, 0.0, 0.5, 0.0,
                0.0, 0.5, 0.5, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0
            );

            this.lensFlareComposePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.textureAdderFinalPostProcess);
                effect.setTexture("lensDirtSampler", this.lensFlareDirtTexture);
                effect.setTexture("lensStarSampler", this.lensStarTexture);

                // Lens start rotation matrix
                var camerax = this._scene.activeCamera.getViewMatrix().getRow(0);
                var cameraz = this._scene.activeCamera.getViewMatrix().getRow(2);
                var camRot = Vector3.Dot(camerax.toVector3(), new Vector3(1.0, 0.0, 0.0)) + Vector3.Dot(cameraz.toVector3(), new Vector3(0.0, 0.0, 1.0));
                camRot *= 4.0;

                var starRotation = Matrix.FromValues(
                    Math.cos(camRot) * 0.5, -Math.sin(camRot), 0.0, 0.0,
                    Math.sin(camRot), Math.cos(camRot) * 0.5, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );

                var lensStarMatrix = scaleBias2.multiply(starRotation).multiply(scaleBias1);

                effect.setMatrix("lensStarMatrix", lensStarMatrix);
            };
        }

        // Create depth-of-field post-process
        private _createDepthOfFieldPostProcess(scene: Scene, ratio: number): void {
            this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.textureAdderFinalPostProcess);
                effect.setTexture("depthSampler", this._depthRenderer.getDepthMap());

                effect.setFloat("distance", this.depthOfFieldDistance);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", () => { return this.depthOfFieldPostProcess; }, true));
        }

        // Dispose
        public dispose(): void {
            for (var i = 0; i < this._scene.cameras.length; i++) {
                var camera = this._scene.cameras[i];

                this.originalPostProcess.dispose(camera);
                this.downSampleX4PostProcess.dispose(camera);
                this.brightPassPostProcess.dispose(camera);
                this.textureAdderPostProcess.dispose(camera);

                for (var j = 0; j < this.gaussianBlurHPostProcesses.length; j++) {
                    this.gaussianBlurHPostProcesses[j].dispose(camera);
                }

                for (var j = 0; j < this.gaussianBlurVPostProcesses.length; j++) {
                    this.gaussianBlurVPostProcesses[j].dispose(camera);
                }

                this.textureAdderFinalPostProcess.dispose(camera);
                this.lensFlarePostProcess.dispose(camera);
                this.lensFlareComposePostProcess.dispose(camera);
                this.depthOfFieldPostProcess.dispose(camera);
            }

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

            super.dispose();
        }
    }
}
