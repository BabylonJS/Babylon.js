module BABYLON {
    export interface IMultiRenderTargetOptions {
        generateMipMaps: boolean,
        types: number[],
        samplingModes: number[],
        generateDepthBuffer: boolean,
        generateStencilBuffer: boolean,
        generateDepthTexture: boolean,
        textureCount: number
    };
    export class MultiRenderTarget extends RenderTargetTexture {

        private _internalTextures: InternalTexture[];
        private _textures: Texture[];
        private _count: number;

        public get isSupported(): boolean {
            var engine = this.getScene().getEngine();
            return engine.webGLVersion > 1 || engine.getCaps().drawBuffersExtension;
        }

        private _multiRenderTargetOptions: IMultiRenderTargetOptions;

        public get textures(): Texture[] {
            return this._textures;
        }

        public get depthTexture(): Texture {
            return this._textures[this._textures.length - 1];
        }

        constructor(name: string, size: any, count: number, scene: Scene, options?: any) {
            options = options || {};

            var generateMipMaps = options.generateMipMaps ? options.generateMipMaps : false;
            var generateDepthTexture = options.generateDepthTexture ? options.generateDepthTexture : false;
            var doNotChangeAspectRatio = options.doNotChangeAspectRatio === undefined ? true : options.doNotChangeAspectRatio;

            super(name, size, scene, generateMipMaps, doNotChangeAspectRatio);

            if (!this.isSupported) {
                this.dispose();
                return;
            }

            var types = [];
            var samplingModes = [];

            for (var i = 0; i < count; i++) {
                if (options.types && options.types[i]) {
                    types.push(options.types[i]);
                } else {
                    types.push(Engine.TEXTURETYPE_FLOAT);
                }

                if (options.samplingModes && options.samplingModes[i]) {
                    samplingModes.push(options.samplingModes[i]);
                } else {
                    samplingModes.push(Texture.BILINEAR_SAMPLINGMODE);
                }
            }

            var generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            var generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;

            this._count = count;
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

            this._internalTextures = scene.getEngine().createMultipleRenderTarget(size, this._multiRenderTargetOptions);

            this._createInternalTextures();
        }

        private _createInternalTextures(): void {
            this._textures = [];
            for (var i = 0; i < this._internalTextures.length; i++) {
                var texture = new BABYLON.Texture(null, this.getScene());
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
            
            for (var i = 0 ; i < this._internalTextures.length; i++) {
                this._samples = this.getScene().getEngine().updateRenderTargetTextureSampleCount(this._internalTextures[i], value);
            }
        }

        public resize(size: any) {
            this.releaseInternalTextures();
            this._internalTextures = this.getScene().getEngine().createMultipleRenderTarget(size, this._multiRenderTargetOptions);
            this._createInternalTextures();
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