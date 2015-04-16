﻿module BABYLON {
    export class PostProcess {
        public onApply: (Effect) => void;
        public onBeforeRender: (Effect) => void;
        public onSizeChanged: () => void;
        public onActivate: (Camera) => void;
        public width = -1;
        public height = -1;
        public renderTargetSamplingMode: number;
        public clearColor: Color4;

        private _camera: Camera;
        private _scene: Scene;
        private _engine: Engine;
        private _renderRatio: number;
        private _reusable = false;
        public _textures = new SmartArray<WebGLTexture>(2);
        public _currentRenderTextureInd = 0;
        private _effect: Effect;

        constructor(public name: string, fragmentUrl: string, parameters: string[], samplers: string[], ratio: number, camera: Camera, samplingMode: number = Texture.NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean, defines?: string) {
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

            samplers = samplers || [];
            samplers.push("textureSampler");

            this._effect = this._engine.createEffect({ vertex: "postprocess", fragment: fragmentUrl },
                ["position"],
                parameters || [],
                samplers, defines !== undefined ? defines : "");
        }

        public isReusable(): boolean {
            return this._reusable;
        }

        public activate(camera: Camera, sourceTexture?: WebGLTexture): void {
            camera = camera || this._camera;

            var scene = camera.getScene();
            var maxSize = camera.getEngine().getCaps().maxTextureSize;
            var desiredWidth = ((sourceTexture ? sourceTexture._width : this._engine.getRenderingCanvas().width) * this._renderRatio) | 0;
            var desiredHeight = ((sourceTexture ? sourceTexture._height : this._engine.getRenderingCanvas().height) * this._renderRatio) | 0;

            desiredWidth = Tools.GetExponantOfTwo(desiredWidth, maxSize);
            desiredHeight = Tools.GetExponantOfTwo(desiredHeight, maxSize);

            if (this.width !== desiredWidth || this.height !== desiredHeight) {
                if (this._textures.length > 0) {
                    for (var i = 0; i < this._textures.length; i++) {
                        this._engine._releaseTexture(this._textures.data[i]);
                    }
                    this._textures.reset();
                }
                this.width = desiredWidth;
                this.height = desiredHeight;
                this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode }));

                if (this._reusable) {
                    this._textures.push(this._engine.createRenderTargetTexture({ width: this.width, height: this.height }, { generateMipMaps: false, generateDepthBuffer: camera._postProcesses.indexOf(this) === camera._postProcessesTakenIndices[0], samplingMode: this.renderTargetSamplingMode }));
                }

                if (this.onSizeChanged) {
                    this.onSizeChanged();
                }
            }

            this._engine.bindFramebuffer(this._textures.data[this._currentRenderTextureInd]);

            if (this.onActivate) {
                this.onActivate(camera);
            }

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
            if (this.onApply) {
                this.onApply(this._effect);
            }

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
            if (index === camera._postProcessesTakenIndices[0] && camera._postProcessesTakenIndices.length > 0) {
                this._camera._postProcesses[camera._postProcessesTakenIndices[0]].width = -1; // invalidate frameBuffer to hint the postprocess to create a depth buffer
            }
        }
    }
} 