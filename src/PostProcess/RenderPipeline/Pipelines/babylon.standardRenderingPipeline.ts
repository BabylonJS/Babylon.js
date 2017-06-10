/// <reference path="RenderPipeline\babylon.postProcessRenderPipeline.ts" />

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

        public luminancePostProcess: PostProcess = null;
        public luminanceDownSamplePostProcesses: PostProcess[] = [];
        public hdrPostProcess: PostProcess = null;

        public textureAdderFinalPostProcess: PostProcess = null;
        public lensFlareFinalPostProcess: PostProcess = null;
        public hdrFinalPostProcess: PostProcess = null;

        public lensFlarePostProcess: PostProcess = null;
        public lensFlareComposePostProcess: PostProcess = null;

        public motionBlurPostProcess: PostProcess = null;

        public depthOfFieldPostProcess: PostProcess = null;

        // Values
        @serialize()
        public brightThreshold: number = 1.0;

        @serialize()
        public blurWidth: number = 2.0;
        @serialize()
        public horizontalBlur: boolean = false;
        @serialize()
        public gaussianCoefficient: number = 0.25;
        @serialize()
        public gaussianMean: number = 1.0;
        @serialize()
        public gaussianStandardDeviation: number = 1.0;

        @serialize()
        public exposure: number = 1.0;
        @serializeAsTexture("lensTexture")
        public lensTexture: Texture = null;

        @serialize()
        public hdrMinimumLuminance: number = 1.0;
        @serialize()
        public hdrDecreaseRate: number = 0.5;
        @serialize()
        public hdrIncreaseRate: number = 0.5;

        @serializeAsTexture("lensColorTexture")
        public lensColorTexture: Texture = null;
        @serialize()
        public lensFlareStrength: number = 20.0;
        @serialize()
        public lensFlareGhostDispersal: number = 1.4;
        @serialize()
        public lensFlareHaloWidth: number = 0.7;
        @serialize()
        public lensFlareDistortionStrength: number = 16.0;
        @serializeAsTexture("lensStarTexture")
        public lensStarTexture: Texture = null;
        @serializeAsTexture("lensFlareDirtTexture")
        public lensFlareDirtTexture: Texture = null;

        @serialize()
        public depthOfFieldDistance: number = 10.0;

        @serialize()
        public depthOfFieldBlurWidth: number = 2.0;

        @serialize()
        public motionStrength: number = 1.0;

        // IAnimatable
        public animations: Animation[] = [];

        /**
        * Private members
        */
        private _scene: Scene;
        private _depthRenderer: DepthRenderer = null;
        private _currentDepthOfFieldSource: PostProcess = null;

        private _currentHDRSource: PostProcess = null;
        private _hdrCurrentLuminance: number = 1.0;

        private _motionBlurSamples: number = 64;

        // Getters and setters
        private _depthOfFieldEnabled: boolean = true;
        private _lensFlareEnabled: boolean = true;
        private _hdrEnabled: boolean = true;
        private _motionBlurEnabled: boolean = true;

        public set DepthOfFieldEnabled(enabled: boolean) {
            var blurIndex = this.gaussianBlurHPostProcesses.length - 1;

            if (enabled && !this._depthOfFieldEnabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRDepthOfField", this._scene.cameras);
                this._depthRenderer = this._scene.enableDepthRenderer();
            }
            else if (!enabled && this._depthOfFieldEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRDepthOfField", this._cameras);
            }

            this._depthOfFieldEnabled = enabled;
        }

        @serialize()
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
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRPostLensFlareDepthOfFieldSource", this._scene.cameras);
            }
            else if (!enabled && this._lensFlareEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlare", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareShift", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurH" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRGaussianBlurV" + blurIndex, this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLensFlareCompose", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRPostLensFlareDepthOfFieldSource", this._scene.cameras);
            }

            this._lensFlareEnabled = enabled;
        }

        @serialize()
        public get LensFlareEnabled(): boolean {
            return this._lensFlareEnabled;
        }

        public set HDREnabled(enabled: boolean) {
            if (enabled && !this._hdrEnabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLuminance", this._scene.cameras);
                for (var i = 0; i < this.luminanceDownSamplePostProcesses.length; i++) {
                    this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRLuminanceDownSample" + i, this._scene.cameras);
                }
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDR", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRPostHDReDepthOfFieldSource", this._scene.cameras);
            }
            else if (!enabled && this._hdrEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLuminance", this._scene.cameras);
                for (var i = 0; i < this.luminanceDownSamplePostProcesses.length; i++) {
                    this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRLuminanceDownSample" + i, this._scene.cameras);
                }
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDR", this._scene.cameras);
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRPostHDReDepthOfFieldSource", this._scene.cameras);
            }

            this._hdrEnabled = enabled;
        }

        @serialize()
        public get HDREnabled(): boolean {
            return this._hdrEnabled;
        }

        public set MotionBlurEnabled(enabled: boolean) {
            if (enabled && !this._motionBlurEnabled) {
                this._scene.postProcessRenderPipelineManager.enableEffectInPipeline(this._name, "HDRMotionBlur", this._scene.cameras);
                this._depthRenderer = this._scene.enableDepthRenderer();
            }
            else if (!enabled && this._motionBlurEnabled) {
                this._scene.postProcessRenderPipelineManager.disableEffectInPipeline(this._name, "HDRMotionBlur", this._scene.cameras);
            }

            this._motionBlurEnabled = enabled;
        }

        @serialize()
        public get MotionBlurEnabled(): boolean {
            return this._motionBlurEnabled;
        }

        @serialize()
        public get motionBlurSamples(): number {
            return this._motionBlurSamples;
        }

        public set motionBlurSamples(samples: number) {
            this.motionBlurPostProcess.updateEffect("#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + samples.toFixed(1));
            this._motionBlurSamples = samples;
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
            this._cameras = cameras || [];

            // Initialize
            this._scene = scene;

            // Misc
            var floatTextureType = scene.getEngine().getCaps().textureFloatRender ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_HALF_FLOAT;

            // Create pass post-process
            if (!originalPostProcess) {
                this.originalPostProcess = new PostProcess("HDRPass", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", floatTextureType);
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
            this.textureAdderFinalPostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBaseDepthOfFieldSource", () => { return this.textureAdderFinalPostProcess; }, true));

            // Create lens flare post-process
            this._createLensFlarePostProcess(scene, ratio);

            // Create depth-of-field source post-process post lens-flare and disable it now
            this.lensFlareFinalPostProcess = new PostProcess("HDRPostLensFlareDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostLensFlareDepthOfFieldSource", () => { return this.lensFlareFinalPostProcess; }, true));

            // Create luminance
            this._createLuminancePostProcesses(scene, floatTextureType);

            // Create HDR
            this._createHdrPostProcess(scene, ratio);

            // Create depth-of-field source post-process post hdr and disable it now
            this.hdrFinalPostProcess = new PostProcess("HDRPostHDReDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostHDReDepthOfFieldSource", () => { return this.hdrFinalPostProcess; }, true));

            // Create gaussian blur used by depth-of-field
            this._createGaussianBlurPostProcesses(scene, ratio / 2, 5, "depthOfFieldBlurWidth");

            // Create depth-of-field post-process
            this._createDepthOfFieldPostProcess(scene, ratio);

            // Create motion blur post-process
            this._createMotionBlurPostProcess(scene, ratio);

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);

            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }

            // Deactivate
            this.LensFlareEnabled = false;
            this.DepthOfFieldEnabled = false;
            this.HDREnabled = false;
            this.MotionBlurEnabled = false;
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
        private _createGaussianBlurPostProcesses(scene: Scene, ratio: number, indice: number, blurWidthKey: string = "blurWidth"): void {
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

                    if (height) {
                        effect.setFloat("blurWidth", this.horizontalBlur ? 1.0 : this[blurWidthKey]);
                    }
                    else {
                        effect.setFloat("blurWidth", this[blurWidthKey]);
                    }
                };
            };

            // Create horizontal gaussian blur post-processes
            var gaussianBlurHPostProcess = new PostProcess("HDRGaussianBlurH_" + ratio + "_" + indice, "standard", uniforms, [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_H", Engine.TEXTURETYPE_UNSIGNED_INT);
            gaussianBlurHPostProcess.onApply = callback(false);

            // Create vertical gaussian blur post-process
            var gaussianBlurVPostProcess = new PostProcess("HDRGaussianBlurV_" + ratio + "_" + indice, "standard", uniforms, [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_V", Engine.TEXTURETYPE_UNSIGNED_INT);
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
            this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this.originalPostProcess);
                effect.setTexture("lensSampler", this.lensTexture);

                effect.setFloat("exposure", this.exposure);

                this._currentDepthOfFieldSource = this.textureAdderFinalPostProcess;
                this._currentHDRSource = this.textureAdderFinalPostProcess;
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => { return this.textureAdderPostProcess; }, true));
        }

        // Create luminance
        private _createLuminancePostProcesses(scene: Scene, textureType: number): void {
            // Create luminance
            var size = Math.pow(3, StandardRenderingPipeline.LuminanceSteps);
            this.luminancePostProcess = new PostProcess("HDRLuminance", "standard", ["lumOffsets"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE", textureType);

            var offsets: number[] = [];
            this.luminancePostProcess.onApply = (effect: Effect) => {
                var sU = (1.0 / this.luminancePostProcess.width);
                var sV = (1.0 / this.luminancePostProcess.height);

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
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminance", () => { return this.luminancePostProcess; }, true));

            // Create down sample luminance
            for (var i = StandardRenderingPipeline.LuminanceSteps - 1; i >= 0; i--) {
                var size = Math.pow(3, i);

                var defines = "#define LUMINANCE_DOWN_SAMPLE\n";
                if (i === 0) {
                    defines += "#define FINAL_DOWN_SAMPLER";
                }

                var postProcess = new PostProcess("HDRLuminanceDownSample" + i, "standard", ["dsOffsets", "halfDestPixelSize"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, defines, textureType);
                this.luminanceDownSamplePostProcesses.push(postProcess);
            }

            // Create callbacks and add effects
            var lastLuminance = this.luminancePostProcess;

            this.luminanceDownSamplePostProcesses.forEach((pp, index) => {
                var downSampleOffsets = new Array<number>(18);

                pp.onApply = (effect: Effect) => {
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

                    if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                        lastLuminance = this.luminancePostProcess;
                    } else {
                        lastLuminance = pp;
                    }
                };

                if (index === this.luminanceDownSamplePostProcesses.length - 1) {
                    pp.onAfterRender = (effect: Effect) => {
                        var pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                        var bit_shift = new Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                        this._hdrCurrentLuminance = (pixel[0] * bit_shift.x + pixel[1] * bit_shift.y + pixel[2] * bit_shift.z + pixel[3] * bit_shift.w) / 100.0;
                    };
                }

                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLuminanceDownSample" + index, () => { return pp; }, true));
            });
        }

        // Create HDR post-process
        private _createHdrPostProcess(scene: Scene, ratio: number): void {
            this.hdrPostProcess = new PostProcess("HDR", "standard", ["averageLuminance"], ["textureAdderSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define HDR", Engine.TEXTURETYPE_UNSIGNED_INT);

            var outputLiminance = 1;
            var time = 0;
            var lastTime = 0;

            this.hdrPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("textureAdderSampler", this._currentHDRSource);

                time += scene.getEngine().getDeltaTime();

                if (outputLiminance < 0) {
                    outputLiminance = this._hdrCurrentLuminance;
                } else {
                    var dt = (lastTime - time) / 1000.0;

                    if (this._hdrCurrentLuminance < outputLiminance + this.hdrDecreaseRate * dt) {
                        outputLiminance += this.hdrDecreaseRate * dt;
                    }
                    else if (this._hdrCurrentLuminance > outputLiminance - this.hdrIncreaseRate * dt) {
                        outputLiminance -= this.hdrIncreaseRate * dt;
                    }
                    else {
                        outputLiminance = this._hdrCurrentLuminance;
                    }
                }

                outputLiminance = MathTools.Clamp(outputLiminance, this.hdrMinimumLuminance, 1e20);

                effect.setFloat("averageLuminance", outputLiminance);

                lastTime = time;

                this._currentDepthOfFieldSource = this.hdrFinalPostProcess;
            };

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDR", () => { return this.hdrPostProcess; }, true));
        }

        // Create lens flare post-process
        private _createLensFlarePostProcess(scene: Scene, ratio: number): void {
            this.lensFlarePostProcess = new PostProcess("HDRLensFlare", "standard", ["strength", "ghostDispersal", "haloWidth", "resolution", "distortionStrength"], ["lensColorSampler"], ratio / 2, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlare", () => { return this.lensFlarePostProcess; }, true));

            this._createGaussianBlurPostProcesses(scene, ratio / 4, 4);

            this.lensFlareComposePostProcess = new PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", () => { return this.lensFlareComposePostProcess; }, true));

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

                this._currentDepthOfFieldSource = this.lensFlareFinalPostProcess;
                this._currentHDRSource = this.lensFlareFinalPostProcess;
            };
        }

        // Create depth-of-field post-process
        private _createDepthOfFieldPostProcess(scene: Scene, ratio: number): void {
            this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this._currentDepthOfFieldSource);
                effect.setTexture("depthSampler", this._depthRenderer.getDepthMap());

                effect.setFloat("distance", this.depthOfFieldDistance);
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDepthOfField", () => { return this.depthOfFieldPostProcess; }, true));
        }

        // Create motion blur post-process
        private _createMotionBlurPostProcess(scene: Scene, ratio: number): void {
            this.motionBlurPostProcess = new PostProcess("HDRMotionBlur", "standard",
                ["inverseViewProjection", "prevViewProjection", "screenSize", "motionScale", "motionStrength"],
                ["depthSampler"],
                ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + this.motionBlurSamples.toFixed(1), Engine.TEXTURETYPE_UNSIGNED_INT);

            var motionScale: number = 0;
            var prevViewProjection = Matrix.Identity();
            var invViewProjection = Matrix.Identity();
            var viewProjection = Matrix.Identity();
            var screenSize = Vector2.Zero();

            this.motionBlurPostProcess.onApply = (effect: Effect) => {
                viewProjection = scene.getProjectionMatrix().multiply(scene.getViewMatrix());

                viewProjection.invertToRef(invViewProjection);
                effect.setMatrix("inverseViewProjection", invViewProjection);

                effect.setMatrix("prevViewProjection", prevViewProjection);
                prevViewProjection = viewProjection;

                screenSize.x = this.motionBlurPostProcess.width;
                screenSize.y = this.motionBlurPostProcess.height;
                effect.setVector2("screenSize", screenSize);

                motionScale = scene.getEngine().getFps() / 60.0;
                effect.setFloat("motionScale", motionScale);
                effect.setFloat("motionStrength", this.motionStrength);

                effect.setTexture("depthSampler", this._depthRenderer.getDepthMap());
            };

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRMotionBlur", () => { return this.motionBlurPostProcess; }, true));
        }

        // Dispose
        public dispose(): void {
            for (var i = 0; i < this._cameras.length; i++) {
                var camera = this._cameras[i];

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
                this.motionBlurPostProcess.dispose(camera);
            }

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

            super.dispose();
        }

        // Serialize rendering pipeline
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "StandardRenderingPipeline";

            return serializationObject;
        }

        // Parse serialized pipeline
        public static Parse(source: any, scene: Scene, rootUrl: string): StandardRenderingPipeline {
            return SerializationHelper.Parse(() => new StandardRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
        }

        // Luminance steps
        public static LuminanceSteps: number = 6;
    }
}
