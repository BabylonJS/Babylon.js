module BABYLON {
    export class StandardRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        /**
        * Public members
        */
        // Post-processes
        public originalPostProcess: Nullable<PostProcess>;
        public downSampleX4PostProcess: Nullable<PostProcess> = null;
        public brightPassPostProcess: Nullable<PostProcess> = null;
        public blurHPostProcesses: PostProcess[] = [];
        public blurVPostProcesses: PostProcess[] = [];
        public textureAdderPostProcess: Nullable<PostProcess> = null;

        public volumetricLightPostProcess: Nullable<PostProcess> = null;
        public volumetricLightSmoothXPostProcess: Nullable<BlurPostProcess> = null;
        public volumetricLightSmoothYPostProcess: Nullable<BlurPostProcess> = null;
        public volumetricLightMergePostProces: Nullable<PostProcess> = null;
        public volumetricLightFinalPostProcess: Nullable<PostProcess> = null;

        public luminancePostProcess: Nullable<PostProcess> = null;
        public luminanceDownSamplePostProcesses: PostProcess[] = [];
        public hdrPostProcess: Nullable<PostProcess> = null;

        public textureAdderFinalPostProcess: Nullable<PostProcess> = null;
        public lensFlareFinalPostProcess: Nullable<PostProcess> = null;
        public hdrFinalPostProcess: Nullable<PostProcess> = null;

        public lensFlarePostProcess: Nullable<PostProcess> = null;
        public lensFlareComposePostProcess: Nullable<PostProcess> = null;

        public motionBlurPostProcess: Nullable<PostProcess> = null;

        public depthOfFieldPostProcess: Nullable<PostProcess> = null;

        // Values
        @serialize()
        public brightThreshold: number = 1.0;

        @serialize()
        public blurWidth: number = 512.0;
        @serialize()
        public horizontalBlur: boolean = false;

        @serialize()
        public exposure: number = 1.0;
        @serializeAsTexture("lensTexture")
        public lensTexture: Nullable<Texture> = null;

        @serialize()
        public volumetricLightCoefficient: number = 0.2;
        @serialize()
        public volumetricLightPower: number = 4.0;
        @serialize()
        public volumetricLightBlurScale: number = 64.0;

        public sourceLight: Nullable<SpotLight | DirectionalLight> = null;

        @serialize()
        public hdrMinimumLuminance: number = 1.0;
        @serialize()
        public hdrDecreaseRate: number = 0.5;
        @serialize()
        public hdrIncreaseRate: number = 0.5;

        @serializeAsTexture("lensColorTexture")
        public lensColorTexture: Nullable<Texture> = null;
        @serialize()
        public lensFlareStrength: number = 20.0;
        @serialize()
        public lensFlareGhostDispersal: number = 1.4;
        @serialize()
        public lensFlareHaloWidth: number = 0.7;
        @serialize()
        public lensFlareDistortionStrength: number = 16.0;
        @serializeAsTexture("lensStarTexture")
        public lensStarTexture: Nullable<Texture> = null;
        @serializeAsTexture("lensFlareDirtTexture")
        public lensFlareDirtTexture: Nullable<Texture> = null;

        @serialize()
        public depthOfFieldDistance: number = 10.0;

        @serialize()
        public depthOfFieldBlurWidth: number = 64.0;

        @serialize()
        public motionStrength: number = 1.0;

        // IAnimatable
        public animations: Animation[] = [];

        /**
        * Private members
        */
        private _scene: Scene;
        private _currentDepthOfFieldSource: Nullable<PostProcess> = null;
        private _basePostProcess: Nullable<PostProcess>;

        private _hdrCurrentLuminance: number = 1.0;

        private _floatTextureType: number;
        private _ratio: number;

        // Getters and setters
        private _bloomEnabled: boolean = true;
        private _depthOfFieldEnabled: boolean = false;
        private _vlsEnabled: boolean = false;
        private _lensFlareEnabled: boolean = false;
        private _hdrEnabled: boolean = false;
        private _motionBlurEnabled: boolean = false;

        private _motionBlurSamples: number = 64.0;
        private _volumetricLightStepsCount: number = 50.0;

        @serialize()
        public get BloomEnabled(): boolean {
            return this._bloomEnabled;
        }

        public set BloomEnabled(enabled: boolean) {
            if (this._bloomEnabled === enabled) {
                return;
            }

            this._bloomEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get DepthOfFieldEnabled(): boolean {
            return this._depthOfFieldEnabled;
        }

        public set DepthOfFieldEnabled(enabled: boolean) {
            if (this._depthOfFieldEnabled === enabled) {
                return;
            }

            this._depthOfFieldEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get LensFlareEnabled(): boolean {
            return this._lensFlareEnabled;
        }

        public set LensFlareEnabled(enabled: boolean) {
            if (this._lensFlareEnabled === enabled) {
                return;
            }

            this._lensFlareEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get HDREnabled(): boolean {
            return this._hdrEnabled;
        }

        public set HDREnabled(enabled: boolean) {
            if (this._hdrEnabled === enabled) {
                return;
            }

            this._hdrEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get VLSEnabled(): boolean {
            return this._vlsEnabled;
        }

        public set VLSEnabled(enabled) {
            if (this._vlsEnabled === enabled) {
                return;
            }

            if (enabled) {
                var geometry = this._scene.enableGeometryBufferRenderer();
                if (!geometry) {
                    Tools.Warn("Geometry renderer is not supported, cannot create volumetric lights in Standard Rendering Pipeline");
                    return;
                }
            }
        
            this._vlsEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get MotionBlurEnabled(): boolean {
            return this._motionBlurEnabled;
        }

        public set MotionBlurEnabled(enabled: boolean) {
            if (this._motionBlurEnabled === enabled) {
                return;
            }

            this._motionBlurEnabled = enabled;
            this._buildPipeline();
        }

        @serialize()
        public get volumetricLightStepsCount(): number {
            return this._volumetricLightStepsCount;
        }

        public set volumetricLightStepsCount(count: number) {
            if (this.volumetricLightPostProcess) {
                this.volumetricLightPostProcess.updateEffect("#define VLS\n#define NB_STEPS " + count.toFixed(1));
            }

            this._volumetricLightStepsCount = count;
        }

        @serialize()
        public get motionBlurSamples(): number {
            return this._motionBlurSamples;
        }

        public set motionBlurSamples(samples: number) {
            if (this.motionBlurPostProcess) {
                this.motionBlurPostProcess.updateEffect("#define MOTION_BLUR\n#define MAX_MOTION_SAMPLES " + samples.toFixed(1));
            }
            
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
        constructor(name: string, scene: Scene, ratio: number, originalPostProcess: Nullable<PostProcess> = null, cameras?: Camera[]) {
            super(scene.getEngine(), name);
            this._cameras = cameras || [];

            // Initialize
            this._scene = scene;
            this._basePostProcess = originalPostProcess;
            this._ratio = ratio;

            // Misc
            this._floatTextureType = scene.getEngine().getCaps().textureFloatRender ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_HALF_FLOAT;

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            this._buildPipeline();
        }

        private _buildPipeline(): void {
            var ratio = this._ratio;
            var scene = this._scene;

            this._disposePostProcesses();
            this._reset();

            // Create pass post-process
            if (!this._basePostProcess) {
                this.originalPostProcess = new PostProcess("HDRPass", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", this._floatTextureType);
                this.originalPostProcess.onApply = (effect: Effect) => {
                    this._currentDepthOfFieldSource = this.originalPostProcess;
                };
            }
            else {
                this.originalPostProcess = this._basePostProcess;
            }

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPassPostProcess", () => { return this.originalPostProcess; }, true));

            this._currentDepthOfFieldSource = this.originalPostProcess;

            if (this._vlsEnabled) {
                // Create volumetric light
                this._createVolumetricLightPostProcess(scene, ratio);
        
                // Create volumetric light final post-process
                this.volumetricLightFinalPostProcess = new PostProcess("HDRVLSFinal", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSFinal", () => { return this.volumetricLightFinalPostProcess; }, true));
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
                this.textureAdderFinalPostProcess = new PostProcess("HDRDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBaseDepthOfFieldSource", () => { return this.textureAdderFinalPostProcess; }, true));
            }

            if (this._lensFlareEnabled) {
                // Create lens flare post-process
                this._createLensFlarePostProcess(scene, ratio);

                // Create depth-of-field source post-process post lens-flare and disable it now
                this.lensFlareFinalPostProcess = new PostProcess("HDRPostLensFlareDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostLensFlareDepthOfFieldSource", () => { return this.lensFlareFinalPostProcess; }, true));
            }
        
            if (this._hdrEnabled) {
                // Create luminance
                this._createLuminancePostProcesses(scene, this._floatTextureType);

                // Create HDR
                this._createHdrPostProcess(scene, ratio);

                // Create depth-of-field source post-process post hdr and disable it now
                this.hdrFinalPostProcess = new PostProcess("HDRPostHDReDepthOfFieldSource", "standard", [], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define PASS_POST_PROCESS", Engine.TEXTURETYPE_UNSIGNED_INT);
                this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRPostHDReDepthOfFieldSource", () => { return this.hdrFinalPostProcess; }, true));
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
        }

        // Down Sample X4 Post-Processs
        private _createDownSampleX4PostProcess(scene: Scene, ratio: number): void {
            var downSampleX4Offsets = new Array<number>(32);
            this.downSampleX4PostProcess = new PostProcess("HDRDownSampleX4", "standard", ["dsOffsets"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DOWN_SAMPLE_X4", Engine.TEXTURETYPE_UNSIGNED_INT);

            this.downSampleX4PostProcess.onApply = (effect: Effect) => {
                var id = 0;
                let width = (<PostProcess>this.downSampleX4PostProcess).width;
                let height = (<PostProcess>this.downSampleX4PostProcess).height;


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
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRDownSampleX4", () => { return this.downSampleX4PostProcess; }, true));
        }

        // Brightpass Post-Process
        private _createBrightPassPostProcess(scene: Scene, ratio: number): void {
            var brightOffsets = new Array<number>(8);
            this.brightPassPostProcess = new PostProcess("HDRBrightPass", "standard", ["dsOffsets", "brightThreshold"], [], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define BRIGHT_PASS", Engine.TEXTURETYPE_UNSIGNED_INT);

            this.brightPassPostProcess.onApply = (effect: Effect) => {
                var sU = (1.0 / (<PostProcess>this.brightPassPostProcess).width);
                var sV = (1.0 / (<PostProcess>this.brightPassPostProcess).height);

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

        // Create blur H&V post-processes
        private _createBlurPostProcesses(scene: Scene, ratio: number, indice: number, blurWidthKey: string = "blurWidth"): void {
            var engine = scene.getEngine();

            var blurX = new BlurPostProcess("HDRBlurH" + "_" + indice, new Vector2(1, 0), (<any>this)[blurWidthKey], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, Engine.TEXTURETYPE_UNSIGNED_INT);
            var blurY = new BlurPostProcess("HDRBlurV" + "_" + indice, new Vector2(0, 1), (<any>this)[blurWidthKey], ratio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, Engine.TEXTURETYPE_UNSIGNED_INT);

            blurX.onActivateObservable.add(() => {
                let dw = blurX.width / engine.getRenderWidth();
                blurX.kernel = (<any>this)[blurWidthKey] * dw;
            });

            blurY.onActivateObservable.add(() => {
                let dw = blurY.height / engine.getRenderHeight();
                blurY.kernel = this.horizontalBlur ? 64 * dw : (<any>this)[blurWidthKey] * dw;
            });

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurH" + indice, () => { return blurX; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRBlurV" + indice, () => { return blurY; }, true));

            this.blurHPostProcesses.push(blurX);
            this.blurVPostProcesses.push(blurY);
        }

        // Create texture adder post-process
        private _createTextureAdderPostProcess(scene: Scene, ratio: number): void {
            this.textureAdderPostProcess = new PostProcess("HDRTextureAdder", "standard", ["exposure"], ["otherSampler", "lensSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define TEXTURE_ADDER", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.textureAdderPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this._vlsEnabled ? this._currentDepthOfFieldSource : this.originalPostProcess);
                effect.setTexture("lensSampler", this.lensTexture);

                effect.setFloat("exposure", this.exposure);

                this._currentDepthOfFieldSource = this.textureAdderFinalPostProcess;
            };

            // Add to pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRTextureAdder", () => { return this.textureAdderPostProcess; }, true));
        }

        private _createVolumetricLightPostProcess(scene: Scene, ratio: number): void {
            var geometryRenderer = <GeometryBufferRenderer>scene.enableGeometryBufferRenderer();
            geometryRenderer.enablePosition = true;

            var geometry = geometryRenderer.getGBuffer();

            // Base post-process
            this.volumetricLightPostProcess = new PostProcess("HDRVLS", "standard",
                ["shadowViewProjection", "cameraPosition", "sunDirection", "sunColor", "scatteringCoefficient", "scatteringPower", "depthValues"],
                ["shadowMapSampler", "positionSampler" ],
                ratio / 8,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                scene.getEngine(),
                false, "#define VLS\n#define NB_STEPS " + this._volumetricLightStepsCount.toFixed(1));

            var depthValues = Vector2.Zero();

            this.volumetricLightPostProcess.onApply = (effect: Effect) => {
                if (this.sourceLight && this.sourceLight.getShadowGenerator() && this._scene.activeCamera) {
                    var generator = <ShadowGenerator>this.sourceLight.getShadowGenerator();

                    effect.setTexture("shadowMapSampler", generator.getShadowMap());
                    effect.setTexture("positionSampler", geometry.textures[2]);

                    effect.setColor3("sunColor", this.sourceLight.diffuse);
                    effect.setVector3("sunDirection", this.sourceLight.getShadowDirection());
                    
                    effect.setVector3("cameraPosition", this._scene.activeCamera.globalPosition);
                    effect.setMatrix("shadowViewProjection", generator.getTransformMatrix());

                    effect.setFloat("scatteringCoefficient", this.volumetricLightCoefficient);
                    effect.setFloat("scatteringPower", this.volumetricLightPower);

                    depthValues.x = generator.getLight().getDepthMinZ(this._scene.activeCamera);
                    depthValues.y = generator.getLight().getDepthMaxZ(this._scene.activeCamera);
                    effect.setVector2("depthValues", depthValues);
                }
            };

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLS", () => { return this.volumetricLightPostProcess; }, true));

            // Smooth
            this._createBlurPostProcesses(scene, ratio / 4, 0, "volumetricLightBlurScale");

            // Merge
            this.volumetricLightMergePostProces = new PostProcess("HDRVLSMerge", "standard", [], ["originalSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define VLSMERGE");

            this.volumetricLightMergePostProces.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("originalSampler", this.originalPostProcess);

                this._currentDepthOfFieldSource = this.volumetricLightFinalPostProcess;
            };

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRVLSMerge", () => { return this.volumetricLightMergePostProces; }, true));
        }

        // Create luminance
        private _createLuminancePostProcesses(scene: Scene, textureType: number): void {
            // Create luminance
            var size = Math.pow(3, StandardRenderingPipeline.LuminanceSteps);
            this.luminancePostProcess = new PostProcess("HDRLuminance", "standard", ["lumOffsets"], [], { width: size, height: size }, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LUMINANCE", textureType);

            var offsets: number[] = [];
            this.luminancePostProcess.onApply = (effect: Effect) => {
                var sU = (1.0 / (<PostProcess>this.luminancePostProcess).width);
                var sV = (1.0 / (<PostProcess>this.luminancePostProcess).height);

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
            var lastLuminance: Nullable<PostProcess> = this.luminancePostProcess;

            this.luminanceDownSamplePostProcesses.forEach((pp, index) => {
                var downSampleOffsets = new Array<number>(18);

                pp.onApply = (effect: Effect) => {
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
                effect.setTextureFromPostProcess("textureAdderSampler", this._currentDepthOfFieldSource);

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

                outputLiminance = Scalar.Clamp(outputLiminance, this.hdrMinimumLuminance, 1e20);

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

            this._createBlurPostProcesses(scene, ratio / 4, 2);

            this.lensFlareComposePostProcess = new PostProcess("HDRLensFlareCompose", "standard", ["lensStarMatrix"], ["otherSampler", "lensDirtSampler", "lensStarSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define LENS_FLARE_COMPOSE", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRLensFlareCompose", () => { return this.lensFlareComposePostProcess; }, true));

            var resolution = new Vector2(0, 0);

            // Lens flare
            this.lensFlarePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("textureSampler", this._bloomEnabled ? this.blurHPostProcesses[0] : this.originalPostProcess);
                effect.setTexture("lensColorSampler", this.lensColorTexture);
                effect.setFloat("strength", this.lensFlareStrength);
                effect.setFloat("ghostDispersal", this.lensFlareGhostDispersal);
                effect.setFloat("haloWidth", this.lensFlareHaloWidth);

                // Shift
                resolution.x = (<PostProcess>this.lensFlarePostProcess).width;
                resolution.y = (<PostProcess>this.lensFlarePostProcess).height;
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
                if (!this._scene.activeCamera) {
                    return;
                }

                effect.setTextureFromPostProcess("otherSampler", this._currentDepthOfFieldSource);
                effect.setTexture("lensDirtSampler", this.lensFlareDirtTexture);
                effect.setTexture("lensStarSampler", this.lensStarTexture);

                // Lens start rotation matrix
                var camerax = (<Vector4>this._scene.activeCamera.getViewMatrix().getRow(0));
                var cameraz = (<Vector4>this._scene.activeCamera.getViewMatrix().getRow(2));
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
            };
        }

        // Create depth-of-field post-process
        private _createDepthOfFieldPostProcess(scene: Scene, ratio: number): void {
            this.depthOfFieldPostProcess = new PostProcess("HDRDepthOfField", "standard", ["distance"], ["otherSampler", "depthSampler"], ratio, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, "#define DEPTH_OF_FIELD", Engine.TEXTURETYPE_UNSIGNED_INT);
            this.depthOfFieldPostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("otherSampler", this._currentDepthOfFieldSource);
                effect.setTexture("depthSampler", this._getDepthTexture());

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

                screenSize.x = (<PostProcess>this.motionBlurPostProcess).width;
                screenSize.y = (<PostProcess>this.motionBlurPostProcess).height;
                effect.setVector2("screenSize", screenSize);

                motionScale = scene.getEngine().getFps() / 60.0;
                effect.setFloat("motionScale", motionScale);
                effect.setFloat("motionStrength", this.motionStrength);

                effect.setTexture("depthSampler", this._getDepthTexture());
            };

            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), "HDRMotionBlur", () => { return this.motionBlurPostProcess; }, true));
        }

        private _getDepthTexture(): Texture {
            if (this._scene.getEngine().getCaps().drawBuffersExtension) {
                let renderer = <GeometryBufferRenderer>this._scene.enableGeometryBufferRenderer();
                return renderer.getGBuffer().textures[0];
            }

            return this._scene.enableDepthRenderer().getDepthMap();
        }

        private _disposePostProcesses(): void {
            for (var i = 0; i < this._cameras.length; i++) {
                var camera = this._cameras[i];

                if (this.originalPostProcess) { this.originalPostProcess.dispose(camera); }

                if (this.downSampleX4PostProcess) { this.downSampleX4PostProcess.dispose(camera); }
                if (this.brightPassPostProcess) { this.brightPassPostProcess.dispose(camera); }
                if (this.textureAdderPostProcess) { this.textureAdderPostProcess.dispose(camera); }
                if (this.textureAdderFinalPostProcess) { this.textureAdderFinalPostProcess.dispose(camera); }
                
                if (this.volumetricLightPostProcess) { this.volumetricLightPostProcess.dispose(camera); }
                if (this.volumetricLightSmoothXPostProcess) { this.volumetricLightSmoothXPostProcess.dispose(camera); }
                if (this.volumetricLightSmoothYPostProcess) { this.volumetricLightSmoothYPostProcess.dispose(camera); }
                if (this.volumetricLightMergePostProces) { this.volumetricLightMergePostProces.dispose(camera); }
                if (this.volumetricLightFinalPostProcess) { this.volumetricLightFinalPostProcess.dispose(camera); }
            
                if (this.lensFlarePostProcess) { this.lensFlarePostProcess.dispose(camera); }
                if (this.lensFlareComposePostProcess) { this.lensFlareComposePostProcess.dispose(camera); }

                for (var j = 0; j < this.luminanceDownSamplePostProcesses.length; j++) {
                    this.luminanceDownSamplePostProcesses[j].dispose(camera);
                }

                if (this.luminancePostProcess) { this.luminancePostProcess.dispose(camera); }
                if (this.hdrPostProcess) { this.hdrPostProcess.dispose(camera); }
                if (this.hdrFinalPostProcess) { this.hdrFinalPostProcess.dispose(camera); }
            
                if (this.depthOfFieldPostProcess) { this.depthOfFieldPostProcess.dispose(camera); }

                if (this.motionBlurPostProcess) { this.motionBlurPostProcess.dispose(camera); }

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
        }

        // Dispose
        public dispose(): void {
            this._disposePostProcesses();

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);

            super.dispose();
        }

        // Serialize rendering pipeline
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "StandardRenderingPipeline";

            return serializationObject;
        }

        /**
         * Static members
         */

        // Parse serialized pipeline
        public static Parse(source: any, scene: Scene, rootUrl: string): StandardRenderingPipeline {
            return SerializationHelper.Parse(() => new StandardRenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
        }

        // Luminance steps
        public static LuminanceSteps: number = 6;
    }
}
