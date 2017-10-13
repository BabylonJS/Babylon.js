module BABYLON {
    export class CubeTexture extends BaseTexture {
        public url: string;
        public coordinatesMode = Texture.CUBIC_MODE;

        private _noMipmap: boolean;
        private _files: string[];
        private _extensions: string[];
        private _textureMatrix: Matrix;
        private _format: number;
        private _prefiltered: boolean;

        public static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean) {
            return new CubeTexture("", scene, null, noMipmap, files);
        }

        public static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension: any = null) {
            return new CubeTexture(url, scene, null, false, null, null, null, undefined, true, forcedExtension);
        }

        constructor(rootUrl: string, scene: Scene, extensions?: string[], noMipmap?: boolean, files?: string[], onLoad: () => void = null, onError: (message?: string, exception?: any) => void = null, format: number = Engine.TEXTUREFORMAT_RGBA, prefiltered = false, forcedExtension: any = null) {
            super(scene);

            this.name = rootUrl;
            this.url = rootUrl;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            this._format = format;
            this._prefiltered = prefiltered;
            this.isCube = true;
            this._textureMatrix = Matrix.Identity();
            if (prefiltered) {
                this.gammaSpace = false;
            }

            if (!rootUrl && !files) {
                return;
            }

            this._texture = this._getFromCache(rootUrl, noMipmap);

            if (!files) {

                if (!extensions) {
                    extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
                }

                files = [];

                for (var index = 0; index < extensions.length; index++) {
                    files.push(rootUrl + extensions[index]);
                }

                this._extensions = extensions;
            }

            this._files = files;

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    if (prefiltered) {
                        this._texture = scene.getEngine().createPrefilteredCubeTexture(rootUrl, scene, this.lodGenerationScale, this.lodGenerationOffset, onLoad, onError, format, forcedExtension);
                    }
                    else {
                        this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, files, noMipmap, onLoad, onError, this._format, forcedExtension);
                    }
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                }
            } else if (onLoad) {
                if (this._texture.isReady) {
                    Tools.SetImmediate(() => onLoad());
                } else {
                    this._texture.onLoadedObservable.add(onLoad);
                }
            }
        }

        // Methods
        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                if (this._prefiltered) {
                    this._texture = this.getScene().getEngine().createPrefilteredCubeTexture(this.url, this.getScene(), this.lodGenerationScale, this.lodGenerationOffset, undefined, undefined, this._format);
                }
                else {
                    this._texture = this.getScene().getEngine().createCubeTexture(this.url, this.getScene(), this._files, this._noMipmap, undefined, undefined, this._format);
                }
            }
        }

        public getReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }

        public setReflectionTextureMatrix(value: Matrix): void {
            this._textureMatrix = value;
        }

        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture {
            var texture = SerializationHelper.Parse(() => {
                return new BABYLON.CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions);
            }, parsedTexture, scene);

            // Animations
            if (parsedTexture.animations) {
                for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    var parsedAnimation = parsedTexture.animations[animationIndex];

                    texture.animations.push(Animation.Parse(parsedAnimation));
                }
            }

            return texture;
        }

        public clone(): CubeTexture {
            return SerializationHelper.Clone(() => {
                return new CubeTexture(this.url, this.getScene(), this._extensions, this._noMipmap, this._files);
            }, this);
        }
    }
} 