module BABYLON {
    export interface IMultiRenderTargetOptions {
        generateMipMaps?: boolean,
        types?: number[],
        samplingModes?: number[],
        generateDepthBuffer?: boolean,
        generateStencilBuffer?: boolean,
        generateDepthTexture?: boolean,
        textureCount?: number,
        doNotChangeAspectRatio?: boolean,
        defaultType?: number
    };
    export class MultiRenderTarget extends RenderTargetTexture {

        private _internalTextures: InternalTexture[];
        private _textures: Texture[];

        public get isSupported(): boolean {
            return this._engine.webGLVersion > 1 || this._engine.getCaps().drawBuffersExtension;
        }

        private _multiRenderTargetOptions: IMultiRenderTargetOptions;

        public get textures(): Texture[] {
            return this._textures;
        }

        public get depthTexture(): Texture {
            return this._textures[this._textures.length - 1];
        }

        public set wrapU(wrap: number) {
            if (this._textures) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._textures[i].wrapU = wrap;
                }
            }
        }

        public set wrapV(wrap: number) {
            if (this._textures) {
                for (var i = 0; i < this._textures.length; i++) {
                    this._textures[i].wrapV = wrap;
                }
            }
        }

        constructor(name: string, size: any, count: number, scene: Scene, options?: IMultiRenderTargetOptions) {
            var generateMipMaps = options && options.generateMipMaps ? options.generateMipMaps : false;
            var generateDepthTexture = options && options.generateDepthTexture ? options.generateDepthTexture : false;
            var doNotChangeAspectRatio = !options || options.doNotChangeAspectRatio === undefined ? true : options.doNotChangeAspectRatio;

            super(name, size, scene, generateMipMaps, doNotChangeAspectRatio);

            this._engine = scene.getEngine();

            if (!this.isSupported) {
                this.dispose();
                return;
            }

            var types = [];
            var samplingModes = [];

            for (var i = 0; i < count; i++) {
                if (options && options.types && options.types[i] !== undefined) {
                    types.push(options.types[i]);
                } else {
                    types.push(options && options.defaultType ? options.defaultType : Engine.TEXTURETYPE_UNSIGNED_INT);
                }

                if (options && options.samplingModes && options.samplingModes[i] !== undefined) {
                    samplingModes.push(options.samplingModes[i]);
                } else {
                    samplingModes.push(Texture.BILINEAR_SAMPLINGMODE);
                }
            }

            var generateDepthBuffer = !options || options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            var generateStencilBuffer = !options || options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;

            this._size = size;
            this._multiRenderTargetOptions = {
                samplingModes: samplingModes,
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer,
                generateDepthTexture: generateDepthTexture,
                types: types,
                textureCount: count
            };

            this._createInternalTextures();
            this._createTextures();
        }

        public _rebuild(): void {
            this.releaseInternalTextures();
            this._createInternalTextures();

            for (var i = 0; i < this._internalTextures.length; i++) {
                var texture = this._textures[i];
                texture._texture = this._internalTextures[i];
            }

            // Keeps references to frame buffer and stencil/depth buffer
            this._texture = this._internalTextures[0];
        }

        private _createInternalTextures(): void {
            this._internalTextures = this._engine.createMultipleRenderTarget(this._size, this._multiRenderTargetOptions);
        }

        private _createTextures(): void {
            this._textures = [];
            for (var i = 0; i < this._internalTextures.length; i++) {
                var texture = new Texture(null, this.getScene());
                texture._texture = this._internalTextures[i];
                this._textures.push(texture);
            }

            // Keeps references to frame buffer and stencil/depth buffer
            this._texture = this._internalTextures[0];
        }

        public get samples(): number {
            return this._samples;
        }

        public set samples(value: number) {
            if (this._samples === value) {
                return;
            }

            this._samples = this._engine.updateMultipleRenderTargetTextureSampleCount(this._internalTextures, value);
        }

        public resize(size: any) {
            this.releaseInternalTextures();
            this._internalTextures = this._engine.createMultipleRenderTarget(size, this._multiRenderTargetOptions);
            this._createInternalTextures();
        }

        protected unbindFrameBuffer(engine: Engine, faceIndex: number): void {
            engine.unBindMultiColorAttachmentFramebuffer(this._internalTextures, this.isCube, () => {
                this.onAfterRenderObservable.notifyObservers(faceIndex);
            });
        }

        public dispose(): void {
            this.releaseInternalTextures();

            super.dispose();
        }

        public releaseInternalTextures(): void {
            if (!this._internalTextures) {
                return;
            }

            for (var i = this._internalTextures.length - 1; i >= 0; i--) {
                if (this._internalTextures[i] !== undefined) {
                    this._internalTextures[i].dispose();
                    this._internalTextures.splice(i, 1);
                }
            }
        }
    }
}
