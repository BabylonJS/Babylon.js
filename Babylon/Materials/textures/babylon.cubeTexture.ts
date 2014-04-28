module BABYLON {
    export class CubeTexture extends BaseTexture {
        public name: string;
        public url: string;
        public coordinatesMode = BABYLON.Texture.CUBIC_MODE;

        private _noMipmap: boolean;
        private _extensions: string[];
        private _textureMatrix: Matrix;

        constructor(rootUrl: string, scene: Scene, extensions: string[], noMipmap?: boolean) {
            super(scene);

            this.name = rootUrl;
            this.url = rootUrl;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;

            this._texture = this._getFromCache(rootUrl, noMipmap);

            if (!extensions) {
                extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
            }

            this._extensions = extensions;

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, extensions, noMipmap);
                } else {
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }

            this.isCube = true;

            this._textureMatrix = BABYLON.Matrix.Identity();
        }

        // Methods
        public delayLoad(): void {
            if (this.delayLoadState != BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                this._texture = this.getScene().getEngine().createCubeTexture(this.url, this.getScene(), this._extensions);
            }
        }

        public _computeReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }
    }
} 