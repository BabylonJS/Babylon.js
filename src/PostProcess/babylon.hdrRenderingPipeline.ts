module BABYLON {
    export class HDRRenderingPipeline extends PostProcessRenderPipeline implements IDisposable {

        /**
        * Public members
        */
        
        // Gaussian Blur
        /**
        * Gaussian blur coefficient
        * @type {number}
        */
        public gaussCoeff: number = 0.3;
        /**
        * Gaussian blur mean
        * @type {number}
        */
        public gaussMean: number = 1.0;
        /**
        * Gaussian blur standard deviation
        * @type {number}
        */
        public gaussStandDev: number = 0.8;
        /**
        * Gaussian blur multiplier. Multiplies the blur effect
        * @type {number}
        */
        public gaussMultiplier: number = 4.0;

        // HDR
        /**
        * Exposure, controls the overall intensity of the pipeline
        * @type {number}
        */
        public exposure: number = 1.0;
        /**
        * Minimum luminance that the post-process can output. Luminance is >= 0
        * @type {number}
        */
        public minimumLuminance: number = 1.0;
        /**
        * Maximum luminance that the post-process can output. Must be suprerior to minimumLuminance
        * @type {number}
        */
        public maximumLuminance: number = 1e20;
        /**
        * Increase rate for luminance: eye adaptation speed to dark
        * @type {number}
        */
        public luminanceIncreaserate: number = 0.5;
        /**
        * Decrease rate for luminance: eye adaptation speed to bright
        * @type {number}
        */
        public luminanceDecreaseRate: number = 0.5;

        // Bright pass
        /**
        * Minimum luminance needed to compute HDR
        * @type {number}
        */
        public brightThreshold: number = 0.8;

        /**
        * Private members
        */
        // Gaussian blur
        private _guassianBlurHPostProcess: PostProcess;
        private _guassianBlurVPostProcess: PostProcess;

        // Bright pass
        private _brightPassPostProcess: PostProcess;

        // Texture adder
        private _textureAdderPostProcess: PostProcess;

        // Down Sampling
        private _downSampleX4PostProcess: PostProcess;

        // Original Post-process
        private _originalPostProcess: PostProcess;

        // HDR
        private _hdrPostProcess: PostProcess;
        private _hdrCurrentLuminance: number;
        private _hdrOutputLuminance: number;

        // Luminance generator
        public static LUM_STEPS: number = 6;
        private _downSamplePostProcesses: Array<PostProcess>;

        // Global
        private _scene: Scene;
        private _needUpdate: boolean = true;

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

            this._scene = scene;

            // Bright pass
            this._createBrightPassPostProcess(scene, ratio);

            // Down sample X4
            this._createDownSampleX4PostProcess(scene, ratio);

            // Create gaussian blur post-processes
            this._createGaussianBlurPostProcess(scene, ratio);

            // Texture adder
            this._createTextureAdderPostProcess(scene, ratio);

            // Luminance generator
            this._createLuminanceGeneratorPostProcess(scene);

            // HDR
            this._createHDRPostProcess(scene, ratio);

            // Pass postprocess
            if (originalPostProcess === null) {
                this._originalPostProcess = new PassPostProcess("hdr", ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            } else {
                this._originalPostProcess = originalPostProcess;
            }

            // Configure pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess",() => { return this._originalPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBrightPass",() => { return this._brightPassPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4",() => { return this._downSampleX4PostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurH",() => { return this._guassianBlurHPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRGaussianBlurV",() => { return this._guassianBlurVPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder",() => { return this._textureAdderPostProcess; }, true));

            var addDownSamplerPostProcess = (id: number) => {
                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampler" + id,() => { return this._downSamplePostProcesses[id]; }, true));
            };
            for (var i = HDRRenderingPipeline.LUM_STEPS - 1; i >= 0; i--) {
                addDownSamplerPostProcess(i);
            }

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDR",() => { return this._hdrPostProcess; }, true));

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);

            if (cameras !== null) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
            }

            this.update();
        }

        /**
        * Tells the pipeline to update its post-processes
        */
        public update(): void {
            this._needUpdate = true;
        }

        /**
        * Returns the current calculated luminance
        */
        public getCurrentLuminance(): number {
            return this._hdrCurrentLuminance;
        }

        /**
        * Returns the currently drawn luminance
        */
        public getOutputLuminance(): number {
            return this._hdrOutputLuminance;
        }

        /**
        * Releases the rendering pipeline and its internal effects. Detaches pipeline from cameras
        */
        public dispose(): void {
            this._originalPostProcess = undefined;
            this._brightPassPostProcess = undefined;
            this._downSampleX4PostProcess = undefined;
            this._guassianBlurHPostProcess = undefined;
            this._guassianBlurVPostProcess = undefined;
            this._textureAdderPostProcess = undefined;
            for (var i = HDRRenderingPipeline.LUM_STEPS - 1; i >= 0; i--) {
                this._downSamplePostProcesses[i] = undefined;
            }
            this._hdrPostProcess = undefined;

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);
        }

        /**
        * Creates the HDR post-process and computes the luminance adaptation
        */
        private _createHDRPostProcess(scene: Scene, ratio: number): void {
            var hdrLastLuminance = 0.0;
            this._hdrOutputLuminance = -1.0;
            this._hdrCurrentLuminance = 1.0;
            this._hdrPostProcess = new PostProcess("hdr", "hdr", ["exposure", "avgLuminance"], ["otherSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define HDR");

            this._hdrPostProcess.onApply = (effect: Effect) => {
                if (this._hdrOutputLuminance < 0.0) {
                    this._hdrOutputLuminance = this._hdrCurrentLuminance;
                }
                else {
                    var dt = (hdrLastLuminance - (hdrLastLuminance + scene.getEngine().getDeltaTime())) / 1000.0;

                    if (this._hdrCurrentLuminance < this._hdrOutputLuminance + this.luminanceDecreaseRate * dt) {
                        this._hdrOutputLuminance += this.luminanceDecreaseRate * dt;
                    }
                    else if (this._hdrCurrentLuminance > this._hdrOutputLuminance - this.luminanceIncreaserate * dt) {
                        this._hdrOutputLuminance -= this.luminanceIncreaserate * dt;
                    }
                    else {
                        this._hdrOutputLuminance = this._hdrCurrentLuminance;
                    }
                }

                this._hdrOutputLuminance = Tools.Clamp(this._hdrOutputLuminance, this.minimumLuminance, this.maximumLuminance);
                hdrLastLuminance += scene.getEngine().getDeltaTime();

                effect.setTextureFromPostProcess("textureSampler", this._textureAdderPostProcess);
                effect.setTextureFromPostProcess("otherSampler", this._originalPostProcess);
                effect.setFloat("exposure", this.exposure);
                effect.setFloat("avgLuminance", this._hdrOutputLuminance);

                this._needUpdate = false;
            };

        }

        /**
        * Texture Adder post-process
        */
        private _createTextureAdderPostProcess(scene: Scene, ratio: number): void {
            this._textureAdderPostProcess = new PostProcess("hdr", "hdr", [], ["otherSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER");

            this._textureAdderPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this._originalPostProcess);
            };
        }

        /**
        * Down sample X4 post-process
        */
        private _createDownSampleX4PostProcess(scene: Scene, ratio: number): void {
            var downSampleX4Offsets = new Array<number>(32);
            this._downSampleX4PostProcess = new PostProcess("hdr", "hdr", ["dsOffsets"], [], ratio / 4, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4");

            this._downSampleX4PostProcess.onApply = (effect: Effect) => {
                if (this._needUpdate) {
                    var id = 0;
                    for (var i = -2; i < 2; i++) {
                        for (var j = -2; j < 2; j++) {
                            downSampleX4Offsets[id] = (i + 0.5) * (1.0 / this._downSampleX4PostProcess.width);
                            downSampleX4Offsets[id + 1] = (j + 0.5) * (1.0 / this._downSampleX4PostProcess.height);
                            id += 2;
                        }
                    }
                }

                effect.setArray2("dsOffsets", downSampleX4Offsets);
            };
        }

        /**
        * Bright pass post-process
        */
        private _createBrightPassPostProcess(scene: Scene, ratio: number): void {
            var brightOffsets = new Array<number>(8);

            var brightPassCallback = (effect: Effect) => {
                if (this._needUpdate) {
                    var sU = (1.0 / this._brightPassPostProcess.width);
                    var sV = (1.0 / this._brightPassPostProcess.height);

                    brightOffsets[0] = -0.5 * sU;
                    brightOffsets[1] = 0.5 * sV;
                    brightOffsets[2] = 0.5 * sU;
                    brightOffsets[3] = 0.5 * sV;
                    brightOffsets[4] = -0.5 * sU;
                    brightOffsets[5] = -0.5 * sV;
                    brightOffsets[6] = 0.5 * sU;
                    brightOffsets[7] = -0.5 * sV;
                }

                effect.setArray2("dsOffsets", brightOffsets);
                effect.setFloat("brightThreshold", this.brightThreshold);
            };

            this._brightPassPostProcess = new PostProcess("hdr", "hdr", ["dsOffsets", "brightThreshold"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS");
            this._brightPassPostProcess.onApply = brightPassCallback;
        }

        /**
        * Luminance generator. Creates the luminance post-process and down sample post-processes
        */
        private _createLuminanceGeneratorPostProcess(scene: Scene): void {
            var lumSteps: number = HDRRenderingPipeline.LUM_STEPS;
            var luminanceOffsets = new Array<number>(8);
            var downSampleOffsets = new Array<number>(18);
            var halfDestPixelSize: number;
            this._downSamplePostProcesses = new Array<PostProcess>(lumSteps);

            // Utils for luminance
            var luminanceUpdateSourceOffsets = (width: number, height: number) => {
                var sU = (1.0 / width);
                var sV = (1.0 / height);

                luminanceOffsets[0] = -0.5 * sU;
                luminanceOffsets[1] = 0.5 * sV;
                luminanceOffsets[2] = 0.5 * sU;
                luminanceOffsets[3] = 0.5 * sV;
                luminanceOffsets[4] = -0.5 * sU;
                luminanceOffsets[5] = -0.5 * sV;
                luminanceOffsets[6] = 0.5 * sU;
                luminanceOffsets[7] = -0.5 * sV;
            };

            var luminanceUpdateDestOffsets = (width: number, height: number) => {
                var id = 0;
                for (var x = -1; x < 2; x++) {
                    for (var y = -1; y < 2; y++) {
                        downSampleOffsets[id] = (x) / width;
                        downSampleOffsets[id + 1] = (y) / height;
                        id += 2;
                    }
                }
            };

            // Luminance callback
            var luminanceCallback = (effect: Effect) => {
                if (this._needUpdate) {
                    luminanceUpdateSourceOffsets(this._textureAdderPostProcess.width, this._textureAdderPostProcess.height);
                }

                effect.setTextureFromPostProcess("textureSampler", this._textureAdderPostProcess);
                effect.setArray2("lumOffsets", luminanceOffsets);
            }

            // Down sample callbacks
            var downSampleCallback = (indice: number) => {
                var i = indice;
                return (effect: Effect) => {
                    luminanceUpdateSourceOffsets(this._downSamplePostProcesses[i].width, this._downSamplePostProcesses[i].height);
                    luminanceUpdateDestOffsets(this._downSamplePostProcesses[i].width, this._downSamplePostProcesses[i].height);
                    halfDestPixelSize = 0.5 / this._downSamplePostProcesses[i].width;

                    effect.setTextureFromPostProcess("textureSampler", this._downSamplePostProcesses[i + 1]);
                    effect.setFloat("halfDestPixelSize", halfDestPixelSize);
                    effect.setArray2("dsOffsets", downSampleOffsets);
                }
            };

            var downSampleAfterRenderCallback = (effect: Effect) => {
                // Unpack result
                var pixel = scene.getEngine().readPixels(0, 0, 1, 1);
                var bit_shift = new Vector4(1.0 / (255.0 * 255.0 * 255.0), 1.0 / (255.0 * 255.0), 1.0 / 255.0, 1.0);
                this._hdrCurrentLuminance = (pixel[0] * bit_shift.x + pixel[1] * bit_shift.y + pixel[2] * bit_shift.z + pixel[3] * bit_shift.w) / 100.0;
            };

            // Create luminance post-process
            var ratio = { width: Math.pow(3, lumSteps - 1), height: Math.pow(3, lumSteps - 1) };
            this._downSamplePostProcesses[lumSteps - 1] = new PostProcess("hdr", "hdr", ["lumOffsets"], [], ratio, null, Texture.NEAREST_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE_GENERATOR", Engine.TEXTURETYPE_FLOAT);
            this._downSamplePostProcesses[lumSteps - 1].onApply = luminanceCallback;

            // Create down sample post-processes
            for (var i = lumSteps - 2; i >= 0; i--) {
                var length = Math.pow(3, i);
                ratio = { width: length, height: length };

                var defines = "#define DOWN_SAMPLE\n";
                if (i === 0) {
                    defines += "#define FINAL_DOWN_SAMPLE\n"; // To pack the result
                }

                this._downSamplePostProcesses[i] = new PostProcess("hdr", "hdr", ["dsOffsets", "halfDestPixelSize"], [], ratio, null, Texture.NEAREST_SAMPLINGMODE, scene.getEngine(), false, defines, Engine.TEXTURETYPE_FLOAT);
                this._downSamplePostProcesses[i].onApply = downSampleCallback(i);

                if (i === 0) {
                    this._downSamplePostProcesses[i].onAfterRender = downSampleAfterRenderCallback;
                }
            }
        }

        /**
        * Gaussian blur post-processes. Horizontal and Vertical
        */
        private _createGaussianBlurPostProcess(scene: Scene, ratio: number): void {
            var blurOffsetsW = new Array<number>(9);
            var blurOffsetsH = new Array<number>(9);
            var blurWeights = new Array<number>(9);
            var uniforms: string[] = ["blurOffsets", "blurWeights", "multiplier"];

            // Utils for gaussian blur
            var calculateBlurOffsets = (height: boolean) => {
                var lastOutputDimensions: any = {
                    width: scene.getEngine().getRenderWidth(),
                    height: scene.getEngine().getRenderHeight()
                };

                for (var i = 0; i < 9; i++) {
                    var value = (i - 4.0) * (1.0 / (height === true ? lastOutputDimensions.height : lastOutputDimensions.width));
                    if (height) {
                        blurOffsetsH[i] = value;
                    } else {
                        blurOffsetsW[i] = value;
                    }
                }
            };

            var calculateWeights = () => {
                var x: number = 0.0;

                for (var i = 0; i < 9; i++) {
                    x = (i - 4.0) / 4.0;
                    blurWeights[i] = this.gaussCoeff * (1.0 / Math.sqrt(2.0 * Math.PI * this.gaussStandDev)) * Math.exp((-((x - this.gaussMean) * (x - this.gaussMean))) / (2.0 * this.gaussStandDev * this.gaussStandDev));
                }
            }

            // Callback
            var gaussianBlurCallback = (height: boolean) => {
                return (effect: Effect) => {
                    if (this._needUpdate) {
                        calculateWeights();
                        calculateBlurOffsets(height);
                    }
                    effect.setArray("blurOffsets", height ? blurOffsetsH : blurOffsetsW);
                    effect.setArray("blurWeights", blurWeights);
                    effect.setFloat("multiplier", this.gaussMultiplier);
                };
            };

            // Create horizontal gaussian blur post-processes
            this._guassianBlurHPostProcess = new PostProcess("hdr", "hdr", uniforms, [], ratio / 4, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_H");
            this._guassianBlurHPostProcess.onApply = gaussianBlurCallback(false);

            // Create vertical gaussian blur post-process
            this._guassianBlurVPostProcess = new PostProcess("hdr", "hdr", uniforms, [], ratio / 4, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define GAUSSIAN_BLUR_V");
            this._guassianBlurVPostProcess.onApply = gaussianBlurCallback(true);
        }
    }
}