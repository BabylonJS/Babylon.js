module BABYLON {
    export class MultiRenderTarget extends RenderTargetTexture {

        private _webGLTextures: WebGLTexture[];
        private _textures: Texture[];
        private _count: number;

        protected _renderTargetOptions: {
            generateMipMaps: boolean,
            types: number[],
            samplingModes: number[],
            generateDepthBuffer: boolean,
            generateStencilBuffer: boolean,
            generateDepthTexture: boolean,
            textureCount: number
        };

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
                    samplingModes.push(Texture.TRILINEAR_SAMPLINGMODE);
                }
            }

            var generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
            var generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;

            this._count = count;
            this._size = size;
            this._renderTargetOptions = {
                samplingModes: samplingModes,
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: generateDepthBuffer,
                generateStencilBuffer: generateStencilBuffer,
                generateDepthTexture: generateDepthTexture,
                types: types,
                textureCount: count
            };

            this._webGLTextures = scene.getEngine().createMultipleRenderTarget(size, this._renderTargetOptions);

            this._createInternalTextures();
        }

        private _createInternalTextures(): void {
            this._textures = [];
            for (var i = 0; i < this._webGLTextures.length; i++) {
                var texture = new BABYLON.Texture(null, this.getScene());
                texture._texture = this._webGLTextures[i];
                this._textures.push(texture);
            }

            // Keeps references to frame buffer and stencil/depth buffer
            this._texture = this._webGLTextures[0];
        }

        public get samples(): number {
            return this._samples;
        }

        public set samples(value: number) {
            if (this._samples === value) {
                return;
            }
            
            for (var i = 0 ; i < this._webGLTextures.length; i++) {
                this._samples = this.getScene().getEngine().updateRenderTargetTextureSampleCount(this._webGLTextures[i], value);
            }
        }

        public resize(size: any) {
            this.releaseInternalTextures();
            this._webGLTextures = this.getScene().getEngine().createMultipleRenderTarget(size, this._renderTargetOptions);
            this._createInternalTextures();
        }

        public dispose(): void {
            this.releaseInternalTextures();

            super.dispose();
        }

        public releaseInternalTextures(): void {
            for (var i = this._webGLTextures.length - 1; i >= 0; i--) {
                if (this._webGLTextures[i] !== undefined) {
                    this.getScene().getEngine().releaseInternalTexture(this._webGLTextures[i]);
                    this._webGLTextures.splice(i, 1);
                }
            }
        }
    }
}