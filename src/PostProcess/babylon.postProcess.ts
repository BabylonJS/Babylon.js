module BABYLON {
    export type PostProcessOptions = { width: number, height: number };

    export class PostProcess
    {
        public width = -1;
        public height = -1;
        public renderTargetSamplingMode: number;
        public clearColor: Color4;
        public autoClear = true;
        public alphaMode = Engine.ALPHA_DISABLE;
        public alphaConstants: Color4;       

        /*
            Enable Pixel Perfect mode where texture is not scaled to be power of 2.
            Can only be used on a single postprocess or on the last one of a chain.
        */ 
        public enablePixelPerfectMode = false;

        public scaleMode = Engine.SCALEMODE_FLOOR;
        public alwaysForcePOT = false;
        public samples = 1;
        public adaptScaleToCurrentViewport = false;

        private _camera: Camera;
        private _scene: Scene;
        private _engine: Engine;
        private _options: number | PostProcessOptions;
        private _reusable = false;
        private _textureType: number;
        public _textures = new SmartArray<InternalTexture>(2);
        public _currentRenderTextureInd = 0;
        private _effect: Effect;
        private _samplers: string[];
        private _fragmentUrl: string;
        private _vertexUrl: string;
        private _parameters: string[];
        private _scaleRatio = new Vector2(1, 1);
        protected _indexParameters: any;
        private _shareOutputWithPostProcess: PostProcess;
        private _texelSize = Vector2.Zero();
        private _forcedOutputTexture: InternalTexture;
       
        // Events

        /**
        * An event triggered when the postprocess is activated.
        * @type {BABYLON.Observable}
        */
        public onActivateObservable = new Observable<Camera>();

        private _onActivateObserver: Nullable<Observer<Camera>>;
        public set onActivate(callback: (camera: Camera) => void) {
            if (this._onActivateObserver) {
                this.onActivateObservable.remove(this._onActivateObserver);
            }
            this._onActivateObserver = this.onActivateObservable.add(callback);
        }

        /**
        * An event triggered when the postprocess changes its size.
        * @type {BABYLON.Observable}
        */
        public onSizeChangedObservable = new Observable<PostProcess>();

        private _onSizeChangedObserver: Nullable<Observer<PostProcess>>;
        public set onSizeChanged(callback: (postProcess: PostProcess) => void) {
            if (this._onSizeChangedObserver) {
                this.onSizeChangedObservable.remove(this._onSizeChangedObserver);
            }
            this._onSizeChangedObserver = this.onSizeChangedObservable.add(callback);
        }

        /**
        * An event triggered when the postprocess applies its effect.
        * @type {BABYLON.Observable}
        */
        public onApplyObservable = new Observable<Effect>();

        private _onApplyObserver: Nullable<Observer<Effect>>;
        public set onApply(callback: (effect: Effect) => void) {
            if (this._onApplyObserver) {
                this.onApplyObservable.remove(this._onApplyObserver);
            }
            this._onApplyObserver = this.onApplyObservable.add(callback);
        }

        /**
        * An event triggered before rendering the postprocess
        * @type {BABYLON.Observable}
        */
        public onBeforeRenderObservable = new Observable<Effect>();

        private _onBeforeRenderObserver: Nullable<Observer<Effect>>;
        public set onBeforeRender(callback: (effect: Effect) => void) {
            if (this._onBeforeRenderObserver) {
                this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            }
            this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
        }

        /**
        * An event triggered after rendering the postprocess
        * @type {BABYLON.Observable}
        */
        public onAfterRenderObservable = new Observable<Effect>();

        private _onAfterRenderObserver: Nullable<Observer<Effect>>;
        public set onAfterRender(callback: (efect: Effect) => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

        public get outputTexture(): InternalTexture {
            return this._textures.data[this._currentRenderTextureInd];
        }   

        public set outputTexture(value: InternalTexture) {
            this._forcedOutputTexture = value;
        }   

        public getCamera(): Camera {
            return this._camera;
        }

        public get texelSize(): Vector2 {
            if (this._shareOutputWithPostProcess) {
                return this._shareOutputWithPostProcess.texelSize;
            }

            if (this._forcedOutputTexture) {
                this._texelSize.copyFromFloats(1.0 / this._forcedOutputTexture.width, 1.0 / this._forcedOutputTexture.height);
            }

            return this._texelSize;
        }

        constructor(public name: string, fragmentUrl: string, parameters: Nullable<string[]>, samplers: Nullable<string[]>, options: number | PostProcessOptions, camera: Nullable<Camera>, 
                    samplingMode: number = Texture.NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean, defines: Nullable<string> = null, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, vertexUrl: string = "postprocess", indexParameters?: any, blockCompilation = false) {
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();

                this._scene.postProcesses.push(this);
            }
            else if (engine) {
                this._engine = engine;
                this._engine.postProcesses.push(this);
            }

            this._options = options;
            this.renderTargetSamplingMode = samplingMode ? samplingMode : Texture.NEAREST_SAMPLINGMODE;
            this._reusable = reusable || false;
            this._textureType = textureType;

            this._samplers = samplers || [];
            this._samplers.push("textureSampler");

            this._fragmentUrl = fragmentUrl;
            this._vertexUrl = vertexUrl;
            this._parameters = parameters || [];

            this._parameters.push("scale");

            this._indexParameters = indexParameters;

            if (!blockCompilation) {
                this.updateEffect(defines);
            }
        }    

        public getEngine(): Engine {
            return this._engine;
        }        

        public getEffect(): Effect {
            return this._effect;
        }

        public shareOutputWith(postProcess: PostProcess): PostProcess {
            this._disposeTextures();

            this._shareOutputWithPostProcess = postProcess;

            return this;
        }
        
        public updateEffect(defines: Nullable<string> = null, uniforms: Nullable<string[]> = null, samplers: Nullable<string[]> = null, indexParameters?: any,
                            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void) {
            this._effect = this._engine.createEffect({ vertex: this._vertexUrl, fragment: this._fragmentUrl },
                ["position"],
                uniforms || this._parameters,
                samplers || this._samplers, 
                defines !== null ? defines : "",
                undefined,
                onCompiled,
                onError,
                indexParameters || this._indexParameters
                );
         }

        public isReusable(): boolean {
            return this._reusable;
        }
        
        /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
        public markTextureDirty() : void{
            this.width = -1;
        }

        public activate(camera: Camera, sourceTexture: Nullable<InternalTexture> = null, forceDepthStencil?: boolean): void {            
            camera = camera || this._camera;
            
            var scene = camera.getScene();
            var engine = scene.getEngine();
            var maxSize = engine.getCaps().maxTextureSize;

            var requiredWidth = ((sourceTexture ? sourceTexture.width : this._engine.getRenderWidth(true)) * <number>this._options) | 0;
            var requiredHeight = ((sourceTexture ? sourceTexture.height : this._engine.getRenderHeight(true)) * <number>this._options) | 0;

            var desiredWidth = ((<PostProcessOptions>this._options).width || requiredWidth);
            var desiredHeight = (<PostProcessOptions>this._options).height || requiredHeight;

            if (!this._shareOutputWithPostProcess && !this._forcedOutputTexture) {

                if (this.adaptScaleToCurrentViewport) {
                    let currentViewport = engine.currentViewport;

                    if (currentViewport) {
                        desiredWidth *= currentViewport.width;
                        desiredHeight *= currentViewport.height;
                    }
                }

                if (this.renderTargetSamplingMode === Texture.TRILINEAR_SAMPLINGMODE || this.alwaysForcePOT) {
                    if (!(<PostProcessOptions>this._options).width) {
                        desiredWidth = engine.needPOTTextures ? Tools.GetExponentOfTwo(desiredWidth, maxSize, this.scaleMode) : desiredWidth;
                    }

                    if (!(<PostProcessOptions>this._options).height) {
                        desiredHeight = engine.needPOTTextures ? Tools.GetExponentOfTwo(desiredHeight, maxSize, this.scaleMode) : desiredHeight;
                    }
                }

                if (this.width !== desiredWidth || this.height !== desiredHeight) {
                    if (this._textures.length > 0) {
                        for (var i = 0; i < this._textures.length; i++) {
                            this._engine._releaseTexture(this._textures.data[i]);
                        }
                        this._textures.reset();
                    }         
                    this.width = desiredWidth;
                    this.height = desiredHeight;

                    let textureSize = { width: this.width, height: this.height };
                    let textureOptions = { 
                        generateMipMaps: false, 
                        generateDepthBuffer: forceDepthStencil || camera._postProcesses.indexOf(this) === 0, 
                        generateStencilBuffer: (forceDepthStencil || camera._postProcesses.indexOf(this) === 0) && this._engine.isStencilEnable,
                        samplingMode: this.renderTargetSamplingMode, 
                        type: this._textureType 
                    };

                    this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));

                    if (this._reusable) {
                        this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));
                    }
                    
                    this._texelSize.copyFromFloats(1.0 / this.width, 1.0 / this.height);

                    this.onSizeChangedObservable.notifyObservers(this);
                }

                this._textures.forEach(texture => {
                    if (texture.samples !== this.samples) {
                        this._engine.updateRenderTargetTextureSampleCount(texture, this.samples);
                    }
                });
            }

            var target: InternalTexture;
                        
            if (this._shareOutputWithPostProcess) {
                target = this._shareOutputWithPostProcess.outputTexture;
            } else if (this._forcedOutputTexture) {
                target = this._forcedOutputTexture;

                this.width = this._forcedOutputTexture.width;
                this.height = this._forcedOutputTexture.height;
            } else {
                target = this.outputTexture;
            }

            if (this.enablePixelPerfectMode) {
                this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
                this._engine.bindFramebuffer(target, 0, requiredWidth, requiredHeight, true);
            }
            else {
                this._scaleRatio.copyFromFloats(1, 1);
                this._engine.bindFramebuffer(target, 0, undefined, undefined, true);
            }

            this.onActivateObservable.notifyObservers(camera);

            // Clear
            if (this.autoClear && this.alphaMode === Engine.ALPHA_DISABLE) {
                this._engine.clear(this.clearColor ? this.clearColor : scene.clearColor, true, true, true);
            }

            if (this._reusable) {
                this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
            }
        }

        public get isSupported(): boolean {
            return this._effect.isSupported;
        }

        public get aspectRatio(): number {
            if (this._shareOutputWithPostProcess) {
                return this._shareOutputWithPostProcess.aspectRatio;
            }

            if (this._forcedOutputTexture) {
                return this._forcedOutputTexture.width / this._forcedOutputTexture.height;
            }
            return this.width / this.height;
        }
        
        public apply(): Nullable<Effect> {
            // Check
            if (!this._effect || !this._effect.isReady())
                return null;

            // States
            this._engine.enableEffect(this._effect);
            this._engine.setState(false);
            this._engine.setDepthBuffer(false);
            this._engine.setDepthWrite(false);

            // Alpha
            this._engine.setAlphaMode(this.alphaMode);
            if (this.alphaConstants) {
                this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
            }            

            // Texture            
            var source: InternalTexture;                        
            if (this._shareOutputWithPostProcess) {
                source = this._shareOutputWithPostProcess.outputTexture;
            } else if (this._forcedOutputTexture) {
                source = this._forcedOutputTexture;
            } else {
                source = this.outputTexture;
            }            
            this._effect._bindTexture("textureSampler", source);

            // Parameters
            this._effect.setVector2("scale", this._scaleRatio);
            this.onApplyObservable.notifyObservers(this._effect);

            return this._effect;
        }

        private _disposeTextures() {
            if (this._shareOutputWithPostProcess || this._forcedOutputTexture) {
                return;
            }

            if (this._textures.length > 0) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._engine._releaseTexture(this._textures.data[i]);
                }
            }
            this._textures.dispose();
        }

        public dispose(camera?: Camera): void {
            camera = camera || this._camera;            

            this._disposeTextures();

            if (this._scene) {
                let index = this._scene.postProcesses.indexOf(this);
                if (index !== -1) {
                    this._scene.postProcesses.splice(index, 1);
                }                
            } else {
                let index = this._engine.postProcesses.indexOf(this);
                if (index !== -1) {
                    this._engine.postProcesses.splice(index, 1);
                }         
            }

            if (!camera) {
                return;
            }
            camera.detachPostProcess(this);

            var index = camera._postProcesses.indexOf(this);
            if (index === 0 && camera._postProcesses.length > 0) {
                this._camera._postProcesses[0].markTextureDirty(); 
            }

            this.onActivateObservable.clear();
            this.onAfterRenderObservable.clear();
            this.onApplyObservable.clear();
            this.onBeforeRenderObservable.clear();
            this.onSizeChangedObservable.clear();
        }          
    }
}
