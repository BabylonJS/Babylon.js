module BABYLON {
    /**
     * Class for creating a cube texture
     */
    export class CubeTexture extends BaseTexture {
        /**
         * The url of the texture
         */
        public url: string;

        /**
         * Gets or sets the center of the bounding box associated with the cube texture.
         * It must define where the camera used to render the texture was set
         * @see http://doc.babylonjs.com/how_to/reflect#using-local-cubemap-mode
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
        /**
         * Returns the bounding box size
         * @see http://doc.babylonjs.com/how_to/reflect#using-local-cubemap-mode
         */
        public get boundingBoxSize(): Vector3 {
            return this._boundingBoxSize;
        }

        protected _rotationY: number = 0;

        /**
         * Sets texture matrix rotation angle around Y axis in radians.
         */
        @serialize("rotationY")
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
        private _createPolynomials: boolean;

        /** @hidden */
        public readonly _prefiltered: boolean = false;

        /**
         * Creates a cube texture from an array of image urls
         * @param files defines an array of image urls
         * @param scene defines the hosting scene
         * @param noMipmap specifies if mip maps are not used
         * @returns a cube texture
         */
        public static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean): CubeTexture {
            let rootUrlKey = "";

            files.forEach((url) => rootUrlKey += url);

            return new CubeTexture(rootUrlKey, scene, null, noMipmap, files);
        }

        /**
         * Creates and return a texture created from prefilterd data by tools like IBL Baker or Lys.
         * @param url defines the url of the prefiltered texture
         * @param scene defines the scene the texture is attached to
         * @param forcedExtension defines the extension of the file if different from the url
         * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
         * @return the prefiltered texture
         */
        public static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension: any = null, createPolynomials: boolean = true) {
            return new CubeTexture(url, scene, null, false, null, null, null, undefined, true, forcedExtension, createPolynomials);
        }

        /**
         * Creates a cube texture to use with reflection for instance. It can be based upon dds or six images as well
         * as prefiltered data.
         * @param rootUrl defines the url of the texture or the root name of the six images
         * @param scene defines the scene the texture is attached to
         * @param extensions defines the suffixes add to the picture name in case six images are in use like _px.jpg...
         * @param noMipmap defines if mipmaps should be created or not
         * @param files defines the six files to load for the different faces
         * @param onLoad defines a callback triggered at the end of the file load if no errors occured
         * @param onError defines a callback triggered in case of error during load
         * @param format defines the internal format to use for the texture once loaded
         * @param prefiltered defines whether or not the texture is created from prefiltered data
         * @param forcedExtension defines the extensions to use (force a special type of file to load) in case it is different from the file name
         * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         * @return the cube texture
         */
        constructor(rootUrl: string, scene: Scene, extensions: Nullable<string[]> = null, noMipmap: boolean = false, files: Nullable<string[]> = null,
            onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Engine.TEXTUREFORMAT_RGBA, prefiltered = false,
            forcedExtension: any = null, createPolynomials: boolean = false,
            lodScale: number = 0.8, lodOffset: number = 0) {
            super(scene);

            this.name = rootUrl;
            this.url = rootUrl;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            this._format = format;
            this.isCube = true;
            this._textureMatrix = Matrix.Identity();
            this._createPolynomials = createPolynomials;
            this.coordinatesMode = Texture.CUBIC_MODE;

            if (!rootUrl && !files) {
                return;
            }

            const lastDot = rootUrl.lastIndexOf(".");
            const extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");
            const isDDS = (extension === ".dds");
            const isEnv = (extension === ".env");

            if (isEnv) {
                this.gammaSpace = false;
                this._prefiltered = false;
            }
            else {
                this._prefiltered = prefiltered;

                if (prefiltered) {
                    this.gammaSpace = false;
                }
            }

            this._texture = this._getFromCache(rootUrl, noMipmap);

            if (!files) {
                if (!isEnv && !isDDS && !extensions) {
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
                        this._texture = scene.getEngine().createPrefilteredCubeTexture(rootUrl, scene, lodScale, lodOffset, onLoad, onError, format, forcedExtension, this._createPolynomials);
                    }
                    else {
                        this._texture = scene.getEngine().createCubeTexture(rootUrl, scene, files, noMipmap, onLoad, onError, this._format, forcedExtension, false, lodScale, lodOffset);
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

        /**
         * Delays loading of the cube texture
         */
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
                    this._texture = scene.getEngine().createPrefilteredCubeTexture(this.url, scene, this.lodGenerationScale, this.lodGenerationOffset, undefined, undefined, this._format, undefined, this._createPolynomials);
                }
                else {
                    this._texture = scene.getEngine().createCubeTexture(this.url, scene, this._files, this._noMipmap, undefined, undefined, this._format);
                }
            }
        }

        /**
         * Returns the reflection texture matrix
         * @returns the reflection texture matrix
         */
        public getReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }

        /**
         * Sets the reflection texture matrix
         * @param value Reflection texture matrix
         */
        public setReflectionTextureMatrix(value: Matrix): void {
            this._textureMatrix = value;
        }

        /**
         * Parses text to create a cube texture
         * @param parsedTexture define the serialized text to read from
         * @param scene defines the hosting scene
         * @param rootUrl defines the root url of the cube texture
         * @returns a cube texture
         */
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture {
            var texture = SerializationHelper.Parse(() => {
                var prefiltered: boolean = false;
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

        /**
         * Makes a clone, or deep copy, of the cube texture
         * @returns a new cube texture
         */
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
