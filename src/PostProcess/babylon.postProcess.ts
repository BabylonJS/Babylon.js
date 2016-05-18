module BABYLON {
    export class PostProcess {
        public width = -1;
        public height = -1;
        public renderTargetSamplingMode: number;
        public clearColor: Color4;

        /*
            Enable Pixel Perfect mode where texture is not scaled to be power of 2.
            Can only be used on a single postprocess or on the last one of a chain.
        */ 
        public enablePixelPerfectMode = false;

        private _camera: Camera;
        private _scene: Scene;
        private _engine: Engine;
        private _renderRatio: number|any;
        private _reusable = false;
        private _textureType: number;
        public _textures = new SmartArray<WebGLTexture>(2);
        public _currentRenderTextureInd = 0;
        private _effect: Effect;
        private _samplers: string[];
        private _fragmentUrl: string;
        private _parameters: string[];
        private _scaleRatio = new Vector2(1, 1);

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

        constructor(public name: string, fragmentUrl: string, parameters: string[], samplers: string[], ratio: number|any, camera: Camera, samplingMode: number = Texture.NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean, defines?: string, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();
            }
            else {
                this._engine = engine;
            }

            this._renderRatio = ratio;
            this.renderTargetSamplingMode = samplingMode ? samplingMode : Texture.NEAREST_SAMPLINGMODE;
            this._reusable = reusable || false;
            this._textureType = textureType;

            this._samplers = samplers || [];
            this._samplers.push("textureSampler");

            this._fragmentUrl = fragmentUrl;
            this._parameters = parameters || [];

            this._parameters.push("scale");

            this.updateEffect(defines);
        }
        
        public updateEffect(defines?: string) {
            this._effect = this._engine.createEffect({ vertex: "postprocess", fragment: this._fragmentUrl },
                ["position"],
                this._parameters,
                this._samplers, defines !== undefined ? defines : "");
        }

        public isReusable(): boolean {
            return this._reusable;
        }
        
        /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
        public markTextureDirty() : void{
            this.width = -1;
        }

        public activate(camera: Camera, sourceTexture?: WebGLTexture): void {
            camera = camera || this._camera;

            var scene = camera.getScene();
            var maxSize = camera.getEngine().getCaps().maxTextureSize;

            var requiredWidth = ((sourceTexture ? sourceTexture._width : this._engine.getRenderingCanvas().width) * this._renderRatio) | 0;
            var requiredHeight = ((sourceTexture ? sourceTexture._height : this._engine.getRenderingCanvas().height) * this._renderRatio) | 0;

            var desiredWidth = this._renderRatio.width || requiredWidth;
            var desiredHeight = this._renderRatio.height || requiredHeight;

            if (this.renderTargetSamplingMode !== Texture.NEAREST_SAMPLINGMODE) {
                if (!this._renderRatio.width) {
                    desiredWidth = Tools.GetExponentOfTwo(desiredWidth, maxSize);
                }

                if (!this._renderRatio.height) {
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
                this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === 0, samplingMode: this.renderTargetSamplingMode, type: this._textureType }));

                if (this._reusable) {
                    this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === 0, samplingMode: this.renderTargetSamplingMode, type: this._textureType }));
                }

                this.onSizeChangedObservable.notifyObservers(this);
            }

            if (this.enablePixelPerfectMode) {
                this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
                this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd], 0, requiredWidth, requiredHeight);
            }
            else {
                this._scaleRatio.copyFromFloats(1, 1);
                this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd]);
            }

            this.onActivateObservable.notifyObservers(camera);

            // Clear
            if (this.clearColor) {
                this._engine.clear(this.clearColor, true, true);
            } else {
                this._engine.clear(scene.clearColor, scene.autoClear || scene.forceWireframe, true);
            }

            if (this._reusable) {
                this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
            }
        }

        public get isSupported(): boolean {
            return this._effect.isSupported;
        }

        public apply(): Effect {
            // Check
            if (!this._effect.isReady())
                return null;

            // States
            this._engine.enableEffect(this._effect);
            this._engine.setState(false);
            this._engine.setAlphaMode(Engine.ALPHA_DISABLE);
            this._engine.setDepthBuffer(false);
            this._engine.setDepthWrite(false);

            // Texture
            this._effect._bindTexture("textureSampler", this._textures.data[this._currentRenderTextureInd]);

            // Parameters
            this._effect.setVector2("scale", this._scaleRatio);
            this.onApplyObservable.notifyObservers(this._effect);

            return this._effect;
        }

        public dispose(camera?: Camera): void {
            camera = camera || this._camera;

            if (this._textures.length > 0) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._engine._releaseTexture(this._textures.data[i]);
                }
                this._textures.reset();
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