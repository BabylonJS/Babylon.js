﻿module BABYLON {
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

        public samples = 1;

        private _camera: Camera;
        private _scene: Scene;
        private _engine: Engine;
        private _options: number | PostProcessOptions;
        private _reusable = false;
        private _textureType: number;
        public _textures = new SmartArray<WebGLTexture>(2);
        public _currentRenderTextureInd = 0;
        private _effect: Effect;
        private _samplers: string[];
        private _fragmentUrl: string;
        private _vertexUrl: string;
        private _parameters: string[];
        private _scaleRatio = new Vector2(1, 1);
        protected _indexParameters: any;
        private _shareOutputWithPostProcess: PostProcess;
        
        // Events

        /**
        * An event triggered when the postprocess is activated.
        * @type {BABYLON.Observable}
        */
        public onActivateObservable = new Observable<Camera>();

        private _onActivateObserver: Observer<Camera>;
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

        private _onSizeChangedObserver: Observer<PostProcess>;
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

        private _onApplyObserver: Observer<Effect>;
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

        private _onBeforeRenderObserver: Observer<Effect>;
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

        private _onAfterRenderObserver: Observer<Effect>;
        public set onAfterRender(callback: (efect: Effect) => void) {
            if (this._onAfterRenderObserver) {
                this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            }
            this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
        }

        public get outputTexture(): WebGLTexture {
            return this._textures.data[this._currentRenderTextureInd];
        }      

        public getCamera(): Camera {
            return this._camera;
        }

        constructor(public name: string, fragmentUrl: string, parameters: string[], samplers: string[], options: number | PostProcessOptions, camera: Camera, samplingMode: number = Texture.NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean, defines?: string, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, vertexUrl: string = "postprocess", indexParameters?: any, blockCompilation = false) {
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();
            }
            else {
                this._engine = engine;
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

        public shareOutputWith(postProcess: PostProcess): PostProcess {
            this._disposeTextures();

            this._shareOutputWithPostProcess = postProcess;

            return this;
        }
        
        public updateEffect(defines?: string, uniforms?: string[], samplers?: string[], indexParameters?: any) {
            this._effect = this._engine.createEffect({ vertex: this._vertexUrl, fragment: this._fragmentUrl },
                ["position"],
                uniforms || this._parameters,
                samplers || this._samplers, 
                defines !== undefined ? defines : "",
                null,
                null,
                null,
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

        public activate(camera: Camera, sourceTexture?: WebGLTexture): void {
            if (!this._shareOutputWithPostProcess) {
                camera = camera || this._camera;

                var scene = camera.getScene();
                var maxSize = camera.getEngine().getCaps().maxTextureSize;

                var requiredWidth = ((sourceTexture ? sourceTexture._width : this._engine.getRenderingCanvas().width) * <number>this._options) | 0;
                var requiredHeight = ((sourceTexture ? sourceTexture._height : this._engine.getRenderingCanvas().height) * <number>this._options) | 0;

                var desiredWidth = (<PostProcessOptions>this._options).width || requiredWidth;
                var desiredHeight = (<PostProcessOptions>this._options).height || requiredHeight;

                if (this.renderTargetSamplingMode !== Texture.NEAREST_SAMPLINGMODE) {
                    if (!(<PostProcessOptions>this._options).width) {
                        desiredWidth = Tools.GetExponentOfTwo(desiredWidth, maxSize);
                    }

                    if (!(<PostProcessOptions>this._options).height) {
                        desiredHeight = Tools.GetExponentOfTwo(desiredHeight, maxSize);
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
                        generateDepthBuffer: camera._postProcesses.indexOf(this) === 0, 
                        generateStencilBuffer: camera._postProcesses.indexOf(this) === 0 && this._engine.isStencilEnable,
                        samplingMode: this.renderTargetSamplingMode, 
                        type: this._textureType 
                    };

                    this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));

                    if (this._reusable) {
                        this._textures.push(this._engine.createRenderTargetTexture(textureSize, textureOptions));
                    }

                    this.onSizeChangedObservable.notifyObservers(this);
                }

                this._textures.forEach(texture => {
                    if (texture.samples !== this.samples) {
                        this._engine.updateRenderTargetTextureSampleCount(texture, this.samples);
                    }
                });
            }

            var target = this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.outputTexture : this.outputTexture;

            if (this.enablePixelPerfectMode) {
                this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
                this._engine.bindFramebuffer(target, 0, requiredWidth, requiredHeight);
            }
            else {
                this._scaleRatio.copyFromFloats(1, 1);
                this._engine.bindFramebuffer(target);
            }

            this.onActivateObservable.notifyObservers(camera);

            // Clear
            if (this.autoClear && this.alphaMode === Engine.ALPHA_DISABLE) {
                if (this.clearColor) {
                    this._engine.clear(this.clearColor, true, true, true);
                } else {
                    this._engine.clear(scene.clearColor, scene.autoClear || scene.forceWireframe, true, true);
                }
            }

            if (this._reusable) {
                this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
            }

            // Alpha
            this._engine.setAlphaMode(this.alphaMode);
            if (this.alphaConstants) {
                this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
            }
        }

        public get isSupported(): boolean {
            return this._effect.isSupported;
        }
        
        public apply(): Effect {
            // Check
            if (!this._effect || !this._effect.isReady())
                return null;

            // States
            this._engine.enableEffect(this._effect);
            this._engine.setState(false);
            this._engine.setDepthBuffer(false);
            this._engine.setDepthWrite(false);

            // Texture            
            var source = this._shareOutputWithPostProcess ? this._shareOutputWithPostProcess.outputTexture : this.outputTexture;
            this._effect._bindTexture("textureSampler", source);

            // Parameters
            this._effect.setVector2("scale", this._scaleRatio);
            this.onApplyObservable.notifyObservers(this._effect);

            return this._effect;
        }

        private _disposeTextures() {
            if (this._shareOutputWithPostProcess) {
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