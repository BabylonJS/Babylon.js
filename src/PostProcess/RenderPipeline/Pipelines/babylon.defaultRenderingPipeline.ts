module BABYLON {
    export class DefaultRenderingPipeline extends PostProcessRenderPipeline implements IDisposable, IAnimatable {
        private _scene: Scene;     

        readonly PassPostProcessId: string = "PassPostProcessEffect";           
        readonly HighLightsPostProcessId: string = "HighLightsPostProcessEffect";  
        readonly BlurXPostProcessId: string = "BlurXPostProcessEffect";  
        readonly BlurYPostProcessId: string = "BlurYPostProcessEffect";  
        readonly CopyBackPostProcessId: string = "CopyBackPostProcessEffect";  
        readonly ImageProcessingPostProcessId: string = "ImageProcessingPostProcessEffect";  
        readonly FxaaPostProcessId: string = "FxaaPostProcessEffect";           
        readonly FinalMergePostProcessId: string = "FinalMergePostProcessEffect";

        // Post-processes
		public pass: BABYLON.PassPostProcess;
		public highlights: BABYLON.HighlightsPostProcess;
		public blurX: BABYLON.BlurPostProcess;
		public blurY: BABYLON.BlurPostProcess;
		public copyBack: BABYLON.PassPostProcess;
        public fxaa: FxaaPostProcess;
        public imageProcessing: ImageProcessingPostProcess;
		public finalMerge: BABYLON.PassPostProcess;        

        // IAnimatable
        public animations: Animation[] = [];        

        // Values       
        private _bloomEnabled: boolean = false;
        private _fxaaEnabled: boolean = false;
        private _imageProcessingEnabled: boolean = true;
        private _defaultPipelineTextureType: number;
        private _bloomScale: number = 0.6;

        private _buildAllowed = true;

        /**
		 * Specifies the size of the bloom blur kernel, relative to the final output size
		 */
        @serialize()
		public bloomKernel: number = 64;

        /**
		 * Specifies the weight of the bloom in the final rendering
		 */
        @serialize()
		private _bloomWeight: number = 0.15;        

        @serialize()
        private _hdr: boolean;

        public set bloomWeight(value: number) {
            if (this._bloomWeight === value) {
                return;
            }
            this._bloomWeight = value;

            if (this._hdr && this.copyBack) {
                this.copyBack.alphaConstants = new BABYLON.Color4(value, value, value, value);	
            }
        }   
        
        @serialize()
        public get bloomWeight(): number {
            return this._bloomWeight;
        }          

        public set bloomScale(value: number) {
            if (this._bloomScale === value) {
                return;
            }
            this._bloomScale = value;

            this._buildPipeline();
        }   
        
        @serialize()
        public get bloomScale(): number {
            return this._bloomScale;
        }          

        public set bloomEnabled(enabled: boolean) {
            if (this._bloomEnabled === enabled) {
                return;
            }
            this._bloomEnabled = enabled;

            this._buildPipeline();
        }   
        
        @serialize()
        public get bloomEnabled(): boolean {
            return this._bloomEnabled;
        }        

        public set fxaaEnabled(enabled: boolean) {
            if (this._fxaaEnabled === enabled) {
                return;
            }
            this._fxaaEnabled = enabled;

            this._buildPipeline();
        }

        @serialize()
        public get fxaaEnabled(): boolean {
            return this._fxaaEnabled;
        }

        public set imageProcessingEnabled(enabled: boolean) {
            if (this._imageProcessingEnabled === enabled) {
                return;
            }
            this._imageProcessingEnabled = enabled;

            this._buildPipeline();
        }

        @serialize()
        public get imageProcessingEnabled(): boolean {
            return this._imageProcessingEnabled;
        }        

        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         * @param {boolean} automaticBuild - if false, you will have to manually call prepare() to update the pipeline
         */
        constructor(name: string, hdr: boolean, scene: Scene, cameras?: Camera[], automaticBuild = true) {
            super(scene.getEngine(), name);
            this._cameras = cameras || [];

            this._buildAllowed = automaticBuild;

            // Initialize
            this._scene = scene;
            var caps = this._scene.getEngine().getCaps();
            this._hdr = hdr && (caps.textureHalfFloatRender || caps.textureFloatRender);

            // Misc
            if (this._hdr) {
                if (caps.textureHalfFloatRender) {
                    this._defaultPipelineTextureType  = Engine.TEXTURETYPE_HALF_FLOAT;
                }
                else if (caps.textureFloatRender) {
                    this._defaultPipelineTextureType  = Engine.TEXTURETYPE_FLOAT;
                }
            } else {
                this._defaultPipelineTextureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            }

            // Attach
            scene.postProcessRenderPipelineManager.addPipeline(this);

            this._buildPipeline();
        }

        /**
         * Force the compilation of the entire pipeline.
         */
        public prepare(): void {
            let previousState = this._buildAllowed;
            this._buildAllowed = true;
            this._buildPipeline();
            this._buildAllowed = previousState;
        }

        private _buildPipeline() {
            if (!this._buildAllowed) {
                return;
            }

            var engine = this._scene.getEngine();

            this._disposePostProcesses();
            this._reset();

			if (this.bloomEnabled) {
				this.pass = new BABYLON.PassPostProcess("sceneRenderTarget", 1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                this.addEffect(new PostProcessRenderEffect(engine, this.PassPostProcessId, () => { return this.pass; }, true));

				if (!this._hdr) { // Need to enhance highlights if not using float rendering
					this.highlights = new BABYLON.HighlightsPostProcess("highlights", this.bloomScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                    this.addEffect(new PostProcessRenderEffect(engine, this.HighLightsPostProcessId, () => { return this.highlights; }, true));
					this.highlights.autoClear = false;
					this.highlights.alwaysForcePOT = true;
				}

				this.blurX = new BABYLON.BlurPostProcess("horizontal blur", new BABYLON.Vector2(1.0, 0), 10.0, this.bloomScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                this.addEffect(new PostProcessRenderEffect(engine, this.BlurXPostProcessId, () => { return this.blurX; }, true));
				this.blurX.alwaysForcePOT = true;
				this.blurX.autoClear = false;
				this.blurX.onActivateObservable.add(() => {
					let dw = this.blurX.width / engine.getRenderingCanvas().width;
					this.blurX.kernel = this.bloomKernel * dw;
				});

				this.blurY = new BABYLON.BlurPostProcess("vertical blur", new BABYLON.Vector2(0, 1.0), 10.0, this.bloomScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                this.addEffect(new PostProcessRenderEffect(engine, this.BlurYPostProcessId, () => { return this.blurY; }, true));
				this.blurY.alwaysForcePOT = true;
				this.blurY.autoClear = false;
				this.blurY.onActivateObservable.add(() => {
					let dh = this.blurY.height / engine.getRenderingCanvas().height;
					this.blurY.kernel = this.bloomKernel * dh;
				});				

				this.copyBack = new BABYLON.PassPostProcess("bloomBlendBlit", this.bloomScale, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);			
                this.addEffect(new PostProcessRenderEffect(engine, this.CopyBackPostProcessId, () => { return this.copyBack; }, true));
				this.copyBack.alwaysForcePOT = true;
				if (this._hdr) {
					this.copyBack.alphaMode = BABYLON.Engine.ALPHA_INTERPOLATE;
					let w = this.bloomWeight;
					this.copyBack.alphaConstants = new BABYLON.Color4(w, w, w, w);			
				} else {
					this.copyBack.alphaMode = BABYLON.Engine.ALPHA_SCREENMODE;
				}
				this.copyBack.autoClear = false;
			}

            if (this._imageProcessingEnabled) {
                this.imageProcessing = new BABYLON.ImageProcessingPostProcess("imageProcessing",  1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                if (this._hdr) {
                    this.addEffect(new PostProcessRenderEffect(engine, this.ImageProcessingPostProcessId, () => { return this.imageProcessing; }, true));
                } else {
                    this._scene.imageProcessingConfiguration.applyByPostProcess = false;
                }
            } 

			if (this.fxaaEnabled) {
                this.fxaa = new FxaaPostProcess("fxaa", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                this.addEffect(new PostProcessRenderEffect(engine, this.FxaaPostProcessId, () => { return this.fxaa; }, true));  

				this.fxaa.autoClear = !this.bloomEnabled && (!this._hdr || !this.imageProcessing);
			} else {
				this.finalMerge = new BABYLON.PassPostProcess("finalMerge", 1.0, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, this._defaultPipelineTextureType);
                this.addEffect(new PostProcessRenderEffect(engine, this.FinalMergePostProcessId, () => { return this.finalMerge; }, true)); 
                
				this.finalMerge.autoClear = !this.bloomEnabled && (!this._hdr || !this.imageProcessing);
			}

			if (this.bloomEnabled) {
				if (this._hdr) { // Share render targets to save memory
					this.copyBack.shareOutputWith(this.blurX);	
                    if (this.imageProcessing) {	
					    this.imageProcessing.shareOutputWith(this.pass);			
					    this.imageProcessing.autoClear = false;
                    } else if (this.fxaa) {
						this.fxaa.shareOutputWith(this.pass);		
					} else {
						this.finalMerge.shareOutputWith(this.pass);	
					} 
				} else  {
					if (this.fxaa) {
						this.fxaa.shareOutputWith(this.pass);		
					} else {
						this.finalMerge.shareOutputWith(this.pass);	
					} 
				}
			}

            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
            }            
        }

        private _disposePostProcesses(): void {
            for (var i = 0; i < this._cameras.length; i++) {
                var camera = this._cameras[i];

                if (this.pass) {
                    this.pass.dispose(camera);
                }

                if (this.highlights) {
                    this.highlights.dispose(camera);
                }        

                if (this.blurX) {
                    this.blurX.dispose(camera);
                }      

                if (this.blurY) {
                    this.blurY.dispose(camera);
                }         

                if (this.copyBack) {
                    this.copyBack.dispose(camera);
                }   

                if (this.imageProcessing) {
                    this.imageProcessing.dispose(camera);
                }                                                                

                if (this.fxaa) {
                    this.fxaa.dispose(camera);
                }

                if (this.finalMerge) {
                    this.finalMerge.dispose(camera);
                }                
            }

            this.pass = null;
            this.highlights = null;
            this.blurX = null;
            this.blurY = null;
            this.copyBack = null;
            this.imageProcessing = null;
            this.fxaa = null;
            this.finalMerge = null;
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
            serializationObject.customType = "DefaultRenderingPipeline";

            return serializationObject;
        }

        // Parse serialized pipeline
        public static Parse(source: any, scene: Scene, rootUrl: string): DefaultRenderingPipeline {
            return SerializationHelper.Parse(() => new DefaultRenderingPipeline(source._name, source._name._hdr, scene), source, scene, rootUrl);
        }
    }
}
