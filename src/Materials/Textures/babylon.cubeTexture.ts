module BABYLON {
    export class CubeTexture extends BaseTexture {
        public url: string;
        public coordinatesMode = Texture.CUBIC_MODE;

        /**
         * Gets or sets the center of the bounding box associated with the cube texture
         * It must define where the camera used to render the texture was set
         */
        public boundingBoxPosition = Vector3.Zero();

        private _boundingBoxSize: Vector3;

        /**
         * Gets or sets the size of the bounding box associated with the cube texture
         * When defined, the cubemap will switch to local mode
         * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
         * @example https://www.babylonjs-playground.com/#RNASML
         */
        public set boundingBoxSize(value: Vector3) {
            if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
                return;
            }
            this._boundingBoxSize = value;
            let scene = this.getScene();
            if (scene) {
                scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
            }
        }
        public get boundingBoxSize(): Vector3 {
            return this._boundingBoxSize;
        }


        @serialize("rotationY")
        protected _rotationY: number = 0;
        /**
         * Sets texture matrix rotation angle around Y axis in radians.
         */
        public set rotationY(value: number) {
            this._rotationY = value;
            this.setReflectionTextureMatrix(BABYLON.Matrix.RotationY(this._rotationY));
        }
        /**
         * Gets texture matrix rotation angle around Y axis radians.
         */
        public get rotationY(): number {
            return this._rotationY;
        }        

        private _noMipmap: boolean;
        private _files: string[];
        private _extensions: string[];
        private _textureMatrix: Matrix;
        private _format: number;
        private _prefiltered: boolean;

        public static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean) {
            let rootUrlKey = "";

            files.forEach(url => rootUrlKey += url);

            return new CubeTexture(rootUrlKey, scene, null, noMipmap, files);
        }

        public static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension: any = null) {
            return new CubeTexture(url, scene, null, false, null, null, null, undefined, true, forcedExtension);
        }

        constructor(rootUrl: string, scene: Scene, extensions: Nullable<string[]> = null, noMipmap: boolean = false, files: Nullable<string[]> = null,
            onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA, prefiltered = false, forcedExtension: any = null) {
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

            const lastDot = rootUrl.lastIndexOf(".");
            const extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");
            const isDDS = (extension === ".dds");

            if (!files) {
                if (!isDDS && !extensions) {
                    extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
                }

                files = [];

                if (extensions) {

                    for (var index = 0; index < extensions.length; index++) {
                        files.push(rootUrl + extensions[index]);
                    }
                }
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

            let scene = this.getScene();

            if (!scene) {
                return;
            }
            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                if (this._prefiltered) {
                    this._texture = scene.getEngine().createPrefilteredCubeTexture(this.url, scene, this.lodGenerationScale, this.lodGenerationOffset, undefined, undefined, this._format);
                }
                else {
                    this._texture = scene.getEngine().createCubeTexture(this.url, scene, this._files, this._noMipmap, undefined, undefined, this._format);
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
                var prefiltered:boolean = false;
                if (parsedTexture.prefiltered) {
                    prefiltered = parsedTexture.prefiltered;
                }
                return new CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions, false, null, null, null, undefined, prefiltered);
            }, parsedTexture, scene);

            // Local Cubemaps
            if (parsedTexture.boundingBoxPosition) {
                texture.boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
            }
            if (parsedTexture.boundingBoxSize) {
                texture.boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
            }

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
                let scene = this.getScene();

                if (!scene) {
                    return this;
                }
                return new CubeTexture(this.url, scene, this._extensions, this._noMipmap, this._files);
            }, this);
        }
    }
} 